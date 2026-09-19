import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function SellScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sell</Text>
      <Text style={styles.subtitle}>Cart / checkout goes here — Phase 5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 8 },
});