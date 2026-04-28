// backend/src/app.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./database');

const routes = require('./routes/routes');

class App {
  constructor() {
    this.server = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use(cors());
    this.server.use(express.json());
  }

  routes() {
    this.server.use('/api', routes);

    this.server.get('/', (req, res) => {
      return res.json({ message: 'API Meu Controle Financeiro está no ar!' });
    });
  }
}

module.exports = new App().server;