import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  PanResponder,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Audio, AVPlaybackSource } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;

// ─── Sound Definitions ─────────────────────────────────────────────────────

interface SoundDef {
  id: string;
  label: string;
  tags: string;
  emoji: string;
  iconBg: string;
  color: string;
  source: ReturnType<typeof require> | string | null;
}

const SOUNDS: SoundDef[] = [
  { id: 'rain', label: 'Soft Rain', tags: 'Nature • Rhythmic', emoji: '💧', iconBg: '#DDEEFF', color: '#3B82F6', source: require('../../../assets/sounds/rain.mp3') },
  { id: 'forest', label: 'Deep Forest', tags: 'Nature • Ambient', emoji: '🌲', iconBg: '#DCFCE7', color: '#22C55E', source: require('../../../assets/sounds/forest.mp3') },
  { id: 'ocean', label: 'Ocean Surge', tags: 'Water • Deep', emoji: '🌊', iconBg: '#CFFAFE', color: '#06B6D4', source: require('../../../assets/sounds/oceanwave.mp3') },
  { id: 'wind', label: 'Windy Peaks', tags: 'Nature • Airy', emoji: '💨', iconBg: '#EDE9FE', color: '#8B5CF6', source: null },
  { id: 'fire', label: 'Cozy Fire', tags: 'House • Warmth', emoji: '🔥', iconBg: '#FEF3C7', color: '#F59E0B', source: require('../../../assets/sounds/fireplace.mp3') },
  { id: 'white-noise', label: 'White Noise', tags: 'System • Static', emoji: '⚙️', iconBg: '#F3F4F6', color: '#6B7280', source: require('../../../assets/sounds/whitenoise.mp3') },
  { id: 'zen', label: 'Zen Bowls', tags: 'Wellness • Echo', emoji: '🎵', iconBg: '#F5D0FE', color: '#A855F7', source: null },
  { id: 'meadow', label: 'Meadow', tags: 'Nature • Morning', emoji: '🌻', iconBg: '#FEF9C3', color: '#EAB308', source: require('../../../assets/sounds/birds.mp3') },
];

const TIMER_OPTIONS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1hr', minutes: 60 },
  { label: '2hr', minutes: 120 },
];

// ─── Pulse dot for playing state ──────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withSequence(
      withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
    ), -1, false);
    return () => cancelAnimation(o);
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, s]} />
  );
}

// ─── Sound Card ───────────────────────────────────────────────────────────────

function SoundCard({ snd, isPlaying, onPress, theme }: { snd: SoundDef; isPlaying: boolean; onPress: () => void; theme: any }) {
  const scale = useSharedValue(1);
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      bounce.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      bounce.value = withTiming(0);
    }
  }, [isPlaying]);

  const pressIn = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); onPress(); };

  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[sc.card, { backgroundColor: theme.colors.surface }, isPlaying && { borderColor: snd.color, borderWidth: 2 }, aStyle]}>
        <View style={[sc.playBtn, isPlaying ? { backgroundColor: snd.color } : { backgroundColor: theme.colors.surfaceTertiary }]}>
          {isPlaying
            ? <PulseDot color="#fff" />
            : <MaterialCommunityIcons name="play" size={12} color={theme.colors.textTertiary} />
          }
        </View>
        <Animated.View style={[sc.iconWrap, bounceStyle]}>
          <Text style={sc.emoji}>{snd.emoji}</Text>
        </Animated.View>
        <View style={sc.info}>
          <Text style={[sc.name, { color: theme.colors.text }]} numberOfLines={1}>{snd.label}</Text>
          <Text style={[sc.tags, { color: theme.colors.textTertiary }]} numberOfLines={1}>{snd.tags}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}
const sc = StyleSheet.create({
  card: { width: CARD_W, borderRadius: 16, padding: 12, gap: 4, borderWidth: 1.5, borderColor: 'transparent', elevation: 2 },
  iconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  info: { gap: 0 },
  name: { fontSize: 13, fontWeight: '700' },
  tags: { fontSize: 10, fontWeight: '500' },
  playBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 8, right: 8, zIndex: 10 },
});

// ─── Volume Slider ────────────────────────────────────────────────────────────

function VolumeSlider({ volume, onChange, theme }: { volume: number; onChange: (v: number) => void; theme: any }) {
  const sliderWidth = useRef(1);
  const x = useSharedValue(volume);

  // Sync shared value if parent volume changes (e.g. on mount or timer reset)
  useEffect(() => {
    x.value = volume;
  }, [volume]);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e: GestureResponderEvent) => {
      const val = Math.max(0, Math.min(1, e.nativeEvent.locationX / sliderWidth.current));
      x.value = val;
      onChange(val);
    },
    onPanResponderMove: (e: GestureResponderEvent) => {
      const val = Math.max(0, Math.min(1, e.nativeEvent.locationX / sliderWidth.current));
      x.value = val;
      onChange(val);
    },
  })).current;

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(x.value * 100)}%` as any,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${Math.round(x.value * 100)}%` as any,
  }));

  return (
    <View style={vs.row}>
      <MaterialCommunityIcons name="volume-low" size={18} color={theme.colors.textTertiary} />
      <View 
        style={[vs.track, { backgroundColor: theme.colors.surfaceTertiary }]} 
        onLayout={(e: LayoutChangeEvent) => { sliderWidth.current = e.nativeEvent.layout.width; }} 
        {...pan.panHandlers}
      >
        <Animated.View style={[vs.fill, { backgroundColor: theme.colors.accent }, fillStyle]} />
        <Animated.View style={[vs.thumb, { backgroundColor: theme.colors.accent }, thumbStyle]} />
      </View>
      <MaterialCommunityIcons name="volume-high" size={18} color={theme.colors.textTertiary} />
    </View>
  );
}

const vs = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 8, borderRadius: 4, position: 'relative', overflow: 'hidden' }, // Increased height slightly for better grab
  fill: { position: 'absolute', top: 0, left: 0, bottom: 0 },
  thumb: { 
    position: 'absolute', 
    top: '50%', 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    marginLeft: -12, 
    marginTop: -12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SoundsScreen() {
  const { theme } = useTheme();
  const [playing, setPlaying] = useState<Record<string, boolean>>({});
  const [volume, setVolume] = useState(0.85);
  const volumeRef = useRef(0.85);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const soundRefs = useRef<Record<string, Audio.Sound>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    return () => {
      Object.values(soundRefs.current).forEach(s => s.unloadAsync().catch(() => { }));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Optimized volume update: Only update state (for UI) infrequently or on end, 
  // but update audio hardware more frequently without blocking.
  const updateVolume = useCallback((val: number) => {
    volumeRef.current = val;
    
    const now = Date.now();
    if (now - lastUpdateRef.current > 100) { // Limit hardware calls to 10Hz
      lastUpdateRef.current = now;
      setVolume(val); // Update state for UI syncing
      
      Object.entries(playing).forEach(([id, isPlaying]) => {
        if (isPlaying && soundRefs.current[id]) {
          soundRefs.current[id].setVolumeAsync(val).catch(() => { });
        }
      });
    }
  }, [playing]);

  // Ensure volume is applied when a new sound starts playing
  useEffect(() => {
    Object.entries(playing).forEach(([id, isPlaying]) => {
      if (isPlaying && soundRefs.current[id]) {
        soundRefs.current[id].setVolumeAsync(volumeRef.current).catch(() => { });
      }
    });
  }, [playing]);

  const startTimer = useCallback((minutes: number) => {
    selectionFeedback();
    setTimerMinutes(minutes);
    if (timerRef.current) clearInterval(timerRef.current);
    const secs = minutes * 60;
    setTimerRemaining(secs);
    timerRef.current = setInterval(() => {
      setTimerRemaining(p => {
        if (p === null || p <= 1) { if (timerRef.current) clearInterval(timerRef.current!); return 0; }
        return p - 1;
      });
    }, 1000);
  }, []);

  const toggleSound = useCallback(async (snd: SoundDef) => {
    lightImpact();
    const id = snd.id;
    if (playing[id]) {
      if (soundRefs.current[id]) await soundRefs.current[id].pauseAsync().catch(() => { });
      setPlaying(p => ({ ...p, [id]: false }));
      return;
    }
    if (!snd.source) {
      setPlaying(p => ({ ...p, [id]: true }));
      return;
    }
    try {
      if (!soundRefs.current[id]) {
        const src: AVPlaybackSource = typeof snd.source === 'string' ? { uri: snd.source } : (snd.source as AVPlaybackSource);
        const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: true, isLooping: true, volume });
        soundRefs.current[id] = sound;
      } else {
        await soundRefs.current[id].playAsync();
      }
      setPlaying(p => ({ ...p, [id]: true }));
    } catch (err) {
      console.warn(`Failed to play ${id}:`, err);
    }
  }, [playing, volume]);

  const stopAll = useCallback(async () => {
    lightImpact();
    for (const id of Object.keys(playing)) {
      if (soundRefs.current[id]) await soundRefs.current[id].pauseAsync().catch(() => { });
    }
    setPlaying({});
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRemaining(null);
  }, [playing]);

  const activeSoundCount = Object.values(playing).filter(Boolean).length;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="WELLNESS / AUDIO"
        title="Soothing Sounds"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          {activeSoundCount > 0 && (
            <Pressable onPress={stopAll} style={styles.featuredStopBtn}>
              <Text style={styles.featuredStopText}>STOP</Text>
              <MaterialCommunityIcons name="stop-circle" size={16} color="#FF5252" />
            </Pressable>
          )}
          <Text style={styles.featuredLabel}>MIDNIGHT RAIN</Text>
          <Text style={styles.featuredTitle}>Deep Rainfall</Text>
          <Pressable
            onPress={() => {
              toggleSound(SOUNDS[0]);
              toggleSound(SOUNDS[1]);
            }}
            style={styles.featuredPlay}
          >
            <MaterialCommunityIcons name={(playing['rain'] && playing['forest']) ? 'pause' : 'play'} size={18} color={theme.colors.accent} />
            <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>{(playing['rain'] && playing['forest']) ? 'Mixed' : 'Listen Mix'}</Text>
          </Pressable>
        </LinearGradient>

        <View style={styles.grid}>
          {SOUNDS.map(snd => (
            <SoundCard key={snd.id} snd={snd} isPlaying={!!playing[snd.id]} onPress={() => toggleSound(snd)} theme={theme} />
          ))}
        </View>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>Playback Control</Text>
          <VolumeSlider volume={volume} onChange={updateVolume} theme={theme} />

          <View style={{ marginTop: 24 }}>
            <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>SLEEP TIMER {timerRemaining !== null && `(${formatTime(timerRemaining)})`}</Text>
            <View style={styles.timerRow}>
              {TIMER_OPTIONS.map(opt => (
                <Pressable key={opt.minutes} onPress={() => startTimer(opt.minutes)} style={[styles.timerPill, { backgroundColor: timerMinutes === opt.minutes ? theme.colors.accent : theme.colors.surfaceSecondary }]}>
                  <Text style={[styles.timerPillText, { color: timerMinutes === opt.minutes ? '#fff' : theme.colors.textSecondary }]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  featuredCard: { borderRadius: 24, padding: 12, marginBottom: 20, minHeight: 90, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  featuredStopBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  featuredStopText: { color: '#FF5252', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },
  featuredTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8, textAlign: 'center' },
  featuredPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 6 },
  featuredPlayText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  settingsCard: { borderRadius: 24, padding: 20 },
  settingsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  settingLabel: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1 },
  timerRow: { flexDirection: 'row', gap: 8 },
  timerPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  timerPillText: { fontSize: 13, fontWeight: '700' },
});
