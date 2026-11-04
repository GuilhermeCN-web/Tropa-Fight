DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES catalog_products(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment varchar(2000),
  status review_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT product_reviews_comment_ck
    CHECK (comment IS NULL OR (char_length(btrim(comment)) BETWEEN 1 AND 2000)),
  CONSTRAINT product_reviews_published_at_ck
    CHECK ((status = 'PUBLISHED' AND published_at IS NOT NULL) OR
           (status <> 'PUBLISHED' AND published_at IS NULL)),
  CONSTRAINT product_reviews_customer_product_uq UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS product_reviews_public_idx
  ON product_reviews(product_id, created_at DESC, id)
  WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS product_reviews_customer_idx
  ON product_reviews(customer_id, created_at DESC, id);

CREATE TABLE IF NOT EXISTS customer_favorites (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES catalog_products(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_favorites_customer_product_uq UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS customer_favorites_customer_idx
  ON customer_favorites(customer_id, created_at DESC, id);
