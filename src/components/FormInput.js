import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

// A labeled text input, used on every Add/Edit form in the app.
export default function FormInput({ label, value, onChangeText, keyboardType, placeholder, multiline }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});