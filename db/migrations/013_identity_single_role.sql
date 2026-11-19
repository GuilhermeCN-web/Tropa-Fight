-- TASK-019 / RN-023: cada usuário possui exatamente um papel.
-- A chave primária (user_id, role_code) permitia vários papéis por usuário;
-- este índice único limita a um papel. A criação de contas sempre atribui um
-- papel na mesma transação, o que garante o "pelo menos um".
-- Se existir usuário com mais de um papel, a criação do índice falha e a
-- migração inteira é revertida: corrija os dados antes de reaplicar.
CREATE UNIQUE INDEX IF NOT EXISTS identity_user_roles_single_role_uq
  ON identity_user_roles (user_id);
