# Máquinas de estado

Estados e transições **aprovados e implementados**, conforme ADRs, decisões de TASK e enums das migrations. Estados futuros (separação, envio, entrega, cancelamento, devolução, estorno) não estão definidos e não aparecem aqui (ver ADR-009; fora da V1 por decisão de 2026-11-11).

## Pedido (`order_status`) — ADR-009, TASK-013/014/015

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: criação do pedido (reserva 30 dias)
    PENDING_PAYMENT --> PAYMENT_CONFIRMED: payment.approved antes do vencimento
    PENDING_PAYMENT --> EXPIRED: 30 dias sem pagamento (libera reserva e cupom)
    PAYMENT_CONFIRMED --> [*]
    EXPIRED --> [*]
```

A expiração é aplicada durante as transações de checkout. A criação de pagamento recusa pedido vencido. Não há job agendado (ADR-013 `PROPOSED`).

## Entrega (`shipment_status`) — ADR-009/010

```mermaid
stateDiagram-v2
    [*] --> NOT_SHIPPED: criação do pedido (STANDARD, R$ 20,00, 5 dias úteis)
```

## Pagamento (`payment_status`) — ADR-008, TASK-014

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> PROCESSING: payment.processing
    PROCESSING --> APPROVED: payment.approved
    PROCESSING --> FAILED: payment.failed
    PROCESSING --> CANCELLED: payment.cancelled
    PROCESSING --> EXPIRED: payment.expired
    APPROVED --> [*]
    FAILED --> [*]
    CANCELLED --> [*]
    EXPIRED --> [*]
```

Estados terminais não regridem. Eventos repetidos, identificados por `(provider, providerEventId)`, não duplicam efeitos.

## Reserva de estoque — ADR-005

`inventory_reservations` não possui coluna de estado. O estado é derivado de `converted_at` e `released_at`, que não podem estar preenchidos simultaneamente.

```mermaid
stateDiagram-v2
    [*] --> Ativa: pedido criado (expires_at = +30 dias)
    Ativa --> Convertida: pagamento aprovado (converted_at, baixa definitiva)
    Ativa --> Liberada: pedido EXPIRED (released_at)
```

## Produto (`product_publication_state`) — TASK-006

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> PUBLISHED: publish
    DRAFT --> ARCHIVED: archive
    PUBLISHED --> ARCHIVED: archive
```

Marcas, categorias e variantes usam `ACTIVE`/`INACTIVE`, com transição livre por edição.

## Promoção e cupom (`promotion_status`) — TASK-012

Estados: `DRAFT` (inicial), `ACTIVE` e `INACTIVE`. No código, o estado é definido por edição administrativa. O domínio declara o erro `INVALID_TRANSITION`, mas não foi localizada uma regra de transição que o utilize. Por isso, nenhum grafo de transições é afirmado aqui; consulte `docs/TASKS/TASK012.MD`.

A expiração não é um estado: ela é derivada da vigência (`startsAt <= agora < expiresAt`). Somente `ACTIVE` dentro da vigência é elegível.

## Avaliação (`review_status`) — TASK-017/019

```mermaid
stateDiagram-v2
    [*] --> PENDING: criação (compra verificada)
    PENDING --> PUBLISHED: moderação (TASK-019, não implementada)
    PENDING --> REJECTED: moderação (TASK-019, não implementada)
    PUBLISHED --> PENDING: edição pelo autor
    REJECTED --> PENDING: edição pelo autor
```
