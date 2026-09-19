import { db } from './database';

// Everything for one calendar day, given a JS Date. Returns cash total,
// credit total, item count, and the list of sales for that day.
export function getDailySalesSummary(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const startIso = startOfDay.toISOString();
  const endIso = endOfDay.toISOString();

  const sales = db.getAllSync(
    `SELECT * FROM sales WHERE sale_date BETWEEN ? AND ? ORDER BY sale_date DESC`,
    [startIso, endIso]
  );

  const cashTotal = sales
    .filter((s) => s.sale_type === 'cash')
    .reduce((sum, s) => sum + s.total_amount, 0);
  const creditTotal = sales
    .filter((s) => s.sale_type === 'credit')
    .reduce((sum, s) => sum + s.total_amount, 0);

  // Item count = total quantity across all sale_items for these sales,
  // not just number of sales rows (one sale can have many items).
  const itemCountRow = db.getFirstSync(
    `SELECT COALESCE(SUM(si.quantity), 0) AS total_items
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     WHERE s.sale_date BETWEEN ? AND ?`,
    [startIso, endIso]
  );

  return {
    date: startIso,
    sales,
    cashTotal,
    creditTotal,
    grandTotal: cashTotal + creditTotal,
    itemCount: itemCountRow.total_items,
  };
}

// Every active customer with an outstanding balance, highest first.
// Reuses the same "never store balance, always compute it" rule from
// customers.js — this just does it for everyone at once, in one pass,
// instead of calling getCustomerBalance() per customer.
export function getUnpaidBalancesReport() {
  const rows = db.getAllSync(`
    SELECT
      c.id,
      c.name,
      c.contact_number,
      COALESCE(charges.total, 0) AS total_charges,
      COALESCE(payments.total, 0) AS total_payments,
      COALESCE(charges.total, 0) - COALESCE(payments.total, 0) AS balance
    FROM customers c
    LEFT JOIN (
      SELECT customer_id, SUM(total_amount) AS total
      FROM sales WHERE sale_type = 'credit'
      GROUP BY customer_id
    ) charges ON charges.customer_id = c.id
    LEFT JOIN (
      SELECT customer_id, SUM(amount) AS total
      FROM payments
      GROUP BY customer_id
    ) payments ON payments.customer_id = c.id
    WHERE c.is_active = 1
  `);

  return rows
    .filter((r) => r.balance > 0)
    .sort((a, b) => b.balance - a.balance);
}

// Transaction history across a date range, sales and payments combined,
// newest first. Used for the "Transaction History" report tab.
export function getTransactionHistory(startDate, endDate) {
  const sales = db.getAllSync(
    `SELECT s.*, c.name AS customer_name FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id
     WHERE s.sale_date BETWEEN ? AND ?`,
    [startDate, endDate]
  ).map((s) => ({
    type: 'sale',
    id: `sale-${s.id}`,
    date: s.sale_date,
    amount: s.total_amount,
    label: s.sale_type === 'credit' ? `Utang — ${s.customer_name || 'Unknown'}` : 'Cash Sale',
  }));

  const payments = db.getAllSync(
    `SELECT p.*, c.name AS customer_name FROM payments p
     LEFT JOIN customers c ON c.id = p.customer_id
     WHERE p.payment_date BETWEEN ? AND ?`,
    [startDate, endDate]
  ).map((p) => ({
    type: 'payment',
    id: `payment-${p.id}`,
    date: p.payment_date,
    amount: p.amount,
    label: `Payment — ${p.customer_name || 'Unknown'}`,
  }));

  return [...sales, ...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Simple profit estimate for a date range, using cost_price captured
// at time of sale via sale_items' own unit_price (selling price) minus
// the product's current cost_price. Approximate: if cost_price changes
// later, past profit numbers shift too — acceptable for a capstone-level report.
export function getProfitSummary(startDate, endDate) {
  const rows = db.getAllSync(
    `SELECT si.quantity, si.unit_price, si.product_id, p.cost_price
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     LEFT JOIN products p ON p.id = si.product_id
     WHERE s.sale_date BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  let revenue = 0;
  let cost = 0;
  for (const row of rows) {
    revenue += row.quantity * row.unit_price;
    cost += row.quantity * (row.cost_price || 0);
  }

  return { revenue, cost, profit: revenue - cost };
}