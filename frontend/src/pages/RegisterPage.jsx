import { useState } from "react";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";

const inputClasses =
  "w-full pl-10 pr-3 py-2.5 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors";

function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      const response = await api.post("/register", { nome, email, senha });
      setSuccess(
        `Cadastro realizado! Enviamos um link de confirmação para ${email}. Redirecionando...`,
      );

      setNome("");
      setEmail("");
      setSenha("");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setError(
        error.response?.data?.error || "Ocorreu um erro. Tente novamente.",
      );
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
            Crie sua conta
          </h2>
          <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">
            É rápido e fácil
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaUser
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-ink-soft-dark"
              size={14}
            />
            <input
              id="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              className={inputClasses}
            />
          </div>

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
              placeholder="seu@email.com"
              className={inputClasses}
            />
          </div>

          <div className="relative">
            <FaLock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-ink-soft-dark"
              size={14}
            />
            <input
              id="senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha (mín. 6 caracteres)"
              className={inputClasses}
            />
          </div>

          {error && (
            <p className="text-sm text-despesa dark:text-despesa-dark bg-despesa-soft dark:bg-despesa-soft-dark p-2.5 rounded-lg text-center">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-receita dark:text-receita-dark bg-receita-soft dark:bg-receita-soft-dark p-2.5 rounded-lg text-center">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2.5 font-medium text-sm text-paper-raised dark:text-paper-dark bg-accent dark:bg-accent-dark rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Registrar
          </button>
        </form>

        <p className="text-sm text-center text-ink-soft dark:text-ink-soft-dark">
          Já tem uma conta?{" "}
          <Link
            to="/login"
            className="font-medium text-accent dark:text-accent-dark hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
