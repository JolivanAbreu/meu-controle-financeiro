# Changelog

Não segue versionamento semântico formal ainda — organizado por marcos de funcionalidade.

## Documentação e limpeza

- README, referência de API, documento de arquitetura e guia de contribuição
- Removido código morto (funcionalidade de "conta bancária" nunca implementada, comentada há tempos no model/controller de Metas)
- Corrigido bug real encontrado durante a limpeza: o cálculo de status de metas após um aporte rodava por um caminho de código incompleto (o `Goal.increment` com `returning: true` não funciona em MySQL/MariaDB, então o app sempre caía no fallback, que não recalculava todos os campos) — lógica extraída para uma função única, sem duplicação
- Otimizadas as consultas de listagem de cartões (agregações em lote em vez de uma consulta por cartão)
- Adicionada paginação opcional em `GET /transactions`

## Segurança e conta

- Recuperação de senha por e-mail (token com hash SHA-256, expiração de 1 hora)
- Confirmação de e-mail no cadastro (não bloqueia login)
- Tela de perfil (editar nome/e-mail, trocar senha)
- Rate limiting em login, registro e redefinição de senha

## Cartões (funcionalidade nova, do zero)

- Modelagem de cartões físicos e virtuais com limite compartilhado (auto-relacionamento)
- Cálculo de ciclo de fatura a partir do dia de vencimento informado
- Cartão vinculável a uma transação
- Visual de cartão com textura e cor personalizável, cartões virtuais em efeito de pilha atrás do físico
- Histórico por ciclo de fatura, fatura detalhada com marcação de pago
- Navegação por mês/ano, resumo geral com alerta de limite alto

## Orçamentos e categorias

- Orçamentos migrados de categoria em texto livre para referência real (`categoryId`)
- Cor personalizável por categoria, refletida no gráfico de despesas

## Notificações e organização

- Sino de notificações com alertas calculados (orçamento estourado, fatura vencendo, limite alto, meta concluída)
- Histórico de aportes de metas
- Tela dedicada de Transações com busca e paginação

## Relatórios

- PDF reformulado: agrupado por categoria com subtotal, cabeçalho/rodapé com marca e paginação
- Atalhos de período, exportação em CSV, contagem de lançamentos

## Redesign visual

- Sistema de design completo (papel/tinta → depois trocado para Oswald como fonte única)
- Modo escuro em todas as telas
- Sidebar colapsável com busca e modo escuro
- Modais de confirmação substituindo os `window.confirm()` nativos do navegador
- Animações de entrada de modal e troca de cartão na pilha