import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCustomers } from '../db/customers';
import { createSale } from '../db/sales';
import { colors } from '../theme/colors';
import { formatPeso } from '../utils/format';
import PrimaryButton from '../components/PrimaryButton';

export default function CheckoutScreen({ route, navigation }) {
  const { cart } = route.params; // array of { product, quantity }
  const [saleType, setSaleType] = useState('cash');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setCustomers(getCustomers());
    }, [])
  );

  const total = cart.reduce((sum, i) => sum + i.quantity * i.product.unit_price, 0);

  function handleConfirm() {
    if (saleType === 'credit' && !selectedCustomerId) {
      Alert.alert('Pumili ng debtor', 'Select which customer this utang belongs to.');
      return;
    }

    setSaving(true);
    try {
      createSale({
        customer_id: saleType === 'credit' ? selectedCustomerId : null,
        sale_type: saleType,
        items: cart.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          unit_price: i.product.unit_price,
          quantity: i.quantity,
        })),
      });
      Alert.alert('Sale recorded', `Total: ${formatPeso(total)}`, [
        { text: 'OK', onPress: () => navigation.navigate('SellHome') },
      ]);
    } catch (err) {
    Alert.alert('Could not complete sale', err.message || 'Please check stock and try again.');
    console.log('createSale error:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        keyExtractor={(item) => String(item.product.id)}
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>Items</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{item.product.name}</Text>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
            <Text style={styles.itemTotal}>{formatPeso(item.quantity * item.product.unit_price)}</Text>
          </View>
        )}
        ListFooterComponent={
          <>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{formatPeso(total)}</Text>
            </View>

            <Text style={styles.sectionTitle}>Payment Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeChip, saleType === 'cash' && styles.typeChipActive]}
                onPress={() => setSaleType('cash')}
              >
                <Text style={[styles.typeText, saleType === 'cash' && styles.typeTextActive]}>CASH</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeChip, saleType === 'credit' && styles.typeChipActive]}
                onPress={() => setSaleType('credit')}
              >
                <Text style={[styles.typeText, saleType === 'credit' && styles.typeTextActive]}>UTANG</Text>
              </TouchableOpacity>
            </View>

            {saleType === 'credit' && (
              <>
                <Text style={styles.sectionTitle}>Select Debtor</Text>
                {customers.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Walang debtor pa. Add one first sa Debtors tab.
                  </Text>
                ) : (
                  customers.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.customerRow,
                        selectedCustomerId === c.id && styles.customerRowActive,
                      ]}
                      onPress={() => setSelectedCustomerId(c.id)}
                    >
                      <Text
                        style={[
                          styles.customerName,
                          selectedCustomerId === c.id && styles.customerNameActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}

            <PrimaryButton
              title={saving ? 'Saving...' : 'Confirm Sale'}
              onPress={handleConfirm}
              loading={saving}
              disabled={saving}
            />
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface,
    padding: 12, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: colors.border,
  },
  itemName: { flex: 1, fontSize: 14, color: colors.text },
  itemQty: { fontSize: 14, color: colors.textMuted, marginHorizontal: 10 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalAmount: { fontSize: 18, fontWeight: '700', color: colors.primary },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { fontWeight: '700', color: colors.textMuted },
  typeTextActive: { color: '#fff' },
  customerRow: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 6,
    backgroundColor: colors.surface,
  },
  customerRowActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  customerName: { fontSize: 14, color: colors.text },
  customerNameActive: { color: '#fff', fontWeight: '600' },
  emptyText: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', marginBottom: 8 },
});