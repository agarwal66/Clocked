const mongoose = require('mongoose');
const Flag = require('../models/Flag');
const Handle = require('../models/Handle');
const User = require('../models/User');

// Load environment variables
require('dotenv').config();

// Sample flag data
const flags = [
  {
    flag_type: 'red',
    category_id: 'cat1',
    category_name: 'Disrespectful',
    comment: 'Made offensive jokes about my appearance and personality in a public setting',
    relationship: 'stranger',
    timeframe: 'last_week',
    severity_score: 85,
    credibility_score: 25,
    handle_id: null, // Will be populated after handles are created
    handle_username: 'rohanverma__',
    handle_instagram_handle: 'rohanverma__',
    posted_by_user_id: null, // Will be populated when users exist
    posted_by_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false
  },
  {
    flag_type: 'red',
    category_id: 'cat2',
    category_name: 'Unreliable',
    comment: 'Promised to deliver work but never did, missed multiple deadlines',
    relationship: 'colleague',
    timeframe: 'last_month',
    severity_score: 72,
    credibility_score: 35,
    handle_id: null,
    handle_username: 'sarahsmith',
    handle_instagram_handle: 'sarahsmith',
    posted_by_user_id: null,
    posted_by_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false
  },
  {
    flag_type: 'green',
    category_id: 'cat1',
    category_name: 'Disrespectful',
    comment: 'Actually very respectful and professional, but someone flagged them for personal reasons',
    relationship: 'friend',
    timeframe: 'last_week',
    severity_score: 15,
    credibility_score: 85,
    handle_id: null,
    handle_username: 'johndoe',
    handle_instagram_handle: 'johndoe',
    posted_by_user_id: null,
    posted_by_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false
  },
  {
    flag_type: 'red',
    category_id: 'cat3',
    category_name: 'Dishonest',
    comment: 'Lied about their qualifications and experience on their resume',
    relationship: 'stranger',
    timeframe: 'last_year',
    severity_score: 95,
    credibility_score: 10,
    handle_id: null,
    handle_username: 'mike_wilson',
    handle_instagram_handle: 'mike_wilson',
    posted_by_user_id: null,
    posted_by_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: true,
    sensitive: false
  },
  {
    flag_type: 'green',
    category_id: 'cat2',
    category_name: 'Unreliable',
    comment: 'Actually turned out to be very reliable and trustworthy',
    relationship: 'acquaintance',
    timeframe: 'last_6_months',
    severity_score: 25,
    credibility_score: 92,
    handle_id: null,
    handle_username: 'alex_kumar',
    handle_instagram_handle: 'alex_kumar',
    posted_by_user_id: null,
    posted_by_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false
  },
  {
    flag_type: 'green',
    category_id: 'cat1',
    category_name: 'Disrespectful',
    comment: 'Very kind and supportive, helped me through a difficult situation',
    relationship: 'friend',
    timeframe: 'last_week',
    severity_score: 8,
    credibility_score: 95,
    handle_id: null,
    handle_username: 'emily_chen',
    handle_instagram_handle: 'emily_chen',
    posted_by_user_id: null,
    posted_by_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false
  },
  {
    flag_type: 'red',
    category_id: 'cat1',
    category_name: 'Disrespectful',
    comment: 'Used inappropriate language in a professional setting',
    relationship: 'colleague',
    timeframe: 'last_week',
    severity_score: 78,
    credibility_score: 45,
    handle_id: null,
    handle_username: 'lisa_anderson',
    handle_instagram_handle: 'lisa_anderson',
    posted_by_user_id: null,
    posted_by_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false
  }
];

async function seedFlags() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.name);
    
    // Get existing handles to link flags to
    const handles = await Handle.find({}).lean();
    console.log('Found handles:', handles.length);
    
    // Clear existing flags (optional - comment out if you want to keep existing data)
    await Flag.deleteMany({});
    console.log('Cleared existing flags');
    
    // Link flags to handles
    const flagsWithHandles = flags.map((flag, index) => {
      if (index < handles.length) {
        return {
          ...flag,
          handle_id: handles[index]._id,
          handle_username: handles[index].instagram_handle,
          handle_instagram_handle: handles[index].instagram_handle,
        };
      }
      return flag;
    });
    
    console.log('Linked flags to handles');
    
    // Insert new flags
    const insertedFlags = await Flag.insertMany(flagsWithHandles);
    console.log(`Inserted ${insertedFlags.length} flags`);
    
    console.log('Flags seeded successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding flags:', error);
    process.exit(1);
  }
}

// Run the seed function
seedFlags();
