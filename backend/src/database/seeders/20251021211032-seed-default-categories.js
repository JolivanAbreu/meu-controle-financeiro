// backend/src/database/seeders/TIMESTAMP-seed-default-categories.js

'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('categories', [
      { name: 'Alimentação', created_at: new Date(), updated_at: new Date() },
      { name: 'Transporte', created_at: new Date(), updated_at: new Date() },
      { name: 'Lazer', created_at: new Date(), updated_at: new Date() },
      { name: 'Moradia', created_at: new Date(), updated_at: new Date() },
      { name: 'Saúde', created_at: new Date(), updated_at: new Date() },
      { name: 'Educação', created_at: new Date(), updated_at: new Date() },
      { name: 'Dívidas/Empréstimos', created_at: new Date(), updated_at: new Date() },
      { name: 'Investimentos', created_at: new Date(), updated_at: new Date() },
      { name: 'Receitas', created_at: new Date(), updated_at: new Date() },
      { name: 'Outros', created_at: new Date(), updated_at: new Date() },
    ], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('categories', null, {});
  }
};