import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../store/theme';
import { lightImpact, mediumImpact, notificationSuccess } from '../../../lib/haptics';

// ─── Constants ──────────────────────────────────────────────────────────────

const DURATION_OPTIONS = [5, 10, 15, 20, 30];
const STORAGE_KEY = 'pockit-meditation-sessions';

const AMBIENT_SOUNDS = [
  { id: 'none', label: 'None', icon: 'volume-off' as const },
  { id: 'rain', label: 'Rain', icon: 'weather-rainy' as const },
  { id: 'ocean', label: 'Ocean', icon: 'waves' as const },
  { id: 'forest', label: 'Forest', icon: 'tree' as const },
  { id: 'bells', label: 'Bells', icon: 'bell-ring-outline' as const },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function MeditationScreen() {
  const { theme } = useTheme();
  const [duration, setDuration] = useState(10); // minutes
  const [customDuration, setCustomDuration] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [isComplete, setIsComplete] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [intervalBell, setIntervalBell] = useState(false);
  const [ambientSound, setAmbientSound] = useState('none');

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  // Load total sessions on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setTotalSessions(parseInt(val, 10) || 0);
    });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      pulseRef.current?.stop();
    };
  }, []);

  const totalSeconds = duration * 60;
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const remaining = Math.max(0, totalSeconds - elapsed);

  // Pulse animation while meditating
  const startPulse = useCallback(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 3000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseRef.current = anim;
    anim.start();
  }, [pulseAnim]);

  const startSession = useCallback(() => {
    mediumImpact();
    setIsRunning(true);
    setIsPaused(false);
    setElapsed(0);
    setIsComplete(false);
    startPulse();

    let sec = 0;
    intervalRef.current = setInterval(() => {
      sec += 1;
      setElapsed(sec);

      // Animate progress
      Animated.timing(progressAnim, {
        toValue: sec / (duration * 60),
        duration: 950,
        useNativeDriver: false,
      }).start();

      // Check interval bell (every 5 minutes)
      if (sec > 0 && sec % 300 === 0) {
        // intervalBell feedback handled via haptic as placeholder
        lightImpact();
      }

      if (sec >= duration * 60) {
        // Session complete
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        setIsComplete(true);
        notificationSuccess();

        // Save session count
        AsyncStorage.getItem(STORAGE_KEY).then((val) => {
          const count = (parseInt(val || '0', 10) || 0) + 1;
          AsyncStorage.setItem(STORAGE_KEY, count.toString());
          setTotalSessions(count);
        });
      }
    }, 1000);
  }, [duration, progressAnim, startPulse]);

  const pauseSession = useCallback(() => {
    lightImpact();
    setIsPaused(true);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    pulseRef.current?.stop();
  }, []);

  const resumeSession = useCallback(() => {
    lightImpact();
    setIsPaused(false);
    setIsRunning(true);
    startPulse();

    let sec = elapsed;
    intervalRef.current = setInterval(() => {
      sec += 1;
      setElapsed(sec);

      Animated.timing(progressAnim, {
        toValue: sec / (duration * 60),
        duration: 950,
        useNativeDriver: false,
      }).start();

      if (sec >= duration * 60) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        setIsComplete(true);
        notificationSuccess();

        AsyncStorage.getItem(STORAGE_KEY).then((val) => {
          const count = (parseInt(val || '0', 10) || 0) + 1;
          AsyncStorage.setItem(STORAGE_KEY, count.toString());
          setTotalSessions(count);
        });
      }
    }, 1000);
  }, [elapsed, duration, progressAnim, startPulse]);

  const stopSession = useCallback(() => {
    lightImpact();
    setIsRunning(false);
    setIsPaused(false);
    setElapsed(0);
    setIsComplete(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    pulseRef.current?.stop();
    pulseAnim.setValue(1);
    progressAnim.setValue(0);
  }, [pulseAnim, progressAnim]);

  const formatTime = (totalSec: number): string => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Circle progress ring dimensions
  const RING_SIZE = 240;
  const RING_STROKE = 8;
  const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  // Completion screen
  if (isComplete) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.text}
            />
          </Pressable>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.colors.text,
                fontFamily: theme.fontFamily.semiBold,
              },
            ]}
          >
            Session Complete
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.completeContainer}>
          <View
            style={[
              styles.completeIcon,
              { backgroundColor: theme.colors.successBg },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={64}
              color={theme.colors.success}
            />
          </View>
          <Text
            style={[
              styles.completeTitle,
              {
                color: theme.colors.text,
                fontFamily: theme.fontFamily.bold,
              },
            ]}
          >
            Well Done!
          </Text>
          <Text
            style={[
              styles.completeSubtitle,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.regular,
              },
            ]}
          >
            You meditated for {duration} minutes
          </Text>

          <View style={styles.completeStats}>
            <View
              style={[
                styles.completeStat,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text
                style={[
                  styles.completeStatValue,
                  {
                    color: theme.colors.accent,
                    fontFamily: theme.fontFamily.bold,
                  },
                ]}
              >
                {duration}
              </Text>
              <Text
                style={[
                  styles.completeStatLabel,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                  },
                ]}
              >
                Minutes
              </Text>
            </View>
            <View
              style={[
                styles.completeStat,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text
                style={[
                  styles.completeStatValue,
                  {
                    color: theme.colors.accent,
                    fontFamily: theme.fontFamily.bold,
                  },
                ]}
              >
                {totalSessions}
              </Text>
              <Text
                style={[
                  styles.completeStatLabel,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                  },
                ]}
              >
                Total Sessions
              </Text>
            </View>
          </View>

          <Pressable
            onPress={stopSession}
            style={[
              styles.doneButton,
              { backgroundColor: theme.colors.accent },
            ]}
          >
            <Text
              style={[
                styles.doneButtonText,
                { fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              Done
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const showTimer = isRunning || isPaused;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { stopSession(); router.back(); }} hitSlop={12}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.text}
          />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.colors.text,
              fontFamily: theme.fontFamily.semiBold,
            },
          ]}
        >
          Meditation
        </Text>
        <View style={styles.sessionBadge}>
          <MaterialCommunityIcons
            name="meditation"
            size={16}
            color={theme.colors.accent}
          />
          <Text
            style={[
              styles.sessionCount,
              {
                color: theme.colors.accent,
                fontFamily: theme.fontFamily.medium,
              },
            ]}
          >
            {totalSessions}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!showTimer}
      >
        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <Animated.View
            style={[
              styles.timerRing,
              {
                width: RING_SIZE,
                height: RING_SIZE,
                borderRadius: RING_SIZE / 2,
                borderColor: theme.colors.surfaceTertiary,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* Progress ring using a View-based approach */}
            <View
              style={[
                styles.timerInner,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text
                style={[
                  styles.timerText,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.fontFamily.bold,
                  },
                ]}
              >
                {showTimer ? formatTime(remaining) : `${duration}:00`}
              </Text>
              <Text
                style={[
                  styles.timerLabel,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                  },
                ]}
              >
                {isRunning
                  ? 'Remaining'
                  : isPaused
                    ? 'Paused'
                    : 'Minutes'}
              </Text>
            </View>
          </Animated.View>

          {/* Progress bar below circle */}
          {showTimer && (
            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.colors.surfaceTertiary },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.accent,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* Duration selector (only when not in session) */}
        {!showTimer && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.semiBold,
                },
              ]}
            >
              Duration
            </Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => {
                    selectionFeedback();
                    setDuration(d);
                  }}
                  style={[
                    styles.durationChip,
                    {
                      backgroundColor:
                        duration === d
                          ? theme.colors.accent
                          : theme.colors.surfaceSecondary,
                      borderColor:
                        duration === d
                          ? theme.colors.accent
                          : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.durationText,
                      {
                        color:
                          duration === d
                            ? '#FFFFFF'
                            : theme.colors.textSecondary,
                        fontFamily: theme.fontFamily.medium,
                      },
                    ]}
                  >
                    {d}m
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Ambient sound */}
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.semiBold,
                },
              ]}
            >
              Ambient Sound
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ambientRow}
            >
              {AMBIENT_SOUNDS.map((s) => {
                const isSelected = ambientSound === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      selectionFeedback();
                      setAmbientSound(s.id);
                    }}
                    style={[
                      styles.ambientChip,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.accentMuted
                          : theme.colors.surfaceSecondary,
                        borderColor: isSelected
                          ? theme.colors.accent
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={s.icon}
                      size={20}
                      color={
                        isSelected
                          ? theme.colors.accent
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.ambientText,
                        {
                          color: isSelected
                            ? theme.colors.accent
                            : theme.colors.textSecondary,
                          fontFamily: theme.fontFamily.medium,
                        },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Interval bell toggle */}
            <Pressable
              onPress={() => {
                selectionFeedback();
                setIntervalBell(!intervalBell);
              }}
              style={[
                styles.toggleRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={20}
                color={theme.colors.text}
              />
              <Text
                style={[
                  styles.toggleLabel,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.fontFamily.medium,
                  },
                ]}
              >
                Interval Bell (every 5 min)
              </Text>
              <View
                style={[
                  styles.toggleSwitch,
                  {
                    backgroundColor: intervalBell
                      ? theme.colors.accent
                      : theme.colors.surfaceTertiary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    {
                      transform: [
                        { translateX: intervalBell ? 18 : 2 },
                      ],
                    },
                  ]}
                />
              </View>
            </Pressable>
          </>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {isPaused && (
            <Pressable
              onPress={stopSession}
              style={[
                styles.controlBtn,
                { backgroundColor: theme.colors.errorBg },
              ]}
            >
              <MaterialCommunityIcons
                name="stop"
                size={24}
                color={theme.colors.error}
              />
            </Pressable>
          )}
          <Pressable
            onPress={
              isRunning
                ? pauseSession
                : isPaused
                  ? resumeSession
                  : startSession
            }
            style={[
              styles.mainBtn,
              { backgroundColor: theme.colors.accent },
            ]}
          >
            <MaterialCommunityIcons
              name={isRunning ? 'pause' : 'play'}
              size={32}
              color="#FFFFFF"
            />
          </Pressable>
          {isPaused && (
            <Pressable
              onPress={resumeSession}
              style={[
                styles.controlBtn,
                { backgroundColor: theme.colors.successBg },
              ]}
            >
              <MaterialCommunityIcons
                name="play"
                size={24}
                color={theme.colors.success}
              />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Missing import used inline
function selectionFeedback() {
  // Re-export from haptics
  require('../../../lib/haptics').selectionFeedback();
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionCount: {
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  timerRing: {
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerInner: {
    width: '85%',
    height: '85%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 40,
  },
  timerLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  progressBar: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  durationChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  durationText: {
    fontSize: 15,
  },
  ambientRow: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 16,
  },
  ambientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  ambientText: {
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
  },
  toggleSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  completeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 28,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 15,
    marginBottom: 32,
  },
  completeStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  completeStat: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  completeStatValue: {
    fontSize: 28,
  },
  completeStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  doneButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
