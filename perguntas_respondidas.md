# Tropa Fight

Este documento contém as perguntas utilizadas para elicitar e validar os requisitos da Tropa Fight.

As respostas devem representar decisões reais do projeto. Informações ainda não decididas devem permanecer como **PENDENTES** e não devem ser preenchidas por suposição.

---

# Rodada 1 — Escopo comercial e operação da V1

## 1. Quais produtos serão vendidos na Tropa Fight na V1?

**R:**

A Tropa Fight venderá produtos relacionados a:

- artes marciais;
- esportes de combate;
- treinamento físico.

Ainda precisamos definir o catálogo inicial.

**Pergunta:** quais categorias de produtos estarão efetivamente disponíveis na V1?

Por exemplo:

- luvas;
- bandagens;
- caneleiras;
- protetores;
- quimonos;
- roupas;
- calçados;
- equipamentos de treino;
- acessórios;
- suplementos;
- outros.

## 2. A Tropa Fight venderá somente produtos físicos?

**R:**

O escopo atual indica equipamentos, vestuário e acessórios físicos.

Porém, isso ainda precisa ser confirmado como regra comercial da V1.

**Pergunta:** a V1 terá somente produtos físicos ou também poderá vender produtos digitais, cursos, conteúdos ou serviços?

## 3. A Tropa Fight terá venda para pessoa física, pessoa jurídica ou ambas?

**R:**

Ainda não definido.

**Pergunta:** quem poderá realizar compras?

- somente pessoa física;
- pessoa física e pessoa jurídica;
- outro modelo.

## 4. A loja atenderá todo o Brasil?

**R:**

A documentação atual não define explicitamente as regiões atendidas.

**Pergunta:** a Tropa Fight venderá para todo o território brasileiro na V1 ou haverá regiões não atendidas?

## 5. Haverá retirada física?

**R:**

A retirada física aparece como pendência.

**Pergunta:** a V1 terá retirada em loja/ponto físico ou somente entrega?

## 6. Haverá venda para menores de idade?

**R:**

Ainda não definido.

**Pergunta:** clientes menores de idade poderão criar conta e comprar produtos ou a compra será restrita a maiores de 18 anos?

## 7. Haverá limite de quantidade por produto?

**R:**

A documentação define controle de estoque, mas não define limite comercial por cliente.

**Pergunta:** haverá limite de unidades por cliente/pedido?

Exemplo:

> Máximo de 5 unidades da mesma variante por pedido.

Ou não haverá limite além do estoque disponível?

---

# Rodada 2 — Cadastro e conta do cliente

## 1. Quais dados serão obrigatórios no cadastro?

**R:**

O modelo atual considera:

- nome;
- e-mail;
- senha;
- dados necessários para a conta.

Porém, os campos obrigatórios ainda precisam ser definidos.

**Pergunta:** quais dados serão obrigatórios?

Por exemplo:

- nome completo;
- CPF;
- telefone;
- data de nascimento;
- e-mail;
- senha.

## 2. O e-mail deverá ser confirmado?

**R:**

A documentação exige autenticação e recuperação de acesso, mas não determina confirmação obrigatória de e-mail.

**Pergunta:** o cliente precisará confirmar o e-mail antes de:

- acessar a conta;
- adicionar produtos ao carrinho;
- iniciar checkout;
- concluir uma compra?

## 3. O CPF será obrigatório?

**R:**

Ainda não definido.

**Pergunta:** CPF será obrigatório para cadastro ou somente durante o checkout?

## 4. O cliente poderá alterar o CPF?

**R:**

Ainda não definido.

**Pergunta:** depois de cadastrado, o CPF poderá ser alterado pelo cliente?

## 5. Quais dados o cliente poderá alterar?

**R:**

O cliente deverá conseguir gerenciar os próprios dados permitidos.

**Pergunta:** quais poderão ser alterados?

- nome;
- telefone;
- e-mail;
- CPF;
- data de nascimento;
- senha.

## 6. O cliente poderá possuir mais de um endereço?

**R:**

O modelo possui `addresses` associado ao cliente.

**Pergunta:** um cliente poderá cadastrar múltiplos endereços e escolher um deles durante o checkout?

---

# Rodada 3 — Catálogo e produtos

## 1. Como será estruturado um produto?

**R:**

O produto poderá possuir:

- nome;
- descrição;
- marca;
- categoria;
- imagens;
- preço;
- disponibilidade;
- variantes;
- SKU.

**Pergunta:** quais informações deverão ser obrigatórias em um produto?

## 2. Quais tipos de variantes existirão?

**R:**

A documentação prevê variantes como:

- tamanho;
- cor;
- peso;
- modelo;
- outras características.

**Pergunta:** quais atributos de variante serão suportados na V1?

Exemplo:

```text
Luva de Boxe
├── 10 oz / Preto
├── 12 oz / Preto
├── 14 oz / Preto
├── 10 oz / Vermelho
└── 12 oz / Vermelho
````

 ## 3\. Cada variante terá seu próprio SKU?

 **R:**

 O modelo prevê SKU em `product_variants`.

 **Pergunta:** o SKU será obrigatório e único para cada variante?

 ## 4\. O preço pertence ao produto ou à variante?

 **R:**

 A documentação permite preço no produto e menciona preço em `product_variants`.

 **Pergunta:** qual será a regra?

 Exemplo:

```
Luva X
10 oz → R$ 100
12 oz → R$ 110
14 oz → R$ 120
```

 Ou todas as variantes obrigatoriamente possuem o mesmo preço?

 ## 5\. O estoque será controlado por produto ou variante?

 **R:**

 O modelo atual relaciona `Inventory` com `ProductVariant`.

 **Pergunta:** cada variante terá estoque independente?

 Exemplo:

```
Luva X
10 oz → 5 unidades
12 oz → 2 unidades
14 oz → 0 unidades
```

 ## 6\. Produtos podem ser vendidos sem estoque?

 **R:**

 A regra atual impede operações que resultem em estoque inconsistente.

 **Pergunta:** produto sem estoque poderá receber pedidos em pré-venda/backorder ou ficará simplesmente indisponível?

 ## 7\. Como produtos inativados serão tratados?

 **R:**

 A regra RN-006 determina que produtos inativados não sejam disponibilizados para novas compras, mas pedidos históricos devem preservar suas informações.

 **Pergunta:** produto inativado continuará aparecendo:

 - em pedidos antigos;
- em avaliações;
- em favoritos;
- nos resultados administrativos?

---

 # Rodada 4 — Estoque

 ## 1\. Quando o estoque será reservado?

 **R:**

 Essa é uma pendência explícita:

 > **RN-PD-001 — Momento exato da reserva/baixa de estoque.**

 **Pergunta:** qual será a estratégia?

 Opções:

 - **A)** Reserva ao adicionar ao carrinho
- **B)** Reserva ao iniciar checkout
- **C)** Reserva ao criar pagamento
- **D)** Reserva ao confirmar pagamento
- **E)** Outra

 ## 2\. Por quanto tempo uma reserva poderá permanecer ativa?

 **R:**

 A documentação possui pagamento pendente, mas não define prazo de reserva.

 **Pergunta:** uma unidade reservada durante o checkout/pagamento será liberada após quanto tempo?

 ## 3\. O estoque será incrementado automaticamente após cancelamento/reembolso?

 **R:**

 A regra de cancelamento, devolução e reembolso ainda está pendente.

 **Pergunta:** quando um pedido for cancelado ou reembolsado, o estoque deverá ser automaticamente restaurado?

 ## 4\. Como serão realizados ajustes manuais?

 **R:**

 Usuários autorizados poderão registrar movimentações.

 **Pergunta:** todo ajuste manual deverá exigir:

 - quantidade;
- tipo;
- motivo;
- usuário responsável;
- observação?

 ## 5\. Haverá estoque mínimo?

 **R:**

 A documentação prevê controle de estoque, mas não define alerta de estoque baixo.

 **Pergunta:** a V1 terá alerta de estoque mínimo por produto/variante?

---

 # Rodada 5 — Carrinho e checkout

 ## 1\. O carrinho será persistente?

 **R:**

 Ainda não definido.

 **Pergunta:** um cliente autenticado poderá sair da aplicação e retornar posteriormente encontrando o mesmo carrinho?

 ## 2\. Um produto sem estoque pode permanecer no carrinho?

 **R:**

 Ainda não definido.

 **Pergunta:** se um produto ficar sem estoque depois de ser adicionado ao carrinho, o sistema deverá:

 - removê-lo automaticamente;
- mantê-lo e bloquear o checkout;
- informar indisponibilidade e exigir remoção?

 ## 3\. O preço do carrinho será atualizado automaticamente?

 **R:**

 A regra RN-012 determina que pedidos confirmados preservem seus preços, mas não define o comportamento do carrinho.

 **Pergunta:** se o preço mudar enquanto o produto estiver no carrinho, o cliente verá:

 - o preço antigo;
- o novo preço;
- aviso de alteração antes do checkout?

 ## 4\. Quando o preço do pedido será definitivamente capturado?

 **R:**

 A regra RN-005 exige que o preço utilizado no pedido seja preservado no momento adequado.

 **Pergunta:** esse momento será:

 - criação do pedido;
- confirmação do pagamento;
- outra etapa?

 ## 5\. O checkout permitirá compra sem cadastro?

 **R:**

 O modelo atual possui contas de clientes e pedidos associados a clientes.

 **Pergunta:** haverá checkout como visitante ou toda compra exigirá conta?

---

 # Rodada 6 — Pagamentos

 ## 1\. Quais meios de pagamento existirão na V1?

 **R:**

 A documentação ainda deixa os meios de pagamento pendentes.

 **Pergunta:** quais métodos serão aceitos?

 Por exemplo:

 - Pix;
- cartão de crédito;
- cartão de débito;
- boleto;
- outros.

 ## 2\. Qual gateway será utilizado?

 **R:**

 Ainda não definido.

 **Pergunta:** existe algum provedor já escolhido ou devemos deixar a escolha para um ADR?

 ## 3\. Quando um pedido será considerado pago?

 **R:**

 RN-011 determina que o pedido não poderá ser considerado pago apenas por informação enviada pelo cliente.

 **Pergunta:** a confirmação definitiva virá exclusivamente do provedor de pagamento através de webhook/evento confirmado?

 ## 4\. Como serão tratados pagamentos pendentes?

 **R:**

 O sistema deverá acompanhar estados de pagamento.

 **Pergunta:** quais estados serão necessários?

 Por exemplo:

```
pending
authorized
paid
failed
expired
cancelled
refunded
partially_refunded
```

 ## 5\. Haverá pagamento parcial?

 **R:**

 Ainda não definido.

 **Pergunta:** a V1 permitirá pagamentos parciais ou cada pedido deverá possuir uma única confirmação integral?

---

 # Rodada 7 — Pedidos, cancelamentos e reembolsos

 ## 1\. Quais serão os estados definitivos do pedido?

 **R:**

 Atualmente existe apenas a exigência de que o pedido possua estados consistentes com pagamento e entrega.

 **Pergunta:** quais estados você deseja?

 Uma possibilidade seria:

```
aguardando_pagamento
pagamento_confirmado
em_separacao
enviado
em_transito
entregue
cancelado
reembolsado
```

 > Essa lista não deve ser considerada definida até confirmação.

 ## 2\. Quando o cliente poderá cancelar um pedido?

 **R:**

 A política de cancelamento ainda está pendente.

 **Pergunta:** o cliente poderá cancelar:

 - antes do pagamento;
- após pagamento;
- antes da expedição;
- depois da expedição;
- somente mediante atendimento?

 ## 3\. Haverá reembolso parcial?

 **R:**

 A documentação menciona reembolsos, mas não define sua granularidade.

 **Pergunta:** será possível reembolsar somente alguns itens de um pedido?

 ## 4\. Haverá troca?

 **R:**

 A política de troca está pendente.

 **Pergunta:** a V1 terá troca de produtos ou apenas cancelamento/devolução/reembolso?

 ## 5\. Como será tratado um pedido parcialmente enviado?

 **R:**

 Ainda não definido.

 **Pergunta:** um pedido poderá ser enviado em múltiplos volumes/remessas?

---

 # Rodada 8 — Entrega

 ## 1\. Qual serviço calculará o frete?

 **R:**

 O sistema deverá integrar um serviço de entrega, mas o provedor ainda não foi definido.

 **Pergunta:** existe transportadora/serviço escolhido ou isso será definido posteriormente?

 ## 2\. Quais modalidades de entrega existirão?

 **R:**

 Ainda pendente.

 **Pergunta:** haverá:

 - econômica;
- expressa;
- retirada;
- outras?

 ## 3\. O frete será calculado em qual momento?

 **R:**

 O checkout deverá calcular frete.

 **Pergunta:** o cálculo dependerá de:

 - CEP;
- peso;
- dimensões;
- valor do pedido;
- quantidade;
- modalidade?

 ## 4\. Haverá frete grátis?

 **R:**

 A política está explicitamente pendente.

 **Pergunta:** haverá frete grátis na V1?

 Se sim, quais critérios?

 ## 5\. Haverá rastreamento?

 **R:**

 O rastreamento é previsto caso a integração escolhida o suporte.

 **Pergunta:** o rastreamento será obrigatório quando disponível ou opcional?

---

 # Rodada 9 — Cupons e promoções

 ## 1\. Quais tipos de desconto existirão?

 **R:**

 A documentação prevê:

 - cupons;
- promoções.

 **Pergunta:** os descontos poderão ser:

 - percentual;
- valor fixo;
- frete grátis;
- desconto por quantidade;
- desconto por categoria;
- desconto por marca;
- outros?

 ## 2\. Cupons poderão ser acumulados?

 **R:**

 A regra ainda está pendente.

 **Pergunta:** um pedido poderá utilizar mais de um cupom?

 ## 3\. Cupom poderá ser aplicado sobre frete?

 **R:**

 Ainda não definido.

 **Pergunta:** um cupom poderá reduzir o valor do frete?

 ## 4\. Promoções e cupons poderão coexistir?

 **R:**

 Ainda não definido.

 **Pergunta:** se um produto já estiver em promoção, um cupom também poderá ser aplicado?

 ## 5\. O administrador poderá limitar cupons por cliente?

 **R:**

 Ainda não definido.

 **Pergunta:** haverá regras como:

 - 1 uso por cliente;
- 1 uso por CPF;
- 1 uso por conta.

---

 # Rodada 10 — Avaliações e favoritos

 ## 1\. Quem poderá avaliar um produto?

 **R:**

 A documentação define que a avaliação será realizada por cliente elegível.

 **Pergunta:** somente quem efetivamente comprou o produto poderá avaliar?

 ## 2\. Quantas avaliações um cliente poderá fazer?

 **R:**

 Ainda não definido.

 **Pergunta:** o cliente poderá ter:

 - uma avaliação por produto;
- várias avaliações;
- uma avaliação por pedido?

 ## 3\. O cliente poderá editar sua avaliação?

 **R:**

 Ainda não definido.

 **Pergunta:** depois de publicar uma avaliação, ele poderá alterar nota/comentário?

 ## 4\. Quem poderá denunciar avaliações?

 **R:**

 Ainda não definido.

 **Pergunta:** somente clientes autenticados poderão denunciar ou qualquer visitante poderá denunciar?

 ## 5\. Como funcionará a moderação?

 **R:**

 Gestores e administradores poderão moderar avaliações.

 **Pergunta:** quais estados existirão?

 Por exemplo:

```
pendente
publicada
oculta
removida
```

---

 # Rodada 11 — Administração e permissões

 ## 1\. Os perfis administrativos atuais serão mantidos?

 **R:**

 A documentação propõe:

 - Administrador geral;
- Gestor de catálogo;
- Gestor de estoque;
- Atendimento;
- Financeiro.

 **Pergunta:** todos esses perfis existirão na V1 ou alguns serão removidos/consolidados?

 ## 2\. O administrador geral poderá fazer tudo?

 **R:**

 Atualmente ele possui acesso administrativo amplo.

 **Pergunta:** administrador geral terá acesso a todas as operações, incluindo:

 - clientes;
- estoque;
- pagamentos;
- reembolsos;
- pedidos;
- catálogo;
- usuários;
- auditoria?

 ## 3\. As permissões serão baseadas em papéis?

 **R:**

 O modelo possui:

 - `User`;
- `AdminUser`;
- `Role`;
- `Permission`.

 **Pergunta:** a V1 utilizará RBAC com permissões granulares, como:

```
product:create
product:update
inventory:adjust
order:refund
customer:read
```

 ## 4\. Um usuário administrativo poderá possuir múltiplos papéis?

 **R:**

 O modelo permite relação entre usuários e funções.

 **Pergunta:** um mesmo usuário poderá possuir múltiplos roles?

 ## 5\. O sistema poderá ficar sem administrador geral?

 **R:**

 Essa regra ainda não foi definida.

 **Pergunta:** devemos impedir a remoção/desativação do último administrador geral ativo?

---

 # Rodada 12 — Auditoria, segurança e LGPD

 ## 1\. Quais operações deverão obrigatoriamente gerar auditoria?

 **R:**

 A documentação exige auditoria de operações administrativas sensíveis.

 **Pergunta:** devemos registrar, no mínimo:

 - alteração de preço;
- alteração de estoque;
- alteração de produto;
- cancelamento;
- reembolso;
- alteração de permissões;
- criação/bloqueio de administrador;
- alteração de cupom;
- moderação de avaliação?

 ## 2\. O log de auditoria poderá ser alterado?

 **R:**

 Ainda não definido.

 **Pergunta:** usuários administrativos poderão excluir/editar registros de auditoria ou eles serão somente leitura?

 ## 3\. O cliente poderá solicitar exclusão da conta?

 **R:**

 A documentação exige proteção de dados e observância à LGPD, mas não detalha o fluxo.

 **Pergunta:** haverá funcionalidade de solicitação de exclusão da conta diretamente pelo cliente?

 ## 4\. O que acontecerá com pedidos históricos após exclusão?

 **R:**

 Ainda pendente.

 **Pergunta:** os dados serão:

 - anonimizados;
- excluídos;
- mantidos integralmente quando houver obrigação legal;
- outra estratégia?

 ## 5\. Haverá consentimento para comunicações promocionais?

 **R:**

 As notificações estão previstas, mas a distinção entre comunicações transacionais e promocionais ainda não está definida.

 **Pergunta:** o cliente poderá escolher receber ou não:

 - promoções;
- ofertas;
- alteração de preço;
- estoque;
- novidades?

---

 # Rodada 13 — Imagens, armazenamento e arquivos

 ## 1\. Onde serão armazenadas as imagens?

 **R:**

 O sistema terá um serviço de armazenamento, mas o provedor ainda não foi definido.

 **Pergunta:** essa escolha ficará para ADR?

 ## 2\. Quantas imagens um produto poderá possuir?

 **R:**

 Ainda não definido.

 **Pergunta:** haverá limite?

 Exemplo:

```
1 imagem principal
+ até 10 imagens adicionais
```

 ## 3\. Quais formatos de imagem serão aceitos?

 **R:**

 Ainda não definido.

 **Pergunta:** serão aceitos:

 - JPEG;
- PNG;
- WebP;
- AVIF;
- outros?

---

 # Rodada 14 — Notificações

 ## 1\. Quais canais existirão?

 **R:**

 A documentação prevê serviço de e-mail/notificações.

 **Pergunta:** a V1 utilizará:

 - e-mail;
- SMS;
- WhatsApp;
- notificações dentro da aplicação;
- outros?

 ## 2\. Quais notificações serão obrigatórias?

 **R:**

 Precisamos separar notificações transacionais das promocionais.

 **Pergunta:** confirme quais eventos deverão gerar comunicação obrigatória, por exemplo:

 - cadastro;
- recuperação de senha;
- pedido criado;
- pagamento aprovado;
- pagamento recusado;
- pedido enviado;
- pedido entregue;
- cancelamento;
- reembolso;
- alteração de preço;
- estoque disponível.

---

 # Rodada 15 — Operação, backup e qualidade

 ## 1\. Qual será a frequência de backup?

 **R:**

 A documentação exige backup, mas não define frequência.

 **Pergunta:** devemos trabalhar com:

 - diário;
- semanal;
- outro intervalo?

 ## 2\. Qual será o RPO?

 **R:**

 Ainda não definido.

 **Pergunta:** qual perda máxima aceitável de dados em caso de desastre?

 Exemplo:

```
RPO = 24 horas
```

 ## 3\. Qual será o RTO?

 **R:**

 Ainda não definido.

 **Pergunta:** em caso de desastre, em quanto tempo o sistema deverá estar novamente operacional?

 ## 4\. O backup deverá ter restauração testada?

 **R:**

 A documentação indica que a restauração deve ser testável.

 **Pergunta:** devemos estabelecer testes periódicos de restauração como requisito obrigatório?

 ## 5\. Qual disponibilidade será esperada?

 **R:**

 Ainda não existe uma meta numérica.

 **Pergunta:** qual será a meta da V1?

 Exemplo:

```
99,0%
99,5%
99,9%
```

 ## 6\. Quais metas de desempenho serão adotadas?

 **R:**

 A documentação determina que as metas sejam mensuráveis, mas ainda não define números.

 **Pergunta:** você quer definir metas específicas para:

 - catálogo;
- busca;
- página de produto;
- carrinho;
- checkout;
- APIs;
- painel administrativo?

---

 # Rodada 16 — Arquitetura e tecnologia

 ## 1\. A arquitetura em camadas será mantida como decisão arquitetural inicial?

 **R:**

 A proposta atual é:

```
Apresentação
     ↓
Aplicação
     ↓
Domínio
     ↓
Infraestrutura
```

 Com avaliação de monólito modular para a V1.

 **Pergunta:** podemos considerar essa a direção arquitetural inicial e registrar a decisão definitiva em ADR?

 ## 2\. Haverá frontend separado do backend?

 **R:**

 Ainda não definido.

 **Pergunta:** a aplicação será:

 - frontend separado + API;
- aplicação monolítica;
- outra arquitetura?

 ## 3\. Haverá aplicativo mobile na V1?

 **R:**

 A documentação menciona dispositivos móveis conforme estratégia do projeto, mas não aprova um aplicativo.

 **Pergunta:** a V1 terá:

 - somente web responsiva;
- web + aplicativo Android;
- web + Android/iOS?

 ## 4\. Qual banco de dados será utilizado?

 **R:**

 Ainda pendente.

 **Pergunta:** podemos deixar a escolha do banco relacional para a fase arquitetural e ADR?

 ## 5\. Qual será a estratégia de infraestrutura?

 **R:**

 Ainda não definida.

 **Pergunta:** antes da implementação devemos decidir:

 - hospedagem;
- banco;
- storage;
- cache;
- filas;
- observabilidade;
- CI/CD;
- ambientes de desenvolvimento;
- homologação;
- produção.

---

 # Controle da elicitação

 ## Status

 | Item | Status |
| --- | --- |
| Escopo V1 | PENDENTE |
| Catálogo | PENDENTE |
| Conta de cliente | PENDENTE |
| Variantes/SKU | PENDENTE |
| Estoque | PENDENTE |
| Carrinho | PENDENTE |
| Checkout | PENDENTE |
| Pagamento | PENDENTE |
| Pedidos | PENDENTE |
| Entrega | PENDENTE |
| Cupons | PENDENTE |
| Avaliações | PENDENTE |
| Favoritos | PENDENTE |
| Administração | PENDENTE |
| Permissões/RBAC | PENDENTE |
| Auditoria | PENDENTE |
| LGPD | PENDENTE |
| Notificações | PENDENTE |
| Backup/recuperação | PENDENTE |
| Desempenho | PENDENTE |
| Arquitetura | PENDENTE |
| Tecnologias | PENDENTE |

---

 # Regra da elicitação

 Durante a elicitação:

 - nenhuma decisão será inventada;
- respostas do responsável pelo projeto terão prioridade sobre suposições;
- decisões contraditórias deverão ser identificadas;
- requisitos derivados das respostas deverão ser explicitados;
- regras de negócio deverão ser separadas de requisitos funcionais;
- decisões arquiteturais relevantes deverão gerar ADR;
- requisitos ainda indefinidos permanecerão como **PENDENTE**;
- alterações de escopo deverão ser registradas;
- a matriz de rastreabilidade será atualizada após a consolidação dos requisitos.

---

 # Próximo passo

 A elicitação deverá começar pela **Rodada 1 — Escopo comercial e operação da V1**.

 As respostas fornecidas serão utilizadas para consolidar posteriormente:

 - requisitos funcionais;
- requisitos não funcionais;
- regras de negócio;
- casos de uso;
- modelo de domínio;
- modelo de dados;
- APIs;
- permissões;
- ADRs;
- riscos;
- roadmap;
- matriz de rastreabilidade;
- `TASKS.md`.
