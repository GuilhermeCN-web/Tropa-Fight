DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING_PAYMENT', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE shipment_status AS ENUM ('NOT_SHIPPED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  recipient_name varchar(120) NOT NULL,
  cpf char(11) NOT NULL,
  phone varchar(11) NOT NULL,
  postal_code char(8) NOT NULL,
  street varchar(160) NOT NULL,
  number varchar(30) NOT NULL,
  neighborhood varchar(100) NOT NULL,
  city varchar(100) NOT NULL,
  state char(2) NOT NULL,
  country char(2) NOT NULL DEFAULT 'BR',
  complement varchar(120),
  reference varchar(160),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cpf ~ '^[0-9]{11}$'), CHECK (phone ~ '^[0-9]{10,11}$'),
  CHECK (postal_code ~ '^[0-9]{8}$'), CHECK (country = 'BR'),
  CHECK (state ~ '^[A-Z]{2}$')
);
CREATE INDEX IF NOT EXISTS customer_addresses_customer_idx
  ON customer_addresses(customer_id, created_at, id);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  subtotal_cents bigint NOT NULL CHECK (subtotal_cents >= 0),
  discount_cents bigint NOT NULL CHECK (discount_cents >= 0),
  shipping_cents bigint NOT NULL CHECK (shipping_cents = 2000),
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  coupon_id uuid REFERENCES coupons(id) ON DELETE RESTRICT,
  discount_source text,
  discount_reference_id uuid,
  discount_label varchar(100),
  address_snapshot jsonb NOT NULL CHECK (jsonb_typeof(address_snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  payment_due_at timestamptz NOT NULL,
  expired_at timestamptz,
  CHECK (total_cents = subtotal_cents - discount_cents + shipping_cents)
);
CREATE INDEX IF NOT EXISTS orders_customer_created_idx
  ON orders(customer_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS orders_expiration_idx
  ON orders(status, payment_due_at) WHERE status = 'PENDING_PAYMENT';

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL,
  variant_id uuid NOT NULL REFERENCES catalog_product_variants(id) ON DELETE RESTRICT,
  product_name_snapshot varchar(100) NOT NULL,
  attributes_snapshot jsonb NOT NULL CHECK (jsonb_typeof(attributes_snapshot) = 'object'),
  unit_price_cents bigint NOT NULL CHECK (unit_price_cents >= 0),
  quantity bigint NOT NULL CHECK (quantity > 0),
  subtotal_cents bigint NOT NULL CHECK (subtotal_cents = unit_price_cents * quantity),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id, id);

CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  status shipment_status NOT NULL DEFAULT 'NOT_SHIPPED',
  method text NOT NULL CHECK (method = 'STANDARD'),
  shipping_cents bigint NOT NULL CHECK (shipping_cents = 2000),
  estimated_business_days integer NOT NULL CHECK (estimated_business_days = 5),
  estimated_delivery_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkout_quotes (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE RESTRICT,
  address_id uuid NOT NULL REFERENCES customer_addresses(id) ON DELETE RESTRICT,
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_by_order_id uuid REFERENCES orders(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS checkout_quotes_customer_created_idx
  ON checkout_quotes(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS checkout_idempotency_keys (
  customer_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
  idempotency_key varchar(128) NOT NULL,
  request_fingerprint char(64) NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(customer_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  variant_id uuid NOT NULL REFERENCES catalog_product_variants(id) ON DELETE RESTRICT,
  quantity bigint NOT NULL CHECK (quantity > 0),
  expires_at timestamptz NOT NULL,
  released_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, variant_id),
  CHECK (NOT (released_at IS NOT NULL AND converted_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS inventory_reservations_active_variant_idx
  ON inventory_reservations(variant_id, expires_at) WHERE released_at IS NULL AND converted_at IS NULL;

ALTER TABLE carts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ACTIVE'
  CHECK (status IN ('ACTIVE', 'CONVERTED'));
ALTER TABLE carts ADD COLUMN IF NOT EXISTS converted_to_order_id uuid
  REFERENCES orders(id) ON DELETE RESTRICT;
ALTER TABLE carts DROP CONSTRAINT IF EXISTS carts_customer_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS carts_one_active_per_customer_idx
  ON carts(customer_id) WHERE status = 'ACTIVE';

ALTER TABLE coupon_redemptions ADD COLUMN IF NOT EXISTS released_at timestamptz;
ALTER TABLE coupon_redemptions ADD COLUMN IF NOT EXISTS release_reason text;
DO $$ BEGIN
  ALTER TABLE coupon_redemptions ADD CONSTRAINT coupon_redemptions_release_reason_ck
    CHECK (release_reason IS NULL OR release_reason = 'ORDER_EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS coupon_redemptions_active_coupon_idx
  ON coupon_redemptions(coupon_id, customer_id) WHERE released_at IS NULL;

