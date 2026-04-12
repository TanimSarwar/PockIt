import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, mediumImpact } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const METRIC_CARD_W = (SW - 44) / 2;

// ─── Weather Meta & Colors ──────────────────────────────────────────────────

const WEATHER_META: Record<number, { label: string; icon: string; colors: string[]; iconCol: string }> = {
  0: { label: 'Clear Sky', icon: 'weather-sunny', colors: ['#4FACFE', '#00F2FE'], iconCol: '#FBBF24' },
  1: { label: 'Mainly Clear', icon: 'weather-partly-cloudy', colors: ['#4FACFE', '#00F2FE'], iconCol: '#FBBF24' },
  2: { label: 'Partly Cloudy', icon: 'weather-partly-cloudy', colors: ['#4FACFE', '#00F2FE'], iconCol: '#FBBF24' },
  3: { label: 'Overcast', icon: 'weather-cloudy', colors: ['#9BA3AF', '#4B5563'], iconCol: '#94A3B8' },
  45: { label: 'Foggy', icon: 'weather-fog', colors: ['#9BA3AF', '#4B5563'], iconCol: '#94A3B8' },
  48: { label: 'Depositing Rime Fog', icon: 'weather-fog', colors: ['#9BA3AF', '#4B5563'], iconCol: '#94A3B8' },
  51: { label: 'Light Drizzle', icon: 'weather-rainy', colors: ['#667EEA', '#764BA2'], iconCol: '#60A5FA' },
  53: { label: 'Moderate Drizzle', icon: 'weather-rainy', colors: ['#667EEA', '#764BA2'], iconCol: '#60A5FA' },
  55: { label: 'Dense Drizzle', icon: 'weather-rainy', colors: ['#667EEA', '#764BA2'], iconCol: '#60A5FA' },
  61: { label: 'Slight Rain', icon: 'weather-rainy', colors: ['#667EEA', '#764BA2'], iconCol: '#60A5FA' },
  63: { label: 'Moderate Rain', icon: 'weather-pouring', colors: ['#667EEA', '#764BA2'], iconCol: '#3B82F6' },
  65: { label: 'Heavy Rain', icon: 'weather-pouring', colors: ['#667EEA', '#764BA2'], iconCol: '#3B82F6' },
  80: { label: 'Slight Rain Showers', icon: 'weather-pouring', colors: ['#667EEA', '#764BA2'], iconCol: '#3B82F6' },
  95: { label: 'Thunderstorm', icon: 'weather-lightning', colors: ['#1F2937', '#111827'], iconCol: '#FACC15' },
};

function getWeatherMeta(code: number) {
  return WEATHER_META[code] || { label: 'Cloudy', icon: 'weather-cloudy', colors: ['#4FACFE', '#00F2FE'], iconCol: '#FBBF24' };
}

// ─── Shared Components ───────────────────────────────────────────────────────

function DetailCard({ label, value, icon, subValue, children, theme, iconCol }: { label: string; value: string; icon: string; subValue?: string; children?: React.ReactNode; theme: any, iconCol: string }) {
  return (
    <View style={[styles.detailCard, { backgroundColor: theme.colors.surface }]}>
       <View style={styles.detailHeader}>
          <View style={[styles.iconBox, { backgroundColor: iconCol + '15' }]}>
             <MaterialCommunityIcons name={icon as any} size={16} color={iconCol} />
          </View>
          <Text style={[styles.detailLabel, { color: theme.colors.textTertiary }]}>{label.toUpperCase()}</Text>
       </View>
       <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
          {subValue && <Text style={[styles.detailSubValue, { color: theme.colors.textSecondary }]}>{subValue}</Text>}
          {children}
       </View>
    </View>
  );
}

// ─── Sub-Components (Gauges, Charts) ──────────────────────────────────────────

function HourlyChart({ data, theme }: { data: any[]; theme: any }) {
  if (!data || data.length === 0) return null;
  const temps = data.map(d => d.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;
  const width = SW * 2; 
  const height = 40;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.temp - min) / range) * height + 10;
    return { x, y };
  });

  const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <View style={{ height: 120, marginTop: 10 }}>
       <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width, paddingHorizontal: 20 }}>
             <Svg width={width} height={height + 40}>
                <Path d={d} fill="none" stroke={theme.colors.accent} strokeWidth="2.5" />
                {points.map((p, i) => (
                   <Circle key={i} cx={p.x} cy={p.y} r="3" fill={theme.colors.background} stroke={theme.colors.accent} strokeWidth="2" />
                ))}
             </Svg>
             <View style={{ flexDirection: 'row', width, position: 'absolute', top: 0 }}>
                {data.map((d, i) => (
                   <View key={i} style={{ width: width / data.length, alignItems: 'center' }}>
                      <Text style={[styles.hourlyTimeText, { color: theme.colors.textTertiary }]}>{d.time}</Text>
                      <MaterialCommunityIcons name={d.icon} size={20} color={d.iconCol} style={{ marginVertical: 4 }} />
                      <Text style={[styles.hourlyTempText, { color: theme.colors.text }]}>{Math.round(d.temp)}°</Text>
                   </View>
                ))}
             </View>
          </View>
       </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WeatherScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationName, setLocationName] = useState('Detecting...');
  const [weather, setWeather] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search Button Animation
  const searchScale = useSharedValue(1);
  const searchRotate = useSharedValue(0);
  useEffect(() => {
    searchRotate.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 1500 }),
        withTiming(-15, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);
  const searchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }, { rotate: `${searchRotate.value}deg` }]
  }));

  const loadWeather = useCallback(async (lat: number, lon: number, name?: string) => {
    setLoading(true);
    try {
      if (name) {
        setLocationName(name);
      } else {
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (geo && geo[0]) {
          setLocationName(geo[0].city || geo[0].region || 'Current Location');
        }
      }

      // 1. Fetch Forecast
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,pressure_msl,dew_point_2m,visibility&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=8&past_days=1`);
      const data = await res.json();
      
      // 2. Fetch Air Quality (Multi-standard request to ensure coverage for Dhaka)
      // Using hourly as fallback if current is not calculated for some stations
      const aqRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,european_aqi,pm2_5,pm10,pollen_terrestrial_tree,pollen_terrestrial_grass,pollen_terrestrial_ragweed&hourly=us_aqi,european_aqi,pm2_5&timezone=auto`);
      const aqData = await aqRes.json();

      // Extract AQI with robust fallbacks
      const currentAQI = aqData.current?.us_aqi || aqData.hourly?.us_aqi?.[0] || aqData.current?.european_aqi || aqData.hourly?.european_aqi?.[0];
      
      setWeather({ 
        ...data, 
        air_quality_val: currentAQI,
        air_quality: aqData.current || { us_aqi: currentAQI }
      });
    } catch (err) {
      console.error('Weather load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const initLocation = useCallback(async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      loadWeather(40.7128, -74.0060, 'New York');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    loadWeather(pos.coords.latitude, pos.coords.longitude);
  }, [loadWeather]);

  useEffect(() => { initLocation(); }, []);

  const selectCity = (city: any) => {
    mediumImpact();
    setSearch('');
    setSearchResults([]);
    setIsSearching(false);
    loadWeather(city.latitude, city.longitude, city.name);
  };

  const meta = useMemo(() => getWeatherMeta(weather?.current?.weather_code ?? 0), [weather]);

  if (loading && !refreshing && !weather) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const current = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;

  const hourlyChartData = hourly?.time?.slice(1, 15).map((t: string, i: number) => {
    const hMeta = getWeatherMeta(hourly.weather_code[i]);
    return {
      time: new Date(t).getHours() + ' ' + (new Date(t).getHours() >= 12 ? 'PM' : 'AM'),
      temp: hourly.temperature_2m[i],
      icon: hMeta.icon,
      iconCol: hMeta.iconCol,
      rain: hourly.precipitation_probability[i],
    };
  }) || [];

  const aqiValue = weather?.air_quality_val || 0;
  const getAQIStatus = (v: number) => {
    if (v <= 50) return 'Good';
    if (v <= 100) return 'Moderate';
    if (v <= 150) return 'Unhealthy (SG)';
    if (v <= 200) return 'Unhealthy';
    if (v <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader category="HOME / WEATHER" title="Weather" />

      {isSearching && (
        <View style={[styles.searchOverlay, { backgroundColor: theme.colors.background }]}>
          <View style={styles.searchHeader}>
            <TextInput
              autoFocus
              style={[styles.searchInput, { color: theme.colors.text, backgroundColor: theme.colors.surfaceSecondary }]}
              placeholder="Search city..."
              placeholderTextColor={theme.colors.textTertiary}
              value={search}
              onChangeText={async (t) => {
                setSearch(t);
                if (t.length > 2) {
                   const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${t}&count=5&language=en&format=json`);
                   const data = await res.json();
                   setSearchResults(data.results || []);
                }
              }}
            />
            <Pressable onPress={() => setIsSearching(false)} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
          <ScrollView>
            {searchResults.map((city, idx) => (
              <Pressable key={idx} style={styles.searchResult} onPress={() => selectCity(city)}>
                <MaterialCommunityIcons name="map-marker" size={18} color="#FF5252" />
                <View>
                  <Text style={[styles.cityName, { color: theme.colors.text }]}>{city.name}</Text>
                  <Text style={[styles.cityRegion, { color: theme.colors.textSecondary }]}>{city.admin1}, {city.country}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); initLocation(); }} />}
      >
        <LinearGradient colors={theme.palette.gradient as any} style={[styles.featuredCard, { height: 180 }]}>
           <Image 
             source={{ uri: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&q=80&w=800' }} 
             style={styles.heroBg} 
           />
           <View style={[styles.heroOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
           
           <View style={styles.heroNav}>
              <View style={styles.locationTag}>
                 <MaterialCommunityIcons name="map-marker" size={12} color="#fff" />
                 <Text style={styles.locationTagText}>{locationName.toUpperCase()}</Text>
              </View>
              <Pressable 
                onPressIn={() => { searchScale.value = withTiming(1.2); }}
                onPressOut={() => { searchScale.value = withTiming(1); setIsSearching(true); lightImpact(); }}
              >
                <Animated.View style={[styles.searchPulse, searchStyle]}>
                   <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
                </Animated.View>
              </Pressable>
           </View>

           <Text style={styles.featuredTitle}>{Math.round(current?.temperature_2m ?? 0)}° {meta.label}</Text>
           
           <View style={styles.featuredPlay}>
             <MaterialCommunityIcons name={meta.icon as any} size={18} color={meta.iconCol} />
             <Text style={[styles.featuredPlayText, { color: theme.colors.text }]}>Feels like {Math.round(current?.apparent_temperature ?? 0)}°</Text>
           </View>
        </LinearGradient>

        <View style={styles.metricsGrid}>
           <DetailCard label="AQI" value={aqiValue ? aqiValue.toString() : '--'} subValue={getAQIStatus(aqiValue)} icon="molecule" iconCol="#10B981" theme={theme}>
              <View style={styles.miniBarTrack}>
                 <View style={[styles.miniBarFill, { width: `${Math.min(100, (aqiValue / 300) * 100)}%`, backgroundColor: aqiValue > 150 ? '#F87171' : '#10B981' }]} />
              </View>
           </DetailCard>
           
           <DetailCard label="UV Index" value={Math.round(daily?.uv_index_max[1] || 0).toString()} subValue="Moderate" icon="white-balance-sunny" iconCol="#FACC15" theme={theme}>
              <View style={styles.miniBarTrack}>
                 <View style={[styles.miniBarFill, { width: `${Math.min(100, (daily?.uv_index_max[1] / 12) * 100)}%`, backgroundColor: '#FBBF24' }]} />
              </View>
           </DetailCard>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface, marginBottom: 16 }]}>
           <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="flower" size={16} color="#4ADE80" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitleText, { color: theme.colors.textSecondary }]}>POLLEN LEVELS</Text>
           </View>
           <View style={styles.pollenRow}>
              {[
                { label: 'Tree', val: weather?.air_quality?.pollen_terrestrial_tree, col: '#22C55E' },
                { label: 'Grass', val: weather?.air_quality?.pollen_terrestrial_grass, col: '#84CC16' },
                { label: 'Ragweed', val: weather?.air_quality?.pollen_terrestrial_ragweed, col: '#EAB308' }
              ].map((item, i) => (
                <View key={i} style={styles.pollenItem}>
                  <View style={[styles.pollenIconWrap, { backgroundColor: item.col + '20' }]}>
                    <MaterialCommunityIcons name="leaf" size={18} color={item.col} />
                  </View>
                  <Text style={[styles.pollenLabel, { color: theme.colors.textTertiary }]}>{item.label}</Text>
                  <Text style={[styles.pollenValue, { color: theme.colors.text }]}>{item.val > 20 ? 'High' : (item.val === undefined ? '--' : 'Low')}</Text>
                </View>
              ))}
           </View>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface, marginBottom: 20 }]}>
           <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitleText, { color: theme.colors.textSecondary }]}>48-HOUR FORECAST</Text>
           </View>
           <HourlyChart data={hourlyChartData} theme={theme} />
        </View>

        <View style={styles.metricsGrid}>
           <DetailCard label="Wind" value={`${Math.round(current?.wind_speed_10m)} km/h`} subValue="Light breeze" icon="weather-windy" iconCol="#60A5FA" theme={theme} />
           <DetailCard label="Humidity" value={`${current?.relative_humidity_2m}%`} subValue="Humid" icon="water-percent" iconCol="#3B82F6" theme={theme} />
           <DetailCard label="Pressure" value={`${current?.pressure_msl}`} subValue="Rising" icon="gauge" iconCol="#A855F7" theme={theme} />
           <DetailCard label="Visibility" value={`${(current?.visibility / 1000).toFixed(1)} km`} subValue="Clear" icon="eye-outline" iconCol="#F59E0B" theme={theme} />
        </View>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface, marginBottom: 20 }]}>
           <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar-range" size={16} color="#F472B6" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitleText, { color: theme.colors.textSecondary }]}>WEEKLY FORECAST</Text>
           </View>
           {daily?.time?.slice(1, 8).map((t: string, i: number) => {
              const d = new Date(t);
              const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
              const dMeta = getWeatherMeta(daily.weather_code[i+1]);
              return (
                 <View key={i} style={styles.dailyItemRow}>
                    <Text style={[styles.dailyDayText, { color: theme.colors.text }]}>{dayName}</Text>
                    <View style={[styles.dailyIconBox, { backgroundColor: dMeta.iconCol + '20' }]}>
                       <MaterialCommunityIcons name={dMeta.icon as any} size={20} color={dMeta.iconCol} />
                    </View>
                    <View style={styles.dailyTemps}>
                       <Text style={[styles.dailyTempMax, { color: theme.colors.text }]}>{Math.round(daily.temperature_2m_max[i+1])}°</Text>
                       <Text style={[styles.dailyTempMin, { color: theme.colors.textTertiary }]}>{Math.round(daily.temperature_2m_min[i+1])}°</Text>
                    </View>
                 </View>
              );
           })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  
  featuredCard: { borderRadius: 24, padding: 16, marginBottom: 20, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  heroBg: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  heroNav: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  locationTagText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  searchPulse: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  
  featuredTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 12, textAlign: 'center' },
  featuredPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 8 },
  featuredPlayText: { fontSize: 13, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitleText: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  
  settingsCard: { borderRadius: 24, padding: 20 },
  
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  detailCard: { width: METRIC_CARD_W, borderRadius: 18, padding: 16, gap: 4, elevation: 1 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  iconBox: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  detailValue: { fontSize: 26, fontWeight: '800' },
  detailSubValue: { fontSize: 11, fontWeight: '600', marginTop: 4 },

  miniBarTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.05)', marginTop: 12 },
  miniBarFill: { height: '100%', borderRadius: 3 },
  
  pollenRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pollenItem: { alignItems: 'center', width: '30%' },
  pollenIconWrap: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  pollenLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  pollenValue: { fontSize: 14, fontWeight: '800' },

  hourlyTimeText: { fontSize: 10, fontWeight: '700' },
  hourlyTempText: { fontSize: 15, fontWeight: '900' },

  dailyItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  dailyDayText: { width: 70, fontSize: 15, fontWeight: '700' },
  dailyIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dailyTemps: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  dailyTempMax: { fontSize: 15, fontWeight: '800' },
  dailyTempMin: { fontSize: 15, fontWeight: '600' },

  searchOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, paddingHorizontal: 16, paddingTop: 60 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  searchInput: { flex: 1, height: 52, borderRadius: 16, paddingHorizontal: 20, fontSize: 16, fontWeight: '600' },
  closeBtn: { padding: 8 },
  searchResult: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  cityName: { fontSize: 16, fontWeight: '700' },
  cityRegion: { fontSize: 13, opacity: 0.6 },
});
