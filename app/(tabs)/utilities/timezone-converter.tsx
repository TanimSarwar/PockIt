import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui';
import { lightImpact } from '../../../lib/haptics';

const TIMEZONES = [
  { label: 'UTC', offset: 0 }, { label: 'EST (New York)', offset: -5 }, { label: 'CST (Chicago)', offset: -6 },
  { label: 'PST (LA)', offset: -8 }, { label: 'GMT (London)', offset: 0 }, { label: 'CET (Paris)', offset: 1 },
  { label: 'IST (Mumbai)', offset: 5.5 }, { label: 'CST (Shanghai)', offset: 8 }, { label: 'JST (Tokyo)', offset: 9 },
  { label: 'AEST (Sydney)', offset: 10 }, { label: 'NZST (Auckland)', offset: 12 }, { label: 'GST (Dubai)', offset: 4 },
];

export default function TimezoneConverterScreen() {
  const { theme } = useTheme();
  const [fromTz, setFromTz] = useState(TIMEZONES[0]);
  const [toTz, setToTz] = useState(TIMEZONES[1]);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);

  const diff = toTz.offset - fromTz.offset;
  let convertedHour = hour + diff;
  let dayShift = '';
  if (convertedHour >= 24) { convertedHour -= 24; dayShift = ' (+1 day)'; }
  else if (convertedHour < 0) { convertedHour += 24; dayShift = ' (-1 day)'; }

  const formatTime = (h: number, m: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Time Zone Converter" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>From</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {TIMEZONES.map((tz) => (
            <Pressable
              key={tz.label}
              style={[styles.tzChip, { backgroundColor: fromTz.label === tz.label ? theme.colors.accent : theme.colors.surface }]}
              onPress={() => { lightImpact(); setFromTz(tz); }}
            >
              <Text style={{ color: fromTz.label === tz.label ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '500' }}>{tz.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Time picker - simple hour/minute buttons */}
        <Card>
          <Text style={[styles.timeDisplay, { color: theme.colors.text }]}>{formatTime(hour, minute)}</Text>
          <View style={styles.pickerRow}>
            <View style={styles.pickerCol}>
              <Pressable onPress={() => setHour((h) => (h + 1) % 24)} style={[styles.pickerBtn, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>▲</Text>
              </Pressable>
              <Text style={[styles.pickerValue, { color: theme.colors.text }]}>{hour.toString().padStart(2, '0')}</Text>
              <Pressable onPress={() => setHour((h) => (h - 1 + 24) % 24)} style={[styles.pickerBtn, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>▼</Text>
              </Pressable>
            </View>
            <Text style={[styles.pickerColon, { color: theme.colors.text }]}>:</Text>
            <View style={styles.pickerCol}>
              <Pressable onPress={() => setMinute((m) => (m + 15) % 60)} style={[styles.pickerBtn, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>▲</Text>
              </Pressable>
              <Text style={[styles.pickerValue, { color: theme.colors.text }]}>{minute.toString().padStart(2, '0')}</Text>
              <Pressable onPress={() => setMinute((m) => (m - 15 + 60) % 60)} style={[styles.pickerBtn, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>▼</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>To</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {TIMEZONES.map((tz) => (
            <Pressable
              key={tz.label}
              style={[styles.tzChip, { backgroundColor: toTz.label === tz.label ? theme.colors.accent : theme.colors.surface }]}
              onPress={() => { lightImpact(); setToTz(tz); }}
            >
              <Text style={{ color: toTz.label === tz.label ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '500' }}>{tz.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Card>
          <Text style={[styles.resultTime, { color: theme.colors.accent }]}>
            {formatTime(convertedHour, minute)}{dayShift}
          </Text>
          <Text style={{ color: theme.colors.textTertiary, textAlign: 'center', marginTop: 4, fontSize: 13 }}>
            {diff >= 0 ? '+' : ''}{diff}h difference
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  tzChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  timeDisplay: { fontSize: 36, fontWeight: '300', textAlign: 'center', marginBottom: 16, fontVariant: ['tabular-nums'] },
  pickerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  pickerCol: { alignItems: 'center', gap: 8 },
  pickerBtn: { width: 48, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pickerValue: { fontSize: 28, fontWeight: '300', fontVariant: ['tabular-nums'] },
  pickerColon: { fontSize: 28, fontWeight: '300' },
  resultTime: { fontSize: 36, fontWeight: '300', textAlign: 'center', fontVariant: ['tabular-nums'] },
});
