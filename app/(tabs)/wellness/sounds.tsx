import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
import { router } from 'expo-router';
import { Audio, AVPlaybackSource } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { lightImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
// Padding: 20 (left) + 20 (right) = 40. Gap: 12. 
// 2*CARD_W + 12 = SW - 40 => 2*CARD_W = SW - 52.
// To be safe and avoid wrapping:
const CARD_W = (SW - 56) / 2;

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
  { id: 'rain',        label: 'Soft Rain',    tags: 'Nature • Rhythmic',  emoji: '💧', iconBg: '#DDEEFF', color: '#3B82F6', source: require('../../../assets/sounds/rain.mp3') },
  { id: 'forest',      label: 'Deep Forest',  tags: 'Nature • Ambient',   emoji: '🌲', iconBg: '#DCFCE7', color: '#22C55E', source: require('../../../assets/sounds/forest.mp3') },
  { id: 'ocean',       label: 'Ocean Surge',  tags: 'Water • Deep',       emoji: '🌊', iconBg: '#CFFAFE', color: '#06B6D4', source: require('../../../assets/sounds/oceanwave.mp3') },
  { id: 'wind',        label: 'Windy Peaks',  tags: 'Nature • Airy',      emoji: '💨', iconBg: '#EDE9FE', color: '#8B5CF6', source: null },
  { id: 'fire',        label: 'Cozy Fire',    tags: 'House • Warmth',     emoji: '🔥', iconBg: '#FEF3C7', color: '#F59E0B', source: require('../../../assets/sounds/fireplace.mp3') },
  { id: 'white-noise', label: 'White Noise',  tags: 'System • Static',    emoji: '⚙️', iconBg: '#F3F4F6', color: '#6B7280', source: require('../../../assets/sounds/whitenoise.mp3') },
  { id: 'zen',         label: 'Zen Bowls',    tags: 'Wellness • Echo',    emoji: '🎵', iconBg: '#F5D0FE', color: '#A855F7', source: null },
  { id: 'meadow',      label: 'Meadow',       tags: 'Nature • Morning',   emoji: '🌻', iconBg: '#FEF9C3', color: '#EAB308', source: require('../../../assets/sounds/birds.mp3') },
];

const TIMER_OPTIONS = [
  { label: '15m',    minutes: 15  },
  { label: '30m',    minutes: 30  },
  { label: '1hr',    minutes: 60  },
  { label: '2hr',    minutes: 120 },
  { label: 'Custom', minutes: -1  },
];

// ─── Pulse dot for playing state ──────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withSequence(
      withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      withTiming(1,   { duration: 600, easing: Easing.inOut(Easing.ease) }),
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
  const pressIn  = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); onPress(); };
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[sc.card, { backgroundColor: theme.colors.surface }, isPlaying && { borderColor: snd.color, borderWidth: 2 }, aStyle]}>
        <View style={[sc.iconWrap, { backgroundColor: snd.iconBg }]}>
          <Text style={sc.emoji}>{snd.emoji}</Text>
        </View>
        <View style={sc.info}>
          <Text style={[sc.name, { color: theme.colors.text }]} numberOfLines={1}>{snd.label}</Text>
          <Text style={[sc.tags, { color: theme.colors.textTertiary }]} numberOfLines={1}>{snd.tags}</Text>
        </View>
        <View style={[sc.playBtn, isPlaying ? { backgroundColor: snd.color } : { backgroundColor: theme.colors.surfaceTertiary }]}>
          {isPlaying
            ? <PulseDot color="#fff" />
            : <MaterialCommunityIcons name="play" size={12} color={theme.colors.textTertiary} />
          }
        </View>
      </Animated.View>
    </Pressable>
  );
}
const sc = StyleSheet.create({
  card:      { width: CARD_W, borderRadius: 20, padding: 14, gap: 8, borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  iconWrap:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji:     { fontSize: 24 },
  info:      { gap: 2 },
  name:      { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  tags:      { fontSize: 11, fontWeight: '500' },
  playBtn:   { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

// ─── Featured Mix Card ────────────────────────────────────────────────────────

function FeaturedMixCard({ featuredId, isPlaying, onPress, theme }: { featuredId: string; isPlaying: boolean; onPress: () => void; theme: any }) {
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(withSequence(
      withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      withTiming(0,  { duration: 2000, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    return () => cancelAnimation(bob);
  }, []);
  const bStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={theme.palette.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={fm.card}
      >
        <View style={[fm.dec, { width: 160, height: 160, top: -50, right: -40, opacity: 0.1 }]} />
        <View style={[fm.dec, { width: 100, height: 100, bottom: -30, left: 30, opacity: 0.08 }]} />
        <View style={fm.labelRow}>
          <Text style={fm.star}>✦</Text>
          <Text style={fm.label}>FEATURED MIX</Text>
        </View>
        <Text style={fm.title}>Midnight Rain</Text>
        <div style={fm.bottomRow}>
          <Pressable onPress={onPress} style={[fm.playBtn, isPlaying && fm.playBtnActive]}>
            {isPlaying
              ? <MaterialCommunityIcons name="pause" size={22} color={theme.colors.accent} />
              : <MaterialCommunityIcons name="play" size={22} color={theme.colors.accent} />
            }
          </Pressable>
          <Animated.View style={[fm.trackInfo, bStyle]}>
            <Text style={fm.trackName}>Deep Thunder & Rainfall</Text>
            <Text style={fm.trackMeta}>Ambiance • High Fidelity</Text>
          </Animated.View>
        </div>
      </LinearGradient>
    </Pressable>
  );
}
const fm = StyleSheet.create({
  card:        { borderRadius: 24, padding: 22, marginBottom: 28, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  dec:         { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  labelRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  star:        { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  label:       { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  title:       { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginBottom: 18 },
  bottomRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  playBtn:     { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  playBtnActive: { backgroundColor: '#E0E7FF' },
  trackInfo:   { flex: 1 },
  trackName:   { color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: '700' },
  trackMeta:   { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2, fontWeight: '500' },
});

// ─── Volume Slider ────────────────────────────────────────────────────────────

function VolumeSlider({ volume, onChange, theme }: { volume: number; onChange: (v: number) => void; theme: any }) {
  const sliderWidth = useRef(1);
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e: GestureResponderEvent) => onChange(Math.max(0, Math.min(1, e.nativeEvent.locationX / sliderWidth.current))),
    onPanResponderMove: (e: GestureResponderEvent) => onChange(Math.max(0, Math.min(1, e.nativeEvent.locationX / sliderWidth.current))),
  }), [onChange]);
  const pct = `${Math.round(volume * 100)}%`;
  return (
    <View style={vs.wrap}>
      <View style={vs.row}>
        <MaterialCommunityIcons name="volume-low" size={18} color={theme.colors.textTertiary} />
        <View
          style={[vs.track, { backgroundColor: theme.colors.surfaceTertiary }]}
          onLayout={(e: LayoutChangeEvent) => { sliderWidth.current = e.nativeEvent.layout.width; }}
          {...pan.panHandlers}
        >
          <View style={[vs.fill, { width: pct as any, backgroundColor: theme.colors.accent }]} />
          <View style={[vs.thumb, { left: pct as any, backgroundColor: theme.colors.accent }]} />
        </View>
        <MaterialCommunityIcons name="volume-high" size={18} color={theme.colors.textTertiary} />
      </View>
    </View>
  );
}
const vs = StyleSheet.create({
  wrap:  {},
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'visible', position: 'relative' },
  fill:  { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 3 },
  thumb: { position: 'absolute', top: -7, width: 20, height: 20, borderRadius: 10, marginLeft: -10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SoundsScreen() {
  const { theme } = useTheme();
  const [playing, setPlaying] = useState<Record<string, boolean>>({});
  const [volume, setVolume] = useState(0.85);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const soundRefs = useRef<Record<string, Audio.Sound>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      Object.values(soundRefs.current).forEach(s => s.unloadAsync().catch(() => {}));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    Object.entries(playing).forEach(([id, isPlaying]) => {
      if (isPlaying && soundRefs.current[id]) {
        soundRefs.current[id].setVolumeAsync(volume).catch(() => {});
      }
    });
  }, [volume, playing]);

  useEffect(() => {
    if (timerRemaining !== null && timerRemaining <= 0) {
      stopAll();
      setTimerRemaining(null);
    }
  }, [timerRemaining]);

  const startTimer = useCallback((minutes: number) => {
    selectionFeedback();
    if (minutes === -1) return;
    setTimerMinutes(minutes);
    if (timerRef.current) clearInterval(timerRef.current);
    if (minutes === 0) { setTimerRemaining(null); return; }
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
      if (soundRefs.current[id]) await soundRefs.current[id].pauseAsync().catch(() => {});
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
      if (soundRefs.current[id]) await soundRefs.current[id].pauseAsync().catch(() => {});
    }
    setPlaying({});
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRemaining(null);
  }, [playing]);

  const activeSoundCount = Object.values(playing).filter(Boolean).length;
  const featuredIsPlaying = !!playing['rain'];
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <View style={[s.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Page Header ── */}
        <View style={s.pageHead}>
          <View style={s.titleRow}>
            <Pressable 
              onPress={() => router.replace('/(tabs)/wellness')} 
              style={[s.backBtn, { backgroundColor: theme.colors.surfaceTertiary }]}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.accent} />
            </Pressable>
            <Text style={[s.pageTitle, { color: theme.colors.text }]}>Soothing Sounds</Text>
          </View>
          <Text style={[s.pageSub, { color: theme.colors.textSecondary }]}>Find your calm in the noise of the day.</Text>
        </View>

        {/* ── Now Playing bar ── */}
        {activeSoundCount > 0 && (
          <View style={[s.nowPlayingBar, { backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accentLight }]}>
            <MaterialCommunityIcons name="music-note-eighth" size={16} color={theme.colors.accent} />
            <Text style={[s.nowPlayingText, { color: theme.colors.accent }]}>
              {activeSoundCount} sound{activeSoundCount !== 1 ? 's' : ''} playing
              {timerRemaining !== null ? ` · ${formatTime(timerRemaining)}` : ''}
            </Text>
            <Pressable onPress={stopAll}>
              <MaterialCommunityIcons name="stop-circle-outline" size={20} color={theme.colors.accent} />
            </Pressable>
          </View>
        )}

        {/* ── Featured Mix ── */}
        <FeaturedMixCard featuredId="rain" isPlaying={featuredIsPlaying} onPress={() => toggleSound(SOUNDS[0])} theme={theme} />

        {/* ── Sound Library ── */}
        <View style={s.libHeader}>
          <Text style={[s.libTitle, { color: theme.colors.text }]}>Sound Library</Text>
          <Text style={[s.viewAll, { color: theme.colors.accent }]}>View All</Text>
        </View>

        <View style={s.grid}>
          {SOUNDS.map(snd => (
            <SoundCard
              key={snd.id}
              snd={snd}
              isPlaying={!!playing[snd.id]}
              onPress={() => toggleSound(snd)}
              theme={theme}
            />
          ))}
        </View>

        {/* ── Playback Settings ── */}
        <View style={[s.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[s.settingsTitle, { color: theme.colors.text }]}>Playback Settings</Text>

          <View style={s.settingRow}>
            <Text style={[s.settingLabel, { color: theme.colors.text }]}>Sound Volume</Text>
            <Text style={[s.settingValue, { color: theme.colors.accent }]}>{Math.round(volume * 100)}%</Text>
          </View>
          <View style={{ marginBottom: 22 }}>
            <VolumeSlider volume={volume} onChange={setVolume} theme={theme} />
          </View>

          <Text style={[s.settingLabel, { color: theme.colors.text }]}>Sleep Timer</Text>
          <View style={s.timerRow}>
            {TIMER_OPTIONS.map(opt => {
              const active = timerMinutes === opt.minutes;
              return (
                <Pressable
                  key={opt.minutes}
                  onPress={() => startTimer(opt.minutes)}
                  style={[s.timerPill, { backgroundColor: theme.colors.surfaceTertiary }, active && { backgroundColor: theme.colors.accent }]}
                >
                  <Text style={[s.timerPillText, { color: theme.colors.textSecondary }, active && { color: '#fff' }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  scroll:    { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  pageHead:  { marginBottom: 24 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  pageSub:   { fontSize: 14, fontWeight: '500', marginLeft: 48 },
  nowPlayingBar:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1 },
  nowPlayingText: { flex: 1, fontSize: 13, fontWeight: '600' },
  libHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  libTitle:  { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  viewAll:   { fontSize: 13, fontWeight: '600' },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  settingsCard:  { borderRadius: 24, padding: 20, gap: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  settingsTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 18 },
  settingRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  settingLabel:  { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  settingValue:  { fontSize: 14, fontWeight: '700' },
  timerRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  timerPill:     { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22 },
  timerPillText: { fontSize: 13, fontWeight: '700' },
});
