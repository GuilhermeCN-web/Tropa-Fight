CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL UNIQUE
    REFERENCES identity_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY,
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL
    REFERENCES catalog_product_variants(id) ON DELETE RESTRICT,
  quantity bigint NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_cart_variant_key UNIQUE (cart_id, variant_id)
);

CREATE INDEX IF NOT EXISTS cart_items_cart_created_idx
  ON cart_items (cart_id, created_at, id);
