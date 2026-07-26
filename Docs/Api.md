# Referência da API

Base URL: `http://localhost:3333/api` (ajuste a porta conforme seu `.env`).

Todas as rotas privadas exigem o header:

```
Authorization: Bearer <token>
```

O token é obtido em `POST /login` e expira em 7 dias.

---

## Autenticação e conta

### `POST /register`
Cria uma conta e envia um e-mail de confirmação (não bloqueia o cadastro nem o login se o e-mail não for confirmado).

```json
// Body
{ "nome": "Maria Souza", "email": "maria@email.com", "senha": "minhasenha123" }

// 201
{ "id": 1, "nome": "Maria Souza", "email": "maria@email.com" }
```

### `POST /login`
```json
// Body
{ "email": "maria@email.com", "senha": "minhasenha123" }

// 200
{
  "user": { "id": 1, "nome": "Maria Souza", "email": "maria@email.com", "emailVerified": false },
  "token": "eyJhbGciOi..."
}
```

### `GET /verify-email?token=...`
Pública. Confirma o e-mail a partir do token enviado por e-mail no registro.

### `POST /forgot-password`
```json
{ "email": "maria@email.com" }
```
Sempre responde com a mesma mensagem genérica, exista ou não o e-mail (evita enumeração de contas). O link é válido por 1 hora.

### `POST /reset-password`
```json
{ "token": "abc123...", "novaSenha": "novaSenha123" }
```

### `GET /me` *(privada)*
Retorna `{ id, nome, email, emailVerified }` do usuário autenticado.

### `PUT /me` *(privada)*
Atualiza nome/e-mail e/ou troca a senha (envie `senhaAtual` + `novaSenha` juntos para trocar a senha). Trocar o e-mail marca `emailVerified: false` e reenvia a confirmação automaticamente.

```json
{ "nome": "Maria Souza Lima", "email": "novo@email.com" }
// ou
{ "senhaAtual": "atual123", "novaSenha": "novaSenha456" }
```

### `POST /resend-verification` *(privada)*
Reenvia o e-mail de confirmação para o usuário autenticado.

> As rotas de `/register`, `/login`, `/forgot-password` e `/reset-password` têm rate limit de **10 tentativas a cada 15 minutos por IP**.

---

## Transações

### `GET /transactions` *(privada)*
Query params, todos opcionais:

| Param | Descrição |
|---|---|
| `startDate`, `endDate` | Filtra por intervalo de datas (formato `YYYY-MM-DD`) |
| `categories` | IDs de categoria separados por vírgula |
| `subcategories` | IDs de subcategoria separados por vírgula |
| `keywords` | Busca na descrição, só aplicada dentro da categoria "Outros" |
| `q` | Busca livre na descrição (usada pela tela de Transações) |
| `page`, `limit` | Ativam a paginação (ver abaixo) |

**Sem `page`/`limit`**: retorna um array simples de transações (comportamento usado pelo Dashboard e Relatórios).

**Com `page` e/ou `limit`**: retorna paginado —

```json
{
  "data": [ /* transações */ ],
  "total": 74,
  "page": 1,
  "totalPages": 4
}
```

### `POST /transactions`
```json
{
  "tipo": "despesa",
  "valor": 89.90,
  "data": "2026-07-16",
  "descricao": "Supermercado",
  "subcategoryId": 3,
  "cardId": 2,
  "recurrence": "variável"
}
```
Para recorrência fixa, envie `"recurrence": "fixo"` e `"installments": 12` (quantidade de meses) — a API cria todos os lançamentos futuros de uma vez, vinculados por `recurrence_group_id`.

### `PUT /transactions/:id`
Mesmo corpo do `POST`. Aceita `?applyToFuture=true` para atualizar também as ocorrências futuras de uma transação recorrente.

### `DELETE /transactions/:id`
Apaga uma transação específica.

### `DELETE /transactions/group/:groupId?date=YYYY-MM-DD`
Apaga todas as ocorrências futuras (a partir da data informada) de um grupo de recorrência.

### `PATCH /transactions/:id/pago`
Alterna o status de pago/pendente de uma transação (sem corpo).

---

## Orçamentos

| Rota | Descrição |
|---|---|
| `GET /budgets?mes=&ano=` | Lista os orçamentos do usuário, com `gasto_atual` já calculado. Sem `mes`/`ano`, retorna todos. |
| `POST /budgets` | `{ "categoryId": 1, "limite": 500, "mes": 7, "ano": 2026 }` |
| `PUT /budgets/:id` | Mesmo corpo do `POST` |
| `DELETE /budgets/:id` | — |

> `categoryId` é a fonte de verdade — o campo `categoria` (texto) na resposta é só para exibição.

---

## Metas

| Rota | Descrição |
|---|---|
| `GET /goals` | Lista as metas, ordenadas por prazo. Cada meta já vem com `valor_restante`, `meses_restantes`, `aporte_sugerido_mes` e `status` (`pending`, `on_track`, `behind`, `overdue`, `completed`) calculados. |
| `POST /goals` | `{ "titulo": "Viagem", "valor_objetivo": 5000, "prazo": "2027-01-01" }` (`prazo` é opcional) |
| `PUT /goals/:id` | Mesmo corpo do `POST` |
| `DELETE /goals/:id` | Apaga a meta e suas contribuições em cascata |
| `POST /goals/:id/contribute` | `{ "valor": 200, "data": "2026-07-20" }` — registra um aporte e soma ao `valor_atual` |
| `GET /goals/:id/contributions` | Lista todos os aportes já registrados, mais recentes primeiro |

---

## Cartões

Cartões físicos podem ter cartões virtuais vinculados (`cartaoPaiId`), que compartilham o mesmo limite, fechamento e vencimento do físico.

### `GET /cards?mes=&ano=&includeInactive=`
Retorna todos os cartões (físicos e virtuais) com os campos calculados:

```json
{
  "id": 2, "nome": "Compras Online", "tipo": "virtual", "cartaoPaiId": 1,
  "limiteTotal": 8000, "limiteUtilizado": 2150, "limiteDisponivel": 5850,
  "proximaFatura": 420, "totalGasto": 1980, "faturaAberta": true
}
```
- Sem `mes`/`ano`: mostra o ciclo de fatura **em aberto hoje**.
- Com `mes`/`ano`: mostra o ciclo cujo **fechamento** cai naquele mês (não o mês da compra — ver [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) para o porquê).
- `limiteUtilizado`/`limiteDisponivel` são sempre relativos ao grupo inteiro (físico + virtuais); `proximaFatura` é só do cartão específico.

### `POST /cards`
```json
// Físico
{ "nome": "Nubank Roxinho", "banco": "Nubank", "bandeira": "Mastercard", "tipo": "fisico", "limiteTotal": 8000, "diaFechamento": 10, "diaVencimento": 17, "cor": "#8E2E82" }

// Virtual
{ "nome": "Compras Online", "banco": "Nubank", "tipo": "virtual", "cartaoPaiId": 1 }
```

### `PUT /cards/:id` — mesmo corpo do `POST`, mais `ativo: true|false`.
### `DELETE /cards/:id` — apaga o cartão (e seus virtuais, em cascata, se for físico). Transações vinculadas não são apagadas, só perdem a referência ao cartão (`cardId` vira `null`).

### `GET /cards/:id/historico?meses=6`
Retorna o gasto dos últimos N **ciclos de fatura** (não meses de calendário):
```json
[{ "label": "Jul/26", "cycleStart": "2026-06-11", "cycleEnd": "2026-07-10", "totalGasto": 1980 }, ...]
```

### `GET /cards/:id/transacoes?mes=&ano=`
Lista as transações da fatura de um ciclo específico (ou do ciclo em aberto, sem `mes`/`ano`) — usada pela tela "Ver fatura".

---

## Categorias e subcategorias

| Rota | Descrição |
|---|---|
| `GET /categories` | Lista as categorias fixas do sistema |
| `PUT /categories/:id` | Só permite atualizar `cor` — categorias não podem ser criadas/renomeadas/excluídas pelo usuário |
| `GET /subcategories` | Lista as subcategorias do usuário |
| `POST /subcategories` | `{ "name": "Restaurantes", "categoryId": 1 }` |
| `PUT /subcategories/:id` | Mesmo corpo do `POST` |
| `DELETE /subcategories/:id` | — |

---

## Relatórios

### `POST /reports/custom`
```json
{
  "startDate": "2026-07-01",
  "endDate": "2026-07-31",
  "categories": [1, 2],
  "subcategories": [5],
  "keywords": "assinatura",
  "sendEmail": false
}
```
- `sendEmail: false` → resposta é o PDF (`Content-Type: application/pdf`) para download.
- `sendEmail: true` → resposta é `{ "message": "Relatório enviado com sucesso para ..." }`.

Pelo menos uma categoria (ou "Outros" com `keywords`) é obrigatória.