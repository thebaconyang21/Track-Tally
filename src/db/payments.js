import { db } from './database';

export function insertPayment({ customer_id, amount, method, note }) {
  const result = db.runSync(
    `INSERT INTO payments (customer_id, amount, payment_date, method, note)
     VALUES (?, ?, ?, ?, ?)`,
    [customer_id, amount, new Date().toISOString(), method || 'cash', note || null]
  );
  return result.lastInsertRowId;
}

export function getPaymentsByCustomer(customerId) {
  return db.getAllSync(
    `SELECT * FROM payments WHERE customer_id = ? ORDER BY payment_date DESC`,
    [customerId]
  );
}