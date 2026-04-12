import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { useAuthStore } from '../../../store/auth';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, selectionFeedback } from '../../../lib/haptics';
import { Input } from '../../../components/ui/Input';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;

// ─── Age Result Helper ──────────────────────────────────────────────────────

interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  totalWeeks: number;
  totalDays: number;
  nextBirthday: {
    months: number;
    days: number;
    remainingDays: number;
  };
}

function calculateAge(birthDate: Date, today: Date = new Date()): AgeResult {
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const diffTime = today.getTime() - birthDate.getTime();
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());

  // Next Birthday
  let nextBday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (nextBday < today) {
    nextBday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffNext = nextBday.getTime() - today.getTime();
  const remainingDays = Math.ceil(diffNext / (1000 * 60 * 60 * 24));
  
  let nextMonths = nextBday.getMonth() - today.getMonth();
  let nextDays = nextBday.getDate() - today.getDate();
  
  if (nextDays < 0) {
    nextMonths--;
    const lastMonth = new Date(nextBday.getFullYear(), nextBday.getMonth(), 0);
    nextDays += lastMonth.getDate();
  }
  if (nextMonths < 0) {
    nextMonths += 12;
  }

  return {
    years,
    months,
    days,
    totalMonths,
    totalWeeks,
    totalDays,
    nextBirthday: {
      months: nextMonths,
      days: nextDays,
      remainingDays
    }
  };
}

// ─── Stat Card (Similar to SoundCard) ────────────────────────────────────────

function StatCard({ label, value, icon, color, theme }: { label: string; value: string | number; icon: string; color: string; theme: any }) {
  const scale = useSharedValue(1);

  const pressIn = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); };

  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[sc.card, { backgroundColor: theme.colors.surface }, aStyle]}>
        <View style={[sc.iconWrap, { backgroundColor: theme.colors.surfaceTertiary }]}>
            <MaterialCommunityIcons name={icon as any} size={20} color={color} />
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
  card: { width: CARD_W, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1.5, borderColor: 'transparent', elevation: 2 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { gap: 2 },
  name: { fontSize: 18, fontWeight: '800' },
  tags: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AgeCalculatorScreen() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  
  const now = new Date();
  const [day, setDay] = useState("1");
  const [month, setMonth] = useState("1");
  const [year, setYear] = useState("2000");

  useEffect(() => {
    if (user?.birthday) {
      const parts = user.birthday.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        setYear(y);
        setMonth(parseInt(m).toString());
        setDay(parseInt(d).toString());
      }
    }
  }, [user]);

  const ageResult = useMemo(() => {
    const d = parseInt(day);
    const m = parseInt(month) - 1;
    const y = parseInt(year);
    
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    
    const birthDate = new Date(y, m, d);
    if (birthDate.toString() === 'Invalid Date') return null;
    if (birthDate > new Date()) return null;
    
    // Strict day check (e.g. Feb 30 becomes March 1 or 2, so the date/month will change)
    if (birthDate.getDate() !== d || birthDate.getMonth() !== m || birthDate.getFullYear() !== y) return null;
    
    return calculateAge(birthDate);
  }, [day, month, year]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="TOOLS / UTILITY"
        title="Age Calculator"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          <View style={styles.featuredLabelRow}>
            <MaterialCommunityIcons name="cake-variant" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.featuredLabel}>CURRENT AGE</Text>
          </View>
          
          {ageResult ? (
            <View style={styles.ageDisplay}>
                <View style={styles.ageItem}>
                    <Text style={styles.ageValue}>{ageResult.years}</Text>
                    <Text style={styles.ageUnit}>YEARS</Text>
                </View>
                <View style={styles.ageDivider} />
                <View style={styles.ageItem}>
                    <Text style={styles.ageValue}>{ageResult.months}</Text>
                    <Text style={styles.ageUnit}>MONTHS</Text>
                </View>
                <View style={styles.ageDivider} />
                <View style={styles.ageItem}>
                    <Text style={styles.ageValue}>{ageResult.days}</Text>
                    <Text style={styles.ageUnit}>DAYS</Text>
                </View>
            </View>
          ) : (
            <Text style={styles.featuredTitle}>Enter valid date</Text>
          )}

          <View style={styles.featuredDecor}>
            <MaterialCommunityIcons name="calendar-clock" size={80} color="rgba(255,255,255,0.1)" />
          </View>
        </LinearGradient>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>Date of Birth</Text>
          
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
                <Input
                    label="Day"
                    value={day}
                    onChangeText={(t) => {
                        if (t.length <= 2) {
                            setDay(t.replace(/[^0-9]/g, ''));
                            if (t.length === 2) selectionFeedback();
                        }
                    }}
                    keyboardType="number-pad"
                    placeholder="DD"
                />
            </View>
            <View style={{ flex: 1 }}>
                <Input
                    label="Month"
                    value={month}
                    onChangeText={(t) => {
                        if (t.length <= 2) {
                            setMonth(t.replace(/[^0-9]/g, ''));
                            if (t.length === 2) selectionFeedback();
                        }
                    }}
                    keyboardType="number-pad"
                    placeholder="MM"
                />
            </View>
            <View style={{ flex: 1.5 }}>
                <Input
                    label="Year"
                    value={year}
                    onChangeText={(t) => {
                        if (t.length <= 4) {
                            setYear(t.replace(/[^0-9]/g, ''));
                            if (t.length === 4) selectionFeedback();
                        }
                    }}
                    keyboardType="number-pad"
                    placeholder="YYYY"
                />
            </View>
          </View>

          <View style={styles.helperTextContainer}>
             <MaterialCommunityIcons name="information-outline" size={14} color={theme.colors.textTertiary} />
             <Text style={[styles.helperText, { color: theme.colors.textTertiary }]}>
                Calculated relative to today, {now.toLocaleDateString()}
             </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {ageResult && (
            <>
              <StatCard 
                label="Next Birthday" 
                value={`${ageResult.nextBirthday.remainingDays} days`} 
                icon="balloon" 
                color="#F43F5E" 
                theme={theme} 
              />
              <StatCard 
                label="Total Months" 
                value={ageResult.totalMonths.toLocaleString()} 
                icon="calendar-month" 
                color="#3B82F6" 
                theme={theme} 
              />
              <StatCard 
                label="Total Weeks" 
                value={ageResult.totalWeeks.toLocaleString()} 
                icon="calendar-week" 
                color="#8B5CF6" 
                theme={theme} 
              />
              <StatCard 
                label="Total Days" 
                value={ageResult.totalDays.toLocaleString()} 
                icon="calendar-range" 
                color="#10B981" 
                theme={theme} 
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  featuredCard: { 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16, 
    minHeight: 112, 
    justifyContent: 'center', 
    alignItems: 'center', 
    position: 'relative', 
    overflow: 'hidden' 
  },
  featuredLabelRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 12 
  },
  featuredLabel: { 
    color: 'rgba(255,255,255,0.9)', 
    fontSize: 10, 
    fontWeight: '800', 
    letterSpacing: 2, 
    textAlign: 'center' 
  },
  featuredTitle: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: '900', 
    letterSpacing: -0.5, 
    textAlign: 'center' 
  },
  ageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  ageItem: {
    alignItems: 'center',
  },
  ageValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
  },
  ageUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ageDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  featuredDecor: {
    position: 'absolute',
    bottom: -20,
    right: -10,
    transform: [{ rotate: '-15deg' }],
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    marginBottom: 20 
  },
  settingsCard: { 
    borderRadius: 16, 
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  settingsTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    opacity: 0.8
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  helperTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    opacity: 0.6,
  },
  helperText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
