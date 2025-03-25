const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const MealSelection = sequelize.define('MealSelection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  mealTypes: {
    type: DataTypes.ARRAY(DataTypes.ENUM('breakfast', 'lunch', 'evening-snacks', 'dinner')),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'date'],
      name: 'unique_user_date'
    }
  ]
});

// Define relationships
MealSelection.belongsTo(User, { foreignKey: 'userId' });

module.exports = MealSelection; 