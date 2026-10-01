# TASK-018 — Administração de catálogo, estoque e pedidos

 **Status:** BLOCKED\
 **Phase/Priority:** PHASE-04 / HIGH\
 **Dependência:** `DEPENDS_ON: TASK-017`\
 **Política incidental:** `MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`

 ## 1\. Identificação

 **ID:** TASK-018\
 **Nome:** Administração de catálogo, estoque e pedidos\
 **Fase:** PHASE-04\
 **Prioridade:** HIGH\
 **Estado inicial:** BLOCKED\
 **Estado elegível para execução:** READY\
 **Dependência obrigatória:** TASK-017 = DONE

 **Relacionados:**

 - RF-031
- RF-032
- RF-033
- RF-034
- UC-010
- UC-011
- UC-012
- UC-013

---

 # 2\. Objetivo

 Consolidar as operações administrativas necessárias para gerenciamento operacional de:

 - produtos;
- categorias;
- marcas;
- variantes;
- preços;
- estoque;
- movimentações de inventário;
- pedidos;
- clientes, somente na extensão explicitamente prevista pelos requisitos;
- filtros e consultas operacionais;
- operações administrativas auditáveis.

 O objetivo é disponibilizar uma superfície administrativa coerente, segura e autorizada sobre os domínios já implementados nas fases anteriores.

 A TASK não deve introduzir novos domínios comerciais.

---

 # 3\. Contexto

 A TASK-018 ocorre após:

```
PHASE-01
identidade + autorização + auditoria
        ↓
PHASE-02
catálogo + variantes + preços + estoque
        ↓
PHASE-03
carrinho + checkout + pagamentos + pedidos
        ↓
TASK-017
avaliações + favoritos
        ↓
TASK-018
administração operacional
```

 Portanto, esta TASK deve **consumir e administrar os contratos existentes**, evitando duplicação de regras de domínio.

 O painel administrativo não deve possuir uma segunda implementação das regras comerciais.

---

 # 4\. Escopo

 ## 4.1 Catálogo administrativo

 Implementar ou consolidar:

 - listagem administrativa de produtos;
- consulta detalhada;
- criação, quando já prevista;
- edição;
- publicação/despublicação, conforme regra existente;
- filtros;
- busca;
- ordenação;
- gerenciamento administrativo de categorias;
- gerenciamento administrativo de marcas;
- gerenciamento de variantes;
- visualização de preços;
- validações de catálogo;
- controle de autorização.

 ## 4.2 Estoque administrativo

 Implementar ou consolidar:

 - consulta de saldo;
- consulta por produto/variante;
- histórico de movimentações;
- entrada;
- saída;
- ajuste;
- justificativa de movimentação, quando prevista;
- identificação do administrador responsável;
- tratamento de operações inválidas;
- proteção contra alterações não autorizadas.

 As operações devem utilizar o domínio de estoque já criado na PHASE-02.

 ## 4.3 Pedidos administrativos

 Implementar:

 - listagem administrativa;
- busca;
- filtros;
- consulta detalhada;
- visualização dos itens;
- visualização dos valores registrados no pedido;
- visualização de status;
- visualização de pagamento conforme contrato existente;
- visualização de entrega/rastreamento conforme dados já disponíveis;
- operações de pedido explicitamente autorizadas pelos requisitos;
- controle de transições de estado.

 Não criar novas regras de cancelamento, devolução ou reembolso.

 ## 4.4 Clientes

 A TASK pode disponibilizar somente a **visão operacional de clientes** expressamente exigida por RF-034/UC-013.

 Permitido:

 - consultar cliente;
- pesquisar cliente;
- visualizar informações necessárias à operação administrativa;
- aplicar filtros aprovados.

 Não criar nesta TASK:

 - gerenciamento de usuários administrativos;
- alteração de roles;
- criação de permissões;
- exclusão de conta;
- política de bloqueio;
- gestão avançada de identidade.

 Esses assuntos pertencem a outras tarefas ou decisões aprovadas.

---

 # 5\. Fora do escopo

 É expressamente proibido implementar:

 - gerenciamento de administradores;
- criação de novos roles;
- alteração de RBAC;
- gestão de permissões fora das existentes;
- gestão de cupons;
- gestão de promoções;
- moderação de avaliações;
- gestão de favoritos;
- notificações novas;
- sistema social;
- chat;
- recomendações;
- IA;
- ERP;
- CRM completo;
- contabilidade;
- emissão fiscal não especificada;
- gateway de pagamento;
- novo provedor de logística;
- nova política de devolução;
- nova política de cancelamento;
- nova política de reembolso;
- alteração do checkout;
- alteração do domínio de pedidos sem necessidade direta;
- alteração de arquitetura sem ADR.

---

 # 6\. ALLOWED\_CHANGES

 São permitidas:

```
src/**/admin/**
src/**/catalog/**
src/**/inventory/**
src/**/orders/**
src/**/customers/**

UI administrativa diretamente relacionada

API/contratos administrativos

tests/**

migrations/** somente quando diretamente necessárias

documentação administrativa

documentação de API

configuração diretamente necessária

TASKS.md
```

 Alterações em módulos existentes devem ser mínimas e diretamente relacionadas à exposição administrativa.

---

 # 7\. FORBIDDEN\_CHANGES

 Não realizar:

```
alteração de RBAC
criação de roles
bypass de autorização
alteração de preços sem regra existente
alteração de checkout
alteração do gateway
alteração de webhooks
alteração de política comercial
alteração de política de devolução
alteração de política de reembolso
alteração de avaliações
alteração de cupons
alteração de notificações
criação de ERP
criação de CRM
criação de funcionalidades sociais
```

 Também são proibidas refatorações não relacionadas.

---

 # 8\. Definition of Ready

 A TASK somente poderá entrar em `READY` quando:

 - `TASK-017 = DONE`;
- os requisitos RF-031 a RF-034 estiverem disponíveis;
- UC-010 a UC-013 estiverem disponíveis;
- RBAC da PHASE-01 estiver funcionando;
- catálogo da PHASE-02 estiver funcional;
- estoque da PHASE-02 estiver funcional;
- pedidos da PHASE-03 estiverem funcionais;
- autenticação administrativa estiver funcional;
- auditoria existente estiver disponível;
- contratos existentes forem identificados;
- regras de transição de pedido estiverem definidas;
- regras de alteração administrativa estiverem definidas;
- não existirem decisões críticas pendentes para o escopo.

 Se uma operação administrativa não possuir regra aprovada, ela não deve ser inventada.

---

 # 9\. Princípios arquiteturais

 ## 9.1 Reutilizar domínio existente

 O painel administrativo deve chamar os casos de uso/domínios existentes.

 Evitar:

```
Admin Controller
   ↓
SQL direto
```

 Preferir:

```
Admin UI/API
      ↓
Application Use Case
      ↓
Domain
      ↓
Repository
      ↓
Persistence
```

 ## 9.2 Autorização no servidor

 Ocultar botão na UI não constitui autorização.

 Toda operação administrativa deve ser autorizada no backend.

 ## 9.3 Ownership administrativo

 O usuário administrativo deve ser identificado pela sessão autenticada.

 Nunca confiar em um `adminId` fornecido pelo cliente para determinar quem executou uma operação.

---

 # 10\. Modelo funcional

 A administração deve ser organizada conceitualmente em:

```
ADMIN
├── Dashboard/visão operacional
├── Catálogo
│   ├── Produtos
│   ├── Categorias
│   ├── Marcas
│   └── Variantes
├── Estoque
│   ├── Saldos
│   └── Movimentações
├── Pedidos
│   ├── Lista
│   ├── Detalhes
│   └── Estados
└── Clientes
    ├── Pesquisa
    └── Consulta
```

 A estrutura final deve seguir o padrão de UI já adotado pelo projeto.

---

 # 11\. Administração de produtos

 ## Operações

 Validar quais operações estão previstas:

 - criar;
- consultar;
- editar;
- publicar;
- despublicar;
- arquivar, somente se já previsto.

 Cada operação deve passar pelas regras de autorização existentes.

 ## Validações

 - identificador válido;
- nome válido;
- categoria válida;
- marca válida;
- informações obrigatórias;
- variantes compatíveis;
- preço conforme regra existente;
- status permitido.

 Não criar nova regra comercial.

---

 # 12\. Administração de categorias

 Permitir somente operações previstas no requisito.

 Validar:

 - nome;
- identificador;
- unicidade;
- relacionamento com produtos;
- status;
- regras de exclusão/arquivamento existentes.

 Não excluir dados referenciados de forma destrutiva sem regra aprovada.

---

 # 13\. Administração de marcas

 Validar:

 - existência;
- nome;
- unicidade;
- associação com produtos;
- operações permitidas.

 Qualquer operação destrutiva deve respeitar as regras existentes.

---

 # 14\. Administração de variantes

 O administrador deve conseguir visualizar e administrar variantes conforme as capacidades já existentes.

 Validar:

 - produto;
- atributos;
- identificador;
- preço;
- disponibilidade;
- estoque relacionado.

 Não duplicar o cálculo de preço ou estoque.

---

 # 15\. Administração de estoque

 ## Consulta

 A interface deve permitir:

 - localizar produto;
- localizar variante;
- visualizar saldo;
- visualizar movimentações;
- identificar movimentações relevantes.

 ## Movimentação

 Quando permitida:

```
Entrada
Saída
Ajuste
```

 A operação deve:

 1. autenticar administrador;
2. verificar autorização;
3. validar produto/variante;
4. validar quantidade;
5. executar caso de uso de estoque;
6. registrar movimentação;
7. preservar integridade;
8. gerar auditoria quando exigido;
9. retornar resultado.

 Não modificar diretamente o saldo ignorando o mecanismo de movimentação existente.

---

 # 16\. Concorrência de estoque

 A operação administrativa não deve introduzir uma segunda estratégia de controle de concorrência.

 Devem ser preservadas as garantias já existentes na TASK-009.

 Testar:

 - duas operações concorrentes;
- saldo insuficiente;
- ajuste simultâneo;
- consistência da movimentação;
- ausência de saldo negativo indevido.

---

 # 17\. Administração de pedidos

 ## Listagem

 Deve permitir, conforme requisitos:

 - identificação do pedido;
- cliente;
- data;
- status;
- status de pagamento;
- status de entrega;
- valor;
- filtros;
- ordenação;
- paginação.

 ## Detalhes

 A visualização deve apresentar somente informações necessárias:

```
Pedido
├── identificação
├── cliente
├── itens
├── preços registrados
├── descontos registrados
├── total
├── pagamento
├── entrega
├── status
└── histórico aplicável
```

 Os preços históricos do pedido devem vir do pedido persistido, não ser recalculados pelo catálogo atual.

---

 # 18\. Transições de pedido

 A interface administrativa não deve permitir transições arbitrárias.

 Fluxo conceitual:

```
Estado atual
    ↓
validar transição
    ↓
autorizar operação
    ↓
executar domínio
    ↓
persistir
    ↓
auditar
```

 A matriz de estados existente deve ser reutilizada.

 Não criar:

 - novos estados;
- atalhos;
- transições administrativas especiais;

 sem decisão aprovada.

---

 # 19\. Clientes

 A administração de clientes deve ser somente operacional.

 Exemplos:

```
Pesquisar cliente
Consultar cliente
Consultar dados necessários ao pedido
```

 Não expor:

 - senha;
- tokens;
- segredos;
- dados de autenticação;
- informações pessoais desnecessárias.

 Não criar mecanismos de alteração de identidade administrativa nesta TASK.

---

 # 20\. RBAC

 A TASK-018 deve **consumir** o RBAC existente.

 Não alterar:

 - roles;
- permissions;
- matriz global;
- mecanismo de autenticação.

 Criar somente guards/policies administrativas caso sejam necessários para conectar o módulo ao mecanismo existente.

 Exemplo:

```
Admin autenticado
      ↓
Permission existente
      ↓
Admin operation
```

 Não:

```
Admin autenticado
      ↓
"admin = pode tudo"
```

---

 # 21\. Matriz de autorização

 A matriz deve ser derivada dos requisitos aprovados.

 Estrutura de validação:

 | Operação | Não autenticado | Cliente | Admin autorizado | Admin não autorizado |
| --- | --- | --- | --- | --- |
| Consultar catálogo administrativo | negar | negar | permitir | negar |
| Alterar produto | negar | negar | permitir conforme permissão | negar |
| Alterar estoque | negar | negar | permitir conforme permissão | negar |
| Consultar pedidos administrativos | negar | negar | permitir conforme permissão | negar |
| Alterar estado de pedido | negar | negar | permitir conforme permissão | negar |
| Consultar clientes | negar | negar | permitir conforme permissão | negar |

Os nomes das permissões devem usar o vocabulário já existente.

---

 # 22\. Auditoria

 Operações críticas devem utilizar o mecanismo de auditoria existente.

 Exemplos:

 - alteração de produto;
- publicação/despublicação;
- alteração de estoque;
- movimentação de inventário;
- alteração de estado de pedido;
- operações administrativas sensíveis.

 Cada registro deve permitir identificar, quando aplicável:

```
quem
o quê
quando
qual recurso
qual ação
resultado
```

 Não registrar:

 - senha;
- token;
- credencial;
- segredo;
- payload sensível desnecessário.

---

 # 23\. APIs administrativas

 Os contratos definitivos devem seguir o padrão existente.

 Exemplo conceitual:

```
GET    /admin/products
POST   /admin/products
GET    /admin/products/{id}
PATCH  /admin/products/{id}

GET    /admin/inventory
POST   /admin/inventory/movements

GET    /admin/orders
GET    /admin/orders/{id}
PATCH  /admin/orders/{id}/status

GET    /admin/customers
GET    /admin/customers/{id}
```

 Esses endpoints são ilustrativos.

 Não devem ser implementados automaticamente caso a aplicação utilize convenção diferente.

---

 # 24\. Filtros e pesquisa

 Filtros administrativos devem ser determinísticos.

 ## Produtos

 Possíveis filtros aprovados:

 - nome;
- SKU;
- categoria;
- marca;
- status;
- disponibilidade.

 ## Estoque

 Possíveis filtros:

 - produto;
- variante;
- SKU;
- saldo;
- período de movimentação.

 ## Pedidos

 Possíveis filtros:

 - número;
- cliente;
- status;
- pagamento;
- entrega;
- período.

 ## Clientes

 Possíveis filtros:

 - nome;
- e-mail;
- identificador;
- status, somente se existente.

 Não criar filtros que introduzam novas regras de negócio.

---

 # 25\. Paginação e ordenação

 Todas as listagens potencialmente grandes devem respeitar o padrão de paginação existente.

 Validar:

 - tamanho máximo de página;
- paginação consistente;
- ordenação determinística;
- filtros preservados entre páginas;
- ausência de duplicidade ou perda indevida.

 Não introduzir estratégia de paginação diferente sem necessidade.

---

 # 26\. Segurança

 Testar obrigatoriamente:

 - usuário comum não acessa painel administrativo;
- usuário não autorizado não executa operação protegida;
- alteração de `adminId` no payload não muda autor da ação;
- IDs de recursos não permitem acesso indevido;
- endpoints administrativos não podem ser chamados somente removendo elementos da UI;
- dados sensíveis não são retornados;
- dados sensíveis não aparecem em logs;
- operações críticas exigem autorização;
- mass assignment não altera campos protegidos.

---

 # 27\. Proteção contra IDOR

 Testar explicitamente:

```
Admin A
  ↓
recurso permitido

Admin A
  ↓
altera ID
  ↓
recurso não autorizado
  ↓
403/erro apropriado
```

 Também validar acesso por IDs de:

 - produto;
- estoque;
- pedido;
- cliente.

---

 # 28\. Testes unitários

 ## Catálogo

 - [ ] autorização;
- [ ] validação;
- [ ] atualização;
- [ ] publicação;
- [ ] estados permitidos.

 ## Estoque

 - [ ] quantidade válida;
- [ ] saldo insuficiente;
- [ ] operação autorizada;
- [ ] movimentação registrada;
- [ ] concorrência conforme domínio existente.

 ## Pedidos

 - [ ] consulta;
- [ ] transição válida;
- [ ] transição inválida;
- [ ] autorização;
- [ ] preservação dos valores históricos.

 ## Clientes

 - [ ] consulta;
- [ ] autorização;
- [ ] filtragem de dados sensíveis.

---

 # 29\. Testes de integração

 Validar:

 - [ ] API administrativa → aplicação;
- [ ] aplicação → domínio;
- [ ] domínio → persistência;
- [ ] auditoria;
- [ ] autorização;
- [ ] catálogo;
- [ ] estoque;
- [ ] pedidos;
- [ ] clientes.

---

 # 30\. Testes de API

 Para cada endpoint administrativo:

 - [ ] usuário não autenticado;
- [ ] usuário autenticado sem permissão;
- [ ] administrador autorizado;
- [ ] payload válido;
- [ ] payload inválido;
- [ ] recurso inexistente;
- [ ] recurso autorizado;
- [ ] tentativa de IDOR;
- [ ] resposta sem dados sensíveis;
- [ ] erro conforme padrão da API.

---

 # 31\. Testes de auditoria

 Para operações críticas:

```
Executar operação
        ↓
Verificar resultado
        ↓
Verificar AuditLog
        ↓
Verificar autor
        ↓
Verificar recurso
        ↓
Verificar timestamp
```

 Testar também que falhas não criam registros de sucesso incorretos.

---

 # 32\. Testes de UI administrativa

 Quando houver interface:

 - [ ] acesso ao painel protegido;
- [ ] menus conforme autorização;
- [ ] operações protegidas;
- [ ] feedback de sucesso;
- [ ] feedback de erro;
- [ ] validação de formulário;
- [ ] paginação;
- [ ] filtros;
- [ ] estados de loading;
- [ ] estados vazios;
- [ ] responsividade;
- [ ] acessibilidade básica dos controles.

 A UI não substitui os testes de autorização da API.

---

 # 33\. Testes E2E aplicáveis

 Cenários mínimos:

 ### E2E-018-01 — Administração de produto

```
Login administrativo
↓
Abrir catálogo
↓
Localizar produto
↓
Executar operação permitida
↓
Confirmar resultado
```

 ### E2E-018-02 — Estoque

```
Login administrativo
↓
Abrir estoque
↓
Localizar variante
↓
Executar movimentação permitida
↓
Consultar saldo
↓
Verificar movimentação
```

 ### E2E-018-03 — Pedido

```
Login administrativo
↓
Abrir pedidos
↓
Filtrar pedido
↓
Abrir detalhes
↓
Executar transição permitida
↓
Confirmar estado
```

 ### E2E-018-04 — Autorização

```
Usuário não administrativo
↓
Tentar acessar /admin
↓
Acesso negado
```

---

 # 34\. Critérios de aceitação

 ## RF-031 — Administração de catálogo

 - [ ] operações administrativas de catálogo funcionam;
- [ ] autorização é aplicada;
- [ ] filtros e consultas funcionam;
- [ ] regras de catálogo existentes são preservadas;
- [ ] alterações são persistidas corretamente;
- [ ] operações críticas são auditadas quando aplicável.

 ## RF-032 — Administração de estoque

 - [ ] saldo pode ser consultado;
- [ ] movimentações podem ser consultadas;
- [ ] operações permitidas funcionam;
- [ ] saldo permanece consistente;
- [ ] concorrência aplicável permanece protegida;
- [ ] movimentações possuem rastreabilidade.

 ## RF-033 — Administração de pedidos

 - [ ] pedidos podem ser consultados;
- [ ] filtros funcionam;
- [ ] detalhes preservam dados históricos;
- [ ] estados são exibidos corretamente;
- [ ] transições inválidas são rejeitadas;
- [ ] operações permitidas respeitam autorização.

 ## RF-034 — Administração/consulta de clientes

 - [ ] clientes podem ser consultados conforme requisito;
- [ ] acesso é restrito;
- [ ] dados sensíveis não são expostos;
- [ ] filtros funcionam quando aplicáveis.

---

 # 35\. Rastreabilidade

 | Requisito | Área | Testes | Evidência |
| --- | --- | --- | --- |
| RF-031 | Admin/Catálogo | unit + integration + API | relatório |
| RF-032 | Admin/Estoque | unit + integration + API | relatório |
| RF-033 | Admin/Pedidos | unit + integration + API | relatório |
| RF-034 | Admin/Clientes | unit + integration + API | relatório |
| UC-010 | Catálogo/Estoque | E2E/API | relatório |
| UC-011 | Catálogo/Estoque | E2E/API | relatório |
| UC-012 | Pedidos | E2E/API | relatório |
| UC-013 | Clientes | E2E/API | relatório |

Adicionar referências concretas a arquivos, testes, endpoints e commits durante a execução.

---

 # 36\. Plano de implementação

 ## Etapa 1 — Readiness

 - confirmar TASK-017 = DONE;
- revisar RF-031–034;
- revisar UC-010–013;
- mapear permissões existentes;
- mapear entidades existentes;
- mapear casos de uso existentes;
- identificar operações administrativas já disponíveis;
- identificar lacunas reais.

 ## Etapa 2 — Desenho administrativo

 Definir:

 - estrutura do painel;
- navegação;
- listagens;
- filtros;
- detalhes;
- ações;
- estados;
- mensagens de erro;
- permissões por operação.

 Não alterar arquitetura sem ADR.

 ## Etapa 3 — Catálogo

 - implementar/consolidar consultas;
- implementar operações administrativas necessárias;
- aplicar autorização;
- adicionar testes.

 ## Etapa 4 — Estoque

 - implementar/consolidar consultas;
- conectar movimentações ao domínio existente;
- validar autorização;
- validar auditoria;
- adicionar testes.

 ## Etapa 5 — Pedidos

 - implementar/consolidar listagem;
- implementar filtros;
- implementar detalhes;
- implementar somente transições aprovadas;
- adicionar testes.

 ## Etapa 6 — Clientes

 - implementar consultas necessárias;
- filtrar dados sensíveis;
- aplicar autorização;
- adicionar testes.

 ## Etapa 7 — UI

 Implementar a superfície administrativa conforme o padrão visual existente.

 Priorizar:

 - clareza operacional;
- estados de loading;
- estados vazios;
- mensagens de erro;
- confirmação de ações críticas;
- acessibilidade.

 ## Etapa 8 — Auditoria

 Confirmar que operações críticas produzem os registros esperados.

 ## Etapa 9 — Quality Gates

 Executar:

```
build
lint
unit tests
integration tests
API tests
authorization tests
security tests
E2E aplicável
```

 ## Etapa 10 — Rastreabilidade

 Atualizar:

 - TASKS.md;
- matriz de requisitos;
- documentação de API;
- documentação administrativa;
- relatório de execução.

---

 # 37\. Scope Guard

 Antes de cada mudança:

 1. A mudança atende RF-031, RF-032, RF-033, RF-034 ou UC-010–013?
2. É necessária para uma operação administrativa prevista?
3. Usa domínio existente em vez de duplicá-lo?
4. Está em `ALLOWED_CHANGES`?
5. Não viola `FORBIDDEN_CHANGES`?
6. Não cria nova regra comercial?
7. Não altera RBAC?
8. Não antecipa TASK-019?
9. Não cria funcionalidades de TASK-020/021/022?
10. Possui teste ou justificativa técnica?

 Se qualquer resposta for negativa, interromper a alteração e avaliar o escopo.

---

 # 38\. Regra especial contra antecipação da TASK-019

 A TASK-018 **não deve implementar administração de:**

 - cupons;
- promoções;
- avaliações;
- moderação;
- usuários administrativos;
- roles;
- permissions.

 Mesmo que seja conveniente colocar esses recursos no mesmo painel, eles pertencem à TASK-019.

 É permitido apenas preparar a estrutura de navegação se isso não implementar funcionalidade futura.

 Exemplo permitido:

```
Admin
├── Catálogo
├── Estoque
├── Pedidos
├── Clientes
└── [áreas futuras não funcionais]
```

 Exemplo proibido:

```
Admin
└── Usuários
    └── alteração de roles
```

---

 # 39\. Política de mudanças incidentais

 Aplicar:

```
MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED
```

 Exemplo permitido:

```
ajustar um DTO compartilhado porque o novo endpoint administrativo
precisa representar corretamente um campo já existente.
```

 Exemplo proibido:

```
refatorar todo o módulo de pedidos para "melhorar a arquitetura"
```

 Exemplo proibido:

```
criar um novo sistema de permissões porque o painel administrativo
precisa de uma permissão que ainda não foi definida.
```

 Nesse segundo caso, registrar o bloqueio/necessidade de decisão.

---

 # 40\. Auditoria de alterações

 Para cada operação administrativa crítica, validar:

 | Operação | Auditoria |
| --- | --- |
| alteração de produto | conforme mecanismo existente |
| publicação/despublicação | conforme mecanismo existente |
| ajuste de estoque | obrigatório quando previsto |
| movimentação de estoque | obrigatório quando previsto |
| alteração de pedido | conforme regra existente |
| consulta sensível de cliente | conforme política existente |

Não criar um segundo sistema de auditoria.

---

 # 41\. Privacidade

 O painel administrativo deve obedecer aos controles já definidos na PHASE-01.

 Nunca exibir:

 - senha;
- hash de senha;
- token;
- sessão;
- segredo;
- credencial;
- informações internas desnecessárias.

 Para clientes, retornar apenas os dados necessários à operação.

---

 # 42\. Performance

 Validar pelo menos:

 - paginação;
- filtros no servidor;
- ausência de carregamento indiscriminado de grandes conjuntos;
- consultas evitando N+1 quando aplicável;
- índices existentes utilizados adequadamente;
- listagens administrativas não carregando relações desnecessárias.

 Não fazer otimização arquitetural ampla fora do escopo.

---

 # 43\. Checklist pré-execução

 - [ ] TASK-017 = DONE
- [ ] TASK-018 = READY
- [ ] RF-031–034 revisados
- [ ] UC-010–013 revisados
- [ ] RBAC existente identificado
- [ ] entidades existentes identificadas
- [ ] casos de uso existentes identificados
- [ ] matriz de estados de pedidos identificada
- [ ] auditoria identificada
- [ ] Definition of Ready satisfeita
- [ ] bloqueios registrados

---

 # 44\. Checklist durante execução

 - [ ] painel administrativo protegido
- [ ] catálogo administrativo implementado
- [ ] estoque administrativo implementado
- [ ] pedidos administrativos implementados
- [ ] consulta de clientes implementada
- [ ] filtros implementados
- [ ] paginação implementada
- [ ] autorização no backend
- [ ] auditoria aplicada
- [ ] dados sensíveis protegidos
- [ ] testes unitários
- [ ] testes de integração
- [ ] testes de API
- [ ] testes de segurança
- [ ] E2E aplicável
- [ ] Scope Guard revisado
- [ ] nenhuma funcionalidade da TASK-019 antecipada

---

 # 45\. Checklist de conclusão

 - [ ] RF-031 atendido
- [ ] RF-032 atendido
- [ ] RF-033 atendido
- [ ] RF-034 atendido
- [ ] UC-010 atendido
- [ ] UC-011 atendido
- [ ] UC-012 atendido
- [ ] UC-013 atendido
- [ ] build aprovado
- [ ] lint aprovado
- [ ] testes aplicáveis aprovados
- [ ] segurança aprovada
- [ ] autorização aprovada
- [ ] auditoria validada
- [ ] documentação atualizada
- [ ] rastreabilidade atualizada
- [ ] Scope Guard aprovado
- [ ] ALLOWED\_CHANGES respeitado
- [ ] FORBIDDEN\_CHANGES não violado
- [ ] alterações incidentais justificadas
- [ ] `TASKS.md` atualizado
- [ ] relatório produzido
- [ ] estado final registrado

---

 # 46\. Relatório de execução

 Ao concluir, produzir:

```
TASK: TASK-018
Estado inicial:
Estado final:

Resumo:
- ...

Áreas implementadas:
- Catálogo:
- Estoque:
- Pedidos:
- Clientes:

Arquivos alterados:
- ...

APIs/contratos:
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

Segurança:
- PASS/FAIL

Autorização:
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
- RF-031 → ...
- RF-032 → ...
- RF-033 → ...
- RF-034 → ...
- UC-010 → ...
- UC-011 → ...
- UC-012 → ...
- UC-013 → ...

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
- TASK-019 permanece BLOCKED até TASK-018 estar DONE.

Ação automática:
- NÃO INICIAR TASK-019.
```

---

 # 47\. Transição de estado

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

 Em caso de falha:

```
IN_PROGRESS → FAILED
IN_REVIEW   → FAILED
```

 Cancelamento:

```
READY / IN_PROGRESS / IN_REVIEW → CANCELLED
```

 Nunca:

```
BLOCKED → IN_PROGRESS
```

 sem que a Definition of Ready e todas as dependências estejam satisfeitas.

---

 # 48\. Gate de encerramento

 A TASK-018 somente pode receber `DONE` quando:

```
TASK-017 = DONE
AND
Definition of Ready satisfeita
AND
RF-031 atendido
AND
RF-032 atendido
AND
RF-033 atendido
AND
RF-034 atendido
AND
UC-010 atendido
AND
UC-011 atendido
AND
UC-012 atendido
AND
UC-013 atendido
AND
autorização validada
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

 # 49\. Resultado esperado

 Ao final da TASK-018, o sistema deve possuir uma superfície administrativa operacional capaz de trabalhar sobre os domínios existentes:

```
ADMIN
│
├── CATÁLOGO
│   ├── Produtos
│   ├── Categorias
│   ├── Marcas
│   └── Variantes
│
├── ESTOQUE
│   ├── Saldos
│   └── Movimentações
│
├── PEDIDOS
│   ├── Listagem
│   ├── Filtros
│   ├── Detalhes
│   └── Estados
│
└── CLIENTES
    ├── Pesquisa
    └── Consulta
```

 Todos os recursos administrativos devem:

```
respeitar autenticação
        ↓
respeitar RBAC existente
        ↓
usar casos de uso existentes
        ↓
preservar regras de domínio
        ↓
registrar operações críticas
        ↓
ser testados
```

 A TASK-018 deve terminar sem implementar funcionalidades pertencentes à TASK-019.

---

 # 50\. Regra após conclusão

 Ao finalizar:

```
TASK-018 = DONE
```

 a execução deve **parar**.

 Não iniciar automaticamente:

```
TASK-019
```