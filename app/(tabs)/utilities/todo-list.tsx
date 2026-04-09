import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Dimensions,
  Modal as RNModal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { useTasksStore, type Priority } from '../../../store/tasks';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Input, Button } from '../../../components/ui';
import { lightImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW - 32;

const PRIORITY_COLORS: Record<Priority, string> = { low: '#3B82F6', medium: '#F59E0B', high: '#EF4444' };
const PRIORITY_BG: Record<Priority, string> = { low: '#DDEEFF', medium: '#FEF3C7', high: '#FEE2E2' };
const FILTERS = ['All', 'Active', 'Completed'] as const;

interface Task {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
}

const sc = StyleSheet.create({
  card: { 
    width: CARD_W, 
    borderRadius: 20, 
    padding: 14, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, 
    borderWidth: 1.5, 
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700' },
  tags: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statusBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

// ─── Task Card Component ─────────────────────────────────────────────────────

function TaskCard({ 
  task, 
  onToggle, 
  onDelete, 
  theme 
}: { 
  task: Task; 
  onToggle: () => void; 
  onDelete: () => void; 
  theme: any 
}) {
  const scale = useSharedValue(1);
  const pressIn = () => { scale.value = withTiming(0.96, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); };

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: task.completed ? 0.7 : 1,
  }));

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={[aStyle, { marginBottom: 12 }]}>
      <Pressable 
        onPressIn={pressIn} 
        onPressOut={pressOut}
        onPress={onToggle}
        onLongPress={onDelete}
      >
        <View style={[sc.card, { backgroundColor: theme.colors.surface }]}>
          <View style={[sc.iconWrap, { backgroundColor: PRIORITY_BG[task.priority] }]}>
            <MaterialCommunityIcons 
              name={task.completed ? 'check-all' : 'clipboard-text-outline'} 
              size={22} 
              color={PRIORITY_COLORS[task.priority]} 
            />
          </View>
          
          <View style={sc.info}>
            <Text 
              style={[
                sc.name, 
                { color: theme.colors.text },
                task.completed && { textDecorationLine: 'line-through', color: theme.colors.textTertiary }
              ]} 
              numberOfLines={1}
            >
              {task.title}
            </Text>
            <Text style={[sc.tags, { color: theme.colors.textTertiary }]}>
              {task.priority.toUpperCase()} • {task.completed ? 'COMPLETED' : 'ACTIVE'}
            </Text>
          </View>

          <View style={[sc.statusBtn, task.completed ? { backgroundColor: theme.colors.success } : { backgroundColor: theme.colors.surfaceTertiary }]}>
            <MaterialCommunityIcons 
              name={task.completed ? 'checkbox-marked-circle' : 'circle-outline'} 
              size={14} 
              color={task.completed ? '#fff' : theme.colors.textTertiary} 
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}



export default function TodoListScreen() {
  const { theme } = useTheme();
  const { tasks, addTask, toggleTask, deleteTask } = useTasksStore();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All');
  const inputRef = useRef<TextInput>(null);

  const focusInput = () => {
    if (Platform.OS === 'web') return; // autoFocus usually works on web
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => filter === 'All' ? true : filter === 'Active' ? !t.completed : t.completed)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const p = { high: 0, medium: 1, low: 2 };
        return p[a.priority] - p[b.priority];
      });
  }, [tasks, filter]);

  const featuredTask = useMemo(() => {
    return tasks.find(t => !t.completed && t.priority === 'high') || tasks.find(t => !t.completed);
  }, [tasks]);

  const handleAdd = useCallback(() => {
    if (!title.trim()) return;
    selectionFeedback();
    addTask({ title: title.trim(), priority });
    setTitle('');
    setShowModal(false);
  }, [title, priority, addTask]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Task', 'Remove this task permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { lightImpact(); deleteTask(id); } },
    ]);
  }, [deleteTask]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="UTILITIES / TOOLS" 
         title="To-Do List" 
         rightAction={
           <Pressable 
             onPress={() => { lightImpact(); setShowModal(true); }} 
             style={styles.headerAction}
           >
             <MaterialCommunityIcons name="plus-circle" size={24} color={theme.colors.accent} />
           </Pressable>
         }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {featuredTask && (
          <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
            <Text style={styles.featuredLabel}>FOCUS ON</Text>
            <Text style={styles.featuredTitle} numberOfLines={2}>{featuredTask.title}</Text>
            <Pressable 
              onPress={() => { lightImpact(); toggleTask(featuredTask.id); }} 
              style={styles.featuredPlay}
            >
               <MaterialCommunityIcons name="check-circle-outline" size={20} color={theme.colors.accent} />
               <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>Done</Text>
            </Pressable>
          </LinearGradient>
        )}

        <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>FILTER BY STATUS</Text>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => { selectionFeedback(); setFilter(f); }}
              style={[styles.filterPill, { backgroundColor: filter === f ? theme.colors.accent : theme.colors.surfaceSecondary }]}
            >
              <Text style={[styles.filterPillText, { color: filter === f ? '#fff' : theme.colors.textSecondary }]}>{f}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary, marginTop: 12 }]}>YOUR TASKS</Text>
        <View style={styles.grid}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <MaterialCommunityIcons name="checkbox-marked-outline" size={32} color={theme.colors.textTertiary} />
              </View>
              <Text style={{ color: theme.colors.textTertiary, fontWeight: '700', fontSize: 13 }}>No tasks found</Text>
            </View>
          ) : (
            filtered.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onToggle={() => { lightImpact(); toggleTask(task.id); }} 
                onDelete={() => handleDelete(task.id)}
                theme={theme}
              />
            ))
          )}
        </View>
      </ScrollView>

      <RNModal 
        visible={showModal} 
        transparent 
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
        onShow={focusInput}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowModal(false)} />
            
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: theme.colors.text }]}>New Task</Text>
                 <Text style={[styles.modalSubtitle, { color: theme.colors.textTertiary }]}>What needs to be done?</Text>
              </View>

              <View style={styles.modalFields}>
                <Input 
                  ref={inputRef}
                  label="TASK DESCRIPTION" 
                  value={title} 
                  onChangeText={setTitle} 
                  placeholder="e.g. Finish the report" 
                  inputStyle={styles.textCenter}
                  containerStyle={styles.fieldItem}
                  autoFocus={Platform.OS === 'web'} 
                />
                
                <View style={styles.fieldItem}>
                  <Text style={[styles.label, { color: theme.colors.textTertiary, marginBottom: 12 }]}>PRIORITY LEVEL</Text>
                  <View style={styles.priorityRow}>
                    {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                      <Pressable
                        key={p}
                        style={[
                          styles.priorityPill, 
                          { backgroundColor: priority === p ? PRIORITY_COLORS[p] : theme.colors.surfaceSecondary }
                        ]}
                        onPress={() => { selectionFeedback(); setPriority(p); }}
                      >
                        <Text style={[styles.priorityPillText, { color: priority === p ? '#fff' : theme.colors.textSecondary }]}>
                          {p.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <Button 
                title="Add Task" 
                onPress={handleAdd} 
                style={{ marginTop: 28, width: '100%' }} 
              />
              
              <Pressable onPress={() => setShowModal(false)} style={styles.modalCancel}>
                <Text style={[styles.modalCancelText, { color: theme.colors.textTertiary }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  headerAction: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(99, 102, 241, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  featuredCard: { borderRadius: 24, padding: 24, marginBottom: 28, minHeight: 140, justifyContent: 'center' },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  featuredTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 16, marginTop: 4 },
  featuredPlay: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 12, 
    gap: 8 
  },
  featuredPlayText: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1.2 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  filterPillText: { fontSize: 13, fontWeight: '700' },
  grid: { gap: 4 },
  empty: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  priorityRow: { flexDirection: 'row', gap: 8, width: '100%' },
  priorityPill: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  priorityPillText: { fontSize: 13, fontWeight: '800' },
  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-start', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: Platform.OS === 'web' ? '15%' : '20%' 
  },
  modalContent: { width: '100%', borderRadius: 32, padding: 28, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, alignItems: 'center' },
  modalHeader: { alignItems: 'center', marginBottom: 28 },
  modalTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, textAlign: 'center', opacity: 0.6 },
  modalFields: { width: '100%', gap: 24 },
  fieldItem: { width: '100%', alignItems: 'center' },
  textCenter: { textAlign: 'center' },
  modalCancel: { marginTop: 16, padding: 8 },
  modalCancelText: { fontSize: 13, fontWeight: '600' },
});
