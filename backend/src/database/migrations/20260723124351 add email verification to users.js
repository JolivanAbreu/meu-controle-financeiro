'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'email_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('users', 'email_verification_token', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Usuários já existentes não devem ficar travados por uma funcionalidade
    // que não existia quando eles se cadastraram.
    await queryInterface.sequelize.query(`
      UPDATE users SET email_verified = true WHERE email_verified = false
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'email_verified');
    await queryInterface.removeColumn('users', 'email_verification_token');
  },
};