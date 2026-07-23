// backend/src/controllers/ReportController.js

const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const PdfPrinter = require("pdfmake");
const { format, parseISO } = require("date-fns");
const { ptBR } = require("date-fns/locale");
const path = require('path');
const fs = require('fs');

const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const User = require("../models/User");

const fontsPath = path.join(__dirname, '..', 'fonts');

// Paleta usada no PDF, alinhada ao visual do app (papel/tinta)
const BRAND = {
    ink: "#1C2B2A",
    inkSoft: "#4B5B59",
    rule: "#C9CFC5",
    receita: "#2F6B4F",
    despesa: "#A2432E",
    headerBg: "#17241F",
    headerText: "#F4F5F0",
    zebra: "#F2F1EB",
    receitaSoft: "#DCE8DF",
    despesaSoft: "#F0DDD5",
    accentSoft: "#DCE5E9",
};

const formatBRL = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

class ReportController {
    constructor() {
        this.generate = this.generate.bind(this);
    }

    async getFilteredTransactions(filters, userId) {
        const { startDate, endDate, categories = [], subcategories = [], keywords } = filters; // Garante que arrays existam

        // 1. Encontra o ID da categoria "Outros"
        const outrosCategory = await Category.findOne({ where: { name: "Outros" } });
        const outrosId = outrosCategory ? outrosCategory.id : null;

        // 2. Constrói a cláusula WHERE base
        const whereClause = {
            userId,
            data: {
                [Op.between]: [parseISO(startDate), parseISO(endDate)],
            },
        };

        // --- LÓGICA DE DECISÃO ---
        const onlyOutrosSelected = categories.length === 1 && categories[0] === outrosId;
        const keywordsProvided = keywords && keywords.trim() !== "";
        const specificSubcatsSelected = subcategories.length > 0;

        // CASO ESPECIAL: Apenas "Outros" com Palavras-Chave (e sem subcategorias específicas)
        if (onlyOutrosSelected && keywordsProvided && !specificSubcatsSelected) {
            console.log("Filtrando APENAS por 'Outros' com palavra-chave:", keywords);
            if (!outrosId) return []; // Categoria Outros não existe? Retorna vazio.

            const outrosSubcats = await Subcategory.findAll({
                where: { categoryId: outrosId, userId },
                attributes: ["id"],
            });
            const outrosSubcatIds = outrosSubcats.map((s) => s.id);

            if (outrosSubcatIds.length === 0) {
                console.log("Usuário não tem subcategorias 'Outros' para filtrar por palavra-chave.");
                return []; // Não há subcategorias "Outros" para buscar
            }

            // Adiciona a condição AND diretamente ao whereClause principal
            whereClause[Op.and] = [
                { subcategoryId: { [Op.in]: outrosSubcatIds } },
                { descricao: { [Op.like]: `%${keywords}%` } }
            ];
            // NÃO USAREMOS filterConditions ou Op.or neste caso

        }
        // TODOS OS OUTROS CASOS (Múltiplas categorias, subcategorias específicas, Outros sem keyword, etc.)
        else {
            console.log("Aplicando filtros combinados (OR)...");
            const filterConditions = [];

            // Condição A: Subcategorias específicas selecionadas
            if (specificSubcatsSelected) {
                console.log("Adicionando filtro por subcategorias específicas:", subcategories);
                filterConditions.push({
                    subcategoryId: { [Op.in]: subcategories },
                });
            }
            // Condição B: Categorias selecionadas, mas sem subcategorias específicas
            // (Inclui todas as subcats dessas categorias, exceto 'Outros' se keywords foram dadas para ele)
            else if (categories.length > 0) {
                console.log("Adicionando filtro por categorias (todas as subcats):", categories);
                const includeCategoryIds = categories.filter(catId => !(catId === outrosId && keywordsProvided)); // Exclui 'Outros' se keywords foram fornecidas para ele

                if (includeCategoryIds.length > 0) {
                    const subcatsInCategory = await Subcategory.findAll({
                        where: { categoryId: { [Op.in]: includeCategoryIds }, userId },
                        attributes: ['id'],
                    });
                    const subcatIds = subcatsInCategory.map(s => s.id);
                    if (subcatIds.length > 0) {
                        filterConditions.push({ subcategoryId: { [Op.in]: subcatIds } });
                    }
                }
            }

            // Condição C: "Outros" selecionado E com Palavras-Chave (adiciona como condição OR)
            if (outrosId && categories.includes(outrosId) && keywordsProvided) {
                console.log("Adicionando filtro 'Outros' com palavra-chave como condição OR:", keywords);
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

            // Aplica as condições OR se houver alguma
            if (filterConditions.length > 0) {
                whereClause[Op.or] = filterConditions;
            } else if (categories.length === 0 && !specificSubcatsSelected) {
                // Se realmente NENHUM filtro de categoria/subcategoria foi aplicado
                console.log("Nenhuma categoria ou subcategoria selecionada para filtrar.");
                return [];
            }
        } // Fim do else (casos combinados)

        // 4. Executa a query (continua igual)
        console.log("Executando query final com whereClause:", JSON.stringify(whereClause, null, 2));
        const transactions = await Transaction.findAll({
            where: whereClause,
            include: [
                { model: Subcategory, as: "subcategory", include: [{ model: Category, as: "category" }] },
            ],
            order: [["data", "ASC"], ["subcategory", "category", "name", "ASC"]],
        });
        console.log(`Encontradas ${transactions.length} transações.`);
        return transactions;
    }


    async buildPdf(transactions, user, filters) {
        const { startDate, endDate } = filters;

        const fonts = {
            Roboto: {
                normal: path.join(fontsPath, 'Roboto-Regular.ttf'),
                bold: path.join(fontsPath, 'Roboto-Medium.ttf'),
                italics: path.join(fontsPath, 'Roboto-Italic.ttf'),
                bolditalics: path.join(fontsPath, 'Roboto-MediumItalic.ttf')
            }
        };

        const printer = new PdfPrinter(fonts);

        // Agrupa as transações por categoria (mantém a ordem alfabética)
        const grouped = transactions.reduce((acc, t) => {
            const categoryName = t.subcategory?.category?.name || "Sem categoria";
            if (!acc[categoryName]) acc[categoryName] = [];
            acc[categoryName].push(t);
            return acc;
        }, {});

        let totalReceitas = 0;
        let totalDespesas = 0;

        const tableBody = [
            [
                { text: "Data", style: "tableHeader" },
                { text: "Descrição", style: "tableHeader" },
                { text: "Tipo", style: "tableHeader" },
                { text: "Valor", style: "tableHeader", alignment: "right" },
            ],
        ];

        Object.keys(grouped)
            .sort((a, b) => a.localeCompare(b, "pt-BR"))
            .forEach((categoryName) => {
                const items = grouped[categoryName];
                let categoryTotal = 0;

                // Cabeçalho da categoria
                tableBody.push([
                    {
                        text: categoryName,
                        colSpan: 4,
                        fillColor: BRAND.zebra,
                        bold: true,
                        fontSize: 10,
                        margin: [0, 4, 0, 4],
                    },
                    {}, {}, {},
                ]);

                items.forEach((t) => {
                    const valor = parseFloat(t.valor);
                    const isReceita = t.tipo === "receita";
                    if (isReceita) {
                        totalReceitas += valor;
                        categoryTotal += valor;
                    } else {
                        totalDespesas += valor;
                        categoryTotal -= valor;
                    }

                    const descricao = t.descricao || t.subcategory?.name || "-";
                    const recorrenteTag = t.recurrence === "fixo" ? "  (recorrente)" : "";

                    tableBody.push([
                        format(parseISO(t.data), "dd/MM/yyyy"),
                        `${descricao}${recorrenteTag}`,
                        isReceita ? "Receita" : "Despesa",
                        {
                            text: (isReceita ? "+ " : "- ") + formatBRL(valor),
                            style: isReceita ? "receita" : "despesa",
                            alignment: "right",
                        },
                    ]);
                });

                // Subtotal da categoria
                tableBody.push([
                    { text: "", colSpan: 3, border: [false, false, false, true] }, {}, {},
                    {
                        text: `Subtotal: ${formatBRL(categoryTotal)}`,
                        italics: true,
                        fontSize: 8,
                        color: BRAND.inkSoft,
                        alignment: "right",
                        border: [false, false, false, true],
                    },
                ]);
            });

        const saldo = totalReceitas - totalDespesas;

        const docDefinition = {
            pageMargins: [40, 85, 40, 60],

            header: () => ({
                margin: [40, 20, 40, 0],
                table: {
                    widths: ["auto", "*"],
                    body: [
                        [
                            { text: "MF", fillColor: BRAND.headerBg, color: BRAND.headerText, bold: true, fontSize: 12, margin: [10, 8, 10, 8] },
                            { text: "Meu Controle Financeiro", fillColor: BRAND.headerBg, color: BRAND.headerText, bold: true, fontSize: 12, margin: [10, 8, 10, 8] },
                        ],
                    ],
                },
                layout: "noBorders",
            }),

            footer: (currentPage, pageCount) => ({
                margin: [40, 10, 40, 0],
                columns: [
                    { text: `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, fontSize: 8, color: BRAND.inkSoft },
                    { text: `Página ${currentPage} de ${pageCount}`, fontSize: 8, color: BRAND.inkSoft, alignment: "right" },
                ],
            }),

            content: [
                { text: "Relatório de Transações", style: "header" },
                { text: `Período: ${format(parseISO(startDate), "P", { locale: ptBR })} a ${format(parseISO(endDate), "P", { locale: ptBR })}`, style: "subheader" },
                { text: `Cliente: ${user.nome || user.email}`, style: "subheader", margin: [0, 0, 0, 15] },

                {
                    columns: [
                        {
                            table: { widths: ["*"], body: [
                                [{ text: "RECEITAS", fontSize: 8, color: BRAND.inkSoft, margin: [0, 0, 0, 2] }],
                                [{ text: formatBRL(totalReceitas), fontSize: 14, bold: true, color: BRAND.receita }],
                            ] },
                            layout: "noBorders",
                            fillColor: BRAND.receitaSoft,
                            margin: [0, 0, 4, 0],
                        },
                        {
                            table: { widths: ["*"], body: [
                                [{ text: "DESPESAS", fontSize: 8, color: BRAND.inkSoft, margin: [0, 0, 0, 2] }],
                                [{ text: formatBRL(totalDespesas), fontSize: 14, bold: true, color: BRAND.despesa }],
                            ] },
                            layout: "noBorders",
                            fillColor: BRAND.despesaSoft,
                            margin: [4, 0, 4, 0],
                        },
                        {
                            table: { widths: ["*"], body: [
                                [{ text: "SALDO", fontSize: 8, color: BRAND.inkSoft, margin: [0, 0, 0, 2] }],
                                [{ text: formatBRL(saldo), fontSize: 14, bold: true, color: saldo >= 0 ? BRAND.receita : BRAND.despesa }],
                            ] },
                            layout: "noBorders",
                            fillColor: BRAND.accentSoft,
                            margin: [4, 0, 0, 0],
                        },
                    ],
                    margin: [0, 0, 0, 20],
                },

                {
                    table: { headerRows: 1, widths: ["auto", "*", "auto", "auto"], body: tableBody },
                    layout: {
                        fillColor: (rowIndex) => (rowIndex === 0 ? BRAND.headerBg : null),
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0,
                        hLineColor: () => BRAND.rule,
                    },
                    style: "tableStyle",
                },
            ],

            styles: {
                header: { fontSize: 18, bold: true, color: BRAND.ink, margin: [0, 0, 0, 4] },
                subheader: { fontSize: 10, color: BRAND.inkSoft },
                tableStyle: { margin: [0, 5, 0, 15] },
                tableHeader: { bold: true, fontSize: 9, color: BRAND.headerText },
                receita: { color: BRAND.receita },
                despesa: { color: BRAND.despesa },
            },
            defaultStyle: { font: "Roboto", fontSize: 9, color: BRAND.ink },
        };

        return new Promise((resolve, reject) => {
            try {
                const pdfDoc = printer.createPdfKitDocument(docDefinition);
                const chunks = [];
                pdfDoc.on("data", (chunk) => chunks.push(chunk));
                pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
                pdfDoc.on('error', (err) => { console.error("ERRO NO STREAM createPdfKitDocument:", err); reject(err); });
                pdfDoc.end();
            } catch (err) {
                console.error("ERRO DENTRO DA PROMISE buildPdf:", err);
                reject(err);
            }
        });
    }

    async sendEmail(toEmail, pdfBuffer) {
        if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) { console.error("Configurações de e-mail ausentes no .env"); throw new Error("Configurações de e-mail incompletas."); } const transporter = nodemailer.createTransport({ host: process.env.MAIL_HOST, port: process.env.MAIL_PORT || 465, secure: (process.env.MAIL_PORT || 465) == 465, auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS, }, }); await transporter.sendMail({ from: `"Meu Controle Financeiro" <${process.env.MAIL_USER}>`, to: toEmail, subject: "Seu Relatório de Transações", html: ` <p>Olá,</p> <p>Em anexo está o relatório de transações que você solicitou.</p> <p>Atenciosamente,<br>Equipe Meu Controle Financeiro</p> `, attachments: [{ filename: "Relatorio_Financeiro.pdf", content: pdfBuffer, contentType: "application/pdf", },], });
    }

    async generate(req, res) {
        const { sendEmail, ...filters } = req.body; const { userId } = req; let pdfBuffer; try { console.log("Buscando usuário:", userId); const user = await User.findByPk(userId); if (!user) { return res.status(404).json({ error: "Usuário não encontrado." }); } console.log("Usuário encontrado:", user.email); console.log("Filtrando transações com:", filters); const transactions = await this.getFilteredTransactions(filters, userId); if (transactions.length === 0) { return res.status(404).json({ error: "Nenhuma transação encontrada para estes filtros." }); } console.log("Transações encontradas:", transactions.length); try { console.log("Iniciando geração do PDF..."); pdfBuffer = await this.buildPdf(transactions, user, filters); console.log("PDF gerado com sucesso, tamanho:", pdfBuffer ? pdfBuffer.length : 'Erro/Vazio'); } catch (pdfError) { console.error("ERRO ESPECÍFICO NA GERAÇÃO DO PDF:", pdfError); return res.status(500).json({ error: "Falha ao gerar o arquivo PDF." }); } if (sendEmail) { try { console.log("Iniciando envio de e-mail para:", user.email); await this.sendEmail(user.email, pdfBuffer); console.log("E-mail enviado com sucesso."); return res.json({ message: `Relatório enviado com sucesso para ${user.email}` }); } catch (emailError) { console.error("ERRO ESPECÍFICO NO ENVIO DE E-MAIL:", emailError); return res.status(500).json({ error: "Falha ao enviar o e-mail." }); } } else { console.log("Enviando PDF para download..."); if (!pdfBuffer || pdfBuffer.length === 0) { console.error("Tentando enviar buffer de PDF vazio ou inválido"); return res.status(500).json({ error: "Falha interna ao gerar o PDF (buffer vazio)." }); } res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", 'attachment; filename="Relatorio.pdf"'); return res.send(pdfBuffer); } } catch (error) { console.error("ERRO GERAL AO GERAR RELATÓRIO:", error); return res.status(500).json({ error: "Falha ao gerar relatório." }); }
    }
}

module.exports = new ReportController();