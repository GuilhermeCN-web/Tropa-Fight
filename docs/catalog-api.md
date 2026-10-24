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
| `GET`   | `/api/products`                    | Público                    | Busca, filtra, ordena e pagina produtos comercialmente elegíveis       |
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

### Listagem pública, busca e navegação (TASK-008)

`GET /api/products` aceita os seguintes parâmetros opcionais. A página `/catalog` oferece controles equivalentes e converte valores de preço em reais para centavos antes da consulta.

| Parâmetro | Regra |
| --- | --- |
| `q` | Busca parcial sem diferenciar maiúsculas/minúsculas em nome, descrição, marca e nomes das categorias; espaços externos e repetidos são normalizados. |
| `categoryId` | UUID de uma categoria por consulta. |
| `brandId` | UUID de uma marca por consulta. |
| `minPriceCents`, `maxPriceCents` | Limites inclusivos, inteiros não negativos em centavos BRL; o produto corresponde se ao menos uma variante `ACTIVE` estiver na faixa. O mínimo não pode exceder o máximo. |
| `sort` | `name_asc` (padrão), `name_desc`, `price_asc` ou `price_desc`. Ordenação de preço usa o menor preço entre variantes `ACTIVE`; empates usam ID crescente. |
| `page` | Página numerada a partir de 1 (padrão 1). |
| `pageSize` | Itens por página (padrão 20; máximo 100). |

A resposta HTTP 200 tem o formato `{ "items": [...], "pagination": { "page", "pageSize", "totalItems", "totalPages" } }`. Cada item inclui `id`, `name`, `description`, `brand`, `categories` e `priceCents` (menor preço de variante ativa); nunca inclui SKU nem afirma disponibilidade de estoque. `totalPages` é 0 quando não há resultados. Uma página numericamente válida após o total retorna `items: []` com os metadados solicitados. Parâmetros malformados, IDs que não sejam UUIDs, limites inválidos, página menor que 1, tamanho menor que 1 ou maior que 100 e critérios de ordenação desconhecidos retornam HTTP 400. Somente produtos publicados e publicáveis conforme estado de marca/categoria, com pelo menos uma variante ativa e preço válido, podem aparecer.

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
