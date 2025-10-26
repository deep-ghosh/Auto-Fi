/**
 * Test script for blockchain API integration
 * Tests real-time transaction tracking and backend API calls
 */

import fetch from 'node-fetch';
import WebSocket from 'ws';

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001/ws';

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    console.log(`✅ PASSED: ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

async function testHealthCheck() {
  const response = await fetch(`${BASE_URL}/health`);
  const data = await response.json();
  
  if (!data.status || data.status !== 'healthy') {
    throw new Error('Health check failed');
  }
  console.log('   Status:', data.status);
}

async function testBlockchainFunctions() {
  const response = await fetch(`${BASE_URL}/api/functions`);
  const data = await response.json();
  
  if (!data.success || !data.blockchainFunctions) {
    throw new Error('Failed to get blockchain functions');
  }
  console.log(`   Available functions: ${data.blockchainFunctions.length}`);
}

async function testSendTransaction() {
  const response = await fetch(`${BASE_URL}/api/blockchain/send-transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      value: '1000000000000000000',
      from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
    })
  });
  
  const data = await response.json();
  if (!data.success || !data.data.txHash) {
    throw new Error('Failed to send transaction');
  }
  
  console.log(`   Transaction Hash: ${data.data.txHash}`);
  console.log(`   Status: ${data.data.status}`);
  console.log(`   Real Transaction: ${data.data.realTransaction}`);
  
  return data.data.txHash;
}

async function testGetTransactionStatus(txHash) {
  const response = await fetch(`${BASE_URL}/api/blockchain/transaction/${txHash}`);
  const data = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error('Failed to get transaction status');
  }
  
  console.log(`   Transaction Status: ${data.data.status}`);
  console.log(`   Confirmations: ${data.data.confirmations}`);
}

async function testTransactionHistory() {
  const response = await fetch(`${BASE_URL}/api/blockchain/transactions/default?limit=10`);
  const data = await response.json();
  
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Failed to get transaction history');
  }
  
  console.log(`   Transactions in tracker: ${data.data.length}`);
}

async function testTransactionHistoryDB() {
  const response = await fetch(`${BASE_URL}/api/blockchain/transaction-history?limit=10`);
  const data = await response.json();
  
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Failed to get transaction history from DB');
  }
  
  console.log(`   Transactions in database: ${data.count}`);
  if (data.data.length > 0) {
    const tx = data.data[0];
    console.log(`   Latest TX: ${tx.tx_hash.substring(0, 10)}...`);
    console.log(`   Status: ${tx.status}`);
    console.log(`   Type: ${tx.type}`);
  }
}

async function testTransactionStats() {
  const response = await fetch(`${BASE_URL}/api/blockchain/transactions/stats`);
  const data = await response.json();
  
  if (!data.success || !data.data) {
    throw new Error('Failed to get transaction stats');
  }
  
  console.log(`   Total in Tracker: ${data.data.total}`);
  console.log(`   Pending: ${data.data.pending}`);
  console.log(`   Success: ${data.data.success}`);
  console.log(`   Failed: ${data.data.failed}`);
  console.log(`   Total in Database: ${data.data.totalInDatabase}`);
  console.log(`   Real Transactions: ${data.data.realTransactions}`);
}

async function testPendingTransactions() {
  const response = await fetch(`${BASE_URL}/api/blockchain/transactions/pending`);
  const data = await response.json();
  
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Failed to get pending transactions');
  }
  
  console.log(`   Pending transactions: ${data.data.length}`);
}

async function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let messageReceived = false;
    
    ws.on('open', () => {
      console.log('   WebSocket connected');
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log(`   Message received: ${message.type}`);
      messageReceived = true;
      ws.close();
    });
    
    ws.on('close', () => {
      if (messageReceived) {
        resolve();
      } else {
        reject(new Error('No message received from WebSocket'));
      }
    });
    
    ws.on('error', (error) => {
      reject(error);
    });
    
    setTimeout(() => {
      if (!messageReceived) {
        ws.close();
        reject(new Error('WebSocket timeout'));
      }
    }, 5000);
  });
}

async function testRealTimeTransactionTracking() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let transactionUpdates = 0;
    
    ws.on('open', () => {
      console.log('   WebSocket connected for transaction tracking');
      
      // Send a transaction
      fetch(`${BASE_URL}/api/blockchain/send-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          value: '1000000000000000000'
        })
      }).catch(reject);
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.type === 'transaction_update') {
        transactionUpdates++;
        console.log(`   Transaction update received: ${message.payload.status}`);
      }
    });
    
    ws.on('close', () => {
      if (transactionUpdates > 0) {
        resolve();
      } else {
        reject(new Error('No transaction updates received'));
      }
    });
    
    ws.on('error', reject);
    
    setTimeout(() => {
      ws.close();
    }, 15000);
  });
}

async function runTests() {
  console.log('🚀 Starting Blockchain API Integration Tests\n');
  console.log('='.repeat(50));
  
  await test('Health Check', testHealthCheck);
  await test('Get Blockchain Functions', testBlockchainFunctions);
  await test('Send Transaction', async () => {
    const txHash = await testSendTransaction();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testGetTransactionStatus(txHash);
  });
  await test('Get Transaction History (Tracker)', testTransactionHistory);
  await test('Get Transaction History (Database)', testTransactionHistoryDB);
  await test('Get Transaction Statistics', testTransactionStats);
  await test('Get Pending Transactions', testPendingTransactions);
  await test('WebSocket Connection', testWebSocketConnection);
  await test('Real-time Transaction Tracking', testRealTimeTransactionTracking);
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📈 Total: ${testsPassed + testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});

