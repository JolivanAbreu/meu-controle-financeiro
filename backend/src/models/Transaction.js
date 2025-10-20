// backend/src/models/Transaction.js

const { Model, DataTypes } = require('sequelize');

class Transaction extends Model {
  static init(sequelize) {
    super.init(
      {
        user_id: DataTypes.INTEGER,
        tipo: DataTypes.ENUM('receita', 'despesa'),
        categoria: DataTypes.STRING,
        valor: DataTypes.DECIMAL(10, 2),
        data: DataTypes.DATEONLY,
        descricao: DataTypes.TEXT,
        recurrence: DataTypes.ENUM('fixo', 'variável'),
        recurrence_group_id: DataTypes.STRING,
        recurrence_end_date: DataTypes.DATEONLY,
      },
      {
        sequelize,
        tableName: 'transactions',
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

module.exports = Transaction;