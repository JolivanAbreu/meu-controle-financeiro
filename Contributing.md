# Contribuindo

## Antes de começar

1. Leia o [`README.md`](../README.md) para instalação e visão geral.
2. Leia [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) — em especial a seção sobre **ciclo de fatura**, que é a parte mais fácil de mexer sem querer e quebrar sutilmente.

## Fluxo de trabalho

```bash
git checkout -b minha-mudanca
# ... faça as alterações ...
cd backend && npm test   # se mexeu em algo do backend
git commit -m "descrição clara da mudança"
git push origin minha-mudanca
```

## Convenções do projeto

- **Tokens de cor, não cores literais.** Use `bg-receita`, `text-despesa`, `bg-accent` etc. (definidos em `frontend/tailwind.config.js`) em vez de `bg-blue-600` ou `bg-red-500`. Veja [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md#1-sistema-visual-design-system).
- **Todo componente/página novo precisa de `dark:` correspondente** para cada classe de cor usada. Não existe fallback automático de contraste.
- **Migrations são aditivas sempre que possível.** Ao adicionar uma coluna, prefira `allowNull: true` e um valor padrão sensato, para não quebrar dados já existentes. Veja o padrão em `20260722113556-add-reset-password-to-users.js` (adiciona colunas sem afetar usuários já cadastrados).
- **Nunca commite um `.env` real.** Use `backend/.env.example` como referência de quais variáveis existem.
- **Rotas privadas vão depois de `routes.use(authMiddleware)`** em `backend/src/routes/routes.js`; rotas públicas (login, registro, redefinição de senha, verificação de e-mail) vêm antes.

## Testando lógica de datas/cálculos antes de aplicar

Partes do sistema com matemática de datas (como o ciclo de fatura) ou agregação de banco (como os totais por cartão) já causaram bugs sutis quando alteradas sem verificação. Antes de mexer nelas:

1. Escreva um script isolado (Node puro, sem precisar do banco rodando) cobrindo os casos-limite relevantes (troca de mês, virada de ano, dia inexistente como 31 em fevereiro).
2. Só depois aplique a mudança no controller de verdade.

## Rodando os testes

```bash
cd backend
npm run test:setup   # prepara um banco de dados isolado para teste
npm test
```

## Reportando problemas

Ao abrir uma issue, inclua:
- O que você esperava que acontecesse vs. o que aconteceu
- Se envolve cálculo de fatura/orçamento/meta: os valores de entrada relevantes (datas, dia de fechamento, valores)
- Print de tela, se for algo visual