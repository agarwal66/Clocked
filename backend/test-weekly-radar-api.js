// Test weekly radar API endpoint
const mongoose = require('mongoose');

async function testWeeklyRadarAPI() {
  try {
    await mongoose.connect('mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB database');

    // Simulate API call logic
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    const weekNumber = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / 604800000);
    const weekString = `${now.getFullYear()}-W${weekNumber}`;
    
    console.log('Week info:', weekString);
    console.log('Week range:', weekStart.toISOString(), 'to', weekEnd.toISOString());

    // Test user22 (ID: 69da2da74a12797ccd9d49ec)
    const userId = '69da2da74a12797ccd9d49ec';
    console.log('\nTesting for user22 (ID: ' + userId + ')');

    // Find user's claimed handle
    const userHandleDoc = await mongoose.connection.db.collection('handles')
      .findOne({ claimed_by_user_id: userId });
    
    console.log('User handle found:', !!userHandleDoc);
    if (userHandleDoc) {
      console.log('User handle:', userHandleDoc.instagram_handle);
      
      // Get user's stats for this week
      const userFlags = await mongoose.connection.db.collection('flags')
        .find({ 
          handle_id: userHandleDoc._id,
          created_at: { $gte: weekStart, $lte: weekEnd }
        })
        .toArray();
      
      console.log('User flags this week:', userFlags.length);
      console.log('Red flags:', userFlags.filter(f => f.flag_type === 'red').length);
      console.log('Green flags:', userFlags.filter(f => f.flag_type === 'green').length);
    }

    // Get user's watch list
    const userWatches = await mongoose.connection.db.collection('watches')
      .find({ user_id: userId })
      .toArray();
    
    console.log('User watches:', userWatches.length);
    userWatches.forEach((watch, i) => {
      console.log(`  ${i + 1}. Watch ID: ${watch._id}, Handle ID: ${watch.handle_id}`);
    });

    // Get watch details
    if (userWatches.length > 0) {
      const watchHandles = await Promise.all(
        userWatches.map(async (watchItem) => {
          const handle = await mongoose.connection.db.collection('handles')
            .findOne({ _id: watchItem.handle_id });
          
          if (handle) {
            // Get flag counts for this handle
            const handleFlags = await mongoose.connection.db.collection('flags')
              .find({ handle_id: handle._id })
              .toArray();
            
            const redCount = handleFlags.filter(f => f.flag_type === 'red').length;
            const greenCount = handleFlags.filter(f => f.flag_type === 'green').length;
            const lastFlag = handleFlags.length > 0 ? 
              new Date(Math.max(...handleFlags.map(f => new Date(f.created_at)))) : null;
            
            return {
              handle: handle.instagram_handle,
              meta: redCount > greenCount ? "High Risk" : "Stable",
              red: redCount,
              green: greenCount,
              lastFlag: lastFlag ? formatRelativeTime(lastFlag) : "No flags"
            };
          }
          return null;
        })
      );
      
      const watch = watchHandles.filter(item => item !== null);
      console.log('\nWatch details:');
      watch.forEach((item, i) => {
        console.log(`  ${i + 1}. @${item.handle} - ${item.meta} (${item.red} red, ${item.green} green)`);
      });
    }

    // Get community stats
    const allFlags = await mongoose.connection.db.collection('flags')
      .find({ created_at: { $gte: weekStart, $lte: weekEnd } })
      .toArray();
    
    console.log('\nCommunity stats:');
    console.log('Total flags this week:', allFlags.length);
    console.log('Red flags:', allFlags.filter(f => f.flag_type === 'red').length);
    console.log('Green flags:', allFlags.filter(f => f.flag_type === 'green').length);

    // Get top flags
    const flagCounts = {};
    allFlags.forEach(flag => {
      const key = flag.handle_instagram_handle || flag.handle_username;
      flagCounts[key] = (flagCounts[key] || 0) + 1;
    });
    
    const topFlags = Object.entries(flagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([handle, count]) => ({
        handle,
        category: 'Trending',
        views: count * 100
      }));
    
    console.log('\nTop flags:');
    topFlags.forEach((item, i) => {
      console.log(`  ${i + 1}. @${item.handle} - ${item.views} views`);
    });

    await mongoose.disconnect();
    console.log('\nWeekly radar API test complete!');

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

testWeeklyRadarAPI();
