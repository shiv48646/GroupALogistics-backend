const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const user = await User.findOne({ email: 'rahul.sharma0@test.com' }).select('+password');
    
    if (user) {
      console.log('✅ User found:');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('IsActive:', user.isActive);
      console.log('Password (hashed):', user.password.substring(0, 30) + '...');
      console.log('Password length:', user.password.length);
      
      // Test password comparison
      const isMatch = await user.comparePassword('Test@123');
      console.log('\n🔐 Password "Test@123" matches:', isMatch);
      
      // Test wrong password
      const wrongMatch = await user.comparePassword('WrongPassword');
      console.log('🔐 Password "WrongPassword" matches:', wrongMatch);
    } else {
      console.log('❌ User not found with email: rahul.sharma0@test.com');
      
      // List all test users
      const allUsers = await User.find({ email: /@test\.com$/ }).limit(5);
      console.log('\n📋 Sample test users in database:');
      allUsers.forEach(u => {
        console.log(`  - ${u.name} (${u.email})`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();
