import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Dimensions,
  Image,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Modal as RNModal,
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
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../store/theme';
import { useEventsStore, type EventType, type AppEvent } from '../../../store/events';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Input, Button, Badge } from '../../../components/ui';
import { lightImpact, selectionFeedback, notificationSuccess } from '../../../lib/haptics';
import { scheduleLocalNotification, cancelNotification } from '../../../lib/notifications';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW - 32;

const EVENT_TYPES: { type: EventType; icon: string; color: string; label: string }[] = [
  { type: 'birthday', icon: 'cake-variant', color: '#F43F5E', label: 'Birthday' },
  { type: 'meeting', icon: 'account-group', color: '#3B82F6', label: 'Meeting' },
  { type: 'anniversary', icon: 'heart', color: '#EC4899', label: 'Anniversary' },
  { type: 'party', icon: 'party-popper', color: '#F59E0B', label: 'Party' },
  { type: 'other', icon: 'calendar-star', color: '#8B5CF6', label: 'Other' },
];

// ─── Event Card Component ─────────────────────────────────────────────────────

function EventCard({ 
  event, 
  onDelete, 
  onEdit,
  theme 
}: { 
  event: AppEvent; 
  onDelete: () => void; 
  onEdit: () => void;
  theme: any 
}) {
  const scale = useSharedValue(1);
  const typeInfo = EVENT_TYPES.find(t => t.type === event.type) || EVENT_TYPES[4];

  const pressIn = () => { scale.value = withTiming(0.96, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); };

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const daysRemaining = useMemo(() => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = eventDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [event.date]);

  const formattedDate = useMemo(() => {
    return new Date(event.date).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, [event.date]);

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={[aStyle, { marginBottom: 16 }]}>
      <Pressable 
        onPressIn={pressIn} 
        onPressOut={pressOut}
        onLongPress={() => {
          Alert.alert('Delete Event', 'Are you sure you want to remove this event?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ]);
        }}
      >
        <View style={[sc.card, { backgroundColor: theme.colors.surface }]}>
          {event.imageUri ? (
            <Image source={{ uri: event.imageUri }} style={sc.image} />
          ) : (
            <LinearGradient 
              colors={[typeInfo.color + '44', typeInfo.color + '11']} 
              style={sc.imagePlaceholder}
            >
              <MaterialCommunityIcons name={typeInfo.icon as any} size={40} color={typeInfo.color} />
            </LinearGradient>
          )}
          
          <View style={sc.content}>
            <View style={sc.topRow}>
              <View style={[sc.badge, { backgroundColor: typeInfo.color + '22' }]}>
                <Text style={[sc.badgeText, { color: typeInfo.color }]}>
                  {typeInfo.label.toUpperCase()}
                </Text>
              </View>
              <View style={sc.topActions}>
                <Text style={[sc.days, { color: daysRemaining < 0 ? theme.colors.textTertiary : typeInfo.color, marginRight: 8 }]}>
                  {daysRemaining === 0 ? 'TODAY' : daysRemaining < 0 ? 'PAST' : `${daysRemaining} DAYS LEFT`}
                </Text>
                <View style={sc.actionBtns}>
                  <Pressable onPress={onEdit} hitSlop={10} style={[sc.actionBtn, { marginRight: 4 }]}>
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.textTertiary} />
                  </Pressable>
                  <Pressable onPress={onDelete} hitSlop={10} style={sc.actionBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.textTertiary} />
                  </Pressable>
                </View>
              </View>
            </View>
            
            <Text style={[sc.title, { color: theme.colors.text }]} numberOfLines={1}>
              {event.title}
            </Text>
            
            <View style={sc.footer}>
              <MaterialCommunityIcons name="calendar-clock" size={14} color={theme.colors.textTertiary} />
              <Text style={[sc.date, { color: theme.colors.textTertiary }]}>{formattedDate}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  card: { 
    width: CARD_W, 
    borderRadius: 24, 
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1.5, 
    borderColor: 'transparent',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  image: { width: 100, height: '100%', minHeight: 120 },
  imagePlaceholder: { width: 100, height: '100%', minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 16, gap: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtns: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  days: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontSize: 12, fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EventPlannerScreen() {
  const { theme } = useTheme();
  const { events, addEvent, deleteEvent, updateEvent } = useEventsStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('birthday');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [imageUri, setImageUri] = useState<string | undefined>();

  const inputRef = useRef<TextInput>(null);

  const upcomingEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const pickImage = async () => {
    selectionFeedback();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleEdit = (event: AppEvent) => {
    lightImpact();
    setEditingId(event.id);
    setTitle(event.title);
    setType(event.type);
    
    const d = new Date(event.date);
    setDay(d.getDate().toString());
    setMonth((d.getMonth() + 1).toString());
    setYear(d.getFullYear().toString());
    setHour(d.getHours().toString().padStart(2, '0'));
    setMinute(d.getMinutes().toString().padStart(2, '0'));
    setImageUri(event.imageUri);
    setShowModal(true);
  };

  const handleAdd = useCallback(async () => {
    if (!title.trim() || !day || !month || !year) {
      Alert.alert('Missing Info', 'Please fill in the title and date.');
      return;
    }

    const d = parseInt(day);
    const m = parseInt(month) - 1;
    const y = parseInt(year);
    const h = parseInt(hour);
    const min = parseInt(minute);

    const eventDate = new Date(y, m, d, h, min);
    if (isNaN(eventDate.getTime())) {
      Alert.alert('Invalid Date', 'The date you entered is not valid.');
      return;
    }

    notificationSuccess();

    let reminderId: string | undefined;
    
    // Schedule notification if it's in the future
    if (eventDate > new Date()) {
      try {
        reminderId = await scheduleLocalNotification(
          `${title} is here!`,
          `Don't forget your ${type} event today.`,
          { type: 'date', date: eventDate },
          { channelId: 'reminders', data: { type: 'event' } }
        );
      } catch (err) {
        console.warn('Notification failed:', err);
      }
    }

    if (editingId) {
      const existing = events.find(e => e.id === editingId);
      if (existing?.reminderId) {
        await cancelNotification(existing.reminderId);
      }
      updateEvent(editingId, {
        title: title.trim(),
        type,
        date: eventDate.toISOString(),
        notificationTime: eventDate.toISOString(),
        imageUri,
        reminderId,
      });
    } else {
      addEvent({
        title: title.trim(),
        type,
        date: eventDate.toISOString(),
        notificationTime: eventDate.toISOString(),
        imageUri,
        reminderId,
      });
    }

    // Reset and close
    setTitle('');
    setType('birthday');
    setDay('');
    setMonth('');
    setYear(new Date().getFullYear().toString());
    setHour('09');
    setMinute('00');
    setImageUri(undefined);
    setEditingId(null);
    setShowModal(false);
  }, [editingId, events, title, type, day, month, year, hour, minute, imageUri, addEvent, updateEvent]);

  const handleDelete = useCallback(async (event: AppEvent) => {
    lightImpact();
    if (event.reminderId) {
      await cancelNotification(event.reminderId);
    }
    deleteEvent(event.id);
  }, [deleteEvent]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="UTILITIES / TOOLS" 
         title="Event Planner" 
         rightAction={
           <Pressable 
             onPress={() => { lightImpact(); setShowModal(true); }} 
             style={styles.headerAction}
           >
             <MaterialCommunityIcons name="calendar-plus" size={22} color={theme.colors.accent} />
           </Pressable>
         }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {upcomingEvents.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceTertiary }]}>
              <MaterialCommunityIcons name="calendar-heart" size={48} color={theme.colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>No Events Planned</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>Add your first birthday, meeting or anniversary!</Text>
            <Button 
                title="Create Event" 
                onPress={() => setShowModal(true)} 
                leftIcon={<MaterialCommunityIcons name="plus" size={20} color="white" />}
                style={{ marginTop: 12 }}
            />
          </View>
        ) : (
          <View style={styles.list}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>UPCOMING EVENTS</Text>
            {upcomingEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onEdit={() => handleEdit(event)}
                onDelete={() => handleDelete(event)}
                theme={theme}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Event Modal */}
      <RNModal 
        visible={showModal} 
        transparent 
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <Pressable style={StyleSheet.absoluteFill} onPress={() => { setShowModal(false); setEditingId(null); }} />
            
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                 <View style={[styles.modalIcon, { backgroundColor: theme.colors.accent + '22' }]}>
                    <MaterialCommunityIcons name={editingId ? "pencil-box-outline" : "calendar-edit"} size={24} color={theme.colors.accent} />
                 </View>
                 <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                   {editingId ? 'Edit Event' : 'Add New Event'}
                 </Text>
                 <Text style={[styles.modalSubtitle, { color: theme.colors.textTertiary }]}>
                   {editingId ? 'Update your event details' : 'Plan something special today'}
                 </Text>
              </View>

              <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                <View style={styles.modalFields}>
                  <Input 
                    label="EVENT TITLE" 
                    value={title} 
                    onChangeText={setTitle} 
                    placeholder="e.g. Mom's Birthday" 
                  />
                  
                  <View>
                    <Text style={[styles.label, { color: theme.colors.textTertiary, marginBottom: 12 }]}>EVENT TYPE</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
                      {EVENT_TYPES.map((t) => (
                        <Pressable
                          key={t.type}
                          style={[
                            styles.typePill, 
                            { backgroundColor: type === t.type ? t.color : theme.colors.surfaceSecondary }
                          ]}
                          onPress={() => { selectionFeedback(); setType(t.type); }}
                        >
                          <MaterialCommunityIcons 
                            name={t.icon as any} 
                            size={16} 
                            color={type === t.type ? '#fff' : theme.colors.textSecondary} 
                          />
                          <Text style={[styles.typePillText, { color: type === t.type ? '#fff' : theme.colors.textSecondary }]}>
                            {t.label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  <View>
                    <Text style={[styles.label, { color: theme.colors.textTertiary, marginBottom: 12 }]}>DATE & TIME</Text>
                    <View style={styles.dateTimeRow}>
                      <View style={{ flex: 1 }}>
                        <Input value={day} onChangeText={setDay} placeholder="DD" keyboardType="number-pad" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Input value={month} onChangeText={setMonth} placeholder="MM" keyboardType="number-pad" />
                      </View>
                      <View style={{ flex: 1.5 }}>
                        <Input value={year} onChangeText={setYear} placeholder="YYYY" keyboardType="number-pad" />
                      </View>
                    </View>
                    <View style={[styles.dateTimeRow, { marginTop: 8 }]}>
                      <View style={{ flex: 1 }}>
                        <Input label="HOUR (24h)" value={hour} onChangeText={setHour} placeholder="09" keyboardType="number-pad" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Input label="MINUTE" value={minute} onChangeText={setMinute} placeholder="00" keyboardType="number-pad" />
                      </View>
                    </View>
                  </View>

                  <View>
                    <Text style={[styles.label, { color: theme.colors.textTertiary, marginBottom: 12 }]}>EVENT COVER</Text>
                    <Pressable onPress={pickImage} style={[styles.imagePicker, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.surfaceTertiary }]}>
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.pickedImage} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="image-plus" size={28} color={theme.colors.textTertiary} />
                          <Text style={{ color: theme.colors.textTertiary, fontSize: 12, fontWeight: '600' }}>Choose from Gallery</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>

                <Button 
                  title={editingId ? "Update Event" : "Save Event"} 
                  onPress={handleAdd} 
                  style={{ marginTop: 32, width: '100%' }} 
                />
                
                <Pressable onPress={() => { setShowModal(false); setEditingId(null); }} style={styles.modalCancel}>
                  <Text style={[styles.modalCancelText, { color: theme.colors.textTertiary }]}>Cancel</Text>
                </Pressable>
                <View style={{ height: 40 }} />
              </ScrollView>
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
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(99, 102, 241, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  list: { gap: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 16, letterSpacing: 1.5, marginTop: 12 },
  empty: { alignItems: 'center', marginTop: 80, gap: 16, paddingHorizontal: 40 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, opacity: 0.7 },
  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-end', 
  },
  modalContent: { 
    width: '100%', 
    height: '85%',
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32,
    padding: 24, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: { alignItems: 'center', marginBottom: 32 },
  modalIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, textAlign: 'center', opacity: 0.6 },
  modalFields: { width: '100%', gap: 24 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  typeRow: { gap: 8, paddingRight: 20 },
  typePill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14, 
    gap: 8 
  },
  typePillText: { fontSize: 13, fontWeight: '800' },
  dateTimeRow: { flexDirection: 'row', gap: 12 },
  imagePicker: { 
    width: '100%', 
    height: 120, 
    borderRadius: 20, 
    borderWidth: 2, 
    borderStyle: 'dashed', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden'
  },
  pickedImage: { width: '100%', height: '100%' },
  modalCancel: { marginTop: 20, padding: 8, alignSelf: 'center' },
  modalCancelText: { fontSize: 13, fontWeight: '700' },
});
