import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCustomerById } from '../db/customers';
import { getSalesByCustomer, getSaleItems } from '../db/sales';
import { getPaymentsByCustomer } from '../db/payments';
import { colors } from '../theme/colors';
import { formatPeso } from '../utils/format';
import PrimaryButton from '../components/PrimaryButton';

export default function DebtorDetailScreen({ route, navigation }) {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [balance, setBalance] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const c = getCustomerById(customerId);
      setCustomer(c);
      navigation.setOptions({ title: c ? c.name : 'Debtor' });

      // Combine sales (charges) and payments into one list of entries,
      // each tagged with a type, then sort by date so they interleave
      // correctly — a payment made between two sales must land between them.
      const sales = getSalesByCustomer(customerId).map((s) => ({
        type: 'charge',
        id: `sale-${s.id}`,
        date: s.sale_date,
        amount: s.total_amount,
        note: s.note,
        saleId: s.id,
      }));
      const payments = getPaymentsByCustomer(customerId).map((p) => ({
        type: 'payment',
        id: `payment-${p.id}`,
        date: p.payment_date,
        amount: p.amount,
        note: p.note,
        method: p.method,
      }));

      const combined = [...sales, ...payments].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      // Walk oldest to newest, building a running balance on each entry.
      let running = 0;
      const withRunning = combined.map((entry) => {
        running += entry.type === 'charge' ? entry.amount : -entry.amount;
        return { ...entry, runningBalance: running };
      });

      // Show newest first in the UI, but the running balance was
      // computed oldest-first above, which is the only correct order for it.
      setLedger(withRunning.reverse());
      setBalance(running);
    }, [customerId])
  );

  if (!customer) return null;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        {customer.contact_number ? <Text style={styles.contact}>{customer.contact_number}</Text> : null}
        {customer.address ? <Text style={styles.contact}>{customer.address}</Text> : null}
        <Text style={styles.balanceLabel}>Current balance</Text>
        <Text style={[styles.balanceAmount, balance <= 0 && styles.balanceClear]}>
          {formatPeso(balance)}
        </Text>
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title="Record Payment"
              onPress={() => navigation.navigate('RecordPayment', { customerId })}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <PrimaryButton
              title="Edit Info"
              onPress={() => navigation.navigate('DebtorForm', { customerId })}
            />
          </View>
        </View>
      </View>

      <Text style={styles.historyHeader}>Transaction History</Text>

      <FlatList
        data={ledger}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Wala pang transaction.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryType}>
                {item.type === 'charge' ? 'Credit Sale' : `Payment (${item.method || 'cash'})`}
              </Text>
              <Text style={styles.entryDate}>
                {new Date(item.date).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
              </Text>
              {item.note ? <Text style={styles.entryNote}>{item.note}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.entryAmount, item.type === 'payment' && styles.paymentAmount]}>
                {item.type === 'charge' ? '+' : '-'}{formatPeso(item.amount)}
              </Text>
              <Text style={styles.runningBalance}>Bal: {formatPeso(item.runningBalance)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryCard: {
    backgroundColor: colors.surface, margin: 12, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  contact: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
  balanceLabel: { fontSize: 13, color: colors.textMuted, marginTop: 10 },
  balanceAmount: { fontSize: 28, fontWeight: '700', color: colors.danger, marginBottom: 12 },
  balanceClear: { color: colors.success },
  actionRow: { flexDirection: 'row' },
  historyHeader: { fontSize: 14, fontWeight: '700', color: colors.text, marginLeft: 16, marginBottom: 4 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  entryRow: {
    backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border,
  },
  entryType: { fontSize: 14, fontWeight: '600', color: colors.text },
  entryDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  entryNote: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  entryAmount: { fontSize: 15, fontWeight: '700', color: colors.danger },
  paymentAmount: { color: colors.success },
  runningBalance: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 30, fontSize: 14 },
});