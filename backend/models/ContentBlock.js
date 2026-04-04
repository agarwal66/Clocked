const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    trim: true
  },
  block_key: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  content_type: {
    type: String,
    enum: ['text', 'html', 'markdown'],
    default: 'text'
  },
  description: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Create compound index for page and block_key
contentBlockSchema.index({ page: 1, block_key: 1 }, { unique: true });

module.exports = mongoose.model('ContentBlock', contentBlockSchema);
