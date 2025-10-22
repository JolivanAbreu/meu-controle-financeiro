// backend/src/controllers/SubcategoryController.js

const Subcategory = require('../models/Subcategory');
const Yup = require('yup');

class SubcategoryController {
  // Listar subcategorias do usuário logado
  async index(req, res) {
    try {
      const subcategories = await Subcategory.findAll({
        where: { userId: req.userId },
        include: [
          { association: 'category', attributes: ['id', 'name'] }
        ],
        order: [['name', 'ASC']],
      });
      return res.json(subcategories);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar subcategorias.' });
    }
  }

  // Criar nova subcategoria
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required('O nome é obrigatório.'),
      categoryId: Yup.number().integer().required('A categoria é obrigatória.'),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validação falhou.' });
    }

    const { name, categoryId } = req.body;

    try {
      const subcategory = await Subcategory.create({
        name,
        categoryId,
        userId: req.userId,
      });
      
      const result = await Subcategory.findByPk(subcategory.id, {
        include: [{ association: 'category', attributes: ['id', 'name'] }]
      });

      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar subcategoria.' });
    }
  }

}

module.exports = new SubcategoryController();