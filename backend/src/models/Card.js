// backend/src/models/Card.js

const { Model, DataTypes } = require('sequelize');

class Card extends Model {
  static init(sequelize) {
    super.init(
      {
        nome: DataTypes.STRING,
        banco: DataTypes.STRING,
        bandeira: DataTypes.STRING,
        tipo: DataTypes.ENUM('fisico', 'virtual'),
        cor: DataTypes.STRING,
        ativo: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        limiteTotal: {
          type: DataTypes.DECIMAL(10, 2),
          field: 'limite_total',
        },
        diaFechamento: {
          type: DataTypes.INTEGER,
          field: 'dia_fechamento',
        },
        diaVencimento: {
          type: DataTypes.INTEGER,
          field: 'dia_vencimento',
        },
        cartaoPaiId: {
          type: DataTypes.INTEGER,
          field: 'cartao_pai_id',
        },
        userId: {
          type: DataTypes.INTEGER,
          field: 'user_id',
        },
      },
      {
        sequelize,
        tableName: 'cards',
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });

    // Auto-relacionamento: um cartão virtual pertence a um cartão físico.
    this.belongsTo(models.Card, { foreignKey: 'cartaoPaiId', as: 'cartaoPai' });
    this.hasMany(models.Card, { foreignKey: 'cartaoPaiId', as: 'cartoesVirtuais' });

    this.hasMany(models.Transaction, { foreignKey: 'cardId', as: 'transactions' });
  }
}

module.exports = Card;