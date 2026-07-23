// frontend/src/contexts/AuthContext.jsx

import { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoragedData() {
      const storagedUser = localStorage.getItem("@MeuControleFinanceiro:user");
      const storagedToken = localStorage.getItem(
        "@MeuControleFinanceiro:token"
      );

      if (storagedToken && storagedUser) {
        setUser(JSON.parse(storagedUser));
        api.defaults.headers.authorization = `Bearer ${storagedToken}`;
      }

      setLoading(false);
    }

    loadStoragedData();
  }, []);
  async function login({ email, senha }) {
    try {
      const response = await api.post("/login", { email, senha });
      const { user, token } = response.data;

      localStorage.setItem("@MeuControleFinanceiro:user", JSON.stringify(user));
      localStorage.setItem("@MeuControleFinanceiro:token", token);

      api.defaults.headers.authorization = `Bearer ${token}`;

      setUser(user);
    } catch (error) {
      throw error;
    }
  }

  // --- NOVO: atualiza os dados do usuário logado (usado após editar o perfil) ---
  function updateUser(updatedUser) {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem("@MeuControleFinanceiro:user", JSON.stringify(merged));
    setUser(merged);
  }

  function logout() {
    localStorage.removeItem("@MeuControleFinanceiro:user");
    localStorage.removeItem("@MeuControleFinanceiro:token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ signed: !!user, user, loading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}