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

// Determina o ambiente e carrega a configuração correta
const env = process.env.NODE_ENV || 'development';
const dbConfig = dbConfigObject[env];
const models = [
    User,
    Transaction,
    Budget,
    Goal,
    Category,
    Subcategory,
    GoalContribution // Certifique-se que GoalContribution está aqui
];

class Database {
  constructor() {
    // Adiciona verificação básica da configuração
    if (!dbConfig || !dbConfig.database || !dbConfig.username || !dbConfig.host) {
        console.error("ERRO FATAL: Configuração do banco de dados incompleta ou inválida para o ambiente:", env);
        process.exit(1); // Encerra a aplicação se a config estiver errada
    }
    this.connection = new Sequelize(dbConfig);
    this.init();
    // Removido this.associate() daqui, pois agora é chamado dentro de init()
  }

  // --- MÉTODO INIT CORRIGIDO ---
  init() {
    // 1. Inicializa todos os models
    models.forEach((model) => {
        // Verifica se é um model válido antes de chamar init
        if (model && typeof model.init === 'function') {
            model.init(this.connection);
            console.log(`Model ${model.name || 'Unknown'} initialized.`);
        } else {
            console.error(`ERRO: Item inválido encontrado no array 'models' durante a inicialização.`);
            // Você pode querer lançar um erro aqui para parar a aplicação
            // throw new Error(`Invalid model found in models array.`);
        }
    });

    // 2. Chama o método associate DEPOIS que TODOS os models foram inicializados
    models.forEach((model) => {
         // Verifica se o model é válido e se possui o método associate
         if (model && typeof model.associate === 'function') {
            model.associate(this.connection.models);
            console.log(`Associations called for model ${model.name || 'Unknown'}.`);
         }
         // Models que não possuem 'associate' são ignorados silenciosamente, o que é normal.
    });

    console.log("Database models initialized and associated successfully.");
  }
  // -----------------------------
}

module.exports = new Database();