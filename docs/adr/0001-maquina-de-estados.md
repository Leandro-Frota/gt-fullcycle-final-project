# ADR 0001 — Máquina de estados no domínio

- Status: aceito
- Data: 2026-11-13
- Autor: Leandro Frota

## Contexto e problema

Um pedido passa por um ciclo de vida com regras claras:

```
pending -> paid -> shipped
pending -> cancelled
```

Os endpoints `POST /orders/:id/pay`, `/ship` e `/cancel` mudam o status. É preciso decidir **onde** fica a regra que diz quais transições são permitidas (por exemplo, não dá para cancelar um pedido já enviado).

## Fatores de decisão

- A regra deve ser testável sem HTTP, sem banco e sem Express.
- A regra deve existir em um único lugar, para não divergir entre endpoints.
- Adicionar um status ou uma ação no futuro deve exigir mudar pouco código.
- O domínio não deve conhecer detalhes de HTTP (códigos de status, request, response).

## Alternativas consideradas

1. **Máquina de estados no domínio** (escolhida): uma tabela de transições em `src/domain/order-status.ts` e a função `transition(order, action, now)`, que devolve um novo pedido ou lança `InvalidTransitionError`.
2. **`if`s de status espalhados no controller** (descartada): cada handler (`pay`, `ship`, `cancel`) verifica o status atual com condicionais e responde com erro HTTP.

## Decisão

Adotamos a alternativa 1. As transições válidas ficam declaradas em uma única tabela no domínio. O controller apenas chama `transition` e traduz o `InvalidTransitionError` para `409 Conflict`.

## Consequências

### Positivas

- Uma única fonte de verdade: ler a tabela mostra todo o ciclo de vida do pedido.
- Os testes unitários cobrem todas as combinações de status e ação sem subir a API (ver `tests/unit/order-status.test.ts`).
- O domínio não depende de HTTP; o mapeamento para 409 fica na borda da aplicação.
- `transition` é imutável (devolve um pedido novo), o que evita efeitos colaterais.
- Incluir um novo status ou ação exige alterar só a tabela e seus testes.

### Negativas

- Há uma camada a mais para entender (tabela, tipo de ação e erro de domínio) em um sistema pequeno.
- O controller precisa lembrar de capturar `InvalidTransitionError` e converter para 409.

## Por que descartamos os `if`s no controller

- A regra fica duplicada em três handlers e pode divergir quando um deles for alterado.
- Para testar é preciso subir o Express (Supertest), o que é mais lento e mistura regra de negócio com HTTP.
- O controller passaria a conhecer regras de negócio e códigos de resposta ao mesmo tempo, quebrando a separação de responsabilidades.
- Novos status deixariam as condicionais cada vez mais aninhadas e difíceis de revisar.
