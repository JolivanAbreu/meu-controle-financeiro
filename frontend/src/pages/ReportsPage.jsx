import React, { useState, useEffect } from "react";
import api from "../services/api";
import { getCategories, getSubcategories } from "../services/categoryService";
import { generateReport } from "../services/reportService";
import toast from "react-hot-toast";
import Select from "react-select";

const getMesAtual = () => {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { firstDay, lastDay };
};

function ReportsPage() {
  const [startDate, setStartDate] = useState(getMesAtual().firstDay);
  const [endDate, setEndDate] = useState(getMesAtual().lastDay);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [keywords, setKeywords] = useState("");
  const [sendEmail, setSendEmail] = useState(false);

  const [allCategories, setAllCategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [outrosId, setOutrosId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isOutrosSelected, setIsOutrosSelected] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setDataLoading(true);
      try {
        const [catRes, subcatRes] = await Promise.all([
          getCategories(),
          getSubcategories(),
        ]);
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

  useEffect(() => {
    const categoryIds = selectedCategories.map((c) => c.value);
    setIsOutrosSelected(outrosId ? categoryIds.includes(outrosId) : false);

    const available = allSubcategories
      .filter(sub => categoryIds.includes(sub.categoryId))
      .filter(sub => sub.categoryId !== outrosId)
      .map((s) => ({ value: s.id, label: `${s.category.name} / ${s.name}` }));

    setAvailableSubcategories(available);

    setSelectedSubcategories((prev) =>
      prev.filter((s) => available.some((a) => a.value === s.value))
    );

     if (!categoryIds.includes(outrosId)) {
        setKeywords("");
     }

  }, [selectedCategories, allSubcategories, outrosId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (selectedCategories.length === 0 && !isOutrosSelected) {
        toast.error("Selecione pelo menos uma categoria.");
        return;
    }
    if (isOutrosSelected && keywords.trim() === "" && selectedSubcategories.length === 0 && selectedCategories.length === 1) {
        toast.error("Para a categoria 'Outros', informe palavras-chave ou selecione outras categorias/subcategorias.");
        return;
    }

    setLoading(true);
    const filters = {
      startDate,
      endDate,
      categories: selectedCategories.map((c) => c.value),
      subcategories: selectedSubcategories.map((s) => s.value),
      keywords: isOutrosSelected ? keywords : "",
    };

    const promise = generateReport(filters, sendEmail);

    try {
      await toast.promise(promise, {
        loading: sendEmail ? "Enviando relatório..." : "Gerando PDF...",
        success: (data) => data.message || "Operação concluída!",
        error: (err) => {
          return err.response?.data?.error || `Falha ao ${sendEmail ? 'enviar' : 'gerar'} relatório.`;
        }
      });
    } catch (error) {
      console.error("Caught error during report generation/sending:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Relatórios Personalizados</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md mb-6 max-w-3xl mx-auto"
      >
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Filtros do Relatório</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data de Início
            </label>
            <input
              type="date" id="startDate" value={startDate} required
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data de Fim
            </label>
            <input
              type="date" id="endDate" value={endDate} required
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="categories" className="block text-sm font-medium text-gray-700 mb-1">
            Categorias (Obrigatório)
          </label>
          <Select
            id="categories" isMulti options={allCategories}
            value={selectedCategories} onChange={setSelectedCategories}
            placeholder={dataLoading ? "Carregando..." : "Selecione uma ou mais categorias..."}
            noOptionsMessage={() => "Nenhuma categoria encontrada"}
            isLoading={dataLoading}
            isDisabled={dataLoading}
          />
        </div>

        { availableSubcategories.length > 0 && (
            <div className="mb-4">
            <label htmlFor="subcategories" className="block text-sm font-medium text-gray-700 mb-1">
                Subcategorias (Opcional - Deixe em branco para incluir todas das categorias selecionadas)
            </label>
            <Select
                id="subcategories" isMulti options={availableSubcategories}
                value={selectedSubcategories} onChange={setSelectedSubcategories}
                placeholder="Selecione subcategorias específicas..."
                isDisabled={dataLoading || selectedCategories.length === 0}
            />
            </div>
        )}

        {isOutrosSelected && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
              Palavras-chave para "Outros" (Opcional)
            </label>
            <input
              type="text" id="keywords" value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Buscar na descrição (Ex: Presente, Viagem)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
             <p className="text-xs text-gray-500 mt-1">
                Se preenchido, busca transações de 'Outros' com estas palavras na descrição.
             </p>
          </div>
        )}

        <div className="mb-6">
            <label className="flex items-center">
                <input
                    type="checkbox" checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                    Enviar relatório por e-mail (em vez de baixar)
                </span>
            </label>
        </div>

        <button
          type="submit" disabled={loading || dataLoading || selectedCategories.length === 0}
          className="w-full px-4 py-3 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Processando..." : (sendEmail ? "Enviar Relatório por E-mail" : "Gerar e Baixar PDF")}
        </button>
      </form>
    </div>
  );
}

export default ReportsPage;