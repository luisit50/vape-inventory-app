import NetInfo from '@react-native-community/netinfo';
import { store } from '../store/store';
import { inventoryAPI } from './api';
import { addBottle, clearPendingSync, setBottles } from '../store/slices/inventorySlice';

class SyncService {
  constructor() {
    this.isOnline = true;
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      // If we just came back online, sync pending data
      if (wasOffline && this.isOnline) {
        this.syncPendingData();
      }
    });
  }

  async syncPendingData() {
    const { pendingSync } = store.getState().inventory;
    
    if (pendingSync.length === 0) return;

    console.log(`Syncing ${pendingSync.length} pending bottles...`);

    try {
      // Upload all pending bottles
      for (const bottle of pendingSync) {
        await inventoryAPI.createBottle(bottle);
      }

      // Clear pending sync
      store.dispatch(clearPendingSync());
      
      // Refresh all bottles from server
      const response = await inventoryAPI.getAllBottles();
      store.dispatch(setBottles(response.data));
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  async checkConnection() {
    const state = await NetInfo.fetch();
    return state.isConnected;
  }

  isConnected() {
    return this.isOnline;
  }
}

export default new SyncService();
