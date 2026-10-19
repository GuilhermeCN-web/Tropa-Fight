# ADR-001 — Arquitetura em camadas com monólito modular

## Status

PROPOSED

## Contexto

O Tropa Fight precisa concentrar catálogo, comércio, gestão de estoque, pedidos e administração em uma aplicação web responsiva, com possibilidade de evolução futura para uma experiência mobile. A V1 deve evitar complexidade operacional desnecessária.

## Problema

Separar responsabilidades e preservar a manutenção do sistema sem introduzir a sobrecarga de múltiplos serviços antes de existir necessidade comprovada.

## Alternativas consideradas

1. Monólito modular em camadas.
2. Microserviços separados por domínio.
3. Backend monolítico sem fronteiras explícitas.

## Decisão

Adotar um monólito modular organizado em camadas: apresentação, aplicação, domínio e infraestrutura. Os módulos devem representar áreas do negócio, como identidade, catálogo, estoque, carrinho, pedidos, pagamentos, logística e administração.

Integrações externas e tarefas assíncronas devem ser acessadas por portas e adaptadores.

## Justificativa

A abordagem reduz o custo operacional inicial, permite consistência transacional nas operações comerciais e mantém fronteiras que possibilitam a extração futura de módulos.

## Consequências

Os módulos não devem depender diretamente de detalhes de infraestrutura. Regras de negócio permanecem no domínio ou na aplicação, conforme sua responsabilidade. A linguagem, o framework e a infraestrutura de hospedagem continuam pendentes de definição.

## RF/RN/RNF/UC relacionados

RF de catálogo, comércio, estoque, pedidos e administração; RNF de manutenibilidade, segurança e integridade; UC de compra e gestão administrativa.

---

# ADR-002 — Separação entre domínio, aplicação, apresentação e infraestrutura

## Status

PROPOSED

## Contexto

O sistema precisa permitir a evolução independente das regras de negócio, da interface e das integrações externas.

## Problema

Evitar que componentes visuais, controladores ou bibliotecas externas concentrem regras comerciais e tornem o sistema difícil de testar ou modificar.

## Alternativas consideradas

1. Separação explícita em camadas com dependências controladas.
2. Organização por tipo de arquivo, sem fronteiras arquiteturais.
3. Regras de negócio distribuídas entre interface e banco de dados.

## Decisão

Adotar as seguintes responsabilidades:

* **Apresentação:** páginas, componentes, formulários e interação com o usuário.
* **Aplicação:** casos de uso, coordenação de operações e transações.
* **Domínio:** entidades, regras, políticas e invariantes do negócio.
* **Infraestrutura:** persistência, serviços externos, mensageria, arquivos e implementações técnicas.

A camada de domínio não deve depender das camadas externas.

## Justificativa

A separação reduz acoplamento, facilita testes e protege as regras comerciais de mudanças em frameworks, provedores e interfaces.

## Consequências

Novos recursos devem respeitar as fronteiras definidas. O acesso à persistência e a serviços externos deve ocorrer por contratos explícitos. A estrutura física de pastas será definida na arquitetura técnica.

## RF/RN/RNF/UC relacionados

Requisitos de catálogo, estoque, pedidos, pagamentos e administração; RNF de manutenibilidade e testabilidade; casos de uso transversais.

---

# ADR-003 — Banco de dados relacional como fonte transacional do sistema

## Status

PROPOSED

## Contexto

O Tropa Fight possui relações entre clientes, endereços, produtos, variantes, estoque, carrinhos, pedidos, pagamentos e entregas. Essas informações precisam manter consistência.

## Problema

Definir uma estratégia de persistência que preserve integridade referencial e suporte operações comerciais concorrentes.

## Alternativas consideradas

1. Banco de dados relacional como persistência principal.
2. Banco de dados NoSQL como persistência principal.
3. Persistência poliglota desde a V1.

## Decisão

Adotar um banco de dados relacional como fonte principal dos dados transacionais. O mecanismo específico será escolhido durante a definição da stack.

O modelo deverá contemplar chaves, restrições, índices, migrações e transações.

## Justificativa

As relações e invariantes do comércio eletrônico se beneficiam de transações e integridade referencial. Uma persistência principal única reduz a complexidade operacional da V1.

## Consequências

O esquema deverá evoluir por migrações versionadas. Operações críticas de estoque e pedidos deverão usar transações apropriadas. Cache ou mecanismos de busca adicionais não poderão substituir a fonte transacional sem uma decisão arquitetural específica.

## RF/RN/RNF/UC relacionados

Requisitos de cadastro, catálogo, estoque, carrinho, pedidos e pagamentos; RNF de integridade, consistência e recuperação.

---

# ADR-004 — Catálogo com produtos, variantes e SKUs

## Status

PROPOSED

## Contexto

O Tropa Fight comercializará produtos físicos de luta e treinamento. Alguns produtos podem apresentar variações como tamanho, cor ou modelo, e essas variações podem possuir preços e estoques distintos.

## Problema

Representar produtos e suas variações sem duplicar informações comerciais ou comprometer o controle individual de estoque.

## Alternativas consideradas

1. Produto com variantes identificadas por SKU.
2. Cada variação cadastrada como produto completamente independente.
3. Produto único com atributos livres, sem identidade individual para cada variante.

## Decisão

Adotar, como proposta, uma estrutura de produto com variantes comercializáveis. Cada variante deverá possuir identidade própria e SKU único, quando aplicável. Preço, disponibilidade e estoque deverão ser associados à unidade comercial correta.

Os atributos obrigatórios, a política de SKU e as regras para produtos sem variantes precisam ser validados no levantamento do catálogo.

## Justificativa

A modelagem permite apresentar um produto de forma unificada ao cliente e controlar individualmente opções que afetam preço, disponibilidade ou separação do pedido.

## Consequências

O catálogo deverá distinguir produto, variante e SKU. Carrinho, pedido e estoque deverão referenciar a variante efetivamente selecionada. A lista definitiva de atributos e a política de geração de SKU permanecem pendentes.

## RF/RN/RNF/UC relacionados

RF de catálogo, busca, filtros e detalhe do produto; RN de identificação e seleção de variantes; RNF de integridade; UC de manutenção do catálogo e compra.

---

# ADR-005 — Estoque com controle transacional por item comercializável

## Status

PROPOSED

## Contexto

O sistema precisa impedir vendas inconsistentes quando vários clientes tentam comprar simultaneamente uma mesma variante.

## Problema

Definir como controlar disponibilidade e concorrência sem permitir que pedidos confirmados ultrapassem o estoque vendável.

## Alternativas consideradas

1. Controle transacional de estoque por variante, com política explícita de reserva e baixa.
2. Atualização simples de quantidade sem controle de concorrência.
3. Estoque mantido apenas no painel administrativo, sem validação no checkout.

## Decisão

Adotar controle de estoque por variante/SKU, com validação no momento das operações comerciais críticas. As alterações deverão ser atômicas e registrar movimentações relevantes.

A política exata de reserva, expiração, baixa, cancelamento e recomposição do estoque deverá ser definida antes da implementação do checkout.

## Justificativa

O controle transacional reduz o risco de venda acima da disponibilidade e permite auditar alterações de estoque.

## Consequências

O estoque não poderá ser alterado apenas por uma verificação isolada na interface. A implementação deverá tratar concorrência, falhas parciais e repetição de operações. A estratégia definitiva de reserva e baixa permanece pendente.

## RF/RN/RNF/UC relacionados

RF de estoque, catálogo, carrinho, checkout e pedidos; RN de disponibilidade e movimentação; RNF de integridade e concorrência; UC de compra e gestão de estoque.

---

# ADR-006 — Carrinho persistente associado ao cliente e à sessão

## Status

PROPOSED

## Contexto

O cliente precisa selecionar produtos e variantes, alterar quantidades e continuar a compra antes de concluir o pedido.

## Problema

Definir como manter o carrinho durante a navegação, autenticação e retorno do cliente, sem tratar seu conteúdo como garantia de estoque ou preço final.

## Alternativas consideradas

1. Carrinho persistente no servidor, associado à conta ou a uma sessão.
2. Carrinho mantido exclusivamente no navegador.
3. Carrinho criado somente no momento do checkout.

## Decisão

Adotar um carrinho persistente no servidor, associado ao cliente autenticado ou a uma sessão identificável. A eventual mesclagem entre carrinho anônimo e autenticado deverá seguir uma regra explícita.

O carrinho não garantirá reserva de estoque nem congelamento de preço. Preço, disponibilidade, descontos e frete deverão ser revalidados antes da confirmação do pedido.

## Justificativa

A persistência no servidor favorece continuidade entre sessões e dispositivos, além de permitir validação consistente das informações comerciais.

## Consequências

A interface deverá refletir falhas de validação e alterações de disponibilidade. A política de expiração e mesclagem de carrinhos deverá ser definida. O servidor será responsável por validar os valores utilizados no checkout.

## RF/RN/RNF/UC relacionados

RF de carrinho, autenticação, catálogo e checkout; RN de revalidação comercial; RNF de integridade; UC de montar carrinho e iniciar compra.

---

# ADR-007 — Checkout com validação centralizada no servidor

## Status

PROPOSED

## Contexto

O checkout reúne endereço, itens, quantidades, descontos, frete, valores e condições comerciais antes da criação do pedido.

## Problema

Evitar que dados manipulados no cliente, alterações de preço ou mudanças de estoque produzam pedidos inconsistentes.

## Alternativas consideradas

1. Checkout validado no servidor com cálculo autoritativo.
2. Checkout baseado nos valores calculados exclusivamente no navegador.
3. Criação do pedido com validação posterior e correção manual.

## Decisão

Adotar um fluxo de checkout no qual o servidor revalida os itens, variantes, preços, descontos, endereço, frete e disponibilidade. Os totais enviados pelo cliente não serão considerados fonte confiável.

A criação do pedido deverá registrar um retrato consistente dos dados comerciais utilizados na compra.

## Justificativa

A validação centralizada reduz fraude por manipulação de dados e divergências entre o valor apresentado e o valor efetivamente cobrado.

## Consequências

O backend será responsável pelo cálculo final. O cliente deverá receber erros claros quando houver alterações ou inconsistências. O checkout deverá integrar-se às políticas de estoque, cupons, pagamentos e logística.

## RF/RN/RNF/UC relacionados

RF de carrinho, cupons, endereço, frete, checkout e pedidos; RN de cálculo e validação; RNF de segurança e integridade; UC de finalizar compra.

---

# ADR-008 — Integração de pagamentos por adaptador de provedor

## Status

PROPOSED

## Contexto

O Tropa Fight precisa receber pagamentos de pedidos físicos, mas o gateway e os meios de pagamento da V1 ainda não foram definidos.

## Problema

Integrar pagamentos sem acoplar as regras do domínio a um provedor específico e sem considerar uma resposta do navegador como confirmação financeira.

## Alternativas consideradas

1. Contrato interno de pagamentos com adaptador para o provedor escolhido.
2. Integração direta do provedor em todos os módulos comerciais.
3. Registro manual de pagamentos como estratégia principal.

## Decisão

Adotar uma porta de pagamento na camada de aplicação/infraestrutura, com adaptador para o gateway selecionado. O estado financeiro deverá ser atualizado por respostas verificáveis do provedor, como webhooks autenticados ou consultas confiáveis à API.

O gateway, os meios de pagamento e os requisitos de conciliação permanecem pendentes.

## Justificativa

O adaptador reduz o acoplamento e permite substituir ou ampliar provedores sem reescrever as regras centrais de pedidos.

## Consequências

A integração deverá tratar idempotência, confirmação assíncrona, falhas, estornos e divergências de estado. Nenhum pedido deverá ser considerado pago apenas porque o cliente retornou à página de sucesso.

## RF/RN/RNF/UC relacionados

RF de checkout, pagamentos e pedidos; RN de confirmação financeira; RNF de segurança, integridade e rastreabilidade; UC de pagar e acompanhar pedido.

---

# ADR-009 — Ciclo de vida do pedido separado do estado do pagamento

## Status

PROPOSED

## Contexto

Um pedido pode passar por diferentes etapas comerciais e logísticas, enquanto seu pagamento possui um ciclo de vida próprio.

## Problema

Evitar que o estado do pedido seja confundido com o estado financeiro ou que transições inválidas permitam expedição, cancelamento ou cobrança indevidos.

## Alternativas consideradas

1. Estados separados para pedido, pagamento e entrega.
2. Um único estado compartilhado para todas as etapas.
3. Estados livres alterados manualmente sem transições definidas.

## Decisão

Adotar estados separados para pedido, pagamento e entrega, com transições explícitas e validações no servidor.

O modelo definitivo deverá contemplar, conforme os fluxos aprovados, criação, aguardando pagamento, confirmação, preparação, envio, entrega, cancelamento e devolução. Os estados financeiros deverão distinguir, no mínimo, situações relevantes como pendente, confirmado, falho e estornado, conforme suporte do gateway.

## Justificativa

A separação permite representar situações reais sem misturar eventos financeiros com etapas de separação e transporte.

## Consequências

As transições deverão ser documentadas e testadas. Operações administrativas críticas deverão gerar rastreabilidade. As regras de cancelamento, devolução, reembolso e recomposição do estoque permanecem pendentes de validação.

## RF/RN/RNF/UC relacionados

RF de pedidos, pagamentos, logística e administração; RN de transição de estados; RNF de integridade e auditoria; UC de acompanhamento e gestão de pedidos.

---

# ADR-010 — Integração logística desacoplada do domínio de pedidos

## Status

PROPOSED

## Contexto

O Tropa Fight precisará calcular ou informar frete, registrar dados de entrega e acompanhar o envio dos produtos físicos. Transportadoras e estratégia logística ainda não foram escolhidas.

## Problema

Integrar cotações e rastreamento sem tornar o domínio de pedidos dependente de uma transportadora específica.

## Alternativas consideradas

1. Porta logística com adaptadores para os provedores selecionados.
2. Integração direta de uma transportadora no módulo de pedidos.
3. Cálculo e acompanhamento inteiramente manuais.

## Decisão

Adotar uma abstração logística que permita consultar opções de entrega, registrar a modalidade selecionada e armazenar os dados de envio e rastreamento.

A transportadora, a origem de cálculo do frete, a estratégia de etiquetas e a cobertura de entrega permanecem pendentes.

## Justificativa

O desacoplamento permite substituir ou combinar provedores e mantém o domínio de pedidos independente das particularidades de integração.

## Consequências

O sistema deverá preservar a opção de entrega e o valor acordado no momento da compra. Falhas de cotação ou rastreamento deverão ser tratadas sem corromper o pedido. O contrato de integração será definido após a escolha logística.

## RF/RN/RNF/UC relacionados

RF de endereço, frete, checkout, pedidos e rastreamento; RN de cálculo e seleção de entrega; RNF de resiliência; UC de cotar frete e acompanhar entrega.

---

# ADR-011 — Autorização administrativa baseada em papéis e permissões

## Status

PROPOSED

## Contexto

A administração do Tropa Fight prevê diferentes responsabilidades, incluindo administração geral e gestão de catálogo.

## Problema

Restringir o acesso a operações administrativas conforme a responsabilidade do usuário, evitando que qualquer conta administrativa execute todas as ações.

## Alternativas consideradas

1. Controle de acesso baseado em papéis e permissões.
2. Um único perfil administrativo com acesso total.
3. Regras de autorização implementadas isoladamente em cada tela.

## Decisão

Adotar controle de acesso baseado em papéis e permissões, validado no servidor. A V1 deverá contemplar, no mínimo, os perfis administrativos já identificados: administrador geral e gestor de catálogo.

As permissões específicas de cada papel deverão ser documentadas e aprovadas antes da implementação.

## Justificativa

A autorização centralizada reduz acessos indevidos e permite ampliar os perfis administrativos sem replicar regras em cada componente da interface.

## Consequências

Ocultar ações na interface não será considerado controle de segurança suficiente. Cada operação administrativa deverá validar a permissão correspondente no backend. Alterações sensíveis deverão ser rastreáveis.

## RF/RN/RNF/UC relacionados

RF de administração, catálogo, estoque, pedidos e usuários administrativos; RN de autorização; RNF de segurança e auditoria; UC de gestão administrativa.

---

# ADR-012 — Autenticação centralizada e proteção de dados pessoais

## Status

PROPOSED

## Contexto

O sistema precisa permitir que clientes acessem suas contas, endereços e pedidos, além de restringir o acesso às funcionalidades administrativas.

## Problema

Estabelecer autenticação segura e impedir acesso indevido a dados pessoais ou recursos de outros usuários.

## Alternativas consideradas

1. Autenticação centralizada na aplicação, com mecanismos seguros de sessão ou tokens.
2. Autenticação implementada separadamente em cada módulo.
3. Acesso baseado apenas em identificadores enviados pelo cliente.

## Decisão

Adotar um mecanismo centralizado de autenticação e autorização. Cada operação que envolva dados pessoais, endereços ou pedidos deverá verificar a identidade e a autorização do solicitante.

A tecnologia de autenticação, o provedor de identidade e as políticas específicas de sessão serão definidos durante a escolha da stack e o detalhamento de segurança.

## Justificativa

A centralização evita regras inconsistentes de autenticação e estabelece um ponto comum para aplicar controles de acesso.

## Consequências

Credenciais e tokens deverão ser tratados de forma segura. O sistema deverá prever recuperação de acesso e proteção contra tentativas abusivas. A política de retenção de dados e os procedimentos operacionais de privacidade deverão ser especificados.

## RF/RN/RNF/UC relacionados

RF de cadastro, login, recuperação de acesso, perfil, pedidos e administração; RN de acesso aos próprios dados; RNF de segurança e privacidade; UC de autenticação e consulta de pedidos.

---

# ADR-013 — Operações assíncronas para integrações e tarefas demoradas

## Status

PROPOSED

## Contexto

Pagamentos, notificações, atualizações logísticas e tarefas administrativas podem depender de serviços externos ou de operações demoradas.

## Problema

Evitar que falhas temporárias de integrações bloqueiem o fluxo principal ou provoquem repetição inconsistente de efeitos comerciais.

## Alternativas consideradas

1. Processamento assíncrono para tarefas apropriadas, com mecanismo de fila.
2. Execução síncrona de todas as operações na requisição do usuário.
3. Execução manual de tarefas de integração.

## Decisão

Adotar processamento assíncrono para tarefas que não precisem concluir dentro da requisição principal, como notificações e processamento de eventos externos.

Operações assíncronas que afetem pedidos, pagamentos ou estoque deverão ser idempotentes, observáveis e passíveis de retentativa controlada.

A tecnologia de fila e o padrão de publicação de eventos serão definidos na arquitetura técnica.

## Justificativa

O processamento assíncrono melhora a resiliência e reduz a dependência de disponibilidade imediata de serviços externos.

## Consequências

A arquitetura deverá tratar falhas, duplicidade, retentativas e mensagens que não possam ser processadas. A consistência entre transações e publicação de eventos deverá ser definida tecnicamente antes da implementação.

## RF/RN/RNF/UC relacionados

RF de pagamentos, pedidos, logística e notificações; RN de processamento e idempotência; RNF de resiliência e observabilidade; UC de confirmação e acompanhamento de pedido.

---

# ADR-014 — Observabilidade e auditoria para operações críticas

## Status

PROPOSED

## Contexto

O Tropa Fight precisará diagnosticar falhas e rastrear operações relacionadas a estoque, pedidos, pagamentos e administração.

## Problema

Garantir que erros técnicos e alterações comerciais relevantes possam ser investigados sem depender de registros dispersos ou de informações exibidas apenas na interface.

## Alternativas consideradas

1. Logs estruturados, métricas e trilhas de auditoria para eventos críticos.
2. Logs de texto sem padronização.
3. Ausência de registros além dos dados persistidos nas telas.

## Decisão

Adotar logs estruturados e mecanismos de observabilidade compatíveis com a stack selecionada. Operações administrativas e transições comerciais críticas deverão produzir registros de auditoria apropriados.

Os registros não deverão armazenar senhas, tokens ou dados pessoais desnecessários.

## Justificativa

A observabilidade permite identificar falhas e acompanhar o comportamento do sistema. A auditoria auxilia a investigação de alterações relevantes em dados comerciais.

## Consequências

Deverão ser definidos eventos auditáveis, níveis de log, retenção, acesso e alertas. Logs técnicos não substituirão o histórico de negócio. A ferramenta específica permanece pendente.

## RF/RN/RNF/UC relacionados

RF de administração, estoque, pedidos e pagamentos; RN de rastreabilidade; RNF de observabilidade, segurança e manutenibilidade; UC de gestão e suporte operacional.

---

# ADR-015 — Testes automatizados e critérios de qualidade por camada

## Status

PROPOSED

## Contexto

O sistema possui regras comerciais sensíveis a erros, como preço, estoque, cupons, pagamento e transições de pedido.

## Problema

Definir uma estratégia de validação que detecte regressões sem depender exclusivamente de testes manuais no fim do desenvolvimento.

## Alternativas consideradas

1. Testes unitários, de integração e ponta a ponta, distribuídos conforme o risco.
2. Apenas testes manuais.
3. Apenas testes unitários, sem validar integrações e fluxos completos.

## Decisão

Adotar uma estratégia de testes em camadas:

* Testes unitários para regras de domínio e cálculos.
* Testes de integração para persistência, transações e adaptadores.
* Testes de ponta a ponta para os principais fluxos do cliente e da administração.

Os critérios de aceite e os Quality Gates deverão ser aplicados antes da conclusão de cada tarefa relevante.

## Justificativa

A combinação de níveis de teste reduz o risco de regressões e valida tanto regras isoladas quanto o comportamento integrado do sistema.

## Consequências

Cada tarefa deverá definir critérios verificáveis e testes compatíveis com o risco. Fluxos críticos — como checkout, estoque e pagamento — exigirão cobertura de cenários de falha e concorrência. Ferramentas e metas quantitativas de cobertura serão definidas com a stack.

## RF/RN/RNF/UC relacionados

Todos os requisitos funcionais e regras de negócio; RNF de qualidade, confiabilidade e manutenibilidade; casos de uso críticos do cliente e da administração.

---

# ADR-016 — Interface responsiva como estratégia inicial de experiência

## Status

PROPOSED

## Contexto

O Tropa Fight deve oferecer uma experiência de compra e administração acessível em diferentes tamanhos de tela. A estratégia de distribuição mobile ainda não foi definida.

## Problema

Atender usuários em dispositivos móveis e desktops sem assumir, prematuramente, o custo de manter aplicações nativas separadas.

## Alternativas consideradas

1. Aplicação web responsiva como experiência inicial.
2. Aplicações nativas para Android e iOS desde a V1.
3. Web responsiva e aplicativos nativos desenvolvidos simultaneamente.

## Decisão

Adotar uma aplicação web responsiva como estratégia inicial proposta para a V1. A arquitetura deverá manter os contratos de aplicação organizados para que outras interfaces possam ser adicionadas futuramente, caso aprovadas.

A necessidade de aplicativo nativo, PWA ou outros canais deverá ser validada no escopo do produto.

## Justificativa

A abordagem responsiva permite atender diferentes dispositivos com uma única experiência inicial e reduz o esforço de desenvolvimento e manutenção.

## Consequências

As interfaces deverão ser projetadas para diferentes resoluções e formas de interação. A decisão não impede uma aplicação mobile futura, mas essa entrega não será considerada incluída automaticamente no escopo da V1.

## RF/RN/RNF/UC relacionados

RF de navegação, catálogo, carrinho, checkout e administração; RNF de usabilidade, acessibilidade e responsividade; UC de compra e gestão em diferentes dispositivos.

---

# ADR-017 — Configuração externa para parâmetros comerciais variáveis

## Status

PROPOSED

## Contexto

O Tropa Fight poderá possuir parâmetros comerciais que mudam ao longo do tempo, como limites de cupons, opções de entrega, regras promocionais e configurações operacionais.

## Problema

Evitar que alterações comerciais comuns exijam mudanças dispersas no código ou novo deploy, sem permitir que regras críticas sejam alteradas sem controle.

## Alternativas consideradas

1. Configurações persistidas e validadas, com acesso administrativo autorizado.
2. Parâmetros comerciais codificados diretamente em diversos módulos.
3. Configuração livre, sem validação ou trilha de alteração.

## Decisão

Adotar uma abordagem explícita para configurações comerciais que realmente precisem ser administráveis. Cada parâmetro deverá possuir validação, valor padrão definido e autorização adequada para alteração.

Regras críticas de preço, pagamento e estoque não poderão depender de valores arbitrários enviados pelo cliente.

## Justificativa

A configuração centralizada reduz duplicidade e facilita a manutenção, preservando controles sobre parâmetros que afetam operações comerciais.

## Consequências

Será necessário identificar quais configurações serão editáveis na V1, quem poderá alterá-las e como suas mudanças serão auditadas. Não será criado um mecanismo genérico de configuração para parâmetros que não tenham necessidade comprovada.

## RF/RN/RNF/UC relacionados

RF de administração, cupons, catálogo, estoque e logística; RN de validação de parâmetros; RNF de segurança, integridade e manutenibilidade; UC de configuração administrativa.

---

# ADR-018 — Versionamento de contratos e evolução controlada do sistema

## Status

PROPOSED

## Contexto

O Tropa Fight deverá evoluir durante o desenvolvimento e após a entrega inicial, podendo receber novas interfaces, integrações e funcionalidades.

## Problema

Evitar que mudanças em contratos internos ou externos provoquem regressões difíceis de identificar ou quebrem consumidores existentes.

## Alternativas consideradas

1. Contratos explícitos e evolução compatível sempre que possível.
2. Alterações livres de contratos sem validação de impacto.
3. Versionamento completo de todos os contratos, independentemente da necessidade.

## Decisão

Adotar contratos explícitos para integrações e interfaces entre módulos. Mudanças deverão avaliar compatibilidade, consumidores afetados, migrações e necessidade de versionamento.

O versionamento de APIs externas deverá seguir a estratégia definida para a stack e para os consumidores efetivamente existentes.

## Justificativa

A abordagem permite evolução gradual, reduz mudanças incompatíveis e mantém a rastreabilidade das decisões técnicas.

## Consequências

Alterações relevantes deverão ser registradas e testadas. Migrações de dados e mudanças de contrato deverão possuir plano de execução e recuperação compatível com o risco. O padrão definitivo de versionamento permanece pendente.

## RF/RN/RNF/UC relacionados

Requisitos transversais; RNF de manutenibilidade, compatibilidade e confiabilidade; UC que dependam de integrações ou contratos entre módulos.
