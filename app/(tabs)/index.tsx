import React, { useState, useEffect, useCallback } from 'react';
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
import * as Speech from 'expo-speech';

import * as Location from 'expo-location';
import Animated, { 
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  interpolate,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../store/theme';
import { useFavoritesStore } from '../../store/favorites';
import { useAuthStore } from '../../store/auth';
import { features } from '../../constants/features';
import { fetchWeather, fetchQuotesList } from '../../lib/api';
import { lightImpact, mediumImpact } from '../../lib/haptics';
import { PockItInput } from '../../components/ui/Input';
import { analyzeIntent, AssistantAction } from '../../lib/assistant';
import { AssistantCard } from '../../components/AssistantCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 800;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Rise and shine';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Stable Night';
}

const WEATHER_THEMES: Record<number, { icon: string; label: string; colors: string[] }> = {
  0: { icon: 'weather-sunny', label: 'Sunny Day', colors: ['#FF8C00', '#FFA500'] },
  1: { icon: 'weather-partly-cloudy', label: 'Mostly Clear', colors: ['#4FACFE', '#00F2FE'] },
  2: { icon: 'weather-partly-cloudy', label: 'Partly Cloudy', colors: ['#4FACFE', '#00F2FE'] },
  3: { icon: 'weather-cloudy', label: 'Cloudy', colors: ['#8E9EAB', '#2F3F4F'] },
  45: { icon: 'weather-fog', label: 'Foggy', colors: ['#757F9A', '#D7DDE8'] },
  51: { icon: 'weather-rainy', label: 'Drizzle', colors: ['#4B6CB7', '#182848'] },
  61: { icon: 'weather-rainy', label: 'Rainy', colors: ['#4B6CB7', '#182848'] },
  71: { icon: 'weather-snowy', label: 'Snowy', colors: ['#E6E9F0', '#EEF1F5'] },
  95: { icon: 'weather-lightning', label: 'Stormy', colors: ['#0F2027', '#203A43', '#2C5364'] },
};

function getWeatherTheme(code: number) {
  return WEATHER_THEMES[code] ?? { icon: 'weather-partly-cloudy', label: 'PockIt', colors: ['#6366F1', '#A855F7'] };
}

// ─── Components ──────────────────────────────────────────────────────────────

const QuickOrb = ({ icon, label, route, color }: any) => {
  const router = useRouter();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    lightImpact();
    scale.value = withSequence(withTiming(1.2, { duration: 100 }), withSpring(1));
    router.push(route as any);
  };

  return (
    <Pressable onPress={handlePress} style={styles.orbItem}>
      <Animated.View style={[styles.orbIcon, { backgroundColor: color + '15' }, animatedStyle]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </Animated.View>
      <Text style={styles.orbLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { user, isLoggedIn } = useAuthStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { recentFeatures, pinnedFeatures, togglePin, addRecent } = useFavoritesStore();

  const [search, setSearch] = useState('');
  const [assistantAction, setAssistantAction] = useState<AssistantAction | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [locationName, setLocationName] = useState('Detecting...');
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const loadData = async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      let lat = 40.7128, lon = -74.0060;

      if (status === 'granted') {
        const pos = await Location.getLastKnownPositionAsync({});
        if (pos) { lat = pos.coords.latitude; lon = pos.coords.longitude; }
      }
      
      const w = await fetchWeather(lat, lon);
      setWeather(w);
      
      const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (geo && geo[0]) setLocationName(geo[0].city || geo[0].region || 'Local');
    } catch (e) {
      setLocationName('New York');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [curatedQuotes, setCuratedQuotes] = useState([
    { q: "Thinking is the capital, Enterprise is the way, Hard Work is the solution.", a: "Abdul Kalam" },
    { q: "Believe you can and you're halfway there.", a: "Theodore Roosevelt" }
  ]);

  useEffect(() => {
    loadData();
    fetchQuotesList().then(q => { if(q) setCuratedQuotes(q.map(x => ({q: x.content, a: x.author}))) });
  }, []);

  const handleSpeak = useCallback((text: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(text, { onDone: () => setIsSpeaking(false), onError: () => setIsSpeaking(false) });
    }
  }, [isSpeaking]);

  const weatherTheme = getWeatherTheme(weather?.weatherCode ?? 0);
  const quickTools = [
    { id: 'weather', name: 'Weather', icon: 'weather-cloudy', route: '/(tabs)/tools/weather', color: '#0EA5E9' },
    { id: 'qr', name: 'Scanner', icon: 'qrcode-scan', route: '/(tabs)/tools/barcode-scanner', color: '#F43F5E' },
    { id: 'calc', name: 'Calculator', icon: 'calculator', route: '/(tabs)/finance/calculator', color: '#8B5CF6' },
    { id: 'notes', name: 'Notes', icon: 'notebook-edit-outline', route: '/(tabs)/utilities/notes', color: '#10B981' },
    { id: 'todo', name: 'Tasks', icon: 'list-check', route: '/(tabs)/utilities/todo-list', color: '#F59E0B' },
  ];

  const categories = [
    { id: 'finance', title: 'Finance', desc: 'Secure & fast', icon: 'wallet-outline', accent: '#6366F1' },
    { id: 'wellness', title: 'Wellness', desc: 'Health tracker', icon: 'heart-pulse', accent: '#EC4899' },
    { id: 'tools', title: 'Smart Tools', desc: 'Everyday utility', icon: 'toolbox-outline', accent: '#06B6D4' },
    { id: 'utilities', title: 'Assistant', desc: 'Full utility', icon: 'sparkles-outline', accent: '#F59E0B' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={theme.colors.accent} />}
      >
        {/* ─── Hero Section ─── */}
        <LinearGradient
          colors={weatherTheme.colors as any}
          style={[styles.hero, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.heroContent}>
            <Animated.View entering={FadeInDown.delay(200)}>
              <Text style={styles.heroGreeting}>{getGreeting()},</Text>
              <Text style={styles.heroName}>{user?.name?.split(' ')[0] || 'Explorer'}</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400)} style={styles.heroWeather}>
              <View style={styles.weatherGlass}>
                <MaterialCommunityIcons name={weatherTheme.icon as any} size={32} color="#FFF" />
                <Text style={styles.heroTemp}>{Math.round(weather?.temperature || 0)}°</Text>
                <Text style={styles.weatherLabel}>{weatherTheme.label}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Floating Action Search */}
          <View style={styles.searchContainer}>
            <PockItInput
              placeholder="What can I help you find?"
              value={search}
              onChangeText={setSearch}
              icon={<MaterialCommunityIcons name="magnify" size={22} color={theme.colors.accent} />}
              containerStyle={styles.searchInner}
            />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ─── Quick Orbs ─── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orbScroll}>
            {quickTools.map((tool, i) => (
              <Animated.View key={tool.id} entering={FadeInRight.delay(i * 100)}>
                <QuickOrb {...tool} />
              </Animated.View>
            ))}
          </ScrollView>

          {/* ─── Insight Card ─── */}
          <Animated.View entering={FadeInDown.delay(500)} style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
             <View style={styles.insightHeader}>
                <View style={styles.insightTitleRow}>
                   <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#F59E0B" />
                   <Text style={[styles.insightTitle, { color: theme.colors.textTertiary }]}>DAILY INSIGHT</Text>
                </View>
                <Pressable onPress={() => handleSpeak(curatedQuotes[quoteIndex].q)} style={styles.speakBtn}>
                   <MaterialCommunityIcons name={isSpeaking ? "stop-circle" : "volume-high"} size={20} color={theme.colors.accent} />
                </Pressable>
             </View>
             <Text style={[styles.insightText, { color: theme.colors.text }]}>"{curatedQuotes[quoteIndex].q}"</Text>
             <Text style={[styles.insightAuthor, { color: theme.colors.textSecondary }]}>— {curatedQuotes[quoteIndex].a}</Text>
          </Animated.View>

          {/* ─── Category Grid ─── */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Categories</Text>
          <View style={styles.grid}>
            {categories.map((cat, i) => (
              <Animated.View key={cat.id} entering={FadeInDown.delay(600 + (i * 100))} style={styles.gridItem}>
                <Pressable 
                  style={[styles.catCard, { backgroundColor: theme.colors.surface }]}
                  onPress={() => router.push(`/(tabs)/${cat.id}` as any)}
                >
                  <View style={[styles.catIconBox, { backgroundColor: cat.accent + '15' }]}>
                    <MaterialCommunityIcons name={cat.icon as any} size={28} color={cat.accent} />
                  </View>
                  <Text style={[styles.catTitle, { color: theme.colors.text }]}>{cat.title}</Text>
                  <Text style={[styles.catDesc, { color: theme.colors.textSecondary }]}>{cat.desc}</Text>
                  
                  <View style={styles.catGo}>
                    <MaterialCommunityIcons name="arrow-right" size={16} color={theme.colors.textTertiary} />
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* ─── Recent Pick ─── */}
          <View style={[styles.promoCard, { backgroundColor: theme.colors.accent }]}>
             <View style={styles.promoTextCol}>
                <Text style={styles.promoTitle}>Unlock Focus</Text>
                <Text style={styles.promoSub}>Join a 25-minute Pomodoro session now.</Text>
                <Pressable style={styles.promoBtn} onPress={() => router.push('/(tabs)/utilities/pomodoro')}>
                   <Text style={[styles.promoBtnText, { color: theme.colors.accent }]}>Let's go</Text>
                </Pressable>
             </View>
             <MaterialCommunityIcons name="timer-sand" size={80} color="rgba(255,255,255,0.2)" style={styles.promoIcon} />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  heroGreeting: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 },
  heroName: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  heroWeather: { alignItems: 'flex-end' },
  weatherGlass: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    minWidth: 80,
  },
  heroTemp: { fontSize: 24, fontWeight: '900', color: '#FFF', marginTop: 4 },
  weatherLabel: { fontSize: 10, fontWeight: '800', color: '#FFF', opacity: 0.8, textTransform: 'uppercase' },
  searchContainer: {
    position: 'absolute',
    bottom: -28,
    left: 24,
    right: 24,
    zIndex: 10,
  },
  searchInner: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    paddingHorizontal: 16,
  },
  body: { paddingHorizontal: 24, paddingTop: 40 },
  orbScroll: { paddingVertical: 20, gap: 20 },
  orbItem: { alignItems: 'center', width: 70 },
  orbIcon: { width: 56, height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  orbLabel: { fontSize: 11, fontWeight: '700', color: '#666' },
  insightCard: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  insightTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insightTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  speakBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F3F4', alignItems: 'center', justifyContent: 'center' },
  insightText: { fontSize: 17, fontWeight: '700', fontStyle: 'italic', lineHeight: 26 },
  insightAuthor: { fontSize: 13, fontWeight: '600', marginTop: 8, opacity: 0.8 },
  sectionTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20, letterSpacing: -0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  gridItem: { width: (SCREEN_WIDTH - 64) / 2 },
  catCard: {
    padding: 20,
    borderRadius: 30,
    minHeight: 160,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  catIconBox: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  catTitle: { fontSize: 18, fontWeight: '800' },
  catDesc: { fontSize: 11, fontWeight: '500', opacity: 0.6, marginTop: 4 },
  catGo: { position: 'absolute', right: 20, bottom: 20 },
  promoCard: {
    padding: 24,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 40,
  },
  promoTextCol: { flex: 1, zIndex: 1 },
  promoTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  promoSub: { fontSize: 13, color: '#FFF', opacity: 0.8, marginTop: 4, marginBottom: 16 },
  promoBtn: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, alignSelf: 'flex-start' },
  promoBtnText: { fontWeight: '800', fontSize: 14 },
  promoIcon: { position: 'absolute', right: -10, bottom: -10 },
});
