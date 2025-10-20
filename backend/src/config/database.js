// backend/src/config/database.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const defaultConfig = {
  dialect: 'mariadb',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};

module.exports = {
  development: {
    ...defaultConfig,
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  },

  test: {
    ...defaultConfig,
    host: 'localhost',
    username: 'root',
    password: 'super_secret_root_password',
    database: 'financas_db_test',
    logging: false,
  }
};