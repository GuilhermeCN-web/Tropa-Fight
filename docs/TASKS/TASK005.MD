# TASK-005 — Checkpoint PHASE-01

 ## 1\. Identificação

 - **ID:** TASK-005
- **Título:** Checkpoint PHASE-01
- **Status:** BLOCKED
- **Phase:** PHASE-01
- **Priority:** HIGH
- **Tipo:** Quality Gate / Architecture Review / Security Validation / Release Checkpoint
- **Dependências:** TASK-002, TASK-003, TASK-004
- **Próxima fase:** PHASE-02
- **Relacionados:** RNF-001–018, ADR-001–004

---

 # 2\. Objetivo

 Validar formalmente se a fundação técnica da PHASE-01 está suficientemente consistente para permitir o início da PHASE-02.

 O checkpoint deve verificar:

 - arquitetura;
- compilação;
- lint;
- testes;
- autenticação;
- autorização;
- auditoria;
- privacidade;
- notificações;
- configuração;
- infraestrutura;
- observabilidade base;
- decisões arquiteturais;
- rastreabilidade;
- segurança;
- documentação operacional.

 Esta TASK **não implementa novas funcionalidades comerciais**.

 Seu objetivo é responder:

 > A fundação construída na PHASE-01 atende aos critérios mínimos aprovados para que o desenvolvimento da PHASE-02 possa começar com segurança e rastreabilidade?

---

 # 3\. Resultado esperado

 Ao final desta TASK deve existir uma decisão formal:

```
PHASE-01
   ↓
Quality Gates
   ↓
┌──────────────────────────────┐
│ PASS                         │
│ PASS WITH ACCEPTED PENDENCY  │
│ BLOCKED                      │
└──────────────────────────────┘
```

 Somente `PASS` ou `PASS WITH ACCEPTED PENDENCY`, conforme as regras de governança do projeto, poderá tornar a PHASE-02 elegível.

 Pendências críticas não podem ser simplesmente ignoradas.

---

 # 4\. Dependências

```
TASK-001
   ↓
TASK-002
   ↓
TASK-003
   ↓
TASK-004
   ↓
TASK-005
   ↓
PHASE-02
```

 As quatro tasks anteriores devem possuir evidências suficientes para avaliação.

---

 # 5\. Condição para início

 Antes de iniciar o checkpoint:

 - [ ] TASK-001 concluída.
- [ ] TASK-002 concluída ou com pendências formalmente aceitas.
- [ ] TASK-003 concluída.
- [ ] TASK-004 concluída.
- [ ] Build executável.
- [ ] Testes automatizados disponíveis.
- [ ] Configuração de qualidade funcionando.
- [ ] ADRs aplicáveis disponíveis.
- [ ] Documentação mínima atualizada.
- [ ] Rastreabilidade disponível.
- [ ] Nenhuma alteração comercial necessária para concluir a PHASE-01.

---

 # 6\. Escopo

 ## Incluído

 - validação da arquitetura;
- validação dos ambientes;
- validação da configuração;
- validação da qualidade;
- validação da autenticação;
- validação do RBAC;
- validação da auditoria;
- validação da privacidade;
- validação da abstração de notificações;
- validação dos testes;
- validação dos ADRs;
- validação dos requisitos RNF;
- análise de riscos;
- análise de pendências;
- atualização da rastreabilidade;
- correções estritamente necessárias para fechar a PHASE-01.

---

 # 7\. Fora do escopo

 Não implementar:

 - catálogo;
- categorias;
- marcas;
- variantes;
- preços comerciais;
- estoque comercial;
- carrinho;
- checkout;
- pagamentos;
- pedidos;
- promoções;
- cupons;
- avaliações;
- wishlist;
- funcionalidades administrativas comerciais;
- integrações externas comerciais;
- novas funcionalidades de PHASE-02;
- mudanças arquiteturais grandes sem ADR/aprovação.

---

 # 8\. ALLOWED\_CHANGES

 Permitido:

```
tests/**
docs/**
docs/adr/**
docs/architecture/**
configuração de qualidade
configuração de ambiente
correções de segurança
correções de arquitetura
correções de testes
correções necessárias da PHASE-01
TASKS.md
```

 Também são permitidas correções em `src/**` quando forem estritamente necessárias para resolver problemas encontrados no checkpoint da PHASE-01.

---

 # 9\. FORBIDDEN\_CHANGES

 Proibido:

 - iniciar catálogo;
- criar Product;
- criar Category;
- criar Brand;
- criar ProductVariant;
- implementar estoque comercial;
- criar carrinho;
- criar checkout;
- integrar pagamento;
- criar pedidos;
- implementar promoções;
- adicionar funcionalidades comerciais;
- alterar requisitos para fazer o checkpoint passar;
- remover testes para reduzir falhas;
- desabilitar lint;
- ignorar erros de segurança;
- mascarar falhas;
- introduzir bypass de autorização;
- mudar arquitetura sem decisão registrada;
- marcar pendência crítica como resolvida sem evidência.

---

 # 10\. Princípio do checkpoint

 O checkpoint não deve perguntar:

 > "O sistema já possui funcionalidades suficientes?"

 Deve perguntar:

 > "A fundação técnica está pronta para suportar as próximas funcionalidades sem criar dívida arquitetural ou riscos conhecidos não tratados?"

---

 # 11\. Quality Gate geral

 O resultado deve ser consolidado em:

```
BUILD                 PASS / FAIL
LINT                  PASS / FAIL
TYPECHECK             PASS / FAIL
UNIT TESTS            PASS / FAIL
INTEGRATION TESTS     PASS / FAIL
API TESTS             PASS / FAIL
SECURITY              PASS / FAIL
AUTHORIZATION         PASS / FAIL
PRIVACY               PASS / FAIL
AUDIT                 PASS / FAIL
NOTIFICATIONS         PASS / FAIL
INFRASTRUCTURE        PASS / FAIL
OBSERVABILITY         PASS / FAIL
ARCHITECTURE          PASS / FAIL
DOCUMENTATION         PASS / FAIL
TRACEABILITY          PASS / FAIL
SCOPE CONTROL         PASS / FAIL
```

---

 # 12\. Gate 01 — Build

 Executar o build oficial do projeto.

 Exemplo:

```
npm run build
```

 ou comando equivalente definido no TASK-001.

 Critérios:

 - [ ] build termina sem erro;
- [ ] nenhuma dependência ausente;
- [ ] nenhum erro de compilação;
- [ ] artefato esperado é produzido;
- [ ] build é reproduzível.

 Resultado:

```
BUILD: PASS / FAIL
```

---

 # 13\. Gate 02 — Lint

 Executar o lint oficial.

 Exemplo:

```
npm run lint
```

 Critérios:

 - [ ] lint passa;
- [ ] nenhuma regra foi desabilitada apenas para o checkpoint;
- [ ] warnings críticos foram avaliados;
- [ ] configuração permanece versionada.

 Resultado:

```
LINT: PASS / FAIL
```

---

 # 14\. Gate 03 — Type Check

 Executar verificação de tipos, quando aplicável.

 Exemplo:

```
npm run typecheck
```

 Critérios:

 - [ ] sem erros;
- [ ] sem uso indevido de `any` ou equivalente;
- [ ] contratos principais consistentes;
- [ ] interfaces entre camadas compatíveis.

 Resultado:

```
TYPECHECK: PASS / FAIL
```

---

 # 15\. Gate 04 — Testes unitários

 Executar todos os testes unitários da PHASE-01.

 Critérios:

 - [ ] todos passam;
- [ ] testes não foram desabilitados;
- [ ] cobertura mínima aprovada é atingida;
- [ ] testes críticos existem;
- [ ] falhas conhecidas possuem registro.

 Resultado:

```
UNIT TESTS: PASS / FAIL

Total:
Passed:
Failed:
Skipped:
Coverage:
```

---

 # 16\. Gate 05 — Testes de integração

 Validar integração entre:

 - Application;
- Domain;
- Infrastructure;
- persistência;
- autenticação;
- autorização;
- auditoria;
- notificações.

 Critérios:

 - [ ] integração funciona;
- [ ] persistência funciona;
- [ ] transações relevantes funcionam;
- [ ] erros são tratados;
- [ ] não existem dependências externas inesperadas.

 Resultado:

```
INTEGRATION: PASS / FAIL
```

---

 # 17\. Gate 06 — API

 Validar os endpoints existentes da PHASE-01.

 Verificar:

 - [ ] autenticação;
- [ ] logout;
- [ ] recuperação de acesso;
- [ ] perfil;
- [ ] autorização;
- [ ] recursos administrativos;
- [ ] auditoria;
- [ ] respostas de erro;
- [ ] validação de entrada.

 Não devem existir endpoints comerciais antecipados.

---

 # 18\. Gate 07 — Autenticação

 Validar TASK-003.

 Checklist:

 - [ ] cadastro funciona;
- [ ] login funciona;
- [ ] logout funciona;
- [ ] sessão/token funciona conforme arquitetura;
- [ ] recuperação de acesso funciona;
- [ ] senha nunca é armazenada em texto puro;
- [ ] credenciais inválidas são rejeitadas;
- [ ] fluxo de autenticação possui testes;
- [ ] erros não expõem informações sensíveis.

 Resultado:

```
AUTHENTICATION: PASS / FAIL
```

---

 # 19\. Gate 08 — Autorização

 Validar RBAC e ownership.

 Testar:

```
Anonymous
   ↓
Protected resource
   ↓
DENIED
```

```
Customer
   ↓
Admin resource
   ↓
DENIED
```

```
Admin without permission
   ↓
Restricted resource
   ↓
DENIED
```

```
Authorized Admin
   ↓
Restricted resource
   ↓
ALLOWED
```

 Critérios:

 - [ ] autorização é verificada no backend;
- [ ] permissões não dependem somente da UI;
- [ ] recursos administrativos estão protegidos;
- [ ] ownership está validado;
- [ ] testes negativos existem.

 Resultado:

```
AUTHORIZATION: PASS / FAIL
```

---

 # 20\. Gate 09 — Auditoria

 Validar TASK-004.

 Checklist:

 - [ ] ações críticas identificadas;
- [ ] AuditLog funciona;
- [ ] actor é registrado quando aplicável;
- [ ] resource é registrado quando aplicável;
- [ ] resultado é registrado;
- [ ] timestamp existe;
- [ ] correlationId existe quando aplicável;
- [ ] acesso aos logs é protegido;
- [ ] logs não podem ser manipulados por usuários;
- [ ] dados sensíveis são sanitizados;
- [ ] senha não aparece;
- [ ] tokens não aparecem;
- [ ] secrets não aparecem.

 Resultado:

```
AUDIT: PASS / FAIL
```

---

 # 21\. Gate 10 — Privacidade

 Verificar:

 - [ ] minimização;
- [ ] acesso por autorização;
- [ ] responses apropriadas;
- [ ] dados pessoais protegidos;
- [ ] dados sensíveis protegidos;
- [ ] logs sanitizados;
- [ ] não existe coleta desnecessária;
- [ ] retenção está documentada;
- [ ] decisões ainda pendentes estão explícitas.

 Não considerar "privacidade aprovada" como equivalente a uma análise jurídica.

 O checkpoint deve verificar apenas os requisitos técnicos aprovados.

---

 # 22\. Gate 11 — Notificações

 Validar a abstração criada na TASK-004.

 Checklist:

 - [ ] contrato definido;
- [ ] adapter desacoplado;
- [ ] mock disponível;
- [ ] eventos definidos;
- [ ] payload sanitizado;
- [ ] falhas tratadas;
- [ ] provider real não é obrigatório;
- [ ] nenhum segredo é transmitido;
- [ ] nenhum provider não aprovado foi integrado.

 Resultado:

```
NOTIFICATIONS: PASS / FAIL
```

---

 # 23\. Gate 12 — Infraestrutura

 Validar TASK-002.

 Checklist:

 - [ ] ambientes documentados;
- [ ] configuração documentada;
- [ ] variáveis necessárias documentadas;
- [ ] segredos não estão no repositório;
- [ ] estratégia de backup documentada;
- [ ] restore documentado;
- [ ] RPO documentado ou marcado como PENDING;
- [ ] RTO documentado ou marcado como PENDING;
- [ ] monitoramento definido;
- [ ] recuperação documentada;
- [ ] decisões de providers registradas;
- [ ] decisões pendentes explicitamente registradas.

---

 # 24\. Gate 13 — Configuração

 Validar:

```
Development
Test
Staging/Homologation
Production
```

 quando esses ambientes já estiverem aprovados.

 Verificar:

 - [ ] configuração não contém secrets;
- [ ] `.env` local não é commitado indevidamente;
- [ ] exemplos de configuração existem;
- [ ] valores obrigatórios estão documentados;
- [ ] diferenças entre ambientes estão claras;
- [ ] defaults inseguros não são usados em produção.

---

 # 25\. Gate 14 — Secrets

 Procurar:

 - [ ] passwords;
- [ ] API keys;
- [ ] access tokens;
- [ ] private keys;
- [ ] database credentials;
- [ ] payment credentials;
- [ ] notification provider credentials.

 Nenhum segredo real deve estar versionado.

 Resultado:

```
SECRETS SCAN: PASS / FAIL
```

---

 # 26\. Gate 15 — Banco de dados

 Validar a persistência criada na PHASE-01.

 Checklist:

 - [ ] schema consistente;
- [ ] migrations reproduzíveis;
- [ ] constraints adequadas;
- [ ] índices necessários;
- [ ] relacionamentos consistentes;
- [ ] dados sensíveis protegidos;
- [ ] seed de desenvolvimento não contém dados reais;
- [ ] reset do ambiente de teste funciona.

---

 # 27\. Gate 16 — Arquitetura

 Validar separação:

```
Presentation
     ↓
Application
     ↓
Domain
     ↑
Infrastructure
```

 ou o modelo oficialmente aprovado.

 Verificar:

 - [ ] Domain não depende de Infrastructure;
- [ ] regras de negócio não estão em controllers;
- [ ] Presentation não acessa banco diretamente;
- [ ] Application coordena casos de uso;
- [ ] Infrastructure implementa adapters;
- [ ] dependências respeitam ADRs.

---

 # 28\. Gate 17 — Dependências

 Verificar:

 - [ ] dependências necessárias estão declaradas;
- [ ] dependências não utilizadas são avaliadas;
- [ ] versões são reproduzíveis;
- [ ] lockfile está presente quando aplicável;
- [ ] não existem dependências externas não aprovadas;
- [ ] dependências críticas possuem justificativa.

---

 # 29\. Gate 18 — ADRs

 Validar:

 - ADR-001;
- ADR-002;
- ADR-003;
- ADR-004.

 Para cada ADR:

 | ADR | Registrado | Implementado | Validado | Pendente |
| --- | --- | --- | --- | --- |
| ADR-001 | \[ \] | \[ \] | \[ \] | \[ \] |
| ADR-002 | \[ \] | \[ \] | \[ \] | \[ \] |
| ADR-003 | \[ \] | \[ \] | \[ \] | \[ \] |
| ADR-004 | \[ \] | \[ \] | \[ \] | \[ \] |

Uma decisão importante não deve existir apenas em conversa ou conhecimento informal.

---

 # 30\. Gate 19 — Observabilidade

 Validar o que já foi aprovado para a PHASE-01.

 Checklist:

 - [ ] erros relevantes são identificáveis;
- [ ] logs técnicos existem;
- [ ] correlationId disponível quando necessário;
- [ ] health check básico funciona;
- [ ] informações sensíveis não aparecem;
- [ ] logs são úteis para diagnóstico;
- [ ] comportamento de falhas está documentado.

 Não antecipar toda a implementação da TASK-020.

---

 # 31\. Gate 20 — Backup

 Validar estratégia documentada.

 Checklist:

 - [ ] backup definido;
- [ ] frequência definida ou PENDING;
- [ ] retenção definida ou PENDING;
- [ ] armazenamento definido;
- [ ] restauração documentada;
- [ ] teste de restore definido;
- [ ] responsáveis definidos;
- [ ] limitações conhecidas registradas.

---

 # 32\. Gate 21 — Restore

 Quando possível, executar teste real no ambiente aprovado.

 Fluxo:

```
Backup
   ↓
Restore
   ↓
Application Start
   ↓
Health Check
   ↓
Data Validation
```

 Resultado:

```
RESTORE TEST: PASS / FAIL / NOT_EXECUTED
```

 Se não for possível executar, registrar motivo.

 Não declarar restore como validado apenas porque existe documentação.

---

 # 33\. Gate 22 — Segurança

 Executar validações mínimas:

 - [ ] autenticação;
- [ ] autorização;
- [ ] sessão;
- [ ] proteção de credenciais;
- [ ] proteção de secrets;
- [ ] sanitização de logs;
- [ ] validação de inputs;
- [ ] tratamento de erros;
- [ ] proteção de endpoints administrativos;
- [ ] acesso indevido bloqueado.

---

 # 34\. Gate 23 — Segurança negativa

 Testar explicitamente o que **não pode** acontecer.

 Exemplos:

```
Customer → Admin API = DENIED

Anonymous → Protected API = DENIED

Wrong role → Restricted operation = DENIED

Invalid credential → Login = DENIED

Invalid token → Protected resource = DENIED

User A → User B resource = DENIED
```

---

 # 35\. Gate 24 — Regressão

 Executar toda a suíte criada nas TASKS anteriores.

 Objetivo:

 > Uma correção introduzida durante o checkpoint não pode quebrar a fundação existente.

 Checklist:

 - [ ] TASK-001 tests;
- [ ] TASK-003 tests;
- [ ] TASK-004 tests;
- [ ] integration;
- [ ] API;
- [ ] security;
- [ ] authorization.

---

 # 36\. Gate 25 — Documentação

 Validar:

 - [ ] README;
- [ ] setup local;
- [ ] comandos;
- [ ] configuração;
- [ ] ambientes;
- [ ] arquitetura;
- [ ] ADRs;
- [ ] testes;
- [ ] troubleshooting básico;
- [ ] backup/restore;
- [ ] decisões pendentes.

---

 # 37\. Gate 26 — Reprodução local

 Uma máquina limpa deve conseguir, conforme o ambiente definido:

```
clone
  ↓
install
  ↓
configure
  ↓
database
  ↓
migrate
  ↓
test
  ↓
lint
  ↓
build
  ↓
run
```

 Sem depender de conhecimento informal da equipe.

---

 # 38\. Comandos oficiais

 Documentar os comandos reais utilizados:

```
# instalação
<COMMAND>

# desenvolvimento
<COMMAND>

# lint
<COMMAND>

# typecheck
<COMMAND>

# testes
<COMMAND>

# testes de integração
<COMMAND>

# build
<COMMAND>

# migrations
<COMMAND>

# seed
<COMMAND>

# aplicação
<COMMAND>
```

 Os placeholders devem ser substituídos pelos comandos oficiais do projeto.

---

 # 39\. Rastreabilidade

 Criar matriz:

 | Requisito | TASK | Implementado | Testado | Evidência | Status |
| --- | --- | --- | --- | --- | --- |
| RNF-001 | TASK-001 | \[ \] | \[ \] | \[ \] |  |
| RNF-002 | TASK-001 | \[ \] | \[ \] | \[ \] |  |
| RNF-003 | TASK-003/004 | \[ \] | \[ \] | \[ \] |  |
| RNF-004 | TASK-003 | \[ \] | \[ \] | \[ \] |  |
| RNF-005 | TASK-003 | \[ \] | \[ \] | \[ \] |  |
| RNF-006 | TASK-004 | \[ \] | \[ \] | \[ \] |  |
| RNF-007 | TASK-004 | \[ \] | \[ \] | \[ \] |  |
| RNF-008 | TASK-004 | \[ \] | \[ \] | \[ \] |  |
| RNF-009 | PHASE posterior | \[ \] | \[ \] | \[ \] | N/A |
| RNF-010 | Conforme matriz | \[ \] | \[ \] | \[ \] |  |
| RNF-011 | TASK-002 | \[ \] | \[ \] | \[ \] |  |
| RNF-012 | TASK-002 | \[ \] | \[ \] | \[ \] |  |
| RNF-013 | TASK-001 | \[ \] | \[ \] | \[ \] |  |
| RNF-014 | Conforme matriz | \[ \] | \[ \] | \[ \] |  |
| RNF-015 | Conforme matriz | \[ \] | \[ \] | \[ \] |  |
| RNF-016 | Conforme matriz | \[ \] | \[ \] | \[ \] |  |
| RNF-017 | Conforme matriz | \[ \] | \[ \] | \[ \] |  |
| RNF-018 | TASK-002 | \[ \] | \[ \] | \[ \] |  |

A matriz definitiva deve ser compatível com os requisitos oficiais do projeto.

---

 # 40\. Rastreabilidade de ADR

 | ADR | Decisão | Implementação | Evidência |
| --- | --- | --- | --- |
| ADR-001 | \[ \] | \[ \] | \[ \] |
| ADR-002 | \[ \] | \[ \] | \[ \] |
| ADR-003 | \[ \] | \[ \] | \[ \] |
| ADR-004 | \[ \] | \[ \] | \[ \] |

---

 # 41\. Controle de escopo

 Verificar alterações introduzidas durante PHASE-01.

 Classificar:

```
ALLOWED
OUT_OF_SCOPE
REQUIRES_APPROVAL
```

 Nenhuma alteração `OUT_OF_SCOPE` deve ser incorporada para fechar o checkpoint.

---

 # 42\. Auditoria de mudanças

 Para cada correção feita durante o checkpoint:

```
Change ID:
Arquivo:
Motivo:
Problema:
Impacto:
Testes:
Relacionado a:
Status:
```

 Exemplo:

```
CHG-001

Arquivo:
src/...

Motivo:
Falha de autorização encontrada.

Impacto:
Admin endpoint permitia acesso indevido.

Correção:
Permission check adicionado.

Testes:
Authorization suite.

Status:
DONE
```

---

 # 43\. Gestão de bloqueios

 Todo bloqueio deve possuir:

```
BLOCKER-ID
Descrição
Impacto
Origem
Responsável
Decisão necessária
Prazo
Status
```

 Exemplo:

```
BLOCKER-001

Descrição:
Provider de infraestrutura ainda não aprovado.

Impacto:
Ambiente de produção não pode ser definido.

Status:
PENDING APPROVAL
```

---

 # 44\. Classificação de pendências

 Classificar como:

 ### CRITICAL

 Impede passagem.

 Exemplos:

 - vulnerabilidade crítica;
- autenticação quebrada;
- autorização quebrada;
- build quebrado;
- corrupção de dados;
- arquitetura incompatível.

 ### HIGH

 Normalmente impede passagem, salvo decisão formal.

 ### MEDIUM

 Pode ser aceito somente se não comprometer requisitos ou segurança.

 ### LOW

 Pode ser registrado para backlog.

---

 # 45\. Regra para pendências

 Nenhuma pendência deve ser ocultada.

 Usar:

```
OPEN
BLOCKED
ACCEPTED
DEFERRED
RESOLVED
```

 Nunca usar:

```
IGNORE
SKIP
NOT IMPORTANT
```

 como substituto de decisão formal.

---

 # 46\. Matriz de riscos

 | ID | Risco | Severidade | Probabilidade | Mitigação | Status |
| --- | --- | --- | --- | --- | --- |
| RISK-001 | Falha de autorização | CRITICAL |  |  |  |
| RISK-002 | Secret exposto | CRITICAL |  |  |  |
| RISK-003 | Auditoria insuficiente | HIGH |  |  |  |
| RISK-004 | Backup não restaurável | HIGH |  |  |  |
| RISK-005 | Arquitetura acoplada | HIGH |  |  |  |
| RISK-006 | Configuração não reproduzível | HIGH |  |  |  |
| RISK-007 | Testes insuficientes | HIGH |  |  |  |
| RISK-008 | Decisão arquitetural ausente | HIGH |  |  |  |

---

 # 47\. Critérios de aceitação

 ## AC-001 — Build

 **Dado** o código da PHASE-01,

 **Quando** o comando oficial de build for executado,

 **Então** o build deve concluir com sucesso.

---

 ## AC-002 — Lint

 **Dado** o código da PHASE-01,

 **Quando** o lint for executado,

 **Então** não devem existir falhas de lint.

---

 ## AC-003 — Testes

 **Dado** a suíte da PHASE-01,

 **Quando** os testes forem executados,

 **Então** os testes obrigatórios devem passar.

---

 ## AC-004 — Arquitetura

 **Dado** o código da PHASE-01,

 **Quando** as dependências entre camadas forem analisadas,

 **Então** elas devem respeitar a arquitetura aprovada.

---

 ## AC-005 — Autenticação

 **Dado** os fluxos de identidade,

 **Quando** forem executados,

 **Então** autenticação e recuperação devem funcionar conforme os requisitos aprovados.

---

 ## AC-006 — Autorização

 **Dado** um usuário sem permissão,

 **Quando** tentar acessar um recurso protegido,

 **Então** o acesso deverá ser rejeitado.

---

 ## AC-007 — Auditoria

 **Dado** uma operação auditável,

 **Quando** ela ocorrer,

 **Então** deverá existir evidência de auditoria adequada.

---

 ## AC-008 — Privacidade

 **Dado** um fluxo contendo dados pessoais,

 **Quando** ele for executado,

 **Então** somente dados autorizados deverão ser armazenados ou retornados.

---

 ## AC-009 — Secrets

 **Dado** o repositório,

 **Quando** for analisado,

 **Então** nenhum segredo real deverá estar versionado.

---

 ## AC-010 — Infraestrutura

 **Dado** as decisões de infraestrutura da PHASE-01,

 **Quando** forem revisadas,

 **Então** decisões críticas deverão estar documentadas.

---

 ## AC-011 — Backup

 **Dado** a estratégia de backup,

 **Quando** for revisada,

 **Então** backup e restauração deverão estar documentados, testados ou explicitamente marcados como pendentes.

---

 ## AC-012 — Rastreabilidade

 **Dado** os requisitos da PHASE-01,

 **Quando** a matriz de rastreabilidade for analisada,

 **Então** cada requisito aplicável deverá possuir task e evidência correspondente.

---

 ## AC-013 — Escopo

 **Dado** as alterações da PHASE-01,

 **Quando** forem revisadas,

 **Então** nenhuma funcionalidade comercial da PHASE-02 deverá ter sido antecipada.

---

 # 48\. Testes de integração obrigatórios

 Executar pelo menos os fluxos:

 ### Fluxo 01 — Aplicação

```
Start
 ↓
Health Check
 ↓
Ready
```

 ### Fluxo 02 — Autenticação

```
Register
 ↓
Login
 ↓
Authenticated Resource
 ↓
Logout
```

 ### Fluxo 03 — Autorização

```
Customer
 ↓
Admin Resource
 ↓
403
```

 ### Fluxo 04 — Administração

```
Authorized Admin
 ↓
Protected Resource
 ↓
Success
 ↓
AuditLog
```

 ### Fluxo 05 — Privacidade

```
User A
 ↓
User B Resource
 ↓
Denied
```

 ### Fluxo 06 — Notificação

```
Application Event
 ↓
Notification Port
 ↓
Mock Adapter
 ↓
Success
```

---

 # 49\. Testes de regressão críticos

 ### Identidade

 - [ ] cadastro;
- [ ] login;
- [ ] logout;
- [ ] recuperação;
- [ ] sessão;
- [ ] autorização.

 ### Auditoria

 - [ ] criação;
- [ ] consulta;
- [ ] proteção;
- [ ] sanitização.

 ### Privacidade

 - [ ] ownership;
- [ ] response filtering;
- [ ] logging.

 ### Infraestrutura

 - [ ] startup;
- [ ] configuração;
- [ ] database;
- [ ] migrations.

---

 # 50\. Cenários que devem bloquear a PHASE-02

 O checkpoint deve resultar em `BLOCKED` se existir, entre outros:

 - autenticação quebrada;
- autorização bypassável;
- secret real exposto;
- corrupção de dados;
- arquitetura fundamentalmente incompatível;
- build quebrado;
- testes críticos quebrados sem aceitação formal;
- auditoria crítica inexistente;
- dados pessoais expostos indevidamente;
- backup obrigatório inexistente quando exigido;
- decisão arquitetural crítica ausente;
- requisito crítico sem implementação;
- alteração comercial feita fora do escopo.

---

 # 51\. Correções durante o checkpoint

 Correções permitidas devem ser pequenas e diretamente relacionadas à PHASE-01.

 Exemplo:

```
BUG
 ↓
Reprodução
 ↓
Correção mínima
 ↓
Teste
 ↓
Regressão
 ↓
Evidência
```

 Não transformar o checkpoint em uma nova sprint de desenvolvimento.

---

 # 52\. Regra de mudança arquitetural

 Se o checkpoint identificar necessidade de alteração arquitetural:

```
Problema
 ↓
Análise
 ↓
ADR / atualização de ADR
 ↓
Aprovação
 ↓
Implementação
 ↓
Testes
```

 Não realizar uma mudança arquitetural significativa apenas para "fazer o gate passar".

---

 # 53\. Relatório final

 Criar:

```
docs/checkpoints/PHASE-01-CHECKPOINT.md
```

 Conteúdo mínimo:

```
1. Resumo
2. Data
3. Versão/commit
4. Ambiente
5. Gates executados
6. Resultados
7. Testes
8. Segurança
9. Arquitetura
10. Infraestrutura
11. Auditoria
12. Privacidade
13. Pendências
14. Riscos
15. Correções realizadas
16. Rastreabilidade
17. Decisão final
```

---

 # 54\. Modelo do relatório

```
# PHASE-01 CHECKPOINT

## Identificação

Data:
Versão:
Commit:
Responsável:

## Resultado

Status:
PASS / PASS_WITH_ACCEPTED_PENDENCY / BLOCKED

## Quality Gates

Build:
Lint:
Typecheck:
Unit:
Integration:
API:
Security:
Authorization:
Privacy:
Audit:
Notifications:
Infrastructure:
Architecture:
Documentation:
Traceability:

## Pendências

- ...

## Riscos

- ...

## Correções

- ...

## Decisões

- ...

## Rastreabilidade

- ...

## Decisão

PHASE-02:
ELIGIBLE / NOT_ELIGIBLE
```

---

 # 55\. Matriz final de Quality Gates

 | Gate | Resultado | Evidência | Bloqueante |
| --- | --- | --- | --- |
| Build |  |  | Sim |
| Lint |  |  | Sim |
| Typecheck |  |  | Sim |
| Unit |  |  | Sim |
| Integration |  |  | Sim |
| API |  |  | Sim |
| Authentication |  |  | Sim |
| Authorization |  |  | Sim |
| Security |  |  | Sim |
| Privacy |  |  | Sim |
| Audit |  |  | Sim |
| Notifications |  |  | Não/Conforme |
| Infrastructure |  |  | Sim |
| Backup |  |  | Conforme requisito |
| Restore |  |  | Conforme requisito |
| Architecture |  |  | Sim |
| ADRs |  |  | Sim |
| Documentation |  |  | Não/Conforme |
| Traceability |  |  | Sim |
| Scope Control |  |  | Sim |

---

 # 56\. Decisão final

 A decisão deve usar exclusivamente os critérios definidos.

 ## PASS

 Usar quando:

 - gates obrigatórios passaram;
- não existem bloqueios críticos;
- arquitetura está consistente;
- segurança está validada;
- rastreabilidade está completa;
- pendências restantes não impedem o início da PHASE-02.

---

 ## PASS\_WITH\_ACCEPTED\_PENDENCY

 Somente utilizar quando:

 - a pendência estiver formalmente registrada;
- houver responsável;
- houver impacto conhecido;
- houver decisão explícita de aceitação;
- a pendência não comprometer segurança, integridade ou requisito crítico.

---

 ## BLOCKED

 Usar quando:

 - existe bloqueio crítico;
- existe falha de segurança relevante;
- arquitetura não está adequada;
- autenticação/autorização não está confiável;
- testes críticos falham;
- requisito crítico não está implementado;
- decisão essencial ainda não foi tomada;
- infraestrutura necessária não está definida;
- rastreabilidade não pode ser demonstrada.

---

 # 57\. Elegibilidade da PHASE-02

 A PHASE-02 somente se torna elegível quando:

```
TASK-001 = DONE
TASK-002 = DONE / ACCEPTED
TASK-003 = DONE
TASK-004 = DONE
TASK-005 = PASS
```

 Resultado:

```
PHASE-01
    ↓
CHECKPOINT
    ↓
PASS
    ↓
PHASE-02 ELIGIBLE
```

---

 # 58\. Definition of Done

 TASK-005 somente poderá ser marcada como `DONE` quando:

 - [ ] TASK-002 validada.
- [ ] TASK-003 validada.
- [ ] TASK-004 validada.
- [ ] Build passa.
- [ ] Lint passa.
- [ ] Typecheck passa.
- [ ] Testes unitários passam.
- [ ] Testes de integração passam.
- [ ] Testes de API passam.
- [ ] Autenticação validada.
- [ ] Autorização validada.
- [ ] Segurança validada.
- [ ] Privacidade validada.
- [ ] Auditoria validada.
- [ ] Notificações base validadas.
- [ ] Configuração validada.
- [ ] Ambientes documentados.
- [ ] Backup documentado.
- [ ] Restore validado ou pendência formalmente registrada.
- [ ] ADRs revisados.
- [ ] Arquitetura validada.
- [ ] Secrets verificados.
- [ ] Documentação atualizada.
- [ ] Rastreabilidade atualizada.
- [ ] Riscos registrados.
- [ ] Pendências registradas.
- [ ] Correções do checkpoint testadas.
- [ ] Nenhuma funcionalidade comercial da PHASE-02 foi antecipada.
- [ ] Relatório de checkpoint criado.
- [ ] Decisão final registrada.
- [ ] PHASE-02 declarada elegível somente se os gates permitirem.

---

 # 59\. Evidência final

 Preencher:

```
TASK-005
Status: DONE / BLOCKED

Build:
PASS / FAIL

Lint:
PASS / FAIL

Typecheck:
PASS / FAIL

Unit:
PASS / FAIL

Integration:
PASS / FAIL

API:
PASS / FAIL

Authentication:
PASS / FAIL

Authorization:
PASS / FAIL

Security:
PASS / FAIL

Privacy:
PASS / FAIL

Audit:
PASS / FAIL

Notifications:
PASS / FAIL

Infrastructure:
PASS / FAIL

Backup:
PASS / FAIL / PENDING

Restore:
PASS / FAIL / PENDING

Architecture:
PASS / FAIL

ADRs:
PASS / FAIL

Documentation:
PASS / FAIL

Traceability:
PASS / FAIL

Scope:
PASS / FAIL

Critical Blockers:
0 / N

Accepted Pendencies:
0 / N

Final Decision:
PASS / PASS_WITH_ACCEPTED_PENDENCY / BLOCKED

PHASE-02:
ELIGIBLE / NOT_ELIGIBLE

Report:
docs/checkpoints/PHASE-01-CHECKPOINT.md
```

---

 # 60\. Regra final

 O TASK-005 **não é uma oportunidade para adicionar funcionalidades**.

 É um Quality Gate que deve provar, por evidências, que:

```
PHASE-01
   │
   ├── Fundação técnica
   ├── Arquitetura
   ├── Infraestrutura
   ├── Identidade
   ├── Autorização
   ├── Auditoria
   ├── Privacidade
   ├── Qualidade
   ├── Segurança
   └── Rastreabilidade
             │
             ▼
       CHECKPOINT
             │
      ┌──────┴──────┐
      ▼             ▼
    PASS          BLOCKED
      │
      ▼
 PHASE-02
```

 A PHASE-02 só deve ser liberada quando houver evidência suficiente de que a fundação é **reproduzível, testada, segura, arquiteturalmente coerente e rastreável**.

 Qualquer pendência relevante deve permanecer visível no relatório, com impacto e decisão registrados. O checkpoint não deve esconder problemas para cumprir cronograma.