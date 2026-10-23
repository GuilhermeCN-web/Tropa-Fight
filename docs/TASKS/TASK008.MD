 # TASK-008 — Busca, filtros, ordenação e experiência de catálogo

 **Status:** DONE\
 **Phase/Priority:** PHASE-02 / HIGH\
 **Dependências:** `DEPENDS_ON: TASK-006`\
 **Estado de entrada esperado:** `READY` após `TASK-006 = DONE` e critérios aprovados\
 **Estado de execução permitido:** `READY → IN_PROGRESS → IN_REVIEW → DONE | FAILED | CANCELLED`

 **Relacionados:** RF-009, RF-010, RF-011, RF-012, UC-002, UC-003

> **Critérios aprovados pelo responsável (2026-10-23):** busca parcial, sem diferenciar maiúsculas/minúsculas, nos campos nome, descrição, marca e nomes das categorias; filtros combináveis por um `categoryId`, um `brandId` e faixa inclusiva `minPriceCents`/`maxPriceCents`; produto pertence à faixa se alguma variante `ACTIVE` estiver nela. Ordenação permitida: `name_asc` (padrão), `name_desc`, `price_asc`, `price_desc`; ordenação por preço usa o menor preço de variante `ACTIVE`; empates são desempatados por ID crescente. Paginação por `page` (padrão 1) e `pageSize` (padrão 20, máximo 100); argumentos inválidos retornam HTTP 400; página válida após o total retorna `items: []` e metadados `page`, `pageSize`, `totalItems`, `totalPages`.
>
> **Execução iniciada (2026-10-23):** Definition of Ready atendida. Branch: `feature/TASK-008-catalog-search`.
>
> **Implementação concluída (2026-10-23):** consulta SQL paginada com filtros, busca e ordenação determinística; API pública; interface de catálogo; testes unitários e integrados. Gates aprovados e resultados registrados abaixo.

---

 ## 1\. Objetivo

 Implementar a capacidade de descoberta do catálogo público, permitindo que clientes:

 - pesquisem produtos;
- filtrem produtos por critérios aprovados;
- combinem múltiplos filtros;
- ordenem resultados;
- naveguem por páginas de resultados;
- recebam resultados consistentes e determinísticos;
- utilizem os controles de catálogo de forma acessível.

 A implementação deve consumir o domínio de catálogo entregue pela `TASK-006` sem introduzir regras comerciais pertencentes às TASKs posteriores.

 A TASK deve entregar a infraestrutura funcional de **consulta e navegação do catálogo**, sem implementar recomendação por IA, wishlist, avaliações, checkout ou qualquer mecanismo de personalização fora do escopo.

---

 ## 2\. Pré-condições / Definition of Ready

 A TASK-008 somente poderá entrar em `READY` quando:

 - `TASK-006` estiver em `DONE`;
- o DoD global da `TASK-006` estiver satisfeito;
- `Product`, `Category` e `Brand` estiverem disponíveis conforme os contratos aprovados;
- os estados de publicação/visibilidade de produto estiverem definidos;
- os campos pesquisáveis do produto estiverem identificados;
- os critérios de filtragem aprovados estiverem documentados;
- os critérios de ordenação aprovados estiverem documentados;
- o contrato de paginação estiver definido;
- os contratos API/UI necessários estiverem identificados;
- não existirem decisões pendentes que exijam alteração de requisitos;
- eventuais ambiguidades comerciais estejam formalmente registradas antes do início;
- o Scope Guard da TASK-008 estiver validado.

 Se qualquer pré-condição acima não puder ser comprovada, a TASK permanece `BLOCKED`.

 **Definition of Ready verificada (2026-10-23): PASS.** TASK-006 e seus artefatos estão `DONE` e disponíveis; publicação/visibilidade e campos Product/Brand/Category estão definidos; os critérios de busca, filtros, ordenação e paginação acima foram aprovados; contrato API/UI e Scope Guard estão definidos; não há decisão comercial pendente para esta TASK.

---

 ## 3\. Resultado esperado

 Ao final da TASK, o sistema deverá fornecer uma experiência de consulta de catálogo com:

```
Consulta
  ↓
Normalização dos parâmetros
  ↓
Aplicação de visibilidade/publicação
  ↓
Busca textual, quando informada
  ↓
Filtros
  ↓
Ordenação determinística
  ↓
Paginação
  ↓
Resultado + metadados de paginação
```

 O resultado deverá ser consistente com os dados disponíveis no catálogo e não poderá expor produtos que não estejam autorizados para publicação no catálogo público.

---

 ## 4\. Escopo funcional

 ### 4.1 Busca

 Implementar busca textual sobre os campos aprovados:

 - nome do produto;
- descrição;
- nome da marca;
- nomes das categorias.

 A correspondência é parcial e não diferencia maiúsculas/minúsculas. Espaços externos e sequências internas são normalizados.

 A busca deve:

 - aceitar consulta vazia quando o endpoint representar listagem;
- tratar espaços excedentes de forma consistente;
- possuir comportamento definido para consulta sem resultados;
- não expor registros não publicados;
- possuir comportamento determinístico;
- não depender de recomendação ou personalização.

 Não implementar:

 - busca semântica;
- embeddings;
- recomendação por IA;
- ranking comportamental;
- personalização por usuário;
- histórico de busca;
- autocomplete inteligente, salvo decisão explícita de escopo.

---

 ### 4.2 Filtros

 Implementar os filtros aprovados para catálogo.

 Filtros aprovados:

 - `categoryId`: UUID de uma categoria;
- `brandId`: UUID de uma marca;
- `minPriceCents` e `maxPriceCents`: limites inclusivos inteiros não negativos em centavos BRL.

 O produto corresponde à faixa quando pelo menos uma variante `ACTIVE` possui preço dentro dos limites. O mínimo não pode ser maior que o máximo. Os filtros são combináveis.

 Na interface, os limites são informados em reais (BRL) com até duas casas decimais e convertidos para centavos antes da consulta. A API recebe somente centavos inteiros.

 O sistema deverá permitir combinação de filtros.

 Exemplo conceitual:

```
categoria = "Luvas"
AND marca = "Marca A"
AND preço >= 100
AND preço <= 300
```

 Critérios adicionais somente poderão ser adicionados se já fizerem parte dos requisitos aprovados.

 Cada filtro deve possuir:

 - nome/identificador estável;
- tipo;
- regra de validação;
- comportamento para ausência;
- comportamento para valor inválido;
- cobertura de testes.

---

 ### 4.3 Ordenação

 Implementar somente critérios de ordenação aprovados.

 Critérios aprovados:

```
name_asc (padrão)
name_desc
price_asc
price_desc
```

 Os critérios de preço usam o menor preço entre variantes `ACTIVE` do produto. Empates são desempatados pelo ID crescente do produto. Campos e direções arbitrários são rejeitados.

 A ordenação deve ser:

 - determinística;
- validada;
- segura contra valores arbitrários;
- compatível com paginação;
- explicitamente testada.

 Quando dois registros possuírem o mesmo valor do campo principal de ordenação, deverá existir um critério secundário determinístico definido pelo contrato técnico, evitando resultados instáveis entre páginas.

---

 ### 4.4 Paginação

 Implementar paginação por número de página conforme o contrato aprovado.

 O contrato deverá especificar:

 - `page` começa em 1 e assume 1 quando omitido;
- `pageSize` assume 20 quando omitido e aceita no máximo 100;
- valores fora dos limites são rejeitados com HTTP 400;
- página válida depois do total retorna lista vazia com a página solicitada e metadados;
- resposta inclui `page`, `pageSize`, `totalItems` e `totalPages`; para resultado vazio, `totalPages` é 0.

 Exemplo conceitual de resposta:

```
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

 O formato acima é o contrato da TASK-008.

 A paginação deve ser consistente com a ordenação e com os filtros aplicados.

---

 ## 5\. Escopo técnico

 ### 5.1 Backend / Application

 Implementar:

 - caso de uso de consulta do catálogo;
- DTOs de entrada;
- DTOs de saída;
- validação dos parâmetros;
- composição dos filtros;
- composição da ordenação;
- paginação;
- tratamento de resultados vazios;
- tratamento de parâmetros inválidos;
- testes unitários;
- testes de integração/API aplicáveis.

 Responsabilidade da camada de aplicação:

```
HTTP/API
   ↓
Input DTO
   ↓
Validation
   ↓
Catalog Search Use Case
   ↓
Repository/Query Abstraction
   ↓
Domain/Persistence
```

 Não colocar regras de apresentação diretamente no domínio.

---

 ### 5.2 Persistência

 Implementar somente as consultas necessárias à busca e filtragem.

 A implementação deverá:

 - evitar carregamento desnecessário de todo o catálogo;
- utilizar paginação no nível apropriado;
- preservar a ordenação;
- aplicar filtros de forma consistente;
- evitar exposição de registros não publicáveis;
- respeitar os contratos de persistência existentes.

 Caso índices sejam necessários para atender aos requisitos de consulta, sua criação deverá ser justificada tecnicamente.

 Alterações de persistência que representem mudança arquitetural relevante deverão ser tratadas conforme o processo de ADR.

---

 ### 5.3 API

 Definir ou implementar o endpoint de consulta do catálogo conforme o padrão da aplicação.

 Exemplo conceitual:

```
GET /products
```

 Parâmetros possíveis:

```
q
 categoryId
brandId
minPriceCents
maxPriceCents
sort
page
pageSize
```

 Os nomes definitivos são `q`, `categoryId`, `brandId`, `minPriceCents`, `maxPriceCents`, `sort`, `page` e `pageSize`.

 A API deverá:

 - validar parâmetros;
- rejeitar combinações inválidas;
- impedir valores fora dos limites;
- não aceitar campos arbitrários para ordenação;
- retornar estrutura estável;
- documentar parâmetros e respostas;
- possuir testes de contrato/API aplicáveis.

---

 ## 6\. Contrato funcional esperado

 ### Entrada

 A consulta deve suportar, conforme contrato:

```
texto de busca
categoria
marca
preço mínimo
preço máximo
ordenação
paginação
```

 ### Saída

 Cada item deverá fornecer somente os dados necessários à experiência de catálogo.

 Exemplo conceitual:

```
{
  "items": [{
    "id": "product-id",
    "name": "Produto",
    "description": null,
    "brand": { "id": "brand-id", "name": "Marca" },
    "categories": [{ "id": "category-id", "name": "Categoria" }],
    "priceCents": 19990
  }],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

 `priceCents` representa o menor preço entre variantes ativas. A resposta não expõe SKU nem afirma disponibilidade de estoque físico.

---

 ## 7\. Regras de negócio sob responsabilidade da TASK

 A TASK-008 deverá respeitar:

 - somente produtos publicáveis aparecem no catálogo público;
- filtros devem ser aplicados de maneira combinável;
- preço mínimo não pode ser maior que preço máximo;
- parâmetros inválidos devem ser rejeitados de forma previsível;
- ordenação deve utilizar somente critérios permitidos;
- paginação deve possuir limites;
- resultados devem ser determinísticos;
- nenhum filtro pode ignorar as regras de visibilidade do catálogo.

 Regras relacionadas a estoque, reserva, checkout ou pagamento não fazem parte desta TASK.

---

 ## 8\. Casos de uso

 ### UC-002 — Navegar catálogo

 Fluxo principal:

```
Cliente acessa catálogo
    ↓
Sistema consulta produtos publicáveis
    ↓
Sistema aplica ordenação padrão
    ↓
Sistema aplica paginação
    ↓
Sistema retorna produtos + metadados
```

 ### UC-003 — Buscar/filtrar produtos

 Fluxo principal:

```
Cliente informa consulta/filtros
    ↓
Sistema valida parâmetros
    ↓
Sistema aplica visibilidade
    ↓
Sistema aplica busca
    ↓
Sistema aplica filtros
    ↓
Sistema aplica ordenação
    ↓
Sistema pagina resultado
    ↓
Sistema retorna resultados
```

---

 ## 9\. Casos de borda obrigatórios

 Testar pelo menos:

 - catálogo vazio;
- busca sem resultados;
- busca com espaços;
- busca com caracteres especiais;
- categoria inexistente;
- marca inexistente;
- preço mínimo válido;
- preço máximo válido;
- preço mínimo maior que preço máximo;
- preço negativo;
- página inexistente;
- `pageSize` abaixo do mínimo, se aplicável;
- `pageSize` acima do máximo;
- ordenação inválida;
- combinação de múltiplos filtros;
- filtros sem resultados;
- produtos não publicados;
- produtos publicados misturados com não publicados;
- empate no campo de ordenação;
- última página incompleta;
- página além do total de resultados.

---

 ## 10\. Matriz mínima de testes

 | Cenário | Esperado |
| --- | --- |
| Listagem sem filtros | Retorna produtos publicáveis |
| Busca válida | Retorna produtos compatíveis |
| Busca sem resultado | Retorna coleção vazia sem erro indevido |
| Categoria válida | Somente produtos da categoria |
| Marca válida | Somente produtos da marca |
| Faixa de preço válida | Somente produtos dentro da faixa |
| Múltiplos filtros | Todos os filtros são aplicados |
| `minPrice > maxPrice` | Entrada rejeitada |
| Ordenação válida | Ordem solicitada é respeitada |
| Ordenação inválida | Entrada rejeitada |
| Paginação válida | Retorna página correta |
| `pageSize` fora de 1–100 | HTTP 400 conforme contrato |
| Produto não publicado | Não aparece no catálogo público |
| Empate de ordenação | Ordem final permanece determinística |
| Catálogo vazio | Resposta válida com coleção vazia |

---

 ## 11\. Testes de API

 Devem ser cobertos, conforme infraestrutura disponível:

 - status HTTP esperado;
- schema da resposta;
- parâmetros válidos;
- parâmetros inválidos;
- filtros combinados;
- paginação;
- ordenação;
- autorização/visibilidade;
- ausência de exposição de dados administrativos;
- comportamento com catálogo vazio;
- comportamento sem resultados.

 Os testes devem validar o contrato público, e não detalhes internos de implementação.

---

 ## 12\. Acessibilidade

 Os controles de experiência do catálogo devem atender aos padrões de acessibilidade adotados pelo projeto.

 Validar, quando houver UI nesta TASK:

 - controles de filtro possuem nomes acessíveis;
- campos possuem labels;
- estados selecionados são perceptíveis;
- navegação por teclado funciona;
- foco é visível;
- mensagens de erro são associadas aos controles;
- resultados vazios possuem mensagem compreensível;
- paginação pode ser operada sem mouse;
- ordenação é operável por teclado;
- estrutura semântica permanece válida.

 Não implementar acessibilidade de funcionalidades que não pertençam ao escopo da TASK.

---

 ## 13\. Performance

 A implementação deverá evitar:

 - carregar todo o catálogo em memória para paginar;
- filtros executados somente após carregamento completo dos registros;
- N+1 queries;
- ordenação em memória quando a persistência puder executar a operação;
- consultas sem limites;
- parâmetros capazes de provocar consultas descontroladas.

 Não estabelecer metas quantitativas novas sem requisito aprovado.

 Se uma limitação de performance for identificada e exigir mudança arquitetural ou infraestrutura, registrar como bloqueio/decisão em vez de expandir automaticamente o escopo.

---

 ## 14\. Segurança

 Validar:

 - parâmetros de busca não permitem injeção;
- filtros são parametrizados;
- ordenação utiliza whitelist;
- paginação possui limites;
- campos internos não são expostos;
- produtos não publicados não vazam pela API;
- informações administrativas não aparecem na resposta pública.

 Não implementar mecanismos de segurança que pertençam a outras TASKs, salvo correções mínimas diretamente necessárias à execução segura desta TASK.

---

 ## 15\. Observabilidade

 Quando compatível com a infraestrutura já disponível:

 - erros de consulta devem ser observáveis;
- falhas inesperadas devem possuir logs adequados;
- logs não devem conter dados sensíveis desnecessários;
- métricas existentes podem ser utilizadas para acompanhar consultas.

 Não criar uma plataforma de observabilidade nova nesta TASK.

 A consolidação de observabilidade pertence às etapas posteriores.

---

 ## 16\. ALLOWED\_CHANGES

 São permitidas alterações em:

```
módulos catalog/search
módulos diretamente necessários à consulta do catálogo
testes unitários
testes de integração
testes de API
contratos API/UI
componentes de catálogo diretamente relacionados
consultas/repositórios necessários à busca
índices diretamente necessários à consulta, quando tecnicamente justificados
documentação técnica diretamente relacionada
TASKS.md
```

 Alterações incidentais são permitidas somente quando:

 1. forem diretamente causadas pela implementação da TASK;
2. forem necessárias para manter build/testes/contratos funcionando;
3. não introduzirem nova funcionalidade;
4. forem registradas no relatório de execução.

---

 ## 17\. FORBIDDEN\_CHANGES

 Não implementar nesta TASK:

```
recomendação por IA
recomendação personalizada
wishlist/favoritos
avaliações
checkout
carrinho
pagamentos
pedidos
reserva de estoque
promoções
cupons
logística
rastreamento
chat
sistema social
personalização por usuário
analytics comportamental de recomendação
novos papéis de autorização
alterações arquiteturais não aprovadas
mudanças de requisitos
```

 Também é proibido alterar o comportamento comercial de preço ou estoque apenas para facilitar a implementação da busca.

---

 ## 18\. Scope Guard

 Antes de cada alteração relevante, verificar:

```
A alteração é necessária para busca?
A alteração é necessária para filtro?
A alteração é necessária para ordenação?
A alteração é necessária para paginação?
A alteração é necessária para o contrato da API/UI?
A alteração é necessária para testes da TASK-008?
A alteração é necessária para acessibilidade dos controles desta TASK?
```

 Se a resposta for **não**, a alteração não deve ser incluída automaticamente.

 Se a alteração for necessária mas ultrapassar o escopo, registrar como:

```
SCOPE_EXCEPTION_CANDIDATE
```

 e aguardar decisão explícita.

---

 ## 19\. Rastreabilidade

 Cada implementação relevante deverá manter rastreabilidade:

```
RF-009 → Busca
RF-010 → Filtros
RF-011 → Ordenação
RF-012 → Paginação/experiência de catálogo
UC-002 → Navegação do catálogo
UC-003 → Busca/filtragem
```

 Os testes devem permitir identificar qual requisito ou regra está sendo validado.

 A documentação deve registrar eventuais decisões que alterem a interpretação dos requisitos.

---

 ## 20\. Estratégia de implementação

 ### Etapa 1 — Confirmar contratos

 - revisar `TASK-006`;
- identificar campos disponíveis;
- confirmar estados de publicação;
- confirmar contratos API;
- confirmar critérios de ordenação;
- confirmar filtros aprovados.

 ### Etapa 2 — Criar consulta de catálogo

 - criar caso de uso;
- definir entrada;
- definir saída;
- definir validações;
- integrar com repositório/consulta.

 ### Etapa 3 — Implementar filtros

 - categoria;
- marca;
- preço;
- composição de filtros;
- validação de parâmetros.

 ### Etapa 4 — Implementar busca textual

 - normalização;
- campos pesquisáveis;
- comportamento sem resultados;
- testes.

 ### Etapa 5 — Implementar ordenação

 - whitelist de critérios;
- ordenação secundária determinística;
- testes de estabilidade.

 ### Etapa 6 — Implementar paginação

 - limites;
- cálculo de metadados;
- integração com filtros/ordenação;
- casos de borda.

 ### Etapa 7 — Integrar API/UI

 - endpoint/contrato;
- controles de busca;
- filtros;
- ordenação;
- paginação;
- estados vazios/erro.

 ### Etapa 8 — Validar acessibilidade

 - teclado;
- foco;
- labels;
- mensagens;
- semântica.

 ### Etapa 9 — Validar qualidade

 Executar:

```
build
lint
unit tests
integration tests
API/contract tests
a11y tests aplicáveis
```

 ### Etapa 10 — Revisar Scope Guard

 Confirmar:

 - nenhuma TASK futura foi antecipada;
- nenhum item de `FORBIDDEN_CHANGES` foi implementado;
- alterações incidentais estão justificadas;
- rastreabilidade está atualizada.

 ### Etapa 11 — Produzir relatório

 Registrar:

 - alterações realizadas;
- arquivos/módulos afetados;
- testes executados;
- resultados;
- decisões;
- alterações incidentais;
- bloqueios;
- riscos residuais;
- rastreabilidade;
- estado final.

---

 ## 21\. Critérios de aceitação detalhados

 A TASK será considerada funcionalmente concluída quando:

 ### AC-01 — Busca

 Uma consulta válida retorna somente produtos compatíveis e publicáveis.

 ### AC-02 — Filtros

 Categoria, marca e faixa de preço, quando aplicáveis, podem ser combinados sem perda de consistência.

 ### AC-03 — Ordenação

 Os critérios de ordenação aprovados produzem resultados na ordem solicitada.

 ### AC-04 — Determinismo

 Consultas equivalentes produzem ordenação estável, inclusive em casos de empate.

 ### AC-05 — Paginação

 A paginação retorna resultados e metadados consistentes.

 ### AC-06 — Visibilidade

 Produtos que não podem ser publicados não aparecem no catálogo público.

 ### AC-07 — Validação

 Parâmetros inválidos são rejeitados conforme o contrato.

 ### AC-08 — API

 O contrato da API está documentado e coberto pelos testes aplicáveis.

 ### AC-09 — Acessibilidade

 Os controles de catálogo incluídos nesta TASK são utilizáveis conforme os requisitos de acessibilidade adotados pelo projeto.

 ### AC-10 — Qualidade

 Build, lint e testes aplicáveis passam.

 ### AC-11 — Escopo

 Nenhuma funcionalidade pertencente às TASKs posteriores foi incorporada.

---

 ## 22\. Definition of Done específica

 A `TASK-008` somente poderá ser marcada como `DONE` quando:

 - [x] busca implementada;
- [x] filtros implementados;
- [x] filtros combinados testados;
- [x] ordenação implementada;
- [x] ordenação determinística validada;
- [x] paginação implementada;
- [x] produtos não publicáveis não são expostos;
- [x] parâmetros inválidos tratados;
- [x] contrato API/UI atualizado;
- [x] testes unitários passam;
- [x] testes de integração passam;
- [x] testes de API/contrato passam;
- [x] testes semânticos de acessibilidade aplicáveis passam;
- [x] build passa;
- [x] lint passa (aviso já existente em `app/layout.tsx`);
- [x] documentação necessária atualizada;
- [x] rastreabilidade RF/UC atualizada;
- [x] Scope Guard validado;
- [x] `ALLOWED_CHANGES` respeitado;
- [x] `FORBIDDEN_CHANGES` não violado;
- [x] nenhuma alteração incidental;
- [x] nenhum Scope Creep identificado;
- [x] `TASKS.md` atualizado;
- [x] relatório de execução produzido;
- [x] estado final registrado como `DONE`.

---

 ## 23\. Condições de FAILED

 A TASK deverá ser marcada como `FAILED` quando:

 - requisito obrigatório não puder ser implementado;
- teste obrigatório permanecer falhando sem bloqueio formal aceito;
- contrato essencial estiver inconsistente;
- houver violação de `FORBIDDEN_CHANGES`;
- houver alteração arquitetural relevante sem aprovação;
- houver Scope Creep não autorizado;
- integridade do catálogo for comprometida;
- produtos não publicáveis forem expostos;
- build/lint/testes obrigatórios permanecerem quebrados ao final da execução.

 O relatório deverá identificar a causa, evidências e impacto.

---

 ## 24\. Condições de CANCELLED

 A TASK poderá ser `CANCELLED` somente mediante decisão explícita e registrada.

 O cancelamento deve registrar:

```
motivo
decisão responsável
impacto na rastreabilidade
impacto nas dependências
estado dos artefatos produzidos
```

 Não assumir automaticamente que `TASK-009` ou qualquer outra TASK pode prosseguir após cancelamento.

---

 ## 25\. Política de transição de estado

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

 Fluxos de exceção:

```
IN_PROGRESS → FAILED
IN_PROGRESS → CANCELLED

IN_REVIEW → IN_PROGRESS
```

 A mudança para `READY` exige:

```
TASK-006 = DONE
+
Definition of Ready satisfeita
+
Scope Guard validado
```

 A mudança para `DONE` exige:

```
DoD global satisfeita
+
DoD específica satisfeita
+
todos os Gates obrigatórios aprovados
+
relatório produzido
+
TASKS.md atualizado
```

---

 ## 26\. Relatório de execução

TASK: TASK-008
Status: DONE
Branch: `feature/TASK-008-catalog-search`
Commits: nenhum; alterações disponíveis na working tree para revisão.

### Implementado

- Busca parcial e sem diferença de caixa em nome, descrição, marca e categorias.
- Filtros combináveis por categoria, marca e faixa de preço inclusiva; busca e ordenação usam variantes ativas, sem expor SKU ou afirmar estoque físico.
- Ordenação aprovada, paginação estável com metadados e validação HTTP 400 para parâmetros inválidos.
- Rota pública `GET /api/products` e página responsiva `/catalog`, com campos rotulados, anúncios de estado, mensagens acessíveis e navegação por teclado nativa.
- Testes unitários, de API/contrato, integração PostgreSQL e verificação semântica dos controles.

### Quality Gates

| Gate | Resultado |
| --- | --- |
| Build | PASS — `npm.cmd run build` |
| Lint | PASS — aviso preexistente em `app/layout.tsx` |
| Unit | PASS — 34 testes aprovados |
| Integration | PASS — 5 testes PostgreSQL; busca, filtros, ordenação e paginação |
| API | PASS — contrato público e validações HTTP cobertos |
| Security | PASS — valores parametrizados, ordenação por allowlist e teste contra injeção |
| Accessibility | PASS — teste semântico de labels, anúncio de estado e links de paginação nativos |
| Acceptance | PASS — critérios AC-01–AC-11 cobertos |
| Regression | PASS — 15 arquivos e 39 testes aprovados |
| Typecheck / Format | PASS — `npm.cmd run typecheck` e `npm.cmd run format:check` |

### Casos de teste

- Busca por nome, descrição e categoria, sem diferença de caixa — PASS.
- Filtros combinados; faixa correspondente a qualquer variante ativa — PASS.
- Ordenação por nome/preço e desempate determinístico por ID — PASS.
- Limites de páginas, página além do total e conjunto vazio — PASS.
- Produto em rascunho e produto publicado sem variante ativa — não aparecem.
- Valores inválidos, ordenação desconhecida e tentativa de injeção — HTTP 400 ou resultado vazio, conforme contrato.
- Controles com labels, mensagem de erro associada e paginação operável por links — PASS.

### Rastreabilidade

- RF-009 → busca textual no domínio, rota e teste de integração.
- RF-010 → filtros de categoria/marca/preço no repositório e teste combinado.
- RF-011 → allowlist de ordenação e teste de ordenação/desempate.
- RF-012 → página `/catalog`, contrato de paginação e teste de páginas.
- UC-002 → listagem pública ordenada/paginada e navegação da página.
- UC-003 → busca/filtros e cenários de integração.

### Scope Guard

- `ALLOWED_CHANGES`: PASS.
- `FORBIDDEN_CHANGES`: PASS.
- Alterações incidentais: nenhuma.
- Scope creep: não identificado.
- Decisões comerciais: registradas conforme aprovação do responsável.
- Bloqueios: nenhum.
- Limitação residual: a validação de acessibilidade desta TASK cobre estrutura e operação semântica dos controles; validação transversal completa continua prevista na TASK-021.

### Arquivos e documentação

- Código: rota de produtos, página e componentes de catálogo, domínio/aplicação/persistência de busca e estilos.
- Testes: `catalog-search.test.ts`, `catalog-browser.test.tsx`, `catalog-search-flow.test.ts` e atualização do contrato no teste `catalog-flow.test.ts`.
- Documentação: `docs/catalog-api.md`, esta TASK e `TASKS.md`.
- `TASKS.md` atualizado: sim.

Conclusão: implementação e Gates da TASK-008 aprovados.
Próximo estado: DONE.
Próxima TASK elegível: nenhuma; TASK-009 continua BLOCKED e não foi iniciada.

---

 ## 27\. Regra de encerramento

 Ao concluir a `TASK-008`:

 1. atualizar `TASKS.md`;
2. registrar o relatório de execução;
3. preservar a rastreabilidade;
4. validar o estado final;
5. **não iniciar automaticamente a `TASK-009`**;
6. aguardar autorização explícita para qualquer próxima TASK.
