# Documentação

Este diretório reúne a documentação de apoio do Tropa Fight, organizada por assunto.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `adr/` | Decisões arquiteturais registradas em `ADRs.md`. |
| `architecture/` | Visão detalhada da arquitetura do sistema. |
| `planning/` | Plano de desenvolvimento e respostas da elicitação. |
| `TASKS/` | Especificações detalhadas das TASKs. |

## Documentos principais

- [`docs/adr/ADRs.md`](docs/adr/ADRs.md)
- [`docs/architecture/overview.md`](docs/architecture/overview.md)
- [`docs/planning/development-plan.md`](docs/planning/development-plan.md)
- [`docs/planning/answered-questions.md`](docs/planning/answered-questions.md)
- [`docs/TASKS/`](docs/TASKS/)

Os documentos operacionais e de governança `AGENTS.md`, `README.md` e `TASKS.md` permanecem na raiz do repositório.

## Desenvolvimento local

### Pré-requisitos

- Node.js 24.x (versão indicada em `.nvmrc`)
- npm 11.x
- PostgreSQL local 18 para persistência de identidade da TASK-003

### Instalação e configuração

```sh
npm ci
```

Crie o arquivo local de ambiente a partir do exemplo:

```sh
cp .env.example .env.local
```

No PowerShell, use `Copy-Item .env.example .env.local`.

Com o serviço PostgreSQL local ativo, configure em `.env.local` a URL de conexão (o arquivo é ignorado pelo Git) e crie um banco vazio chamado `tropa_fight`. Depois aplique o esquema:

```sh
npm run db:migrate
```

O primeiro Administrador Geral deve ser criado uma única vez pelo comando interativo `npm run identity:create-admin`. Ele não imprime a senha e recusa uma segunda execução quando já existe um administrador.

A aplicação usa Next.js, mantendo React para a interface e executando autenticação no servidor. A TASK-003 usa PostgreSQL local para identidade; não configure banco hospedado nem publique a aplicação. `DATABASE_URL` e demais valores sem prefixo público são lidos somente no servidor e não devem receber credenciais reais no repositório. A recuperação de acesso usa uma porta de e-mail sem provedor real nesta etapa.

### Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Iniciar o servidor local em `http://localhost:3000` |
| `npm run build` | Verificar tipos e gerar a versão de produção |
| `npm run start` | Servir a versão gerada localmente |
| `npm run db:migrate` | Aplicar o esquema de identidade no PostgreSQL local |
| `npm run identity:create-admin` | Criar o primeiro administrador de forma interativa e única |
| `npm run lint` | Verificar problemas estáticos em código e testes |
| `npm test` | Executar testes unitários e arquiteturais uma vez |
| `npm run test:watch` | Executar testes em modo de observação |
| `npm run typecheck` | Verificar tipos TypeScript |
| `npm run format` | Formatar arquivos suportados |
| `npm run format:check` | Verificar formatação sem alterar arquivos |
| `npm run quality` | Executar formatação, lint, tipos, testes e build |

### Convenções iniciais

- Componentes React usam arquivos `.tsx` e ficam em `src/presentation/`.
- Casos de uso ficam em `src/application/`; tipos e invariantes sem dependências externas ficam em `src/domain/`.
- Configuração de runtime e adaptadores técnicos ficam em `src/infrastructure/`.
- O ponto de entrada web fica em `app/`; páginas e Route Handlers delegam aos casos de uso em `src/application/`.
- Importe módulos por caminhos relativos; mantenha as dependências apontando para dentro: apresentação → aplicação → domínio. Infraestrutura pode depender de aplicação/domínio; as demais camadas não dependem dela.
- Testes usam arquivos `*.test.ts` em `tests/unit/` ou `tests/architecture/`.
- Erros de configuração devem ser identificados no bootstrap; logs registram somente mensagens operacionais, nunca segredos.
- Erros esperados e de validação são diferenciados por `ApplicationError` e `ValidationError`; a camada técnica pode lançar `InfrastructureError`. Erros inesperados recebem log genérico sem imprimir payloads ou dados sensíveis.

### Requisitos não funcionais aprovados

Os requisitos abaixo foram definidos e aprovados pelo responsável em 2026-10-23 para suprir a ausência de descrições canônicas anteriores:

| ID | Requisito | Critério aprovado |
| --- | --- | --- |
| RNF-010 | Disponibilidade | Meta mensal de 99% em futuro ambiente hospedado. Não constitui SLA contratado; ainda não há ambiente ou medição hospedada. |
| RNF-014 | Acessibilidade | Fluxos críticos devem atender WCAG 2.2 nível AA ([W3C](https://www.w3.org/TR/WCAG22/)). |
| RNF-015 | Responsividade | Fluxos críticos devem permanecer utilizáveis de 360 px até desktop, sem perda de funcionalidade. |
| RNF-016 | Desempenho | p95 de APIs ≤ 2 s e carregamento das páginas críticas ≤ 3 s em ambiente de referência. Ambiente e método de medição devem ser registrados antes da validação. |
| RNF-017 | Compatibilidade | Suporte às duas versões estáveis mais recentes de Chrome, Edge, Firefox e Safari. |

As definições aprovadas não significam que os critérios já foram implementados ou validados. A validação deve ocorrer nas TASKs e fases aplicáveis, com evidências rastreáveis.

### Dependências adicionadas nesta fundação

| Dependência | Camada | Finalidade |
| --- | --- | --- |
| Next.js | Aplicação | Renderização React e handlers de servidor no mesmo processo local |
| PostgreSQL (`pg`) | Infraestrutura | Persistência local de identidade, sessões e recuperação |
| Vitest | Desenvolvimento/testes | Executar testes unitários e arquiteturais em ambiente Node |
| Prettier | Desenvolvimento/qualidade | Formatar e verificar o código de forma reproduzível |
