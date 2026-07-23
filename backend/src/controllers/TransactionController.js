// backend/src/controllers/TransactionController.js

const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { parseISO, addMonths, endOfDay } = require('date-fns');

const Transaction = require('../models/Transaction');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');
const Card = require('../models/Card');
const Yup = require('yup');

class TransactionController {
  async index(req, res) {
    try {
      const {
        startDate,
        endDate,
        categories: categoriesStr,
        subcategories: subcategoriesStr,
        keywords,
        q,
        page,
        limit,
      } = req.query;
      const userId = req.userId;

      // Paginação é OPCIONAL: só ativa se page/limit forem enviados, preservando
      // o comportamento antigo (array simples) para quem não usa esses parâmetros
      // (Dashboard e Relatórios continuam recebendo array puro).
      const isPaginated = !!(page || limit);
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const offset = (pageNum - 1) * limitNum;
      const emptyResponse = () =>
        isPaginated
          ? res.json({ data: [], total: 0, page: pageNum, totalPages: 0 })
          : res.json([]);

      const whereCondition = { userId };
      if (startDate && endDate) {
        try {
          whereCondition.data = {
            [Op.between]: [parseISO(startDate), endOfDay(parseISO(endDate))],
          };
        } catch (dateError) {
          return res.status(400).json({ error: 'Formato de data inválido.' });
        }
      }

      // NOVO: busca livre por texto na descrição (usada pela tela de Transações)
      if (q && q.trim() !== '') {
        whereCondition.descricao = { [Op.like]: `%${q.trim()}%` };
      }

      const categories = categoriesStr ? categoriesStr.split(',').map(Number).filter((id) => !isNaN(id)) : [];
      const subcategories = subcategoriesStr ? subcategoriesStr.split(',').map(Number).filter((id) => !isNaN(id)) : [];
      const keywordsProvided = keywords && keywords.trim() !== '';

      const outrosCategory = await Category.findOne({ where: { name: 'Outros' } });
      const outrosId = outrosCategory ? outrosCategory.id : null;

      const onlyOutrosSelected = categories.length === 1 && categories[0] === outrosId;
      const specificSubcatsSelected = subcategories.length > 0;

      // Filtro por categoria/subcategoria/palavras-chave (só entra se algo foi selecionado)
      if (categories.length > 0 || specificSubcatsSelected || (onlyOutrosSelected && keywordsProvided)) {

        // Caso especial: só "Outros" + palavra-chave, sem subcategorias específicas
        if (onlyOutrosSelected && keywordsProvided && !specificSubcatsSelected) {
          if (outrosId) {
            const outrosSubcats = await Subcategory.findAll({ where: { categoryId: outrosId, userId }, attributes: ['id'] });
            const outrosSubcatIds = outrosSubcats.map((s) => s.id);
            if (outrosSubcatIds.length > 0) {
              whereCondition[Op.and] = whereCondition[Op.and] || [];
              whereCondition[Op.and].push(
                { subcategoryId: { [Op.in]: outrosSubcatIds } },
                { descricao: { [Op.like]: `%${keywords}%` } }
              );
            } else {
              return emptyResponse();
            }
          } else {
            return emptyResponse();
          }
        }
        // Demais casos: categorias e/ou subcategorias combinadas
        else {
          const filterConditions = [];

          if (specificSubcatsSelected) {
            filterConditions.push({ subcategoryId: { [Op.in]: subcategories } });
          } else if (categories.length > 0) {
            const includeCategoryIds = categories.filter((catId) => !(catId === outrosId && keywordsProvided));
            if (includeCategoryIds.length > 0) {
              const subcatsInCategory = await Subcategory.findAll({ where: { categoryId: { [Op.in]: includeCategoryIds }, userId }, attributes: ['id'] });
              const subcatIds = subcatsInCategory.map((s) => s.id);
              if (subcatIds.length > 0) {
                filterConditions.push({ subcategoryId: { [Op.in]: subcatIds } });
              }
            }
          }

          if (outrosId && categories.includes(outrosId) && keywordsProvided) {
            const outrosSubcats = await Subcategory.findAll({ where: { categoryId: outrosId, userId }, attributes: ['id'] });
            const outrosSubcatIds = outrosSubcats.map((s) => s.id);
            if (outrosSubcatIds.length > 0) {
              filterConditions.push({
                [Op.and]: [
                  { subcategoryId: { [Op.in]: outrosSubcatIds } },
                  { descricao: { [Op.like]: `%${keywords}%` } },
                ],
              });
            }
          }

          if (filterConditions.length > 0) {
            whereCondition[Op.or] = filterConditions;
          } else if (!(categories.length === 1 && categories[0] === outrosId && !keywordsProvided)) {
            return emptyResponse();
          } else if (outrosId) {
            const outrosSubcats = await Subcategory.findAll({ where: { categoryId: outrosId, userId }, attributes: ['id'] });
            const outrosSubcatIds = outrosSubcats.map((s) => s.id);
            if (outrosSubcatIds.length > 0) {
              whereCondition.subcategoryId = { [Op.in]: outrosSubcatIds };
            } else {
              return emptyResponse();
            }
          }
        }
      }

      const includeOptions = [
        {
          model: Subcategory,
          as: 'subcategory',
          attributes: ['id', 'name'],
          include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'cor'] }],
        },
        { model: Card, as: 'card', attributes: ['id', 'nome', 'tipo', 'cor'] },
      ];

      if (isPaginated) {
        const { count, rows } = await Transaction.findAndCountAll({
          where: whereCondition,
          order: [['data', 'DESC']],
          include: includeOptions,
          limit: limitNum,
          offset,
          distinct: true,
        });

        return res.json({
          data: rows,
          total: count,
          page: pageNum,
          totalPages: Math.ceil(count / limitNum),
        });
      }

      const transactions = await Transaction.findAll({
        where: whereCondition,
        order: [['data', 'DESC']],
        include: includeOptions,
      });

      return res.json(transactions);
    } catch (error) {
      console.error('ERRO AO LISTAR TRANSAÇÕES:', error);
      return res.status(500).json({ error: 'Erro ao listar transações.', details: error.message });
    }
  }

  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        tipo: Yup.string().oneOf(['receita', 'despesa']).required(),
        valor: Yup.number().positive().required(),
        data: Yup.date().required(),
        descricao: Yup.string().nullable(),
        recurrence: Yup.string().oneOf(['variável', 'fixo']).required(),
        installments: Yup.number().integer().when('recurrence', {
          is: 'fixo',
          then: (schema) => schema.min(1).required('Parcelas são obrigatórias para recorrência fixa.'),
          otherwise: (schema) => schema.nullable(),
        }),
        subcategoryId: Yup.number().integer().required(),
        cardId: Yup.number().integer().nullable(),
      });

      await schema.validate(req.body, { abortEarly: false });

      const { tipo, valor, data, descricao, recurrence, installments, subcategoryId, cardId } = req.body;
      const userId = req.userId;

      const subcategory = await Subcategory.findOne({ where: { id: subcategoryId, userId } });
      if (!subcategory) {
        return res.status(403).json({ error: 'Subcategoria não encontrada ou não pertence a este usuário.' });
      }

      if (cardId) {
        const card = await Card.findOne({ where: { id: cardId, userId } });
        if (!card) {
          return res.status(403).json({ error: 'Cartão não encontrado ou não pertence a este usuário.' });
        }
      }

      if (recurrence === 'variável') {
        const transaction = await Transaction.create({
          userId, tipo, valor, data, descricao, subcategoryId,
          cardId: cardId || null,
          recurrence: 'variável',
        });
        return res.status(201).json(transaction);
      }

      // Recorrência fixa: replica a transação por N meses, todas com o mesmo recurrence_group_id
      const totalMonths = parseInt(installments, 10);
      const recurrenceGroupId = uuidv4();
      const startDate = parseISO(data);
      const endDate = addMonths(startDate, totalMonths - 1);
      const transactionsToCreate = [];

      for (let i = 0; i < totalMonths; i++) {
        transactionsToCreate.push({
          userId, tipo, valor,
          data: addMonths(startDate, i),
          descricao, subcategoryId,
          cardId: cardId || null,
          recurrence: 'fixo',
          recurrence_group_id: recurrenceGroupId,
          recurrence_end_date: endDate,
        });
      }

      const createdTransactions = await Transaction.bulkCreate(transactionsToCreate);
      return res.status(201).json(createdTransactions);
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        return res.status(400).json({ error: 'Dados inválidos.', details: error.errors });
      }
      console.error('ERRO AO CRIAR TRANSAÇÃO:', error);
      return res.status(500).json({ error: 'Falha ao criar transação.', details: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { applyToFuture } = req.query;
      const { tipo, valor, data, descricao, subcategoryId, cardId } = req.body;
      const userId = req.userId;

      if (!subcategoryId || !tipo || !valor || !data) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
      }

      const subcategory = await Subcategory.findOne({ where: { id: subcategoryId, userId } });
      if (!subcategory) return res.status(403).json({ error: 'Subcategoria inválida.' });

      if (cardId) {
        const card = await Card.findOne({ where: { id: cardId, userId } });
        if (!card) return res.status(403).json({ error: 'Cartão inválido.' });
      }

      const transaction = await Transaction.findOne({ where: { id, userId } });
      if (!transaction) return res.status(404).json({ error: 'Transação não encontrada.' });

      const updateData = { tipo, valor, data, descricao, subcategoryId, cardId: cardId || null };

      if (!applyToFuture || applyToFuture === 'false') {
        const updatedTransaction = await transaction.update(updateData);
        return res.json(updatedTransaction);
      }

      if (!transaction.recurrence_group_id) {
        return res.status(400).json({ error: 'Não é recorrente.' });
      }

      const originalDate = transaction.data;
      const updatedCurrentTransaction = await transaction.update(updateData);
      const futureUpdateData = { tipo, valor, descricao, subcategoryId, cardId: cardId || null };
      await Transaction.update(futureUpdateData, {
        where: { userId, recurrence_group_id: transaction.recurrence_group_id, data: { [Op.gt]: originalDate } },
      });
      return res.json(updatedCurrentTransaction);
    } catch (error) {
      console.error('ERRO AO ATUALIZAR TRANSAÇÃO:', error);
      return res.status(500).json({ error: 'Falha ao atualizar transação.', details: error.message });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.findOne({ where: { id, userId: req.userId } });
      if (!transaction) return res.status(404).json({ error: 'Transação não encontrada.' });
      await transaction.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error('ERRO AO APAGAR TRANSAÇÃO:', error);
      return res.status(500).json({ error: 'Falha ao apagar transação.', details: error.message });
    }
  }

  async destroyGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { date } = req.query;
      const userId = req.userId;
      if (!date) return res.status(400).json({ error: 'A data de corte é obrigatória.' });
      await Transaction.destroy({
        where: { userId, recurrence_group_id: groupId, data: { [Op.gte]: parseISO(date) } },
      });
      return res.status(204).send();
    } catch (error) {
      console.error('ERRO AO APAGAR GRUPO DE TRANSAÇÕES:', error);
      return res.status(500).json({ error: 'Falha ao apagar transações futuras.', details: error.message });
    }
  }

  async togglePago(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const transaction = await Transaction.findOne({ where: { id, userId } });
      if (!transaction) return res.status(404).json({ error: 'Transação não encontrada.' });
      const updated = await transaction.update({ pago: !transaction.pago });
      return res.json(updated);
    } catch (error) {
      console.error('ERRO AO ATUALIZAR STATUS DE PAGAMENTO:', error);
      return res.status(500).json({ error: 'Falha ao atualizar status de pagamento.', details: error.message });
    }
  }
}

module.exports = new TransactionController();