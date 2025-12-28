const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  // Subscription fields
  subscriptionTier: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'canceled', 'expired', 'trialing'],
    default: 'active',
  },
  subscriptionId: {
    type: String, // RevenueCat or Stripe subscription ID
  },
  subscriptionExpiresAt: {
    type: Date,
  },
  trialEndsAt: {
    type: Date,
  },
  bottleLimit: {
    type: Number,
    default: 50, // Free tier limit
  },
  // Google Sheets integration
  spreadsheetId: {
    type: String,
    default: null,
  },
  spreadsheetName: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has active subscription
userSchema.methods.hasActiveSubscription = function() {
  if (this.subscriptionTier === 'free') return false;
  if (this.subscriptionStatus !== 'active' && this.subscriptionStatus !== 'trialing') return false;
  if (this.subscriptionExpiresAt && this.subscriptionExpiresAt < new Date()) return false;
  return true;
};

// Check if user can use AI OCR
userSchema.methods.canUseAIocr = function() {
  return this.subscriptionTier === 'premium' || this.subscriptionTier === 'pro';
};

// Check if user can access web dashboard
userSchema.methods.canAccessWebDashboard = function() {
  return this.subscriptionTier === 'premium' || this.subscriptionTier === 'pro';
};

// Check if user reached bottle limit
userSchema.methods.hasReachedBottleLimit = async function() {
  if (this.subscriptionTier !== 'free') return false; // No limit for paid users
  
  const Bottle = mongoose.model('Bottle');
  const count = await Bottle.countDocuments({ user: this._id });
  return count >= this.bottleLimit;
};

module.exports = mongoose.model('User', userSchema);
