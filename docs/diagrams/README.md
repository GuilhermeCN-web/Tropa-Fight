# Diagramas

Representações visuais do Tropa Fight, em Mermaid. Os diagramas descrevem o estado **implementado e aprovado**. Em caso de divergência com o texto, prevalecem `README.md`, os ADRs e as migrations, e a divergência deve ser registrada em [`../planning/divergencias-documentacao.md`](../planning/divergencias-documentacao.md).

| Arquivo | Conteúdo |
| --- | --- |
| [`domain-model.md`](domain-model.md) | Diagrama de contexto, módulos e sequência checkout → pagamento |
| [`data-model.md`](data-model.md) | Modelo entidade-relacionamento derivado de `db/migrations/` |
| [`state-machines.md`](state-machines.md) | Estados de pedido, entrega, pagamento, reserva, produto, promoção e avaliação |

Atualize o diagrama correspondente sempre que uma TASK alterar migrations, estados ou fluxos.
