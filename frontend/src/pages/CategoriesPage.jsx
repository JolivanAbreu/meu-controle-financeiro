// frontend/src/pages/CategoriesPage.jsx

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar toast
import { FaEdit, FaTrash } from 'react-icons/fa'; // Importar ícones
import {
  getCategories,
  getSubcategories,
  createSubcategory,
  updateSubcategory, // Importar nova função
  deleteSubcategory, // Importar nova função
} from '../services/categoryService';
import Modal from '../components/Modal'; // Importar o Modal

function CategoriesPage() {
  // Estados existentes
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- NOVOS ESTADOS PARA MODAIS ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null); // Guarda a subcat sendo editada
  const [deletingSubcategory, setDeletingSubcategory] = useState(null); // Guarda a subcat a ser deletada

  // --- NOVOS ESTADOS PARA O FORMULÁRIO DE EDIÇÃO ---
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');

  // --- FUNÇÃO loadData (sem alterações) ---
  const loadData = async () => {
     try {
       setLoading(true);
       const [catRes, subcatRes] = await Promise.all([ getCategories(), getSubcategories() ]);
       setCategories(catRes.data);
       setSubcategories(subcatRes.data);
       if (catRes.data.length > 0 && !selectedCatId) { setSelectedCatId(catRes.data[0].id); }
     } catch (err) {
       console.error("Erro ao carregar dados", err);
       setError("Falha ao carregar dados. Tente novamente mais tarde.");
     } finally {
       setLoading(false);
     }
   };
  useEffect(() => { loadData(); }, [selectedCatId]); // Removido selectedCatId das dependências para evitar recarregamento constante

  // --- FUNÇÃO handleSubmit (criar - sem alterações) ---
  const handleSubmit = async (e) => { /* ... seu código handleSubmit ... */
      e.preventDefault();
      if (!newName || !selectedCatId) { setError("Preencha todos os campos."); return; }
      setFormLoading(true); setError(null);
      try {
        const response = await createSubcategory({ name: newName, categoryId: parseInt(selectedCatId, 10) });
        setSubcategories(prevSubcategories => [...prevSubcategories, response.data].sort((a, b) => a.name.localeCompare(b.name))); // Adiciona e ordena
        setNewName('');
        toast.success("Subcategoria criada!"); // Adiciona toast
      } catch (err) {
        console.error("Erro ao criar subcategoria", err);
        setError(err.response?.data?.error || "Erro ao criar subcategoria.");
        toast.error(err.response?.data?.error || "Erro ao criar."); // Adiciona toast de erro
      } finally { setFormLoading(false); }
  };

  // --- NOVAS FUNÇÕES HANDLER PARA EDITAR ---
  const handleEditClick = (subcategory) => {
    setEditingSubcategory(subcategory); // Guarda a subcategoria completa
    setEditName(subcategory.name);     // Preenche o estado do nome para o form
    setEditCategoryId(subcategory.categoryId); // Preenche o estado da categoria para o form
    setError(null); // Limpa erros antigos
    setIsEditModalOpen(true);          // Abre o modal de edição
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editName || !editCategoryId || !editingSubcategory) return;

    setFormLoading(true); // Reutiliza o estado de loading do formulário
    setError(null);

    try {
      const updatedData = await updateSubcategory(editingSubcategory.id, {
        name: editName,
        categoryId: parseInt(editCategoryId, 10),
      });

      // Atualiza a lista de subcategorias no estado local
      setSubcategories(prev =>
        prev.map(sub => (sub.id === editingSubcategory.id ? updatedData.data : sub))
          .sort((a, b) => a.name.localeCompare(b.name)) // Reordena
      );

      toast.success("Subcategoria atualizada!");
      closeEditModal(); // Fecha o modal

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
    setEditName('');
    setEditCategoryId('');
  };

  // --- NOVAS FUNÇÕES HANDLER PARA DELETAR ---
  const handleDeleteClick = (subcategory) => {
    setDeletingSubcategory(subcategory); // Guarda a subcategoria a ser deletada
    setError(null); // Limpa erros
    setIsDeleteModalOpen(true); // Abre o modal de confirmação
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSubcategory) return;

    setFormLoading(true); // Reutiliza loading
    setError(null);

    try {
      await deleteSubcategory(deletingSubcategory.id);

      // Remove a subcategoria da lista local
      setSubcategories(prev =>
        prev.filter(sub => sub.id !== deletingSubcategory.id)
      );

      toast.success("Subcategoria excluída!");
      closeDeleteModal(); // Fecha o modal

    } catch (err) {
      console.error("Erro ao excluir subcategoria", err);
      // Verifica se o erro é por causa de transações vinculadas (exemplo, pode variar)
      if (err.response?.status === 500 && err.response?.data?.error?.includes('constraint')) {
         setError("Não é possível excluir: existem transações vinculadas a esta subcategoria.");
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
  // --- FIM NOVAS FUNÇÕES ---


  if (loading) { return <div className="p-4 md:p-8">Carregando categorias...</div>; }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gerenciar Subcategorias</h1>

      {/* Formulário Criar (sem alterações) */}
      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white border rounded-lg shadow-md">
         {/* ... seu código do formulário de criação ... */}
         <h2 className="text-xl font-semibold mb-4">Criar Nova Subcategoria</h2>
        {error && !isEditModalOpen && !isDeleteModalOpen && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria Principal:</label>
            <select id="category" value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
              {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome da Nova Subcategoria:</label>
            <input type="text" id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Restaurantes" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
          </div>
          <div className="md:col-span-1 flex items-end">
            <button type="submit" disabled={formLoading} className="w-full bg-blue-600 text-white px-5 py-2 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
              {formLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>

      {/* Lista de subcategorias (MODIFICADA com botões) */}
      <div className="space-y-6">
        {categories.map(cat => {
          // Filtra subcategorias desta categoria ANTES do map
          const currentSubcategories = subcategories.filter(sub => sub.categoryId === cat.id);

          return (
            <div key={cat.id} className="p-4 bg-white border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-700">{cat.name}</h3>

              {currentSubcategories.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {currentSubcategories.map(sub => (
                    <li key={sub.id} className="flex justify-between items-center text-gray-600 border-b pb-1 last:border-b-0">
                      <span>{sub.name}</span>
                      {/* --- BOTÕES DE AÇÃO --- */}
                      <div className="space-x-3">
                        <button
                          onClick={() => handleEditClick(sub)}
                          className="text-blue-500 hover:text-blue-700"
                          aria-label={`Editar ${sub.name}`}
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(sub)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Excluir ${sub.name}`}
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      {/* --- FIM BOTÕES --- */}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 mt-2">Nenhuma subcategoria cadastrada.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* --- MODAL DE EDIÇÃO --- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Editar Subcategoria"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          {error && isEditModalOpen && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label htmlFor="editCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria Principal:
            </label>
            <select
              id="editCategory"
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Subcategoria:
            </label>
            <input
              type="text"
              id="editName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
             <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
             >
                Cancelar
             </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {formLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO --- */}
       <Modal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          title="Confirmar Exclusão"
        >
            <div className='p-4'>
                <p className="mb-6 text-gray-700">
                    Tem certeza que deseja excluir a subcategoria
                    <strong className="mx-1">{deletingSubcategory?.name}</strong>?
                    <br/>
                    <span className='text-sm text-red-600'>Atenção: Esta ação não pode ser desfeita. Verifique o comportamento esperado para transações vinculadas (excluir ou desvincular).</span>
                </p>
                {error && isDeleteModalOpen && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex justify-end gap-4">
                    <button
                        onClick={closeDeleteModal}
                        disabled={formLoading}
                        className="px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleDeleteConfirm}
                        disabled={formLoading}
                        className="px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                        {formLoading ? 'Excluindo...' : 'Excluir'}
                    </button>
                </div>
            </div>
        </Modal>

    </div> // Fim do container principal
  );
}

export default CategoriesPage;