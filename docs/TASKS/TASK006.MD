# TASK-006 — Catálogo de produtos e categorias

 ## 1\. Identificação

 - **ID:** TASK-006
- **Título:** Catálogo de produtos e categorias
- **Status:** BLOCKED
- **Phase:** PHASE-02
- **Priority:** CRITICAL
- **Tipo:** Feature / Domain / API / Persistence
- **Dependências:** TASK-005
- **Relacionados:** RF-003, RF-004, RF-005, RF-006, RF-020, UC-002, UC-009

---

 # 2\. Objetivo

 Criar a fundação do domínio de catálogo do Tropa Fight, permitindo o gerenciamento e a exposição controlada de:

 - produtos;
- categorias;
- marcas;
- informações comerciais básicas;
- relacionamento entre produtos, categorias e marcas;
- catálogo público;
- operações administrativas autorizadas.

 O resultado deve permitir que um produto seja cadastrado, organizado e disponibilizado no catálogo público conforme as regras aprovadas.

 Esta TASK **não deve implementar variantes, estoque, carrinho, checkout, pagamento ou promoções complexas**.

---

 # 3\. Resultado esperado

 Ao final:

```
                    CATÁLOGO
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
    Product         Category          Brand
       │               │               │
       └───────────────┼───────────────┘
                       ▼
                Public Catalog
                       │
                       ▼
                Customer/User
```

 O administrador autorizado deve conseguir:

```
Criar produto
    ↓
Associar categoria
    ↓
Associar marca
    ↓
Definir informações básicas
    ↓
Salvar
    ↓
Publicar conforme regra
    ↓
Disponibilizar no catálogo
```

 O cliente deve conseguir consultar somente produtos que estejam elegíveis para publicação.

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
TASK-006
```

 A TASK-005 deve ter liberado a PHASE-02.

 A autenticação e autorização fornecidas pela PHASE-01 devem ser reutilizadas.

 Não criar um sistema paralelo de usuários ou permissões.

---

 # 5\. Escopo

 ## Incluído

 - Product;
- Category;
- Brand;
- relacionamentos;
- informações básicas do produto;
- status de publicação;
- catálogo público;
- CRUD administrativo;
- validação de dados;
- persistência;
- APIs;
- autorização;
- testes unitários;
- testes de integração;
- testes de API;
- documentação de contratos;
- auditoria das operações administrativas relevantes.

---

 # 6\. Fora do escopo

 Não implementar:

 - ProductVariant;
- atributos de variante;
- SKU de variante;
- preço por variante;
- estoque;
- reserva de estoque;
- carrinho;
- checkout;
- pagamento;
- pedidos;
- cupons;
- promoções complexas;
- avaliações;
- wishlist;
- recomendação;
- busca avançada;
- filtros avançados;
- integração com ERP;
- integração com marketplace;
- transportadoras;
- gateways de pagamento.

 Esses assuntos pertencem a tasks posteriores.

---

 # 7\. ALLOWED\_CHANGES

 Permitido:

```
src/catalog/**
src/categories/**
src/brands/**
src/modules/catalog/**
src/modules/categories/**
src/modules/brands/**

tests/**
docs/**
TASKS.md

persistência relacionada ao catálogo
APIs do catálogo
contratos relacionados ao catálogo
testes
documentação técnica
```

 A estrutura exata deve respeitar a arquitetura definida na PHASE-01.

---

 # 8\. FORBIDDEN\_CHANGES

 Não permitido:

 - alterar arquitetura base sem decisão aprovada;
- alterar RBAC sem necessidade;
- criar permissões arbitrárias;
- criar funcionalidades de checkout;
- criar lógica de pagamento;
- criar estoque comercial;
- criar variantes;
- implementar promoções;
- alterar regras de autenticação sem necessidade;
- expor produtos não publicáveis;
- permitir bypass administrativo;
- armazenar dados inconsistentes para "facilitar" desenvolvimento posterior.

---

 # 9\. Domínio

 O domínio mínimo deve conter:

```
Product
Category
Brand
```

---

 # 10\. Entidade Product

 Definir os atributos necessários conforme o modelo aprovado.

 Estrutura conceitual:

```
Product
├── id
├── name
├── slug
├── description
├── brandId
├── categoryId / categories
├── status
├── publicationState
├── createdAt
├── updatedAt
└── ...
```

 Os campos definitivos devem seguir o domínio aprovado.

 Não adicionar atributos pertencentes às variantes ou ao estoque.

---

 # 11\. Identidade do produto

 O produto deve possuir identificador único.

 Exemplo:

```
Product.id
```

 Requisitos:

 - [ ] identificador único;
- [ ] não reutilizar IDs;
- [ ] persistência consistente;
- [ ] referências externas não dependem do nome do produto.

---

 # 12\. Nome do produto

 Regras:

 - [ ] obrigatório;
- [ ] não vazio;
- [ ] tamanho mínimo definido;
- [ ] tamanho máximo definido;
- [ ] espaços desnecessários tratados;
- [ ] validação no domínio/application;
- [ ] erro de validação padronizado.

 Não assumir que o nome deve ser globalmente único sem requisito explícito.

---

 # 13\. Slug

 Caso o catálogo utilize slug:

```
Product
   ↓
slug
   ↓
public URL / identifier
```

 Checklist:

 - [ ] geração definida;
- [ ] formato validado;
- [ ] unicidade garantida;
- [ ] colisão tratada;
- [ ] atualização definida;
- [ ] URL pública não depende diretamente do nome.

 Se o projeto não utilizar slug, registrar explicitamente essa decisão.

---

 # 14\. Descrição

 A descrição deve:

 - [ ] aceitar o formato definido pelo projeto;
- [ ] possuir limites;
- [ ] ser validada;
- [ ] não permitir conteúdo perigoso;
- [ ] ser retornada conforme contrato público;
- [ ] não carregar dados administrativos indevidos.

---

 # 15\. Status do produto

 Definir estados explicitamente.

 Exemplo conceitual:

```
DRAFT
PUBLISHED
ARCHIVED
```

 Os estados reais devem respeitar os requisitos aprovados.

 Evitar criar estados sem necessidade.

---

 # 16\. Regra de publicação

 O produto não deve aparecer no catálogo público apenas porque foi criado.

 Exemplo:

```
DRAFT
   ↓
Admin publishes
   ↓
PUBLISHED
   ↓
Public Catalog
```

 E:

```
ARCHIVED
   ↓
Public Catalog
   ↓
NOT VISIBLE
```

 A regra exata de publicação deve ser documentada.

---

 # 17\. Categoria

 A entidade Category deve representar a classificação comercial do produto.

 Estrutura conceitual:

```
Category
├── id
├── name
├── slug
├── status
├── createdAt
└── updatedAt
```

---

 # 18\. Regras de categoria

 Checklist:

 - [ ] nome obrigatório;
- [ ] slug validado;
- [ ] identificação única;
- [ ] status definido;
- [ ] CRUD administrativo;
- [ ] associação com produtos;
- [ ] consulta pública conforme regra;
- [ ] categorias inativas não são expostas indevidamente.

---

 # 19\. Hierarquia de categorias

 Não implementar hierarquia pai/filho se isso não estiver explicitamente previsto.

 Se o domínio aprovado exigir hierarquia:

```
Category
├── id
├── name
└── parentId
```

 Nesse caso, validar:

 - [ ] categoria não pode ser filha de si mesma;
- [ ] ciclos são proibidos;
- [ ] profundidade máxima, se aplicável;
- [ ] remoção de categoria possui regra;
- [ ] produtos não ficam em estado inconsistente.

---

 # 20\. Marca

 A entidade Brand representa a marca comercial associada ao produto.

 Estrutura conceitual:

```
Brand
├── id
├── name
├── slug
├── status
├── createdAt
└── updatedAt
```

---

 # 21\. Regras de marca

 - [ ] nome obrigatório;
- [ ] slug validado;
- [ ] identificação única;
- [ ] CRUD administrativo;
- [ ] relacionamento com produto;
- [ ] status definido;
- [ ] marca inativa não deve ser exposta de forma indevida.

---

 # 22\. Relacionamento Product → Category

 Definir a cardinalidade oficialmente.

 Caso seja uma categoria:

```
Product N ───── 1 Category
```

 Caso sejam múltiplas:

```
Product N ───── N Category
```

 Não implementar uma cardinalidade diferente da especificação.

 Registrar a decisão no modelo de domínio e persistência.

---

 # 23\. Relacionamento Product → Brand

 Modelo esperado:

```
Brand 1 ───── N Product
```

 Um produto pode possuir uma marca conforme o modelo aprovado.

 Validar:

 - [ ] marca existe;
- [ ] marca está em estado permitido;
- [ ] relacionamento é consistente;
- [ ] exclusão da marca possui regra.

---

 # 24\. Integridade referencial

 Nunca permitir:

```
Product
   ↓
brandId inexistente
```

 ou:

```
Product
   ↓
categoryId inexistente
```

 Testar:

 - [ ] FK;
- [ ] validação de application;
- [ ] erros de referência;
- [ ] remoção;
- [ ] atualização.

---

 # 25\. Persistência

 Criar as estruturas de persistência necessárias:

```
products
categories
brands
```

 e tabelas de relacionamento quando aplicável.

 Checklist:

 - [ ] primary keys;
- [ ] foreign keys;
- [ ] índices;
- [ ] constraints;
- [ ] timestamps;
- [ ] status;
- [ ] unicidade;
- [ ] migrations;
- [ ] rollback quando aplicável.

---

 # 26\. Migration

 A migration deve ser:

 - [ ] versionada;
- [ ] reproduzível;
- [ ] determinística;
- [ ] compatível com ambiente de teste;
- [ ] compatível com ambiente local;
- [ ] revisada.

 Não inserir dados comerciais reais na migration.

---

 # 27\. Seed

 Se houver seed:

```
Development/Test
    ↓
Seed
    ↓
Sample Categories
Sample Brands
Sample Products
```

 Requisitos:

 - [ ] dados claramente fictícios;
- [ ] execução reproduzível;
- [ ] não depende de dados externos;
- [ ] não contém credenciais;
- [ ] não deve ser confundido com catálogo real.

---

 # 28\. Repositórios

 Definir contratos conforme arquitetura:

```
ProductRepository
CategoryRepository
BrandRepository
```

 Exemplo conceitual:

```
Application
    ↓
ProductRepository
    ↑
Infrastructure implementation
```

 O domínio não deve depender diretamente do ORM.

---

 # 29\. Casos de uso

 Implementar somente os casos necessários.

 ### Product

 - CreateProduct
- UpdateProduct
- GetProduct
- ListProducts
- PublishProduct
- Unpublish/ArchiveProduct, se aprovado

 ### Category

 - CreateCategory
- UpdateCategory
- GetCategory
- ListCategories
- Activate/Deactivate, se aprovado

 ### Brand

 - CreateBrand
- UpdateBrand
- GetBrand
- ListBrands
- Activate/Deactivate, se aprovado

 Os nomes reais podem seguir a convenção do projeto.

---

 # 30\. Create Product

 Fluxo:

```
Admin
 ↓
CreateProduct
 ↓
Validate
 ↓
Validate Category
 ↓
Validate Brand
 ↓
Persist
 ↓
Audit
 ↓
Response
```

 Critérios:

 - [ ] usuário autorizado;
- [ ] payload validado;
- [ ] categoria válida;
- [ ] marca válida;
- [ ] produto persistido;
- [ ] resposta padronizada;
- [ ] auditoria quando aplicável.

---

 # 31\. Update Product

 Fluxo:

```
Admin
 ↓
UpdateProduct
 ↓
Load Product
 ↓
Validate
 ↓
Validate Relationships
 ↓
Persist
 ↓
Audit
 ↓
Response
```

 Não permitir atualização de produto inexistente.

---

 # 32\. Get Product

 Deve existir consulta de produto individual.

 Verificar:

 - [ ] ID válido;
- [ ] produto existente;
- [ ] status considerado;
- [ ] dados administrativos não expostos publicamente;
- [ ] response contract definido.

---

 # 33\. List Products

 A listagem administrativa e pública não precisam necessariamente possuir o mesmo contrato.

 Exemplo:

```
Admin Product List
    ↓
dados operacionais

Public Product List
    ↓
dados publicáveis
```

 Não retornar informações internas desnecessárias no catálogo público.

---

 # 34\. Catálogo público

 O catálogo público deve obedecer:

```
Product
   ↓
Publication Rules
   ↓
Public Catalog
```

 Um produto em estado não publicável deve ser excluído da resposta pública.

---

 # 35\. Regra crítica do catálogo

 Nunca implementar:

```
SELECT *
FROM products
```

 e retornar diretamente para o cliente.

 A camada pública deve aplicar explicitamente as regras de exposição.

---

 # 36\. API — Administração

 Definir endpoints conforme padrão do projeto.

 Exemplo:

```
POST   /admin/products
GET    /admin/products
GET    /admin/products/:id
PATCH  /admin/products/:id
POST   /admin/products/:id/publish
POST   /admin/products/:id/archive
```

 Os endpoints reais devem seguir a convenção da aplicação.

---

 # 37\. API — Categorias

 Exemplo:

```
POST   /admin/categories
GET    /admin/categories
GET    /admin/categories/:id
PATCH  /admin/categories/:id
```

---

 # 38\. API — Marcas

 Exemplo:

```
POST   /admin/brands
GET    /admin/brands
GET    /admin/brands/:id
PATCH  /admin/brands/:id
```

---

 # 39\. API — Catálogo público

 Exemplo:

```
GET /products
GET /products/:id
```

 ou o prefixo público oficialmente definido.

 A API pública deve expor somente produtos elegíveis.

---

 # 40\. Autorização

 Operações administrativas devem reutilizar o RBAC da TASK-003.

 Matriz mínima:

 | Operação | Anonymous | Customer | Admin autorizado |
| --- | --- | --- | --- |
| Listar catálogo público | ✅ | ✅ | ✅ |
| Ver produto público | ✅ | ✅ | ✅ |
| Criar produto | ❌ | ❌ | ✅ |
| Editar produto | ❌ | ❌ | ✅ |
| Publicar produto | ❌ | ❌ | ✅ |
| Criar categoria | ❌ | ❌ | ✅ |
| Editar categoria | ❌ | ❌ | ✅ |
| Criar marca | ❌ | ❌ | ✅ |
| Editar marca | ❌ | ❌ | ✅ |

As permissões específicas devem corresponder ao RBAC aprovado.

---

 # 41\. Segurança de autorização

 Nunca confiar em:

```
role enviada pelo frontend
```

 ou:

```
isAdmin: true
```

 enviado pelo cliente.

 A autorização deve ser derivada da identidade autenticada e das permissões do backend.

---

 # 42\. Validação de entrada

 Validar:

 - [ ] campos obrigatórios;
- [ ] tipos;
- [ ] tamanhos;
- [ ] formatos;
- [ ] IDs;
- [ ] relacionamentos;
- [ ] status;
- [ ] slug;
- [ ] conteúdo permitido.

---

 # 43\. Tratamento de erros

 Definir respostas consistentes.

 Exemplos:

```
400 — Validation Error
401 — Unauthenticated
403 — Forbidden
404 — Not Found
409 — Conflict
500 — Internal Error
```

 Os códigos exatos devem seguir o padrão existente.

---

 # 44\. Conflitos

 Casos possíveis:

```
Slug já existente
    ↓
409 Conflict
```

```
Categoria inexistente
    ↓
Validation / Not Found
```

```
Marca inexistente
    ↓
Validation / Not Found
```

 Não mascarar conflitos como sucesso.

---

 # 45\. Concorrência

 Avaliar especialmente:

 - criação simultânea de slug;
- atualização simultânea;
- publicação simultânea;
- alteração de categoria/marca.

 Garantir unicidade no banco quando necessária.

 Não depender exclusivamente da validação da aplicação.

---

 # 46\. Auditoria

 Operações administrativas relevantes devem utilizar a infraestrutura da TASK-004.

 Exemplos:

```
PRODUCT_CREATED
PRODUCT_UPDATED
PRODUCT_PUBLISHED
PRODUCT_ARCHIVED

CATEGORY_CREATED
CATEGORY_UPDATED

BRAND_CREATED
BRAND_UPDATED
```

 Os nomes reais devem seguir a convenção do sistema.

 Não registrar:

 - senha;
- token;
- segredo;
- dados sensíveis desnecessários.

---

 # 47\. Eventos

 Caso a arquitetura utilize eventos de domínio/application:

```
ProductCreated
ProductUpdated
ProductPublished
```

 Os eventos devem ser utilizados somente se necessários para os contratos atuais.

 Não criar infraestrutura de eventos complexa sem necessidade da TASK-006.

---

 # 48\. Imagens e mídia

 Não implementar upload de imagens nesta TASK caso não exista requisito aprovado.

 Se o modelo precisar apenas de uma referência:

```
imageUrl
```

 ou equivalente pode ser utilizado conforme decisão arquitetural.

 Não integrar storage externo sem decisão aprovada.

---

 # 49\. Preço

 O TASK-006 pode manter somente a informação comercial básica explicitamente aprovada.

 Não implementar:

 - preço por variante;
- preço promocional;
- descontos;
- regras de preço complexas;
- histórico de preço;
- preço condicionado a estoque.

 Esses comportamentos pertencem a tasks posteriores.

---

 # 50\. Estoque

 O produto pode existir sem estoque implementado.

 Não adicionar:

```
stock
quantity
reservedQuantity
availableQuantity
```

 como mecanismo comercial nesta TASK se isso pertencer ao TASK-009.

 A disponibilidade comercial será tratada posteriormente.

---

 # 51\. Variantes

 Não criar:

```
ProductVariant
SKU
size
color
variantPrice
variantStock
```

 nesta TASK.

 O produto deve ser modelado de forma que a TASK-007 possa introduzir variantes sem exigir reescrita do catálogo.

---

 # 52\. Testes unitários

 Criar testes para:

 ### Product

 - [ ] criação válida;
- [ ] nome inválido;
- [ ] descrição inválida;
- [ ] slug inválido;
- [ ] estado inválido;
- [ ] publicação;
- [ ] arquivamento;
- [ ] transições inválidas.

 ### Category

 - [ ] criação;
- [ ] validação;
- [ ] slug;
- [ ] estado.

 ### Brand

 - [ ] criação;
- [ ] validação;
- [ ] slug;
- [ ] estado.

---

 # 53\. Testes de aplicação

 Testar:

 - [ ] CreateProduct;
- [ ] UpdateProduct;
- [ ] GetProduct;
- [ ] ListProducts;
- [ ] PublishProduct;
- [ ] CreateCategory;
- [ ] UpdateCategory;
- [ ] CreateBrand;
- [ ] UpdateBrand.

---

 # 54\. Testes de autorização

 Obrigatórios:

```
Anonymous → Create Product → DENIED
Customer → Create Product → DENIED
Customer → Update Product → DENIED
Unauthorized Admin → Publish → DENIED
Authorized Admin → Create → ALLOWED
Authorized Admin → Update → ALLOWED
Authorized Admin → Publish → ALLOWED
```

---

 # 55\. Testes de catálogo público

 ### Produto publicado

```
Product = PUBLISHED
GET /products
→ Produto aparece
```

 ### Produto não publicado

```
Product = DRAFT
GET /products
→ Produto não aparece
```

 ### Produto arquivado

```
Product = ARCHIVED
GET /products
→ Produto não aparece
```

---

 # 56\. Testes de relacionamento

 Testar:

```
Product + Valid Category
→ SUCCESS
```

```
Product + Invalid Category
→ ERROR
```

```
Product + Valid Brand
→ SUCCESS
```

```
Product + Invalid Brand
→ ERROR
```

---

 # 57\. Testes de integridade

 Testar:

 - [ ] slug duplicado;
- [ ] referência inexistente;
- [ ] produto inexistente;
- [ ] categoria inexistente;
- [ ] marca inexistente;
- [ ] alteração concorrente;
- [ ] publicação inválida.

---

 # 58\. Testes de API

 Para cada endpoint:

```
Authentication
Authorization
Validation
Success
Not Found
Conflict
Invalid Input
Error Handling
```

 Registrar os resultados.

---

 # 59\. Testes de contrato

 Validar:

 - [ ] request schema;
- [ ] response schema;
- [ ] HTTP status;
- [ ] error format;
- [ ] campos obrigatórios;
- [ ] campos opcionais;
- [ ] campos que não podem ser expostos.

---

 # 60\. Critérios de aceitação

 ## AC-001 — Criar produto

 **Dado** um administrador autorizado,

 **Quando** enviar dados válidos,

 **Então** o produto deve ser criado e persistido.

---

 ## AC-002 — Criar produto sem autorização

 **Dado** um usuário sem permissão administrativa,

 **Quando** tentar criar produto,

 **Então** a operação deve ser rejeitada.

---

 ## AC-003 — Associar categoria

 **Dado** uma categoria existente,

 **Quando** criar/editar um produto com essa categoria,

 **Então** o relacionamento deve ser persistido corretamente.

---

 ## AC-004 — Categoria inexistente

 **Dado** uma categoria inexistente,

 **Quando** tentar associá-la ao produto,

 **Então** a operação deve falhar.

---

 ## AC-005 — Associar marca

 **Dado** uma marca existente,

 **Quando** criar/editar um produto,

 **Então** o relacionamento deve ser persistido.

---

 ## AC-006 — Catálogo público

 **Dado** um produto publicado,

 **Quando** um usuário consultar o catálogo público,

 **Então** o produto deve estar disponível.

---

 ## AC-007 — Produto não publicado

 **Dado** um produto não publicável,

 **Quando** um usuário consultar o catálogo público,

 **Então** o produto não deve ser exposto.

---

 ## AC-008 — Integridade

 **Dado** uma referência inválida,

 **Quando** a operação for executada,

 **Então** o sistema deve rejeitá-la sem criar dados inconsistentes.

---

 ## AC-009 — Auditoria

 **Dado** uma operação administrativa auditável,

 **Quando** ela for executada,

 **Então** o evento de auditoria correspondente deve ser registrado.

---

 ## AC-010 — Autorização administrativa

 **Dado** um administrador sem a permissão específica,

 **Quando** tentar executar a operação,

 **Então** o acesso deve ser rejeitado.

---

 # 61\. Testes ponta a ponta

 ## E2E-001 — Criar e publicar produto

```
Login Admin
   ↓
Create Category
   ↓
Create Brand
   ↓
Create Product
   ↓
Verify Product
   ↓
Publish Product
   ↓
Public Catalog
   ↓
Verify Product Visible
```

---

 ## E2E-002 — Produto não publicado

```
Create Product
   ↓
Keep Draft
   ↓
Public Catalog
   ↓
Product Not Visible
```

---

 ## E2E-003 — Usuário sem permissão

```
Login Customer
   ↓
POST /admin/products
   ↓
403
```

---

 # 62\. API Contract Checklist

 | Endpoint | Auth | RBAC | Validation | Success | Errors | Testes |
| --- | --- | --- | --- | --- | --- | --- |
| Create Product | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| List Products | ✓/Public | ✓ | ✓ | ✓ | ✓ | ✓ |
| Get Product | ✓/Public | ✓ | ✓ | ✓ | ✓ | ✓ |
| Update Product | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Publish Product | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Category | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Update Category | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Brand | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Update Brand | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

 # 63\. Definition of Ready

 TASK-006 está pronta para execução quando:

 - [ ] TASK-005 foi aprovada;
- [ ] requisitos RF-003 a RF-006 estão disponíveis;
- [ ] regras de publicação estão definidas;
- [ ] modelo de Product está definido;
- [ ] modelo de Category está definido;
- [ ] modelo de Brand está definido;
- [ ] cardinalidades estão definidas;
- [ ] autorização existente está disponível;
- [ ] padrão de API está definido;
- [ ] padrão de persistência está definido;
- [ ] não existem decisões críticas bloqueantes.

---

 # 64\. Definition of Done

 TASK-006 somente poderá ser marcada como `DONE` quando:

 - [ ] Product implementado;
- [ ] Category implementado;
- [ ] Brand implementado;
- [ ] relacionamentos implementados;
- [ ] persistência implementada;
- [ ] migrations implementadas;
- [ ] CRUD administrativo implementado;
- [ ] catálogo público implementado;
- [ ] publicação controlada;
- [ ] autorização implementada;
- [ ] validações implementadas;
- [ ] tratamento de erros implementado;
- [ ] auditoria integrada;
- [ ] testes unitários passam;
- [ ] testes de integração passam;
- [ ] testes de API passam;
- [ ] testes de autorização passam;
- [ ] testes do catálogo público passam;
- [ ] testes de integridade passam;
- [ ] build passa;
- [ ] lint passa;
- [ ] typecheck passa;
- [ ] documentação atualizada;
- [ ] TASKS.md atualizado;
- [ ] nenhum escopo de TASK-007 ou posterior foi antecipado.

---

 # 65\. Quality Gate específico

 Executar:

```
<lint-command>
<typecheck-command>
<unit-test-command>
<integration-test-command>
<api-test-command>
<build-command>
```

 Resultado:

```
BUILD:       PASS / FAIL
LINT:        PASS / FAIL
TYPECHECK:   PASS / FAIL
UNIT:        PASS / FAIL
INTEGRATION: PASS / FAIL
API:         PASS / FAIL
E2E:         PASS / FAIL
RBAC:        PASS / FAIL
AUDIT:       PASS / FAIL
CATALOG:     PASS / FAIL
```

---

 # 66\. Matriz de rastreabilidade

 | Requisito | Implementação | Teste | Evidência | Status |
| --- | --- | --- | --- | --- |
| RF-003 | Product |  |  |  |
| RF-004 | Category |  |  |  |
| RF-005 | Brand |  |  |  |
| RF-006 | Catalog |  |  |  |
| RF-020 | Product/Catalog |  |  |  |
| UC-002 | Public Catalog |  |  |  |
| UC-009 | Product/Category/Brand |  |  |  |

A definição final de cada requisito deve ser confrontada com a especificação oficial.

---

 # 67\. Evidências obrigatórias

 Registrar:

```
1. Commit final
2. Build
3. Lint
4. Typecheck
5. Testes unitários
6. Testes integração
7. Testes API
8. Testes RBAC
9. Testes catálogo público
10. Migration
11. Schema
12. Contratos API
13. Evidências de auditoria
14. Documentação
```

---

 # 68\. Checklist de revisão de código

 ### Domain

 - [ ] regras relevantes estão no domínio;
- [ ] entidades não dependem de framework;
- [ ] invariantes protegidas;
- [ ] estados válidos definidos.

 ### Application

 - [ ] casos de uso claros;
- [ ] autorização considerada;
- [ ] transações adequadas;
- [ ] erros tratados.

 ### Infrastructure

 - [ ] repository implementado;
- [ ] ORM isolado;
- [ ] queries corretas;
- [ ] constraints no banco.

 ### Presentation

 - [ ] controllers finos;
- [ ] validação;
- [ ] autenticação;
- [ ] autorização;
- [ ] response contract.

---

 # 69\. Checklist de segurança

 - [ ] endpoints administrativos protegidos;
- [ ] autorização no backend;
- [ ] IDOR/BOLA avaliado;
- [ ] validação de entrada;
- [ ] SQL injection protegido;
- [ ] XSS considerado quando aplicável;
- [ ] dados internos não expostos;
- [ ] logs sanitizados;
- [ ] secrets ausentes;
- [ ] mensagens de erro não revelam informações sensíveis.

---

 # 70\. Checklist de catálogo público

 - [ ] somente produtos publicáveis aparecem;
- [ ] produtos arquivados não aparecem;
- [ ] dados administrativos não aparecem;
- [ ] IDs internos desnecessários não são expostos;
- [ ] categoria correta;
- [ ] marca correta;
- [ ] paginação segue padrão existente, se aplicável;
- [ ] resposta possui contrato estável.

 A paginação avançada e filtros pertencem ao TASK-008, salvo se forem estritamente necessários para o contrato básico definido aqui.

---

 # 71\. Checklist de dados

 - [ ] nenhum produto duplicado indevidamente;
- [ ] nenhuma categoria órfã indevida;
- [ ] nenhuma marca inválida;
- [ ] foreign keys consistentes;
- [ ] slugs únicos quando aplicável;
- [ ] timestamps consistentes;
- [ ] migrations reproduzíveis;
- [ ] seed seguro.

---

 # 72\. Observabilidade

 Registrar apenas o necessário para diagnóstico.

 Exemplo:

```
product.created
product.updated
product.published
category.created
brand.created
```

 Não registrar:

```
password
token
secret
```

---

 # 73\. Auditoria versus log técnico

 Não tratar os dois como equivalentes.

 ### Log técnico

 Serve para:

```
debug
diagnóstico
performance
erros
```

 ### AuditLog

 Serve para:

```
quem executou
o que executou
quando executou
qual recurso foi afetado
qual foi o resultado
```

---

 # 74\. Performance mínima

 Nesta TASK, avaliar:

 - [ ] queries sem N+1 evidente;
- [ ] índices em campos de busca/relacionamento relevantes;
- [ ] paginação quando necessária;
- [ ] carregamento controlado de relacionamentos;
- [ ] não retornar payload excessivo.

 Não antecipar a implementação completa do mecanismo de busca do TASK-008.

---

 # 75\. Compatibilidade com TASK-007

 O design deve permitir posteriormente:

```
Product
   │
   └── ProductVariant
          ├── attributes
          ├── price
          └── availability
```

 Sem necessidade de transformar o Product em um modelo incompatível.

 Não implementar a variante agora.

---

 # 76\. Compatibilidade com TASK-009

 O design deve permitir posteriormente:

```
ProductVariant
      ↓
Inventory
      ↓
InventoryMovement
```

 Não implementar estoque no TASK-006.

---

 # 77\. Compatibilidade com TASK-008

 O catálogo deve fornecer uma base adequada para:

```
Search
Filters
Sorting
Pagination
```

 Não implementar mecanismo de busca avançado nesta TASK.

 Garantir apenas que o modelo permita sua implementação posterior.

---

 # 78\. Cenários que bloqueiam o TASK-006

 A TASK deve permanecer `BLOCKED` ou `IN_PROGRESS` se:

 - produto pode ser criado sem autorização;
- produto não publicado aparece publicamente;
- referências inválidas são persistidas;
- categoria/marca não possuem integridade;
- build falha;
- testes críticos falham;
- migrations não são reproduzíveis;
- auditoria obrigatória não funciona;
- catálogo público expõe dados administrativos;
- RBAC pode ser contornado;
- modelo impede a implementação de variantes posteriormente;
- funcionalidade comercial fora do escopo foi introduzida.

---

 # 79\. Relatório final da TASK

 Criar, conforme padrão do projeto:

```
docs/tasks/TASK-006.md
```

 ou atualizar o artefato oficial de acompanhamento.

 Conteúdo mínimo:

```
# TASK-006 — Catálogo de produtos e categorias

## Status
DONE / BLOCKED

## Implementação
...

## APIs
...

## Persistência
...

## Segurança
...

## Auditoria
...

## Testes
...

## Evidências
...

## Pendências
...

## Rastreabilidade
...

## Scope Check
...

## Definition of Done
...

## Commit
...
```

---

 # 80\. Evidência final

 Preencher ao concluir:

```
TASK-006
Status: DONE / BLOCKED

Product:
DONE / BLOCKED

Category:
DONE / BLOCKED

Brand:
DONE / BLOCKED

Persistence:
DONE / BLOCKED

Migrations:
DONE / BLOCKED

Admin APIs:
DONE / BLOCKED

Public Catalog:
DONE / BLOCKED

Authorization:
PASS / FAIL

Audit:
PASS / FAIL

Unit Tests:
PASS / FAIL

Integration Tests:
PASS / FAIL

API Tests:
PASS / FAIL

E2E:
PASS / FAIL

Build:
PASS / FAIL

Lint:
PASS / FAIL

Typecheck:
PASS / FAIL

Traceability:
PASS / FAIL

Scope:
PASS / FAIL

Critical Issues:
0 / N

Pending Issues:
0 / N

Final Decision:
DONE / BLOCKED

Next Task:
TASK-007
```

---

 # 81\. Resultado final esperado

 A conclusão do TASK-006 deve produzir esta base:

```
                    PHASE-02
                       │
                       ▼
                  TASK-006
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Product      Category       Brand
          │            │            │
          └────────────┼────────────┘
                       ▼
                 Public Catalog
                       │
              ┌────────┴────────┐
              ▼                 ▼
          Authorized         Customer
           Admin/User
```

 Com a seguinte separação:

```
TASK-006
│
├── Product
├── Category
├── Brand
├── Public Catalog
├── Admin CRUD
├── Authorization
├── Persistence
├── Audit
└── Tests
        │
        ├── TASK-007 → Variants / Prices / Availability
        ├── TASK-008 → Search / Filters / Sorting
        └── TASK-009 → Inventory
```
