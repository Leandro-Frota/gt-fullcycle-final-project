# Contribuidores

Projeto em dupla, dividido por **módulo do sistema**. Cada pessoa commita a própria parte, com a própria conta, e os PRs de um são revisados pelo outro.

## João Pedro Lira — Pedidos: criação e consulta

- Entidade Pedido e regras de criação
- Padrão Repository: interface, repositório em memória e repositório Postgres
- `POST /orders` e `GET /orders/:id`
- Configuração por variável de ambiente e `.env.example`
- Logs estruturados
- Testes unitários da criação, teste de integração da API e coverage mínimo
- OpenAPI do endpoint principal e README

## Leandro Frota — Pedidos: pagamento, envio e cancelamento

- Máquina de estados do pedido
- `POST /orders/:id/pay`, `/ship` e `/cancel`
- Dockerfile e Docker Compose (API + Postgres)
- Pipeline de CI no GitHub Actions
- Métrica de latência em `/metrics` e SLO
- Testes unitários das transições e teste de integração do fluxo de status
- ADR 0001, smoke test k6 e `docs/desempenho.md`

## Uso de IA

Cada um declara em `docs/ia.md` os prompts que importaram.

> Esta é a divisão combinada no início. No fechamento, cada um atualiza a própria seção com o que realmente entregou.
