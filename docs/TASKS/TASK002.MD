# TASK-002 — Definir infraestrutura, ambientes e observabilidade

 ## 1\. Identificação

 - **ID:** TASK-002
- **Título:** Definir infraestrutura, ambientes e observabilidade
- **Status:** DONE
- **Phase:** PHASE-01
- **Priority:** HIGH
- **Tipo:** Infrastructure / Architecture / Observability / Operations
- **Dependência:** TASK-001
- **Baseline aprovado:** execução local do front nesta etapa; sem contratação de serviços nem publicação em produção. Hospedagem compartilhada e persistência serão reavaliadas quando forem autorizadas as etapas correspondentes.
- **Bloqueia:** TASK-005
- **Relacionados:** RNF-011, RNF-012, RNF-018, PD-009, PD-010, PD-011, ADR-003, ADR-014

---

 # 2\. Objetivo

 Definir e documentar a fundação de infraestrutura necessária para executar, operar, monitorar, recuperar e manter o Tropa Fight nos ambientes previstos.

 Esta TASK deve estabelecer **as decisões arquiteturais e operacionais de infraestrutura**, sem antecipar decisões que ainda dependam de aprovação.

 O resultado deverá permitir responder claramente:

 - quais ambientes existem;
- para que cada ambiente serve;
- como a configuração é gerenciada;
- como secrets serão tratados;
- onde os dados persistem;
- como backups serão realizados;
- como uma restauração será executada;
- quais métricas e logs serão necessários;
- como a saúde da aplicação será monitorada;
- como incidentes de infraestrutura serão identificados;
- quais são os objetivos de recuperação;
- quais decisões ainda dependem de aprovação.

---

 # 3\. Dependências

 ## Dependência obrigatória

```
TASK-001
    ↓
TASK-002
```

 TASK-001 deve estar `DONE` antes da implementação efetiva desta TASK.

---

 # 4\. Referências

 ## Requisitos não funcionais

 - RNF-011
- RNF-012
- RNF-018

 ## Decisões de produto / infraestrutura

- PD-009 — Stack tecnológica
- PD-010 — Hospedagem, ambientes e deploy
- PD-011 — Metas mensuráveis de desempenho e disponibilidade

 ## ADR

 - ADR-003

---

 # 5\. Status de bloqueio

 A TASK inicia como:

```
STATUS = BLOCKED
```

 Motivo:

 > As decisões de provedores e ambientes ainda precisam ser aprovadas.

O bloqueio inicial foi reavaliado em 2026-10-21 após autorização do responsável para formalizar um baseline local, sem contratação de serviços nem deploy em produção. As decisões pendentes para ambientes hospedados permanecem explícitas e fora do baseline atual.

---

 # 6\. Condição para desbloqueio

 A TASK poderá passar de `BLOCKED` para `READY` somente quando:

- [x] Provedor(es) para o escopo atual: nenhum; decisão local-only aprovada, sem contratação;
- [x] Ambientes: local ativo; development compartilhado e staging não provisionados; production `PENDING_APPROVAL`;
- [x] Estratégia de hospedagem atual: execução local, sem publicação externa;
- [x] Persistência futura: estratégia relacional aprovada; motor/provedor ainda pendentes;
- [x] Secrets: nenhum necessário no front atual; estratégia futura provider-neutral definida;
- [x] Backup e restore futuros documentados em `docs/architecture/infrastructure-baseline.md`;
- [x] Procedimento de recuperação definido; RPO/RTO explicitamente `PENDING_APPROVAL`;
- [x] Observabilidade mínima local definida sem telemetria ou fornecedor externo;
- [x] ADR-003 aprovado e atualizado.

 Se alguma decisão continuar pendente, ela deve ser registrada explicitamente como:

```
DECISION_PENDING
```

 Não assumir uma decisão simplesmente para desbloquear a implementação.

---

 # 7\. Objetivos específicos

 A TASK deve produzir:

 1. modelo de ambientes;
2. arquitetura de infraestrutura;
3. estratégia de configuração;
4. estratégia de secrets;
5. estratégia de persistência;
6. estratégia de backup;
7. estratégia de restore;
8. definição de RPO;
9. definição de RTO;
10. estratégia de logs;
11. estratégia de métricas;
12. estratégia de health checks;
13. estratégia de alertas;
14. estratégia de monitoramento;
15. documentação operacional;
16. ADRs necessários;
17. critérios para homologação da infraestrutura.

---

 # 8\. Escopo

 ## 8.1 Incluído

 - arquitetura de ambientes;
- configuração de desenvolvimento;
- configuração de homologação/staging;
- preparação conceitual para produção;
- estratégia de infraestrutura;
- persistência;
- backup;
- restore;
- RPO;
- RTO;
- secrets;
- variáveis de ambiente;
- logs;
- métricas;
- health checks;
- observabilidade;
- documentação operacional;
- decisões arquiteturais;
- configuração de infraestrutura de desenvolvimento/homologação quando aprovada.

---

 # 9\. Explicitamente fora do escopo

 Não implementar nesta TASK:

 - funcionalidades comerciais;
- catálogo;
- autenticação;
- autorização;
- checkout;
- pagamento;
- pedidos;
- estoque;
- cupons;
- avaliações;
- funcionalidades administrativas de negócio;
- credenciais reais no código;
- produção sem aprovação;
- migrações de domínio;
- decisões unilaterais sobre provedores;
- contratação de serviços;
- alterações de requisitos;
- alteração da arquitetura de aplicação sem ADR.

---

 # 10\. ALLOWED\_CHANGES

 São permitidas alterações em:

```
docs/adr/**
docs/architecture/**
docs/operations/**
configuração de ambientes
infraestrutura de desenvolvimento
infraestrutura de homologação
arquivos operacionais
TASKS.md
```

 Também são permitidos arquivos auxiliares diretamente necessários à infraestrutura aprovada.

---

 # 11\. FORBIDDEN\_CHANGES

 É proibido:

 - inserir credenciais reais no repositório;
- inserir secrets em arquivos versionados;
- criar ambiente de produção sem aprovação;
- escolher provedor unilateralmente;
- contratar serviço sem aprovação;
- implementar código comercial;
- alterar regras de negócio;
- criar dependência comercial não aprovada;
- criar infraestrutura que dependa de fornecedor não aprovado;
- mascarar decisões pendentes como decisões definitivas;
- documentar RPO/RTO inventados como requisitos aprovados;
- criar políticas operacionais inexistentes;
- criar mecanismos de observabilidade que capturem dados sensíveis desnecessariamente.

---

 # 12\. Arquitetura de ambientes

 A documentação deve definir explicitamente os ambientes necessários.

 Modelo inicial:

```
LOCAL
  ↓
DEVELOPMENT
  ↓
STAGING / HOMOLOGATION
  ↓
PRODUCTION
```

 Os nomes podem variar conforme a infraestrutura aprovada.

---

 # 13\. Ambiente LOCAL

 ## Objetivo

 Permitir desenvolvimento individual e execução reproduzível.

 ## Deve possuir

 - runtime;
- dependências da aplicação;
- configuração local;
- serviços necessários;
- mecanismo de execução;
- testes;
- logs básicos.

 ## Requisitos

- [x] Setup documentado em README e infraestrutura-baseline.
- [x] Dependências documentadas em README/package.json.
- [x] Variáveis documentadas em `.env.example` e infrastructure-baseline.
- [x] Nenhuma credencial real necessária no front atual.
- [x] Dados reais não são usados no ambiente local.

---

 # 14\. Ambiente DEVELOPMENT

 ## Objetivo

 Disponibilizar um ambiente compartilhado para integração contínua das alterações.

 Deve definir:

 - infraestrutura;
- banco;
- configuração;
- acesso;
- logs;
- métricas;
- ciclo de atualização;
- estratégia de reset/recriação.

---

 # 15\. Ambiente STAGING / HOMOLOGAÇÃO

 ## Objetivo

 Representar, tanto quanto razoavelmente possível, o comportamento operacional esperado para produção sem utilizar dados reais indevidos.

 Deve definir:

 - infraestrutura;
- persistência;
- observabilidade;
- acesso;
- deploy;
- rollback;
- dados de teste;
- isolamento.

---

 # 16\. Ambiente PRODUCTION

 A produção permanece condicionada à aprovação.

 A documentação deverá indicar:

```
Production:
STATUS = PENDING_APPROVAL
```

 Até aprovação:

 - não criar infraestrutura produtiva definitiva;
- não inserir credenciais;
- não executar deploy;
- não assumir custos de serviços;
- não declarar readiness de produção.

---

 # 17\. Matriz de ambientes

 Criar uma tabela semelhante a:

 | Característica | Local | Development | Staging | Production |
| --- | --- | --- | --- | --- |
| Objetivo | Desenvolvimento | Integração | Homologação | Operação |
| Dados reais | Não | Não | Conforme aprovado | Conforme política |
| Secrets reais | Não | Conforme estratégia | Conforme estratégia | Conforme estratégia |
| Backup | \[definir\] | \[definir\] | \[definir\] | \[definir\] |
| Monitoramento | Básico | Sim | Sim | Sim |
| Acesso | Desenvolvedor | Time | Autorizado | Restrito |
| Deploy | Manual | \[definir\] | \[definir\] | \[aprovação\] |

Nenhuma coluna deve ser preenchida com uma decisão não aprovada.

---

 # 18\. Estratégia de configuração

 Todas as configurações externas devem ser separadas do código.

 Categorias:

```
Application Configuration
Infrastructure Configuration
Environment Configuration
Secrets
Operational Configuration
```

---

 # 19\. Configurações

 Exemplos conceituais:

```
APP_ENV
APP_PORT
LOG_LEVEL
DATABASE_URL
EXTERNAL_SERVICE_URL
```

 Os nomes reais deverão seguir a convenção estabelecida em TASK-001.

---

 # 20\. Secrets

 ## Regra principal

 Secrets nunca devem ser armazenados diretamente no código.

 Nunca versionar:

```
password
secret
private key
API key
access token
database credential
payment credential
```

---

 # 21\. Estratégia de secrets

 Definir:

 - onde secrets serão armazenados;
- quem pode acessá-los;
- como serão injetados;
- como serão rotacionados;
- como serão revogados;
- como serão auditados;
- como serão separados por ambiente.

---

 # 22\. Matriz de acesso

 Criar uma matriz semelhante:

 | Recurso | Dev | Staging | Production |
| --- | --- | --- | --- |
| Configuração pública | Sim | Sim | Sim |
| Secrets | Restrito | Restrito | Muito restrito |
| Banco | Conforme política | Restrito | Muito restrito |
| Logs | Sim | Sim | Conforme política |
| Backup | Não | Restrito | Restrito |

As permissões reais dependem das decisões aprovadas.

---

 # 23\. Persistência

 Definir a estratégia de persistência da aplicação.

 Deve documentar:

 - tecnologia;
- ambiente;
- localização;
- disponibilidade;
- retenção;
- backup;
- restore;
- monitoramento;
- acesso;
- segurança;
- escalabilidade.

 A tecnologia específica somente deve ser definida após aprovação da decisão correspondente.

---

 # 24\. Banco de dados

 Documentar:

```
Database: Future relational database; not provisioned in this task
Provider: PENDING_APPROVAL
Version: PENDING_APPROVAL
Environment: None active; isolate development/staging/production before persistence
Backup: Daily and before schema changes, per infrastructure baseline
Retention: 30 days for future backups
Encryption: Backups encrypted in transit and at rest; database details depend on provider
Access: Backend only, least privilege; restricted and auditable human access
Monitoring: Health, latency, errors, connections and capacity when database exists
```

 Valores ainda desconhecidos devem permanecer como:

```
PENDING
```

 Não inventar valores.

---

 # 25\. Estratégia de backup

 Definir:

 - o que será incluído;
- frequência;
- retenção;
- armazenamento;
- criptografia;
- controle de acesso;
- monitoramento;
- validação;
- restauração;
- responsável operacional.

---

 # 26\. Escopo do backup

 O backup deve considerar, quando aplicável:

 - dados persistentes;
- configurações necessárias;
- metadados;
- infraestrutura declarativa, quando aplicável;
- informações necessárias para recuperação.

 Não considerar arquivos temporários como dados críticos sem justificativa.

---

 # 27\. Política de retenção

 Criar uma tabela:

 | Backup | Frequência | Retenção | Destino | Status |
| --- | --- | --- | --- | --- |
| Backup lógico do banco relacional futuro | Diário e antes de mudança de esquema | 30 dias | Destino separado e cifrado; provedor pendente | Baseline aprovado; ainda não executado |

Não definir valores arbitrários como requisitos definitivos.

---

 # 28\. Restore

 Documentar um procedimento de restauração.

 Fluxo mínimo:

```
Identificar incidente
       ↓
Avaliar ponto de recuperação
       ↓
Selecionar backup
       ↓
Restaurar ambiente
       ↓
Validar integridade
       ↓
Validar aplicação
       ↓
Registrar resultado
```

---

 # 29\. Teste de restauração

 A estratégia deve incluir testes periódicos de restore.

 Checklist:

 - [ ] Backup localizado.
- [ ] Backup íntegro.
- [ ] Restore executado.
- [ ] Dados validados.
- [ ] Aplicação inicializada.
- [ ] Integridade validada.
- [ ] Tempo de recuperação registrado.
- [ ] Resultado documentado.

---

 # 30\. RPO

 Documentar o **Recovery Point Objective**.

 Formato:

```
RPO: PENDING_APPROVAL
Justificativa: não existe persistência ativa e nenhuma meta de perda de dados foi aprovada.
Fonte da decisão: docs/planning/answered-questions.md, Rodada 15; definir antes de operar dados persistentes.
```

 RPO não deve ser inventado pela implementação.

 Se ainda não houver decisão:

```
RPO = PENDING_APPROVAL
```

---

 # 31\. RTO

 Documentar o **Recovery Time Objective**.

 Formato:

```
RTO: PENDING_APPROVAL
Justificativa: não existe serviço persistente ativo e nenhuma meta de recuperação foi aprovada.
Fonte da decisão: docs/planning/answered-questions.md, Rodada 15; definir antes de operar dados persistentes.
```

 Também não deve ser inferido como requisito.

---

 # 32\. Observabilidade

 A observabilidade deve cobrir pelo menos:

```
Logs
Métricas
Health Checks
Alertas
Monitoramento
```

---

 # 33\. Logs

 Definir:

 - formato;
- nível;
- retenção;
- correlação;
- ambiente;
- acesso;
- mascaramento.

 Preferencialmente utilizar logs estruturados.

 Exemplo:

```
{
  "timestamp": "...",
  "level": "info",
  "service": "...",
  "environment": "...",
  "message": "...",
  "correlationId": "..."
}
```

---

 # 34\. Dados proibidos nos logs

 Nunca registrar desnecessariamente:

 - passwords;
- tokens;
- API keys;
- secrets;
- dados completos de pagamento;
- credenciais;
- informações pessoais além do necessário.

 Qualquer dado pessoal deverá ter finalidade operacional clara.

---

 # 35\. Métricas

 Definir métricas mínimas para:

 ## Aplicação

 - disponibilidade;
- latência;
- taxa de erro;
- throughput.

 ## Infraestrutura

 - CPU;
- memória;
- armazenamento;
- conexões;
- disponibilidade dos serviços críticos.

 ## Persistência

 - latência;
- erros;
- conexões;
- capacidade;
- saúde.

 As métricas exatas dependem da infraestrutura aprovada.

---

 # 36\. Health Checks

 Definir health checks para:

```
Application
Database
Critical Infrastructure Dependencies
```

 Diferenciar, quando aplicável:

```
Liveness
Readiness
```

 Exemplo conceitual:

```
GET /health/live
GET /health/ready
```

---

 # 37\. Alertas

 Definir condições que devem gerar alerta.

 Exemplos:

 - aplicação indisponível;
- taxa de erro acima do limite aprovado;
- banco indisponível;
- armazenamento crítico;
- backup falhando;
- restore falhando;
- degradação significativa;
- serviço crítico indisponível.

 Os thresholds devem ser definidos ou marcados como pendentes.

---

 # 38\. Incidentes

 Definir o mínimo necessário para:

 1. detectar;
2. classificar;
3. registrar;
4. investigar;
5. recuperar;
6. validar;
7. encerrar;
8. documentar.

---

 # 39\. Rollback

 Documentar como uma alteração de infraestrutura/aplicação pode ser revertida.

 Fluxo:

```
Deploy
  ↓
Monitoramento
  ↓
Problema detectado
  ↓
Avaliação
  ↓
Rollback
  ↓
Validação
  ↓
Registro
```

---

 # 40\. Infraestrutura como código

 Caso aprovada, definir:

 - ferramenta;
- estrutura;
- ambientes;
- state;
- secrets;
- revisão;
- aplicação;
- rollback.

 Não introduzir uma ferramenta de IaC sem aprovação arquitetural quando houver decisão pendente de provedor.

---

 # 41\. Segurança da infraestrutura

 Validar:

- [x] princípio do menor privilégio definido para ambientes futuros;
- [x] isolamento entre ambientes documentado;
- [x] secrets fora do código e do bundle;
- [x] acesso administrativo restrito documentado;
- [x] criptografia de backups definida para a estratégia futura;
- [x] minimização e proteção de logs documentadas;
- [x] backups futuros protegidos por criptografia e controle de acesso;
- [x] acessos administrativos futuros devem ser auditáveis.

---

 # 42\. Documentação operacional

 Criar documentação para:

 ### Setup

 Como preparar cada ambiente.

 ### Deploy

 Como publicar uma versão.

 ### Rollback

 Como retornar para uma versão anterior.

 ### Backup

 Como verificar e executar backup.

 ### Restore

 Como restaurar.

 ### Observabilidade

 Onde verificar logs e métricas.

 ### Incidente

 Como iniciar diagnóstico.

---

 # 43\. ADR-003

 O ADR relacionado deve registrar, no mínimo:

```
Contexto
Problema
Decisão
Alternativas consideradas
Motivos
Consequências
Riscos
Pendências
```

 Nenhuma decisão importante deve permanecer somente em conversa, código ou configuração.

---

 # 44\. Matriz de decisões

 | Decisão | Status | Responsável | Evidência |
| --- | --- | --- | --- |
| Provedor | Aprovado: nenhum externo no escopo atual; futuros pendentes | Responsável do produto delegou baseline em 2026-10-21 | `docs/architecture/infrastructure-baseline.md` |
| Ambientes | Aprovado: local ativo; shared/staging não provisionados; production pendente | Responsável do produto delegou baseline em 2026-10-21 | `docs/architecture/infrastructure-baseline.md` |
| Persistência | Estratégia relacional futura aprovada; motor/provedor pendentes | Responsável do produto delegou baseline em 2026-10-21 | ADR-003 e baseline |
| Secrets | Estratégia provider-neutral aprovada; ferramenta futura pendente | Baseline TASK-002 | `docs/architecture/infrastructure-baseline.md` |
| Backup | Baseline futuro aprovado; não executado sem banco | Responsável do produto delegou baseline em 2026-10-21 | `docs/architecture/infrastructure-baseline.md` |
| RPO | PENDING_APPROVAL | Responsável do produto antes de persistência ativa | Rodada 15 e baseline |
| RTO | PENDING_APPROVAL | Responsável do produto antes de persistência ativa | Rodada 15 e baseline |
| Observabilidade | Aprovada local; ferramenta/thresholds hospedados pendentes | Baseline TASK-002 | ADR-014 e baseline |

---

 # 45\. Critérios de aceitação

 ## AC-001 — Ambientes definidos

 **Dado** o projeto Tropa Fight,

 **Quando** a arquitetura de ambientes for consultada,

 **Então** deve estar documentado o propósito e comportamento esperado de cada ambiente.

---

 ## AC-002 — Provedor

 **Dado** que a decisão de provedor ainda depende de aprovação,

 **Quando** a documentação for criada,

 **Então** nenhum provedor não aprovado deve ser tratado como decisão definitiva.

---

 ## AC-003 — Configuração

 **Dado** que a aplicação possui configurações específicas por ambiente,

 **Quando** o ambiente for configurado,

 **Então** configurações devem ser separadas do código.

---

 ## AC-004 — Secrets

 **Dado** que o sistema utilizará informações sensíveis,

 **Quando** a estratégia de configuração for definida,

 **Então** secrets não devem ser armazenados no código ou em arquivos versionados.

---

 ## AC-005 — Backup

 **Dado** que existem dados persistentes,

 **Quando** a estratégia operacional for documentada,

 **Então** deve existir uma estratégia explícita de backup.

---

 ## AC-006 — Restore

 **Dado** um cenário de perda ou corrupção de dados,

 **Quando** o procedimento de recuperação for executado,

 **Então** deve existir um procedimento documentado para restauração.

---

 ## AC-007 — RPO

 **Dado** um requisito de recuperação,

 **Quando** o planejamento de infraestrutura for analisado,

 **Então** o RPO deve estar definido ou explicitamente marcado como pendente de aprovação.

---

 ## AC-008 — RTO

 **Dado** um requisito de recuperação,

 **Quando** o planejamento de infraestrutura for analisado,

 **Então** o RTO deve estar definido ou explicitamente marcado como pendente de aprovação.

---

 ## AC-009 — Observabilidade

 **Dado** um ambiente operacional,

 **Quando** a aplicação estiver executando,

 **Então** devem existir mecanismos definidos para logs, métricas e health checks.

---

 ## AC-010 — Dados sensíveis

 **Dado** que logs e métricas serão produzidos,

 **Quando** a estratégia de observabilidade for validada,

 **Então** dados sensíveis não devem ser expostos indevidamente.

---

 ## AC-011 — Decisões registradas

 **Dado** que infraestrutura possui decisões arquiteturais relevantes,

 **Quando** a TASK for concluída,

 **Então** essas decisões devem estar registradas nos ADRs/documentação apropriados.

---

 ## AC-012 — Ausência de infraestrutura não aprovada

 **Dado** que algumas decisões ainda podem estar pendentes,

 **Quando** os artefatos forem revisados,

 **Então** nenhuma infraestrutura definitiva deverá ser criada com base em suposições não aprovadas.

---

 # 46\. Testes e validações

 ## Validação 1 — Configuração

```
Resultado esperado:
Configuração separada por ambiente.
```

---

 ## Validação 2 — Secrets

```
Resultado esperado:
Nenhum secret real presente no repositório.
```

---

 ## Validação 3 — Backup

```
Resultado esperado:
Procedimento de backup documentado.
```

---

 ## Validação 4 — Restore

```
Resultado esperado:
Procedimento de restauração documentado e testável.
```

---

 ## Validação 5 — Observabilidade

```
Resultado esperado:
Logs, métricas e health checks definidos.
```

---

 ## Validação 6 — Arquitetura

```
Resultado esperado:
Infraestrutura não viola a arquitetura aprovada.
```

---

 ## Validação 7 — Ambientes

```
Resultado esperado:
Local / Development / Staging / Production possuem responsabilidades claramente definidas.
```

---

 # 47\. Quality Gate

 A TASK deve possuir os seguintes gates:

```
ENVIRONMENT_ARCHITECTURE = PASS
CONFIGURATION            = PASS
SECRETS_STRATEGY         = PASS
PERSISTENCE_STRATEGY     = PASS
BACKUP_STRATEGY          = PASS
RESTORE_STRATEGY         = PASS
RPO                      = PASS/PENDING_APPROVAL
RTO                      = PASS/PENDING_APPROVAL
OBSERVABILITY            = PASS
SECURITY                 = PASS
DOCUMENTATION            = PASS
ADR                      = PASS
SCOPE                    = PASS
```

 Uma decisão marcada como `PENDING_APPROVAL` não deve ser falsamente convertida em `PASS`.

 Ela deve bloquear somente o que realmente depende daquela decisão.

---

 # 48\. Definition of Done

 TASK-002 somente poderá ser marcada como `DONE` quando:

- [x] TASK-001 está DONE.
- [x] Arquitetura de ambientes está documentada.
- [x] Responsabilidade de cada ambiente está definida.
- [x] Estratégia de configuração está definida.
- [x] Estratégia de secrets está definida.
- [x] Persistência está definida ou explicitamente pendente.
- [x] Estratégia de backup está definida.
- [x] Procedimento de restore está documentado e testável.
- [x] RPO está explicitamente pendente.
- [x] RTO está explicitamente pendente.
- [x] Logs estão definidos.
- [x] Métricas estão definidas.
- [x] Health checks estão definidos para o escopo atual, sem simular serviços inexistentes.
- [x] Estratégia de alertas está definida; ferramenta/thresholds futuros estão pendentes.
- [x] Segurança operacional foi analisada.
- [x] ADR-003 está atualizado; ADR-014 também registra a decisão de observabilidade.
- [x] Decisões críticas estão rastreadas.
- [x] Nenhum secret real está no repositório.
- [x] Nenhum provedor não aprovado foi assumido como definitivo.
- [x] Nenhum código comercial foi criado.
- [x] Nenhuma funcionalidade fora do escopo foi implementada.
- [x] Documentação operacional está atualizada.
- [x] TASKS.md está atualizado.

---

 # 49. Evidências obrigatórias

Registrar:

- Ambientes: local ativo; development compartilhado/staging não provisionados; production PENDING_APPROVAL.
- Provedor: nenhum externo aprovado para a etapa atual; escolhas hospedadas futuras pendentes.
- Persistência: estratégia relacional futura; motor/provedor/versão pendentes; sem DB ativo.
- Backup: baseline diário e antes de mudanças de esquema, retenção de 30 dias; não executado.
- Restore: procedimento documentado; teste real não executado por ausência de banco.
- RPO/RTO: PENDING_APPROVAL.
- Observabilidade: logger e smoke check locais; sem telemetria externa; métricas/alertas hospedados pendentes.
- Secrets: nenhum necessário no front; .env ignorado; nenhum secret real detectado.
- ADR: ADR-003 e ADR-014 ACCEPTED.
- Documentação: docs/architecture/infrastructure-baseline.md, docs/architecture/overview.md e TASKS.md.

---
# 50\. Registro de riscos

 | ID | Risco | Probabilidade | Impacto | Mitigação | Status |
| --- | --- | --- | --- | --- | --- |
| RISK-001 | Provedor hospedado ainda não aprovado para ambientes futuros | Pendente | Alto | Não provisionar; decidir antes de shared/staging/produção | DEFERRED; não bloqueia baseline local |
| RISK-002 | RPO indefinido | Pendente | Alto após persistência ativa | Aprovar meta antes de armazenar dados | OPEN; sem DB ativo |
| RISK-003 | RTO indefinido | Pendente | Alto após persistência ativa | Aprovar meta antes de armazenar dados | OPEN; sem DB ativo |
| RISK-004 | Execução real de backup/restore ainda não validada | Certa enquanto não há DB | Alto após persistência ativa | Executar e registrar restore antes de produção | DEFERRED; estratégia documentada |

---

 # 51. Pendências

Pendências futuras (não bloqueiam o baseline local e não autorizam provisionamento):

| ID | Decisão necessária | Impacto | Responsável | Quando | Status |
| --- | --- | --- | --- | --- | --- |
| DEC-001 | Escolher provedor de hosting/secrets/observabilidade para shared/staging | Bloqueia criação desses ambientes | Responsável do produto | Antes de provisionar | PENDING_APPROVAL |
| DEC-002 | Escolher motor, versão e provedor do banco relacional | Bloqueia persistência | Responsável do produto | Antes de implementar banco | PENDING_APPROVAL |
| DEC-003 | Definir RPO | Bloqueia compromisso de recuperação de dados | Responsável do produto | Antes de persistência ativa | PENDING_APPROVAL |
| DEC-004 | Definir RTO | Bloqueia compromisso de recuperação de serviço | Responsável do produto | Antes de operação hospedada | PENDING_APPROVAL |
| DEC-005 | Definir metas de disponibilidade e thresholds de alerta | Bloqueia alertas automatizados | Responsável do produto | Antes de operação hospedada | PENDING_APPROVAL |

---
# 52\. Verificação de escopo

 Antes de finalizar:

 ## ALLOWED\_CHANGES

- [x] Todas as alterações estão dentro do escopo autorizado.
- [x] Documentação foi atualizada.
- [x] Nenhuma infraestrutura remota foi criada; ambiente ativo é local.

 ## FORBIDDEN\_CHANGES

- [x] Nenhuma credencial real foi adicionada.
- [x] Nenhum ambiente de produção não aprovado foi criado.
- [x] Nenhum provedor foi escolhido unilateralmente.
- [x] Nenhuma funcionalidade comercial foi implementada.
- [x] Nenhuma regra de negócio foi alterada.
- [x] Nenhuma decisão pendente foi mascarada como aprovada.
- [x] Nenhuma integração externa real não aprovada foi criada.

---

 # 53\. Rastreabilidade

 | Referência | Tipo | Evidência |
| --- | --- | --- |
| RNF-011 | Requisito | `docs/architecture/infrastructure-baseline.md` — secrets e configuração |
| RNF-012 | Requisito | `docs/architecture/infrastructure-baseline.md` — observabilidade e recuperação |
| RNF-018 | Requisito | `docs/architecture/infrastructure-baseline.md` — configuração e operação |
| PD-009 | Decisão | Stack React/TypeScript atual; persistência relacional futura em ADR-003 |
| PD-010 | Decisão | `docs/architecture/infrastructure-baseline.md` — ambientes e hospedagem |
| PD-011 | Decisão | Metas numéricas permanecem `PENDING_APPROVAL` em `docs/architecture/infrastructure-baseline.md` |
| ADR-003 | Arquitetura | Persistência relacional futura; mecanismo e provedor pendentes |
| ADR-014 | Arquitetura | Observabilidade e auditoria, sem ferramenta externa selecionada |

---

 # 54\. Saída esperada

 Ao concluir a TASK:

```
TASK-002
Status: DONE

Environment Architecture: PASS — local ativo; demais ambientes explicitamente não provisionados/pendentes.
Configuration: PASS — variáveis públicas VITE_* e .env local ignorado.
Secrets: PASS — sem secrets no front ou repositório; estratégia futura definida.
Persistence: PASS — estratégia relacional futura aprovada; banco/motor/provedor explicitamente pendentes.
Backup: PASS — baseline aprovado para execução após banco; nenhum backup foi alegado como realizado.
Restore: PASS — procedimento e plano de teste documentados; restore real não executado sem banco.
RPO: PENDING_APPROVAL — explicitamente registrado.
RTO: PENDING_APPROVAL — explicitamente registrado.
Observability: PASS — controles locais definidos; provedor/thresholds futuros pendentes.
Security: PASS — configuração e ausência de credenciais verificadas.
Documentation: PASS — arquitetura, ADRs e TASKS atualizados.
ADR: PASS — ADR-003 e ADR-014 ACCEPTED.
Scope: PASS — sem contratação, deploy, código comercial ou infraestrutura remota.
```

 Caso uma decisão crítica continue pendente:

```
TASK-002
Status: BLOCKED

Blockers:
- [...]
```

 A pendência deve ser explícita e não pode ser escondida por uma implementação provisória que pareça definitiva.

---

 # 55\. Regra final

 TASK-002 deve estabelecer **como o Tropa Fight será executado e operado**, mas não deve tomar decisões de infraestrutura que ainda aguardam aprovação.

 O objetivo não é simplesmente "criar infraestrutura".

 O objetivo é produzir uma fundação operacional em que:

```
Ambiente
   ↓
Configuração
   ↓
Aplicação
   ↓
Persistência
   ↓
Backup / Restore
   ↓
Observabilidade
   ↓
Incidente / Recuperação
```

 seja compreensível, documentado, rastreável e reproduzível.

 Nenhuma decisão crítica deve permanecer implícita.
