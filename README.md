**Nível: Projeto B (simples)**

# API de Pedidos

Projeto final do curso Full Cycle (Módulo 4). Uma API REST de um domínio só, pedidos, com um fluxo principal funcionando de ponta a ponta: criar um pedido, consultar, pagar, enviar ou cancelar.

> Em construção. As seções "Como subir" e "Como testar" entram junto com o código.

## Integrantes

| Nome | Módulo |
|---|---|
| João Pedro Lira | Pedidos: criação e consulta |
| Leandro Frota | Pedidos: pagamento, envio e cancelamento |

Quem fez o quê está em [CONTRIBUTORS.md](CONTRIBUTORS.md).

## Escopo

| Endpoint | O que faz |
|---|---|
| `POST /orders` | Cria um pedido (cliente + itens) |
| `GET /orders/:id` | Consulta um pedido |
| `POST /orders/:id/pay` | Paga um pedido pendente |
| `POST /orders/:id/ship` | Envia um pedido pago |
| `POST /orders/:id/cancel` | Cancela um pedido pendente |
| `GET /health` | Saúde da API |
| `GET /metrics` | Métricas no formato Prometheus |

Status do pedido: `pending` → `paid` → `shipped`, ou `pending` → `cancelled`.

## Stack

Node.js 24 + TypeScript · Express · PostgreSQL · Vitest + Supertest · pino · prom-client · k6 · Docker Compose · GitHub Actions
