# API administrativa de estoque

Todas as rotas exigem sessão autenticada e a permissão `inventory.manage`, concedida ao Administrador Geral e ao Gestor de Catálogo. As respostas incluem `Cache-Control: no-store`.

## Consultar saldo

`GET /api/admin/inventory/{variantId}`

```json
{
  "inventory": {
    "variantId": "uuid",
    "quantity": 0
  }
}
```

Uma variante válida sem movimentações tem saldo zero.

## Listar movimentações

`GET /api/admin/inventory/{variantId}/movements?page=1&pageSize=20`

`page` começa em 1. `pageSize` assume 20 por padrão e aceita valores entre 1 e 100. A ordenação é decrescente por data e UUID da movimentação.

```json
{
  "movements": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

## Registrar entrada, saída ou ajuste

- `POST /api/admin/inventory/{variantId}/entries`
- `POST /api/admin/inventory/{variantId}/exits`
- `POST /api/admin/inventory/{variantId}/adjustments`

As três operações recebem `quantity` e `reason`. Entradas e saídas exigem inteiro positivo; ajuste exige delta inteiro diferente de zero, positivo ou negativo. O motivo deve conter texto não vazio. A quantidade retornada na movimentação é o delta aplicado ao saldo: saídas aparecem negativas.

```json
{
  "quantity": 5,
  "reason": "Reposição de equipamento"
}
```

A resposta `201` contém a movimentação criada e o saldo atualizado. Se uma saída ou ajuste negativo exceder o saldo, a resposta é `409` e saldo, movimentação e auditoria permanecem sem alteração.

## Erros

- `400`: identificador, corpo ou paginação inválidos;
- `401`: sessão ausente ou inválida;
- `403`: permissão insuficiente;
- `404`: variante inexistente;
- `409`: saldo insuficiente;
- `500`: falha inesperada na operação.
