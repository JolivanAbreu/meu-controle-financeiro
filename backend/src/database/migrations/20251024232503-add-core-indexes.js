'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Adding core indexes...');

    // Função auxiliar para evitar repetição de código try/catch
    const addIndexSafe = async (table, columns, name) => {
      try {
        await queryInterface.addIndex(table, columns, { name });
        console.log(`[SUCCESS] Index ${name} on ${table} added.`);
      } catch (error) {
        const errorCode = error.original ? error.original.errno : null;

        if (errorCode === 1061) {
          console.warn(`[SKIP] Index ${name} already exists.`);
        } else if (errorCode === 1072) {
          console.error(`[SKIP] Column ${columns} does not exist in ${table}. Index ${name} not created.`);
        } else {
          throw error;
        }
      }
    };

    // --- Tabela transactions ---
    await addIndexSafe('transactions', ['user_id'], 'transactions_user_id_idx');
    await addIndexSafe('transactions', ['subcategory_id'], 'transactions_subcategory_id_idx');
    await addIndexSafe('transactions', ['data'], 'transactions_data_idx');

    // --- Tabela subcategories ---
    await addIndexSafe('subcategories', ['user_id'], 'subcategories_user_id_idx');
    await addIndexSafe('subcategories', ['category_id'], 'subcategories_category_id_idx');

    console.log('Core indexes process finished.');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Removing core indexes...');

    const removeIndexSafe = async (table, name) => {
      try {
        await queryInterface.removeIndex(table, name);
        console.log(`[REMOVED] Index ${name} from ${table}.`);
      } catch (error) {
        console.warn(`[SKIP] Could not remove index ${name} (maybe it doesn't exist).`);
      }
    };

    await removeIndexSafe('transactions', 'transactions_user_id_idx');
    await removeIndexSafe('transactions', 'transactions_subcategory_id_idx');
    await removeIndexSafe('transactions', 'transactions_data_idx');
    await removeIndexSafe('subcategories', 'subcategories_user_id_idx');
    await removeIndexSafe('subcategories', 'subcategories_category_id_idx');

    console.log('Core indexes removal finished.');
  }
};