# Arquitetura detalhada

## Limites de módulos

`identity` administra cadastro de clientes, autenticação, recuperação de acesso, sessões, perfis e papéis administrativos. `checkout` mantém endereços de entrega pertencentes ao cliente e snapshots usados nos pedidos.

`catalog` controla produtos físicos, categorias, variantes, SKUs, imagens, descrições, preços de referência, filtros, pesquisa e publicação do catálogo.

`inventory` controla disponibilidade por variante/SKU, movimentações, ajustes administrativos e integração entre estoque e pedidos. Para a TASK-013, pedidos reservam estoque atomicamente por 30 dias corridos; pagamento confirmado converte a reserva em baixa definitiva na TASK-014 e pedido não pago expirado libera a reserva.

`commerce` contém carrinho, cálculo comercial, cupons, checkout e pedidos. Coordena a validação dos itens, os valores da compra e a criação do pedido, sem assumir diretamente responsabilidades de pagamento ou transporte.

`payments` adapta o provedor de pagamento escolhido, cria cobranças, processa confirmações, falhas, cancelamentos e reembolsos. Webhooks e consultas ao provedor devem atualizar o estado financeiro de forma idempotente.

`shipping` administra opções de entrega, cotação de frete, modalidade selecionada, expedição e rastreamento. Para a TASK-013 há cotação local `STANDARD` fixa de R$ 20,00 com prazo de 5 dias úteis, sem feriados modelados; transportadoras reais e rastreamento externo permanecem pendentes.

`reviews` implementa avaliações de produtos, regras de elegibilidade, denúncias e moderação. A exigência de compra verificada e as políticas de publicação deverão ser confirmadas no escopo funcional.

`administration` reúne os casos de uso administrativos para gestão de catálogo, estoque, pedidos, clientes, cupons e permissões. A autorização deve ser validada no servidor e respeitar os papéis definidos para cada operação.

`notifications` processa notificações de pedidos, pagamentos e entregas por meio dos canais aprovados. O envio deve ocorrer fora das transações comerciais críticas.

`operations` inclui auditoria, métricas, logs estruturados, monitoramento, tarefas de manutenção, backups e suporte à recuperação. Também contempla os procedimentos operacionais de retenção e exclusão de dados, conforme as políticas aprovadas.

A apresentação pode chamar apenas casos de uso da aplicação. A aplicação orquestra os fluxos e depende de portas de repositório, relógio, pagamento, logística, notificações e fila. O domínio não depende de framework, SDK ou provedor externo. A infraestrutura implementa as portas e concentra os detalhes técnicos.

## Fluxo crítico de pagamento

1. O checkout valida o cliente, os produtos e variantes, as quantidades, os preços, os cupons, o endereço e as opções de entrega. O servidor calcula os valores finais e cria o pedido conforme as regras comerciais aprovadas.

2. O módulo de estoque valida a disponibilidade e reserva atomicamente as unidades por 30 dias corridos. A confirmação financeira converte a reserva em baixa definitiva conforme a integração posterior; a expiração libera a reserva.

3. O adaptador de pagamentos cria a cobrança no provedor selecionado, associando-a ao pedido e registrando a referência externa. Os meios de pagamento, o gateway e os prazos de expiração permanecem pendentes.

4. A confirmação financeira é recebida por webhook autenticado ou consulta confiável ao provedor. O evento é identificado e processado de forma idempotente, evitando que notificações duplicadas confirmem ou processem o mesmo pagamento mais de uma vez.

5. Após a confirmação, o sistema atualiza o estado financeiro e conduz o pedido à próxima etapa válida. O estoque é baixado ou consolidado conforme a política definida. Falhas, expirações e cancelamentos devem seguir regras explícitas para liberar reservas, cancelar pedidos ou iniciar reembolsos quando aplicável.

6. Jobs e filas processam notificações, atualizações logísticas e outras tarefas demoradas sem prolongar a transação financeira. Falhas de integração devem permitir retentativas controladas, sem duplicar cobranças, pedidos ou movimentações de estoque.

## Proteções transversais

Operações administrativas, ajustes de estoque, transições críticas de pedidos e alterações financeiras devem ser auditáveis. A autorização combina papel administrativo e propriedade do recurso, garantindo que clientes acessem somente seus próprios dados e pedidos.

O servidor é a fonte autoritativa para preços, descontos, frete, disponibilidade e totais do checkout. Valores enviados pelo navegador não devem ser aceitos sem validação. Operações críticas precisam tratar concorrência, idempotência e transições inválidas.

Credenciais, tokens e dados de pagamento não devem ser expostos em logs. Dados pessoais devem ser minimizados nos registros estruturados, utilizando apenas identificadores necessários e justificados. O tratamento de dados deve seguir as políticas de privacidade e retenção aprovadas para o projeto.

Webhooks devem ter sua autenticidade validada, processamento idempotente e monitoramento de falhas. Integrações externas devem possuir tratamento de indisponibilidade, retentativas controladas e rastreabilidade.

O acesso administrativo deve seguir o princípio do menor privilégio. Imagens e arquivos operacionais devem ser armazenados com permissões adequadas, e dados internos não devem ser disponibilizados publicamente sem autorização.

Backups, monitoramento e procedimentos de recuperação devem ser definidos e testados. A aplicação deve possuir testes automatizados para regras de domínio, integrações e fluxos críticos, especialmente checkout, estoque, pagamento e transições de pedidos.

## Restrições arquiteturais

* A V1 parte de uma arquitetura de monólito modular em camadas.
* A persistência transacional principal será relacional; PostgreSQL local foi aprovado para identidade na TASK-003. Hospedagem e ambientes remotos permanecem pendentes.
* A apresentação não acessa diretamente banco de dados, gateways ou transportadoras.
* O domínio não depende de frameworks ou SDKs externos.
* Pagamentos e logística são acessados por portas e adaptadores.
* Operações demoradas e notificações devem ser desacopladas do fluxo transacional quando apropriado.
* Aplicativo nativo, microserviços e integrações adicionais não são considerados parte automática do escopo da V1.

## Baseline de infraestrutura

A etapa inicial (TASK-001/TASK-002) executou somente o front React/TypeScript em ambiente local. Por autorização explícita na TASK-003 e conforme ADR-019, a aplicação agora usa Next.js para executar código de servidor e autenticação, com PostgreSQL local para dados de identidade. Nenhum provedor externo ou publicação foi autorizado. Banco hospedado e produção seguem `PENDING_APPROVAL`.

## Decisões pendentes

* Hospedagem remota do backend e do banco relacional.
* Provedores e configuração de development compartilhado e staging, quando necessários.
* Metas de RPO, RTO, disponibilidade e thresholds de alertas.
* Gateway e meios de pagamento.
* Regras de cancelamento, devolução e reembolso, incluindo recomposição fora da expiração aprovada.
* Transportadoras reais e rastreamento externo.
* Regras de cancelamento, devolução e reembolso.
* Política de cupons, avaliações e moderação.
* Estratégia mobile e canais de notificação.
* Requisitos operacionais de backup, retenção e recuperação.
