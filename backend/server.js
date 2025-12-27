const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from web build (only if build exists)
const webBuildPath = path.join(__dirname, 'web/build');
const fs = require('fs');
if (fs.existsSync(webBuildPath)) {
  app.use(express.static(webBuildPath));
}

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/ocr', require('./routes/ocr'));
app.use('/api/ai-ocr', require('./routes/aiOcr'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve React app for all other routes (only if build exists)
const webIndexPath = path.join(__dirname, 'web/build', 'index.html');
if (fs.existsSync(webIndexPath)) {
  app.get('*', (req, res) => {
    res.sendFile(webIndexPath);
  });
} else {
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Vape Inventory API', 
      status: 'running',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        inventory: '/api/inventory',
        ocr: '/api/ocr',
        aiOcr: '/api/ai-ocr'
      }
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
