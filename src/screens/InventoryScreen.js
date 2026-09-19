import { useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProducts } from '../db/products';
import { colors } from '../theme/colors';
import { formatPeso } from '../utils/format';

export default function InventoryScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  // useFocusEffect re-runs every time this screen becomes visible —
  // so after adding/editing a product on another screen, coming back
  // here always shows fresh data instead of a stale list.
  useFocusEffect(
    useCallback(() => {
      setProducts(getProducts());
    }, [])
  );

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = products.filter((p) => p.stock_qty <= p.reorder_level).length;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {lowStockCount > 0 && (
        <View style={styles.lowStockBanner}>
          <Ionicons name="warning" size={16} color={colors.danger} />
          <Text style={styles.lowStockText}>{lowStockCount} product(s) low on stock</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Walang product. I-tap ang + para mag-add.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductForm', { productId: item.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productMeta}>
                {item.category || 'Uncategorized'} · {item.unit || 'unit'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.price}>{formatPeso(item.unit_price)}</Text>
              <Text
                style={[
                  styles.stock,
                  item.stock_qty <= item.reorder_level && styles.stockLow,
                ]}
              >
                Stock: {item.stock_qty}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ProductForm', { productId: null })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8, fontSize: 15, color: colors.text },
  lowStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    marginHorizontal: 12,
    marginBottom: 6,
    padding: 8,
    borderRadius: 6,
    gap: 6,
  },
  lowStockText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  list: { padding: 12, paddingBottom: 90 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productName: { fontSize: 16, fontWeight: '600', color: colors.text },
  productMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '600', color: colors.text },
  stock: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  stockLow: { color: colors.danger, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});