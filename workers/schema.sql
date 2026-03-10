-- Netixa D1 SQLite Schema
-- Run with: wrangler d1 execute netixa-db --file=workers/schema.sql

CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role        TEXT DEFAULT 'student',
    whatsapp    TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- Insert default admin (password: admin123, SHA-256 hashed)
INSERT OR IGNORE INTO users (name, email, password_hash, role)
VALUES ('Admin', 'admin@netixa.tech', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin');

CREATE TABLE IF NOT EXISTS orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email   TEXT NOT NULL,
    product_name TEXT NOT NULL,
    payment_id   TEXT,
    amount       INTEGER,
    date         TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS masterclass (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email   TEXT NOT NULL,
    name         TEXT,
    whatsapp     TEXT,
    registered_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_email)
);

CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    role       TEXT NOT NULL,
    name       TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
