import { useState, useEffect } from "react";
import { createGoal, updateGoal } from "../services/goalService";
import toast from "react-hot-toast";

const inputClasses =
  "w-full px-3 py-2 mt-1 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors";

const labelClasses = "block text-sm font-medium text-ink dark:text-ink-dark";

function GoalForm({ onSuccess, initialData }) {
  const [titulo, setTitulo] = useState("");
  const [valorObjetivo, setValorObjetivo] = useState("");
  const [prazo, setPrazo] = useState("");

  useEffect(() => {
    if (initialData) {
      setTitulo(initialData.titulo);
      setValorObjetivo(initialData.valor_objetivo);
      setPrazo(
        initialData.prazo
          ? new Date(initialData.prazo).toISOString().split("T")[0]
          : "",
      );
    } else {
      setTitulo("");
      setValorObjetivo("");
      setPrazo("");
    }
  }, [initialData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const goalData = {
      titulo,
      valor_objetivo: valorObjetivo,
      prazo: prazo || null,
    };

    const promise = initialData
      ? updateGoal(initialData.id, goalData)
      : createGoal(goalData);

    try {
      const response = await toast.promise(promise, {
        loading: "Salvando...",
        success: "Meta salva com sucesso!",
        error: (err) => err.response?.data?.error || "Falha ao salvar a meta.",
      });
      onSuccess(response.data);
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClasses}>Título da Meta</label>
        <input
          type="text"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Viagem para o Chile"
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>Valor Objetivo</label>
        <div className="relative mt-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-ink-soft-dark font-mono text-sm pointer-events-none">
            R$
          </span>
          <input
            type="number"
            step="0.01"
            required
            value={valorObjetivo}
            onChange={(e) => setValorObjetivo(e.target.value)}
            placeholder="0,00"
            className={`${inputClasses} mt-0 pl-9 font-mono`}
          />
        </div>
      </div>

      <div>
        <label className={labelClasses}>Prazo (Opcional)</label>
        <input
          type="date"
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
          className={`${inputClasses} font-mono`}
        />
        <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-1">
          Deixe em branco se não houver um prazo definido.
        </p>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2.5 font-medium text-sm text-paper-raised dark:text-paper-dark bg-accent dark:bg-accent-dark rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {initialData ? "Atualizar Meta" : "Criar Meta"}
      </button>
    </form>
  );
}

export default GoalForm;