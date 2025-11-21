const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB Atlas connection...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Connection details:');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Test query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📁 Collections found: ${collections.length}`);
    collections.forEach(col => {
      console.log(`   • ${col.name}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
