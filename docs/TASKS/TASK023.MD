# TASK-023 — Telas de produto, carrinho, checkout e pedidos

**Criada em:** 2026-11-11, por decisão do responsável que substitui a recomendação R8: a V1 terá telas de carrinho, checkout e pedidos.

**Fonte normativa:** o bloco TASK-023 do `TASKS.md` (objetivo, IDs oficiais, Scope Guard, critérios de aceitação, testes e DoD). Este documento complementa o fluxo de execução.

## Contexto técnico

- Todas as APIs consumidas já existem e estão testadas: `/api/products/{id}`, `/api/cart`, `/api/cart/items/{itemId}`, `/api/cart/coupon`, `/api/addresses`, `/api/checkout/quotes`, `/api/checkout/orders`, `/api/payments`, `/api/payments/{paymentId}`, `/api/orders`, `/api/orders/{orderId}` e `/api/orders/{orderId}/tracking`. Contratos: `README.md`, seção 12, e `docs/TASKS/TASK011.MD` a `TASK015.MD`.
- O servidor é a fonte de verdade para preços, descontos, frete e totais (ADR-007). A interface apenas exibe o que é retornado.
- O `LocalMockPaymentGateway` não envia webhooks. A aprovação é demonstrada por um script local (`npm run payment:simulate`) que assina o evento com `PAYMENT_WEBHOOK_SECRET` (HMAC-SHA256 em `x-payment-signature: sha256=<hex>`) e o envia ao webhook existente. Este mecanismo **depende de confirmação** antes do `READY`.
- O padrão existente de página e componente é `app/catalog/page.tsx` com `src/modules/catalog/presentation/catalog-browser.tsx`, testado em `tests/unit/catalog-browser.test.tsx`.
- Antes de escrever código, consultar o guia do Next.js em `node_modules/next/dist/docs/` (aviso do `AGENTS.md`).

## Etapas

1. **ETAPA-001 — Recontextualização e prontidão:** confirmar as dependências, a confirmação do script de simulação e o Scope Guard.
2. **ETAPA-002 — Planejamento:** definir páginas, componentes e estados de erro por fluxo.
3. **ETAPA-003 — Implementação:** produto → carrinho → checkout → pagamento → pedidos; script de simulação.
4. **ETAPA-004 — Revisão e validação automatizada:** `npm run quality` com `.env.local`.
5. **ETAPA-005 — Teste manual:** fluxo completo, uma vez em desktop e uma vez a 360 px, com registro.
6. **ETAPA-006 — Conclusão:** Definition of Done, classificação PRIMARY/INCIDENTAL e relatório.

## Roteiro de teste manual (MAN-001)

1. Faça login como cliente e abra `/catalog`, depois um produto. Selecione uma variante e adicione 2 unidades ao carrinho.
2. Em `/cart`, altere a quantidade, aplique um cupom válido e confira que os totais vêm da API.
3. Em `/checkout`, cadastre um endereço e gere a cotação. Confirme o pedido; ele deve aparecer como `PENDING_PAYMENT`.
4. Escolha PIX e crie o pagamento. Execute `npm run payment:simulate -- <paymentId> payment.processing` e depois `payment.approved`.
5. Em `/orders/{id}`, o pedido deve aparecer como `PAYMENT_CONFIRMED`, com a entrega `NOT_SHIPPED`.
6. Repita os passos 1 a 3 com a janela em 360 px de largura.
