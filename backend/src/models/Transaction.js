// backend/src/models/Transaction.js

const { Model, DataTypes } = require('sequelize');

class Transaction extends Model {
  static init(sequelize) {
    super.init(
      {
        tipo: DataTypes.ENUM('receita', 'despesa'),
        valor: DataTypes.DECIMAL(10, 2),
        data: DataTypes.DATEONLY,
        descricao: DataTypes.TEXT,
        recurrence: DataTypes.STRING,
        recurrence_group_id: DataTypes.STRING,
        recurrence_end_date: DataTypes.DATE,

        subcategoryId: {
          type: DataTypes.INTEGER,
          field: 'subcategory_id',
        },
        userId: {
          type: DataTypes.INTEGER,
          field: 'user_id',
        },
      },
      {
        sequelize,
        tableName: 'transactions',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    this.belongsTo(models.Subcategory, {
      foreignKey: 'subcategoryId',
      as: 'subcategory',
    });
  }
}

module.exports = Transaction;