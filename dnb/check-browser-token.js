// This script helps you check what token is stored in your browser
// Run this in your browser's console (F12 -> Console tab) while on the dashboard page

console.log('🔍 Checking browser authentication state...');

// Check sessionStorage
const authToken = sessionStorage.getItem('authToken');
const user = sessionStorage.getItem('user');

console.log('📱 SessionStorage authToken:', authToken);
console.log('👤 SessionStorage user:', user);

if (authToken) {
  // Decode the JWT token (basic decode, not verification)
  try {
    const base64Url = authToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const decoded = JSON.parse(jsonPayload);
    console.log('🔓 Decoded JWT token:', decoded);
    
    if (decoded.businessOwnerId) {
      console.log('✅ businessOwnerId found in token:', decoded.businessOwnerId);
    } else {
      console.log('❌ businessOwnerId NOT found in token');
    }
    
    if (decoded.userRole) {
      console.log('✅ userRole found in token:', decoded.userRole);
    } else {
      console.log('❌ userRole NOT found in token');
    }
    
  } catch (error) {
    console.log('❌ Error decoding token:', error);
  }
} else {
  console.log('❌ No authToken found in sessionStorage');
}

// Check cookies as well
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=');
  acc[key] = value;
  return acc;
}, {});

console.log('🍪 Cookies:', cookies);

if (cookies.authToken) {
  console.log('🍪 Found authToken in cookies');
} else {
  console.log('❌ No authToken found in cookies');
}

// Instructions
console.log('\n📝 Instructions:');
console.log('1. If no authToken is found, you need to login again');
console.log('2. If authToken exists but no businessOwnerId, there\'s a token creation issue');
console.log('3. If businessOwnerId exists, the issue is in the server-side data fetching');
console.log('\n🔗 To login with test account:');
console.log('Email: business@test.com');
console.log('Password: password123');