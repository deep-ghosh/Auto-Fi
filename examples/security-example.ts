import { 
  createCeloAgent,
  analyzeTransactionSecurity,
  executeSecureTransaction,
  validateTransaction,
  isAddressSafe,
  getSecurityRecommendations
} from '@celo-ai-agents/core';

async function securityExample() {
  const agent = createCeloAgent({
    privateKey: '0x...',
    network: 'alfajores',
    alchemyApiKey: 'your-alchemy-api-key'
  });

  const securityConfig = {
    alchemyApiKey: 'your-alchemy-api-key',
    network: 'alfajores' as const,
    maxRiskScore: 30, // Very strict
    requireApproval: true,
    enableSimulation: true
  };

  // Check if an address is safe
  const addressSafety = await isAddressSafe(
    securityConfig,
    '0x...' // Address to check
  );

  console.log('Address Safety:', addressSafety);

  // Analyze transaction security
  const securityAnalysis = await analyzeTransactionSecurity(
    securityConfig,
    '0x...', // Recipient address
    BigInt('5000000000000000000'), // 5 CELO
    '0x' // No data
  );

  console.log('Security Analysis:', {
    isSecure: securityAnalysis.isSecure,
    riskScore: securityAnalysis.riskScore,
    warnings: securityAnalysis.warnings,
    recommendations: securityAnalysis.recommendations
  });

  // Get security recommendations
  const recommendations = await getSecurityRecommendations(
    securityConfig,
    '0x...',
    BigInt('1000000000000000000'),
    '0x'
  );

  console.log('Security Recommendations:', recommendations);

  // Validate transaction before execution
  const validation = await validateTransaction(securityConfig, {
    to: '0x...',
    value: BigInt('1000000000000000000'),
    data: '0x'
  });

  console.log('Transaction Validation:', validation);

  // Execute secure transaction
  if (validation.isValid) {
    const result = await executeSecureTransaction(
      agent,
      securityConfig,
      {
        to: '0x...',
        value: BigInt('1000000000000000000'),
        data: '0x'
      }
    );

    console.log('Secure Transaction Result:', result);
  } else {
    console.log('Transaction rejected due to security concerns');
  }
}

// Run security example
securityExample().catch(console.error);
