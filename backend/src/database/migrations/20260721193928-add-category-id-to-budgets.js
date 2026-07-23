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