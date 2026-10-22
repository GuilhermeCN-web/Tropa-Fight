# Baseline de infraestrutura e operação

## Decisão e limite atual

Em 2026-10-21, o responsável autorizou formalizar um baseline sem contratar serviços e sem publicar em produção. A entrega atual é somente o front React/TypeScript executado localmente. Não existe backend, banco conectado, dado persistente da aplicação ou provedor externo de runtime.

### Aditivo aprovado para TASK-003 (2026-10-22)

O responsável autorizou migrar a aplicação local de Vite para Next.js e executar o backend de identidade no mesmo processo da aplicação, usando PostgreSQL local. Esta autorização se limita à TASK-003: não inclui banco hospedado, ambiente compartilhado, produção, contratação ou envio real de e-mail. As declarações de baseline abaixo descrevem a conclusão da TASK-002 e são supersedidas somente para o desenvolvimento local desta TASK.

O ambiente local é o único ambiente provisionado nesta etapa. Ambientes compartilhados, staging e produção ficam registrados para evolução futura; sua criação depende de nova autorização e de escolhas de provedor. Nenhum serviço ou custo é assumido por este documento.

## Ambientes

| Ambiente | Estado e finalidade | Configuração e dados | Acesso e publicação |
| --- | --- | --- | --- |
| Local | Ativo; desenvolvimento individual com Node.js 24, npm, Next.js e PostgreSQL local. | `.env.local` fora do Git; configuração pública e secrets de servidor separados; dados de identidade locais. | Desenvolvedor local; iniciar com `npm run dev`; não é publicação externa. |
| Development compartilhado | Não provisionado; integração da equipe será reavaliada quando existir backend ou necessidade de colaboração remota. | Sem persistência ou secrets configurados. | Provedor e processo de publicação pendentes de autorização. |
| Staging / homologação | Não provisionado; deve validar o conjunto aprovado antes da produção, com dados sintéticos e isolamento. | Persistência, secrets, monitoramento e retenção serão configurados quando os respectivos provedores forem aprovados. | Provedor, acesso e publicação pendentes de autorização. |
| Production | `PENDING_APPROVAL`; não criar infraestrutura, configurar credenciais, assumir custos ou publicar. | Dados reais e políticas de operação não aprovados. | Acesso restrito e publicação exigem aprovação específica. |

## Configuração e secrets

No baseline inicial (TASK-001/TASK-002), configuração pública do front usava variáveis `VITE_*`. Para TASK-003, `.env.local` configura `DATABASE_URL` e `LOG_LEVEL`; `DATABASE_URL` contém credenciais e é lida somente no servidor Next.js. O arquivo `.env.local` é ignorado pelo Git. Não adicionar segredos a variáveis públicas ou bundles do navegador.

O front atual não precisa de credenciais. Quando um backend for aprovado, secrets deverão ser fornecidos em tempo de execução por um mecanismo de secrets do ambiente hospedado escolhido; não serão persistidos no repositório, bundle, logs ou artefatos. O provedor ainda não está escolhido. Acesso deverá seguir menor privilégio, segregação por ambiente, rotação após suspeita de exposição e revogação ao encerrar a necessidade. A periodicidade e auditoria automatizada serão definidas junto ao provedor.

## Persistência

Para TASK-003, PostgreSQL local foi aprovado pelo responsável e está conectado somente à aplicação local para dados de identidade. Banco hospedado, ambientes compartilhados, produção e persistência comercial permanecem fora de escopo e `PENDING_APPROVAL`.

Não guardar dados comerciais ou pessoais em armazenamento do navegador como substituto de persistência do sistema. Quando banco for autorizado, acesso ocorrerá pelo backend, nunca diretamente do browser.

## Backup e restauração

Não há backup operacional enquanto não existir banco ou dado persistente. Para a futura persistência relacional, fica aprovado este baseline operacional, a executar somente após a seleção do banco e do destino:

- gerar backup lógico diário e antes de mudanças de esquema;
- manter cópias por 30 dias, com criptografia em trânsito e repouso e acesso restrito;
- guardar cópia em destino separado do banco principal; selecionar o provedor/destino antes de provisionar;
- verificar conclusão e integridade de cada cópia e alertar sobre ausência ou falha;
- testar restauração em ambiente isolado antes de produção e, depois, ao menos anualmente;
- registrar horário, versão, integridade, ambiente, duração e resultado do restore; validar estrutura, contagens e inicialização da aplicação antes de liberar o ambiente.

Procedimento de restore: registrar incidente e impacto; escolher cópia íntegra anterior ao evento; preparar ambiente isolado; restaurar sem sobrescrever a origem; validar esquema e dados; executar verificações da aplicação; obter aprovação operacional antes de eventual troca; registrar duração, perdas observadas e resultado. A ferramenta e os comandos dependem do banco e do provedor aprovados.

**RPO:** `PENDING_APPROVAL`; não inferir a partir da frequência diária de backup.

**RTO:** `PENDING_APPROVAL`; requer meta de negócio e teste de recuperação.

## Logs, métricas, saúde e alertas

No ambiente local, usar o logger existente e a saída do Vite; não registrar tokens, credenciais, dados de pagamento ou dados pessoais. O front atual não envia telemetria externa.

As verificações manuais locais cobrem início do servidor, resposta HTTP e renderização do estado de saúde da aplicação. O front não expõe endpoints HTTP de liveness/readiness e não simula health check de banco ou serviços inexistentes.

Quando houver ambiente hospedado, observar disponibilidade e latência HTTP, erros de aplicação, falhas de dependências, recursos do runtime e, quando existir banco, conexões, latência, erros e capacidade. Alertas devem cobrir indisponibilidade, degradação, falha de backup e falha de restore. Ferramenta, destino, retenção e thresholds numéricos permanecem pendentes de provedor e metas aprovados. Logs e métricas devem minimizar dados e respeitar controle de acesso.

## Deploy, rollback e incidentes

Não há deploy remoto neste baseline. Localmente, `npm run build` gera o artefato e `npm run start` permite conferência via preview. Quando publicação for autorizada, registrar versão/revisão e validar smoke checks após deploy. Em falha, interromper a promoção, retornar à última versão validada pelo mecanismo do provedor e repetir as verificações; mudanças de banco exigirão plano de compatibilidade e recuperação antes de qualquer execução.

Fluxo de incidente: detectar; registrar horário, ambiente e impacto sem dados sensíveis; classificar; preservar evidências; investigar logs/health/backup; recuperar em ambiente isolado; validar integridade e aplicação; obter autorização para retorno ao serviço; documentar causa e ações. Não existe plantão, SLA, ferramenta de alerta ou canal externo aprovado.

Infraestrutura como código não será introduzida enquanto não houver provedor aprovado. O repositório e os comandos locais são a referência reproduzível atual.

## Critérios para homologar infraestrutura

Staging só poderá ser criado após escolha e autorização explícita do provedor. Antes de aprovar uma versão nesse ambiente, verificar: build e testes aprovados; configuração isolada do código; ausência de secrets no bundle/logs; dados sintéticos; controle de acesso e isolamento; smoke check HTTP e saúde da aplicação; logs e alertas visíveis; rollback exercitado. Quando houver banco, incluir migrações, backup íntegro e restore em ambiente isolado. Registrar versão, comandos, resultados e evidências. Estes critérios não autorizam criar staging nem publicar qualquer ambiente.

## Rastreabilidade dos critérios de aceite

| Critério | Evidência |
| --- | --- |
| AC-001 — Ambientes | Matriz de ambientes deste documento |
| AC-002 — Provedor | Nenhum provedor externo escolhido para o baseline local; futuros estão pendentes |
| AC-003 — Configuração | `.env.example`, `.env` ignorado e seção Configuração |
| AC-004 — Secrets | Seção Configuração e secrets; nenhuma credencial no front |
| AC-005/006 — Backup e restore | Seção Backup e restauração |
| AC-007/008 — RPO/RTO | Ambos explicitamente `PENDING_APPROVAL` |
| AC-009/010 — Observabilidade e dados sensíveis | Seção Logs, métricas, saúde e alertas |
| AC-011 — Decisões | ADR-003, ADR-014 e matriz de decisões |
| AC-012 — Infraestrutura aprovada | Nenhum provedor ou ambiente remoto provisionado |

## Matriz de decisões

| Decisão | Estado | Registro |
| --- | --- | --- |
| Execução local do front | APROVADO | TASK-001 e este baseline |
| Provedor externo na etapa atual | NENHUM; decisão aprovada | Sem contratação ou publicação |
| Development compartilhado / staging | NÃO PROVISIONADOS; reavaliar mediante autorização | Este baseline |
| Produção | `PENDING_APPROVAL` | Sem infraestrutura, custo ou deploy |
| Persistência futura | Estratégia relacional aprovada; motor/provedor pendentes | ADR-003 |
| Secrets | Estratégia provider-neutral aprovada; ferramenta pendente | Este baseline |
| Backup/restore futuro | Baseline aprovado; ferramenta/destino pendentes | Este baseline |
| RPO / RTO | `PENDING_APPROVAL` | Decisão de negócio ainda necessária |
| Observabilidade | Controles locais definidos; provedor/thresholds pendentes | ADR-014 e este baseline |

Pendências futuras não autorizam provisionamento ou gasto. Elas bloqueiam somente os ambientes, dados e operações que dependam das escolhas ainda não aprovadas.
