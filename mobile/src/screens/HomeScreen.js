import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Text, FAB, Searchbar, Chip, Card, Portal, Dialog, Button, IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { inventoryAPI } from '../services/api';
import { setBottles, setLoading } from '../store/slices/inventorySlice';
import { logout } from '../store/slices/authSlice';
import { formatDistanceToNow } from 'date-fns';
import syncService from '../services/syncService';
import { getExpirationStatus } from '../utils/dateUtils';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { bottles, loading } = useSelector(state => state.inventory);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, expiring, expired
  const [refreshing, setRefreshing] = useState(false);
  const [showCaptureDialog, setShowCaptureDialog] = useState(false);
  const { subscriptionStatus, hasReachedBottleLimit, getBottleLimitPercentage, refreshSubscriptionStatus } = useSubscription();

  useEffect(() => {
    loadBottles();
    refreshSubscriptionStatus(); // Refresh bottle count when screen loads
  }, []);

  // Also refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshSubscriptionStatus();
    });
    return unsubscribe;
  }, [navigation]);

  const loadBottles = async () => {
    try {
      dispatch(setLoading(true));
      const isOnline = await syncService.checkConnection();
      
      if (isOnline) {
        const response = await inventoryAPI.getAllBottles();
        dispatch(setBottles(response.data));
      }
    } catch (error) {
      console.error('Failed to load bottles:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBottles();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => dispatch(logout())
        }
      ]
    );
  };

  const filteredBottles = bottles.filter(bottle => {
    const matchesSearch = 
      bottle.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bottle.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterStatus === 'all') return true;
    
    const expStatus = getExpirationStatus(bottle.expirationDate);
    if (filterStatus === 'expiring') {
      return expStatus.status === 'warning' || expStatus.status === 'critical';
    }
    if (filterStatus === 'expired') {
      return expStatus.status === 'expired';
    }
    
    return true;
  });

  const renderBottle = ({ item }) => {
    const expStatus = getExpirationStatus(item.expirationDate);
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('BottleDetail', { bottle: item })}
      >
        <Card style={[styles.card, { borderLeftColor: expStatus.color }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.bottleName}>{item.name}</Text>
              <Chip 
                style={{ backgroundColor: expStatus.color }}
                textStyle={{ color: 'white' }}
              >
                {expStatus.label}
              </Chip>
            </View>
            
            <View style={styles.cardDetails}>
              <Text style={styles.detailText}>
                {item.mg} • {item.bottleSize}
              </Text>
              <Text style={styles.detailText}>
                Batch: {item.batchNumber}
              </Text>
              <Text style={styles.detailText}>
                Exp: {item.expirationDate}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Subscription Status Banner */}
      {subscriptionStatus.tier === 'free' && (
        <TouchableOpacity
          style={styles.subscriptionBanner}
          onPress={() => navigation.navigate('Paywall')}
        >
          <View style={styles.bannerContent}>
            <Ionicons name="rocket-outline" size={20} color="#fff" />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerText}>
                {subscriptionStatus.bottleCount}/{subscriptionStatus.bottleLimit} bottles used
              </Text>
              <Text style={styles.bannerSubtext}>
                Upgrade for unlimited bottles & AI OCR
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}
      
      <Searchbar
        placeholder="Search bottles..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.filterContainer}>
        <Chip
          selected={filterStatus === 'all'}
          onPress={() => setFilterStatus('all')}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={filterStatus === 'expiring'}
          onPress={() => setFilterStatus('expiring')}
          style={styles.filterChip}
        >
          Expiring Soon
        </Chip>
        <Chip
          selected={filterStatus === 'expired'}
          onPress={() => setFilterStatus('expired')}
          style={styles.filterChip}
        >
          Expired
        </Chip>
      </View>

      <FlatList
        data={filteredBottles}
        renderItem={renderBottle}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bottles found</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first bottle
            </Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="camera"
        onPress={() => setShowCaptureDialog(true)}
        label="Add Bottle"
      />

      <Portal>
        <Dialog visible={showCaptureDialog} onDismiss={() => setShowCaptureDialog(false)}>
          <Dialog.Title>Choose Capture Mode</Dialog.Title>
          <Dialog.Content>
            <TouchableOpacity
              style={styles.dialogOption}
              onPress={() => {
                setShowCaptureDialog(false);
                navigation.navigate('MultiCapture');
              }}
            >
              <Text style={styles.dialogOptionTitle}>📸 Multi-Capture (Recommended)</Text>
              <Text style={styles.dialogOptionDesc}>
                Take separate photos for each field for better accuracy
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.dialogOption}
              onPress={() => {
                setShowCaptureDialog(false);
                navigation.navigate('Camera');
              }}
            >
              <Text style={styles.dialogOptionTitle}>📷 Single Photo</Text>
              <Text style={styles.dialogOptionDesc}>
                Capture entire label in one photo (faster but less accurate)
              </Text>
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCaptureDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterChip: {
    marginRight: 8,
  },
  list: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
    borderLeftWidth: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bottleName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  cardDetails: {
    marginTop: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  dialogOption: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dialogOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  dialogOptionDesc: {
    fontSize: 14,
    color: '#666',
  },
  subscriptionBanner: {
    backgroundColor: '#2196F3',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bannerSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
});

export default HomeScreen;
