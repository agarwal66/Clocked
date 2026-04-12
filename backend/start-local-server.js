// Start server with local MongoDB
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

console.log('Starting server with local MongoDB...');
console.log('MONGODB_URI:', process.env.MONGODB_URI);

async function startServer() {
  try {
    // Connect to local MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to local MongoDB:', mongoose.connection.host);
    
    // Verify user22 data exists
    const handles = mongoose.connection.db.collection('handles');
    const userHandle = await handles.findOne({ claimed_by_user_id: '69da2da74a12797ccd9d49ec' });
    
    console.log('User22 handle:', userHandle ? userHandle.instagram_handle : 'Not found');
    
    // If no data, create it
    if (!userHandle) {
      console.log('Creating user22 data...');
      
      // Claim a handle for user22
      const unclaimedHandle = await handles.findOne({ claimed_by_user_id: null });
      if (unclaimedHandle) {
        await handles.updateOne(
          { _id: unclaimedHandle._id },
          { 
            $set: { 
              claimed_by_user_id: '69da2da74a12797ccd9d49ec',
              claimed_at: new Date()
            }
          }
        );
        console.log('Claimed handle:', unclaimedHandle.instagram_handle);
      }
      
      // Add watches
      const watches = mongoose.connection.db.collection('watches');
      const allHandles = await handles.find({}).limit(3).toArray();
      
      for (const handle of allHandles) {
        if (handle.claimed_by_user_id?.toString() !== '69da2da74a12797ccd9d49ec') {
          await watches.insertOne({
            user_id: '69da2da74a12797ccd9d49ec',
            handle_id: handle._id,
            created_at: new Date()
          });
        }
      }
      
      // Add flags for trending
      const flags = mongoose.connection.db.collection('flags');
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      
      const trendingHandles = await handles.find({}).limit(5).toArray();
      for (const handle of trendingHandles) {
        for (let i = 0; i < Math.floor(Math.random() * 5) + 2; i++) {
          await flags.insertOne({
            handle_id: handle._id,
            handle_instagram_handle: handle.instagram_handle,
            flag_type: Math.random() > 0.5 ? 'red' : 'green',
            created_at: new Date(weekStart.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
            created_by: new mongoose.Types.ObjectId(),
            text: `Trending flag ${i + 1} for ${handle.instagram_handle}`
          });
        }
      }
      
      console.log('Created test data for trending flags');
    }
    
    // Start the Express server
    const express = require('express');
    const app = express();
    const cors = require('cors');
    
    app.use(cors({
      origin: ['http://localhost:3001', 'http://localhost:3000'],
      credentials: true
    }));
    
    app.use(express.json());
    
    // Add the weekly radar route
    const weeklyRadarRoutes = require('./routes/weekly-radar');
    app.use('/api/radar', weeklyRadarRoutes);
    
    // Add auth middleware for testing
    const jwt = require('jsonwebtoken');
    
    app.get('/api/test-token', (req, res) => {
      const token = jwt.sign(
        { id: '69da2da74a12797ccd9d49ec', email: 'user22@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.json({ token });
    });
    
    app.listen(5004, () => {
      console.log('Server running on http://localhost:5004');
      console.log('Test token: http://localhost:5004/api/test-token');
      console.log('Weekly radar: http://localhost:5004/api/radar/weekly');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

startServer();
