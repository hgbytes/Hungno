const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Meal = require('../models/Meal');
const User = require('../models/User');
const MealSelection = require('../models/MealSelection');
const io = require('../server').io;

// @route   GET api/meals
// @desc    Get all meals
// @access  Public
router.get('/', async (req, res) => {
  try {
    const meals = await Meal.find().sort({ date: 1 });
    res.json(meals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/meals
// @desc    Create a meal (admin only)
// @access  Private
router.post('/', [auth, [
  check('name', 'Name is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('date', 'Date is required').not().isEmpty(),
  check('type', 'Type is required').isIn(['breakfast', 'lunch', 'dinner']),
  check('calories', 'Calories is required').isNumeric()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const newMeal = new Meal({
      ...req.body
    });

    const meal = await newMeal.save();
    res.json(meal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/meals/:id
// @desc    Update a meal (admin only)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    let meal = await Meal.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({ msg: 'Meal not found' });
    }

    meal = await Meal.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(meal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/meals/select/:id
// @desc    Select a meal for tomorrow
// @access  Private
router.post('/select/:id', auth, async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({ msg: 'Meal not found' });
    }

    const user = await User.findById(req.user.id);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Remove any existing selection for tomorrow
    user.selectedMeals = user.selectedMeals.filter(
      selection => selection.date.toDateString() !== tomorrow.toDateString()
    );

    // Add new selection
    user.selectedMeals.push({
      date: tomorrow,
      mealId: meal._id
    });

    await user.save();
    res.json(user.selectedMeals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/meals/selected
// @desc    Get user's selected meals
// @access  Private
router.get('/selected', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('selectedMeals.mealId');
    res.json(user.selectedMeals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/meals/select-type
// @desc    Select meal types preference for tomorrow
// @access  Private
router.post('/select-type', auth, async (req, res) => {
  try {
    const { mealTypes } = req.body;

    // Check if array of meal types is provided
    if (!Array.isArray(mealTypes) || mealTypes.length === 0) {
      return res.status(400).json({ msg: 'Please select at least one meal type' });
    }

    // Validate all meal types
    const validTypes = ['breakfast', 'lunch', 'dinner'];
    const invalidTypes = mealTypes.filter(type => !validTypes.includes(type));
    if (invalidTypes.length > 0) {
      return res.status(400).json({ msg: 'Invalid meal type(s) selected' });
    }

    // Check if it's past 10 PM
    const now = new Date();
    if (now.getHours() >= 22) {
      return res.status(400).json({ msg: 'Meal selections must be made before 10 PM' });
    }

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    // Check if user has already made a selection for tomorrow
    let existingSelection = await MealSelection.findOne({ 
      user: req.user.id,
      date: tomorrowDate
    });

    if (existingSelection) {
      return res.status(400).json({ msg: 'You have already made your meal selection for tomorrow' });
    }

    // Create new selection for tomorrow
    const selection = new MealSelection({
      user: req.user.id,
      mealTypes,
      date: tomorrowDate
    });
    await selection.save();

    // Emit real-time update
    const stats = await getWeeklyStats();
    io.to('admin').emit('mealSelectionUpdate', stats);

    res.json({ 
      msg: 'Meal selection saved for tomorrow',
      selection 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Helper function to get weekly stats
async function getWeeklyStats() {
  const today = new Date();
  const sixDaysAgo = new Date(today);
  sixDaysAgo.setDate(today.getDate() - 6);

  const selections = await MealSelection.find({
    date: {
      $gte: sixDaysAgo.toISOString().split('T')[0],
      $lte: today.toISOString().split('T')[0]
    }
  });

  const todayStats = {
    breakfast: 0,
    lunch: 0,
    dinner: 0
  };

  const weeklyStats = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayStats = {
      date: dateStr,
      breakfast: 0,
      lunch: 0,
      dinner: 0
    };

    selections.forEach(selection => {
      if (selection.date === dateStr) {
        selection.mealTypes.forEach(type => {
          dayStats[type]++;
          if (i === 0) {
            todayStats[type]++;
          }
        });
      }
    });

    weeklyStats.push(dayStats);
  }

  return {
    today: todayStats,
    weekly: weeklyStats
  };
}

// @route   GET api/meals/selected-types
// @desc    Get user's selected meal types for tomorrow
// @access  Private
router.get('/selected-types', auth, async (req, res) => {
  try {
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const selection = await MealSelection.findOne({
      user: req.user.id,
      date: tomorrowDate
    });

    res.json({
      mealTypes: selection ? selection.mealTypes : [],
      date: tomorrowDate
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/meals/selections/stats
// @desc    Get meal selection statistics
// @access  Private/Admin
router.get('/selections/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    const stats = await MealSelection.aggregate([
      {
        $match: {
          date: today
        }
      },
      {
        $unwind: '$mealTypes'
      },
      {
        $group: {
          _id: '$mealTypes',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format stats into an object
    const formattedStats = {
      breakfast: 0,
      lunch: 0,
      dinner: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    res.json(formattedStats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/meals/selections/weekly-stats
// @desc    Get weekly meal selection statistics
// @access  Private/Admin
router.get('/selections/weekly-stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Get today's date and 6 days ago
    const today = new Date();
    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(today.getDate() - 6);

    // Get all selections for the last 7 days
    const selections = await MealSelection.find({
      date: {
        $gte: sixDaysAgo.toISOString().split('T')[0],
        $lte: today.toISOString().split('T')[0]
      }
    });

    // Format the data for today's stats
    const todayStats = {
      breakfast: 0,
      lunch: 0,
      dinner: 0
    };

    // Format the data for weekly stats
    const weeklyStats = [];

    // Process each day's data
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayStats = {
        date: dateStr,
        breakfast: 0,
        lunch: 0,
        dinner: 0
      };

      // Count selections for this day
      selections.forEach(selection => {
        if (selection.date === dateStr) {
          selection.mealTypes.forEach(type => {
            dayStats[type]++;
            if (i === 0) { // If it's today
              todayStats[type]++;
            }
          });
        }
      });

      weeklyStats.push(dayStats);
    }

    res.json({
      today: todayStats,
      weekly: weeklyStats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 