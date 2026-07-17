// frontend/src/components/TransactionForm.jsx

import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { getCategories, getSubcategories } from "../services/categoryService";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

const inputClasses =
  "w-full px-3 py-2 mt-1 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent " +
  "disabled:bg-rule/40 dark:disabled:bg-rule-dark/40 disabled:text-ink-soft dark:disabled:text-ink-soft-dark " +
  "transition-colors";

const labelClasses = "block text-sm font-medium text-ink dark:text-ink-dark";

// Botão de um seletor segmentado (usado para Tipo e Recorrência)
function SegmentButton({ active, activeClasses, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? activeClasses
          : "border-rule dark:border-rule-dark text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark"
      }`}
    >
      {children}
    </button>
  );
}

function TransactionForm({ onSuccess, initialData }) {
  const [tipo, setTipo] = useState("despesa");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [descricao, setDescricao] = useState("");
  const [recurrence, setRecurrence] = useState("variável");
  const [installments, setInstallments] = useState(12);
  const [allCategories, setAllCategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryData() {
      try {
        const [catRes, subcatRes] = await Promise.all([
          getCategories(),
          getSubcategories(),
        ]);
        setAllCategories(catRes.data);
        setAllSubcategories(subcatRes.data);
      } catch (error) {
        console.error("Falha ao carregar dados de categoria", error);
        toast.error("Não foi possível carregar as categorias.");
      } finally {
        setDataLoading(false);
      }
    }
    loadCategoryData();
  }, []);

  useEffect(() => {
    if (!dataLoading && initialData) {
      const { tipo, valor, data, descricao, recurrence, subcategory } = initialData;

      setTipo(tipo);
      setValor(valor);
      setData(new Date(data).toISOString().split("T")[0]);
      setDescricao(descricao || "");
      setRecurrence(recurrence || "variável");

      if (subcategory) {
        const parentCategoryId = subcategory.category_id;

        setSelectedCategory(parentCategoryId);

        const relevantSubcategories = allSubcategories.filter(
          (sc) => sc.categoryId === parentCategoryId
        );
        setFilteredSubcategories(relevantSubcategories);

        setSelectedSubcategory(subcategory.id);
      }
    } else if (!initialData) {
      setTipo("despesa");
      setValor("");
      setData(new Date().toISOString().split("T")[0]);
      setDescricao("");
      setRecurrence("variável");
      setInstallments(12);
      setSelectedCategory("");
      setSelectedSubcategory("");
      setFilteredSubcategories([]);
    }
  }, [initialData, dataLoading, allSubcategories]);

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedSubcategory("");

    if (categoryId) {
      const filtered = allSubcategories.filter(
        (sub) => sub.categoryId === parseInt(categoryId)
      );
      setFilteredSubcategories(filtered);
    } else {
      setFilteredSubcategories([]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedSubcategory) {
      toast.error("Por favor, selecione uma categoria e subcategoria.");
      return;
    }

    const transactionData = {
      tipo,
      valor: Number(valor),
      data,
      descricao,
      subcategoryId: parseInt(selectedSubcategory),
    };

    if (!initialData) {
      transactionData.recurrence = recurrence;
      if (recurrence === "fixo") {
        const numInstallments = parseInt(installments, 10);
        if (!numInstallments || numInstallments <= 0) {
          toast.error("Informe uma quantidade válida de meses (pelo menos 1).");
          return;
        }
        transactionData.installments = numInstallments;
      }
    }

    const promise = initialData
      ? api.put(`/transactions/${initialData.id}`, transactionData)
      : api.post("/transactions", transactionData);

    try {
      const response = await toast.promise(promise, {
        loading: "Salvando...",
        success: "Transação salva com sucesso!",
        error: (err) => err.response?.data?.error || "Falha ao salvar a transação.",
      });
      onSuccess(response.data);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo + Valor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Tipo</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <SegmentButton
              active={tipo === "despesa"}
              activeClasses="bg-despesa dark:bg-despesa-dark text-paper-raised dark:text-paper-dark border-despesa dark:border-despesa-dark"
              onClick={() => setTipo("despesa")}
            >
              <FaArrowDown size={11} /> Despesa
            </SegmentButton>
            <SegmentButton
              active={tipo === "receita"}
              activeClasses="bg-receita dark:bg-receita-dark text-paper-raised dark:text-paper-dark border-receita dark:border-receita-dark"
              onClick={() => setTipo("receita")}
            >
              <FaArrowUp size={11} /> Receita
            </SegmentButton>
          </div>
        </div>
        <div>
          <label className={labelClasses}>Valor</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-ink-soft-dark font-mono text-sm pointer-events-none">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className={`${inputClasses} mt-0 pl-9 font-mono text-base font-medium`}
            />
          </div>
        </div>
      </div>

      {/* Categoria / Subcategoria agrupadas */}
      <div className="rounded-lg border border-rule dark:border-rule-dark p-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft dark:text-ink-soft-dark">
          Classificação
        </p>
        <div>
          <label className={labelClasses}>Categoria</label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            disabled={dataLoading}
            required
            className={inputClasses}
          >
            <option value="">
              {dataLoading ? "Carregando..." : "Selecione uma categoria"}
            </option>
            {allCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>Subcategoria</label>
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            disabled={!selectedCategory || filteredSubcategories.length === 0}
            required
            className={inputClasses}
          >
            <option value="">
              {selectedCategory ? "Selecione uma subcategoria" : "Escolha uma categoria"}
            </option>
            {filteredSubcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
          {selectedCategory && filteredSubcategories.length === 0 && (
            <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-1">
              Nenhuma subcategoria. Adicione uma na página "Gerenciar Categorias".
            </p>
          )}
        </div>
      </div>

      {/* Descrição (Opcional) */}
      <div>
        <label className={labelClasses}>Descrição (Opcional)</label>
        <input
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Compras do mês"
          className={inputClasses}
        />
      </div>

      {/* Data */}
      <div>
        <label className={labelClasses}>
          {recurrence === "fixo" ? "Data do Primeiro Vencimento" : "Data"}
        </label>
        <input
          type="date"
          required
          value={data}
          onChange={(e) => setData(e.target.value)}
          className={`${inputClasses} font-mono`}
        />
      </div>

      {/* Recorrência */}
      {!initialData && (
        <>
          <div>
            <label className={labelClasses}>Recorrência</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <SegmentButton
                active={recurrence === "variável"}
                activeClasses="bg-accent dark:bg-accent-dark text-paper-raised dark:text-paper-dark border-accent dark:border-accent-dark"
                onClick={() => setRecurrence("variável")}
              >
                Variável (Única)
              </SegmentButton>
              <SegmentButton
                active={recurrence === "fixo"}
                activeClasses="bg-accent dark:bg-accent-dark text-paper-raised dark:text-paper-dark border-accent dark:border-accent-dark"
                onClick={() => setRecurrence("fixo")}
              >
                Fixo (Recorrente)
              </SegmentButton>
            </div>
          </div>
          {recurrence === "fixo" && (
            <div>
              <label htmlFor="installments" className={labelClasses}>
                Quantidade de Meses
              </label>
              <input
                type="number"
                id="installments"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className={`${inputClasses} font-mono`}
                required={recurrence === "fixo"}
                min="1"
                max="120"
              />
              <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-1">
                A transação será replicada por {installments || 0} meses.
              </p>
            </div>
          )}
        </>
      )}

      {/* Botão de Submit */}
      <button
        type="submit"
        className="w-full px-4 py-2.5 font-medium text-sm text-paper-raised dark:text-paper-dark bg-accent dark:bg-accent-dark rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {initialData ? "Atualizar Transação" : "Salvar Transação"}
      </button>
    </form>
  );
}

export default TransactionForm;