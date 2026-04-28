// frontend/src/components/GoalForm.jsx

import { useState, useEffect } from "react";
// Importe os services corretos
import { createGoal, updateGoal } from "../services/goalService"; // Exemplo
import toast from "react-hot-toast";

function GoalForm({ onSuccess, initialData }) {
  const [titulo, setTitulo] = useState("");
  const [valorObjetivo, setValorObjetivo] = useState("");
  // const [valorAtual, setValorAtual] = useState(""); // --- REMOVIDO ---
  const [prazo, setPrazo] = useState("");
  // Adicionar estado para accountId (Upgrade 2)
  // const [accountId, setAccountId] = useState('');
  // const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (initialData) {
      setTitulo(initialData.titulo);
      setValorObjetivo(initialData.valor_objetivo);
      // setValorAtual(initialData.valor_atual); // --- REMOVIDO ---
      setPrazo(initialData.prazo ? new Date(initialData.prazo).toISOString().split("T")[0] : "");
      // setAccountId(initialData.accountId || ''); // Upgrade 2
    } else {
        // Reset para criação
        setTitulo('');
        setValorObjetivo('');
        setPrazo('');
        // setAccountId(''); // Upgrade 2
    }
    // Adicionar fetch de contas aqui para Upgrade 2
  }, [initialData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Monta o payload SEM valor_atual
    const goalData = {
      titulo,
      valor_objetivo: valorObjetivo,
      // valor_atual não é mais enviado daqui
      prazo: prazo || null,
      // accountId: accountId || null, // Upgrade 2
    };

    const promise = initialData
      ? updateGoal(initialData.id, goalData) // Usa service atualizado
      : createGoal(goalData);                 // Usa service atualizado

    try {
      // toast.promise já executa a promise
      const response = await toast.promise(promise, {
        loading: "Salvando...",
        success: "Meta salva com sucesso!",
        error: (err) => err.response?.data?.error || "Falha ao salvar a meta.",
      });
      onSuccess(response.data); // Chama onSuccess com os dados retornados
    } catch (error) {
      // O erro já foi mostrado pelo toast, apenas logar se necessário
      console.error("Erro ao salvar meta (pego no catch):", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Título da Meta</label>
        <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"/>
      </div>
      <div> {/* Removido flex gap-4 */}
          <label className="block text-sm font-medium text-gray-700">Valor Objetivo (R$)</label>
          <input type="number" step="0.01" required value={valorObjetivo} onChange={(e) => setValorObjetivo(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"/>
      </div>
      {/* --- CAMPO VALOR ATUAL REMOVIDO --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Prazo (Opcional)</label>
        <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"/>
      </div>

       {/* --- CAMPO CONTA (Upgrade 2) --- */}
       {/*
        <div>
            <label className="block text-sm font-medium text-gray-700">Vincular à Conta (Opcional)</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md">
                <option value="">Nenhuma</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
        </div>
       */}
       {/* ----------------------------- */}

      <div className="flex justify-end pt-2"> {/* Adicionado pt-2 */}
        <button type="submit" className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          {initialData ? 'Atualizar Meta' : 'Criar Meta'}
        </button>
      </div>
    </form>
  );
}

export default GoalForm;