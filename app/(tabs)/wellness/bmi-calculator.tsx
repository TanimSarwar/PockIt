import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { PockItInput } from '../../../components/ui/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, selectionFeedback, notificationSuccess } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pockit-bmi-history';

interface BmiEntry {
  id: string;
  date: string;
  bmi: number;
  height: number; // always stored in cm
  weight: number; // always stored in kg
  category: string;
}

interface BmiCategory {
  label: string;
  color: string;
  min: number;
  max: number;
  tips: string[];
}

const BMI_CATEGORIES: BmiCategory[] = [
  {
    label: 'Underweight',
    color: '#3B82F6',
    min: 0,
    max: 18.5,
    tips: [
      'Consider consulting a healthcare provider about healthy weight gain.',
      'Focus on nutrient-dense foods to increase calorie intake.',
      'Strength training can help build healthy muscle mass.',
    ],
  },
  {
    label: 'Normal',
    color: '#10B981',
    min: 18.5,
    max: 25,
    tips: [
      'Maintain your healthy weight with balanced nutrition.',
      'Stay active with at least 150 minutes of exercise per week.',
      'Continue monitoring your weight periodically.',
    ],
  },
  {
    label: 'Overweight',
    color: '#F59E0B',
    min: 25,
    max: 30,
    tips: [
      'Small dietary changes can make a meaningful difference.',
      'Aim for 30 minutes of moderate activity most days.',
      'Consider tracking your food intake to identify patterns.',
    ],
  },
  {
    label: 'Obese',
    color: '#EF4444',
    min: 30,
    max: 100,
    tips: [
      'Consult a healthcare provider for personalized guidance.',
      'Even modest weight loss (5-10%) can improve health markers.',
      'Focus on sustainable lifestyle changes rather than quick fixes.',
    ],
  },
];

function getBmiCategory(bmi: number): BmiCategory {
  return (
    BMI_CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) ||
    BMI_CATEGORIES[BMI_CATEGORIES.length - 1]
  );
}

// ─── History Card ────────────────────────────────────────────────────────────

function HistoryCard({ entry, theme }: { entry: BmiEntry; theme: any }) {
  const cat = getBmiCategory(entry.bmi);
  const formattedDate = new Date(entry.date + 'T00:00:00').toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[sc.card, { backgroundColor: theme.colors.surface }]}>
      <View style={[sc.playBtn, { backgroundColor: cat.color }]}>
        <MaterialCommunityIcons name="heart" size={12} color="#fff" />
      </View>
      <View style={sc.iconWrap}>
        <Text style={sc.emoji}>⚖️</Text>
      </View>
      <View style={sc.info}>
        <Text style={[sc.name, { color: theme.colors.text }]} numberOfLines={1}>
          BMI: {entry.bmi}
        </Text>
        <Text style={[sc.tags, { color: theme.colors.textTertiary }]} numberOfLines={1}>
          {formattedDate} • {cat.label}
        </Text>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  card: { width: CARD_W, borderRadius: 16, padding: 12, gap: 4, borderWidth: 1.5, borderColor: 'transparent', elevation: 2 },
  iconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  info: { gap: 0 },
  name: { fontSize: 13, fontWeight: '700' },
  tags: { fontSize: 10, fontWeight: '500' },
  playBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 8, right: 8, zIndex: 10 },
});

// ─── Component ──────────────────────────────────────────────────────────────

export default function BmiCalculatorScreen() {
  const { theme } = useTheme();

  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('ft');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bmi: number; category: BmiCategory } | null>(null);
  const [history, setHistory] = useState<BmiEntry[]>([]);

  // Load history on mount
  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          setHistory(JSON.parse(val));
        } catch {}
      }
    });
  }, []);

  const calculateBmi = useCallback(() => {
    let heightInCm: number;
    let weightInKg: number;

    if (heightUnit === 'cm') {
      heightInCm = parseFloat(heightCm);
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      heightInCm = (ft * 12 + inches) * 2.54;
    }

    if (weightUnit === 'kg') {
      weightInKg = parseFloat(weight);
    } else {
      weightInKg = parseFloat(weight) * 0.453592;
    }

    setError(null);
    if (!heightInCm || heightInCm < 40 || heightInCm > 300) {
      setError('Please enter a valid height.');
      return;
    }

    if (!weightInKg || weightInKg < 2 || weightInKg > 600) {
      setError('Please enter a valid weight.');
      return;
    }

    const heightM = heightInCm / 100;
    const bmi = parseFloat((weightInKg / (heightM * heightM)).toFixed(1));
    const category = getBmiCategory(bmi);

    setResult({ bmi, category });
    notificationSuccess();

    // Save to history
    const entry: BmiEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      bmi,
      height: heightInCm,
      weight: weightInKg,
      category: category.label,
    };

    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 20);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, [heightUnit, weightUnit, heightCm, heightFt, heightIn, weight]);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  // BMI scale bar position (for visual)
  const scalePosition = useMemo(() => {
    if (!result) return 0;
    // Map BMI 10-40 to 0-100%
    return Math.min(Math.max(((result.bmi - 10) / 30) * 100, 0), 100);
  }, [result]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
        category="WELLNESS / HEALTH" 
        title="BMI Calculator" 
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Featured Card (Results or Info) */}
        {result ? (
          <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
            <Pressable onPress={clearResult} style={styles.featuredStopBtn}>
              <Text style={styles.featuredStopText}>CLEAR</Text>
              <MaterialCommunityIcons name="close-circle" size={16} color="#FF5252" />
            </Pressable>
            <Text style={styles.featuredLabel}>YOUR CALCULATION</Text>
            <Text style={styles.featuredTitle}>{result.bmi} BMI</Text>
            <View style={styles.featuredPlay}>
              <MaterialCommunityIcons name="heart-pulse" size={18} color={theme.colors.accent} />
              <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>{result.category.label}</Text>
            </View>
          </LinearGradient>
        ) : (
          <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
            <Text style={styles.featuredLabel}>HEALTH METRICS</Text>
            <Text style={styles.featuredTitle}>Body Mass Index</Text>
            <View style={styles.featuredPlay}>
               <MaterialCommunityIcons name="calculator" size={18} color={theme.colors.accent} />
               <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>Ready to calculate</Text>
            </View>
          </LinearGradient>
        )}

        {/* Input Section (Settings Card style) */}
        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          {/* Height input */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>HEIGHT</Text>
              <View style={styles.unitRow}>
                {(['cm', 'ft'] as const).map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => {
                      selectionFeedback();
                      setHeightUnit(u);
                    }}
                    style={[
                      styles.unitPill,
                      {
                        backgroundColor:
                          heightUnit === u
                            ? theme.colors.accent
                            : theme.colors.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitPillText,
                        {
                          color:
                            heightUnit === u
                              ? '#FFFFFF'
                              : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {heightUnit === 'cm' ? (
              <PockItInput
                value={heightCm}
                onChangeText={setHeightCm}
                placeholder="0"
                keyboardType="decimal-pad"
                inputStyle={{ fontSize: 14 }}
              />
            ) : (
              <View style={styles.ftInRowCompact}>
                <PockItInput
                  value={heightFt}
                  onChangeText={setHeightFt}
                  placeholder="ft"
                  keyboardType="number-pad"
                  containerStyle={{ flex: 1 }}
                  inputStyle={{ fontSize: 14 }}
                />
                <PockItInput
                  value={heightIn}
                  onChangeText={setHeightIn}
                  placeholder="in"
                  keyboardType="number-pad"
                  containerStyle={{ flex: 1 }}
                  inputStyle={{ fontSize: 14 }}
                />
              </View>
            )}
          </View>

          {/* Weight input */}
          <View style={[styles.fieldGroup, { marginTop: 12 }]}>
            <View style={styles.fieldHeader}>
              <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>WEIGHT</Text>
              <View style={styles.unitRow}>
                {(['kg', 'lbs'] as const).map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => {
                      selectionFeedback();
                      setWeightUnit(u);
                    }}
                    style={[
                      styles.unitPill,
                      {
                        backgroundColor:
                          weightUnit === u
                            ? theme.colors.accent
                            : theme.colors.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitPillText,
                        {
                          color:
                            weightUnit === u
                              ? '#FFFFFF'
                              : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <PockItInput
              value={weight}
              onChangeText={setWeight}
              placeholder="0"
              keyboardType="decimal-pad"
              inputStyle={{ fontSize: 14 }}
            />
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#FF5252" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Calculate button */}
          <Pressable
            onPress={calculateBmi}
            style={[
              styles.calcButton,
              { backgroundColor: theme.colors.accent },
            ]}
          >
            <MaterialCommunityIcons
              name="calculator"
              size={18}
              color="#FFFFFF"
            />
            <Text style={[styles.calcButtonText, { fontFamily: theme.fontFamily.semiBold }]}>
              Calculate BMI
            </Text>
          </Pressable>
        </View>

        {/* BMI Scale & Tips (if results) */}
        {result && (
          <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface, marginTop: 24, paddingBottom: 32 }]}>
            <View style={styles.scaleContainer}>
              <View style={styles.scaleBar}>
                {BMI_CATEGORIES.map((cat) => {
                  const width =
                    cat.label === 'Underweight' ? 28 : 
                    cat.label === 'Normal' ? 22 : 
                    cat.label === 'Overweight' ? 17 : 33;
                  return (
                    <View
                      key={cat.label}
                      style={[styles.scaleSegment, { backgroundColor: cat.color, width: `${width}%` as any }]}
                    />
                  );
                })}
              </View>
              <View style={[styles.scaleIndicator, { left: `${scalePosition}%` as any }]}>
                <View style={[styles.scaleArrow, { backgroundColor: theme.colors.text }]} />
              </View>
              <View style={styles.scaleLabels}>
                <Text style={[styles.scaleLabel, { color: theme.colors.textTertiary }]}>18.5</Text>
                <Text style={[styles.scaleLabel, { color: theme.colors.textTertiary }]}>25</Text>
                <Text style={[styles.scaleLabel, { color: theme.colors.textTertiary }]}>30</Text>
              </View>
            </View>

            <Text style={[styles.settingLabel, { color: theme.colors.text, marginTop: 12 }]}>HEALTH TIPS</Text>
            {result.category.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color={result.category.color} />
                <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* History Grid */}
        {history.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 28 }]}>HISTORY</Text>
            <View style={styles.grid}>
              {history.map((entry) => (
                <HistoryCard key={entry.id} entry={entry} theme={theme} />
              ))}
            </View>
          </>
        )}

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: theme.colors.surfaceTertiary, borderLeftWidth: 4, borderLeftColor: theme.colors.warning }]}>
          <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.warning} />
          <Text style={[styles.disclaimerText, { color: theme.colors.textSecondary }]}>
            BMI is a general indicator and does not account for muscle mass, bone density, or body composition.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  featuredCard: { borderRadius: 24, padding: 12, marginBottom: 20, minHeight: 90, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  featuredStopBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  featuredStopText: { color: '#FF5252', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },
  featuredTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8, textAlign: 'center' },
  featuredPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 6 },
  featuredPlayText: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  settingsCard: { borderRadius: 24, padding: 16 },
  fieldGroup: { marginBottom: 12 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  settingLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  unitRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8, padding: 2 },
  unitPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  unitPillText: { fontSize: 9, fontWeight: '700' },
  ftInRowCompact: { flexDirection: 'row', gap: 8 },
  calcButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  calcButtonText: { color: '#FFFFFF', fontSize: 14 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'center' },
  errorText: { color: '#FF5252', fontSize: 13, fontWeight: '600' },
  scaleContainer: { width: '100%', marginBottom: 20 },
  scaleBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden' },
  scaleSegment: { height: '100%' },
  scaleIndicator: { position: 'absolute', top: -4, marginLeft: -6 },
  scaleArrow: { width: 12, height: 18, borderRadius: 6, borderWidth: 2, borderColor: '#FFFFFF' },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: '20%', marginTop: 6 },
  scaleLabel: { fontSize: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8, alignSelf: 'flex-start' },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1.2 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, marginTop: 12 },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
