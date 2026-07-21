// frontend/src/components/CardForm.jsx

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createCard, updateCard } from "../services/cardService";
import { BRAND_GRADIENTS } from "./CardVisual";
import { FaCreditCard, FaGlobe } from "react-icons/fa";

const inputClasses =
  "w-full px-3 py-2 mt-1 rounded-lg border border-rule dark:border-rule-dark " +
  "bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark " +
  "placeholder:text-ink-soft dark:placeholder:text-ink-soft-dark " +
  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent " +
  "disabled:bg-rule/40 dark:disabled:bg-rule-dark/40 disabled:text-ink-soft dark:disabled:text-ink-soft-dark " +
  "transition-colors";

const labelClasses = "block text-sm font-medium text-ink dark:text-ink-dark";

function SegmentButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? "bg-accent dark:bg-accent-dark text-paper-raised dark:text-paper-dark border-accent dark:border-accent-dark"
          : "border-rule dark:border-rule-dark text-ink-soft dark:text-ink-soft-dark hover:bg-paper dark:hover:bg-paper-dark"
      }`}
    >
      {children}
    </button>
  );
}

// Calcula o dia de fechamento a partir do dia de vencimento e do intervalo entre
// eles (ex: vencimento dia 17, fechamento 7 dias antes = dia 10). Como o sistema
// guarda só o "dia do mês" (não uma data específica), o resultado é aproximado
// para meses mais curtos — é a mesma simplificação já usada no restante do ciclo.
function calcularDiaFechamento(diaVencimento, diasAntes) {
  const vencimento = Number(diaVencimento);
  const antes = Number(diasAntes);
  if (!vencimento || !antes) return "";
  let dia = vencimento - antes;
  while (dia < 1) dia += 31;
  if (dia > 31) dia = ((dia - 1) % 31) + 1;
  return dia;
}

// cartoesFisicos: lista de cartões físicos ativos do usuário, para o select de vínculo.
// defaultTipo/defaultCartaoPaiId: usados no atalho "+ Cartão virtual" a partir de um físico específico.
function CardForm({ onSuccess, initialData, cartoesFisicos, defaultTipo, defaultCartaoPaiId }) {
  const [tipo, setTipo] = useState(defaultTipo || "fisico");
  const [nome, setNome] = useState("");
  const [banco, setBanco] = useState("");
  const [bandeira, setBandeira] = useState("");
  const [cartaoPaiId, setCartaoPaiId] = useState(defaultCartaoPaiId || "");
  const [limiteTotal, setLimiteTotal] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("");
  const [diasAntesFechamento, setDiasAntesFechamento] = useState(7);
  const [cor, setCor] = useState("#2E4A5C");
  const [corTocada, setCorTocada] = useState(false);
  const [ativo, setAtivo] = useState(true);

  const diaFechamentoCalculado = calcularDiaFechamento(diaVencimento, diasAntesFechamento);

  useEffect(() => {
    if (initialData) {
      setTipo(initialData.tipo);
      setNome(initialData.nome);
      setBanco(initialData.banco);
      setBandeira(initialData.bandeira || "");
      setCartaoPaiId(initialData.cartaoPaiId || "");
      setLimiteTotal(initialData.limiteTotal || "");
      setDiaVencimento(initialData.diaVencimento || "");
      if (initialData.diaVencimento && initialData.diaFechamento) {
        let diff = initialData.diaVencimento - initialData.diaFechamento;
        if (diff <= 0) diff += 31;
        setDiasAntesFechamento(diff);
      } else {
        setDiasAntesFechamento(7);
      }
      setCor(initialData.cor || "#2E4A5C");
      setCorTocada(true);
      setAtivo(initialData.ativo);
    } else {
      setTipo(defaultTipo || "fisico");
      setNome("");
      setBanco("");
      setBandeira("");
      setCartaoPaiId(defaultCartaoPaiId || "");
      setLimiteTotal("");
      setDiaVencimento("");
      setDiasAntesFechamento(7);
      setCor("#2E4A5C");
      setCorTocada(false);
      setAtivo(true);
    }
  }, [initialData, defaultTipo, defaultCartaoPaiId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (tipo === "virtual" && !cartaoPaiId) {
      toast.error("Selecione o cartão físico ao qual este cartão virtual pertence.");
      return;
    }
    if (tipo === "fisico" && !diaFechamentoCalculado) {
      toast.error("Informe o dia de vencimento para calcular o fechamento.");
      return;
    }

    const cardData = {
      nome,
      banco,
      bandeira: bandeira || null,
      tipo,
      cor,
      ativo,
      ...(tipo === "fisico"
        ? {
            limiteTotal: Number(limiteTotal),
            diaFechamento: Number(diaFechamentoCalculado),
            diaVencimento: Number(diaVencimento),
          }
        : {
            cartaoPaiId: Number(cartaoPaiId),
          }),
    };

    const promise = initialData
      ? updateCard(initialData.id, cardData)
      : createCard(cardData);

    try {
      const response = await toast.promise(promise, {
        loading: "Salvando...",
        success: "Cartão salvo com sucesso!",
        error: (err) => err.response?.data?.error || "Falha ao salvar o cartão.",
      });
      onSuccess(response.data);
    } catch (error) {
      console.error("Erro ao salvar cartão:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClasses}>Tipo</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <SegmentButton active={tipo === "fisico"} onClick={() => setTipo("fisico")}>
            <FaCreditCard size={12} /> Físico
          </SegmentButton>
          <SegmentButton active={tipo === "virtual"} onClick={() => setTipo("virtual")}>
            <FaGlobe size={12} /> Virtual
          </SegmentButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Nome do Cartão</label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Nubank Roxinho"
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Banco</label>
          <input
            type="text"
            required
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            placeholder="Ex: Nubank"
            className={inputClasses}
          />
        </div>
      </div>

      {tipo === "fisico" ? (
        <>
          <div>
            <label className={labelClasses}>Bandeira (Opcional)</label>
            <input
              type="text"
              value={bandeira}
              onChange={(e) => {
                const valor = e.target.value;
                setBandeira(valor);
                if (!corTocada) {
                  const sugestao = BRAND_GRADIENTS[valor.toLowerCase().trim()];
                  if (sugestao) setCor(sugestao);
                }
              }}
              placeholder="Ex: Mastercard"
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses}>Limite Total</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft dark:text-ink-soft-dark font-mono text-sm pointer-events-none">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={limiteTotal}
                onChange={(e) => setLimiteTotal(e.target.value)}
                placeholder="0,00"
                className={`${inputClasses} mt-0 pl-9 font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Dia de Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
                className={`${inputClasses} font-mono`}
              />
            </div>
            <div>
              <label className={labelClasses}>Dias até o Fechamento</label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={diasAntesFechamento}
                onChange={(e) => setDiasAntesFechamento(e.target.value)}
                className={`${inputClasses} font-mono`}
              />
            </div>
          </div>

          <p className="text-xs text-ink-soft dark:text-ink-soft-dark -mt-2">
            Fechamento calculado automaticamente:{" "}
            <span className="font-mono font-medium text-ink dark:text-ink-dark">
              {diaFechamentoCalculado ? `dia ${diaFechamentoCalculado}` : "—"}
            </span>
          </p>
        </>
      ) : (
        <div className="rounded-lg border border-rule dark:border-rule-dark p-4 space-y-1">
          <label className={labelClasses}>Cartão Físico Vinculado</label>
          <select
            value={cartaoPaiId}
            onChange={(e) => setCartaoPaiId(e.target.value)}
            disabled={!!initialData}
            required
            className={inputClasses}
          >
            <option value="">Selecione o cartão físico</option>
            {(cartoesFisicos || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink-soft dark:text-ink-soft-dark pt-1">
            Este cartão virtual vai compartilhar o limite, fechamento e vencimento do cartão físico selecionado.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className={labelClasses}>Cor</label>
        <input
          type="color"
          value={cor}
          onChange={(e) => {
            setCor(e.target.value);
            setCorTocada(true);
          }}
          className="h-9 w-14 rounded-lg border border-rule dark:border-rule-dark bg-paper dark:bg-paper-dark cursor-pointer"
        />
      </div>

      {initialData && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-4 w-4 accent-accent border-rule dark:border-rule-dark rounded"
          />
          <span className="text-sm text-ink dark:text-ink-dark">Cartão ativo</span>
        </label>
      )}

      <button
        type="submit"
        className="w-full px-4 py-2.5 font-medium text-sm text-paper-raised dark:text-paper-dark bg-accent dark:bg-accent-dark rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {initialData ? "Atualizar Cartão" : "Salvar Cartão"}
      </button>
    </form>
  );
}

export default CardForm;