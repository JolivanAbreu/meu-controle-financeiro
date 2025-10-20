// frontend/src/components/BudgetForm.jsx

import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

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

function BudgetForm({ onSuccess, initialData }) {
  const [categoria, setCategoria] = useState("");
  const [limite, setLimite] = useState("");
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  useEffect(() => {
    if (initialData) {
      setCategoria(initialData.categoria);
      setLimite(initialData.limite);
      setMes(initialData.mes);
      setAno(initialData.ano);
    }
  }, [initialData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const budgetData = {
      categoria,
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
        <label className="block text-sm font-medium text-gray-700">
          Categoria
        </label>
        <input
          type="text"
          required
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Limite (R$)
        </label>
        <input
          type="number"
          step="0.01"
          required
          value={limite}
          onChange={(e) => setLimite(e.target.value)}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Mês</label>
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          >
            {meses.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Ano</label>
          <input
            type="number"
            required
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Salvar Orçamento
        </button>
      </div>
    </form>
  );
}

export default BudgetForm;
