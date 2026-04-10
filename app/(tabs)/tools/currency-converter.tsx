import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { PockItInput } from '../../../components/ui/Input';
import { fetchExchangeRates } from '../../../lib/api';
import { lightImpact, mediumImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 
  'KRW', 'MXN', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'NZD', 'ZAR', 'TRY'
];

export default function CurrencyConverterScreen() {
  const { theme } = useTheme();
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [amount, setAmount] = useState('1');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const bounceAnim = useRef(new Animated.Value(1)).current;

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

    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.22, duration: 100, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const numAmount = parseFloat(amount) || 0;
  const rate = rates?.[to] ?? 0;
  const result = (numAmount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="TOOLS / CONVERSION" 
         title="Currency Converter" 
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          <Text style={styles.featuredLabel}>LIVE EXCHANGE RATES</Text>
          <Text style={styles.featuredTitle}>{from} → {to}</Text>
          <View style={styles.featuredBadge}>
            <MaterialCommunityIcons name="trending-up" size={14} color={theme.colors.accent} />
            <Text style={[styles.featuredBadgeText, { color: theme.colors.accent }]}>
              1 {from} = {rate.toFixed(4)} {to}
            </Text>
          </View>
        </LinearGradient>

        <View style={[styles.mainCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceSecondary }]}>
          
          {/* From Section */}
          <View style={styles.section}>
            <View style={styles.cardHeader}>
              <Text style={[styles.label, { color: theme.colors.textTertiary }]}>FROM</Text>
              <View style={[styles.currBadge, { backgroundColor: theme.colors.accentMuted }]}>
                <Text style={[styles.currBadgeText, { color: theme.colors.accent }]}>{from}</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currPicker}>
              {CURRENCIES.map((c) => {
                const active = c === from;
                return (
                  <Pressable
                    key={c}
                    onPress={() => { selectionFeedback(); setFrom(c); }}
                    style={[styles.currPill, { backgroundColor: active ? theme.colors.accent : theme.colors.surfaceSecondary }]}
                  >
                    <Text style={[styles.currPillText, { color: active ? '#fff' : theme.colors.textSecondary }]}>{c}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <PockItInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              icon={<MaterialCommunityIcons name="cash" size={20} color={theme.colors.accent} />}
              containerStyle={styles.inputContainer}
            />
          </View>

          {/* Swap Button Bridge */}
          <View style={styles.buttonBridge}>
            <View style={[styles.divider, { backgroundColor: theme.colors.surfaceSecondary }]} />
            <Animated.View style={[styles.swapBtnAnim, { transform: [{ scale: bounceAnim }] }]}>
              <Pressable onPress={handleSwap} style={({ pressed }) => [styles.swapBtnPressable, { opacity: pressed ? 0.9 : 1 }]}>
                <LinearGradient colors={theme.palette.gradient as any} style={styles.swapGradient}>
                  <MaterialCommunityIcons name="swap-vertical" size={24} color="#fff" />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          {/* To Section */}
          <View style={styles.section}>
            <View style={styles.cardHeader}>
              <Text style={[styles.label, { color: theme.colors.textTertiary }]}>TO</Text>
              <View style={[styles.currBadge, { backgroundColor: theme.colors.accentMuted }]}>
                <Text style={[styles.currBadgeText, { color: theme.colors.accent }]}>{to}</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currPicker}>
              {CURRENCIES.map((c) => {
                const active = c === to;
                return (
                  <Pressable
                    key={c}
                    onPress={() => { selectionFeedback(); setTo(c); }}
                    style={[styles.currPill, { backgroundColor: active ? theme.colors.accent : theme.colors.surfaceSecondary }]}
                  >
                    <Text style={[styles.currPillText, { color: active ? '#fff' : theme.colors.textSecondary }]}>{c}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={[styles.resultArea, { backgroundColor: theme.colors.surfaceSecondary }]}>
              {loading ? (
                <ActivityIndicator color={theme.colors.accent} size="small" />
              ) : (
                <>
                  <Text style={[styles.resultText, { color: theme.colors.text }]}>{result}</Text>
                  <Text style={[styles.resultSub, { color: theme.colors.textTertiary }]}>
                    {to} (Last updated: {lastUpdated})
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
           <MaterialCommunityIcons name="information-outline" size={14} color={theme.colors.textTertiary} />
           <Text style={[styles.infoText, { color: theme.colors.textTertiary }]}>
             Rates are provided for informational purposes only.
           </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  
  featuredCard: { borderRadius: 24, padding: 20, marginBottom: 20, minHeight: 100, justifyContent: 'center', alignItems: 'center' },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  featuredTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 12 },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  featuredBadgeText: { fontSize: 12, fontWeight: '700' },

  mainCard: { borderRadius: 32, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 22, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  currBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  currBadgeText: { fontSize: 11, fontWeight: '900' },

  section: { paddingVertical: 8 },
  currPicker: { marginBottom: 16, marginHorizontal: -4 },
  currPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8, minWidth: 50, alignItems: 'center' },
  currPillText: { fontSize: 12, fontWeight: '700' },

  inputContainer: { marginBottom: 8 },
  
  buttonBridge: { height: 74, alignItems: 'center', justifyContent: 'center', zIndex: 10, marginVertical: -14 },
  divider: { height: 1, position: 'absolute', top: '50%', left: -22, right: -22, opacity: 0.1 },
  swapBtnAnim: { width: 48, height: 48, zIndex: 11 },
  swapBtnPressable: { flex: 1, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, borderRadius: 24 },
  swapGradient: { flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  resultArea: { padding: 16, borderRadius: 20, minHeight: 80, justifyContent: 'center', alignItems: 'center' },
  resultText: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  resultSub: { fontSize: 10, fontWeight: '600', marginTop: 4, opacity: 0.7 },

  infoCard: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 },
  infoText: { fontSize: 11, fontWeight: '600' },
});

