import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import { getCategories, getSubcategories } from "../services/categoryService";
import { generateReport } from "../services/reportService";
import toast from "react-hot-toast";
import Select from "react-select";
import IncomeExpenseTrendChart from "../components/IncomeExpenseTrendChart";
import ExpenseCategoryPieChart from "../components/ExpenseCategoryPieChart";
import {
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
  FaListUl,
  FaDownload,
} from "react-icons/fa";

// Funções auxiliares
const getMesAtual = () => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];
    return { firstDay, lastDay };
};
const formatCurrency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

const toISODate = (date) => date.toISOString().split("T")[0];

// --- Atalhos de período ---
const DATE_PRESETS = [
  { key: "mesAtual", label: "Este mês" },
  { key: "mesPassado", label: "Mês passado" },
  { key: "ultimos3", label: "Últimos 3 meses" },
  { key: "esteAno", label: "Este ano" },
];

const inputClasses =
  "w-full px-3 py-2 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent " +
  "disabled:bg-rule/40 dark:disabled:bg-rule-dark/40 disabled:text-ink-soft dark:disabled:text-ink-soft-dark " +
  "transition-colors";

const labelClasses = "block text-sm font-medium text-ink dark:text-ink-dark mb-1";

// --- Estilos do react-select adaptados ao tema (claro/escuro) ---
const getSelectStyles = (isDark) => {
  const colors = isDark
    ? {
        control: "#141B17",
        border: "#2B3630",
        text: "#E7E9E1",
        placeholder: "#93A399",
        menu: "#1B2420",
        optionHover: "#1D2A30",
        chipBg: "#1D2A30",
        chipText: "#82A8BC",
      }
    : {
        control: "#EEEFE9",
        border: "#C9CFC5",
        text: "#1C2B2A",
        placeholder: "#4B5B59",
        menu: "#F7F7F2",
        optionHover: "#DCE5E9",
        chipBg: "#DCE5E9",
        chipText: "#2E4A5C",
      };

  return {
    control: (base, state) => ({
      ...base,
      backgroundColor: colors.control,
      borderColor: state.isFocused ? "#2E4A5C" : colors.border,
      boxShadow: "none",
      "&:hover": { borderColor: "#2E4A5C" },
    }),
    menu: (base) => ({ ...base, backgroundColor: colors.menu, zIndex: 20 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? colors.optionHover : "transparent",
      color: colors.text,
      cursor: "pointer",
    }),
    multiValue: (base) => ({ ...base, backgroundColor: colors.chipBg }),
    multiValueLabel: (base) => ({ ...base, color: colors.chipText }),
    multiValueRemove: (base) => ({
      ...base,
      color: colors.chipText,
      "&:hover": { backgroundColor: colors.chipText, color: colors.control },
    }),
    singleValue: (base) => ({ ...base, color: colors.text }),
    input: (base) => ({ ...base, color: colors.text }),
    placeholder: (base) => ({ ...base, color: colors.placeholder }),
  };
};

function ReportsPage() {
  // Estados dos Filtros
  const [startDate, setStartDate] = useState(getMesAtual().firstDay);
  const [endDate, setEndDate] = useState(getMesAtual().lastDay);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [keywords, setKeywords] = useState("");
  const [sendEmail, setSendEmail] = useState(false);

  // Estados dos Dados
  const [allCategories, setAllCategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [outrosId, setOutrosId] = useState(null);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [isOutrosSelected, setIsOutrosSelected] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [reportTransactions, setReportTransactions] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // --- Detecta o tema atual (claro/escuro) para estilizar o react-select ---
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const selectStyles = useMemo(() => getSelectStyles(isDark), [isDark]);

  // Carregar Filtros
  useEffect(() => {
    async function loadData() {
        setDataLoading(true);
        try {
          const [catRes, subcatRes] = await Promise.all([ getCategories(), getSubcategories() ]);
          const categoriesData = catRes.data.map((c) => ({ value: c.id, label: c.name }));
          setAllCategories(categoriesData);
          const outros = categoriesData.find((c) => c.label === "Outros");
          if (outros) setOutrosId(outros.value);
          setAllSubcategories(subcatRes.data);
        } catch (err) { console.error("Failed to load category data:", err); toast.error("Falha ao carregar filtros.");
        } finally { setDataLoading(false); }
      }
      loadData();
  }, []);

  // Atualizar Subcategorias Disponíveis
  useEffect(() => {
    const categoryIds = selectedCategories.map((c) => c.value);
    setIsOutrosSelected(outrosId ? categoryIds.includes(outrosId) : false);
    const available = allSubcategories
      .filter(sub => categoryIds.includes(sub.categoryId))
      .filter(sub => sub.categoryId !== outrosId)
      .map((s) => ({ value: s.id, label: `${s.category?.name || '??'} / ${s.name}` }));
    setAvailableSubcategories(available);
    setSelectedSubcategories((prev) => prev.filter((s) => available.some((a) => a.value === s.value)));
     if (!categoryIds.includes(outrosId)) { setKeywords(""); }
  }, [selectedCategories, allSubcategories, outrosId]);

  // Handlers Selecionar/Limpar Todos
  const handleSelectAllCategories = () => { setSelectedCategories(allCategories); };
  const handleClearAllCategories = () => { setSelectedCategories([]); };
  const handleSelectAllSubcategories = () => { setSelectedSubcategories(availableSubcategories); };
  const handleClearAllSubcategories = () => { setSelectedSubcategories([]); };

  // --- Aplica um atalho de período ---
  const applyDatePreset = (key) => {
    const now = new Date();
    let start;
    let end;

    switch (key) {
      case "mesAtual":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "mesPassado":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "ultimos3":
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "esteAno":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return;
    }

    setStartDate(toISODate(start));
    setEndDate(toISODate(end));
  };

  // --- Handler para VISUALIZAR Relatório ---
  const handleViewReport = async () => {
    setLoading(true);
    setShowResults(false);
    setReportTransactions([]);

    // Monta o objeto de parâmetros para a query string
    const params = {
      startDate,
      endDate,
    };
    if (selectedCategories.length > 0) {
      params.categories = selectedCategories.map(c => c.value).join(',');
    }
    if (selectedSubcategories.length > 0) {
      params.subcategories = selectedSubcategories.map(s => s.value).join(',');
    }
    if (isOutrosSelected && keywords.trim() !== "") {
       params.keywords = keywords.trim();
    }

    console.log("Enviando params para GET /transactions:", params); 

    // Chama a API GET /transactions com os parâmetros
    const promise = api.get("/transactions", { params });

    try {
      await toast.promise(promise, {
        loading: "Buscando dados...",
        success: "Dados carregados!",
        error: (err) => err.response?.data?.error || "Falha ao buscar dados.",
      });
      const response = await promise;
      console.log("Resposta de GET /transactions:", response.data);
      setReportTransactions(response.data);
      setShowResults(true); 
      if (response.data.length === 0) {
         toast("Nenhuma transação encontrada para os filtros aplicados.", { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error("Erro ao buscar relatório para visualização:", error.response || error);
    } finally {
      setLoading(false);
    }
  };

  // Handler para GERAR PDF / ENVIAR E-MAIL
  const handleGenerateAction = async () => {
    if (selectedCategories.length === 0 && !(isOutrosSelected && keywords.trim() !== '')) { // Ajuste na validação
        toast.error("Selecione ao menos uma categoria (ou 'Outros' com palavra-chave) para Gerar PDF / Enviar E-mail.");
        return;
    }
    setLoading(true);
    const filters = { startDate, endDate, categories: selectedCategories.map((c) => c.value), subcategories: selectedSubcategories.map((s) => s.value), keywords: isOutrosSelected ? keywords : "", };
    const promise = generateReport(filters, sendEmail);
    try { await toast.promise(promise, { loading: sendEmail ? "Enviando relatório..." : "Gerando PDF...", success: (data) => data.message || "Operação concluída!", error: (err) => err.response?.data?.error || `Falha ao ${sendEmail ? 'enviar' : 'gerar'} relatório.`, });
    } catch (error) { console.error("Caught error during report generation/sending:", error); } finally { setLoading(false); }
  };

  // --- Exporta os resultados visualizados como CSV ---
  const handleExportCSV = () => {
    if (reportTransactions.length === 0) return;

    const headers = ["Data", "Categoria", "Subcategoria", "Tipo", "Valor"];
    const rows = reportTransactions.map((t) => [
      formatDate(t.data),
      t.subcategory?.category?.name || "",
      t.subcategory?.name || "",
      t.tipo,
      String(t.valor).replace(".", ","),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(";"),
      )
      .join("\n");

    // BOM (\uFEFF) garante acentuação correta ao abrir no Excel
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_${startDate}_a_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Cálculos para a área de exibição
  const totalReceitasView = reportTransactions.filter((t) => t.tipo === "receita").reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const totalDespesasView = reportTransactions.filter((t) => t.tipo === "despesa").reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const saldoView = totalReceitasView - totalDespesasView;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium text-ink dark:text-ink-dark">
          Relatórios
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">
          Gere relatórios personalizados dos seus lançamentos
        </p>
      </header>

      {/* Formulário de Filtros */}
      <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-6">
        <h2 className="font-display text-lg font-medium text-ink dark:text-ink-dark mb-4">
          Filtros
        </h2>

        {/* NOVO: Atalhos de período */}
        <div className="flex flex-wrap gap-2 mb-4">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyDatePreset(preset.key)}
              className="px-3 py-1.5 text-xs font-medium rounded-full border border-rule dark:border-rule-dark text-ink-soft dark:text-ink-soft-dark hover:border-accent hover:text-accent dark:hover:border-accent-dark dark:hover:text-accent-dark transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="startDate" className={labelClasses}>Data de Início</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              required
              onChange={(e) => setStartDate(e.target.value)}
              className={`${inputClasses} font-mono`}
            />
          </div>
          <div>
            <label htmlFor="endDate" className={labelClasses}>Data de Fim</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              required
              onChange={(e) => setEndDate(e.target.value)}
              className={`${inputClasses} font-mono`}
            />
          </div>
        </div>

        {/* Categorias */}
        <div className="mb-1">
          <label htmlFor="categories" className={labelClasses}>
            Filtrar por Categorias (Opcional)
          </label>
          <Select
            id="categories"
            isMulti
            options={allCategories}
            value={selectedCategories}
            onChange={setSelectedCategories}
            placeholder={dataLoading ? "Carregando..." : "Todas as categorias"}
            noOptionsMessage={() => "Nenhuma categoria"}
            isLoading={dataLoading}
            isDisabled={dataLoading}
            styles={selectStyles}
          />
        </div>
        <div className="flex justify-end gap-4 mb-4 text-xs">
          <button
            type="button"
            onClick={handleSelectAllCategories}
            disabled={dataLoading || allCategories.length === 0}
            className="text-accent dark:text-accent-dark hover:underline disabled:text-ink-soft dark:disabled:text-ink-soft-dark disabled:no-underline"
          >
            Selecionar Todas
          </button>
          <button
            type="button"
            onClick={handleClearAllCategories}
            disabled={dataLoading || selectedCategories.length === 0}
            className="text-despesa dark:text-despesa-dark hover:underline disabled:text-ink-soft dark:disabled:text-ink-soft-dark disabled:no-underline"
          >
            Limpar Seleção
          </button>
        </div>

        {/* Subcategorias */}
        {selectedCategories.length > 0 && availableSubcategories.length > 0 && (
          <>
            <div className="mb-1">
              <label htmlFor="subcategories" className={labelClasses}>
                Filtrar por Subcategorias (Opcional)
              </label>
              <Select
                id="subcategories"
                isMulti
                options={availableSubcategories}
                value={selectedSubcategories}
                onChange={setSelectedSubcategories}
                placeholder="Todas das categorias selecionadas"
                isDisabled={dataLoading}
                styles={selectStyles}
              />
            </div>
            <div className="flex justify-end gap-4 mb-4 text-xs">
              <button
                type="button"
                onClick={handleSelectAllSubcategories}
                disabled={dataLoading || availableSubcategories.length === 0}
                className="text-accent dark:text-accent-dark hover:underline disabled:text-ink-soft dark:disabled:text-ink-soft-dark disabled:no-underline"
              >
                Selecionar Todas Visíveis
              </button>
              <button
                type="button"
                onClick={handleClearAllSubcategories}
                disabled={dataLoading || selectedSubcategories.length === 0}
                className="text-despesa dark:text-despesa-dark hover:underline disabled:text-ink-soft dark:disabled:text-ink-soft-dark disabled:no-underline"
              >
                Limpar Seleção
              </button>
            </div>
          </>
        )}

        {/* Palavras-chave */}
        {isOutrosSelected && (
          <div className="mb-4 p-4 bg-accent-soft dark:bg-accent-soft-dark border border-accent/20 dark:border-accent-dark/20 rounded-lg">
            <label htmlFor="keywords" className={labelClasses}>
              Palavras-chave para "Outros"
            </label>
            <input
              type="text"
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Buscar na descrição..."
              className={inputClasses}
            />
          </div>
        )}

        {/* Opção E-mail */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 accent-accent border-rule dark:border-rule-dark rounded"
            />
            <span className="ml-2 text-sm text-ink dark:text-ink-dark">
              Ao gerar PDF, enviar por e-mail em vez de baixar
            </span>
          </label>
        </div>

        {/* Botões Ação */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={handleViewReport}
            disabled={loading || dataLoading}
            className="flex-1 px-4 py-3 font-medium text-sm text-paper-raised dark:text-paper-dark bg-receita dark:bg-receita-dark rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Processando..." : "Visualizar Relatório na Tela"}
          </button>
          <button
            type="button"
            onClick={handleGenerateAction}
            disabled={
              loading ||
              dataLoading ||
              (selectedCategories.length === 0 &&
                !(isOutrosSelected && keywords.trim() !== ""))
            }
            className="flex-1 px-4 py-3 font-medium text-sm text-paper-raised dark:text-paper-dark bg-accent dark:bg-accent-dark rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading
              ? "Processando..."
              : sendEmail
              ? "Enviar por E-mail"
              : "Gerar e Baixar PDF"}
          </button>
        </div>
        {selectedCategories.length === 0 &&
          !(isOutrosSelected && keywords.trim() !== "") && (
            <p className="text-xs text-despesa dark:text-despesa-dark mt-2 text-center">
              Selecione ao menos uma categoria (ou 'Outros' com palavra-chave) para
              Gerar PDF / Enviar E-mail.
            </p>
          )}
      </div>

      {/* Área de Exibição */}
      {showResults && !loading && (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-medium text-ink dark:text-ink-dark text-center">
            Resultados para o Período
          </h2>

          {/* Resumos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              title="Receitas"
              value={formatCurrency(totalReceitasView)}
              icon={<FaArrowUp />}
              tone="receita"
            />
            <SummaryCard
              title="Despesas"
              value={formatCurrency(totalDespesasView)}
              icon={<FaArrowDown />}
              tone="despesa"
            />
            <SummaryCard
              title="Saldo"
              value={formatCurrency(saldoView)}
              icon={<FaDollarSign />}
              tone={saldoView >= 0 ? "accent" : "despesa"}
            />
            <SummaryCard
              title="Lançamentos"
              value={reportTransactions.length}
              icon={<FaListUl />}
              tone="accent"
            />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-6">
              <IncomeExpenseTrendChart transactions={reportTransactions} />
            </div>
            <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-6">
              <ExpenseCategoryPieChart transactions={reportTransactions} />
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark overflow-hidden">
            <div className="p-5 border-b border-rule dark:border-rule-dark flex items-center justify-between">
              <h3 className="font-display text-lg font-medium text-ink dark:text-ink-dark">
                Detalhes das Transações
              </h3>
              {reportTransactions.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-rule dark:border-rule-dark text-ink dark:text-ink-dark rounded-lg hover:bg-paper dark:hover:bg-paper-dark transition-colors"
                >
                  <FaDownload size={11} />
                  Baixar CSV
                </button>
              )}
            </div>

            {reportTransactions.length === 0 ? (
              <p className="p-6 text-sm text-ink-soft dark:text-ink-soft-dark">
                Nenhuma transação encontrada para este período.
              </p>
            ) : (
              <div className="overflow-y-auto max-h-96 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="text-ink-soft dark:text-ink-soft-dark text-[10.5px] uppercase tracking-wider sticky top-0 bg-paper-raised dark:bg-paper-raised-dark">
                    <tr>
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">Categoria</th>
                      <th className="px-5 py-3 font-medium">Tipo</th>
                      <th className="px-5 py-3 font-medium text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule dark:divide-rule-dark">
                    {reportTransactions.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-paper dark:hover:bg-paper-dark transition-colors"
                      >
                        <td className="px-5 py-3 font-mono text-[13px] text-ink-soft dark:text-ink-soft-dark whitespace-nowrap">
                          {formatDate(t.data)}
                        </td>
                        <td className="px-5 py-3 text-sm">
                          {t.subcategory ? (
                            <>
                              <span className="font-medium text-ink dark:text-ink-dark">
                                {t.subcategory.category.name}
                              </span>
                              <span className="text-ink-soft dark:text-ink-soft-dark">
                                {" "}
                                / {t.subcategory.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-ink-soft dark:text-ink-soft-dark">N/A</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm capitalize">
                          <span className="font-medium text-ink dark:text-ink-dark">
                            {t.tipo}
                          </span>
                          <span className="text-ink-soft dark:text-ink-soft-dark">
                            {" "}
                            / {t.recurrence}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-mono text-sm font-medium ${
                            t.tipo === "receita"
                              ? "text-receita dark:text-receita-dark"
                              : "text-despesa dark:text-despesa-dark"
                          }`}
                        >
                          {t.tipo === "receita" ? "+ " : "− "}
                          {formatCurrency(t.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const TONE_STYLES = {
  receita: {
    text: "text-receita dark:text-receita-dark",
    bg: "bg-receita-soft dark:bg-receita-soft-dark",
  },
  despesa: {
    text: "text-despesa dark:text-despesa-dark",
    bg: "bg-despesa-soft dark:bg-despesa-soft-dark",
  },
  accent: {
    text: "text-accent dark:text-accent-dark",
    bg: "bg-accent-soft dark:bg-accent-soft-dark",
  },
};

function SummaryCard({ title, value, icon, tone }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.accent;
  return (
    <div
      className={`flex items-center p-4 rounded-xl shadow-card dark:shadow-card-dark border border-rule dark:border-rule-dark ${styles.bg}`}
    >
      <div className={`text-2xl mr-3 ${styles.text} opacity-90`}>{icon}</div>
      <div>
        <p className="text-[11px] font-medium text-ink-soft dark:text-ink-soft-dark uppercase tracking-wider">
          {title}
        </p>
        <p className={`font-mono text-lg font-medium ${styles.text}`}>{value}</p>
      </div>
    </div>
  );
}

export default ReportsPage;