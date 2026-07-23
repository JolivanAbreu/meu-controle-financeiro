// frontend/src/pages/ForgotPasswordPage.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { FaEnvelope } from "react-icons/fa";

const inputClasses =
  "w-full pl-10 pr-3 py-2.5 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors";

const labelClasses = "block text-sm font-medium text-ink dark:text-ink-dark mb-1";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/forgot-password", { email });
    } catch (error) {
      console.error("Erro ao solicitar redefinição:", error);
    } finally {
      setLoading(false);
      setSent(true);
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
        <div className="text-center">
          <h2 className="font-display text-2xl font-medium text-ink dark:text-ink-dark">
            Redefinir senha
          </h2>
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">
            Informe seu e-mail e enviaremos um link de redefinição
          </p>
        </div>

        {sent ? (
          <p className="text-sm text-receita dark:text-receita-dark bg-receita-soft dark:bg-receita-soft-dark p-3 rounded-lg text-center">
            Se este e-mail estiver cadastrado, você receberá um link para
            redefinir sua senha em instantes. Confira também a caixa de spam.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={labelClasses}>
                E-mail
              </label>
              <div className="relative">
                <FaEnvelope
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-ink-soft-dark"
                  size={14}
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 font-medium text-sm text-paper-raised dark:text-paper-dark bg-accent dark:bg-accent-dark rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-ink-soft dark:text-ink-soft-dark">
          Lembrou a senha?{" "}
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

export default ForgotPasswordPage;