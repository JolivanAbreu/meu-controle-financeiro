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

  async update(req, res) {
    try {
      const { id } = req.params;
      const { cor } = req.body;

      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada.' });
      }

      category.cor = cor || null;
      await category.save();

      return res.json(category);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar categoria.', details: error.message });
    }
  }
}

module.exports = new CategoryController();