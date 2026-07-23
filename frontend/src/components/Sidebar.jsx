// frontend/src/components/Sidebar.jsx

import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaPiggyBank,
  FaBullseye,
  FaChartBar,
  FaSignOutAlt,
  FaTimes,
  FaTag,
  FaSearch,
  FaChevronLeft,
  FaMoon,
  FaSun,
  FaCreditCard,
  FaExchangeAlt,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: FaTachometerAlt },
  { to: "/transactions", label: "Transações", icon: FaExchangeAlt },
  { to: "/budgets", label: "Orçamentos", icon: FaPiggyBank },
  { to: "/goals", label: "Metas", icon: FaBullseye },
  { to: "/cards", label: "Cartões", icon: FaCreditCard },
  { to: "/reports", label: "Relatórios", icon: FaChartBar },
  { to: "/categorias", label: "Categorias", icon: FaTag },
];

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // "Travado" = fica expandido permanentemente. Sem trava, expande só no hover.
  const [locked, setLocked] = useState(() => {
    try {
      return localStorage.getItem("sidebar:locked") === "true";
    } catch {
      return false;
    }
  });
  const [hovered, setHovered] = useState(false);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

  const expanded = locked || hovered;

  useEffect(() => {
    try {
      localStorage.setItem("sidebar:locked", String(locked));
    } catch {
      /* localStorage indisponível (modo privado etc.) — ignora */
    }
  }, [locked]);

  // Aplica a classe "dark" na raiz do documento e lembra a preferência
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    } catch {
      /* ignora */
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap overflow-hidden transition-colors ${
      isActive
        ? "bg-sidebar-active text-paper-raised"
        : "text-sidebar-text hover:bg-white/5 hover:text-paper-raised"
    }`;

  const initials = user?.nome
    ? user.nome
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const sidebarClasses = `
    w-64 h-full bg-sidebar text-sidebar-text flex flex-col fixed z-20
    transition-[transform,width] duration-300 ease-in-out transform
    md:static md:h-screen md:translate-x-0
    ${expanded ? "md:w-64" : "md:w-[88px]"}
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
  `;

  const textFade = `whitespace-nowrap transition-opacity duration-200 ${
    expanded ? "opacity-100" : "opacity-0"
  }`;

  return (
    <div
      className={sidebarClasses}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cabeçalho / marca + botão de trava */}
      <div className="relative flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded border border-white/25 font-display text-sm text-paper-raised">
            MF
          </span>
          <span className={`font-display text-base text-paper-raised ${textFade}`}>
            Meu Controle
          </span>
        </div>

        {/* Botão de trava (só no desktop) */}
        <button
          onClick={() => setLocked((v) => !v)}
          aria-label={locked ? "Destravar menu expandido" : "Travar menu expandido"}
          title={locked ? "Destravar menu" : "Travar menu expandido"}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-accent text-paper-raised items-center justify-center shadow-card hover:bg-[#25394A] transition-colors"
        >
          <FaChevronLeft
            size={10}
            className={`transition-transform duration-300 ${locked ? "" : "rotate-180"}`}
          />
        </button>

        {/* Fechar (mobile) */}
        <button
          onClick={onClose}
          aria-label="Fechar menu"
          className="md:hidden ml-auto text-sidebar-text hover:text-paper-raised"
        >
          <FaTimes />
        </button>
      </div>

      {/* Perfil do usuário */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 overflow-hidden">
        <Link
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
          title="Meu perfil"
        >
          <span className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-sidebar-active text-paper-raised text-xs font-medium">
            {initials}
          </span>
          <div className={`min-w-0 ${textFade}`}>
            <h3 className="text-sm font-medium text-paper-raised truncate">
              {user?.nome}
            </h3>
            <p className="text-xs text-sidebar-muted truncate">{user?.email}</p>
          </div>
        </Link>
        <NotificationBell />
      </div>

      {/* Busca */}
      <div className="px-3 pt-4 overflow-hidden">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5">
          <FaSearch className="text-sidebar-muted flex-shrink-0" size={13} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar..."
            className={`bg-transparent outline-none text-sm text-paper-raised placeholder:text-sidebar-muted w-full ${
              expanded ? "opacity-100" : "opacity-0 pointer-events-none"
            } transition-opacity duration-200`}
          />
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-grow px-3 py-4">
        <ul className="space-y-1">
          {filteredItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} className={navLinkClasses} onClick={onClose}>
                <Icon className="flex-shrink-0" />
                <span className={textFade}>{label}</span>
              </NavLink>
            </li>
          ))}
          {filteredItems.length === 0 && (
            <li className={`px-3 py-2 text-xs text-sidebar-muted ${textFade}`}>
              Nada encontrado.
            </li>
          )}
        </ul>
      </nav>

      {/* Modo escuro + Sair */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <button
          onClick={() => setDarkMode((v) => !v)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-sidebar-text hover:bg-white/5 hover:text-paper-raised transition-colors overflow-hidden"
        >
          {darkMode ? (
            <FaSun className="flex-shrink-0" />
          ) : (
            <FaMoon className="flex-shrink-0" />
          )}
          <span className={textFade}>
            {darkMode ? "Modo claro" : "Modo escuro"}
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-sidebar-text hover:bg-white/5 hover:text-paper-raised transition-colors overflow-hidden"
        >
          <FaSignOutAlt className="flex-shrink-0" />
          <span className={textFade}>Sair</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;