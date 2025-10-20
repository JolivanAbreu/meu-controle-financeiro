// frontend/src/pages/RegisterPage.jsx

import { useState } from "react";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";

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
      console.log("Resposta da API:", response.data);
      setSuccess(
        `Usuário ${response.data.nome} cadastrado com sucesso! Redirecionando...`
      );

      setNome("");
      setEmail("");
      setSenha("");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Erro no registro:", error.response?.data);
      setError(
        error.response?.data?.error || "Ocorreu um erro. Tente novamente."
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 p-4">
      {}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl transform transition-all hover:scale-[1.01]">
        {}
        <div className="text-center">
          {}
          {}
          <h2 className="text-3xl font-bold text-gray-800">Crie sua Conta</h2>
          <p className="text-gray-500 mt-2">É rápido e fácil!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
            </div>
            <input
              id="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              className="w-full px-3 py-2 pl-10 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            />
          </div>

          {}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-3 py-2 pl-10 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            />
          </div>

          {}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
            </div>
            <input
              id="senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha (mín. 6 caracteres)"
              className="w-full px-3 py-2 pl-10 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            />
          </div>

          {}
          {error && (
            <p className="text-sm text-red-600 bg-red-100 p-2 rounded-lg text-center">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 bg-green-100 p-2 rounded-lg text-center">
              {success}
            </p>
          )}

          {}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-300"
            >
              Registrar
            </button>
          </div>
        </form>

        {}
        <div className="text-center text-sm text-gray-500">
          Já tem uma conta?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
