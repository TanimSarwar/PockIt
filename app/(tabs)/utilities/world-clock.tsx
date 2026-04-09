import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Pressable, 
  Dimensions 
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
import { Modal, SearchBar } from '../../../components/ui';
import { lightImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 32 - 16) / 3; // 16 is total gap for 3 columns (8*2)

interface City { 
  name: string; 
  timezone: string; 
  offset: number; 
  emoji: string;
}

const CITIES: City[] = [
  { name: 'New York', timezone: 'EST', offset: -5, emoji: '🏙️' },
  { name: 'Los Angeles', timezone: 'PST', offset: -8, emoji: '🌴' },
  { name: 'Chicago', timezone: 'CST', offset: -6, emoji: '🌬️' },
  { name: 'London', timezone: 'GMT', offset: 0, emoji: '🎡' },
  { name: 'Paris', timezone: 'CET', offset: 1, emoji: '🗼' },
  { name: 'Berlin', timezone: 'CET', offset: 1, emoji: '🥨' },
  { name: 'Tokyo', timezone: 'JST', offset: 9, emoji: '🗼' },
  { name: 'Sydney', timezone: 'AEST', offset: 10, emoji: '🇦🇺' },
  { name: 'Dubai', timezone: 'GST', offset: 4, emoji: '🏜️' },
  { name: 'Mumbai', timezone: 'IST', offset: 5.5, emoji: '🪔' },
  { name: 'Singapore', timezone: 'SGT', offset: 8, emoji: '🦁' },
  { name: 'Hong Kong', timezone: 'HKT', offset: 8, emoji: '🥟' },
  { name: 'Seoul', timezone: 'KST', offset: 9, emoji: '🎎' },
  { name: 'Moscow', timezone: 'MSK', offset: 3, emoji: '⛪' },
  { name: 'São Paulo', timezone: 'BRT', offset: -3, emoji: '⚽' },
  { name: 'Cairo', timezone: 'EET', offset: 2, emoji: '🕌' },
  { name: 'Istanbul', timezone: 'TRT', offset: 3, emoji: '🕌' },
  { name: 'Bangkok', timezone: 'ICT', offset: 7, emoji: '🛺' },
  { name: 'Toronto', timezone: 'EST', offset: -5, emoji: '🍁' },
  { name: 'Vancouver', timezone: 'PST', offset: -8, emoji: '🌲' },
  { name: 'Auckland', timezone: 'NZST', offset: 12, emoji: '🥝' },
  { name: 'Delhi', timezone: 'IST', offset: 5.5, emoji: '🍛' },
  { name: 'Shanghai', timezone: 'CST', offset: 8, emoji: '🏮' },
  { name: 'Mexico City', timezone: 'CST', offset: -6, emoji: '🌮' },
  { name: 'Johannesburg', timezone: 'SAST', offset: 2, emoji: '🐘' },
];

function getTimeInCity(offset: number): { HH: string; MM: string; ampm: string; day: string; date: string; h: number; m: number; s: number; isNight: boolean } {
  const utc = new Date();
  const cityTime = new Date(utc.getTime() + (utc.getTimezoneOffset() + offset * 60) * 60000);
  const hours = cityTime.getHours();
  const mins = cityTime.getMinutes();
  const secs = cityTime.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dateNum = cityTime.getDate();
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return {
    HH: h12.toString(),
    MM: mins.toString().padStart(2, '0'),
    ampm: ampm,
    day: days[cityTime.getDay()],
    date: `${getOrdinal(dateNum)} ${months[cityTime.getMonth()]} ${cityTime.getFullYear()}`,
    h: hours, m: mins, s: secs,
    isNight: hours < 6 || hours >= 20,
  };
}

// ─── Analog Clock ────────────────────────────────────────────────────────────

function AnalogClock({ h, m, s }: { h: number; m: number; s: number }) {
  const secDeg = (s / 60) * 360;
  const minDeg = (m / 60) * 360 + (s / 60) * 6;
  const hrDeg = ((h % 12) / 12) * 360 + (m / 60) * 30;

  return (
    <View style={ac.face}>
      <View style={[ac.hand, ac.hourH, { transform: [{ rotate: `${hrDeg}deg` }] }]} />
      <View style={[ac.hand, ac.minH, { transform: [{ rotate: `${minDeg}deg` }] }]} />
      <View style={[ac.hand, ac.secH, { transform: [{ rotate: `${secDeg}deg` }] }]} />
      <View style={ac.dot} />
    </View>
  );
}

const ac = StyleSheet.create({
  face: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  hand: { position: 'absolute', bottom: '50%', left: '50%', borderRadius: 2, transformOrigin: 'bottom' },
  hourH: { width: 3, height: 16, backgroundColor: '#fff', marginLeft: -1.5 },
  minH: { width: 2, height: 22, backgroundColor: 'rgba(255,255,255,0.8)', marginLeft: -1 },
  secH: { width: 1, height: 26, backgroundColor: '#FFD700', marginLeft: -0.5 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
});

// ─── City Card ───────────────────────────────────────────────────────────────

function CityCard({ city, localOffset, theme, onRemove }: { city: City; localOffset: number; theme: any; onRemove: () => void }) {
  const { HH, MM, ampm, day, isNight } = getTimeInCity(city.offset);
  const diff = city.offset - localOffset;
  const diffStr = diff >= 0 ? `+${diff}h` : `${diff}h`;

  const scale = useSharedValue(1);
  const pressIn  = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); };
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable 
      onPressIn={pressIn} 
      onPressOut={pressOut} 
      onLongPress={() => {
        lightImpact();
        onRemove();
      }}
    >
      <Animated.View style={[cc.card, { backgroundColor: theme.colors.surface, alignItems: 'center' }, aStyle]}>
        <View style={[cc.iconWrap, { marginBottom: 4 }]}>
          <Text style={cc.emoji}>{city.emoji}</Text>
        </View>
        
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={[cc.name, { color: theme.colors.text }]} numberOfLines={1}>{city.name}</Text>
          <Text style={[cc.tags, { color: theme.colors.textTertiary }]} numberOfLines={1}>{city.timezone} • {diffStr}</Text>
        </View>
        
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={[cc.timeText, { color: theme.colors.text }]}>{HH}:{MM} {ampm.toLowerCase()}</Text>
          <Text style={[cc.dayText, { color: theme.colors.accent }]}>{day}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const cc = StyleSheet.create({
  card:      { width: CARD_W, borderRadius: 12, padding: 10, borderWidth: 1.5, borderColor: 'transparent', elevation: 2 },
  iconWrap:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  emoji:     { fontSize: 26 },
  name:      { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  tags:      { fontSize: 8, fontWeight: '600', opacity: 0.6, textAlign: 'center' },
  timeText:  { fontSize: 11, fontWeight: '900', fontVariant: ['tabular-nums'], textAlign: 'center' },
  dayText:   { fontSize: 9, fontWeight: '700', marginTop: 1, textAlign: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WorldClockScreen() {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<string[]>([
    'New York', 'London', 'Tokyo', 'Sydney', 
    'Paris', 'Dubai', 'Mumbai', 'Singapore', 
    'Moscow', 'Berlin', 'Seoul', 'Cairo'
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [isAnalog, setIsAnalog] = useState(true);
  const [search, setSearch] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const localOffset = -new Date().getTimezoneOffset() / 60;
  const localTimeData = getTimeInCity(localOffset);
  const filteredCities = CITIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c.name));

  const removeCity = useCallback((name: string) => {
    setSelected((s) => s.filter((n) => n !== name));
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="UTILITIES / TIME"
        title="World Clock"
        rightAction={
          <Pressable onPress={() => { selectionFeedback(); setShowAdd(true); }}>
            <MaterialCommunityIcons name="plus-circle" size={28} color={theme.colors.accent} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => { lightImpact(); setIsAnalog(!isAnalog); }}>
          <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
            <Text style={styles.tapHint}>Tap to toggle view</Text>
            {isAnalog ? (
              <View style={styles.analogRow}>
                <AnalogClock h={localTimeData.h} m={localTimeData.m} s={localTimeData.s} />
                <View style={styles.analogInfo}>
                  <Text style={styles.featuredDay}>{localTimeData.day}</Text>
                  <Text style={styles.featuredDate}>{localTimeData.date}</Text>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.featuredTime}>{localTimeData.HH}:{localTimeData.MM} {localTimeData.ampm}</Text>
                <View style={styles.featuredDigitalInfo}>
                  <Text style={styles.featuredDay}>{localTimeData.day}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', marginHorizontal: 6 }}>•</Text>
                  <Text style={styles.featuredDate}>{localTimeData.date}</Text>
                </View>
              </>
            )}
            <Text style={styles.tapHint}>Tap to toggle view</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.grid}>
          {selected.map((name) => {
            const city = CITIES.find((c) => c.name === name);
            if (!city) return null;
            return (
              <CityCard 
                key={name} 
                city={city} 
                localOffset={localOffset} 
                theme={theme} 
                onRemove={() => removeCity(name)} 
              />
            );
          })}
        </View>

        {selected.length > 0 && (
          <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
            Long press a city to remove it from your list
          </Text>
        )}
      </ScrollView>

      <Modal visible={showAdd} onClose={() => { setShowAdd(false); setSearch(''); }} title="Add City">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search cities..." />
        <ScrollView style={{ maxHeight: 400, marginTop: 12 }} showsVerticalScrollIndicator={false}>
          {filteredCities.map((city) => (
            <Pressable
              key={city.name}
              style={[styles.addRow, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                lightImpact();
                setSelected((s) => [...s, city.name]);
                setShowAdd(false);
                setSearch('');
              }}
            >
              <View style={styles.addRowIcon}>
                <Text style={{ fontSize: 20 }}>{city.emoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{city.name}</Text>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>{city.timezone}</Text>
              </View>
              <MaterialCommunityIcons name="plus" size={20} color={theme.colors.accent} />
            </Pressable>
          ))}
          {filteredCities.length === 0 && (
            <Text style={{ color: theme.colors.textTertiary, textAlign: 'center', marginTop: 20 }}>No cities found</Text>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  featuredCard: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 18, marginBottom: 12, minHeight: 110, alignItems: 'center', justifyContent: 'center' },
  featuredTime: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  featuredDigitalInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  featuredDay: { color: '#fff', fontSize: 16, fontWeight: '700' },
  featuredDate: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginTop: 1 },
  tapHint: { position: 'absolute', top: 8, color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  analogRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 8 },
  analogInfo: { gap: 0 },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, marginTop: 4 },
  hint: { fontSize: 11, fontWeight: '600', textAlign: 'center', fontStyle: 'italic' },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  addRowIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
});
