const { spawn } = require('child_process');
require('dotenv').config();

// Get MongoDB URI from environment
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/clocked';

console.log('🚀 Running Clocked Meta Seed...');
console.log('📦 MongoDB URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

// Try different MongoDB shell commands
const mongoCommands = [
  'mongosh',
  'mongo',
  'mongodb'
];

let child;
let commandUsed = '';

for (const cmd of mongoCommands) {
  try {
    console.log(`🔍 Trying ${cmd}...`);
    child = spawn(cmd, [mongoUri, '--file', 'scripts/clocked-meta-seed.js'], {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: true
    });
    commandUsed = cmd;
    break;
  } catch (error) {
    console.log(`❌ ${cmd} not available, trying next...`);
    continue;
  }
}

if (!child) {
  console.error('❌ No MongoDB shell found. Please install MongoDB.');
  console.log('\n🔧 Installation Options:');
  console.log('1. Download MongoDB: https://www.mongodb.com/try/download/community');
  console.log('2. Install via npm: npm install -g mongodb-shell');
  console.log('3. Use MongoDB Compass for manual setup');
  process.exit(1);
}

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Meta seed completed successfully!');
    console.log('🎉 Your database now has all meta/config data.');
    console.log(`\n📋 Used command: ${commandUsed}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Test meta: npm run test-meta');
    console.log('   2. Start backend: npm run dev (keep running)');
    console.log('   3. Start frontend: cd ../frontend && npm start');
  } else {
    console.error(`\n❌ Meta seed failed with code: ${code}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure MongoDB is installed');
    console.log('   2. Check MONGODB_URI in .env file');
    console.log('   3. Try installing MongoDB Shell');
  }
});

child.on('error', (error) => {
  console.error(`❌ Failed to run ${commandUsed}:`, error.message);
  console.log('\n🔧 Alternative: Use MongoDB Compass to run the seed manually');
  console.log('   1. Open MongoDB Compass');
  console.log('   2. Connect to your database');
  console.log('   3. Copy-paste contents of scripts/clocked-meta-seed.js');
  console.log('   4. Run in Compass shell');
});
