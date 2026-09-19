import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/db/database';
import { insertCustomer, getCustomersWithBalances } from './src/db/customers';
import { insertProduct, getProducts } from './src/db/products';
import { createSale } from './src/db/sales';
import { insertPayment } from './src/db/payments';

export default function App() {
  useEffect(() => {
    initDatabase();
    seedTestDataOnce();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

// TEMPORARY — proves the database layer works end to end.
// Delete this whole function once you've confirmed the console logs (Step 9).
function seedTestDataOnce() {
  const existing = getProducts();
  if (existing.length > 0) {
    console.log('Seed data already exists, skipping.');
    console.log('Customers with balances:', getCustomersWithBalances());
    console.log('Products:', getProducts());
    return;
  }

  const productId = insertProduct({
    name: 'Kopiko Candy',
    category: 'Snacks',
    unit: 'piece',
    unit_price: 1,
    cost_price: 0.5,
    stock_qty: 100,
    reorder_level: 10,
  });

  const customerId = insertCustomer({
    name: 'Juan Dela Cruz',
    contact_number: '09171234567',
    address: 'Purok 2',
    notes: 'Kapitbahay',
    credit_limit: 500,
  });

  createSale({
    customer_id: customerId,
    sale_type: 'credit',
    items: [{ product_id: productId, product_name: 'Kopiko Candy', unit_price: 1, quantity: 20 }],
    note: 'Test credit sale',
  });

  insertPayment({ customer_id: customerId, amount: 5, method: 'cash', note: 'Partial payment test' });

  console.log('Seed data created.');
  console.log('Customers with balances:', getCustomersWithBalances());
  console.log('Products:', getProducts());
}