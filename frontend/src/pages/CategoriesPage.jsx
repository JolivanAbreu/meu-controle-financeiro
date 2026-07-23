// frontend/src/pages/CategoriesPage.jsx

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";
import {
  getCategories,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  updateCategory,
} from "../services/categoryService";
import Modal from "../components/Modal";

const inputClasses =
  "w-full px-3 py-2 mt-1 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent " +
  "disabled:bg-rule/40 dark:disabled:bg-rule-dark/40 disabled:text-ink-soft dark:disabled:text-ink-soft-dark " +
  "transition-colors";

const labelClasses =
  "block text-sm font-medium text-ink dark:text-ink-dark mb-1";

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados dos modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [deletingSubcategory, setDeletingSubcategory] = useState(null);

  // Estados do formulário de edição
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, subcatRes] = await Promise.all([
        getCategories(),
        getSubcategories(),
      ]);
      setCategories(catRes.data);
      setSubcategories(subcatRes.data);
      if (catRes.data.length > 0 && !selectedCatId) {
        setSelectedCatId(catRes.data[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar dados", err);
      setError("Falha ao carregar dados. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [selectedCatId]); 

  // --- Troca a cor de uma categoria (usada nos gráficos) ---
  const handleCorChange = async (category, cor) => {
    // Atualização otimista: reflete na tela antes da resposta do servidor.
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, cor } : c)),
    );
    try {
      await updateCategory(category.id, { cor });
    } catch (err) {
      console.error("Erro ao atualizar cor da categoria:", err);
      toast.error("Não foi possível salvar a cor.");
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, cor: category.cor } : c,
        ),
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName || !selectedCatId) {
      setError("Preencha todos os campos.");
      return;
    }
    setFormLoading(true);
    setError(null);
    try {
      const response = await createSubcategory({
        name: newName,
        categoryId: parseInt(selectedCatId, 10),
      });
      setSubcategories((prevSubcategories) =>
        [...prevSubcategories, response.data].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setNewName("");
      toast.success("Subcategoria criada!");
    } catch (err) {
      console.error("Erro ao criar subcategoria", err);
      setError(err.response?.data?.error || "Erro ao criar subcategoria.");
      toast.error(err.response?.data?.error || "Erro ao criar.");
    } finally {
      setFormLoading(false);
    }
  };

  // Handlers de edição
  const handleEditClick = (subcategory) => {
    setEditingSubcategory(subcategory);
    setEditName(subcategory.name);
    setEditCategoryId(subcategory.categoryId);
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editName || !editCategoryId || !editingSubcategory) return;

    setFormLoading(true);
    setError(null);

    try {
      const updatedData = await updateSubcategory(editingSubcategory.id, {
        name: editName,
        categoryId: parseInt(editCategoryId, 10),
      });

      // Atualiza a lista de subcategorias no estado local
      setSubcategories(
        (prev) =>
          prev
            .map((sub) =>
              sub.id === editingSubcategory.id ? updatedData.data : sub,
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
      );

      toast.success("Subcategoria atualizada!");
      closeEditModal();
    } catch (err) {
      console.error("Erro ao atualizar subcategoria", err);
      setError(err.response?.data?.error || "Erro ao atualizar subcategoria.");
      toast.error(err.response?.data?.error || "Erro ao atualizar.");
    } finally {
      setFormLoading(false);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSubcategory(null);
    setEditName("");
    setEditCategoryId("");
  };

  // Handlers de exclusão
  const handleDeleteClick = (subcategory) => {
    setDeletingSubcategory(subcategory);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSubcategory) return;

    setFormLoading(true);
    setError(null);

    try {
      await deleteSubcategory(deletingSubcategory.id);

      // Remove a subcategoria da lista local
      setSubcategories((prev) =>
        prev.filter((sub) => sub.id !== deletingSubcategory.id),
      );

      toast.success("Subcategoria excluída!");
      closeDeleteModal(); // Fecha o modal
    } catch (err) {
      console.error("Erro ao excluir subcategoria", err);
      // Verifica se o erro é por causa de transações vinculadas (exemplo, pode variar)
      if (
        err.response?.status === 500 &&
        err.response?.data?.error?.includes("constraint")
      ) {
        setError(
          "Não é possível excluir: existem transações vinculadas a esta subcategoria.",
        );
        toast.error("Não é possível excluir: existem transações vinculadas.");
      } else {
        setError(err.response?.data?.error || "Erro ao excluir subcategoria.");
        toast.error(err.response?.data?.error || "Erro ao excluir.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingSubcategory(null);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 text-ink-soft dark:text-ink-soft-dark">
        Carregando categorias...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-medium text-ink dark:text-ink-dark">
          Gerenciar Subcategorias
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-1">
          Organize as subcategorias usadas nos seus lançamentos
        </p>
      </header>

      {/* Formulário de criação */}
      <form
        onSubmit={handleSubmit}
        className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-6"
      >
        <h2 className="font-display text-lg font-medium text-ink dark:text-ink-dark mb-4">
          Criar Nova Subcategoria
        </h2>
        {error && !isEditModalOpen && !isDeleteModalOpen && (
          <p className="text-despesa dark:text-despesa-dark mb-4 text-sm">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="category" className={labelClasses}>
              Categoria Principal:
            </label>
            <select
              id="category"
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className={inputClasses}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label htmlFor="name" className={labelClasses}>
              Nome da Nova Subcategoria:
            </label>
            <input
              type="text"
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Restaurantes"
              className={inputClasses}
            />
          </div>
          <div className="md:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={formLoading}
              className="w-full mt-1 bg-accent dark:bg-accent-dark text-paper-raised dark:text-paper-dark px-5 py-2 rounded-lg font-medium text-sm shadow-card dark:shadow-card-dark hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {formLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </form>

      {/* Lista de categorias e subcategorias */}
      <div className="space-y-4">
        {categories.map((cat) => {
          // Filtra subcategorias desta categoria ANTES do map
          const currentSubcategories = subcategories.filter(
            (sub) => sub.categoryId === cat.id,
          );

          return (
            <div
              key={cat.id}
              className="bg-paper-raised dark:bg-paper-raised-dark border border-rule dark:border-rule-dark rounded-xl shadow-card dark:shadow-card-dark p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-medium text-ink dark:text-ink-dark">
                  {cat.name}
                </h3>
                <input
                  type="color"
                  value={cat.cor || "#2E4A5C"}
                  onChange={(e) => handleCorChange(cat, e.target.value)}
                  title="Cor usada nos gráficos"
                  className="h-7 w-10 rounded-lg border border-rule dark:border-rule-dark bg-paper dark:bg-paper-dark cursor-pointer"
                />
              </div>

              {currentSubcategories.length > 0 ? (
                <ul className="mt-2 divide-y divide-rule dark:divide-rule-dark">
                  {currentSubcategories.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex justify-between items-center py-2.5 text-sm text-ink dark:text-ink-dark"
                    >
                      <span>{sub.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditClick(sub)}
                          className="p-2 text-ink-soft dark:text-ink-soft-dark hover:text-accent dark:hover:text-accent-dark hover:bg-accent-soft dark:hover:bg-accent-soft-dark rounded-full transition-colors"
                          aria-label={`Editar ${sub.name}`}
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(sub)}
                          className="p-2 text-ink-soft dark:text-ink-soft-dark hover:text-despesa dark:hover:text-despesa-dark hover:bg-despesa-soft dark:hover:bg-despesa-soft-dark rounded-full transition-colors"
                          aria-label={`Excluir ${sub.name}`}
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft dark:text-ink-soft-dark mt-2">
                  Nenhuma subcategoria cadastrada.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de edição */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Editar Subcategoria"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          {error && isEditModalOpen && (
            <p className="text-despesa dark:text-despesa-dark text-sm">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="editCategory" className={labelClasses}>
              Categoria Principal:
            </label>
            <select
              id="editCategory"
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              className={inputClasses}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="editName" className={labelClasses}>
              Nome da Subcategoria:
            </label>
            <input
              type="text"
              id="editName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className={inputClasses}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeEditModal}
              className="px-4 py-2 text-sm font-medium border border-rule dark:border-rule-dark text-ink dark:text-ink-dark rounded-lg hover:bg-paper dark:hover:bg-paper-dark transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 text-sm font-medium bg-accent dark:bg-accent-dark text-paper-raised dark:text-paper-dark rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {formLoading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão"
      >
        <div>
          <p className="mb-6 text-sm text-ink dark:text-ink-dark">
            Tem certeza que deseja excluir a subcategoria
            <strong className="mx-1">{deletingSubcategory?.name}</strong>?
            <br />
            <span className="text-xs text-despesa dark:text-despesa-dark">
              Atenção: Esta ação não pode ser desfeita. Verifique o
              comportamento esperado para transações vinculadas (excluir ou
              desvincular).
            </span>
          </p>
          {error && isDeleteModalOpen && (
            <p className="text-despesa dark:text-despesa-dark text-sm mb-4">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={closeDeleteModal}
              disabled={formLoading}
              className="px-4 py-2 text-sm font-medium border border-rule dark:border-rule-dark text-ink dark:text-ink-dark rounded-lg hover:bg-paper dark:hover:bg-paper-dark transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={formLoading}
              className="px-4 py-2 text-sm font-medium bg-despesa dark:bg-despesa-dark text-paper-raised dark:text-paper-dark rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {formLoading ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CategoriesPage;
