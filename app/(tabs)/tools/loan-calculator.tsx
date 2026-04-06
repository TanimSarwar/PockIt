import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { lightImpact, mediumImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');

export default function LoanCalculatorScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('5');
  const [tenure, setTenure] = useState('25');
  const [isYears, setIsYears] = useState(true);

  const stats = useMemo(() => {
    const P = parseFloat(principal) || 0;
    const annualRate = parseFloat(rate) || 0;
    const months = isYears ? (parseFloat(tenure) || 0) * 12 : parseFloat(tenure) || 0;
    const r = annualRate / 12 / 100;

    let emi = 0;
    let totalPayment = 0;
    let totalInterest = 0;

    if (P > 0 && r > 0 && months > 0) {
      emi = (P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
      totalPayment = emi * months;
      totalInterest = totalPayment - P;
    } else if (P > 0 && months > 0) {
      emi = P / months;
      totalPayment = P;
    }

    const principalPercent = totalPayment > 0 ? (P / totalPayment) * 100 : 0;
    
    return {
      emi: emi.toFixed(2),
      totalInterest: totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      totalPayment: totalPayment.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      principalPercent,
      rawP: P.toLocaleString(),
    };
  }, [principal, rate, tenure, isYears]);

  return (
    <View style={[s.root, { backgroundColor: theme.colors.background }]}>
      {/* ── Header ── */}
      <View style={s.pageHead}>
        <View style={s.titleRow}>
          <Pressable 
            onPress={() => router.replace('/(tabs)/tools')} 
            style={[s.backBtn, { backgroundColor: theme.colors.surfaceTertiary }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.accent} />
          </Pressable>
          <Text style={[s.pageTitle, { color: theme.colors.text }]}>Loan Calculator</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={s.mainBody} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
        >
          {/* ── Inputs Card ── */}
          <View style={[s.glassCard, { backgroundColor: theme.colors.surface }]}>
            <View style={s.inputGroup}>
              <Text style={[s.label, { color: theme.colors.textTertiary }]}>LOAN AMOUNT ($)</Text>
              <View style={[s.inputWrap, { backgroundColor: theme.colors.surfaceTertiary }]}>
                <MaterialCommunityIcons name="bank" size={18} color={theme.colors.accent} />
                <TextInput
                  style={[s.input, { color: theme.colors.text }]}
                  value={principal}
                  onChangeText={setPrincipal}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textTertiary}
                  underlineColorAndroid="transparent"
                />
              </View>
            </View>

            <View style={s.row}>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <Text style={[s.label, { color: theme.colors.textTertiary }]}>INTEREST (%)</Text>
                <View style={[s.inputWrap, { backgroundColor: theme.colors.surfaceTertiary }]}>
                  <MaterialCommunityIcons name="percent" size={16} color={theme.colors.accent} />
                  <TextInput
                    style={[s.input, { color: theme.colors.text }]}
                    value={rate}
                    onChangeText={setRate}
                    keyboardType="decimal-pad"
                    placeholderTextColor={theme.colors.textTertiary}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>
              <View style={[s.inputGroup, { flex: 1.2 }]}>
                <Text style={[s.label, { color: theme.colors.textTertiary }]}>TENURE ({isYears ? 'Y' : 'M'})</Text>
                <View style={[s.inputWrap, { backgroundColor: theme.colors.surfaceTertiary }]}>
                  <TextInput
                    style={[s.input, { color: theme.colors.text }]}
                    value={tenure}
                    onChangeText={setTenure}
                    keyboardType="number-pad"
                    placeholderTextColor={theme.colors.textTertiary}
                    underlineColorAndroid="transparent"
                  />
                  <Pressable 
                    onPress={() => { selectionFeedback(); setIsYears(!isYears); }}
                    style={[s.unitPill, { backgroundColor: theme.colors.accent }]}
                  >
                    <Text style={s.unitTxt}>{isYears ? 'Years' : 'Months'}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* ── Result Card ── */}
          <View style={[s.resultCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[s.emiLabel, { color: theme.colors.textTertiary }]}>MONTHLY INSTALLMENT (EMI)</Text>
            <Text style={[s.emiVal, { color: theme.colors.text }]}>${stats.emi}</Text>
            
            <View style={s.breakdown}>
              <View style={[s.barBg, { backgroundColor: theme.colors.surfaceTertiary }]}>
                <View style={[s.barFill, { width: `${stats.principalPercent}%`, backgroundColor: theme.colors.accent }]} />
              </View>
              <View style={s.legendRow}>
                <View style={s.leg}>
                  <View style={[s.dot, { backgroundColor: theme.colors.accent }]} />
                  <Text style={[s.legTxt, { color: theme.colors.textTertiary }]}>Principal</Text>
                </View>
                <View style={s.leg}>
                  <View style={[s.dot, { backgroundColor: theme.colors.surfaceTertiary }]} />
                  <Text style={[s.legTxt, { color: theme.colors.textTertiary }]}>Interest</Text>
                </View>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.statsGrid}>
              <View style={s.stat}>
                <Text style={[s.statLab, { color: theme.colors.textTertiary }]}>PRINCIPAL</Text>
                <Text style={[s.statVal, { color: theme.colors.text }]}>${stats.rawP}</Text>
              </View>
              <View style={s.stat}>
                <Text style={[s.statLab, { color: theme.colors.textTertiary }]}>TOTAL INTEREST</Text>
                <Text style={[s.statVal, { color: theme.colors.text }]}>${stats.totalInterest}</Text>
              </View>
              <View style={s.stat}>
                <Text style={[s.statLab, { color: theme.colors.textTertiary }]}>TOTAL REPAYMENT</Text>
                <Text style={[s.statVal, { color: theme.colors.accent }]}>${stats.totalPayment}</Text>
              </View>
            </View>
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  pageHead:    { paddingHorizontal: 20, paddingTop: 10, marginBottom: 8 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pageTitle:   { fontSize: 24, fontWeight: '900', letterSpacing: -1 },

  mainBody:    { flex: 1, paddingHorizontal: 20, gap: 12 },

  glassCard:   { borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  inputGroup:  { marginBottom: 16 },
  row:         { flexDirection: 'row', gap: 12, marginBottom: 4 },
  label:       { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  input:       { flex: 1, marginLeft: 8, fontSize: 16, fontWeight: '800', borderWidth: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  unitPill:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  unitTxt:     { color: '#FFF', fontSize: 10, fontWeight: '800' },

  resultCard:  { borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 },
  emiLabel:    { fontSize: 10, fontWeight: '800', textAlign: 'center', letterSpacing: 1.5, marginBottom: 6 },
  emiVal:      { fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  
  breakdown:   { marginBottom: 20 },
  barBg:       { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 5 },
  legendRow:   { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  leg:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  legTxt:      { fontSize: 11, fontWeight: '700' },

  divider:     { height: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 20 },
  statsGrid:   { gap: 16 },
  stat:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLab:     { fontSize: 10, fontWeight: '800' },
  statVal:     { fontSize: 15, fontWeight: '800' },
});
