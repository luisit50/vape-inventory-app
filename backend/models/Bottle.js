const mongoose = require('mongoose');

const bottleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mg: {
    type: String,
    trim: true,
  },
  bottleSize: {
    type: String,
    trim: true,
  },
  batchNumber: {
    type: String,
    trim: true,
  },
  expirationDate: {
    type: String,
    required: true,
  },
  imageUri: {
    type: String,
  },
  capturedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
bottleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
bottleSchema.index({ userId: 1, expirationDate: 1 });
bottleSchema.index({ userId: 1, name: 'text', batchNumber: 'text' });

module.exports = mongoose.model('Bottle', bottleSchema);
