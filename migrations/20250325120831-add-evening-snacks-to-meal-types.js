'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, we need to modify the enum type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_MealSelections_mealTypes" ADD VALUE IF NOT EXISTS 'evening-snacks';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing values from enum types
    // We'll need to handle this differently if we need to remove the value
    console.log('Cannot remove enum value in PostgreSQL');
  }
};
