// backend/src/models/GoalContribution.js
const { Model, DataTypes } = require('sequelize');

class GoalContribution extends Model {
    static init(sequelize) {
        super.init(
            {
                valor: DataTypes.DECIMAL(10, 2),
                data: DataTypes.DATEONLY,
                goalId: {
                    type: DataTypes.INTEGER,
                    field: 'goal_id',
                },
                userId: {
                    type: DataTypes.INTEGER,
                    field: 'user_id',
                },
            },
            {
                sequelize,
                tableName: 'goal_contributions',
            }
        );
        return this;
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        this.belongsTo(models.Goal, { foreignKey: 'goalId', as: 'goal' });
    }
}

module.exports = GoalContribution;