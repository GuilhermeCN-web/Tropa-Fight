# PHASE-04 Checkpoint — TASK-022 (readiness da V1)

## Identificação

| Item | Valor |
| --- | --- |
| TASK | TASK-022 — Checkpoint PHASE-04 e readiness da V1 |
| Data | 2026-11-23 |
| Branch | `chore/TASK-022-checkpoint-v1` |
| Base | `main` em `4842267` (TASK-021 mergeada) |
| Escopo | V1 acadêmica executada **localmente**; não há publicação (escopo revisado em 2026-11-11) |
| Autorização | "Fiz o merge, verifique e inicie a TASK-022" (responsável, 2026-11-23) |

## Resultado final

**V1 PRONTA PARA APRESENTAÇÃO**, com as limitações conhecidas registradas abaixo.

- Todos os Quality Gates passam.
- O restore com dump completo foi verificado.
- Autenticação, autorização, pagamentos e webhooks estão consistentes, com testes automatizados.
- A rastreabilidade não tem lacunas.
- Os riscos aceitos estão registrados formalmente.

## Quality Gates

Executados na branch do checkpoint, em 2026-11-23.

| Gate | Comando / evidência | Resultado |
| --- | --- | --- |
| Build | `npm run quality` → `next build` (Next.js 16.4.6) | PASS |
| Lint | `npm run quality` → oxlint: 0 erros, 27 avisos `only-export-components` (somente fast refresh) | PASS |
| Formatação e tipos | Prettier e `tsc --noEmit` | PASS |
| Unit + Integration | Vitest: 48 arquivos, 253 testes, com PostgreSQL 18 real | PASS |
| API | E2E `admin-api` contra o servidor real; testes de integração das rotas | PASS |
| E2E | `npm run test:e2e`: 104 aprovados, 0 falhas, 19 pulados de propósito; Chromium, Firefox e WebKit, em desktop e a 360 px | PASS |
| Acessibilidade | axe (WCAG 2.2 AA): 0 violações em 12 páginas × 6 projetos | PASS |
| Arquitetura | `layer-dependencies`: cobre `src/` e `src/modules/**` (ADR-020) | PASS |
| Desempenho (RNF-022) | p95 das APIs ≤ 36 ms e das páginas ≤ 633 ms (TASK-021) | PASS |
| Security | `npm audit`: 0 vulnerabilidades; relatório da TASK-021 sem falhas críticas | PASS |
| Acceptance | Critérios das TASK-001 a TASK-023 registrados como `DONE` no `TASKS.md` | PASS |
| Regression | Todos os anteriores | PASS |

**Correção de teste feita neste checkpoint:** o `vitest.config.ts` incluía só `tests/**/*.test.ts`, então `tests/unit/catalog-browser.test.tsx` (TASK-008) nunca rodava. A inclusão passou a cobrir `*.test.tsx`. O teste falhou por um erro na própria asserção: esperava `&` literal num atributo `href`, mas o React renderiza o HTML escapado `&amp;`, que é o correto e equivale ao mesmo link. A asserção foi corrigida para o HTML escapado e continua verificando o mesmo link. Nenhum código de produção mudou.

## Backup e restore (RNF-011, RNF-012)

Procedimento executado no PostgreSQL 18.6 do Docker Compose:

```bash
docker compose exec -T db pg_dump -U tropa -d tropa_fight_e2e -Fc > tropa.dump
docker compose exec -T db psql -U tropa -d postgres -c "CREATE DATABASE tropa_fight_restore"
docker compose exec -T db pg_restore -U tropa -d tropa_fight_restore --no-owner --exit-on-error < tropa.dump
```

Usei o banco `tropa_fight_e2e` porque é o que tem dados reais de uso. O banco de desenvolvimento quase não tem dados, já que os testes limpam o que criam; o dump dele também foi restaurado com contagens idênticas em 31 tabelas.

| Critério de sucesso | Resultado |
| --- | --- |
| Dump e restore sem erro (`--exit-on-error`) | OK: dump de 203.505 bytes; backup + restore em 3 s |
| Conteúdo idêntico | OK: as 31 tabelas têm a mesma contagem **e** o mesmo md5 do conteúdo ordenado. Inclui 106 usuários, 38 pedidos, 38 reservas, 16 pagamentos, 32 eventos de webhook, 13 resgates de cupom e 502 eventos de auditoria |
| Integridade estrutural | OK: 0 restrições não validadas; 76 de 76 índices |
| Banco restaurado utilizável | OK: migrations reaplicadas sem erro (idempotentes); `/api/health` → 200 `ok`; `/api/products` → 200 |
| Suíte completa sobre o banco restaurado | OK: 253/253 em três execuções isoladas consecutivas |

**Observação:** a primeira execução da suíte sobre o banco restaurado teve 2 falhas. Um erro de encadeamento no meu comando de shell fez essa rodada correr ao mesmo tempo que um servidor de verificação, e a causa não foi capturada. As três execuções isoladas seguintes passaram sem falhas. Fica registrada como possível intermitência sob concorrência entre testes e servidor no mesmo banco; não há falha reproduzível.

O resultado é compatível com o RPO de 24 h e o RTO de 8 h definidos. A rotina automatizada (diária, 30 dias, Supabase Storage) só se aplica a um ambiente hospedado, que não existe na V1.

## Consistência dos fluxos críticos

| Área | Garantia | Evidência automatizada |
| --- | --- | --- |
| Autenticação | Senha com scrypt; política do ADR-012; sessão `HttpOnly`/`Secure`/`SameSite=Lax` de 12 h; logout e desativação revogam a sessão; mensagem genérica na recuperação | `identity-flow`, `identity-password-*`, E2E `auth`, `admin-moderation-users-flow` |
| Autorização | RBAC por permissão ou papel; `CUSTOMER` 403 e visitante 401 em todas as rotas administrativas; `CATALOG_MANAGER` restrito a catálogo e estoque; um papel por usuário (RN-023, índice único); último `GENERAL_ADMIN` protegido (RN-022, inclusive sob concorrência) | E2E `admin-api`, `admin-management-flow`, `admin-moderation-users-flow`, `catalog-flow`, `inventory-*` |
| Posse de dados | Outro cliente recebe 404 em pedido, rastreamento, pagamento, carrinho e avaliações | E2E `admin-api`, `order-api-flow`, `cart-flow`, `review-favorite-flow` |
| Pagamentos | Valores definidos pelo servidor; `Idempotency-Key` no pedido e no pagamento; reserva de estoque transacional; expiração em 30 dias | `checkout-*`, `payment-*`, E2E `storefront` |
| Webhooks | HMAC-SHA256; assinatura inválida ou ausente → 401 sem efeito; idempotência por `(provider, provider_event_id)`; notificação só depois do commit e no máximo uma por evento | `payment-webhook`, `checkout-api-flow`, `notification-post-commit`, E2E `admin-api` |
| Auditoria | Mudanças administrativas e eventos sensíveis auditados, sem dados pessoais | `audit-event`, `privacy-logging`, `admin-moderation-users-flow`, E2E `admin-api` |

## Rastreabilidade

A matriz da seção 18 do `README.md` foi corrigida neste checkpoint. Uma verificação automática confirmou que todos os IDs oficiais aparecem nela: **38 RF, 23 RNF, 23 RN e 23 UC, sem lacunas**. As alterações foram:

- as linhas das TASK-018 a TASK-023 receberam os nomes dos testes, que antes estavam como "a criar";
- foram incluídos IDs que estavam ausentes da matriz: RF-024 a RF-027, RN-001, RNF-003 e RNF-016 a RNF-018;
- foi criada uma linha para os requisitos operacionais RNF-005, RNF-011, RNF-012 e RNF-019, com a evidência de restore e os riscos aceitos;
- foi criada uma linha explícita para os itens fora da V1: RF-029, RF-030, RN-020 e UC-022;
- `catalog-browser` agora aparece como executado.

## Riscos aceitos (registro formal)

| # | Risco / limitação | Motivo da aceitação | Mitigação ou condição para rever |
| --- | --- | --- | --- |
| R-01 | **Rate limiting ausente**, inclusive no login. O limitador opcional R6 não foi implementado | V1 acadêmica local, sem exposição pública | Implementar antes de qualquer hospedagem |
| R-02 | **TLS N/A no ambiente local** (RNF-005). O app local roda em HTTP | Não há hospedagem na V1 | Hospedar somente com HTTPS. Os E2E já rodam sobre HTTPS local |
| R-03 | **Safari/WebKit não mantém a sessão em `http://localhost`**, porque o cookie é sempre `Secure` | É consequência correta da política de cookie seguro | Usar Chrome ou Firefox no ambiente local, ou acessar por HTTPS |
| R-04 | **Dívida da camada `application` do checkout** (ADR-020): os handlers chamam diretamente os repositórios de checkout e endereços | Aceita no ADR-020 para cumprir o prazo | Criar `src/modules/checkout/application` depois da V1 |
| R-05 | **5 violações `application → infrastructure` preexistentes** em `identity` (3), `auth` (1) e `audit` (1), registradas numa lista fechada no teste arquitetural | A correção exige refatorar autenticação e auditoria (TASK-003/004) | Injetar portas nesses serviços depois da V1. O teste falha se surgir uma violação nova |
| R-06 | **Retenção de auditoria não definida** (PD-014). Os logs são mantidos indefinidamente | Não bloqueante para a V1 | Definir prazo e política (LGPD) antes de produção |
| R-07 | **Itens fora da V1**: CSV, relatórios e painel de vendas (RF-029), alerta de estoque baixo, cancelamento, devolução e reembolso (RN-020), estados posteriores a `PAYMENT_CONFIRMED`, logística e gateway reais (RF-030, UC-022), confirmação de e-mail, edição de perfil, exclusão e anonimização de conta, imagens de produto, interface administrativa | Cortes de escopo de 2026-11-11 | Backlog pós-V1. A interface administrativa já foi pedida pelo responsável para depois |
| R-08 | **Integrações simuladas**: pagamento (`LocalMockPaymentGateway`, aprovação via `npm run payment:simulate`), notificações e e-mail de recuperação são mocks locais | ADR-008, ADR-010, ADR-014 | Trocar os adaptadores por provedores reais quando houver decisão |
| R-09 | **Notificações em memória**: o histórico se perde ao reiniciar o servidor | Adaptador mock (ADR-014) | Persistir ou usar um provedor real |
| R-10 | **Consultas administrativas de dados de clientes não são auditadas**; a política aprovada audita apenas mudanças | Política de auditoria aprovada no `README.md` | Decidir se leituras de dados pessoais devem ser auditadas |
| R-11 | **RNF-023 verificado nos motores atuais**, não nas "duas versões mais recentes" de cada navegador de marca | Limite do Playwright local | Testar as versões de marca antes de produção |
| R-12 | **Desempenho medido localmente**, com um único usuário (RNF-022); disponibilidade de 99% (RNF-019) não se aplica | Sem ambiente hospedado | Teste de carga e monitoramento no ambiente hospedado |
| R-13 | **Backup sem rotina automatizada** (RNF-011) | Sem ambiente hospedado; restore manual verificado | Automatizar antes de produção |

## Como executar e demonstrar a V1

1. Suba o banco e aplique as migrations: `docker compose up -d db`, depois `npm run db:migrate`, com `DATABASE_URL` apontando para `localhost:5433` ou com o PostgreSQL local.
2. Defina um `PAYMENT_WEBHOOK_SECRET` aleatório no `.env.local` (por exemplo, `openssl rand -hex 32`).
3. Crie o primeiro administrador com `npm run identity:create-admin` e inicie o app com `npm run dev`. Abra no **Chrome ou Firefox** (R-03).
4. Fluxo do cliente: cadastro → catálogo → produto → carrinho → cupom → checkout → pedido → PIX → `npm run payment:simulate -- <paymentId> payment.approved` → `/orders`.
5. Administração: somente por API (R-07). O roteiro com `fetch` no console está registrado na conversa da TASK-019 e coberto pelo E2E `admin-api`.
6. Validação: `npm run quality` e `npm run test:e2e`. O E2E precisa do Docker, do OpenSSL e de `npx playwright install`.

## Pendências de manutenção (fora do escopo desta TASK)

Estes itens não bloqueiam a V1 e exigem uma manutenção `[MAINT]` autorizada, porque o `README.md` só pode ser alterado aqui para corrigir a rastreabilidade:

- A seção 12 do `README.md` ainda diz que o `payment:simulate` "depende de confirmação"; o script foi aprovado e entregue na TASK-023.
- A seção "Desenvolvimento local" do `README.md` não menciona o R-03 (Safari) nem os pré-requisitos do E2E.
- A seção 16 do `README.md` (Riscos) pode passar a apontar para este checkpoint.
- A pasta `../Tropa-Fight-task023` (worktree da TASK-023) e o cache de navegadores do Playwright que pertence ao `root` são questões do ambiente local.
