# Arquitetura

Este documento explica o **porquê** por trás das partes do sistema que não são óbvias só de olhar o código — principalmente as que já geraram dúvida durante o desenvolvimento.

## Sumário

1. [Sistema visual (design system)](#1-sistema-visual-design-system)
2. [Ciclo de fatura dos cartões](#2-ciclo-de-fatura-dos-cartões)
3. [Cartões físicos e virtuais (limite compartilhado)](#3-cartões-físicos-e-virtuais-limite-compartilhado)
4. [Orçamentos e categorias](#4-orçamentos-e-categorias)
5. [Metas: cálculo de status](#5-metas-cálculo-de-status)
6. [Segurança de tokens (e-mail e senha)](#6-segurança-de-tokens-e-mail-e-senha)
7. [Modo escuro](#7-modo-escuro)

---

## 1. Sistema visual (design system)

O frontend usa uma paleta de tokens definida em `frontend/tailwind.config.js`, não cores soltas do Tailwind (`blue-600`, `red-500` etc.). Isso existe pra manter o significado das cores consistente em todo o sistema:

| Token | Uso |
|---|---|
| `receita` | Valores positivos, botões de criar/salvar um novo registro |
| `despesa` | Valores negativos, ações destrutivas (excluir), alertas |
| `accent` | Ações neutras/secundárias, links, seleção de itens |
| `paper` / `paper-raised` / `ink` / `rule` | Fundo, cartões, texto e bordas — com variante `-dark` para modo escuro |

Ao adicionar uma tela nova, use esses tokens em vez de cores literais — assim ela já nasce consistente com o resto do sistema, e trocar a paleta inteira (como já fizemos, de uma paleta pra outra, e a fonte de Fraunces/IBM Plex Sans para Oswald) vira uma mudança em um arquivo só (`tailwind.config.js` + `index.css`), não uma caça a cada componente.

## 2. Ciclo de fatura dos cartões

Este é o ponto mais fácil de entender errado do sistema inteiro, então merece atenção.

**Uma transação não pertence ao mês em que foi lançada — ela pertence ao ciclo de fatura em que foi lançada.** Um ciclo vai do dia seguinte ao fechamento anterior até o dia de fechamento atual (inclusive). Isso é exatamente como cartão de crédito real funciona: uma compra feita depois do fechamento do mês corrente cai na fatura seguinte, mesmo que a data "pareça" ainda ser daquele mês.

```
Fechamento dia 10:
Ciclo A: 11/06 → 10/07  (fecha 10/07, vence 17/07 — "fatura de julho")
Ciclo B: 11/07 → 10/08  (fecha 10/08, vence 17/08 — "fatura de agosto")

Uma compra em 23/07 está DEPOIS do fechamento de 10/07 → entra no Ciclo B ("fatura de agosto")
```

O rótulo do ciclo (ex: "Jul/26") é sempre o **mês de fechamento**, não o mês da compra.

### Onde essa lógica mora

Em `backend/src/controllers/CardController.js`, as funções `getCurrentCycle`, `getCycleForClosingMonth` e `getPastCycles` calculam esses intervalos. Elas tratam dois casos-limite importantes:

- **Fechamento em dia inexistente no mês** (ex: dia 31 em fevereiro) — usa `safeDate()`, que limita o dia ao último dia real do mês.
- **Virada de ano** (dezembro → janeiro) — resolvido naturalmente pelo `Date` do JavaScript, que aceita mês `-1` e already rola pro ano anterior.

Essas duas funções foram validadas manualmente contra casos de teste antes de entrar em produção (não há teste automatizado ainda — ver [`README.md`](../README.md#10-limitações-conhecidas--próximos-passos)).

### Dia de fechamento é calculado, não digitado

No formulário de cartão (`CardForm.jsx`), o usuário informa o **dia de vencimento** e **quantos dias antes disso a fatura fecha** (padrão: 7, ajustável por cartão, já que cada banco usa um intervalo diferente). O dia de fechamento é derivado dessa conta e enviado já calculado pra API — o campo em si (`diaFechamento`) sempre existe no banco, só não é digitado diretamente pelo usuário.

## 3. Cartões físicos e virtuais (limite compartilhado)

Modelagem via **auto-relacionamento** na própria tabela `cards`:

```
Card
├── tipo: 'fisico' | 'virtual'
├── cartaoPaiId → aponta para outro Card (sempre NULL se físico)
├── limiteTotal, diaFechamento, diaVencimento → sempre NULL se virtual
```

Cartões virtuais **herdam** esses três campos do físico em tempo de consulta (nunca duplicados no banco) — é assim que garantimos que editar o limite do físico automaticamente reflete em todos os virtuais, sem precisar sincronizar nada manualmente.

Ao listar cartões (`GET /cards`), cada cartão recebe:
- `limiteUtilizado` / `limiteDisponivel`: somados entre **físico + todos os virtuais** do grupo, dentro do ciclo de fatura.
- `proximaFatura`: só a fatia daquele cartão específico dentro do ciclo (subconjunto do valor acima).
- `totalGasto`: histórico completo (todo o tempo), só daquele cartão específico.

## 4. Orçamentos e categorias

Orçamentos guardam `categoryId` (referência real à tabela `categories`) — o campo `categoria` (texto) que também existe é só um espelho pra exibição, sempre preenchido a partir do nome real da categoria, nunca digitado livremente. Isso evita o problema clássico de "orçamento não bate porque o texto tem um espaço a mais" — o cálculo de gasto usa o ID, não o texto.

Categorias em si são **fixas** (seedadas no banco, não criáveis/editáveis pelo usuário) — só a cor (`cor`) é personalizável, e essa cor é usada no gráfico de despesas do Dashboard (com fallback pra uma paleta padrão se a categoria não tiver cor definida).

## 5. Metas: cálculo de status

O status de uma meta (`pending`, `on_track`, `behind`, `overdue`, `completed`) é sempre **calculado na hora**, nunca armazenado — em `backend/src/controllers/GoalController.js`, função `withCalculatedFields`. A lógica compara o percentual de tempo decorrido (desde a criação da meta até o prazo) com o percentual do valor já alcançado: se você já economizou proporcionalmente mais do que o tempo que passou, está `on_track`; senão, `behind`.

## 6. Segurança de tokens (e-mail e senha)

Tanto a confirmação de e-mail quanto a redefinição de senha usam o mesmo padrão:

1. Gera um token aleatório (`crypto.randomBytes(32)`)
2. Salva no banco só o **hash SHA-256** do token, nunca o token em texto puro
3. Envia o token original (não o hash) por e-mail
4. Ao confirmar, compara o hash do token recebido com o hash salvo

Isso significa que mesmo se o banco de dados vazar, ninguém consegue usar os tokens salvos diretamente — precisaria do valor original, que só existe no e-mail da pessoa.

Se as variáveis `MAIL_*` não estiverem configuradas, o sistema **não falha**: ele só imprime o link no console do backend em vez de enviar por e-mail. Isso vale tanto pra confirmação de e-mail quanto pra redefinição de senha, e é intencional — pensado pra não travar o desenvolvimento local sem SMTP configurado.

## 7. Modo escuro

Implementado via `darkMode: "class"` no Tailwind — o `Sidebar.jsx` alterna a classe `dark` no elemento `<html>` e persiste a preferência em `localStorage`. Cada token de cor do design system tem uma variante `-dark` explícita no `tailwind.config.js` (ex: `paper` / `paper-dark`), então qualquer tela nova só precisa adicionar a classe `dark:` correspondente — não existe detecção automática de contraste.