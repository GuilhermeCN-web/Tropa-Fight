# Registro de divergências documentais — Tropa Fight

**Origem:** sincronização da documentação com o código e com o planejamento, realizada em 2026-11-05.
**Natureza:** documento de controle. Registra conflitos entre fontes de verdade que **dependem de decisão do responsável**. Nenhuma divergência abaixo foi resolvida unilateralmente.

Cada divergência usa o prefixo `DIV-xxx`, independente de `PD-xxx`, para não colidir com nenhum dos dois esquemas de pendências existentes (ver DIV-003). IDs `DIV` não devem ser reutilizados.

Estados: `ABERTA` (aguarda decisão) · `DECIDIDA` (decisão registrada, aplicação pendente) · `ENCERRADA`.

**Atualização de 2026-11-11:** o responsável aprovou o pacote de recomendações R1–R18, exceto a R8 (a V1 terá telas de carrinho, checkout e pedidos). Cada seção abaixo registra a decisão aplicada.

## Resumo

| ID | Tema | Impacto | Estado |
| --- | --- | --- | --- |
| DIV-001 | Dois esquemas incompatíveis de IDs RF/RN/UC | Rastreabilidade; DoR da TASK-018 e TASK-019 | ENCERRADA |
| DIV-002 | RNF-010 e RNF-014–017 redefinidos sobre IDs já existentes | Requisitos não funcionais; TASK-021/022 | ENCERRADA |
| DIV-003 | Dois esquemas incompatíveis de IDs PD | Pendências; TASK-002 | ENCERRADA |
| DIV-004 | PostgreSQL usado por todos os módulos, mas o ADR-003 só formaliza o uso para identidade | Arquitetura; ADR-003 | ENCERRADA |
| DIV-005 | Camadas: `presentation` importa `infrastructure` nos módulos; teste arquitetural não cobre `src/modules/**` | ADR-002; Quality Gate de arquitetura | DECIDIDA |
| DIV-006 | Alterações no repositório sem TASK correspondente | Processo; Scope Guard | ENCERRADA |
| DIV-007 | Itens de escopo previstos no planejamento sem TASK e sem decisão de exclusão | Escopo da V1 | ENCERRADA |
| DIV-008 | ADRs `PROPOSED` já refletidos na prática; formato de arquivo dos ADRs | ADRs | ENCERRADA |
| DIV-009 | Rótulo de status oficial do projeto | README | ENCERRADA |
| DIV-010 | Perfis administrativos definitivos não decididos | RBAC; TASK-018/019 | ENCERRADA |
| DIV-011 | Terminologia de Gates e lacunas do AGENTS.md em relação ao Prompt Mestre | Processo | ENCERRADA |

---

## DIV-001 — Dois esquemas incompatíveis de IDs RF/RN/UC

**Situação.** Há dois conjuntos de identificadores com o mesmo prefixo e significados diferentes:

- **Esquema A — catálogo formal original.** Definido no `README.md` até o commit `cc8b7e1` (2026-10-19, "organizacao dos arquivos docs"), que removeu 751 linhas da especificação. Contém RF-001–030, RN-001–020, UC-001–023 e RNF-001–018, com títulos e descrições. A elicitação (`docs/planning/answered-questions.md`) cita IDs com os significados do Esquema A: RN-005, RN-006, RN-011 e RN-012.
- **Esquema B — referências usadas no backlog.** Usado em `TASKS.md` e `docs/TASKS/*.MD`. Não possui catálogo canônico. Algumas definições aparecem dentro das especificações de TASK: RF-031–034 (`TASK018.MD`), RF-035–038 (`TASK019.MD`), RN-015, RN-016 e UC-009 (`TASK017.MD`), e UC-002 e UC-003 (`TASK008.MD`).

**Exemplos de colisão.**

| ID | Esquema A (README original) | Esquema B (uso em TASKS.md) |
| --- | --- | --- |
| RF-009 | Cupons e promoções | Busca/filtros (TASK-008) |
| RF-010 | Checkout | Busca/filtros (TASK-008) |
| RF-013 | Acompanhamento do pedido | Estoque (TASK-009) |
| RF-015 | Estoque | Carrinho (TASK-011) |
| RF-018 | Favoritos | Cupons (TASK-012) |
| RF-020 | Administração de produtos | Checkout (TASK-013) |
| RF-029 | Relatórios operacionais | Avaliações (TASK-017) |
| RF-030 | Integrações externas | Favoritos (TASK-017) |
| RF-031–038 | não existem | Administração (TASK-018/019) |
| UC-002 | Autenticar cliente | Navegar catálogo (TASK-006/008) |
| UC-009 | Processar pagamento | Avaliar e favoritar produto (TASK-017) |
| UC-010 | Criar pedido | Estoque (TASK-009) e administração (TASK-018) |
| RN-004 | Concorrência sem estoque negativo | Variantes/preço (TASK-007) |

**O Esquema B também é inconsistente internamente.** RF-023, RF-024 e RF-026 aparecem na TASK-004, sobre auditoria, privacidade e notificações, e também nas TASK-013, TASK-014 e TASK-015, sobre checkout, pagamentos e pedidos. RF-026 aparece ainda na TASK-020.

**Impacto.**

- A matriz de rastreabilidade `RF → … → TASK` não pode ser validada nos dois sentidos.
- A DoR da TASK-018 exige que "os requisitos RF-031 a RF-034 estejam disponíveis" (`TASK018.MD`). Eles só existem dentro da própria especificação da TASK.

**Alternativas.**

1. Adotar o Esquema A como canônico. Corrigir as referências em `TASKS.md` e `docs/TASKS/*.MD` por uma tabela de mapeamento, alterando as referências das TASKs, não os IDs dos requisitos. Incorporar RF-031–038 como novos IDs, que não colidem com o Esquema A, ou mapeá-los para RF-020–027.
2. Adotar o Esquema B como canônico. Isso exige redefinir IDs que já tinham significado, o que viola a seção 55 do Prompt Mestre. Os IDs do Esquema A teriam de ser marcados `DEPRECATED`, com perda de rastreabilidade histórica da elicitação.
3. Manter os dois esquemas com prefixos distintos, por exemplo renomeando as referências do backlog. Isso também altera IDs já atribuídos.

**Recomendação.** Alternativa 1. O Esquema A é o único catálogo formalmente escrito, é o usado na elicitação, e a correção atinge somente referências.

**Decisão necessária.** Qual esquema é canônico e como tratar RF-031–038.

**Decisão (2026-11-11) — ENCERRADA:** Catálogo original (RF-001–030, RN-001–020, UC-001–023) adotado como oficial. RF-031–038 incorporados como refinamentos administrativos. Criadas RN-021 (favoritos), RN-022 (último `GENERAL_ADMIN`) e RN-023 (um papel por usuário). Referências das TASKs concluídas resolvidas pela tabela "Mapeamento de referências legadas" do `TASKS.md`, sem reescrever o histórico. As TASK-018 a TASK-023 usam IDs oficiais.

## DIV-002 — RNF-010 e RNF-014–017 redefinidos sobre IDs existentes

**Situação.** Em 2026-10-23, durante a TASK-005, o responsável aprovou textos para RNF-010 e RNF-014–017. A premissa registrada foi: "não havia descrições canônicas no repositório" (`answered-questions.md`, "Decisão adicional"). Essas descrições existiam no Esquema A, no histórico do Git:

| ID | Esquema A (original) | Aprovado em 2026-10-23 |
| --- | --- | --- |
| RNF-010 | Integridade de estoque sob compras concorrentes | Disponibilidade mensal de 99% |
| RNF-014 | Falhas críticas observáveis e com alertas | WCAG 2.2 AA |
| RNF-015 | Observância à LGPD | Responsividade de 360 px até desktop |
| RNF-016 | Testes automatizados proporcionais ao risco | p95 de APIs ≤ 2 s; páginas ≤ 3 s |
| RNF-017 | Separação entre apresentação, aplicação, domínio e infraestrutura | Duas últimas versões de Chrome, Edge, Firefox e Safari |

Além disso, os novos textos sobrepõem RNF-001, RNF-002 e RNF-003 do Esquema A (responsividade, acessibilidade e desempenho).

**Impacto.** Os requisitos de concorrência de estoque, LGPD, testes e camadas perderam seus IDs na prática. TASK-021 e TASK-022 validam RNFs por ID.

**Alternativas.**

1. Manter as decisões de 2026-10-23 e reatribuí-las a IDs livres (RNF-019 em diante), restaurando os textos originais.
2. Manter as decisões nos IDs atuais e marcar os textos originais como `DEPRECATED`. Isso viola a seção 55.
3. Fundir as decisões nos RNF-001–003 originais, que tratam dos mesmos temas, como critérios mensuráveis.

**Recomendação.** Alternativa 3 para responsividade, acessibilidade e desempenho, que já existiam como RNF-001–003. Alternativa 1 para disponibilidade e compatibilidade de navegadores, que não existiam.

**Decisão necessária.** Como reconciliar os IDs. O conteúdo aprovado não está em questão.

**Decisão (2026-11-11) — ENCERRADA:** Textos originais de RNF-001–018 restaurados. As definições de 2026-10-23 passaram, sem mudança de conteúdo, para RNF-019 (disponibilidade), RNF-020 (WCAG 2.2 AA), RNF-021 (responsividade), RNF-022 (desempenho) e RNF-023 (compatibilidade).

## DIV-003 — Dois esquemas incompatíveis de IDs PD

**Situação.**

- O `README.md` original define PD-001–027 (por exemplo, PD-009 = política de reembolso; PD-018 = banco de dados e infraestrutura).
- O `docs/planning/development-plan.md` define PD-001–014 (por exemplo, PD-009 = stack tecnológica).
- A TASK-002 adotou explicitamente o esquema do `development-plan.md` (PD-009–011).

**Impacto.** Referências a PDs são ambíguas, e novos PDs não podem ser numerados sem risco de colisão.

**Alternativas.**

1. Adotar o esquema do `development-plan.md`, que é o usado pelo backlog. Os PD-015–027 do README original, cujos temas não estão cobertos, ganhariam novos IDs a partir de PD-028.
2. Adotar o esquema do README original e corrigir as referências da TASK-002.

**Recomendação.** Alternativa 1, porque o backlog executado já o referencia.

**Enquanto não houver decisão,** o `README.md` lista os PD do `development-plan.md` e registra os novos temas abertos neste documento, sem criar novos PDs.

**Decisão (2026-11-11) — ENCERRADA:** Esquema PD-001–014 do `development-plan.md` adotado como oficial. Novas pendências começam em PD-028.

## DIV-004 — Escopo formal do PostgreSQL

**Situação.**

- O ADR-003 (ACCEPTED) diz que PostgreSQL "permanece candidato, sem seleção formal". O aditivo de 2026-10-22 aprova o PostgreSQL local somente para identidade, sessões e tokens da TASK-003.
- `docs/architecture/infrastructure-baseline.md` registrava "persistência comercial fora de escopo e `PENDING_APPROVAL`".
- No código, as migrations 003–012 usam PostgreSQL para catálogo, estoque, carrinho, promoções, cupons, checkout, pedidos, pagamentos, avaliações e favoritos. O `ALLOWED_CHANGES` das TASK-006 a TASK-017 autorizava "persistência/migrations" e as TASKs foram aceitas.

**Correção já aplicada sem decidir.** `overview.md` e `infrastructure-baseline.md` passaram a descrever o uso efetivo e remetem a esta divergência.

**Decisão necessária.** Formalizar, por aditivo ao ADR-003 ou por novo ADR, o PostgreSQL como banco transacional de todos os módulos no ambiente local. Hospedagem continua pendente.

**Decisão (2026-11-11) — ENCERRADA:** Aditivo ao ADR-003 formaliza o PostgreSQL local como banco transacional de todos os módulos.

## DIV-005 — Dependências entre camadas nos módulos

**Situação.**

- O ADR-002 e o `docs/architecture/overview.md` determinam que "a apresentação pode chamar apenas casos de uso da aplicação". As convenções do README diziam que "as demais camadas não dependem" da infraestrutura.
- No código, 10 arquivos em `src/modules/*/presentation/` importam `../infrastructure/*` para instanciar repositórios. São os módulos cart, catalog, checkout, favorites, inventory, orders, payments, promotions e reviews.
- O módulo `checkout` não possui camada `application`: os Route Handlers chamam o repositório PostgreSQL diretamente. O módulo `shipping` não possui `domain`, e sua infraestrutura importa `checkout/domain`.
- `tests/architecture/layer-dependencies.test.ts` verifica somente arquivos cujo primeiro segmento de caminho é `domain`, `application`, `presentation` ou `infrastructure`. O código em `src/modules/**` **não é verificado**, então o teste passa sem cobrir os módulos.

**Impacto.** A conformidade com o ADR-002 declarada nos checkpoints não está garantida por teste. Há risco de regras comerciais acopladas à persistência no checkout.

**Alternativas.**

1. Aceitar a apresentação como *composition root* (instanciação de adaptadores), registrar a exceção em ADR e ampliar o teste para `src/modules/**` com essa exceção.
2. Mover a composição para outro ponto e criar a camada `application` do checkout (refatoração; exige TASK própria).
3. Somente ampliar o teste (ele falhará até a refatoração).

**Recomendação.** Alternativa 1 como decisão arquitetural, mais uma TASK técnica para a camada `application` do checkout.

**Decisão necessária.** Escolher a alternativa. Qualquer mudança de código está fora do escopo desta sincronização.

**Decisão (2026-11-11) — DECIDIDA:** ADR-020 aceito: a apresentação pode instanciar adaptadores de infraestrutura, sem regra de negócio nem SQL. A ampliação do teste arquitetural a `src/modules/**` fica na TASK-021. A ausência da camada `application` no checkout é dívida técnica aceita, registrada na TASK-022. Encerra quando a TASK-021 estiver `DONE`.

## DIV-006 — Alterações sem TASK correspondente

**Situação.**

- Os commits `783b106` e `df4777e` (2026-11-05) adicionaram `Dockerfile`, `docker-compose.yml`, `.dockerignore` e uma seção no README. Não há TASK nem identificador `[TASK-xxx]`.
- O commit `77a8d93` corrigiu a rota de avaliações (`[productId]` para `[id]`, sem mudar a URL pública) com a marca `[TASK-017]`, depois da TASK-017 estar `DONE`, sem registro em `TASKS.md`.
- A presente sincronização documental também não é uma TASK do backlog.

**Decisão necessária.** Como classificar essas alterações. Por exemplo: criar TASKs retroativas, registrá-las como manutenção aprovada fora do backlog ou revertê-las. Também é preciso definir se o `AGENTS.md` deve prever trabalho de manutenção sem TASK.

**Registro operacional:** a seção "Alterações fora do backlog" do `TASKS.md`.

**Decisão (2026-11-11) — ENCERRADA:** Commits de Docker e da rota de avaliações aceitos como manutenção. A regra "Manutenção fora de TASK" foi incluída no `AGENTS.md`.

## DIV-007 — Itens de escopo sem TASK e sem decisão de exclusão

Os itens abaixo aparecem no README original, no `development-plan.md` ou nos dois. Não há TASK que os implemente nem decisão que os exclua da V1:

| Item | Origem | Situação |
| --- | --- | --- |
| Imagens de produto e armazenamento de arquivos | README original (RF-006), Rodada 13 | Excluídas da TASK-006; provedor, limites e formatos pendentes |
| Importação CSV de catálogo | `development-plan.md` (PHASE-04) | Sem TASK |
| Painel básico de vendas / relatórios operacionais | README original (RF-029), `development-plan.md` | TASK-018 cita "visão operacional", sem definição |
| Alerta de estoque mínimo | `development-plan.md` (PHASE-05), Rodada 4 | Sem decisão |
| Cancelamento, devolução, troca e reembolso | README original (RN-020), Rodada 7 | Pendente; excluídos explicitamente das TASK-013 a TASK-015 |
| Estados de pedido além de `PAYMENT_CONFIRMED` (separação, envio, entrega) | ADR-009, Rodada 7 | Pendente; nenhuma TASK planejada cria essas transições |
| Integração logística real e rastreamento externo | `development-plan.md` (PHASE-08), ADR-010 | Sem TASK; só a cotação local fixa existe |
| Edição de perfil do cliente | README original (RF-002), Rodada 2 | Excluída da TASK-003; sem TASK posterior |
| Confirmação de e-mail | `development-plan.md` (escopo) | Não exigida pela TASK-003 (ADR-012); falta decisão para a V1 |
| Exclusão de conta, anonimização, retenção e consentimento (LGPD) | Rodada 12 | Pendente |
| Gateway de pagamento real | ADR-008 | Pendente; só existe o mock local |
| Rate limiting / proteção contra tentativas abusivas | README original (segurança), ADR-012 | Não implementado; sem TASK específica |

**Decisão necessária.** Para cada item: incluir na V1 (e criar TASK) ou declarar fora de escopo.

**Decisão (2026-11-11) — ENCERRADA:** Fora da V1: importação CSV, painel de vendas e relatórios, alerta de estoque mínimo, cancelamento/devolução/troca/reembolso, estados de pedido posteriores a `PAYMENT_CONFIRMED`, logística e gateway reais, confirmação de e-mail, edição de perfil, exclusão de conta e anonimização, imagens de produto e interface administrativa. Rate limiting fica como risco aceito, com limitador opcional no login na TASK-021. **Exceção à recomendação R8:** a V1 terá telas de produto, carrinho, checkout e pedidos (TASK-023).

## DIV-008 — ADRs

**Situação.**

- ADR-013 (assíncrono), ADR-015 (testes por camada), ADR-016 (web responsiva), ADR-017 (configuração comercial) e ADR-018 (versionamento de contratos) estão `PROPOSED`. Na prática, o projeto já segue o ADR-015, e o ADR-016 é coerente com a decisão de responsividade de 2026-10-23.
- O ADR-001 ainda diz que "linguagem, framework e hospedagem continuam pendentes", mas o framework foi decidido no ADR-019. Foi acrescentada uma nota de referência cruzada, sem alterar a decisão.
- O Prompt Mestre prevê um arquivo por ADR (`docs/adr/ADR-xxx-titulo.md`). O projeto usa um único `docs/adr/ADRs.md`, que é a estrutura prevista no `development-plan.md`.

**Decisão necessária.** O status de cada ADR `PROPOSED` e se o arquivo único deve ser mantido ou dividido.

**Decisão (2026-11-11) — ENCERRADA:** ADR-015 e ADR-016 aceitos. ADR-013, ADR-017 e ADR-018 mantidos `PROPOSED` e adiados para depois da V1. Mantido o arquivo único `ADRs.md`.

## DIV-009 — Status oficial do projeto

**Situação.**

- O `README.md` original e o `development-plan.md` declaram "PLANEJAMENTO EM DEFINIÇÃO". O `development-plan.md` ainda diz que "nenhuma TASK de implementação [está] autorizada".
- O Prompt Mestre prevê "PLANEJAMENTO APROVADO" após aprovação.
- Na realidade, 17 TASKs foram executadas, mas não foi localizado um registro explícito de aprovação do planejamento.

**Decisão necessária.** O rótulo oficial (por exemplo, "PLANEJAMENTO APROVADO — EM IMPLEMENTAÇÃO") e a data de aprovação, se houver.

**Decisão (2026-11-11) — ENCERRADA:** Status "PLANEJAMENTO APROVADO — EM IMPLEMENTAÇÃO", com aprovação implícita em 2026-10-21 (início da TASK-001).

## DIV-010 — Perfis administrativos

**Situação.**

- A Rodada 11 da elicitação está sem resposta.
- O código possui somente os papéis `CUSTOMER`, `GENERAL_ADMIN` e `CATALOG_MANAGER`.
- O README original lista também Gestor de estoque, Atendimento e Financeiro como candidatos.
- A TASK-018 (administração de clientes e pedidos) e a TASK-019 (usuários administrativos) dependem dessa definição. A FORBIDDEN_CHANGES da TASK-019 proíbe "criação de novos papéis sem decisão".

**Decisão necessária.** Quais perfis existem na V1, se um usuário pode ter vários papéis e se o último `GENERAL_ADMIN` pode ser desativado.

**Decisão (2026-11-11) — ENCERRADA:** Somente `CUSTOMER`, `GENERAL_ADMIN` e `CATALOG_MANAGER`; um papel por usuário (RN-023); proteção do último `GENERAL_ADMIN` (RN-022). Clientes, moderação e usuários administrativos são exclusivos de `GENERAL_ADMIN`. Aditivo registrado no ADR-011.

## DIV-011 — Gates e lacunas do AGENTS.md

**Situação.**

- O `TASKS.md` registra "GATE-001 a GATE-006" como etapas do fluxo de prompts em `prompts/tasks/` (recontextualização, planejamento, implementação, revisão, testes manuais e conclusão). O `AGENTS.md` e o Prompt Mestre usam "Quality Gates" GATE-01–08 (Build, Lint, Unit, Integration, API, Security, Acceptance, Regression). Os nomes são parecidos e os significados, diferentes.
- O `AGENTS.md` não contém a exceção de execução contínua mediante autorização explícita (seção 51 do Prompt Mestre).
- O `AGENTS.md` também não define regras para trabalho de manutenção fora de uma TASK (ver DIV-006).

**Decisão necessária.** Renomear ou documentar as etapas do fluxo de prompts e decidir se o `AGENTS.md` deve ser complementado. O `AGENTS.md` não foi alterado nesta sincronização.

**Decisão (2026-11-11) — ENCERRADA:** Etapas de prompts passam a ser chamadas de ETAPA-001–006 nos novos registros. O `AGENTS.md` recebeu as seções "Execução contínua autorizada" e "Manutenção fora de TASK".

