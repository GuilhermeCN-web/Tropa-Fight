# Tropa Fight

**Descrição:** plataforma de e-commerce voltada ao público brasileiro para produtos físicos de artes marciais, esportes de combate e treinamento, com área do cliente e área administrativa.
**Versão planejada:** 1.0
**Status:** PLANEJAMENTO APROVADO — EM IMPLEMENTAÇÃO. A aprovação é considerada implícita no início da TASK-001 (2026-10-21), conforme decisão de 2026-11-11. O estado de cada TASK fica em [`TASKS.md`](TASKS.md).

> **Fonte de verdade.** Este README define **o que construir e por quê**: escopo, requisitos, regras, domínio, arquitetura e APIs. O estado de execução, os commits e os resultados de testes ficam no `TASKS.md`. As decisões arquiteturais estão em [`docs/adr/ADRs.md`](docs/adr/ADRs.md). O histórico das divergências reconciliadas está em [`docs/planning/divergencias-documentacao.md`](docs/planning/divergencias-documentacao.md).

> **Identificadores oficiais.** Por decisão de 2026-11-11 (DIV-001 e DIV-002), os IDs RF, RN, UC e RNF deste README são os oficiais. Algumas TASKs concluídas citam IDs com outro significado. Para elas, use a tabela "Mapeamento de referências legadas" do `TASKS.md`. Os IDs PD seguem o esquema do `development-plan.md` (DIV-003).

---

## 1. Identificação

**Problema.** Falta uma plataforma centralizada, responsiva e segura para vender produtos físicos de artes marciais, esportes de combate e treinamento. Isso dificulta a descoberta de produtos, a experiência de compra e a gestão operacional do negócio.

**Objetivo.** Permitir que clientes descubram, avaliem e comprem produtos de combate e treinamento, e que administradores gerenciem catálogo, estoque, pedidos, clientes e operações comerciais. O sistema prioriza a integridade de estoque, pedidos e pagamentos.

**Natureza.** Projeto acadêmico (Fatec). Pagamentos, frete e e-mail são **simulados localmente**: nenhuma transação financeira real, transportadora ou provedor de e-mail está aprovado ([ADR-008](docs/adr/ADRs.md), [ADR-010](docs/adr/ADRs.md), [ADR-019](docs/adr/ADRs.md)).

**Princípios.** Planejar antes de implementar, não inventar regras de negócio, manter a arquitetura em camadas, rastrear requisitos até testes e TASKs, e não ampliar o escopo sem autorização.

## 2. Escopo da V1

Funcionalidades contempladas, com o estado da especificação:

| Área | Contemplado | Especificação |
| --- | --- | --- |
| Conta do cliente | Cadastro, login, logout, sessão, recuperação de senha, consulta do próprio perfil, endereços de entrega | Aprovada |
| Catálogo | Produtos, marcas, categorias (N:N), publicação, variantes com SKU, preço em BRL | Aprovada |
| Descoberta | Busca textual, filtros por categoria, marca e faixa de preço, ordenação e paginação | Aprovada |
| Estoque | Saldo por variante, entradas, saídas, ajustes, histórico imutável, reserva no pedido | Aprovada |
| Carrinho | Carrinho persistente do cliente autenticado, cálculo em centavos | Aprovada |
| Promoções e cupons | Desconto percentual ou fixo, subtotal mínimo, limites de uso, um desconto por carrinho | Aprovada |
| Checkout | Cotação no servidor, endereço, frete local fixo, criação de pedido idempotente | Aprovada |
| Pagamentos | Mock local de PIX, débito e crédito, webhook assinado e idempotente | Aprovada (somente simulação) |
| Pedidos | Histórico, detalhe, estado e dados de entrega persistidos; consulta administrativa somente leitura | Aprovada |
| Avaliações e favoritos | Avaliação por compra verificada, com moderação; lista privada de favoritos | Aprovada; moderação na TASK-019 |
| Administração | Catálogo, estoque, pedidos (leitura com filtros), consulta de clientes, cupons e promoções, moderação de avaliações, usuários administrativos | Aprovada (2026-11-11); TASK-018/019 |
| Interface do cliente | Página de produto com seleção de variante, carrinho, checkout (endereço, cotação, pedido, pagamento simulado), histórico e detalhe de pedidos | Aprovada (2026-11-11); TASK-023 |
| Governança | Auditoria imutável, logs sem dados sensíveis, notificações mock de conta e de pedido, health check | Aprovada; consolidação na TASK-020 |
| Qualidade e operação | Testes automatizados, acessibilidade, responsividade, backup e restauração | Metas aprovadas; validação nas TASK-021 e TASK-022 |

A interface administrativa não está no escopo da V1: a administração é feita por API.

## 3. Fora de escopo

**Excluído do produto** (desde o planejamento original):

- marketplace ou vendedores terceiros;
- assinaturas, aluguel, afiliados e clube de fidelidade;
- chat ou rede social interna;
- recomendação por IA ou machine learning;
- BI avançado e data warehouse;
- integrações extensas com ERP;
- operação internacional e múltiplas moedas;
- aplicativo nativo e PWA: a estratégia é web responsiva (ADR-016).

**Excluído por decisão aprovada:**

| Item | Decisão |
| --- | --- |
| Carrinho anônimo, mesclagem e expiração de carrinho | ADR-006 (2026-10-24) |
| Reserva de estoque no carrinho | ADR-006 |
| Retirada física e frete grátis | ADR-010, adendo TASK-013 (2026-11-02) |
| Entrega fora do Brasil | Adendo TASK-013 |
| Pagamento parcial, gateway real, dados de cartão (PAN/CVV), estorno | ADR-008, decisões TASK-014 |
| Segmentação de desconto por produto, categoria, marca ou cliente; acúmulo de descontos | Rodada 9 (2026-10-26) |
| Denúncia de avaliações; avaliação geral do site | Rodada 10 (2026-11-04) |
| Envio real de e-mail e confirmação de e-mail no cadastro | ADR-012 (TASK-003) |
| Transições de pedido além de `PAYMENT_CONFIRMED` e `EXPIRED` (separação, envio, entrega) | Decisões TASK-015; fora da V1 por decisão de 2026-11-11 |

**Fora da V1 por decisão de 2026-11-11** (DIV-007). Ficam registrados como limitações conhecidas da V1 acadêmica:

- importação CSV de catálogo;
- painel de vendas e relatórios operacionais (RF-029);
- alerta de estoque mínimo;
- cancelamento, devolução, troca e reembolso (RN-020);
- logística e rastreamento reais;
- gateway de pagamento real;
- integrações externas reais (RF-030);
- confirmação de e-mail;
- edição de perfil do cliente;
- exclusão de conta e anonimização (LGPD);
- imagens de produto;
- interface administrativa;
- rate limiting e proteção contra tentativas abusivas (risco aceito, registrado na TASK-022).

## 4. Stakeholders e atores

| Ator | Situação | Responsabilidades e permissões |
| --- | --- | --- |
| Visitante | Implementado | Consulta o catálogo público (produtos elegíveis e avaliações publicadas) |
| Cliente (`CUSTOMER`) | Implementado | Gerencia a própria conta, endereços, carrinho, pedidos, pagamentos, avaliações e favoritos. Só acessa os próprios dados |
| Administrador Geral (`GENERAL_ADMIN`) | Implementado | Toda a administração: identidade, catálogo, estoque, promoções, auditoria, pedidos e, a partir das TASK-018/019, clientes, moderação de avaliações e usuários administrativos |
| Gestor de Catálogo (`CATALOG_MANAGER`) | Implementado | Produtos, categorias, marcas, publicação e estoque (`inventory.manage`). Sem permissões de identidade |
| Gestor de estoque, Atendimento, Financeiro | **Não existem na V1** | Decisão de 2026-11-11 (DIV-010): somente os três papéis acima; um papel por usuário (RN-023) |
| Provedor de pagamento | Simulado (`LOCAL_MOCK`) | Emite eventos assinados por HMAC para o webhook |
| Serviço de e-mail/notificações | Porta substituível com adaptador mock | Nenhum envio real |
| Supabase Storage | Aprovado só para backup | Bucket privado `tropa-fight-backups` (TASK-005) |
| Transportadora, armazenamento de imagens, monitoramento | Não escolhidos | Pendentes |

## 5. Requisitos funcionais

### 5.1 Catálogo oficial de requisitos funcionais

RF-001 a RF-030 vêm do catálogo original. RF-031 a RF-038 foram incorporados em 2026-11-11 a partir das especificações das TASK-018 e TASK-019, como **refinamentos** de requisitos administrativos já existentes. As prioridades `WON'T` refletem os cortes de escopo de 2026-11-11.

Os critérios de aceitação verificáveis estão na TASK indicada (`TASKS.md` e `docs/TASKS/TASKnnn.MD`). Nas TASKs abertas, o escopo revisado no `TASKS.md` prevalece sobre a especificação detalhada.

| RF | Título | Prioridade | Situação | TASK |
| --- | --- | --- | --- | --- |
| RF-001 | Cadastro e acesso | MUST | Implementado | 003 |
| RF-002 | Gerenciamento de conta (dados permitidos e endereços) | MUST | Endereços implementados; edição de perfil `WON'T` na V1 | 013 |
| RF-003 | Catálogo de produtos | MUST | Implementado | 006, 008 |
| RF-004 | Categorias e marcas | MUST | Implementado | 006 |
| RF-005 | Pesquisa e filtros | MUST | Implementado | 008 |
| RF-006 | Detalhes do produto (descrição, preço e variantes; imagens `WON'T`) | MUST | API implementada; página na TASK-023 | 006, 007, 023 |
| RF-007 | Seleção de variante | MUST | API implementada; seleção na UI na TASK-023 | 007, 023 |
| RF-008 | Carrinho | MUST | API implementada; tela na TASK-023 | 011, 023 |
| RF-009 | Cupons e promoções | SHOULD | Implementado | 012 |
| RF-010 | Checkout | MUST | API implementada; tela na TASK-023 | 013, 023 |
| RF-011 | Pagamento | MUST | Mock implementado; tela na TASK-023 | 014, 023 |
| RF-012 | Pedido | MUST | Implementado | 013, 015 |
| RF-013 | Acompanhamento do pedido | MUST | API implementada; tela na TASK-023 | 015, 023 |
| RF-014 | Histórico de compras | MUST | API implementada; tela na TASK-023 | 015, 023 |
| RF-015 | Estoque | MUST | Implementado | 009, 013 |
| RF-016 | Movimentação de estoque | MUST | Implementado | 009 |
| RF-017 | Avaliações | SHOULD | Implementado; moderação na TASK-019 | 017, 019 |
| RF-018 | Favoritos | SHOULD | Implementado | 017 |
| RF-019 | Notificações (somente adaptador mock na V1) | SHOULD | Eventos de conta implementados; eventos de pedido na TASK-020 | 004, 020 |
| RF-020 | Administração de produtos | MUST | Implementado | 006, 007 |
| RF-021 | Administração de categorias e marcas | MUST | Implementado | 006 |
| RF-022 | Administração de estoque | MUST | Implementado | 009 |
| RF-023 | Administração de pedidos | MUST | Consulta implementada; filtros na TASK-018 | 015, 018 |
| RF-024 | Administração de clientes | MUST | TASK-018 | 018 |
| RF-025 | Administração de avaliações | SHOULD | TASK-019 | 019 |
| RF-026 | Administração de cupons e promoções | SHOULD | Implementado | 012, 019 |
| RF-027 | Usuários administrativos | MUST | TASK-019 | 019 |
| RF-028 | Auditoria | MUST | Implementado; consolidação na TASK-020 | 004, 020 |
| RF-029 | Relatórios operacionais | WON'T (V1) | Fora da V1 | — |
| RF-030 | Integrações externas reais | WON'T (V1) | Somente adaptadores locais simulados | — |
| RF-031 | Administração de catálogo consolidada (refina RF-020/021) | MUST | APIs existentes; validação na TASK-018 | 018 |
| RF-032 | Administração de estoque consolidada (refina RF-022) | MUST | APIs existentes; validação na TASK-018 | 018 |
| RF-033 | Consulta administrativa de pedidos com filtros por status e período (refina RF-023) | MUST | TASK-018 | 018 |
| RF-034 | Consulta administrativa de clientes (refina RF-024) | MUST | TASK-018 | 018 |
| RF-035 | Administração de cupons (refina RF-026) | SHOULD | APIs existentes; validação na TASK-019 | 019 |
| RF-036 | Administração de promoções (refina RF-026) | SHOULD | APIs existentes; validação na TASK-019 | 019 |
| RF-037 | Moderação de avaliações (refina RF-025) | SHOULD | TASK-019 | 019 |
| RF-038 | Gestão de usuários administrativos (refina RF-027) | MUST | TASK-019 | 019 |

### 5.2 Requisitos aprovados por área

Cada área lista o comportamento aprovado e a origem da decisão. Os critérios de aceitação verificáveis estão em cada TASK do `TASKS.md` e em `docs/TASKS/TASKnnn.MD`.

**Cadastro, acesso e conta** (ADR-012, ADR-019, decisões de 2026-10-22):
- O cadastro ativa a conta imediatamente, sem confirmação de e-mail.
- A senha tem de 8 a 128 caracteres, com maiúscula, minúscula, número e símbolo.
- A sessão é revogável, guardada em cookie `HttpOnly`, `Secure`, `SameSite=Lax`, com validade de 12 horas e sem renovação.
- A recuperação usa token aleatório de uso único, válido por 30 minutos e enviado por uma porta de e-mail substituível. A redefinição revoga todas as sessões.
- O primeiro Administrador Geral é criado por um comando local, interativo e de uso único.
- O cliente consulta o próprio perfil. A edição de perfil está fora da V1.
- Endereços: o cliente pode ter vários. São obrigatórios destinatário, CPF (11 dígitos, com dígitos verificadores), telefone (DDD + 10 ou 11 dígitos), CEP de 8 dígitos, rua, número, bairro, cidade, UF e país `BR`. Complemento e referência são opcionais.

**Catálogo** (decisões TASK-006, 2026-10-23):
- Produto: nome obrigatório de 1 a 100 caracteres, uma marca obrigatória e uma ou mais categorias. Descrição opcional, em texto simples, até 1.000 caracteres. IDs são UUID, sem slug.
- Marca e categoria: nome de 1 a 50 caracteres, estado `ACTIVE` ou `INACTIVE`. Se inativa, não aceita novas associações e oculta da vitrine os produtos ligados a ela.
- Publicação: `DRAFT → PUBLISHED`; arquivar (`ARCHIVED`) oculta o produto da vitrine.
- Imagens de produto: fora da V1.

**Variantes e preço** (ADR-004, decisões TASK-007):
- Atributos `size` e `color`, quando aplicáveis. Um produto sem atributos pode ter uma única variante sem atributos.
- SKU manual, obrigatório e globalmente único. A comparação ignora espaços externos e maiúsculas/minúsculas e preserva o texto informado.
- Preço obrigatório em BRL, em centavos não negativos.
- Elegibilidade pública: produto publicado, variante ativa e preço válido.
- Produto arquivado rejeita novas variantes e preserva as existentes.
- A disponibilidade comercial pública é independente do saldo físico. O saldo não é exposto (decisão TASK-010).

**Busca e navegação** (contrato em [`docs/catalog-api.md`](docs/catalog-api.md)):
- Busca parcial sem diferenciar maiúsculas/minúsculas em nome, descrição, marca e categorias.
- Filtros: uma categoria, uma marca e faixa de preço inclusiva em centavos.
- Ordenação por nome ou pelo menor preço de variante ativa.
- Paginação com tamanho padrão 20 e máximo 100.

**Estoque** (ADR-005, decisões TASK-009):
- O saldo começa em zero por variante.
- Entradas e saídas usam inteiros positivos; ajustes usam delta inteiro diferente de zero.
- O motivo é obrigatório e o histórico é imutável.
- Uma saída acima do saldo é rejeitada atomicamente.
- O saldo e a movimentação são gravados na mesma transação.

**Carrinho** (ADR-006, Rodada 5):
- Um carrinho persistente por cliente autenticado. A consulta cria um carrinho vazio quando necessário.
- Adicionar uma variante já presente soma a quantidade; a atualização substitui pelo valor absoluto.
- A quantidade é um inteiro positivo até o limite de inteiro seguro.
- O carrinho usa sempre o preço vigente e valida o saldo sem reservar. Se o saldo cair depois, o item permanece.
- Administradores não acessam carrinhos de clientes.
- Na criação do pedido, o carrinho é marcado como convertido e a próxima consulta cria um novo.

**Cupons e promoções** (Rodada 9, 2026-10-26; adendo de 2026-11-02):
- Desconto percentual inteiro de 1% a 100% ou valor fixo positivo, sobre o carrinho inteiro, com subtotal mínimo inclusivo opcional.
- No máximo um cupom por carrinho, sem acúmulo. Vence o maior desconto elegível; em empate, a promoção automática vence o cupom.
- Código normalizado: sem espaços externos, em maiúsculas, somente A–Z e dígitos.
- Vigência em UTC: `startsAt <= agora < expiresAt`. Estados `DRAFT`, `ACTIVE` e `INACTIVE`.
- Desconto percentual arredonda ao centavo, com meio para cima.
- Limites global e por conta são opcionais. O uso é consumido atomicamente na criação do pedido e devolvido se o pedido expirar.
- Se uma alteração do carrinho tornar o cupom inelegível, o cupom é removido e o total recalculado.
- Administração exclusiva de `GENERAL_ADMIN` (`promotions.manage`).

**Checkout e frete** (ADR-007, ADR-010, adendo TASK-013):
- O servidor recalcula itens, preços, descontos, endereço, frete e disponibilidade. Totais enviados pelo cliente não são fonte confiável.
- Se os valores divergirem da cotação, o servidor exige confirmação explícita antes de criar o pedido.
- `Idempotency-Key` por cliente: mesma chave com mesmo conteúdo devolve o mesmo pedido; com conteúdo diferente, retorna conflito.
- Frete local: modalidade `STANDARD`, R$ 20,00 fixos, 5 dias úteis (segunda a sexta, sem feriados), para todos os CEPs brasileiros.
- O estoque é reservado atomicamente na criação do pedido, por 30 dias corridos.
- O desconto é rateado entre os itens proporcionalmente ao subtotal, com regra determinística de centavos.

**Pagamentos** (ADR-008, decisões TASK-014):
- Mock local para PIX, débito e crédito. Um único pagamento integral por pedido.
- Estados: `PENDING → PROCESSING → APPROVED | FAILED | CANCELLED | EXPIRED`. Estados terminais não regridem.
- Webhook: HMAC-SHA256 do corpo bruto no cabeçalho `x-payment-signature: sha256=<hex>`, comparado em tempo constante. O par `(provider, providerEventId)` é único, e o efeito é idempotente e transacional.
- Aprovação antes do vencimento: pedido `PENDING_PAYMENT → PAYMENT_CONFIRMED` e a reserva vira baixa definitiva. Aprovação depois do vencimento é rejeitada sem efeitos.

**Pedidos e rastreamento** (ADR-009, decisões TASK-015):
- Estados nesta entrega: `PENDING_PAYMENT`, `PAYMENT_CONFIRMED` e `EXPIRED`. A entrega começa em `NOT_SHIPPED`.
- O pedido guarda um snapshot de endereço, itens, atributos, preços e cupom.
- O cliente vê somente os próprios pedidos. `GENERAL_ADMIN` consulta em modo somente leitura.
- Rastreamento expõe só dados persistidos; nenhum dado fictício.

**Avaliações e favoritos** (Rodada 10, decisões TASK-017):
- Só avalia o cliente com pedido `PAYMENT_CONFIRMED` que contenha o produto. Uma avaliação por cliente e produto.
- Nota inteira de 1 a 5; comentário opcional de até 2.000 caracteres.
- Criação e edição deixam a avaliação em `PENDING`, inclusive depois de `REJECTED`. A moderação para `PUBLISHED` ou `REJECTED` será feita na TASK-019.
- Só avaliações `PUBLISHED` de produtos publicados aparecem publicamente.
- Favoritos são privados e preservados se o produto ficar inativo.

**Auditoria e notificações** (adendo à Rodada 12, TASK-004):
- Auditoria de login bem-sucedido e falho, logout, criação de conta, mudanças administrativas e eventos de recuperação de senha, além das operações de catálogo, variantes, estoque, carrinho, promoções, cupons, endereços, checkout e pagamentos. Avaliações e favoritos não geram auditoria.
- Logs imutáveis, consultáveis só por `GENERAL_ADMIN`.
- Se a auditoria falhar em uma operação crítica, a operação é revertida.
- A retenção está `PENDING`, sem exclusão automática.
- Notificações: abstração interna e adaptador mock. Tipos atuais: `ACCOUNT_CREATED`, `PASSWORD_RESET_REQUESTED` e `PASSWORD_CHANGED`.

## 6. Requisitos não funcionais

Por decisão de 2026-11-11 (DIV-002):

- os textos originais de RNF-001 a RNF-018 foram restaurados;
- as definições aprovadas em 2026-10-23, antes registradas como RNF-010 e RNF-014–017, passaram para RNF-019–023, sem mudança de conteúdo.

| RNF | Requisito | Critério / situação |
| --- | --- | --- |
| RNF-001 | Interface responsiva para os dispositivos e navegadores suportados | Critérios em RNF-021 e RNF-023 |
| RNF-002 | Acessibilidade mínima definida e verificável nos fluxos críticos | Critério em RNF-020 |
| RNF-003 | Metas de desempenho mensuráveis para catálogo, carrinho, checkout e pedidos | Critério em RNF-022 |
| RNF-004 | Hash apropriado de senhas; segredos fora do código-fonte | Implementado (`scrypt`; `.env.local`) |
| RNF-005 | TLS/HTTPS para dados em trânsito | Aplicável a ambiente hospedado; N/A no ambiente local |
| RNF-006 | Autenticação e autorização adequadas nas operações administrativas | Implementado (RBAC no servidor) |
| RNF-007 | Auditoria de operações administrativas sensíveis | Implementado; consolidação na TASK-020 |
| RNF-008 | Autenticação, idempotência e confirmação de eventos de pagamento | Implementado (HMAC e idempotência) |
| RNF-009 | Proteção contra acesso não autorizado a dados privados de clientes | Implementado (ownership) |
| RNF-010 | Integridade de estoque sob compras concorrentes | Implementado (TASK-009/013) |
| RNF-011 | Backups com frequência, retenção, armazenamento e restauração definidos | Definido: diário, 30 dias, Supabase Storage |
| RNF-012 | Restauração de backup testável, com critérios de sucesso | Restore sintético validado (TASK-005); RPO ≤ 24 h, RTO ≤ 8 h |
| RNF-013 | Logs estruturados para erros e eventos operacionais | Implementado; consolidação na TASK-020 |
| RNF-014 | Falhas críticas observáveis, com alertas | Health check e logs na TASK-020; alertas externos dependem de hospedagem |
| RNF-015 | Observância à LGPD | Minimização e sanitização implementadas; exclusão de conta fora da V1 |
| RNF-016 | Testes automatizados proporcionais ao risco | Em vigor (ADR-015) |
| RNF-017 | Separação entre apresentação, aplicação, domínio e infraestrutura | Em vigor (ADR-002, ADR-020); verificação ampliada na TASK-021 |
| RNF-018 | Evitar dependências desnecessárias entre regras de negócio e serviços externos | Em vigor (portas e adaptadores) |
| RNF-019 | Disponibilidade | Meta mensal de 99% em futuro ambiente hospedado. Não é SLA (aprovado em 2026-10-23) |
| RNF-020 | Acessibilidade | Fluxos críticos em WCAG 2.2 nível AA ([W3C](https://www.w3.org/TR/WCAG22/)) |
| RNF-021 | Responsividade | Fluxos críticos utilizáveis de 360 px até desktop, sem perda de funcionalidade |
| RNF-022 | Desempenho | p95 de APIs ≤ 2 s e páginas críticas ≤ 3 s em ambiente de referência; ambiente e método registrados antes da validação |
| RNF-023 | Compatibilidade | Duas versões estáveis mais recentes de Chrome, Edge, Firefox e Safari |

**Fluxos críticos com interface na V1:** cadastro, login, recuperação de senha, perfil, catálogo, produto, carrinho, checkout e pedidos.

## 7. Regras de negócio

As regras detalhadas e vigentes estão em 5.2. RN-021 a RN-023 foram criadas em 2026-11-11.

| RN | Regra | Situação |
| --- | --- | --- |
| RN-001 | Só clientes em estado permitido compram | Implementada parcialmente (sessão autenticada exigida) |
| RN-002 | Variante válida obrigatória quando aplicável | Implementada (TASK-007/011) |
| RN-003 | Quantidade não excede o disponível | Implementada (TASK-011/013) |
| RN-004 | Concorrência não gera estoque negativo | Implementada (TASK-009/013) |
| RN-005 | Preço preservado no pedido | Implementada: snapshot na criação do pedido (TASK-013) |
| RN-006 | Produto inativo fora de novas compras; histórico preservado | Implementada (TASK-006/013/017) |
| RN-007 | Ajuste de estoque registra responsável e motivo | Implementada (TASK-009) |
| RN-008 | Estado do pedido coerente com pagamento e entrega | Implementada para os estados da V1 (TASK-014/015) |
| RN-009 | Eventos de pagamento idempotentes | Implementada (TASK-014) |
| RN-010 | Pagamento recusado ou expirado não é confirmado | Implementada (TASK-014) |
| RN-011 | Pago só por confirmação do provedor | Implementada (TASK-014) |
| RN-012 | Mudança de preço não altera pedido confirmado | Implementada (TASK-013) |
| RN-013 | Cupom só com critérios atendidos | Implementada (TASK-012) |
| RN-014 | Cupom expirado, inativo ou esgotado não é usado | Implementada (TASK-012/013) |
| RN-015 | Avaliações seguem elegibilidade e moderação | Elegibilidade implementada; moderação na TASK-019 |
| RN-016 | Administrador só executa o permitido | Implementada (RBAC no servidor) |
| RN-017 | Nenhuma operação contorna a autorização | Princípio aplicado; validação na TASK-021 |
| RN-018 | Dados de um cliente não expostos a outro | Implementada (ownership) |
| RN-019 | Operações sensíveis auditáveis | Implementada para os eventos aprovados |
| RN-020 | Cancelamento, devolução, troca e reembolso têm regras próprias | **Fora da V1** (2026-11-11) |
| RN-021 | Favoritos são privados do cliente, únicos por produto e preservados se o produto ficar inativo | Implementada (TASK-017) |
| RN-022 | O último `GENERAL_ADMIN` ativo não pode ser desativado nem perder o papel | TASK-019 |
| RN-023 | Cada usuário possui exatamente um papel (`CUSTOMER`, `GENERAL_ADMIN` ou `CATALOG_MANAGER`) | TASK-019 |

## 8. Casos de uso

| UC | Nome | Ator | Situação |
| --- | --- | --- | --- |
| UC-001 | Criar conta | Cliente | Implementado (API e tela) |
| UC-002 | Autenticar cliente | Cliente | Implementado (API e tela) |
| UC-003 | Recuperar acesso | Cliente | Implementado (e-mail mock) |
| UC-004 | Navegar pelo catálogo | Visitante/Cliente | Implementado (`/catalog`) |
| UC-005 | Consultar produto | Visitante/Cliente | API implementada; página na TASK-023 |
| UC-006 | Adicionar produto ao carrinho | Cliente | API implementada; tela na TASK-023 |
| UC-007 | Gerenciar carrinho | Cliente | API implementada; tela na TASK-023 |
| UC-008 | Realizar checkout | Cliente | API implementada; tela na TASK-023 |
| UC-009 | Processar pagamento | Cliente/Sistema/Provedor | Mock implementado; tela e simulação local na TASK-023 |
| UC-010 | Criar pedido | Sistema | Implementado |
| UC-011 | Acompanhar pedido | Cliente | API implementada; tela na TASK-023 |
| UC-012 | Avaliar produto | Cliente | Implementado (API); moderação na TASK-019 |
| UC-013 | Gerenciar favoritos | Cliente | Implementado (API) |
| UC-014 | Administrar catálogo | Gestor/Admin | Implementado (API) |
| UC-015 | Administrar estoque | Gestor/Admin | Implementado (API) |
| UC-016 | Administrar pedidos | Admin Geral | Consulta implementada; filtros na TASK-018 |
| UC-017 | Administrar clientes | Admin Geral | TASK-018 |
| UC-018 | Administrar promoções | Admin Geral | Implementado (API) |
| UC-019 | Moderar avaliações | Admin Geral | TASK-019 |
| UC-020 | Gerenciar usuários administrativos | Admin Geral | TASK-019 |
| UC-021 | Auditar operação | Admin Geral | Implementado (API) |
| UC-022 | Processar integração de entrega | Sistema | Só cotação local (ADR-010); integração real fora da V1 |
| UC-023 | Enviar notificação | Sistema | Adaptador mock; eventos de pedido na TASK-020 |

Fluxos detalhados: `docs/TASKS/TASKnnn.MD`. A interface administrativa não faz parte da V1; UC-014 a UC-021 são atendidos por API.

## 9. Modelo de domínio

| Grupo | Entidades | Módulo |
| --- | --- | --- |
| Identidade | User, Role, Permission, Session, PasswordResetToken | `identity`, `auth` |
| Catálogo | Product, Brand, Category, ProductVariant | `catalog` |
| Estoque | InventoryStock, InventoryMovement, InventoryReservation | `inventory` |
| Compra | Cart, CartItem, CustomerAddress, CheckoutQuote, Order, OrderItem | `cart`, `checkout`, `orders`, `pricing` |
| Entrega | Shipment | `shipping`, `checkout` |
| Promoções | Promotion, Coupon, CouponRedemption | `promotions`, `coupons` |
| Pagamento | Payment, PaymentWebhookEvent | `payments` |
| Experiência | ProductReview, CustomerFavorite | `reviews`, `favorites` |
| Governança | AuditLog, Notification (só porta) | `audit`, `notifications`, `privacy` |

Principais invariantes:

- O total do pedido é `subtotal − desconto + frete`.
- O subtotal do item é `preço unitário × quantidade`.
- O saldo de estoque nunca fica negativo.
- Uma reserva não pode estar liberada e convertida ao mesmo tempo.
- Há um carrinho `ACTIVE` por cliente.
- Há um pagamento por pedido.
- Há uma avaliação por cliente e produto.
- O SKU normalizado é único.

Diagramas: [modelo conceitual](docs/diagrams/domain-model.md), [modelo de dados (ER)](docs/diagrams/data-model.md) e [máquinas de estado](docs/diagrams/state-machines.md).

```mermaid
erDiagram
    USER ||--o{ CUSTOMER_ADDRESS : possui
    USER ||--o{ CART : possui
    CART ||--o{ CART_ITEM : contem
    BRAND ||--o{ PRODUCT : identifica
    PRODUCT }o--o{ CATEGORY : classifica
    PRODUCT ||--o{ PRODUCT_VARIANT : possui
    PRODUCT_VARIANT ||--o| INVENTORY_STOCK : saldo
    PRODUCT_VARIANT ||--o{ INVENTORY_MOVEMENT : movimenta
    CART_ITEM }o--|| PRODUCT_VARIANT : referencia
    USER ||--o{ ORDER : realiza
    ORDER ||--|{ ORDER_ITEM : contem
    ORDER ||--|| SHIPMENT : entrega
    ORDER ||--o| PAYMENT : paga
    ORDER ||--o{ INVENTORY_RESERVATION : reserva
    COUPON ||--o{ COUPON_REDEMPTION : consumo
    PROMOTION ||--o{ COUPON : origina
    USER ||--o{ PRODUCT_REVIEW : avalia
    USER ||--o{ CUSTOMER_FAVORITE : favorita
```

## 10. Modelo de dados

PostgreSQL, com esquema versionado em [`db/migrations/`](db/migrations/), aplicado por `npm run db:migrate`. Chaves primárias UUID, valores monetários em centavos (`bigint`, BRL) e timestamps em todas as tabelas.

| Migration | Tabelas | Restrições relevantes |
| --- | --- | --- |
| 001 | `identity_users`, `identity_roles`, `identity_permissions`, `identity_user_roles`, `identity_role_permissions`, `identity_sessions`, `identity_password_reset_tokens` | E-mail único sem diferenciar caixa; seeds de papéis e permissões |
| 002 | `audit_logs` | `result ∈ {SUCCESS, FAILURE, DENIED}` |
| 003 | `catalog_brands`, `catalog_categories`, `catalog_products`, `catalog_product_categories` | Limites de nome e descrição; estados `ACTIVE`/`INACTIVE` |
| 004 | `catalog_product_variants` | Atributos só `size`/`color`; `price_cents >= 0`; moeda BRL; SKU normalizado único |
| 005 | `inventory_stocks`, `inventory_movements` | `quantity >= 0`; delta diferente de zero com sinal coerente; motivo obrigatório |
| 006 | `carts`, `cart_items` | `quantity > 0` |
| 007 | `promotions`, `coupons`, `coupon_redemptions` | Código `^[A-Z0-9]{1,50}$`; vigência; limites |
| 008–010 | `customer_addresses`, `checkout_quotes`, `checkout_idempotency_keys`, `orders`, `order_items`, `shipments`, `inventory_reservations` | CPF, telefone, CEP e UF validados; frete `= 2000`; total consistente; um carrinho `ACTIVE` por cliente; rateio de desconto; snapshot de cupom |
| 011 | `payments`, `payment_webhook_events` | `provider = 'LOCAL_MOCK'`; um pagamento por pedido; enum de estados e eventos |
| 012 | `product_reviews`, `customer_favorites` | Nota de 1 a 5; comentário até 2.000; `published_at` coerente com o estado |

O PostgreSQL local é o banco transacional de todos os módulos, conforme o aditivo de 2026-11-11 ao ADR-003.

## 11. Arquitetura

Monólito modular em camadas, em uma única aplicação Next.js (App Router) com PostgreSQL ([ADR-001](docs/adr/ADRs.md), ADR-002, ADR-003, ADR-019). Microsserviços ficam excluídos sem um novo ADR.

```mermaid
flowchart TD
    Browser[Navegador] --> Pages[app/ páginas React]
    Browser --> Routes[app/api Route Handlers]
    Mock[Mock de pagamento] -->|webhook HMAC| Routes
    Pages --> Pres[src/modules/*/presentation]
    Routes --> Pres
    Pres --> App[src/modules/*/application]
    App --> Dom[src/modules/*/domain]
    Pres -. composição de adaptadores .-> Infra[src/modules/*/infrastructure]
    Infra --> App
    Infra --> Dom
    Infra --> PG[(PostgreSQL)]
```

**Camadas.**

| Camada | Responsabilidade |
| --- | --- |
| `app/` | Rotas Next.js (páginas e Route Handlers) que delegam aos módulos |
| `presentation` | Adaptação HTTP, autenticação e permissão da requisição, mapeamento de erros e cabeçalhos `no-store` |
| `application` | Casos de uso e portas (repositórios, gateway de pagamento, e-mail, notificações) |
| `domain` | Regras, validações e invariantes, sem dependência de framework |
| `infrastructure` | PostgreSQL, mock de pagamento, cálculo local de frete, hash de senha, notificação mock |

**Módulos** (`src/modules/`): `identity`, `auth`, `audit`, `privacy`, `notifications`, `catalog`, `inventory`, `cart`, `pricing`, `promotions`, `coupons`, `checkout`, `shipping`, `payments`, `orders`, `reviews`, `favorites`. Os módulos `administration` e `operations`, citados em [`overview.md`](docs/architecture/overview.md), ainda não existem como código.

**Comunicação.** Tudo é síncrono, dentro da requisição. Não há fila nem job agendado (ADR-013 adiado para depois da V1). A expiração de pedidos não pagos é aplicada nas transações de checkout, e o pagamento recusa pedidos vencidos.

**Erros.** `ApplicationError`/`ValidationError` para erros esperados; `InfrastructureError` na camada técnica. Erros inesperados são registrados de forma genérica, sem payload.

**Composição (ADR-020).** A camada `presentation` de cada módulo é o ponto de composição: ela pode instanciar adaptadores de `infrastructure` e entregá-los aos casos de uso, mas não pode conter regra de negócio nem SQL. A ausência da camada `application` no módulo `checkout` é dívida técnica registrada, e não será refatorada na V1. A verificação automatizada das camadas em `src/modules/**` será ampliada na TASK-021.

Detalhes: [`docs/architecture/overview.md`](docs/architecture/overview.md) e [`docs/architecture/infrastructure-baseline.md`](docs/architecture/infrastructure-baseline.md).

### Índice de ADRs

| ADR | Decisão | Status |
| --- | --- | --- |
| 001 | Monólito modular em camadas | ACCEPTED |
| 002 | Separação domínio/aplicação/apresentação/infraestrutura | ACCEPTED |
| 003 | Banco relacional como fonte transacional; PostgreSQL para todos os módulos (aditivo de 2026-11-11) | ACCEPTED |
| 004 | Produtos, variantes e SKUs | ACCEPTED |
| 005 | Estoque transacional por variante, reserva de 30 dias | ACCEPTED |
| 006 | Carrinho persistente do cliente autenticado | ACCEPTED |
| 007 | Checkout validado no servidor e idempotente | ACCEPTED |
| 008 | Porta de pagamento com mock local | ACCEPTED |
| 009 | Estados de pedido, pagamento e entrega separados | ACCEPTED |
| 010 | Logística desacoplada; cotação local fixa | ACCEPTED |
| 011 | RBAC validado no servidor | ACCEPTED |
| 012 | Autenticação própria centralizada | ACCEPTED |
| 013 | Operações assíncronas | PROPOSED (adiado para depois da V1) |
| 014 | Observabilidade e auditoria | ACCEPTED |
| 015 | Testes por camada | ACCEPTED (2026-11-11) |
| 016 | Web responsiva | ACCEPTED (2026-11-11) |
| 017 | Configuração comercial externa | PROPOSED (adiado para depois da V1) |
| 018 | Versionamento de contratos | PROPOSED (adiado para depois da V1) |
| 019 | Next.js e backend local | ACCEPTED |
| 020 | Apresentação como ponto de composição dos adaptadores | ACCEPTED (2026-11-11) |

## 12. APIs

Todas as rotas ficam sob `/api` e respondem em JSON. Rotas autenticadas usam o cookie de sessão. "Cliente" significa sessão com a permissão `identity.profile.read:self`, com isolamento por propriedade do recurso. As respostas privadas usam `Cache-Control: no-store`. Contratos detalhados: [`docs/catalog-api.md`](docs/catalog-api.md), [`docs/inventory-api.md`](docs/inventory-api.md) e as especificações `docs/TASKS/TASKnnn.MD`.

| Método | Rota | Acesso | Finalidade | TASK |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | Público | Cadastro de cliente | 003 |
| POST | `/auth/login` · `/auth/logout` | Público · Sessão | Iniciar ou encerrar sessão | 003 |
| GET | `/auth/session` · `/me` | Sessão | Sessão atual e perfil público | 003 |
| POST | `/auth/forgot-password` · `/auth/reset-password` | Público | Recuperação de senha | 003 |
| GET | `/admin/identity/roles` | `identity.roles.manage` | Consultar papéis | 003 |
| GET | `/admin/audit-logs` | `GENERAL_ADMIN` | Auditoria paginada | 004 |
| GET, POST | `/admin/products` | `catalog.products.manage` | Listar e criar produtos | 006 |
| GET, PATCH | `/admin/products/{id}` | `catalog.products.manage` | Consultar e editar produto | 006 |
| POST | `/admin/products/{id}/publish` · `/archive` | `catalog.products.publish` | Publicar e arquivar | 006 |
| GET, POST | `/admin/categories` · `/admin/brands` | `catalog.categories.manage` · `catalog.brands.manage` | Listar e criar | 006 |
| GET, PATCH | `/admin/categories/{id}` · `/admin/brands/{id}` | Idem | Consultar, editar e inativar | 006 |
| GET, POST | `/admin/products/{id}/variants` | `catalog.products.manage` | Listar e criar variantes | 007 |
| GET, PATCH | `/admin/variants/{id}` | `catalog.products.manage` | Consultar e editar variante | 007 |
| GET | `/products` · `/products/{id}` | Público | Catálogo elegível, busca, filtros e paginação | 006–008 |
| GET | `/admin/inventory/{variantId}` · `/movements` | `inventory.manage` | Saldo e histórico | 009 |
| POST | `/admin/inventory/{variantId}/entries` · `/exits` · `/adjustments` | `inventory.manage` | Movimentar estoque | 009 |
| GET, POST | `/cart` | Cliente | Consultar carrinho e adicionar item | 011 |
| PATCH, DELETE | `/cart/items/{itemId}` | Cliente | Alterar quantidade e remover item | 011 |
| POST, DELETE | `/cart/coupon` | Cliente | Aplicar e remover cupom | 012 |
| GET, POST | `/admin/promotions` · `/admin/coupons` | `promotions.manage` + `GENERAL_ADMIN` | Listar e criar | 012 |
| PATCH | `/admin/promotions/{promotionId}` · `/admin/coupons/{couponId}` | Idem | Editar | 012 |
| GET, POST | `/addresses` | Cliente | Listar e criar endereços | 013 |
| GET, PATCH | `/addresses/{addressId}` | Cliente | Consultar e editar endereço | 013 |
| POST | `/checkout/quotes` | Cliente | Cotação autoritativa | 013 |
| POST | `/checkout/orders` | Cliente + `Idempotency-Key` | Criar pedido | 013 |
| POST | `/payments` | Cliente | Criar pagamento simulado | 014 |
| GET | `/payments/{paymentId}` | Cliente (dono) | Consultar pagamento | 014 |
| POST | `/payments/webhook` | Assinatura HMAC | Eventos do mock | 014 |
| GET | `/orders` · `/orders/{orderId}` · `/orders/{orderId}/tracking` | Cliente (dono) | Histórico, detalhe e entrega | 015 |
| GET | `/admin/orders` · `/admin/orders/{orderId}` | `GENERAL_ADMIN` | Consulta somente leitura | 015 |
| GET, POST | `/products/{id}/reviews` | Público · Cliente elegível | Avaliações publicadas e criação | 017 |
| GET | `/customer/reviews` | Cliente | Minhas avaliações | 017 |
| PATCH | `/reviews/{reviewId}` | Cliente (autor) | Editar avaliação | 017 |
| GET | `/customer/favorites` | Cliente | Listar favoritos | 017 |
| POST, DELETE | `/customer/favorites/{productId}` | Cliente | Favoritar e desfavoritar | 017 |

**Planejadas** (contratos definidos em 2026-11-11, a partir das decisões R2, R3 e R7). Todas usam paginação `page`/`pageSize` (padrão 20, máximo 100), `Cache-Control: no-store` e os códigos de erro 400, 401, 403, 404 e 409, conforme o padrão das APIs existentes.

| Método | Rota | Acesso | Finalidade | TASK |
| --- | --- | --- | --- | --- |
| GET | `/admin/orders?status=&from=&to=` | `GENERAL_ADMIN` | Filtros por estado e período de criação (`from` inclusivo, `to` exclusivo, ISO-8601) sobre a consulta existente | 018 |
| GET | `/admin/customers?email=&status=` | `GENERAL_ADMIN` | Clientes com `id`, `email`, `status`, `createdAt` e `ordersCount`. Filtro de e-mail parcial, sem diferenciar caixa. **Sem CPF, telefone ou endereço** | 018 |
| GET | `/admin/customers/{customerId}` | `GENERAL_ADMIN` | Os mesmos campos, mais o resumo dos pedidos (`id`, `status`, `totalCents`, `createdAt`) | 018 |
| GET | `/admin/reviews?status=` | `GENERAL_ADMIN` | Avaliações para moderação (padrão `PENDING`) | 019 |
| PATCH | `/admin/reviews/{reviewId}` | `GENERAL_ADMIN` | `{ "status": "PUBLISHED" \| "REJECTED" }`, somente a partir de `PENDING`; auditado | 019 |
| GET | `/admin/users` | `identity.users.read` | Contas administrativas com `id`, `email`, `status` e `role` | 019 |
| POST | `/admin/users` | `identity.users.manage` | Cria conta administrativa com `email`, senha inicial (política de senha) e `role` ∈ {`GENERAL_ADMIN`, `CATALOG_MANAGER`}; auditado | 019 |
| PATCH | `/admin/users/{userId}` | `identity.users.manage` + `identity.roles.manage` | Altera `status` (`ACTIVE`/`INACTIVE`) e/ou `role`. Desativar revoga as sessões. Respeita RN-022 e RN-023; auditado | 019 |
| GET | `/health` | Público | `{ "status": "ok" \| "degraded", "database": "ok" \| "unavailable" }`, com HTTP 200 ou 503, sem detalhes internos | 020 |

Nenhum papel ou permissão novo é criado: as rotas usam permissões de identidade existentes ou a verificação do papel `GENERAL_ADMIN`, como já fazem auditoria e pedidos.

**Telas do cliente (TASK-023).** As telas consomem somente as APIs existentes:

- `/products/[id]`: detalhe do produto, seleção de variante e "adicionar ao carrinho";
- `/cart`: itens, quantidades e cupom;
- `/checkout`: endereço, cotação, confirmação de valores alterados, criação do pedido com `Idempotency-Key` e escolha do meio de pagamento simulado;
- `/orders` e `/orders/[id]`: histórico, detalhe e entrega.

O mock de pagamento não envia webhooks sozinho. Para demonstrar a aprovação, a TASK-023 prevê o script local `npm run payment:simulate`, que assina o evento com `PAYMENT_WEBHOOK_SECRET` e o envia ao webhook existente. Não cria endpoint nem altera o contrato de pagamento. Este item depende de confirmação antes do `READY`.

## 13. Tecnologias

| Tecnologia | Finalidade | Justificativa e alternativas | Registro |
| --- | --- | --- | --- |
| Next.js 16 (App Router) + React 19 + TypeScript | Interface e servidor na mesma aplicação | Mantém React e oferece código de servidor sem serviço separado. Alternativas: Vite com backend separado, ou front sem backend | ADR-019 |
| PostgreSQL 18 (`pg`) | Persistência transacional | Integridade referencial e transações para estoque e pedidos. Alternativas: NoSQL e persistência poliglota | ADR-003 |
| Autenticação própria com `scrypt` (Node `crypto`) | Senhas e sessões | Sem provedor externo aprovado; sessão revogável no banco | ADR-012 |
| Vitest | Testes unitários, de integração e arquiteturais | Execução em Node, com integração ao PostgreSQL local | ADR-015 |
| oxlint · Prettier | Lint e formatação | Gates reproduzíveis via `npm run quality` | TASK-001 |
| Docker Compose (opcional) | Ambiente local com PostgreSQL | Alternativa à instalação local | Manutenção aceita em 2026-11-11 |
| Supabase Storage | Destino de backups | Bucket privado dentro da cota gratuita | TASK-005 |

Ainda pendentes: hospedagem, gateway de pagamento, transportadora, provedor de e-mail, armazenamento de imagens, ferramenta de observabilidade e CI/CD.

## 14. Segurança

**Implementado:**

- senhas com `scrypt` e sal;
- sessão revogável em cookie `HttpOnly`/`Secure`/`SameSite=Lax` de 12 horas;
- tokens de recuperação de uso único;
- RBAC e ownership validados no servidor;
- respostas privadas com `no-store`;
- webhook com HMAC e comparação em tempo constante;
- idempotência de checkout e pagamento;
- auditoria imutável, restrita a `GENERAL_ADMIN`;
- sanitização de logs (módulo `privacy`);
- segredos (`DATABASE_URL` e `PAYMENT_WEBHOOK_SECRET`) somente no servidor, via `.env.local` fora do Git;
- consultas SQL parametrizadas;
- nenhum dado de cartão armazenado.

**Pendente:**

- rate limiting e proteção contra tentativas abusivas: fora da V1, risco aceito na TASK-022. Se houver tempo, um limitador no login pode entrar na TASK-021;
- TLS em ambiente hospedado;
- política de retenção e exclusão de dados (LGPD: Rodada 12);
- gestão de segredos em ambiente hospedado;
- relatório de segurança da TASK-021.

## 15. Estratégia de testes

| Tipo | Local | Cobertura atual |
| --- | --- | --- |
| Unitário | `tests/unit/` | Domínio de catálogo, variantes, estoque, carrinho, desconto, cupom, promoção, checkout, pagamento, webhook, avaliações, política de senha, hash, auditoria e privacidade |
| Integração/API | `tests/integration/` | Fluxos com PostgreSQL local de identidade, catálogo, busca, variantes, estoque, carrinho, cupom, checkout, pedidos, pagamento, avaliações e favoritos. Exigem `.env.local` com `DATABASE_URL` |
| Arquitetural | `tests/architecture/` | Direção de dependência entre camadas. Hoje não cobre `src/modules/**`; ampliação com a exceção do ADR-020 na TASK-021 |
| E2E, acessibilidade, responsividade, desempenho | — | Planejados para a TASK-021, sobre os fluxos com interface (incluindo os da TASK-023); nenhum existe ainda |

Os Quality Gates e a Definition of Done estão no [`AGENTS.md`](AGENTS.md). O resultado de cada execução fica registrado no `TASKS.md`.

## 16. Riscos

| Risco | Categoria | Prob./Impacto | Mitigação |
| --- | --- | --- | --- |
| Concorrência no estoque | Técnico | Alta/Alta | Atualização condicional e reserva transacional (TASK-009/013) |
| Webhook duplicado ou forjado | Segurança/Integração | Média/Alta | HMAC e idempotência por evento (TASK-014) |
| Rastreabilidade de TASKs antigas com IDs legados | Processo | Média/Média | IDs oficiais definidos e mapeamento legado no `TASKS.md` (2026-11-11) |
| Arquitetura sem verificação automatizada nos módulos | Arquitetural | Alta/Média | ADR-020 e teste ampliado na TASK-021 |
| Ausência de cancelamento e reembolso | Negócio | Baixa (V1 acadêmica)/Média | Fora da V1, registrado como limitação conhecida |
| Prazo apertado para TASK-018 a TASK-023 | Cronograma | Alta/Alta | Escopo reduzido (2026-11-11) e execução contínua mediante autorização |
| Vazamento de dados de clientes | Segurança | Baixa/Alta | Ownership, RBAC, testes e auditoria |
| Backup sem rotina automatizada | Operacional | Média/Alta | Baseline aprovado; automação antes de produção |
| Dependência de provedores ainda não escolhidos | Integração | Média/Média | Portas e adaptadores (ADR-008, ADR-010, ADR-012) |
| Rate limiting ausente | Segurança | Média/Média | Risco aceito na V1 local; reavaliar antes de hospedagem |

## 17. Roadmap

As fases vigentes são as do `TASKS.md`. Elas substituem os roadmaps preliminares do `development-plan.md` e do README original.

| Fase | Objetivo | Entregáveis | Critério de conclusão |
| --- | --- | --- | --- |
| PHASE-01 — Fundação | Base técnica, identidade e governança | Estrutura, qualidade, infraestrutura, identidade, RBAC, auditoria | Checkpoint TASK-005 |
| PHASE-02 — Catálogo e estoque | Produtos descobríveis e estoque íntegro | Catálogo, variantes, busca, estoque | Checkpoint TASK-010 |
| PHASE-03 — Comércio | Fluxo de compra ponta a ponta | Carrinho, cupons, checkout, pagamento, pedidos | Checkpoint TASK-016 |
| PHASE-04 — Administração e readiness | Operação administrativa, telas do cliente e validação final | Avaliações, favoritos, administração por API, notificações, telas de carrinho, checkout e pedidos, segurança, E2E | Checkpoint TASK-022 |

Dependências e ordem: [`TASKS.md`](TASKS.md).

## 18. Matriz de rastreabilidade

IDs oficiais. A tabela de referências legadas das TASKs concluídas está no `TASKS.md`.

| RF | RN | RNF | UC | Entidades | API | Testes | TASK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RF-001 | RN-016, RN-018 | RNF-004, RNF-006, RNF-009 | UC-001–003 | User, Role, Session | `/auth/*`, `/me` | `identity-flow`, `identity-password-*` | 003 |
| RF-019, RF-028 | RN-019 | RNF-007, RNF-013, RNF-015 | UC-021, UC-023 | AuditLog | `/admin/audit-logs` | `audit-event`, `privacy-logging`, `notification-service` | 004, 020 |
| RF-003, RF-004, RF-006, RF-020, RF-021 | RN-006 | RNF-017 | UC-004, UC-005, UC-014 | Product, Brand, Category | `/admin/products`, `/admin/categories`, `/admin/brands`, `/products` | `catalog-domain`, `catalog-flow` | 006 |
| RF-007, RF-020 | RN-002 | — | UC-005, UC-014 | ProductVariant | `/admin/products/{id}/variants`, `/admin/variants/{id}` | `product-variant-*` | 007 |
| RF-003, RF-005 | — | RNF-022 | UC-004 | — | `/products` | `catalog-search*`, `catalog-browser` | 008 |
| RF-015, RF-016, RF-022 | RN-003, RN-004, RN-007 | RNF-010 | UC-015 | InventoryStock, InventoryMovement | `/admin/inventory/*` | `inventory-*` | 009 |
| RF-008 | RN-002, RN-003 | — | UC-006, UC-007 | Cart, CartItem | `/cart`, `/cart/items/*` | `cart-domain`, `cart-flow` | 011 |
| RF-009, RF-026 | RN-013, RN-014 | — | UC-018 | Promotion, Coupon, CouponRedemption | `/admin/promotions`, `/admin/coupons`, `/cart/coupon` | `coupon-*`, `promotion-domain`, `discount-domain` | 012 |
| RF-002, RF-010, RF-012 | RN-003–005, RN-012 | RNF-010 | UC-008, UC-010 | Address, Quote, Order, OrderItem, Shipment, Reservation | `/addresses`, `/checkout/*` | `checkout-*` | 013 |
| RF-011 | RN-008–011 | RNF-008 | UC-009 | Payment, PaymentWebhookEvent | `/payments*` | `payment-*` | 014 |
| RF-012–014, RF-023 | RN-008, RN-018 | RNF-009 | UC-011, UC-016 | Order (consulta) | `/orders*`, `/admin/orders*` | `order-query`, `order-api-flow` | 015 |
| RF-017, RF-018 | RN-015, RN-021 | RNF-009 | UC-012, UC-013 | ProductReview, CustomerFavorite | `/products/{id}/reviews`, `/customer/*`, `/reviews/{id}` | `review-domain`, `review-favorite-flow` | 017 |
| RF-031–034 | RN-016, RN-018, RN-019 | RNF-006, RNF-009 | UC-014–017 | User, Order | `/admin/customers*`, `/admin/orders` (filtros) | a criar | 018 |
| RF-035–038 | RN-015, RN-016, RN-019, RN-022, RN-023 | RNF-006, RNF-007 | UC-018–020 | ProductReview, User, Role | `/admin/reviews*`, `/admin/users*` | a criar | 019 |
| RF-019, RF-028 | RN-019 | RNF-007, RNF-013, RNF-014 | UC-021, UC-023 | AuditLog, Notification | `/health` | a criar | 020 |
| RF-006–008, RF-010, RF-011, RF-013, RF-014 | RN-002, RN-003, RN-005 | RNF-020, RNF-021 | UC-005–011 | — (consome APIs existentes) | Páginas `/products/[id]`, `/cart`, `/checkout`, `/orders`, `/orders/[id]` | a criar | 023 |
| Todos os RF da V1 | RN-016, RN-017 | RNF-001, RNF-002, RNF-017, RNF-020–023 | UC-001–021 | — | — | E2E, a11y e arquitetura (a criar) | 021 |
| Todos | Todos | Todos | Todos | — | — | Relatório de release | 022 |

## 19. Pendências

Esquema oficial: PD-001–014 do `development-plan.md` (DIV-003, 2026-11-11). Novas pendências começam em PD-028, para não colidir com o esquema antigo do README original.

| PD | Descrição | Situação |
| --- | --- | --- |
| PD-001 | Categorias exatas da V1 | Não bloqueante: categorias são cadastráveis pela administração |
| PD-002 | Atributos e variantes | **Resolvida**: tamanho e cor (TASK-007) |
| PD-003 | Reserva, baixa e reposição de estoque | **Resolvida** para reserva e baixa (ADR-005); reposição após cancelamento fora da V1 |
| PD-004 | Gateway e meios de pagamento | **Resolvida para a V1**: mock local; gateway real fora da V1 |
| PD-005 | Transportadoras e cálculo de frete | **Resolvida para a V1**: cotação local fixa; transportadora fora da V1 |
| PD-006 | Troca, devolução e reembolso | **Fora da V1** (2026-11-11) |
| PD-007 | Nota fiscal na V1 | Aberta, não bloqueante; nenhuma TASK depende dela |
| PD-008 | Estratégia mobile | **Resolvida**: web responsiva (ADR-016 aceito em 2026-11-11) |
| PD-009 | Stack tecnológica | **Resolvida**: Next.js e PostgreSQL (ADR-019; aditivo ao ADR-003) |
| PD-010 | Hospedagem, ambientes e deploy | Aberta; a V1 roda somente no ambiente local |
| PD-011 | Metas de desempenho e disponibilidade | **Resolvida** (RNF-019, RNF-022); ambiente de medição definido na TASK-021 |
| PD-012 | Regras de cupons e promoções | **Resolvida** (Rodada 9) |
| PD-013 | Avaliações e moderação | **Resolvida**: elegibilidade (TASK-017), moderação por `GENERAL_ADMIN` (TASK-019), denúncias fora |
| PD-014 | Campos obrigatórios e retenção de dados | Campos resolvidos; exclusão de conta fora da V1; retenção de auditoria aberta, não bloqueante |

---

## Desenvolvimento local

### Pré-requisitos

- Node.js 24.x (versão em `.nvmrc`) e npm 11.x.
- PostgreSQL 18 local **ou** Docker com Compose v2.

### Instalação e configuração

```sh
npm ci
cp .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
```

Em `.env.local` (ignorado pelo Git), configure:

- `DATABASE_URL`: um banco vazio `tropa_fight`;
- `LOG_LEVEL`;
- `PAYMENT_WEBHOOK_SECRET`: um valor aleatório local, necessário para os webhooks do mock.

Valores sem prefixo público são lidos somente no servidor. Nunca use credenciais reais.

```sh
npm run db:migrate              # aplica db/migrations/001–012
npm run identity:create-admin   # cria o primeiro Administrador Geral (uso único, interativo)
```

O comando de administrador não imprime a senha e recusa uma segunda execução quando já existe um administrador. A aplicação não publica nada nem usa serviços remotos. Recuperação de acesso, notificações e pagamentos usam adaptadores locais.

### Execução com Docker (opcional)

Alternativa ao PostgreSQL instalado na máquina. Continua sendo somente ambiente local.

```sh
docker compose up --build
```

| Serviço | Função |
| --- | --- |
| `db` | PostgreSQL 18 com volume `postgres-data`, exposto em `localhost:5433` |
| `migrate` | Executa `scripts/db-migrate.mjs` uma vez, depois que o banco fica saudável |
| `app` | Aplicação em `http://localhost:3000`, iniciada depois das migrações |

Os valores padrão (`tropa` / `tropa_local` / `tropa_fight`) servem só para desenvolvimento. Para alterá-los, crie um `.env` na raiz (ignorado pelo Git) com `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST_PORT`, `APP_HOST_PORT`, `LOG_LEVEL` e `PAYMENT_WEBHOOK_SECRET`.

Comandos úteis:

- Criar o administrador no contêiner: `docker compose run --rm -it app npm run identity:create-admin`.
- Usar o banco do Compose com `npm run dev`: em `.env.local`, `DATABASE_URL=postgresql://tropa:tropa_local@localhost:5433/tropa_fight`.
- Parar: `docker compose down`. Adicione `-v` para apagar os dados.

### Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Servidor local em `http://localhost:3000` |
| `npm run build` | Verificar tipos e gerar a versão de produção |
| `npm run start` | Servir a versão gerada |
| `npm run db:migrate` | Aplicar as migrations no PostgreSQL configurado |
| `npm run identity:create-admin` | Criar o primeiro administrador |
| `npm run lint` | oxlint em `app`, `src`, `tests` e `scripts` |
| `npm test` | Testes unitários, de integração e arquiteturais. Os de integração exigem `DATABASE_URL` |
| `npm run test:watch` | Testes em modo de observação |
| `npm run typecheck` | Verificação de tipos TypeScript |
| `npm run format` / `format:check` | Formatar ou verificar a formatação |
| `npm run quality` | Formatação, lint, tipos, testes e build |

### Convenções de código

- `app/` contém páginas e Route Handlers, que apenas delegam para `src/modules/<módulo>/presentation`.
- Cada módulo organiza-se em `domain/`, `application/`, `infrastructure/` e `presentation/`, conforme necessário.
- `src/domain`, `src/application`, `src/infrastructure` e `src/presentation` guardam o núcleo transversal (saúde da aplicação, erros, configuração, logger, pool de banco e o componente inicial).
- Direção de dependência aprovada: apresentação → aplicação → domínio; a infraestrutura implementa as portas da aplicação. A apresentação pode **instanciar** adaptadores de infraestrutura (ADR-020), sem conter regra de negócio ou SQL.
- Imports por caminho relativo. Testes em `tests/unit/`, `tests/integration/` ou `tests/architecture/`, com arquivos `*.test.ts(x)`.
- Erros de configuração são detectados no bootstrap. Logs nunca contêm segredos ou dados pessoais desnecessários.

## Documentação

| Artefato | Responsabilidade |
| --- | --- |
| `README.md` | O que construir e por quê |
| [`AGENTS.md`](AGENTS.md) | Como o agente deve trabalhar |
| [`TASKS.md`](TASKS.md) | O que fazer agora, em que ordem, em que estado e dentro de quais limites |
| [`docs/adr/`](docs/adr/ADRs.md) | Por que as decisões arquiteturais foram tomadas |
| [`docs/architecture/`](docs/architecture/overview.md) | Detalhamento da arquitetura |
| [`docs/diagrams/`](docs/diagrams/README.md) | Representações visuais |
| [`docs/`](docs/README.md) | Índice completo: planejamento, especificações de TASK, checkpoints e contratos de API |
