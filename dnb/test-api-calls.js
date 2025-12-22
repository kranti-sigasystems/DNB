// Test the actual API calls that the frontend makes
const jwt = require('jsonwebtoken');

// Create a test token (you'll need to replace this with your actual business owner ID)
const testPayload = {
  businessOwnerId: '07f6592d-ce5c-4fec-a6da-86f8321950e2', // From the output above
  id: '07f6592d-ce5c-4fec-a6da-86f8321950e2',
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
};

const testToken = jwt.sign(testPayload, 'test-secret');

// Import the server actions
async function testAPIs() {
  try {
    // Import after setting up the token
    const { getProducts, getLocations } = require('./src/actions/buyer.actions.ts');
    const productsResult = await getProducts(testToken, 0, 100);
    
    const locationsResult = await getLocations(testToken, 0, 100);
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
  }
}

testAPIs();