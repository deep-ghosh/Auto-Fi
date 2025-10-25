/**
 * Celo AI Agents API Usage Examples
 * 
 * This file demonstrates how to use the REST API for automated blockchain processes
 */

// Example API calls using fetch
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Helper function for API calls
async function apiCall(endpoint: string, method: string = 'GET', data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  return await response.json();
}

/**
 * Example 1: Deploy a Smart Contract
 */
async function deployContractExample() {
  console.log('🚀 Deploying Smart Contract...');
  
  const deploymentData = {
    network: 'alfajores',
    privateKey: '0x...', // Your private key
    contractName: 'AgentRegistry',
    constructorArgs: [],
    rpcUrl: 'https://alfajores-forno.celo-testnet.org'
  };

  try {
    const result = await apiCall('/contracts/deploy', 'POST', deploymentData);
    console.log('✅ Contract deployed:', result.data);
    return result.data.contractAddress;
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

/**
 * Example 2: Create and Execute an AI Agent
 */
async function createAgentExample() {
  console.log('🤖 Creating AI Agent...');
  
  const agentData = {
    goal: 'Manage treasury and optimize fund allocation',
    constraints: ['Max 10% risk per transaction', 'Maintain 20% liquidity'],
    tools: ['treasury_analysis', 'defi_swaps', 'risk_assessment'],
    maxIterations: 5,
    temperature: 0.7,
    network: 'alfajores',
    privateKey: '0x...', // Your private key
    alchemyApiKey: 'your_alchemy_api_key'
  };

  try {
    const result = await apiCall('/agents/create', 'POST', agentData);
    console.log('✅ Agent created:', result.data);
    
    // Execute the agent
    const executionResult = await apiCall('/agents/execute', 'POST', {
      agentId: result.data.agentId,
      context: { treasuryBalance: '1000000000000000000' },
      maxIterations: 3
    });
    
    console.log('✅ Agent executed:', executionResult.data);
    return result.data.agentId;
  } catch (error) {
    console.error('❌ Agent creation failed:', error);
  }
}

/**
 * Example 3: Mint NFTs
 */
async function mintNFTExample() {
  console.log('🎨 Minting NFT...');
  
  const nftData = {
    contractAddress: '0x...', // Your NFT contract address
    recipient: '0x...', // Recipient address
    metadata: {
      name: 'Celo AI Agent NFT',
      description: 'A unique NFT representing an AI agent on Celo',
      image: 'https://example.com/agent-nft.png',
      attributes: [
        { trait_type: 'Intelligence', value: 'High' },
        { trait_type: 'Network', value: 'Celo' },
        { trait_type: 'Type', value: 'AI Agent' }
      ]
    },
    network: 'alfajores',
    privateKey: '0x...', // Your private key
    alchemyApiKey: 'your_alchemy_api_key'
  };

  try {
    const result = await apiCall('/nft/mint', 'POST', nftData);
    console.log('✅ NFT minted:', result.data);
    return result.data.tokenId;
  } catch (error) {
    console.error('❌ NFT minting failed:', error);
  }
}

/**
 * Example 4: Analyze Transaction Security
 */
async function analyzeSecurityExample() {
  console.log('🔒 Analyzing Transaction Security...');
  
  const securityData = {
    to: '0x...', // Recipient address
    value: '1000000000000000000', // 1 CELO in wei
    data: '0x...', // Transaction data
    from: '0x...', // Sender address
    maxRiskScore: 30,
    requireApproval: true,
    enableSimulation: true,
    enableGasOptimization: true
  };

  try {
    const result = await apiCall('/security/analyze', 'POST', securityData);
    console.log('✅ Security analysis:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Security analysis failed:', error);
  }
}

/**
 * Example 5: Batch Deploy Multiple Contracts
 */
async function batchDeployExample() {
  console.log('📦 Batch Deploying Contracts...');
  
  const batchData = {
    contracts: [
      {
        contractName: 'AgentRegistry',
        constructorArgs: []
      },
      {
        contractName: 'AgentTreasury',
        constructorArgs: []
      },
      {
        contractName: 'AttendanceNFT',
        constructorArgs: []
      }
    ],
    network: 'alfajores',
    privateKey: '0x...', // Your private key
    rpcUrl: 'https://alfajores-forno.celo-testnet.org'
  };

  try {
    const result = await apiCall('/deployment/batch-deploy', 'POST', batchData);
    console.log('✅ Batch deployment completed:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Batch deployment failed:', error);
  }
}

/**
 * Example 6: Get Network Information
 */
async function getNetworkInfoExample() {
  console.log('📡 Getting Network Information...');
  
  try {
    const result = await apiCall('/contracts/network-info?network=alfajores&privateKey=0x...');
    console.log('✅ Network info:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Failed to get network info:', error);
  }
}

/**
 * Example 7: Complete Workflow - Deploy, Create Agent, and Execute
 */
async function completeWorkflowExample() {
  console.log('🔄 Complete Workflow Example');
  console.log('============================\n');

  try {
    // Step 1: Deploy contracts
    console.log('1️⃣ Deploying contracts...');
    const contracts = await batchDeployExample();
    
    // Step 2: Create AI agent
    console.log('\n2️⃣ Creating AI agent...');
    const agentId = await createAgentExample();
    
    // Step 3: Analyze security
    console.log('\n3️⃣ Analyzing transaction security...');
    const security = await analyzeSecurityExample();
    
    // Step 4: Mint NFT
    console.log('\n4️⃣ Minting NFT...');
    const nft = await mintNFTExample();
    
    // Step 5: Get network info
    console.log('\n5️⃣ Getting network information...');
    const networkInfo = await getNetworkInfoExample();
    
    console.log('\n✅ Complete workflow finished successfully!');
    console.log('📋 Summary:');
    console.log(`   Contracts deployed: ${contracts?.data?.successful || 0}`);
    console.log(`   Agent created: ${agentId || 'Failed'}`);
    console.log(`   Security risk score: ${security?.riskScore || 'Unknown'}`);
    console.log(`   NFT minted: ${nft || 'Failed'}`);
    console.log(`   Network: ${networkInfo?.name || 'Unknown'}`);
    
  } catch (error) {
    console.error('❌ Complete workflow failed:', error);
  }
}

/**
 * Example 8: Health Check and API Status
 */
async function healthCheckExample() {
  console.log('🏥 Checking API Health...');
  
  try {
    const health = await apiCall('/health');
    console.log('✅ API Health:', health);
    
    const securityHealth = await apiCall('/security/health');
    console.log('✅ Security Service:', securityHealth.data);
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

// Export functions for use
export {
  deployContractExample,
  createAgentExample,
  mintNFTExample,
  analyzeSecurityExample,
  batchDeployExample,
  getNetworkInfoExample,
  completeWorkflowExample,
  healthCheckExample
};

// Run examples if this file is executed directly
if (require.main === module) {
  completeWorkflowExample()
    .then(() => healthCheckExample())
    .catch(console.error);
}
