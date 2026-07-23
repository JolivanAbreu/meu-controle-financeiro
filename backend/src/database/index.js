// backend/src/database/index.js

const Sequelize = require('sequelize');
const dbConfigObject = require('../config/database');

// Importação dos Models
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const GoalContribution = require('../models/GoalContribution');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Card = require('../models/Card');

const env = process.env.NODE_ENV || 'development';
const dbConfig = dbConfigObject[env];
const models = [
    User,
    Transaction,
    Budget,
    Goal,
    Category,
    Subcategory,
    GoalContribution,
    Card,
];

class Database {
  constructor() {
    if (!dbConfig || !dbConfig.database || !dbConfig.username || !dbConfig.host) {
        console.error("ERRO FATAL: Configuração do banco de dados incompleta ou inválida para o ambiente:", env);
        process.exit(1);
    }
    this.connection = new Sequelize(dbConfig);
    this.init();
  }

  init() {
    models.forEach((model) => {
        if (model && typeof model.init === 'function') {
            model.init(this.connection);
            console.log(`Model ${model.name || 'Unknown'} initialized.`);
        } else {
            console.error(`ERRO: Item inválido encontrado no array 'models' durante a inicialização.`);
        }
    });

    models.forEach((model) => {
         if (model && typeof model.associate === 'function') {
            model.associate(this.connection.models);
            console.log(`Associations called for model ${model.name || 'Unknown'}.`);
         }
    });

    console.log("Database models initialized and associated successfully.");
  }
}

module.exports = new Database();