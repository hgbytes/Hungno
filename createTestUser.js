const { sequelize } = require('./config/db');
const User = require('./models/User');
const Meal = require('./models/Meal');
const MealSelection = require('./models/MealSelection');
const Feedback = require('./models/Feedback');
require('dotenv').config();

async function createTestUser() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('PostgreSQL Connected');

    // Force sync all models (this will create tables)
    await sequelize.sync({ force: true });
    console.log('Database synchronized and tables created');

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: 'admin@test.com' } });
    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Create test user
    const testUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('Test user created successfully');
    console.log('Login credentials:');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');

    // Create some test meals
    await Meal.bulkCreate([
      {
        name: 'Chicken Rice',
        description: 'Delicious chicken served with fragrant rice',
        type: 'lunch',
        imageUrl: 'https://example.com/chicken-rice.jpg'
      },
      {
        name: 'Beef Noodles',
        description: 'Tender beef in savory broth with noodles',
        type: 'dinner',
        imageUrl: 'https://example.com/beef-noodles.jpg'
      },
      {
        name: 'Vegetarian Salad',
        description: 'Fresh mixed vegetables with vinaigrette',
        type: 'lunch',
        imageUrl: 'https://example.com/salad.jpg'
      }
    ]);

    console.log('Test meals created successfully');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
    console.log('Database connection closed');
  }
}

createTestUser(); 