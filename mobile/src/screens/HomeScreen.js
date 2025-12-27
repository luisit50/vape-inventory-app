import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Text, FAB, Searchbar, Chip, Card, Portal, Dialog, Button, IconButton } from 'react-native-paper';
import { inventoryAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import syncService from '../services/syncService';
import { getExpirationStatus, formatDate } from '../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';


import { useAuth } from '../contexts/AuthContext';

const HomeScreen = ({ navigation, route }) => {
  const { token, logout } = useAuth();
  const [bottles, setBottles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, expiring, expired
  const [refreshing, setRefreshing] = useState(false);
  const [showCaptureDialog, setShowCaptureDialog] = useState(false);
  const [error, setError] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBottles, setSelectedBottles] = useState([]);

  // Load bottles on mount and when token changes
  useEffect(() => {
    if (token) {
      loadBottles();
    }
  }, [token]);

  // Reload bottles when route params change (e.g., after edit)
  useEffect(() => {
    if (route.params?.refresh && token) {
      loadBottles();
    }
  }, [route.params?.refresh, token]);

  // Reload bottles every time HomeScreen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        loadBottles();
      }
    }, [token])
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {!selectionMode ? (
            <>
              <IconButton
                icon="checkbox-multiple-marked"
                color="#4CAF50"
                size={24}
                onPress={() => setSelectionMode(true)}
                accessibilityLabel="Select multiple"
              />
              <IconButton
                icon="logout"
                color="#4CAF50"
                size={24}
                onPress={logout}
                accessibilityLabel="Logout"
              />
            </>
          ) : (
            <IconButton
              icon="close"
              color="#4CAF50"
              size={24}
              onPress={handleCancelSelection}
              accessibilityLabel="Cancel selection"
            />
          )}
        </View>
      ),
    });
  }, [navigation, logout, selectionMode]);

  const loadBottles = async () => {
    try {
      setLoading(true);
      setError('');
      const isOnline = await syncService.checkConnection();
      if (isOnline && token) {
        const response = await inventoryAPI.getAllBottles(token);
        setBottles(response.data);
      } else if (!isOnline) {
        setError('No internet connection.');
      }
    } catch (err) {
      setError('Failed to load bottles.');
      console.error('Failed to load bottles:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBottles();
    setRefreshing(false);
  };

  const handleToggleSelection = (bottleId) => {
    setSelectedBottles(prev => 
      prev.includes(bottleId)
        ? prev.filter(id => id !== bottleId)
        : [...prev, bottleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBottles.length === filteredBottles.length) {
      setSelectedBottles([]);
    } else {
      setSelectedBottles(filteredBottles.map(b => b._id));
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Multiple Bottles',
      `Are you sure you want to delete ${selectedBottles.length} bottle${selectedBottles.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(selectedBottles.map(id => inventoryAPI.deleteBottle(id, token)));
              setSelectedBottles([]);
              setSelectionMode(false);
              await loadBottles();
              Alert.alert('Success', `${selectedBottles.length} bottle${selectedBottles.length > 1 ? 's' : ''} deleted`);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bottles');
            }
          },
        },
      ]
    );
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedBottles([]);
  };

  // Logout logic removed

  const filteredBottles = bottles.filter(bottle => {
    const matchesSearch = 
      bottle.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bottle.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    const isSelected = selectedBottles.includes(item._id);
    
    return (
      <TouchableOpacity
        onPress={() => {
          if (selectionMode) {
            handleToggleSelection(item._id);
          } else {
            navigation.navigate('BottleDetail', { bottle: item });
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            setSelectedBottles([item._id]);
          }
        }}
      >
        <Card style={[
          styles.card, 
          { borderLeftColor: expStatus.color },
          isSelected && styles.selectedCard
        ]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              {selectionMode && (
                <Chip 
                  mode="outlined"
                  selected={isSelected}
                  style={{ marginRight: 10 }}
                >
                  {isSelected ? '✓' : ' '}
                </Chip>
              )}
              <Text style={styles.bottleName}>{item.name}</Text>
              {item.brand ? (
                <Text style={styles.brandLabel}>Brand: {item.brand}</Text>
              ) : null}
              <Chip 
                style={{ backgroundColor: expStatus.color }}
                textStyle={{ color: 'white' }}
              >
                {expStatus.label}
              </Chip>
            </View>
            
            <View style={styles.cardDetails}>
              <Text style={styles.detailText}>
                {`${item.mg} • ${item.bottleSize}`}
              </Text>
              <Text style={styles.detailText}>
                {`Batch: ${item.batchNumber}`}
              </Text>
              <Text style={styles.detailText}>
                {`Exp: ${formatDate(item.expirationDate)}`}
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

      {selectionMode && (
        <View style={styles.selectionToolbar}>
          <Button
            mode="outlined"
            onPress={handleSelectAll}
            style={{ marginRight: 10 }}
          >
            {selectedBottles.length === filteredBottles.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            mode="contained"
            buttonColor="#f44336"
            onPress={handleDeleteSelected}
            disabled={selectedBottles.length === 0}
          >
            Delete ({selectedBottles.length})
          </Button>
        </View>
      )}

      {error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
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
      )}

      {!selectionMode && (
        <FAB
          style={styles.fab}
          icon="camera"
          onPress={() => setShowCaptureDialog(true)}
          label="Add Bottle"
        />
      )}

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
  selectedCard: {
    backgroundColor: '#E3F2FD',
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
  brandLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
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
  selectionToolbar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'space-between',
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
