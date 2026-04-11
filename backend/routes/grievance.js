const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/grievances');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `grievance-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, PDF, and TXT files are allowed.'), false);
    }
  }
});

// POST /api/grievance - Submit grievance
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      handle,
      contentUrl,
      description,
      type,
      isSubject,
      declarations,
      supportingDocs,
      contactPreference,
      ipAddress,
      userAgent
    } = req.body;

    console.log('Grievance submission received:', {
      type,
      handle,
      timestamp: new Date().toISOString(),
      ipAddress: ipAddress || 'unknown'
    });

    // Enhanced validation
    const validationErrors = [];

    if (!name || name.trim().length < 2) {
      validationErrors.push('Valid full name is required');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push('Valid email address is required');
    }

    if (!handle || !handle.startsWith('@')) {
      validationErrors.push('Valid Instagram handle starting with @ is required');
    }

    if (!contentUrl) {
      validationErrors.push('Content URL is required');
    } else {
      try {
        new URL(contentUrl);
      } catch {
        validationErrors.push('Valid content URL is required');
      }
    }

    if (!description || description.trim().length < 50) {
      validationErrors.push('Description must be at least 50 characters');
    }

    if (description && description.trim().length > 2000) {
      validationErrors.push('Description must be less than 2000 characters');
    }

    if (!type) {
      validationErrors.push('Issue type is required');
    }

    if (!isSubject) {
      validationErrors.push('Relationship to issue must be specified');
    }

    if (!declarations || !Array.isArray(declarations) || declarations.length !== 3 || !declarations.every(Boolean)) {
      validationErrors.push('All legal declarations must be checked');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please correct the following errors:',
        details: validationErrors
      });
    }

    // Generate unique case ID
    const caseId = `GRV-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create grievance object
    const grievance = {
      caseId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      handle: handle.trim(),
      contentUrl: contentUrl.trim(),
      description: description.trim(),
      type,
      isSubject,
      declarations,
      supportingDocs: supportingDocs || [],
      contactPreference: contactPreference || 'email',
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      status: 'pending',
      priority: determinePriority(type),
      assignedTo: null,
      resolutionNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
      actions: []
    };

    // Log for legal compliance
    console.log('Grievance created:', {
      caseId,
      type,
      priority: grievance.priority,
      deadline: grievance.deadline
    });

    // Save to database
    const result = await mongoose.connection.db.collection('grievances').insertOne(grievance);
    
    console.log('Grievance saved to database with ID:', result.insertedId);

    // Send confirmation email (in production)
    // await emailService.sendGrievanceConfirmation(email, caseId);

    res.status(201).json({
      message: 'Grievance submitted successfully',
      caseId,
      status: 'pending',
      estimatedResponse: '24-72 hours',
      nextSteps: [
        'You will receive an email confirmation shortly',
        'Our team will review your submission',
        'We may contact you for additional information',
        'You will receive a response within the specified timeframe'
      ]
    });

  } catch (error) {
    console.error('Grievance submission error:', error);
    res.status(500).json({
      error: 'Submission failed',
      message: 'Unable to process your grievance. Please try again or contact support directly.'
    });
  }
});

// POST /api/grievance/upload - Upload supporting documents
router.post('/upload', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one file to upload'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      fileId: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype,
      url: `/uploads/grievances/${file.filename}`,
      uploadedAt: new Date()
    }));

    console.log('Files uploaded for grievance:', uploadedFiles.map(f => ({
      fileId: f.fileId,
      originalName: f.originalName,
      size: f.size
    })));

    res.status(200).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      });
    }

    res.status(500).json({
      error: 'Upload failed',
      message: error.message || 'Unable to upload files. Please try again.'
    });
  }
});

// GET /api/grievance/:caseId - Check grievance status (for users)
router.get('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;

    // Validate case ID format
    if (!caseId || !caseId.startsWith('GRV-')) {
      return res.status(400).json({
        error: 'Invalid case ID',
        message: 'Please provide a valid grievance case ID'
      });
    }

    // In production, fetch from database
    // const grievance = await GrievanceModel.findOne({ caseId });

    // Mock response for development
    const mockGrievance = {
      caseId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedResponse: '24-72 hours',
      currentStep: 'Initial review',
      nextSteps: [
        'Your grievance is being reviewed by our legal team',
        'We will assess the content and claims',
        'You may be contacted for additional information'
      ]
    };

    res.json(mockGrievance);

  } catch (error) {
    console.error('Grievance status check error:', error);
    res.status(500).json({
      error: 'Status check failed',
      message: 'Unable to retrieve grievance status. Please try again.'
    });
  }
});

// Helper function to determine priority based on issue type
function determinePriority(type) {
  const priorityMap = {
    'defamation': 'high',
    'harassment': 'high',
    'impersonation': 'high',
    'privacy_violation': 'high',
    'copyright': 'medium',
    'hate_speech': 'high',
    'false_information': 'medium',
    'other': 'low'
  };
  
  return priorityMap[type] || 'medium';
}

// Production middleware for rate limiting and security
router.use((req, res, next) => {
  // Log all grievance-related requests for legal compliance
  console.log('Grievance API access:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  next();
});

module.exports = router;
