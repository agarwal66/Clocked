const mongoose = require('mongoose');
const AdminUser = require('./models/AdminUser');

async function fixAdminAccount() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://agarwalprateek666_db_user:dZEKHNbL7tHfC5eJ@cluster0.ucnkfcc.mongodb.net/clocked');
    console.log('✅ Connected to MongoDB');

    // Find and update the main admin account
    const result = await AdminUser.updateOne(
      { email: 'admin@clocked.in' },
      { 
        is_active: true,
        last_login_at: new Date()
      }
    );

    console.log(`📊 Update result: ${result.modifiedCount} documents modified`);

    // Verify the fix
    const admin = await AdminUser.findOne({ email: 'admin@clocked.in' });
    
    if (admin) {
      console.log('\n👤 Admin Account Status:');
      console.log(`📧 Email: ${admin.email}`);
      console.log(`📛 Name: ${admin.name}`);
      console.log(`🟢 Active: ${admin.is_active ? 'YES' : 'NO'}`);
      console.log(`🔑 Role ID: ${admin.role_id}`);
      console.log(`📅 Last Login: ${admin.last_login_at}`);
      
      if (admin.is_active) {
        console.log('\n🎉 SUCCESS: Admin account is now ACTIVE!');
        console.log('🔗 You can now login at: http://localhost:3001/admin');
        console.log('👤 Use: admin@clocked.in / admin123');
      } else {
        console.log('\n❌ FAILED: Admin account is still inactive');
      }
    } else {
      console.log('\n❌ Admin account not found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixAdminAccount();
