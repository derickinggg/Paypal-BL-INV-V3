CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE paypal_credentials (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'live')),
  client_id_encrypted TEXT NOT NULL,
  client_secret_encrypted TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, environment)
);

CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment', 'balance_check')),
  amount DOUBLE PRECISION,
  currency TEXT,
  status TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'live')),
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_paypal_credentials_user_id ON paypal_credentials(user_id);
