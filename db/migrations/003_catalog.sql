DO $$ BEGIN
  CREATE TYPE catalog_entity_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE product_publication_state AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS catalog_categories (
  id uuid PRIMARY KEY,
  name varchar(50) NOT NULL,
  status catalog_entity_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_brands (
  id uuid PRIMARY KEY,
  name varchar(50) NOT NULL,
  status catalog_entity_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_products (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  description varchar(1000),
  brand_id uuid NOT NULL REFERENCES catalog_brands(id) ON DELETE RESTRICT,
  publication_state product_publication_state NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_product_categories (
  product_id uuid NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES catalog_categories(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS catalog_products_publication_idx
  ON catalog_products (publication_state, created_at DESC, id);
CREATE INDEX IF NOT EXISTS catalog_products_brand_idx
  ON catalog_products (brand_id);
CREATE INDEX IF NOT EXISTS catalog_product_categories_category_idx
  ON catalog_product_categories (category_id, product_id);

DO $$ BEGIN
  ALTER TABLE catalog_categories
    ADD CONSTRAINT catalog_categories_name_length_ck
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 50);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE catalog_brands
    ADD CONSTRAINT catalog_brands_name_length_ck
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 50);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE catalog_products
    ADD CONSTRAINT catalog_products_name_length_ck
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
    ADD CONSTRAINT catalog_products_description_length_ck
    CHECK (description IS NULL OR char_length(btrim(description)) <= 1000);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION ensure_catalog_product_has_category()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  product_key uuid;
BEGIN
  IF TG_TABLE_NAME = 'catalog_products' THEN
    product_key := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    product_key := OLD.product_id;
  ELSE
    product_key := NEW.product_id;
  END IF;

  IF EXISTS (SELECT 1 FROM catalog_products WHERE id = product_key)
     AND NOT EXISTS (
       SELECT 1 FROM catalog_product_categories WHERE product_id = product_key
     ) THEN
    RAISE EXCEPTION 'Catalog products must have at least one category.'
      USING ERRCODE = '23514', CONSTRAINT = 'catalog_product_requires_category';
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS catalog_product_requires_category ON catalog_products;
CREATE CONSTRAINT TRIGGER catalog_product_requires_category
  AFTER INSERT OR UPDATE ON catalog_products
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION ensure_catalog_product_has_category();

DROP TRIGGER IF EXISTS catalog_product_category_delete_requires_category ON catalog_product_categories;
CREATE CONSTRAINT TRIGGER catalog_product_category_delete_requires_category
  AFTER DELETE ON catalog_product_categories
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION ensure_catalog_product_has_category();

INSERT INTO identity_permissions (code, description) VALUES
  ('catalog.products.manage', 'Criar e editar produtos do catálogo'),
  ('catalog.products.publish', 'Publicar e arquivar produtos do catálogo'),
  ('catalog.categories.manage', 'Criar e editar categorias do catálogo'),
  ('catalog.brands.manage', 'Criar e editar marcas do catálogo')
ON CONFLICT (code) DO NOTHING;

INSERT INTO identity_role_permissions (role_code, permission_code)
SELECT role_code, permission_code
FROM (VALUES
  ('GENERAL_ADMIN', 'catalog.products.manage'),
  ('GENERAL_ADMIN', 'catalog.products.publish'),
  ('GENERAL_ADMIN', 'catalog.categories.manage'),
  ('GENERAL_ADMIN', 'catalog.brands.manage'),
  ('CATALOG_MANAGER', 'catalog.products.manage'),
  ('CATALOG_MANAGER', 'catalog.products.publish'),
  ('CATALOG_MANAGER', 'catalog.categories.manage'),
  ('CATALOG_MANAGER', 'catalog.brands.manage')
) AS catalog_access(role_code, permission_code)
ON CONFLICT DO NOTHING;
