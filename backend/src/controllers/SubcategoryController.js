// backend/src/controllers/SubcategoryController.js

const Subcategory = require('../models/Subcategory');
const Yup = require('yup');
const Category = require('../models/Category'); // Precisamos para o 'include' no update

class SubcategoryController {
  // --- MÉTODO INDEX (sem alterações) ---
  async index(req, res) {
    // ... seu código index ...
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
      console.error("ERRO AO BUSCAR SUBCATEGORIAS:", error);
      return res.status(500).json({ error: 'Erro ao buscar subcategorias.' });
    }
  }

  // --- MÉTODO STORE (sem alterações) ---
  async store(req, res) {
    // ... seu código store ...
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
       console.error("ERRO AO CRIAR SUBCATEGORIA:", error);
       return res.status(500).json({ error: 'Erro ao criar subcategoria.' });
     }
  }

  // --- NOVO MÉTODO: UPDATE ---
  async update(req, res) {
    const { id } = req.params; // Pega o ID da URL

    // Schema de validação para o corpo da requisição
    const schema = Yup.object().shape({
      name: Yup.string().required('O nome é obrigatório.'),
      categoryId: Yup.number().integer().required('A categoria é obrigatória.'),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validação falhou.' });
    }

    const { name, categoryId } = req.body;

    try {
      // 1. Encontra a subcategoria E verifica se pertence ao usuário logado
      const subcategory = await Subcategory.findOne({
        where: { id, userId: req.userId }
      });

      // 2. Se não encontrar ou não pertencer, retorna erro
      if (!subcategory) {
        return res.status(404).json({ error: 'Subcategoria não encontrada ou não pertence a você.' });
      }

      // 3. Atualiza os dados
      await subcategory.update({ name, categoryId });

      // 4. Retorna a subcategoria atualizada com os dados da categoria pai
      const updatedSubcategory = await Subcategory.findByPk(id, {
        include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
      });

      return res.json(updatedSubcategory);

    } catch (error) {
      console.error("ERRO AO ATUALIZAR SUBCATEGORIA:", error);
      return res.status(500).json({ error: 'Erro ao atualizar subcategoria.' });
    }
  }

  // --- NOVO MÉTODO: DESTROY ---
  async destroy(req, res) {
    const { id } = req.params; // Pega o ID da URL

    try {
      // 1. Encontra a subcategoria E verifica se pertence ao usuário logado
      const subcategory = await Subcategory.findOne({
        where: { id, userId: req.userId }
      });

      // 2. Se não encontrar ou não pertencer, retorna erro
      if (!subcategory) {
        return res.status(404).json({ error: 'Subcategoria não encontrada ou não pertence a você.' });
      }

      // 3. Deleta a subcategoria
      // ATENÇÃO: Verifique o 'onDelete' na sua migration de 'transactions'
      // Se for 'SET NULL', as transações ficarão sem subcategoria.
      // Se for 'CASCADE', as transações associadas serão excluídas!
      await subcategory.destroy();

      // 4. Retorna sucesso sem conteúdo
      return res.status(204).send();

    } catch (error) {
      console.error("ERRO AO DELETAR SUBCATEGORIA:", error);
      // Pode falhar se houver restrições de chave estrangeira inesperadas
      return res.status(500).json({ error: 'Erro ao deletar subcategoria.' });
    }
  }
}

module.exports = new SubcategoryController();