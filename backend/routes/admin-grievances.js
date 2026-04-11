const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET all grievances - dynamic from database
router.get('/', async (req, res) => {
  try {
    // Query database for all grievances
    const grievances = await mongoose.connection.db.collection('grievances')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({
      success: true,
      data: grievances
    });
  } catch (error) {
    console.error('Error fetching grievances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grievances'
    });
  }
});

// PATCH update grievance status - dynamic update
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('PATCH request received:', { id, status });

    // Validate status
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Check if ID is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid grievance ID'
      });
    }

    // Update grievance in database
    const result = await mongoose.connection.db.collection('grievances')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { 
          $set: { 
            status: status,
            updatedAt: new Date()
          }
        }
      );
    
    console.log('Database update result:', result);
    
    if (result.matchedCount === 0) {
      console.log('Grievance not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }
    
    console.log(`Grievance ${id} status updated to: ${status}`);
    
    res.json({
      success: true,
      message: 'Grievance status updated successfully',
      data: { id, status }
    });
  } catch (error) {
    console.error('Error updating grievance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update grievance',
      error: error.message
    });
  }
});

// POST new grievance - dynamic creation
router.post('/', async (req, res) => {
  try {
    const { handle, name, email, type, isSubject, description } = req.body;
    
    // Create new grievance in database
    const newGrievance = {
      handle,
      name,
      email,
      type,
      isSubject,
      description,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await mongoose.connection.db.collection('grievances')
      .insertOne(newGrievance);
    
    res.json({
      success: true,
      message: 'Grievance submitted successfully',
      data: {
        ...newGrievance,
        _id: result.insertedId
      }
    });
  } catch (error) {
    console.error('Error creating grievance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit grievance'
    });
  }
});

module.exports = router;
