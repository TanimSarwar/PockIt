import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { useTasksStore } from '../../../store/tasks';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card, Button, Input, Modal } from '../../../components/ui';
import { lightImpact, notificationSuccess } from '../../../lib/haptics';

function getDateStr(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function getStreak(completedDates: string[]): number {
  const sorted = [...completedDates].sort().reverse();
  if (sorted.length === 0) return 0;
  const today = getDateStr();
  if (sorted[0] !== today && sorted[0] !== getDateStr(new Date(Date.now() - 86400000))) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    days.push(getDateStr(new Date(Date.now() - i * 86400000)));
  }
  return days;
}

export default function HabitTrackerScreen() {
  const { theme } = useTheme();
  const { habits, addHabit, toggleHabitDate, deleteHabit } = useTasksStore();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const today = getDateStr();
  const last30 = getLast30Days();

  const handleAdd = () => {
    if (!name.trim()) return;
    addHabit(name.trim());
    setName('');
    setShowModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Habit Tracker"
        rightAction={
          <Pressable onPress={() => setShowModal(true)} accessibilityLabel="Add habit">
            <MaterialCommunityIcons name="plus-circle" size={28} color={theme.colors.accent} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {habits.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={48} color={theme.colors.textTertiary} />
            <Text style={{ color: theme.colors.textTertiary, marginTop: 8 }}>No habits yet. Tap + to add one.</Text>
          </View>
        )}
        {habits.map((habit) => {
          const streak = getStreak(habit.completedDates);
          const doneToday = habit.completedDates.includes(today);

          return (
            <Card key={habit.id} style={{ marginBottom: 12 }}>
              <View style={styles.habitHeader}>
                <Pressable
                  style={[styles.checkBtn, { backgroundColor: doneToday ? theme.colors.accent : theme.colors.surfaceSecondary }]}
                  onPress={() => { lightImpact(); toggleHabitDate(habit.id, today); if (!doneToday) notificationSuccess(); }}
                  accessibilityLabel={`Toggle ${habit.name}`}
                >
                  <MaterialCommunityIcons name={doneToday ? 'check' : 'plus'} size={20} color={doneToday ? '#fff' : theme.colors.textSecondary} />
                </Pressable>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.habitName, { color: theme.colors.text }]}>{habit.name}</Text>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>
                    {streak > 0 ? `🔥 ${streak} day streak` : 'Start your streak today!'}
                  </Text>
                </View>
                <Pressable onPress={() => deleteHabit(habit.id)} accessibilityLabel="Delete habit">
                  <MaterialCommunityIcons name="close" size={18} color={theme.colors.textTertiary} />
                </Pressable>
              </View>

              {/* Calendar heatmap */}
              <View style={styles.heatmap}>
                {last30.map((date) => {
                  const done = habit.completedDates.includes(date);
                  return (
                    <View
                      key={date}
                      style={[styles.heatCell, { backgroundColor: done ? theme.colors.accent : theme.colors.surfaceSecondary }]}
                    />
                  );
                })}
              </View>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 10, marginTop: 4 }}>Last 30 days</Text>
            </Card>
          );
        })}
      </ScrollView>

      <Modal visible={showModal} onClose={() => setShowModal(false)} title="New Habit">
        <Input label="Habit Name" value={name} onChangeText={setName} placeholder="e.g. Meditate, Read, Exercise..." autoFocus />
        <Button title="Add Habit" onPress={handleAdd} style={{ marginTop: 16 }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  habitHeader: { flexDirection: 'row', alignItems: 'center' },
  checkBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  habitName: { fontSize: 16, fontWeight: '600' },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 12 },
  heatCell: { width: 14, height: 14, borderRadius: 3 },
});
