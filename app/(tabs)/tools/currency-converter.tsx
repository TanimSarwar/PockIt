import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { fetchExchangeRates } from '../../../lib/api';
import { lightImpact, mediumImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 
  'KRW', 'MXN', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'NZD', 'ZAR', 'TRY'
];

export default function CurrencyConverterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [amount, setAmount] = useState('1');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const loadRates = useCallback(async (base: string) => {
    setLoading(true);
    try {
      const data = await fetchExchangeRates(base);
      if (data?.rates) {
        setRates(data.rates);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to load rates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates(from);
  }, [from]);

  const handleSwap = () => {
    mediumImpact();
    const oldFrom = from;
    setFrom(to);
    setTo(oldFrom);
  };

  const numAmount = parseFloat(amount) || 0;
  const rate = rates?.[to] ?? 0;
  const result = (numAmount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View style={[s.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="TOOLS / CONVERSION" 
         title="Currency Converter" 
      />
      <View style={s.mainBody}>
        {/* ── Amount Input Card ── */}
        <View style={[s.glassCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[s.label, { color: theme.colors.textTertiary }]}>AMOUNT TO CONVERT</Text>
          <View style={[s.inputWrap, { backgroundColor: theme.colors.surfaceTertiary }]}>
            <MaterialCommunityIcons name="cash" size={20} color={theme.colors.accent} />
            <TextInput
              style={[s.input, { color: theme.colors.text }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.colors.textTertiary}
              underlineColorAndroid="transparent"
            />
            <Text style={[s.amountBase, { color: theme.colors.textSecondary }]}>{from}</Text>
          </View>
        </View>

        <View style={s.selectorArea}>
          {/* ── From Selector ── */}
          <View style={[s.pickerCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[s.pickerLabel, { color: theme.colors.textTertiary }]}>FROM</Text>
            <View style={s.scrollContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
                {CURRENCIES.map((c) => {
                  const active = c === from;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => { selectionFeedback(); setFrom(c); }}
                      style={[s.chip, { backgroundColor: theme.colors.surfaceTertiary }, active && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent, borderWidth: 1 }]}
                    >
                      <Text style={[s.chipTxt, { color: theme.colors.textSecondary }, active && { color: '#FFF' }]}>{c}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <LinearGradient colors={['transparent', theme.colors.surface]} start={{x:0, y:0}} end={{x:1, y:0}} style={s.fade} />
            </View>
          </View>

          {/* ── Swap Button ── */}
          <Pressable style={[s.swapBtn, { backgroundColor: theme.colors.accent }]} onPress={handleSwap}>
            <MaterialCommunityIcons name="swap-vertical" size={22} color="#FFF" />
          </Pressable>

          {/* ── To Selector ── */}
          <View style={[s.pickerCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[s.pickerLabel, { color: theme.colors.textTertiary }]}>TO</Text>
            <View style={s.scrollContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
                {CURRENCIES.map((c) => {
                  const active = c === to;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => { selectionFeedback(); setTo(c); }}
                      style={[s.chip, { backgroundColor: theme.colors.surfaceTertiary }, active && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent, borderWidth: 1 }]}
                    >
                      <Text style={[s.chipTxt, { color: theme.colors.textSecondary }, active && { color: '#FFF' }]}>{c}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <LinearGradient colors={['transparent', theme.colors.surface]} start={{x:0, y:0}} end={{x:1, y:0}} style={s.fade} />
            </View>
          </View>
        </View>

        {/* ── Result Card ── */}
        <View style={[s.resultCard, { backgroundColor: theme.colors.surface }]}>
          {loading ? (
            <View style={s.loaderWrap}>
              <ActivityIndicator color={theme.colors.accent} size="large" />
              <Text style={[s.loadingTxt, { color: theme.colors.textTertiary }]}>Fetching live rates...</Text>
            </View>
          ) : (
            <>
              <Text style={[s.resHelper, { color: theme.colors.textTertiary }]}>{numAmount} {from} equals</Text>
              <View style={s.resRow}>
                <Text style={[s.resVal, { color: theme.colors.text }]} numberOfLines={1}>{result}</Text>
                <View style={[s.resBadge, { backgroundColor: theme.colors.accent }]}>
                  <Text style={s.badgeTxt}>{to}</Text>
                </View>
              </View>
              <View style={s.divider} />
              <View style={s.footer}>
                <Text style={[s.rateTxt, { color: theme.colors.textSecondary }]}>1 {from} = {rate.toFixed(4)} {to}</Text>
                <Text style={[s.updateTxt, { color: theme.colors.textTertiary }]}>Updated: {lastUpdated}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },


  mainBody:    { flex: 1, paddingHorizontal: 20, gap: 10 },

  glassCard:   { borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  label:       { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  input:       { flex: 1, marginLeft: 12, fontSize: 20, fontWeight: '800', borderWidth: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  amountBase:  { fontSize: 13, fontWeight: '800', opacity: 0.6 },

  selectorArea: { gap: 0 },
  pickerCard:  { borderRadius: 20, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  pickerLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  scrollContainer: { position: 'relative' },
  chipScroll:  { overflow: 'visible' },
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginRight: 8, minWidth: 50, alignItems: 'center' },
  chipTxt:     { fontSize: 12, fontWeight: '700' },
  fade:        { position: 'absolute', right: -5, top: 0, bottom: 0, width: 30 },

  swapBtn:     { width: 44, height: 44, borderRadius: 22, alignSelf: 'center', marginVertical: -12, zIndex: 10, alignItems: 'center', justifyContent: 'center', 
                 shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },

  resultCard:  { borderRadius: 28, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  loaderWrap:  { height: 120, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:  { fontSize: 12, fontWeight: '600' },
  resHelper:   { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  resRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  resVal:      { fontSize: 36, fontWeight: '900', flex: 1, marginRight: 10 },
  resBadge:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeTxt:    { color: '#FFF', fontSize: 13, fontWeight: '900' },
  divider:     { height: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 12 },
  footer:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateTxt:     { fontSize: 12, fontWeight: '700' },
  updateTxt:   { fontSize: 10, fontWeight: '600', opacity: 0.5 },
});
