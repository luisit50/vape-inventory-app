import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY = 'test_ilZcrAttuaKaaRgJhUHdPbpaCh';

class RevenueCatService {
  async initialize(userId) {
    try {
      // Configure RevenueCat
      Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId, // Use your MongoDB user ID
      });

      console.log('RevenueCat initialized for user:', userId);
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
    }
  }

  async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (error) {
      // Silently fail in Expo Go / demo mode - app will use mock data
      return [];
    }
  }

  async purchasePackage(packageToPurchase) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // Check if user has active entitlements
      if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
        return { success: true, tier: 'premium', customerInfo };
      } else if (typeof customerInfo.entitlements.active['pro'] !== 'undefined') {
        return { success: true, tier: 'pro', customerInfo };
      }
      
      return { success: false };
    } catch (error) {
      if (error.userCancelled) {
        return { success: false, cancelled: true };
      }
      console.error('Error purchasing package:', error);
      return { success: false, error };
    }
  }

  async restorePurchases() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
        return { success: true, tier: 'premium', customerInfo };
      } else if (typeof customerInfo.entitlements.active['pro'] !== 'undefined') {
        return { success: true, tier: 'pro', customerInfo };
      }
      
      return { success: false, message: 'No active subscriptions found' };
    } catch (error) {
      // Silently fail in Expo Go / demo mode
      return { success: false, message: 'Restore not available in demo mode' };
    }
  }

  async getCustomerInfo() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      const hasActiveSubscription = 
        typeof customerInfo.entitlements.active['premium'] !== 'undefined' ||
        typeof customerInfo.entitlements.active['pro'] !== 'undefined';
      
      let tier = 'free';
      if (typeof customerInfo.entitlements.active['pro'] !== 'undefined') {
        tier = 'pro';
      } else if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
        tier = 'premium';
      }
      
      return {
        hasActiveSubscription,
        tier,
        customerInfo
      };
    } catch (error) {
      console.error('Error getting customer info:', error);
      return { hasActiveSubscription: false, tier: 'free' };
    }
  }
}

export default new RevenueCatService();
