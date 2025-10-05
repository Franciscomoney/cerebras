'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add name column
    await queryInterface.addColumn('Alerts', 'name', {
      type: Sequelize.STRING,
      allowNull: true, // Temporarily allow null
    });

    // Add keywords column
    await queryInterface.addColumn('Alerts', 'keywords', {
      type: Sequelize.TEXT,
      allowNull: true, // Temporarily allow null
    });

    // Update existing records - set name from query and keywords from query
    await queryInterface.sequelize.query(`
      UPDATE "Alerts" 
      SET 
        name = COALESCE(SUBSTRING(query FROM 1 FOR 50), 'Alert'),
        keywords = query
      WHERE name IS NULL OR keywords IS NULL
    `);

    // Now make columns not nullable
    await queryInterface.changeColumn('Alerts', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('Alerts', 'keywords', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Alerts', 'name');
    await queryInterface.removeColumn('Alerts', 'keywords');
  }
};