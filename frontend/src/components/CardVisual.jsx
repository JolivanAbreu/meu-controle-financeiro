// frontend/src/components/CardVisual.jsx

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0,
  );
  
export const BRAND_GRADIENTS = {
  visa: "#0c1f73",
  mastercard: "#2c3e50",
  "master card": "#2c3e50",
  amex: "#16463c",
  "american express": "#16463c",
  elo: "#3a3a3a",
  hipercard: "#7a0d0d",
  hiper: "#7a0d0d",
  diners: "#242424",
};

function getTexture(cor) {
  const base = cor || "#2E4A5C";
  return { background: `linear-gradient(135deg, ${base} 0%, #12181F 100%)` };
}

function CardVisual({
  nome,
  banco,
  tipo,
  cor,
  limiteDisponivel,
  diaVencimento,
  cartaoPaiNome,
  titular,
  inativo,
  isFront = true,
  onHistory,
  onEdit,
  onDelete,
}) {
  return (
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden shadow-lg p-4 flex flex-col justify-between text-paper-raised select-none transition-all ${
        inativo ? "grayscale opacity-60" : ""
      }`}
      style={getTexture(cor)}
    >
      <div className="relative flex items-start justify-between">
        <div className="w-9 h-7 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 flex items-center justify-center">
          <div className="w-6 h-4 rounded-sm border border-yellow-700/40" />
        </div>

        {isFront && (onHistory || onEdit || onDelete) && (
          <div className="flex gap-1">
            {onHistory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onHistory();
                }}
                aria-label="Ver histórico"
                title="Ver histórico mensal"
                className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/35 transition-colors"
              >
                <span className="text-[10px]">📊</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                aria-label="Editar cartão"
                className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/35 transition-colors"
              >
                <span className="text-[10px]">✎</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                aria-label="Excluir cartão"
                className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/35 transition-colors"
              >
                <span className="text-[10px]">🗑</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <p
          className="font-mono text-lg tracking-[0.15em]"
          style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.5)" }}
        >
          •••• •••• •••• ••••
        </p>
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <div className="min-w-0" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.45)" }}>
          <p className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5 truncate">
            {titular || nome}
          </p>
          <p className="text-xs opacity-90 truncate">
            {banco}
            {tipo === "virtual" ? " · Virtual" : ""}
          </p>
        </div>
        <div
          className="text-right flex-shrink-0 font-mono text-xs"
          style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.45)" }}
        >
          {tipo === "virtual" ? (
            <>
              <p className="text-[9px] uppercase tracking-wide opacity-60">Vinculado</p>
              <p className="font-medium truncate max-w-[110px]">{cartaoPaiNome}</p>
            </>
          ) : (
            <>
              <p className="text-[9px] uppercase tracking-wide opacity-60">Vence dia</p>
              <p className="font-medium">{diaVencimento}</p>
            </>
          )}
        </div>
      </div>

      {tipo !== "virtual" && (
        <p
          className="relative font-mono text-[11px] opacity-80"
          style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.45)" }}
        >
          Disponível: {formatCurrency(limiteDisponivel)}
        </p>
      )}
    </div>
  );
}

export default CardVisual;