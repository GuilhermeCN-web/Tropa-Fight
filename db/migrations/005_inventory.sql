DO $$ BEGIN
  CREATE TYPE inventory_movement_type AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS inventory_stocks (
  variant_id uuid PRIMARY KEY
    REFERENCES catalog_product_variants(id) ON DELETE RESTRICT,
  quantity bigint NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY,
  variant_id uuid NOT NULL
    REFERENCES catalog_product_variants(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL
    REFERENCES identity_users(id) ON DELETE RESTRICT,
  type inventory_movement_type NOT NULL,
  quantity bigint NOT NULL CHECK (quantity <> 0),
  reason text NOT NULL CHECK (char_length(btrim(reason)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_movements_quantity_sign_ck CHECK (
    (type = 'ENTRY' AND quantity > 0)
    OR (type = 'EXIT' AND quantity < 0)
    OR type = 'ADJUSTMENT'
  )
);

CREATE INDEX IF NOT EXISTS inventory_movements_variant_created_idx
  ON inventory_movements (variant_id, created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION reject_inventory_movement_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Inventory movements are immutable.';
END;
$$;

DROP TRIGGER IF EXISTS inventory_movements_immutable_row ON inventory_movements;
CREATE TRIGGER inventory_movements_immutable_row
  BEFORE UPDATE OR DELETE ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION reject_inventory_movement_mutation();

DROP TRIGGER IF EXISTS inventory_movements_immutable_truncate ON inventory_movements;
CREATE TRIGGER inventory_movements_immutable_truncate
  BEFORE TRUNCATE ON inventory_movements
  FOR EACH STATEMENT EXECUTE FUNCTION reject_inventory_movement_mutation();

INSERT INTO identity_permissions (code, description)
VALUES ('inventory.manage', 'Consultar e movimentar estoque')
ON CONFLICT (code) DO NOTHING;

INSERT INTO identity_role_permissions (role_code, permission_code)
SELECT role_code, 'inventory.manage'
FROM (VALUES ('GENERAL_ADMIN'), ('CATALOG_MANAGER')) AS inventory_roles(role_code)
ON CONFLICT DO NOTHING;
