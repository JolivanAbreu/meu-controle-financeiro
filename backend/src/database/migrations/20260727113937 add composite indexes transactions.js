'use strict';

module.exports = {
  up: async (queryInterface) => {
    const existentes = (await queryInterface.showIndex('transactions')).map((i) => i.name);

    if (!existentes.includes('transactions_user_id_data_idx')) {
      await queryInterface.addIndex('transactions', ['user_id', 'data'], {
        name: 'transactions_user_id_data_idx',
      });
    }

    if (!existentes.includes('transactions_card_id_data_idx')) {
      await queryInterface.addIndex('transactions', ['card_id', 'data'], {
        name: 'transactions_card_id_data_idx',
      });
    }
  },

  down: async (queryInterface) => {
    const existentes = (await queryInterface.showIndex('transactions')).map((i) => i.name);

    if (existentes.includes('transactions_user_id_data_idx')) {
      await queryInterface.removeIndex('transactions', 'transactions_user_id_data_idx');
    }
    if (existentes.includes('transactions_card_id_data_idx')) {
      await queryInterface.removeIndex('transactions', 'transactions_card_id_data_idx');
    }
  },
};