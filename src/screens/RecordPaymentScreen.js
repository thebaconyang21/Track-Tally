import { useState } from 'react';
import { View, ScrollView, Alert, StyleSheet, TouchableOpacity, Text } from 'react-native';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { insertPayment } from '../db/payments';
import { getCustomerBalance } from '../db/customers';
import { colors } from '../theme/colors';
import { formatPeso } from '../utils/format';

const METHODS = ['cash', 'gcash', 'other'];

export default function RecordPaymentScreen({ route, navigation }) {
  const { customerId } = route.params;
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const currentBalance = getCustomerBalance(customerId);

    function handleSave() {
    const trimmed = amount.trim();
    // Reject anything that isn't a plain number with up to 2 decimals —
    // catches stray periods, letters, or multiple decimal points before
    // parseFloat would otherwise silently mangle them.
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
        Alert.alert('Invalid amount', 'Enter a valid amount, e.g. 50 or 50.00');
        return;
    }

    const value = parseFloat(trimmed);
    if (value <= 0) {
        Alert.alert('Invalid amount', 'Enter a payment amount greater than 0.');
        return;
    }
    if (value > currentBalance) {
        Alert.alert(
        'Overpayment',
        `Balance is only ${formatPeso(currentBalance)}. Continue anyway?`,
        [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => savePayment(value) },
        ]
        );
        return;
    }
    savePayment(value);
    }

    function savePayment(value) {
    if (saving) return; // ignore a second tap while the first is still processing
    setSaving(true);
    insertPayment({ customer_id: customerId, amount: value, method, note: note.trim() });
    navigation.goBack();
    }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.balanceInfo}>Current balance: {formatPeso(currentBalance)}</Text>

      <FormInput
        label="Payment amount (₱)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <Text style={styles.label}>Payment method</Text>
      <View style={styles.methodRow}>
        {METHODS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.methodChip, method === m && styles.methodChipActive]}
            onPress={() => setMethod(m)}
          >
            <Text style={[styles.methodText, method === m && styles.methodTextActive]}>
              {m.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FormInput label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. bayad kinsenas" />

      <PrimaryButton title={saving ? 'Saving...' : 'Record Payment'} onPress={handleSave} disabled={saving} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  balanceInfo: { fontSize: 14, color: colors.textMuted, marginBottom: 16 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6, fontWeight: '600' },
  methodRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  methodChip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  methodChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  methodTextActive: { color: '#fff' },
});