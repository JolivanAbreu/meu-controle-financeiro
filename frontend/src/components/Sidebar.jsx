// frontend/src/components/Sidebar.jsx

import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaPiggyBank,
  FaBullseye,
  FaChartBar,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center p-3 rounded-lg hover:bg-gray-700 ${
      isActive ? "bg-gray-700" : ""
    }`;

  const sidebarClasses = `
    w-64 h-full bg-gray-800 text-white flex flex-col fixed z-20 transition-transform transform
    md:static md:h-screen md:translate-x-0
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
  `;

  return (
    <div className={sidebarClasses}>
      <div className="flex justify-between items-center p-5 text-2xl font-bold border-b border-gray-700">
        Meu Controle
        {}
        <button onClick={onClose} className="md:hidden">
          <FaTimes />
        </button>
      </div>
      {}
      <div className="p-5">
        <h3 className="text-lg font-semibold">{user?.nome}</h3>
        <p className="text-sm text-gray-400">{user?.email}</p>
      </div>
      <nav className="flex-grow">
        <ul>
          <li className="p-1">
            <NavLink
              to="/dashboard"
              className={navLinkClasses}
              onClick={onClose}
            >
              <FaTachometerAlt className="mr-3" />
              Dashboard
            </NavLink>
          </li>
          <li className="p-1">
            <NavLink to="/budgets" className={navLinkClasses} onClick={onClose}>
              <FaPiggyBank className="mr-3" />
              Orçamentos
            </NavLink>
          </li>
          <li className="p-1">
            <NavLink to="/goals" className={navLinkClasses} onClick={onClose}>
              <FaBullseye className="mr-3" />
              Metas
            </NavLink>
          </li>
          <li className="p-1">
            <NavLink to="/reports" className={navLinkClasses} onClick={onClose}>
              <FaChartBar className="mr-3" />
              Relatórios
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="p-5 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-lg hover:bg-gray-700"
        >
          <FaSignOutAlt className="mr-3" />
          Sair
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
