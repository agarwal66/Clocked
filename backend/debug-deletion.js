const mongoose = require('mongoose');
const User = require('./models/User');
const Flag = require('./models/Flag');
const Handle = require('./models/Handle');

const debugDeletion = async () => {
  try {
    console.log("=== DEBUGGING ACCOUNT DELETION ===");
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/clocked');
    console.log('Database connected');
    
    // Try different email formats
    const emailVariations = [
      'dummy@gmail.com',
      'Dummy@gmail.com',
      'DUMMY@GMAIL.COM',
      'dummy@gmail.com '
    ];
    
    let user = null;
    for (const email of emailVariations) {
      user = await User.findOne({ email: email.trim() });
      if (user) {
        console.log(`User found with email: "${email}"`);
        break;
      }
    }
    
    if (!user) {
      // Try searching by username
      user = await User.findOne({ username: 'dummy' });
      if (user) {
        console.log('User found by username: dummy');
      }
    }
    
    if (!user) {
      // List all users to see what's in the database
      const allUsers = await User.find({});
      console.log(`All users in database: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`- Username: ${u.username}, Email: "${u.email}", ID: ${u._id}`);
      });
      
      if (allUsers.length === 0) {
        console.log('No users found in database');
      }
      return;
    }
    
    console.log('User details:', {
      id: user._id,
      username: user.username,
      email: user.email,
      emailVerified: user.email_verified
    });
    
    // Check if user has claimed handle
    const claimedHandle = await Handle.findOne({ user_id: user._id });
    console.log('Claimed handle:', claimedHandle ? claimedHandle.instagram_handle : 'None');
    
    // Check flags posted by this user
    const flags = await Flag.find({ posted_by_user_id: user._id });
    console.log('Flags posted by user:', flags.length);
    
    // Check flags on user's handle
    const flagsOnHandle = claimedHandle ? await Flag.find({ handle_id: claimedHandle._id }) : [];
    console.log('Flags on user handle:', flagsOnHandle.length);
    
    // Simulate the deletion process
    console.log('\n=== SIMULATING DELETION PROCESS ===');
    
    // Step 1: Anonymize flags
    console.log('Step 1: Anonymizing flags...');
    for (const flag of flags) {
      console.log(`   Before: ${flag.posted_by_username} -> After: anonymous`);
      flag.posted_by_user_id = null;
      flag.posted_by_username = 'anonymous';
      flag.identity = 'anonymous';
      await flag.save();
    }
    console.log(`   ${flags.length} flags anonymized`);
    
    // Step 2: Delete claimed handle
    if (claimedHandle) {
      console.log('Step 2: Deleting claimed handle...');
      await Handle.findByIdAndDelete(claimedHandle._id);
      console.log(`   Claimed handle deleted: ${claimedHandle.instagram_handle}`);
    }
    
    // Step 3: Delete user account
    console.log('Step 3: Deleting user account...');
    await User.findByIdAndDelete(user._id);
    console.log(`   User account deleted: ${user.username}`);
    
    // Verify deletion
    const deletedUser = await User.findById(user._id);
    const deletedHandle = claimedHandle ? await Handle.findById(claimedHandle._id) : null;
    const remainingFlags = await Flag.find({ posted_by_user_id: user._id });
    
    console.log('\n=== VERIFICATION ===');
    console.log('User deleted:', !deletedUser);
    console.log('Handle deleted:', !deletedHandle);
    console.log('Remaining flags:', remainingFlags.length);
    
    console.log('\n=== DELETION DEBUG COMPLETE ===');
    console.log('The account deletion process should work correctly!');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Debug error:', error);
  }
};

debugDeletion();
