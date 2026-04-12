// Setup test data for user22
const mongoose = require('mongoose');

async function setupUser22Data() {
  try {
    await mongoose.connect('mongodb://localhost:27017/clocked');
    console.log('Connected to MongoDB database');

    const userId = '69da2da74a12797ccd9d49ec';
    
    // Claim a handle for user22
    const handles = mongoose.connection.db.collection('handles');
    
    // Find an unclaimed handle
    const unclaimedHandle = await handles.findOne({ claimed_by_user_id: null });
    
    if (unclaimedHandle) {
      console.log('Claiming handle for user22:', unclaimedHandle.instagram_handle);
      
      await handles.updateOne(
        { _id: unclaimedHandle._id },
        { 
          $set: { 
            claimed_by_user_id: userId,
            claimed_at: new Date()
          }
        }
      );
      
      console.log('Handle claimed successfully!');
    } else {
      console.log('No unclaimed handles found');
    }

    // Add some watches for user22
    const watches = mongoose.connection.db.collection('watches');
    
    // Get some handles to watch
    const handlesToWatch = await handles.find({}).limit(3).toArray();
    
    for (const handle of handlesToWatch) {
      // Don't watch the user's own claimed handle
      if (handle.claimed_by_user_id?.toString() !== userId) {
        const existingWatch = await watches.findOne({
          user_id: userId,
          handle_id: handle._id
        });
        
        if (!existingWatch) {
          await watches.insertOne({
            user_id: userId,
            handle_id: handle._id,
            created_at: new Date()
          });
          
          console.log('Added watch for handle:', handle.instagram_handle);
        }
      }
    }

    // Add some flags for this week
    const flags = mongoose.connection.db.collection('flags');
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    
    // Get user22's claimed handle
    const userHandle = await handles.findOne({ claimed_by_user_id: userId });
    
    if (userHandle) {
      // Add some flags for user22's handle
      for (let i = 0; i < 5; i++) {
        await flags.insertOne({
          handle_id: userHandle._id,
          handle_instagram_handle: userHandle.instagram_handle,
          flag_type: Math.random() > 0.5 ? 'red' : 'green',
          created_at: new Date(weekStart.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          created_by: new mongoose.Types.ObjectId(),
          text: `Test flag ${i + 1} for ${userHandle.instagram_handle}`
        });
      }
      
      console.log('Added 5 flags for user22\'s handle');
    }

    // Add some community flags
    const allHandles = await handles.find({}).limit(5).toArray();
    
    for (const handle of allHandles) {
      for (let i = 0; i < 3; i++) {
        await flags.insertOne({
          handle_id: handle._id,
          handle_instagram_handle: handle.instagram_handle,
          flag_type: Math.random() > 0.5 ? 'red' : 'green',
          created_at: new Date(weekStart.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          created_by: new mongoose.Types.ObjectId(),
          text: `Community flag ${i + 1} for ${handle.instagram_handle}`
        });
      }
    }
    
    console.log('Added community flags for trending data');

    // Show summary
    console.log('\n=== User22 Data Summary ===');
    
    const userHandleAgain = await handles.findOne({ claimed_by_user_id: userId });
    console.log('Claimed handle:', userHandleAgain ? userHandleAgain.instagram_handle : 'None');
    
    const userWatches = await watches.find({ user_id: userId }).toArray();
    console.log('Watches:', userWatches.length);
    
    const userFlags = await flags.find({ 
      handle_id: userHandleAgain?._id,
      created_at: { $gte: weekStart }
    }).toArray();
    console.log('Flags this week:', userFlags.length);
    
    const communityFlags = await flags.find({ 
      created_at: { $gte: weekStart }
    }).toArray();
    console.log('Community flags this week:', communityFlags.length);

    await mongoose.disconnect();
    console.log('\nUser22 data setup complete!');

  } catch (error) {
    console.error('Setup error:', error.message);
  }
}

setupUser22Data();
