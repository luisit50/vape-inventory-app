// Middleware to check subscription status

const requireSubscription = (minTier = 'premium') => {
  return async (req, res, next) => {
    try {
      const user = req.user; // Assumes auth middleware already ran
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if subscription is active
      if (!user.hasActiveSubscription()) {
        return res.status(403).json({ 
          message: 'Active subscription required',
          subscriptionRequired: true,
          currentTier: user.subscriptionTier,
          requiredTier: minTier
        });
      }

      // Check tier level
      const tierLevels = { free: 0, premium: 1, pro: 2 };
      const userLevel = tierLevels[user.subscriptionTier] || 0;
      const requiredLevel = tierLevels[minTier] || 1;

      if (userLevel < requiredLevel) {
        return res.status(403).json({ 
          message: `${minTier} subscription or higher required`,
          subscriptionUpgradeRequired: true,
          currentTier: user.subscriptionTier,
          requiredTier: minTier
        });
      }

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ message: 'Error checking subscription' });
    }
  };
};

const checkBottleLimit = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Skip check for paid users
    if (user.subscriptionTier !== 'free') {
      return next();
    }

    // Check if free user reached limit
    const reachedLimit = await user.hasReachedBottleLimit();
    
    if (reachedLimit) {
      return res.status(403).json({ 
        message: 'Bottle limit reached. Upgrade to premium for unlimited bottles.',
        bottleLimitReached: true,
        currentLimit: user.bottleLimit,
        subscriptionRequired: true
      });
    }

    next();
  } catch (error) {
    console.error('Bottle limit check error:', error);
    res.status(500).json({ message: 'Error checking bottle limit' });
  }
};

module.exports = {
  requireSubscription,
  checkBottleLimit
};
