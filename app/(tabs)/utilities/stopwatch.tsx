import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, selectionFeedback } from '../../../lib/haptics';

function formatTime(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

export default function StopwatchScreen() {
  const { theme } = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = useCallback(() => {
    selectionFeedback();
    startTimeRef.current = Date.now() - elapsed;
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 10);
    setRunning(true);
  }, [elapsed]);

  const stop = useCallback(() => {
    lightImpact();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    lightImpact();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  }, []);

  const lap = useCallback(() => {
    lightImpact();
    setLaps((prev) => [elapsed, ...prev]);
  }, [elapsed]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="UTILITIES / TIME"
        title="Stopwatch"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          {elapsed > 0 && (
            <Pressable onPress={reset} style={styles.cardResetBtn}>
              <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
            </Pressable>
          )}

          <Text style={styles.featuredLabel}>{running ? 'RECORDING ACTIVE' : 'STOPWATCH'}</Text>
          <Text style={styles.featuredTitle}>{formatTime(elapsed)}</Text>
          
          <View style={styles.featuredActions}>
             {!running ? (
               <Pressable onPress={start} style={styles.mainBtn}>
                  <MaterialCommunityIcons name="play" size={24} color={theme.colors.accent} />
                  <Text style={[styles.mainBtnText, { color: theme.colors.accent }]}>
                    {elapsed > 0 ? 'Resume' : 'Start'}
                  </Text>
               </Pressable>
             ) : (
               <Pressable onPress={stop} style={[styles.mainBtn, { backgroundColor: '#fff' }]}>
                  <MaterialCommunityIcons name="pause" size={24} color={theme.colors.error} />
                  <Text style={[styles.mainBtnText, { color: theme.colors.error }]}>Stop</Text>
               </Pressable>
             )}
             
             {running && (
               <Pressable onPress={lap} style={styles.lapBtn}>
                  <MaterialCommunityIcons name="flag-variant" size={20} color="#fff" />
                  <Text style={styles.lapBtnText}>Lap</Text>
               </Pressable>
             )}
          </View>
        </LinearGradient>

        {laps.length > 0 && (
          <View style={[styles.lapsContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.lapsTitle, { color: theme.colors.text }]}>Laps & Splits</Text>
            {laps.map((item, index) => {
              const split = index < laps.length - 1 ? item - laps[index + 1] : item;
              return (
                <View key={index} style={[styles.lapRow, index !== laps.length - 1 && { borderBottomColor: theme.colors.border, borderBottomWidth: 1 }]}>
                  <View style={[styles.lapIcon, { backgroundColor: theme.colors.surfaceTertiary }]}>
                    <Text style={[styles.lapIndex, { color: theme.colors.textSecondary }]}>{laps.length - index}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[styles.lapTimeMain, { color: theme.colors.text }]}>{formatTime(split)}</Text>
                    <Text style={[styles.lapTimeTotal, { color: theme.colors.textTertiary }]}>Cumulative: {formatTime(item)}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.textTertiary} />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  featuredCard: { 
    width: '100%', 
    borderRadius: 24, 
    padding: 20, 
    minHeight: 185, 
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    marginTop: 10,
    marginBottom: 28,
  },
  cardResetBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  featuredTitle: { color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: -1.5, marginBottom: 20, fontVariant: ['tabular-nums'] },
  featuredActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  mainBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, gap: 8, elevation: 4 },
  mainBtnText: { fontSize: 14, fontWeight: '800' },
  lapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  lapBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  lapsContainer: { borderRadius: 28, padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  lapsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 },
  lapRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  lapIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lapIndex: { fontSize: 13, fontWeight: '800' },
  lapTimeMain: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  lapTimeTotal: { fontSize: 12, fontWeight: '500', marginTop: 2 },
});



