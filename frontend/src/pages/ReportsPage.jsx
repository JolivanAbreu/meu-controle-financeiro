import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { getCategories, getSubcategories } from "../services/categoryService";
import { generateReport } from "../services/reportService";
import toast from "react-hot-toast";
import Select from "react-select";
// --- NOVOS IMPORTS ---
import IncomeExpenseTrendChart from "../components/IncomeExpenseTrendChart"; // Importar gráfico de linha
import ExpenseCategoryPieChart from "../components/ExpenseCategoryPieChart"; // Importar gráfico de pizza
// --------------------
import { FaDollarSign, FaArrowUp, FaArrowDown } from "react-icons/fa";

// Funções auxiliares (sem alteração)
const getMesAtual = () => { /* ...código original... */
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];
    return { firstDay, lastDay };
};
const formatCurrency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

function ReportsPage() {
  // Estados dos Filtros (sem alteração)
  const [startDate, setStartDate] = useState(getMesAtual().firstDay);
  const [endDate, setEndDate] = useState(getMesAtual().lastDay);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [keywords, setKeywords] = useState("");
  const [sendEmail, setSendEmail] = useState(false);

  // Estados dos Dados (sem alteração)
  const [allCategories, setAllCategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [outrosId, setOutrosId] = useState(null);

  // Estados de UI (sem alteração)
  const [loading, setLoading] = useState(false);
  const [isOutrosSelected, setIsOutrosSelected] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Estado para Resultados na Tela (sem alteração)
  const [reportTransactions, setReportTransactions] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Carregar Filtros (sem alteração)
  useEffect(() => { /* ...código original... */
    async function loadData() {
        setDataLoading(true);
        try {
          const [catRes, subcatRes] = await Promise.all([ getCategories(), getSubcategories() ]);
          const categoriesData = catRes.data.map((c) => ({ value: c.id, label: c.name }));
          setAllCategories(categoriesData);
          const outros = categoriesData.find((c) => c.label === "Outros");
          if (outros) setOutrosId(outros.value);
          setAllSubcategories(subcatRes.data);
        } catch (err) {
          console.error("Failed to load category data:", err);
          toast.error("Falha ao carregar filtros.");
        } finally {
          setDataLoading(false);
        }
      }
      loadData();
  }, []);

  // Atualizar Subcategorias Disponíveis (sem alteração)
  useEffect(() => { /* ...código original... */
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

  // Handler para VISUALIZAR Relatório (sem alteração)
  const handleViewReport = async () => { /* ...código original... */
    setLoading(true);
    setShowResults(false);
    setReportTransactions([]);

    const promise = api.get("/transactions", {
      params: { startDate, endDate },
    });

    try {
      await toast.promise(promise, { loading: "Buscando dados...", success: "Dados carregados!", error: "Falha ao buscar dados.", });
      const response = await promise;
      setReportTransactions(response.data);
      setShowResults(true);
    } catch (error) {
      console.error("Erro ao buscar relatório para visualização:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler para GERAR PDF / ENVIAR E-MAIL (sem alteração)
  const handleGenerateAction = async () => { /* ...código original... */
    if (selectedCategories.length === 0 && !isOutrosSelected) { toast.error("Selecione pelo menos uma categoria para gerar o PDF/E-mail."); return; }
    if (isOutrosSelected && keywords.trim() === "" && selectedSubcategories.length === 0 && selectedCategories.length === 1) { toast.error("Para a categoria 'Outros', informe palavras-chave ou selecione outras categorias/subcategorias."); return; }
    setLoading(true);
    const filters = { startDate, endDate, categories: selectedCategories.map((c) => c.value), subcategories: selectedSubcategories.map((s) => s.value), keywords: isOutrosSelected ? keywords : "", };
    const promise = generateReport(filters, sendEmail);
    try {
      await toast.promise(promise, { loading: sendEmail ? "Enviando relatório..." : "Gerando PDF...", success: (data) => data.message || "Operação concluída!", error: (err) => err.response?.data?.error || `Falha ao ${sendEmail ? 'enviar' : 'gerar'} relatório.`, });
    } catch (error) { console.error("Caught error during report generation/sending:", error); } finally { setLoading(false); }
  };

  // Cálculos para a área de exibição (sem alteração)
  const totalReceitasView = reportTransactions.filter((t) => t.tipo === "receita").reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const totalDespesasView = reportTransactions.filter((t) => t.tipo === "despesa").reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const saldoView = totalReceitasView - totalDespesasView;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Relatórios</h1>

      {/* Formulário de Filtros (sem alteração na estrutura, apenas labels e texto de ajuda) */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 max-w-3xl mx-auto">
        {/* ... (inputs de data, selects de categoria/subcategoria, input keywords, checkbox email)... */}
         <h2 className="text-xl font-semibold mb-4 border-b pb-2">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
            <input type="date" id="startDate" value={startDate} required onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
            <input type="date" id="endDate" value={endDate} required onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="categories" className="block text-sm font-medium text-gray-700 mb-1">Categorias (para PDF/E-mail)</label>
          <Select id="categories" isMulti options={allCategories} value={selectedCategories} onChange={setSelectedCategories} placeholder={dataLoading ? "Carregando..." : "Selecione (Opcional para Visualizar)"} noOptionsMessage={() => "Nenhuma categoria"} isLoading={dataLoading} isDisabled={dataLoading}/>
          <p className="text-xs text-gray-500 mt-1">O botão "Visualizar" usa apenas o filtro de data. Selecione categorias aqui APENAS para gerar PDF ou enviar por e-mail.</p>
        </div>
        { availableSubcategories.length > 0 && (
            <div className="mb-4">
            <label htmlFor="subcategories" className="block text-sm font-medium text-gray-700 mb-1">Subcategorias (para PDF/E-mail)</label>
            <Select id="subcategories" isMulti options={availableSubcategories} value={selectedSubcategories} onChange={setSelectedSubcategories} placeholder="Opcional..." isDisabled={dataLoading || selectedCategories.length === 0}/>
            </div>
        )}
        {isOutrosSelected && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave para "Outros" (para PDF/E-mail)</label>
            <input type="text" id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Buscar na descrição..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
        )}
        <div className="mb-6">
            <label className="flex items-center">
                <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                <span className="ml-2 text-sm text-gray-700">Ao gerar PDF, enviar por e-mail em vez de baixar</span>
            </label>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button type="button" onClick={handleViewReport} disabled={loading || dataLoading} className="flex-1 px-4 py-3 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">
            {loading ? "Processando..." : "Visualizar Relatório na Tela"}
          </button>
          <button type="button" onClick={handleGenerateAction} disabled={loading || dataLoading || (selectedCategories.length === 0 && !isOutrosSelected) } className="flex-1 px-4 py-3 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            {loading ? "Processando..." : (sendEmail ? "Enviar por E-mail" : "Gerar e Baixar PDF")}
          </button>
        </div>
        { (selectedCategories.length === 0 && !isOutrosSelected) &&
            <p className="text-xs text-red-500 mt-2 text-center">Selecione ao menos uma categoria para poder Gerar PDF / Enviar E-mail.</p>
        }
      </div>

      {/* --- ÁREA DE EXIBIÇÃO ATUALIZADA --- */}
      { showResults && !loading && (
        <div className="mt-10 space-y-8"> {/* Adiciona espaço entre os elementos */}
          <h2 className="text-2xl font-semibold text-center">Resultados para o Período (Visualização)</h2>

          {/* Resumos (sem alteração) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* ... código dos cards de resumo ... */}
              <div className="bg-green-100 p-4 rounded-lg shadow-md flex items-center">
               <FaArrowUp className="text-green-600 text-3xl mr-4" />
               <div> <p className="text-gray-600">Total Receitas</p> <p className="text-2xl font-bold text-green-700">{formatCurrency(totalReceitasView)}</p> </div>
             </div>
             <div className="bg-red-100 p-4 rounded-lg shadow-md flex items-center">
               <FaArrowDown className="text-red-600 text-3xl mr-4" />
               <div> <p className="text-gray-600">Total Despesas</p> <p className="text-2xl font-bold text-red-700">{formatCurrency(totalDespesasView)}</p> </div>
             </div>
             <div className="bg-blue-100 p-4 rounded-lg shadow-md flex items-center">
               <FaDollarSign className="text-blue-600 text-3xl mr-4" />
               <div> <p className="text-gray-600">Saldo</p> <p className={`text-2xl font-bold ${saldoView >= 0 ? "text-blue-700" : "text-red-700"}`}>{formatCurrency(saldoView)}</p> </div>
             </div>
          </div>

          {/* Seção dos Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white p-6 rounded-lg shadow-md">
               {/* Gráfico de Linha */}
               <IncomeExpenseTrendChart transactions={reportTransactions} />
             </div>
             <div className="bg-white p-6 rounded-lg shadow-md">
                {/* Gráfico de Pizza */}
               <ExpenseCategoryPieChart transactions={reportTransactions} />
             </div>
          </div>

          {/* Tabela de Detalhes (sem alteração) */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Detalhes das Transações</h3>
            {reportTransactions.length === 0 ? (
              <p>Nenhuma transação encontrada para este período.</p>
            ) : (
              <div className="overflow-y-auto max-h-96">
                <table className="w-full">
                  {/* ... thead e tbody da tabela (código original estava correto) ... */}
                   <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 px-3">Data</th>
                        <th className="py-2 px-3">Categoria</th>
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportTransactions.map((t) => (
                        <tr key={t.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-3">{formatDate(t.data)}</td>
                          <td className="py-3 px-3">
                            {t.subcategory ? ( <> <span className="font-semibold">{t.subcategory.category.name}</span> <span className="text-gray-500"> / {t.subcategory.name}</span> </> ) : (<span className="text-gray-400">N/A</span>)}
                          </td>
                          <td className="py-3 px-3 capitalize">
                             <span className="font-semibold">{t.tipo}</span>
                             <span className="text-gray-500"> / {t.recurrence}</span>
                          </td>
                          <td className={`py-3 px-3 text-right font-semibold ${ t.tipo === "receita" ? "text-green-600" : "text-red-600" }`}>
                            {t.tipo === "receita" ? "+" : "-"} {formatCurrency(t.valor)}
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

export default ReportsPage;