// Test script to verify API is working
const fetch = require('node-fetch');

async function testAPI() {
  console.log('🧪 Testing Celo AI Agents API...');
  
  try {
    // Test health endpoint
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    
    // Test contracts endpoint
    console.log('\n2️⃣ Testing contracts endpoint...');
    const contractsResponse = await fetch('http://localhost:3000/api/v1/contracts/network-info?network=alfajores&privateKey=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    const contractsData = await contractsResponse.json();
    console.log('✅ Network info:', contractsData.data.name);
    
    // Test agents endpoint
    console.log('\n3️⃣ Testing agents endpoint...');
    const agentsResponse = await fetch('http://localhost:3000/api/v1/agents/list');
    const agentsData = await agentsResponse.json();
    console.log('✅ Agents list:', agentsData.data.total, 'agents');
    
    console.log('\n🎉 API is working correctly!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('Make sure the API server is running on http://localhost:3000');
  }
}

testAPI();
