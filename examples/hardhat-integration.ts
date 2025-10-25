import {
  deployHardhatContract,
  getContract,
  callContractFunction,
  sendContractTransaction,
  verifyHardhatContract,
  getNetworkInfo,
  getAccountBalance,
  transferCELO,
  compileContracts,
  runTests,
  HardhatConfig
} from '@celo-ai-agents/core';

/**
 * Example: Hardhat Integration for Celo AI Agents
 * 
 * This example shows how to use Hardhat functions with the Celo AI Agents library
 * for smart contract deployment, interaction, and testing.
 */

async function hardhatIntegrationExample() {
  console.log('🚀 Hardhat Integration Example');
  console.log('===============================\n');

  // Configuration for Alfajores testnet
  const config: HardhatConfig = {
    network: 'alfajores',
    privateKey: process.env.PRIVATE_KEY || '0x...', // Your private key
    rpcUrl: 'https://alfajores-forno.celo-testnet.org'
  };

  try {
    // 1. Get network information
    console.log('📡 Getting network information...');
    const networkInfo = await getNetworkInfo(config);
    console.log('Network:', networkInfo);
    console.log('');

    // 2. Check account balance
    console.log('💰 Checking account balance...');
    const balance = await getAccountBalance(config, '0x...' as any); // Your address
    console.log('Balance:', balance, 'wei');
    console.log('');

    // 3. Compile contracts
    console.log('🔨 Compiling contracts...');
    const compileSuccess = await compileContracts(config);
    console.log('Compilation successful:', compileSuccess);
    console.log('');

    // 4. Deploy a contract (example: AgentRegistry)
    console.log('📦 Deploying AgentRegistry contract...');
    const deploymentResult = await deployHardhatContract(
      config,
      'AgentRegistry',
      [] // Constructor arguments
    );
    console.log('Deployment result:', deploymentResult);
    console.log('');

    // 5. Get contract instance
    console.log('📋 Getting contract instance...');
    const contract = await getContract(
      config,
      'AgentRegistry',
      deploymentResult.contractAddress
    );
    console.log('Contract address:', deploymentResult.contractAddress);
    console.log('');

    // 6. Call a read function
    console.log('📖 Calling read function...');
    try {
      const result = await callContractFunction(
        config,
        'AgentRegistry',
        deploymentResult.contractAddress,
        'getAgentCount' // Assuming this function exists
      );
      console.log('Agent count:', result.toString());
    } catch (error) {
      console.log('Read function call failed (expected if function doesn\'t exist):', error);
    }
    console.log('');

    // 7. Send a transaction
    console.log('📝 Sending transaction...');
    try {
      const txResult = await sendContractTransaction(
        config,
        'AgentRegistry',
        deploymentResult.contractAddress,
        'registerAgent', // Assuming this function exists
        ['0x...', 'Agent Name', 'Description'], // Function arguments
        '0' // Value in wei
      );
      console.log('Transaction result:', txResult);
    } catch (error) {
      console.log('Transaction failed (expected if function doesn\'t exist):', error);
    }
    console.log('');

    // 8. Verify contract on block explorer
    console.log('🔍 Verifying contract...');
    const verificationSuccess = await verifyHardhatContract(
      config,
      deploymentResult.contractAddress,
      [] // Constructor arguments
    );
    console.log('Verification successful:', verificationSuccess);
    console.log('');

    // 9. Transfer CELO
    console.log('💸 Transferring CELO...');
    try {
      const transferResult = await transferCELO(
        config,
        '0x...' as any, // Recipient address
        '0.001' // Amount in CELO
      );
      console.log('Transfer result:', transferResult);
    } catch (error) {
      console.log('Transfer failed:', error);
    }
    console.log('');

    // 10. Run tests
    console.log('🧪 Running tests...');
    const testSuccess = await runTests(config);
    console.log('Tests passed:', testSuccess);
    console.log('');

    console.log('✅ Hardhat integration example completed!');

  } catch (error) {
    console.error('❌ Error in Hardhat integration example:', error);
  }
}

/**
 * Example: Contract Deployment Workflow
 */
async function contractDeploymentWorkflow() {
  console.log('🏗️ Contract Deployment Workflow');
  console.log('================================\n');

  const config: HardhatConfig = {
    network: 'alfajores',
    privateKey: process.env.PRIVATE_KEY || '0x...',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org'
  };

  try {
    // Step 1: Compile contracts
    console.log('1️⃣ Compiling contracts...');
    await compileContracts(config);
    console.log('✅ Compilation successful\n');

    // Step 2: Deploy contracts in order
    console.log('2️⃣ Deploying contracts...');
    
    // Deploy AgentRegistry first
    const agentRegistry = await deployHardhatContract(config, 'AgentRegistry', []);
    console.log('✅ AgentRegistry deployed at:', agentRegistry.contractAddress);

    // Deploy AgentTreasury
    const agentTreasury = await deployHardhatContract(config, 'AgentTreasury', []);
    console.log('✅ AgentTreasury deployed at:', agentTreasury.contractAddress);

    // Deploy AttendanceNFT
    const attendanceNFT = await deployHardhatContract(config, 'AttendanceNFT', []);
    console.log('✅ AttendanceNFT deployed at:', attendanceNFT.contractAddress);

    // Deploy DonationSplitter
    const donationSplitter = await deployHardhatContract(config, 'DonationSplitter', []);
    console.log('✅ DonationSplitter deployed at:', donationSplitter.contractAddress);

    // Deploy MasterTradingContract
    const masterTrading = await deployHardhatContract(config, 'MasterTradingContract', []);
    console.log('✅ MasterTradingContract deployed at:', masterTrading.contractAddress);

    // Deploy YieldAggregator
    const yieldAggregator = await deployHardhatContract(config, 'YieldAggregator', []);
    console.log('✅ YieldAggregator deployed at:', yieldAggregator.contractAddress);

    console.log('\n🎉 All contracts deployed successfully!');
    console.log('📋 Deployment Summary:');
    console.log(`   AgentRegistry: ${agentRegistry.contractAddress}`);
    console.log(`   AgentTreasury: ${agentTreasury.contractAddress}`);
    console.log(`   AttendanceNFT: ${attendanceNFT.contractAddress}`);
    console.log(`   DonationSplitter: ${donationSplitter.contractAddress}`);
    console.log(`   MasterTradingContract: ${masterTrading.contractAddress}`);
    console.log(`   YieldAggregator: ${yieldAggregator.contractAddress}`);

  } catch (error) {
    console.error('❌ Deployment workflow failed:', error);
  }
}

/**
 * Example: Contract Interaction
 */
async function contractInteractionExample() {
  console.log('🤝 Contract Interaction Example');
  console.log('===============================\n');

  const config: HardhatConfig = {
    network: 'alfajores',
    privateKey: process.env.PRIVATE_KEY || '0x...',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org'
  };

  // Example contract addresses (replace with actual deployed addresses)
  const contractAddresses = {
    agentRegistry: '0x...' as any,
    agentTreasury: '0x...' as any,
    attendanceNFT: '0x...' as any,
    donationSplitter: '0x...' as any,
    masterTrading: '0x...' as any,
    yieldAggregator: '0x...' as any,
  };

  try {
    // Interact with AgentRegistry
    console.log('📋 Interacting with AgentRegistry...');
    const agentCount = await callContractFunction(
      config,
      'AgentRegistry',
      contractAddresses.agentRegistry,
      'getAgentCount'
    );
    console.log('Total agents:', agentCount.toString());

    // Interact with AttendanceNFT
    console.log('🎫 Interacting with AttendanceNFT...');
    const totalSupply = await callContractFunction(
      config,
      'AttendanceNFT',
      contractAddresses.attendanceNFT,
      'totalSupply'
    );
    console.log('Total NFT supply:', totalSupply.toString());

    // Interact with MasterTradingContract
    console.log('💱 Interacting with MasterTradingContract...');
    const orderCount = await callContractFunction(
      config,
      'MasterTradingContract',
      contractAddresses.masterTrading,
      'getOrderCount'
    );
    console.log('Total orders:', orderCount.toString());

    console.log('\n✅ Contract interaction completed!');

  } catch (error) {
    console.error('❌ Contract interaction failed:', error);
  }
}

// Export functions for use
export {
  hardhatIntegrationExample,
  contractDeploymentWorkflow,
  contractInteractionExample
};

// Run examples if this file is executed directly
if (require.main === module) {
  hardhatIntegrationExample()
    .then(() => contractDeploymentWorkflow())
    .then(() => contractInteractionExample())
    .catch(console.error);
}
