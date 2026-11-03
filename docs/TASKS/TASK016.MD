# TASK-016 — Checkpoint PHASE-03

 **Status inicial:** `BLOCKED`\
 **Status atual:** `DONE` (2026-11-03)\
 **Phase/Priority:** `PHASE-03 / HIGH`\
 **Dependência:** `TASK-015`\
 **Dependências obrigatórias para execução:** `TASK-015 = DONE` e Definition of Ready satisfeita\
 **Política incidental:** `MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`

---

 ## 1\. Objetivo

 Executar o checkpoint formal da `PHASE-03`, validando o fluxo comercial ponta a ponta do Tropa Fight.

 A TASK deve comprovar que o fluxo:

```
Carrinho
   ↓
Promoção/Cupom
   ↓
Checkout
   ↓
Endereço
   ↓
Frete
   ↓
Pedido
   ↓
Pagamento
   ↓
Webhook
   ↓
Histórico
   ↓
Rastreamento
```

 funciona de forma consistente, segura, idempotente e rastreável.

 A TASK não implementa novas funcionalidades comerciais.

 Seu objetivo é:

 - validar as entregas das `TASK-011` a `TASK-015`;
- executar testes integrados;
- validar invariantes comerciais;
- validar pagamento e webhooks;
- validar autorização;
- validar consistência entre entidades;
- identificar regressões;
- corrigir somente problemas diretamente necessários para fechar a PHASE-03;
- registrar evidências;
- atualizar rastreabilidade;
- decidir tecnicamente se a PHASE-04 está elegível.

---

 # 2\. Contexto

 A PHASE-03 deve entregar:

```
TASK-011
Carrinho e cálculo comercial
        ↓
TASK-012
Cupons e promoções
        ↓
TASK-013
Checkout, endereço e frete
        ↓
TASK-014
Pagamentos e idempotência
        ↓
TASK-015
Pedidos, histórico e rastreamento
        ↓
TASK-016
CHECKPOINT PHASE-03
```

 A saída esperada é:

```
PHASE-03
    |
    +-- Carrinho
    +-- Promoções
    +-- Checkout
    +-- Endereço
    +-- Frete
    +-- Pedido
    +-- Pagamento
    +-- Webhook
    +-- Histórico
    +-- Rastreamento
    |
    v
CHECKPOINT APROVADO
    |
    v
PHASE-04 ELEGÍVEL
```

 A aprovação não significa iniciar a `TASK-017`.

---

 # 3\. Referências

 ### Requisitos relacionados

 - `RF-015`
- `RF-016`
- `RF-017`
- `RF-018`
- `RF-019`
- `RF-020`
- `RF-021`
- `RF-022`
- `RF-023`
- `RF-024`
- `RF-025`
- `RF-026`
- `RF-027`
- `RF-028`

 ### Regras relacionadas

 - `RN-008`
- `RN-009`
- `RN-010`
- `RN-011`
- `RN-012`
- `RN-013`
- `RN-014`

 ### Casos de uso

 - `UC-004`
- `UC-005`
- `UC-006`
- `UC-007`
- `UC-008`

 ### Dependência direta

```
TASK-015 = DONE
```

---

 # 4\. Definition of Ready

 A TASK só pode entrar em `IN_PROGRESS` quando:

 - [x] `TASK-011 = DONE`.
 - [x] `TASK-012 = DONE`.
 - [x] `TASK-013 = DONE`.
 - [x] `TASK-014 = DONE`.
 - [x] `TASK-015 = DONE`.
 - [x] Todos os relatórios individuais das TASKs estão disponíveis.
 - [x] Todos os Quality Gates individuais foram registrados.
 - [x] Build da aplicação está executável (gates individuais registrados).
 - [x] Ambiente local de teste disponível; PostgreSQL respondeu a `SELECT 1`.
 - [x] Gateway de pagamento local está disponível conforme arquitetura aprovada.
 - [x] Fixtures/dados de teste podem ser criados nos schemas isolados das integrações existentes.
 - [x] Estratégia integrada definida: fluxo por APIs/Route Handlers, PostgreSQL local e mock local; timeout via gateway substituto restrito aos testes.
 - [x] Critérios da PHASE-03 estão identificados.
 - [x] Decisões necessárias ao checkpoint estão aprovadas; estados e rastreamento seguem o contrato somente de leitura da TASK-015.

 **Prontidão (2026-11-03): PASS.** Estratégia aprovada pelo responsável: integração ponta a ponta pelas APIs/Route Handlers com PostgreSQL local e mock local; timeout simulado exclusivamente por gateway substituto nos testes. Não será criado fluxo visual de compra nesta TASK. O teste de rastreamento verificará somente dados persistidos, admitindo ausência de tracking. Branch `feature/TASK-016-phase03-checkpoint`; transições `BLOCKED → READY → IN_PROGRESS`.

 Se uma TASK anterior estiver em estado diferente de `DONE`, a `TASK-016` permanece `BLOCKED`.

---

 # 5\. Escopo do checkpoint

 A validação deve cobrir:

```
[x] Carrinho
[x] Cálculo de subtotal
[x] Quantidade de itens
[x] Disponibilidade
[x] Cupons
[x] Promoções
[x] Checkout
[x] Endereço
[x] Frete
[x] Criação do pedido
[x] Persistência do pedido
[x] Pagamento
[x] Idempotência
[x] Webhook
[x] Estado do pagamento
[x] Estado do pedido
[x] Histórico
[x] Rastreamento (dados persistidos; tracking ausente é válido)
[x] Autorização
[x] Integridade transacional
[x] Observabilidade aplicável (sem requisitos adicionais de observabilidade nesta fase)
[x] Auditoria aplicável
```

---

 # 6\. Não escopo

 A TASK não deve implementar:

 - avaliações;
- favoritos;
- painel administrativo da PHASE-04;
- moderação;
- gestão de usuários administrativos;
- novas notificações;
- novos canais de comunicação;
- funcionalidades sociais;
- recomendações;
- ERP;
- novas integrações comerciais;
- novas políticas de cancelamento;
- novas políticas de devolução;
- novas políticas de reembolso;
- alteração de arquitetura sem ADR;
- alteração de requisitos.

---

 # 7\. Princípio do checkpoint

 O checkpoint deve responder:

 > O fluxo comercial implementado na PHASE-03 funciona ponta a ponta segundo os requisitos aprovados, sem violar as invariantes de negócio, segurança, integridade e idempotência?

 A resposta deve ser sustentada por evidências.

 Não basta:

```
"parece funcionar"
```

 É necessário registrar:

```
cenário
→ entrada
→ execução
→ resultado esperado
→ resultado observado
→ evidência
→ PASS/FAIL
```

---

 # 8\. Fluxo comercial principal

 Executar o cenário principal:

```
1. Usuário autenticado
        ↓
2. Consulta catálogo
        ↓
3. Seleciona produto/variante
        ↓
4. Adiciona ao carrinho
        ↓
5. Define quantidade
        ↓
6. Aplica cupom/promoção válida
        ↓
7. Informa endereço
        ↓
8. Seleciona frete
        ↓
9. Confirma checkout
        ↓
10. Pedido é criado
        ↓
11. Pagamento é iniciado
        ↓
12. Gateway responde
        ↓
13. Webhook é recebido
        ↓
14. Pagamento muda de estado
        ↓
15. Pedido assume estado compatível
        ↓
16. Cliente consulta histórico
        ↓
17. Cliente consulta detalhes
        ↓
18. Cliente consulta rastreamento
```

 Resultado esperado:

```
Fluxo completo = consistente
```

---

 # 9\. Cenário de compra sem desconto

 Executar:

```
Produto
→ Carrinho
→ Checkout
→ Pagamento
→ Pedido
```

 Validar:

 - preço correto;
- quantidade correta;
- subtotal correto;
- frete correto;
- total correto;
- pedido criado uma única vez;
- pagamento associado ao pedido;
- histórico disponível.

---

 # 10\. Cenário com cupom

 Executar:

```
Produto
→ Carrinho
→ Cupom válido
→ Checkout
→ Pagamento
```

 Validar:

```
subtotal
- desconto
+ frete
= total
```

 O cálculo deve ser exatamente consistente com as regras da `TASK-012`.

 Não recalcular de forma independente no checkpoint.

---

 # 11\. Cupom inválido

 Executar:

```
Cupom inválido
        ↓
Checkout
```

 Resultado:

```
cupom não aplicado
```

 Validar que:

 - preço não é alterado indevidamente;
- pedido não recebe desconto indevido;
- mensagem/erro segue contrato existente.

---

 # 12\. Cupom expirado

 Executar:

```
Cupom expirado
        ↓
Aplicação
```

 Resultado esperado:

```
desconto rejeitado
```

 Não alterar a regra de vigência durante o checkpoint.

---

 # 13\. Quantidade inválida

 Testar:

```
0
-1
valor decimal inválido quando não suportado
quantidade acima do permitido
```

 Resultado:

```
requisição rejeitada
```

 Não criar pedido inválido.

---

 # 14\. Produto indisponível

 Testar:

```
Produto/variante indisponível
        ↓
Carrinho/Checkout
```

 Resultado esperado:

```
operação rejeitada conforme regra existente
```

 Não permitir que o checkpoint mascare inconsistência de estoque.

---

 # 15\. Endereço

 Validar:

```
cliente
   ↓
endereço válido
   ↓
checkout
   ↓
pedido
```

 Confirmar:

 - endereço pertence ao cliente;
- endereço usado no pedido é preservado;
- endereço de outro cliente não pode ser utilizado;
- checkout inválido não cria pedido parcial.

---

 # 16\. Frete

 Validar:

 - opção válida;
- valor correto;
- associação ao pedido;
- total atualizado;
- informação preservada no pedido.

 Cenário:

```
Subtotal
+
Desconto
+
Frete
=
Total final
```

 O resultado deve coincidir com o cálculo comercial aprovado.

---

 # 17\. Criação do pedido

 Validar a transação:

```
Checkout válido
        ↓
Order criado
```

 Confirmar:

 - itens corretos;
- quantidades corretas;
- preços corretos;
- descontos corretos;
- frete correto;
- total correto;
- cliente correto;
- endereço correto;
- estado inicial correto.

---

 # 18\. Checkout inválido

 Testar falhas em:

```
produto inválido
quantidade inválida
endereço inválido
frete inválido
cupom inválido
dados obrigatórios ausentes
```

 Resultado:

```
checkout rejeitado
+
nenhum pedido parcial
```

---

 # 19\. Pagamento aprovado

 Executar:

```
Order
  ↓
Payment
  ↓
Gateway
  ↓
APPROVED
```

 Validar:

 - Payment aprovado;
- Order assume estado compatível;
- valor do pagamento corresponde ao pedido;
- histórico do pedido permanece consistente;
- não há duplicação.

---

 # 20\. Pagamento recusado

 Executar:

```
Order
  ↓
Payment
  ↓
FAILED
```

 Validar:

 - pagamento marcado como falho;
- pedido não é tratado como pago;
- nenhuma confirmação indevida ocorre;
- histórico permanece consistente.

---

 # 21\. Timeout do gateway

 Simular:

```
Cliente
   ↓
Payment
   ↓
Gateway
   X
timeout
```

 Validar:

 - não existe falso `APPROVED`;
- pedido não é confirmado indevidamente;
- retry permanece seguro;
- idempotência continua válida.

---

 # 22\. Retry de pagamento

 Executar:

```
Request A
   ↓
Gateway
   ↓
timeout

Request B
   ↓
mesma operação/idempotency key
```

 Resultado esperado:

```
uma única operação de pagamento
```

 Validar persistência e efeitos comerciais.

---

 # 23\. Webhook válido

 Executar:

```
Gateway
   ↓
Webhook válido
   ↓
Signature OK
   ↓
Processamento
```

 Validar:

 - evento aceito;
- Payment atualizado;
- Order atualizado quando aplicável;
- histórico consistente.

---

 # 24\. Webhook duplicado

 Enviar:

```
event_001
event_001
event_001
```

 Resultado esperado:

```
efeito comercial = 1
```

 Validar:

 - nenhum pagamento duplicado;
- nenhuma transição duplicada;
- nenhum pedido duplicado;
- nenhum efeito secundário duplicado.

---

 # 25\. Webhook inválido

 Enviar webhook com:

```
assinatura inválida
```

 Resultado:

```
rejeitado
```

 Validar:

 - Payment não muda;
- Order não muda;
- evento não gera efeito comercial.

---

 # 26\. Webhook fora de ordem

 Simular eventos fora da sequência esperada.

 Exemplo:

```
APPROVED
   ↓
PROCESSING
```

 Resultado:

```
não ocorrer regressão inválida
```

 Validar máquina de estados implementada na `TASK-014`.

---

 # 27\. Idempotência comercial

 Executar novamente uma mesma operação de checkout/pagamento usando os mecanismos de idempotência definidos.

 Validar:

```
1 operação lógica
=
1 conjunto de efeitos comerciais
```

 Não aceitar:

```
1 operação lógica
=
2 Orders
```

 ou:

```
1 operação lógica
=
2 Payments
```

---

 # 28\. Histórico do cliente

 Após a compra:

```
Cliente
→ Meus pedidos
```

 Validar:

 - pedido aparece;
- total correto;
- status correto;
- data correta;
- paginação correta.

---

 # 29\. Isolamento entre clientes

 Criar:

```
Cliente A → Pedido A
Cliente B → Pedido B
```

 Testar:

```
Cliente A → Pedido B
```

 Resultado:

```
acesso negado
```

 Este é um Gate obrigatório.

---

 # 30\. Detalhes do pedido

 Validar:

```
Pedido
├── itens
├── quantidades
├── preços
├── desconto
├── frete
├── total
├── pagamento
├── status
└── rastreamento
```

 Os valores devem ser consistentes entre:

```
Order
Payment
Customer Area
```

---

 # 31\. Rastreamento

 Quando disponível:

```
Pedido
→ Tracking
→ Events
```

 Validar:

 - código;
- transportadora, quando disponível;
- status;
- eventos;
- ordenação;
- timestamps.

 Quando indisponível:

```
tracking = unavailable
```

 sem dados inventados.

---

 # 32\. Consistência financeira

 Para cada cenário financeiro:

```
subtotal
- descontos
+ frete
= total do pedido
```

 e:

```
total do pedido
=
valor esperado do pagamento
```

 Diferenças devem resultar em `FAIL`, salvo regra explícita aprovada para arredondamento ou outra particularidade.

---

 # 33\. Consistência de quantidade

 Validar:

```
quantidade no carrinho
=
quantidade no checkout
=
quantidade no OrderItem
```

 Não permitir divergência silenciosa.

---

 # 34\. Consistência de preço

 Validar:

```
preço consolidado no checkout
=
preço registrado no pedido
```

 Não utilizar preço atual do catálogo para reescrever pedido histórico.

---

 # 35\. Consistência de promoção

 Validar:

```
desconto calculado
=
desconto persistido no pedido
```

 Não reaplicar promoção durante consulta histórica.

---

 # 36\. Consistência de pagamento

 Validar:

```
Payment.orderId
=
Order.id
```

 e:

```
Payment.amount
=
Order.total
```

 conforme regra de valor aprovada.

---

 # 37\. Consistência de estados

 Validar a combinação:

```
Order.status
+
Payment.status
+
Shipment.status
```

 Não devem existir combinações incompatíveis.

 Exemplos a investigar:

```
Order = DELIVERED
Payment = FAILED
```

 ou:

```
Order = CANCELLED
Shipment = DELIVERED
```

 Se alguma combinação for permitida pelo domínio, deve estar documentada.

---

 # 38\. Testes de autorização

 Executar matriz:

 | Ator | Recurso | Resultado esperado |
| --- | --- | --- |
| visitante | pedido | negado |
| cliente A | pedido A | permitido |
| cliente A | pedido B | negado |
| cliente B | pedido A | negado |
| admin autorizado | pedido | permitido |
| admin sem permissão | pedido | negado |

---

 # 39\. Testes de máquina de estados

 Executar todas as transições previstas.

 Para cada:

```
Estado atual
+
Evento
→
Estado esperado
```

 Registrar:

```
PASS
```

 ou:

```
FAIL
```

 Também testar transições proibidas.

---

 # 40\. Testes de concorrência

 Validar cenários críticos:

```
duas confirmações simultâneas
duas requisições de pagamento
webhook simultâneo com consulta
webhooks duplicados concorrentes
```

 O resultado não deve produzir:

 - pedidos duplicados;
- pagamentos duplicados;
- transições duplicadas;
- saldo financeiro inconsistente.

---

 # 41\. Testes de recuperação

 Quando aplicável:

```
falha de gateway
falha de webhook
timeout
retry
processamento repetido
```

 Validar que o sistema retorna a um estado consistente.

---

 # 42\. Testes de regressão

 Executar a suíte completa aplicável.

 No mínimo:

```
[x] TASK-011
[x] TASK-012
[x] TASK-013
[x] TASK-014
[x] TASK-015
```

 O checkpoint não deve validar somente o fluxo feliz.

---

 # 43\. Quality Gates da PHASE-03

 ## Gate 1 — Build

```
[x] Build passa
[x] Sem erros de compilação
[x] Migrations aplicam corretamente (migrations 001–011 no schema temporário)
```

---

 ## Gate 2 — Lint

```
[x] Lint passa
[x] Nenhum warning crítico novo (permanece o aviso preexistente em `app/layout.tsx`)
```

---

 ## Gate 3 — Testes unitários

```
[x] Carrinho
[x] Pricing
[x] Promoções
[x] Checkout
[x] Payment
[x] Idempotência
[x] Order
[x] Tracking
```

---

 ## Gate 4 — Testes de integração

```
[x] Carrinho → Checkout
[x] Checkout → Order
[x] Order → Payment
[x] Payment → Webhook
[x] Webhook → Order
[x] Order → Histórico
[x] Order → Tracking
```

---

 ## Gate 5 — Testes E2E comerciais

 O cenário principal deve passar:

```
login
→ produto
→ carrinho
→ cupom
→ checkout
→ endereço
→ frete
→ pedido
→ pagamento
→ webhook
→ histórico
→ rastreamento
```

---

 ## Gate 6 — Segurança

```
[x] Isolamento entre clientes
[x] RBAC
[x] Webhook seguro
[x] Nenhum dado sensível exposto
[x] Nenhum segredo em código/log
```

---

 ## Gate 7 — Idempotência

```
[x] criação de pagamento
[x] retry
[x] webhook duplicado
[x] webhook concorrente
```

 Todos devem passar.

---

 ## Gate 8 — Integridade comercial

```
[x] preços
[x] quantidades
[x] descontos
[x] frete
[x] total
[x] pagamento
[x] pedido
```

 Devem permanecer consistentes.

---

 # 44\. Matriz de aceitação da PHASE-03

 | Área | Critério | Resultado |
| --- | --- | --- |
| Carrinho | itens e quantidades consistentes | PASS |
| Pricing | subtotal correto | PASS |
| Promoções | desconto correto | PASS |
| Checkout | validações corretas | PASS |
| Endereço | pertence ao cliente | PASS |
| Frete | valor/opção corretos | PASS |
| Order | criação consistente | PASS |
| Payment | valor correto | PASS |
| Payment | estado consistente | PASS |
| Webhook | assinatura validada | PASS |
| Webhook | idempotência | PASS |
| Order | máquina de estados | PASS |
| Histórico | isolamento por cliente | PASS |
| Tracking | dados consistentes | PASS |
| Segurança | autorização | PASS |
| Build | aprovado | PASS |
| Lint | aprovado (aviso preexistente) | PASS |
| Testes | aprovados | PASS |
| Rastreabilidade | completa | PASS |

---

 # 45\. Classificação de problemas encontrados

 Todo problema identificado deve ser classificado.

 ## P0 — Bloqueador

 Impede o fechamento da PHASE-03.

 Exemplos:

```
pagamento duplicado
pedido duplicado
cliente acessa pedido de terceiro
webhook não validado
valor financeiro incorreto
checkout cria pedido parcial
falha crítica de integridade
```

 Resultado:

```
TASK-016 = FAILED/BLOCKED
```

 conforme a causa.

---

 ## P1 — Crítico

 Afeta requisito obrigatório ou fluxo comercial essencial.

 Também deve ser corrigido antes do `DONE`, salvo bloqueio formalmente aceito conforme processo do projeto.

---

 ## P2 — Não bloqueador

 Problema que não impede o fechamento dos critérios obrigatórios.

 Deve ser:

 - registrado;
- rastreado;
- associado à TASK adequada;
- explicitamente classificado.

 Não criar automaticamente uma TASK nova.

---

 # 46\. Política de correções

 Durante o checkpoint são permitidas somente correções:

```
diretamente necessárias
+
estritamente relacionadas
+
dentro de ALLOWED_CHANGES
```

 Exemplo permitido:

```
Teste revela que webhook duplicado altera Order duas vezes.
→ corrigir idempotência do webhook.
```

 Exemplo proibido:

```
Durante o teste percebe-se que falta wishlist.
→ implementar wishlist.
```

 Outro exemplo proibido:

```
Durante o checkout percebe-se que o admin poderia ter um dashboard.
→ criar dashboard.
```

---

 # 47\. Correções incidentais

 Toda correção incidental deve ser registrada:

```
Problema:
<descrição>

Causa:
<causa>

Correção:
<correção>

Por que pertence à TASK-016:
<justificativa>

Escopo:
ALLOWED_CHANGE

Impacto:
<arquivos/módulos>

Testes:
<evidências>
```

---

 # 48\. Regra de não expansão

 Se a investigação revelar um problema fora da PHASE-03:

```
não implementar
```

 Registrar:

```
problema
+
impacto
+
localização
+
recomendação de rastreamento
```

 A decisão sobre uma futura alteração deve ser feita separadamente.

---

 # 49\. Rastreabilidade

 Atualizar a matriz:

```
RF-015 → Carrinho
RF-016 → Quantidade
RF-017 → Cálculo
RF-018 → Cupons
RF-019 → Promoções
RF-020 → Checkout/Endereço
RF-021 → Frete
RF-022 → Pedido
RF-023 → Fluxo transacional
RF-024 → Pagamento
RF-025 → Idempotência
RF-026 → Histórico
RF-027 → Detalhes
RF-028 → Rastreamento
```

 Regras:

```
RN-008 → Carrinho
RN-009 → Cálculo
RN-010 → Promoções
RN-011 → Checkout
RN-012 → Frete/Entrega
RN-013 → Pagamento
RN-014 → Pedido/Histórico
```

 Casos de uso:

```
UC-004 → Carrinho
UC-005 → Promoções
UC-006 → Checkout
UC-007 → Pedidos
UC-008 → Rastreamento
```

---

 # 50\. Evidências obrigatórias

 O checkpoint deve produzir evidências suficientes para auditoria técnica.

 Exemplos:

```
build output
lint output
test report
integration test report
E2E result
webhook test result
idempotency test result
authorization test result
database/migration result
coverage, quando aplicável
logs relevantes sem dados sensíveis
```

 Não incluir:

 - tokens;
- secrets;
- números de cartão;
- credenciais;
- dados pessoais desnecessários.

---

 # 51\. Checklist de execução

```
## Preparação

[x] TASK-011 DONE
[x] TASK-012 DONE
[x] TASK-013 DONE
[x] TASK-014 DONE
[x] TASK-015 DONE

## Fluxo comercial

[x] carrinho
[x] promoção
[x] checkout
[x] endereço
[x] frete
[x] pedido
[x] pagamento
[x] webhook
[x] histórico
[x] tracking

## Segurança

[x] autenticação
[x] autorização
[x] isolamento de pedidos
[x] webhook
[x] dados sensíveis

## Integridade

[x] preço
[x] desconto
[x] frete
[x] total
[x] pagamento
[x] pedido
[x] estados

## Robustez

[x] retry
[x] timeout
[x] webhook duplicado
[x] webhook fora de ordem
[x] concorrência

## Qualidade

[x] build
[x] lint
[x] unit
[x] integration
[x] API
[x] E2E (Route Handlers, conforme estratégia aprovada)

## Governança

[x] rastreabilidade
[x] Scope Guard
[x] alterações incidentais
[x] TASKS.md
[x] relatório
```

---

 # 52\. ALLOWED\_CHANGES

 Permitido:

```
testes
documentação
configuração de testes
configuração de ambiente de teste
correções diretamente necessárias no fluxo da PHASE-03
correções de integração
correções de idempotência
correções de autorização
correções de consistência
correções de contratos
correções de migrations diretamente necessárias
TASKS.md
```

 Correções em código existente devem ser diretamente relacionadas a um resultado do checkpoint.

---

 # 53\. FORBIDDEN\_CHANGES

 É proibido:

 - criar funcionalidades da PHASE-04;
- implementar avaliações;
- implementar favoritos;
- criar painel administrativo novo;
- criar gestão de usuários administrativos;
- criar notificações novas;
- alterar escopo comercial;
- alterar requisitos;
- trocar gateway;
- alterar política de pagamento sem decisão;
- inventar política de cancelamento;
- inventar política de devolução;
- inventar política de reembolso;
- alterar arquitetura sem ADR;
- refatorar código sem relação direta com um problema encontrado;
- realizar "melhorias" não necessárias;
- iniciar `TASK-017` automaticamente.

---

 # 54\. Scope Guard

 Para cada alteração corretiva:

```
A alteração corrige um problema encontrado na validação da PHASE-03?

[x] SIM
[x] NÃO
```

 Se `NÃO`:

```
não alterar.
```

 Se `SIM`, verificar:

```
[x] está dentro de ALLOWED_CHANGES
[x] é diretamente necessária
[x] possui teste
[x] possui rastreabilidade
[x] não altera requisito
[x] não cria funcionalidade nova
```

---

 # 55\. Critério para aprovação da PHASE-03

 A PHASE-03 pode ser considerada aprovada somente se:

```
todos os Gates obrigatórios = PASS
```

 e:

```
nenhum bloqueador aberto
```

 e:

```
nenhuma violação de segurança crítica
```

 e:

```
nenhuma inconsistência comercial crítica
```

 e:

```
rastreabilidade completa
```

 e:

```
TASKS.md atualizado
```

---

 # 56\. Critério de falha

 A `TASK-016` deve terminar como `FAILED` quando houver falha comprovada que impeça o fechamento da PHASE-03 e que dependa de correção.

 Exemplos:

```
pagamento duplicável
webhook inseguro
pedido duplicável
cliente acessa pedido de outro cliente
total financeiro incorreto
checkout cria pedido inconsistente
transições críticas inválidas
testes obrigatórios falhando
build falhando
lint obrigatório falhando
```

---

 # 57\. Critério de bloqueio

 Utilizar `BLOCKED` quando o checkpoint não puder ser concluído por dependência externa ou decisão pendente.

 Exemplos:

```
gateway sandbox indisponível
ambiente necessário indisponível
decisão de requisito pendente
credencial/configuração de teste não aprovada
dependência técnica externa indisponível
```

 O bloqueio deve conter:

```
causa
impacto
dependência
responsável, se aplicável
condição de desbloqueio
```

---

 # 58\. Relatório de checkpoint

 O relatório final deve possuir:

```
TASK: TASK-016
PHASE: PHASE-03
STATUS: DONE

Objetivo:
Validar o fluxo comercial de carrinho a histórico/rastreamento pelas APIs e Route Handlers aprovados.

Período de execução:
2026-11-03

Dependências:
TASK-011 = DONE
TASK-012 = DONE
TASK-013 = DONE
TASK-014 = DONE
TASK-015 = DONE

Resumo executivo:
PHASE-03 validada com PostgreSQL local, gateway mock local e integração ponta a ponta por Route Handlers, incluindo login e consulta de catálogo. As migrations 001–011 aplicaram em schema temporário; os dados do cenário foram isolados e removidos ao final.

Fluxo E2E:
- carrinho: PASS
- promoções/cupons: PASS
- checkout: PASS
- endereço: PASS
- frete: PASS
- pedido: PASS
- pagamento: PASS
- webhook: PASS (assinatura inválida rejeitada; processamento e replay válidos)
- histórico: PASS
- rastreamento: PASS (Shipment persistido; tracking nulo conforme contrato)

Idempotência:
- pagamento: PASS (replay retorna o mesmo pagamento; timeout simulado sem persistência parcial)
- webhook: PASS (replay não duplica efeitos)
- concorrência: PASS (criação concorrente e webhooks duplicados concorrentes cobertos pela suíte de integração)

Segurança:
- autorização: PASS (RBAC administrativo e autenticação cobertos pela suíte)
- isolamento de pedidos: PASS (cliente externo recebe 404)
- webhook: PASS (HMAC inválido retorna 401 e não muda Payment/Order)
- dados sensíveis: PASS (CPF/telefone não aparecem no detalhe; dados do provedor não são expostos)

Integridade:
- preços/quantidades: PASS
- descontos: PASS (10% aplicado uma vez)
- frete: PASS (STANDARD, R$ 20,00)
- total: PASS (R$ 65,00 no cenário integrado)
- payment/order: PASS (APPROVED → PAYMENT_CONFIRMED; baixa única coberta na integração)
- estados: PASS (estados válidos e evento duplicado/fora de ordem cobertos)

Quality Gates:
- build: PASS
- lint: PASS (somente aviso preexistente em `app/layout.tsx`)
- unit: PASS
- integration: PASS
- API: PASS
- E2E: PASS (Route Handlers, estratégia escolhida pelo responsável)

Problemas encontrados:
- P0: 0
- P1: 0
- P2: 2, resolvidos/mitigados: o comando de testes não carregava `.env.local`; uma execução inicial usou o banco principal e deixou um movimento de estoque imutável.

Correções realizadas:
- `npm test` agora carrega `.env.local`, permitindo executar testes de integração com a configuração local documentada.
- O cenário checkpoint usa schema PostgreSQL temporário e o descarta ao terminar. O artefato da execução inicial foi neutralizado: produto de teste arquivado e contas de teste inativadas; o movimento imutável e seu saldo consistente foram preservados.

Alterações incidentais:
- `package.json`: ajuste mínimo da configuração do comando `test`, diretamente necessário para executar os gates com PostgreSQL local; coberto pela suíte completa.
- Artefato local de teste: produto arquivado e contas sintéticas inativadas; histórico imutável preservado.

Pendências:
- Nenhuma bloqueante. A integração com gateway financeiro real e o rastreamento externo seguem fora do escopo e não são necessários para este checkpoint.

Rastreabilidade:
- RF-015: ...
- RF-016: ...
- RF-017: ...
- RF-018: ...
- RF-019: ...
- RF-020: ...
- RF-021: ...
- RF-022: ...
- RF-023: ...
- RF-024: ...
- RF-025: ...
- RF-026: ...
- RF-027: ...
- RF-028: ...

Scope Guard:
PASS

Conclusão:
PHASE-03 APROVADA

Próximo estado:
TASK-016 = DONE

Próxima TASK:
TASK-017 — elegível, somente mediante autorização explícita.
```

---

 # 59\. Definition of Done específica

 A `TASK-016` somente pode ser marcada como `DONE` quando:

 - [x] `TASK-011` está `DONE`.
- [x] `TASK-012` está `DONE`.
- [x] `TASK-013` está `DONE`.
- [x] `TASK-014` está `DONE`.
- [x] `TASK-015` está `DONE`.
- [x] Fluxo comercial ponta a ponta foi executado.
- [x] Carrinho foi validado.
- [x] Promoções foram validadas.
- [x] Checkout foi validado.
- [x] Endereço foi validado.
- [x] Frete foi validado.
- [x] Pedido foi validado.
- [x] Pagamento foi validado.
- [x] Webhooks foram validados.
- [x] Idempotência foi validada.
- [x] Histórico foi validado.
- [x] Rastreamento foi validado.
- [x] Autorização foi validada.
- [x] Isolamento entre clientes foi validado.
- [x] Consistência financeira foi validada.
- [x] Consistência entre Payment e Order foi validada.
- [x] Máquina de estados foi validada.
- [x] Testes de concorrência aplicáveis foram executados.
- [x] Build passou.
- [x] Lint passou.
- [x] Testes aplicáveis passaram.
- [x] Evidências foram registradas.
- [x] Rastreabilidade está completa.
- [x] Scope Guard foi validado.
- [x] Correções incidentais foram justificadas.
- [x] Nenhum `FORBIDDEN_CHANGE` ocorreu.
- [x] `TASKS.md` foi atualizado.
- [x] Relatório de checkpoint foi produzido.
- [x] Nenhum bloqueador permanece aberto.

---

 # 60\. Resultado esperado

 Quando todos os critérios forem atendidos:

```
TASK-016
    |
    v
DONE
    |
    v
PHASE-03 VALIDADA
    |
    v
PHASE-04 ELEGÍVEL
```

 A palavra **elegível** é importante: isso não significa iniciar automaticamente a `TASK-017`.

---

 # 61\. Regra de encerramento

 Ao concluir a `TASK-016`:

```
1. Atualizar TASKS.md
2. Registrar resultado do checkpoint
3. Registrar evidências
4. Atualizar rastreabilidade
5. Registrar pendências aceitas, se houver
6. Atualizar estado da TASK-016
7. Parar a execução
```

 É proibido:

```
TASK-016 DONE
    ↓
iniciar automaticamente TASK-017
```

## TASK Execution Report

TASK: TASK-016
Status: DONE

Branch: `feature/TASK-016-phase03-checkpoint`
Commits: nenhum

### Primary Changes

- Cenário integrado de carrinho, cupom, checkout, pedido, pagamento, webhook, histórico e rastreamento em `tests/integration/checkout-api-flow.test.ts`.
- Teste de falha/timeout antes da resposta do gateway e retry idempotente em `tests/unit/payment-service.test.ts`.
- Comando `npm test` carrega `.env.local` para que os testes integrados usem o banco local configurado.
- Prontidão, evidências, matriz de aceitação e resultado do checkpoint registrados nesta TASK e em `TASKS.md`.

### Incidental Changes

- Um produto sintético da primeira tentativa foi arquivado e as contas de teste correspondentes foram inativadas. O movimento de estoque é imutável e foi preservado; saldo e histórico permanecem consistentes.

### Tests Executed

- `node --env-file-if-exists=.env.local node_modules/vitest/vitest.mjs run`: 35 arquivos e 109 testes passaram.
- `npm run quality`: passou (formatação, lint, typecheck, testes e build).
- Validação de PostgreSQL local e migrations 001–011 executadas em schema isolado pelo teste de checkpoint.

### Quality Gates

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

Allowed Changes: PASS
Incidental Changes: PASS
Forbidden Changes: PASS
Scope Creep: NONE

### Definition of Done

PASS

### Next Eligible TASK

TASK-017 — somente após autorização explícita; não iniciada.
