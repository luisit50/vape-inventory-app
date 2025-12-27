import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import revenueCatService from '../services/revenueCatService';
import { useSubscription } from '../contexts/SubscriptionContext';

const PaywallScreen = ({ navigation, route }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { refreshSubscriptionStatus } = useSubscription();

  const fromScreen = route?.params?.from;

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const offerings = await revenueCatService.getOfferings();
      setPackages(offerings);
    } catch (error) {
      console.error('Error loading offerings:', error);
      Alert.alert('Error', 'Failed to load subscription options');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    setPurchasing(true);
    try {
      const result = await revenueCatService.purchasePackage(pkg);
      
      if (result.success) {
        await refreshSubscriptionStatus();
        Alert.alert(
          'Success! 🎉',
          `You now have ${result.tier.toUpperCase()} access!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else if (result.cancelled) {
        // User cancelled, do nothing
      } else {
        Alert.alert('Purchase Failed', 'Please try again or contact support.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const result = await revenueCatService.restorePurchases();
      
      if (result.success) {
        await refreshSubscriptionStatus();
        Alert.alert('Restored!', result.message || 'Your purchases have been restored.');
        navigation.goBack();
      } else {
        Alert.alert('No Purchases', result.message || 'No active subscriptions found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setPurchasing(false);
    }
  };

  const getPackageInfo = (pkg) => {
    const identifier = pkg.identifier.toLowerCase();
    const isPremium = identifier.includes('premium');
    const isMonthly = identifier.includes('monthly');
    
    return {
      name: isPremium ? 'Premium' : 'Pro',
      billing: isMonthly ? 'Monthly' : 'Yearly',
      color: isPremium ? '#4CAF50' : '#2196F3',
      icon: isPremium ? 'rocket' : 'star',
      features: isPremium ? [
        'Unlimited bottles',
        'AI-powered OCR',
        'Web dashboard access',
        'Priority support'
      ] : [
        'Everything in Premium',
        'Team collaboration',
        'Export to CSV/Excel',
        'Advanced analytics',
        'Custom branding'
      ]
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Upgrade Your Plan</Text>
          <Text style={styles.subtitle}>
            {fromScreen === 'camera' 
              ? 'Unlock AI-powered OCR for better accuracy'
              : 'Choose the plan that fits your needs'}
          </Text>
        </View>

        {/* Free Tier Info */}
        <View style={styles.freeTierCard}>
          <Text style={styles.freeTierTitle}>Current: Free Plan</Text>
          <View style={styles.freeTierFeature}>
            <Ionicons name="checkmark-circle" size={20} color="#666" />
            <Text style={styles.freeTierText}>50 bottles maximum</Text>
          </View>
          <View style={styles.freeTierFeature}>
            <Ionicons name="checkmark-circle" size={20} color="#666" />
            <Text style={styles.freeTierText}>Basic OCR (text recognition)</Text>
          </View>
          <View style={styles.freeTierFeature}>
            <Ionicons name="checkmark-circle" size={20} color="#666" />
            <Text style={styles.freeTierText}>Mobile app only</Text>
          </View>
        </View>

        {/* Subscription Packages */}
        {packages.map((pkg, index) => {
          const info = getPackageInfo(pkg);
          return (
            <View key={index} style={[styles.packageCard, { borderColor: info.color }]}>
              <View style={[styles.packageHeader, { backgroundColor: info.color }]}>
                <Ionicons name={info.icon} size={32} color="#fff" />
                <Text style={styles.packageName}>{info.name}</Text>
              </View>
              
              <View style={styles.packageBody}>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{pkg.product.priceString}</Text>
                  <Text style={styles.billing}>/{info.billing}</Text>
                </View>

                <View style={styles.featuresContainer}>
                  {info.features.map((feature, idx) => (
                    <View key={idx} style={styles.feature}>
                      <Ionicons name="checkmark-circle" size={20} color={info.color} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.subscribeButton, { backgroundColor: info.color }]}
                  onPress={() => handlePurchase(pkg)}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.subscribeButtonText}>
                      Subscribe Now
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Restore Button */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>
          Subscriptions will auto-renew. Cancel anytime in your App Store or Google Play settings.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  freeTierCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  freeTierTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  freeTierFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  freeTierText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  packageCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  packageName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  packageBody: {
    padding: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  billing: {
    fontSize: 18,
    color: '#666',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  subscribeButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    marginHorizontal: 20,
    marginBottom: 40,
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
});

export default PaywallScreen;
