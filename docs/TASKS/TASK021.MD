# TASK-021 — Segurança, acessibilidade e testes E2E

> **Escopo revisado em 2026-11-11.** O bloco da TASK-021 no `TASKS.md` (objetivo, IDs oficiais, Scope Guard, critérios e dependências) **prevalece** sobre este documento onde houver conflito. Os IDs RF, RN e UC citados abaixo podem ser legados; use os IDs oficiais do `README.md` e o "Mapeamento de referências legadas" do `TASKS.md`. As seções de processo, gates e relatório deste documento continuam aplicáveis.


 **Status:** DONE (2026-11-23)\
 **Phase/Priority:** PHASE-04 / HIGH\
 **Dependências:** `DEPENDS_ON: TASK-020`\
 **Política incidental:** `MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`

---

 # 1\. Identificação

 **ID:** TASK-021\
 **Nome:** Segurança, acessibilidade e testes E2E\
 **Fase:** PHASE-04\
 **Prioridade:** HIGH\
 **Estado inicial:** BLOCKED\
 **Dependência obrigatória:** `TASK-020 = DONE`

 **Relacionados:**

 - RNF-003
- RNF-004
- RNF-005
- RNF-006
- RNF-014
- UC-001–UC-015
- TASK-003
- TASK-004
- TASK-010
- TASK-016
- TASK-017
- TASK-018
- TASK-019
- TASK-020
- TASK-022

---

 # 2\. Objetivo

 Executar uma validação transversal da V1 do Tropa Fight, cobrindo:

 - segurança;
- autenticação;
- autorização;
- proteção de dados;
- acessibilidade;
- responsividade;
- fluxos críticos ponta a ponta;
- regressões;
- comportamento dos principais fluxos em desktop/mobile.

 A TASK deve identificar e corrigir problemas **diretamente necessários para que os critérios de aceitação sejam atendidos**, sem transformar a atividade em desenvolvimento de novas funcionalidades.

---

 # 3\. Resultado esperado

 Ao final da TASK, os principais fluxos do sistema devem possuir evidência verificável de que:

```
Usuário
   ↓
Autenticação
   ↓
Autorização
   ↓
Catálogo
   ↓
Carrinho
   ↓
Checkout
   ↓
Pagamento
   ↓
Pedido
   ↓
Histórico/Rastreamento
   ↓
Avaliações/Favoritos
   ↓
Administração
```

 funcionam dentro dos requisitos aprovados.

 Além disso:

```
Segurança
Acessibilidade
Responsividade
E2E
Regressão
```

 devem possuir resultados registrados.

---

 # 4\. Escopo

 ## 4.1 Incluído

 - testes E2E dos fluxos críticos;
- validação de autenticação;
- validação de autorização;
- testes de isolamento entre usuários;
- validação de controles administrativos;
- testes de acessibilidade;
- validação de navegação por teclado;
- validação de estados de foco;
- validação de elementos essenciais;
- responsividade;
- validação desktop/mobile;
- regressão funcional;
- validação de erros;
- validação de sessões;
- validação de proteção de dados;
- correções diretamente necessárias;
- documentação dos resultados.

 ## 4.2 Não incluído

 - novas funcionalidades comerciais;
- alteração de requisitos;
- mudança arquitetural;
- criação de novos módulos de negócio;
- criação de novos papéis;
- criação de novos canais de notificação;
- alteração de regras de pagamento;
- alteração de política comercial;
- implementação de funcionalidades futuras;
- readiness final de lançamento.

---

 # 5\. Dependência

 A TASK somente pode entrar em `READY` quando:

```
TASK-020 = DONE
```

 Além disso, devem estar disponíveis:

 - ambiente executável;
- dados de teste;
- autenticação funcional;
- autorização funcional;
- catálogo funcional;
- carrinho funcional;
- checkout funcional;
- pagamento funcional;
- pedidos funcionais;
- avaliações/favoritos;
- administração;
- observabilidade;
- auditoria;
- infraestrutura de testes E2E.

---

 # 6\. Definition of Ready

 Antes de iniciar:

 - [ ] `TASK-020 = DONE`;
- [ ] build executável;
- [ ] ambiente de testes disponível;
- [ ] banco de teste disponível;
- [ ] usuários de teste disponíveis;
- [ ] perfil de cliente disponível;
- [ ] perfil administrativo disponível;
- [ ] perfis administrativos necessários disponíveis;
- [ ] produtos de teste disponíveis;
- [ ] estoque de teste disponível;
- [ ] método de pagamento de teste disponível;
- [ ] cenários E2E definidos;
- [ ] critérios de acessibilidade conhecidos;
- [ ] critérios de responsividade conhecidos;
- [ ] requisitos de segurança identificados;
- [ ] dados sensíveis de teste controlados;
- [ ] ferramenta de E2E configurada;
- [ ] rastreabilidade disponível.

---

 # 7\. ALLOWED\_CHANGES

 Permitido:

```
UI/**
src/**
tests/**
tests/e2e/**
tests/a11y/**
configuração de testes
configuração de qualidade
documentação
TASKS.md
```

 Também são permitidas correções diretamente causadas pelos testes desta TASK, desde que:

 - estejam dentro do escopo;
- sejam mínimas;
- tenham teste correspondente;
- não alterem requisitos;
- não criem funcionalidade nova.

---

 # 8\. FORBIDDEN\_CHANGES

 É proibido:

 - alterar requisitos;
- alterar arquitetura;
- criar funcionalidades comerciais;
- criar novos fluxos;
- alterar regras de preço;
- alterar checkout;
- alterar pagamento;
- alterar política de cancelamento;
- criar novos papéis;
- alterar RBAC estruturalmente;
- criar integrações externas;
- substituir provedores;
- antecipar funcionalidades da TASK-022;
- ignorar falhas críticas;
- remover testes para obter aprovação;
- desabilitar controles de segurança;
- reduzir critérios de acessibilidade para facilitar aprovação.

---

 # 9\. Estratégia de validação

 A validação deve ocorrer em camadas:

```
Unit
  ↓
Integration
  ↓
API
  ↓
E2E
  ↓
Security
  ↓
Accessibility
  ↓
Responsive
  ↓
Regression
```

 Falhas encontradas devem ser classificadas por severidade e impacto.

---

 # 10\. Matriz de usuários de teste

 Criar usuários isolados para os cenários:

 | Perfil | Finalidade |
| --- | --- |
| Cliente A | fluxo normal |
| Cliente B | teste de isolamento |
| Administrador | operações administrativas |
| Administrador restrito | validação de permissões |
| Usuário não autenticado | controle de acesso |

Os perfis reais devem respeitar o RBAC existente.

---

 # 11\. Dados de teste

 Os dados devem ser:

 - fictícios;
- reproduzíveis;
- isolados;
- descartáveis;
- não sensíveis.

 Não utilizar:

 - senhas reais;
- cartões reais;
- tokens reais;
- credenciais de produção;
- dados pessoais reais sem aprovação.

---

 # 12\. Fluxo E2E-001 — Cadastro

 Validar:

```
Abrir cadastro
↓
Preencher dados válidos
↓
Enviar
↓
Conta criada
↓
Resultado esperado
```

 Testar também:

 - campos obrigatórios;
- formato inválido;
- senha inválida;
- e-mail inválido;
- duplicidade;
- mensagens de erro;
- acessibilidade.

---

 # 13\. Fluxo E2E-002 — Login

 Validar:

```
Usuário
↓
Login
↓
Sessão criada
↓
Área autenticada
```

 Testar:

 - credenciais válidas;
- credenciais inválidas;
- usuário inexistente;
- sessão;
- logout;
- acesso a rota protegida.

---

 # 14\. Fluxo E2E-003 — Logout

 Validar:

```
Usuário autenticado
↓
Logout
↓
Sessão encerrada
↓
Recurso protegido
↓
Acesso negado
```

 Verificar que o navegador não consegue reutilizar indevidamente uma sessão encerrada.

---

 # 15\. Fluxo E2E-004 — Recuperação de acesso

 Validar o fluxo previsto pelo produto.

 Testar:

 - solicitação válida;
- solicitação inválida;
- token inválido;
- token expirado;
- uso duplicado;
- conclusão do processo.

 Não expor informações que permitam enumerar usuários se isso contrariar a política de segurança.

---

 # 16\. Fluxo E2E-005 — Catálogo

 Validar:

```
Abrir catálogo
↓
Pesquisar
↓
Filtrar
↓
Ordenar
↓
Abrir produto
```

 Testar:

 - categoria;
- marca;
- preço;
- paginação;
- disponibilidade;
- variante;
- produto não publicado.

---

 # 17\. Fluxo E2E-006 — Favoritos

 Validar:

```
Login
↓
Produto
↓
Adicionar favorito
↓
Consultar favoritos
↓
Remover favorito
```

 Testar isolamento:

```
Cliente A → Favorito A
Cliente B → não pode visualizar Favorito A
```

---

 # 18\. Fluxo E2E-007 — Avaliação

 Validar conforme regra aprovada:

```
Cliente
↓
Produto elegível
↓
Enviar avaliação
↓
Estado esperado
```

 Testar:

 - usuário autorizado;
- usuário não autorizado;
- avaliação inválida;
- duplicidade;
- publicação/moderação;
- acesso de outro usuário.

---

 # 19\. Fluxo E2E-008 — Carrinho

 Validar:

```
Produto
↓
Adicionar ao carrinho
↓
Alterar quantidade
↓
Remover item
↓
Subtotal
```

 Testar:

 - quantidade inválida;
- produto indisponível;
- variante;
- alteração de preço;
- carrinho vazio;
- atualização do subtotal.

---

 # 20\. Fluxo E2E-009 — Checkout

 Validar:

```
Carrinho
↓
Checkout
↓
Endereço
↓
Frete
↓
Resumo
↓
Confirmação
```

 Verificar:

 - endereço correto;
- itens corretos;
- preço preservado;
- frete;
- disponibilidade;
- validação de dados;
- impossibilidade de checkout inválido.

---

 # 21\. Fluxo E2E-010 — Pagamento

 Validar o fluxo de pagamento em ambiente de teste:

```
Checkout
↓
Pagamento
↓
Resultado
↓
Pedido
```

 Testar:

 - sucesso;
- recusa;
- falha;
- retry;
- webhook;
- atualização de estado.

 Não utilizar credenciais ou cartões reais.

---

 # 22\. Fluxo E2E-011 — Idempotência de pagamento

 Executar cenário controlado:

```
Webhook A
↓
processamento

Webhook A novamente
↓
processamento
```

 Resultado:

```
Nenhum efeito duplicado indevido
```

 Validar:

 - pagamento;
- pedido;
- estoque;
- notificações, quando aplicável.

---

 # 23\. Fluxo E2E-012 — Pedido

 Validar:

```
Pagamento confirmado
↓
Pedido criado
↓
Histórico
↓
Detalhes
```

 Testar:

 - identificação;
- itens;
- valores;
- status;
- cliente proprietário;
- histórico.

---

 # 24\. Fluxo E2E-013 — Rastreamento

 Validar o fluxo de acompanhamento previsto:

```
Pedido
↓
Status
↓
Rastreamento
```

 Testar:

 - status válido;
- status inválido;
- acesso do proprietário;
- acesso administrativo;
- usuário sem autorização.

---

 # 25\. Fluxo E2E-014 — Administração

 Validar:

```
Login administrativo
↓
Painel
↓
Produto
↓
Estoque
↓
Pedido
↓
Cliente
```

 Somente executar operações previstas.

 Verificar autorização por recurso.

---

 # 26\. Fluxo E2E-015 — Administração de avaliações/cupons/usuários

 Validar:

 - moderação de avaliação;
- gestão de cupons;
- gestão de usuários administrativos;
- permissões;
- auditoria.

 Operações não autorizadas devem ser rejeitadas.

---

 # 27\. Matriz de autorização

 | Recurso | Não autenticado | Cliente | Admin | Admin autorizado |
| --- | --- | --- | --- | --- |
| Catálogo público | SIM | SIM | SIM | SIM |
| Próprio perfil | NÃO | SIM | conforme regra | conforme regra |
| Próprios pedidos | NÃO | SIM | conforme regra | conforme regra |
| Pedido de outro cliente | NÃO | NÃO | conforme regra | conforme regra |
| Administração | NÃO | NÃO | conforme permissão | SIM |
| Auditoria | NÃO | NÃO | conforme permissão | SIM |

A matriz final deve refletir o RBAC realmente aprovado.

---

 # 28\. Teste de isolamento entre clientes

 Cenário obrigatório:

```
Cliente A
↓
cria pedido
↓
Cliente B
↓
tenta consultar pedido A
```

 Resultado esperado:

```
ACESSO NEGADO
```

 Repetir para:

 - pedidos;
- endereços;
- favoritos;
- avaliações;
- perfil;
- demais recursos privados aplicáveis.

---

 # 29\. Teste de acesso administrativo

 Cliente comum tentando:

```
/admin
```

 deve receber comportamento de autorização adequado.

 Testar também acesso direto a endpoints administrativos.

 Não validar somente ocultação de botão na UI.

---

 # 30\. Teste de autorização no backend

 Para cada recurso crítico:

```
UI
↓
API
↓
Application
↓
Authorization
```

 Verificar que a proteção existe no backend.

 Um usuário não deve obter acesso simplesmente chamando a API diretamente.

---

 # 31\. Teste de enumeração

 Quando aplicável, validar que respostas não permitam descobrir indevidamente:

 - existência de contas;
- pedidos de outros clientes;
- recursos privados;
- identificadores internos;
- dados administrativos.

---

 # 32\. Teste de sessão

 Validar:

 - criação;
- expiração;
- logout;
- acesso após logout;
- acesso a recurso protegido;
- renovação, quando existente;
- invalidação, quando aplicável.

---

 # 33\. Teste de autenticação

 Validar:

 - credenciais inválidas;
- tentativas inválidas;
- sessão;
- recuperação;
- proteção de senha;
- respostas de erro;
- rotas protegidas.

 Não criar mecanismo de segurança novo durante esta TASK sem decisão.

---

 # 34\. Teste de entrada maliciosa

 Testar entradas controladas para identificar problemas como:

 - injection;
- XSS;
- manipulação de parâmetros;
- alteração de identificadores;
- payloads inesperados;
- campos excessivamente grandes.

 A execução deve ser não destrutiva e restrita ao ambiente de teste.

---

 # 35\. Teste de autorização por ID

 Testar manipulação direta:

```
GET /orders/A
```

 com usuário B.

 Resultado esperado:

```
DENIED
```

 Repetir para recursos privados aplicáveis.

---

 # 36\. Teste de exposição de dados

 Verificar respostas de API e UI para garantir que não retornem:

 - senha;
- tokens;
- secrets;
- dados financeiros sensíveis;
- dados de outros usuários;
- informações internas desnecessárias.

---

 # 37\. Teste de erros

 Validar:

 - 400;
- 401;
- 403;
- 404;
- 409;
- 422;
- 429, quando aplicável;

 Cada erro deve possuir comportamento consistente e seguro.

 Não exibir stack trace ao usuário.

---

 # 38\. Acessibilidade

 Executar validação de:

 - navegação por teclado;
- foco;
- labels;
- nomes acessíveis;
- contraste;
- mensagens de erro;
- formulários;
- botões;
- links;
- modais;
- tabelas;
- componentes interativos.

 Utilizar os critérios de acessibilidade definidos pelo projeto.

---

 # 39\. Navegação por teclado

 Validar:

```
TAB
SHIFT+TAB
ENTER
SPACE
ESC
setas, quando aplicável
```

 Garantir:

 - ordem lógica;
- foco visível;
- nenhum bloqueio;
- acesso a controles essenciais;
- retorno correto de foco em modais.

---

 # 40\. Foco

 Verificar:

 - foco visível;
- foco não desaparece;
- foco não fica preso indevidamente;
- modal controla foco corretamente;
- fechamento retorna foco ao elemento apropriado.

---

 # 41\. Formulários acessíveis

 Para cada formulário crítico:

 - label associada;
- instrução adequada;
- erro associado ao campo;
- indicação de campo obrigatório;
- mensagem compreensível;
- foco direcionado ao erro quando apropriado.

 Aplicar a:

 - login;
- cadastro;
- endereço;
- checkout;
- cupons;
- avaliações;
- administração.

---

 # 42\. Imagens e mídia

 Validar:

 - texto alternativo quando necessário;
- imagens decorativas corretamente identificadas;
- ausência de informação essencial somente por cor;
- conteúdo visual relevante compreensível.

---

 # 43\. Contraste

 Validar contraste de:

 - texto;
- controles;
- links;
- estados;
- mensagens;
- elementos essenciais.

 Problemas devem ser registrados com:

```
Tela
Componente
Problema
Critério
Evidência
Correção
```

---

 # 44\. Mensagens de erro acessíveis

 Validar:

```
Campo inválido
↓
Mensagem associada
↓
Usuário consegue identificar o erro
↓
Usuário consegue corrigir
```

 Não depender exclusivamente de cor.

---

 # 45\. Responsividade

 Validar pelo menos:

```
Mobile
Tablet, quando aplicável
Desktop
```

 Usar breakpoints reais da aplicação.

---

 # 46\. Fluxos mobile

 Executar no mobile:

 - login;
- cadastro;
- catálogo;
- busca;
- filtros;
- produto;
- favorito;
- carrinho;
- checkout;
- pedido;
- histórico.

---

 # 47\. Fluxos desktop

 Executar no desktop:

 - catálogo;
- checkout;
- pedidos;
- administração;
- avaliações;
- estoque;
- cupons;
- usuários administrativos.

---

 # 48\. Problemas de responsividade

 Registrar:

```
Viewport:
Tela:
Componente:
Problema:
Impacto:
Correção:
```

 Não criar redesign fora do escopo.

---

 # 49\. Regressão

 Executar regressão sobre funcionalidades concluídas:

```
TASK-003
TASK-004
TASK-006
TASK-007
TASK-008
TASK-009
TASK-011
TASK-012
TASK-013
TASK-014
TASK-015
TASK-017
TASK-018
TASK-019
TASK-020
```

 O objetivo é verificar que as correções da TASK-021 não quebraram funcionalidades existentes.

---

 # 50\. Regressão crítica

 Priorizar:

 - autenticação;
- autorização;
- catálogo;
- carrinho;
- checkout;
- pagamento;
- pedido;
- administração.

 Uma falha regressiva crítica impede `DONE`.

---

 # 51\. Testes E2E determinísticos

 Os testes devem:

 - possuir dados controlados;
- não depender de estado manual;
- limpar dados quando necessário;
- evitar dependência entre testes;
- possuir nomes claros;
- gerar evidência;
- permitir reprodução.

---

 # 52\. Isolamento dos testes

 Evitar:

```
Teste A altera estado
↓
Teste B depende do estado de A
```

 Preferir:

```
Setup
↓
Teste independente
↓
Cleanup
```

---

 # 53\. Testes paralelos

 Caso executados em paralelo:

 - não compartilhar usuário indevidamente;
- não compartilhar carrinho;
- não compartilhar pedido;
- não compartilhar estado mutável;
- não causar colisão de dados.

---

 # 54\. Evidências E2E

 Registrar:

 - teste;
- ambiente;
- navegador;
- viewport;
- timestamp;
- resultado;
- screenshot quando necessário;
- trace/log quando disponível;
- identificação do cenário.

---

 # 55\. Navegadores

 Validar os navegadores suportados pelo projeto.

 Registrar:

```
Browser
Version
OS
Viewport
Result
```

 Não expandir suporte para navegadores não previstos.

---

 # 56\. Testes de acessibilidade automatizados

 Quando houver ferramenta configurada, executar scanner automatizado.

 Registrar:

 - violações;
- impacto;
- localização;
- regra;
- correção;
- resultado após correção.

 Ferramenta automatizada não substitui validação manual.

---

 # 57\. Testes de acessibilidade manuais

 Executar pelo menos:

 - teclado;
- foco;
- formulários;
- mensagens de erro;
- navegação;
- componentes críticos.

 Registrar evidências.

---

 # 58\. Segurança — classificação

 Classificar achados como:

```
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

 A classificação deve seguir a metodologia de segurança adotada pelo projeto.

 Não criar uma classificação proprietária sem necessidade.

---

 # 59\. Critérios de bloqueio de segurança

 Impedem `DONE` problemas como:

 - bypass de autenticação;
- bypass de autorização;
- acesso a dados de outro usuário;
- exposição de secrets;
- exposição de credenciais;
- manipulação indevida de pagamento;
- vulnerabilidade crítica reproduzível;
- acesso administrativo indevido.

---

 # 60\. Correções permitidas

 Uma correção é permitida quando:

```
Problema encontrado
↓
Relaciona-se diretamente ao escopo da TASK-021
↓
Correção é localizada
↓
Não altera requisito
↓
Não altera arquitetura
↓
Teste comprova a correção
```

 Exemplo:

```
Falha:
Cliente B acessa pedido do Cliente A.

Correção:
Adicionar/verificar autorização no endpoint.

Teste:
Cliente B → Pedido A → 403.

Resultado:
PASS.
```

---

 # 61\. Correções proibidas

 Não fazer:

```
"Já que estamos mexendo nisso..."
```

 para:

 - refatorar arquitetura;
- trocar framework;
- mudar banco;
- alterar domínio;
- criar novos módulos;
- redesenhar UI inteira;
- substituir provider;
- alterar regra comercial.

 Essas mudanças exigem TASK/ADR apropriado.

---

 # 62\. Testes de regressão após correção

 Toda correção deve executar:

```
Teste que reproduzia o problema
+
Testes diretamente relacionados
+
Regressão aplicável
```

 Exemplo:

```
Correção de autorização
↓
Teste de autorização
↓
Teste de cliente proprietário
↓
Teste de admin
↓
Regressão de pedidos
```

---

 # 63\. Observabilidade durante os testes

 Utilizar os recursos da TASK-020 para investigar:

 - falhas;
- erros;
- autorização;
- eventos;
- notificações;
- pedidos;
- pagamentos.

 Quando aplicável, registrar:

```
correlationId
timestamp
request
resultado
```

---

 # 64\. Auditoria durante os testes

 Operações administrativas críticas devem gerar evidência de auditoria conforme os requisitos existentes.

 Validar:

```
Operação
↓
AuditLog
↓
Ator
↓
Recurso
↓
Resultado
```

 Não alterar a implementação de auditoria sem necessidade direta.

---

 # 65\. Testes de autorização administrativa

 Para cada função:

```
Usuário sem permissão
→ DENIED

Usuário com permissão
→ ALLOWED
```

 Cobrir:

 - produtos;
- estoque;
- pedidos;
- clientes;
- cupons;
- avaliações;
- usuários administrativos.

---

 # 66\. Teste de privilégio mínimo

 Verificar que cada papel consegue executar somente as operações previstas.

 Não conceder permissão adicional apenas para fazer o teste passar.

---

 # 67\. Teste de sessão administrativa

 Validar:

 - login;
- acesso ao painel;
- logout;
- sessão expirada;
- acesso direto após logout;
- autorização em endpoints administrativos.

---

 # 68\. Teste de dados pessoais

 Validar que:

 - cliente vê seus dados;
- cliente não vê dados de outro cliente;
- administração respeita permissões;
- logs não expõem dados indevidos;
- respostas de API são minimizadas.

---

 # 69\. Teste de segurança no frontend

 Não considerar:

```
botão escondido
```

 como controle de segurança.

 Validar sempre:

```
Frontend
+
Backend
```

---

 # 70\. Teste de segurança em APIs

 Executar para endpoints críticos:

 - sem autenticação;
- usuário comum;
- usuário proprietário;
- outro usuário;
- administrador;
- administrador sem permissão;
- administrador autorizado.

---

 # 71\. Teste de manipulação de parâmetros

 Testar alterações controladas de:

```
userId
customerId
orderId
productId
reviewId
couponId
```

 quando aplicável.

 Resultado esperado:

```
não permitir acesso ou alteração não autorizada.
```

---

 # 72\. Teste de concorrência aplicável

 Validar, quando relevante:

 - ações duplicadas;
- submissões repetidas;
- checkout duplicado;
- operações administrativas simultâneas;
- avaliações duplicadas.

 Não substituir os testes específicos de concorrência das TASKs anteriores.

---

 # 73\. Teste de submissão duplicada

 Para ações críticas:

```
Clique 1
Clique 2
```

 ou duas requisições equivalentes.

 Verificar que não são criados efeitos duplicados indevidos.

---

 # 74\. Teste de tratamento de erros

 Verificar que falhas apresentem:

 - mensagem compreensível;
- status adequado;
- nenhuma informação sensível;
- possibilidade de recuperação quando aplicável.

---

 # 75\. Teste de acessibilidade de estados

 Validar:

 - loading;
- sucesso;
- erro;
- vazio;
- disabled;
- selected;
- expanded/collapsed.

 Estados importantes não podem depender somente de cor.

---

 # 76\. Teste de navegação

 Validar:

 - menu;
- breadcrumbs quando existentes;
- links;
- voltar;
- avançar;
- rotas protegidas;
- redirecionamentos.

---

 # 77\. Teste de deep links

 Acessar diretamente:

```
/login
/catalog
/product/{id}
/cart
/checkout
/orders
/admin
```

 quando essas rotas existirem.

 Verificar autenticação e autorização apropriadas.

---

 # 78\. Teste de refresh

 Durante fluxos autenticados:

```
Abrir recurso
↓
Refresh
↓
Estado consistente
```

 Testar em páginas críticas.

---

 # 79\. Teste de back/forward

 Validar navegação do navegador sem:

 - recuperar sessão inválida;
- exibir dados indevidos;
- duplicar operação;
- quebrar estado crítico.

---

 # 80\. Teste de cache

 Quando aplicável, verificar que dados privados não sejam reutilizados entre usuários.

 Especialmente:

 - pedidos;
- perfil;
- endereço;
- favoritos;
- administração.

---

 # 81\. Teste de acessibilidade de autenticação

 Validar:

 - login;
- cadastro;
- recuperação;
- mensagens;
- foco;
- labels;
- teclado.

---

 # 82\. Teste de acessibilidade do checkout

 Validar:

 - endereço;
- frete;
- pagamento;
- resumo;
- erros;
- botões;
- foco;
- navegação.

---

 # 83\. Teste de acessibilidade administrativa

 Validar:

 - menu;
- tabelas;
- filtros;
- formulários;
- modais;
- ações;
- mensagens;
- paginação.

---

 # 84\. Teste mobile do checkout

 Executar:

```
Produto
↓
Carrinho
↓
Checkout
↓
Endereço
↓
Frete
↓
Pagamento
↓
Pedido
```

 em viewport mobile suportado.

---

 # 85\. Teste mobile de catálogo

 Validar:

 - menu;
- pesquisa;
- filtros;
- produto;
- variantes;
- favorito;
- carrinho.

---

 # 86\. Teste desktop administrativo

 Validar:

 - dashboard/painel;
- tabelas;
- filtros;
- edição;
- estoque;
- pedidos;
- usuários.

---

 # 87\. Matriz E2E

 | ID | Fluxo | Desktop | Mobile | Auth | A11y | Resultado |
| --- | --- | --- | --- | --- | --- | --- |
| E2E-001 | Cadastro | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| E2E-002 | Login | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| E2E-003 | Logout | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| E2E-004 | Recuperação | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| E2E-005 | Catálogo | ✓ | ✓ | - | ✓ | PASS/FAIL |
| E2E-006 | Favoritos | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| E2E-007 | Avaliação | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| E2E-008 | Carrinho | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| E2E-009 | Checkout | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| E2E-010 | Pagamento | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| E2E-011 | Idempotência | ✓ | - | ✓ | - | PASS/FAIL |
| E2E-012 | Pedido | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| E2E-013 | Rastreamento | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| E2E-014 | Administração | ✓ | conforme | ✓ | ✓ | PASS/FAIL |
| E2E-015 | Admin avançado | ✓ | conforme | ✓ | ✓ | PASS/FAIL |

---

 # 88\. Matriz de segurança

 | Controle | Cenário | Esperado | Resultado |
| --- | --- | --- | --- |
| Auth | sem sessão → recurso privado | DENIED | PASS/FAIL |
| Auth | credencial inválida | DENIED | PASS/FAIL |
| RBAC | cliente → admin | DENIED | PASS/FAIL |
| Isolation | cliente A → pedido B | DENIED | PASS/FAIL |
| Isolation | cliente A → favorito B | DENIED | PASS/FAIL |
| API | IDOR | DENIED | PASS/FAIL |
| Session | após logout | DENIED | PASS/FAIL |
| Data | dados sensíveis | NÃO EXPOR | PASS/FAIL |
| Admin | sem permissão | DENIED | PASS/FAIL |

---

 # 89\. Matriz de acessibilidade

 | Área | Teclado | Foco | Labels | Erros | Contraste | Resultado |
| --- | --- | --- | --- | --- | --- | --- |
| Login | ✓ | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| Cadastro | ✓ | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| Catálogo | ✓ | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| Produto | ✓ | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| Carrinho | ✓ | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| Checkout | ✓ | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| Pedidos | ✓ | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |
| Administração | ✓ | ✓ | ✓ | ✓ | ✓ | PASS/FAIL |

---

 # 90\. Matriz de responsividade

 | Fluxo | Mobile | Tablet | Desktop | Resultado |
| --- | --- | --- | --- | --- |
| Login | ✓ | ✓ | ✓ | PASS/FAIL |
| Catálogo | ✓ | ✓ | ✓ | PASS/FAIL |
| Produto | ✓ | ✓ | ✓ | PASS/FAIL |
| Carrinho | ✓ | ✓ | ✓ | PASS/FAIL |
| Checkout | ✓ | ✓ | ✓ | PASS/FAIL |
| Pedido | ✓ | ✓ | ✓ | PASS/FAIL |
| Administração | conforme | conforme | ✓ | PASS/FAIL |

---

 # 91\. Classificação dos achados

 Cada problema deve possuir:

```
ID:
Severidade:
Área:
Fluxo:
Ambiente:
Passos:
Resultado atual:
Resultado esperado:
Evidência:
Impacto:
Causa:
Correção:
Teste de regressão:
Estado:
```

 Estados:

```
OPEN
IN_PROGRESS
FIXED
RETEST
CLOSED
BLOCKED
DEFERRED
```

---

 # 92\. Regra para fechamento de achados

 Um problema somente pode ser `CLOSED` quando:

```
Correção aplicada
↓
Teste original passa
↓
Regressão passa
↓
Evidência registrada
```

---

 # 93\. Problemas críticos

 Problemas críticos devem:

 - ser corrigidos;
- ou possuir bloqueio formal documentado conforme processo aprovado.

 Não marcar `DONE` simplesmente ignorando um problema crítico.

---

 # 94\. Problemas fora do escopo

 Quando um achado não pertence à TASK:

```
Não corrigir automaticamente.
```

 Registrar:

```
Problema:
Motivo de não correção:
TASK/ADR relacionada:
Impacto:
Recomendação de encaminhamento:
```

 Não alterar TASK futura automaticamente.

---

 # 95\. Correção incidental

 Exemplo permitido:

```
Falha:
Cliente B consegue acessar pedido A.

Correção:
Ajustar autorização no endpoint existente.

Teste:
Cliente B → pedido A → DENIED.

Regressão:
Pedidos próprios → PASS.
Admin → PASS.
```

 Exemplo proibido:

```
Encontramos problema de autorização.
↓
Refatorar todo o sistema RBAC.
```

 Isso excede o escopo.

---

 # 96\. Performance E2E

 Registrar, quando aplicável:

 - tempo de carregamento;
- resposta de APIs críticas;
- duração dos fluxos;
- timeouts;
- falhas intermitentes.

 Não estabelecer novos SLOs sem requisito aprovado.

---

 # 97\. Flakiness

 Todo teste E2E instável deve ser investigado.

 Classificar:

```
Produto
Teste
Ambiente
Dados
Infraestrutura
```

 Não resolver flakiness simplesmente aumentando timeouts indiscriminadamente.

---

 # 98\. Reexecução

 Para falhas intermitentes:

```
Execução inicial
↓
Reexecução controlada
↓
Análise
↓
Classificação
```

 Registrar o resultado.

---

 # 99\. Testes de recuperação

 Quando aplicável:

```
Erro
↓
Usuário corrige
↓
Submete novamente
↓
Fluxo continua
```

 Cobrir principalmente:

 - login;
- checkout;
- formulários;
- pagamento de teste;
- administração.

---

 # 100\. Segurança de mensagens

 As mensagens apresentadas ao usuário não devem revelar:

 - SQL;
- stack trace;
- paths internos;
- secrets;
- tokens;
- detalhes de infraestrutura.

---

 # 101\. Segurança de frontend

 Validar que informações confidenciais não sejam:

 - armazenadas indevidamente;
- expostas em HTML;
- expostas em logs do navegador;
- incluídas em URLs sem necessidade;
- exibidas para usuários não autorizados.

---

 # 102\. Teste de permissões após refresh

 Executar:

```
Usuário sem permissão
↓
Acesso negado
↓
Refresh
↓
Acesso continua negado
```

---

 # 103\. Teste de permissões após logout

 Executar:

```
Usuário autorizado
↓
Logout
↓
Back
↓
Refresh
```

 Resultado:

```
nenhum acesso privado indevido.
```

---

 # 104\. Teste de cache entre usuários

 Cenário:

```
Cliente A
↓
consulta recurso privado
↓
logout

Cliente B
↓
mesmo navegador
↓
mesma rota
```

 Verificar que dados de A não apareçam para B.

---

 # 105\. Teste de múltiplas abas

 Quando aplicável:

 - sessão;
- logout;
- checkout;
- administração.

 Verificar consistência de estado.

---

 # 106\. Teste de duplicidade de ações

 Validar ações críticas com:

```
double click
refresh
retry
back/forward
duas requisições
```

 quando aplicável.

---

 # 107\. Segurança de arquivos

 Se houver upload no sistema:

 - tipo;
- tamanho;
- autorização;
- armazenamento;
- acesso;
- nomes;
- conteúdo.

 Somente se upload fizer parte do escopo existente.

---

 # 108\. Segurança de links

 Validar links para recursos privados.

 Não permitir acesso indireto a conteúdo protegido.

---

 # 109\. Auditoria dos testes

 Durante a validação administrativa, confirmar que operações críticas continuam gerando auditoria.

 Não alterar os registros de auditoria para facilitar os testes.

---

 # 110\. Observabilidade dos testes

 Para falhas relevantes, correlacionar:

```
E2E
↓
Request
↓
CorrelationId
↓
Log
↓
Audit/Metric/Event
```

 quando aplicável.

---

 # 111\. Critérios de aceitação

 A TASK-021 atende aos critérios quando:

 - [ ] fluxos críticos E2E passam;
- [ ] desktop validado;
- [ ] mobile validado;
- [ ] controles essenciais de acessibilidade validados;
- [ ] navegação por teclado validada;
- [ ] foco validado;
- [ ] formulários críticos validados;
- [ ] autorização validada;
- [ ] isolamento entre usuários validado;
- [ ] endpoints administrativos protegidos;
- [ ] sessão validada;
- [ ] dados sensíveis protegidos;
- [ ] regressões críticas não permanecem;
- [ ] problemas críticos foram resolvidos ou formalmente bloqueados;
- [ ] testes geram evidências;
- [ ] observabilidade da TASK-020 foi utilizada quando aplicável;
- [ ] documentação foi atualizada;
- [ ] rastreabilidade foi preservada;
- [ ] Scope Guard foi aprovado.

---

 # 112\. Quality Gates

 | Gate | Resultado | Evidência | Bloqueante |
| --- | --- | --- | --- |
| Build | PASS/FAIL | ... | SIM |
| Lint | PASS/FAIL | ... | SIM |
| Unit | PASS/FAIL | ... | SIM |
| Integration | PASS/FAIL | ... | SIM |
| API | PASS/FAIL | ... | SIM |
| E2E crítico | PASS/FAIL | ... | SIM |
| Segurança | PASS/FAIL | ... | SIM |
| Autorização | PASS/FAIL | ... | SIM |
| Isolamento | PASS/FAIL | ... | SIM |
| Acessibilidade | PASS/FAIL | ... | SIM |
| Responsividade | PASS/FAIL | ... | SIM |
| Regressão | PASS/FAIL | ... | SIM |
| Observabilidade | PASS/FAIL | ... | conforme aplicabilidade |
| Documentação | PASS/FAIL | ... | SIM |
| Rastreabilidade | PASS/FAIL | ... | SIM |
| Scope Guard | PASS/FAIL | ... | SIM |

---

 # 113\. Condições que impedem DONE

 A TASK não pode ser concluída se houver:

 - bypass de autenticação;
- bypass de autorização;
- acesso de um cliente aos dados de outro;
- acesso administrativo indevido;
- exposição de secrets;
- vulnerabilidade crítica não tratada;
- fluxo comercial crítico quebrado;
- regressão crítica;
- falha crítica de acessibilidade nos controles essenciais;
- E2E crítico falhando;
- build falhando;
- lint falhando;
- testes obrigatórios falhando;
- violação de `FORBIDDEN_CHANGES`.

---

 # 114\. Acessibilidade — critério de encerramento

 Não considerar a validação concluída apenas porque um scanner automatizado não encontrou violações.

 Deve existir evidência de:

```
Automação
+
Inspeção manual
+
Teclado
+
Foco
+
Formulários
+
Fluxos críticos
```

---

 # 115\. Segurança — critério de encerramento

 Não considerar segurança concluída apenas porque:

```
login funciona
```

 Devem ser validados:

```
Authentication
Authorization
Isolation
Session
Input
API
Data exposure
Administrative access
```

 conforme aplicabilidade.

---

 # 116\. E2E — critério de encerramento

 O conjunto mínimo deve cobrir:

```
Cadastro
Login
Logout
Catálogo
Favoritos
Avaliações
Carrinho
Checkout
Pagamento
Pedido
Rastreamento
Administração
```

 e demais casos necessários para os `UC-001–UC-015`.

---

 # 117\. Rastreamento dos casos de uso

 | Caso de uso | Cenários | Testes | Evidência | Resultado |
| --- | --- | --- | --- | --- |
| UC-001 | ... | ... | ... | PASS/FAIL |
| UC-002 | ... | ... | ... | PASS/FAIL |
| UC-003 | ... | ... | ... | PASS/FAIL |
| UC-004 | ... | ... | ... | PASS/FAIL |
| UC-005 | ... | ... | ... | PASS/FAIL |
| UC-006 | ... | ... | ... | PASS/FAIL |
| UC-007 | ... | ... | ... | PASS/FAIL |
| UC-008 | ... | ... | ... | PASS/FAIL |
| UC-009 | ... | ... | ... | PASS/FAIL |
| UC-010 | ... | ... | ... | PASS/FAIL |
| UC-011 | ... | ... | ... | PASS/FAIL |
| UC-012 | ... | ... | ... | PASS/FAIL |
| UC-013 | ... | ... | ... | PASS/FAIL |
| UC-014 | ... | ... | ... | PASS/FAIL |
| UC-015 | ... | ... | ... | PASS/FAIL |

---

 # 118\. Rastreabilidade de requisitos

 | Requisito | Cenário | Teste | Evidência | Resultado |
| --- | --- | --- | --- | --- |
| RNF-003 | ... | ... | ... | PASS/FAIL |
| RNF-004 | ... | ... | ... | PASS/FAIL |
| RNF-005 | ... | ... | ... | PASS/FAIL |
| RNF-006 | ... | ... | ... | PASS/FAIL |
| RNF-014 | ... | ... | ... | PASS/FAIL |

Adicionar requisitos adicionais efetivamente aplicáveis.

---

 # 119\. Testes mínimos

```
T021-E2E-001
Cadastro

T021-E2E-002
Login/logout

T021-E2E-003
Catálogo

T021-E2E-004
Favoritos

T021-E2E-005
Avaliação

T021-E2E-006
Carrinho

T021-E2E-007
Checkout

T021-E2E-008
Pagamento

T021-E2E-009
Pedido

T021-E2E-010
Rastreamento

T021-E2E-011
Administração

T021-SEC-001
Acesso sem autenticação

T021-SEC-002
Bypass de autorização

T021-SEC-003
Isolamento entre clientes

T021-SEC-004
Proteção administrativa

T021-SEC-005
Exposição de dados

T021-SEC-006
Sessão/logout

T021-A11Y-001
Teclado

T021-A11Y-002
Foco

T021-A11Y-003
Formulários

T021-A11Y-004
Mensagens de erro

T021-A11Y-005
Contraste/estados

T021-RESP-001
Mobile

T021-RESP-002
Desktop

T021-REG-001
Regressão crítica
```

---

 # 120\. Evidências obrigatórias

 Guardar, conforme o ambiente:

 - relatório E2E;
- screenshots;
- traces;
- logs;
- resultados de scanner;
- matriz de autorização;
- matriz de acessibilidade;
- matriz de responsividade;
- lista de achados;
- resultados de reteste.

---

 # 121\. Documentação

 Atualizar, conforme estrutura existente:

```
docs/testing/**
docs/security/**
docs/accessibility/**
docs/e2e/**
```

 Documentar:

 - como executar E2E;
- como executar testes de acessibilidade;
- ambientes;
- usuários de teste;
- dados de teste;
- browsers suportados;
- resultados;
- problemas conhecidos;
- critérios de aprovação.

---

 # 122\. Reprodução local

 A documentação deve permitir que outro executor reproduza:

```
setup
↓
test data
↓
environment
↓
E2E
↓
security checks
↓
a11y checks
↓
report
```

---

 # 123\. Ambiente de teste

 Nunca executar testes destrutivos contra produção.

 Confirmar explicitamente:

```
Environment:
Database:
Payment mode:
External providers:
Test accounts:
```

---

 # 124\. Proteção contra produção

 Antes da execução:

 - [ ] ambiente correto confirmado;
- [ ] banco correto confirmado;
- [ ] payment sandbox confirmado;
- [ ] credenciais de teste confirmadas;
- [ ] providers de teste confirmados;
- [ ] dados reais não utilizados.

---

 # 125\. Limpeza pós-teste

 Após testes:

 - remover dados temporários quando aplicável;
- invalidar tokens de teste;
- limpar pedidos de teste conforme procedimento;
- não apagar evidências necessárias;
- não remover logs/auditoria necessários para rastreabilidade.

---

 # 126\. Testes repetíveis

 Um teste deve informar:

```
Pré-condições
Passos
Dados
Resultado esperado
Resultado obtido
Evidência
```

---

 # 127\. Relatório de execução

 Produzir:

```
TASK-021 EXECUTION REPORT

TASK:
TASK-021

Nome:
Segurança, acessibilidade e testes E2E

Estado inicial:
BLOCKED

Dependência:
TASK-020 = DONE

Estado final:
DONE / FAILED / BLOCKED

Build:
PASS/FAIL

Lint:
PASS/FAIL

Unit:
PASS/FAIL

Integration:
PASS/FAIL

API:
PASS/FAIL

E2E:
PASS/FAIL

Security:
PASS/FAIL

Authentication:
PASS/FAIL

Authorization:
PASS/FAIL

Isolation:
PASS/FAIL

Accessibility:
PASS/FAIL

Responsive:
PASS/FAIL

Regression:
PASS/FAIL

Observability:
PASS/FAIL

Documentation:
PASS/FAIL

Traceability:
PASS/FAIL

Scope Guard:
PASS/FAIL

Testes executados:
...

Testes adicionados:
...

Achados:
...

Achados críticos:
...

Achados corrigidos:
...

Achados bloqueados:
...

Correções incidentais:
...

Arquivos alterados:
...

Documentação atualizada:
...

Evidências:
...

Riscos:
...

Pendências:
...

Decision:
DONE / FAILED / BLOCKED

TASKS.md:
ATUALIZADO
```

---

 # 128\. Definition of Done específica

 A TASK-021 somente pode ser marcada `DONE` quando:

```
TASK-020 = DONE
AND
testes E2E críticos executados
AND
segurança validada
AND
autenticação validada
AND
autorização validada
AND
isolamento entre usuários validado
AND
controles administrativos validados
AND
acessibilidade validada
AND
navegação por teclado validada
AND
foco validado
AND
formulários críticos validados
AND
responsividade validada
AND
desktop validado
AND
mobile validado
AND
regressão crítica validada
AND
problemas críticos resolvidos ou formalmente bloqueados
AND
build aprovado
AND
lint aprovado
AND
testes aplicáveis aprovados
AND
documentação atualizada
AND
rastreabilidade preservada
AND
ALLOWED_CHANGES respeitado
AND
FORBIDDEN_CHANGES não violado
AND
Scope Guard aprovado
AND
DoD global atendido
AND
relatório de execução produzido
AND
TASKS.md atualizado
```

---

 # 129\. Atualização do TASKS.md

 Sucesso:

```
| 21 | TASK-021 | PHASE-04 | HIGH | TASK-020 | DONE |
```

 Falha:

```
| 21 | TASK-021 | PHASE-04 | HIGH | TASK-020 | FAILED |
```

 Bloqueio:

```
| 21 | TASK-021 | PHASE-04 | HIGH | TASK-020 | BLOCKED |
```

 A justificativa deve constar no relatório de execução.

---

 # 130\. Relação com TASK-020

 A TASK-021 consome os recursos produzidos pela TASK-020:

```
TASK-020
   ↓
Logs
Métricas
Auditoria
Health
Notificações
   ↓
TASK-021
   ↓
Validação transversal
```

 Não recriar a infraestrutura de observabilidade.

 Utilizá-la para validar o comportamento da aplicação.

---

 # 131\. Relação com TASK-022

 A TASK-021 deve produzir evidências que serão utilizadas pela TASK-022:

```
TASK-021
   ↓
Segurança
Acessibilidade
E2E
Regressão
   ↓
TASK-022
   ↓
Readiness final
```

 Porém:

 **TASK-021 não executa o readiness final.**

 Não decidir lançamento.

 Não criar checklist de aprovação de produção além do necessário para os próprios critérios da TASK.

---

 # 132\. Escopo explicitamente reservado para TASK-022

 Não antecipar:

 - validação final de backup/restore;
- decisão final de release;
- consolidação final de todos os Quality Gates;
- matriz final de riscos;
- decisão de readiness;
- aprovação de lançamento.

 Esses itens permanecem na `TASK-022`.

---

 # 133\. Política de parada

 Ao finalizar:

```
TASK-021 = DONE
```

 parar.

 Não iniciar automaticamente:

```
TASK-022
```

 Não corrigir problemas não pertencentes à TASK-021.

 Não criar novas funcionalidades.

 A próxima TASK somente poderá iniciar mediante autorização explícita.

---

 # 134\. Gate final

```
TASK-020 = DONE
        ↓
Definition of Ready
        ↓
Preparar ambiente
        ↓
Executar E2E
        ↓
Validar segurança
        ↓
Validar autorização
        ↓
Validar isolamento
        ↓
Validar acessibilidade
        ↓
Validar responsividade
        ↓
Executar regressão
        ↓
Corrigir problemas diretamente causados
        ↓
Retestar
        ↓
Build/Lint/Testes
        ↓
Rastreabilidade
        ↓
Scope Guard
        ↓
Definition of Done
        ↓
TASK-021 = DONE
        ↓
PARAR E AGUARDAR AUTORIZAÇÃO
```

---

 # 135\. Resultado final esperado

 A TASK-021 deve deixar evidenciado que:

```
✓ Fluxos críticos funcionam ponta a ponta.
✓ Autenticação está validada.
✓ Autorização está validada.
✓ Clientes não acessam recursos privados de outros clientes.
✓ Administração está protegida.
✓ APIs críticas respeitam autorização.
✓ Sessões foram validadas.
✓ Dados sensíveis não são expostos indevidamente.
✓ Acessibilidade dos fluxos essenciais foi validada.
✓ Navegação por teclado funciona.
✓ Foco e formulários foram validados.
✓ Desktop foi validado.
✓ Mobile foi validado.
✓ Regressões críticas foram verificadas.
✓ Problemas críticos não permanecem sem tratamento.
✓ Evidências dos testes foram registradas.
✓ Observabilidade da TASK-020 foi utilizada.
✓ Rastreabilidade foi preservada.
✓ Nenhum escopo da TASK-022 foi absorvido.
```

 **Condição de encerramento:** `TASK-021 = DONE` somente após todos os Gates obrigatórios passarem, os resultados estarem registrados e o relatório de execução estar produzido.

 A sequência permanece:

```
TASK-019
   ↓
TASK-020
   ↓
TASK-021
   ↓
TASK-022
```


---

 # Registro de execução (2026-11-19 a 2026-11-23)

 **TASK:** TASK-021 — **Status:** DONE — **Branch:** `feature/TASK-021-seguranca-acessibilidade-e2e`
 **Autorização:** "Fiz o merge, verifique e inicie a TASK-021" (responsável, 2026-11-19), após o merge dos PRs #23 (TASK-020) e #24 (Next.js 16.4.6).
 **Transições:** `BLOCKED → READY → IN_PROGRESS → IN_REVIEW → DONE`.

 ## ETAPA-001 — Recontextualização e prontidão

 - Dependências TASK-020 e TASK-023 `DONE`. `main` verificada após os merges: `npm ci` com Next.js 16.4.6; `npm run quality` com 47 arquivos/250 testes e build aprovado.

 ## ETAPA-002/003 — Ferramentas e implementação

 **Dependências de desenvolvimento (justificativa)**

| Pacote | Versão | Justificativa |
|---|---|---|
| `@playwright/test` | 1.65.0 | Executor E2E com os três motores exigidos pelo RNF-023 (Chromium, Firefox, WebKit) |
| `playwright-core` | 1.65.0 | Fixado para manter uma única cópia: sem ele, o `@axe-core/playwright` instalava a 1.65.1 e os tipos de `Page` colidiam |
| `@axe-core/playwright` | 4.14.0 | Verificação automatizada de WCAG 2.2 AA (RNF-020) |

 As versões foram fixadas (exatas) e têm pelo menos duas semanas de publicação. O `package-lock.json` recebeu apenas adições; os campos `libc` foram preservados (o npm local os removeria).

 **Infraestrutura de E2E** (`playwright.config.ts`, `tests/e2e/`)

 - Build de produção (`next build` + `next start`, porta 3100) e banco dedicado `tropa_fight_e2e` (padrão: PostgreSQL do Docker Compose; configurável por `E2E_DATABASE_URL`). O `global-setup.ts` cria o banco se faltar, aplica todas as migrations e semeia dados fixos e idempotentes: administrador geral, gerente de catálogo, produto publicado com variante em estoque e variante sem estoque, e cupom `E2E10`.
 - Segredo do webhook gerado por execução e compartilhado com o servidor. A aprovação de pagamento é assinada exatamente como no `npm run payment:simulate`.
 - **Proxy TLS local** (`tests/e2e/https-proxy.mjs`, porta 3443, certificado autoassinado gerado com OpenSSL a cada execução). O cookie de sessão é sempre `Secure` (ADR-012), e o WebKit/Safari descarta cookies `Secure` em `http://localhost`. Sem o proxy, todo login falhava no WebKit. A autenticação não foi alterada, porque isso é proibido; os testes passam a rodar sobre HTTPS, como em produção.
 - Seis projetos: `chromium`, `firefox` e `webkit` em desktop, e as mesmas três engines a 360 px (RNF-021).
 - A recuperação de senha não tem provedor de e-mail na V1. O teste grava um token conhecido no banco (com hash, como o repositório) e segue o fluxo pela tela de redefinição.
 - Script `npm run test:e2e`.

 **Specs**

| Arquivo | Cobertura |
|---|---|
| `auth.spec.ts` | Cadastro, login, perfil, logout, credenciais inválidas, política de senha, recuperação e redefinição (UC-001–UC-004) |
| `storefront.spec.ts` | Compra completa: catálogo → produto → variante → carrinho → cupom inválido e válido → checkout → endereço → cotação → pedido → PIX → aprovação assinada → histórico e detalhe `Pagamento confirmado`. Também cobre variante sem estoque e o redirecionamento ao login de visitante anônimo (UC-005–UC-011) |
| `accessibility.spec.ts` | axe com tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` e `wcag22aa` em 12 páginas; ausência de rolagem horizontal; teclado (o link "Pular para o conteúdo" é o primeiro foco e leva ao conteúdo) |
| `admin-api.spec.ts` (`@api`) | Fluxos administrativos contra o servidor real: o gerente de catálogo cria categoria, marca, produto e variante, dá entrada no estoque e publica; filtros de pedidos; consulta de clientes sem dados pessoais; moderação; contas administrativas com revogação de sessão e RN-022; matriz de RBAC (403/401); posse de dados entre clientes; webhook forjado ou sem assinatura; auditoria |
| `performance.spec.ts` (`@perf`) | Medição de referência do RNF-022 (abaixo) |

 **Teste arquitetural** (`tests/architecture/layer-dependencies.test.ts`)

 - O teste agora cobre `src/modules/**`, com as regras do ADR-002 e a única exceção do ADR-020 (`presentation → infrastructure`). Ele também exige que todo arquivo de módulo pertença a uma camada.
 - **Violações preexistentes registradas** (lista fechada no próprio teste; qualquer violação nova falha, e uma entrada que deixar de existir precisa ser removida):
   1. `modules/audit/application/audit-service.ts` → `../infrastructure/audit-repository`
   2. `modules/auth/application/session-service.ts` → `../../identity/infrastructure/identity-repository`
   3. `modules/identity/application/identity-service.ts` → `../../../infrastructure/logger`
   4. `modules/identity/application/identity-service.ts` → `../infrastructure/identity-repository`
   5. `modules/identity/application/identity-service.ts` → `../infrastructure/password-hasher`

   Todas são `application → infrastructure`, existem desde as TASK-003/004 e corrigi-las exige refatorar autenticação e auditoria, fora do `ALLOWED_CHANGES`. Ficam como dívida técnica para o checkpoint TASK-022, junto com a dívida do checkout já aceita no ADR-020.
 - Sanidade: uma importação `domain → infrastructure` temporária fez o teste falhar e foi removida.

 **Correções de acessibilidade/responsividade:** nenhuma foi necessária (ver resultados).

 **Limitador de tentativas de login (R6, opcional):** não implementado. O risco de força bruta continua aceito, como já registrado no `README.md`.

 ## ETAPA-004 — Resultados

 **E2E (`npm run test:e2e`, 2026-11-23):** 104 aprovados, 0 falhas, 19 pulados de propósito: os testes `@api` rodam só no Chromium desktop (14) e a medição `@perf` só no Chromium desktop (5).

| Projeto | auth | storefront | accessibility | admin-api | perf |
|---|---|---|---|---|---|
| chromium | 4/4 | 3/3 | 9/9 | 7/7 | 1/1 |
| firefox | 4/4 | 3/3 | 9/9 | pulado | pulado |
| webkit | 4/4 | 3/3 | 9/9 | pulado | pulado |
| chromium-360 | 4/4 | 3/3 | 9/9 | — | pulado |
| firefox-360 | 4/4 | 3/3 | 9/9 | — | pulado |
| webkit-360 | 4/4 | 3/3 | 9/9 | — | pulado |

 **Acessibilidade (RNF-020) e responsividade (RNF-021):**
 - **Páginas auditadas:** `/`, `/catalog`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/products/[id]`, `/profile`, `/cart`, `/checkout`, `/orders` e `/orders/[id]`.
 - **Resultado do axe:** **0 violações de qualquer severidade** em todas essas páginas, nos 6 projetos. Não há rolagem horizontal a 360 px.
 - **Limite da automação:** ela não substitui uma revisão manual completa de WCAG (por exemplo, leitor de tela e conteúdo). O roteiro manual a 360 px da TASK-023 foi aprovado pelo responsável.

 **Desempenho (RNF-022) — ambiente e método**

 - **Ambiente de referência:**
   - MacBook com Intel Core i7-9750H, 16 GB, macOS 26.7.1, Node.js 22.14.0;
   - Next.js 16.4.6 em build de produção atrás do proxy TLS local;
   - PostgreSQL 18.6 no Docker Compose, na mesma máquina;
   - Chromium 158 (Playwright 1.65.0); sem carga concorrente.
 - **APIs:** 2 requisições de aquecimento e 30 medidas por endpoint, com o cliente autenticado. O tempo é a resposta completa vista pelo cliente.
 - **Páginas:** 1 carga de aquecimento e 10 medidas, do início da navegação até a rede ociosa (`networkidle`), com o título principal visível e sem indicador de carregamento. Inclui a busca de dados no cliente e a janela de ~500 ms que o `networkidle` exige, por isso é um limite superior conservador.

| API | mediana | p95 | máx. |
|---|---:|---:|---:|
| `GET /api/products` | 28 ms | 36 ms | 71 ms |
| `GET /api/products/{id}` | 17 ms | 20 ms | 21 ms |
| `GET /api/cart` | 27 ms | 31 ms | 34 ms |
| `POST /api/checkout/quotes` | 30 ms | 33 ms | 36 ms |
| `GET /api/orders` | 18 ms | 21 ms | 23 ms |
| `GET /api/orders/{id}` | 18 ms | 22 ms | 32 ms |
| `GET /api/health` | 9 ms | 11 ms | 11 ms |

| Página | mediana | p95 | máx. |
|---|---:|---:|---:|
| `/catalog` | 602 ms | 605 ms | 605 ms |
| `/products/[id]` | 576 ms | 585 ms | 585 ms |
| `/cart` | 608 ms | 633 ms | 633 ms |
| `/checkout` | 595 ms | 606 ms | 606 ms |
| `/orders` | 598 ms | 603 ms | 603 ms |
| `/orders/[id]` | 604 ms | 608 ms | 608 ms |

 Metas atendidas: p95 das APIs ≤ 2 s e das páginas críticas ≤ 3 s. Trata-se de uma medição local, com um único usuário; não substitui um teste de carga em ambiente hospedado, que não existe na V1.

 **Relatório de segurança (RBAC, posse de dados, webhook e segredos)**

| Área | Verificação | Evidência | Resultado |
|---|---|---|---|
| RBAC | Rotas administrativas: `CUSTOMER` 403 e visitante 401 em 9 rotas; `CATALOG_MANAGER` 403 em clientes, avaliações, usuários e auditoria; sem escalonamento por `/admin/users` | `admin-api.spec.ts`, `admin-management-flow`, `admin-moderation-users-flow`, `catalog-flow`, `inventory-api` | OK |
| Posse de dados (RN-016) | Outro cliente recebe 404 em pedido, rastreamento e pagamento alheios; histórico vazio | `admin-api.spec.ts`, `order-api-flow`, `review-favorite-flow`, `cart-flow` | OK |
| Dados pessoais (RN-019) | Consulta de clientes sem CPF, telefone ou endereço; auditoria e notificações sem e-mail nem senha | `admin-api.spec.ts`, `admin-management-flow`, `order-notifications`, `privacy-logging` | OK |
| Webhook | Assinatura inválida ou ausente → 401 sem alterar o pagamento; eventos idempotentes por `(provider, provider_event_id)`; o simulador só envia para destino local | `admin-api.spec.ts`, `payment-webhook`, `checkout-api-flow`, `payment-simulator-script` | OK |
| Sessão | Cookie `HttpOnly`, `Secure`, `SameSite=Lax`, 12 h; desativação revoga sessões; logout invalida a sessão | `session-cookie.ts`, `auth.spec.ts`, `admin-moderation-users-flow` | OK |
| Segredos | Nenhum `.env` versionado além do `.env.example`; nenhum padrão de chave ou segredo nos arquivos versionados; segredos de teste gerados por execução | varredura com `git ls-files` + `grep` | OK |
| Dependências | `npm audit` sem vulnerabilidades (após o Next.js 16.4.6) | `npm audit` | OK |
| Força bruta no login | Sem limitador (R6 opcional, não implementado) | `README.md` (risco aceito) | Risco aceito, não crítico |

 Nenhuma falha crítica em aberto.

 **Constatação de compatibilidade:** em `http://localhost`, o WebKit/Safari não guarda o cookie de sessão `Secure`. Afeta só o uso local sem HTTPS (por exemplo, `npm run dev` aberto no Safari). Em HTTPS o login funciona nos três motores. Recomendação para o README/TASK-022: usar Chrome ou Firefox no desenvolvimento local, ou acessar por HTTPS.

 **Limite da verificação do RNF-023:** foram exercitados os motores atuais do Playwright (Chromium 158, Firefox 159 e WebKit 27.2). O Edge usa o motor Chromium e o Safari usa o WebKit. A exigência de "duas versões estáveis mais recentes" de cada navegador de marca não foi verificada individualmente.

 **Quality Gate (`npm run quality`):** formatação, lint (27 avisos `only-export-components` preexistentes, nenhum novo), typecheck, 47 arquivos/252 testes e build aprovados.

| Gate | Resultado |
|---|---|
| Build | PASS |
| Lint | PASS (avisos preexistentes) |
| Unit | PASS |
| Integration | PASS |
| API | PASS (`admin-api.spec.ts` contra o servidor real) |
| Security | PASS (relatório acima; nenhuma falha crítica) |
| Acceptance | PASS |
| Regression | PASS (252 testes Vitest + 104 E2E) |

 ## ETAPA-005 — Teste manual

 Não houve tela nova. A validação de interface foi automatizada nos três motores, em desktop e a 360 px; o roteiro manual a 360 px da TASK-023 já foi aprovado pelo responsável.

 ## ETAPA-006 — Conclusão

 | Arquivo | Classificação |
 | --- | --- |
 | `playwright.config.ts`, `tests/e2e/**` | PRIMARY |
 | `tests/architecture/layer-dependencies.test.ts` | PRIMARY |
 | `package.json` (`test:e2e`, dependências de desenvolvimento), `package-lock.json` | PRIMARY |
 | `.gitignore` (`test-results/`, `playwright-report/`) | PRIMARY (configuração de E2E) |
 | `docs/TASKS/TASK021.MD`, `TASKS.md` | PRIMARY |

 Nenhuma alteração INCIDENTAL ou FORBIDDEN. Não houve mudança em requisitos, arquitetura, regras comerciais nem testes existentes enfraquecidos.

 **Notas de ambiente:**
 - O cache padrão de navegadores do Playwright (`~/Library/Caches/ms-playwright`) pertence ao `root` nesta máquina, por uma instalação antiga com `sudo`. Os navegadores foram instalados em `~/Library/Caches/ms-playwright-user`, usando `PLAYWRIGHT_BROWSERS_PATH`. Para usar o caminho padrão, corrija a permissão com `sudo chown -R $USER ~/Library/Caches/ms-playwright` e rode `npx playwright install`.
 - Os E2E precisam do PostgreSQL do Docker Compose (`docker compose up -d db`) e do OpenSSL no `PATH`.
