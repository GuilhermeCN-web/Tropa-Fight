# Arquitetura detalhada

## Limites de módulos

`identity` administra cadastro de clientes, autenticação, recuperação de acesso, sessões, perfis e papéis administrativos. `checkout` mantém endereços de entrega pertencentes ao cliente e snapshots usados nos pedidos.

`catalog` controla produtos físicos, categorias, variantes, SKUs, imagens, descrições, preços de referência, filtros, pesquisa e publicação do catálogo.

`inventory` controla disponibilidade por variante/SKU, movimentações, ajustes administrativos e integração entre estoque e pedidos. Para a TASK-013, pedidos reservam estoque atomicamente por 30 dias corridos; pagamento confirmado converte a reserva em baixa definitiva na TASK-014 e pedido não pago expirado libera a reserva.

`commerce` contém carrinho, cálculo comercial, cupons, checkout e pedidos. Coordena a validação dos itens, os valores da compra e a criação do pedido, sem assumir diretamente responsabilidades de pagamento ou transporte.

`payments` adapta o provedor de pagamento, cria cobranças e processa confirmações, falhas, cancelamentos e expirações. Atualmente o único adaptador é o `LocalMockPaymentGateway` (ADR-008). Reembolso e estorno não estão aprovados. Webhooks e consultas ao provedor devem atualizar o estado financeiro de forma idempotente.

`shipping` administra opções de entrega, cotação de frete, modalidade selecionada, expedição e rastreamento. Para a TASK-013 há cotação local `STANDARD` fixa de R$ 20,00 com prazo de 5 dias úteis, sem feriados modelados; transportadoras reais e rastreamento externo permanecem pendentes.

`reviews` implementa avaliações de produtos com compra verificada. Para a TASK-017, somente clientes com pedido pago contendo o produto podem avaliar; novas avaliações e edições ficam pendentes de moderação, que será entregue na TASK-019. Denúncias permanecem fora do escopo aprovado.

`favorites` mantém a lista privada de produtos favoritos do cliente autenticado, com isolamento por propriedade.

`administration` reúne os casos de uso administrativos para gestão de catálogo, estoque, pedidos, clientes, cupons e permissões. A autorização deve ser validada no servidor e respeitar os papéis definidos para cada operação.

`notifications` processa notificações de pedidos, pagamentos e entregas por meio dos canais aprovados. O envio deve ocorrer fora das transações comerciais críticas.

`operations` inclui auditoria, métricas, logs estruturados, monitoramento, tarefas de manutenção, backups e suporte à recuperação. Também contempla os procedimentos operacionais de retenção e exclusão de dados, conforme as políticas aprovadas.

A apresentação pode chamar apenas casos de uso da aplicação. A aplicação orquestra os fluxos e depende de portas de repositório, relógio, pagamento, logística, notificações e fila. O domínio não depende de framework, SDK ou provedor externo. A infraestrutura implementa as portas e concentra os detalhes técnicos.

### Módulos efetivamente implementados (sincronização de 2026-11-05)

Os limites acima são conceituais. No código (`src/modules/`), eles se materializam assim:

| Limite conceitual | Módulos de código |
| --- | --- |
| `identity` | `identity`, `auth` (sessão e autorização da requisição), `checkout` (endereços) |
| `catalog` | `catalog` (produtos, marcas, categorias, variantes, busca) |
| `inventory` | `inventory` (saldo, movimentações e reservas, estas gravadas pelo checkout) |
| `commerce` | `cart`, `pricing`, `promotions`, `coupons`, `checkout`, `orders` |
| `payments` | `payments` |
| `shipping` | `shipping` (cotação local fixa) |
| `reviews` / `favorites` | `reviews`, `favorites` |
| `notifications` | `notifications` (porta e adaptador mock) |
| `operations` | `audit`, `privacy` (sanitização); métricas, health e jobs não existem |
| `administration` | Não existe como módulo; as rotas `/api/admin/*` ficam nos módulos de cada área |

Imagens de produto estão fora da V1 (decisão de 2026-11-11). A partir das TASK-018 e TASK-019, a consulta de clientes fica em `src/modules/customers` e a moderação e os usuários administrativos ficam em `reviews` e `identity`.

**Composição (ADR-020, 2026-11-11).** A camada de apresentação dos módulos pode instanciar adaptadores de infraestrutura para entregá-los aos casos de uso, sem conter regra de negócio nem SQL. O módulo `checkout` não possui camada `application`; isso é dívida técnica aceita para a V1. O teste `tests/architecture/layer-dependencies.test.ts` passará a cobrir `src/modules/**` na TASK-021.

## Fluxo crítico de pagamento

1. O checkout valida o cliente, os produtos e variantes, as quantidades, os preços, os cupons, o endereço e as opções de entrega. O servidor calcula os valores finais e cria o pedido conforme as regras comerciais aprovadas.

2. O módulo de estoque valida a disponibilidade e reserva atomicamente as unidades por 30 dias corridos. A confirmação financeira converte a reserva em baixa definitiva conforme a integração posterior; a expiração libera a reserva.

3. O adaptador de pagamentos cria a cobrança no provedor selecionado, associando-a ao pedido e registrando a referência externa. No estado atual, o adaptador é o mock local (PIX, débito e crédito simulados), e o prazo de pagamento é o vencimento de 30 dias do pedido. O gateway real permanece pendente.

4. A confirmação financeira é recebida por webhook autenticado ou consulta confiável ao provedor. O evento é identificado e processado de forma idempotente, evitando que notificações duplicadas confirmem ou processem o mesmo pagamento mais de uma vez.

5. Após a confirmação, o sistema atualiza o estado financeiro e conduz o pedido à próxima etapa válida. O estoque é baixado ou consolidado conforme a política definida. Falhas, expirações e cancelamentos devem seguir regras explícitas para liberar reservas, cancelar pedidos ou iniciar reembolsos quando aplicável.

6. Jobs e filas processam notificações, atualizações logísticas e outras tarefas demoradas sem prolongar a transação financeira. Falhas de integração devem permitir retentativas controladas, sem duplicar cobranças, pedidos ou movimentações de estoque. **Estado atual:** não há fila nem job (ADR-013 `PROPOSED`). A expiração de pedidos não pagos é aplicada dentro das transações de checkout, e a criação de pagamento recusa pedidos vencidos.

## Proteções transversais

Operações administrativas, ajustes de estoque, transições críticas de pedidos e alterações financeiras devem ser auditáveis. A autorização combina papel administrativo e propriedade do recurso, garantindo que clientes acessem somente seus próprios dados e pedidos.

O servidor é a fonte autoritativa para preços, descontos, frete, disponibilidade e totais do checkout. Valores enviados pelo navegador não devem ser aceitos sem validação. Operações críticas precisam tratar concorrência, idempotência e transições inválidas.

Credenciais, tokens e dados de pagamento não devem ser expostos em logs. Dados pessoais devem ser minimizados nos registros estruturados, utilizando apenas identificadores necessários e justificados. O tratamento de dados deve seguir as políticas de privacidade e retenção aprovadas para o projeto.

Webhooks devem ter sua autenticidade validada, processamento idempotente e monitoramento de falhas. Integrações externas devem possuir tratamento de indisponibilidade, retentativas controladas e rastreabilidade.

O acesso administrativo deve seguir o princípio do menor privilégio. Imagens e arquivos operacionais devem ser armazenados com permissões adequadas, e dados internos não devem ser disponibilizados publicamente sem autorização.

Backups, monitoramento e procedimentos de recuperação devem ser definidos e testados. A aplicação deve possuir testes automatizados para regras de domínio, integrações e fluxos críticos, especialmente checkout, estoque, pagamento e transições de pedidos.

## Restrições arquiteturais

* A V1 parte de uma arquitetura de monólito modular em camadas.
* A persistência transacional principal será relacional. PostgreSQL local foi aprovado para identidade na TASK-003 (aditivo ao ADR-003). Desde a TASK-006, é usado também por todos os módulos comerciais (migrations 003–012), formalizado no aditivo de 2026-11-11 ao ADR-003. Hospedagem e ambientes remotos permanecem pendentes.
* A apresentação não acessa diretamente banco de dados, gateways ou transportadoras.
* O domínio não depende de frameworks ou SDKs externos.
* Pagamentos e logística são acessados por portas e adaptadores.
* Operações demoradas e notificações devem ser desacopladas do fluxo transacional quando apropriado.
* Aplicativo nativo, microserviços e integrações adicionais não são considerados parte automática do escopo da V1.

## Baseline de infraestrutura

A etapa inicial (TASK-001/TASK-002) executou somente o front React/TypeScript em ambiente local. Por autorização explícita na TASK-003 e conforme ADR-019, a aplicação passou a usar Next.js para executar código de servidor e autenticação, com PostgreSQL local, hoje usado por todos os módulos (aditivo ao ADR-003). Como alternativa local opcional, o repositório inclui `Dockerfile` e `docker-compose.yml` (PostgreSQL 18, migrações e aplicação), aceitos como manutenção em 2026-11-11. Nenhum provedor externo ou publicação foi autorizado. Banco hospedado e produção seguem `PENDING_APPROVAL`.

## Decisões pendentes

* Hospedagem remota do backend e do banco relacional.
* Provedores e configuração de development compartilhado e staging, quando necessários.
* Thresholds de alertas e ferramenta de observabilidade. RPO ≤ 24 h, RTO ≤ 8 h e disponibilidade de 99% foram aprovados em 2026-10-23.
* Gateway de pagamento real e conciliação. Os meios simulados foram aprovados no ADR-008.
* Regras de cancelamento, devolução e reembolso, incluindo recomposição de estoque fora da expiração aprovada.
* Estados de pedido e entrega posteriores a `PAYMENT_CONFIRMED` / `NOT_SHIPPED`.
* Transportadoras reais e rastreamento externo.
* Política de denúncias de avaliações. A política de cupons foi aprovada em 2026-10-26.
* Estratégia mobile e canais de notificação.
* Automação da rotina de backup, retenção de dados e recuperação em ambiente hospedado.
* Armazenamento e regras de imagens de produto.
