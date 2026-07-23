// No arquivo de migration (ex: XXXXXX-add-recurrence-to-transactions.js)
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('transactions', 'recurrence', {
      type: Sequelize.ENUM('fixo', 'variável'),
      allowNull: false,
      defaultValue: 'variável',
    });
    await queryInterface.addColumn('transactions', 'recurrence_group_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('transactions', 'recurrence');
    await queryInterface.removeColumn('transactions', 'recurrence_group_id');
  }
};