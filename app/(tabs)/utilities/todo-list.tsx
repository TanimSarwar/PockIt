import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { useTasksStore, type Priority } from '../../../store/tasks';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card, Button, Input, Modal } from '../../../components/ui';
import { lightImpact } from '../../../lib/haptics';

const PRIORITY_COLORS: Record<Priority, string> = { low: '#3B82F6', medium: '#F59E0B', high: '#EF4444' };
const FILTERS = ['All', 'Active', 'Completed'] as const;

export default function TodoListScreen() {
  const { theme } = useTheme();
  const { tasks, addTask, toggleTask, deleteTask } = useTasksStore();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All');

  const filtered = tasks
    .filter((t) => filter === 'All' ? true : filter === 'Active' ? !t.completed : t.completed)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    });

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask({ title: title.trim(), priority });
    setTitle('');
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="To-Do List"
        rightAction={
          <Pressable onPress={() => setShowModal(true)} accessibilityLabel="Add task">
            <MaterialCommunityIcons name="plus-circle" size={28} color={theme.colors.accent} />
          </Pressable>
        }
      />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, { backgroundColor: filter === f ? theme.colors.accent : theme.colors.surface }]}
            onPress={() => { lightImpact(); setFilter(f); }}
          >
            <Text style={{ color: filter === f ? '#fff' : theme.colors.textSecondary, fontWeight: '600', fontSize: 13 }}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="checkbox-marked-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={{ color: theme.colors.textTertiary, marginTop: 8 }}>No tasks yet</Text>
          </View>
        )}
        {filtered.map((task) => (
          <Pressable key={task.id} onLongPress={() => handleDelete(task.id)}>
            <Card style={{ marginBottom: 8 }}>
              <View style={styles.taskRow}>
                <Pressable onPress={() => { lightImpact(); toggleTask(task.id); }} accessibilityLabel="Toggle task">
                  <MaterialCommunityIcons
                    name={task.completed ? 'checkbox-marked-circle' : 'circle-outline'}
                    size={24}
                    color={task.completed ? theme.colors.success : theme.colors.textTertiary}
                  />
                </Pressable>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.taskTitle, task.completed && styles.completed, { color: task.completed ? theme.colors.textTertiary : theme.colors.text }]}>
                    {task.title}
                  </Text>
                </View>
                <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={showModal} onClose={() => setShowModal(false)} title="New Task">
        <Input label="Task" value={title} onChangeText={setTitle} placeholder="What needs to be done?" autoFocus />
        <Text style={[styles.label, { color: theme.colors.text, marginTop: 12 }]}>Priority</Text>
        <View style={styles.priorityRow}>
          {(['low', 'medium', 'high'] as Priority[]).map((p) => (
            <Pressable
              key={p}
              style={[styles.priorityBtn, { backgroundColor: priority === p ? PRIORITY_COLORS[p] + '30' : theme.colors.surface, borderColor: PRIORITY_COLORS[p] }]}
              onPress={() => { lightImpact(); setPriority(p); }}
            >
              <View style={[styles.priorityDotSmall, { backgroundColor: PRIORITY_COLORS[p] }]} />
              <Text style={{ color: priority === p ? PRIORITY_COLORS[p] : theme.colors.textSecondary, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>{p}</Text>
            </Pressable>
          ))}
        </View>
        <Button title="Add Task" onPress={handleAdd} style={{ marginTop: 16 }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  taskRow: { flexDirection: 'row', alignItems: 'center' },
  taskTitle: { fontSize: 15, fontWeight: '500' },
  completed: { textDecorationLine: 'line-through' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 14, fontWeight: '500' },
  priorityRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  priorityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  priorityDotSmall: { width: 6, height: 6, borderRadius: 3 },
});
