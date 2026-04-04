#!/usr/bin/env node

/**
 * CLOCKED Database Setup Script (Mongoose Version)
 * 
 * This script sets up the MongoDB database using Mongoose
 * when mongosh is not available. It creates the basic structure
 * needed for the backend to work.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Clocked database (Mongoose version)...');
console.log('='.repeat(50));

// Get the MongoDB URI from environment
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked';
console.log(`📍 MongoDB URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

async function setupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check if collections already exist
    const collections = await db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} existing collections:`);
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Create basic indexes for the users collection
    console.log('');
    console.log('🔧 Setting up indexes...');
    
    try {
      // Users collection indexes
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('users').createIndex({ username: 1 }, { unique: true });
      await db.collection('users').createIndex({ instagram_handle: 1 }, { unique: true, sparse: true });
      await db.collection('users').createIndex({ verify_token: 1 }, { sparse: true });
      await db.collection('users').createIndex({ reset_token: 1 }, { sparse: true });
      await db.collection('users').createIndex({ invite_code: 1 }, { unique: true });
      console.log('✅ Users collection indexes created');
    } catch (error) {
      console.log('⚠️ Users indexes may already exist:', error.message);
    }

    try {
      // Handles collection indexes
      await db.collection('handles').createIndex({ instagram_handle: 1 }, { unique: true });
      await db.collection('handles').createIndex({ "stats.vibe_score": -1 }, { sparse: true });
      await db.collection('handles').createIndex({ claimed_by_user_id: 1 }, { sparse: true });
      console.log('✅ Handles collection indexes created');
    } catch (error) {
      console.log('⚠️ Handles indexes may already exist:', error.message);
    }

    try {
      // Flags collection indexes
      await db.collection('flags').createIndex({ handle_id: 1 });
      await db.collection('flags').createIndex({ posted_by: 1 });
      await db.collection('flags').createIndex({ flag_type: 1 });
      await db.collection('flags').createIndex({ created_at: -1 });
      console.log('✅ Flags collection indexes created');
    } catch (error) {
      console.log('⚠️ Flags indexes may already exist:', error.message);
    }

    console.log('');
    console.log('🎉 Database setup completed!');
    console.log('');
    console.log('📊 Ready collections:');
    console.log('   - users (authentication & profiles)');
    console.log('   - handles (Instagram handles)');
    console.log('   - flags (red/green flags)');
    console.log('');
    console.log('💡 For complete schema with all collections:');
    console.log('   1. Install MongoDB Compass or mongosh');
    console.log('   2. Run: mongosh "' + mongoUri + '" --file clocked_mongo.js');
    console.log('');
    console.log('🚀 You can now start the backend server:');
    console.log('   npm run dev');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Database setup error:', error);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('1. Make sure MongoDB is running');
    console.error('2. Check your MONGODB_URI in .env file');
    console.error('3. Ensure network connectivity to MongoDB');
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

setupDatabase();
