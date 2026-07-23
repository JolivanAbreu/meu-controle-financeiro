// frontend/src/pages/ProfilePage.jsx

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const inputClasses =
  "w-full px-3 py-2 mt-1 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent " +
  "transition-colors";

const labelClasses = "block text-sm font-medium text-ink dark:text-ink-dark";

function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [nome, setNome] = useState("");
  const [reenviando, setReenviando] = useState(false);
  const [email, setEmail] = useState("");
  const [savingPerfil, setSavingPerfil] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [savingSenha, setSavingSenha] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleReenviarConfirmacao = async () => {
    setReenviando(true);
    try {
      await toast.promise(api.post("/resend-verification"), {
        loading: "Enviando...",
        success: "E-mail de confirmação reenviado!",
        error: "Não foi possível reenviar a confirmação.",
      });
    } catch (error) {
      console.error("Erro ao reenviar confirmação:", error);
    } finally {
      setReenviando(false);
    }
  };

  const handleSalvarPerfil = async (event) => {
    event.preventDefault();
    setSavingPerfil(true);
    try {
      const response = await toast.promise(api.put("/me", { nome, email }), {
        loading: "Salvando...",
        success: "Perfil atualizado com sucesso!",
        error: (err) =>
          err.response?.data?.error || "Falha ao atualizar o perfil.",
      });
      updateUser(response.data);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    } finally {
      setSavingPerfil(false);
    }
  };

  const handleTrocarSenha = async (event) => {
    event.preventDefault();

    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmacao) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setSavingSenha(true);
    try {
      await toast.promise(api.put("/me", { senhaAtual, novaSenha }), {
        loading: "Salvando...",
        success: "Senha alterada com sucesso!",
        error: (err) =>
          err.response?.data?.error || "Falha ao alterar a senha.",
      });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
    } catch (error) {
      console.error("Erro ao trocar senha:", error);
    } finally {
      setSavingSenha(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium text-ink dark:text-ink-dark">
          Meu Perfil
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">
          Gerencie seus dados e sua senha de acesso
        </p>
      </header>

      {user?.emailVerified === false && (
        <div className="flex items-center justify-between gap-4 bg-despesa-soft dark:bg-despesa-soft-dark border border-despesa/20 dark:border-despesa-dark/20 rounded-xl p-4">
          <p className="text-sm text-despesa dark:text-despesa-dark">
            Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.
          </p>
          <button
            onClick={handleReenviarConfirmacao}
            disabled={reenviando}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-paper-raised dark:text-paper-dark bg-despesa dark:bg-despesa-dark rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {reenviando ? "Enviando..." : "Reenviar"}
          </button>
        </div>
      )}

      <form
        onSubmit={handleSalvarPerfil}
        className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-6 space-y-4"
      >
        <h2 className="font-display text-lg font-medium text-ink dark:text-ink-dark">
          Dados da conta
        </h2>

        <div>
          <label className={labelClasses}>Nome completo</label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingPerfil}
            className="px-4 py-2 font-medium text-sm text-paper-raised dark:text-paper-dark bg-accent dark:bg-accent-dark rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {savingPerfil ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleTrocarSenha}
        className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-6 space-y-4"
      >
        <h2 className="font-display text-lg font-medium text-ink dark:text-ink-dark">
          Alterar senha
        </h2>

        <div>
          <label className={labelClasses}>Senha atual</label>
          <input
            type="password"
            required
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            className={inputClasses}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Nova senha</label>
            <input
              type="password"
              required
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mín. 6 caracteres"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Confirme a nova senha</label>
            <input
              type="password"
              required
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingSenha}
            className="px-4 py-2 font-medium text-sm text-paper-raised dark:text-paper-dark bg-accent dark:bg-accent-dark rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {savingSenha ? "Salvando..." : "Alterar senha"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;
