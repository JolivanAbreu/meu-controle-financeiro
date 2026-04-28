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
      user_id: { // Para garantir que a contribuição pertence ao usuário
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      goal_id: { // Chave estrangeira para a Meta
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'goals', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Se a meta for excluída, as contribuições somem
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
    // Adicionar índices para performance
    await queryInterface.addIndex('goal_contributions', ['user_id']);
    await queryInterface.addIndex('goal_contributions', ['goal_id']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('goal_contributions');
  },
};