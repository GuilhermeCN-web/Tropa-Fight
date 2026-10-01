# TASK-007 — Variantes, preços e disponibilidade

 ## 1\. Identificação

 - **ID:** TASK-007
- **Título:** Variantes, preços e disponibilidade
- **Status:** BLOCKED
- **Phase:** PHASE-02
- **Priority:** HIGH
- **Tipo:** Feature / Domain / Application / Persistence / API
- **Dependências:** TASK-006
- **Relacionados:** RF-007, RF-008, RF-021, RN-004, RN-005, UC-003

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

 Se SKU fizer parte do modelo aprovado:

```
ProductVariant
└── sku
```

 Requisitos:

 - [ ] SKU obrigatório quando definido;
- [ ] SKU único;
- [ ] comparação normalizada;
- [ ] não permitir duplicidade;
- [ ] conflito gera erro;
- [ ] SKU não pode ser alterado silenciosamente se houver dependências futuras.

 A regra definitiva de geração/edição do SKU deve seguir a especificação aprovada.

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

 A representação definitiva deve ser escolhida de acordo com a arquitetura e requisitos.

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

 Cada variante deve possuir o preço aplicável conforme a regra aprovada.

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

 - [ ] preço obrigatório quando aplicável;
- [ ] valor não negativo;
- [ ] precisão monetária correta;
- [ ] moeda definida;
- [ ] representação determinística;
- [ ] arredondamento definido;
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

 A regra exata deve ser documentada.

---

 # 24\. Relação Product → Variant

 Modelo:

```
Product 1 ───── N ProductVariant
```

 Um produto pode possuir zero ou várias variantes, conforme regra do domínio.

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

 Não assumir automaticamente que qualquer produto pode receber variantes.

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
POST   /admin/products/:productId/variants
GET    /admin/products/:productId/variants
GET    /admin/variants/:id
PATCH  /admin/variants/:id
```

 Endpoints reais devem seguir o padrão oficial.

---

 # 30\. Consulta pública

 A API pública deve conseguir representar as variantes necessárias ao catálogo.

 Exemplo:

```
GET /products/:id
```

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

 Escolher explicitamente entre:

 ### Opção A — JSON/JSONB

```
attributes JSON
```

 ### Opção B — Modelo relacional

```
variant_attributes
attribute_definitions
attribute_values
```

 ### Opção C — Modelo híbrido

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

 - [ ] TASK-006 está concluída;
- [ ] Product existe;
- [ ] regras de variantes estão definidas;
- [ ] atributos estão definidos;
- [ ] regra de SKU está definida;
- [ ] regra de preço está definida;
- [ ] regra de disponibilidade está definida;
- [ ] RBAC está disponível;
- [ ] arquitetura de persistência está definida;
- [ ] contratos de API estão definidos;
- [ ] não existem decisões críticas pendentes.

---

 # 78\. Definition of Done

 TASK-007 somente poderá ser marcada como `DONE` quando:

 - [ ] ProductVariant implementado;
- [ ] atributos implementados;
- [ ] combinação de atributos validada;
- [ ] SKU implementado, se aplicável;
- [ ] preço implementado;
- [ ] disponibilidade implementada;
- [ ] estados definidos;
- [ ] CRUD administrativo implementado;
- [ ] consulta pública implementada;
- [ ] autorização implementada;
- [ ] persistência implementada;
- [ ] migrations implementadas;
- [ ] constraints implementadas;
- [ ] índices necessários implementados;
- [ ] auditoria integrada;
- [ ] testes unitários passam;
- [ ] testes de integração passam;
- [ ] testes de API passam;
- [ ] testes RBAC passam;
- [ ] testes de concorrência aplicáveis passam;
- [ ] testes de catálogo passam;
- [ ] build passa;
- [ ] lint passa;
- [ ] typecheck passa;
- [ ] documentação atualizada;
- [ ] TASKS.md atualizado;
- [ ] nenhum escopo do TASK-008 ou TASK-009 foi antecipado.

---

 # 79\. Quality Gate específico

 Executar os comandos oficiais do projeto:

```
<lint-command>
<typecheck-command>
<unit-test-command>
<integration-test-command>
<api-test-command>
<build-command>
```

 Registrar:

```
BUILD:               PASS / FAIL
LINT:                PASS / FAIL
TYPECHECK:           PASS / FAIL
UNIT:                PASS / FAIL
INTEGRATION:         PASS / FAIL
API:                 PASS / FAIL
E2E:                 PASS / FAIL
RBAC:                PASS / FAIL
VARIANT INTEGRITY:   PASS / FAIL
PRICE:               PASS / FAIL
AVAILABILITY:        PASS / FAIL
CONCURRENCY:         PASS / FAIL
AUDIT:               PASS / FAIL
```

---

 # 80\. Matriz de rastreabilidade

 | Requisito | Implementação | Teste | Evidência | Status |
| --- | --- | --- | --- | --- |
| RF-007 | ProductVariant |  |  |  |
| RF-008 | Attributes/Pricing |  |  |  |
| RF-021 | Availability |  |  |  |
| RN-004 | Variant rules |  |  |  |
| RN-005 | Price/Availability |  |  |  |
| UC-003 | Variant selection |  |  |  |

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
docs/tasks/TASK-007.md
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