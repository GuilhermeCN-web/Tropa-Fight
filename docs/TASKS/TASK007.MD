# TASK-007 — Variantes, preços e disponibilidade

 ## 1\. Identificação

 - **ID:** TASK-007
- **Título:** Variantes, preços e disponibilidade
- **Status:** DONE
- **Phase:** PHASE-02
- **Priority:** HIGH
- **Tipo:** Feature / Domain / Application / Persistence / API
- **Dependências:** TASK-006
- **Relacionados:** RF-007, RF-008, RF-021, RN-004, RN-005, UC-003

> **Decisões aprovadas (2026-10-23):** atributos de tamanho e cor quando aplicáveis ao produto; SKU obrigatório, informado manualmente e globalmente único; sua comparação ignora espaços externos e diferenças entre maiúsculas/minúsculas, preservando o texto informado. Preço obrigatório por variante em BRL, em centavos inteiros e não negativo. Elegibilidade comercial pública exige produto publicado, variante ativa e preço válido; estoque físico fica para TASK-009. Para produto `ARCHIVED`, rejeitar criação de variantes e preservar as existentes sem alteração até haver regra de reativação. Quando tamanho e cor não se aplicarem, permitir uma única variante com atributos vazios.
>
> **Prontidão/início (2026-10-23): IN_PROGRESS.** Definition of Ready atendida. Branch: `feature/TASK-007-variants-pricing`.
>
> **Implementação e revisão (2026-10-23): DONE.** Modelo, migration, APIs, autorização, publicação, auditoria e testes implementados; Definition of Done atendida. Gates registrados na seção 95.

---

 # 2\. Objetivo

 Implementar a camada de variantes comerciais dos produtos, permitindo representar diferentes configurações de um mesmo produto e associar a cada variante:

 - identidade própria;
- atributos;
- identificação comercial;
- preço;
- disponibilidade;
- relacionamento com o produto;
- estado de venda.

 A implementação deve preparar o catálogo para que cada combinação comercial possa ser identificada individualmente, sem ainda implementar reserva definitiva de estoque, checkout, pagamento ou integrações logísticas.

---

 # 3\. Resultado esperado

 Ao final desta TASK, o modelo deverá permitir:

```
Product
   │
   ├── Variant 1
   │      ├── Attributes
   │      ├── Price
   │      └── Availability
   │
   ├── Variant 2
   │      ├── Attributes
   │      ├── Price
   │      └── Availability
   │
   └── Variant N
```

 Exemplo conceitual:

```
Camiseta Tropa Fight
│
├── Preta / P
│   └── R$ XX,XX
│
├── Preta / M
│   └── R$ XX,XX
│
├── Preta / G
│   └── R$ XX,XX
│
└── Branca / M
    └── R$ XX,XX
```

 Cada variante deve ser identificável individualmente.

---

 # 4\. Dependências

```
TASK-005
   ↓
TASK-006
   ↓
TASK-007
```

 A TASK-006 deve fornecer:

 - Product;
- Category;
- Brand;
- catálogo;
- autorização administrativa;
- persistência base;
- contratos e convenções arquiteturais.

 Não criar novamente o domínio de Product.

---

 # 5\. Escopo

 ## Incluído

 - ProductVariant;
- identificação individual da variante;
- atributos de variante;
- combinações de atributos;
- preço;
- estado da variante;
- disponibilidade comercial;
- relacionamento Product → ProductVariant;
- CRUD administrativo;
- consulta pública;
- validações;
- integridade;
- persistência;
- migrations;
- APIs;
- autorização;
- testes unitários;
- testes de integração;
- testes de API;
- documentação.

---

 # 6\. Fora do escopo

 Não implementar:

 - estoque físico completo;
- Inventory;
- InventoryMovement;
- reserva definitiva de estoque;
- baixa de estoque por pedido;
- checkout;
- carrinho;
- pagamento;
- webhook;
- transportadora;
- frete;
- pedidos;
- cupons;
- promoções;
- recomendação;
- busca avançada;
- integração com ERP;
- integração externa de estoque.

 Esses comportamentos pertencem a tasks posteriores.

---

 # 7\. ALLOWED\_CHANGES

 Permitido:

```
src/catalog/**
src/modules/catalog/**
src/modules/variants/**
src/modules/pricing/**

tests/**
docs/**
TASKS.md

persistência relacionada a variantes/preços
APIs relacionadas
testes
documentação técnica
```

 A estrutura deve respeitar a arquitetura aprovada na PHASE-01.

---

 # 8\. FORBIDDEN\_CHANGES

 Não permitido:

 - alterar o modelo principal de Product sem necessidade;
- criar estoque físico;
- criar reserva de estoque;
- implementar checkout;
- implementar pagamento;
- alterar regras de pedido;
- criar integração com transportadoras;
- criar promoções;
- criar regras comerciais não aprovadas;
- criar novos papéis administrativos;
- alterar RBAC sem decisão aprovada.

---

 # 9\. Modelo conceitual

 Estrutura mínima:

```
Product
   │
   └── ProductVariant
          │
          ├── VariantAttributes
          ├── Price
          └── Availability
```

---

 # 10\. Entidade ProductVariant

 Modelo conceitual:

```
ProductVariant
├── id
├── productId
├── sku
├── attributes
├── price
├── status
├── availability
├── createdAt
└── updatedAt
```

 Os campos definitivos devem respeitar os requisitos oficiais.

---

 # 11\. Identidade da variante

 Cada variante deve possuir identidade própria.

```
Product
    id = P001

Variant
    id = V001
    productId = P001
```

 Não usar somente:

```
productId + nome
```

 como identidade lógica da variante.

---

 # 12\. SKU

 O SKU é obrigatório, informado manualmente e globalmente único, conforme decisão aprovada em 2026-10-23:

```
ProductVariant
└── sku
```

 Requisitos:

- [x] SKU obrigatório;
- [x] SKU globalmente único;
- [x] comparação normalizada ignorando espaços externos e diferença entre maiúsculas/minúsculas, preservando o texto informado;
- [ ] não permitir duplicidade;
- [ ] conflito gera erro;
- [ ] SKU não pode ser alterado silenciosamente se houver dependências futuras.

 Não há geração automática de SKU.

---

 # 13\. Atributos da variante

 A variante deve permitir representar características comerciais.

 Exemplos:

```
size = M
color = Black
```

 ou:

```
{
  "size": "M",
  "color": "Black"
}
```

 Tamanho e cor são os atributos aprovados, quando aplicáveis ao produto. A representação enviada pela API é um objeto de atributos; detalhes de persistência seguem a arquitetura existente.

---

 # 14\. Tipos de atributos

 Os atributos podem representar, por exemplo:

 - tamanho;
- cor;
- modelo;
- acabamento;
- voltagem;
- outras características comerciais aprovadas.

 Não criar uma lista fixa de atributos no código sem requisito.

---

 # 15\. Estrutura dos atributos

 Se atributos forem armazenados como estrutura:

```
attributes:
{
  "color": "black",
  "size": "M"
}
```

 Validar:

 - [ ] nomes válidos;
- [ ] valores válidos;
- [ ] ausência de duplicidade;
- [ ] formato consistente;
- [ ] combinação única;
- [ ] tamanho máximo;
- [ ] serialização determinística.

---

 # 16\. Combinação de atributos

 Duas variantes do mesmo produto não podem representar exatamente a mesma combinação.

 Exemplo inválido:

```
Product A

Variant 1:
color = black
size = M

Variant 2:
color = black
size = M
```

 Resultado esperado:

```
CONFLICT
```

---

 # 17\. Normalização de atributos

 A comparação de atributos deve ser determinística.

 Exemplo conceitual:

```
{
  color: black,
  size: M
}
```

 e:

```
{
  size: M,
  color: black
}
```

 devem representar a mesma combinação se o domínio considerar a ordem irrelevante.

---

 # 18\. Preço

 Cada variante deve possuir preço obrigatório em BRL, não negativo, armazenado em centavos inteiros, conforme decisão aprovada em 2026-10-23.

 Modelo conceitual:

```
ProductVariant
      │
      ▼
    Price
```

 Exemplo:

```
Variant A → R$ 99,90
Variant B → R$ 109,90
Variant C → R$ 119,90
```

---

 # 19\. Regras de preço

 Validar:

- [x] preço obrigatório por variante;
- [x] valor não negativo;
- [x] precisão em centavos inteiros;
- [x] moeda BRL;
- [x] representação determinística em centavos;
- [x] arredondamento não se aplica a entradas em centavos;
- [ ] atualização controlada.

 Não utilizar `float` para representar dinheiro se a arquitetura não definir isso explicitamente.

 Preferir representação monetária apropriada, como decimal ou unidade mínima.

---

 # 20\. Moeda

 Se o sistema for multi-moeda:

```
price
currency
```

 Se não for:

 - [ ] registrar a moeda oficial;
- [ ] evitar permitir moeda arbitrária;
- [ ] manter a regra centralizada.

 Não criar suporte multi-moeda apenas por antecipação.

---

 # 21\. Disponibilidade

 A disponibilidade nesta TASK representa **disponibilidade comercial da variante**, não o estoque físico completo.

 Exemplo:

```
ACTIVE
INACTIVE
AVAILABLE
UNAVAILABLE
```

 Os estados reais devem seguir o domínio aprovado.

---

 # 22\. Separação entre disponibilidade e estoque

 Importante:

```
Disponibilidade comercial
        ≠
Estoque físico
```

 O TASK-007 pode determinar:

```
Variant = ACTIVE
```

 mas não deve implementar toda a lógica de:

```
physical stock
reserved stock
available stock
inventory movement
```

 Isso pertence ao TASK-009.

---

 # 23\. Regra de venda

 Uma variante somente deve ser considerada comercialmente disponível quando todas as condições necessárias estiverem satisfeitas.

 Conceitualmente:

```
Product published
        +
Variant active
        +
Valid price
        +
Availability allowed
        ↓
Commercially Available
```

 Regra aprovada em 2026-10-23: produto publicado + variante ativa + preço válido = elegível para exibição como opção comercial. Isso não confirma estoque físico nem substitui validação de estoque na TASK-009.

---

 # 24\. Relação Product → Variant

 Modelo:

```
Product 1 ───── N ProductVariant
```

 Um produto pode possuir zero ou várias variantes. Quando tamanho e cor não se aplicarem, permitir uma única variante com atributos vazios para identificar a unidade comercial. A combinação vazia também é única por produto.

---

 # 25\. Integridade referencial

 Não permitir:

```
Variant
   ↓
productId inexistente
```

 A referência deve ser validada no domínio/application e protegida no banco quando aplicável.

---

 # 26\. Produto inexistente

 Ao criar variante para produto inexistente:

```
Create Variant
      ↓
Product Not Found
      ↓
Operation rejected
```

 Nenhuma variante órfã deve ser criada.

---

 # 27\. Produto arquivado

 Definir comportamento.

 Exemplo:

```
Product = ARCHIVED
      ↓
New Variant
      ↓
REJECTED
```

 ou outra regra explicitamente aprovada.

 Regra aprovada em 2026-10-23: rejeitar criação de variantes para produto `ARCHIVED` e preservar as existentes sem alteração até que uma regra de reativação seja definida.

---

 # 28\. Variante inativa

 Uma variante inativa:

 - [ ] não deve aparecer como opção vendável;
- [ ] não deve ser considerada disponível;
- [ ] não deve permitir operação comercial indevida;
- [ ] permanece preservada para histórico quando aplicável.

---

 # 29\. CRUD administrativo

 Implementar conforme convenções da aplicação:

```
POST   /api/admin/products/:productId/variants
GET    /api/admin/products/:productId/variants
GET    /api/admin/variants/:id
PATCH  /api/admin/variants/:id
```

Criar variante exige `sku`, `attributes`, `priceCents` e `status` (`ACTIVE` ou `INACTIVE`). Atualizar aceita qualquer subconjunto não vazio desses campos. `priceCents` deve ser um inteiro seguro não negativo.

---

 # 30\. Consulta pública

 A API pública deve conseguir representar as variantes necessárias ao catálogo.

 Exemplo:

```
GET /products/:id
```

O caminho real é `GET /api/products/:id`. A resposta inclui apenas variantes `ACTIVE` de produto `PUBLISHED`, não expõe SKU e representa o preço como `{ priceCents, currency: "BRL" }`. A elegibilidade comercial não confirma disponibilidade de estoque.

 Resposta conceitual:

```
{
  "product": {},
  "variants": [
    {
      "id": "...",
      "attributes": {},
      "price": {},
      "availability": {}
    }
  ]
}
```

 Não expor dados administrativos desnecessários.

---

 # 31\. Autorização

 Reutilizar o RBAC existente.

 Matriz mínima:

 | Operação | Anonymous | Customer | Admin autorizado |
| --- | --- | --- | --- |
| Ver variante pública | ✅\* | ✅\* | ✅ |
| Criar variante | ❌ | ❌ | ✅ |
| Editar variante | ❌ | ❌ | ✅ |
| Ativar variante | ❌ | ❌ | ✅ |
| Desativar variante | ❌ | ❌ | ✅ |
| Alterar preço | ❌ | ❌ | ✅ |

`*` somente quando a variante estiver publicamente elegível.

---

 # 32\. Segurança

 Não confiar em dados enviados pelo frontend para determinar:

```
isAdmin
canEditPrice
isAvailable
```

 A autorização deve ocorrer no backend.

---

 # 33\. Caso de uso — CreateVariant

 Fluxo:

```
Admin
 ↓
Authenticate
 ↓
Authorize
 ↓
Load Product
 ↓
Validate Attributes
 ↓
Validate SKU
 ↓
Validate Combination
 ↓
Validate Price
 ↓
Validate Availability
 ↓
Persist Variant
 ↓
Audit
 ↓
Response
```

---

 # 34\. Caso de uso — UpdateVariant

 Fluxo:

```
Admin
 ↓
Authenticate
 ↓
Authorize
 ↓
Load Variant
 ↓
Validate Changes
 ↓
Check Conflicts
 ↓
Persist
 ↓
Audit
 ↓
Response
```

---

 # 35\. Caso de uso — ListVariants

 Deve permitir consultar variantes de um produto.

 Validar:

 - [ ] produto existente;
- [ ] autorização;
- [ ] filtros permitidos;
- [ ] paginação quando necessária;
- [ ] ordenação definida.

 A busca avançada pertence ao TASK-008.

---

 # 36\. Caso de uso — ChangeAvailability

 Caso exista uma operação específica:

```
Variant
   ↓
ChangeAvailability
   ↓
Validate Transition
   ↓
Persist
   ↓
Audit
```

 Evitar permitir alteração arbitrária de estado.

---

 # 37\. Transições de estado

 Definir uma matriz.

 Exemplo:

 | Estado atual | Próximo estado | Permitido |
| --- | --- | --- |
| ACTIVE | INACTIVE | ✅ |
| INACTIVE | ACTIVE | ✅ |
| ACTIVE | ARCHIVED | conforme regra |
| ARCHIVED | ACTIVE | conforme regra |

Não permitir transições não previstas.

---

 # 38\. Validação de atributos

 Validar:

 - [ ] nome;
- [ ] tipo;
- [ ] valor;
- [ ] tamanho;
- [ ] formato;
- [ ] duplicidade;
- [ ] combinação.

---

 # 39\. Validação de SKU

 Testar:

```
SKU válido
→ SUCCESS
```

```
SKU duplicado
→ CONFLICT
```

```
SKU vazio
→ VALIDATION ERROR
```

 quando SKU for obrigatório.

---

 # 40\. Validação de preço

 Testar:

```
99.90
→ SUCCESS
```

```
-10
→ ERROR
```

```
valor inválido
→ ERROR
```

```
precisão não permitida
→ ERROR
```

---

 # 41\. Validação de combinação

 Testar:

```
Product A
Color = Black
Size = M
```

 e tentar criar novamente:

```
Product A
Color = Black
Size = M
```

 Resultado:

```
CONFLICT
```

---

 # 42\. Unicidade

 Garantir no banco quando aplicável:

```
SKU UNIQUE
```

 e/ou:

```
Product + Normalized Attributes UNIQUE
```

 A aplicação não deve ser a única camada de proteção contra duplicidade.

---

 # 43\. Persistência

 Estrutura conceitual:

```
products
    │
    └── product_variants
             │
             ├── variant_attributes
             └── variant_prices
```

 A estrutura definitiva pode ser simplificada conforme o modelo aprovado.

---

 # 44\. Estratégia de atributos

Decisão de implementação: atributos são armazenados como JSONB.

```
attributes JSONB
```

Os atributos permitidos são `size` e `color`; objetos JSONB com propriedades em ordem diferente representam a mesma combinação. A unicidade é garantida por `UNIQUE (product_id, attributes)` no PostgreSQL.

 ### Opção B — Modelo relacional (não escolhido)

```
variant_attributes
attribute_definitions
attribute_values
```

 ### Opção C — Modelo híbrido (não escolhido)

 Registrar a decisão arquitetural antes da implementação.

 Não criar uma estrutura excessivamente complexa sem necessidade.

---

 # 45\. Migration

 As migrations devem:

 - [ ] criar tabela de variantes;
- [ ] criar relações;
- [ ] criar constraints;
- [ ] criar índices;
- [ ] criar unicidade;
- [ ] ser reproduzíveis;
- [ ] funcionar em ambiente de teste;
- [ ] possuir rollback quando aplicável.

---

 # 46\. Índices

 Avaliar índices para:

```
product_id
sku
status
availability
```

 e combinações necessárias para consultas do catálogo.

 Não criar índices sem justificativa.

---

 # 47\. Repository

 Criar contrato compatível com a arquitetura:

```
ProductVariantRepository
```

 Possíveis operações:

```
create
findById
findByProductId
findBySku
findByProductAndAttributes
update
```

 Os métodos devem refletir casos de uso reais.

---

 # 48\. Domínio

 O domínio deve proteger invariantes como:

```
Preço não negativo
SKU válido
Atributos válidos
Estado válido
Combinação válida
```

 Não concentrar toda a regra em controllers.

---

 # 49\. Application Layer

 A camada de aplicação deve coordenar:

```
Authorization
↓
Load Product
↓
Validate
↓
Domain Operation
↓
Repository
↓
Audit
```

---

 # 50\. Presentation Layer

 Controllers/handlers devem:

 - [ ] validar entrada;
- [ ] autenticar;
- [ ] autorizar;
- [ ] chamar caso de uso;
- [ ] mapear resposta;
- [ ] mapear erros.

 Evitar regras de negócio complexas no controller.

---

 # 51\. Erros

 Padronizar:

```
400 — Invalid variant data
401 — Unauthenticated
403 — Forbidden
404 — Product/Variant not found
409 — Variant/SKU conflict
422 — Business rule violation
```

 Os códigos exatos devem seguir a convenção da aplicação.

---

 # 52\. Auditoria

 Registrar operações administrativas relevantes.

 Exemplos:

```
VARIANT_CREATED
VARIANT_UPDATED
VARIANT_ACTIVATED
VARIANT_DEACTIVATED
VARIANT_PRICE_CHANGED
```

 Não registrar:

```
password
tokens
secrets
```

 Se alteração de preço exigir evento específico, utilizar a convenção aprovada.

---

 # 53\. Histórico de preço

 Não implementar histórico de preço se não houver requisito.

 Se existir requisito aprovado:

```
Price
  ↓
PriceHistory
```

 deve ser especificado separadamente.

 Não criar complexidade de auditoria comercial por antecipação.

---

 # 54\. Preço e publicação

 Uma variante sem preço válido não deve ser apresentada como comercialmente vendável se essa for a regra aprovada.

 Exemplo:

```
Variant
Price = null
      ↓
Not commercially available
```

 Registrar a regra exata.

---

 # 55\. Disponibilidade pública

 O catálogo deve aplicar:

```
Product Publication State
       +
Variant State
       +
Price Validity
       +
Availability
       ↓
Public Variant
```

---

 # 56\. Relação com TASK-009

 O TASK-007 deve deixar um ponto claro de integração:

```
ProductVariant
      │
      ▼
Inventory
```

 O TASK-009 poderá posteriormente determinar disponibilidade real com base no estoque.

 Não duplicar a lógica de Inventory.

---

 # 57. Testes unitários — Variant

 Cobrir:

 - [ ] criação válida;
- [ ] atributos inválidos;
- [ ] SKU inválido;
- [ ] preço negativo;
- [ ] preço inválido;
- [ ] estado inválido;
- [ ] combinação duplicada;
- [ ] alteração válida;
- [ ] transição inválida.

---

 # 58\. Testes unitários — Price

 Cobrir:

 - [ ] valor positivo;
- [ ] zero, conforme regra;
- [ ] valor negativo;
- [ ] precisão;
- [ ] moeda;
- [ ] arredondamento.

---

 # 59\. Testes de aplicação

 Testar:

 - [ ] CreateVariant;
- [ ] UpdateVariant;
- [ ] GetVariant;
- [ ] ListVariants;
- [ ] ChangeAvailability;
- [ ] alteração de preço;
- [ ] associação com Product.

---

 # 60\. Testes de autorização

 Obrigatórios:

```
Anonymous → Create Variant → DENIED
Customer → Create Variant → DENIED
Customer → Change Price → DENIED
Unauthorized Admin → Change Price → DENIED
Authorized Admin → Create Variant → ALLOWED
Authorized Admin → Update Variant → ALLOWED
Authorized Admin → Change Price → ALLOWED
```

---

 # 61\. Testes de combinação

 ### Cenário válido

```
Product A
Black / M
```

 → criado.

 ### Cenário duplicado

```
Product A
Black / M
```

 → rejeitado.

 ### Produto diferente

```
Product B
Black / M
```

 → permitido.

---

 # 62\. Testes de SKU

```
SKU-001
```

 → criado.

 Outro produto:

```
SKU-001
```

 → rejeitado se SKU globalmente único.

---

 # 63\. Testes de preço

```
Variant A
Price = 99.90
```

 → sucesso.

```
Variant B
Price = -1
```

 → erro.

```
Variant C
Price = invalid
```

 → erro.

---

 # 64\. Testes de disponibilidade

```
Variant ACTIVE
→ Publicly eligible
```

```
Variant INACTIVE
→ Not publicly eligible
```

 A regra deve ser combinada com o estado de publicação do produto.

---

 # 65\. Testes de API

 Para cada endpoint:

 - [ ] autenticação;
- [ ] autorização;
- [ ] validação;
- [ ] sucesso;
- [ ] not found;
- [ ] conflict;
- [ ] business rule;
- [ ] response contract.

---

 # 66\. Testes de integridade

 Validar:

 - [ ] variante sem produto;
- [ ] SKU duplicado;
- [ ] combinação duplicada;
- [ ] preço inválido;
- [ ] estado inválido;
- [ ] referência inválida;
- [ ] atualização concorrente.

---

 # 67\. Testes de concorrência

 Especial atenção para:

```
Request A → Create Variant Black/M
Request B → Create Variant Black/M
```

 Resultado esperado:

```
Request A → SUCCESS
Request B → CONFLICT
```

 Não permitir duplicação por race condition.

---

 # 68\. Testes de transação

 Se a criação envolver múltiplas estruturas:

```
Create Variant
   +
Create Attributes
   +
Create Price
```

 a operação deve possuir atomicidade adequada.

 Falha intermediária não deve deixar variante parcialmente persistida.

---

 # 69\. Testes de catálogo público

 ### Produto publicado + variante ativa

```
→ variante aparece
```

 ### Produto publicado + variante inativa

```
→ variante não aparece como opção comercial
```

 ### Produto não publicado \+ variante ativa

```
→ variante não aparece publicamente
```

 ### Variante sem preço válido

```
→ comportamento conforme regra de publicação
```

---

 # 70\. Critérios de aceitação

 ## AC-001 — Criar variante

 **Dado** um produto existente e administrador autorizado,

 **Quando** forem enviados dados válidos,

 **Então** a variante deve ser criada.

---

 ## AC-002 — Identidade individual

 Cada variante criada deve possuir identificador próprio.

---

 ## AC-003 — SKU

 Quando SKU for obrigatório, cada variante deve possuir SKU válido e não duplicado.

---

 ## AC-004 — Atributos

 A variante deve possuir uma combinação de atributos válida conforme as regras aprovadas.

---

 ## AC-005 — Combinação duplicada

 Duas variantes do mesmo produto não podem possuir a mesma combinação de atributos.

---

 ## AC-006 — Preço

 O preço deve ser validado e armazenado com precisão monetária apropriada.

---

 ## AC-007 — Disponibilidade

 Uma variante inativa ou indisponível não deve ser apresentada como opção comercial quando a regra de publicação exigir sua exclusão.

---

 ## AC-008 — Produto inexistente

 Não deve ser possível criar variante para produto inexistente.

---

 ## AC-009 — Autorização

 Usuários sem permissão administrativa não podem criar ou alterar variantes.

---

 ## AC-010 — Concorrência

 Criações concorrentes da mesma combinação não devem gerar variantes duplicadas.

---

 ## AC-011 — Integridade

 Nenhuma operação deve gerar variante órfã ou dados parcialmente persistidos.

---

 ## AC-012 — Auditoria

 Alterações administrativas relevantes devem gerar os registros de auditoria correspondentes.

---

 # 71\. E2E-001 — Criar produto com variantes

```
Login Admin
   ↓
Selecionar Product
   ↓
Create Variant
   ↓
Definir Attributes
   ↓
Definir SKU
   ↓
Definir Price
   ↓
Definir Availability
   ↓
Save
   ↓
Verify Variant
```

---

 # 72\. E2E-002 — Exposição pública

```
Published Product
       ↓
Active Variant
       ↓
Valid Price
       ↓
Public Catalog
       ↓
Variant Visible
```

---

 # 73\. E2E-003 — Variante inativa

```
Published Product
       ↓
Inactive Variant
       ↓
Public Catalog
       ↓
Variant Not Commercially Available
```

---

 # 74\. E2E-004 — Duplicidade

```
Create Black/M
       ↓
SUCCESS

Create Black/M
       ↓
CONFLICT
```

---

 # 75\. E2E-005 — Controle de acesso

```
Customer
   ↓
Create Variant
   ↓
403
```

---

 # 76\. API Contract Checklist

 | Endpoint | Auth | RBAC | Validation | Price | Availability | Errors | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create Variant | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| List Variants | ✓/Public | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Get Variant | ✓/Public | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Update Variant | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Change Availability | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |

---

 # 77\. Definition of Ready

 TASK-007 está pronta para execução quando:

 - [x] TASK-006 está concluída;
- [x] Product existe;
- [x] regras de variantes estão definidas;
- [x] atributos estão definidos;
- [x] regra de SKU está definida;
- [x] regra de preço está definida;
- [x] regra de disponibilidade está definida;
- [x] RBAC está disponível;
- [x] arquitetura de persistência está definida;
- [x] contratos de API estão definidos;
- [x] não existem decisões críticas pendentes.

---

 # 78\. Definition of Done

 TASK-007 somente poderá ser marcada como `DONE` quando:

 - [x] ProductVariant implementado;
- [x] atributos implementados;
- [x] combinação de atributos validada;
- [x] SKU implementado;
- [x] preço implementado;
- [x] disponibilidade implementada;
- [x] estados definidos;
- [x] CRUD administrativo implementado;
- [x] consulta pública implementada;
- [x] autorização implementada;
- [x] persistência implementada;
- [x] migrations implementadas;
- [x] constraints implementadas;
- [x] índices necessários implementados;
- [x] auditoria integrada;
- [x] testes unitários passam;
- [x] testes de integração passam;
- [x] testes de API passam;
- [x] testes RBAC passam;
- [x] testes de concorrência aplicáveis passam;
- [x] testes de catálogo passam;
- [x] build passa;
- [x] lint passa;
- [x] typecheck passa;
- [x] documentação atualizada;
- [x] TASKS.md atualizado;
- [x] nenhum escopo do TASK-008 ou TASK-009 foi antecipado.

---

 # 79\. Quality Gate específico

 Executar os comandos oficiais do projeto:

```
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run format:check
npm.cmd run db:migrate
node --env-file-if-exists=.env.local node_modules/vitest/vitest.mjs run
npm.cmd run build
```

 Registrar:

```
BUILD:               PASS — npm.cmd run build
LINT:                PASS — npm.cmd run lint (aviso preexistente em app/layout.tsx)
TYPECHECK:           PASS — npm.cmd run typecheck
UNIT:                PASS — Vitest
INTEGRATION:         PASS — PostgreSQL local
API:                 PASS — Route Handlers
E2E:                 N/A — sem interface administrativa/browser; fluxo API coberto por integração
RBAC:                PASS — anônimo 401 e CUSTOMER 403
VARIANT INTEGRITY:   PASS — constraints e combinações únicas
PRICE:               PASS — BRL, centavos e validações
AVAILABILITY:        PASS — estado ativo/inativo e produto publicado/arquivado
CONCURRENCY:         PASS — combinações simultâneas não duplicam variante
AUDIT:               PASS — criação, alteração de preço e disponibilidade
```

---

 # 80\. Matriz de rastreabilidade

 | Requisito | Implementação | Teste | Evidência | Status |
| --- | --- | --- | --- | --- |
| RF-007 | ProductVariant | domain model; migration 004 | integration create/list test | PASS |
| RF-008 | Attributes/Pricing | domain validators; migration 004 | unit + integration tests | PASS |
| RF-021 | Availability | public eligibility query and detail route | active/inactive integration test | PASS |
| RN-004 | Variant rules | validators and uniqueness constraints | unit + concurrent integration test | PASS |
| RN-005 | Price/Availability | cents validation and eligibility query | integration test | PASS |
| UC-003 | Variant selection | public product detail returns eligible variants | integration test | PASS |

A implementação final deve ser confrontada com a definição oficial de cada requisito.

---

 # 81\. Checklist de revisão de código

 ## Domain

 - [ ] variantes possuem identidade;
- [ ] invariantes protegidas;
- [ ] preço não aceita valores inválidos;
- [ ] combinações são determinísticas;
- [ ] estados são explícitos;
- [ ] domínio não depende de infraestrutura.

 ## Application

 - [ ] casos de uso isolados;
- [ ] autorização aplicada;
- [ ] transações adequadas;
- [ ] conflitos tratados;
- [ ] auditoria integrada.

 ## Infrastructure

 - [ ] repository implementado;
- [ ] constraints corretas;
- [ ] índices adequados;
- [ ] unicidade garantida;
- [ ] migration reproduzível.

 ## Presentation

 - [ ] validação;
- [ ] autenticação;
- [ ] autorização;
- [ ] response contract;
- [ ] erros padronizados.

---

 # 82\. Checklist de segurança

 - [ ] endpoints administrativos protegidos;
- [ ] RBAC validado no backend;
- [ ] IDOR/BOLA avaliado;
- [ ] validação de atributos;
- [ ] validação de preço;
- [ ] proteção contra manipulação de preço pelo cliente;
- [ ] dados internos não expostos;
- [ ] logs sanitizados;
- [ ] secrets ausentes;
- [ ] erros não revelam detalhes internos.

---

 # 83\. Checklist financeiro

 Como o TASK-007 introduz preço:

 - [ ] precisão monetária definida;
- [ ] moeda definida;
- [ ] arredondamento definido;
- [ ] valor negativo rejeitado;
- [ ] conversões não realizadas sem requisito;
- [ ] `float` não utilizado de maneira inadequada;
- [ ] preço recebido do cliente não é considerado confiável;
- [ ] preço persistido no backend é a fonte de verdade.

---

 # 84\. Regra crítica de preço

 Nunca considerar o preço enviado pelo frontend como autoridade.

 Fluxo correto:

```
Frontend
   ↓
Solicita operação
   ↓
Backend
   ↓
Valida preço/regra
   ↓
Persistência
```

 Não:

```
Frontend
   ↓
"price": 1.00
   ↓
Backend aceita cegamente
```

---

 # 85\. Compatibilidade com TASK-009

 O design deve permitir:

```
ProductVariant
      │
      ▼
Inventory
      │
      ├── quantity
      ├── movements
      └── balance
```

 Sem exigir que o TASK-007 conheça a implementação interna do Inventory.

---

 # 86\. Compatibilidade com TASK-011

 O carrinho deverá posteriormente referenciar a variante:

```
CartItem
   │
   └── ProductVariant
```

 Portanto:

 - [ ] variante possui identidade estável;
- [ ] preço pode ser recuperado de forma determinística;
- [ ] disponibilidade possui contrato claro;
- [ ] nenhuma dependência direta de checkout é criada agora.

---

 # 87\. Compatibilidade com TASK-013

 O checkout posteriormente precisará preservar:

```
Variant
Price at purchase
Attributes
```

 O TASK-007 não deve criar o OrderItem, mas deve fornecer uma variante suficientemente identificável para que isso seja possível.

---

 # 88\. Performance mínima

 Avaliar:

 - [ ] consulta por `productId`;
- [ ] consulta por SKU;
- [ ] consulta por combinação de atributos;
- [ ] carregamento de variantes sem N+1;
- [ ] índices adequados;
- [ ] payload público controlado.

 Não implementar mecanismo de busca avançado.

---

 # 89\. Observabilidade

 Registrar eventos técnicos relevantes, por exemplo:

```
variant.created
variant.updated
variant.price_changed
variant.availability_changed
```

 Não registrar dados sensíveis.

---

 # 90\. Auditoria

 Diferenciar:

 ### AuditLog

```
quem
o quê
quando
qual variante
resultado
```

 ### Log técnico

```
erro
performance
diagnóstico
infraestrutura
```

---

 # 91\. Cenários que bloqueiam a conclusão

 A TASK não deve ser considerada concluída se:

 - duas variantes iguais podem ser criadas;
- SKU duplicado é aceito quando deveria ser único;
- preço negativo é aceito;
- preço pode ser manipulado sem validação;
- variante pode existir sem Product;
- usuário não autorizado consegue alterar preço;
- variante inativa aparece como vendável;
- concorrência cria duplicidade;
- migration não é reproduzível;
- build falha;
- testes críticos falham;
- implementação cria estoque físico;
- implementação invade checkout/pagamento.

---

 # 92\. Relatório final da TASK

 Criar ou atualizar o artefato oficial:

```
docs/TASKS/TASK007.MD
```

 Estrutura:

```
# TASK-007 — Variantes, preços e disponibilidade

## Status
DONE / BLOCKED

## Implementação
...

## ProductVariant
...

## Attributes
...

## Pricing
...

## Availability
...

## APIs
...

## Persistence
...

## Security
...

## Audit
...

## Tests
...

## Evidence
...

## Traceability
...

## Scope Check
...

## Pending Issues
...

## Definition of Done
...

## Commit
...
```

---

 # 93\. Evidência final

 Preencher:

```
TASK-007
Status: DONE / BLOCKED

ProductVariant:
DONE / BLOCKED

Attributes:
DONE / BLOCKED

SKU:
DONE / BLOCKED / N/A

Pricing:
DONE / BLOCKED

Availability:
DONE / BLOCKED

Persistence:
DONE / BLOCKED

Migrations:
DONE / BLOCKED

Admin APIs:
DONE / BLOCKED

Public API:
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

Concurrency Tests:
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
TASK-008
```

---

 # 94\. Resultado final esperado

 A conclusão do TASK-007 deve estabelecer:

```
                    PRODUCT
                       │
                       ▼
                PRODUCT VARIANTS
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      ATTRIBUTES      PRICE     AVAILABILITY
          │            │            │
          └────────────┼────────────┘
                       ▼
              COMMERCIAL VARIANT
                       │
                       ▼
                 PUBLIC CATALOG
```

 E manter claramente separados:

```
TASK-006
Product / Category / Brand
        │
        ▼
TASK-007
Variants / Attributes / Price / Availability
        │
        ▼
TASK-008
Search / Filters / Sorting
        │
        ▼
TASK-009
Inventory / Movements / Stock
        │
        ▼
TASK-011+
Cart / Checkout / Orders
```

 **Regra principal:** o TASK-007 deve tornar cada variante comercial individualmente identificável, precificável e controlável, mas **não deve transformar disponibilidade em estoque, nem antecipar carrinho, checkout ou pagamento**.

---

## TASK Execution Report

TASK: TASK-007
Status: DONE

Branch: `feature/TASK-007-variants-pricing`
Commits: `feat(catalog): add variants, pricing and availability [TASK-007]`

### Primary Changes
- Implementado modelo de variantes no catálogo, com tamanho/cor, SKU obrigatório, preço em BRL por centavos e estado comercial.
- Adicionada migration `004_catalog_variants.sql`, constraints para atributos, preço e combinação, índice para SKU normalizado globalmente único.
- Criadas APIs administrativas de criação, consulta e atualização; detalhe público agora retorna apenas variantes ativas de produto publicado, sem expor SKU.
- Integrada auditoria para criação, alteração de preço e disponibilidade; regras de produto arquivado respeitadas.
- Atualizados ADR-004, TASK-007 e TASKS.md com decisões e rastreabilidade.

### Incidental Changes
- Nenhuma.

### Tests Executed
- `node --env-file-if-exists=.env.local node_modules/vitest/vitest.mjs run` — 13 arquivos, 26 testes PASS, incluindo testes PostgreSQL locais.
- `npm.cmd run typecheck` — PASS.
- `npm.cmd run lint` — PASS; permanece aviso preexistente em `app/layout.tsx`.
- `npm.cmd run format:check` — PASS.
- `npm.cmd run build` — PASS.
- `npm.cmd run db:migrate` — migration aplicada ao PostgreSQL local; execução repetida sem erro.

### Quality Gates

| Gate | Resultado |
|---|---|
| Build | PASS |
| Lint | PASS (aviso preexistente em `app/layout.tsx`) |
| Unit | PASS |
| Integration | PASS |
| API | PASS |
| Security | PASS (RBAC, validação e não exposição do SKU cobertos) |
| Acceptance | PASS |
| Regression | PASS |

### Scope Validation

Allowed Changes: PASS
Incidental Changes: PASS
Forbidden Changes: PASS
Scope Creep: NONE

### Definition of Done

PASS

### Next Eligible TASK

NONE — TASK-008 permanece BLOCKED.
