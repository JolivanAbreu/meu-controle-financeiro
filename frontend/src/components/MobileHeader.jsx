// frontend/src/components/MobileHeader.jsx

import { FaBars } from "react-icons/fa";

function MobileHeader({ onMenuClick }) {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center md:hidden">
      <h1 className="text-xl font-bold">Meu Controle</h1>
      <button onClick={onMenuClick}>
        <FaBars size={24} />
      </button>
    </header>
  );
}

export default MobileHeader;
