// frontend/src/pages/VerifyEmailPage.jsx

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Link inválido.");
        return;
      }
      try {
        const response = await api.get("/verify-email", { params: { token } });
        setStatus("success");
        setMessage(response.data.message);
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.error || "Não foi possível confirmar seu e-mail.",
        );
      }
    }
    verify();
  }, [token]);

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

      <div className="w-full max-w-md p-8 space-y-6 bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark text-center">
        <h2 className="font-display text-2xl font-medium text-ink dark:text-ink-dark">
          Confirmação de e-mail
        </h2>

        {status === "loading" && (
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark">
            Confirmando...
          </p>
        )}

        {status === "success" && (
          <p className="text-sm text-receita dark:text-receita-dark bg-receita-soft dark:bg-receita-soft-dark p-3 rounded-lg">
            {message}
          </p>
        )}

        {status === "error" && (
          <p className="text-sm text-despesa dark:text-despesa-dark bg-despesa-soft dark:bg-despesa-soft-dark p-3 rounded-lg">
            {message}
          </p>
        )}

        <Link
          to="/login"
          className="inline-block font-medium text-sm text-accent dark:text-accent-dark hover:underline"
        >
          Ir para o login
        </Link>
      </div>
    </div>
  );
}

export default VerifyEmailPage;