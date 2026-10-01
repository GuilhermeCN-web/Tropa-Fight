 # TASK-008 — Busca, filtros, ordenação e experiência de catálogo

 **Status:** BLOCKED\
 **Phase/Priority:** PHASE-02 / HIGH\
 **Dependências:** `DEPENDS_ON: TASK-006`\
 **Estado de entrada esperado:** `BLOCKED` até `TASK-006 = DONE`\
 **Estado de execução permitido:** `READY → IN_PROGRESS → IN_REVIEW → DONE | FAILED | CANCELLED`

 **Relacionados:** RF-009, RF-010, RF-011, RF-012, UC-002, UC-003

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

 Implementar busca textual sobre os campos de produto explicitamente aprovados.

 Campos candidatos, somente se confirmados pelos contratos de `TASK-006`:

 - nome do produto;
- identificação comercial;
- descrição;
- marca;
- categoria;
- demais campos textuais explicitamente aprovados.

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

 Filtros mínimos previstos:

 - categoria;
- marca;
- preço mínimo;
- preço máximo.

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

 Exemplos possíveis:

```
relevância
nome crescente
nome decrescente
menor preço
maior preço
mais recente
```

 A lista definitiva deve respeitar o contrato aprovado para a TASK.

 A ordenação deve ser:

 - determinística;
- validada;
- segura contra valores arbitrários;
- compatível com paginação;
- explicitamente testada.

 Quando dois registros possuírem o mesmo valor do campo principal de ordenação, deverá existir um critério secundário determinístico definido pelo contrato técnico, evitando resultados instáveis entre páginas.

---

 ### 4.4 Paginação

 Implementar paginação conforme o padrão definido pela aplicação.

 O contrato deverá especificar:

 - tamanho padrão da página;
- tamanho máximo permitido;
- número/offset/cursor utilizado;
- comportamento para página inexistente;
- metadados retornados;
- comportamento para resultado vazio.

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

 O formato acima é ilustrativo. O contrato definitivo deve seguir o padrão arquitetural adotado pelo projeto.

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
category
brand
minPrice
maxPrice
sort
page
pageSize
```

 Os nomes definitivos devem seguir os contratos aprovados.

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
  "id": "product-id",
  "name": "Produto",
  "brand": {
    "id": "brand-id",
    "name": "Marca"
  },
  "category": {
    "id": "category-id",
    "name": "Categoria"
  },
  "price": 199.90,
  "available": true
}
```

 O contrato definitivo deve respeitar o modelo entregue pela `TASK-006`.

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
| `pageSize` acima do limite | Entrada rejeitada ou normalizada conforme contrato |
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

 - [ ] busca implementada;
- [ ] filtros implementados;
- [ ] filtros combinados testados;
- [ ] ordenação implementada;
- [ ] ordenação determinística validada;
- [ ] paginação implementada;
- [ ] produtos não publicáveis não são expostos;
- [ ] parâmetros inválidos tratados;
- [ ] contrato API/UI atualizado;
- [ ] testes unitários passam;
- [ ] testes de integração passam;
- [ ] testes de API/contrato passam;
- [ ] testes de acessibilidade aplicáveis passam;
- [ ] build passa;
- [ ] lint passa;
- [ ] documentação necessária atualizada;
- [ ] rastreabilidade RF/UC atualizada;
- [ ] Scope Guard validado;
- [ ] `ALLOWED_CHANGES` respeitado;
- [ ] `FORBIDDEN_CHANGES` não violado;
- [ ] alterações incidentais justificadas;
- [ ] nenhum Scope Creep identificado;
- [ ] `TASKS.md` atualizado;
- [ ] relatório de execução produzido;
- [ ] estado final registrado como `DONE`.

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

 ## 26\. Relatório de execução — template

 Ao finalizar a TASK, produzir:

```
TASK: TASK-008
TÍTULO: Busca, filtros, ordenação e experiência de catálogo
ESTADO INICIAL: IN_PROGRESS
ESTADO FINAL: <DONE|FAILED|CANCELLED>

DEPENDÊNCIA:
- TASK-006: DONE

OBJETIVO:
<resumo da implementação>

IMPLEMENTADO:
- <item>
- <item>
- <item>

ARTEFATOS ALTERADOS:
- <arquivo/módulo>
- <arquivo/módulo>

CONTRATOS:
- <endpoint/contrato>
- <alteração>

TESTES EXECUTADOS:
- Build: <PASS/FAIL>
- Lint: <PASS/FAIL>
- Unit: <PASS/FAIL>
- Integration: <PASS/FAIL>
- API/Contract: <PASS/FAIL>
- Accessibility: <PASS/FAIL/NA>

CASOS DE TESTE:
- <caso> → <resultado>
- <caso> → <resultado>

RASTREABILIDADE:
- RF-009 → <evidência>
- RF-010 → <evidência>
- RF-011 → <evidência>
- RF-012 → <evidência>
- UC-002 → <evidência>
- UC-003 → <evidência>

SCOPE GUARD:
- ALLOWED_CHANGES: PASS
- FORBIDDEN_CHANGES: PASS
- Scope Creep: NÃO IDENTIFICADO

ALTERAÇÕES INCIDENTAIS:
- <nenhuma / descrição + justificativa>

DECISÕES:
- <decisão ou N/A>

BLOQUEIOS:
- <nenhum / descrição>

RISCOS RESIDUAIS:
- <nenhum / descrição>

DOCUMENTAÇÃO:
- <artefato atualizado>

TASKS.md:
- atualizado: <SIM/NÃO>

CONCLUSÃO:
<resultado factual da execução>

PRÓXIMO ESTADO:
<DONE|FAILED|CANCELLED>
```

---

 ## 27\. Regra de encerramento

 Ao concluir a `TASK-008`:

 1. atualizar `TASKS.md`;
2. registrar o relatório de execução;
3. preservar a rastreabilidade;
4. validar o estado final;
5. **não iniciar automaticamente a `TASK-009`**;
6. aguardar autorização explícita para qualquer próxima TASK.
