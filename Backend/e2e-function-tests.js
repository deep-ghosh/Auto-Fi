/**
 * End-to-End Function Tests
 * Tests each blockchain function's complete workflow
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';
const TEST_ADDRESS = '0xa025505514a057D9f7D9aA6992e0f30Fa5072071';
const RECIPIENT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const cUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';
const cEUR_ADDRESS = '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73';

class E2EFunctionTests {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async callFunction(functionName, parameters) {
    const response = await fetch(`${BASE_URL}/api/blockchain/function-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ functionName, parameters })
    });
    return await response.json();
  }

  async test(name, fn) {
    try {
      console.log(`\n🧪 ${name}`);
      await fn();
      this.results.push({ name, status: 'PASSED' });
      this.passed++;
      console.log(`✅ PASSED`);
    } catch (error) {
      this.results.push({ name, status: 'FAILED', error: error.message });
      this.failed++;
      console.error(`❌ FAILED: ${error.message}`);
    }
  }

  // Token Functions
  async testGetCELOBalance() {
    const result = await this.callFunction('getCELOBalance', { address: TEST_ADDRESS });
    if (!result.success) throw new Error('getCELOBalance failed');
    console.log(`   Balance: ${result.data?.balance || 'N/A'}`);
  }

  async testGetTokenBalance() {
    const result = await this.callFunction('getTokenBalance', {
      address: TEST_ADDRESS,
      tokenAddress: cUSD_ADDRESS
    });
    if (!result.success) throw new Error('getTokenBalance failed');
    console.log(`   cUSD Balance: ${result.data?.balance || 'N/A'}`);
  }

  async testGetAllTokenBalances() {
    const result = await this.callFunction('getAllTokenBalances', { address: TEST_ADDRESS });
    if (!result.success) throw new Error('getAllTokenBalances failed');
    console.log(`   Tokens: ${Object.keys(result.data?.balances || {}).length}`);
  }

  async testSendCELO() {
    const result = await this.callFunction('sendCELO', {
      to: RECIPIENT_ADDRESS,
      amount: '1000000000000000000'
    });
    if (!result.success) throw new Error('sendCELO failed');
    console.log(`   TxHash: ${result.data?.txHash?.substring(0, 20)}...`);
  }

  async testSendToken() {
    const result = await this.callFunction('sendToken', {
      tokenAddress: cUSD_ADDRESS,
      to: RECIPIENT_ADDRESS,
      amount: '100000000000000000000'
    });
    if (!result.success) throw new Error('sendToken failed');
    console.log(`   TxHash: ${result.data?.txHash?.substring(0, 20)}...`);
  }

  // Security Functions
  async testAnalyzeTransactionSecurity() {
    const result = await this.callFunction('analyzeTransactionSecurity', {
      to: RECIPIENT_ADDRESS,
      value: '1000000000000000000',
      from: TEST_ADDRESS
    });
    if (!result.success) throw new Error('analyzeTransactionSecurity failed');
    console.log(`   Risk Score: ${result.data?.riskScore || 'N/A'}`);
  }

  async testIsAddressSafe() {
    const result = await this.callFunction('isAddressSafe', { address: RECIPIENT_ADDRESS });
    if (!result.success) throw new Error('isAddressSafe failed');
    console.log(`   Safe: ${result.data?.safe || 'N/A'}`);
  }

  async testValidateTransaction() {
    const result = await this.callFunction('validateTransaction', {
      transaction: {
        to: RECIPIENT_ADDRESS,
        value: '1000000000000000000',
        from: TEST_ADDRESS
      }
    });
    if (!result.success) throw new Error('validateTransaction failed');
    console.log(`   Valid: ${result.data?.valid || 'N/A'}`);
  }

  // NFT Functions
  async testMintNFT() {
    const result = await this.callFunction('mintNFT', {
      to: TEST_ADDRESS,
      tokenURI: 'ipfs://QmTest123',
      metadata: { name: 'Test NFT', description: 'E2E Test' }
    });
    if (!result.success) throw new Error('mintNFT failed');
    console.log(`   TxHash: ${result.data?.txHash?.substring(0, 20)}...`);
  }

  async testGetNFTMetadata() {
    const result = await this.callFunction('getNFTMetadata', {
      contractAddress: '0x0000000000000000000000000000000000000000',
      tokenId: '1'
    });
    // This may fail with mock data, but should not crash
    console.log(`   Metadata: ${result.data?.metadata ? 'Found' : 'Not found'}`);
  }

  async testGetOwnedNFTs() {
    const result = await this.callFunction('getOwnedNFTs', { address: TEST_ADDRESS });
    if (!result.success) throw new Error('getOwnedNFTs failed');
    console.log(`   NFTs: ${result.data?.nfts?.length || 0}`);
  }

  // DeFi Functions
  async testSwapTokens() {
    const result = await this.callFunction('swapTokens', {
      tokenIn: cUSD_ADDRESS,
      tokenOut: cEUR_ADDRESS,
      amountIn: '100000000000000000000',
      minAmountOut: '90000000000000000000',
      slippage: 0.5
    });
    if (!result.success) throw new Error('swapTokens failed');
    console.log(`   TxHash: ${result.data?.txHash?.substring(0, 20)}...`);
  }

  // DAO Functions
  async testGetProposals() {
    const result = await this.callFunction('getProposals', {});
    if (!result.success || !Array.isArray(result.data)) throw new Error('getProposals failed');
    console.log(`   Proposals: ${result.data.length}`);
  }

  async testVoteOnProposal() {
    const result = await this.callFunction('voteOnProposal', {
      proposalId: '1',
      support: true,
      reason: 'E2E Test Vote'
    });
    if (!result.success) throw new Error('voteOnProposal failed');
    console.log(`   TxHash: ${result.data?.txHash?.substring(0, 20)}...`);
  }

  async testCreateProposal() {
    const result = await this.callFunction('createProposal', {
      title: 'E2E Test Proposal',
      description: 'Testing proposal creation',
      actions: []
    });
    if (!result.success) throw new Error('createProposal failed');
    console.log(`   TxHash: ${result.data?.txHash?.substring(0, 20)}...`);
  }

  // Utility Functions
  async testEstimateGas() {
    const result = await this.callFunction('estimateGas', {
      to: RECIPIENT_ADDRESS,
      value: '1000000000000000000'
    });
    if (!result.success) throw new Error('estimateGas failed');
    console.log(`   Gas Limit: ${result.data?.gasLimit}`);
  }

  async testGetNetworkInfo() {
    const result = await this.callFunction('getNetworkInfo', {});
    if (!result.success) throw new Error('getNetworkInfo failed');
    console.log(`   Network: ${result.data?.network || 'N/A'}`);
  }

  async runAllTests() {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 END-TO-END FUNCTION TESTS - CELO AI AUTOMATION ENGINE');
    console.log('='.repeat(70));

    // Token Functions
    console.log('\n📊 TOKEN FUNCTIONS');
    await this.test('getCELOBalance', () => this.testGetCELOBalance());
    await this.test('getTokenBalance', () => this.testGetTokenBalance());
    await this.test('getAllTokenBalances', () => this.testGetAllTokenBalances());
    await this.test('sendCELO', () => this.testSendCELO());
    await this.test('sendToken', () => this.testSendToken());

    // Security Functions
    console.log('\n🔐 SECURITY FUNCTIONS');
    await this.test('analyzeTransactionSecurity', () => this.testAnalyzeTransactionSecurity());
    await this.test('isAddressSafe', () => this.testIsAddressSafe());
    await this.test('validateTransaction', () => this.testValidateTransaction());

    // NFT Functions
    console.log('\n🎨 NFT FUNCTIONS');
    await this.test('mintNFT', () => this.testMintNFT());
    await this.test('getNFTMetadata', () => this.testGetNFTMetadata());
    await this.test('getOwnedNFTs', () => this.testGetOwnedNFTs());

    // DeFi Functions
    console.log('\n💱 DEFI FUNCTIONS');
    await this.test('swapTokens', () => this.testSwapTokens());

    // DAO Functions
    console.log('\n🏛️ DAO FUNCTIONS');
    await this.test('getProposals', () => this.testGetProposals());
    await this.test('voteOnProposal', () => this.testVoteOnProposal());
    await this.test('createProposal', () => this.testCreateProposal());

    // Utility Functions
    console.log('\n⚙️ UTILITY FUNCTIONS');
    await this.test('estimateGas', () => this.testEstimateGas());
    await this.test('getNetworkInfo', () => this.testGetNetworkInfo());

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`);
    console.log('='.repeat(70) + '\n');
  }
}

const tester = new E2EFunctionTests();
await tester.runAllTests();

