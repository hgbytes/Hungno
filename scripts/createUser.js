const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/meal-management');
    console.log('Connected to MongoDB');

    // First check if user exists
    const existingUser = await User.findOne({ email: 'admin@test.com' });
    if (existingUser) {
      console.log('User already exists. You can login with:');
      console.log('Email: admin@test.com');
      console.log('Password: admin123');
      return;
    }

    const user = new User({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    });

    await user.save();
    console.log('User created successfully!');
    console.log('You can now login with:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');

  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await mongoose.connection.close();
  }
}

createUser(); 