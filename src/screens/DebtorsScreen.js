import { useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getCustomersWithBalances } from '../db/customers';
import { colors } from '../theme/colors';
import { formatPeso } from '../utils/format';

export default function DebtorsScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      // Sort highest balance first — the owner cares most about
      // who owes the most, not alphabetical order.
      const data = getCustomersWithBalances().sort((a, b) => b.balance - a.balance);
      setCustomers(data);
    }, [])
  );

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalOwed = customers.reduce((sum, c) => sum + Math.max(c.balance, 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search debtors..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {totalOwed > 0 && (
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Total outstanding utang</Text>
          <Text style={styles.totalAmount}>{formatPeso(totalOwed)}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Walang debtor. I-tap ang + para mag-add.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('DebtorDetail', { customerId: item.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              {item.contact_number ? (
                <Text style={styles.meta}>{item.contact_number}</Text>
              ) : null}
            </View>
            <Text style={[styles.balance, item.balance <= 0 && styles.balanceClear]}>
              {item.balance > 0 ? formatPeso(item.balance) : 'Walang utang'}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('DebtorForm', { customerId: null })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    margin: 12, marginBottom: 6, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8, fontSize: 15, color: colors.text },
  totalBanner: {
    backgroundColor: colors.surface, marginHorizontal: 12, marginBottom: 6,
    padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalLabel: { fontSize: 13, color: colors.textMuted },
  totalAmount: { fontSize: 18, fontWeight: '700', color: colors.danger },
  list: { padding: 12, paddingBottom: 90 },
  card: {
    backgroundColor: colors.surface, borderRadius: 10, padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  balance: { fontSize: 15, fontWeight: '700', color: colors.danger },
  balanceClear: { color: colors.success, fontSize: 13, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14 },
  fab: {
    position: 'absolute', right: 20, bottom: 20, backgroundColor: colors.primary,
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
});