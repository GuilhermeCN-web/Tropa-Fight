# Contexto, módulos e fluxo crítico

Diagramas derivados do código em 2026-11-05 e dos ADRs aceitos.

## Diagrama de contexto

```mermaid
flowchart LR
    Visitante((Visitante))
    Cliente((Cliente))
    Admin((Administrador Geral /<br/>Gestor de Catálogo))
    TF[Tropa Fight<br/>Next.js + PostgreSQL]
    Mock[[Mock de pagamento local<br/>LOCAL_MOCK]]
    Email[[Porta de e-mail/notificação<br/>adaptador mock]]
    Backup[(Supabase Storage<br/>bucket privado de backup)]

    Visitante -->|catálogo público| TF
    Cliente -->|conta, carrinho, checkout, pedidos, avaliações| TF
    Admin -->|catálogo, estoque, promoções, pedidos, auditoria| TF
    TF -->|cria pagamento| Mock
    Mock -->|webhook HMAC| TF
    TF -->|recuperação de senha| Email
    TF -. dump manual .-> Backup
```

Transportadora, gateway real, provedor de e-mail, armazenamento de imagens e monitoramento: **não escolhidos**.

## Módulos e dependências principais

```mermaid
flowchart TD
    auth --> identity
    audit
    privacy
    notifications
    catalog --> audit
    inventory --> catalog
    cart --> catalog
    cart --> inventory
    cart --> pricing
    promotions --> pricing
    coupons --> promotions
    cart --> coupons
    checkout --> cart
    checkout --> inventory
    checkout --> coupons
    shipping --> checkout
    payments --> orders
    payments --> inventory
    orders --> checkout
    reviews --> orders
    reviews --> catalog
    favorites --> catalog
```

As setas indicam **dependência de dados ou regra**, não imports de código. Todos os módulos usam `auth` para autorizar requisições e `audit` para registrar operações sensíveis. A composição de adaptadores pela apresentação segue o ADR-020.

## Sequência: checkout → pagamento → confirmação

```mermaid
sequenceDiagram
    actor C as Cliente
    participant API as Route Handlers
    participant CK as checkout
    participant DB as PostgreSQL
    participant PM as payments
    participant G as LocalMockPaymentGateway

    C->>API: POST /api/checkout/quotes {addressId}
    API->>CK: cotação autoritativa (preço, desconto, frete R$ 20)
    CK->>DB: expira pedidos vencidos; grava checkout_quotes
    API-->>C: cotação
    C->>API: POST /api/checkout/orders {quoteId} + Idempotency-Key
    CK->>DB: TX: revalida, cria order/items/shipment, reserva estoque (30 d), consome cupom, converte carrinho
    API-->>C: pedido PENDING_PAYMENT
    C->>API: POST /api/payments {orderId, method}
    PM->>G: cria cobrança simulada
    PM->>DB: payments PENDING
    G->>API: POST /api/payments/webhook (x-payment-signature)
    API->>PM: valida HMAC em tempo constante
    PM->>DB: TX: evento único; PROCESSING → APPROVED; pedido PAYMENT_CONFIRMED; reserva → baixa
    API-->>G: 200 (replay idempotente também 200)
```
