# TASK-010 — Checkpoint PHASE-02

 **Status:** BLOCKED\
 **Phase/Priority:** PHASE-02 / HIGH\
 **Dependências:** `DEPENDS_ON: TASK-009`\
 **Estado de entrada esperado:** `BLOCKED` até `TASK-009 = DONE`\
 **Estado de execução permitido:** `BLOCKED → READY → IN_PROGRESS → IN_REVIEW → DONE | FAILED | CANCELLED`

 **Relacionados:** RF-003–014, RN-004–007, UC-002, UC-003, UC-010

---

 ## 1\. Objetivo

 Executar o checkpoint formal da `PHASE-02 — Catálogo e estoque`, validando que os componentes entregues pelas:

 - `TASK-006` — catálogo de produtos e categorias;
- `TASK-007` — variantes, preços e disponibilidade;
- `TASK-008` — busca, filtros, ordenação e experiência de catálogo;
- `TASK-009` — estoque e movimentações;

 formam um conjunto funcional, consistente, testável e rastreável.

 O objetivo desta TASK é **validar e corrigir somente problemas diretamente necessários para fechar a PHASE-02**.

 A `TASK-010` não deve introduzir funcionalidades novas.

---

 ## 2\. Resultado esperado

 Ao final do checkpoint, deverá ser possível demonstrar que:

```
Produto
   ↓
Categoria / Marca
   ↓
Variante
   ↓
Preço
   ↓
Disponibilidade
   ↓
Busca / Filtros / Ordenação
   ↓
Estoque
   ↓
Movimentações
```

 mantém integridade entre os componentes.

 A fase deverá estar pronta para liberar a `PHASE-03`, sem antecipar carrinho, promoções, checkout, pagamento ou pedidos.

---

 ## 3\. Pré-condições / Definition of Ready

 A TASK-010 somente poderá entrar em `READY` quando:

 - `TASK-006 = DONE`;
- `TASK-007 = DONE`;
- `TASK-008 = DONE`;
- `TASK-009 = DONE`;
- respectivos relatórios de execução estiverem disponíveis;
- respectivos `TASKS.md`/artefatos de rastreabilidade estiverem atualizados;
- build das TASKs anteriores estiver passando;
- lint estiver passando;
- testes aplicáveis estiverem passando;
- contratos das APIs envolvidas estiverem disponíveis;
- não houver bloqueio crítico conhecido sem registro;
- Scope Guard da TASK-010 estiver validado.

 Se alguma dependência não estiver realmente concluída, a TASK permanece `BLOCKED`.

---

 ## 4\. Escopo do checkpoint

 A TASK-010 deverá validar transversalmente:

 ### Catálogo

 - produtos;
- categorias;
- marcas;
- publicação/visibilidade;
- contratos de catálogo.

 ### Variantes

 - identificação;
- relacionamento produto → variante;
- atributos;
- preço;
- disponibilidade.

 ### Busca

 - pesquisa;
- filtros;
- ordenação;
- paginação;
- resultados vazios;
- combinação de filtros.

 ### Estoque

 - saldo;
- entradas;
- saídas;
- ajustes;
- movimentações;
- integridade;
- concorrência;
- autorização.

 ### Integração

 - catálogo ↔ variantes;
- variantes ↔ preço;
- variantes ↔ disponibilidade;
- variantes ↔ estoque;
- catálogo ↔ busca;
- estoque ↔ disponibilidade.

---

 ## 5\. Fora do escopo

 A TASK-010 não deve implementar:

```
carrinho
checkout
promoções
cupons
pagamentos
webhooks de pagamento
pedidos
endereços
frete
logística
rastreamento
wishlist
avaliações
recomendação por IA
novas funcionalidades administrativas
novos papéis de RBAC
novos requisitos comerciais
nova arquitetura não aprovada
```

 Se um problema identificado durante o checkpoint depender de uma dessas funcionalidades, deve ser registrado como pendência/bloqueio, não implementado como atalho.

---

 ## 6\. Natureza do checkpoint

 A TASK-010 possui quatro objetivos:

```
1. Verificar
2. Integrar
3. Corrigir problemas diretamente necessários
4. Decidir se PHASE-02 está pronta para encerramento
```

 Ela não deve ser utilizada para:

```
"aproveitar para melhorar"
"refatorar tudo"
"preparar funcionalidades futuras"
"antecipar PHASE-03"
```

---

 # 7\. Quality Gates da PHASE-02

 Todos os Gates aplicáveis devem ser avaliados.

 ## Gate 01 — Build

 Critério:

```
BUILD = PASS
```

 Não pode existir erro de compilação/build no estado final.

---

 ## Gate 02 — Lint

 Critério:

```
LINT = PASS
```

 Warnings previamente aceitos devem estar documentados.

 Novos warnings introduzidos durante o checkpoint devem ser corrigidos ou formalmente tratados.

---

 ## Gate 03 — Testes unitários

 Devem passar os testes aplicáveis de:

 - catálogo;
- categorias;
- marcas;
- variantes;
- preço;
- disponibilidade;
- busca;
- filtros;
- ordenação;
- paginação;
- estoque;
- movimentações.

 Critério:

```
UNIT_TESTS = PASS
```

---

 ## Gate 04 — Testes de integração

 Validar integração entre os principais componentes:

```
Product
   ↕
ProductVariant
   ↕
Inventory
   ↕
InventoryMovement
```

 e:

```
Catalog
   ↓
Search
   ↓
Filters
   ↓
Availability
```

 Critério:

```
INTEGRATION_TESTS = PASS
```

---

 ## Gate 05 — Testes de API

 Validar:

 - contratos;
- status HTTP;
- validações;
- autorização;
- paginação;
- filtros;
- respostas;
- erros;
- disponibilidade;
- estoque.

 Critério:

```
API_TESTS = PASS
```

---

 ## Gate 06 — Autorização

 Validar que:

 - operações públicas são acessíveis conforme contrato;
- operações administrativas exigem autorização;
- clientes não alteram estoque;
- clientes não acessam recursos administrativos;
- permissões não foram ampliadas indevidamente.

 Critério:

```
AUTHORIZATION = PASS
```

---

 ## Gate 07 — Integridade de estoque

 Validar:

 - saldo consistente;
- movimentações correspondentes;
- ausência de atualização parcial;
- ausência de saldo negativo indevido;
- consistência sob concorrência.

 Critério:

```
INVENTORY_INTEGRITY = PASS
```

---

 ## Gate 08 — Concorrência

 Executar pelo menos:

```
saldo = 1

request A → saída 1
request B → saída 1
```

 Resultado esperado:

```
uma operação confirmada
uma operação rejeitada
saldo final = 0
movimentações = 1
```

 O teste deverá provar a consistência, e não apenas o valor final.

 Critério:

```
CONCURRENCY = PASS
```

---

 ## Gate 09 — Catálogo público

 Validar que produtos não publicados ou não elegíveis para exposição pública não aparecem nos resultados públicos.

 Testar através de:

 - listagem;
- busca;
- filtros;
- ordenação;
- paginação.

 Critério:

```
PUBLIC_CATALOG_VISIBILITY = PASS
```

---

 ## Gate 10 — Disponibilidade

 Validar que a informação de disponibilidade permanece consistente com o domínio de variantes e estoque.

 Exemplo conceitual:

```
variante
   ↓
estoque
   ↓
disponibilidade
   ↓
catálogo
```

 Não alterar a regra comercial para fazer o teste passar.

 Critério:

```
AVAILABILITY_CONSISTENCY = PASS
```

---

 ## Gate 11 — Paginação e ordenação

 Validar:

 - páginas consecutivas;
- filtros persistentes entre páginas;
- ordenação estável;
- empate no campo de ordenação;
- última página;
- página vazia;
- combinação de ordenação \+ filtros.

 Critério:

```
PAGINATION_SORTING = PASS
```

---

 ## Gate 12 — Acessibilidade

 Validar os controles de catálogo incluídos na PHASE-02:

 - busca;
- filtros;
- ordenação;
- paginação;
- mensagens de resultado;
- estados vazios;
- navegação por teclado;
- foco;
- labels.

 Critério:

```
ACCESSIBILITY = PASS
```

---

 ## 8\. Cenário integrado principal

 Executar um cenário representativo de ponta a ponta dentro do escopo da PHASE-02.

 ### Preparação

 Criar ou utilizar:

```
Categoria A
Marca A
Produto A
Variante A
Preço A
Estoque A
```

 e dados equivalentes para cenários de filtro.

 ### Fluxo

```
1. Criar/validar produto
2. Associar categoria
3. Associar marca
4. Criar variante
5. Definir preço
6. Configurar estoque
7. Consultar catálogo
8. Buscar produto
9. Aplicar filtro
10. Ordenar
11. Paginar
12. Consultar disponibilidade
13. Registrar movimentação
14. Consultar novo saldo
15. Confirmar consistência do catálogo
```

 ### Resultado

 O sistema deverá manter consistência entre:

```
produto
variante
preço
disponibilidade
estoque
catálogo público
```

---

 # 9\. Matriz de integração

 | Origem | Destino | Validação |
| --- | --- | --- |
| Product | ProductVariant | Variante pertence ao produto correto |
| Category | Product | Associação consistente |
| Brand | Product | Associação consistente |
| ProductVariant | Pricing | Preço corresponde à variante |
| ProductVariant | Inventory | Saldo pertence à variante correta |
| Inventory | Availability | Disponibilidade consistente |
| Product | Search | Produto pesquisável conforme contrato |
| Category | Search | Filtro de categoria correto |
| Brand | Search | Filtro de marca correto |
| Price | Search | Filtro de preço correto |
| Search | Pagination | Resultado consistente entre páginas |
| InventoryMovement | Inventory | Saldo e movimentação consistentes |

---

 # 10\. Testes de regressão

 Executar a suíte relevante das TASKs:

```
TASK-006
TASK-007
TASK-008
TASK-009
```

 Nenhuma regressão crítica deve permanecer.

 ### Regressões obrigatórias

 Verificar especialmente:

 - criação de produto;
- edição de produto;
- publicação;
- criação de variante;
- alteração de preço;
- busca;
- filtros;
- ordenação;
- paginação;
- consulta de estoque;
- entrada;
- saída;
- ajuste;
- histórico;
- concorrência.

---

 # 11\. Testes de consistência

 ## Produto removido/inativado

 Verificar o comportamento do catálogo quando um produto deixa de estar disponível para publicação.

 Validar:

 - listagem;
- busca;
- filtros;
- páginas subsequentes.

---

 ## Variante alterada

 Alterar uma variante e verificar:

 - catálogo;
- preço;
- disponibilidade;
- estoque;
- busca.

---

 ## Estoque alterado

 Após movimentação de estoque:

```
saldo anterior
   ↓
movimentação
   ↓
novo saldo
   ↓
disponibilidade
```

 deve permanecer consistente.

---

 # 12\. Testes de dados

 Validar:

 - chaves estrangeiras;
- unicidade;
- integridade;
- valores nulos;
- valores inválidos;
- relacionamentos;
- registros órfãos;
- consistência entre entidades.

 Não devem existir registros órfãos produzidos pelos fluxos normais.

---

 # 13\. Testes de autorização

 Criar uma matriz mínima:

 | Operação | Público | Cliente | Admin autorizado | Admin não autorizado |
| --- | --- | --- | --- | --- |
| Consultar catálogo | Sim | Sim | Sim | Sim |
| Buscar produtos | Sim | Sim | Sim | Sim |
| Consultar estoque | Conforme contrato | Conforme contrato | Sim | Conforme permissão |
| Criar entrada | Não | Não | Sim | Não |
| Criar saída | Não | Não | Sim | Não |
| Criar ajuste | Não | Não | Sim | Não |
| Consultar movimentações | Não | Não | Sim | Conforme permissão |

A matriz definitiva deve seguir as permissões efetivamente aprovadas.

---

 # 14\. Testes de segurança

 Verificar:

 - parâmetros de busca;
- filtros;
- ordenação;
- paginação;
- IDs inexistentes;
- IDs de outros recursos;
- endpoints administrativos;
- manipulação de payload;
- tentativa de alteração de estoque sem autorização;
- tentativa de acessar informações internas.

 Não criar nova arquitetura de segurança durante o checkpoint.

 Corrigir apenas problemas diretamente necessários para fechar a PHASE-02.

---

 # 15\. Testes de acessibilidade

 Validar pelo menos:

```
Busca → teclado/foco/label
Filtro → teclado/foco/estado
Ordenação → teclado/foco
Paginação → teclado/foco/estado atual
Resultados → semântica
Estado vazio → mensagem compreensível
Erro → mensagem associada
```

 Se houver ferramenta automatizada de a11y, executá-la.

 Problemas críticos devem ser corrigidos antes de `DONE`, salvo bloqueio formalmente aceito.

---

 # 16\. Performance / regressão

 O checkpoint deve identificar regressões evidentes introduzidas pela PHASE-02.

 Verificar especialmente:

 - consultas que carregam catálogo inteiro;
- N+1;
- paginação em memória;
- filtros executados fora do mecanismo adequado;
- histórico de estoque sem limite;
- consultas administrativas sem paginação;
- consultas de estoque com concorrência inadequada.

 Não transformar o checkpoint em uma iniciativa geral de performance.

---

 # 17\. Dados de teste

 Criar massa mínima representativa contendo:

```
3+ categorias
3+ marcas
produtos publicados
produto não publicado
múltiplas variantes
variantes com preços diferentes
variantes com estoque positivo
variante com estoque zero
múltiplas movimentações
```

 A quantidade exata pode variar conforme a infraestrutura de testes.

 Os dados devem permitir validar filtros combinados e cenários de estoque.

---

 # 18\. Migrações / banco de dados

 Validar:

 - migrations aplicam corretamente;
- migrations são reproduzíveis;
- constraints funcionam;
- índices necessários existem;
- rollback, quando suportado, comporta-se conforme o padrão do projeto;
- ambiente limpo consegue reproduzir o estado esperado.

 Não alterar o modelo de dados sem necessidade diretamente relacionada ao checkpoint.

---

 # 19\. Contratos

 Validar compatibilidade entre:

```
API
↓
Application
↓
Domain
↓
Persistence
```

 e entre:

```
Catálogo
↓
Variantes
↓
Estoque
```

 Qualquer quebra de contrato deve:

 1. ser identificada;
2. ter impacto avaliado;
3. ser corrigida se estiver dentro do escopo;
4. ou ser registrada como bloqueio/decisão.

 Não mascarar quebra de contrato apenas para fazer os testes passarem.

---

 # 20\. Rastreabilidade

 A matriz mínima deve ser:

 | Requisito | Evidência |
| --- | --- |
| RF-003 | Produto/catálogo |
| RF-004 | Categorias |
| RF-005 | Marcas |
| RF-006 | Publicação/catalogação |
| RF-007 | Variantes |
| RF-008 | Preços/disponibilidade |
| RF-009 | Busca |
| RF-010 | Filtros |
| RF-011 | Ordenação |
| RF-012 | Paginação/experiência |
| RF-013 | Estoque |
| RF-014 | Movimentações |
| RN-004 | Regras de variante/preço |
| RN-005 | Disponibilidade |
| RN-006 | Regras de estoque |
| RN-007 | Integridade/movimentações |
| UC-002 | Navegação de catálogo |
| UC-003 | Busca/filtragem |
| UC-010 | Administração de estoque |

Cada item deve apontar para uma evidência verificável.

---

 # 21\. Tratamento de falhas

 Durante o checkpoint, classificar problemas encontrados.

 ### CRITICAL

 Impede liberar a PHASE-03.

 Exemplos:

```
saldo incorreto
vazamento de produto não publicado
bypass de autorização
corrupção de dados
falha transacional
concorrência inconsistente
build quebrado
```

 ### HIGH

 Pode impedir `DONE` dependendo do impacto.

 Exemplos:

```
contrato quebrado
filtro incorreto
paginação inconsistente
teste crítico ausente
falha importante de acessibilidade
```

 ### MEDIUM

 Deve ser corrigido se estiver diretamente dentro do escopo e for necessário para o Gate.

 ### LOW

 Registrar como pendência sem expandir automaticamente o escopo.

---

 # 22\. Regra para correções durante o checkpoint

 Correções são permitidas somente quando:

 - forem diretamente causadas por uma entrega da PHASE-02;
- forem necessárias para atender aos critérios de aceitação;
- forem necessárias para passar um Quality Gate;
- estiverem dentro de `ALLOWED_CHANGES`;
- não introduzirem funcionalidade nova.

 Exemplo permitido:

```
Um filtro implementado na TASK-008 retorna produtos incorretos.
→ Corrigir o filtro.
```

 Exemplo proibido:

```
O estoque precisará de reserva no checkout.
→ Implementar reserva agora.
```

---

 # 23\. ALLOWED\_CHANGES

 São permitidas:

```
correções em catálogo
correções em categorias
correções em marcas
correções em variantes
correções em preços/disponibilidade
correções em busca
correções em filtros
correções em ordenação
correções em paginação
correções em estoque
correções em movimentações
correções de autorização diretamente relacionadas
correções de testes
correções de documentação
correções de configuração necessárias
ajustes de migrations diretamente necessários
TASKS.md
relatório de checkpoint
```

 Toda correção deve ser justificável pela PHASE-02.

---

 # 24\. FORBIDDEN\_CHANGES

 Não realizar:

```
novas funcionalidades comerciais
carrinho
checkout
promoções
cupons
pagamentos
webhooks
pedidos
endereços
frete
rastreamento
wishlist
avaliações
recomendação
novos papéis
nova arquitetura
mudança de requisito
alteração de escopo
refatoração não necessária
reserva de estoque
baixa de estoque por checkout
integração logística
```

---

 # 25\. Scope Guard

 Antes de cada correção:

```
O problema pertence à PHASE-02?
A correção é necessária para um Gate?
A correção está diretamente relacionada a TASK-006/007/008/009?
A correção preserva os requisitos aprovados?
A correção evita introduzir funcionalidade nova?
```

 Se qualquer resposta relevante for negativa, não implementar automaticamente.

---

 # 26\. Checklist de Quality Gates

```
[ ] Build
[ ] Lint
[ ] Unit tests
[ ] Integration tests
[ ] API/contract tests
[ ] Authorization tests
[ ] Catalog visibility tests
[ ] Search/filter tests
[ ] Sorting/pagination tests
[ ] Inventory integrity tests
[ ] Concurrency tests
[ ] Transaction/atomicity tests
[ ] Accessibility tests
[ ] Security checks
[ ] Migration/database validation
[ ] Regression suite
[ ] Traceability review
[ ] Scope Guard
```

 Todos os Gates obrigatórios devem possuir evidência.

---

 # 27\. Critérios de aceitação detalhados

 ### AC-01 — Catálogo

 Produtos, categorias e marcas funcionam conforme os contratos aprovados.

 ### AC-02 — Variantes

 Variantes permanecem corretamente associadas aos produtos.

 ### AC-03 — Preços

 Preços permanecem consistentes com as variantes.

 ### AC-04 — Busca

 Busca retorna resultados corretos.

 ### AC-05 — Filtros

 Filtros combinados retornam resultados corretos.

 ### AC-06 — Ordenação

 Ordenação permanece determinística.

 ### AC-07 — Paginação

 Paginação não perde, duplica ou reorganiza indevidamente resultados entre páginas.

 ### AC-08 — Estoque

 Saldo e movimentações permanecem consistentes.

 ### AC-09 — Concorrência

 Operações concorrentes não produzem saldo incorreto.

 ### AC-10 — Visibilidade

 Produtos não publicáveis não aparecem no catálogo público.

 ### AC-11 — Autorização

 Operações administrativas respeitam RBAC.

 ### AC-12 — Integração

 Catálogo, variantes, preço, disponibilidade e estoque permanecem coerentes.

 ### AC-13 — Qualidade

 Build, lint e testes aplicáveis passam.

 ### AC-14 — Rastreabilidade

 Todos os RF/RN/UC relacionados possuem evidência.

 ### AC-15 — Escopo

 Nenhuma funcionalidade da PHASE-03 foi antecipada.

---

 # 28\. Definition of Done específica

 A `TASK-010` somente poderá ser marcada como `DONE` quando:

 - [ ] TASK-006 validada;
- [ ] TASK-007 validada;
- [ ] TASK-008 validada;
- [ ] TASK-009 validada;
- [ ] build passa;
- [ ] lint passa;
- [ ] testes unitários passam;
- [ ] testes de integração passam;
- [ ] testes de API passam;
- [ ] testes de autorização passam;
- [ ] testes de catálogo público passam;
- [ ] testes de busca/filtros passam;
- [ ] testes de ordenação/paginação passam;
- [ ] testes de estoque passam;
- [ ] testes de concorrência passam;
- [ ] testes transacionais passam;
- [ ] testes de acessibilidade passam;
- [ ] validações de segurança passam;
- [ ] migrations/banco validados;
- [ ] regressão da PHASE-02 executada;
- [ ] inconsistências críticas resolvidas;
- [ ] pendências restantes registradas;
- [ ] rastreabilidade atualizada;
- [ ] Scope Guard validado;
- [ ] `ALLOWED_CHANGES` respeitado;
- [ ] `FORBIDDEN_CHANGES` não violado;
- [ ] nenhum Scope Creep identificado;
- [ ] `TASKS.md` atualizado;
- [ ] relatório de checkpoint produzido;
- [ ] decisão formal de encerramento da PHASE-02 registrada;
- [ ] estado final registrado como `DONE`.

---

 # 29\. Critério especial de liberação da PHASE-03

 A PHASE-03 somente será considerada elegível quando:

```
TASK-006 = DONE
TASK-007 = DONE
TASK-008 = DONE
TASK-009 = DONE
TASK-010 = DONE
```

 e:

```
todos os Quality Gates obrigatórios = PASS
```

 Não é permitido declarar a PHASE-02 concluída apenas porque as quatro TASKs funcionais foram marcadas como `DONE`.

 O checkpoint é obrigatório.

---

 # 30\. Pendências aceitas

 Uma pendência poderá permanecer registrada somente se:

 - não violar critério obrigatório;
- não representar risco crítico;
- não impedir a PHASE-03;
- estiver explicitamente documentada;
- possuir responsável/decisão conforme governança do projeto;
- não for utilizada para mascarar falha de Gate.

 Formato:

```
ID:
Descrição:
Impacto:
Severidade:
Gate afetado:
Bloqueia PHASE-03? <SIM/NÃO>
Decisão:
Responsável:
Próxima ação:
```

---

 # 31\. Condições de FAILED

 A TASK deverá ser `FAILED` quando:

 - existir Gate obrigatório falhando;
- houver inconsistência de estoque;
- houver corrupção ou perda de integridade;
- concorrência permanecer incorreta;
- autorização puder ser contornada;
- produtos não publicáveis forem expostos;
- regressão crítica permanecer;
- build/lint/testes obrigatórios falharem;
- rastreabilidade obrigatória estiver incompleta;
- houver violação de `FORBIDDEN_CHANGES`;
- a PHASE-02 não puder ser considerada tecnicamente íntegra.

 O relatório deve registrar:

```
falha
evidência
impacto
Gate afetado
causa conhecida
correção necessária
```

---

 # 32\. Condições de CANCELLED

 `CANCELLED` somente mediante decisão explícita.

 Registrar:

```
motivo
decisão responsável
impacto na PHASE-02
impacto na PHASE-03
estado dos artefatos
pendências
rastreabilidade
```

 Uma TASK cancelada não libera automaticamente a fase seguinte.

---

 # 33\. Política de transição de estado

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

 Exceções:

```
IN_PROGRESS → FAILED
IN_PROGRESS → CANCELLED
IN_REVIEW → IN_PROGRESS
```

 ### Entrada em READY

 Exige:

```
TASK-009 = DONE
+
Definition of Ready satisfeita
+
artefatos das TASKs anteriores disponíveis
```

 ### Entrada em DONE

 Exige:

```
todos os Gates obrigatórios = PASS
+
correções necessárias concluídas
+
pendências aceitas/documentadas
+
rastreabilidade completa
+
Scope Guard PASS
+
relatório produzido
+
TASKS.md atualizado
```

---

 # 34\. Relatório de checkpoint — template

```
TASK: TASK-010
TÍTULO: Checkpoint PHASE-02
ESTADO INICIAL: IN_PROGRESS
ESTADO FINAL: <DONE|FAILED|CANCELLED>

DEPENDÊNCIA:
- TASK-009: DONE

OBJETIVO:
<resumo do checkpoint>

ESCOPO VALIDADO:
- TASK-006: <PASS/FAIL>
- TASK-007: <PASS/FAIL>
- TASK-008: <PASS/FAIL>
- TASK-009: <PASS/FAIL>

QUALITY GATES:

Build:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Lint:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Unit:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Integration:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

API/Contract:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Authorization:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Catalog Visibility:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Search/Filters:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Sorting/Pagination:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Inventory Integrity:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Concurrency:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Atomicity:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Accessibility:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Security:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

Regression:
- Resultado: <PASS/FAIL>
- Evidência: <evidência>

INTEGRAÇÃO VALIDADA:
- Product → Variant: <resultado>
- Variant → Price: <resultado>
- Variant → Inventory: <resultado>
- Inventory → Availability: <resultado>
- Catalog → Search: <resultado>

PROBLEMAS ENCONTRADOS:
- <item>

CORREÇÕES REALIZADAS:
- <item>

PENDÊNCIAS:
- <item ou "nenhuma">

RISCOS RESIDUAIS:
- <item ou "nenhum">

RASTREABILIDADE:
- RF-003–014: <resultado>
- RN-004–007: <resultado>
- UC-002: <resultado>
- UC-003: <resultado>
- UC-010: <resultado>

SCOPE GUARD:
- ALLOWED_CHANGES: PASS
- FORBIDDEN_CHANGES: PASS
- Scope Creep: NÃO IDENTIFICADO

DECISÃO DA PHASE-02:
<LIBERADA | NÃO LIBERADA>

JUSTIFICATIVA:
<justificativa factual>

TASKS.md:
- atualizado: <SIM/NÃO>

CONCLUSÃO:
<resultado final do checkpoint>

PRÓXIMO ESTADO:
<DONE|FAILED|CANCELLED>
```

---

 # 35\. Regra de encerramento

 Ao concluir a `TASK-010`:

 1. executar todos os Quality Gates obrigatórios;
2. corrigir somente problemas diretamente necessários ao fechamento da PHASE-02;
3. registrar pendências não bloqueantes;
4. atualizar a matriz de rastreabilidade;
5. atualizar `TASKS.md`;
6. produzir o relatório de checkpoint;
7. registrar explicitamente se a PHASE-02 está liberada;
8. marcar a TASK como `DONE`, somente se todos os critérios forem atendidos;
9. **não iniciar automaticamente a `TASK-011`**;
10. aguardar autorização explícita para iniciar a próxima TASK.