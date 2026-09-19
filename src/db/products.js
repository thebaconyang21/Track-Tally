import { db } from './database';

export function insertProduct({ name, category, unit, unit_price, cost_price, stock_qty, reorder_level }) {
  const result = db.runSync(
    `INSERT INTO products (name, category, unit, unit_price, cost_price, stock_qty, reorder_level, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [name, category || null, unit || null, unit_price, cost_price || 0, stock_qty || 0, reorder_level || 0, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export function getProducts() {
  return db.getAllSync(`SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC`);
}

export function getProductById(id) {
  return db.getFirstSync(`SELECT * FROM products WHERE id = ?`, [id]);
}

export function updateProduct(id, { name, category, unit, unit_price, cost_price, reorder_level }) {
  db.runSync(
    `UPDATE products SET name = ?, category = ?, unit = ?, unit_price = ?, cost_price = ?, reorder_level = ?
     WHERE id = ?`,
    [name, category || null, unit || null, unit_price, cost_price || 0, reorder_level || 0, id]
  );
}

// Adjusts stock up (restock) or down (sale). Pass a negative number to reduce.
export function adjustStock(productId, changeQty) {
  db.runSync(`UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?`, [changeQty, productId]);
}

export function deactivateProduct(id) {
  db.runSync(`UPDATE products SET is_active = 0 WHERE id = ?`, [id]);
}

// Used for the low-stock badge on the Inventory screen (Phase 3).
export function getLowStockProducts() {
  return db.getAllSync(
    `SELECT * FROM products WHERE is_active = 1 AND stock_qty <= reorder_level ORDER BY stock_qty ASC`
  );
}