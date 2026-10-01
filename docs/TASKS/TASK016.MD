# TASK-016 — Checkpoint PHASE-03

 **Status inicial:** `BLOCKED`\
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

 - [ ] `TASK-011 = DONE`.
- [ ] `TASK-012 = DONE`.
- [ ] `TASK-013 = DONE`.
- [ ] `TASK-014 = DONE`.
- [ ] `TASK-015 = DONE`.
- [ ] Todos os relatórios individuais das TASKs estão disponíveis.
- [ ] Todos os Quality Gates individuais foram registrados.
- [ ] Build da aplicação está executável.
- [ ] Ambiente de teste/homologação está disponível.
- [ ] Gateway de pagamento em sandbox/mock está disponível conforme arquitetura aprovada.
- [ ] Dados de teste necessários estão disponíveis.
- [ ] Estratégia de execução E2E/integrada está definida.
- [ ] Critérios da PHASE-03 estão identificados.
- [ ] Nenhuma decisão de requisito necessária ao checkpoint está pendente.

 Se uma TASK anterior estiver em estado diferente de `DONE`, a `TASK-016` permanece `BLOCKED`.

---

 # 5\. Escopo do checkpoint

 A validação deve cobrir:

```
[ ] Carrinho
[ ] Cálculo de subtotal
[ ] Quantidade de itens
[ ] Disponibilidade
[ ] Cupons
[ ] Promoções
[ ] Checkout
[ ] Endereço
[ ] Frete
[ ] Criação do pedido
[ ] Persistência do pedido
[ ] Pagamento
[ ] Idempotência
[ ] Webhook
[ ] Estado do pagamento
[ ] Estado do pedido
[ ] Histórico
[ ] Rastreamento
[ ] Autorização
[ ] Integridade transacional
[ ] Observabilidade aplicável
[ ] Auditoria aplicável
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
[ ] TASK-011
[ ] TASK-012
[ ] TASK-013
[ ] TASK-014
[ ] TASK-015
```

 O checkpoint não deve validar somente o fluxo feliz.

---

 # 43\. Quality Gates da PHASE-03

 ## Gate 1 — Build

```
[ ] Build passa
[ ] Sem erros de compilação
[ ] Migrations aplicam corretamente
```

---

 ## Gate 2 — Lint

```
[ ] Lint passa
[ ] Nenhum warning crítico novo
```

---

 ## Gate 3 — Testes unitários

```
[ ] Carrinho
[ ] Pricing
[ ] Promoções
[ ] Checkout
[ ] Payment
[ ] Idempotência
[ ] Order
[ ] Tracking
```

---

 ## Gate 4 — Testes de integração

```
[ ] Carrinho → Checkout
[ ] Checkout → Order
[ ] Order → Payment
[ ] Payment → Webhook
[ ] Webhook → Order
[ ] Order → Histórico
[ ] Order → Tracking
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
[ ] Isolamento entre clientes
[ ] RBAC
[ ] Webhook seguro
[ ] Nenhum dado sensível exposto
[ ] Nenhum segredo em código/log
```

---

 ## Gate 7 — Idempotência

```
[ ] criação de pagamento
[ ] retry
[ ] webhook duplicado
[ ] webhook concorrente
```

 Todos devem passar.

---

 ## Gate 8 — Integridade comercial

```
[ ] preços
[ ] quantidades
[ ] descontos
[ ] frete
[ ] total
[ ] pagamento
[ ] pedido
```

 Devem permanecer consistentes.

---

 # 44\. Matriz de aceitação da PHASE-03

 | Área | Critério | Resultado |
| --- | --- | --- |
| Carrinho | itens e quantidades consistentes | PASS/FAIL |
| Pricing | subtotal correto | PASS/FAIL |
| Promoções | desconto correto | PASS/FAIL |
| Checkout | validações corretas | PASS/FAIL |
| Endereço | pertence ao cliente | PASS/FAIL |
| Frete | valor/opção corretos | PASS/FAIL |
| Order | criação consistente | PASS/FAIL |
| Payment | valor correto | PASS/FAIL |
| Payment | estado consistente | PASS/FAIL |
| Webhook | assinatura validada | PASS/FAIL |
| Webhook | idempotência | PASS/FAIL |
| Order | máquina de estados | PASS/FAIL |
| Histórico | isolamento por cliente | PASS/FAIL |
| Tracking | dados consistentes | PASS/FAIL |
| Segurança | autorização | PASS/FAIL |
| Build | aprovado | PASS/FAIL |
| Lint | aprovado | PASS/FAIL |
| Testes | aprovados | PASS/FAIL |
| Rastreabilidade | completa | PASS/FAIL |

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

[ ] TASK-011 DONE
[ ] TASK-012 DONE
[ ] TASK-013 DONE
[ ] TASK-014 DONE
[ ] TASK-015 DONE

## Fluxo comercial

[ ] carrinho
[ ] promoção
[ ] checkout
[ ] endereço
[ ] frete
[ ] pedido
[ ] pagamento
[ ] webhook
[ ] histórico
[ ] tracking

## Segurança

[ ] autenticação
[ ] autorização
[ ] isolamento de pedidos
[ ] webhook
[ ] dados sensíveis

## Integridade

[ ] preço
[ ] desconto
[ ] frete
[ ] total
[ ] pagamento
[ ] pedido
[ ] estados

## Robustez

[ ] retry
[ ] timeout
[ ] webhook duplicado
[ ] webhook fora de ordem
[ ] concorrência

## Qualidade

[ ] build
[ ] lint
[ ] unit
[ ] integration
[ ] API
[ ] E2E

## Governança

[ ] rastreabilidade
[ ] Scope Guard
[ ] alterações incidentais
[ ] TASKS.md
[ ] relatório
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

[ ] SIM
[ ] NÃO
```

 Se `NÃO`:

```
não alterar.
```

 Se `SIM`, verificar:

```
[ ] está dentro de ALLOWED_CHANGES
[ ] é diretamente necessária
[ ] possui teste
[ ] possui rastreabilidade
[ ] não altera requisito
[ ] não cria funcionalidade nova
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
STATUS: DONE | FAILED | BLOCKED

Objetivo:
<objetivo>

Período de execução:
<data/hora>

Dependências:
TASK-011 = DONE
TASK-012 = DONE
TASK-013 = DONE
TASK-014 = DONE
TASK-015 = DONE

Resumo executivo:
<resumo factual>

Fluxo E2E:
- carrinho: PASS/FAIL
- promoções: PASS/FAIL
- checkout: PASS/FAIL
- endereço: PASS/FAIL
- frete: PASS/FAIL
- pedido: PASS/FAIL
- pagamento: PASS/FAIL
- webhook: PASS/FAIL
- histórico: PASS/FAIL
- rastreamento: PASS/FAIL

Idempotência:
- pagamento: PASS/FAIL
- webhook: PASS/FAIL
- concorrência: PASS/FAIL

Segurança:
- autorização: PASS/FAIL
- isolamento de pedidos: PASS/FAIL
- webhook: PASS/FAIL
- dados sensíveis: PASS/FAIL

Integridade:
- preços: PASS/FAIL
- descontos: PASS/FAIL
- frete: PASS/FAIL
- total: PASS/FAIL
- payment/order: PASS/FAIL
- estados: PASS/FAIL

Quality Gates:
- build: PASS/FAIL
- lint: PASS/FAIL
- unit: PASS/FAIL
- integration: PASS/FAIL
- API: PASS/FAIL
- E2E: PASS/FAIL

Problemas encontrados:
- P0: <quantidade>
- P1: <quantidade>
- P2: <quantidade>

Correções realizadas:
- ...
- ...

Alterações incidentais:
- nenhuma
ou
- <lista + justificativas>

Pendências:
- nenhuma
ou
- <lista>

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
PASS/FAIL

Conclusão:
PHASE-03 APROVADA
ou
PHASE-03 NÃO APROVADA

Próximo estado:
TASK-016 = DONE | FAILED | BLOCKED

Próxima TASK:
TASK-017 — somente mediante autorização explícita.
```

---

 # 59\. Definition of Done específica

 A `TASK-016` somente pode ser marcada como `DONE` quando:

 - [ ] `TASK-011` está `DONE`.
- [ ] `TASK-012` está `DONE`.
- [ ] `TASK-013` está `DONE`.
- [ ] `TASK-014` está `DONE`.
- [ ] `TASK-015` está `DONE`.
- [ ] Fluxo comercial ponta a ponta foi executado.
- [ ] Carrinho foi validado.
- [ ] Promoções foram validadas.
- [ ] Checkout foi validado.
- [ ] Endereço foi validado.
- [ ] Frete foi validado.
- [ ] Pedido foi validado.
- [ ] Pagamento foi validado.
- [ ] Webhooks foram validados.
- [ ] Idempotência foi validada.
- [ ] Histórico foi validado.
- [ ] Rastreamento foi validado.
- [ ] Autorização foi validada.
- [ ] Isolamento entre clientes foi validado.
- [ ] Consistência financeira foi validada.
- [ ] Consistência entre Payment e Order foi validada.
- [ ] Máquina de estados foi validada.
- [ ] Testes de concorrência aplicáveis foram executados.
- [ ] Build passou.
- [ ] Lint passou.
- [ ] Testes aplicáveis passaram.
- [ ] Evidências foram registradas.
- [ ] Rastreabilidade está completa.
- [ ] Scope Guard foi validado.
- [ ] Correções incidentais foram justificadas.
- [ ] Nenhum `FORBIDDEN_CHANGE` ocorreu.
- [ ] `TASKS.md` foi atualizado.
- [ ] Relatório de checkpoint foi produzido.
- [ ] Nenhum bloqueador permanece aberto.

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