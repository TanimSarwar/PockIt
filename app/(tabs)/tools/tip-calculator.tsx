import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Input, Card } from '../../../components/ui';
import { lightImpact } from '../../../lib/haptics';

const TIP_PRESETS = [10, 15, 18, 20, 25];

export default function TipCalculatorScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const [bill, setBill] = useState('');
  const [tipPercent, setTipPercent] = useState(18);
  const [customTip, setCustomTip] = useState('');
  const [people, setPeople] = useState('1');
  const [roundUp, setRoundUp] = useState(false);

  React.useEffect(() => {
    if (params.billAmount) setBill(params.billAmount as string);
    if (params.splitCount) setPeople(params.splitCount as string);
  }, [params]);

  const billAmount = parseFloat(bill) || 0;
  const activeTip = customTip ? parseFloat(customTip) || 0 : tipPercent;
  const tipAmount = billAmount * (activeTip / 100);
  let total = billAmount + tipAmount;
  if (roundUp) total = Math.ceil(total);
  const numPeople = Math.max(1, parseInt(people) || 1);
  const perPerson = total / numPeople;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="TOOLS / FINANCE" 
         title="Tip Calculator" 
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Bill Amount ($)" value={bill} onChangeText={setBill} keyboardType="decimal-pad" placeholder="0.00" />

        <Text style={[styles.label, { color: theme.colors.text, marginTop: 16 }]}>Tip Percentage</Text>
        <View style={styles.tipRow}>
          {TIP_PRESETS.map((t) => (
            <Pressable
              key={t}
              style={[styles.tipBtn, { backgroundColor: tipPercent === t && !customTip ? theme.colors.accent : theme.colors.surface }]}
              onPress={() => { lightImpact(); setTipPercent(t); setCustomTip(''); }}
            >
              <Text style={{ color: tipPercent === t && !customTip ? '#fff' : theme.colors.text, fontWeight: '600' }}>{t}%</Text>
            </Pressable>
          ))}
        </View>
        <Input label="Custom %" value={customTip} onChangeText={setCustomTip} keyboardType="decimal-pad" placeholder="Custom" />

        <Input label="Split Between" value={people} onChangeText={setPeople} keyboardType="number-pad" placeholder="1" style={{ marginTop: 12 }} />

        <Pressable
          style={[styles.roundBtn, { backgroundColor: roundUp ? theme.colors.accentMuted : theme.colors.surface }]}
          onPress={() => { lightImpact(); setRoundUp(!roundUp); }}
        >
          <Text style={{ color: roundUp ? theme.colors.accent : theme.colors.textSecondary, fontWeight: '600' }}>
            {roundUp ? '✓ ' : ''}Round Up
          </Text>
        </Pressable>

        <Card style={{ marginTop: 20 }}>
          <View style={styles.resultRow}>
            <Text style={{ color: theme.colors.textSecondary }}>Tip</Text>
            <Text style={[styles.resultValue, { color: theme.colors.text }]}>${tipAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.resultRow, { marginTop: 8 }]}>
            <Text style={{ color: theme.colors.textSecondary }}>Total</Text>
            <Text style={[styles.resultValue, { color: theme.colors.text }]}>${total.toFixed(2)}</Text>
          </View>
          {numPeople > 1 && (
            <View style={[styles.resultRow, styles.perPerson, { borderTopColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>Per Person</Text>
              <Text style={[styles.perPersonValue, { color: theme.colors.accent }]}>${perPerson.toFixed(2)}</Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tipBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  roundBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultValue: { fontSize: 20, fontWeight: '700' },
  perPerson: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  perPersonValue: { fontSize: 24, fontWeight: '700' },
});
