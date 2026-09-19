import { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { insertCustomer, updateCustomer, getCustomerById, deactivateCustomer, getCustomerBalance } from '../db/customers';
import { colors } from '../theme/colors';

export default function DebtorFormScreen({ route, navigation }) {
  const { customerId } = route.params;
  const isEditing = customerId != null;

  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Debtor' : 'Add Debtor' });
    if (isEditing) {
      const customer = getCustomerById(customerId);
      if (customer) {
        setName(customer.name);
        setContactNumber(customer.contact_number || '');
        setAddress(customer.address || '');
        setNotes(customer.notes || '');
        setCreditLimit(String(customer.credit_limit || 0));
      }
    }
  }, [customerId]);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Debtor name is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      contact_number: contactNumber.trim(),
      address: address.trim(),
      notes: notes.trim(),
      credit_limit: parseFloat(creditLimit) || 0,
    };

    if (isEditing) {
      updateCustomer(customerId, payload);
    } else {
      insertCustomer(payload);
    }
    navigation.goBack();
  }

  function handleDelete() {
    const balance = getCustomerBalance(customerId);
    if (balance > 0) {
      Alert.alert(
        'May utang pa',
        `"${name}" still has an outstanding balance of ₱${balance.toFixed(2)}. Settle it before removing this debtor.`
      );
      return;
    }
    Alert.alert('Remove debtor?', `"${name}" will be hidden from your debtor list.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deactivateCustomer(customerId);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FormInput label="Full name" value={name} onChangeText={setName} placeholder="e.g. Juan Dela Cruz" />
      <FormInput
        label="Contact number"
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
        placeholder="09XXXXXXXXX"
      />
      <FormInput label="Address" value={address} onChangeText={setAddress} placeholder="e.g. Purok 2" />
      <FormInput
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. kapitbahay, bayad tuwing sahod"
        multiline
      />
      <FormInput
        label="Credit limit (₱) — optional, 0 = no limit"
        value={creditLimit}
        onChangeText={setCreditLimit}
        keyboardType="decimal-pad"
        placeholder="0"
      />

      <PrimaryButton title={isEditing ? 'Save Changes' : 'Add Debtor'} onPress={handleSave} />
      {isEditing && <PrimaryButton title="Remove Debtor" onPress={handleDelete} variant="danger" />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
});