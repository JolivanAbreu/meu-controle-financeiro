// backend/src/database/migrations/TIMESTAMP-update-transactions-add-subcategory.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Deixamos a função UP vazia para "enganar" o Sequelize
    // e marcá-la como concluída.
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // Deixamos a função DOWN vazia
    return Promise.resolve();
  },
};