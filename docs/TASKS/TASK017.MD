# TASK-017 — Avaliações e favoritos

 **Status:** DONE (2026-11-04)\
 **Phase/Priority:** PHASE-04 / CRITICAL\
 **Dependência:** `DEPENDS_ON: TASK-016`\
 **Política incidental:** `MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`

 ## 1\. Identificação

 **ID:** TASK-017\
 **Nome:** Avaliações e favoritos\
 **Fase:** PHASE-04\
 **Prioridade:** CRITICAL\
 **Estado inicial esperado:** BLOCKED\
 **Estado elegível para execução:** READY\
 **Dependência obrigatória:** TASK-016 = DONE

 **Relacionados:**

 - RF-029
- RF-030
- RN-015
- RN-016
- UC-009

 **Objetivo de negócio:**

 Implementar o domínio de avaliações de produtos e favoritos/wishlist, permitindo que clientes autenticados registrem avaliações conforme as regras aprovadas e mantenham sua própria lista de produtos favoritos, com isolamento de dados, autorização, regras de publicação e rastreabilidade adequadas.

---

 # 2\. Contexto

 A TASK-017 inicia a PHASE-04 após a conclusão e validação do fluxo comercial da PHASE-03.

 As funcionalidades desta TASK devem consumir os contratos e entidades já existentes, especialmente:

 - identidade/autenticação;
- autorização/RBAC;
- clientes;
- produtos;
- variantes, quando aplicável;
- pedidos;
- histórico de pedidos;
- auditoria, quando necessária;
- infraestrutura de testes e persistência.

 A implementação não deve recriar mecanismos que já tenham sido estabelecidos nas fases anteriores.

---

 # 3\. Escopo

 ## 3.1 Incluído

 ### Avaliações

 Implementar:

 - criação de avaliação por cliente autenticado;
- associação da avaliação a um produto;
- identificação do autor;
- nota conforme faixa aprovada;
- comentário, se permitido pelo requisito;
- estado de publicação/moderação conforme regra aprovada;
- consulta das avaliações publicadas;
- consulta das avaliações pertencentes ao próprio cliente, quando aplicável;
- edição conforme regra aprovada;
- tratamento de avaliação inválida;
- validação da elegibilidade do cliente para avaliar, quando exigida por RN-015;
- prevenção de duplicidade quando houver regra aplicável;
- autorização de leitura e escrita;
- testes das regras de publicação.

 ### Favoritos

 Implementar:

 - adicionar produto aos favoritos;
- remover produto dos favoritos;
- consultar favoritos do cliente autenticado;
- impedir acesso aos favoritos de outro cliente;
- impedir duplicação do mesmo favorito;
- tratamento de produto inexistente ou não elegível, conforme regras existentes;
- persistência dos favoritos;
- testes de autorização e integridade.

---

 # 4\. Fora do escopo

 Não implementar nesta TASK:

 - sistema social;
- seguidores;
- comentários entre usuários;
- chat interno;
- mensagens privadas;
- recomendações algorítmicas;
- recomendação por IA;
- ranking personalizado;
- motor de recomendação;
- feed social;
- curtidas sociais;
- gamificação;
- programa de pontos;
- novas regras de catálogo;
- alteração de preço;
- checkout;
- pagamento;
- pedidos;
- logística;
- alterações no fluxo de autenticação;
- novos papéis de usuário;
- alterações de RBAC não exigidas diretamente;
- alteração de requisitos comerciais;
- integração externa não aprovada.

 **Regra:** se uma necessidade descoberta durante a implementação não for diretamente necessária para satisfazer os critérios desta TASK, ela deve ser registrada como pendência e não implementada incidentalmente.

---

 # 5\. ALLOWED\_CHANGES

 São permitidas somente alterações diretamente relacionadas à TASK:

```
src/**/reviews/**
src/**/favorites/**
src/**/customer-area/**

tests/**

migrations/** ou mecanismo equivalente de persistência,
somente para estruturas diretamente necessárias a Review/Favorite

contratos/API diretamente relacionados a reviews/favorites

documentação diretamente necessária

TASKS.md

arquivos de configuração de testes,
somente quando diretamente necessários

arquivos compartilhados,
somente quando a alteração for mínima e diretamente causada pela TASK
```

 Alterações em arquivos compartilhados devem ser justificadas no relatório de execução.

---

 # 6\. FORBIDDEN\_CHANGES

 É proibido:

```
sistema social
chat interno
mensageria entre clientes
recomendação algorítmica
recomendação por IA
alteração de checkout
alteração de pagamento
alteração de pedidos sem necessidade direta
alteração de estoque
alteração de catálogo sem necessidade direta
novos papéis de autorização
bypass de autorização
alteração unilateral de requisitos
alteração arquitetural sem ADR
integrações externas não aprovadas
remoção de auditoria existente
remoção de histórico
alteração de regras comerciais não relacionadas
```

 Também é proibido utilizar esta TASK como justificativa para "limpeza geral", refatorações oportunistas ou modernização de módulos não relacionados.

---

 # 7\. Definition of Ready

 A TASK somente poderá sair de `BLOCKED` para `READY` quando:

 - `TASK-016` estiver `DONE`;
- o checkpoint da PHASE-03 estiver aprovado;
- o contrato de identidade/cliente estiver disponível;
- o modelo de produto estiver disponível;
- as regras aprovadas de avaliação estiverem identificadas;
- estiver definida a regra de elegibilidade para avaliação;
- estiver definida a regra de publicação/moderação;
- estiver definida a faixa de nota permitida;
- estiver definido se existe limite de uma avaliação por cliente/produto;
- persistência disponível para os novos agregados;
- ambiente de testes funcional;
- nenhuma decisão necessária permanecer oculta;
- eventual ambiguidade de requisito estiver registrada para decisão antes da implementação.

 **Importante:** se alguma regra de negócio necessária não estiver definida nos requisitos aprovados, não inventar comportamento. Registrar o bloqueio.

 **Decisões aprovadas em 2026-11-04:**

 - somente cliente autenticado com pedido `PAYMENT_CONFIRMED` contendo o produto pode criar avaliação; avaliações gerais do site estão fora do escopo;
- uma avaliação por cliente/produto; o autor pode editar a própria avaliação;
- nota inteira de 1 a 5; comentário opcional de até 2.000 caracteres;
- nova avaliação começa `PENDING`; publicação/moderação administrativa pertence à TASK-019;
- edição de avaliação `PUBLISHED` ou `REJECTED` retorna a avaliação para `PENDING`, removendo-a das consultas públicas até nova moderação;
- somente avaliações `PUBLISHED` de produtos publicados aparecem publicamente;
- produto arquivado/inativo oculta avaliações públicas, preserva avaliação própria e favorito, impede nova avaliação e permite editar a avaliação própria, que permanece privada/oculta.

 **Prontidão (2026-11-04): PASS.** TASK-016 está `DONE`; contratos existentes de identidade, produtos, pedidos, itens do pedido e pagamentos estão disponíveis; elegibilidade, limite, edição, publicação, validação e produto inativo foram definidos. Branch `feature/TASK-017-reviews-favorites`; transições `BLOCKED → READY → IN_PROGRESS`.

---

 # 8\. Premissas de implementação

 As seguintes decisões somente podem ser consideradas válidas se já estiverem aprovadas pelos requisitos/ADRs:

 ## 8.1 Identidade

 Toda operação privada deve derivar o cliente do contexto autenticado.

 Não aceitar `customerId` fornecido pelo cliente como mecanismo de autorização.

 Exemplo conceitual:

```
authenticatedUser
        ↓
authorized customer context
        ↓
Review/Favorite operation
```

 Nunca:

```
request.customerId
        ↓
assume ownership
```

 ## 8.2 Ownership

 Um cliente somente pode:

 - criar/modificar sua própria avaliação;
- consultar dados privados próprios;
- adicionar/remover seus próprios favoritos.

 O cliente não pode acessar ou modificar dados privados de outro cliente.

 ## 8.3 Produto

 Avaliações e favoritos devem referenciar produtos existentes por identificador estável.

 Não duplicar informações de catálogo que possam gerar inconsistência.

 ## 8.4 Publicação

 A avaliação deve possuir estado explícito caso a regra de publicação/moderação exija isso.

 Exemplo conceitual:

```
PENDING
PUBLISHED
REJECTED
```

 Os estados reais devem seguir o requisito aprovado.

 Não criar estados adicionais sem necessidade documentada.

---

 # 9\. Modelo de domínio esperado

 ## 9.1 Review

 Estrutura conceitual mínima:

```
Review
├── id
├── productId
├── customerId
├── rating
├── comment/content
├── status
├── createdAt
├── updatedAt
└── publishedAt (se aplicável)
```

 Os campos definitivos devem respeitar o modelo arquitetural existente.

 ### Invariantes esperadas

 - `productId` deve referenciar produto existente;
- `customerId` deve referenciar cliente existente;
- `rating` deve obedecer à faixa aprovada;
- conteúdo inválido deve ser rejeitado;
- estado de publicação deve obedecer às regras aprovadas;
- cliente não pode escrever em avaliação de outro cliente;
- avaliação não publicada não deve aparecer onde somente avaliações públicas são permitidas;
- duplicidade deve ser impedida se RN-015 determinar unicidade.

---

 # 10\. Modelo de favoritos esperado

 ## 10.1 Favorite

 Estrutura conceitual:

```
Favorite
├── id
├── customerId
├── productId
└── createdAt
```

 ### Invariantes esperadas

 - cliente deve existir;
- produto deve existir;
- `customerId` deve derivar da identidade autenticada;
- o mesmo cliente não deve possuir duplicidade para o mesmo produto;
- um cliente não pode acessar favoritos de outro;
- remoção deve ser idempotente conforme contrato aprovado;
- referências inválidas devem ser rejeitadas.

---

 # 11\. Regras de negócio

 ## RN-015 — Avaliações

 Implementar somente as regras formalmente aprovadas para avaliação.

 Checklist de validação:

 - [ ] somente cliente autenticado pode criar avaliação;
- [ ] produto deve existir;
- [ ] rating deve estar na faixa válida;
- [ ] conteúdo deve respeitar as validações aprovadas;
- [ ] elegibilidade do cliente deve ser validada;
- [ ] duplicidade deve ser tratada conforme regra aprovada;
- [ ] avaliação inválida não deve ser publicada;
- [ ] avaliação deve assumir o estado correto;
- [ ] autor da avaliação deve ser derivado da sessão/contexto autenticado;
- [ ] acesso de terceiros deve ser rejeitado quando aplicável.

 ## RN-016 — Favoritos

 Checklist:

 - [ ] somente cliente autenticado pode manter favoritos;
- [ ] produto deve existir;
- [ ] favorito pertence exclusivamente ao cliente autenticado;
- [ ] duplicidade deve ser impedida;
- [ ] inclusão deve ser determinística;
- [ ] remoção deve respeitar ownership;
- [ ] consulta deve retornar somente favoritos autorizados.

---

 # 12\. Casos de uso

 ## UC-009 — Avaliar produto e favoritar produto

 ### UC-009-A — Criar avaliação

 **Pré-condições:**

 - usuário autenticado;
- cliente válido;
- produto existente;
- regras de elegibilidade satisfeitas.

 **Fluxo:**

```
Cliente
  ↓
Solicita avaliação
  ↓
Autenticação/autorização
  ↓
Validação do produto
  ↓
Validação das regras RN-015
  ↓
Persistência da avaliação
  ↓
Determinação do estado de publicação
  ↓
Resposta
```

 ### UC-009-B — Consultar avaliações

```
Cliente/visitante autorizado
  ↓
Solicita avaliações públicas
  ↓
Filtro por produto
  ↓
Somente avaliações publicáveis
  ↓
Resposta
```

 ### UC-009-C — Adicionar favorito

```
Cliente autenticado
  ↓
Solicita favorito
  ↓
Autorização
  ↓
Validação do produto
  ↓
Verificação de duplicidade
  ↓
Persistência
  ↓
Resposta
```

 ### UC-009-D — Remover favorito

```
Cliente autenticado
  ↓
Solicita remoção
  ↓
Validação de ownership
  ↓
Remoção
  ↓
Resposta
```

---

 # 13\. Contratos de API

 Os endpoints definitivos devem seguir o padrão já adotado pelo projeto.

 Exemplo conceitual:

```
POST   /products/{productId}/reviews
GET    /products/{productId}/reviews

GET    /customer/reviews
PATCH  /reviews/{reviewId}

GET    /customer/favorites
POST   /customer/favorites/{productId}
DELETE /customer/favorites/{productId}
```

 **Não considerar esses paths como contrato definitivo caso o projeto já possua convenção diferente.**

 ### Requisitos dos contratos

 - autenticação adequada;
- autorização adequada;
- DTOs separados das entidades de domínio quando esse for o padrão do projeto;
- validação de entrada;
- respostas de erro consistentes;
- não exposição de dados privados desnecessários;
- paginação quando exigida pelo padrão existente;
- documentação atualizada quando houver contrato público.

---

 # 14\. Autorização

 A matriz mínima deve ser validada:

 | Operação | Visitante | Cliente | Outro cliente | Admin |
| --- | --- | --- | --- | --- |
| Ver avaliações públicas | conforme regra | permitido | permitido | permitido |
| Criar avaliação | não | permitido se elegível | não | conforme regra |
| Editar própria avaliação | não | conforme regra | não | conforme permissão |
| Editar avaliação de outro cliente | não | não | não | somente se já previsto |
| Ver próprios favoritos | não | permitido | não | conforme regra |
| Adicionar favorito | não | permitido | não | conforme regra |
| Remover próprio favorito | não | permitido | não | conforme regra |
| Ver favoritos de outro cliente | não | não | não | somente se explicitamente permitido |

A matriz final deve refletir os requisitos aprovados e não deve criar permissões novas.

---

 # 15\. Persistência

 ## Review

 Definir:

 - chave primária;
- foreign key para produto;
- foreign key para cliente;
- estado da avaliação, se aplicável;
- timestamps;
- índices necessários;
- restrições de integridade;
- unicidade, caso determinada por RN-015.

 ## Favorite

 Definir:

 - chave primária;
- foreign key para cliente;
- foreign key para produto;
- timestamp;
- índice para consulta por cliente;
- restrição de unicidade `(customerId, productId)`, se compatível com o modelo aprovado.

 ### Migrações

 Qualquer migration deve:

 - ser versionada;
- ser reproduzível;
- possuir rollback quando o padrão do projeto exigir;
- não alterar tabelas não relacionadas sem necessidade direta;
- preservar dados existentes;
- ser coberta por testes aplicáveis.

---

 # 16\. Tratamento de erros

 Devem ser definidos e testados, conforme o padrão existente:

```
não autenticado
não autorizado
produto inexistente
cliente inexistente/inválido
avaliação inexistente
favorito inexistente
avaliação duplicada
favorito duplicado
rating inválido
conteúdo inválido
cliente não elegível
avaliação não publicável
```

 Não expor detalhes internos da aplicação ou informações sensíveis.

---

 # 17\. Testes obrigatórios

 ## 17.1 Testes unitários

 ### Review

 - [x] rating válido;
- [x] rating inválido;
- [x] conteúdo válido;
- [x] conteúdo inválido;
- [x] produto inexistente;
- [x] cliente inválido/fora do papel de cliente;
- [x] cliente não elegível;
- [x] avaliação duplicada, quando aplicável;
- [x] estado inicial correto;
- [x] publicação conforme regra;
- [x] invariantes do domínio.

 ### Favorite

 - [x] criação válida;
- [x] produto inexistente;
- [x] duplicidade;
- [x] remoção;
- [x] ownership;
- [x] invariantes.

---

 # 18\. Testes de integração

 Devem validar, no mínimo:

 - [x] criação de avaliação persistida;
- [x] leitura de avaliações;
- [x] isolamento por cliente;
- [x] persistência de favoritos;
- [x] remoção de favoritos;
- [x] restrições de integridade;
- [x] unicidade;
- [x] transações aplicáveis;
- [x] comportamento em concorrência quando houver risco de duplicidade.

---

 # 19\. Testes de API

 Validar:

```
HTTP 2xx para fluxos válidos
HTTP 4xx para entradas inválidas
HTTP 401 para ausência de autenticação
HTTP 403 para ausência de autorização
HTTP 404 quando recurso inexistente
```

 Os códigos exatos devem seguir a convenção da aplicação.

 Também validar:

 - payload;
- schema;
- autenticação;
- autorização;
- ownership;
- não exposição de dados privados;
- paginação, se aplicável;
- consistência dos erros.

---

 # 20\. Testes de segurança

 Obrigatórios:

 - [x] cliente A não consegue acessar favoritos do cliente B;
- [x] cliente A não consegue editar avaliação do cliente B;
- [x] `customerId` enviado no payload não permite impersonação;
- [x] usuário não autenticado não cria avaliação;
- [x] usuário não autenticado não altera favoritos;
- [x] tentativa de manipulação de `reviewId` é rejeitada;
- [x] tentativa de manipulação de `customerId` é rejeitada;
- [x] dados sensíveis não aparecem na resposta pública;
- [x] nenhuma credencial/segredo é registrada pelos novos fluxos.

---

 # 21\. Testes de concorrência

 Quando aplicável, validar especialmente:

```
duas inclusões simultâneas do mesmo favorito
duas avaliações simultâneas do mesmo cliente/produto
```

 O resultado deve preservar as invariantes de unicidade e integridade.

 Não aceitar uma solução baseada somente em verificação prévia na aplicação quando uma restrição transacional/banco for necessária para garantir integridade.

---

 # 22\. Critérios de aceitação

 A TASK somente poderá ser considerada concluída quando:

 ### Avaliações

 - [x] cliente consegue avaliar conforme regra aprovada;
- [x] avaliação possui autor corretamente associado;
- [x] somente avaliação válida é aceita;
- [x] regras de elegibilidade são respeitadas;
- [x] avaliações inválidas não são publicadas;
- [x] regras de publicação são determinísticas;
- [x] cliente não consegue alterar avaliação de outro cliente;
- [x] avaliações públicas respeitam o estado de publicação;
- [x] duplicidade é tratada conforme requisito.

 ### Favoritos

 - [x] cliente consegue adicionar produto aos favoritos;
- [x] cliente consegue remover favorito;
- [x] cliente consegue consultar seus favoritos;
- [x] cliente não consegue acessar favoritos de outro cliente;
- [x] duplicidade é impedida;
- [x] produto inválido é rejeitado.

 ### Qualidade

 - [x] testes unitários passam;
- [x] testes de integração passam;
- [x] testes de API passam;
- [x] testes de autorização passam;
- [x] build passa;
- [x] lint passa, com aviso preexistente documentado;
- [x] documentação necessária está atualizada;
- [x] rastreabilidade está atualizada.

---

 # 23\. Rastreabilidade

 | Requisito | Implementação | Teste | Evidência |
| --- | --- | --- | --- |
| RF-029 | `src/modules/reviews/**`; `/api/products/{productId}/reviews`, `/api/customer/reviews`, `/api/reviews/{reviewId}` | `tests/unit/review-domain.test.ts`; `tests/integration/review-favorite-flow.test.ts` | `npm run quality`; seção 31 |
| RF-030 | `src/modules/favorites/**`; `/api/customer/favorites` e `/api/customer/favorites/{productId}` | `tests/integration/review-favorite-flow.test.ts` | `npm run quality`; seção 31 |
| RN-015 | validação, elegibilidade, estados e ownership em `src/modules/reviews/**` | testes de domínio/API em `review-domain.test.ts` e `review-favorite-flow.test.ts` | `npm run quality`; seção 31 |
| RN-016 | ownership, unicidade e persistência em `src/modules/favorites/**` | `tests/integration/review-favorite-flow.test.ts` | `npm run quality`; seção 31 |
| UC-009 | APIs públicas/privadas de Review e Favorite | `tests/integration/review-favorite-flow.test.ts` | 117 testes e build aprovados; seção 31 |

A matriz deve ser atualizada com referências reais aos arquivos, testes, endpoints ou commits produzidos.

---

 # 24\. Plano de implementação

 ## Etapa 1 — Verificação de readiness

 - confirmar `TASK-016 = DONE`;
- revisar requisitos RF-029/RF-030;
- revisar RN-015/RN-016;
- revisar UC-009;
- identificar contratos existentes;
- identificar padrão arquitetural dos módulos anteriores;
- confirmar regras não especificadas;
- registrar bloqueios antes de codificar.

 ## Etapa 2 — Modelagem

 - definir Review;
- definir Favorite;
- definir invariantes;
- definir relacionamentos;
- definir índices;
- definir restrições de integridade;
- validar compatibilidade com arquitetura existente.

 ## Etapa 3 — Persistência

 - criar migrations necessárias;
- criar repositories/adapters conforme arquitetura;
- adicionar constraints;
- criar testes de persistência.

 ## Etapa 4 — Domínio

 - implementar regras de Review;
- implementar regras de Favorite;
- manter regras de negócio fora da camada de transporte;
- cobrir invariantes com testes unitários.

 ## Etapa 5 — Aplicação

 - criar use cases/services;
- aplicar autenticação;
- aplicar autorização;
- validar ownership;
- tratar duplicidade;
- mapear erros.

 ## Etapa 6 — API/UI

 - criar endpoints ou telas necessárias;
- validar payloads;
- aplicar contratos existentes;
- evitar exposição de dados privados;
- adicionar testes de API.

 ## Etapa 7 — Qualidade

 Executar:

```
build
lint
unit tests
integration tests
API tests
security/authorization tests
```

 Executar E2E somente se já fizer parte do conjunto aplicável desta TASK.

 ## Etapa 8 — Rastreamento

 Atualizar:

 - `TASKS.md`;
- matriz de requisitos;
- documentação de API, se aplicável;
- documentação de domínio, se necessária;
- relatório de execução.

 ## Etapa 9 — Gate final

 Confirmar:

```
Scope Guard
ALLOWED_CHANGES
FORBIDDEN_CHANGES
DoD global
DoD específico
rastreabilidade
testes
build
lint
documentação
```

 Somente então alterar o estado para `DONE`.

---

 # 25. Scope Guard

 Antes de cada alteração, responder:

 1. Esta mudança implementa RF-029, RF-030, RN-015, RN-016 ou UC-009?
2. É necessária para os critérios de aceitação da TASK-017?
3. É diretamente causada pela implementação de Review/Favorite?
4. Está dentro de `ALLOWED_CHANGES`?
5. Não viola `FORBIDDEN_CHANGES`?
6. Não altera uma decisão arquitetural existente?
7. Não cria funcionalidade para TASK-018 ou posteriores?
8. Possui teste ou justificativa técnica adequada?

 Se alguma resposta for **não**, a alteração deve ser interrompida e avaliada antes de ser aplicada.

---

 # 26. Política de mudanças incidentais

 Aplicar:

```
MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED
```

 Permitidas somente alterações incidentais que sejam:

 - diretamente necessárias;
- pequenas;
- justificáveis;
- cobertas por testes;
- compatíveis com a arquitetura existente.

 Exemplo permitido:

```
corrigir import quebrado causado pela criação do novo módulo
```

 Exemplo não permitido:

```
refatorar todo o módulo de catálogo porque ele poderia ser "melhor"
```

 Exemplo permitido:

```
adicionar uma extensão mínima ao contrato de autenticação
```

 somente se diretamente necessária para resolver uma necessidade real de autorização desta TASK.

---

 # 27\. ADR

 Não criar ADR automaticamente.

 Criar/atualizar ADR somente se surgir uma decisão arquitetural relevante, por exemplo:

 - mudança estrutural de persistência;
- alteração de fronteira entre módulos;
- novo padrão arquitetural;
- mudança de estratégia de autorização;
- decisão que afete TASKs futuras.

 Se houver necessidade de ADR:

```
ADR-ID:
Título:
Contexto:
Decisão:
Alternativas consideradas:
Impacto:
TASK relacionada:
```

---

 # 28. Observabilidade e auditoria

 Não introduzir novos mecanismos de observabilidade fora do escopo.

 Utilizar os mecanismos já estabelecidos.

 Quando houver evento administrativo ou ação que já esteja sujeita à auditoria:

 - preservar o mecanismo existente;
- não registrar credenciais;
- não registrar tokens;
- não registrar dados pessoais desnecessários;
- registrar somente os dados necessários para rastreabilidade.

---

 # 29\. Dados e privacidade

 Não expor:

 - credenciais;
- tokens;
- informações internas de autenticação;
- dados pessoais desnecessários;
- identificadores internos sem necessidade;
- dados privados de outros clientes.

 Avaliações públicas devem expor somente os campos aprovados pelo contrato público.

 Favoritos são dados privados por padrão, salvo regra explicitamente aprovada em contrário.

---

 # 30\. Checklist de execução

 ## Antes de iniciar

- [x] TASK-016 = DONE
- [x] TASK-017 passou por READY antes de IN_PROGRESS
- [x] requisitos revisados
- [x] regras de negócio revisadas
- [x] arquitetura existente revisada
- [x] padrões de módulos anteriores revisados
- [x] dependências confirmadas
- [x] Definition of Ready satisfeita
- [x] bloqueios pendentes: nenhum

 ## Durante implementação

- [x] Review implementado
- [x] Favorite implementado
- [x] autorização aplicada
- [x] ownership aplicado
- [x] validações implementadas
- [x] constraints implementadas
- [x] testes unitários criados
- [x] testes de integração criados
- [x] testes de API criados
- [x] testes de segurança criados
- [x] Scope Guard verificado
- [x] nenhuma funcionalidade fora do escopo criada

 ## Antes de concluir

- [x] build aprovado
- [x] lint aprovado
- [x] testes aplicáveis aprovados
- [x] documentação atualizada
- [x] rastreabilidade atualizada
- [x] `ALLOWED_CHANGES` validado
- [x] `FORBIDDEN_CHANGES` validado
- [x] alterações incidentais justificadas
- [x] nenhum Scope Creep
- [x] `TASKS.md` atualizado
- [x] relatório produzido
- [x] estado final registrado

---

 # 31. Relatório de execução

 **TASK:** TASK-017
 **Status:** DONE
 **Branch:** `feature/TASK-017-reviews-favorites`
 **Commits:** nenhum; alterações permanecem na branch para revisão.

 ### Primary Changes

 - Criadas entidades, regras, serviços e persistência PostgreSQL para avaliações de produtos e favoritos.
- Adicionada migration `db/migrations/012_reviews_favorites.sql` com estados, chaves estrangeiras, índices e unicidade por cliente/produto.
- Criadas APIs de avaliações públicas, avaliações próprias e favoritos privados, autenticadas conforme ownership e sem aceitar identidade fornecida pelo cliente.
- Avaliação exige pedido `PAYMENT_CONFIRMED` com pagamento `APPROVED` que contenha o produto; começa `PENDING`, limita-se a uma por cliente/produto, nota inteira de 1 a 5 e comentário opcional até 2.000 caracteres.
- Edição própria de avaliações `PUBLISHED` ou `REJECTED` retorna para `PENDING`; avaliações públicas só aparecem para produtos publicados e elegíveis.
- Favoritos mantêm isolamento privado, suportam produto arquivado e protegem duplicidade inclusive sob concorrência.

 ### Incidental Changes

 - `docs/architecture/overview.md`: sincronização mínima da descrição dos módulos `reviews`/`favorites` e das políticas aprovadas; sem mudança do padrão arquitetural.

 ### Testes e Quality Gates

 - Migration aplicada duas vezes via `npm run db:migrate`.
- `npm test -- tests/unit/review-domain.test.ts tests/integration/review-favorite-flow.test.ts`: 8 testes passaram.
- `npm run quality`: 37 arquivos, 117 testes passaram; format, lint, typecheck e build aprovados. Lint manteve o aviso preexistente de `app/layout.tsx`.

| Gate | Resultado |
|---|---|
| Build | PASS |
| Lint | PASS (aviso preexistente em `app/layout.tsx`) |
| Unit | PASS |
| Integration | PASS |
| API | PASS |
| Security | PASS |
| Acceptance | PASS |
| Regression | PASS |

 ### Scope Validation

 - Allowed Changes: PASS; resumo em `TASKS.md` alinhado à especificação detalhada.
- Incidental Changes: PASS; alteração documental mínima e justificada.
- Forbidden Changes: PASS.
- Scope Creep: NONE.

 **Definition of Done:** PASS.
 **Rastreabilidade:** RF-029/RN-015 → `src/modules/reviews/**`, APIs de reviews e testes de domínio/integração; RF-030/RN-016 → `src/modules/favorites/**`, APIs de favorites e testes de integração; UC-009 → fluxos cobertos por `tests/integration/review-favorite-flow.test.ts`.
 **Bloqueios/pendências:** nenhum dentro do escopo da TASK-017. Denúncias e moderação administrativa permanecem fora desta TASK; a moderação pertence à TASK-019.
 **Próxima TASK:** TASK-018 permanece `BLOCKED`; não iniciada automaticamente.

---

 # 32\. Transição de estado

 Fluxo permitido:

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

 Falhas podem resultar em:

```
IN_PROGRESS → FAILED
IN_REVIEW   → FAILED
```

 Cancelamento somente mediante decisão explícita:

```
READY / IN_PROGRESS / IN_REVIEW → CANCELLED
```

 A TASK não pode passar diretamente de `BLOCKED` para `IN_PROGRESS`.

---

 # 33\. Gate de encerramento

 A TASK-017 somente pode ser marcada `DONE` se todos os itens abaixo forem verdadeiros:

```
TASK-016 = DONE
AND
Definition of Ready satisfeita
AND
RF-029 atendido
AND
RF-030 atendido
AND
RN-015 atendido
AND
RN-016 atendido
AND
UC-009 atendido
AND
testes aplicáveis aprovados
AND
build aprovado
AND
lint aprovado
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

 Se qualquer Gate obrigatório falhar, **não marcar `DONE`**.

---

 # 34\. Regra após conclusão

 Após `TASK-017 = DONE`:

```
NÃO iniciar TASK-018 automaticamente.
```

 A execução deve parar e aguardar autorização explícita para iniciar a próxima TASK.

 A conclusão da TASK-017 apenas torna `TASK-018` elegível, desde que os demais critérios de readiness estejam satisfeitos.

---

 # 35\. Resultado esperado

 Ao final da TASK-017, o sistema deve possuir:

```
Cliente
 ├── pode avaliar produtos conforme regras aprovadas
 ├── pode consultar avaliações permitidas
 ├── pode manter seus favoritos
 └── não consegue acessar dados privados de outro cliente

Produto
 ├── possui avaliações conforme regras aprovadas
 └── pode ser favoritado

Review
 ├── possui autor
 ├── possui produto
 ├── possui estado de publicação quando aplicável
 └── respeita autorização e regras de negócio

Favorite
 ├── possui cliente
 ├── possui produto
 ├── não duplica relação
 └── respeita ownership
```
