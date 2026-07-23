// backend/src/database/migrations/TIMESTAMP-create-goal-contributions.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('goal_contributions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      goal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'goals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', 
      },
      valor: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      data: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('goal_contributions', ['user_id']);
    await queryInterface.addIndex('goal_contributions', ['goal_id']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('goal_contributions');
  },
};