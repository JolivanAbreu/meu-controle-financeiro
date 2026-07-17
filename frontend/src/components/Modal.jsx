// frontend/src/components/Modal.jsx

import { FaTimes } from "react-icons/fa";

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-ink/50 dark:bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="relative bg-paper-raised dark:bg-paper-raised-dark rounded-xl shadow-card dark:shadow-card-dark border border-rule dark:border-rule-dark z-10 w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-4 border-b border-rule dark:border-rule-dark">
          <h3 className="font-display text-lg font-medium text-ink dark:text-ink-dark">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-ink-soft dark:text-ink-soft-dark hover:text-ink dark:hover:text-ink-dark transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default Modal;