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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Animated, { 
  FadeInDown,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
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



// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { user, isLoggedIn } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recentFeatures } = useFavoritesStore();

  const floatAnim = useSharedValue(0);
  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

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

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [curatedQuotes, setCuratedQuotes] = useState([
    { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
    { q: "Focus on being productive instead of busy.", a: "Tim Ferriss" },
    { q: "Your time is limited, so don't waste it living someone else's life.", a: "Steve Jobs" },
    { q: "Simplicity is the ultimate sophistication.", a: "Leonardo da Vinci" },
    { q: "Quality is not an act, it is a habit.", a: "Aristotle" }
  ]);

  const shuffleQuotes = () => {
    mediumImpact();
    setCuratedQuotes([...curatedQuotes].sort(() => Math.random() - 0.5));
    setQuoteIndex(0);
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
    { id: 'finance', title: 'Finance', desc: 'Secure & fast', icon: 'chart-line', badge: 'MANAGE', img: 'cat_finance.png' },
    { id: 'wellness', title: 'Wellness', desc: 'Active living', icon: 'heart-pulse', badge: 'IMPROVE', img: 'cat_wellness.png' },
    { id: 'tools', title: 'Tools', desc: 'Daily utility', icon: 'toolbox-outline', badge: 'UTILITY', img: 'cat_tools.png' },
    { id: 'utilities', title: 'More', desc: 'Explore all', icon: 'apps', badge: 'EXPLORE', img: 'cat_utilities.png' },
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
          {/* Centered Welcome */}
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
              {getGreeting()}
            </Text>
            {isLoggedIn && user?.name && (
              <Text style={[styles.welcomeName, { color: theme.colors.text }]}>
                {user.name.split(' ')[0]}
              </Text>
            )}
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
                      <MaterialCommunityIcons name="map-marker-radius-outline" size={10} color="rgba(255,255,255,0.6)" />
                    </View>
                    <View style={styles.weatherBodyRow}>
                      <Text style={styles.weatherTemp}>{temp}°</Text>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.weatherCondition}>{weatherMeta.label}</Text>
                        {locationName.includes('New York') && (
                          <Text style={styles.locationHint}>Tap to detect</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <MaterialCommunityIcons name={weatherMeta.icon as any} size={48} color="rgba(255,255,255,0.9)" />
                </LinearGradient>
              </Pressable>

              {/* Quote Carousel */}
              <View style={styles.quoteSection}>
                <View style={[styles.quoteHeader, { justifyContent: 'space-between' }]}>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="auto-fix" size={16} color={theme.colors.accent} />
                      <Text style={[styles.quoteLabel, { color: theme.colors.textTertiary }]}>DAILY INSIGHT</Text>
                   </View>
                   <Pressable onPress={shuffleQuotes} hitSlop={12}>
                      <MaterialCommunityIcons name="cached" size={18} color={theme.colors.accent} />
                   </Pressable>
                </View>
                
                <LinearGradient
                   colors={[theme.colors.accent, theme.colors.accentDark]}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 1 }}
                   style={styles.quoteCard}
                >
                  <View style={styles.quoteControlRow}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color="rgba(255,255,255,0.6)" />
                    <ScrollView 
                       horizontal 
                       pagingEnabled 
                       showsHorizontalScrollIndicator={false}
                       contentContainerStyle={{ paddingHorizontal: 10 }}
                       onScroll={(e) => {
                          const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 120));
                          if (idx !== quoteIndex) setQuoteIndex(idx);
                       }}
                       scrollEventThrottle={16}
                    >
                      {curatedQuotes.map((item, idx) => (
                        <View key={idx} style={styles.quoteItem}>
                          <Text style={styles.quoteText}>"{item.q}"</Text>
                          <Text style={styles.quoteAuthor}>— {item.a}</Text>
                        </View>
                      ))}
                    </ScrollView>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.6)" />
                  </View>
                </LinearGradient>
              </View>

              {/* Animated 2x2 Categories Grid */}
              <View style={styles.catGrid}>
                {categories.map((cat, i) => (
                  <Animated.View 
                    key={cat.id} 
                    entering={FadeInDown.delay(i * 100).duration(800)}
                    style={styles.catWrap}
                  >
                    <Pressable
                      style={[styles.pathaoCard, { backgroundColor: theme.colors.surface }]}
                      onPress={() => {
                        lightImpact();
                        router.push(`/(tabs)/${cat.id}` as any);
                      }}
                    >
                      <View style={styles.pathaoInfo}>
                        <Text style={[styles.pathaoTitle, { color: theme.colors.text }]}>{cat.title}</Text>
                        <Text style={[styles.pathaoDesc, { color: theme.colors.textSecondary }]}>{cat.desc}</Text>
                      </View>
                      
                      <Animated.View style={[styles.pathaoImgWrap, animatedIconStyle]}>
                        <MaterialCommunityIcons 
                          name={cat.icon as any} 
                          size={60} 
                          color={theme.colors.accent} 
                          style={{ opacity: 0.07 }}
                        />
                      </Animated.View>

                      <View style={[styles.pathaoBadge, { backgroundColor: theme.colors.surfaceSecondary }]}>
                         <MaterialCommunityIcons name="check-decagram" size={10} color={theme.colors.accent} />
                         <Text style={[styles.pathaoBadgeText, { color: theme.colors.textSecondary }]}>{cat.badge}</Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>

              {/* Recent */}
              <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 12 }]}>Recent</Text>
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
                    <View style={[styles.recentIconWrap, { backgroundColor: theme.colors.surfaceSecondary }]}>
                      <MaterialCommunityIcons name={item.icon || 'star'} size={20} color={theme.colors.accent} />
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


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  welcomeSection: { marginBottom: 20, paddingTop: 10, alignItems: 'center' },
  welcomeTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  welcomeName: { fontSize: 24, fontWeight: '900', marginTop: -4 },
  
  searchContainer: { marginBottom: 30 },
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
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  weatherLocation: { color: '#FFFFFF', opacity: 0.8, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginRight: 6 },
  weatherHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  weatherBodyRow: { flexDirection: 'row', alignItems: 'center' },
  locationHint: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    opacity: 0.8,
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  weatherTemp: { color: '#FFFFFF', fontSize: 36, fontWeight: '900' },
  weatherCondition: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  
  quoteSection: { marginBottom: 30 },
  quoteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingHorizontal: 4 },
  quoteLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  quoteCard: { 
    borderRadius: 28, 
    padding: 16,
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  quoteControlRow: { flexDirection: 'row', alignItems: 'center' },
  quoteItem: { width: SCREEN_WIDTH - 120, justifyContent: 'center', paddingHorizontal: 10 },
  quoteText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontStyle: 'italic', lineHeight: 22, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.1)', textShadowRadius: 4 },
  quoteAuthor: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '800' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 32 },
  catWrap: { width: (SCREEN_WIDTH - 52) / 2 },
  pathaoCard: {
    height: 110,
    borderRadius: 28,
    padding: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  pathaoInfo: { zIndex: 2 },
  pathaoTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  pathaoDesc: { fontSize: 11, fontWeight: '500', opacity: 0.7, marginTop: 2 },
  pathaoImgWrap: { 
    position: 'absolute', 
    right: 8, 
    bottom: 4, 
    width: 80, 
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  pathaoImg: {
    width: '100%',
    height: '100%',
  },
  pathaoIconFallback: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathaoBadge: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pathaoBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  
  recentScroll: { marginBottom: 32, overflow: 'visible' },
  recentCard: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 24,
    marginRight: 12,
    width: (SCREEN_WIDTH - 52) / 2.5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  recentIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  recentLabel: { fontSize: 12, fontWeight: '700' },
  
  focusCard: { borderRadius: 30, padding: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  focusContent: { flex: 1, paddingRight: 16 },
  focusTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  focusSub: { fontSize: 13, fontWeight: '500', lineHeight: 18, marginBottom: 16 },
  focusBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  focusBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start' },
  focusIconBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  

});
