CREATE TABLE IF NOT EXISTS catalog_product_variants (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES catalog_products(id) ON DELETE RESTRICT,
  sku text NOT NULL,
  attributes jsonb NOT NULL,
  price_cents bigint NOT NULL,
  currency char(3) NOT NULL DEFAULT 'BRL',
  status catalog_entity_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_product_variants_sku_nonempty_ck
    CHECK (char_length(btrim(sku)) > 0),
  CONSTRAINT catalog_product_variants_attributes_object_ck
    CHECK (jsonb_typeof(attributes) = 'object'),
  CONSTRAINT catalog_product_variants_attributes_keys_ck
    CHECK ((attributes - ARRAY['size', 'color']) = '{}'::jsonb),
  CONSTRAINT catalog_product_variants_attributes_values_ck
    CHECK (
      (NOT (attributes ? 'size') OR
        (jsonb_typeof(attributes->'size') = 'string' AND char_length(btrim(attributes->>'size')) > 0))
      AND
      (NOT (attributes ? 'color') OR
        (jsonb_typeof(attributes->'color') = 'string' AND char_length(btrim(attributes->>'color')) > 0))
    ),
  CONSTRAINT catalog_product_variants_price_nonnegative_ck
    CHECK (price_cents >= 0),
  CONSTRAINT catalog_product_variants_currency_brl_ck
    CHECK (currency = 'BRL'),
  CONSTRAINT catalog_product_variants_product_attributes_key
    UNIQUE (product_id, attributes)
);

CREATE UNIQUE INDEX IF NOT EXISTS catalog_product_variants_sku_normalized_key
  ON catalog_product_variants (lower(btrim(sku)));
CREATE INDEX IF NOT EXISTS catalog_product_variants_product_status_idx
  ON catalog_product_variants (product_id, status, created_at, id);

DO $$ BEGIN
  ALTER TABLE catalog_product_variants
    ADD CONSTRAINT catalog_product_variants_attributes_values_ck
    CHECK (
      (NOT (attributes ? 'size') OR
        (jsonb_typeof(attributes->'size') = 'string' AND char_length(btrim(attributes->>'size')) > 0))
      AND
      (NOT (attributes ? 'color') OR
        (jsonb_typeof(attributes->'color') = 'string' AND char_length(btrim(attributes->>'color')) > 0))
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
