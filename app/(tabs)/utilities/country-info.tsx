import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { SearchBar, Card } from '../../../components/ui';
import { lightImpact } from '../../../lib/haptics';

interface Country {
  name: string; flag: string; capital: string; population: string; region: string; currency: string; languages: string;
}

const COUNTRIES: Country[] = [
  { name: 'United States', flag: '🇺🇸', capital: 'Washington D.C.', population: '331M', region: 'Americas', currency: 'USD ($)', languages: 'English' },
  { name: 'United Kingdom', flag: '🇬🇧', capital: 'London', population: '67M', region: 'Europe', currency: 'GBP (£)', languages: 'English' },
  { name: 'France', flag: '🇫🇷', capital: 'Paris', population: '67M', region: 'Europe', currency: 'EUR (€)', languages: 'French' },
  { name: 'Germany', flag: '🇩🇪', capital: 'Berlin', population: '83M', region: 'Europe', currency: 'EUR (€)', languages: 'German' },
  { name: 'Japan', flag: '🇯🇵', capital: 'Tokyo', population: '126M', region: 'Asia', currency: 'JPY (¥)', languages: 'Japanese' },
  { name: 'China', flag: '🇨🇳', capital: 'Beijing', population: '1.4B', region: 'Asia', currency: 'CNY (¥)', languages: 'Mandarin' },
  { name: 'India', flag: '🇮🇳', capital: 'New Delhi', population: '1.4B', region: 'Asia', currency: 'INR (₹)', languages: 'Hindi, English' },
  { name: 'Brazil', flag: '🇧🇷', capital: 'Brasília', population: '213M', region: 'Americas', currency: 'BRL (R$)', languages: 'Portuguese' },
  { name: 'Australia', flag: '🇦🇺', capital: 'Canberra', population: '26M', region: 'Oceania', currency: 'AUD ($)', languages: 'English' },
  { name: 'Canada', flag: '🇨🇦', capital: 'Ottawa', population: '38M', region: 'Americas', currency: 'CAD ($)', languages: 'English, French' },
  { name: 'Mexico', flag: '🇲🇽', capital: 'Mexico City', population: '129M', region: 'Americas', currency: 'MXN ($)', languages: 'Spanish' },
  { name: 'South Korea', flag: '🇰🇷', capital: 'Seoul', population: '52M', region: 'Asia', currency: 'KRW (₩)', languages: 'Korean' },
  { name: 'Italy', flag: '🇮🇹', capital: 'Rome', population: '60M', region: 'Europe', currency: 'EUR (€)', languages: 'Italian' },
  { name: 'Spain', flag: '🇪🇸', capital: 'Madrid', population: '47M', region: 'Europe', currency: 'EUR (€)', languages: 'Spanish' },
  { name: 'Russia', flag: '🇷🇺', capital: 'Moscow', population: '144M', region: 'Europe', currency: 'RUB (₽)', languages: 'Russian' },
  { name: 'Turkey', flag: '🇹🇷', capital: 'Ankara', population: '85M', region: 'Asia', currency: 'TRY (₺)', languages: 'Turkish' },
  { name: 'Saudi Arabia', flag: '🇸🇦', capital: 'Riyadh', population: '35M', region: 'Asia', currency: 'SAR (﷼)', languages: 'Arabic' },
  { name: 'South Africa', flag: '🇿🇦', capital: 'Pretoria', population: '60M', region: 'Africa', currency: 'ZAR (R)', languages: 'Zulu, English, Afrikaans' },
  { name: 'Nigeria', flag: '🇳🇬', capital: 'Abuja', population: '211M', region: 'Africa', currency: 'NGN (₦)', languages: 'English' },
  { name: 'Egypt', flag: '🇪🇬', capital: 'Cairo', population: '102M', region: 'Africa', currency: 'EGP (£)', languages: 'Arabic' },
  { name: 'Argentina', flag: '🇦🇷', capital: 'Buenos Aires', population: '45M', region: 'Americas', currency: 'ARS ($)', languages: 'Spanish' },
  { name: 'Thailand', flag: '🇹🇭', capital: 'Bangkok', population: '70M', region: 'Asia', currency: 'THB (฿)', languages: 'Thai' },
  { name: 'Singapore', flag: '🇸🇬', capital: 'Singapore', population: '6M', region: 'Asia', currency: 'SGD ($)', languages: 'English, Mandarin, Malay, Tamil' },
  { name: 'Switzerland', flag: '🇨🇭', capital: 'Bern', population: '9M', region: 'Europe', currency: 'CHF (Fr)', languages: 'German, French, Italian' },
  { name: 'Sweden', flag: '🇸🇪', capital: 'Stockholm', population: '10M', region: 'Europe', currency: 'SEK (kr)', languages: 'Swedish' },
];

const REGIONS = ['All', 'Americas', 'Europe', 'Asia', 'Africa', 'Oceania'];

export default function CountryInfoScreen() {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = COUNTRIES.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchRegion = region === 'All' || c.region === region;
    return matchSearch && matchRegion;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Country Info" />
      <View style={{ paddingHorizontal: 16 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search countries..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 4 }}>
          {REGIONS.map((r) => (
            <Pressable
              key={r}
              style={[styles.regionChip, { backgroundColor: region === r ? theme.colors.accent : theme.colors.surface }]}
              onPress={() => { lightImpact(); setRegion(r); }}
            >
              <Text style={{ color: region === r ? '#fff' : theme.colors.textSecondary, fontWeight: '600', fontSize: 12 }}>{r}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((c) => (
          <Pressable key={c.name} onPress={() => setExpanded(expanded === c.name ? null : c.name)}>
            <Card style={{ marginBottom: 8 }}>
              <View style={styles.countryRow}>
                <Text style={styles.flag}>{c.flag}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.countryName, { color: theme.colors.text }]}>{c.name}</Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{c.capital} • {c.region}</Text>
                </View>
              </View>
              {expanded === c.name && (
                <View style={[styles.details, { borderTopColor: theme.colors.border }]}>
                  {[
                    ['Population', c.population],
                    ['Currency', c.currency],
                    ['Languages', c.languages],
                  ].map(([label, value]) => (
                    <View key={label} style={styles.detailRow}>
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 13 }}>{label}</Text>
                      <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '500' }}>{value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  regionChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, marginRight: 6 },
  countryRow: { flexDirection: 'row', alignItems: 'center' },
  flag: { fontSize: 32 },
  countryName: { fontSize: 16, fontWeight: '600' },
  details: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
