// backend/src/models/Transaction.js

const { Model, DataTypes } = require('sequelize');

class Transaction extends Model {
  static init(sequelize) {
    super.init(
      {
        user_id: DataTypes.INTEGER,
        tipo: DataTypes.ENUM('receita', 'despesa'),
        valor: DataTypes.DECIMAL(10, 2),
        data: DataTypes.DATEONLY,
        descricao: DataTypes.TEXT,
        subcategory_id: DataTypes.INTEGER,
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
    this.belongsTo(models.Subcategory, {
      foreignKey: 'subcategoryId',
      as: 'subcategory',
    });
  }
}

module.exports = Transaction;