-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups (flat share groups)
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group membership with date tracking
CREATE TABLE group_memberships (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES groups(id),
  user_id INT NOT NULL REFERENCES users(id),
  joined_date DATE NOT NULL,
  left_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id, joined_date),
  CHECK (left_date IS NULL OR left_date >= joined_date)
);

CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);

-- Expenses (shared costs)
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES groups(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  exchange_rate DECIMAL(10, 4) DEFAULT 1.0000, -- Rate to base currency
  description TEXT,
  expense_date DATE NOT NULL,
  split_type VARCHAR(50) NOT NULL,
  is_settlement BOOLEAN DEFAULT FALSE,
  is_refund BOOLEAN DEFAULT FALSE,
  created_by INT NOT NULL REFERENCES users(id),
  updated_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_group_date ON expenses(group_id, expense_date);

-- How each expense is split (includes who paid and who owes)
CREATE TABLE expense_splits (
  id SERIAL PRIMARY KEY,
  expense_id INT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id),
  amount_owed DECIMAL(10, 2) NOT NULL CHECK (amount_owed >= 0),
  paid_amount DECIMAL(10, 2) DEFAULT 0.00 CHECK (paid_amount >= 0),
  share_value DECIMAL(10, 2),
  share_unit VARCHAR(50),
  UNIQUE(expense_id, user_id)
);

CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON expense_splits(user_id);

-- CSV import tracking
CREATE TABLE import_logs (
  id SERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES groups(id),
  csv_filename VARCHAR(255),
  total_rows INT,
  imported_rows INT,
  flagged_anomalies INT,
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detected anomalies during import
CREATE TABLE import_anomalies (
  id SERIAL PRIMARY KEY,
  import_log_id INT NOT NULL REFERENCES import_logs(id) ON DELETE CASCADE,
  row_number INT,
  anomaly_type VARCHAR(100),
  description TEXT,
  raw_data JSONB,
  action_taken VARCHAR(50),
  user_decision VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
