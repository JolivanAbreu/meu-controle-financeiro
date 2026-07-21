'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false,
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      banco: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      bandeira: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tipo: {
        type: Sequelize.ENUM('fisico', 'virtual'),
        allowNull: false,
        defaultValue: 'fisico',
      },
      // Auto-relacionamento: aponta para o cartão físico ao qual este cartão virtual pertence.
      // Sempre NULL para cartões físicos.
      cartao_pai_id: {
        type: Sequelize.INTEGER,
        references: { model: 'cards', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: true,
      },
      // Para cartões virtuais, estes três campos ficam NULL: o valor efetivo
      // é sempre herdado do cartão físico pai (ver CardController).
      limite_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      dia_fechamento: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      dia_vencimento: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cor: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('cards', ['user_id', 'ativo'], {
      name: 'cards_user_ativo_idx',
    });
    await queryInterface.addIndex('cards', ['cartao_pai_id'], {
      name: 'cards_cartao_pai_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cards');
  },
};