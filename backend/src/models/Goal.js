// backend/src/models/Goal.js

const { Model, DataTypes } = require('sequelize');

class Goal extends Model {
    static init(sequelize) {
        super.init(
            {
                titulo: DataTypes.STRING,
                valor_objetivo: DataTypes.DECIMAL(10, 2),
                valor_atual: {
                    type: DataTypes.DECIMAL(10, 2),
                    defaultValue: 0.00
                },
                prazo: DataTypes.DATEONLY,
                userId: {
                    type: DataTypes.INTEGER,
                    field: 'user_id',
                }
            },
            {
                sequelize,
                tableName: 'goals',
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        this.hasMany(models.GoalContribution, { foreignKey: 'goalId', as: 'contributions' });
    }
}

module.exports = Goal;