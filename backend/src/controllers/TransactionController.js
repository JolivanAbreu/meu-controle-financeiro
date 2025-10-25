// backend/src/controllers/TransactionController.js

const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  parseISO,
  addMonths,
  endOfDay,
} = require('date-fns');

// --- MODELS IMPORTADOS ---
const Transaction = require('../models/Transaction');
const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');
const Yup = require('yup');

class TransactionController {
  async index(req, res) {
    try {
      // 1. Extrai todos os possíveis filtros da query string
      const {
        startDate,
        endDate,
        categories: categoriesStr,
        subcategories: subcategoriesStr,
        keywords
      } = req.query;
      const userId = req.userId;

      // 2. Constrói a cláusula WHERE base (usuário e datas)
      const whereCondition = { userId }
      if (startDate && endDate) {
        try {
          whereCondition.data = {
            [Op.between]: [
              parseISO(startDate),
              endOfDay(parseISO(endDate)) 
            ],
          };
        } catch (dateError) {
          console.error("Erro ao parsear datas:", dateError);
          return res.status(400).json({ error: "Formato de data inválido." });
        }
      } else {
        console.warn("Buscando transações sem filtro de data.");
      }


      // --- LÓGICA DE FILTRO POR CATEGORIA/SUBCATEGORIA/KEYWORDS ---
      const categories = categoriesStr ? categoriesStr.split(',').map(Number).filter(id => !isNaN(id)) : [];
      const subcategories = subcategoriesStr ? subcategoriesStr.split(',').map(Number).filter(id => !isNaN(id)) : [];
      const keywordsProvided = keywords && keywords.trim() !== "";

      const outrosCategory = await Category.findOne({ where: { name: "Outros" } });
      const outrosId = outrosCategory ? outrosCategory.id : null;

      const onlyOutrosSelected = categories.length === 1 && categories[0] === outrosId;
      const specificSubcatsSelected = subcategories.length > 0;

      // Se houver filtros de categoria/sub/keyword, aplica a lógica
      if (categories.length > 0 || specificSubcatsSelected || (onlyOutrosSelected && keywordsProvided)) {

        // CASO ESPECIAL: Apenas "Outros" com Palavras-Chave (e sem subcategorias específicas)
        if (onlyOutrosSelected && keywordsProvided && !specificSubcatsSelected) {
          if (outrosId) {
            const outrosSubcats = await Subcategory.findAll({ where: { categoryId: outrosId, userId }, attributes: ["id"] });
            const outrosSubcatIds = outrosSubcats.map((s) => s.id);
            if (outrosSubcatIds.length > 0) {
              // Adiciona diretamente ao AND principal
              whereCondition[Op.and] = whereCondition[Op.and] || [];
              whereCondition[Op.and].push(
                { subcategoryId: { [Op.in]: outrosSubcatIds } },
                { descricao: { [Op.like]: `%${keywords}%` } }
              );
            } else {
              return res.json([]);
            }
          } else {
            return res.json([]);
          }
        }
        // TODOS OS OUTROS CASOS (filtros combinados)
        else {
          const filterConditions = [];

          // Condição A: Subcategorias específicas selecionadas
          if (specificSubcatsSelected) {
            filterConditions.push({ subcategoryId: { [Op.in]: subcategories } });
          }
          // Condição B: Categorias selecionadas (sem subcats específicas)
          else if (categories.length > 0) {
            const includeCategoryIds = categories.filter(catId => !(catId === outrosId && keywordsProvided));
            if (includeCategoryIds.length > 0) {
              const subcatsInCategory = await Subcategory.findAll({ where: { categoryId: { [Op.in]: includeCategoryIds }, userId }, attributes: ['id'] });
              const subcatIds = subcatsInCategory.map(s => s.id);
              if (subcatIds.length > 0) {
                filterConditions.push({ subcategoryId: { [Op.in]: subcatIds } });
              } else {
                // Se selecionou categorias que não têm subcategorias (para este usuário), a condição não adiciona nada
              }
            }
          }

          // Condição C: "Outros" selecionado E com Palavras-Chave (adiciona como condição OR)
          if (outrosId && categories.includes(outrosId) && keywordsProvided) {
            const outrosSubcats = await Subcategory.findAll({ where: { categoryId: outrosId, userId }, attributes: ["id"] });
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

          // Adiciona as condições OR ao WHERE principal
          if (filterConditions.length > 0) {
            whereCondition[Op.or] = filterConditions;
          } else {
            if (!(categories.length === 1 && categories[0] === outrosId && !keywordsProvided)) {
              console.log("Filtros não resultaram em condições válidas.");
              return res.json([]);
            } else if (outrosId) {
              const outrosSubcats = await Subcategory.findAll({ where: { categoryId: outrosId, userId }, attributes: ["id"] });
              const outrosSubcatIds = outrosSubcats.map((s) => s.id);
              if (outrosSubcatIds.length > 0) {
                whereCondition.subcategoryId = { [Op.in]: outrosSubcatIds };
              } else {
                return res.json([]);
              }
            }
          }
        }
      }
      // --- FIM DA LÓGICA DE FILTRO ---


      // 4. Executa a query com a whereCondition construída
      console.log("Executando GET /transactions com whereCondition:", JSON.stringify(whereCondition, null, 2));
      const transactions = await Transaction.findAll({
        where: whereCondition,
        order: [['data', 'DESC']],
        include: [
          {
            model: Subcategory,
            as: 'subcategory',
            attributes: ['id', 'name'],
            // Include necessário para buscar a categoria pai
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
      });

      return res.json(transactions);

    } catch (error) {
      console.error('ERRO AO LISTAR TRANSAÇÕES (com filtros):', error);
      return res.status(500).json({
        error: 'Erro ao listar transações.',
        details: error.message,
      });
    }
  }

  // --- MÉTODO STORE COM LOGS DETALHADOS ---
  async store(req, res) {
    console.log("---------------------------------------");
    console.log("Método store iniciado:", new Date().toISOString());
    try {
      // Usar Yup para validação mais robusta (opcional, mas recomendado)
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
      });

      // Log antes da validação
      console.log("Dados recebidos no body:", req.body);
      await schema.validate(req.body, { abortEarly: false });
      console.log("Validação Yup passou.");

      const { tipo, valor, data, descricao, recurrence, installments, subcategoryId } = req.body;
      const userId = req.userId;

      // 1. Validação e Verificação de Segurança da Subcategoria
      console.log("Verificando subcategoria ID:", subcategoryId, "para userId:", userId);
      const subcategory = await Subcategory.findOne({
        where: { id: subcategoryId, userId: userId }
      });
      console.log("Subcategoria encontrada:", !!subcategory);

      if (!subcategory) {
        console.log("Erro: Subcategoria não encontrada ou não pertence ao usuário.");
        return res.status(403).json({ error: 'Subcategoria não encontrada ou não pertence a este usuário.' });
      }

      // Lógica de Criação
      if (recurrence === 'variável') {
        console.log("Iniciando Transaction.create para transação variável...");
        const transactionData = {
          userId,
          tipo,
          valor,
          data,
          descricao,
          subcategoryId,
          recurrence: 'variável',
        };
        console.log("Dados para create:", transactionData);
        const transaction = await Transaction.create(transactionData);
        console.log("Transaction.create CONCLUÍDO. ID:", transaction.id);
        return res.status(201).json(transaction);

      } else if (recurrence === 'fixo') {
        console.log("Iniciando lógica bulkCreate para transação fixa...");
        const totalMonths = parseInt(installments, 10);
        const recurrenceGroupId = uuidv4();
        const startDate = parseISO(data);
        const endDate = addMonths(startDate, totalMonths - 1);
        const transactionsToCreate = [];

        for (let i = 0; i < totalMonths; i++) {
          transactionsToCreate.push({
            userId,
            tipo,
            valor,
            data: addMonths(startDate, i),
            descricao,
            subcategoryId,
            recurrence: 'fixo',
            recurrence_group_id: recurrenceGroupId,
            recurrence_end_date: endDate,
          });
        }
        console.log(`Preparado para Transaction.bulkCreate (${transactionsToCreate.length} registros)...`);
        console.log("Dados para bulkCreate (primeiro registro):", transactionsToCreate[0]);
        const createdTransactions = await Transaction.bulkCreate(transactionsToCreate);
        console.log("Transaction.bulkCreate CONCLUÍDO. Registros criados:", createdTransactions.length);
        return res.status(201).json(createdTransactions);
      }

      // Este ponto não deveria ser alcançado devido à validação Yup
      console.log("Erro: Tipo de recorrência inválido (não deveria acontecer).");
      return res.status(400).json({ error: 'Tipo de recorrência inválido.' });

    } catch (error) {
      // Captura erros de validação Yup ou erros do Sequelize/Banco
      if (error instanceof Yup.ValidationError) {
        console.error('ERRO DE VALIDAÇÃO YUP:', error.errors);
        return res.status(400).json({ error: 'Dados inválidos.', details: error.errors });
      }
      // Log do erro ANTES de enviar a resposta
      console.error('ERRO DETALHADO NO MÉTODO STORE:', error);
      return res.status(500).json({
        error: 'Falha ao criar transação.',
        details: error.message
      });
    } finally {
      console.log("Método store finalizado:", new Date().toISOString());
      console.log("---------------------------------------");
    }
  }

  // --- MÉTODOS update, destroy, destroyGroup (sem logs extras por enquanto) ---
  async update(req, res) {
    // Adicionar validação Yup e logs aqui seria bom também
    try {
      const { id } = req.params;
      const { applyToFuture } = req.query;
      const { tipo, valor, data, descricao, subcategoryId } = req.body;
      const userId = req.userId;

      // Validação rápida (idealmente usar Yup)
      if (!subcategoryId || !tipo || !valor || !data) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
      }

      const subcategory = await Subcategory.findOne({ where: { id: subcategoryId, userId: userId } });
      if (!subcategory) { return res.status(403).json({ error: 'Subcategoria inválida.' }); }

      const transaction = await Transaction.findOne({ where: { id, userId: userId } });
      if (!transaction) { return res.status(404).json({ error: "Transação não encontrada." }); }

      const updateData = { tipo, valor, data, descricao, subcategoryId };

      if (!applyToFuture || applyToFuture === 'false') {
        const updatedTransaction = await transaction.update(updateData);
        return res.json(updatedTransaction);
      } else {
        if (!transaction.recurrence_group_id) { return res.status(400).json({ error: "Não é recorrente." }); }
        const originalDate = transaction.data;
        const updatedCurrentTransaction = await transaction.update(updateData);
        const futureUpdateData = { tipo, valor, descricao, subcategoryId };
        await Transaction.update(futureUpdateData, { where: { userId: userId, recurrence_group_id: transaction.recurrence_group_id, data: { [Op.gt]: originalDate } } });
        return res.json(updatedCurrentTransaction);
      }
    } catch (error) {
      console.error("ERRO AO ATUALIZAR TRANSAÇÃO:", error);
      return res.status(500).json({ error: "Falha ao atualizar transação.", details: error.message });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.findOne({ where: { id, userId: req.userId } });
      if (!transaction) { return res.status(404).json({ error: "Transação não encontrada." }); }
      await transaction.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error("ERRO AO APAGAR TRANSAÇÃO:", error);
      return res.status(500).json({ error: "Falha ao apagar transação.", details: error.message });
    }
  }

  async destroyGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { date } = req.query;
      const userId = req.userId;
      if (!date) { return res.status(400).json({ error: "A data de corte é obrigatória." }); }
      await Transaction.destroy({ where: { userId: userId, recurrence_group_id: groupId, data: { [Op.gte]: parseISO(date) } } }); // Usa userId
      return res.status(204).send();
    } catch (error) {
      console.error("ERRO AO APAGAR GRUPO DE TRANSAÇÕES:", error);
      return res.status(500).json({ error: "Falha ao apagar transações futuras.", details: error.message });
    }
  }
}

module.exports = new TransactionController();