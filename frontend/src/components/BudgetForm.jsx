// frontend/src/components/BudgetForm.jsx

import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { getCategories } from "../services/categoryService";

const meses = [
  { nome: "Janeiro", valor: 1 },
  { nome: "Fevereiro", valor: 2 },
  { nome: "Março", valor: 3 },
  { nome: "Abril", valor: 4 },
  { nome: "Maio", valor: 5 },
  { nome: "Junho", valor: 6 },
  { nome: "Julho", valor: 7 },
  { nome: "Agosto", valor: 8 },
  { nome: "Setembro", valor: 9 },
  { nome: "Outubro", valor: 10 },
  { nome: "Novembro", valor: 11 },
  { nome: "Dezembro", valor: 12 },
];

const inputClasses =
  "w-full px-3 py-2 mt-1 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent " +
  "disabled:bg-rule/40 dark:disabled:bg-rule-dark/40 disabled:text-ink-soft dark:disabled:text-ink-soft-dark " +
  "transition-colors";

const labelClasses = "block text-sm font-medium text-ink dark:text-ink-dark";

// NOVO: recebe defaultMes/defaultAno da página (mês/ano que o usuário está filtrando),
// usados apenas ao criar um orçamento novo (initialData ausente).
function BudgetForm({ onSuccess, initialData, defaultMes, defaultAno }) {
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [limite, setLimite] = useState("");
  const [mes, setMes] = useState(defaultMes || new Date().getMonth() + 1);
  const [ano, setAno] = useState(defaultAno || new Date().getFullYear());

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error("Falha ao carregar categorias:", error);
        toast.error("Não foi possível carregar as categorias.");
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      setCategoryId(initialData.categoryId || "");
      setLimite(initialData.limite);
      setMes(initialData.mes);
      setAno(initialData.ano);
    } else {
      setCategoryId("");
      setMes(defaultMes || new Date().getMonth() + 1);
      setAno(defaultAno || new Date().getFullYear());
    }
  }, [initialData, defaultMes, defaultAno]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!categoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }

    const budgetData = {
      categoryId: Number(categoryId),
      limite: Number(limite),
      mes: Number(mes),
      ano: Number(ano),
    };

    const promise = initialData
      ? api.put(`/budgets/${initialData.id}`, budgetData)
      : api.post("/budgets", budgetData);

    try {
      await toast.promise(promise, {
        loading: "Salvando...",
        success: "Orçamento salvo com sucesso!",
        error: (err) =>
          err.response?.data?.error || "Falha ao salvar o orçamento.",
      });

      const response = await promise;
      onSuccess(response.data);
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClasses}>Categoria</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={categoriesLoading}
          required
          className={inputClasses}
        >
          <option value="">
            {categoriesLoading ? "Carregando..." : "Selecione uma categoria"}
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClasses}>Limite (R$)</label>
        <input
          type="number"
          step="0.01"
          required
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
          className={`${inputClasses} font-mono`}
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className={labelClasses}>Mês</label>
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className={inputClasses}
          >
            {meses.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className={labelClasses}>Ano</label>
          <input
            type="number"
            required
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className={`${inputClasses} font-mono`}
          />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-4 py-2 font-medium text-sm text-paper-raised dark:text-paper-dark bg-accent dark:bg-accent-dark rounded-lg hover:opacity-90 transition-opacity"
        >
          Salvar Orçamento
        </button>
      </div>
    </form>
  );
}

export default BudgetForm;