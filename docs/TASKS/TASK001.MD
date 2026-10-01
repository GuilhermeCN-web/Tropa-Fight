# TASK-001 — Inicializar aplicação e fundação de qualidade

 ## 1\. Identificação

 - **ID:** TASK-001
- **Título:** Inicializar aplicação e fundação de qualidade
- **Status:** READY
- **Phase:** PHASE-01
- **Priority:** CRITICAL
- **Tipo:** Foundation / Architecture / Quality
- **Dependências:** NONE
- **Bloqueia:** TASK-002, TASK-003 e TASK-004
- **Estimativa:** \[A definir\]
- **Responsável:** \[A definir\]

---

 # 2\. Objetivo

 Criar o esqueleto executável inicial do **Tropa Fight**, estabelecendo a fundação técnica necessária para o desenvolvimento das próximas fases.

 A TASK deve entregar uma aplicação que:

 1. compile corretamente;
2. possa ser executada localmente;
3. possua separação inicial entre Presentation, Application, Domain e Infrastructure;
4. possua configuração inicial de testes;
5. possua lint e validações de qualidade;
6. possua convenções básicas de desenvolvimento;
7. permita que as próximas tasks sejam implementadas sem necessidade de reestruturar a fundação;
8. tenha instruções reproduzíveis para instalação, execução e validação.

 **Esta TASK não implementa funcionalidades comerciais.**

---

 # 3\. Referências

 ## Requisitos relacionados

 - RNF-001
- RNF-002
- RNF-013

 ## ADRs relacionados

 - ADR-001
- ADR-002

 ## Tasks relacionadas

 - TASK-002 — Definir infraestrutura, ambientes e observabilidade
- TASK-003 — Identidade, autenticação e autorização
- TASK-004 — Auditoria, privacidade e notificações base

---

 # 4\. Escopo

 ## 4.1 Incluído

 Esta TASK contempla:

 - inicialização do projeto;
- configuração do runtime;
- estrutura de diretórios;
- separação arquitetural inicial;
- configuração de compilação;
- configuração de lint;
- configuração de testes;
- configuração de type checking, quando aplicável;
- configuração de scripts de desenvolvimento;
- configuração de variáveis de ambiente não sensíveis;
- arquivo de exemplo de configuração;
- teste inicial de funcionamento;
- documentação operacional mínima;
- convenções básicas de código;
- validação das dependências entre camadas.

---

 ## 4.2 Explicitamente fora do escopo

 Não implementar nesta TASK:

 - cadastro de usuários;
- login;
- logout;
- recuperação de senha;
- RBAC;
- catálogo;
- produtos;
- categorias;
- marcas;
- variantes;
- preços comerciais;
- estoque;
- carrinho;
- checkout;
- pedidos;
- pagamentos;
- cupons;
- promoções;
- avaliações;
- favoritos;
- notificações reais;
- integrações externas reais;
- gateways de pagamento;
- transportadoras;
- regras comerciais;
- migrations de domínio;
- banco de dados comercial;
- infraestrutura de produção.

---

 # 5\. ALLOWED\_CHANGES

 Somente os seguintes tipos de alteração são permitidos:

```
/
├── arquivos de configuração
├── src/**
├── tests/**
├── configuração de qualidade
├── documentação operacional mínima
└── TASKS.md
```

 Exemplos de arquivos potencialmente permitidos:

```
package.json
[configuração do compilador]
[configuração do lint]
[configuração dos testes]
[configuração do formatter]
.env.example
README.md
TASKS.md

src/**
tests/**
docs/**
```

 Os nomes exatos devem respeitar a stack previamente aprovada pelo projeto.

---

 # 6\. FORBIDDEN\_CHANGES

 É proibido:

 - implementar regras de negócio;
- criar catálogo;
- criar checkout;
- criar pagamentos;
- criar pedidos;
- criar estoque comercial;
- criar autenticação funcional;
- criar autorização funcional;
- integrar serviços externos reais;
- adicionar credenciais reais;
- adicionar secrets ao repositório;
- criar migrations de domínio;
- introduzir decisões arquiteturais não aprovadas;
- alterar requisitos existentes;
- antecipar funcionalidades de outras phases;
- criar abstrações complexas sem necessidade;
- adicionar dependências sem justificativa;
- contornar a arquitetura definida.

 Qualquer necessidade de alteração fora do escopo deve ser registrada como **BLOCKER** ou alteração de escopo.

---

 # 7\. Princípios arquiteturais

 A aplicação deverá iniciar seguindo a separação:

```
Presentation
      ↓
Application
      ↓
Domain

Infrastructure
      ↓
Application / Domain
```

 A implementação deve evitar dependências indevidas.

 ## 7.1 Presentation

 Responsável por:

 - entrada HTTP/UI;
- controllers;
- requests;
- responses;
- validação de entrada no limite da aplicação;
- composição da camada de apresentação.

 Não deve conter regras de negócio.

---

 ## 7.2 Application

 Responsável por:

 - casos de uso;
- orquestração;
- contratos necessários à aplicação;
- coordenação entre domínio e infraestrutura.

 Não deve depender diretamente de detalhes específicos de infraestrutura quando uma abstração for necessária.

---

 ## 7.3 Domain

 Responsável por:

 - conceitos de domínio;
- entidades;
- value objects;
- regras de negócio;
- invariantes.

 Nesta TASK, o domínio deve permanecer **mínimo e estrutural**.

 Não criar entidades comerciais apenas para preencher a estrutura.

---

 ## 7.4 Infrastructure

 Responsável por:

 - implementação de persistência;
- adapters;
- acesso a serviços externos;
- detalhes técnicos.

 Nesta TASK, apenas a fundação necessária deve existir.

 Não implementar integrações reais.

---

 # 8\. Estrutura inicial esperada

 A estrutura deverá ser equivalente a:

```
src/
├── presentation/
│   ├── controllers/
│   ├── routes/
│   └── ...
│
├── application/
│   ├── use-cases/
│   ├── services/
│   └── ...
│
├── domain/
│   ├── entities/
│   ├── value-objects/
│   └── ...
│
├── infrastructure/
│   ├── config/
│   ├── persistence/
│   └── ...
│
└── ...
```

 Testes:

```
tests/
├── unit/
├── integration/
└── ...
```

 A estrutura pode ser adaptada à stack aprovada, desde que a separação conceitual seja preservada.

---

 # 9\. Bootstrap da aplicação

 A aplicação deverá possuir um ponto de entrada claramente definido.

 Exemplo conceitual:

```
Application Bootstrap
        ↓
Configuration
        ↓
Infrastructure
        ↓
Application
        ↓
Presentation
        ↓
Server
```

 O bootstrap deve:

 1. carregar configuração;
2. validar configuração necessária;
3. inicializar os componentes fundamentais;
4. registrar dependências;
5. iniciar a aplicação;
6. disponibilizar mecanismo mínimo de health/status, se previsto pela arquitetura aprovada.

 Não adicionar lógica comercial ao bootstrap.

---

 # 10\. Configuração

 ## 10.1 Variáveis de ambiente

 Criar uma configuração centralizada para valores externos.

 Exemplo:

```
APP_ENV=development
APP_PORT=3000
LOG_LEVEL=info
```

 Os nomes reais devem seguir a convenção da stack escolhida.

---

 ## 10.2 .env.example

 Deve existir um arquivo de exemplo contendo somente valores seguros.

 Exemplo:

```
APP_ENV=development
APP_PORT=3000
LOG_LEVEL=info
```

 Não incluir:

 - senhas;
- tokens;
- API keys;
- secrets;
- credenciais reais.

---

 # 11\. Configuração de qualidade

 ## 11.1 Build

 Deve existir um comando padronizado para compilação.

 Exemplo:

```
npm run build
```

 ou equivalente à stack escolhida.

 Critério:

```
BUILD = PASS
```

---

 ## 11.2 Desenvolvimento

 Deve existir comando padronizado para execução local.

 Exemplo:

```
npm run dev
```

 Critério:

```
APPLICATION_START = PASS
```

---

 ## 11.3 Lint

 Deve existir comando:

```
npm run lint
```

 O lint deve:

 - detectar erros de estilo;
- detectar problemas configurados;
- respeitar a convenção do projeto;
- não exigir correções manuais após uma execução normal.

 Critério:

```
LINT = PASS
```

---

 ## 11.4 Testes

 Deve existir comando padronizado:

```
npm test
```

 ou equivalente.

 Critério:

```
TEST = PASS
```

---

 ## 11.5 Type checking

 Quando suportado pela stack:

```
npm run typecheck
```

 Critério:

```
TYPECHECK = PASS
```

---

 # 12\. Teste inicial obrigatório

 Criar pelo menos um teste que demonstre que o ambiente de testes está corretamente configurado.

 O teste deve validar um comportamento simples e não comercial.

 Exemplo conceitual:

```
Application
    ↓
Health/Bootstrap
    ↓
Expected result
```

 O teste não deve introduzir regra de negócio.

---

 # 13\. Testes arquiteturais

 Sempre que a stack permitir, criar validações para evitar dependências proibidas entre camadas.

 Exemplos:

```
Domain → não depende de Presentation
Domain → não depende de Infrastructure
Application → não depende de detalhes concretos indevidos
Presentation → não acessa persistência diretamente
```

 Critério:

```
ARCHITECTURE_TEST = PASS
```

---

 # 14\. Health Check

 Caso previsto na arquitetura inicial, disponibilizar uma verificação mínima da aplicação.

 Exemplo conceitual:

```
GET /health
```

 Resposta:

```
{
  "status": "ok"
}
```

 O health check não deve depender de funcionalidades comerciais.

 Se a arquitetura aprovada não exigir endpoint nesta etapa, documentar explicitamente a decisão.

---

 # 15\. Tratamento de erros

 Criar a fundação mínima para tratamento consistente de erros.

 Deve existir separação entre:

 - erro esperado da aplicação;
- erro de validação;
- erro inesperado;
- erro de infraestrutura.

 Não criar neste momento uma taxonomia extensa de erros comerciais.

---

 # 16\. Logging inicial

 Configurar logging mínimo para desenvolvimento.

 Deve ser possível registrar:

 - inicialização da aplicação;
- encerramento;
- erros inesperados;
- informações operacionais básicas.

 Nunca registrar:

 - passwords;
- tokens;
- secrets;
- credenciais;
- dados sensíveis desnecessários.

---

 # 17\. Dependências

 Toda dependência adicionada deve responder a pelo menos uma destas necessidades:

 - execução da aplicação;
- arquitetura aprovada;
- testes;
- lint;
- compilação;
- qualidade;
- configuração essencial.

 Para cada dependência relevante, registrar:

```
Nome:
Finalidade:
Camada:
Motivo:
```

 Evitar dependências especulativas para funcionalidades futuras.

---

 # 18\. Convenções de código

 Definir e documentar minimamente:

 - nomenclatura de arquivos;
- nomenclatura de classes/funções;
- nomenclatura de variáveis;
- organização de imports;
- formatação;
- tratamento de erros;
- estrutura dos testes;
- organização de módulos;
- regra de dependência entre camadas.

 A convenção deve ser automatizada sempre que possível.

---

 # 19\. Scripts obrigatórios

 O projeto deve possuir comandos equivalentes a:

```
dev
build
start
lint
test
test:watch
typecheck
format
format:check
```

 Nem todos precisam existir se forem incompatíveis com a stack, mas cada ausência deve ser justificada.

 Comando recomendado para validação completa:

```
quality
```

 Executando:

```
format check
→ lint
→ typecheck
→ tests
→ build
```

---

 # 20\. Documentação mínima

 Atualizar a documentação operacional com:

 ## Pré-requisitos

```
Runtime:
Package manager:
Versão:
Banco:
Docker:
Outros:
```

 ## Instalação

```
[comando]
```

 ## Configuração

```
[comando]
```

 ## Execução

```
[comando]
```

 ## Testes

```
[comando]
```

 ## Lint

```
[comando]
```

 ## Build

```
[comando]
```

 ## Quality Gate

```
[comando]
```

---

 # 21\. Reprodução local

 Um desenvolvedor em uma máquina limpa deve conseguir:

```
1. Clonar projeto
2. Instalar dependências
3. Configurar .env
4. Executar aplicação
5. Executar testes
6. Executar lint
7. Executar build
```

 Sem depender de configuração manual não documentada.

---

 # 22\. Checklist de implementação

 ## Projeto

 - [ ] Projeto inicializado.
- [ ] Runtime configurado.
- [ ] Package manager definido.
- [ ] Versão do runtime documentada.
- [ ] Scripts definidos.

 ## Arquitetura

 - [ ] Presentation criada.
- [ ] Application criada.
- [ ] Domain criada.
- [ ] Infrastructure criada.
- [ ] Dependências entre camadas validadas.
- [ ] Estrutura documentada.

 ## Qualidade

 - [ ] Lint configurado.
- [ ] Formatter configurado.
- [ ] Test runner configurado.
- [ ] Type checking configurado.
- [ ] Build configurado.
- [ ] Quality command configurado.

 ## Configuração

 - [ ] Configuração centralizada.
- [ ] `.env.example` criado.
- [ ] Nenhum secret versionado.
- [ ] Variáveis documentadas.

 ## Testes

 - [ ] Teste inicial criado.
- [ ] Teste executa localmente.
- [ ] Testes arquiteturais configurados quando aplicável.
- [ ] Todos os testes passam.

 ## Documentação

 - [ ] README atualizado.
- [ ] Setup local documentado.
- [ ] Comandos documentados.
- [ ] Convenções documentadas.
- [ ] TASKS.md atualizado.

---

 # 23\. Critérios de aceitação

 ## AC-001 — Aplicação compila

 **Dado** um ambiente local configurado corretamente,

 **Quando** o comando de build for executado,

 **Então** a aplicação deve compilar sem erros.

---

 ## AC-002 — Aplicação inicia

 **Dado** que as dependências estejam instaladas,

 **Quando** a aplicação for iniciada,

 **Então** ela deve iniciar sem erros de configuração ou bootstrap.

---

 ## AC-003 — Estrutura arquitetural

 **Dado** o projeto inicial,

 **Quando** sua estrutura for inspecionada,

 **Então** Presentation, Application, Domain e Infrastructure devem estar claramente separadas.

---

 ## AC-004 — Dependências arquiteturais

 **Dado** o código existente,

 **Quando** os testes/verificações arquiteturais forem executados,

 **Então** não devem existir dependências proibidas entre camadas.

---

 ## AC-005 — Lint

 **Dado** o código atual,

 **Quando** o lint for executado,

 **Então** o processo deve terminar com sucesso.

---

 ## AC-006 — Testes

 **Dado** a configuração de testes,

 **Quando** a suíte for executada,

 **Então** o teste inicial deve passar.

---

 ## AC-007 — Type checking

 **Dado** o código da aplicação,

 **Quando** o type checker for executado,

 **Então** não devem existir erros de tipagem.

---

 ## AC-008 — Configuração local

 **Dado** um desenvolvedor seguindo a documentação,

 **Quando** ele configurar o ambiente,

 **Então** deverá conseguir executar a aplicação localmente sem configuração oculta.

---

 ## AC-009 — Segurança de configuração

 **Dado** o repositório,

 **Quando** arquivos versionados forem inspecionados,

 **Então** nenhum secret ou credencial real deverá estar presente.

---

 ## AC-010 — Ausência de funcionalidades comerciais

 **Dado** o código produzido pela TASK,

 **Quando** seu escopo for analisado,

 **Então** nenhuma funcionalidade comercial deverá ter sido implementada antecipadamente.

---

 # 24\. Testes obrigatórios

 ## Teste 1 — Build

```
Comando:
[build command]

Resultado esperado:
PASS
```

 ## Teste 2 — Lint

```
Comando:
[lint command]

Resultado esperado:
PASS
```

 ## Teste 3 — Typecheck

```
Comando:
[typecheck command]

Resultado esperado:
PASS
```

 ## Teste 4 — Unit

```
Comando:
[test command]

Resultado esperado:
PASS
```

 ## Teste 5 — Application startup

```
Comando:
[dev/start command]

Resultado esperado:
Aplicação inicia corretamente.
```

 ## Teste 6 — Architecture

```
Comando:
[architecture test command]

Resultado esperado:
Nenhuma dependência proibida.
```

---

 # 25\. Quality Gate

 A TASK não pode ser marcada como DONE enquanto qualquer gate obrigatório estiver falhando.

```
BUILD             = PASS
LINT              = PASS
TYPECHECK         = PASS
UNIT_TESTS        = PASS
APPLICATION_START = PASS
ARCHITECTURE      = PASS
DOCUMENTATION     = PASS
SECURITY          = PASS
SCOPE             = PASS
```

 Resultado:

```
IF all gates = PASS
    TASK-001 = DONE
ELSE
    TASK-001 != DONE
```

---

 # 26\. Definition of Done

 TASK-001 somente poderá ser marcada como `DONE` quando:

 - [ ] Aplicação compila.
- [ ] Aplicação inicia localmente.
- [ ] Estrutura Presentation/Application/Domain/Infrastructure existe.
- [ ] Dependências entre camadas respeitam a arquitetura.
- [ ] Lint passa.
- [ ] Type check passa.
- [ ] Testes passam.
- [ ] Teste inicial existe.
- [ ] Configuração local está documentada.
- [ ] `.env.example` está disponível, quando aplicável.
- [ ] Nenhum secret real está versionado.
- [ ] Convenções básicas estão documentadas.
- [ ] Scripts de qualidade estão disponíveis.
- [ ] README/documentação operacional está atualizado.
- [ ] TASKS.md está atualizado.
- [ ] Nenhuma regra de negócio foi implementada.
- [ ] Nenhuma funcionalidade comercial foi implementada.
- [ ] Nenhuma integração externa real foi adicionada.
- [ ] Nenhuma migration de domínio foi criada.
- [ ] Todas as evidências de validação foram registradas.

---

 # 27\. Evidências obrigatórias

 Registrar ao finalizar:

```
BUILD:
PASS / FAIL

LINT:
PASS / FAIL

TYPECHECK:
PASS / FAIL

UNIT TESTS:
X/X PASS

ARCHITECTURE:
PASS / FAIL

APPLICATION START:
PASS / FAIL

SECURITY:
PASS / FAIL

DOCUMENTATION:
PASS / FAIL
```

 Também registrar:

```
Arquivos criados:
[...]

Arquivos alterados:
[...]

Dependências adicionadas:
[...]

Decisões tomadas:
[...]

Pendências:
[...]
```

---

 # 28\. Verificação de escopo

 Antes de finalizar, executar uma revisão explícita:

 ### ALLOWED\_CHANGES

 - [ ] Todas as alterações estão dentro de ALLOWED\_CHANGES.

 ### FORBIDDEN\_CHANGES

 - [ ] Nenhuma alteração proibida foi realizada.
- [ ] Nenhuma funcionalidade de fase futura foi implementada.
- [ ] Nenhuma regra comercial foi inventada.
- [ ] Nenhuma integração externa real foi criada.
- [ ] Nenhum secret foi adicionado.

---

 # 29\. Rastreabilidade

 | Item | Referência | Evidência |
| --- | --- | --- |
| RNF | RNF-001 | \[arquivo/teste\] |
| RNF | RNF-002 | \[arquivo/teste\] |
| RNF | RNF-013 | \[arquivo/teste\] |
| ADR | ADR-001 | \[documento\] |
| ADR | ADR-002 | \[documento\] |

---

 # 30\. Saída da TASK

 Ao finalizar:

```
TASK-001
Status: DONE

Build: PASS
Lint: PASS
Typecheck: PASS
Tests: PASS
Architecture: PASS
Security: PASS
Documentation: PASS
Scope: PASS
```

 A conclusão da TASK-001 torna elegíveis as tasks dependentes:

```
TASK-002
TASK-003
TASK-004
```

 A execução das tasks seguintes deve respeitar seus próprios critérios de dependência e bloqueio.

---

 # 31\. Regra final

 A TASK-001 é uma **fundação técnica**, não uma implementação parcial do produto.

 Qualquer necessidade de implementar uma funcionalidade comercial para "testar a arquitetura" deve ser evitada.

 O resultado esperado é uma base pequena, executável, testável, reproduzível e arquiteturalmente preparada para receber as próximas fases sem antecipar seu escopo.