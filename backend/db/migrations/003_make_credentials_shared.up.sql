-- Remove the constraint that includes user_id to allow shared credentials
ALTER TABLE paypal_credentials DROP CONSTRAINT paypal_credentials_user_id_environment_remark_key;

-- Add new constraint for shared credentials (environment + remark must be unique)
ALTER TABLE paypal_credentials ADD CONSTRAINT paypal_credentials_environment_remark_key 
  UNIQUE(environment, remark);