import { 
  createCeloAgent,
  createTreasuryManagerAgent,
  createDonationSplitterAgent,
  createNFTMinterAgent,
  executeAgentWithSecurity,
  registerAgent
} from '@celo-ai-agents/core';

async function advancedAgentsExample() {
  // Initialize Celo agent
  const agent = createCeloAgent({
    privateKey: '0x...', // Your private key
    network: 'alfajores',
    alchemyApiKey: 'your-alchemy-api-key'
  });

  // Create Treasury Manager Agent
  const treasuryAgent = createTreasuryManagerAgent(
    agent,
    BigInt(1), // Agent ID
    {
      cusdPercentage: 40,
      ceurPercentage: 30,
      celoPercentage: 30
    },
    5, // 5% rebalance threshold
    {
      daily: '10000000000000000000', // 10 CELO daily limit
      perTx: '1000000000000000000'  // 1 CELO per transaction limit
    }
  );

  // Register the agent
  await registerAgent(treasuryAgent, BigInt(1), {
    goal: 'Manage treasury with 40% cUSD, 30% cEUR, 30% CELO allocation',
    constraints: 'Rebalance when deviation exceeds 5%. Maintain liquidity.',
    executionMode: 'auto',
    spendingLimits: {
      daily: '10000000000000000000',
      perTx: '1000000000000000000'
    },
    permissions: ['TRANSFER', 'SWAP', 'STAKE', 'UNSTAKE']
  });

  // Execute treasury agent with security
  const treasuryResult = await executeAgentWithSecurity(
    treasuryAgent,
    {
      alchemyApiKey: 'your-alchemy-api-key',
      network: 'alfajores',
      maxRiskScore: 30, // Lower risk threshold for treasury
      requireApproval: false
    },
    BigInt(1)
  );

  console.log('Treasury Agent Result:', treasuryResult);

  // Create Donation Splitter Agent
  const donationAgent = createDonationSplitterAgent(
    agent,
    BigInt(2), // Agent ID
    [
      { address: '0x...', percentage: 50, name: 'Charity A' },
      { address: '0x...', percentage: 30, name: 'Charity B' },
      { address: '0x...', percentage: 20, name: 'Charity C' }
    ],
    '1000000000000000000', // 1 CELO minimum donation
    {
      daily: '5000000000000000000', // 5 CELO daily limit
      perTx: '2000000000000000000'  // 2 CELO per transaction limit
    }
  );

  // Create NFT Minter Agent
  const nftAgent = createNFTMinterAgent(
    agent,
    BigInt(3), // Agent ID
    '0x...', // NFT contract address
    'Event attendance detected',
    {
      daily: '2000000000000000000', // 2 CELO daily limit
      perTx: '500000000000000000'   // 0.5 CELO per transaction limit
    }
  );

  // Execute all agents
  const [donationResult, nftResult] = await Promise.all([
    executeAgentWithSecurity(
      donationAgent,
      {
        alchemyApiKey: 'your-alchemy-api-key',
        network: 'alfajores',
        maxRiskScore: 40
      },
      BigInt(2)
    ),
    executeAgentWithSecurity(
      nftAgent,
      {
        alchemyApiKey: 'your-alchemy-api-key',
        network: 'alfajores',
        maxRiskScore: 50
      },
      BigInt(3)
    )
  ]);

  console.log('Donation Agent Result:', donationResult);
  console.log('NFT Agent Result:', nftResult);
}

// Run the advanced example
advancedAgentsExample().catch(console.error);
