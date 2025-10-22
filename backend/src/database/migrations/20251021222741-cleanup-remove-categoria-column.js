// backend/src/database/migrations/TIMESTAMP-cleanup-remove-categoria-column.js

'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
 
    await queryInterface.sequelize.query(
      'ALTER TABLE `transactions` DROP COLUMN `categoria`;'
    );
  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.sequelize.query(
      'ALTER TABLE `transactions` ADD COLUMN `categoria` VARCHAR(255) NULL;'
    );
  },
};