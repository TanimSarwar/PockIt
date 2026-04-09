import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Input, Card } from '../../../components/ui';
import { lightImpact } from '../../../lib/haptics';

const FILING_STATUS = [
  { key: 'single', label: 'Single', deduction: 14600 },
  { key: 'married', label: 'Married', deduction: 29200 },
  { key: 'hoh', label: 'Head of Household', deduction: 21900 },
];

// 2024 US federal tax brackets (Single)
const BRACKETS_SINGLE = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

function calculateTax(taxableIncome: number): number {
  let tax = 0;
  for (const bracket of BRACKETS_SINGLE) {
    if (taxableIncome <= bracket.min) break;
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return tax;
}

export default function TaxEstimatorScreen() {
  const { theme } = useTheme();
  const [income, setIncome] = useState('');
  const [filingStatus, setFilingStatus] = useState('single');
  const [useDeduction, setUseDeduction] = useState(true);

  const grossIncome = parseFloat(income) || 0;
  const status = FILING_STATUS.find((s) => s.key === filingStatus)!;
  const deduction = useDeduction ? status.deduction : 0;
  const taxableIncome = Math.max(0, grossIncome - deduction);
  const estimatedTax = calculateTax(taxableIncome);
  const effectiveRate = grossIncome > 0 ? (estimatedTax / grossIncome) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="TOOLS / FINANCE" 
         title="Tax Estimator" 
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Annual Income ($)" value={income} onChangeText={setIncome} keyboardType="decimal-pad" placeholder="75000" />

        <Text style={[styles.label, { color: theme.colors.text, marginTop: 16 }]}>Filing Status</Text>
        <View style={styles.statusRow}>
          {FILING_STATUS.map((s) => (
            <Pressable
              key={s.key}
              style={[styles.statusBtn, { backgroundColor: filingStatus === s.key ? theme.colors.accent : theme.colors.surface }]}
              onPress={() => { lightImpact(); setFilingStatus(s.key); }}
            >
              <Text style={{ color: filingStatus === s.key ? '#fff' : theme.colors.text, fontWeight: '600', fontSize: 13 }}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.deductionBtn, { backgroundColor: useDeduction ? theme.colors.accentMuted : theme.colors.surface }]}
          onPress={() => { lightImpact(); setUseDeduction(!useDeduction); }}
        >
          <Text style={{ color: useDeduction ? theme.colors.accent : theme.colors.textSecondary, fontWeight: '600' }}>
            {useDeduction ? '✓ ' : ''}Standard Deduction (${status.deduction.toLocaleString()})
          </Text>
        </Pressable>

        {grossIncome > 0 && (
          <Card style={{ marginTop: 20 }}>
            <View style={styles.resultRow}>
              <Text style={{ color: theme.colors.textSecondary }}>Gross Income</Text>
              <Text style={[styles.resultValue, { color: theme.colors.text }]}>${grossIncome.toLocaleString()}</Text>
            </View>
            <View style={[styles.resultRow, { marginTop: 8 }]}>
              <Text style={{ color: theme.colors.textSecondary }}>Deduction</Text>
              <Text style={[styles.resultValue, { color: theme.colors.success }]}>-${deduction.toLocaleString()}</Text>
            </View>
            <View style={[styles.resultRow, { marginTop: 8 }]}>
              <Text style={{ color: theme.colors.textSecondary }}>Taxable Income</Text>
              <Text style={[styles.resultValue, { color: theme.colors.text }]}>${taxableIncome.toLocaleString()}</Text>
            </View>
            <View style={[styles.resultRow, styles.taxRow, { borderTopColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>Estimated Tax</Text>
              <Text style={[styles.taxValue, { color: theme.colors.accent }]}>${estimatedTax.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</Text>
            </View>
            <Text style={[styles.rateText, { color: theme.colors.textTertiary }]}>
              Effective Rate: {effectiveRate.toFixed(1)}%
            </Text>
          </Card>
        )}

        <Text style={[styles.disclaimer, { color: theme.colors.textTertiary }]}>
          ⚠️ This is a simplified estimate based on 2024 US federal tax brackets for single filers. Does not include state taxes, credits, or deductions beyond the standard deduction. Consult a tax professional for accurate filing.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  deductionBtn: { marginTop: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultValue: { fontSize: 16, fontWeight: '600' },
  taxRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  taxValue: { fontSize: 24, fontWeight: '700' },
  rateText: { textAlign: 'right', marginTop: 4, fontSize: 13 },
  disclaimer: { marginTop: 20, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
