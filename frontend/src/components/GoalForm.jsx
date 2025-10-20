// frontend/src/components/GoalForm.jsx

import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

function GoalForm({ onSuccess, initialData }) {
  const [titulo, setTitulo] = useState("");
  const [valorObjetivo, setValorObjetivo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [prazo, setPrazo] = useState("");

  useEffect(() => {
    if (initialData) {
      setTitulo(initialData.titulo);
      setValorObjetivo(initialData.valor_objetivo);
      setValorAtual(initialData.valor_atual);
      setPrazo(
        initialData.prazo
          ? new Date(initialData.prazo).toISOString().split("T")[0]
          : ""
      );
    }
  }, [initialData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const goalData = {
      titulo,
      valor_objetivo: valorObjetivo,
      valor_atual: valorAtual || 0,
      prazo: prazo || null,
    };

    const promise = initialData
      ? api.put(`/goals/${initialData.id}`, goalData)
      : api.post("/goals", goalData);

    try {
      await toast.promise(promise, {
        loading: "Salvando...",
        success: "Meta salva com sucesso!",
        error: (err) => err.response?.data?.error || "Falha ao salvar a meta.",
      });

      const response = await promise;
      onSuccess(response.data);
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Título da Meta
        </label>
        <input
          type="text"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Valor Objetivo (R$)
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={valorObjetivo}
            onChange={(e) => setValorObjetivo(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Valor Atual (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={valorAtual}
            onChange={(e) => setValorAtual(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Prazo (Opcional)
        </label>
        <input
          type="date"
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Salvar Meta
        </button>
      </div>
    </form>
  );
}

export default GoalForm;
