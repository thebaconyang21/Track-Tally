import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { setPin, verifyPin } from '../utils/pin';

// mode: 'setup' (first time, create a PIN) or 'unlock' (verify existing PIN)
export default function PinScreen({ mode, onSuccess }) {
  const [pin, setPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (mode === 'setup') {
      if (pin.length !== 4) {
        setError('PIN must be 4 digits.');
        return;
      }
      if (pin !== confirmPin) {
        setError('PINs do not match.');
        return;
      }
      await setPin(pin);
      onSuccess();
    } else {
      const ok = await verifyPin(pin);
      if (ok) {
        onSuccess();
      } else {
        setError('Incorrect PIN.');
        setPinInput('');
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'setup' ? 'Set your PIN' : 'Enter PIN'}</Text>
      <Text style={styles.subtitle}>
        {mode === 'setup' ? 'Protects your sales and debtor records' : 'Track&Tally is locked'}
      </Text>

      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPinInput}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        placeholder="4-digit PIN"
        placeholderTextColor={colors.textMuted}
        autoFocus
      />

      {mode === 'setup' && (
        <TextInput
          style={styles.input}
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          placeholder="Confirm PIN"
          placeholderTextColor={colors.textMuted}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{mode === 'setup' ? 'Set PIN' : 'Unlock'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#E8F5E9', marginBottom: 24, textAlign: 'center' },
  input: {
    backgroundColor: '#fff', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 20, textAlign: 'center', letterSpacing: 8, width: '70%', marginBottom: 12,
  },
  error: { color: '#FFCDD2', fontSize: 13, marginBottom: 12 },
  button: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  buttonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
});