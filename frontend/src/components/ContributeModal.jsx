import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { addGoalContribution } from "../services/goalService";

const inputClasses =
  "w-full px-3 py-2 mt-1 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors";

const labelClasses = "block text-sm font-medium text-ink dark:text-ink-dark";

function ContributeModal({ isOpen, onClose, goal, onSuccess }) {
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValor("");
      setData(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen, goal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goal || !valor || !data) return;

    setLoading(true);
    const contributionData = { valor: parseFloat(valor), data };
    const promise = addGoalContribution(goal.id, contributionData);

    try {
      const response = await toast.promise(promise, {
        loading: "Registrando aporte...",
        success: "Aporte registrado com sucesso!",
        error: (err) => err.response?.data?.error || "Falha ao registrar aporte.",
      });
      onSuccess(response.data);
    } catch (error) {
      console.error("Erro ao adicionar aporte:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !goal) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Aportar para: ${goal.titulo}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="aporteValor" className={labelClasses}>
            Valor do Aporte
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-ink-soft-dark font-mono text-sm pointer-events-none">
              R$
            </span>
            <input
              type="number"
              id="aporteValor"
              step="0.01"
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className={`${inputClasses} mt-0 pl-9 font-mono`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="aporteData" className={labelClasses}>
            Data do Aporte
          </label>
          <input
            type="date"
            id="aporteData"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className={`${inputClasses} font-mono`}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-rule dark:border-rule-dark text-ink dark:text-ink-dark rounded-lg hover:bg-paper dark:hover:bg-paper-dark transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-paper-raised dark:text-paper-dark bg-receita dark:bg-receita-dark rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Salvando..." : "Salvar Aporte"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ContributeModal;