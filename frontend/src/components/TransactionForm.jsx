// frontend/src/components/TransactionForm.jsx

import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { getCategories, getSubcategories } from "../services/categoryService";

function TransactionForm({ onSuccess, initialData }) {

  const [tipo, setTipo] = useState("despesa");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [descricao, setDescricao] = useState("");
  const [recurrence, setRecurrence] = useState("variável");
  const [installments, setInstallments] = useState(12);
  const [allCategories, setAllCategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryData() {
      try {
        const [catRes, subcatRes] = await Promise.all([
          getCategories(),
          getSubcategories(),
        ]);
        setAllCategories(catRes.data);
        setAllSubcategories(subcatRes.data);
      } catch (error) {
        console.error("Falha ao carregar dados de categoria", error);
        toast.error("Não foi possível carregar as categorias.");
      } finally {
        setDataLoading(false);
      }
    }
    loadCategoryData();
  }, []);
-
  useEffect(() => {
    if (!dataLoading && initialData) {
      const { tipo, valor, data, descricao, recurrence, subcategory } = initialData;
      
      setTipo(tipo);
      setValor(valor);
      setData(new Date(data).toISOString().split("T")[0]);
      setDescricao(descricao || "");
      setRecurrence(recurrence || "variável");

      if (subcategory) {
        const parentCategoryId = subcategory.category_id;
        
        setSelectedCategory(parentCategoryId);

        const relevantSubcategories = allSubcategories.filter(
          (sc) => sc.categoryId === parentCategoryId
        );
        setFilteredSubcategories(relevantSubcategories);
        
        setSelectedSubcategory(subcategory.id);
      }
    } else if (!initialData) {
      setTipo("despesa");
      setValor("");
      setData(new Date().toISOString().split("T")[0]);
      setDescricao("");
      setRecurrence("variável");
      setInstallments(12);
      setSelectedCategory("");
      setSelectedSubcategory("");
      setFilteredSubcategories([]);
    }
  }, [initialData, dataLoading, allSubcategories]);

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedSubcategory("");

    if (categoryId) {
      const filtered = allSubcategories.filter(
        (sub) => sub.categoryId === parseInt(categoryId)
      );
      setFilteredSubcategories(filtered);
    } else {
      setFilteredSubcategories([]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedSubcategory) {
      toast.error("Por favor, selecione uma categoria e subcategoria.");
      return;
    }

    const transactionData = {
      tipo,
      valor: Number(valor),
      data,
      descricao,
      subcategoryId: parseInt(selectedSubcategory),
    };

    if (!initialData) {
      transactionData.recurrence = recurrence;
      if (recurrence === "fixo") {
        const numInstallments = parseInt(installments, 10);
        if (!numInstallments || numInstallments <= 0) {
          toast.error("Informe uma quantidade válida de meses (pelo menos 1).");
          return;
        }
        transactionData.installments = numInstallments;
      }
    }

    const promise = initialData
      ? api.put(`/transactions/${initialData.id}`, transactionData)
      : api.post("/transactions", transactionData);

    try {
      const response = await toast.promise(promise, {
        loading: "Salvando...",
        success: "Transação salva com sucesso!",
        error: (err) => err.response?.data?.error || "Falha ao salvar a transação.",
      });
      onSuccess(response.data);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4"> {}
      {}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
          <input
            type="number" step="0.01" required value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* --- CAMPOS DE CATEGORIA SUBSTITUÍDOS --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Categoria</label>
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          disabled={dataLoading}
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">{dataLoading ? "Carregando..." : "Selecione uma categoria"}</option>
          {allCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Subcategoria</label>
        <select
          value={selectedSubcategory}
          onChange={(e) => setSelectedSubcategory(e.target.value)}
          disabled={!selectedCategory || filteredSubcategories.length === 0}
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">{selectedCategory ? "Selecione uma subcategoria" : "Escolha uma categoria"}</option>
          {filteredSubcategories.map((sub) => (
            <option key={sub.id} value={sub.id}>{sub.name}</option>
          ))}
        </select>
        {selectedCategory && filteredSubcategories.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Nenhuma subcategoria. Adicione uma na página "Gerenciar Categorias".
          </p>
        )}
      </div>
      
      {/* Campo de Descrição (Opcional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label>
        <input
          type="text" value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Compras do mês"
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Campo de Data */}
      <div>
        <label className="block text-sm font-medium text-gray-700">{recurrence === "fixo" ? "Data do Primeiro Vencimento" : "Data"}</label>
        <input
          type="date" required value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Mantém sua Lógica de Recorrência */}
      {!initialData && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">Recorrência</label>
            <div className="flex items-center mt-2 space-x-6">
              <div className="flex items-center">
                <input id="variável" name="recurrence" type="radio" value="variável" checked={recurrence === "variável"} onChange={(e) => setRecurrence(e.target.value)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <label htmlFor="variável" className="block ml-2 text-sm text-gray-900">Variável (Única)</label>
              </div>
              <div className="flex items-center">
                <input id="fixo" name="recurrence" type="radio" value="fixo" checked={recurrence === "fixo"} onChange={(e) => setRecurrence(e.target.value)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <label htmlFor="fixo" className="block ml-2 text-sm text-gray-900">Fixo (Recorrente)</label>
              </div>
            </div>
          </div>
          {recurrence === "fixo" && (
            <div>
              <label htmlFor="installments" className="block text-sm font-medium text-gray-700">Quantidade de Meses</label>
              <input type="number" id="installments" value={installments} onChange={(e) => setInstallments(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required={recurrence === "fixo"} min="1" max="120" />
              <p className="text-xs text-gray-500 mt-1">A transação será replicada por {installments || 0} meses.</p>
            </div>
          )}
        </>
      )}

      {/* Botão de Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {initialData ? "Atualizar Transação" : "Salvar Transação"}
        </button>
      </div>
    </form>
  );
}

export default TransactionForm;