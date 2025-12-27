const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Bottle = require('../models/Bottle');
const auth = require('../middleware/auth');
const { checkBottleLimit } = require('../middleware/subscription');

// @route   GET /api/inventory
// @desc    Get all bottles for logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const bottles = await Bottle.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(bottles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/:id
// @desc    Get single bottle by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const bottle = await Bottle.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!bottle) {
      return res.status(404).json({ message: 'Bottle not found' });
    }

    res.json(bottle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory
// @desc    Create a new bottle
// @access  Private
router.post('/', [
  auth,
  checkBottleLimit, // Check if free user reached limit
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('brand').optional().trim(),
  body('expirationDate').notEmpty().withMessage('Expiration date is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bottleData = {
      ...req.body,
      userId: req.user._id,
    };

    const bottle = new Bottle(bottleData);
    await bottle.save();

    res.status(201).json(bottle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update a bottle
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let bottle = await Bottle.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!bottle) {
      return res.status(404).json({ message: 'Bottle not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        bottle[key] = req.body[key];
      }
    });

    await bottle.save();
    res.json(bottle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete a bottle
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const bottle = await Bottle.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!bottle) {
      return res.status(404).json({ message: 'Bottle not found' });
    }

    res.json({ message: 'Bottle deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/search
// @desc    Search bottles
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const bottles = await Bottle.find({
      userId: req.user._id,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { batchNumber: { $regex: q, $options: 'i' } },
      ],
    }).sort({ createdAt: -1 });

    res.json(bottles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/expiring
// @desc    Get bottles expiring soon
// @access  Private
router.get('/expiring', auth, async (req, res) => {
  try {
    const bottles = await Bottle.find({ userId: req.user._id })
      .sort({ expirationDate: 1 });
    
    // Filter bottles expiring within 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringBottles = bottles.filter(bottle => {
      const expDate = new Date(bottle.expirationDate);
      return expDate >= now && expDate <= thirtyDaysFromNow;
    });

    res.json(expiringBottles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
