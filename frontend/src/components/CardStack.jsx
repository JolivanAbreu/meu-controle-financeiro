// frontend/src/components/CardStack.jsx

import { useState, useEffect } from "react";
import CardVisual from "./CardVisual";

const CARD_WIDTH = 240;
const CARD_HEIGHT = 150;
const OFFSET_X = 18;
const OFFSET_Y = 14;

// cards: array com o cartão físico na posição 0, seguido dos virtuais vinculados.
// O cartão "da frente" começa sendo o físico; clicar em qualquer cartão atrás
// da pilha o traz para frente, com uma transição suave (efeito carrossel).
function CardStack({ cards, titular, onHistory, onEdit, onDelete }) {
  const [frontId, setFrontId] = useState(cards[0]?.id);

  useEffect(() => {
    if (!cards.some((c) => c.id === frontId)) {
      setFrontId(cards[0]?.id);
    }
  }, [cards, frontId]);

  const frontCard = cards.find((c) => c.id === frontId) || cards[0];
  const others = cards.filter((c) => c.id !== frontCard.id);

  const containerWidth = CARD_WIDTH + others.length * OFFSET_X;
  const containerHeight = CARD_HEIGHT + others.length * OFFSET_Y;

  return (
    <div
      className="relative"
      style={{ width: containerWidth, height: containerHeight }}
    >
      {others.map((card, depth) => {
        const translateX = (depth + 1) * OFFSET_X;
        const translateY = (depth + 1) * OFFSET_Y;
        const scale = 1 - (depth + 1) * 0.05;

        return (
          <div
            key={card.id}
            onClick={() => setFrontId(card.id)}
            className="absolute top-0 left-0 cursor-pointer transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:brightness-110"
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              zIndex: 10 - depth,
            }}
            title="Clique para trazer este cartão para frente"
          >
            <CardVisual
              nome={card.nome}
              banco={card.banco}
              tipo={card.tipo}
              cor={card.cor}
              cartaoPaiNome={cards[0]?.nome}
              titular={titular}
              inativo={!card.ativo}
              isFront={false}
            />
          </div>
        );
      })}

      <div
        className="absolute top-0 left-0 transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT, zIndex: 50 }}
      >
        <CardVisual
          nome={frontCard.nome}
          banco={frontCard.banco}
          tipo={frontCard.tipo}
          cor={frontCard.cor}
          limiteDisponivel={frontCard.limiteDisponivel}
          diaVencimento={frontCard.diaVencimento}
          cartaoPaiNome={cards[0]?.nome}
          titular={titular}
          inativo={!frontCard.ativo}
          isFront
          onHistory={() => onHistory(frontCard)}
          onEdit={() => onEdit(frontCard)}
          onDelete={() => onDelete(frontCard)}
        />
      </div>
    </div>
  );
}

export default CardStack;