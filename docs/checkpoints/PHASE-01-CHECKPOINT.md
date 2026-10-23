# PHASE-01 Checkpoint — TASK-005

## Identificação

- Data: 2026-10-23
- Branch: `chore/TASK-005-phase-01-checkpoint`
- Commit base: `765e7c4` (`main` atualizado após merge da TASK-004)
- Responsável pela execução: Codex, com decisões do responsável do projeto registradas abaixo
- Status: DONE; GATE-001 a GATE-005 aprovados; PHASE-02 elegível

## Prontidão e decisões

- TASK-002, TASK-003 e TASK-004 constam como `DONE`; seus artefatos de arquitetura/infraestrutura, identidade, persistência, auditoria, notificações e testes estão presentes.
- Em 2026-10-23, o responsável aprovou ADR-001 e ADR-002 conforme escritos e aprovou a direção do ADR-004; atributos obrigatórios e política de SKU continuam pendentes até serem necessários.
- Em 2026-10-23, o responsável aprovou definições propostas para RNF-010 e RNF-014–017, agora registradas em `README.md`; suas implementações/validações ainda dependem das TASKs aplicáveis. O critério e ambiente de referência para aferir performance também precisam ser definidos antes da validação de RNF-016.
- Em 2026-10-23, o responsável definiu RPO máximo de 24 horas, RTO máximo de 8 horas e meta mensal de disponibilidade de 99% para um futuro ambiente hospedado. O responsável criou o bucket privado `tropa-fight-backups`, enviou o dump sintético e baixou o mesmo objeto para validação.

## Plano de validação

| Área | Validação prevista | Evidência a registrar |
| --- | --- | --- |
| Build e tipos | `npm run build`, `npm run typecheck` | Saída e código de retorno |
| Lint e formatação | `npm run lint`, `npm run format:check` | Saída e código de retorno |
| Testes | `npm test`; integração de identidade/auditoria com PostgreSQL local quando configurado | Contagem, skips, falhas e configuração presente/ausente sem expor valores |
| APIs e autorização | Inspeção dos Route Handlers e testes existentes, incluindo bloqueios negativos | Arquivos/testes correspondentes; casos manuais separados |
| Segurança e privacidade | Revisão de controles, sanitização, dependências e busca por segredos | Comandos e escopo da busca, sem imprimir valores secretos |
| Auditoria/notificações | Revisão de repositório imutável, controle de acesso, eventos e adapter mock | Código e testes |
| Infraestrutura/backup | Conferir baseline, variáveis, ambientes, backup, restore e pendências aprovadas | `infrastructure-baseline.md`; restore real somente em ambiente isolado aprovado |
| Arquitetura/ADRs | Revisar dependências entre camadas e ADR-001–004 | Teste arquitetural e matriz ADR |
| Rastreabilidade | Relacionar RNF/TASK/evidência usando as fontes abaixo | Matriz; lacunas permanecem pendentes |
| Validação manual | Preparar roteiro para o responsável executar; não declarar execução sem observação/evidência | IDs, passos e resultados manuais |

## Matriz de rastreabilidade RNF (planejada; definições canônicas incompletas)

| RNF | TASK/fonte indicada no projeto | Evidência a avaliar | Situação da definição |
| --- | --- | --- | --- |
| RNF-001 | TASK-001 | `docs/TASKS/TASK001.MD`, estrutura/testes de camadas | Definição formal não localizada; critério documentado será mapeado |
| RNF-002 | TASK-001 | `docs/TASKS/TASK001.MD`, qualidade e execução local | Definição formal não localizada; critério documentado será mapeado |
| RNF-003 | TASK-003/004 | `docs/TASKS/TASK003.MD`, `docs/TASKS/TASK004.MD` | Definição formal não localizada; escopo exato pendente |
| RNF-004 | TASK-003 | autenticação e segurança em `docs/TASKS/TASK003.MD` | Definição formal não localizada; critério local a mapear |
| RNF-005 | TASK-003 | senhas, sessão e autorização em `docs/TASKS/TASK003.MD` | Definição formal não localizada; critério local a mapear |
| RNF-006 | TASK-004 | auditoria em `docs/TASKS/TASK004.MD` | Definição formal não localizada; critério local a mapear |
| RNF-007 | TASK-004 | privacidade/minimização em `docs/TASKS/TASK004.MD` | Definição formal não localizada; critério local a mapear |
| RNF-008 | TASK-004 | sanitização e controles em `docs/TASKS/TASK004.MD` | Definição formal não localizada; critério local a mapear |
| RNF-009 | PHASE posterior, conforme TASK-005 | Registro de N/A em `docs/TASKS/TASK005.MD` | Fora da PHASE-01 segundo a especificação |
| RNF-010 | README.md / TASK-002 | Meta mensal de disponibilidade de 99% em futuro ambiente hospedado | Definição aprovada; medição hospedada pendente |
| RNF-011 | TASK-002 | `docs/TASKS/TASK002.MD`; `infrastructure-baseline.md` (secrets/configuração) | Definição formal não localizada; critério local a mapear |
| RNF-012 | TASK-002 | `docs/TASKS/TASK002.MD`; baseline de observabilidade/recuperação | Definição formal não localizada; critério local a mapear |
| RNF-013 | TASK-001 | `docs/TASKS/TASK001.MD`; qualidade/execução local | Definição formal não localizada; critério local a mapear |
| RNF-014 | README.md / TASK-021 | WCAG 2.2 AA nos fluxos críticos | Definição aprovada; validação posterior |
| RNF-015 | README.md / TASK-021 | Fluxos críticos utilizáveis de 360 px a desktop, sem perda de função | Definição aprovada; validação posterior |
| RNF-016 | README.md / TASK-021 | APIs p95 ≤ 2 s; páginas críticas ≤ 3 s | Definição aprovada; ambiente/método de referência pendente antes da validação |
| RNF-017 | README.md / TASK-021 | Duas versões estáveis mais recentes de Chrome, Edge, Firefox e Safari | Definição aprovada; validação posterior |
| RNF-018 | TASK-002 | `docs/TASKS/TASK002.MD`; baseline de configuração/operação | Definição formal não localizada; critério local a mapear |

## Resultados dos Gates

| Gate | Resultado | Evidência |
| --- | --- | --- |
| GATE-001 — Recontextualização e prontidão | APROVADO | Dependências/artefatos verificados; decisões registradas conforme autorização do responsável; branch TASK-005 ativa |
| GATE-002 — Planejamento do checkpoint | APROVADO | Plano de validação e matriz acima; lacunas explicitamente preservadas |
| GATE-003 — Validação integrada e diagnóstico | APROVADO | PostgreSQL local 18; migrações aplicadas; integração passou; `npm run quality` passou com 18 testes e build |
| GATE-004 — Testes manuais do checkpoint | APROVADO | Smoke test HTTP e MAN-001–003 passaram; restore local isolado passou |
| GATE-005 — Relatório e conclusão | APROVADO | Bucket privado criado; upload/download concluídos; SHA-256 igual; restore do arquivo baixado passou em banco isolado; testes, DoD e matriz final registrados |

## Resultado final

PASS — GATE-001 a GATE-005 aprovados; RPO, RTO e disponibilidade definidos; RNF-010 e RNF-014–017 formalizados por aprovação do responsável. Bucket privado Supabase Storage criado; o dump sintético foi enviado e baixado, os SHA-256 conferem, e o arquivo baixado foi restaurado com sucesso em banco PostgreSQL local isolado (8 tabelas públicas). A base temporária foi removida após a validação. Quality gates automatizados e suíte completa com `.env.local` passaram; MAN-001–003 passaram conforme confirmação do responsável. TASK-005 DONE; PHASE-02 elegível. TASK-006 não foi iniciada.

## Evidências e pendências do GATE-003

Ambiente: Windows, Node.js v24.13.0, PostgreSQL 18 local; `.env.local` está ignorado pelo Git e não foi incluído nas alterações versionáveis. A conexão usa o banco local `tropa_fight`.

| Validação | Resultado | Evidência |
| --- | --- | --- |
| `npm run quality` com `.env.local` carregado | PASS | exit code 0; format check, lint, typecheck, 9 arquivos/18 testes Vitest e build passaram; lint mantém aviso `react(only-export-components)` em `app/layout.tsx` |
| `npm run format` | PASS | Responsável autorizou formatar os 58 arquivos apontados pelo Prettier; formatter terminou com exit code 0 |
| `npm run db:migrate` | PASS | TASK-003 migrations aplicadas no banco local `tropa_fight` |
| `tests/integration/identity-flow.test.ts` | PASS | 1 arquivo/1 teste passou com PostgreSQL local |
| `npm run lint` | PASS com warning | exit code 0; aviso `react(only-export-components)` em `app/layout.tsx` |
| `npm run typecheck` | PASS | incluído em `npm run quality`; exit code 0 |
| `npm test` | PASS | 9 arquivos/18 testes passaram; integração incluída via `.env.local` |
| `npm run build` | PASS | incluído em `npm run quality`; Next.js compilou e gerou as páginas/rotas |
| `git diff --check` | PASS | exit code 0; Git emitiu avisos de normalização LF/CRLF nos arquivos formatados |
| Busca por padrões de segredos | Sem correspondências | Busca limitada a padrões de chaves privadas, AWS, URL PostgreSQL com credenciais e API keys nos arquivos não ignorados definidos no comando; não substitui scanner completo |

### Scope escalation — formatação (resolvida)

- Necessidade: formatar 58 arquivos em `app/**`, `src/**`, `tests/**`, `scripts/**` e configurações da raiz para satisfazer `format:check`.
- Motivo: o Gate oficial falha em 58 arquivos. A correção em massa afetaria grande parte da fundação da PHASE-01.
- Arquivos/módulos afetados: os 58 arquivos listados pela saída do Prettier.
- `ALLOWED_CHANGES`: testes, documentação, configuração e correções necessárias da PHASE-01; `TASKS.md`.
- `FORBIDDEN_CHANGES`: funcionalidades comerciais posteriores, remoção/enfraquecimento de testes ou desabilitação de lint.
- Por que não é incidental: alteração ampla e transversal, que não é mínima nem localizada.
- Impacto se não realizada: `format:check` permanece FAIL e TASK-005 não pode avançar.
- Alternativa: manter os arquivos intactos e preservar o bloqueio.
- Recomendação: autorizar explicitamente a formatação em massa sob TASK-005 ou manter o Gate bloqueado.
- Decisão: em 2026-10-23 o responsável autorizou a formatação dos 58 arquivos; mudança aplicada e Quality Gate de formatação aprovado.

### PostgreSQL local e autenticação

O banco local `tropa_fight` foi criado e as migrações TASK-003 foram aplicadas com `npm run db:migrate`. A integração foi executada com `node --env-file-if-exists=.env.local node_modules/vitest/vitest.mjs run tests/integration/identity-flow.test.ts` e passou (1 arquivo/1 teste). A suíte completa passou com `.env.local` carregado (9 arquivos/18 testes). Uma tentativa de conexão com senha inválida foi rejeitada (`28P01`), confirmando autenticação por senha após a restauração de `scram-sha-256`.

### GATE-004 e pendências operacionais

GATE-004 aprovado em 2026-10-23. O responsável confirmou MAN-001 (cadastro, login, perfil e logout), MAN-002 (HTTP 403 para CUSTOMER em `/api/admin/audit-logs`) e MAN-003 (HTTP 401 após logout). O smoke test HTTP também passou. Foi criado um banco isolado com somente dados sintéticos (`example.invalid` e evento marcado `synthetic`); o dump custom do PostgreSQL ficou com 17.674 bytes e foi restaurado em outra base local isolada. O responsável criou o bucket privado `tropa-fight-backups`, enviou o arquivo e baixou o mesmo objeto para `C:\Users\guias\AppData\Local\Temp\tropa-fight-task005-returned.dump`. O tamanho do arquivo está abaixo de 50 MB; SHA-256 do original e do baixado coincide: `210F4DB2769FB974F90BEFDB4C5CA787BA140AC5722ED0A85E994B8623BB4675`. O dump baixado foi restaurado com sucesso em banco PostgreSQL local isolado; foram confirmadas 8 tabelas públicas e a base temporária foi removida. Em 2026-10-23, o responsável aprovou definições propostas de RNF-010 e RNF-014–017, agora registradas no README e na matriz acima; validação dessas metas permanece atribuída às TASKs aplicáveis. Também aprovou RPO máximo de 24 horas, RTO máximo de 8 horas e disponibilidade mensal de 99% para futuro ambiente hospedado; a disponibilidade não foi medida localmente. GATE-005 foi aprovado após auditoria da matriz e da DoD; TASK-005 está DONE e PHASE-02 elegível. TASK-006 não foi iniciada.

#### Smoke test local observado

Aplicação iniciada com `npm run dev -- --hostname 127.0.0.1` em `http://127.0.0.1:3000`.

| Rota | Esperado | Resultado |
| --- | --- | --- |
| `/` | HTTP 200 | PASS — 200 |
| `/register` | HTTP 200 | PASS — 200 |
| `/login` | HTTP 200 | PASS — 200 |
| `/profile` | HTTP 200 para shell da página | PASS — 200 |
| `/api/me` sem sessão | HTTP 401 | PASS — 401 |
| `/api/admin/identity/roles` sem sessão | HTTP 401 | PASS — 401 |
| `/api/admin/audit-logs` sem sessão | HTTP 401 | PASS — 401 |

#### Casos manuais aguardando o responsável

| ID | Passos | Resultado esperado | Status |
| --- | --- | --- | --- |
| MAN-001 | Em `/register`, cadastrar usuário temporário de teste; entrar em `/login`; consultar o próprio perfil em `/profile`; sair da sessão. | Cadastro e login funcionam; perfil mostra o usuário autenticado; logout encerra a sessão. | PASS — responsável confirmou todos os passos em 2026-10-23 |
| MAN-002 | Como o usuário CUSTOMER de MAN-001, abrir `/api/admin/audit-logs`. | HTTP 403, acesso negado. | PASS — responsável observou HTTP 403 Forbidden em 2026-10-23 |
| MAN-003 | Após logout, abrir `/api/admin/audit-logs`. | HTTP 401, autenticação necessária. | PASS — responsável observou HTTP 401 Unauthorized em 2026-10-23 |
