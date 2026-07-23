// frontend/src/pages/ResetPasswordPage.jsx

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { FaLock } from "react-icons/fa";

const inputClasses =
  "w-full pl-10 pr-3 py-2.5 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors";

const labelClasses = "block text-sm font-medium text-ink dark:text-ink-dark mb-1";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (novaSenha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmacao) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/reset-password", { token, novaSenha });
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.error || "Não foi possível redefinir sua senha.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-paper dark:bg-paper-dark p-4">
      <div className="flex items-center gap-2.5 mb-6">
        <span className="w-9 h-9 flex items-center justify-center rounded border border-ink/20 dark:border-ink-dark/20 font-display text-sm text-ink dark:text-ink-dark">
          MF
        </span>
        <span className="font-display text-lg text-ink dark:text-ink-dark">
          Meu Controle Financeiro
        </span>
      </div>

      <div className="w-full max-w-md p-8 space-y-6 bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark">
        <h2 className="font-display text-2xl font-medium text-center text-ink dark:text-ink-dark">
          Escolha uma nova senha
        </h2>

        {!token ? (
          <p className="text-sm text-despesa dark:text-despesa-dark bg-despesa-soft dark:bg-despesa-soft-dark p-3 rounded-lg text-center">
            Link inválido. Solicite uma nova redefinição de senha.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="novaSenha" className={labelClasses}>
                Nova senha
              </label>
              <div className="relative">
                <FaLock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-ink-soft-dark"
                  size={14}
                />
                <input
                  id="novaSenha"
                  type="password"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmacao" className={labelClasses}>
                Confirme a nova senha
              </label>
              <div className="relative">
                <FaLock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-ink-soft-dark"
                  size={14}
                />
                <input
                  id="confirmacao"
                  type="password"
                  required
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-despesa dark:text-despesa-dark bg-despesa-soft dark:bg-despesa-soft-dark p-2.5 rounded-lg text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 font-medium text-sm text-paper-raised dark:text-paper-dark bg-accent dark:bg-accent-dark rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-ink-soft dark:text-ink-soft-dark">
          <Link
            to="/forgot-password"
            className="font-medium text-accent dark:text-accent-dark hover:underline"
          >
            Solicitar novo link
          </Link>
          {" · "}
          <Link
            to="/login"
            className="font-medium text-accent dark:text-accent-dark hover:underline"
          >
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPasswordPage;