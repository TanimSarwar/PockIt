import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform, Dimensions, Animated, Easing, Linking } from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Circle as SvgCircle } from 'react-native-svg';
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

interface MosqueData {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance: number; // in meters
  direction: string;
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

// ─── Helpers ───────────────────────────────────────────────────────────────

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const toDeg = (x: number) => (x * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  let bearing = toDeg(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(bearing / 45) % 8];
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

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

// ─── Mini Map Component ───────────────────────────────────────────────────

function MiniMap({ mosques, userLat, userLon }: { mosques: MosqueData[]; userLat: number; userLon: number }) {
  const { theme, isDark } = useTheme();

  if (mosques.length === 0) return null;

  // Real Google Maps Colors
  const MAP_COLORS = isDark ? {
    land: '#242f3e',
    water: '#17263c',
    road: '#38414e',
    park: '#263c3f',
    grid: 'rgba(255,255,255,0.05)',
  } : {
    land: '#f9f9f9',
    water: '#e0eff1',
    road: '#ffffff',
    park: '#e8f5e9',
    grid: 'rgba(0,0,0,0.03)',
  };

  const nearbyForMap = mosques.slice(0, 15);
  const allLats = [userLat, ...nearbyForMap.map(m => m.lat)];
  const allLons = [userLon, ...nearbyForMap.map(m => m.lon)];
  const minLat = Math.min(...allLats);
  const maxLat = Math.max(...allLats);
  const minLon = Math.min(...allLons);
  const maxLon = Math.max(...allLons);

  const padLat = Math.max((maxLat - minLat) * 0.25, 0.002);
  const padLon = Math.max((maxLon - minLon) * 0.25, 0.002);

  const mapMinLat = minLat - padLat;
  const mapMaxLat = maxLat + padLat;
  const mapMinLon = minLon - padLon;
  const mapMaxLon = maxLon + padLon;

  const mapW = SCREEN_WIDTH - 32;
  const mapH = 180;

  const toX = (lon: number) => ((lon - mapMinLon) / (mapMaxLon - mapMinLon)) * mapW;
  const toY = (lat: number) => ((mapMaxLat - lat) / (mapMaxLat - mapMinLat)) * mapH;

  const userX = toX(userLon);
  const userY = toY(userLat);

  const handleOpenGoogleMaps = () => {
    const url = Platform.select({
      android: `geo:${userLat},${userLon}?q=mosque`,
      ios: `maps://maps.apple.com/?q=mosque&sll=${userLat},${userLon}`,
      default: `https://www.google.com/maps/search/mosque/@${userLat},${userLon},14z`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <Pressable onPress={handleOpenGoogleMaps} style={[styles.miniMapContainer, { backgroundColor: MAP_COLORS.land, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
      <Svg width={mapW} height={mapH} style={styles.miniMapSvg}>
        {/* Terrain: Simulated Water/Parks */}
        <SvgCircle cx={mapW * 0.1} cy={mapH * 0.2} r={mapW * 0.15} fill={MAP_COLORS.water} opacity={0.6} />
        <Path d={`M ${mapW * 0.7} ${mapH * 0.8} Q ${mapW * 0.8} ${mapH * 0.6} ${mapW} ${mapH * 0.9} L ${mapW} ${mapH} L ${mapW * 0.6} ${mapH} Z`} fill={MAP_COLORS.park} opacity={0.5} />

        {/* City Grid: Roads */}
        {Array.from({ length: 8 }).map((_, i) => (
          <React.Fragment key={`road-${i}`}>
            <Path d={`M ${(i + 1) * (mapW / 9)} 0 L ${(i + 1) * (mapW / 9)} ${mapH}`} stroke={MAP_COLORS.road} strokeWidth="3" opacity={0.8} />
            <Path d={`M 0 ${(i + 1) * (mapH / 9)} L ${mapW} ${(i + 1) * (mapH / 9)}`} stroke={MAP_COLORS.road} strokeWidth="3" opacity={0.8} />
          </React.Fragment>
        ))}

        {/* Direction Lines (Dashed) */}
        {mosques.slice(0, 3).map((m) => (
          <Path
            key={`line-${m.id}`}
            d={`M ${userX},${userY} L ${toX(m.lon)},${toY(m.lat)}`}
            stroke={theme.colors.accent}
            strokeWidth="1.5"
            strokeDasharray="5,5"
            opacity={0.3}
          />
        ))}

        {/* Mosque Markers (Google Style Pins) */}
        {nearbyForMap.map((m, i) => {
          const mx = toX(m.lon);
          const my = toY(m.lat);
          return (
            <React.Fragment key={`marker-${m.id}`}>
              {/* Pin Shadow */}
              <SvgCircle cx={mx} cy={my} r={4} fill="rgba(0,0,0,0.2)" />
              {/* Pin Body */}
              <Path 
                d={`M ${mx} ${my} L ${mx - 6} ${my - 14} A 7 7 0 1 1 ${mx + 6} ${my - 14} Z`} 
                fill={i === 0 ? theme.colors.accent : (isDark ? '#444' : '#888')} 
              />
              <SvgCircle cx={mx} cy={my - 14} r={3} fill="#FFFFFF" />
            </React.Fragment>
          );
        })}

        {/* User Location Pulse */}
        <SvgCircle cx={userX} cy={userY} r={14} fill={theme.colors.accent} opacity={0.15} />
        <SvgCircle cx={userX} cy={userY} r={8} fill="#FFFFFF" />
        <SvgCircle cx={userX} cy={userY} r={5} fill={theme.colors.accent} />
      </Svg>

      {/* Dynamic Map Labels */}
      {mosques.slice(0, 2).map((m, i) => (
        <View key={`lbl-${m.id}`} style={[styles.mapLabelPill, { left: toX(m.lon) - 30, top: toY(m.lat) - 42, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }]}>
           <Text style={[styles.mapLabelText, { color: theme.colors.text }]} numberOfLines={1}>{m.name}</Text>
        </View>
      ))}

      <View style={[styles.mapOverlayBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}>
        <MaterialCommunityIcons name="google-maps" size={14} color={theme.colors.accent} />
        <Text style={[styles.mapOverlayText, { color: theme.colors.text }]}>Explore Live Map</Text>
      </View>
    </Pressable>
  );
}

// ─── Nearby Mosques Component ─────────────────────────────────────────────

function NearbyMosques({ lat, lon }: { lat: number; lon: number }) {
  const { theme, isDark } = useTheme();
  const [mosques, setMosques] = useState<MosqueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const radius = 4000; // Search radius in meters
  const [expanded, setExpanded] = useState(false);

  const fetchMosques = useCallback(async () => {
    if (!lat || !lon) return;
    
    try {
      setLoading(true);
      setError(null);

      const query = `[out:json][timeout:25];(nwr["amenity"~"mosque|place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});nwr["amenity"="mosque"](around:${radius},${lat},${lon});nwr["building"="mosque"](around:${radius},${lat},${lon}););out center body 60;`;
      
      // Try primary server with fallback mirror
      const servers = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter'
      ];

      let data = null;
      for (const server of servers) {
        try {
          const res = await fetch(server, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
          if (res.ok) {
            data = await res.json();
            break;
          }
        } catch (e) {
          console.warn(`Server ${server} failed, trying next...`);
        }
      }

      if (data && data.elements) {
        const results: MosqueData[] = data.elements
          .map((el: any) => {
            const elLat = el.lat ?? el.center?.lat;
            const elLon = el.lon ?? el.center?.lon;
            if (!elLat || !elLon) return null;

            const dist = haversineDistance(lat, lon, elLat, elLon);
            const dir = getBearing(lat, lon, elLat, elLon);
            let name = el.tags?.name || el.tags?.["name:en"] || el.tags?.["name:bn"] || 'Mosque';
            
            return { id: el.id, name, lat: elLat, lon: elLon, distance: dist, direction: dir };
          })
          .filter(Boolean)
          .sort((a: MosqueData, b: MosqueData) => a.distance - b.distance);

        setMosques(results);
      } else {
        setMosques([]);
      }
    } catch (e) {
      console.error('Mosque fetch error:', e);
      setError('Connection issue. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchMosques();
  }, [lat, lon]);

  const openMosqueInMaps = (mosque: MosqueData) => {
    const url = Platform.select({
      android: `geo:${mosque.lat},${mosque.lon}?q=${mosque.lat},${mosque.lon}(${encodeURIComponent(mosque.name)})`,
      ios: `maps://maps.apple.com/?q=${encodeURIComponent(mosque.name)}&ll=${mosque.lat},${mosque.lon}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lon}&destination_place_id=${encodeURIComponent(mosque.name)}`,
    });
    if (url) Linking.openURL(url);
  };

  const displayMosques = expanded ? mosques : mosques.slice(0, 3);

  return (
    <View style={styles.mosquesSection}>
      <View style={styles.mosquesSectionHeader}>
        <View style={styles.mosquesTitleRow}>
          <View style={[styles.mosquesTitleIcon, { backgroundColor: theme.colors.accentMuted }]}>
            <MaterialCommunityIcons name="mosque" size={16} color={theme.colors.accent} />
          </View>
          <View>
            <Text style={[styles.mosquesSectionTitle, { color: theme.colors.text }]}>Nearby Mosques</Text>
            {mosques.length > 0 && (
              <Text style={[styles.mosquesCount, { color: theme.colors.textTertiary }]}>
                {mosques.length} found within {formatDistance(radius)}
              </Text>
            )}
          </View>
        </View>
        <Pressable onPress={fetchMosques} style={[styles.mosquesRefresh, { backgroundColor: theme.colors.surfaceSecondary }]}>
          <MaterialCommunityIcons name="refresh" size={16} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={[styles.mosquesLoading, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator color={theme.colors.accent} size="small" />
          <Text style={[styles.mosquesLoadingText, { color: theme.colors.textSecondary }]}>Searching nearby mosques...</Text>
        </View>
      ) : error ? (
        <View style={[styles.mosquesError, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={24} color={theme.colors.textTertiary} />
          <Text style={[styles.mosquesErrorText, { color: theme.colors.textSecondary }]}>{error}</Text>
          <Pressable onPress={fetchMosques} style={[styles.retryBtn, { backgroundColor: theme.colors.accentMuted }]}>
            <Text style={[styles.retryText, { color: theme.colors.accent }]}>Retry</Text>
          </Pressable>
        </View>
      ) : mosques.length === 0 ? (
        <View style={[styles.mosquesEmpty, { backgroundColor: theme.colors.surface }]}>
          <MaterialCommunityIcons name="map-marker-off-outline" size={32} color={theme.colors.textTertiary} />
          <Text style={[styles.mosquesEmptyText, { color: theme.colors.textSecondary }]}>No mosques found within {formatDistance(radius)}</Text>
        </View>
      ) : (
        <>
          {/* Mini Map */}
          <MiniMap mosques={mosques} userLat={lat} userLon={lon} />

          {/* Mosque List */}
          {displayMosques.map((mosque, i) => (
            <Pressable
              key={mosque.id}
              onPress={() => openMosqueInMaps(mosque)}
              style={[styles.mosqueCard, { backgroundColor: theme.colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            >
              <View style={styles.mosqueCardLeft}>
                <View style={[styles.mosqueRank, { backgroundColor: i === 0 ? theme.colors.accentMuted : theme.colors.surfaceSecondary }]}>
                  <Text style={[styles.mosqueRankText, { color: i === 0 ? theme.colors.accent : theme.colors.textTertiary }]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={styles.mosqueInfo}>
                  <Text style={[styles.mosqueName, { color: theme.colors.text }]} numberOfLines={1}>
                    {mosque.name}
                  </Text>
                  <View style={styles.mosqueMetaRow}>
                    <MaterialCommunityIcons name="map-marker-distance" size={12} color={theme.colors.textTertiary} />
                    <Text style={[styles.mosqueMeta, { color: theme.colors.textTertiary }]}>
                      {formatDistance(mosque.distance)}
                    </Text>
                    <View style={[styles.mosqueDot, { backgroundColor: theme.colors.textTertiary }]} />
                    <MaterialCommunityIcons name="compass-outline" size={12} color={theme.colors.textTertiary} />
                    <Text style={[styles.mosqueMeta, { color: theme.colors.textTertiary }]}>
                      {mosque.direction}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.mosqueNavBtn, { backgroundColor: theme.colors.accentMuted }]}>
                <MaterialCommunityIcons name="navigation-variant-outline" size={16} color={theme.colors.accent} />
              </View>
            </Pressable>
          ))}

          {mosques.length > 3 && (
            <Pressable onPress={() => setExpanded(!expanded)} style={[styles.showMoreBtn, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[styles.showMoreText, { color: theme.colors.accent }]}>
                {expanded ? 'Show Less' : `Show ${mosques.length - 3} More`}
              </Text>
              <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.accent} />
            </Pressable>
          )}
        </>
      )}
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
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
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
    fetchTimes(true);
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
      <ScreenHeader category="HOME / PRAYER" title="Prayer Times" />

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

        {/* Nearby Mosques Panel */}
        {!loading && coords && (
          <NearbyMosques lat={coords.lat} lon={coords.lon} />
        )}

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
    opacity: 0.5,
  },

  // Mosaic / Mosque Finders
  mosquesSection: {
    marginTop: 24,
  },
  mosquesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  mosquesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mosquesTitleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mosquesSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  mosquesCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  mosquesRefresh: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  mosquesLoading: {
    height: 100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mosquesLoadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  mosquesError: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mosquesErrorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mosquesEmpty: {
    paddingVertical: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mosquesEmptyText: {
    fontSize: 13,
    fontWeight: '500',
  },

  miniMapContainer: {
    borderRadius: 24,
    height: 180,
    width: '100%',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  miniMapSvg: {
    ...StyleSheet.absoluteFillObject,
  },
  mapMosqueLabel: {
    position: 'absolute',
  },
  mapOverlayBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapOverlayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mapLabelPill: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
    maxWidth: 100,
  },
  mapLabelText: {
    fontSize: 9,
    fontWeight: '800',
  },

  mosqueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
  },
  mosqueCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  mosqueRank: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mosqueRankText: {
    fontSize: 11,
    fontWeight: '900',
  },
  mosqueInfo: {
    flex: 1,
  },
  mosqueName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  mosqueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mosqueMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  mosqueDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 2,
    opacity: 0.3,
  },
  mosqueNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 4,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
