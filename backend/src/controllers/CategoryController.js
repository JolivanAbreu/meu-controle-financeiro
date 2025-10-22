// backend/src/controllers/CategoryController.js

const Category = require('../models/Category');

class CategoryController {
  // Listar todas as categorias fixas
  async index(req, res) {
    try {
      const categories = await Category.findAll({
        order: [['name', 'ASC']],
      });
      return res.json(categories);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
  }
}

module.exports = new CategoryController();