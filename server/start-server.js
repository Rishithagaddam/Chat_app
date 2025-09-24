const { app, server } = require('./server.js');
const axios = require('axios');

// Test database connection and server health
const testServerHealth = async () => {
  try {
    console.log('\n🔍 Testing server health...');
    
    // Wait a moment for server to fully start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await axios.get('http://localhost:5000/health');
    console.log('✅ Server health check passed:', response.data.message);
    
    // Test database connection by attempting to load User model
    const User = require('./models/User');
    await User.countDocuments();
    console.log('✅ Database connection verified');
    
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure MongoDB is running and accessible');
    }
  }
};

// Run health check after server starts
setTimeout(testServerHealth, 3000);