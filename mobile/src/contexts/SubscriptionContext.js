import React, { createContext, useState, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import revenueCatService from '../services/revenueCatService';
import api from '../services/api';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    tier: 'free',
    isActive: false,
    loading: true,
    bottleCount: 0,
    bottleLimit: 50,
  });

  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (user && token) {
      initializeSubscription();
    }
  }, [user, token]);

  const initializeSubscription = async () => {
    try {
      // Initialize RevenueCat with user ID
      await revenueCatService.initialize(user.id);

      // Fetch subscription status from backend
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error('Error initializing subscription:', error);
      setSubscriptionStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      // Get status from backend
      const response = await api.get('/subscription/status');
      const backendStatus = response.data;

      // Get bottle count
      const bottleResponse = await api.get('/subscription/bottle-count');
      const bottleInfo = bottleResponse.data;

      setSubscriptionStatus({
        tier: backendStatus.tier,
        isActive: backendStatus.isActive,
        loading: false,
        bottleCount: bottleInfo.count,
        bottleLimit: bottleInfo.limit,
        expiresAt: backendStatus.expiresAt,
        features: backendStatus.features,
      });
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setSubscriptionStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const purchaseSubscription = async (packageToPurchase) => {
    try {
      const result = await revenueCatService.purchasePackage(packageToPurchase);
      
      if (result.success) {
        // Refresh status from backend (webhook will update it)
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for webhook
        await refreshSubscriptionStatus();
        return { success: true };
      }
      
      return result;
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      return { success: false, error };
    }
  };

  const restorePurchases = async () => {
    try {
      const result = await revenueCatService.restorePurchases();
      
      if (result.success) {
        await refreshSubscriptionStatus();
        return { success: true, message: 'Purchases restored successfully!' };
      }
      
      return result;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return { success: false, error };
    }
  };

  const canUseAIocr = () => {
    return subscriptionStatus.tier === 'premium' || subscriptionStatus.tier === 'pro';
  };

  const canAccessWebDashboard = () => {
    return subscriptionStatus.tier === 'premium' || subscriptionStatus.tier === 'pro';
  };

  const hasReachedBottleLimit = () => {
    if (subscriptionStatus.tier !== 'free') return false;
    return subscriptionStatus.bottleCount >= subscriptionStatus.bottleLimit;
  };

  const getBottleLimitPercentage = () => {
    if (subscriptionStatus.tier !== 'free') return 0;
    return (subscriptionStatus.bottleCount / subscriptionStatus.bottleLimit) * 100;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        refreshSubscriptionStatus,
        purchaseSubscription,
        restorePurchases,
        canUseAIocr,
        canAccessWebDashboard,
        hasReachedBottleLimit,
        getBottleLimitPercentage,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
