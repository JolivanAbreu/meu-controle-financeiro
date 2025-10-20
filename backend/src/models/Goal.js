// backend/src/models/Goal.js

const { Model, DataTypes } = require('sequelize');

class Goal extends Model {
    static init(sequelize) {
        super.init(
            {
                titulo: DataTypes.STRING,
                valor_objetivo: DataTypes.DECIMAL(10, 2),
                valor_atual: DataTypes.DECIMAL(10, 2),
                prazo: DataTypes.DATEONLY,
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
    }
}

module.exports = Goal;