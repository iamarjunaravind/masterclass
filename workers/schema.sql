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
    date         TEXT DEFAULT (datetime('now')),
    product_id   INTEGER
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

CREATE TABLE IF NOT EXISTS products (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT NOT NULL,
    price   TEXT NOT NULL,
    old_price TEXT DEFAULT '₹499',
    desc    TEXT,
    img     TEXT,
    status  TEXT DEFAULT 'Active',
    sales   INTEGER DEFAULT 0,
    result_link TEXT
);

-- Seed default products (only if table is empty)
INSERT OR IGNORE INTO products (id, name, price, desc, img) VALUES
(1, '100,000+ T-shirt Designs',   '₹299', 'Premium bundle of vector t-shirt designs.', 'cert-bg.png'),
(2, '1000+ Anime T-Shirt Design',  '₹199', 'Curated anime-style high-quality designs.',  'slider-1.png'),
(3, '50+ Premium Grafftic Style',  '₹199', 'Unique graffiti and street art graphics.',   'slider-2.png'),
(4, '700+ Anime T-shirt Design',   '₹199', 'Expanded collection of anime-themed apparel art.', 'mentor.png');

