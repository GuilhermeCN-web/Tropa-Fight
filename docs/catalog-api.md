# Contrato da API de catálogo — TASK-006

As rotas administrativas usam sessão autenticada e verificam a permissão correspondente no servidor. Respostas administrativas enviam `Cache-Control: no-store`. Rotas públicas retornam somente produtos `PUBLISHED` associados a marca ativa e exclusivamente a categorias ativas.

## Produtos

| Método  | Rota                               | Acesso                     | Resultado                                                              |
| ------- | ---------------------------------- | -------------------------- | ---------------------------------------------------------------------- |
| `POST`  | `/api/admin/products`              | `catalog.products.manage`  | Cria produto em `DRAFT` (`201`)                                        |
| `GET`   | `/api/admin/products`              | `catalog.products.manage`  | Lista produtos, inclusive não publicados                               |
| `GET`   | `/api/admin/products/{id}`         | `catalog.products.manage`  | Consulta produto por UUID                                              |
| `PATCH` | `/api/admin/products/{id}`         | `catalog.products.manage`  | Altera nome, descrição, marca ou categorias                            |
| `POST`  | `/api/admin/products/{id}/publish` | `catalog.products.publish` | Publica somente produto em `DRAFT`                                     |
| `POST`  | `/api/admin/products/{id}/archive` | `catalog.products.publish` | Arquiva produto não arquivado                                          |
| `GET`   | `/api/products`                    | Público                    | Lista produtos elegíveis, sem busca/filtros/paginação                  |
| `GET`   | `/api/products/{id}`               | Público                    | Consulta produto elegível; produto oculto ou inexistente retorna `404` |

Exemplo do corpo de criação:

```json
{
  "name": "Luva de treino",
  "description": "Descrição em texto simples",
  "brandId": "3d1b5b8a-5b8d-4d25-8dd7-1dd6bcd5d3c1",
  "categoryIds": ["9c87a810-8502-4bc2-b970-3a1ba01b04f8"]
}
```

`name` é obrigatório, aparado e limitado a 100 caracteres. `description` é opcional/nulo e limitado a 1.000 caracteres. `brandId` deve apontar para uma marca ativa. `categoryIds` precisa conter ao menos um UUID distinto de categoria ativa. Campos comerciais fora da TASK-006 são rejeitados.

## Categorias e marcas

| Método  | Rota                         | Acesso                      |
| ------- | ---------------------------- | --------------------------- |
| `POST`  | `/api/admin/categories`      | `catalog.categories.manage` |
| `GET`   | `/api/admin/categories`      | `catalog.categories.manage` |
| `GET`   | `/api/admin/categories/{id}` | `catalog.categories.manage` |
| `PATCH` | `/api/admin/categories/{id}` | `catalog.categories.manage` |
| `POST`  | `/api/admin/brands`          | `catalog.brands.manage`     |
| `GET`   | `/api/admin/brands`          | `catalog.brands.manage`     |
| `GET`   | `/api/admin/brands/{id}`     | `catalog.brands.manage`     |
| `PATCH` | `/api/admin/brands/{id}`     | `catalog.brands.manage`     |

Criação aceita `{ "name": "..." }`. Atualização aceita `name` e/ou `status` (`ACTIVE` ou `INACTIVE`). Nome é obrigatório ao criar e possui limite de 50 caracteres após trim. `INACTIVE` bloqueia novas associações e oculta da API pública os produtos publicados ligados à marca/categoria até sua reativação.

## Respostas de erro

| HTTP  | Uso                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------- |
| `400` | JSON/campo inválido, nome/descrição fora dos limites, UUID inválido ou associação inexistente/inativa |
| `401` | Sessão ausente ou inválida em rota administrativa                                                     |
| `403` | Sessão sem a permissão exigida                                                                        |
| `404` | Recurso inexistente ou produto indisponível ao público                                                |
| `409` | Transição de publicação inválida                                                                      |
| `500` | Falha interna sem expor detalhes do banco                                                             |
