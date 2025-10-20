// backend/src/database/index.js

const Sequelize = require('sequelize');
const dbConfigObject = require('../config/database');

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

const env = process.env.NODE_ENV || 'development';
const dbConfig = dbConfigObject[env];

const models = [User, Transaction, Budget, Goal];

class Database {
  constructor() {
    this.connection = new Sequelize(dbConfig);
    this.init();
    this.associate();
  }

  init() {
    models.forEach((model) => model.init(this.connection));
  }

  associate() {
    models.forEach((model) => {
      if (model.associate) {
        model.associate(this.connection.models);
      }
    });
  }
}

module.exports = new Database();