## Rodada 1 — Escopo e atores

### 1. Quais funcionalidades devem obrigatoriamente compor a V1 para o cliente e para a administração? Há algo explicitamente fora de escopo?

**R:**

**Incluídos obrigatoriamente na V1:**

1. **Conta e área do cliente**

   * Cadastro/login/logout.
   * Confirmação obrigatória de e-mail.
   * Recuperação de senha.
   * Perfil e dados pessoais.
   * Endereços.
   * Histórico de pedidos.
   * Biblioteca de produtos adquiridos.
   * Solicitação de exclusão da conta/dados.

2. **Catálogo**

   * Produtos.
   * Categorias.
   * Marcas.
   * Variantes.
   * Busca.
   * Filtros.
   * Ordenação.
   * Produtos gratuitos.
   * Pré-vendas.
   * Bundles.
   * Produtos com licença limitada ou ilimitada.

3. **Compra**

   * Carrinho.
   * Cupons.
   * Checkout.
   * Pix via Stripe.
   * Pedidos.
   * Histórico.
   * Status do pedido.
   * Reembolso/cancelamento conforme regras definidas.

4. **Entrega digital**

   * Download de PDF e EPUB.
   * Marca d'água em ambos.
   * Registro de downloads.
   * Liberação após confirmação do pagamento.
   * Liberação futura para pré-vendas.
   * Atualização de arquivos para clientes que já possuem o produto.

5. **Cliente**

   * Wishlist.
   * Alertas de promoção, alteração de preço e disponibilidade.
   * Avaliações de 1 a 5 estrelas com comentário opcional.
   * Denúncias.

6. **Administração**

   * Gestão de produtos.
   * Categorias.
   * Preços.
   * Cupons.
   * Importação CSV.
   * Estoque/licenças.
   * Pedidos.
   * Clientes.
   * Avaliações/moderação.
   * Usuários administrativos.
   * Relatórios básicos.

7. **Operação**

   * Logs de erro.
   * Monitoramento de disponibilidade.
   * Monitoramento de falhas de webhook.
   * Backups semanais.

**Fora de escopo da V1:**

* Venda de produtos físicos.
* Aluguel.
* Assinaturas.
* DRM.
* Nota fiscal.
* Outros meios de pagamento além do Pix.
* Autenticação de dois fatores.
* Relatórios avançados/exportáveis.
* BI avançado.
* Funcionalidades sociais/chat.
* Sistema avançado de recomendações.
* Outros recursos que não estejam explicitamente especificados para a V1.

---

### 2. Quais papéis existirão além de cliente e administrador?

**R:**

1. **Cliente**

   * Navegação do catálogo.
   * Compras.
   * Downloads.
   * Wishlist.
   * Avaliações.
   * Gerenciamento do próprio perfil.

2. **Administrador geral**

   * Acesso administrativo completo.
   * Gestão de clientes.
   * Gestão de produtos.
   * Gestão de estoque/licenças.
   * Gestão de pedidos.
   * Reembolsos.
   * Gestão de usuários administrativos.
   * Relatórios.
   * Moderação.
   * Auditoria.

3. **Gestor de catálogo**

   * Criar/editar/publicar livros.
   * Gerenciar preços.
   * Gerenciar cupons.
   * Importar CSV.
   * Moderar avaliações.

O gestor **não** terá acesso às demais operações administrativas, como reembolso, gestão de clientes, gestão de usuários ou pedidos.

Todo usuário terá e-mail e senha. Confirmação de e-mail será obrigatória.

---

### 3. Qual será o modelo comercial?

**R:**

A V1 terá:

* compra avulsa de e-books;
* e-books gratuitos;
* bundles;
* pré-vendas;
* cupons de desconto.

Ficam para versões futuras:

* assinaturas;
* aluguel;
* outros modelos comerciais.

---

### 4. Como o cliente consumirá o e-book?

**R:**

A entrega será por download de:

* PDF;
* EPUB.

O acesso será liberado somente após confirmação do pagamento.

Os arquivos receberão marca d'água contendo:

* nome do cliente;
* ID do cliente;
* ID do pedido;
* data.

A marca d'água será aplicada a PDF e EPUB.

O download será ilimitado enquanto o cliente possuir o produto, podendo baixar todos os formatos disponíveis.

DRM fica para versões futuras.

---

### 5. Quais meios de pagamento serão utilizados?

**R:**

A V1 terá foco em **Pix através da Stripe**.

Outros métodos de pagamento ficam para versões futuras.

A conta Stripe e sua configuração para o ambiente brasileiro são dependências de implantação.

O sistema deverá tratar webhooks duplicados/reprocessados de forma idempotente.

---

### 6. Como o catálogo será cadastrado?

**R:**

Haverá duas formas:

* cadastro manual;
* importação por CSV.

A importação CSV será permitida para:

* administrador geral;
* gestor de catálogo.

A importação utilizará as mesmas validações do cadastro manual.

Se qualquer linha for inválida:

* toda a operação deverá sofrer rollback;
* nenhum livro será cadastrado;
* deverá ser apresentado um relatório indicando os erros.

Livros poderão ter:

* limite numérico de licenças;
* quantidade ilimitada de licenças.

---

### 7. Como funcionarão as avaliações?

**R:**

Somente clientes que compraram o produto poderão avaliá-lo.

A avaliação terá:

* nota de 1 a 5;
* comentário opcional.

Qualquer usuário autenticado poderá denunciar uma avaliação.

Gestores e administradores poderão moderar avaliações.

Uma avaliação moderada ficará:

* oculta publicamente;
* visível para gestores e administradores;
* registrada para fins de auditoria.

Usuários poderão ser impedidos de realizar novas avaliações/comentários após comportamento ofensivo conforme as regras de moderação.

---

# Rodada 2 — Compra e catálogo

### 1. Como funcionam compras gratuitas?

**R:**

Produtos gratuitos deverão passar pelo:

```text
Carrinho → Checkout → Pedido R$ 0,00
```

A etapa de pagamento será pulada quando o carrinho possuir somente produtos gratuitos.

Caso exista pelo menos um produto pago, o checkout seguirá o fluxo normal de pagamento.

O usuário precisa ter:

* conta;
* e-mail confirmado;
* aceite dos termos;
* idade mínima exigida.

A compra gratuita também será registrada como pedido.

---

### 2. Como funciona a pré-venda?

**R:**

A cobrança acontece no momento da compra.

Após o pagamento:

```text
Pré-venda → Pré-venda aguardando lançamento
```

O download permanece bloqueado até a data definida pelo administrador.

Na data de lançamento:

```text
Pré-venda aguardando lançamento
        ↓
Disponível para download
```

O cliente poderá cancelar e solicitar reembolso de acordo com as regras definidas.

---

### 3. Quando a licença é consumida?

**R:**

A licença é consumida na **confirmação do pagamento**.

Enquanto o pagamento estiver pendente, a licença fica temporariamente reservada/indisponível para evitar venda acima do limite.

O Pix expira após **24 horas**.

Se o pagamento falhar ou expirar:

* o pedido vai para `falha`;
* a reserva é liberada;
* a licença volta a ficar disponível.

---

### 4. Quais regras de cupom existirão na V1?

**R:**

Os cupons terão:

* desconto percentual;
* desconto de valor fixo;
* validade;
* quantidade máxima de usos.

Podem ser utilizados em:

* livros pagos;
* bundles.

Não se aplicam a:

* livros gratuitos.

Regras mais avançadas ficam para versões futuras.

---

### 5. Como funcionará o painel de vendas?

**R:**

O administrador poderá consultar:

* por mês;
* por período personalizado.

Indicadores:

* faturamento;
* unidades vendidas;
* títulos mais vendidos;
* alerta de licença baixa.

Não haverá relatórios avançados/exportáveis na V1.

---

### 6. Quais campos são obrigatórios para um livro?

**R:**

* título;
* autor;
* editora;
* sinopse;
* capa;
* categoria;
* ISBN válido;
* idioma;
* preço;
* arquivos;
* data de lançamento;
* edição;
* limite de licença;
* disponibilidade.

O limite de licença poderá ser:

* numérico;
* ilimitado.

Estados de publicação:

```text
Rascunho
Publicado
Arquivado/Inativado
```

Um produto inativado deixa de ser vendido, mas continua disponível na biblioteca de quem já o adquiriu.

---

# Rodada 3 — Cliente e comercial

### 1. Quais dados são obrigatórios no cadastro?

**R:**

Obrigatórios:

* nome;
* e-mail;
* senha;
* CPF;
* telefone;
* data de nascimento.

O cliente poderá alterar:

* nome;
* telefone;
* demais dados permitidos.

O CPF será imutável após cadastro/validação.

O cliente deverá ser maior de idade para realizar compras, inclusive gratuitas.

---

### 2. Quais pagamentos estarão disponíveis?

**R:**

Somente **Pix via Stripe** na V1.

Cartão, boleto e parcelamento ficam para versões futuras.

---

### 3. Qual a política de cancelamento e reembolso?

**R:**

**Pré-venda:**

O cancelamento poderá ocorrer até **uma semana antes da data de lançamento**.

**Produto já lançado:**

O reembolso poderá ocorrer:

* até 2 horas após o download; ou
* até 2 semanas após a compra caso o cliente ainda não tenha realizado download.

O processo será automático quando as condições forem atendidas.

O administrador poderá executar reembolso manualmente quando necessário.

O controle de download será baseado no **clique no link de download gerado**.

---

### 4. Como funcionam os cupons?

**R:**

Podem oferecer:

* desconto percentual;
* desconto fixo.

Podem ser aplicados a:

* livros pagos;
* bundles.

Não podem ser aplicados a:

* livros gratuitos.

---

### 5. Como funcionam os bundles?

**R:**

Um bundle é um conjunto de livros com:

* capa própria;
* preço próprio;
* identificação própria.

Após a compra, os livros são liberados **separadamente** na biblioteca do cliente.

Um livro pode pertencer a vários bundles.

Não pode existir mais de um bundle contendo exatamente os mesmos livros com preços diferentes.

Todo livro incluído em um bundle precisa estar cadastrado no sistema.

Se o cliente já possuir alguns livros:

```text
Preço do bundle
− valor proporcional dos livros já adquiridos
= preço final
```

Se o cliente já possuir todos os livros do bundle, o bundle não poderá ser comprado.

---

### 6. Como funciona a importação CSV?

**R:**

Administrador e gestor de catálogo podem importar.

O CSV deverá possuir os mesmos campos obrigatórios e validações do cadastro manual.

Qualquer linha inválida provoca:

```text
Importação iniciada
       ↓
Validação
       ↓
Erro encontrado
       ↓
ROLLBACK
       ↓
Nenhum livro cadastrado
```

O sistema deverá informar:

* linha;
* campo;
* valor/problemática;
* motivo do erro.

---

### 7. Como funciona privacidade/exclusão?

**R:**

O aceite dos Termos de Uso e Política de Privacidade será obrigatório.

Sem aceite:

* não pode realizar compra;
* não pode realizar compra gratuita.

O cliente poderá solicitar exclusão.

Após a solicitação:

```text
Conta ativa
    ↓
Solicitação de exclusão
    ↓
Conta desativada
    ↓
Prazo legal de retenção
    ↓
Exclusão definitiva
```

Durante o período de espera, o cliente poderá solicitar retomada da conta.

O administrador poderá acompanhar as solicitações.

O cliente receberá notificações por e-mail próximas à exclusão e após a exclusão.

---

# Rodada 4 — Estados, arquivos e segurança

### 1. Perfil

**R:**

Nome é obrigatório e pode ser alterado.

CPF:

* obrigatório;
* não pode ser alterado.

Data de nascimento será utilizada para verificar maioridade.

---

### 2. Estados do pedido

**R:**

Os estados da V1 serão:

```text
aguardando pagamento
pago
cancelado
reembolsado
pré-venda aguardando lançamento
disponível para download
falha
```

Para pedidos com múltiplos itens, o estado de disponibilidade deve considerar cada item individualmente.

---

### 3. Notificações obrigatórias

**R:**

Enviar e-mail para:

* confirmação de cadastro;
* confirmação de e-mail;
* recuperação de senha;
* confirmação de compra;
* mudanças relevantes no status do pedido;
* alteração de dados da conta;
* confirmação de exclusão;
* aviso próximo à exclusão;
* aviso de alteração/correção de livro já adquirido;
* liberação de pré-venda;
* demais eventos críticos definidos no fluxo.

---

### 4. Arquivos

**R:**

Formatos:

* PDF;
* EPUB.

Ambos são aceitos.

Não haverá limite de tamanho definido para a V1.

Administradores poderão substituir arquivos já publicados.

Clientes que já possuem o produto:

* receberão aviso da alteração;
* terão acesso ao novo arquivo.

---

### 5. Marca d'água

**R:**

Será aplicada em:

* PDF;
* EPUB.

Dados:

* nome;
* ID do cliente;
* ID do pedido;
* data.

---

### 6. Segurança administrativa

**R:**

2FA não será obrigatório na V1.

Fica planejado para versão futura, com objetivo de posteriormente disponibilizá-lo para todos os usuários.

Devem possuir auditoria, no mínimo:

* alteração de preço;
* alteração de catálogo;
* reembolso;
* moderação;
* compras;
* alterações administrativas relevantes.

---

# Rodada 5 — Descoberta e operação

### 1. Busca e filtros

**R:**

A V1 terá busca/filtros por:

* título;
* autor;
* categoria;
* idioma;
* faixa de preço;
* mais vendidos;
* bem avaliados;
* data de lançamento.

---

### 2. Wishlist

**R:**

A wishlist permitirá:

* adicionar;
* remover;
* visualizar.

Também haverá notificações quando houver:

* promoção;
* alteração de preço;
* disponibilidade após pré-venda;
* mudança relevante de disponibilidade.

---

### 3. Downloads

**R:**

Downloads são ilimitados.

O cliente pode baixar todos os formatos disponíveis para o produto.

Cada clique no link de download deverá ser registrado.

O registro será utilizado, entre outras coisas, para determinar a regra de reembolso das 2 horas.

---

### 4. Contas bloqueadas

**R:**

Administradores poderão gerenciar contas.

Conta bloqueada não poderá:

* realizar compras;
* realizar downloads;
* realizar avaliações;
* realizar comentários.

Gestores de catálogo poderão moderar avaliações, mas não terão as demais permissões administrativas.

---

### 5. Stripe

**R:**

A configuração da Stripe será dependência de implantação.

O sistema deverá suportar:

* webhooks;
* eventos duplicados;
* reprocessamento;
* idempotência.

---

### 6. Qualidade mínima

**R:**

* aplicação responsiva;
* acessibilidade mínima WCAG nível A;
* carregamento máximo desejado de 20 segundos;
* disponibilidade para todo o Brasil;
* backups semanais.

**Observação:** o limite de 20 segundos é muito permissivo para um requisito de desempenho e deveria ser refinado posteriormente em uma RNF mensurável por tipo de operação.

---

# Rodada 6 — Administração e operação

### 1. Permissões do gestor

**R:**

O gestor de catálogo pode:

* criar livros;
* editar livros;
* publicar livros;
* alterar preços;
* gerenciar cupons;
* importar CSV;
* moderar avaliações.

Não pode:

* gerenciar clientes;
* executar reembolsos;
* administrar pedidos;
* administrar outros usuários;
* acessar as demais funções exclusivas do administrador.

---

### 2. Alerta de licença baixa

**R:**

Existem dois níveis:

* limite global;
* limite individual por livro.

Se houver limite individual, ele prevalece.

Se não houver, utiliza-se o limite global.

Ambos são configuráveis pelo administrador.

Quando a licença chegar a zero:

* novas compras devem ser bloqueadas;
* clientes que já possuem o produto continuam com acesso.

---

### 3. Nota fiscal

**R:**

Não haverá emissão de nota fiscal na V1.

A integração será estudada para versão futura.

---

### 4. Estados de publicação

**R:**

Um livro poderá estar:

```text
Rascunho
Publicado
Arquivado/Inativado
```

Livro inativo:

* não pode receber novas compras;
* continua na biblioteca de quem já comprou.

---

### 5. Exclusão de conta

**R:**

Ao solicitar exclusão:

* conta é desativada;
* dados ficam sujeitos ao período legal de retenção;
* usuário pode recuperar a conta antes da exclusão definitiva;
* administrador acompanha o processo;
* usuário recebe aviso próximo à exclusão;
* usuário recebe confirmação após exclusão.

---

# Rodada 7 — Pedidos e administração

### 1. Produto lançado vs. pré-venda

**R:**

Sim.

Produto já lançado:

```text
Pagamento confirmado
        ↓
Disponível para download
```

Pré-venda:

```text
Pagamento confirmado
        ↓
Pré-venda aguardando lançamento
        ↓
Data de lançamento
        ↓
Disponível para download
```

---

### 2. Pedido com pré-venda + produto disponível

**R:**

Cada item deve possuir seu próprio estado de disponibilidade.

Assim:

```text
Produto lançado → disponível imediatamente
Pré-venda → bloqueado até sua data
```

O reembolso poderá ser realizado **por item**.

---

### 3. Reembolso e licença

**R:**

Se uma licença limitada for consumida e posteriormente houver reembolso:

* a licença volta a ficar disponível se o produto estiver ativo/disponível;
* se o produto estiver inativo, ninguém poderá realizar nova compra até sua reativação.

---

### 4. Administradores

**R:**

Um administrador geral pode criar:

* administradores;
* gestores de catálogo.

O sistema deve impedir que:

* o último administrador geral seja removido;
* o sistema fique sem nenhum administrador geral ativo.

---

### 5. Infraestrutura

**R:**

Ainda não decidido.

A definição de:

* provedor;
* hospedagem;
* banco;
* armazenamento;
* ambientes;
* CI/CD;

deve ser registrada como decisão arquitetural antes da implementação correspondente.

---

### 6. Operação

**R:**

Na V1:

* logs de erros;
* monitoramento de disponibilidade;
* monitoramento de falhas de webhook.

Monitoramento avançado e outros mecanismos operacionais podem ser evoluídos posteriormente.

---

# Rodada 8 — Regras de negócio avançadas

### 1. Expiração do Pix

**R:**

O Pix expira após **24 horas**.

Durante o período de pagamento pendente:

* a licença limitada fica temporariamente reservada;
* outros clientes não podem consumir aquela licença.

Após expiração:

```text
aguardando pagamento
        ↓
falha
        ↓
reserva liberada
```

---

### 2. Compra duplicada e bundles

**R:**

O cliente não pode comprar novamente um e-book que já possui.

Porém, pode comprar um bundle contendo livros que já possui.

Nesse caso:

```text
Preço original do bundle
− valor proporcional dos livros já adquiridos
= preço ajustado
```

Se todos os livros do bundle já forem possuídos, o bundle não pode ser comprado.

---

### 3. Definição de download

**R:**

Um download é considerado iniciado quando o cliente **clica no link de download gerado**.

O sistema deverá registrar cada evento de download, incluindo o item/formato correspondente.

Esse registro será utilizado para:

* auditoria;
* controle;
* regra de reembolso.

---

### 4. Moderação

**R:**

Após moderação:

* comentário fica oculto publicamente;
* permanece disponível para gestores e administradores;
* ação fica registrada para auditoria.

Qualquer usuário autenticado pode denunciar uma avaliação.

---

### 5. Tecnologia e arquitetura

**R:**

A arquitetura deverá ser **em camadas**.

Ainda não há preferência tecnológica definida para:

* frontend;
* backend;
* banco;
* armazenamento;
* hospedagem;
* CI/CD.

As tecnologias deverão ser selecionadas posteriormente e justificadas por ADR.

---

# Perguntas adicionais que ainda precisam ser respondidas

Aqui eu adicionaria algumas perguntas que **não estavam no exemplo**, mas são importantes para fechar a elicitação do Tropa Fight.

## Rodada 9 — Questões ainda abertas

### 1. O carrinho pode conter múltiplas unidades do mesmo e-book?

Como o produto é digital e a compra duplicada é proibida, a tendência seria limitar cada e-book a **quantidade 1 por pedido**. Porém, isso precisa ser confirmado.

**Pergunta:** um cliente poderá colocar quantidade `2` do mesmo e-book no carrinho ou a quantidade deve ser sempre `1`?

---

### 2. Como funciona o preço proporcional dos bundles?

Você definiu que um bundle deve descontar proporcionalmente os livros que o cliente já possui.

**Pergunta:** o cálculo proporcional será baseado no preço atual individual dos livros ou nos preços individuais cadastrados no momento da criação do bundle?

Exemplo:

```text
Livro A = R$ 40
Livro B = R$ 30
Livro C = R$ 30

Bundle = R$ 60
```

A participação seria:

```text
A = 40%
B = 30%
C = 30%
```

Se o cliente já possui A, o desconto seria de 40% do preço do bundle?

---

### 3. O que acontece com um bundle quando um dos livros é arquivado/inativado?

Como bundles precisam ser compostos por livros existentes, precisamos definir se:

* o bundle também fica indisponível;
* continua vendável;
* é automaticamente atualizado;
* ou precisa de intervenção administrativa.

---

### 4. O preço de um produto pode ser alterado enquanto ele está em pré-venda?

Exemplo:

```text
Pré-venda: R$ 50
Depois administrador altera para R$ 60
```

O cliente que já comprou paga R$ 50 ou existe algum ajuste?

---

### 5. Qual será a regra para alteração de preço de um livro já adquirido?

Provavelmente o cliente mantém o direito adquirido independentemente do novo preço, mas é importante registrar isso como regra explícita.

**Pergunta:** alterações futuras de preço devem afetar somente novas compras?

---

### 6. O cliente poderá baixar novamente um arquivo depois que ele for substituído?

Você definiu que clientes antigos receberão o novo arquivo.

**Pergunta:** o sistema deverá manter versões anteriores disponíveis ou somente a versão atual?

---

### 7. Como funciona o limite de licença durante pré-venda?

Se um livro tiver:

```text
100 licenças
```

e 100 clientes comprarem a pré-venda, as 100 licenças ficam consumidas imediatamente ou apenas quando o livro for lançado?

Isso é importante porque você definiu que a licença é consumida na confirmação do pagamento, mas a entrega ocorre posteriormente.

---

### 8. Cancelamento de pré-venda e licença

Se uma pré-venda for cancelada antes do lançamento:

* a licença retorna ao estoque?
* o reembolso libera imediatamente a licença?
* o bundle relacionado sofre alguma alteração?

---

### 9. CPF

Como o CPF é obrigatório e imutável:

**Pergunta:** haverá validação apenas do formato/dígitos verificadores ou também será necessária alguma consulta externa para verificar titularidade?

---

### 10. ISBN

Você definiu "ISBN válido".

**Pergunta:** a V1 precisa apenas validar matematicamente o ISBN-10/ISBN-13 ou consultar uma fonte externa para confirmar que o ISBN realmente corresponde ao livro?

---

### 11. Capa e arquivos

Você definiu que não há limite de tamanho para PDF/EPUB.

**Pergunta:** a capa também terá limite de tamanho/formato/dimensões ou isso ficará livre na V1?

---

### 12. Recuperação de conta excluída

Você definiu que a conta pode ser retomada antes da exclusão definitiva.

**Pergunta:** o usuário recupera exatamente todos os dados anteriores ou alguns dados são anonimizados/desativados durante o período de espera?

---

### 13. Administrador e auditoria

Você definiu que compras devem entrar na auditoria.

**Pergunta:** a auditoria deverá registrar apenas operações administrativas sobre compras ou também eventos automáticos, como:

* pagamento aprovado;
* pagamento expirado;
* licença consumida;
* download;
* reembolso automático;
* liberação de pré-venda?

---

### 14. Prazo de retenção

Você definiu que a exclusão definitiva ocorrerá após o prazo mínimo estabelecido por lei.

**Pergunta:** esse prazo ficará configurável no sistema, para que possa ser alterado sem modificar código, enquanto a regra jurídica ainda estiver sendo estudada?

---

### 15. Desempenho

O requisito atual é:

> carregamento máximo de 20 segundos.

Isso é mensurável, mas pouco rigoroso para um sistema web.

**Pergunta:** você quer manter exatamente **20 segundos como limite da V1**, ou prefere definir metas separadas, por exemplo:

* páginas públicas;
* APIs;
* checkout;
* busca;
* download;

com métricas diferentes?

---

### 16. Backups

Você definiu backups semanais.

**Pergunta:** além de fazer backup semanal, o sistema deverá **testar a restauração** periodicamente para comprovar que o backup realmente pode ser utilizado?

---

### 17. Disponibilidade

"Disponível em todo o Brasil" define abrangência geográfica, mas não disponibilidade técnica.

**Pergunta:** você quer definir uma meta de disponibilidade, como `99%`, `99,5%` ou `99,9%`?

---

### 18. Endereço

Como a V1 será exclusivamente digital:

**Pergunta:** o endereço será realmente necessário no cadastro/checkout ou podemos deixar endereço fora da V1 até existir venda física?

Isso é importante porque atualmente o modelo inicial previa `Address`, mas o escopo comercial da V1 não exige entrega física.

---

### 19. Notificação de alteração de livro

Quando um arquivo for corrigido/substituído, você definiu que clientes anteriores serão avisados.

**Pergunta:** a notificação será enviada automaticamente para todos os compradores daquele livro ou o administrador poderá escolher quem será notificado?

---

### 20. Wishlist e produtos inativos

**Pergunta:** se um produto da wishlist for inativado, o cliente deve:

* continuar vendo-o na wishlist;
* receber uma notificação;
* ter o produto removido automaticamente?

---

### 21. Estados do produto

Você definiu:

```text
Rascunho
Publicado
Arquivado/Inativado
```

**Pergunta:** "arquivado" e "inativado" são realmente o mesmo estado ou devem representar situações diferentes?

---

### 22. Administrador e gestor

Você definiu que o administrador pode criar administradores e gestores.

**Pergunta:** o administrador também poderá remover/rebaixar outros administradores, desde que **pelo menos um administrador geral permaneça ativo**?

---

### 23. Exclusão e compras

**Pergunta:** uma conta com pedidos, pagamentos ou downloads registrados poderá ser definitivamente excluída após o prazo legal mediante anonimização dos dados que precisam ser preservados?

Essa decisão é importante para o modelo de dados e para a LGPD.

---

### 24. Gateway Stripe

Você definiu Stripe + Pix, mas ainda não definiu a estratégia técnica.

**Pergunta:** devemos deixar a escolha entre Checkout hospedado, Payment Element ou integração própria como uma decisão arquitetural a ser tomada em ADR?

---
