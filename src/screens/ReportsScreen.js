import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  getDailySalesSummary,
  getUnpaidBalancesReport,
  getTransactionHistory,
} from '../db/reports';
import { exportAllData, importAllData } from '../db/backup';
import { colors } from '../theme/colors';
import { formatPeso } from '../utils/format';
import StatCard from '../components/StatCard';

// Short labels so the tab row never wraps to two lines on narrow phones.
const TABS = ['Sales', 'Unpaid', 'History', 'Backup'];

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getLast7DaysRange() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState('Sales');
  const [dailySummary, setDailySummary] = useState(null);
  const [unpaid, setUnpaid] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyRangeLabel, setHistoryRangeLabel] = useState('Last 7 days');

  useFocusEffect(
    useCallback(() => {
      setDailySummary(getDailySalesSummary(new Date()));
      setUnpaid(getUnpaidBalancesReport());
      const range = getLast7DaysRange();
      setHistory(getTransactionHistory(range.start, range.end));
    }, [])
  );

  function loadHistoryRange(label) {
    setHistoryRangeLabel(label);
    const range = label === 'Today' ? getTodayRange() : getLast7DaysRange();
    setHistory(getTransactionHistory(range.start, range.end));
  }

  async function handleExport() {
    try {
      const data = exportAllData();
      const json = JSON.stringify(data, null, 2);
      const fileUri = FileSystem.documentDirectory + `tracktally-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, json);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Backup saved', `Saved to: ${fileUri}`);
      }
    } catch (err) {
      Alert.alert('Backup failed', 'Could not create backup file.');
      console.log('Export error:', err);
    }
  }

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(content);

      Alert.alert(
        'Restore backup?',
        'This will REPLACE all current data with the backup file. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: () => {
              importAllData(data);
              Alert.alert('Restore complete', 'Restart the app to see restored data.');
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Restore failed', 'Could not read that backup file.');
      console.log('Import error:', err);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
              numberOfLines={1}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Sales' && dailySummary && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.statRow}>
            <StatCard label="Cash Sales" value={formatPeso(dailySummary.cashTotal)} />
            <StatCard label="Utang Sales" value={formatPeso(dailySummary.creditTotal)} tone="danger" />
          </View>
          <View style={styles.statRow}>
            <StatCard label="Grand Total" value={formatPeso(dailySummary.grandTotal)} tone="success" />
            <StatCard label="Items Sold" value={String(dailySummary.itemCount)} />
          </View>

          <Text style={styles.sectionTitle}>Today's Sales List</Text>
          <FlatList
            data={dailySummary.sales}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Wala pang benta ngayong araw.</Text>}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>
                  {item.sale_type === 'credit' ? 'Utang Sale' : 'Cash Sale'}
                </Text>
                <Text style={styles.rowTime}>
                  {new Date(item.sale_date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.rowAmount}>{formatPeso(item.total_amount)}</Text>
              </View>
            )}
          />
        </View>
      )}

      {activeTab === 'Unpaid' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            Unpaid Balances ({unpaid.length} debtor{unpaid.length !== 1 ? 's' : ''})
          </Text>
          <View style={styles.statRow}>
            <StatCard
              label="Total Outstanding"
              value={formatPeso(unpaid.reduce((sum, u) => sum + u.balance, 0))}
              tone="danger"
            />
          </View>
          <FlatList
            data={unpaid}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Walang may utang. 🎉</Text>}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{item.name}</Text>
                <Text style={styles.rowAmount}>{formatPeso(item.balance)}</Text>
              </View>
            )}
          />
        </View>
      )}

      {activeTab === 'History' && (
        <View style={styles.content}>
          <View style={styles.rangeRow}>
            {['Today', 'Last 7 days'].map((label) => (
              <TouchableOpacity
                key={label}
                style={[styles.rangeChip, historyRangeLabel === label && styles.rangeChipActive]}
                onPress={() => loadHistoryRange(label)}
              >
                <Text style={[styles.rangeText, historyRangeLabel === label && styles.rangeTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.emptyText}>Walang transaction sa date range na ito.</Text>}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowTime}>
                    {new Date(item.date).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </Text>
                </View>
                <Text style={[styles.rowAmount, item.type === 'payment' && styles.paymentAmount]}>
                  {item.type === 'sale' ? '+' : '-'}{formatPeso(item.amount)}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      {activeTab === 'Backup' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Data Backup</Text>
          <Text style={styles.emptyText}>
            Export all your records to a file you can save to Google Drive, email, or Messenger.
            Restoring replaces everything currently on this device.
          </Text>
          <TouchableOpacity style={styles.backupButton} onPress={handleExport}>
            <Text style={styles.backupButtonText}>Export Backup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.backupButton, styles.restoreButton]} onPress={handleImport}>
            <Text style={styles.backupButtonText}>Restore from Backup</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  content: { padding: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginVertical: 8 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, padding: 12, borderRadius: 8, marginBottom: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  rowLabel: { fontSize: 13, color: colors.text, fontWeight: '600', flex: 1 },
  rowTime: { fontSize: 11, color: colors.textMuted, marginRight: 8 },
  rowAmount: { fontSize: 14, fontWeight: '700', color: colors.danger },
  paymentAmount: { color: colors.success },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: 20, fontSize: 13 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  rangeChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  rangeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rangeText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  rangeTextActive: { color: '#fff' },
  backupButton: {
    backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', marginTop: 16,
  },
  restoreButton: { backgroundColor: colors.danger },
  backupButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});