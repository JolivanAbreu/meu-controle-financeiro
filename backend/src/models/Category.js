// backend/src/models/Category.js

const { Model, DataTypes } = require('sequelize');

class Category extends Model {
  static init(sequelize) {
    super.init(
      {
        name: DataTypes.STRING,
        cor: DataTypes.STRING,
      },
      {
        sequelize,
        tableName: 'categories',
      }
    );
  }

  static associate(models) {
    this.hasMany(models.Subcategory, {
      foreignKey: 'categoryId',
      as: 'subcategories',
    });
    this.hasMany(models.Budget, {
      foreignKey: 'categoryId',
      as: 'budgets',
    });
  }
}

module.exports = Category;