import { db } from './database';
import { adjustStock, getProductById } from './products';

// Records a full sale (cash or credit) with multiple line items in ONE
// database transaction. If anything fails partway, everything rolls back.
//
// items = [{ product_id, product_name, unit_price, quantity }, ...]
export function createSale({ customer_id, sale_type, items, note }) {
  const total_amount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const sale_date = new Date().toISOString();

  let saleId;

  db.withTransactionSync(() => {
    // Re-verify stock right before committing, inside the same transaction
    // that will deduct it — the last checkpoint before the write.
    for (const item of items) {
      const product = getProductById(item.product_id);
      if (!product || product.stock_qty < item.quantity) {
        throw new Error(
          `Insufficient stock for "${item.product_name}". Available: ${product ? product.stock_qty : 0}, requested: ${item.quantity}.`
        );
      }
    }

    const saleResult = db.runSync(
      `INSERT INTO sales (customer_id, sale_type, total_amount, sale_date, note)
       VALUES (?, ?, ?, ?, ?)`,
      [sale_type === 'credit' ? customer_id : null, sale_type, total_amount, sale_date, note || null]
    );
    saleId = saleResult.lastInsertRowId;

    for (const item of items) {
      const line_total = item.unit_price * item.quantity;
      db.runSync(
        `INSERT INTO sale_items (sale_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [saleId, item.product_id, item.product_name, item.unit_price, item.quantity, line_total]
      );
      adjustStock(item.product_id, -item.quantity);
    }
  });

  return saleId;
}

export function getSalesByDateRange(startDate, endDate) {
  return db.getAllSync(
    `SELECT * FROM sales WHERE sale_date BETWEEN ? AND ? ORDER BY sale_date DESC`,
    [startDate, endDate]
  );
}

export function getSaleItems(saleId) {
  return db.getAllSync(`SELECT * FROM sale_items WHERE sale_id = ?`, [saleId]);
}

// Full purchase history for one debtor — used in the debtor ledger.
export function getSalesByCustomer(customerId) {
  return db.getAllSync(
    `SELECT * FROM sales WHERE customer_id = ? ORDER BY sale_date DESC`,
    [customerId]
  );
}