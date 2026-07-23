'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('budgets', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'categories', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Preenche category_id para os orçamentos já existentes, casando pelo
    // nome salvo em `categoria` (best-effort — nomes com erro de digitação
    // ou grafia diferente ficam com category_id nulo e precisam ser
    // corrigidos manualmente editando o orçamento na tela).
    await queryInterface.sequelize.query(`
      UPDATE budgets
      SET category_id = (
        SELECT id FROM categories WHERE categories.name = budgets.categoria LIMIT 1
      )
      WHERE category_id IS NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('budgets', 'category_id');
  },
};