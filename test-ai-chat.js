// Test script to check AI chat functionality
const axios = require('axios');

async function testAIChat() {
  try {
    // First, login to get token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      user: 'admin',
      pass: 'admin123'
    });
    
    const token = loginResponse.data.access_token;
    console.log('Token obtained');
    
    // Test AI chat
    const aiResponse = await axios.post('http://localhost:3000/api/ai/chat', {
      message: 'Hola, ¿cómo estás?'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('AI Response:', aiResponse.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAIChat();