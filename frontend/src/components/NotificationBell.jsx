// frontend/src/components/NotificationBell.jsx

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import api from "../services/api";
import { getCards } from "../services/cardService";
import { getGoals } from "../services/goalService";

const TONE_DOT = {
  despesa: "bg-despesa dark:bg-despesa-dark",
  accent: "bg-accent dark:bg-accent-dark",
  receita: "bg-receita dark:bg-receita-dark",
};

function diasAteVencimento(diaVencimento) {
  const hoje = new Date();
  const hojeSemHora = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate(),
  );
  const lastDayThisMonth = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    0,
  ).getDate();
  let venc = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    Math.min(diaVencimento, lastDayThisMonth),
  );
  if (venc < hojeSemHora) {
    const lastDayNextMonth = new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 2,
      0,
    ).getDate();
    venc = new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      Math.min(diaVencimento, lastDayNextMonth),
    );
  }
  return Math.round((venc - hojeSemHora) / (1000 * 60 * 60 * 24));
}

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const now = new Date();
        const mes = now.getMonth() + 1;
        const ano = now.getFullYear();

        const [budgetsRes, cardsRes, goalsRes] = await Promise.all([
          api.get("/budgets", { params: { mes, ano } }),
          getCards({ mes, ano }),
          getGoals(),
        ]);

        const items = [];

        budgetsRes.data.forEach((b) => {
          if (b.limite > 0 && b.gasto_atual / b.limite > 1) {
            items.push({
              id: `budget-${b.id}`,
              tone: "despesa",
              mensagem: `Orçamento de "${b.categoria}" ultrapassado`,
              link: "/budgets",
            });
          }
        });

        cardsRes.data
          .filter((c) => c.tipo === "fisico")
          .forEach((c) => {
            if (c.faturaAberta && c.diaVencimento) {
              const diffDias = diasAteVencimento(c.diaVencimento);
              if (diffDias >= 0 && diffDias <= 3) {
                items.push({
                  id: `card-venc-${c.id}`,
                  tone: "accent",
                  mensagem: `Fatura do ${c.nome} vence em ${
                    diffDias === 0 ? "hoje" : `${diffDias} dia(s)`
                  }`,
                  link: "/cards",
                });
              }
            }
            if (c.limiteTotal > 0 && c.limiteUtilizado / c.limiteTotal >= 0.9) {
              items.push({
                id: `card-limite-${c.id}`,
                tone: "despesa",
                mensagem: `${c.nome} está em ${(
                  (c.limiteUtilizado / c.limiteTotal) *
                  100
                ).toFixed(0)}% do limite`,
                link: "/cards",
              });
            }
          });

        goalsRes.data.forEach((g) => {
          if (parseFloat(g.valor_atual) >= parseFloat(g.valor_objetivo)) {
            items.push({
              id: `goal-${g.id}`,
              tone: "receita",
              mensagem: `Meta "${g.titulo}" concluída!`,
              link: "/goals",
            });
          }
        });

        setNotifications(items);
      } catch (error) {
        console.error("Falha ao carregar notificações:", error);
      }
    }
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        className="relative w-8 h-8 flex items-center justify-center rounded-full text-sidebar-text hover:bg-white/5 hover:text-paper-raised transition-colors"
      >
        <FaBell size={14} />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-despesa text-[9px] font-medium text-paper-raised">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full top-0 ml-2 w-72 bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark z-[60] overflow-hidden">
          <div className="px-4 py-3 border-b border-rule dark:border-rule-dark">
            <p className="text-sm font-medium text-ink dark:text-ink-dark">
              Notificações
            </p>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-soft dark:text-ink-soft-dark text-center">
              Nada precisa da sua atenção agora.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-rule dark:divide-rule-dark">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.link}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2.5 px-4 py-3 hover:bg-paper dark:hover:bg-paper-dark transition-colors"
                  >
                    <span
                      className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${TONE_DOT[n.tone]}`}
                    />
                    <span className="text-xs text-ink dark:text-ink-dark">
                      {n.mensagem}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
