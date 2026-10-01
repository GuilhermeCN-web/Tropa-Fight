# TASK-002 — Definir infraestrutura, ambientes e observabilidade

 ## 1\. Identificação

 - **ID:** TASK-002
- **Título:** Definir infraestrutura, ambientes e observabilidade
- **Status:** BLOCKED
- **Phase:** PHASE-01
- **Priority:** HIGH
- **Tipo:** Infrastructure / Architecture / Observability / Operations
- **Dependência:** TASK-001
- **Bloqueio atual:** decisões de provedores e ambientes ainda precisam ser aprovadas
- **Bloqueia:** TASK-005
- **Relacionados:** RNF-011, RNF-012, RNF-018, PD-001, PD-002, PD-003, PD-004, ADR-003

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

 - PD-001
- PD-002
- PD-003
- PD-004

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

 O bloqueio deve permanecer explícito até que as decisões necessárias sejam formalmente aprovadas.

---

 # 6\. Condição para desbloqueio

 A TASK poderá passar de `BLOCKED` para `READY` somente quando:

 - [ ] Provedor(es) de infraestrutura aprovados;
- [ ] Ambientes necessários aprovados;
- [ ] Estratégia de hospedagem aprovada;
- [ ] Estratégia de persistência aprovada;
- [ ] Estratégia de secrets aprovada;
- [ ] Estratégia de backup aprovada;
- [ ] Requisitos de recuperação definidos;
- [ ] Estratégia mínima de observabilidade aprovada;
- [ ] ADR-003 aprovado ou formalmente atualizado.

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

 - [ ] Setup documentado.
- [ ] Dependências documentadas.
- [ ] Variáveis documentadas.
- [ ] Nenhuma credencial real necessária.
- [ ] Dados de desenvolvimento separados de dados reais.

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
Database:
Provider:
Version:
Environment:
Backup:
Retention:
Encryption:
Access:
Monitoring:
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
| \[...\] | \[...\] | \[...\] | \[...\] | Aprovado/Pendente |

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
RPO:
Valor: [PENDING / aprovado]
Justificativa:
Fonte da decisão:
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
RTO:
Valor: [PENDING / aprovado]
Justificativa:
Fonte da decisão:
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

 - [ ] princípio do menor privilégio;
- [ ] isolamento entre ambientes;
- [ ] secrets fora do código;
- [ ] acesso administrativo restrito;
- [ ] criptografia conforme requisito;
- [ ] logs protegidos;
- [ ] backups protegidos;
- [ ] acessos auditáveis.

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
| Provedor | PENDING | \[ \] | \[ \] |
| Ambientes | PENDING/APROVADO | \[ \] | \[ \] |
| Persistência | PENDING/APROVADO | \[ \] | \[ \] |
| Secrets | PENDING/APROVADO | \[ \] | \[ \] |
| Backup | PENDING/APROVADO | \[ \] | \[ \] |
| RPO | PENDING/APROVADO | \[ \] | \[ \] |
| RTO | PENDING/APROVADO | \[ \] | \[ \] |
| Observabilidade | PENDING/APROVADO | \[ \] | \[ \] |

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

 - [ ] TASK-001 está DONE.
- [ ] Arquitetura de ambientes está documentada.
- [ ] Responsabilidade de cada ambiente está definida.
- [ ] Estratégia de configuração está definida.
- [ ] Estratégia de secrets está definida.
- [ ] Persistência está definida ou explicitamente pendente.
- [ ] Estratégia de backup está definida.
- [ ] Procedimento de restore está documentado.
- [ ] RPO está definido ou explicitamente pendente.
- [ ] RTO está definido ou explicitamente pendente.
- [ ] Logs estão definidos.
- [ ] Métricas estão definidas.
- [ ] Health checks estão definidos.
- [ ] Estratégia de alertas está definida.
- [ ] Segurança operacional foi analisada.
- [ ] ADR-003 está atualizado.
- [ ] Decisões críticas estão rastreadas.
- [ ] Nenhum secret real está no repositório.
- [ ] Nenhum provedor não aprovado foi assumido como definitivo.
- [ ] Nenhum código comercial foi criado.
- [ ] Nenhuma funcionalidade fora do escopo foi implementada.
- [ ] Documentação operacional está atualizada.
- [ ] TASKS.md está atualizado.

---

 # 49\. Evidências obrigatórias

 Registrar:

```
Ambientes:
[...]

Provedor:
[...]

Persistência:
[...]

Backup:
[...]

Restore:
[...]

RPO:
[...]

RTO:
[...]

Observabilidade:
[...]

Secrets:
[...]

ADR:
[...]

Documentação:
[...]
```

---

 # 50\. Registro de riscos

 | ID | Risco | Probabilidade | Impacto | Mitigação | Status |
| --- | --- | --- | --- | --- | --- |
| RISK-001 | Provedor ainda não aprovado | \[ \] | Alto | Aguardar decisão | OPEN |
| RISK-002 | RPO indefinido | \[ \] | \[ \] | Formalizar requisito | OPEN |
| RISK-003 | RTO indefinido | \[ \] | \[ \] | Formalizar requisito | OPEN |
| RISK-004 | Estratégia de backup incompleta | \[ \] | \[ \] | Definir procedimento | OPEN |

---

 # 51\. Pendências

 Toda pendência deve possuir:

```
ID:
Descrição:
Impacto:
Responsável:
Decisão necessária:
Prazo:
Status:
```

 Exemplo:

```
BLOCKER-001

Descrição:
Provedor de infraestrutura ainda não aprovado.

Impacto:
Impede a definição final da infraestrutura de staging/produção.

Responsável:
[Responsável pela decisão]

Decisão necessária:
Aprovação do provedor.

Status:
OPEN
```

---

 # 52\. Verificação de escopo

 Antes de finalizar:

 ## ALLOWED\_CHANGES

 - [ ] Todas as alterações estão dentro do escopo autorizado.
- [ ] Documentação foi atualizada.
- [ ] Infraestrutura criada é somente de desenvolvimento/homologação aprovada.

 ## FORBIDDEN\_CHANGES

 - [ ] Nenhuma credencial real foi adicionada.
- [ ] Nenhum ambiente de produção não aprovado foi criado.
- [ ] Nenhum provedor foi escolhido unilateralmente.
- [ ] Nenhuma funcionalidade comercial foi implementada.
- [ ] Nenhuma regra de negócio foi alterada.
- [ ] Nenhuma decisão pendente foi mascarada como aprovada.
- [ ] Nenhuma integração externa real não aprovada foi criada.

---

 # 53\. Rastreabilidade

 | Referência | Tipo | Evidência |
| --- | --- | --- |
| RNF-011 | Requisito | \[documento/configuração\] |
| RNF-012 | Requisito | \[documento/configuração\] |
| RNF-018 | Requisito | \[documento/configuração\] |
| PD-001 | Decisão | \[ADR/documento\] |
| PD-002 | Decisão | \[ADR/documento\] |
| PD-003 | Decisão | \[ADR/documento\] |
| PD-004 | Decisão | \[ADR/documento\] |
| ADR-003 | Arquitetura | \[ADR\] |

---

 # 54\. Saída esperada

 Ao concluir a TASK:

```
TASK-002
Status: DONE

Environment Architecture: PASS
Configuration: PASS
Secrets: PASS
Persistence: PASS/PENDING APPROVAL
Backup: PASS
Restore: PASS
RPO: PASS/PENDING APPROVAL
RTO: PASS/PENDING APPROVAL
Observability: PASS
Security: PASS
Documentation: PASS
ADR: PASS
Scope: PASS
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