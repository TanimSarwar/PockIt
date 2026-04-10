import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { PockItInput } from '../../../components/ui/Input';
import { lightImpact, mediumImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');

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
  const [category, setCategory] = useState<Category>('Weight');
  const [fromUnit, setFromUnit] = useState('kg');
  const [toUnit, setToUnit] = useState('lb');
  const [inputValue, setInputValue] = useState('1');
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const units = useMemo(() => CATEGORIES[category], [category]);
  const unitKeys = useMemo(() => Object.keys(units), [units]);

  useEffect(() => {
    const keys = Object.keys(CATEGORIES[category]);
    // Try to find a sensible default if they change categories
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

  const unitRate = useMemo(() => {
    if (!units[fromUnit] || !units[toUnit]) return '0';
    const base = units[fromUnit].toBase(1);
    const converted = units[toUnit].fromBase(base);
    return parseFloat(converted.toFixed(6)).toString();
  }, [fromUnit, toUnit, units]);

  const handleSwap = useCallback(() => {
    mediumImpact();
    setFromUnit(toUnit);
    setToUnit(fromUnit);

    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [fromUnit, toUnit]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="TOOLS / CONVERSION"
        title="Unit Converter"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
            <Text style={styles.featuredLabel}>{category.toUpperCase()} CONVERSION</Text>
            <Text style={styles.featuredTitle}>
              {fromUnit.toUpperCase()} → {toUnit.toUpperCase()}
            </Text>
            <View style={styles.featuredBadge}>
              <MaterialCommunityIcons name="calculator" size={14} color={theme.colors.accent} />
              <Text style={[styles.featuredBadgeText, { color: theme.colors.accent }]}>
                {inputValue} {fromUnit} = {result} {toUnit}
              </Text>
            </View>
          </LinearGradient>

          <View style={[styles.mainCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceSecondary }]}>

            {/* Category Selector */}
            <View style={styles.catPickerWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catPicker}>
                {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
                  const active = cat === category;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => { selectionFeedback(); setCategory(cat); }}
                      style={[
                        styles.catPill,
                        { backgroundColor: active ? theme.colors.accent : theme.colors.surfaceSecondary }
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={CATEGORY_ICONS[cat] as any}
                        size={14}
                        color={active ? '#fff' : theme.colors.textSecondary}
                      />
                      <Text style={[styles.catPillText, { color: active ? '#fff' : theme.colors.textSecondary }]}>
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* From Section */}
            <View style={styles.section}>
              <View style={styles.cardHeader}>
                <Text style={[styles.label, { color: theme.colors.textTertiary }]}>FROM</Text>
                <View style={[styles.unitBadge, { backgroundColor: theme.colors.accentMuted }]}>
                  <Text style={[styles.unitBadgeText, { color: theme.colors.accent }]}>{fromUnit.toUpperCase()}</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitPicker}>
                {unitKeys.filter(uk => uk !== toUnit).map(uk => {
                  const active = uk === fromUnit;
                  return (
                    <Pressable
                      key={uk}
                      onPress={() => { lightImpact(); setFromUnit(uk); }}
                      style={[styles.unitPill, { backgroundColor: active ? theme.colors.accent : theme.colors.surfaceSecondary }]}
                    >
                      <Text style={[styles.unitPillText, { color: active ? '#fff' : theme.colors.textSecondary }]}>{uk}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <PockItInput
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType="decimal-pad"
                placeholder="Enter value"
                icon={<MaterialCommunityIcons name="numeric" size={20} color={theme.colors.accent} />}
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
                <View style={[styles.unitBadge, { backgroundColor: theme.colors.accentMuted }]}>
                  <Text style={[styles.unitBadgeText, { color: theme.colors.accent }]}>{toUnit.toUpperCase()}</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitPicker}>
                {unitKeys.filter(uk => uk !== fromUnit).map(uk => {
                  const active = uk === toUnit;
                  return (
                    <Pressable
                      key={uk}
                      onPress={() => { lightImpact(); setToUnit(uk); }}
                      style={[styles.unitPill, { backgroundColor: active ? theme.colors.accent : theme.colors.surfaceSecondary }]}
                    >
                      <Text style={[styles.unitPillText, { color: active ? '#fff' : theme.colors.textSecondary }]}>{uk}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>


            </View>
          </View>


        </ScrollView>
      </KeyboardAvoidingView>
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
  unitBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  unitBadgeText: { fontSize: 11, fontWeight: '900' },

  catPickerWrapper: { marginBottom: 20, marginHorizontal: -4 },
  catPicker: { flex: 1 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginRight: 8 },
  catPillText: { fontSize: 13, fontWeight: '700' },

  section: { paddingVertical: 8 },
  unitPicker: { marginBottom: 16 },
  unitPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, minWidth: 44, alignItems: 'center' },
  unitPillText: { fontSize: 12, fontWeight: '700' },

  inputContainer: { marginBottom: 8 },

  buttonBridge: { height: 74, alignItems: 'center', justifyContent: 'center', zIndex: 10, marginVertical: -14 },
  divider: { height: 1, position: 'absolute', top: '50%', left: -22, right: -22, opacity: 0.1 },
  swapBtnAnim: { width: 48, height: 48, zIndex: 11 },
  swapBtnPressable: { flex: 1, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, borderRadius: 24 },
  swapGradient: { flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
