-- Drop the unique constraint that limits one credential per environment
ALTER TABLE paypal_credentials DROP CONSTRAINT paypal_credentials_user_id_environment_key;

-- Add remark column for credential identification
ALTER TABLE paypal_credentials ADD COLUMN remark TEXT NOT NULL DEFAULT 'Default';

-- Create new unique constraint including remark
ALTER TABLE paypal_credentials ADD CONSTRAINT paypal_credentials_user_id_environment_remark_key 
  UNIQUE(user_id, environment, remark);

-- Add index for better query performance
CREATE INDEX idx_paypal_credentials_user_env_remark ON paypal_credentials(user_id, environment, remark);