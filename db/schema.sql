-- HomeValue Nova Database Schema
-- Run this file against your PostgreSQL database to initialize tables

CREATE TABLE IF NOT EXISTS leads (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(20)  NOT NULL,
  email       VARCHAR(100),
  address     TEXT         NOT NULL,
  city        VARCHAR(50)  NOT NULL,
  zip_code    VARCHAR(10)  NOT NULL,
  value_low   INTEGER,
  value_high  INTEGER,
  q1          VARCHAR(50),
  q2          VARCHAR(50),
  q3          VARCHAR(50),
  q4          VARCHAR(50),
  score       INTEGER      NOT NULL,
  status      VARCHAR(20)  DEFAULT 'New',
  created_at  TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL
);

-- Seed: default agent account (password: nova2024, bcrypt 10 rounds)
-- This INSERT is idempotent — it will not duplicate the row if already present.
INSERT INTO agent_users (email, password_hash)
VALUES (
  'agent@dlcr.com',
  '$2b$10$c2thoTc6FXrzcVBATHd8MO10zNTFH440kfa3ucueVZ6COO4oxk/uq'
)
ON CONFLICT (email) DO NOTHING;
