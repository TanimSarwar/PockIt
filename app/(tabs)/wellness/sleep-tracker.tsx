import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { useWellnessStore, type SleepLog } from '../../../store/wellness';
import { lightImpact, selectionFeedback, notificationSuccess } from '../../../lib/haptics';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function calcDuration(bedtime: string, wakeTime: string): number {
  // Parse HH:MM format
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  let bedMinutes = bH * 60 + bM;
  let wakeMinutes = wH * 60 + wM;
  // Assume next day if wake < bed
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60;
  return (wakeMinutes - bedMinutes) / 60;
}

function formatHours(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
}

const QUALITY_MAP: Record<number, SleepLog['quality']> = {
  1: 'poor',
  2: 'poor',
  3: 'fair',
  4: 'good',
  5: 'excellent',
};

const QUALITY_LABELS: Record<number, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Fair',
  4: 'Good',
  5: 'Excellent',
};

const QUALITY_COLORS: Record<number, string> = {
  1: '#EF4444',
  2: '#F97316',
  3: '#F59E0B',
  4: '#10B981',
  5: '#6366F1',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function SleepTrackerScreen() {
  const { theme } = useTheme();
  const { sleepLogs, addSleepLog } = useWellnessStore();

  const [showForm, setShowForm] = useState(false);
  const [editDate, setEditDate] = useState(getTodayISO());
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(4);

  // Last 7 days of logs
  const last7Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  const logsMap = useMemo(() => {
    const map: Record<string, SleepLog> = {};
    sleepLogs.forEach((l) => {
      map[l.date] = l;
    });
    return map;
  }, [sleepLogs]);

  const last7Logs = useMemo(
    () => last7Days.map((d) => logsMap[d] || null),
    [last7Days, logsMap],
  );

  const avgSleep = useMemo(() => {
    const logged = last7Logs.filter(Boolean) as SleepLog[];
    if (logged.length === 0) return 0;
    return logged.reduce((sum, l) => sum + l.hours, 0) / logged.length;
  }, [last7Logs]);

  const maxHours = useMemo(() => {
    const logged = last7Logs.filter(Boolean) as SleepLog[];
    return Math.max(10, ...logged.map((l) => l.hours));
  }, [last7Logs]);

  const handleSave = useCallback(() => {
    const duration = calcDuration(bedtime, wakeTime);
    if (duration <= 0 || duration > 24) {
      Alert.alert('Invalid Times', 'Please check your bedtime and wake time.');
      return;
    }

    const qualityLabel = QUALITY_MAP[quality] || 'fair';
    addSleepLog({
      date: editDate,
      hours: parseFloat(duration.toFixed(2)),
      quality: qualityLabel,
    });

    notificationSuccess();
    setShowForm(false);
  }, [bedtime, wakeTime, quality, editDate, addSleepLog]);

  const handleDelete = useCallback(
    (date: string) => {
      Alert.alert('Delete Entry', 'Remove this sleep log?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Filter out the entry by adding all others back
            // The store replaces by date, so we can use a workaround
            const filtered = sleepLogs.filter((l) => l.date !== date);
            // Since the store doesn't have a delete method, we reset by
            // re-adding all remaining. This is a simple approach.
            // In production, add a deleteSleepLog method to the store.
            useWellnessStore.setState({ sleepLogs: filtered });
          },
        },
      ]);
    },
    [sleepLogs],
  );

  const editEntry = useCallback((log: SleepLog) => {
    setEditDate(log.date);
    const totalMinutes = log.hours * 60;
    // Reverse calculate approximate times
    const wakeH = 7;
    const wakeM = 0;
    const bedMinutes = (wakeH * 60 + wakeM) - totalMinutes;
    const bH = ((bedMinutes + 24 * 60) % (24 * 60));
    setBedtime(
      `${Math.floor(bH / 60)
        .toString()
        .padStart(2, '0')}:${(bH % 60).toString().padStart(2, '0')}`,
    );
    setWakeTime(
      `${wakeH.toString().padStart(2, '0')}:${wakeM
        .toString()
        .padStart(2, '0')}`,
    );
    const qMap: Record<string, number> = {
      poor: 2,
      fair: 3,
      good: 4,
      excellent: 5,
    };
    setQuality(qMap[log.quality] || 4);
    setShowForm(true);
  }, []);

  const previewDuration = calcDuration(bedtime, wakeTime);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
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
          Sleep Tracker
        </Text>
        <Pressable
          onPress={() => {
            lightImpact();
            setEditDate(getTodayISO());
            setBedtime('23:00');
            setWakeTime('07:00');
            setQuality(4);
            setShowForm(true);
          }}
          hitSlop={12}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={24}
            color={theme.colors.accent}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.colors.surface,
                ...theme.shadows.card,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="sleep"
              size={24}
              color={theme.colors.accent}
            />
            <Text
              style={[
                styles.summaryValue,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.bold,
                },
              ]}
            >
              {avgSleep > 0 ? formatHours(avgSleep) : '--'}
            </Text>
            <Text
              style={[
                styles.summaryLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
            >
              Avg (7 days)
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.colors.surface,
                ...theme.shadows.card,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-week"
              size={24}
              color={theme.colors.accent}
            />
            <Text
              style={[
                styles.summaryValue,
                {
                  color: theme.colors.text,
                  fontFamily: theme.fontFamily.bold,
                },
              ]}
            >
              {last7Logs.filter(Boolean).length}/7
            </Text>
            <Text
              style={[
                styles.summaryLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
            >
              Days Logged
            </Text>
          </View>
        </View>

        {/* Mini Chart - Last 7 Days */}
        <View
          style={[
            styles.chartSection,
            {
              backgroundColor: theme.colors.surface,
              ...theme.shadows.card,
            },
          ]}
        >
          <Text
            style={[
              styles.chartTitle,
              {
                color: theme.colors.text,
                fontFamily: theme.fontFamily.semiBold,
              },
            ]}
          >
            Last 7 Days
          </Text>
          <View style={styles.chartContainer}>
            {last7Days.map((day, i) => {
              const log = last7Logs[i];
              const barHeight = log ? (log.hours / maxHours) * 100 : 0;
              const dayLabel = new Date(day + 'T00:00:00').toLocaleDateString(
                'en',
                { weekday: 'short' },
              );
              const qualityNum =
                log
                  ? log.quality === 'excellent'
                    ? 5
                    : log.quality === 'good'
                      ? 4
                      : log.quality === 'fair'
                        ? 3
                        : 2
                  : 0;
              return (
                <Pressable
                  key={day}
                  onPress={() => log && editEntry(log)}
                  style={styles.chartBar}
                >
                  <Text
                    style={[
                      styles.barValue,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: theme.fontFamily.medium,
                      },
                    ]}
                  >
                    {log ? `${log.hours.toFixed(1)}` : ''}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max(barHeight, 2)}%`,
                          backgroundColor: log
                            ? QUALITY_COLORS[qualityNum]
                            : theme.colors.surfaceTertiary,
                          borderRadius: 4,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      {
                        color:
                          day === getTodayISO()
                            ? theme.colors.accent
                            : theme.colors.textTertiary,
                        fontFamily: theme.fontFamily.medium,
                      },
                    ]}
                  >
                    {dayLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Quality Trend */}
        <View
          style={[
            styles.chartSection,
            {
              backgroundColor: theme.colors.surface,
              ...theme.shadows.card,
            },
          ]}
        >
          <Text
            style={[
              styles.chartTitle,
              {
                color: theme.colors.text,
                fontFamily: theme.fontFamily.semiBold,
              },
            ]}
          >
            Sleep Quality Trend
          </Text>
          <View style={styles.trendContainer}>
            {last7Days.map((day, i) => {
              const log = last7Logs[i];
              const qualityNum = log
                ? log.quality === 'excellent'
                  ? 5
                  : log.quality === 'good'
                    ? 4
                    : log.quality === 'fair'
                      ? 3
                      : log.quality === 'poor'
                        ? 2
                        : 1
                : 0;
              return (
                <View key={day} style={styles.trendItem}>
                  {[5, 4, 3, 2, 1].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.trendDot,
                        {
                          backgroundColor:
                            qualityNum >= level
                              ? QUALITY_COLORS[qualityNum]
                              : theme.colors.surfaceTertiary,
                        },
                      ]}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Entries */}
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              fontFamily: theme.fontFamily.semiBold,
            },
          ]}
        >
          Recent Entries
        </Text>
        {sleepLogs.slice(0, 10).map((log) => {
          const qualityNum =
            log.quality === 'excellent'
              ? 5
              : log.quality === 'good'
                ? 4
                : log.quality === 'fair'
                  ? 3
                  : 2;
          return (
            <View
              key={log.date}
              style={[
                styles.entryCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.entryLeft}>
                <Text
                  style={[
                    styles.entryDate,
                    {
                      color: theme.colors.text,
                      fontFamily: theme.fontFamily.medium,
                    },
                  ]}
                >
                  {new Date(log.date + 'T00:00:00').toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </Text>
                <Text
                  style={[
                    styles.entryHours,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.fontFamily.regular,
                    },
                  ]}
                >
                  {formatHours(log.hours)}
                </Text>
              </View>
              <View style={styles.entryRight}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <MaterialCommunityIcons
                      key={s}
                      name={s <= qualityNum ? 'star' : 'star-outline'}
                      size={14}
                      color={
                        s <= qualityNum
                          ? QUALITY_COLORS[qualityNum]
                          : theme.colors.textTertiary
                      }
                    />
                  ))}
                </View>
                <View style={styles.entryActions}>
                  <Pressable
                    onPress={() => editEntry(log)}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={18}
                      color={theme.colors.textTertiary}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(log.date)}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={18}
                      color={theme.colors.error}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        {sleepLogs.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="sleep"
              size={48}
              color={theme.colors.textTertiary}
            />
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.textTertiary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
            >
              No sleep logs yet. Tap + to add your first entry.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.fontFamily.semiBold,
                  },
                ]}
              >
                Log Sleep
              </Text>
              <Pressable onPress={() => setShowForm(false)} hitSlop={12}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* Date */}
            <Text
              style={[
                styles.fieldLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.medium,
                },
              ]}
            >
              Date
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceSecondary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
              value={editDate}
              onChangeText={setEditDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textTertiary}
              underlineColorAndroid="transparent"
            />

            {/* Bedtime */}
            <Text
              style={[
                styles.fieldLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.medium,
                },
              ]}
            >
              Bedtime
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceSecondary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
              value={bedtime}
              onChangeText={setBedtime}
              placeholder="HH:MM (e.g. 23:00)"
              placeholderTextColor={theme.colors.textTertiary}
              underlineColorAndroid="transparent"
            />

            {/* Wake time */}
            <Text
              style={[
                styles.fieldLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.medium,
                },
              ]}
            >
              Wake Time
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceSecondary,
                  fontFamily: theme.fontFamily.regular,
                },
              ]}
              value={wakeTime}
              onChangeText={setWakeTime}
              placeholder="HH:MM (e.g. 07:00)"
              placeholderTextColor={theme.colors.textTertiary}
              underlineColorAndroid="transparent"
            />

            {/* Duration preview */}
            {previewDuration > 0 && previewDuration <= 24 && (
              <Text
                style={[
                  styles.durationPreview,
                  {
                    color: theme.colors.accent,
                    fontFamily: theme.fontFamily.medium,
                  },
                ]}
              >
                Duration: {formatHours(previewDuration)}
              </Text>
            )}

            {/* Quality stars */}
            <Text
              style={[
                styles.fieldLabel,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.medium,
                },
              ]}
            >
              Quality
            </Text>
            <View style={styles.qualityRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    selectionFeedback();
                    setQuality(s);
                  }}
                  hitSlop={4}
                >
                  <MaterialCommunityIcons
                    name={s <= quality ? 'star' : 'star-outline'}
                    size={32}
                    color={
                      s <= quality
                        ? QUALITY_COLORS[quality]
                        : theme.colors.textTertiary
                    }
                  />
                </Pressable>
              ))}
              <Text
                style={[
                  styles.qualityLabel,
                  {
                    color: QUALITY_COLORS[quality],
                    fontFamily: theme.fontFamily.medium,
                  },
                ]}
              >
                {QUALITY_LABELS[quality]}
              </Text>
            </View>

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              style={[
                styles.saveButton,
                { backgroundColor: theme.colors.accent },
              ]}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  { fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 6,
  },
  summaryValue: {
    fontSize: 22,
  },
  summaryLabel: {
    fontSize: 12,
  },
  chartSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 15,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 4,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barValue: {
    fontSize: 10,
    height: 14,
  },
  barTrack: {
    flex: 1,
    width: '80%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    minHeight: 2,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  trendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  entryLeft: {
    gap: 2,
  },
  entryDate: {
    fontSize: 14,
  },
  entryHours: {
    fontSize: 12,
  },
  entryRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  durationPreview: {
    fontSize: 14,
    marginTop: 8,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  qualityLabel: {
    fontSize: 13,
    marginLeft: 8,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
