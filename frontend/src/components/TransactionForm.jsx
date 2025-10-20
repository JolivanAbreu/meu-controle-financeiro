// frontend/src/components/TransactionForm.jsx

import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

function TransactionForm({ onSuccess, initialData }) {
  const [tipo, setTipo] = useState("despesa");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [descricao, setDescricao] = useState("");
  const [recurrence, setRecurrence] = useState("variável");

  // --- ESTADO MODIFICADO ---
  // Removemos recurrenceEndDate e adicionamos installments
  const [installments, setInstallments] = useState(12); // Padrão de 12 meses

  useEffect(() => {
    if (initialData) {
      // Modo de Edição
      setTipo(initialData.tipo);
      setValor(initialData.valor);
      setCategoria(initialData.categoria);
      setData(new Date(initialData.data).toISOString().split("T")[0]);
      setDescricao(initialData.descricao || "");
      setRecurrence(initialData.recurrence || "variável");

      // (Não precisamos carregar a quantidade na edição, pois o campo fica oculto)
    } else {
      // Modo de Criação: Reseta para os padrões
      setTipo("despesa");
      setValor("");
      setCategoria("");
      setData(new Date().toISOString().split("T")[0]);
      setDescricao("");
      setRecurrence("variável");
      setInstallments(12); // <-- Reseta o novo campo
    }
  }, [initialData]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const transactionData = {
      tipo,
      valor: Number(valor),
      categoria,
      data,
      descricao,
    };

    // Adiciona lógica de recorrência APENAS se for uma NOVA transação
    if (!initialData) {
      transactionData.recurrence = recurrence;

      if (recurrence === "fixo") {
        const numInstallments = parseInt(installments, 10);
        // Validação no frontend
        if (!numInstallments || numInstallments <= 0) {
          toast.error(
            "Por favor, informe uma quantidade válida de meses (pelo menos 1)."
          );
          return;
        }
        // --- ENVIA A QUANTIDADE ---
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
        error: (err) =>
          err.response?.data?.error || "Falha ao salvar a transação.",
      });

      onSuccess(response.data);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1 p-4">
      {/* --- Campos Existentes (Tipo, Valor, Categoria) --- */}
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
        <label className="block text-sm font-medium text-gray-700">
          Valor (R$)
        </label>
        <input
          type="number"
          step="0.01"
          required
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Categoria
        </label>
        <input
          type="text"
          required
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Ex: Supermercado"
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* --- Campo de Data --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {recurrence === "fixo" ? "Data do Primeiro Vencimento" : "Data"}
        </label>
        <input
          type="date"
          required
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* --- Campo de Descrição --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descrição (Opcional)
        </label>
        <input
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Compras do mês"
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Campo de Recorrência (só aparece no modo de criação) */}
      {!initialData && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Recorrência
            </label>
            <div className="flex items-center mt-2 space-x-6">
              <div className="flex items-center">
                <input
                  id="variável"
                  name="recurrence"
                  type="radio"
                  value="variável"
                  checked={recurrence === "variável"}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="variável"
                  className="block ml-2 text-sm text-gray-900"
                >
                  Variável (Única)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="fixo"
                  name="recurrence"
                  type="radio"
                  value="fixo"
                  checked={recurrence === "fixo"}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="fixo"
                  className="block ml-2 text-sm text-gray-900"
                >
                  Fixo (Recorrente)
                </label>
              </div>
            </div>
          </div>

          {/* --- CAMPO DE QUANTIDADE (SUBSTITUIU A DATA FINAL) --- */}
          {recurrence === "fixo" && (
            <div>
              <label
                htmlFor="installments"
                className="block text-sm font-medium text-gray-700"
              >
                Quantidade de Meses
              </label>
              <input
                type="number"
                id="installments"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required={recurrence === "fixo"}
                min="1"
                max="120" // Limite de 10 anos
              />
              <p className="text-xs text-gray-500 mt-1">
                A transação será replicada por {installments || 0} meses.
              </p>
            </div>
          )}
        </>
      )}

      {/* --- Botão de Submit --- */}
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
