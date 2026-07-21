// frontend/src/components/ConfirmModal.jsx

import Modal from "./Modal";

function ConfirmModal({ isOpen, title, message, confirmLabel = "Confirmar", danger = true, onConfirm, onCancel }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="text-sm text-ink dark:text-ink-dark mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium border border-rule dark:border-rule-dark text-ink dark:text-ink-dark rounded-lg hover:bg-paper dark:hover:bg-paper-dark transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-medium rounded-lg text-paper-raised dark:text-paper-dark hover:opacity-90 transition-opacity ${
            danger ? "bg-despesa dark:bg-despesa-dark" : "bg-accent dark:bg-accent-dark"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;