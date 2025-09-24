const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  phoneNumber: '+1234567890',
  password: 'testpassword123'
};

const testAuth = async () => {
  console.log('\n🧪 Starting Authentication Tests...\n');
  
  try {
    // Test server health
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Server is healthy:', healthResponse.data.message);
    
    // Test registration
    console.log('\n2️⃣ Testing user registration...');
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      console.log('✅ Registration successful:', registerResponse.data.message);
      console.log('   Token received:', !!registerResponse.data.token);
      console.log('   User data:', registerResponse.data.user.email);
    } catch (regError) {
      if (regError.response?.status === 400 && regError.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ User already exists, skipping registration');
      } else {
        console.error('❌ Registration failed:', regError.response?.data?.message || regError.message);
        return;
      }
    }
    
    // Test login
    console.log('\n3️⃣ Testing user login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      emailOrPhone: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('   Token received:', !!loginResponse.data.token);
    console.log('   User data:', loginResponse.data.user.email);
    
    // Test login with uppercase email
    console.log('\n4️⃣ Testing login with uppercase email...');
    const uppercaseLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      emailOrPhone: testUser.email.toUpperCase(),
      password: testUser.password
    });
    console.log('✅ Uppercase email login successful');
    
    // Test wrong password
    console.log('\n5️⃣ Testing wrong password...');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        emailOrPhone: testUser.email,
        password: 'wrongpassword'
      });
    } catch (wrongPassError) {
      console.log('✅ Wrong password correctly rejected:', wrongPassError.response?.data?.message);
    }
    
    // Test non-existent user
    console.log('\n6️⃣ Testing non-existent user...');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        emailOrPhone: 'nonexistent@example.com',
        password: 'somepassword'
      });
    } catch (notFoundError) {
      console.log('✅ Non-existent user correctly rejected:', notFoundError.response?.data?.message);
    }
    
    console.log('\n🎉 All authentication tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the server is running on port 5000');
    }
  }
};

// Run tests if server is available
const runTests = async () => {
  console.log('Waiting for server to start...');
  
  // Wait for server to be available
  let attempts = 0;
  while (attempts < 10) {
    try {
      await axios.get('http://localhost:5000/health');
      break;
    } catch (error) {
      attempts++;
      console.log(`Server not ready, attempt ${attempts}/10...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (attempts === 10) {
    console.error('❌ Server did not start within expected time');
    return;
  }
  
  await testAuth();
};

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { testAuth };