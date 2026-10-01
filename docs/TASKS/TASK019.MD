# TASK-019 — Cupons, avaliações e usuários administrativos

 **Status:** BLOCKED\
 **Phase/Priority:** PHASE-04 / HIGH\
 **Dependência:** `DEPENDS_ON: TASK-018`\
 **Política incidental:** `MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`

 ## 1\. Identificação

 **ID:** TASK-019\
 **Nome:** Cupons, avaliações e usuários administrativos\
 **Fase:** PHASE-04\
 **Prioridade:** HIGH\
 **Estado inicial:** BLOCKED\
 **Estado elegível para execução:** READY\
 **Dependência obrigatória:** TASK-018 = DONE

 **Relacionados:**

 - RF-035
- RF-036
- RF-037
- RF-038
- RN-017
- UC-014

---

 # 2\. Objetivo

 Completar a camada administrativa da PHASE-04 implementando as operações administrativas aprovadas para:

 - cupons;
- promoções;
- avaliações de produtos;
- usuários administrativos;
- manutenção das roles/permissões existentes;
- auditoria das operações administrativas críticas.

 A TASK deve utilizar os mecanismos de autenticação, autorização, auditoria, catálogo, promoções e avaliações já existentes.

 O objetivo não é criar novos mecanismos de negócio, mas expor e controlar administrativamente os domínios já aprovados.

---

 # 3\. Contexto

 A sequência esperada é:

```
TASK-017
Avaliações + Favoritos
        ↓
TASK-018
Administração de catálogo + estoque + pedidos
        ↓
TASK-019
Administração de cupons + avaliações + usuários administrativos
        ↓
TASK-020
Notificações + auditoria + observabilidade
```

 A TASK-019 pode utilizar os recursos de auditoria já existentes, mas não deve criar a consolidação de observabilidade que pertence à TASK-020.

---

 # 4\. Escopo

 ## 4.1 Administração de cupons

 Implementar, conforme requisitos aprovados:

 - listagem de cupons;
- consulta de cupom;
- criação;
- edição;
- ativação/desativação;
- consulta de vigência;
- consulta de limites;
- filtros;
- busca;
- paginação;
- validações administrativas;
- autorização;
- auditoria das operações críticas.

 Não alterar as regras de cálculo do desconto já implementadas na TASK-012 sem necessidade diretamente causada.

---

 ## 4.2 Administração de promoções

 Implementar somente a gestão administrativa prevista:

 - listagem;
- consulta;
- criação;
- edição;
- ativação/desativação;
- vigência;
- critérios já existentes;
- filtros;
- paginação;
- autorização;
- auditoria.

 Não inventar novos tipos de promoção.

---

 ## 4.3 Administração de avaliações

 Implementar:

 - listagem administrativa;
- filtros;
- consulta;
- moderação;
- aprovação/rejeição, quando previsto;
- alteração do estado de publicação;
- consulta do autor;
- consulta do produto;
- identificação da ação administrativa;
- auditoria;
- autorização.

 Não criar novas funcionalidades sociais.

---

 ## 4.4 Usuários administrativos

 Implementar somente as operações previstas em RF-038/UC-014:

 - listar usuários administrativos;
- consultar usuário administrativo;
- criar usuário administrativo, se previsto;
- ativar/desativar usuário, se previsto;
- atribuir roles existentes, se previsto;
- remover roles existentes, se previsto;
- aplicar autorização existente;
- registrar operações críticas.

 **Não criar novos papéis.**

---

 # 5\. Fora do escopo

 É proibido implementar nesta TASK:

 - novos roles;
- novas permissions;
- novo modelo de RBAC;
- bypass de autorização;
- gestão de usuários comuns fora do necessário;
- redefinição do modelo de identidade;
- novo mecanismo de autenticação;
- novo provedor de e-mail;
- notificações;
- filas de notificações;
- observabilidade;
- dashboards operacionais de métricas;
- tracing;
- health checks;
- alterações no checkout;
- alterações no pagamento;
- novas regras de preço;
- novas regras de desconto não aprovadas;
- sistema social;
- chat;
- recomendação;
- IA;
- gamificação;
- ERP;
- CRM;
- alteração arquitetural não aprovada.

---

 # 6\. ALLOWED\_CHANGES

 Permitido:

```
src/**/admin/**
src/**/promotions/**
src/**/coupons/**
src/**/reviews/**
src/**/users/**
src/**/authorization/** somente integração mínima necessária

tests/**

migrations/** somente para estruturas diretamente necessárias

APIs administrativas

UI administrativa

documentação de API

documentação operacional diretamente relacionada

TASKS.md
```

 Alterações em módulos compartilhados somente quando forem diretamente causadas pela implementação desta TASK.

---

 # 7\. FORBIDDEN\_CHANGES

 Não alterar:

```
RBAC estrutural
modelo de roles
modelo de permissions
autenticação
checkout
pagamentos
pedidos
estoque
catálogo
regras de cálculo comercial
regras de avaliação públicas sem necessidade
notificações
observabilidade
arquitetura global
```

 Também não é permitido remover histórico de auditoria ou criar mecanismos para contorná-lo.

---

 # 8\. Definition of Ready

 A TASK somente poderá entrar em `READY` quando:

 - `TASK-018 = DONE`;
- RF-035–038 estiverem revisados;
- RN-017 estiver definida;
- UC-014 estiver definida;
- mecanismo de RBAC existente estiver funcional;
- autenticação administrativa estiver funcional;
- módulo de cupons/promoções estiver funcional;
- módulo de avaliações estiver funcional;
- auditoria existente estiver disponível;
- regras de moderação estiverem definidas;
- regras de gestão de usuários administrativos estiverem definidas;
- lista de roles existentes estiver identificada;
- nenhuma decisão crítica permanecer pendente.

 Se o requisito não determinar uma operação, não implementá-la por conveniência.

---

 # 9\. Princípio fundamental de RBAC

 Esta TASK administra **usuários dentro do RBAC existente**.

 Ela não redefine o RBAC.

 Fluxo esperado:

```
Usuário administrativo
        ↓
role existente
        ↓
permission existente
        ↓
operação administrativa
```

 Não:

```
Usuário administrativo
        ↓
TASK-019 cria uma nova permission
        ↓
operação
```

 Se uma nova permission ou role for indispensável, registrar bloqueio e solicitar decisão explícita.

---

 # 10\. Modelo de cupons

 Utilizar o modelo já implementado na TASK-012.

 Estrutura conceitual:

```
Coupon
├── id
├── code
├── status
├── validity
├── usageLimit
├── usageCount
├── discount configuration
├── createdAt
└── updatedAt
```

 Os campos definitivos devem seguir o domínio existente.

 Não duplicar o cálculo do desconto no painel administrativo.

---

 # 11\. Administração de cupons

 ## Operações

 Conforme requisitos:

```
Listar
Consultar
Criar
Editar
Ativar
Desativar
Filtrar
Pesquisar
```

 Cada operação deve:

 1. autenticar;
2. autorizar;
3. validar entrada;
4. chamar o domínio existente;
5. persistir;
6. auditar quando aplicável;
7. retornar contrato adequado.

---

 # 12\. Invariantes de cupons

 Devem ser preservadas:

 - código válido;
- unicidade;
- período válido;
- limite válido;
- estado permitido;
- configuração de desconto válida;
- regras existentes de aplicação;
- integridade dos usos já registrados.

 A administração não pode alterar retroativamente uma utilização já registrada de maneira que quebre a integridade comercial.

---

 # 13\. Administração de promoções

 Utilizar o domínio existente.

 Validar:

 - identificador;
- nome;
- período;
- estado;
- condições;
- regras existentes;
- associação aos recursos permitidos.

 Não introduzir tipos de promoção novos.

---

 # 14\. Concorrência em cupons

 A administração não pode ignorar as garantias do domínio comercial.

 Testar situações relevantes como:

```
Admin edita cupom
        +
Cliente aplica cupom
```

 O resultado deve preservar as invariantes já definidas.

 Não criar uma segunda fonte de verdade para:

 - vigência;
- limite;
- desconto;
- contagem de utilização.

---

 # 15\. Administração de avaliações

 A TASK-017 criou o domínio de avaliação.

 A TASK-019 fornece a superfície administrativa.

 Fluxo:

```
Admin
 ↓
lista avaliações
 ↓
filtra
 ↓
consulta
 ↓
analisa
 ↓
executa ação permitida
 ↓
domínio Review
 ↓
persistência
 ↓
auditoria
```

---

 # 16\. Moderação de avaliações

 Quando a regra aprovada permitir moderação:

 Estados conceituais:

```
PENDING
PUBLISHED
REJECTED
```

 Os estados reais devem seguir o modelo aprovado.

 A administração não deve criar estados adicionais sem decisão.

---

 # 17\. Regras de moderação

 Validar:

 - administrador possui permissão;
- avaliação existe;
- estado atual permite a operação;
- transição solicitada é válida;
- alteração é persistida;
- autor da ação é identificado;
- auditoria é produzida quando aplicável.

 Exemplo:

```
PENDING → PUBLISHED
PENDING → REJECTED
```

 Transições inválidas devem ser rejeitadas.

 Não permitir manipulação direta do status ignorando o domínio.

---

 # 18\. Segurança da moderação

 Testar:

 - usuário comum não modera;
- administrador sem permissão não modera;
- administrador autorizado consegue moderar;
- `adminId` não pode ser forjado;
- `reviewId` não permite acesso indevido;
- ação fica vinculada ao usuário autenticado;
- conteúdo sensível não é registrado desnecessariamente.

---

 # 19\. Modelo de usuário administrativo

 Utilizar o modelo `AdminUser` já estabelecido na PHASE-01.

 Estrutura conceitual:

```
AdminUser
├── id
├── identity reference
├── status
├── roles
├── createdAt
└── updatedAt
```

 Não duplicar credenciais.

 Não criar um segundo sistema de login administrativo.

---

 # 20\. Gestão de usuários administrativos

 Operações permitidas somente se RF-038/UC-014 determinar:

 - listar;
- consultar;
- criar;
- ativar;
- desativar;
- atribuir role existente;
- remover role existente.

 Todas as operações devem respeitar autorização.

---

 # 21\. Proteção contra autoelevação

 É proibido permitir que um usuário administrativo eleve seus próprios privilégios por manipulação do request.

 Testar:

```
Admin A
  ↓
tenta atribuir role privilegiada a si mesmo
  ↓
operação rejeitada
```

 quando a regra de segurança exigir separação de privilégios.

 Também validar a política existente para:

 - remoção da própria role;
- desativação da própria conta;
- criação de administrador;
- atribuição de role crítica.

 Não inventar a política; utilizar a decisão aprovada.

---

 # 22\. Proteção contra privilege escalation

 Testar:

 - alteração de `userId`;
- alteração de `roleId`;
- alteração de permission;
- manipulação de payload;
- acesso direto a endpoint;
- alteração via UI;
- chamadas fora da UI.

 A autorização deve ocorrer no backend.

---

 # 23\. Roles

 As roles existentes devem ser tratadas como dados/configuração autorizados pelo sistema.

 Exemplo conceitual:

```
ADMIN
MANAGER
OPERATOR
```

 **Não assumir que esses nomes existem.**

 Utilizar somente as roles efetivamente definidas na PHASE-01.

 Se não existir regra aprovada para determinada role, não criá-la.

---

 # 24\. Permissions

 Da mesma forma, utilizar apenas permissions existentes.

 Não criar automaticamente:

```
MANAGE_USERS
MODERATE_REVIEWS
MANAGE_COUPONS
```

 apenas porque parecem convenientes.

 Se forem necessárias e inexistentes, isso é uma decisão de autorização que deve ser explicitamente aprovada.

---

 # 25\. Matriz de autorização

 A matriz final deve refletir o RBAC existente.

 Modelo de validação:

 | Operação | Usuário comum | Admin sem permissão | Admin autorizado |
| --- | --- | --- | --- |
| Consultar cupons administrativos | negar | negar | permitir |
| Criar cupom | negar | negar | permitir |
| Editar cupom | negar | negar | permitir |
| Moderar avaliação | negar | negar | permitir |
| Consultar usuários administrativos | negar | negar | permitir |
| Criar usuário administrativo | negar | negar | permitir, se previsto |
| Alterar role existente | negar | negar | permitir, se previsto |

A tabela não cria permissões novas; serve apenas como matriz de teste.

---

 # 26\. Auditoria

 As seguintes operações devem ser consideradas críticas:

 ### Cupons

 - criação;
- edição;
- ativação;
- desativação;
- alteração de limite;
- alteração de vigência.

 ### Avaliações

 - aprovação;
- rejeição;
- alteração de estado.

 ### Usuários administrativos

 - criação;
- ativação;
- desativação;
- atribuição de role;
- remoção de role.

 Cada operação deve preservar:

```
ator
ação
recurso
timestamp
resultado
```

 Não registrar credenciais ou segredos.

---

 # 27\. APIs administrativas

 Os paths abaixo são apenas exemplos de contrato:

```
GET    /admin/coupons
POST   /admin/coupons
GET    /admin/coupons/{id}
PATCH  /admin/coupons/{id}
POST   /admin/coupons/{id}/activate
POST   /admin/coupons/{id}/deactivate

GET    /admin/promotions
POST   /admin/promotions
GET    /admin/promotions/{id}
PATCH  /admin/promotions/{id}

GET    /admin/reviews
GET    /admin/reviews/{id}
POST   /admin/reviews/{id}/publish
POST   /admin/reviews/{id}/reject

GET    /admin/users
GET    /admin/users/{id}
POST   /admin/users
PATCH  /admin/users/{id}
```

 Os contratos definitivos devem seguir as convenções reais da aplicação.

 Não criar endpoints duplicados se já existir um caso de uso equivalente.

---

 # 28\. Validação de entrada

 Validar:

 - tipos;
- identificadores;
- strings;
- datas;
- estados;
- códigos;
- limites;
- roles;
- payloads parciais;
- campos obrigatórios.

 Não confiar em validações feitas somente no frontend.

---

 # 29\. Testes unitários

 ## Cupons

 - [ ] criação válida;
- [ ] código duplicado;
- [ ] período inválido;
- [ ] limite inválido;
- [ ] estado inválido;
- [ ] autorização;
- [ ] ativação;
- [ ] desativação.

 ## Promoções

 - [ ] criação;
- [ ] edição;
- [ ] vigência;
- [ ] estado;
- [ ] autorização.

 ## Avaliações

 - [ ] listagem;
- [ ] filtro;
- [ ] publicação;
- [ ] rejeição;
- [ ] transição inválida;
- [ ] autorização.

 ## Usuários administrativos

 - [ ] consulta;
- [ ] criação, se aplicável;
- [ ] ativação;
- [ ] desativação;
- [ ] role existente;
- [ ] tentativa de role inexistente;
- [ ] privilege escalation;
- [ ] autorização.

---

 # 30\. Testes de integração

 Validar:

 - [ ] API → aplicação;
- [ ] aplicação → domínio;
- [ ] domínio → persistência;
- [ ] auditoria;
- [ ] RBAC;
- [ ] cupons;
- [ ] promoções;
- [ ] avaliações;
- [ ] usuários administrativos.

---

 # 31\. Testes de autorização

 Obrigatórios:

```
usuário comum → negar
admin sem permission → negar
admin autorizado → permitir
```

 Para todas as operações críticas.

 Testar também acesso direto ao endpoint, sem passar pela UI.

---

 # 32\. Testes de privilege escalation

 Validar pelo menos:

 - [ ] alterar `userId`;
- [ ] alterar `roleId`;
- [ ] inserir permission inexistente;
- [ ] atribuir role não permitida;
- [ ] remover role de usuário privilegiado;
- [ ] alterar próprio nível de acesso;
- [ ] manipular IDs de outros usuários;
- [ ] acessar endpoint administrativo diretamente.

---

 # 33\. Testes de API

 Para cada endpoint:

 - [ ] autenticação;
- [ ] autorização;
- [ ] payload válido;
- [ ] payload inválido;
- [ ] recurso inexistente;
- [ ] transição inválida;
- [ ] tentativa de acesso indevido;
- [ ] resposta sem dados sensíveis;
- [ ] códigos HTTP conforme padrão.

---

 # 34\. Testes de concorrência

 Quando aplicável:

 ### Cupom

```
Atualização administrativa
+
uso comercial concorrente
```

 ### Avaliação

```
duas ações administrativas simultâneas
```

 ### Usuário administrativo

```
duas alterações concorrentes de roles/status
```

 O resultado deve manter as invariantes do domínio.

---

 # 35\. Testes E2E

 ## E2E-019-01 — Criar e administrar cupom

```
Login administrativo
↓
Abrir cupons
↓
Criar cupom
↓
Validar
↓
Salvar
↓
Consultar cupom
↓
Confirmar estado
```

 ## E2E-019-02 — Moderar avaliação

```
Login administrativo autorizado
↓
Abrir avaliações
↓
Filtrar pendentes
↓
Abrir avaliação
↓
Executar ação permitida
↓
Confirmar estado
```

 ## E2E-019-03 — Usuário administrativo

```
Login com permissão adequada
↓
Abrir usuários administrativos
↓
Consultar usuário
↓
Executar operação permitida
↓
Confirmar alteração
```

 ## E2E-019-04 — Bloqueio de privilégio

```
Usuário sem permissão
↓
Tentar operação administrativa
↓
Acesso negado
```

---

 # 36\. Critérios de aceitação

 ## RF-035 — Administração de cupons

 - [ ] cupons podem ser consultados;
- [ ] operações permitidas podem ser executadas;
- [ ] regras existentes são preservadas;
- [ ] códigos não podem ser duplicados indevidamente;
- [ ] vigência é validada;
- [ ] limites são preservados;
- [ ] operações críticas são auditadas.

 ## RF-036 — Administração de promoções

 - [ ] promoções podem ser consultadas;
- [ ] operações aprovadas podem ser executadas;
- [ ] vigência é validada;
- [ ] estados são respeitados;
- [ ] nenhuma regra comercial nova é inventada;
- [ ] autorização é aplicada.

 ## RF-037 — Moderação de avaliações

 - [ ] avaliações podem ser consultadas;
- [ ] filtros funcionam;
- [ ] moderadores autorizados podem executar ações;
- [ ] transições inválidas são rejeitadas;
- [ ] alterações ficam rastreáveis;
- [ ] usuários sem autorização não moderam.

 ## RF-038 — Usuários administrativos

 - [ ] usuários administrativos podem ser consultados;
- [ ] operações aprovadas funcionam;
- [ ] roles existentes são respeitadas;
- [ ] privilege escalation é bloqueada;
- [ ] operações críticas são auditadas;
- [ ] nenhuma role nova é criada sem decisão explícita.

---

 # 37\. Rastreabilidade

 | Requisito | Área | Testes | Evidência |
| --- | --- | --- | --- |
| RF-035 | Cupons | unit + integration + API | relatório |
| RF-036 | Promoções | unit + integration + API | relatório |
| RF-037 | Avaliações | unit + integration + API \+ E2E | relatório |
| RF-038 | Usuários administrativos | unit + integration + security \+ E2E | relatório |
| RN-017 | Regras administrativas | domínio + autorização | relatório |
| UC-014 | Administração consolidada | E2E/API | relatório |

Durante a execução, substituir as referências genéricas por arquivos, testes, endpoints e commits reais.

---

 # 38\. Plano de implementação

 ## Etapa 1 — Readiness

 - confirmar `TASK-018 = DONE`;
- revisar RF-035–038;
- revisar RN-017;
- revisar UC-014;
- revisar RBAC existente;
- identificar roles existentes;
- identificar permissions existentes;
- identificar entidades existentes;
- identificar casos de uso existentes;
- registrar ambiguidades.

 ## Etapa 2 — Cupons e promoções

 - mapear contratos;
- implementar consultas;
- implementar operações administrativas;
- reutilizar domínio existente;
- aplicar autorização;
- aplicar auditoria;
- criar testes.

 ## Etapa 3 — Avaliações

 - mapear estados;
- implementar consulta administrativa;
- implementar moderação;
- aplicar transições existentes;
- aplicar autorização;
- aplicar auditoria;
- criar testes.

 ## Etapa 4 — Usuários administrativos

 - implementar consulta; se a alteração é diretamente necessária. Se for uma mudança arquitetural, registrar ADR antes de implement
- implementar operações aprovadas;
- conectar ao RBAC existente;
- proteger contra privilege escalation;
- aplicar auditoria;
- criar testes.

 ## Etapa 5 — UI administrativa

 Implementar:

 - listas;
- filtros;
- formulários;
- detalhes;
- confirmação de ações críticas;
- estados de loading;
- estados vazios;
- mensagens de erro;
- feedback de sucesso.

 Não criar telas para funcionalidades fora do escopo.

 ## Etapa 6 — Segurança

 Executar:

 - testes RBAC;
- testes de IDOR;
- testes de privilege escalation;
- testes de payload;
- testes de acesso direto aos endpoints.

 ## Etapa 7 — Quality Gates

 Executar:

```
build
lint
unit
integration
API
security
authorization
E2E aplicável
```

 ## Etapa 8 — Rastreabilidade

 Atualizar:

 - `TASKS.md`;
- matriz de requisitos;
- documentação de API;
- documentação administrativa;
- relatório de execução.

---

 # 39\. Scope Guard

 Antes de qualquer alteração:

 1. A mudança atende RF-035–038, RN-017 ou UC-014?
2. É necessária para a administração de cupons, promoções, avaliações ou usuários administrativos?
3. Reutiliza o domínio existente?
4. Está em `ALLOWED_CHANGES`?
5. Não viola `FORBIDDEN_CHANGES`?
6. Não cria role?
7. Não cria permission sem decisão?
8. Não cria novo mecanismo de autenticação?
9. Não antecipa TASK-020?
10. Possui teste ou justificativa técnica?

 Se alguma resposta for negativa, interromper a alteração.

---

 # 40\. Regra especial contra criação de RBAC

 Este é um dos principais Scope Guards da TASK-019.

 **Não transformar uma necessidade de tela em uma mudança de segurança.**

 Exemplo proibido:

```
A tela precisa esconder "Gerenciar usuários"
        ↓
criar nova role "SUPER_ADMIN"
```

 Exemplo correto:

```
A tela precisa esconder "Gerenciar usuários"
        ↓
consultar permission existente
        ↓
mostrar/ocultar
        ↓
backend valida a mesma permission
```

 Se a permission não existir:

```
registrar necessidade
↓
solicitar decisão
↓
não implementar workaround
```

---

 # 41\. Política de mudanças incidentais

 Aplicar:

```
MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED
```

 Permitido:

```
ajustar DTO compartilhado diretamente necessário
para exibir o estado administrativo existente.
```

 Proibido:

```
reestruturar todo o módulo de autenticação
```

 Proibido:

```
criar novo sistema de RBAC porque o existente não possui
a granularidade desejada.
```

 Proibido:

```
implementar notificações automáticas porque uma alteração
administrativa "poderia avisar o usuário".
```

 Notificações pertencem à TASK-020.

---

 # 42\. Auditoria

 A auditoria existente deve ser reutilizada.

 Para cada operação crítica, validar:

```
quem executou
qual operação
qual recurso
estado anterior, quando permitido
estado posterior, quando permitido
quando
resultado
```

 Não armazenar segredos.

 Se o mecanismo existente não suportar uma informação necessária, avaliar se a alteração é diretamente necessária. Se for uma mudança arquitetural, registrar ADR antes de implementá-la.

---

 # 43\. Privacidade

 Para usuários administrativos:

 - não expor credenciais;
- não expor hashes;
- não expor tokens;
- não expor sessões;
- não retornar secrets;
- limitar informações pessoais ao necessário.

 Para avaliações:

 - respeitar o contrato público;
- não expor informações internas de moderação;
- não expor dados administrativos desnecessários.

 Para cupons:

 - não expor informações internas desnecessárias de uso.

---

 # 44\. Performance

 Validar:

 - paginação;
- filtros no servidor;
- consultas eficientes;
- ausência de N+1;
- índices necessários;
- carregamento sob demanda de detalhes;
- não carregar todos os usuários administrativos de uma vez.

 Não executar otimização estrutural fora do escopo.

---

 # 45\. Checklist de pré-execução

 - [ ] TASK-018 = DONE
- [ ] TASK-019 = READY
- [ ] RF-035–038 revisados
- [ ] RN-017 revisada
- [ ] UC-014 revisada
- [ ] RBAC existente identificado
- [ ] roles existentes identificadas
- [ ] permissions existentes identificadas
- [ ] cupons/promoções existentes identificados
- [ ] avaliações existentes identificadas
- [ ] auditoria identificada
- [ ] Definition of Ready satisfeita
- [ ] bloqueios registrados

---

 # 46\. Checklist durante execução

 - [ ] administração de cupons
- [ ] administração de promoções
- [ ] moderação de avaliações
- [ ] administração de usuários
- [ ] RBAC existente reutilizado
- [ ] privilege escalation bloqueada
- [ ] autorização no backend
- [ ] auditoria
- [ ] filtros
- [ ] paginação
- [ ] validações
- [ ] testes unitários
- [ ] testes de integração
- [ ] testes de API
- [ ] testes de segurança
- [ ] E2E aplicável
- [ ] Scope Guard revisado
- [ ] TASK-020 não antecipada

---

 # 47\. Checklist de conclusão

 - [ ] RF-035 atendido
- [ ] RF-036 atendido
- [ ] RF-037 atendido
- [ ] RF-038 atendido
- [ ] RN-017 atendida
- [ ] UC-014 atendida
- [ ] build aprovado
- [ ] lint aprovado
- [ ] testes aprovados
- [ ] RBAC validado
- [ ] segurança validada
- [ ] auditoria validada
- [ ] documentação atualizada
- [ ] rastreabilidade atualizada
- [ ] Scope Guard aprovado
- [ ] ALLOWED\_CHANGES respeitado
- [ ] FORBIDDEN\_CHANGES não violado
- [ ] alterações incidentais justificadas
- [ ] nenhuma role nova criada sem decisão
- [ ] nenhuma permission nova criada sem decisão
- [ ] `TASKS.md` atualizado
- [ ] relatório produzido
- [ ] estado final registrado

---

 # 48\. Relatório de execução

 Ao concluir:

```
TASK: TASK-019
Estado inicial:
Estado final:

Resumo:
- ...

Cupons:
- ...

Promoções:
- ...

Avaliações:
- ...

Usuários administrativos:
- ...

Roles/permissions utilizadas:
- ...

Arquivos alterados:
- ...

APIs/contratos:
- ...

Migrations:
- ...

Testes adicionados:
- ...

Testes executados:
- ...

Build:
- PASS/FAIL

Lint:
- PASS/FAIL

Testes:
- PASS/FAIL

RBAC:
- PASS/FAIL

Segurança:
- PASS/FAIL

Privilege escalation:
- PASS/FAIL

Auditoria:
- PASS/FAIL

Scope Guard:
- PASS/FAIL

ALLOWED_CHANGES:
- PASS/FAIL

FORBIDDEN_CHANGES:
- PASS/FAIL

Alterações incidentais:
- Nenhuma
ou
- <justificativa>

Rastreabilidade:
- RF-035 → ...
- RF-036 → ...
- RF-037 → ...
- RF-038 → ...
- RN-017 → ...
- UC-014 → ...

ADRs:
- Nenhum
ou
- ADR-XXX

Bloqueios:
- Nenhum
ou
- ...

Riscos:
- ...

Observações:
- ...

Próxima TASK:
- TASK-020 permanece BLOCKED até TASK-019 estar DONE.

Ação automática:
- NÃO INICIAR TASK-020.
```

---

 # 49\. Transição de estado

 Fluxo normal:

```
BLOCKED
   ↓
READY
   ↓
IN_PROGRESS
   ↓
IN_REVIEW
   ↓
DONE
```

 Falha:

```
IN_PROGRESS → FAILED
IN_REVIEW   → FAILED
```

 Cancelamento:

```
READY / IN_PROGRESS / IN_REVIEW → CANCELLED
```

 Nunca iniciar diretamente:

```
BLOCKED → IN_PROGRESS
```

---

 # 50\. Gate de encerramento

 A TASK-019 somente pode receber `DONE` quando:

```
TASK-018 = DONE
AND
Definition of Ready satisfeita
AND
RF-035 atendido
AND
RF-036 atendido
AND
RF-037 atendido
AND
RF-038 atendido
AND
RN-017 atendida
AND
UC-014 atendida
AND
autorização validada
AND
RBAC existente preservado
AND
privilege escalation validada
AND
auditoria validada
AND
segurança validada
AND
build aprovado
AND
lint aprovado
AND
testes aplicáveis aprovados
AND
documentação atualizada
AND
rastreabilidade atualizada
AND
Scope Guard aprovado
AND
ALLOWED_CHANGES respeitado
AND
FORBIDDEN_CHANGES não violado
AND
DoD global atendido
AND
DoD específico atendido
AND
relatório de execução produzido
AND
TASKS.md atualizado
```

 Qualquer Gate obrigatório falhando impede `DONE`.

---

 # 51\. Resultado esperado

 Ao final da TASK-019, a administração deverá possuir:

```
ADMIN
│
├── CATÁLOGO / ESTOQUE / PEDIDOS
│   └── entregues pela TASK-018
│
├── PROMOÇÕES
│   ├── Cupons
│   └── Promoções
│
├── AVALIAÇÕES
│   ├── Consulta
│   ├── Filtros
│   └── Moderação
│
└── USUÁRIOS ADMINISTRATIVOS
    ├── Consulta
    ├── Operações aprovadas
    └── Roles existentes
```

 As operações críticas devem:

```
autenticar
   ↓
autorizar
   ↓
validar domínio
   ↓
executar
   ↓
persistir
   ↓
auditar
```

 Sem:

```
novas roles
novas permissions não aprovadas
bypass de RBAC
notificações
observabilidade nova
funcionalidades de TASK-020+
```

---

 # 52\. Regra após conclusão

 Quando todos os Gates forem aprovados:

```
TASK-019 = DONE
```