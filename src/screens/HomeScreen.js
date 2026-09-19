import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDailySalesSummary, getUnpaidBalancesReport } from '../db/reports';
import { getLowStockProducts } from '../db/products';
import { colors } from '../theme/colors';
import { formatPeso } from '../utils/format';
import StatCard from '../components/StatCard';

export default function HomeScreen({ navigation }) {
  const [summary, setSummary] = useState(null);
  const [totalOwed, setTotalOwed] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setSummary(getDailySalesSummary(new Date()));
      const unpaid = getUnpaidBalancesReport();
      setTotalOwed(unpaid.reduce((sum, u) => sum + u.balance, 0));
      setLowStockCount(getLowStockProducts().length);
    }, [])
  );

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.dateText}>{today}</Text>

      <View style={styles.statRow}>
        <StatCard label="Today's Sales" value={summary ? formatPeso(summary.grandTotal) : '—'} tone="success" />
        <StatCard label="Outstanding Utang" value={formatPeso(totalOwed)} tone="danger" />
      </View>

      {lowStockCount > 0 && (
        <TouchableOpacity
          style={styles.lowStockBanner}
          onPress={() => navigation.navigate('Inventory')}
        >
          <Ionicons name="warning" size={18} color={colors.danger} />
          <Text style={styles.lowStockText}>
            {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} low on stock — tap to review
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Sell')}
        >
          <Ionicons name="cart" size={26} color={colors.primary} />
          <Text style={styles.actionLabel}>New Sale</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Debtors')}
        >
          <Ionicons name="cash" size={26} color={colors.primary} />
          <Text style={styles.actionLabel}>Record Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() =>
            navigation.navigate('Inventory', { screen: 'ProductForm', params: { productId: null } })
          }
        >
          <Ionicons name="add-circle" size={26} color={colors.primary} />
          <Text style={styles.actionLabel}>Add Product</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() =>
            navigation.navigate('Debtors', { screen: 'DebtorForm', params: { customerId: null } })
          }
        >
          <Ionicons name="person-add" size={26} color={colors.primary} />
          <Text style={styles.actionLabel}>Add Debtor</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Today at a Glance</Text>
      <View style={styles.glanceRow}>
        <StatCard label="Cash Sales" value={summary ? formatPeso(summary.cashTotal) : '—'} />
        <StatCard label="Utang Sales" value={summary ? formatPeso(summary.creditTotal) : '—'} tone="danger" />
        <StatCard label="Items Sold" value={summary ? String(summary.itemCount) : '—'} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  dateText: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  lowStockBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDECEA',
    padding: 12, borderRadius: 8, marginBottom: 16, gap: 8,
  },
  lowStockText: { color: colors.danger, fontSize: 13, fontWeight: '600', flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 4 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: 10, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, gap: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'center' },
  glanceRow: { flexDirection: 'row', gap: 8 },
});