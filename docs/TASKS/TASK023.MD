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

## Registro de execução

**Branch:** `feature/TASK-023-telas-cliente`, executada em paralelo à TASK-018 com autorização explícita do responsável (2026-11-11: "Realize a TASK-018 e 023 em paralelo"). A mesma instrução confirmou o script `payment:simulate` e encerrou a pendência de prontidão.

### ETAPA-001 — Recontextualização e prontidão

- Dependência TASK-017 `DONE`. Prontidão: PASS. Transições `BLOCKED → READY → IN_PROGRESS`.
- Lidos: bloco TASK-023 do `TASKS.md`, seção 12 do `README.md`, rotas `app/api` consumidas, padrão `app/catalog/page.tsx` + `catalog-browser.tsx` e o guia do Next.js em `node_modules/next/dist/docs/` (páginas, layouts, `params` assíncrono e `notFound`).

### ETAPA-002 — Planejamento

| Página | Componente | APIs consumidas | Estados de erro tratados |
| --- | --- | --- | --- |
| `/products/[id]` (servidor) | `catalog/presentation/product-detail.tsx` + `cart/presentation/add-to-cart-form.tsx` | dados públicos do catálogo (mesmos serviços da API, padrão da página `/catalog`); `POST /api/cart` | produto inexistente ou ID inválido → 404; estoque insuficiente; variante indisponível; 401 → login |
| `/cart` | `cart/presentation/cart-view.tsx` | `GET /api/cart`, `PATCH`/`DELETE /api/cart/items/{id}`, `POST`/`DELETE /api/cart/coupon` | estoque insuficiente; cupom inexistente, expirado, inativo, limite ou mínimo; cupom removido; quantidade acima do disponível |
| `/checkout` | `checkout/presentation/checkout-view.tsx` + `payments/presentation/payment-panel.tsx` | `GET`/`POST /api/addresses`, `POST /api/checkout/quotes`, `POST /api/checkout/orders`, `POST /api/payments` | endereço inválido (CPF, telefone, CEP, UF); carrinho vazio; estoque indisponível; `QUOTE_CHANGED` (nova cotação exibida e nova confirmação exigida); cupom inválido; pedido expirado; falha de rede (reenvio com a mesma chave) |
| `/orders`, `/orders/[id]` | `orders/presentation/order-views.tsx` | `GET /api/orders`, `GET /api/orders/{id}`, `POST /api/payments` | pedido inexistente; 401 → login |

Utilitários compartilhados em `checkout/presentation/storefront.tsx`: formatação, rótulos em português, tradução de erros da API, `requestJson` (401 → `/login`; falha de rede → `status: 0`) e chaves de idempotência.

### ETAPA-003 — Implementação

- **Idempotency-Key do pedido:** gerada uma vez por cotação (tentativa) e reutilizada em qualquer reenvio. Uma resposta `QUOTE_CHANGED` inicia nova tentativa, com nova chave e nova confirmação.
- **Idempotency-Key do pagamento:** uma por pedido e meio de pagamento, mantida em `sessionStorage` (com fallback se indisponível). Reenviar devolve o mesmo pagamento.
- **Valores:** todos os totais, descontos e frete exibidos vêm das respostas da API. O navegador não calcula total.
- **Pagamento:** só a escolha do meio (PIX, débito ou crédito simulados). Nenhum dado de cartão é solicitado.
- **Navegação:** layout com link "Pular para o conteúdo", menu (Catálogo, Carrinho, Pedidos, Conta) e foco visível. Cards do catálogo ligam a `/products/{id}`.
- **Script `npm run payment:simulate -- <paymentId> <evento>`** (`scripts/simulate-payment-webhook.mjs`):
  - lê `order_id` e `amount_cents` do pagamento no banco local;
  - monta o evento no formato aceito por `parsePaymentWebhookEvent`, com `id` único `local-sim-<uuid>`;
  - assina com `PAYMENT_WEBHOOK_SECRET` (HMAC-SHA256, `x-payment-signature: sha256=<hex>`);
  - envia a `POST /api/payments/webhook`;
  - destino padrão `http://localhost:3000`, configurável por `PAYMENT_SIMULATE_URL`, somente `localhost`/`127.0.0.1`/`[::1]`.

  Não há endpoint novo nem mudança de contrato.

### ETAPA-004 — Revisão e validação automatizada

Ambiente: PostgreSQL 18 em Docker (porta 5433, banco dedicado `tropa_fight_t023`, migrations aplicadas). Como `PAYMENT_WEBHOOK_SECRET` está vazio no `.env.local` local, as execuções usaram um segredo efêmero (`openssl rand -hex 32`) por variável de ambiente, sem alterar o `.env.local`.

- `npm run quality`: PASS.
  - Formatação, typecheck e build: OK; as novas rotas aparecem no build.
  - Lint: 0 erros e 27 avisos `react(only-export-components)`. Um aviso já existia em `app/layout.tsx`; os demais vêm de `metadata` nas páginas e de utilitários exportados junto com componentes. Afetam apenas o fast refresh.
  - Testes: 39 arquivos, 138 testes, incluindo `storefront-presentation.test.ts` e `payment-simulator-script.test.ts` (21 testes novos).
- Smoke HTTP com `next start` na porta 3023:
  - `/`, `/catalog`, `/cart`, `/checkout`, `/orders` e `/orders/{id}`: 200;
  - `/products/{id}` publicado: 200, com seletor de variantes e "Adicionar ao carrinho";
  - `/products/{inexistente|inválido}`: 404.
- Roteiro automatizado via API (evidência complementar, **não substitui o MAN-001**), executado em sequência:
  1. cadastro e login;
  2. estoque insuficiente: 409;
  3. adicionar ao carrinho: 201; alterar quantidade: 200;
  4. cupom inexistente: 404 `COUPON_NOT_FOUND`; cupom válido: subtotal 45000, desconto 4500, total 40500;
  5. CPF inválido: 400; cotação: frete 2000, total 42500;
  6. pedido criado: 201 `PENDING_PAYMENT`; reenvio com a mesma chave devolve o mesmo pedido;
  7. pagamento PIX: `PENDING`; reenvio com a mesma chave: 200, mesmo pagamento;
  8. `payment:simulate`:
     - `payment.processing` e `payment.approved`: HTTP 200, com o pedido em `PAYMENT_CONFIRMED`, o pagamento `APPROVED` e a entrega `NOT_SHIPPED`;
     - destino remoto: recusado;
     - segredo incorreto: 401;
  9. estoque zerado no checkout: 409 `STOCK_UNAVAILABLE`.
- O comportamento interativo dos componentes React no navegador (cliques e formulários) não foi exercitado por automação. Os componentes foram renderizados nos testes unitários e a validação interativa fica para o MAN-001 e para a TASK-021 (E2E).

### ETAPA-005 — Teste manual (MAN-001)

**Executado pelo responsável em 2026-11-11 — APROVADO.** O responsável percorreu o fluxo pela interface até o pagamento simulado e confirmou que funcionou ("funcionou"), determinando a conclusão da TASK. A passagem específica a 360 px não foi relatada separadamente; a validação formal de responsividade e WCAG fica na TASK-021.

Condições de execução observadas:

- o app e o `payment:simulate` rodaram a partir do worktree da branch, contra o banco do Docker Compose (`localhost:5433`), com `DATABASE_URL` informado na linha de comando, porque o PostgreSQL local na porta 5432 estava parado;
- o `PAYMENT_WEBHOOK_SECRET` precisou ser preenchido no `.env.local` e o servidor reiniciado.

### ETAPA-006 — Conclusão

| Arquivo | Classificação |
| --- | --- |
| `app/products/[id]/page.tsx`, `app/cart/page.tsx`, `app/checkout/page.tsx`, `app/orders/page.tsx`, `app/orders/[id]/page.tsx` | PRIMARY |
| `src/modules/catalog/presentation/product-detail.tsx`, `src/modules/cart/presentation/{add-to-cart-form,cart-view}.tsx`, `src/modules/checkout/presentation/{checkout-view,storefront}.tsx`, `src/modules/payments/presentation/payment-panel.tsx`, `src/modules/orders/presentation/order-views.tsx` | PRIMARY |
| `src/modules/catalog/presentation/catalog-browser.tsx` (link do card) | PRIMARY |
| `app/layout.tsx`, `src/presentation/app.css` | PRIMARY |
| `scripts/simulate-payment-webhook.mjs`, `package.json` (`payment:simulate`) | PRIMARY |
| `tests/unit/storefront-presentation.test.ts`, `tests/unit/payment-simulator-script.test.ts` | PRIMARY |
| `docs/TASKS/TASK023.MD`, `TASKS.md` | PRIMARY |

Nenhuma alteração INCIDENTAL ou FORBIDDEN. Não houve mudança em APIs, contratos, regras, migrations ou dependências.

**Itens em aberto:**

- Usabilidade do script: quando a conexão com o banco é recusada, o script imprime uma mensagem vazia, e o comando exibido na tela de pagamento não inclui `DATABASE_URL`. Não bloqueia o fluxo; melhoria possível em manutenção.
- O `vitest.config.ts` inclui só `tests/**/*.test.ts`, por isso `tests/unit/catalog-browser.test.tsx`, que já existia, nunca é executado. Os testes desta TASK foram escritos em `.ts` para contornar isso. A correção fica fora do escopo da TASK.
- O `README.md`, seção 12, ainda diz que o script "depende de confirmação". A frase precisa ser ajustada em manutenção documental, porque o `README.md` não está em `ALLOWED_CHANGES`.

**Estado:** `DONE` (2026-11-11). Transições `IN_PROGRESS → IN_REVIEW → DONE`.
