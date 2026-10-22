CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  result text NOT NULL CHECK (result IN ('SUCCESS', 'FAILURE', 'DENIED')),
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON audit_logs (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_action_idx
  ON audit_logs (actor_id, action, created_at DESC);

CREATE OR REPLACE FUNCTION reject_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable.';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_immutable_row ON audit_logs;
CREATE TRIGGER audit_logs_immutable_row
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION reject_audit_log_mutation();

DROP TRIGGER IF EXISTS audit_logs_immutable_truncate ON audit_logs;
CREATE TRIGGER audit_logs_immutable_truncate
  BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_log_mutation();
