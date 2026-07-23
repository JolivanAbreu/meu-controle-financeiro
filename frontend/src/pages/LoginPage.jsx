import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { FaEnvelope, FaLock } from "react-icons/fa";

const inputClasses =
  "w-full pl-10 pr-3 py-2.5 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors";

const labelClasses = "block text-sm font-medium text-ink dark:text-ink-dark mb-1";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await login({ email, senha });
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        `Falha no login: ${error.response?.data?.error || "Erro de conexão"}`,
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
        <h2 className="font-display text-2xl font-medium text-center text-ink dark:text-ink-dark">
          Acesse sua conta
        </h2>

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
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label htmlFor="senha" className={labelClasses}>
              Senha
            </label>
            <div className="relative">
              <FaLock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-ink-soft-dark"
                size={14}
              />
              <input
                id="senha"
                name="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2.5 font-medium text-sm text-paper-raised dark:text-paper-dark bg-accent dark:bg-accent-dark rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Entrar
          </button>
        </form>

        <p className="text-sm text-center">
          <Link
            to="/forgot-password"
            className="font-medium text-accent dark:text-accent-dark hover:underline"
          >
            Esqueceu sua senha?
          </Link>
        </p>

        <p className="text-sm text-center text-ink-soft dark:text-ink-soft-dark">
          Não tem uma conta?{" "}
          <Link
            to="/register"
            className="font-medium text-accent dark:text-accent-dark hover:underline"
          >
            Registre-se
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;