'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transactions', 'card_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'cards', key: 'id' },
      onUpdate: 'CASCADE',
      // SET NULL em vez de CASCADE: apagar um cartão nunca deve apagar
      // o histórico de transações, só desvincula o cartão usado.
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('transactions', ['card_id'], {
      name: 'transactions_card_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('transactions', 'transactions_card_id_idx');
    await queryInterface.removeColumn('transactions', 'card_id');
  },
};