import { db } from './database';

// Pulls every table into one plain object — this IS your backup format.
export function exportAllData() {
  return {
    exported_at: new Date().toISOString(),
    customers: db.getAllSync(`SELECT * FROM customers`),
    products: db.getAllSync(`SELECT * FROM products`),
    sales: db.getAllSync(`SELECT * FROM sales`),
    sale_items: db.getAllSync(`SELECT * FROM sale_items`),
    payments: db.getAllSync(`SELECT * FROM payments`),
  };
}

// Restores from a previously exported object. Wipes current data first —
// this is a full replace, not a merge, which keeps the logic simple and
// predictable: what you restore is exactly what you get.
export function importAllData(data) {
  db.withTransactionSync(() => {
    db.runSync(`DELETE FROM sale_items`);
    db.runSync(`DELETE FROM sales`);
    db.runSync(`DELETE FROM payments`);
    db.runSync(`DELETE FROM products`);
    db.runSync(`DELETE FROM customers`);

    for (const c of data.customers || []) {
      db.runSync(
        `INSERT INTO customers (id, name, contact_number, address, notes, credit_limit, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.name, c.contact_number, c.address, c.notes, c.credit_limit, c.is_active, c.created_at]
      );
    }
    for (const p of data.products || []) {
      db.runSync(
        `INSERT INTO products (id, name, category, unit, unit_price, cost_price, stock_qty, reorder_level, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.name, p.category, p.unit, p.unit_price, p.cost_price, p.stock_qty, p.reorder_level, p.is_active, p.created_at]
      );
    }
    for (const s of data.sales || []) {
      db.runSync(
        `INSERT INTO sales (id, customer_id, sale_type, total_amount, sale_date, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [s.id, s.customer_id, s.sale_type, s.total_amount, s.sale_date, s.note]
      );
    }
    for (const si of data.sale_items || []) {
      db.runSync(
        `INSERT INTO sale_items (id, sale_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [si.id, si.sale_id, si.product_id, si.product_name, si.unit_price, si.quantity, si.line_total]
      );
    }
    for (const p of data.payments || []) {
      db.runSync(
        `INSERT INTO payments (id, customer_id, amount, payment_date, method, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [p.id, p.customer_id, p.amount, p.payment_date, p.method, p.note]
      );
    }
  });
}