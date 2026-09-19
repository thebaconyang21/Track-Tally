import * as SQLite from 'expo-sqlite';

// Opens (or creates) the database file on the device.
// This runs once, the first time any screen imports this file.
export const db = SQLite.openDatabaseSync('tracktally.db');

// Creates every table if it doesn't already exist.
// Safe to call every time the app starts — CREATE TABLE IF NOT EXISTS
// does nothing if the table is already there.
export function initDatabase() {
  db.execSync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      store_name TEXT,
      owner_name TEXT,
      pin_code TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_number TEXT,
      address TEXT,
      notes TEXT,
      credit_limit REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT,
      unit_price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      stock_qty REAL NOT NULL DEFAULT 0,
      reorder_level REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      sale_type TEXT NOT NULL,
      total_amount REAL NOT NULL,
      sale_date TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity REAL NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      method TEXT,
      note TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    );
  `);

  console.log('Database initialized: all tables ready.');
}