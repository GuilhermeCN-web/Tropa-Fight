ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_code_snapshot varchar(50);
