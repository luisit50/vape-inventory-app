import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  bottles: [],
  pendingSync: [], // Bottles captured offline waiting to sync
  loading: false,
  error: null,
  lastSync: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setBottles: (state, action) => {
      state.bottles = action.payload;
      state.lastSync = new Date().toISOString();
    },
    addBottle: (state, action) => {
      state.bottles.unshift(action.payload);
    },
    addPendingBottle: (state, action) => {
      // Add to pending sync when offline
      state.pendingSync.push(action.payload);
      state.bottles.unshift(action.payload);
    },
    clearPendingSync: (state) => {
      state.pendingSync = [];
    },
    updateBottle: (state, action) => {
      const index = state.bottles.findIndex(b => b._id === action.payload._id);
      if (index !== -1) {
        state.bottles[index] = action.payload;
      }
    },
    deleteBottle: (state, action) => {
      state.bottles = state.bottles.filter(b => b._id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setBottles,
  addBottle,
  addPendingBottle,
  clearPendingSync,
  updateBottle,
  deleteBottle,
  setLoading,
  setError,
} = inventorySlice.actions;

export default inventorySlice.reducer;
