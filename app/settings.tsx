import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, ACCENT_OPTIONS } from '../store/theme';
import { useSettingsStore } from '../store/settings';
import { lightImpact } from '../lib/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_PALETTES } from '../constants/theme';

export default function SettingsScreen() {
  const { theme, isDark, mode, setMode, setAccentColor, themeName } = useTheme();
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const settings = useSettingsStore();

  const clearCache = () => {
    Alert.alert('Clear Cache', 'This will clear all cached data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          const keys = await AsyncStorage.getAllKeys();
          const cacheKeys = keys.filter((k) => !k.startsWith('pockit-'));
          await AsyncStorage.multiRemove(cacheKeys);
          Alert.alert('Done', 'Cache cleared.');
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[...theme.colors.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGrad, { paddingTop: insets.top + 12 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Theme Section ── */}
        <Text style={[styles.groupLabel, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semiBold }]}>
          APPEARANCE
        </Text>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.card]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.fontFamily.semiBold }]}>Mode</Text>
          <View style={styles.modeRow}>
            {(['light', 'dark', 'system'] as const).map((m) => {
              const active = mode === m;
              return (
                <Pressable
                  key={m}
                  style={[
                    styles.modeChip,
                    {
                      backgroundColor: active ? theme.colors.accent : theme.colors.surfaceSecondary,
                      borderColor: active ? theme.colors.accent : theme.colors.border,
                    },
                  ]}
                  onPress={() => { lightImpact(); setMode(m); }}
                >
                  <MaterialCommunityIcons
                    name={m === 'light' ? 'weather-sunny' : m === 'dark' ? 'weather-night' : 'cellphone'}
                    size={18}
                    color={active ? '#FFFFFF' : theme.colors.textSecondary}
                  />
                  <Text style={[styles.modeLabel, { color: active ? '#FFFFFF' : theme.colors.textSecondary, fontFamily: theme.fontFamily.medium }]}>
                    {m === 'light' ? 'Light' : m === 'dark' ? 'Dark' : 'Auto'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Theme Palette ── */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, marginTop: 10 }, theme.shadows.card]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.fontFamily.semiBold }]}>Theme</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular }]}>
            Choose a color palette for the entire app
          </Text>
          <View style={styles.palettesGrid}>
            {Object.values(THEME_PALETTES).map((p) => {
              const active = themeName === p.name;
              return (
                <Pressable
                  key={p.name}
                  onPress={() => { lightImpact(); setAccentColor(p.name); }}
                  style={[
                    styles.paletteCard,
                    {
                      borderColor: active ? p.accent : theme.colors.border,
                      borderWidth: active ? 2 : 1,
                      backgroundColor: theme.colors.surfaceSecondary,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[...p.gradient]}
                    style={styles.paletteGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={styles.paletteInfo}>
                    <Text style={styles.paletteEmoji}>{p.emoji}</Text>
                    <Text style={[styles.paletteName, { color: theme.colors.text, fontFamily: theme.fontFamily.medium }]}>
                      {p.label}
                    </Text>
                  </View>
                  {active && (
                    <View style={[styles.paletteTick, { backgroundColor: p.accent }]}>
                      <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Notifications ── */}
        <Text style={[styles.groupLabel, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semiBold, marginTop: 20 }]}>
          NOTIFICATIONS
        </Text>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.card]}>
          {[
            { label: 'Enable Notifications', value: settings.notificationsEnabled, toggle: settings.toggleNotifications },
            { label: 'Water Reminders',       value: settings.waterReminderEnabled,  toggle: settings.toggleWaterReminder },
            { label: 'Habit Reminders',       value: settings.habitReminderEnabled,  toggle: settings.toggleHabitReminder },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[
                styles.switchRow,
                i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.switchLabel, { color: theme.colors.text, fontFamily: theme.fontFamily.regular }]}>{row.label}</Text>
              <Switch
                value={row.value}
                onValueChange={row.toggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* ── Data & Privacy ── */}
        <Text style={[styles.groupLabel, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semiBold, marginTop: 20 }]}>
          DATA & PRIVACY
        </Text>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.card]}>
          <Pressable style={styles.switchRow} onPress={clearCache}>
            <Text style={[styles.switchLabel, { color: theme.colors.error, fontFamily: theme.fontFamily.regular }]}>Clear Cache</Text>
            <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
          </Pressable>
        </View>

        {/* ── About ── */}
        <Text style={[styles.groupLabel, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semiBold, marginTop: 20 }]}>
          ABOUT
        </Text>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, theme.shadows.card]}>
          <View style={styles.aboutRow}>
            <LinearGradient colors={[...theme.colors.gradient]} style={styles.aboutIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <MaterialCommunityIcons name="lightning-bolt" size={22} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchLabel, { color: theme.colors.text, fontFamily: theme.fontFamily.bold }]}>PockIt</Text>
              <Text style={[{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: theme.fontFamily.regular }]}>
                Version 1.0.0 · 40+ tools in one app
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  headerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backBtn:     { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  content:    { paddingHorizontal: 16, paddingTop: 20 },
  groupLabel: { fontSize: 11, letterSpacing: 1.5, marginBottom: 10 },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 0,
  },
  cardTitle:    { fontSize: 15, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, marginBottom: 14 },

  modeRow:  { flexDirection: 'row', gap: 10, marginTop: 4 },
  modeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  modeLabel: { fontSize: 13 },

  palettesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  paletteCard: {
    width: '47%',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  paletteGrad:  { height: 52 },
  paletteInfo:  { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 6 },
  paletteEmoji: { fontSize: 16 },
  paletteName:  { fontSize: 13 },
  paletteTick:  { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  switchRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  switchLabel: { fontSize: 15 },

  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  aboutIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
