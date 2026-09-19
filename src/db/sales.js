import { db } from './database';
import { adjustStock, getProductById } from './products';

export function createSale({ customer_id, sale_type, items, note }) {
  const total_amount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const sale_date = new Date().toISOString();

  let saleId;

  db.withTransactionSync(() => {
    // Re-verify stock right before committing, inside the same transaction
    // that will deduct it. This is the last checkpoint before the write —
    // if stock changed since the cart was built, we stop here instead of
    // letting stock go negative.
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