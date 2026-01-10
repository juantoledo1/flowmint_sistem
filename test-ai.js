// Test script to check AI status
const axios = require('axios');

async function testAIStatus() {
  try {
    // First, login to get token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      user: 'admin',
      pass: 'admin123'
    });
    
    const token = loginResponse.data.access_token;
    console.log('Token obtained:', token.substring(0, 20) + '...');
    
    // Then, check AI status
    const aiStatusResponse = await axios.get('http://localhost:3000/api/ai/status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('AI Status:', JSON.stringify(aiStatusResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAIStatus();