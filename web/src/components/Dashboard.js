import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { inventoryAPI } from '../services/api';
import { getExpirationStatus, formatDate } from '../utils/dateUtils';

const Dashboard = () => {
  const [bottles, setBottles] = useState([]);
  const [filteredBottles, setFilteredBottles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Critical, 2: Warning, 3: Good

  useEffect(() => {
    loadBottles();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadBottles();
    }, 10000); // 10 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterBottles();
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
                }}
              >
                <CardContent>
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
    </Container>
  );
};

export default Dashboard;
