// frontend/src/pages/CategoriesPage.jsx

import React, { useState, useEffect } from 'react';
import { getCategories, getSubcategories, createSubcategory } from '../services/categoryService';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hook para carregar dados iniciais
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catRes, subcatRes] = await Promise.all([
          getCategories(),
          getSubcategories(),
        ]);
        
        setCategories(catRes.data);
        setSubcategories(subcatRes.data);
        
        // Define o primeiro item do select por padrão
        if (catRes.data.length > 0) {
          setSelectedCatId(catRes.data[0].id);
        }
      } catch (err) {
        console.error("Erro ao carregar dados", err);
        setError("Falha ao carregar dados. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handler para submissão do formulário
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
        categoryId: parseInt(selectedCatId, 10) 
      });
      
      // Adiciona a nova subcategoria à lista local para reatividade
      setSubcategories(prevSubcategories => [...prevSubcategories, response.data]);
      setNewName('');
      
    } catch (err) {
      console.error("Erro ao criar subcategoria", err);
      setError(err.response?.data?.error || "Erro ao criar subcategoria.");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 md:p-8">Carregando categorias...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8"> 
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gerenciar Subcategorias</h1>
      
      {/* Formulário para criar nova subcategoria */}
      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white border rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Criar Nova Subcategoria</h2>
        
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select da Categoria Principal */}
          <div className="md:col-span-1">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria Principal:
            </label>
            <select 
              id="category"
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          {/* Input do Nome */}
          <div className="md:col-span-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Nova Subcategoria:
            </label>
            <input 
              type="text"
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Restaurantes, Supermercado, Uber"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botão de Submissão */}
          <div className="md:col-span-1 flex items-end">
            <button 
              type="submit" 
              disabled={formLoading}
              className="w-full bg-blue-600 text-white px-5 py-2 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
            >
              {formLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>

      {/* Lista de subcategorias existentes agrupadas */}
      <div className="space-y-6">
        {categories.map(cat => (
          <div key={cat.id} className="p-4 bg-white border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-gray-700">{cat.name}</h3>
            
            <ul className="list-disc pl-6 mt-2 space-y-1">
              {subcategories
                .filter(sub => sub.categoryId === cat.id)
                .map(sub => (
                  <li key={sub.id} className="text-gray-600">
                    {sub.name}
                    {}
                  </li>
                ))}
            </ul>
            
            {/* Mensagem se não houver subcategorias */}
            {subcategories.filter(sub => sub.categoryId === cat.id).length === 0 && (
              <p className="text-sm text-gray-400 pl-6 mt-2">Nenhuma subcategoria cadastrada.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoriesPage;