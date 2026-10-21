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

- [`adr/ADRs.md`](adr/ADRs.md)
- [`architecture/overview.md`](architecture/overview.md)
- [`planning/development-plan.md`](planning/development-plan.md)
- [`planning/answered-questions.md`](planning/answered-questions.md)
- [`TASKS/`](TASKS/)

Os documentos operacionais e de governança `AGENTS.md`, `README.md` e `TASKS.md` permanecem na raiz do repositório.

## Desenvolvimento local

### Pré-requisitos

- Node.js 24.x (versão indicada em `.nvmrc`)
- npm 11.x
- PostgreSQL e Docker não são necessários para a fundação do front-end

### Instalação e configuração

```sh
npm ci
```

Crie o arquivo local de ambiente a partir do exemplo:

```sh
cp .env.example .env
```

No PowerShell, use `Copy-Item .env.example .env`.

O front usa somente variáveis não sensíveis com prefixo `VITE_`. A TASK-001 não inclui backend, persistência nem conexão a banco. PostgreSQL continua uma possibilidade para uma etapa futura, sem decisão de integração.

### Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Iniciar o servidor local em `http://localhost:5173` |
| `npm run build` | Verificar tipos e gerar a versão de produção |
| `npm run start` | Servir a versão gerada localmente |
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
- O ponto de composição da aplicação fica em `src/bootstrap.tsx`.
- Importe módulos por caminhos relativos; mantenha as dependências apontando para dentro: apresentação → aplicação → domínio. Infraestrutura pode depender de aplicação/domínio; as demais camadas não dependem dela.
- Testes usam arquivos `*.test.ts` em `tests/unit/` ou `tests/architecture/`.
- Erros de configuração devem ser identificados no bootstrap; logs registram somente mensagens operacionais, nunca segredos.
- Erros esperados e de validação são diferenciados por `ApplicationError` e `ValidationError`; a camada técnica pode lançar `InfrastructureError`. Erros inesperados recebem log genérico sem imprimir payloads ou dados sensíveis.

### Dependências adicionadas nesta fundação

| Dependência | Camada | Finalidade |
| --- | --- | --- |
| Vitest | Desenvolvimento/testes | Executar testes unitários e arquiteturais usando a configuração Vite já adotada |
| Prettier | Desenvolvimento/qualidade | Formatar e verificar o código de forma reproduzível |
