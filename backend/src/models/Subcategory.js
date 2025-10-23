// backend/src/models/Subcategory.js

const { Model, DataTypes } = require('sequelize');

class Subcategory extends Model {
  static init(sequelize) {
    super.init(
      {
        name: DataTypes.STRING,
        
        categoryId: {
          type: DataTypes.INTEGER,
          field: 'category_id',
        },
        userId: {
          type: DataTypes.INTEGER,
          field: 'user_id', 
        },
      },
      {
        sequelize,
        tableName: 'subcategories',
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    this.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    this.hasMany(models.Transaction, {
      foreignKey: 'subcategoryId',
      as: 'transactions',
    });
  }
}

module.exports = Subcategory;