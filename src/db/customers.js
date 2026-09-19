import { db } from './database';

// Insert a new debtor. Returns the new row's id.
export function insertCustomer({ name, contact_number, address, notes, credit_limit }) {
  const result = db.runSync(
    `INSERT INTO customers (name, contact_number, address, notes, credit_limit, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [name, contact_number || null, address || null, notes || null, credit_limit || 0, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

// Get every active customer, alphabetically.
export function getCustomers() {
  return db.getAllSync(`SELECT * FROM customers WHERE is_active = 1 ORDER BY name ASC`);
}

// Get a single customer by id.
export function getCustomerById(id) {
  return db.getFirstSync(`SELECT * FROM customers WHERE id = ?`, [id]);
}

// Update an existing customer's details.
export function updateCustomer(id, { name, contact_number, address, notes, credit_limit }) {
  db.runSync(
    `UPDATE customers SET name = ?, contact_number = ?, address = ?, notes = ?, credit_limit = ?
     WHERE id = ?`,
    [name, contact_number || null, address || null, notes || null, credit_limit || 0, id]
  );
}

// Soft delete — we never hard-delete a debtor, because their sales/payment
// history must stay intact for reports. We just hide them from active lists.
export function deactivateCustomer(id) {
  db.runSync(`UPDATE customers SET is_active = 0 WHERE id = ?`, [id]);
}

// Computes a customer's current balance from real transactions —
// never from a stored "balance" column. This is the core rule of the app.
export function getCustomerBalance(customerId) {
  const chargesRow = db.getFirstSync(
    `SELECT COALESCE(SUM(total_amount), 0) AS total
     FROM sales WHERE customer_id = ? AND sale_type = 'credit'`,
    [customerId]
  );
  const paymentsRow = db.getFirstSync(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM payments WHERE customer_id = ?`,
    [customerId]
  );
  return chargesRow.total - paymentsRow.total;
}

// Convenience: every active customer with their balance attached,
// used by the Debtors list screen (Phase 4).
export function getCustomersWithBalances() {
  const customers = getCustomers();
  return customers.map((c) => ({
    ...c,
    balance: getCustomerBalance(c.id),
  }));
}