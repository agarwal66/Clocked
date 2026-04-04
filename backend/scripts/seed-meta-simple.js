const mongoose = require('mongoose');
require('dotenv').config();

async function seedMetaSimple() {
  try {
    console.log('🚀 Running Meta Seed (Simple Version)...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const now = new Date();
    
    console.log('\n📁 Creating and seeding meta collections...');
    
    // 1. META GROUPS
    try {
      await db.collection('app_meta_groups').drop();
    } catch (e) {}
    await db.createCollection('app_meta_groups');
    
    const metaGroups = [
      { key: "navigation", label: "Navigation", description: "Sidebar and mobile tabs", active: true, sort_order: 1, created_at: now, updated_at: now },
      { key: "search_reasons", label: "Search Reasons", description: "Reasons shown during search", active: true, sort_order: 2, created_at: now, updated_at: now },
      { key: "relationship_types", label: "Relationship Types", description: "Used while posting flags", active: true, sort_order: 3, created_at: now, updated_at: now },
      { key: "timeframes", label: "Timeframes", description: "How recent the experience was", active: true, sort_order: 4, created_at: now, updated_at: now },
      { key: "flag_categories_red", label: "Red Flag Categories", description: "User facing red flag labels", active: true, sort_order: 5, created_at: now, updated_at: now },
      { key: "flag_categories_green", label: "Green Flag Categories", description: "User facing green flag labels", active: true, sort_order: 6, created_at: now, updated_at: now },
    ];
    
    for (const group of metaGroups) {
      await db.collection('app_meta_groups').updateOne(
        { key: group.key },
        { $set: group },
        { upsert: true }
      );
    }
    console.log(`✓ seeded ${metaGroups.length} meta groups`);
    
    // 2. META ITEMS
    try {
      await db.collection('app_meta_items').drop();
    } catch (e) {}
    await db.createCollection('app_meta_items');
    
    const metaItems = [
      // Navigation
      { group_key: "navigation", key: "overview", label: "Overview", short_label: "Home", description: "Dashboard overview", icon: "⚡", color_token: "black", route: "/dashboard", parent_key: null, sort_order: 1, active: true, editable: true, system_key: true, visible_mobile: true, visible_desktop: true, metadata: { section_key: "overview" }, created_at: now, updated_at: now },
      { group_key: "navigation", key: "notifications", label: "Notifications", short_label: "Alerts", description: "User notifications", icon: "🔔", color_token: "red", route: "/dashboard?tab=notifications", parent_key: null, sort_order: 2, active: true, editable: true, system_key: true, visible_mobile: true, visible_desktop: true, metadata: { section_key: "notifications" }, created_at: now, updated_at: now },
      { group_key: "navigation", key: "my-flags", label: "My flags", short_label: "My flags", description: "Flags on me and posted by me", icon: "🚩", color_token: "red", route: "/dashboard?tab=my-flags", parent_key: null, sort_order: 3, active: true, editable: true, system_key: true, visible_mobile: true, visible_desktop: true, metadata: { section_key: "my-flags" }, created_at: now, updated_at: now },
      { group_key: "navigation", key: "watching", label: "Watching", short_label: "Watching", description: "Watched handles", icon: "👁", color_token: "green", route: "/dashboard?tab=watching", parent_key: null, sort_order: 4, active: true, editable: true, system_key: true, visible_mobile: true, visible_desktop: true, metadata: { section_key: "watching" }, created_at: now, updated_at: now },
      { group_key: "navigation", key: "settings", label: "Settings", short_label: "Settings", description: "Account settings", icon: "⚙️", color_token: "black", route: "/dashboard?tab=settings", parent_key: null, sort_order: 5, active: true, editable: true, system_key: true, visible_mobile: false, visible_desktop: true, metadata: { section_key: "settings" }, created_at: now, updated_at: now },
      
      // Search reasons
      { group_key: "search_reasons", key: "date", label: "Going on a date", short_label: "Date", description: "Reason selected before meeting someone romantically", icon: "👀", color_token: "amber", route: null, parent_key: null, sort_order: 1, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "date" }, created_at: now, updated_at: now },
      { group_key: "search_reasons", key: "shaadi", label: "Shaadi", short_label: "Shaadi", description: "Reason selected for marriage / arranged setup", icon: "💍", color_token: "amber", route: null, parent_key: null, sort_order: 2, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "shaadi" }, created_at: now, updated_at: now },
      { group_key: "search_reasons", key: "fwb", label: "Friends with Benefits", short_label: "FWB", description: "Reason selected for informal relationship context", icon: "🔥", color_token: "amber", route: null, parent_key: null, sort_order: 3, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "fwb" }, created_at: now, updated_at: now },
      { group_key: "search_reasons", key: "buying", label: "Buying from them", short_label: "Buying", description: "Reason selected before buying a product or service", icon: "🛍️", color_token: "amber", route: null, parent_key: null, sort_order: 4, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "buying" }, created_at: now, updated_at: now },
      { group_key: "search_reasons", key: "work", label: "Work collab", short_label: "Work", description: "Reason selected before business collaboration", icon: "💼", color_token: "amber", route: null, parent_key: null, sort_order: 5, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "work" }, created_at: now, updated_at: now },
      { group_key: "search_reasons", key: "curious", label: "Just curious", short_label: "Curious", description: "Used for passive or casual search intent", icon: "🤝", color_token: "amber", route: null, parent_key: null, sort_order: 6, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { analytics_key: "curious" }, created_at: now, updated_at: now },
      
      // Relationship types
      { group_key: "relationship_types", key: "dated", label: "Dated", short_label: "Dated", description: "Serious romantic involvement", icon: "💔", color_token: "red", route: null, parent_key: null, sort_order: 1, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 5 }, created_at: now, updated_at: now },
      { group_key: "relationship_types", key: "shaadi", label: "Shaadi / arranged intro", short_label: "Shaadi", description: "Marriage / arranged introduction", icon: "💍", color_token: "amber", route: null, parent_key: null, sort_order: 2, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 5 }, created_at: now, updated_at: now },
      { group_key: "relationship_types", key: "fwb", label: "Friends with Benefits", short_label: "FWB", description: "Informal physical relationship", icon: "🔥", color_token: "red", route: null, parent_key: null, sort_order: 3, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 4 }, created_at: now, updated_at: now },
      { group_key: "relationship_types", key: "date", label: "Went on a date", short_label: "Date", description: "Met romantically on one or more dates", icon: "☕", color_token: "amber", route: null, parent_key: null, sort_order: 4, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 4 }, created_at: now, updated_at: now },
      { group_key: "relationship_types", key: "family", label: "Family connection", short_label: "Family", description: "Known through family", icon: "👨‍👩‍👧", color_token: "black", route: null, parent_key: null, sort_order: 5, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 4 }, created_at: now, updated_at: now },
      { group_key: "relationship_types", key: "college", label: "College / school", short_label: "College", description: "Known from school or college", icon: "🏫", color_token: "black", route: null, parent_key: null, sort_order: 6, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 4 }, created_at: now, updated_at: now },
      { group_key: "relationship_types", key: "work", label: "Work / business", short_label: "Work", description: "Professional interaction", icon: "💼", color_token: "black", route: null, parent_key: null, sort_order: 7, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 3 }, created_at: now, updated_at: now },
      { group_key: "relationship_types", key: "online", label: "Followed online only", short_label: "Online", description: "Only online or social media interaction", icon: "📱", color_token: "black", route: null, parent_key: null, sort_order: 8, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 2 }, created_at: now, updated_at: now },
      { group_key: "relationship_types", key: "heard", label: "Heard through people", short_label: "Heard", description: "Indirect hearsay only", icon: "👂", color_token: "red", route: null, parent_key: null, sort_order: 9, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: { credibility_weight: 1 }, created_at: now, updated_at: now },
      
      // Timeframes
      { group_key: "timeframes", key: "week", label: "This week", short_label: "Week", description: "Very recent experience", icon: "🗓️", color_token: "green", route: null, parent_key: null, sort_order: 1, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: now, updated_at: now },
      { group_key: "timeframes", key: "month", label: "This month", short_label: "Month", description: "Recent experience within current month", icon: "🗓️", color_token: "green", route: null, parent_key: null, sort_order: 2, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: now, updated_at: now },
      { group_key: "timeframes", key: "months", label: "1–6 months ago", short_label: "1–6 months", description: "Experience within last 6 months", icon: "🗓️", color_token: "amber", route: null, parent_key: null, sort_order: 3, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: now, updated_at: now },
      { group_key: "timeframes", key: "year", label: "Over a year ago", short_label: "1y+", description: "Old experience", icon: "🗓️", color_token: "red", route: null, parent_key: null, sort_order: 4, active: true, editable: true, system_key: true, visible_mobile: null, visible_desktop: null, metadata: null, created_at: now, updated_at: now },
    ];
    
    for (const item of metaItems) {
      await db.collection('app_meta_items').updateOne(
        { group_key: item.group_key, key: item.key },
        { $set: item },
        { upsert: true }
      );
    }
    console.log(`✓ seeded ${metaItems.length} meta items`);
    
    // 3. CONTENT BLOCKS
    try {
      await db.collection('app_content_blocks').drop();
    } catch (e) {}
    await db.createCollection('app_content_blocks');
    
    const contentBlocks = [
      { page: "dashboard", block_key: "overview_title", label: "Overview title", content: "Good morning, @{{username}} 👋", content_type: "text", description: "Main greeting on dashboard", active: true, metadata: null, created_at: now, updated_at: now },
      { page: "dashboard", block_key: "overview_subtitle", label: "Overview subtitle", content: "Here's what happened while you were away.", content_type: "text", description: "Subtitle below greeting", active: true, metadata: null, created_at: now, updated_at: now },
      { page: "dashboard", block_key: "search_banner_title", label: "Search banner title", content: "{{count}} people searched your handle this week", content_type: "text", description: "Headline on overview search banner", active: true, metadata: null, created_at: now, updated_at: now },
      { page: "dashboard", block_key: "search_banner_cta", label: "Search banner CTA", content: "See details →", content_type: "text", description: "CTA for search banner", active: true, metadata: null, created_at: now, updated_at: now },
      { page: "dashboard", block_key: "vibe_eyebrow", label: "Vibe eyebrow", content: "Your vibe score", content_type: "text", description: "Label above vibe score card", active: true, metadata: null, created_at: now, updated_at: now },
      { page: "dashboard", block_key: "my_flags_subtitle", label: "My flags subtitle", content: "Flags on your handle · flags you've posted", content_type: "text", description: "Subtitle on my flags screen", active: true, metadata: null, created_at: now, updated_at: now },
      { page: "dashboard", block_key: "watching_subtitle", label: "Watching subtitle", content: "{{count}} handles · notified when new flags drop", content_type: "text", description: "Subtitle on watching screen", active: true, metadata: null, created_at: now, updated_at: now },
      { page: "dashboard", block_key: "me_profile_subtitle", label: "Me profile subtitle", content: "Your voluntary self-introduction — visible on your handle's search page", content_type: "text", description: "Subtitle on me profile screen", active: true, metadata: null, created_at: now, updated_at: now },
      { page: "dashboard", block_key: "settings_subtitle", label: "Settings subtitle", content: "Manage your account and preferences", content_type: "text", description: "Subtitle on settings screen", active: true, metadata: null, created_at: now, updated_at: now },
    ];
    
    for (const block of contentBlocks) {
      await db.collection('app_content_blocks').updateOne(
        { page: block.page, block_key: block.block_key },
        { $set: block },
        { upsert: true }
      );
    }
    console.log(`✓ seeded ${contentBlocks.length} content blocks`);
    
    console.log('\n✅ Meta seed completed successfully!');
    console.log('🎉 Your database now has all meta/config data with correct timestamps.');
    console.log('\n📊 Summary:');
    console.log(`   - Meta Groups: ${metaGroups.length}`);
    console.log(`   - Meta Items: ${metaItems.length}`);
    console.log(`   - Content Blocks: ${contentBlocks.length}`);
    console.log(`   - All timestamps: ${now.toISOString()}`);
    
    console.log('\n📋 Next steps:');
    console.log('   1. Test meta: npm run test-meta');
    console.log('   2. Keep backend running: npm run dev');
    console.log('   3. Start frontend: cd ../frontend && npm start');
    
  } catch (error) {
    console.error('❌ Meta seed failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check MONGODB_URI in .env file');
    console.log('   2. Make sure MongoDB is accessible');
  } finally {
    await mongoose.disconnect();
  }
}

seedMetaSimple();
