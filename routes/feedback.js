const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Meal = require('../models/Meal');

// @route   POST api/feedback/:mealId
// @desc    Submit feedback for a meal
// @access  Private
router.post('/:mealId', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const mealId = req.params.mealId;

    // Validate meal exists
    const meal = await Meal.findById(mealId);
    if (!meal) {
      return res.status(404).json({ msg: 'Meal not found' });
    }

    // Check if user has already submitted feedback for this meal
    let feedback = await Feedback.findOne({ user: req.user.id, meal: mealId });
    
    if (feedback) {
      // Update existing feedback
      feedback.rating = rating;
      feedback.comment = comment;
      await feedback.save();
      return res.json(feedback);
    }

    // Create new feedback
    feedback = new Feedback({
      user: req.user.id,
      meal: mealId,
      rating,
      comment
    });

    await feedback.save();
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/feedback
// @desc    Get all feedback (admin only)
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const feedback = await Feedback.find()
      .populate('user', ['name', 'email'])
      .populate('meal', ['name', 'type', 'date'])
      .sort({ createdAt: -1 });
    
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/feedback/meal/:mealId
// @desc    Get all feedback for a specific meal (admin only)
// @access  Private/Admin
router.get('/meal/:mealId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const feedback = await Feedback.find({ meal: req.params.mealId })
      .populate('user', ['name', 'email'])
      .populate('meal', ['name', 'type', 'date'])
      .sort({ createdAt: -1 });
    
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/feedback/user
// @desc    Get all feedback submitted by the logged-in user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user.id })
      .populate('meal', ['name', 'type', 'date'])
      .sort({ createdAt: -1 });
    
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 