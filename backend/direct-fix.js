// Direct MongoDB fix for admin account
const mongoose = require('mongoose');

async function directFix() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://agarwalprateek666_db_user:dZEKHNbL7tHfC5eJ@cluster0.ucnkfcc.mongodb.net/clocked');
    console.log('✅ Connected to MongoDB');

    // Get database connection
    const db = mongoose.connection.db;
    
    // Direct update using MongoDB driver
    const result = await db.collection('admin_users').updateOne(
      { email: 'admin@clocked.in' },
      { 
        $set: { 
          is_active: true,
          updated_at: new Date()
        }
      }
    );

    console.log(`📊 Update result: ${result.modifiedCount} documents modified`);

    // Verify the fix
    const admin = await db.collection('admin_users').findOne({ email: 'admin@clocked.in' });
    
    if (admin) {
      console.log('\n👤 Admin Account Status:');
      console.log(`📧 Email: ${admin.email}`);
      console.log(`📛 Name: ${admin.name}`);
      console.log(`🟢 Active: ${admin.is_active ? 'YES' : 'NO'}`);
      console.log(`🔑 Role ID: ${admin.role_id}`);
      
      if (admin.is_active) {
        console.log('\n🎉 SUCCESS: Admin account is now ACTIVE!');
      } else {
        console.log('\n❌ FAILED: Admin account is still inactive');
      }
    } else {
      console.log('\n❌ Admin account not found!');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

directFix();
