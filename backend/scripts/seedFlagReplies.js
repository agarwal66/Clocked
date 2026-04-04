const mongoose = require('mongoose');
const FlagReply = require('../models/FlagReply');
const Handle = require('../models/Handle');
const User = require('../models/User');
const Flag = require('../models/Flag');

// Load environment variables
require('dotenv').config();

// Sample flag reply data
const flagReplies = [
  {
    flag_id: 'flag_69cbaca10a70bcf41cff0f5d',
    content: 'I completely disagree with this flag. The person described here is actually very kind and helpful. I think this is a personal attack.',
    reply_type: 'poster_reply',
    severity_score: 15,
    toxicity_score: 25,
    handle_id: null, // Will be populated
    handle_username: 'sarahsmith',
    author_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false,
    report_count: 0
  },
  {
    flag_id: 'flag_69cbaca10a70bcf41cff0f5e',
    content: 'This is absolutely true. I worked with this person and they were always unreliable and missed deadlines.',
    reply_type: 'both_sides',
    severity_score: 75,
    toxicity_score: 15,
    handle_id: null,
    handle_username: 'mike_wilson',
    author_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false,
    report_count: 0
  },
  {
    flag_id: 'flag_69cbaca10a70bcf41cff0f60',
    content: 'This flag seems exaggerated. While there might be some truth to it, the severity described here seems overblown.',
    reply_type: 'comment',
    severity_score: 45,
    toxicity_score: 10,
    handle_id: null,
    handle_username: 'alex_kumar',
    author_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false,
    report_count: 1
  },
  {
    flag_id: 'flag_69cbaca10a70bcf41cff0f5f',
    content: 'I can confirm this is accurate. This person made inappropriate jokes in front of everyone.',
    reply_type: 'poster_reply',
    severity_score: 85,
    toxicity_score: 20,
    handle_id: null,
    handle_username: 'johndoe',
    author_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false,
    report_count: 0
  },
  {
    flag_id: 'flag_69cbaca10a70bcf41cff0f5d',
    content: 'As the person being flagged, I want to clarify that this was taken out of context. The situation was complicated.',
    reply_type: 'handle_owner_reply',
    severity_score: 30,
    toxicity_score: 5,
    handle_id: null,
    handle_username: 'rohanverma__',
    author_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false,
    report_count: 0
  },
  {
    flag_id: 'flag_69cbaca10a70bcf41cff0f61',
    content: 'This person is actually very reliable and trustworthy. I can vouch for their character.',
    reply_type: 'comment',
    severity_score: 10,
    toxicity_score: 5,
    handle_id: null,
    handle_username: 'emily_chen',
    author_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false,
    report_count: 0
  },
  {
    flag_id: 'flag_69cbaca10a70bcf41cff0f62',
    content: 'I think this flag is unfair. The person has been very respectful in my experience.',
    reply_type: 'comment',
    severity_score: 20,
    toxicity_score: 15,
    handle_id: null,
    handle_username: 'lisa_anderson',
    author_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false,
    report_count: 2
  },
  {
    flag_id: 'flag_69cbaca10a70bcf41cff0f5d',
    content: 'This is completely false. I know this person personally and they are very reliable.',
    reply_type: 'poster_reply',
    severity_score: 25,
    toxicity_score: 30,
    handle_id: null,
    handle_username: 'sarahsmith',
    author_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false,
    report_count: 1
  },
  {
    flag_id: 'flag_69cbaca10a70bcf41cff0f60',
    content: 'I have evidence that supports this flag. The person was indeed unreliable.',
    reply_type: 'both_sides',
    severity_score: 65,
    toxicity_score: 10,
    handle_id: null,
    handle_username: 'alex_kumar',
    author_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: false,
    sensitive: false,
    report_count: 0
  },
  {
    flag_id: 'flag_69cbaca10a70bcf41cff0f5e',
    content: 'I was present when this happened. The comments were indeed inappropriate.',
    reply_type: 'poster_reply',
    severity_score: 90,
    toxicity_score: 25,
    handle_id: null,
    handle_username: 'mike_wilson',
    author_username: 'anonymous',
    identity: 'anonymous',
    disclaimers: ['No disclaimers provided'],
    legal_risk: true,
    sensitive: false,
    report_count: 0
  }
];

async function seedFlagReplies() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.name);
    
    // Get existing handles and flags to link replies to
    const handles = await Handle.find({}).lean();
    const flags = await Flag.find({}).lean();
    console.log('Found handles:', handles.length);
    console.log('Found flags:', flags.length);
    
    // Clear existing replies (optional - comment out if you want to keep existing data)
    await FlagReply.deleteMany({});
    console.log('Cleared existing flag replies');
    
    // Link replies to handles and flags
    const repliesWithLinks = flagReplies.map((reply, index) => {
      const handle = handles[index % handles.length];
      const flag = flags.find(f => f._id === reply.flag_id);
      
      return {
        ...reply,
        handle_id: handle._id,
        handle_username: handle.instagram_handle,
        flag_status: flag?.status || 'pending',
        flag_comment: flag?.comment || '',
        flag_content: flag?.comment || ''
      };
    });
    
    console.log('Linked replies to handles and flags');
    
    // Insert new replies
    const insertedReplies = await FlagReply.insertMany(repliesWithLinks);
    console.log(`Inserted ${insertedReplies.length} flag replies`);
    
    console.log('Flag replies seeded successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding flag replies:', error);
    process.exit(1);
  }
}

// Run the seed function
seedFlagReplies();
