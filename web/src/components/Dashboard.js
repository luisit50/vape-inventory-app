import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CardActions,
  Checkbox,
} from '@mui/material';
import { Refresh as RefreshIcon, Edit as EditIcon, Delete as DeleteIcon, DeleteSweep as DeleteSweepIcon } from '@mui/icons-material';
import { inventoryAPI } from '../services/api';
import { getExpirationStatus, formatDate } from '../utils/dateUtils';

const Dashboard = () => {
  const [bottles, setBottles] = useState([]);
  const [filteredBottles, setFilteredBottles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Critical, 2: Warning, 3: Good
  const lastCheckRef = useRef('');
  const [editDialog, setEditDialog] = useState({ open: false, bottle: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, bottle: null });
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedBottles, setSelectedBottles] = useState([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  useEffect(() => {
    loadBottles();
    
    // Silent background polling every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const response = await inventoryAPI.getAllBottles();
        const newData = response.data;
        
        // Create a signature of the data (includes content for edit detection)
        const newSignature = newData.map(b => 
          `${b._id}-${b.name}-${b.brand}-${b.mg}-${b.bottleSize}-${b.batchNumber}-${b.expirationDate}`
        ).sort().join('|');
        
        // Only update if data actually changed
        if (newSignature !== lastCheckRef.current) {
          lastCheckRef.current = newSignature;
          setBottles(newData);
        }
      } catch (err) {
        // Silently fail on background checks
        console.log('Background refresh failed');
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterBottles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottles, searchQuery, tabValue]);

  const loadBottles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await inventoryAPI.getAllBottles();
      setBottles(response.data);
    } catch (err) {
      setError('Failed to load inventory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterBottles = () => {
    let filtered = bottles;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(bottle =>
        bottle.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bottle.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bottle.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tab
    if (tabValue !== 0) {
      filtered = filtered.filter(bottle => {
        const status = getExpirationStatus(bottle.expirationDate);
        if (tabValue === 1) return status.status === 'critical' || status.status === 'expired';
        if (tabValue === 2) return status.status === 'warning';
        if (tabValue === 3) return status.status === 'good';
        return true;
      });
    }

    setFilteredBottles(filtered);
  };

  const handleEditOpen = (bottle) => {
    setEditFormData({
      name: bottle.name || '',
      brand: bottle.brand || '',
      mg: bottle.mg || '',
      bottleSize: bottle.bottleSize || '',
      batchNumber: bottle.batchNumber || '',
      expirationDate: bottle.expirationDate || '',
    });
    setEditDialog({ open: true, bottle });
  };

  const handleEditClose = () => {
    setEditDialog({ open: false, bottle: null });
    setEditFormData({});
  };

  const handleEditSave = async () => {
    if (!editFormData.name || !editFormData.expirationDate) {
      alert('Name and expiration date are required');
      return;
    }

    setSaving(true);
    try {
      await inventoryAPI.updateBottle(editDialog.bottle._id, editFormData);
      await loadBottles();
      handleEditClose();
    } catch (err) {
      alert('Failed to update bottle');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOpen = (bottle) => {
    setDeleteDialog({ open: true, bottle });
  };

  const handleDeleteClose = () => {
    setDeleteDialog({ open: false, bottle: null });
  };

  const handleDeleteConfirm = async () => {
    setSaving(true);
    try {
      await inventoryAPI.deleteBottle(deleteDialog.bottle._id);
      await loadBottles();
      handleDeleteClose();
    } catch (err) {
      alert('Failed to delete bottle');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectBottle = (bottleId) => {
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

  const handleBulkDeleteOpen = () => {
    setBulkDeleteDialog(true);
  };

  const handleBulkDeleteClose = () => {
    setBulkDeleteDialog(false);
  };

  const handleBulkDeleteConfirm = async () => {
    setSaving(true);
    try {
      await Promise.all(selectedBottles.map(id => inventoryAPI.deleteBottle(id)));
      await loadBottles();
      setSelectedBottles([]);
      handleBulkDeleteClose();
    } catch (err) {
      alert('Failed to delete bottles');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getStats = () => {
    const critical = bottles.filter(b => {
      const s = getExpirationStatus(b.expirationDate);
      return s.status === 'critical' || s.status === 'expired';
    }).length;
    
    const warning = bottles.filter(b => {
      const s = getExpirationStatus(b.expirationDate);
      return s.status === 'warning';
    }).length;
    
    const good = bottles.filter(b => {
      const s = getExpirationStatus(b.expirationDate);
      return s.status === 'good';
    }).length;

    return { critical, warning, good, total: bottles.length };
  };

  const stats = getStats();

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading inventory...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inventory Dashboard
        </Typography>
        <IconButton onClick={loadBottles} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Bottles
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffcdd2' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Critical / Expired
              </Typography>
              <Typography variant="h4" color="#f44336">
                {stats.critical}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff9c4' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Warning (7-30 days)
              </Typography>
              <Typography variant="h4" color="#FFC107">
                {stats.warning}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#c8e6c9' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Good (&gt;30 days)
              </Typography>
              <Typography variant="h4" color="#4CAF50">
                {stats.good}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Search by name or batch number"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label={`All (${bottles.length})`} />
        <Tab label={`Critical (${stats.critical})`} />
        <Tab label={`Warning (${stats.warning})`} />
        <Tab label={`Good (${stats.good})`} />
      </Tabs>

      {/* Selection Controls */}
      {filteredBottles.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              checked={selectedBottles.length === filteredBottles.length && filteredBottles.length > 0}
              indeterminate={selectedBottles.length > 0 && selectedBottles.length < filteredBottles.length}
              onChange={handleSelectAll}
            />
            <Typography variant="body2">
              {selectedBottles.length === 0 
                ? 'Select bottles to delete multiple at once'
                : `${selectedBottles.length} selected`}
            </Typography>
          </Box>
          {selectedBottles.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={handleBulkDeleteOpen}
            >
              Delete Selected ({selectedBottles.length})
            </Button>
          )}
        </Box>
      )}

      {/* Bottles Grid */}
      <Grid container spacing={2}>
        {filteredBottles.map((bottle) => {
          const expStatus = getExpirationStatus(bottle.expirationDate);
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={bottle._id}>
              <Card
                sx={{
                  borderLeft: `6px solid ${expStatus.color}`,
                  height: '100%',
                  bgcolor: expStatus.bgColor,
                  position: 'relative',
                }}
              >
                <Checkbox
                  checked={selectedBottles.includes(bottle._id)}
                  onChange={() => handleSelectBottle(bottle._id)}
                  sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
                />
                <CardContent sx={{ pt: 5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      {bottle.name}
                    </Typography>
                    <Chip
                      label={expStatus.label}
                      size="small"
                      sx={{
                        bgcolor: expStatus.color,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                  
                  {bottle.brand && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Brand:</strong> {bottle.brand}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Strength:</strong> {bottle.mg || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Size:</strong> {bottle.bottleSize || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Batch:</strong> {bottle.batchNumber || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Expires:</strong> {formatDate(bottle.expirationDate)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleEditOpen(bottle)}
                    title="Edit bottle"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteOpen(bottle)}
                    title="Delete bottle"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredBottles.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No bottles found
          </Typography>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Bottle</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Product Name *"
              fullWidth
              value={editFormData.name || ''}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              disabled={saving}
            />
            <TextField
              label="Brand Name"
              fullWidth
              value={editFormData.brand || ''}
              onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
              disabled={saving}
            />
            <TextField
              label="Nicotine Strength (mg)"
              fullWidth
              placeholder="e.g., 3mg, 6mg"
              value={editFormData.mg || ''}
              onChange={(e) => setEditFormData({ ...editFormData, mg: e.target.value })}
              disabled={saving}
            />
            <TextField
              label="Bottle Size"
              fullWidth
              placeholder="e.g., 30ml, 60ml"
              value={editFormData.bottleSize || ''}
              onChange={(e) => setEditFormData({ ...editFormData, bottleSize: e.target.value })}
              disabled={saving}
            />
            <TextField
              label="Batch Number"
              fullWidth
              value={editFormData.batchNumber || ''}
              onChange={(e) => setEditFormData({ ...editFormData, batchNumber: e.target.value })}
              disabled={saving}
            />
            <TextField
              label="Expiration Date *"
              fullWidth
              placeholder="MM/DD/YYYY"
              value={editFormData.expirationDate || ''}
              onChange={(e) => setEditFormData({ ...editFormData, expirationDate: e.target.value })}
              disabled={saving}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteClose}>
        <DialogTitle>Delete Bottle</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteDialog.bottle?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialog} onClose={handleBulkDeleteClose}>
        <DialogTitle>Delete Multiple Bottles</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedBottles.length} bottle{selectedBottles.length > 1 ? 's' : ''}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkDeleteClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleBulkDeleteConfirm} variant="contained" color="error" disabled={saving}>
            {saving ? 'Deleting...' : `Delete ${selectedBottles.length} Bottles`}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
