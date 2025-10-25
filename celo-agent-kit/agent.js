// CeloAgentKit.js
import { ethers } from "ethers";

class CeloAgent {
  constructor(config = {}) {
    this._model = null;
    this._prompt = "You are a helpful Celo blockchain agent.";
    this._tools = new Map();
    this._history = [];
    this._logger = null;
    this._provider = null;
    this._wallet = null;

    // Celo network configuration
    this._networks = {
      mainnet: "https://forno.celo.org",
      alfajores: "https://alfajores-forno.celo-testnet.org",
      baklava: "https://baklava-forno.celo-testnet.org",
    };

    // Initialize with config
    if (config.network) {
      this.initializeProvider(config.network);
    }
    if (config.privateKey) {
      this.initializeWallet(config.privateKey);
    }
  }

  // Initialize Celo provider
  initializeProvider(network = "alfajores") {
    const rpcUrl = this._networks[network];
    if (!rpcUrl) {
      throw new Error(
        `Unknown network: ${network}. Use mainnet, alfajores, or baklava.`
      );
    }
    this._provider = new ethers.JsonRpcProvider(rpcUrl);
    return this;
  }

  // Initialize wallet
  initializeWallet(privateKey) {
    if (!this._provider) {
      throw new Error("Provider must be initialized before wallet");
    }
    this._wallet = new ethers.Wallet(privateKey, this._provider);
    return this;
  }

  // Set AI model
  model(modelFunction) {
    if (typeof modelFunction !== "function") {
      throw new Error("Model must be a function");
    }
    this._model = modelFunction;
    return this;
  }

  // Set system prompt
  systemPrompt(prompt) {
    this._prompt = prompt || "You are a helpful Celo blockchain agent.";
    return this;
  }

  // Register tools for the agent
  registerTool(name, description, handler) {
    this._tools.set(name, {
      name,
      description,
      handler,
    });
    return this;
  }

  // Get available tools as formatted string for AI
  getToolsDescription() {
    const tools = Array.from(this._tools.values())
      .map((tool) => `- ${tool.name}: ${tool.description}`)
      .join("\n");
    return tools;
  }

  // Execute a tool by name
  async executeTool(toolName, params) {
    const tool = this._tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    try {
      const result = await tool.handler(params);
      this._history.push({
        type: "tool_execution",
        tool: toolName,
        params,
        result,
        timestamp: new Date(),
      });
      return result;
    } catch (error) {
      this._history.push({
        type: "tool_error",
        tool: toolName,
        params,
        error: error.message,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  // Trigger callback with agent context
  trigger(callback) {
    if (typeof callback !== "function") {
      throw new Error("Trigger callback must be a function");
    }
    return callback(this);
  }

  // Create a Celo transaction
  async createTransaction(params) {
    if (!this._wallet) {
      throw new Error("Wallet not initialized");
    }

    const { to, value, data = "0x", gasLimit } = params;

    try {
      const tx = {
        to,
        value: ethers.parseEther(value.toString()),
        data,
        gasLimit: gasLimit || 100000,
      };

      const transaction = await this._wallet.sendTransaction(tx);
      const receipt = await transaction.wait();

      const result = {
        status: "success",
        hash: receipt.hash,
        from: receipt.from,
        to: receipt.to,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };

      this._history.push({
        type: "transaction",
        params,
        result,
        timestamp: new Date(),
      });

      if (this._logger) {
        await this._logger.log("transaction", result);
      }

      return result;
    } catch (error) {
      const errorResult = {
        status: "error",
        message: error.message,
        params,
      };

      this._history.push({
        type: "transaction_error",
        error: errorResult,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  // Request transfer (CELO or cUSD)
  async requestTransfer(params) {
    const { to, amount, token = "CELO", memo = "" } = params;

    // Token addresses on Celo
    const tokenAddresses = {
      cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Alfajores
      cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
      cREAL: "0xE4D517785D091D3c54818832dB6094bcc2744545",
    };

    if (token === "CELO") {
      return this.createTransaction({ to, value: amount });
    } else {
      // ERC20 transfer for stable tokens
      const tokenAddress = tokenAddresses[token];
      if (!tokenAddress) {
        throw new Error(`Unsupported token: ${token}`);
      }

      const erc20ABI = [
        "function transfer(address to, uint256 amount) returns (bool)",
      ];
      const contract = new ethers.Contract(
        tokenAddress,
        erc20ABI,
        this._wallet
      );
      const amountWei = ethers.parseUnits(amount.toString(), 18);

      const tx = await contract.transfer(to, amountWei);
      const receipt = await tx.wait();

      const result = {
        status: "success",
        token,
        hash: receipt.hash,
        from: receipt.from,
        to,
        amount,
        memo,
      };

      if (this._logger) {
        await this._logger.log("transfer", result);
      }

      return result;
    }
  }

  // Get balance
  async getBalance(address, token = "CELO") {
    if (!this._provider) {
      throw new Error("Provider not initialized");
    }

    const addr = address || this._wallet?.address;
    if (!addr) {
      throw new Error("No address provided and no wallet initialized");
    }

    if (token === "CELO") {
      const balance = await this._provider.getBalance(addr);
      return ethers.formatEther(balance);
    } else {
      // For stable tokens
      const tokenAddresses = {
        cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
        cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
        cREAL: "0xE4D517785D091D3c54818832dB6094bcc2744545",
      };

      const tokenAddress = tokenAddresses[token];
      if (!tokenAddress) {
        throw new Error(`Unsupported token: ${token}`);
      }

      const erc20ABI = ["function balanceOf(address) view returns (uint256)"];
      const contract = new ethers.Contract(
        tokenAddress,
        erc20ABI,
        this._provider
      );
      const balance = await contract.balanceOf(addr);
      return ethers.formatUnits(balance, 18);
    }
  }

  // Logging configuration
  log() {
    const self = this;
    return {
      database: (dbConfig) => {
        self._logger = {
          type: "database",
          config: dbConfig,
          log: async (type, data) => {
            console.log(`[DB LOG] ${type}:`, data);
            // Implement actual database logging here
            return { logged: true, type: "database", data };
          },
        };
        return self;
      },
      telegram: (botConfig) => {
        self._logger = {
          type: "telegram",
          config: botConfig,
          log: async (type, data) => {
            console.log(`[TELEGRAM LOG] ${type}:`, data);
            // Implement Telegram bot logging here
            return { logged: true, type: "telegram", data };
          },
        };
        return self;
      },
      console: () => {
        self._logger = {
          type: "console",
          log: async (type, data) => {
            console.log(
              `[${type.toUpperCase()}]`,
              JSON.stringify(data, null, 2)
            );
            return { logged: true, type: "console", data };
          },
        };
        return self;
      },
    };
  }

  // Main run loop - processes user input with AI
  async run(userInput) {
    if (!this._model) {
      throw new Error("Model not configured. Use .model() to set an AI model.");
    }

    // Build context for AI
    const context = {
      systemPrompt: this._prompt,
      tools: this.getToolsDescription(),
      history: this._history.slice(-10), // Last 10 interactions
      userInput,
    };

    // Get AI response
    const aiResponse = await this._model(context);

    // Parse AI response and execute tools if needed
    const parsedResponse = this.parseAIResponse(aiResponse);

    if (parsedResponse.toolCalls && parsedResponse.toolCalls.length > 0) {
      const results = [];
      for (const toolCall of parsedResponse.toolCalls) {
        const result = await this.executeTool(toolCall.name, toolCall.params);
        results.push(result);
      }
      parsedResponse.toolResults = results;
    }

    this._history.push({
      type: "interaction",
      userInput,
      aiResponse,
      parsedResponse,
      timestamp: new Date(),
    });

    return parsedResponse;
  }

  // Parse AI response to extract tool calls
  parseAIResponse(response) {
    const parsed = {
      message: response,
      toolCalls: [],
    };

    // Simple parsing - look for tool call patterns
    // Format: TOOL[toolName](param1=value1, param2=value2)
    const toolPattern = /TOOL\[(\w+)\]\(([^)]+)\)/g;
    let match;

    while ((match = toolPattern.exec(response)) !== null) {
      const [, toolName, paramsStr] = match;
      const params = {};

      // Parse parameters
      paramsStr.split(",").forEach((pair) => {
        const [key, value] = pair.split("=").map((s) => s.trim());
        params[key] = value.replace(/['"]/g, "");
      });

      parsed.toolCalls.push({ name: toolName, params });
    }

    return parsed;
  }

  // Get agent history
  getHistory(limit = 10) {
    return this._history.slice(-limit);
  }

  // Clear history
  clearHistory() {
    this._history = [];
    return this;
  }

  // Get current wallet address
  getAddress() {
    return this._wallet?.address || null;
  }
}

export default CeloAgent;

// Example usage:
/*
const agent = new CeloAgent({ 
  network: 'alfajores',
  privateKey: 'YOUR_PRIVATE_KEY'
});

// Configure AI model
agent.model(async (context) => {
  // Call your LLM here (OpenAI, Claude, etc.)
  const response = await callLLM(context);
  return response;
});

// Set custom prompt
agent.systemPrompt(`
  You are a Celo blockchain agent that helps users manage their crypto assets.
  You can check balances, send transactions, and transfer tokens.
`);

// Register custom tools
agent.registerTool('checkBalance', 'Check CELO or token balance', async (params) => {
  return await agent.getBalance(params.address, params.token);
});

// Configure logging
agent.log().console();

// Run the agent
const result = await agent.run("Send 1 CELO to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
*/
