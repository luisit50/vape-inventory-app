import NetInfo from '@react-native-community/netinfo';
import { inventoryAPI } from './api';


class SyncService {
  constructor() {
    this.isOnline = true;
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
    });
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
