import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform, Dimensions, Animated, Easing } from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path } from 'react-native-svg';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PrayerTimesData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
}

const PRAYER_ICONS: Record<string, any> = {
  Fajr: 'weather-sunset-up',
  Sunrise: 'weather-sunny',
  Dhuhr: 'weather-sunny',
  Asr: 'weather-partly-cloudy',
  Sunset: 'weather-sunset-down',
  Maghrib: 'weather-night',
  Isha: 'moon-waning-crescent',
};

// ─── Countdown Component ───────────────────────────────────────────────────

function Countdown({ nextTime, nextName }: { nextTime: string; nextName: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const [h, m] = nextTime.split(':').map(Number);
      let target = new Date();
      target.setHours(h, m, 0, 0);

      if (target < now) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${mins}m left for ${nextName}`);
    };
    update();
    const interval = setInterval(update, 30000); // 30s for responsiveness
    return () => clearInterval(interval);
  }, [nextTime, nextName]);

  return <Text style={styles.countdownText}>{timeLeft}</Text>;
}

// ─── Sun Progress Component ───────────────────────────────────────────────────

function SunProgress({ sunrise, sunset }: { sunrise: string; sunset: string }) {
  const progress = useMemo(() => {
    if (!sunrise || !sunset) return null;
    
    const timeToMin = (s: string) => {
      const [h, m] = s.split(':').map(Number);
      return h * 60 + m;
    };
    
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const start = timeToMin(sunrise);
    const end = timeToMin(sunset);
    
    if (current < start || current > end) return null;
    
    return (current - start) / (end - start);
  }, [sunrise, sunset]);

  if (progress === null) return null;

  return (
    <View style={styles.sunPathContainer}>
      <Svg height="30" width="100%" viewBox="0 0 100 30" style={styles.svgContainer}>
        <Path
          d="M 0,15 L 100,15"
          vectorEffect="non-scaling-stroke"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
      </Svg>
      
      <View 
        style={[
          styles.sunIconContainer, 
          { 
            left: `${progress * 100}%`,
          }
        ]}
      >
        {/* Shine Effect */}
        <View style={styles.sunShine} />
        <MaterialCommunityIcons name="white-balance-sunny" size={20} color="#FFD700" />
      </View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function PrayerTimesScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [times, setTimes] = useState<PrayerTimesData | null>(null);
  const [city, setCity] = useState<string>('Dhaka, Bangladesh');
  const [coords, setCoords] = useState({ lat: 23.8103, lon: 90.4125 });

  const fetchTimes = useCallback(async (useGPS: boolean = false) => {
    try {
      setLoading(true);
      let latitude = coords.lat;
      let longitude = coords.lon;

      if (useGPS) {
        if (Platform.OS === 'web') {
          const pos: any = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission denied', 'Location permission is required to sync.');
            setLoading(false);
            return;
          }
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
          const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (rev.length > 0) setCity(`${rev[0].city || rev[0].region}, ${rev[0].country}`);
        }
        setCoords({ lat: latitude, lon: longitude });
      }

      const date = new Date().toISOString().split('T')[0];
      const res = await fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=2`);
      const json = await res.json();
      if (json.code === 200) {
        setTimes(json.data.timings);
        if (Platform.OS === 'web' && json.data.meta?.timezone && useGPS) {
          setCity(`${json.data.meta.timezone.split('/')[1]?.replace('_', ' ') || 'Local'} (${json.data.meta.timezone.split('/')[0]})`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [coords]);

  useEffect(() => {
    fetchTimes();
  }, []);

  const getNextPrayer = useMemo(() => {
    if (!times) return null;
    const now = new Date();
    const currStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const sorted = [
      { name: 'Fajr', time: times.Fajr },
      { name: 'Dhuhr', time: times.Dhuhr },
      { name: 'Asr', time: times.Asr },
      { name: 'Maghrib', time: times.Maghrib },
      { name: 'Isha', time: times.Isha },
    ].sort((a, b) => a.time.localeCompare(b.time));
    return sorted.find(p => p.time > currStr) || sorted[0];
  }, [times]);

  const renderItem = (name: string, time: string) => {
    const isNext = getNextPrayer?.name === name;
    return (
      <View key={name} style={[styles.gridItem, { backgroundColor: theme.colors.surface, borderColor: isNext ? theme.colors.accent : 'transparent' }]}>
        <View style={styles.itemContent}>
          <View style={styles.itemLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.background }]}>
              <MaterialCommunityIcons name={PRAYER_ICONS[name]} size={16} color={isNext ? theme.colors.accent : theme.colors.textSecondary} />
            </View>
            <Text style={[styles.gridLabel, { color: theme.colors.textTertiary }]}>{name.toUpperCase()}</Text>
          </View>
          <Text style={[styles.gridTime, { color: theme.colors.text }]}>{time}</Text>
        </View>
        {isNext && <View style={[styles.activeLine, { backgroundColor: theme.colors.accent }]} />}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader category="UTILITIES / DAILY" title="Prayer Times" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.locationText}>{city}</Text>
              <Text style={styles.dateSmall}>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()}</Text>
            </View>
            <Pressable onPress={() => fetchTimes(true)} style={styles.cardSync}>
              <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.timerBox}>
            {times && getNextPrayer && (
              <Countdown nextTime={getNextPrayer.time} nextName={getNextPrayer.name} />
            )}
          </View>

          <View style={styles.cornerRow}>
            <View>
              <Text style={styles.cornerLabel}>SUNRISE</Text>
              <Text style={styles.cornerValue}>{times?.Sunrise || '--:--'}</Text>
            </View>

            <View style={{ flex: 1, marginHorizontal: 6, paddingBottom: 4 }}>
              {times && <SunProgress sunrise={times.Sunrise} sunset={times.Sunset} />}
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cornerLabel}>SUNSET</Text>
              <Text style={styles.cornerValue}>{times?.Sunset || '--:--'}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.grid}>
          {loading ? (
            <ActivityIndicator color={theme.colors.accent} size="large" style={{ marginTop: 40, alignSelf: 'center' }} />
          ) : (
            <>
              {renderItem('Fajr', times?.Fajr || '')}
              {renderItem('Dhuhr', times?.Dhuhr || '')}
              {renderItem('Asr', times?.Asr || '')}
              {renderItem('Maghrib', times?.Maghrib || '')}
              {renderItem('Isha', times?.Isha || '')}
            </>
          )}
        </View>

        <View style={styles.methodCard}>
          <Text style={[styles.methodTitle, { color: theme.colors.textSecondary }]}>METHODOLOGY</Text>
          <Text style={[styles.methodText, { color: theme.colors.textTertiary }]}>
            ISNA Calculation • GPS Precision
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  featuredCard: {
    height: 140,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    marginBottom: 24,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  locationText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  dateSmall: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '900', marginTop: 2 },
  cardSync: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  timerBox: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  countdownText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  cornerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cornerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  cornerValue: { color: '#fff', fontSize: 15, fontWeight: '800' },
  grid: { gap: 10 },
  gridItem: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    elevation: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  itemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  gridTime: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  activeLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
  methodCard: { marginTop: 24, paddingHorizontal: 4 },
  methodTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  methodText: { fontSize: 11 },
  sunPathContainer: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sunIconContainer: {
    position: 'absolute',
    top: 5,
    marginLeft: -10, // Half of icon size (20)
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunShine: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    transform: [{ scale: 1.5 }],
    filter: 'blur(6px)',
    opacity: 0.5,
  },
});
