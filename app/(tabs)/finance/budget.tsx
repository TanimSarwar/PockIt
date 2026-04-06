import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { useFinanceStore, type BudgetEntry } from '../../../store/finance';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card, Button, Input, Modal } from '../../../components/ui';
import { lightImpact } from '../../../lib/haptics';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];
const CAT_ICONS: Record<string, string> = {
  Food: 'food', Transport: 'car', Housing: 'home', Entertainment: 'movie-open',
  Shopping: 'shopping', Health: 'hospital-box', Education: 'school', Other: 'dots-horizontal',
};

export default function BudgetScreen() {
  const { theme } = useTheme();
  const { entries, addEntry, removeEntry, getMonthlyTotal, getCategoryBreakdown } = useFinanceStore();
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [isIncome, setIsIncome] = useState(false);

  const now = new Date();
  const monthly = getMonthlyTotal(now.getFullYear(), now.getMonth());
  const breakdown = getCategoryBreakdown(now.getFullYear(), now.getMonth());

  const monthEntries = entries
    .filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const maxCatAmount = Math.max(...Object.values(breakdown), 1);

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addEntry({
      amount: amt,
      category,
      description: description || category,
      type: isIncome ? 'income' : 'expense',
    });
    setAmount('');
    setDescription('');
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeEntry(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Budget Tracker"
        rightAction={
          <Pressable onPress={() => setShowModal(true)} accessibilityLabel="Add entry">
            <MaterialCommunityIcons name="plus-circle" size={28} color={theme.colors.accent} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary */}
        <Card>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Income</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>${monthly.income.toFixed(0)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.error }]}>${monthly.expense.toFixed(0)}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Net</Text>
              <Text style={[styles.summaryValue, { color: monthly.net >= 0 ? theme.colors.success : theme.colors.error }]}>${monthly.net.toFixed(0)}</Text>
            </View>
          </View>
        </Card>

        {/* Category breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <Card style={{ marginTop: 12 }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Expenses by Category</Text>
            {Object.entries(breakdown).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <View key={cat} style={styles.barRow}>
                <Text style={[styles.barLabel, { color: theme.colors.textSecondary }]}>{cat}</Text>
                <View style={[styles.bar, { backgroundColor: theme.colors.border }]}>
                  <View style={[styles.barFill, { width: `${(amt / maxCatAmount) * 100}%`, backgroundColor: theme.colors.accent }]} />
                </View>
                <Text style={[styles.barAmount, { color: theme.colors.text }]}>${amt.toFixed(0)}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Transactions */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 20 }]}>Transactions</Text>
        {monthEntries.length === 0 ? (
          <Text style={{ color: theme.colors.textTertiary, marginTop: 8 }}>No entries this month. Tap + to add one.</Text>
        ) : (
          monthEntries.map((entry) => (
            <Pressable key={entry.id} onLongPress={() => handleDelete(entry.id)}>
              <Card style={{ marginTop: 8 }}>
                <View style={styles.entryRow}>
                  <MaterialCommunityIcons name={(CAT_ICONS[entry.category] || 'cash') as any} size={24} color={theme.colors.accent} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '500' }}>{entry.description}</Text>
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>{entry.category} • {new Date(entry.date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={{ color: entry.type === 'income' ? theme.colors.success : theme.colors.error, fontWeight: '700' }}>
                    {entry.type === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showModal} onClose={() => setShowModal(false)} title="Add Entry">
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleBtn, { backgroundColor: !isIncome ? theme.colors.error + '20' : theme.colors.surface }]}
            onPress={() => { lightImpact(); setIsIncome(false); }}
          >
            <Text style={{ color: !isIncome ? theme.colors.error : theme.colors.textSecondary, fontWeight: '600' }}>Expense</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, { backgroundColor: isIncome ? theme.colors.success + '20' : theme.colors.surface }]}
            onPress={() => { lightImpact(); setIsIncome(true); }}
          >
            <Text style={{ color: isIncome ? theme.colors.success : theme.colors.textSecondary, fontWeight: '600' }}>Income</Text>
          </Pressable>
        </View>
        <Input label="Amount ($)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Groceries..." style={{ marginTop: 8 }} />
        {!isIncome && (
          <View style={[styles.catGrid, { marginTop: 12 }]}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.catBtn, { backgroundColor: category === c ? theme.colors.accent : theme.colors.surfaceSecondary }]}
                onPress={() => { lightImpact(); setCategory(c); }}
              >
                <Text style={{ color: category === c ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '500' }}>{c}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Button title="Add Entry" onPress={handleAdd} style={{ marginTop: 16 }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  summaryDivider: { width: 1, height: 36 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  barLabel: { width: 80, fontSize: 12 },
  bar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barAmount: { width: 50, textAlign: 'right', fontSize: 12, fontWeight: '600' },
  entryRow: { flexDirection: 'row', alignItems: 'center' },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
});
