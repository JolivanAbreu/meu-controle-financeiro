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
                    defaultValue: 0.00 // Define 0 como padrão
                },
                prazo: DataTypes.DATEONLY,
                // --- ADIÇÃO (Upgrade 2 - Preparação): Coluna account_id ---
                 // Descomente quando o model 'Account' existir
                 /*
                 accountId: {
                    type: DataTypes.INTEGER,
                    field: 'account_id',
                    allowNull: true, // Permite metas sem conta vinculada
                 },
                 */
                // --------------------------------------------------------
                userId: { // Garante que userId esteja mapeado
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
        // --- ADIÇÃO (Upgrade 2 - Preparação): Associação com Conta ---
        /*
        this.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
        */
        // -------------------------------------------------------------
    }
}

module.exports = Goal;