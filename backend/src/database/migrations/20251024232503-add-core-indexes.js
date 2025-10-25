// backend/src/database/migrations/TIMESTAMP-add-core-indexes.js

'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Adding core indexes...');

    // --- Tabela transactions ---
    // Índice para buscar transações por usuário (MUITO IMPORTANTE)
    await queryInterface.addIndex('transactions', ['user_id'], { name: 'transactions_user_id_idx' });
    console.log('Added index on transactions(user_id)');

    // Índice para buscar transações por subcategoria
    await queryInterface.addIndex('transactions', ['subcategory_id'], { name: 'transactions_subcategory_id_idx' });
    console.log('Added index on transactions(subcategory_id)');

    // Índice para filtros e ordenação por data (MUITO IMPORTANTE)
    await queryInterface.addIndex('transactions', ['data'], { name: 'transactions_data_idx' });
    console.log('Added index on transactions(data)');

    // --- Tabela subcategories ---
    // Índice para buscar subcategorias por usuário
    await queryInterface.addIndex('subcategories', ['user_id'], { name: 'subcategories_user_id_idx' });
    console.log('Added index on subcategories(user_id)');

    // Índice para buscar subcategorias por categoria pai
    await queryInterface.addIndex('subcategories', ['category_id'], { name: 'subcategories_category_id_idx' });
    console.log('Added index on subcategories(category_id)');

    console.log('Core indexes added successfully.');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Removing core indexes...');
    await queryInterface.removeIndex('transactions', 'transactions_user_id_idx');
    await queryInterface.removeIndex('transactions', 'transactions_subcategory_id_idx');
    await queryInterface.removeIndex('transactions', 'transactions_data_idx');
    await queryInterface.removeIndex('subcategories', 'subcategories_user_id_idx');
    await queryInterface.removeIndex('subcategories', 'subcategories_category_id_idx');
    console.log('Core indexes removed.');
  }
};