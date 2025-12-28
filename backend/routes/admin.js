const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { updateGoogleSheet, getInventoryCounts } = require('../updateGoogleSheet');

/**
 * @route   POST /api/admin/update-sheet
 * @desc    Trigger Google Sheet update with current user's inventory
 * @access  Private
 * @body    { spreadsheetId: 'optional-custom-sheet-id' }
 */
router.post('/update-sheet', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Use provided spreadsheetId or user's saved one
    const { spreadsheetId } = req.body;
    const targetSheetId = spreadsheetId || user.spreadsheetId;
    
    if (!targetSheetId) {
      return res.status(400).json({ 
        success: false, 
        error: 'No spreadsheet linked. Please set up your Google Sheet first.',
        needsSetup: true
      });
    }
    
    console.log(`📊 Updating sheet for user: ${userId}`);
    
    // Update sheet with only this user's inventory
    await updateGoogleSheet(userId, targetSheetId);
    
    res.json({ 
      success: true, 
      message: 'Google Sheet updated with your inventory',
      spreadsheetId: targetSheetId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating sheet:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/admin/inventory-counts
 * @desc    Get current user's inventory counts from database
 * @access  Private
 */
router.get('/inventory-counts', auth, async (req, res) => {
  try {
    const userId = req.user.id; // Get logged-in user's ID
    const counts = await getInventoryCounts(userId);
    
    res.json({ 
      success: true, 
      data: counts,
      total: Object.keys(counts).length,
      userId: userId
    });
  } catch (error) {
    console.error('Error getting inventory counts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/admin/setup-sheet
 * @desc    Save user's Google Sheet ID and name
 * @access  Private
 * @body    { spreadsheetId: 'required', spreadsheetName: 'optional' }
 */
router.post('/setup-sheet', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { spreadsheetId, spreadsheetName } = req.body;
    
    if (!spreadsheetId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Spreadsheet ID is required' 
      });
    }
    
    // Update user with spreadsheet info
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        spreadsheetId,
        spreadsheetName: spreadsheetName || 'My Inventory'
      },
      { new: true }
    );
    
    res.json({ 
      success: true, 
      message: 'Google Sheet linked successfully',
      spreadsheetId: user.spreadsheetId,
      spreadsheetName: user.spreadsheetName,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${user.spreadsheetId}/edit`
    });
  } catch (error) {
    console.error('Error saving sheet:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/admin/my-sheet
 * @desc    Get user's linked Google Sheet info
 * @access  Private
 */
router.get('/my-sheet', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('spreadsheetId spreadsheetName');
    
    if (!user.spreadsheetId) {
      return res.json({ 
        success: true, 
        hasSheet: false,
        message: 'No Google Sheet linked yet'
      });
    }
    
    res.json({ 
      success: true, 
      hasSheet: true,
      spreadsheetId: user.spreadsheetId,
      spreadsheetName: user.spreadsheetName,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${user.spreadsheetId}/edit`
    });
  } catch (error) {
    console.error('Error getting sheet info:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
