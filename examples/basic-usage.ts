import { 
  createCeloAgent, 
  analyzeTransactionSecurity, 
  mintNFT,
  executeSecureTransaction,
  getTokenBalance,
  sendCELO
} from '@celo-ai-agents/core';

async function basicUsageExample() {
  // Initialize Celo agent
  const agent = createCeloAgent({
    privateKey: '0x...', // Your private key
    network: 'alfajores',
    alchemyApiKey: 'your-alchemy-api-key'
  });

  // Get token balance
  const balance = await getTokenBalance(
    agent,
    '0x...', // Address to check
    '0x765DE816845861e75A25fCA122bb6898B8B1282a' // cUSD token address
  );
  console.log('cUSD Balance:', balance);

  // Analyze transaction security
  const security = await analyzeTransactionSecurity({
    alchemyApiKey: 'your-alchemy-api-key',
    network: 'alfajores'
  }, '0x...', BigInt('1000000000000000000')); // 1 CELO

  console.log('Security Analysis:', {
    isSecure: security.isSecure,
    riskScore: security.riskScore,
    warnings: security.warnings
  });

  // Send CELO securely
  if (security.isSecure) {
    const result = await executeSecureTransaction(
      agent,
      {
        alchemyApiKey: 'your-alchemy-api-key',
        network: 'alfajores',
        maxRiskScore: 50
      },
      {
        to: '0x...',
        value: BigInt('1000000000000000000'),
        data: '0x'
      }
    );

    console.log('Transaction Result:', result);
  }

  // Mint NFT
  const nftResult = await mintNFT(
    agent,
    {
      alchemyApiKey: 'your-alchemy-api-key',
      network: 'alfajores'
    },
    {
      contractAddress: '0x...', // NFT contract address
      recipient: '0x...',
      metadata: {
        name: 'My First NFT',
        description: 'A test NFT minted with Celo AI Agents',
        image: 'https://example.com/image.png',
        attributes: [
          { trait_type: 'Type', value: 'Test' },
          { trait_type: 'Rarity', value: 'Common' }
        ]
      }
    }
  );

  console.log('NFT Mint Result:', nftResult);
}

// Run the example
basicUsageExample().catch(console.error);
