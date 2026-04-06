import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card, Modal } from '../../../components/ui';
import { SearchBar } from '../../../components/ui';
import { lightImpact } from '../../../lib/haptics';

interface City { name: string; timezone: string; offset: number; }

const CITIES: City[] = [
  { name: 'New York', timezone: 'EST', offset: -5 },
  { name: 'Los Angeles', timezone: 'PST', offset: -8 },
  { name: 'Chicago', timezone: 'CST', offset: -6 },
  { name: 'London', timezone: 'GMT', offset: 0 },
  { name: 'Paris', timezone: 'CET', offset: 1 },
  { name: 'Berlin', timezone: 'CET', offset: 1 },
  { name: 'Tokyo', timezone: 'JST', offset: 9 },
  { name: 'Sydney', timezone: 'AEST', offset: 10 },
  { name: 'Dubai', timezone: 'GST', offset: 4 },
  { name: 'Mumbai', timezone: 'IST', offset: 5.5 },
  { name: 'Singapore', timezone: 'SGT', offset: 8 },
  { name: 'Hong Kong', timezone: 'HKT', offset: 8 },
  { name: 'Seoul', timezone: 'KST', offset: 9 },
  { name: 'Moscow', timezone: 'MSK', offset: 3 },
  { name: 'São Paulo', timezone: 'BRT', offset: -3 },
  { name: 'Cairo', timezone: 'EET', offset: 2 },
  { name: 'Istanbul', timezone: 'TRT', offset: 3 },
  { name: 'Bangkok', timezone: 'ICT', offset: 7 },
  { name: 'Toronto', timezone: 'EST', offset: -5 },
  { name: 'Vancouver', timezone: 'PST', offset: -8 },
  { name: 'Auckland', timezone: 'NZST', offset: 12 },
  { name: 'Delhi', timezone: 'IST', offset: 5.5 },
  { name: 'Shanghai', timezone: 'CST', offset: 8 },
  { name: 'Mexico City', timezone: 'CST', offset: -6 },
  { name: 'Johannesburg', timezone: 'SAST', offset: 2 },
];

function getTimeInCity(offset: number): { time: string; isNight: boolean } {
  const utc = new Date();
  const cityTime = new Date(utc.getTime() + (utc.getTimezoneOffset() + offset * 60) * 60000);
  const hours = cityTime.getHours();
  const mins = cityTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return {
    time: `${h12}:${mins.toString().padStart(2, '0')} ${ampm}`,
    isNight: hours < 6 || hours >= 20,
  };
}

export default function WorldClockScreen() {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<string[]>(['New York', 'London', 'Tokyo', 'Sydney']);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const localOffset = -new Date().getTimezoneOffset() / 60;
  const filteredCities = CITIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c.name));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="World Clock"
        rightAction={
          <Pressable onPress={() => setShowAdd(true)} accessibilityLabel="Add city">
            <MaterialCommunityIcons name="plus-circle" size={28} color={theme.colors.accent} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {selected.map((name) => {
          const city = CITIES.find((c) => c.name === name);
          if (!city) return null;
          const { time, isNight } = getTimeInCity(city.offset);
          const diff = city.offset - localOffset;
          const diffStr = diff >= 0 ? `+${diff}h` : `${diff}h`;

          return (
            <Card key={name} style={{ marginBottom: 8 }}>
              <Pressable
                style={styles.clockRow}
                onLongPress={() => {
                  lightImpact();
                  setSelected((s) => s.filter((n) => n !== name));
                }}
              >
                <MaterialCommunityIcons
                  name={isNight ? 'weather-night' : 'weather-sunny'}
                  size={24}
                  color={isNight ? theme.colors.textTertiary : theme.colors.warning}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.cityName, { color: theme.colors.text }]}>{city.name}</Text>
                  <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>{city.timezone} • {diffStr}</Text>
                </View>
                <Text style={[styles.timeText, { color: theme.colors.text }]}>{time}</Text>
              </Pressable>
            </Card>
          );
        })}
        {selected.length > 0 && (
          <Text style={{ color: theme.colors.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 8 }}>Long press to remove a city</Text>
        )}
      </ScrollView>

      <Modal visible={showAdd} onClose={() => { setShowAdd(false); setSearch(''); }} title="Add City">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search cities..." />
        <ScrollView style={{ maxHeight: 300, marginTop: 8 }}>
          {filteredCities.map((city) => (
            <Pressable
              key={city.name}
              style={[styles.addRow, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                lightImpact();
                setSelected((s) => [...s, city.name]);
                setShowAdd(false);
                setSearch('');
              }}
            >
              <Text style={{ color: theme.colors.text }}>{city.name}</Text>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>{city.timezone}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  clockRow: { flexDirection: 'row', alignItems: 'center' },
  cityName: { fontSize: 16, fontWeight: '600' },
  timeText: { fontSize: 24, fontWeight: '300', fontVariant: ['tabular-nums'] },
  addRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
