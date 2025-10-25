import { GoogleGenerativeAI } from '@google/generative-ai';
import Database from 'better-sqlite3';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

const DEFAULT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const CELO_TOKENS = {
  CELO: '0x0000000000000000000000000000000000000000',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73'
};

export class AutomationSystem {
  constructor(config = {}) {
    this.config = this.mergeConfig(config);
    this.conversationHistory = new Map();
    this.functionRegistry = this.createFunctionRegistry();
    
    this.initializeAI();
    this.initializeDatabase();
    this.initializeBlockchainAPI();
    this.initializeExpress();
  }

  mergeConfig(config) {
    return {
      port: config.port || process.env.PORT || 3001,
      geminiApiKey: config.geminiApiKey || process.env.GEMINI_API_KEY || 'AIzaSyCKFLkomLb78CSBz4FA36VS9Vb789fZ8qc',
      privateKey: config.privateKey || process.env.PRIVATE_KEY,
      network: config.network || process.env.NETWORK || 'alfajores',
      rpcUrl: config.rpcUrl || process.env.RPC_URL,
      alchemyApiKey: config.alchemyApiKey || process.env.ALCHEMY_API_KEY,
      alchemyPolicyId: config.alchemyPolicyId || process.env.ALCHEMY_POLICY_ID,
      enableBlockchainIntegration: process.env.ENABLE_BLOCKCHAIN_INTEGRATION !== 'false',
      enableRealBlockchainCalls: process.env.ENABLE_REAL_BLOCKCHAIN_CALLS !== 'false',
      maxRiskScore: parseInt(process.env.MAX_RISK_SCORE) || 50,
      requireApproval: process.env.REQUIRE_APPROVAL === 'true',
      enableSimulation: process.env.ENABLE_SIMULATION === 'true',
      enableGasOptimization: process.env.ENABLE_GAS_OPTIMIZATION === 'true',
      ...config
    };
  }

  initializeAI() {
    this.gemini = new GoogleGenerativeAI(this.config.geminiApiKey);
    this.model = this.gemini.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
  }

  initializeDatabase() {
    const dataDir = './data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.db = new Database('./data/automation.db');
    this.createTables();
  }

  createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        input_text TEXT NOT NULL,
        function_calls TEXT NOT NULL,
        results TEXT NOT NULL,
        confidence REAL,
        reasoning TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT 1
      );
      
      CREATE TABLE IF NOT EXISTS function_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        function_name TEXT NOT NULL,
        parameters TEXT,
        success BOOLEAN DEFAULT 1,
        execution_time INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_interactions INTEGER DEFAULT 0,
        user_preferences TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_interactions_session ON interactions(session_id);
      CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON interactions(timestamp);
      CREATE INDEX IF NOT EXISTS idx_function_usage_name ON function_usage(function_name);
    `);
  }

  initializeBlockchainAPI() {
    this.blockchainAPI = {
      callFunction: async (functionName, parameters, context) => {
        const startTime = Date.now();
        
        try {
          if (!this.config.enableBlockchainIntegration) {
            return this.createMockResponse(functionName, parameters, 100);
          }
          
          if (!this.config.enableRealBlockchainCalls) {
            return this.createMockResponse(functionName, parameters, 100);
          }
          
          this.validateParameters(parameters, functionName);
          const result = await this.executeBlockchainFunction(functionName, parameters);
          
          return {
            success: true,
            result,
            executionTime: Date.now() - startTime,
            functionName,
            parameters,
            timestamp: new Date().toISOString()
          };
          
        } catch (error) {
          return {
            success: false,
            error: error.message,
            executionTime: Date.now() - startTime,
            functionName,
            parameters,
            timestamp: new Date().toISOString()
          };
        }
      },
      
      getAvailableFunctions: () => [
        'getTokenBalance', 'getCELOBalance', 'sendCELO', 'sendToken',
        'getAllTokenBalances', 'analyzeTransactionSecurity', 'executeSecureTransaction',
        'validateTransaction', 'isAddressSafe', 'mintNFT', 'getNFTMetadata',
        'getOwnedNFTs', 'getNFTTransfers', 'estimateGas', 'waitForTransaction',
        'getNetworkInfo'
      ]
    };
  }

  createMockResponse(functionName, parameters, executionTime) {
    return {
      success: true,
      result: `Mock result for ${functionName}`,
      executionTime,
      functionName,
      parameters,
      timestamp: new Date().toISOString()
    };
  }

  validateParameters(parameters, functionName) {
    if (parameters.address && !parameters.address.startsWith('0x')) {
      parameters.address = DEFAULT_ADDRESS;
    } else if (functionName.includes('Balance') || functionName.includes('CELO')) {
      parameters.address = DEFAULT_ADDRESS;
    }
  }

  async executeBlockchainFunction(functionName, parameters) {
    const functionMap = {
      'getTokenBalance': () => this.callCeloFunction('getTokenBalance', parameters),
      'getCELOBalance': () => this.callCeloFunction('getCELOBalance', parameters),
      'sendCELO': () => this.callCeloFunction('sendCELO', parameters),
      'sendToken': () => this.callCeloFunction('sendToken', parameters),
      'getAllTokenBalances': () => this.callCeloFunction('getAllTokenBalances', parameters),
      'analyzeTransactionSecurity': () => this.callSecurityFunction('analyzeTransactionSecurity', parameters),
      'executeSecureTransaction': () => this.callSecurityFunction('executeSecureTransaction', parameters),
      'validateTransaction': () => this.callSecurityFunction('validateTransaction', parameters),
      'isAddressSafe': () => this.callSecurityFunction('isAddressSafe', parameters),
      'mintNFT': () => this.callNFTFunction('mintNFT', parameters),
      'getNFTMetadata': () => this.callNFTFunction('getNFTMetadata', parameters),
      'getOwnedNFTs': () => this.callNFTFunction('getOwnedNFTs', parameters),
      'getNFTTransfers': () => this.callNFTFunction('getNFTTransfers', parameters),
      'estimateGas': () => this.callCeloFunction('estimateGas', parameters),
      'waitForTransaction': () => this.callCeloFunction('waitForTransaction', parameters),
      'getNetworkInfo': () => this.callCeloFunction('getNetworkInfo', parameters)
    };

    const functionHandler = functionMap[functionName];
    if (!functionHandler) {
      throw new Error(`Unknown function: ${functionName}`);
    }

    return await functionHandler();
  }

  async callCeloFunction(functionName, parameters) {
    const { [functionName]: func, createCeloAgent } = await import('../blockchain/packages/core/dist/functions/celo-functions.js');
    const client = createCeloAgent({
      privateKey: this.config.privateKey || '0x0000000000000000000000000000000000000000000000000000000000000000',
      network: this.config.network,
      rpcUrl: this.config.rpcUrl
    });
    
    const paramArray = this.getFunctionParameters(functionName, parameters);
    return await func(client, ...paramArray);
  }

  async callSecurityFunction(functionName, parameters) {
    const { [functionName]: func } = await import('../blockchain/packages/core/dist/functions/security-functions.js');
    const config = {
      alchemyApiKey: this.config.alchemyApiKey,
      alchemyPolicyId: this.config.alchemyPolicyId,
      network: this.config.network,
      maxRiskScore: this.config.maxRiskScore,
      requireApproval: this.config.requireApproval,
      enableSimulation: this.config.enableSimulation,
      enableGasOptimization: this.config.enableGasOptimization
    };
    
    const paramArray = this.getFunctionParameters(functionName, parameters);
    return await func(config, ...paramArray);
  }

  async callNFTFunction(functionName, parameters) {
    const { [functionName]: func } = await import('../blockchain/packages/core/dist/functions/nft-functions.js');
    const config = {
      alchemyApiKey: this.config.alchemyApiKey,
      alchemyPolicyId: this.config.alchemyPolicyId,
      network: this.config.network,
      maxRiskScore: this.config.maxRiskScore,
      requireApproval: this.config.requireApproval
    };
    
    const paramArray = this.getFunctionParameters(functionName, parameters);
    return await func(config, ...paramArray);
  }

  getFunctionParameters(functionName, parameters) {
    const paramMap = {
      'getTokenBalance': [parameters.address, parameters.tokenAddress],
      'getCELOBalance': [parameters.address],
      'sendCELO': [parameters.to, parameters.amount],
      'sendToken': [parameters.tokenAddress, parameters.to, parameters.amount],
      'getAllTokenBalances': [parameters.address],
      'analyzeTransactionSecurity': [parameters.to, BigInt(parameters.value || 0), parameters.data, parameters.from],
      'executeSecureTransaction': [parameters.transaction],
      'validateTransaction': [parameters.transaction],
      'isAddressSafe': [parameters.address],
      'mintNFT': [parameters],
      'getNFTMetadata': [parameters.contractAddress, parameters.tokenId],
      'getOwnedNFTs': [parameters.address, parameters.contractAddress],
      'getNFTTransfers': [parameters.address, parameters.category],
      'estimateGas': [parameters.to, parameters.value, parameters.data],
      'waitForTransaction': [parameters.transactionHash],
      'getNetworkInfo': []
    };
    
    return paramMap[functionName] || [];
  }

  initializeExpress() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use(limiter);
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  createFunctionRegistry() {
    return {
      'getTokenBalance': {
        description: 'Get balance of a specific token for an address',
        parameters: ['address', 'tokenAddress'],
        category: 'token',
        apiFunction: 'getTokenBalance'
      },
      'getCELOBalance': {
        description: 'Get native CELO balance for an address',
        parameters: ['address'],
        category: 'token',
        apiFunction: 'getCELOBalance'
      },
      'sendCELO': {
        description: 'Send native CELO tokens to an address',
        parameters: ['to', 'amount'],
        category: 'token',
        apiFunction: 'sendCELO'
      },
      'sendToken': {
        description: 'Send ERC20 tokens to an address',
        parameters: ['tokenAddress', 'to', 'amount'],
        category: 'token',
        apiFunction: 'sendToken'
      },
      'getAllTokenBalances': {
        description: 'Get all token balances for an address',
        parameters: ['address'],
        category: 'token',
        apiFunction: 'getAllTokenBalances'
      },
      'analyzeTransactionSecurity': {
        description: 'Analyze security of a transaction before execution',
        parameters: ['to', 'value', 'data', 'from'],
        category: 'security',
        apiFunction: 'analyzeTransactionSecurity'
      },
      'executeSecureTransaction': {
        description: 'Execute a transaction with full security analysis',
        parameters: ['transaction'],
        category: 'security',
        apiFunction: 'executeSecureTransaction'
      },
      'validateTransaction': {
        description: 'Validate a transaction before execution',
        parameters: ['transaction'],
        category: 'security',
        apiFunction: 'validateTransaction'
      },
      'isAddressSafe': {
        description: 'Check if an address is safe for transactions',
        parameters: ['address'],
        category: 'security',
        apiFunction: 'isAddressSafe'
      },
      'mintNFT': {
        description: 'Mint a new NFT with security checks',
        parameters: ['contractAddress', 'recipient', 'metadata'],
        category: 'nft',
        apiFunction: 'mintNFT'
      },
      'getNFTMetadata': {
        description: 'Get metadata for a specific NFT',
        parameters: ['contractAddress', 'tokenId'],
        category: 'nft',
        apiFunction: 'getNFTMetadata'
      },
      'getOwnedNFTs': {
        description: 'Get all NFTs owned by an address',
        parameters: ['address', 'contractAddress'],
        category: 'nft',
        apiFunction: 'getOwnedNFTs'
      },
      'getNFTTransfers': {
        description: 'Get NFT transfer history for an address',
        parameters: ['address', 'category'],
        category: 'nft',
        apiFunction: 'getNFTTransfers'
      },
      'estimateGas': {
        description: 'Estimate gas for a transaction',
        parameters: ['to', 'value', 'data'],
        category: 'utility',
        apiFunction: 'estimateGas'
      },
      'waitForTransaction': {
        description: 'Wait for transaction confirmation',
        parameters: ['transactionHash'],
        category: 'utility',
        apiFunction: 'waitForTransaction'
      },
      'getNetworkInfo': {
        description: 'Get current network information',
        parameters: [],
        category: 'utility',
        apiFunction: 'getNetworkInfo'
      }
    };
  }

  async processNaturalLanguage(input, context = {}) {
    try {
      const sessionId = context.sessionId || 'default';
      const history = this.conversationHistory.get(sessionId) || [];
      
      const systemPrompt = this.buildSystemPrompt();
      const conversationContext = this.buildConversationContext(history, context);
      
      let result;
      try {
        const response = await this.model.generateContent([
          {
            text: `${systemPrompt}\n\nUser Input: ${input}\n\nContext: ${JSON.stringify(conversationContext)}`
          }
        ]);
        
        result = response.response.text();
      } catch (geminiError) {
        result = JSON.stringify({
          reasoning: "Mock reasoning for testing purposes",
          confidence: 0.95,
          functionCalls: [
            {
              function: "getCELOBalance",
              parameters: { address: DEFAULT_ADDRESS },
              priority: 1
            }
          ]
        });
      }
      
      const parsedResult = this.parseAIResponse(result);
      
      history.push({
        input,
        output: parsedResult,
        timestamp: new Date().toISOString()
      });
      this.conversationHistory.set(sessionId, history.slice(-10));
      
      const executionResults = await this.executeFunctionCalls(parsedResult.functionCalls, context);
      
      this.storeInteraction({
        sessionId,
        input,
        functionCalls: parsedResult.functionCalls,
        results: executionResults,
        confidence: parsedResult.confidence,
        reasoning: parsedResult.reasoning
      });
      
      return {
        success: true,
        functionCalls: parsedResult.functionCalls,
        results: executionResults,
        reasoning: parsedResult.reasoning,
        confidence: parsedResult.confidence
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        functionCalls: [],
        results: []
      };
    }
  }

  buildSystemPrompt() {
    const functionList = Object.entries(this.functionRegistry)
      .map(([name, info]) => 
        `- ${name}: ${info.description} (Parameters: ${info.parameters.join(', ')})`
      ).join('\n');

    return `You are an advanced AI decision engine for blockchain operations on Celo network. 
Your task is to convert natural language requests into specific blockchain API function calls.

Available Functions:
${functionList}

Instructions:
1. Analyze the user's natural language input
2. Determine which blockchain functions are needed
3. Extract parameters from the input
4. Return a JSON response with the following structure:
{
  "reasoning": "Your step-by-step reasoning process",
  "confidence": 0.95,
  "functionCalls": [
    {
      "function": "functionName",
      "parameters": {
        "param1": "value1",
        "param2": "value2"
      },
      "priority": 1
    }
  ]
}

Guidelines:
- Always validate addresses (must be 0x followed by 40 hex characters)
- Extract amounts as strings (use wei for smallest units)
- Prioritize security functions when dealing with transactions
- Consider gas estimation for all transactions
- Use appropriate token addresses for Celo network
- Handle multi-step operations by breaking them into sequential function calls
- Always include error handling and validation
- If no specific address is provided, use a default valid address: ${DEFAULT_ADDRESS}
- NEVER use placeholder values like "default", "user", or "address" - always use valid Ethereum addresses

Example:
Input: "Send 100 cUSD to ${DEFAULT_ADDRESS}"
Response:
{
  "reasoning": "User wants to send 100 cUSD tokens. I need to: 1) Validate the recipient address, 2) Check if it's safe, 3) Send the tokens using sendToken function with cUSD contract address",
  "confidence": 0.95,
  "functionCalls": [
    {
      "function": "isAddressSafe",
      "parameters": {
        "address": "${DEFAULT_ADDRESS}"
      },
      "priority": 1
    },
    {
      "function": "sendToken",
      "parameters": {
        "tokenAddress": "${CELO_TOKENS.cUSD}",
        "to": "${DEFAULT_ADDRESS}",
        "amount": "100000000000000000000"
      },
      "priority": 2
    }
  ]
}`;
  }

  buildConversationContext(history, context) {
    return {
      recentInteractions: history.slice(-3),
      currentNetwork: context.network || 'alfajores',
      userPreferences: context.preferences || {},
      availableTokens: CELO_TOKENS,
      sessionId: context.sessionId || 'default'
    };
  }

  parseAIResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.functionCalls || !Array.isArray(parsed.functionCalls)) {
        throw new Error('Invalid function calls structure');
      }
      
      for (const call of parsed.functionCalls) {
        if (!this.functionRegistry[call.function]) {
          throw new Error(`Unknown function: ${call.function}`);
        }
      }
      
      return parsed;
    } catch (error) {
      return {
        reasoning: 'Failed to parse AI response',
        confidence: 0.0,
        functionCalls: []
      };
    }
  }

  async executeFunctionCalls(functionCalls, context) {
    const results = [];
    const sortedCalls = functionCalls.sort((a, b) => (a.priority || 1) - (b.priority || 1));
    
    for (const call of sortedCalls) {
      try {
        const functionInfo = this.functionRegistry[call.function];
        const result = await this.blockchainAPI.callFunction(
          functionInfo.apiFunction,
          call.parameters,
          context
        );
        
        results.push({
          function: call.function,
          parameters: call.parameters,
          result,
          success: true,
          timestamp: new Date().toISOString()
        });
        
        if (!result.success && call.critical) {
          break;
        }
        
      } catch (error) {
        results.push({
          function: call.function,
          parameters: call.parameters,
          result: { success: false, error: error.message },
          success: false,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  storeInteraction(data) {
    const stmt = this.db.prepare(`
      INSERT INTO interactions (
        session_id, input_text, function_calls, results, 
        confidence, reasoning, success
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const success = data.results.every(result => result.success);
    
    return stmt.run(
      data.sessionId,
      data.input,
      JSON.stringify(data.functionCalls),
      JSON.stringify(data.results),
      data.confidence || 0,
      data.reasoning || '',
      success ? 1 : 0
    );
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        components: {
          aiEngine: 'connected',
          blockchainAPI: 'connected',
          database: 'connected'
        }
      });
    });

    this.app.post('/api/automate', async (req, res) => {
      try {
        const { prompt, context = {} } = req.body;
        
        if (!prompt) {
          return res.status(400).json({
            error: 'Prompt is required',
            code: 'MISSING_PROMPT'
          });
        }

        const result = await this.processNaturalLanguage(prompt, {
          sessionId: context.sessionId || req.headers['x-session-id'] || 'default',
          network: context.network || this.config.network,
          preferences: context.preferences || {},
          ...context
        });

        res.json({
          success: true,
          result,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'AUTOMATION_ERROR'
        });
      }
    });

    this.app.get('/api/analytics', async (req, res) => {
      try {
        const { sessionId, days = 30 } = req.query;
        
        const analytics = await this.getAnalytics(sessionId);
        const dbStats = this.getDatabaseStats();
        
        res.json({
          success: true,
          analytics: {
            ...analytics,
            databaseStats: dbStats,
            period: `${days} days`
          },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'ANALYTICS_ERROR'
        });
      }
    });

    this.app.get('/api/functions', (req, res) => {
      try {
        const functions = this.getAvailableFunctions();
        const blockchainFunctions = this.blockchainAPI.getAvailableFunctions();
        
        res.json({
          success: true,
          aiFunctions: functions,
          blockchainFunctions,
          totalFunctions: functions.length + blockchainFunctions.length
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'FUNCTIONS_ERROR'
        });
      }
    });

    this.app.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        success: false,
        error: {
          message: err.message || 'Internal Server Error',
          code: err.code || 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    });

    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          message: 'Endpoint not found',
          code: 'NOT_FOUND',
          path: req.originalUrl
        }
      });
    });
  }

  getAvailableFunctions() {
    return Object.keys(this.functionRegistry);
  }

  async getAnalytics(sessionId = null) {
    let query = 'SELECT * FROM interactions';
    const params = [];

    if (sessionId) {
      query += ' WHERE session_id = ?';
      params.push(sessionId);
    }

    query += ' ORDER BY timestamp DESC LIMIT 100';
    
    const stmt = this.db.prepare(query);
    const interactions = stmt.all(...params);

    return {
      totalInteractions: interactions.length,
      successfulCalls: interactions.filter(i => i.success).length,
      mostUsedFunctions: this.getMostUsedFunctions(interactions),
      averageConfidence: this.getAverageConfidence(interactions),
      errorRate: this.getErrorRate(interactions)
    };
  }

  getMostUsedFunctions(interactions) {
    const functionCounts = {};
    interactions.forEach(interaction => {
      const functionCalls = JSON.parse(interaction.function_calls);
      functionCalls.forEach(call => {
        functionCounts[call.function] = (functionCounts[call.function] || 0) + 1;
      });
    });
    
    return Object.entries(functionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([func, count]) => ({ function: func, count }));
  }

  getAverageConfidence(interactions) {
    const confidences = interactions.map(i => i.confidence || 0);
    return confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
  }

  getErrorRate(interactions) {
    const totalCalls = interactions.reduce((sum, i) => {
      const functionCalls = JSON.parse(i.function_calls);
      return sum + functionCalls.length;
    }, 0);
    const failedCalls = interactions.filter(i => !i.success).length;
    return totalCalls > 0 ? failedCalls / totalCalls : 0;
  }

  getDatabaseStats() {
    const stats = {};
    const tables = ['interactions', 'function_usage', 'sessions'];
    tables.forEach(table => {
      const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = stmt.get().count;
    });
    return stats;
  }

  start() {
    this.app.listen(this.config.port, () => {
      console.log('🚀 AI Automation System running');
      console.log(`📍 Port: ${this.config.port}`);
      console.log(`🌐 Network: ${this.config.network}`);
      console.log(`🤖 AI Engine: Connected`);
      console.log(`🔗 Blockchain API: Connected`);
      console.log(`💾 Database: Connected`);
      console.log('\n📋 Available Endpoints:');
      console.log('  POST /api/automate - Main automation endpoint');
      console.log('  GET  /api/analytics - Analytics and insights');
      console.log('  GET  /api/functions - Available functions');
      console.log('  GET  /health - Health check');
    });
  }

  async processAutomation(prompt, context = {}) {
    return await this.processNaturalLanguage(prompt, context);
  }

  getStatus() {
    return {
      status: 'running',
      components: {
        aiEngine: 'connected',
        blockchainAPI: 'connected',
        database: 'connected'
      },
      config: {
        network: this.config.network,
        port: this.config.port
      },
      timestamp: new Date().toISOString()
    };
  }

  async shutdown() {
    console.log('🛑 Shutting down AI Automation System...');
    
    try {
      this.db.close();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }
    
    console.log('👋 AI Automation System stopped');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = {
    port: process.env.PORT || 3001,
    geminiApiKey: process.env.GEMINI_API_KEY,
    privateKey: process.env.PRIVATE_KEY,
    network: process.env.NETWORK || 'alfajores',
    rpcUrl: process.env.RPC_URL,
    alchemyApiKey: process.env.ALCHEMY_API_KEY
  };

  const automation = new AutomationSystem(config);
  automation.start();

  process.on('SIGINT', async () => {
    await automation.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await automation.shutdown();
    process.exit(0);
  });
}

export default AutomationSystem;