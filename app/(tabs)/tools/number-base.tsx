import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Input, Card } from '../../../components/ui';
import { lightImpact, notificationSuccess } from '../../../lib/haptics';

const BASES = [
  { label: 'Binary', base: 2, prefix: '0b' },
  { label: 'Octal', base: 8, prefix: '0o' },
  { label: 'Decimal', base: 10, prefix: '' },
  { label: 'Hexadecimal', base: 16, prefix: '0x' },
];

export default function NumberBaseScreen() {
  const { theme } = useTheme();
  const [selectedBase, setSelectedBase] = useState(10);
  const [input, setInput] = useState('');

  const parsed = parseInt(input, selectedBase);
  const isValid = !isNaN(parsed) && input.length > 0;

  const conversions = BASES.map((b) => ({
    ...b,
    value: isValid ? parsed.toString(b.base).toUpperCase() : '—',
  }));

  const copyValue = async (value: string) => {
    if (value === '—') return;
    await Clipboard.setStringAsync(value);
    notificationSuccess();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
        category="TOOLS / MATH" 
        title="Base Converter" 
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.baseRow}>
          {BASES.map((b) => (
            <Pressable
              key={b.base}
              style={[styles.baseBtn, { backgroundColor: selectedBase === b.base ? theme.colors.accent : theme.colors.surface }]}
              onPress={() => { lightImpact(); setSelectedBase(b.base); setInput(''); }}
              accessibilityLabel={b.label}
            >
              <Text style={{ color: selectedBase === b.base ? '#fff' : theme.colors.text, fontWeight: '600', fontSize: 13 }}>{b.label}</Text>
            </Pressable>
          ))}
        </View>

        <Input
          label={`Enter ${BASES.find(b => b.base === selectedBase)?.label} number`}
          value={input}
          onChangeText={setInput}
          placeholder="0"
          keyboardType={selectedBase === 10 ? 'numeric' : 'default'}
          autoCapitalize="characters"
        />

        {!isValid && input.length > 0 && (
          <Text style={[styles.error, { color: theme.colors.error }]}>Invalid input for base {selectedBase}</Text>
        )}

        <View style={{ marginTop: 20, gap: 8 }}>
          {conversions.map((c) => (
            <Card key={c.base}>
              <View style={styles.resultRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>{c.label}</Text>
                  <Text style={[styles.resultValue, { color: theme.colors.text }]}>{c.prefix}{c.value}</Text>
                </View>
                <Pressable onPress={() => copyValue(c.value)} accessibilityLabel={`Copy ${c.label}`}>
                  <MaterialCommunityIcons name="content-copy" size={20} color={theme.colors.accent} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  baseRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  baseBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  error: { fontSize: 13, marginTop: 4 },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  resultLabel: { fontSize: 12, marginBottom: 4 },
  resultValue: { fontSize: 18, fontWeight: '600', fontFamily: 'monospace' },
});
