DO $$ BEGIN
  CREATE TYPE identity_account_type AS ENUM ('CUSTOMER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE identity_account_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS identity_users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  password_hash text NOT NULL,
  account_type identity_account_type NOT NULL DEFAULT 'CUSTOMER',
  status identity_account_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS identity_users_email_lower_uq
  ON identity_users (lower(email));

CREATE TABLE IF NOT EXISTS identity_roles (
  code text PRIMARY KEY,
  display_name text NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_permissions (
  code text PRIMARY KEY,
  description text NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_user_roles (
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  role_code text NOT NULL REFERENCES identity_roles(code) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_code)
);

CREATE TABLE IF NOT EXISTS identity_role_permissions (
  role_code text NOT NULL REFERENCES identity_roles(code) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES identity_permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE IF NOT EXISTS identity_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS identity_sessions_user_active_idx
  ON identity_sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS identity_password_reset_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE INDEX IF NOT EXISTS identity_password_reset_user_idx
  ON identity_password_reset_tokens (user_id, expires_at)
  WHERE used_at IS NULL;

INSERT INTO identity_roles (code, display_name) VALUES
  ('CUSTOMER', 'Customer'),
  ('GENERAL_ADMIN', 'Administrador Geral'),
  ('CATALOG_MANAGER', 'Gestor de Catálogo')
ON CONFLICT (code) DO NOTHING;

INSERT INTO identity_permissions (code, description) VALUES
  ('identity.profile.read:self', 'Consultar o próprio perfil'),
  ('identity.users.read', 'Consultar contas de identidade'),
  ('identity.users.manage', 'Gerenciar contas de identidade'),
  ('identity.roles.manage', 'Gerenciar papéis e permissões de identidade')
ON CONFLICT (code) DO NOTHING;

INSERT INTO identity_role_permissions (role_code, permission_code)
SELECT 'CUSTOMER', code
FROM identity_permissions
WHERE code = 'identity.profile.read:self'
ON CONFLICT DO NOTHING;

INSERT INTO identity_role_permissions (role_code, permission_code)
SELECT 'GENERAL_ADMIN', code
FROM identity_permissions
ON CONFLICT DO NOTHING;
