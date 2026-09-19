import { insertProduct, updateProduct, getProductById, deactivateProduct, adjustStock } from '../db/products';
import { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import PromptModal from '../components/PromptModal';

export default function ProductFormScreen({ route, navigation }) {
  const { productId } = route.params;
  const isEditing = productId != null;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [restockVisible, setRestockVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Product' : 'Add Product' });
    if (isEditing) {
      const product = getProductById(productId);
      if (product) {
        setName(product.name);
        setCategory(product.category || '');
        setUnit(product.unit || '');
        setUnitPrice(String(product.unit_price));
        setCostPrice(String(product.cost_price));
        setStockQty(String(product.stock_qty));
        setReorderLevel(String(product.reorder_level));
      }
    }
  }, [productId]);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Product name is required.');
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(unitPrice.trim())) {
        Alert.alert('Invalid price', 'Enter a valid selling price, e.g. 15 or 15.50');
        return;
    }

    const price = parseFloat(unitPrice);

    const payload = {
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      unit_price: price,
      cost_price: parseFloat(costPrice) || 0,
      stock_qty: parseFloat(stockQty) || 0,
      reorder_level: parseFloat(reorderLevel) || 0,
    };

    if (isEditing) {
      // stock_qty is intentionally not updated here — restocking has
      // its own action (Phase 3 Step 6) so edits don't accidentally change stock.
      updateProduct(productId, payload);
    } else {
      insertProduct(payload);
    }
    navigation.goBack();
  }

  function handleDelete() {
    Alert.alert('Remove product?', `"${name}" will be hidden from your inventory.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deactivateProduct(productId);
          navigation.goBack();
        },
      },
    ]);
  }

  function handleRestock() {
    setRestockVisible(true);
    }

    function confirmRestock(input) {
    const qty = parseFloat(input);
    setRestockVisible(false);
    if (!isNaN(qty) && qty > 0) {
        adjustStock(productId, qty);
        Alert.alert('Stock updated', `Added ${qty} units.`);
        navigation.goBack();
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FormInput label="Product name" value={name} onChangeText={setName} placeholder="e.g. Kopiko Candy" />
      <FormInput label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Snacks" />
      <FormInput label="Unit" value={unit} onChangeText={setUnit} placeholder="e.g. piece, sachet, bottle" />
      <FormInput
        label="Selling price (₱)"
        value={unitPrice}
        onChangeText={setUnitPrice}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      <FormInput
        label="Cost price (₱) — optional, for profit tracking"
        value={costPrice}
        onChangeText={setCostPrice}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      {!isEditing && (
        <FormInput
          label="Starting stock"
          value={stockQty}
          onChangeText={setStockQty}
          keyboardType="decimal-pad"
          placeholder="0"
        />
      )}
      <FormInput
        label="Low stock alert level"
        value={reorderLevel}
        onChangeText={setReorderLevel}
        keyboardType="decimal-pad"
        placeholder="e.g. 10"
      />

      <PrimaryButton title={isEditing ? 'Save Changes' : 'Add Product'} onPress={handleSave} />
      {isEditing && <PrimaryButton title="Restock" onPress={handleRestock} />}
      {isEditing && <PrimaryButton title="Remove Product" onPress={handleDelete} variant="danger" />}

      <PromptModal
        visible={restockVisible}
        title="Restock"
        message={`Add how many units of "${name}"?`}
        keyboardType="number-pad"
        onCancel={() => setRestockVisible(false)}
        onConfirm={confirmRestock}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
});