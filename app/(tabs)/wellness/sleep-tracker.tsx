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
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { useWellnessStore, type SleepLog } from '../../../store/wellness';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, selectionFeedback, notificationSuccess } from '../../../lib/haptics';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function calcDuration(bedtime: string, wakeTime: string): number {
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  let bedMinutes = bH * 60 + bM;
  let wakeMinutes = wH * 60 + wM;
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60;
  return (wakeMinutes - bedMinutes) / 60;
}

function formatHours(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
}

const QUALITY_MAP: Record<number, SleepLog['quality']> = {
  1: 'poor', 2: 'poor', 3: 'fair', 4: 'good', 5: 'excellent',
};

const QUALITY_LABELS: Record<number, string> = {
  1: 'Very Poor', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Excellent',
};

const QUALITY_COLORS: Record<number, string> = {
  1: '#EF4444', 2: '#F97316', 3: '#F59E0B', 4: '#10B981', 5: '#6366F1',
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
    sleepLogs.forEach((l) => { map[l.date] = l; });
    return map;
  }, [sleepLogs]);

  const last7Logs = useMemo(() => last7Days.map((d) => logsMap[d] || null), [last7Days, logsMap]);

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
    addSleepLog({ date: editDate, hours: parseFloat(duration.toFixed(2)), quality: qualityLabel });
    notificationSuccess();
    setShowForm(false);
  }, [bedtime, wakeTime, quality, editDate, addSleepLog]);

  const handleDelete = useCallback((date: string) => {
    Alert.alert('Delete Entry', 'Remove this sleep log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const filtered = sleepLogs.filter((l) => l.date !== date);
        useWellnessStore.setState({ sleepLogs: filtered });
      }},
    ]);
  }, [sleepLogs]);

  const editEntry = useCallback((log: SleepLog) => {
    setEditDate(log.date);
    const totalMinutes = log.hours * 60;
    const wakeH = 7, wakeM = 0;
    const bedMinutes = (wakeH * 60 + wakeM) - totalMinutes;
    const bH = ((bedMinutes + 24 * 60) % (24 * 60));
    setBedtime(`${Math.floor(bH / 60).toString().padStart(2, '0')}:${(bH % 60).toString().padStart(2, '0')}`);
    setWakeTime(`${wakeH.toString().padStart(2, '0')}:${wakeM.toString().padStart(2, '0')}`);
    const qMap: Record<string, number> = { poor: 2, fair: 3, good: 4, excellent: 5 };
    setQuality(qMap[log.quality] || 4);
    setShowForm(true);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="WELLNESS / SLEEP"
        title="Sleep Tracker"
        rightAction={
          <Pressable onPress={() => { setEditDate(getTodayISO()); setBedtime('23:00'); setWakeTime('07:00'); setQuality(4); setShowForm(true); }} hitSlop={12}>
            <MaterialCommunityIcons name="plus-circle" size={24} color={theme.colors.accent} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <SummaryCard icon="sleep" value={avgSleep > 0 ? formatHours(avgSleep) : '--'} label="Avg (7 days)" />
          <SummaryCard icon="calendar-week" value={`${last7Logs.filter(Boolean).length}/7`} label="Days Logged" />
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Last 7 Days</Text>
          <View style={styles.chartContainer}>
            {last7Days.map((day, i) => {
              const log = last7Logs[i];
              const barHeight = log ? (log.hours / maxHours) * 100 : 0;
              const qualityNum = log ? (log.quality === 'excellent' ? 5 : log.quality === 'good' ? 4 : 3) : 0;
              return (
                <View key={day} style={styles.chartBar}>
                  <View style={[styles.barTrack, { backgroundColor: theme.colors.surfaceTertiary }]}>
                    <View style={[styles.barFill, { height: `${Math.max(barHeight, 5)}%`, backgroundColor: log ? QUALITY_COLORS[qualityNum] : 'transparent' }]} />
                  </View>
                  <Text style={[styles.barDay, { color: theme.colors.textTertiary }]}>{new Date(day + 'T00:00:00').toLocaleDateString('en', { weekday: 'narrow' })}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>RECENT ENTRIES</Text>
        {sleepLogs.slice(0, 10).map((log) => (
          <Pressable key={log.date} onPress={() => editEntry(log)} onLongPress={() => handleDelete(log.date)} style={[styles.entryCard, { backgroundColor: theme.colors.surface }]}>
             <View>
                <Text style={{ fontWeight: '700', color: theme.colors.text }}>{new Date(log.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}</Text>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>{formatHours(log.hours)}</Text>
             </View>
             <MaterialCommunityIcons name="star" size={18} color={QUALITY_COLORS[log.quality === 'excellent' ? 5 : log.quality === 'good' ? 4 : 3]} />
          </Pressable>
        ))}
      </ScrollView>

      {showForm && (
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Log Sleep</Text>
              <TextInput style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surfaceSecondary }]} value={editDate} onChangeText={setEditDate} placeholder="YYYY-MM-DD" />
              <TextInput style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surfaceSecondary }]} value={bedtime} onChangeText={setBedtime} placeholder="Bedtime (HH:MM)" />
              <TextInput style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surfaceSecondary }]} value={wakeTime} onChangeText={setWakeTime} placeholder="Wake Time (HH:MM)" />
              <View style={styles.qualityRow}>
                 {[1,2,3,4,5].map(s => (
                   <Pressable key={s} onPress={() => setQuality(s)}>
                     <MaterialCommunityIcons name={s <= quality ? 'star' : 'star-outline'} size={32} color={s <= quality ? theme.colors.accent : theme.colors.textTertiary} />
                   </Pressable>
                 ))}
              </View>
              <Pressable onPress={handleSave} style={[styles.saveBtn, { backgroundColor: theme.colors.accent }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </Pressable>
              <Pressable onPress={() => setShowForm(false)} style={{ marginTop: 12 }}>
                <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>Cancel</Text>
              </Pressable>
           </View>
        </View>
      )}
    </View>
  );
}

function SummaryCard({ icon, value, label }: { icon: any, value: string, label: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
      <MaterialCommunityIcons name={icon} size={24} color={theme.colors.accent} />
      <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 12, marginVertical: 20 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 24, alignItems: 'center', elevation: 2 },
  summaryValue: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  summaryLabel: { fontSize: 12, marginTop: 4 },
  chartCard: { borderRadius: 24, padding: 20, marginBottom: 24 },
  chartTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 120 },
  chartBar: { flex: 1, alignItems: 'center', gap: 8 },
  barTrack: { flex: 1, width: 12, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barDay: { fontSize: 10, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1.2 },
  entryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20, zIndex: 100 },
  modalContent: { borderRadius: 32, padding: 28 },
  modalTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  input: { padding: 14, borderRadius: 16, marginBottom: 12, fontSize: 16 },
  qualityRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 16 },
  saveBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
});
