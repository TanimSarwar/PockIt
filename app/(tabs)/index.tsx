import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Animated, { 
  FadeInDown,
} from 'react-native-reanimated';
import { useTheme } from '../../store/theme';
import { useFavoritesStore } from '../../store/favorites';
import { useAuthStore } from '../../store/auth';
import { features } from '../../constants/features';
import { fetchWeather } from '../../lib/api';
import { lightImpact, mediumImpact } from '../../lib/haptics';
import { PockItInput } from '../../components/ui/Input';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

const WEATHER_ICONS: Record<number, { icon: string; label: string }> = {
  0: { icon: 'weather-sunny', label: 'Clear' },
  1: { icon: 'weather-partly-cloudy', label: 'Mainly clear' },
  2: { icon: 'weather-partly-cloudy', label: 'Partly cloudy' },
  3: { icon: 'weather-cloudy', label: 'Overcast' },
  45: { icon: 'weather-fog', label: 'Foggy' },
  51: { icon: 'weather-rainy', label: 'Drizzle' },
  61: { icon: 'weather-rainy', label: 'Rain' },
  71: { icon: 'weather-snowy', label: 'Snow' },
  95: { icon: 'weather-lightning', label: 'Thunderstorm' },
};

function getWeatherMeta(code: number) {
  return WEATHER_ICONS[code] ?? { icon: 'weather-partly-cloudy', label: 'Weather' };
}

// ─── Category Card Component ──────────────────────────────────────────────────

function CategoryCard({ title, subtitle, icon, color, onPress, index, theme }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <Pressable onPress={onPress}>
        <View style={[styles.catCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.catIconWrap, { backgroundColor: color + '20' }]}>
            <MaterialCommunityIcons name={icon} size={22} color={color} />
          </View>
          <Text style={[styles.catTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.catSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user, isLoggedIn } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recentFeatures } = useFavoritesStore();

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [locationName, setLocationName] = useState('Detecting...');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      let lat = 40.7128, lon = -74.0060; // NYC Default

      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          try {
            const webPos: any = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              });
            });
            if (webPos && webPos.coords) {
              lat = webPos.coords.latitude;
              lon = webPos.coords.longitude;
              status = 'granted' as any;
            }
          } catch {}
        }
        
        if (status !== 'granted') {
          const res = await Location.requestForegroundPermissionsAsync();
          status = res.status;
        }
      }

      if (status === 'granted') {
        try {
          let pos = await Location.getLastKnownPositionAsync({});
          if (!pos) {
            pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          }

          if (pos) {
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            try {
              const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
              if (geo && geo[0]) {
                const city = geo[0].city || geo[0].region || geo[0].district || geo[0].name || 'Current Location';
                setLocationName(city);
              } else {
                setLocationName('Local Weather');
              }
            } catch {
              setLocationName('Local Weather');
            }
          }
        } catch (e: any) {
          setLocationName('New York, NY');
        }
      } else {
        setLocationName('New York, NY');
      }
      
      const w = await fetchWeather(lat, lon);
      setWeather(w);
    } catch (e: any) {
      setLocationName('New York, NY');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const temp = weather ? Math.round(weather.temperature) : '--';
  const weatherMeta = getWeatherMeta(weather?.weatherCode ?? 0);

  const categories = [
    { title: 'Finance', subtitle: 'Manage budgets', icon: 'chart-line', color: '#10B981' },
    { title: 'Wellness', subtitle: 'Healthy living', icon: 'heart-pulse', color: '#F43F5E' },
    { title: 'Tools', subtitle: 'Daily utilities', icon: 'toolbox-outline', color: '#3B82F6' },
    { title: 'More', subtitle: 'Explore apps', icon: 'apps', color: '#F97316' },
  ];

  const defaultRecents = [
    { id: 'stocks', name: 'Stock Prices', icon: 'chart-line', route: '/(tabs)/finance/stocks' },
    { id: 'qr-generator', name: 'QR Generator', icon: 'qrcode', route: '/(tabs)/tools/qr-generator' },
    { id: 'bmi-calculator', name: 'BMI Calculator', icon: 'human-male-height', route: '/(tabs)/wellness/bmi-calculator' },
    { id: 'pomodoro', name: 'Pomodoro', icon: 'clock-check-outline', route: '/(tabs)/utilities/pomodoro' },
  ];

  const displayRecents = recentFeatures.length > 0 
    ? recentFeatures.map(id => features.find(f => f.id === id)).filter(Boolean)
    : defaultRecents;

  const filteredTools = search.length > 0
    ? features.filter(f => 
        f.name.toLowerCase().includes(search.toLowerCase()) || 
        f.description.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Greeting */}
          <View style={styles.greetSection}>
            <Text style={[styles.greetText, { color: theme.colors.text }]}>
              {getGreeting()}{isLoggedIn && user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </Text>
            <Text style={[styles.greetSubtext, { color: theme.colors.textSecondary }]}>Ready to curate your day?</Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <PockItInput
              placeholder="Search your tools..."
              value={search}
              onChangeText={setSearch}
              icon={<MaterialCommunityIcons name="magnify" size={22} color={theme.colors.accent} />}
            />
          </View>

          {search.length > 0 ? (
            <View style={styles.resultsPanel}>
              {filteredTools.map((f: any) => (
                <Pressable 
                  key={f.id} 
                  style={[styles.resultItem, { borderBottomColor: theme.colors.borderLight }]}
                  onPress={() => { setSearch(''); router.push(f.route as any); }}
                >
                  <View style={[styles.resultIcon, { backgroundColor: theme.colors.accentMuted }]}>
                    <MaterialCommunityIcons name={f.icon as any} size={20} color={theme.colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultName, { color: theme.colors.text }]}>{f.name}</Text>
                    <Text style={[styles.resultSub, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {f.description}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
                </Pressable>
              ))}
              {filteredTools.length === 0 && (
                <Text style={[styles.noResults, { color: theme.colors.textSecondary }]}>No tools found matching "{search}"</Text>
              )}
            </View>
          ) : (
            <>
              {/* Weather Card */}
              <Pressable onPress={() => { mediumImpact(); loadData(); }}>
                <LinearGradient
                  colors={theme.palette.gradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.weatherCard}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.weatherHeaderRow}>
                      <Text style={styles.weatherLocation}>{locationName.toUpperCase()}</Text>
                      <MaterialCommunityIcons name="map-marker-radius-outline" size={12} color="rgba(255,255,255,0.6)" />
                    </View>
                    <Text style={styles.weatherTemp}>{temp}°</Text>
                    <Text style={styles.weatherCondition}>{weatherMeta.label}</Text>
                    {locationName.includes('New York') && (
                      <Text style={styles.locationHint}>Tap to detect your location</Text>
                    )}
                  </View>
                  <MaterialCommunityIcons name={weatherMeta.icon as any} size={84} color="rgba(255,255,255,0.9)" />
                </LinearGradient>
              </Pressable>

              {/* Categories Grid */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Categories</Text>
                <Pressable>
                  <Text style={[styles.viewAll, { color: theme.colors.accent }]}>View all</Text>
                </Pressable>
              </View>
              <View style={styles.catGrid}>
                {categories.map((cat, i) => (
                  <View key={cat.title} style={styles.catWrap}>
                    <CategoryCard 
                      {...cat} 
                      index={i} 
                      theme={theme}
                      onPress={() => {
                        mediumImpact();
                        if (cat.title === 'Tools') router.push('/(tabs)/tools' as any);
                        if (cat.title === 'Wellness') router.push('/(tabs)/wellness' as any);
                        if (cat.title === 'Finance') router.push('/(tabs)/finance' as any);
                        if (cat.title === 'More') router.push('/(tabs)/utilities' as any);
                      }}
                    />
                  </View>
                ))}
              </View>

              {/* Recent */}
              <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 16 }]}>Recent</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
                {displayRecents.map((item: any, i) => (
                  <Pressable 
                    key={i} 
                    style={[styles.recentCard, { backgroundColor: theme.colors.surface }]}
                    onPress={() => {
                      lightImpact();
                      if (item.route) router.push(item.route as any);
                    }}
                  >
                    <View style={[styles.recentIconWrap, { backgroundColor: theme.colors.accentMuted }]}>
                      <MaterialCommunityIcons name={item.icon || 'star'} size={24} color={theme.colors.accent} />
                    </View>
                    <Text style={[styles.recentLabel, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Focus Session Card */}
              <View style={[styles.focusCard, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <View style={styles.focusContent}>
                  <Text style={[styles.focusTitle, { color: theme.colors.text }]}>Focus Session</Text>
                  <Text style={[styles.focusSub, { color: theme.colors.textSecondary }]}>
                    Boost your productivity with a 25-minute curated focus timer.
                  </Text>
                  <Pressable 
                    style={[styles.focusBtn, { backgroundColor: theme.colors.accent }]} 
                    onPress={() => { lightImpact(); router.push('/(tabs)/utilities/pomodoro' as any); }}
                  >
                    <Text style={styles.focusBtnText}>Start Now</Text>
                  </Pressable>
                </View>
                <View style={[styles.focusIconBox, { backgroundColor: theme.colors.accentMuted }]}>
                  <MaterialCommunityIcons name="timer-outline" size={42} color={theme.colors.accent} />
                </View>
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* FAB */}
      <Pressable 
        style={[styles.fab, { bottom: insets.bottom + 100, backgroundColor: theme.colors.accent }]}
        onPress={() => { mediumImpact(); }}
      >
        <MaterialCommunityIcons name="plus" size={32} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  greetSection: { marginTop: 10, marginBottom: 20 },
  greetText: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  greetSubtext: { fontSize: 16, fontWeight: '500' },
  
  searchContainer: {
    marginBottom: 28,
  },
  resultsPanel: {
    marginBottom: 30,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultName: { fontSize: 15, fontWeight: '700' },
  resultSub: { fontSize: 11, opacity: 0.8 },
  noResults: { textAlign: 'center', marginTop: 20, fontSize: 14 },

  weatherCard: {
    borderRadius: 30,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  weatherLocation: { color: '#FFFFFF', opacity: 0.8, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginRight: 6 },
  weatherHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  locationHint: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.8,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  weatherTemp: { color: '#FFFFFF', fontSize: 56, fontWeight: '900', lineHeight: 64 },
  weatherCondition: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '800' },
  viewAll: { fontSize: 14, fontWeight: '600' },
  
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  catWrap: { width: (SCREEN_WIDTH - 52) / 2 },
  catCard: {
    borderRadius: 24,
    padding: 16,
    height: 140,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  catIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  catTitle: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  catSubtitle: { fontSize: 12, fontWeight: '500' },
  
  recentScroll: { marginBottom: 32, overflow: 'visible' },
  recentCard: {
    width: 120,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 24,
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  recentIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  recentLabel: { fontSize: 12, fontWeight: '700' },
  
  focusCard: { borderRadius: 30, padding: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  focusContent: { flex: 1, paddingRight: 16 },
  focusTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  focusSub: { fontSize: 13, fontWeight: '500', lineHeight: 18, marginBottom: 16 },
  focusBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  focusBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start' },
  focusIconBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
});
