const mongoose = require('mongoose');
const MetaGroup = require('../models/MetaGroup');
const MetaItem = require('../models/MetaItem');
const ContentBlock = require('../models/ContentBlock');

// Mock data from the original meta.js file
const mockData = {
  groups: [
    { key: 'search_reasons', label: 'Search Reasons', description: 'Reasons for searching handles', sort_order: 1 },
    { key: 'relationship_types', label: 'Relationship Types', description: 'Types of relationships', sort_order: 2 },
    { key: 'timeframes', label: 'Timeframes', description: 'Time periods for interactions', sort_order: 3 },
    { key: 'flag_categories_red', label: 'Red Flag Categories', description: 'Categories for red flags', sort_order: 4 },
    { key: 'flag_categories_green', label: 'Green Flag Categories', description: 'Categories for green flags', sort_order: 5 }
  ],
  items: [
    // Search reasons
    { group_key: 'search_reasons', key: 'date', label: 'Going on a date', icon: '👀', sort_order: 1 },
    { group_key: 'search_reasons', key: 'shaadi', label: 'Shaadi', icon: '💍', sort_order: 2 },
    { group_key: 'search_reasons', key: 'fwb', label: 'Friends with Benefits', icon: '🔥', sort_order: 3 },
    { group_key: 'search_reasons', key: 'buying', label: 'Buying from them', icon: '🛍️', sort_order: 4 },
    { group_key: 'search_reasons', key: 'work', label: 'Work collab', icon: '💼', sort_order: 5 },
    { group_key: 'search_reasons', key: 'curious', label: 'Just curious', icon: '🤝', sort_order: 6 },
    
    // Relationship types
    { group_key: 'relationship_types', key: 'dated', label: 'Dated', icon: '💔', weight: 5, sort_order: 1 },
    { group_key: 'relationship_types', key: 'date', label: 'Went on a date', icon: '☕', weight: 4, sort_order: 2 },
    { group_key: 'relationship_types', key: 'online', label: 'Followed online', icon: '📱', weight: 2, sort_order: 3 },
    { group_key: 'relationship_types', key: 'met', label: 'Met in person', icon: '🤝', weight: 3, sort_order: 4 },
    { group_key: 'relationship_types', key: 'college', label: 'College / school', icon: '🏫', weight: 4, sort_order: 5 },
    { group_key: 'relationship_types', key: 'work', label: 'Work / business', icon: '💼', weight: 3, sort_order: 6 },
    { group_key: 'relationship_types', key: 'bought', label: 'Bought / sold', icon: '🛍️', weight: 3, sort_order: 7 },
    { group_key: 'relationship_types', key: 'heard', label: 'Heard through people', icon: '👂', weight: 1, sort_order: 8 },
    
    // Timeframes
    { group_key: 'timeframes', key: 'week', label: 'This week', sort_order: 1 },
    { group_key: 'timeframes', key: 'month', label: 'This month', sort_order: 2 },
    { group_key: 'timeframes', key: 'months', label: '1–6 months ago', sort_order: 3 },
    { group_key: 'timeframes', key: 'year', label: 'Over a year ago', sort_order: 4 },
    
    // Red flag categories
    { group_key: 'flag_categories_red', key: 'cat1', label: 'Disrespectful', sort_order: 1 },
    { group_key: 'flag_categories_red', key: 'cat2', label: 'Unreliable', sort_order: 2 },
    { group_key: 'flag_categories_red', key: 'cat3', label: 'Dishonest', sort_order: 3 },
    { group_key: 'flag_categories_red', key: 'cat4', label: 'Aggressive', sort_order: 4 },
    { group_key: 'flag_categories_red', key: 'cat5', label: 'Manipulative', sort_order: 5 },
    { group_key: 'flag_categories_red', key: 'cat6', label: 'Flaky', sort_order: 6 },
    { group_key: 'flag_categories_red', key: 'cat7', label: 'Controlling', sort_order: 7 },
    { group_key: 'flag_categories_red', key: 'cat8', label: 'Selfish', sort_order: 8 },
    
    // Green flag categories
    { group_key: 'flag_categories_green', key: 'cat1', label: 'Trustworthy', sort_order: 1 },
    { group_key: 'flag_categories_green', key: 'cat2', label: 'Kind', sort_order: 2 },
    { group_key: 'flag_categories_green', key: 'cat3', label: 'Reliable', sort_order: 3 },
    { group_key: 'flag_categories_green', key: 'cat4', label: 'Professional', sort_order: 4 },
    { group_key: 'flag_categories_green', key: 'cat5', label: 'Respectful', sort_order: 5 },
    { group_key: 'flag_categories_green', key: 'cat6', label: 'Good communicator', sort_order: 6 },
    { group_key: 'flag_categories_green', key: 'cat7', label: 'Supportive', sort_order: 7 },
    { group_key: 'flag_categories_green', key: 'cat8', label: 'Generous', sort_order: 8 }
  ],
  contentBlocks: [
    { page: 'search', block_key: 'search_why_prefix', content: 'You searched because:', label: 'Search Why Prefix' },
    { page: 'search', block_key: 'search_why_change', content: 'change', label: 'Search Why Change' },
    { page: 'search', block_key: 'watch_handle', content: '👁 Watch handle', label: 'Watch Handle' },
    { page: 'search', block_key: 'watching_handle', content: '👁 Watching', label: 'Watching Handle' },
    { page: 'search', block_key: 'red_flag_cta', content: '🚩 Red flag', label: 'Red Flag CTA' },
    { page: 'search', block_key: 'green_flag_cta', content: '🟢 Green flag', label: 'Green Flag CTA' },
    { page: 'search', block_key: 'vibe_score_label', content: 'Vibe score', label: 'Vibe Score Label' },
    { page: 'search', block_key: 'proceed_caution', content: 'Proceed with caution 🚩', label: 'Proceed Caution' },
    { page: 'search', block_key: 'looking_good', content: 'Looking good 🟢', label: 'Looking Good' },
    { page: 'search', block_key: 'mixed_signals', content: 'Mixed signals 🟡', label: 'Mixed Signals' },
    { page: 'search', block_key: 'weighted_subtitle', content: 'Weighted by relationship depth.', label: 'Weighted Subtitle' },
    { page: 'search', block_key: 'pattern_detected_title', content: 'Community pattern detected', label: 'Pattern Detected Title' },
    { page: 'search', block_key: 'searched_this_week', content: 'people searched this handle this week', label: 'Searched This Week' },
    { page: 'search', block_key: 'all_flags_tab', content: 'All flags', label: 'All Flags Tab' },
    { page: 'search', block_key: 'red_flags_tab', content: '🚩 Red', label: 'Red Flags Tab' },
    { page: 'search', block_key: 'green_flags_tab', content: '🟢 Green', label: 'Green Flags Tab' },
    { page: 'search', block_key: 'both_sides_tab', content: '⚖️ Both sides', label: 'Both Sides Tab' },
    { page: 'search', block_key: 'me_profile_tab', content: '👤 Me profile', label: 'Me Profile Tab' },
    { page: 'search', block_key: 'drop_red_flag', content: '🚩 Drop a red flag', label: 'Drop Red Flag' },
    { page: 'search', block_key: 'drop_green_flag', content: '🟢 Drop a green flag', label: 'Drop Green Flag' },
    { page: 'search', block_key: 'how_do_you_know_them', content: 'How do you know them?', label: 'How Do You Know Them' },
    { page: 'search', block_key: 'when_was_this', content: 'When was this?', label: 'When Was This' },
    { page: 'search', block_key: 'select_category', content: 'Select a category...', label: 'Select Category' },
    { page: 'search', block_key: 'optional_comment_placeholder', content: 'Share your experience... what happened? (optional, max 300 chars)', label: 'Comment Placeholder' },
    { page: 'search', block_key: 'post_anonymously', content: 'Post anonymously', label: 'Post Anonymously' },
    { page: 'search', block_key: 'cancel', content: 'Cancel', label: 'Cancel' },
    { page: 'search', block_key: 'post_red_flag', content: 'Post red flag →', label: 'Post Red Flag' },
    { page: 'search', block_key: 'post_green_flag', content: 'Post green flag →', label: 'Post Green Flag' },
    { page: 'search', block_key: 'flag_disclaimer', content: '⚖️ By posting you confirm this is your genuine personal experience and you take full legal responsibility for this content.', label: 'Flag Disclaimer' },
    { page: 'search', block_key: 'add_reply', content: '+ Add your reply to this flag', label: 'Add Reply' },
    { page: 'search', block_key: 'add_reply_once', content: '+ Add your reply to this flag (you get one)', label: 'Add Reply Once' },
    { page: 'search', block_key: 'your_reply', content: 'Your reply', label: 'Your Reply' },
    { page: 'search', block_key: 'their_reply', content: 'Their reply', label: 'Their Reply' },
    { page: 'search', block_key: 'add_perspective_btn', content: 'Add your perspective', label: 'Add Perspective Button' },
    { page: 'search', block_key: 'their_perspective_title', content: '⚖️ Their perspective', label: 'Their Perspective Title' },
    { page: 'search', block_key: 'self_submitted', content: 'Self submitted', label: 'Self Submitted' },
    { page: 'search', block_key: 'me_profile_title', content: '👤 says', label: 'Me Profile Title' },
    { page: 'search', block_key: 'self_aware', content: 'Self aware', label: 'Self Aware' },
    { page: 'search', block_key: 'share_card_btn', content: '🎴 Share this handle\'s card', label: 'Share Card Button' },
    { page: 'search', block_key: 'report_handle', content: '🛡️ Report this handle', label: 'Report Handle' },
    { page: 'search', block_key: 'people_also_searched', content: '👀 People also searched', label: 'People Also Searched' },
    { page: 'search', block_key: 'flag_requests_title', content: '🙋 Flag requests', label: 'Flag Requests Title' },
    { page: 'search', block_key: 'post_flag_request', content: '+ Post a flag request', label: 'Post Flag Request' },
    { page: 'search', block_key: 'claim_profile_title', content: '🔔 Is this your handle?', label: 'Claim Profile Title' },
    { page: 'search', block_key: 'claim_profile_body', content: 'Sign up to see who searched you, add your perspective, and post one reply to each flag.', label: 'Claim Profile Body' },
    { page: 'search', block_key: 'claim_profile_cta', content: 'Claim your profile →', label: 'Claim Profile CTA' },
    { page: 'search', block_key: 'no_flags_title', content: 'No flags yet', label: 'No Flags Title' },
    { page: 'search', block_key: 'no_flags_sub', content: 'Nobody has posted for this handle yet.', label: 'No Flags Sub' }
  ]
};

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB');

    // Clear existing data
    await MetaGroup.deleteMany({});
    await MetaItem.deleteMany({});
    await ContentBlock.deleteMany({});
    console.log('Cleared existing data');

    // Insert groups
    const groups = await MetaGroup.insertMany(mockData.groups);
    console.log(`Inserted ${groups.length} groups`);

    // Insert items
    const items = await MetaItem.insertMany(mockData.items);
    console.log(`Inserted ${items.length} items`);

    // Insert content blocks
    const contentBlocks = await ContentBlock.insertMany(mockData.contentBlocks);
    console.log(`Inserted ${contentBlocks.length} content blocks`);

    console.log('Database seeded successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
