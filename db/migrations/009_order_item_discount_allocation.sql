ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS discount_cents bigint NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE order_items
    ADD CONSTRAINT order_items_discount_cents_ck
    CHECK (discount_cents >= 0 AND discount_cents <= subtotal_cents);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
