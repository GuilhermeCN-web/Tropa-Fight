DO $$ BEGIN
  CREATE TYPE promotion_status AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE promotion_application_type AS ENUM ('AUTOMATIC', 'COUPON');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  application_type promotion_application_type NOT NULL,
  discount_type discount_type NOT NULL,
  discount_value bigint NOT NULL,
  minimum_cart_subtotal_cents bigint,
  starts_at timestamptz NOT NULL,
  expires_at timestamptz,
  status promotion_status NOT NULL DEFAULT 'DRAFT',
  priority integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotions_name_nonempty_ck
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  CONSTRAINT promotions_valid_window_ck
    CHECK (expires_at IS NULL OR expires_at > starts_at),
  CONSTRAINT promotions_priority_nonnegative_ck CHECK (priority >= 0)
);

CREATE INDEX IF NOT EXISTS promotions_active_window_idx
  ON promotions (status, starts_at, expires_at, priority DESC);

ALTER TABLE promotions
  DROP CONSTRAINT IF EXISTS promotions_discount_value_ck,
  DROP CONSTRAINT IF EXISTS promotions_minimum_subtotal_ck;
ALTER TABLE promotions
  ADD CONSTRAINT promotions_discount_value_ck CHECK (
    (discount_type = 'PERCENTAGE' AND discount_value BETWEEN 1 AND 100)
    OR (discount_type = 'FIXED_AMOUNT'
        AND discount_value BETWEEN 1 AND 9007199254740991)
  ),
  ADD CONSTRAINT promotions_minimum_subtotal_ck CHECK (
    minimum_cart_subtotal_cents IS NULL
    OR minimum_cart_subtotal_cents BETWEEN 0 AND 9007199254740991
  );

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY,
  promotion_id uuid NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
  code varchar(50) NOT NULL UNIQUE,
  status promotion_status NOT NULL DEFAULT 'DRAFT',
  usage_limit bigint,
  usage_limit_per_customer bigint,
  created_by uuid NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coupons
  DROP CONSTRAINT IF EXISTS coupons_code_format_ck,
  DROP CONSTRAINT IF EXISTS coupons_usage_limit_ck,
  DROP CONSTRAINT IF EXISTS coupons_customer_limit_ck;
ALTER TABLE coupons
  ADD CONSTRAINT coupons_code_format_ck
    CHECK (code = upper(code) AND code COLLATE "C" ~ '^[A-Z0-9]{1,50}$'),
  ADD CONSTRAINT coupons_usage_limit_ck CHECK (
    usage_limit IS NULL OR usage_limit BETWEEN 1 AND 9007199254740991
  ),
  ADD CONSTRAINT coupons_customer_limit_ck CHECK (
    usage_limit_per_customer IS NULL
    OR usage_limit_per_customer BETWEEN 1 AND 9007199254740991
  );

CREATE INDEX IF NOT EXISTS coupons_promotion_status_idx
  ON coupons (promotion_id, status);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id uuid PRIMARY KEY,
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL,
  consumed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupon_redemptions_coupon_order_key UNIQUE (coupon_id, order_id)
);

CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_consumed_idx
  ON coupon_redemptions (coupon_id, consumed_at);
CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_customer_idx
  ON coupon_redemptions (coupon_id, customer_id, consumed_at);

ALTER TABLE carts
  ADD COLUMN IF NOT EXISTS applied_coupon_id uuid
    REFERENCES coupons(id) ON DELETE RESTRICT;

INSERT INTO identity_permissions (code, description)
VALUES ('promotions.manage', 'Gerenciar cupons e promoções')
ON CONFLICT (code) DO NOTHING;

INSERT INTO identity_role_permissions (role_code, permission_code)
VALUES ('GENERAL_ADMIN', 'promotions.manage')
ON CONFLICT DO NOTHING;
