const mongoose = require('mongoose');
require('dotenv').config();

async function testMeta() {
  try {
    console.log('🔍 Testing Meta Configuration...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const metaCollections = collections.filter(c => 
      c.name.startsWith('app_meta') || c.name.startsWith('app_content') || c.name.startsWith('app_notification') || c.name.startsWith('app_dashboard') || c.name.startsWith('app_settings')
    );
    
    console.log('\n📁 Meta Collections Found:');
    metaCollections.forEach(c => console.log(`   ✓ ${c.name}`));
    
    // Test meta groups
    const metaGroups = await mongoose.connection.db.collection('app_meta_groups').find({}).toArray();
    console.log(`\n🎯 Meta Groups (${metaGroups.length}):`);
    metaGroups.forEach(g => console.log(`   - ${g.key}: ${g.label}`));
    
    // Test meta items
    const metaItems = await mongoose.connection.db.collection('app_meta_items').find({}).toArray();
    console.log(`\n📋 Meta Items (${metaItems.length}):`);
    const itemsByGroup = {};
    metaItems.forEach(item => {
      if (!itemsByGroup[item.group_key]) itemsByGroup[item.group_key] = [];
      itemsByGroup[item.group_key].push(item);
    });
    Object.keys(itemsByGroup).forEach(group => {
      console.log(`   ${group}: ${itemsByGroup[group].length} items`);
      itemsByGroup[group].slice(0, 3).forEach(item => {
        console.log(`     - ${item.key}: ${item.label} ${item.icon || ''}`);
      });
    });
    
    // Test content blocks
    const contentBlocks = await mongoose.connection.db.collection('app_content_blocks').find({}).toArray();
    console.log(`\n📝 Content Blocks (${contentBlocks.length}):`);
    contentBlocks.forEach(block => {
      console.log(`   - ${block.page}.${block.block_key}: ${block.content.substring(0, 50)}...`);
    });
    
    console.log('\n✅ Meta Test Complete!');
    console.log('🎉 Your meta configuration is working properly.');
    
  } catch (error) {
    console.error('❌ Meta Test Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Run: npm run seed-meta');
    console.log('   2. Check MongoDB connection in .env');
    console.log('   3. Verify mongosh is installed');
  } finally {
    await mongoose.disconnect();
  }
}

testMeta();
