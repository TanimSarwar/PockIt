import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, mediumImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Conversion Data ────────────────────────────────────────────────────────

type Category = 'Length' | 'Weight' | 'Temperature' | 'Area' | 'Speed' | 'Volume';

interface UnitDef {
  label: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

const CATEGORIES: Record<Category, Record<string, UnitDef>> = {
  Length: {
    m: { label: 'Meters', toBase: (v) => v, fromBase: (v) => v },
    km: { label: 'Kilometers', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    cm: { label: 'Centimeters', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    mm: { label: 'Millimeters', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    mi: { label: 'Miles', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    yd: { label: 'Yards', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
    ft: { label: 'Feet', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    in: { label: 'Inches', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  },
  Weight: {
    kg: { label: 'Kilograms', toBase: (v) => v, fromBase: (v) => v },
    g: { label: 'Grams', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    mg: { label: 'Milligrams', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    lb: { label: 'Pounds', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    oz: { label: 'Ounces', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    t: { label: 'Metric Tons', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    st: { label: 'Stones', toBase: (v) => v * 6.35029, fromBase: (v) => v / 6.35029 },
  },
  Temperature: {
    C: { label: 'Celsius', toBase: (v) => v, fromBase: (v) => v },
    F: { label: 'Fahrenheit', toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
    K: { label: 'Kelvin', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  },
  Area: {
    sqm: { label: 'Square Meters', toBase: (v) => v, fromBase: (v) => v },
    sqkm: { label: 'Square Km', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    sqft: { label: 'Square Feet', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
    sqmi: { label: 'Square Miles', toBase: (v) => v * 2.59e6, fromBase: (v) => v / 2.59e6 },
    acre: { label: 'Acres', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
    ha: { label: 'Hectares', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
  },
  Speed: {
    mps: { label: 'Meters/sec', toBase: (v) => v, fromBase: (v) => v },
    kmph: { label: 'Km/hour', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    mph: { label: 'Miles/hour', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    knot: { label: 'Knots', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ftps: { label: 'Feet/sec', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  },
  Volume: {
    L: { label: 'Liters', toBase: (v) => v, fromBase: (v) => v },
    mL: { label: 'Milliliters', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    gal: { label: 'Gallons (US)', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
    qt: { label: 'Quarts', toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
    pt: { label: 'Pints', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
    cup: { label: 'Cups', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
    floz: { label: 'Fluid Oz', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    m3: { label: 'Cubic Meters', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  },
};

const CATEGORY_ICONS: Record<Category, string> = {
  Length: 'ruler',
  Weight: 'weight',
  Temperature: 'thermometer',
  Area: 'texture-box',
  Speed: 'speedometer',
  Volume: 'cup-water',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function UnitConverterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [category, setCategory] = useState<Category>('Weight');
  const [fromUnit, setFromUnit] = useState('kg');
  const [toUnit, setToUnit] = useState('lb');
  const [inputValue, setInputValue] = useState('1');

  const units = useMemo(() => CATEGORIES[category], [category]);
  const unitKeys = useMemo(() => Object.keys(units), [units]);

  useEffect(() => {
    const keys = Object.keys(CATEGORIES[category]);
    setFromUnit(keys[0]);
    setToUnit(keys.length > 1 ? keys[1] : keys[0]);
  }, [category]);

  const result = useMemo(() => {
    const num = parseFloat(inputValue);
    if (isNaN(num) || !units[fromUnit] || !units[toUnit]) return '';
    const base = units[fromUnit].toBase(num);
    const converted = units[toUnit].fromBase(base);
    return parseFloat(converted.toFixed(6)).toString();
  }, [inputValue, fromUnit, toUnit, units]);

  const handleSwap = useCallback(() => {
    mediumImpact();
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  }, [fromUnit, toUnit]);

  return (
    <View style={[s.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
        category="TOOLS / CONVERSION" 
        title="Unit Converter" 
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.mainBody}>
          {/* ── Category Select with Indicators ── */}
          <View style={s.catContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={s.catRow}
              onScroll={(e) => {}} // Could add logic for arrows
              scrollEventThrottle={16}
            >
              {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
                const active = cat === category;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => { selectionFeedback(); setCategory(cat); }}
                    style={[s.catPill, { backgroundColor: theme.colors.surfaceTertiary }, active && { backgroundColor: theme.colors.accent }]}
                  >
                    <MaterialCommunityIcons 
                      name={CATEGORY_ICONS[cat] as any} 
                      size={14} 
                      color={active ? '#FFF' : theme.colors.textSecondary} 
                    />
                    <Text style={[s.catTxt, { color: theme.colors.textSecondary }, active && { color: '#FFF' }]}>{cat}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={s.catShadowRight}>
              <LinearGradient 
                colors={['transparent', theme.colors.background]} 
                start={{x:0, y:0}} 
                end={{x:1, y:0}} 
                style={s.fade}
              />
              <MaterialCommunityIcons name="chevron-right" size={12} color={theme.colors.accent} style={s.catArrow} />
            </View>
          </View>

          <ScrollView 
            contentContainerStyle={s.compactScroll} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false} // Force one-screen feel if possible
          >
            {/* ── Input Card (Smaller) ── */}
            <View style={[s.glassCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[s.inputWrap, { backgroundColor: theme.colors.surfaceTertiary }]}>
                <MaterialCommunityIcons name="numeric" size={18} color={theme.colors.accent} />
                <TextInput
                    style={[s.input, { color: theme.colors.text }]}
                    value={inputValue}
                    onChangeText={setInputValue}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textTertiary}
                    underlineColorAndroid="transparent"
                />
              </View>
            </View>

            {/* ── Conversion Grid (Tightened) ── */}
            <View style={s.convGrid}>
              {/* From */}
              <View style={[s.unitCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[s.unitLabel, { color: theme.colors.textTertiary }]}>FROM: {units[fromUnit]?.label?.toUpperCase()}</Text>
                <View style={s.chipBox}>
                  {unitKeys.map(uk => {
                    const active = uk === fromUnit;
                    return (
                      <Pressable 
                          key={uk} 
                          onPress={() => { lightImpact(); setFromUnit(uk); }}
                          style={[s.chip, { backgroundColor: theme.colors.surfaceTertiary }, active && { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent, borderWidth: 1 }]}
                      >
                        <Text style={[s.chipTxt, { color: theme.colors.textSecondary }, active && { color: theme.colors.accent }]}>{uk}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Swap Button (Smaller) */}
              <Pressable style={[s.swapBtn, { backgroundColor: theme.colors.accent, width: 44, height: 44 }]} onPress={handleSwap}>
                  <MaterialCommunityIcons name="swap-vertical" size={20} color="#FFF" />
              </Pressable>

              {/* To */}
              <View style={[s.unitCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[s.unitLabel, { color: theme.colors.textTertiary }]}>TO: {units[toUnit]?.label?.toUpperCase()}</Text>
                <View style={s.chipBox}>
                  {unitKeys.map(uk => {
                    const active = uk === toUnit;
                    return (
                      <Pressable 
                          key={uk} 
                          onPress={() => { lightImpact(); setToUnit(uk); }}
                          style={[s.chip, { backgroundColor: theme.colors.surfaceTertiary }, active && { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent, borderWidth: 1 }]}
                      >
                        <Text style={[s.chipTxt, { color: theme.colors.textSecondary }, active && { color: theme.colors.accent }]}>{uk}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* ── Result Card (Streamlined) ── */}
            <View style={[s.resultCard, { backgroundColor: theme.colors.surface }]}>
              <View style={s.resRow}>
                <Text style={[s.resVal, { color: theme.colors.text }]} numberOfLines={1}>{result || '---'}</Text>
                <View style={[s.unitBadge, { backgroundColor: theme.colors.accent }]}>
                  <Text style={s.badgeTxt}>{toUnit}</Text>
                </View>
              </View>
              <Text style={[s.fullDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {inputValue} {fromUnit} = <Text style={{ fontWeight: '800', color: theme.colors.accent }}>{result}</Text> {toUnit}
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  mainBody:  { flex: 1, paddingHorizontal: 20 },
  pageHead:  { paddingHorizontal: 20, paddingTop: 10, marginBottom: 8 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },

  catContainer: { position: 'relative', marginBottom: 16, height: 44, justifyContent: 'center' },
  catRow: { overflow: 'visible' },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8 },
  catTxt: { fontSize: 12, fontWeight: '700' },
  
  catShadowRight: { position: 'absolute', right: -10, top: 0, bottom: 0, width: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  fade: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  catArrow: { marginRight: 4, zIndex: 5 },

  compactScroll: { gap: 10 },
  glassCard: { borderRadius: 20, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  input: { flex: 1, marginLeft: 10, fontSize: 18, fontWeight: '800', borderWidth: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },

  convGrid: { gap: 8 },
  unitCard: { borderRadius: 20, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  unitLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  chipBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, minWidth: 40, alignItems: 'center' },
  chipTxt: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  swapBtn: { borderRadius: 22, alignSelf: 'center', marginVertical: -12, zIndex: 10, alignItems: 'center', justifyContent: 'center', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },

  resultCard: { borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 5 },
  resRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  resVal: { fontSize: 28, fontWeight: '900', flex: 1, marginRight: 8 },
  unitBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTxt: { color: '#FFF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  fullDesc: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
});
