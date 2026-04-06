import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { PockItInput } from '../../../components/ui/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../store/theme';
import { lightImpact, selectionFeedback, notificationSuccess } from '../../../lib/haptics';

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

// ─── Component ──────────────────────────────────────────────────────────────

export default function BmiCalculatorScreen() {
  const { theme } = useTheme();

  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
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

    if (!heightInCm || heightInCm < 50 || heightInCm > 300) {
      Alert.alert('Invalid Height', 'Please enter a valid height.');
      return;
    }

    if (!weightInKg || weightInKg < 10 || weightInKg > 500) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.text}
          />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.text,
              fontFamily: theme.fontFamily.semiBold,
            },
          ]}
        >
          BMI Calculator
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Height input */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldHeader}>
            <Text
              style={[
                styles.fieldLabel,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.medium,
                },
              ]}
            >
              Height
            </Text>
            <View style={styles.unitToggle}>
              {(['cm', 'ft'] as const).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => {
                    selectionFeedback();
                    setHeightUnit(u);
                  }}
                  style={[
                    styles.unitBtn,
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
                      styles.unitBtnText,
                      {
                        color:
                          heightUnit === u
                            ? '#FFFFFF'
                            : theme.colors.textSecondary,
                        fontFamily: theme.fontFamily.medium,
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
              placeholder="e.g. 170"
              keyboardType="decimal-pad"
            />
          ) : (
            <View style={styles.ftInRow}>
              <View style={{ flex: 1 }}>
                <PockItInput
                  value={heightFt}
                  onChangeText={setHeightFt}
                  placeholder="ft"
                  keyboardType="number-pad"
                  inputStyle={{ textAlign: 'center' }}
                />
              </View>
              <Text style={[styles.ftInSep, { color: theme.colors.textSecondary }]}>ft</Text>
              <View style={{ flex: 1 }}>
                <PockItInput
                  value={heightIn}
                  onChangeText={setHeightIn}
                  placeholder="in"
                  keyboardType="number-pad"
                  inputStyle={{ textAlign: 'center' }}
                />
              </View>
              <Text style={[styles.ftInSep, { color: theme.colors.textSecondary }]}>in</Text>
            </View>
          )}
        </View>

        {/* Weight input */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldHeader}>
            <Text
              style={[
                styles.fieldLabel,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.medium,
                },
              ]}
            >
              Weight
            </Text>
            <View style={styles.unitToggle}>
              {(['kg', 'lbs'] as const).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => {
                    selectionFeedback();
                    setWeightUnit(u);
                  }}
                  style={[
                    styles.unitBtn,
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
                      styles.unitBtnText,
                      {
                        color:
                          weightUnit === u
                            ? '#FFFFFF'
                            : theme.colors.textSecondary,
                        fontFamily: theme.fontFamily.medium,
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
            placeholder={weightUnit === 'kg' ? 'e.g. 70' : 'e.g. 154'}
            keyboardType="decimal-pad"
          />
        </View>

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
            size={20}
            color="#FFFFFF"
          />
          <Text
            style={[
              styles.calcButtonText,
              { fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Calculate BMI
          </Text>
        </Pressable>

        {/* Result */}
        {result && (
          <View
            style={[
              styles.resultCard,
              {
                backgroundColor: theme.colors.surface,
                ...theme.shadows.card,
              },
            ]}
          >
            <View style={styles.resultHeader}>
              <Text
                style={[
                  styles.resultLabel,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                  },
                ]}
              >
                Your BMI
              </Text>
              <Pressable onPress={clearResult} hitSlop={8}>
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </Pressable>
            </View>

            <Text
              style={[
                styles.resultBmi,
                {
                  color: result.category.color,
                  fontFamily: theme.fontFamily.bold,
                },
              ]}
            >
              {result.bmi}
            </Text>

            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: result.category.color + '20' },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: result.category.color,
                    fontFamily: theme.fontFamily.semiBold,
                  },
                ]}
              >
                {result.category.label}
              </Text>
            </View>

            {/* BMI Scale Visual */}
            <View style={styles.scaleContainer}>
              <View style={styles.scaleBar}>
                {BMI_CATEGORIES.map((cat) => {
                  const width =
                    cat.label === 'Underweight'
                      ? 28
                      : cat.label === 'Normal'
                        ? 22
                        : cat.label === 'Overweight'
                          ? 17
                          : 33;
                  return (
                    <View
                      key={cat.label}
                      style={[
                        styles.scaleSegment,
                        {
                          backgroundColor: cat.color,
                          width: `${width}%` as any,
                        },
                      ]}
                    />
                  );
                })}
              </View>
              {/* Indicator */}
              <View
                style={[
                  styles.scaleIndicator,
                  { left: `${scalePosition}%` as any },
                ]}
              >
                <View style={styles.scaleArrow} />
              </View>
              <View style={styles.scaleLabels}>
                <Text
                  style={[
                    styles.scaleLabel,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.fontFamily.regular,
                    },
                  ]}
                >
                  18.5
                </Text>
                <Text
                  style={[
                    styles.scaleLabel,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.fontFamily.regular,
                    },
                  ]}
                >
                  25
                </Text>
                <Text
                  style={[
                    styles.scaleLabel,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.fontFamily.regular,
                    },
                  ]}
                >
                  30
                </Text>
              </View>
            </View>

            {/* Tips */}
            <Text
              style={[
                styles.tipsTitle,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.semiBold,
                },
              ]}
            >
              Health Tips
            </Text>
            {result.category.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={16}
                  color={result.category.color}
                />
                <Text
                  style={[
                    styles.tipText,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.fontFamily.regular,
                    },
                  ]}
                >
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* History */}
        {history.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.semiBold,
                },
              ]}
            >
              History
            </Text>
            {history.map((entry) => {
              const cat = getBmiCategory(entry.bmi);
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.historyRow,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.historyDot,
                      { backgroundColor: cat.color },
                    ]}
                  />
                  <View style={styles.historyInfo}>
                    <Text
                      style={[
                        styles.historyDate,
                        {
                          color: theme.colors.text,
                          fontFamily: theme.fontFamily.medium,
                        },
                      ]}
                    >
                      {new Date(
                        entry.date + 'T00:00:00',
                      ).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.historyDetail,
                        {
                          color: theme.colors.textSecondary,
                          fontFamily: theme.fontFamily.regular,
                        },
                      ]}
                    >
                      {entry.height.toFixed(0)} cm / {entry.weight.toFixed(1)}{' '}
                      kg
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text
                      style={[
                        styles.historyBmi,
                        {
                          color: cat.color,
                          fontFamily: theme.fontFamily.bold,
                        },
                      ]}
                    >
                      {entry.bmi}
                    </Text>
                    <Text
                      style={[
                        styles.historyCat,
                        {
                          color: cat.color,
                          fontFamily: theme.fontFamily.medium,
                        },
                      ]}
                    >
                      {entry.category}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Disclaimer */}
        <View
          style={[
            styles.disclaimer,
            { backgroundColor: theme.colors.warningBg },
          ]}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={theme.colors.warning}
          />
          <Text
            style={[
              styles.disclaimerText,
              {
                color: theme.colors.warning,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          >
            BMI is a general indicator and does not account for muscle mass,
            bone density, or body composition. Consult a healthcare professional
            for personalized advice.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 15,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  unitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  unitBtnText: {
    fontSize: 13,
  },
  input: {
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  ftInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ftInInput: {
    flex: 1,
    textAlign: 'center',
  },
  ftInSep: {
    fontSize: 14,
  },
  calcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  calcButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  resultCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
  },
  resultBmi: {
    fontSize: 56,
  },
  categoryBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  categoryText: {
    fontSize: 14,
  },
  scaleContainer: {
    width: '100%',
    marginBottom: 20,
  },
  scaleBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  scaleSegment: {
    height: '100%',
  },
  scaleIndicator: {
    position: 'absolute',
    top: -4,
    marginLeft: -6,
  },
  scaleArrow: {
    width: 12,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '20%',
    marginTop: 6,
  },
  scaleLabel: {
    fontSize: 10,
  },
  tipsTitle: {
    fontSize: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    fontSize: 14,
  },
  historyDetail: {
    fontSize: 12,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyBmi: {
    fontSize: 20,
  },
  historyCat: {
    fontSize: 11,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
