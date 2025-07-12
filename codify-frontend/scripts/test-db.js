#!/usr/bin/env node

// Database connection test script
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/codify';
  
  console.log('🔍 Testing MongoDB connection...');
  console.log('📍 Connection string:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    console.log('✅ MongoDB connection successful!');
    
    // Test if replica set is available
    const admin = client.db().admin();
    try {
      const status = await admin.command({ replSetGetStatus: 1 });
      console.log('✅ Replica set is configured');
      console.log('📊 Replica set name:', status.set);
    } catch (err) {
      console.log('⚠️  Replica set not configured - this will cause Prisma transaction issues');
      console.log('💡 Consider using MongoDB Atlas for easier setup');
    }
    
    await client.close();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n🔧 Solutions:');
    console.log('1. Set up MongoDB Atlas (recommended): https://cloud.mongodb.com/');
    console.log('2. Start local MongoDB with replica set (see MONGODB_SETUP.md)');
    console.log('3. Check if MongoDB service is running');
  }
}

testConnection();
