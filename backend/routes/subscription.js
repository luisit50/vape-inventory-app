const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get current user's subscription status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    const subscriptionInfo = {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      isActive: user.hasActiveSubscription(),
      expiresAt: user.subscriptionExpiresAt,
      features: {
        aiOcr: user.canUseAIocr(),
        webDashboard: user.canAccessWebDashboard(),
        bottleLimit: user.subscriptionTier === 'free' ? user.bottleLimit : null,
        multiLocation: user.subscriptionTier === 'pro',
        teamMembers: user.subscriptionTier === 'pro',
        exportReports: user.subscriptionTier === 'pro'
      }
    };

    res.json(subscriptionInfo);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bottle count and limit for free users
router.get('/bottle-count', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const Bottle = require('../models/Bottle');
    const count = await Bottle.countDocuments({ user: req.user.id });
    
    res.json({
      count,
      limit: user.subscriptionTier === 'free' ? user.bottleLimit : null,
      isUnlimited: user.subscriptionTier !== 'free',
      percentUsed: user.subscriptionTier === 'free' ? (count / user.bottleLimit * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching bottle count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Webhook to handle subscription updates from RevenueCat
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body;
    
    console.log('Received subscription webhook:', event);

    // Verify webhook (add RevenueCat webhook secret verification here)
    
    // Handle different event types
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        await handleSubscriptionActivated(event);
        break;
      
      case 'CANCELLATION':
        await handleSubscriptionCanceled(event);
        break;
      
      case 'EXPIRATION':
        await handleSubscriptionExpired(event);
        break;
      
      default:
        console.log('Unhandled webhook event:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

async function handleSubscriptionActivated(event) {
  const userId = event.app_user_id; // RevenueCat user ID (should match our MongoDB ID)
  const productId = event.product_id;
  
  // Map product IDs to tiers
  const tierMap = {
    'premium_monthly': 'premium',
    'premium_yearly': 'premium',
    'pro_monthly': 'pro',
    'pro_yearly': 'pro'
  };
  
  const tier = tierMap[productId] || 'premium';
  
  await User.findByIdAndUpdate(userId, {
    subscriptionTier: tier,
    subscriptionStatus: 'active',
    subscriptionId: event.id,
    subscriptionExpiresAt: new Date(event.expiration_at_ms)
  });
}

async function handleSubscriptionCanceled(event) {
  const userId = event.app_user_id;
  
  await User.findByIdAndUpdate(userId, {
    subscriptionStatus: 'canceled',
    // Keep access until expiration date
  });
}

async function handleSubscriptionExpired(event) {
  const userId = event.app_user_id;
  
  await User.findByIdAndUpdate(userId, {
    subscriptionTier: 'free',
    subscriptionStatus: 'expired',
    bottleLimit: 50
  });
}

module.exports = router;
