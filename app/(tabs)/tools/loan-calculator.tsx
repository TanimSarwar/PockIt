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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;

// ─── Stat Card Component (Matches SoundCard exactly) ─────────────────────────

function StatCard({ 
  label, 
  value, 
  emoji, 
  icon, 
  theme 
}: { 
  label: string; 
  value: string; 
  emoji: string; 
  icon: string; 
  theme: any;
}) {
  const scale = useSharedValue(1);
  const pressIn = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); };
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[sc.card, { backgroundColor: theme.colors.surface }, aStyle]}>
        <View style={[sc.playBtn, { backgroundColor: theme.colors.surfaceTertiary }]}>
          <MaterialCommunityIcons name={icon as any} size={12} color={theme.colors.accent} />
        </View>
        <View style={sc.iconWrap}>
          <Text style={sc.emoji}>{emoji}</Text>
        </View>
        <View style={sc.info}>
          <Text style={[sc.name, { color: theme.colors.text }]} numberOfLines={1}>{value}</Text>
          <Text style={[sc.tags, { color: theme.colors.textTertiary }]} numberOfLines={1}>{label}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const sc = StyleSheet.create({
  card: { width: CARD_W, borderRadius: 16, padding: 12, gap: 4, borderWidth: 1.5, borderColor: 'transparent', elevation: 2 },
  iconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  info: { gap: 0 },
  name: { fontSize: 12, fontWeight: '700' },
  tags: { fontSize: 10, fontWeight: '500' },
  playBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 8, right: 8, zIndex: 10 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LoanCalculatorScreen() {
  const { theme } = useTheme();
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
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
        category="TOOLS / FINANCE" 
        title="Loan Calculator" 
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scroll} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Featured EMI Card */}
          <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
            <Text style={styles.featuredTitle}>Monthly Installment</Text>
            <View style={styles.emiWrap}>
              <Text style={styles.emiSymbol}>$</Text>
              <Text style={styles.emiValue} numberOfLines={1} adjustsFontSizeToFit>{stats.emi}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats.principalPercent}%`, backgroundColor: '#fff' }]} />
            </View>
            <View style={styles.percentRow}>
              <Text style={styles.percentText}>{Math.round(stats.principalPercent)}% Principal</Text>
              <Text style={styles.percentText}>{Math.round(100 - stats.principalPercent)}% Interest</Text>
            </View>
          </LinearGradient>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.inputRow}>
              <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>LOAN AMOUNT</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <MaterialCommunityIcons name="bank" size={16} color={theme.colors.accent} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  value={principal}
                  onChangeText={setPrincipal}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>INTEREST (%)</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.text }]}
                    value={rate}
                    onChangeText={setRate}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <View style={{ flex: 1.2 }}>
                <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>TENURE ({isYears ? 'Y' : 'M'})</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.text }]}
                    value={tenure}
                    onChangeText={setTenure}
                    keyboardType="number-pad"
                  />
                  <Pressable 
                    onPress={() => { selectionFeedback(); setIsYears(!isYears); }}
                    style={[styles.unitBadge, { backgroundColor: theme.colors.accent }]}
                  >
                    <Text style={styles.unitText}>{isYears ? 'YRS' : 'MOS'}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, marginTop: 24 }]}>LOAN BREAKDOWN</Text>
          <View style={styles.grid}>
            <StatCard 
              label="Loan Principal" 
              value={`$${stats.rawP}`} 
              emoji="🏛️" 
              icon="cash" 
              theme={theme} 
            />
            <StatCard 
              label="Total Interest" 
              value={`$${stats.totalInterest}`} 
              emoji="📈" 
              icon="percent" 
              theme={theme} 
            />
            <StatCard 
              label="Total Repayment" 
              value={`$${stats.totalPayment}`} 
              emoji="💰" 
              icon="credit-card-outline" 
              theme={theme} 
            />
            <StatCard 
              label="Amortization" 
              value={`${isYears ? parseFloat(tenure) * 12 : tenure} Pmts`} 
              emoji="🗓️" 
              icon="calendar-clock" 
              theme={theme} 
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  featuredCard: { borderRadius: 24, padding: 16, marginBottom: 20, minHeight: 125, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },
  featuredTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8, textAlign: 'center' },
  emiWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 12 },
  emiSymbol: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '700' },
  emiValue: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  progressBar: { width: '80%', height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  percentRow: { width: '80%', flexDirection: 'row', justifyContent: 'space-between' },
  percentText: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '800' },

  settingsCard: { borderRadius: 24, padding: 20 },
  settingsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  settingLabel: { fontSize: 11, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  inputRow: { width: '100%' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, gap: 10 },
  textInput: { flex: 1, fontSize: 16, fontWeight: '700', ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
  unitBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  unitText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1.2, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
