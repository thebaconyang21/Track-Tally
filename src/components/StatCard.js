import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function StatCard({ label, value, tone }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, tone === 'danger' && styles.danger, tone === 'success' && styles.success]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  label: { fontSize: 12, color: colors.textMuted, marginBottom: 4, textAlign: 'center' },
  value: { fontSize: 18, fontWeight: '700', color: colors.text },
  danger: { color: colors.danger },
  success: { color: colors.success },
});