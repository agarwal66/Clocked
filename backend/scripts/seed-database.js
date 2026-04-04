require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  runSeedScript();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

async function runSeedScript() {
  try {
    console.log('🌱 Starting database seed...');
    
    // Import and execute the MongoDB schema file
    const { exec } = require('child_process');
    const path = require('path');
    
    const mongoScriptPath = path.join(__dirname, '../clocked_mongo.js');
    
    exec(`mongosh "${process.env.MONGODB_URI}" --file "${mongoScriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error executing MongoDB script:', error);
        process.exit(1);
      }
      
      console.log('📄 MongoDB script output:');
      console.log(stdout);
      
      if (stderr) {
        console.log('⚠️ MongoDB script warnings:');
        console.log(stderr);
      }
      
      console.log('✅ Database seed completed successfully!');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Seed script error:', error);
    process.exit(1);
  }
}
