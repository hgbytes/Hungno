const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MealSelection = require('../models/MealSelection');
const { Op } = require('sequelize');

// Get all meal selections for a user
router.get('/', auth, async (req, res) => {
  try {
    const mealSelections = await MealSelection.findAll({
      where: { userId: req.user.id }
    });
    res.json(mealSelections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a meal selection
router.post('/', auth, async (req, res) => {
  try {
    const { mealId, date } = req.body;
    const mealSelection = await MealSelection.create({
      userId: req.user.id,
      mealId,
      date
    });
    res.json(mealSelection);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ msg: 'Meal selection for this date already exists' });
    }
    res.status(500).send('Server Error');
  }
});

// Update a meal selection
router.put('/:id', auth, async (req, res) => {
  try {
    const { mealId, date } = req.body;
    let mealSelection = await MealSelection.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!mealSelection) {
      return res.status(404).json({ msg: 'Meal selection not found' });
    }

    mealSelection = await mealSelection.update({
      mealId,
      date
    });

    res.json(mealSelection);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ msg: 'Meal selection for this date already exists' });
    }
    res.status(500).send('Server Error');
  }
});

// Delete a meal selection
router.delete('/:id', auth, async (req, res) => {
  try {
    const mealSelection = await MealSelection.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!mealSelection) {
      return res.status(404).json({ msg: 'Meal selection not found' });
    }

    await mealSelection.destroy();
    res.json({ msg: 'Meal selection removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get selected meal types for tomorrow
router.get('/selected-types', auth, async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const selection = await MealSelection.findOne({
      where: { 
        userId: req.user.id,
        date: tomorrow
      }
    });

    res.json({ mealTypes: selection ? selection.mealTypes : [] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Select meal types for tomorrow
router.post('/select-type', auth, async (req, res) => {
  try {
    const { mealTypes } = req.body;
    
    if (!Array.isArray(mealTypes)) {
      return res.status(400).json({ msg: 'Meal types must be an array' });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Check if it's past 10 PM
    const now = new Date();
    if (now.getHours() >= 22) {
      return res.status(400).json({ msg: 'Meal selections must be made before 10 PM' });
    }

    // Find or create selection for tomorrow
    let [selection, created] = await MealSelection.findOrCreate({
      where: { 
        userId: req.user.id,
        date: tomorrow
      },
      defaults: {
        mealTypes: mealTypes
      }
    });

    if (!created) {
      // Update existing selection
      selection = await selection.update({
        mealTypes: mealTypes
      });
    }

    res.json(selection);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error saving meal selection' });
  }
});

module.exports = router; 