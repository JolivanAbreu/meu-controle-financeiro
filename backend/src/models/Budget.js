// backend/src/models/Budget.js

const { Model, DataTypes } = require('sequelize');

class Budget extends Model {
    static init(sequelize) {
        super.init(
            {
                categoria: DataTypes.STRING,
                limite: DataTypes.DECIMAL(10, 2),
                mes: DataTypes.INTEGER,
                ano: DataTypes.INTEGER,
            },
            {
                sequelize,
                tableName: 'budgets',
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
}

module.exports = Budget;