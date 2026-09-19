import { useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProducts } from '../db/products';
import { colors } from '../theme/colors';
import { formatPeso } from '../utils/format';

export default function SellScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  // cart is a map of productId -> { product, quantity }, so tapping the
  // same product twice increments quantity instead of adding a duplicate row.
  const [cart, setCart] = useState({});

  useFocusEffect(
    useCallback(() => {
      setProducts(getProducts());
      setCart({}); // always start with an empty cart when this screen gains focus
    }, [])
  );

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev[product.id];
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + 1 > product.stock_qty) {
        return prev; // block silently; UI already disables at max, see below
      }
      return { ...prev, [product.id]: { product, quantity: currentQty + 1 } };
    });
  }

  function removeFromCart(productId) {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: { ...existing, quantity: existing.quantity - 1 } };
    });
  }

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.quantity * i.product.unit_price, 0);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products to sell..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Walang product sa inventory.</Text>}
        renderItem={({ item }) => {
          const inCart = cart[item.id]?.quantity || 0;
          const atMaxStock = inCart >= item.stock_qty;
          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productMeta}>
                  {formatPeso(item.unit_price)} · Stock: {item.stock_qty}
                </Text>
              </View>
              {inCart > 0 ? (
                <View style={styles.qtyControl}>
                  <TouchableOpacity style={styles.qtyButton} onPress={() => removeFromCart(item.id)}>
                    <Ionicons name="remove" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{inCart}</Text>
                  <TouchableOpacity
                    style={[styles.qtyButton, atMaxStock && styles.qtyButtonDisabled]}
                    onPress={() => addToCart(item)}
                    disabled={atMaxStock}
                  >
                    <Ionicons name="add" size={18} color={atMaxStock ? colors.inactive : colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.addButton, item.stock_qty <= 0 && styles.addButtonDisabled]}
                  onPress={() => addToCart(item)}
                  disabled={item.stock_qty <= 0}
                >
                  <Text style={styles.addButtonText}>{item.stock_qty <= 0 ? 'No stock' : 'Add'}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => navigation.navigate('Checkout', { cart: cartItems })}
        >
          <Text style={styles.cartBarText}>{cartCount} item(s)</Text>
          <Text style={styles.cartBarTotal}>{formatPeso(cartTotal)}</Text>
          <Text style={styles.cartBarAction}>Checkout →</Text>
        </TouchableOpacity>
      )}
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
  list: { padding: 12, paddingBottom: 90 },
  card: {
    backgroundColor: colors.surface, borderRadius: 10, padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  productName: { fontSize: 16, fontWeight: '600', color: colors.text },
  productMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonDisabled: { backgroundColor: colors.inactive },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyButton: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyButtonDisabled: { borderColor: colors.inactive },
  qtyText: { fontSize: 16, fontWeight: '700', color: colors.text, minWidth: 20, textAlign: 'center' },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14 },
  cartBar: {
    position: 'absolute', left: 12, right: 12, bottom: 16, backgroundColor: colors.primary,
    borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cartBarText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  cartBarTotal: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cartBarAction: { color: '#fff', fontWeight: '600', fontSize: 14 },
});