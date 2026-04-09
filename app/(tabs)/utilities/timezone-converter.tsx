import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
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
const CARD_W = (SW - 48) / 3.2; // Smaller cards that 'peek' to suggest swiping

interface TimezoneDef {
  id: string;
  label: string;
  city: string;
  emoji: string;
  offset: number;
  bg: string;
  color: string;
}

const TIMEZONES: TimezoneDef[] = [
  { id: 'utc', label: 'UTC', city: 'Universal', emoji: '🌐', offset: 0, bg: '#F1F5F9', color: '#64748B' },
  { id: 'est', label: 'EST', city: 'New York', emoji: '🏙️', offset: -5, bg: '#DDEEFF', color: '#3B82F6' },
  { id: 'pst', label: 'PST', city: 'Los Angeles', emoji: '🌴', offset: -8, bg: '#FEF3C7', color: '#F59E0B' },
  { id: 'gmt', label: 'GMT', city: 'London', emoji: '💂', offset: 0, bg: '#E0F2FE', color: '#0EA5E9' },
  { id: 'cet', label: 'CET', city: 'Paris', emoji: '🗼', offset: 1, bg: '#FDE6F1', color: '#EC4899' },
  { id: 'ist', label: 'IST', city: 'Mumbai', emoji: '🪔', offset: 5.5, bg: '#FEF2F2', color: '#EF4444' },
  { id: 'jst', label: 'JST', city: 'Tokyo', emoji: '🍣', offset: 9, bg: '#F5D0FE', color: '#A855F7' },
  { id: 'aest', label: 'AEST', city: 'Sydney', emoji: '🐨', offset: 10, bg: '#DCFCE7', color: '#22C55E' },
  { id: 'cst_cn', label: 'CST', city: 'Beijing', emoji: '🥟', offset: 8, bg: '#FEF9C3', color: '#EAB308' },
  { id: 'gst', label: 'GST', city: 'Dubai', emoji: '🏜️', offset: 4, bg: '#FFEDD5', color: '#F97316' },
];

function TimezoneCard({ 
  tz, 
  isSelected, 
  onPress, 
  theme 
}: { 
  tz: TimezoneDef; 
  isSelected: boolean; 
  onPress: () => void; 
  theme: any 
}) {
  const scale = useSharedValue(1);
  const pressIn = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); onPress(); };
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[
        tc.card, 
        { backgroundColor: theme.colors.surface }, 
        isSelected && { borderColor: tz.color, borderWidth: 1.5 }, 
        aStyle
      ]}>
        <View style={[tc.iconWrap, { backgroundColor: tz.bg }]}>
          <Text style={tc.emoji}>{tz.emoji}</Text>
        </View>
        <View style={tc.info}>
          <Text style={[tc.name, { color: theme.colors.text }]} numberOfLines={1}>{tz.label}</Text>
          <Text style={[tc.city, { color: theme.colors.textTertiary }]} numberOfLines={1}>{tz.city}</Text>
        </View>
        <View style={[tc.offsetPill, isSelected ? { backgroundColor: tz.color } : { backgroundColor: theme.colors.surfaceTertiary }]}>
          <Text style={[tc.offsetText, { color: isSelected ? '#fff' : theme.colors.textTertiary }]}>
            {tz.offset >= 0 ? '+' : ''}{tz.offset}h
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const tc = StyleSheet.create({
  card: { width: CARD_W, borderRadius: 16, padding: 10, gap: 6, borderWidth: 1, borderColor: 'transparent', elevation: 2 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 18 },
  info: { gap: 1 },
  name: { fontSize: 11, fontWeight: '700' },
  city: { fontSize: 9, fontWeight: '500' },
  offsetPill: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  offsetText: { fontSize: 8, fontWeight: '800' },
});

export default function TimezoneConverterScreen() {
  const { theme } = useTheme();
  const [fromTz, setFromTz] = useState(TIMEZONES[1]); // New York (EST)
  const [toTz, setToTz] = useState(TIMEZONES[6]);   // Tokyo (JST)
  const [hour, setHour] = useState(new Date().getHours());
  const [minute, setMinute] = useState(0);

  const conversion = useMemo(() => {
    const diff = toTz.offset - fromTz.offset;
    let convertedHour = hour + Math.floor(diff);
    let convertedMinute = minute + (diff % 1) * 60;
    
    if (convertedMinute >= 60) { convertedMinute -= 60; convertedHour += 1; }
    else if (convertedMinute < 0) { convertedMinute += 60; convertedHour -= 1; }
    
    let dayShift = '';
    if (convertedHour >= 24) { convertedHour -= 24; dayShift = ' (+1d)'; }
    else if (convertedHour < 0) { convertedHour += 24; dayShift = ' (-1d)'; }

    const formatTime = (h: number, m: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    return {
      toTime: formatTime(convertedHour, convertedMinute),
      dayShift,
      diff: diff.toFixed(1).replace('.0', '')
    };
  }, [fromTz, toTz, hour, minute]);

  const handleTzPress = (tz: TimezoneDef, type: 'from' | 'to') => {
    selectionFeedback();
    if (type === 'from') setFromTz(tz);
    else setToTz(tz);
  };

  const adjustTime = (type: 'h' | 'm', amount: number) => {
    lightImpact();
    if (type === 'h') setHour(prev => (prev + amount + 24) % 24);
    else setMinute(prev => (prev + amount + 60) % 60);
  };

  const resetTime = () => {
    lightImpact();
    setHour(new Date().getHours());
    setMinute(0);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="UTILITIES / CONVERTER"
        title="Timezone Tool"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces={false}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          <Pressable onPress={resetTime} style={styles.resetBtn}>
            <MaterialCommunityIcons name="refresh" size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
          
          <Text style={styles.featuredLabel}>SYNCED TIME</Text>
          <Text style={styles.featuredTitle}>{conversion.toTime}</Text>
          
          <View style={styles.featuredInfo}>
            <View style={styles.featuredBadge}>
              <Text style={[styles.featuredBadgeText, { color: theme.colors.accent }]}>{toTz.city}</Text>
            </View>
            {conversion.dayShift && <Text style={styles.featuredDayShift}>{conversion.dayShift}</Text>}
          </View>
          <Text style={styles.diffText}>{conversion.diff}h from {fromTz.city}</Text>
        </LinearGradient>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
           <View style={styles.timePickerContainer}>
              <View style={styles.pickerCol}>
                <Pressable onPress={() => adjustTime('h', 1)} style={styles.miniBtn}>
                  <MaterialCommunityIcons name="plus" size={16} color={theme.colors.text} />
                </Pressable>
                <Text style={[styles.pickerValue, { color: theme.colors.text }]}>{hour.toString().padStart(2, '0')}</Text>
                <Pressable onPress={() => adjustTime('h', -1)} style={styles.miniBtn}>
                  <MaterialCommunityIcons name="minus" size={16} color={theme.colors.text} />
                </Pressable>
              </View>
              <Text style={[styles.pickerSeparator, { color: theme.colors.textTertiary }]}>:</Text>
              <View style={styles.pickerCol}>
                <Pressable onPress={() => adjustTime('m', 15)} style={styles.miniBtn}>
                  <MaterialCommunityIcons name="plus" size={16} color={theme.colors.text} />
                </Pressable>
                <Text style={[styles.pickerValue, { color: theme.colors.text }]}>{minute.toString().padStart(2, '0')}</Text>
                <Pressable onPress={() => adjustTime('m', -15)} style={styles.miniBtn}>
                  <MaterialCommunityIcons name="minus" size={16} color={theme.colors.text} />
                </Pressable>
              </View>
           </View>
           <Text style={styles.localLabel}>ADJUST LOCAL TIME (H:M)</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>FROM DESTINATION</Text>
          <View style={styles.swipeHint}>
            <Text style={[styles.swipeHintText, { color: theme.colors.textTertiary }]}>SWIPE</Text>
            <MaterialCommunityIcons name="chevron-right" size={12} color={theme.colors.textTertiary} />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizList} contentContainerStyle={{ gap: 8, paddingLeft: 4 }}>
          {TIMEZONES.map(tz => (
            <TimezoneCard key={`from-${tz.id}`} tz={tz} isSelected={fromTz.id === tz.id} onPress={() => handleTzPress(tz, 'from')} theme={theme} />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>TO DESTINATION</Text>
          <View style={styles.swipeHint}>
            <Text style={[styles.swipeHintText, { color: theme.colors.textTertiary }]}>SWIPE</Text>
            <MaterialCommunityIcons name="chevron-right" size={12} color={theme.colors.textTertiary} />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizList} contentContainerStyle={{ gap: 8, paddingLeft: 4 }}>
          {TIMEZONES.map(tz => (
            <TimezoneCard key={`to-${tz.id}`} tz={tz} isSelected={toTz.id === tz.id} onPress={() => handleTzPress(tz, 'to')} theme={theme} />
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  resetBtn: { position: 'absolute', top: 16, right: 16, padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  featuredCard: { borderRadius: 24, padding: 16, marginBottom: 16, height: 135, justifyContent: 'center', alignItems: 'center' },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  featuredTitle: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  featuredInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 },
  featuredBadge: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  featuredBadgeText: { fontSize: 10, fontWeight: '800' },
  featuredDayShift: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700' },
  diffText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  swipeHint: { flexDirection: 'row', alignItems: 'center', gap: 2, opacity: 0.6 },
  swipeHintText: { fontSize: 8, fontWeight: '800' },
  horizList: { marginBottom: 16 },
  settingsCard: { borderRadius: 24, padding: 12, marginBottom: 16, alignItems: 'center' },
  timePickerContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pickerCol: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.03)', padding: 4, borderRadius: 12 },
  miniBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pickerValue: { fontSize: 20, fontWeight: '800', width: 28, textAlign: 'center' },
  pickerSeparator: { fontSize: 20, fontWeight: '300' },
  localLabel: { fontSize: 8, fontWeight: '800', marginTop: 8, color: 'rgba(0,0,0,0.4)', letterSpacing: 1 },
});
