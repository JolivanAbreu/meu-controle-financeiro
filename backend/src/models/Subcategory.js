// backend/src/models/Subcategory.js
const { Model, DataTypes } = require('sequelize');

class Subcategory extends Model {
  static init(sequelize) {
    super.init(
      {
        name: DataTypes.STRING,
      },
      {
        sequelize,
        tableName: 'subcategories',
      }
    );
  }

  static associate(models) {
    // Uma Subcategoria pertence a um Usuário (quem a criou)
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    // Uma Subcategoria pertence a uma Categoria (a principal)
    this.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    // Uma Subcategoria pode ter muitas Transações
    this.hasMany(models.Transaction, {
      foreignKey: 'subcategoryId',
      as: 'transactions',
    });
  }
}

module.exports = Subcategory; // MUDANÇA AQUI