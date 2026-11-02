ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'PAYMENT_CONFIRMED';

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('PIX', 'DEBIT_CARD', 'CREDIT_CARD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'APPROVED',
    'FAILED',
    'CANCELLED',
    'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider = 'LOCAL_MOCK'),
  provider_payment_id varchar(128) NOT NULL UNIQUE,
  method payment_method NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency char(3) NOT NULL CHECK (currency = 'BRL'),
  status payment_status NOT NULL DEFAULT 'PENDING',
  idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  UNIQUE (customer_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS payments_customer_created_idx
  ON payments(customer_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS payments_status_created_idx
  ON payments(status, created_at);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id uuid PRIMARY KEY,
  provider text NOT NULL CHECK (provider = 'LOCAL_MOCK'),
  provider_event_id varchar(128) NOT NULL,
  payment_id uuid REFERENCES payments(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN (
    'payment.processing',
    'payment.approved',
    'payment.failed',
    'payment.cancelled',
    'payment.expired'
  )),
  status text NOT NULL CHECK (status IN ('RECEIVED', 'PROCESSED', 'REJECTED')),
  rejection_reason varchar(64),
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS payment_webhook_events_payment_received_idx
  ON payment_webhook_events(payment_id, received_at DESC);
