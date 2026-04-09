import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui';
import { lightImpact, mediumImpact, notificationSuccess } from '../../../lib/haptics';

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function ColorPickerScreen() {
  const { theme } = useTheme();
  const [r, setR] = useState(99);
  const [g, setG] = useState(102);
  const [b, setB] = useState(241);
  const [hexInput, setHexInput] = useState('#6366F1');

  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);

  const handleHexChange = (text: string) => {
    setHexInput(text);
    const rgb = hexToRgb(text);
    if (rgb) { setR(rgb.r); setG(rgb.g); setB(rgb.b); }
  };

  const handleSlider = (channel: 'r' | 'g' | 'b', val: number) => {
    const v = Math.round(val);
    if (channel === 'r') setR(v);
    else if (channel === 'g') setG(v);
    else setB(v);
    setHexInput(rgbToHex(channel === 'r' ? v : r, channel === 'g' ? v : g, channel === 'b' ? v : b));
  };

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    notificationSuccess();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="TOOLS / DESIGN" 
         title="Color Picker" 
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.preview, { backgroundColor: hex, borderRadius: 16 }]} />

        <Card style={{ marginTop: 16 }}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>HEX</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.hexInput, { color: theme.colors.text, backgroundColor: theme.colors.surfaceSecondary }]}
              value={hexInput}
              onChangeText={handleHexChange}
              maxLength={7}
              autoCapitalize="characters"
            />
            <Pressable onPress={() => copy(hex)} accessibilityLabel="Copy HEX">
              <MaterialCommunityIcons name="content-copy" size={20} color={theme.colors.accent} />
            </Pressable>
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>RGB</Text>
          {[
            { label: 'R', value: r, color: '#EF4444', set: (v: number) => handleSlider('r', v) },
            { label: 'G', value: g, color: '#22C55E', set: (v: number) => handleSlider('g', v) },
            { label: 'B', value: b, color: '#3B82F6', set: (v: number) => handleSlider('b', v) },
          ].map((ch) => (
            <View key={ch.label} style={styles.sliderRow}>
              <Text style={[styles.channelLabel, { color: ch.color }]}>{ch.label}</Text>
              <View style={styles.sliderContainer}>
                <View style={[styles.sliderTrack, { backgroundColor: theme.colors.border }]}>
                  <View style={[styles.sliderFill, { width: `${(ch.value / 255) * 100}%`, backgroundColor: ch.color }]} />
                </View>
              </View>
              <Text style={[styles.channelValue, { color: theme.colors.text }]}>{ch.value}</Text>
            </View>
          ))}
          <Pressable onPress={() => copy(`rgb(${r}, ${g}, ${b})`)} style={styles.copyRow}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>rgb({r}, {g}, {b})</Text>
            <MaterialCommunityIcons name="content-copy" size={16} color={theme.colors.accent} />
          </Pressable>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>HSL</Text>
          <Pressable onPress={() => copy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)} style={styles.copyRow}>
            <Text style={{ color: theme.colors.text, fontSize: 16 }}>hsl({hsl.h}°, {hsl.s}%, {hsl.l}%)</Text>
            <MaterialCommunityIcons name="content-copy" size={16} color={theme.colors.accent} />
          </Pressable>
        </Card>

        {/* Quick touch color grid */}
        <View style={[styles.presetGrid, { marginTop: 16 }]}>
          {['#EF4444','#F59E0B','#22C55E','#3B82F6','#8B5CF6','#EC4899','#06B6D4','#F97316','#14B8A6','#6366F1','#000000','#FFFFFF'].map((c) => (
            <Pressable
              key={c}
              style={[styles.presetColor, { backgroundColor: c, borderWidth: c === '#FFFFFF' ? 1 : 0, borderColor: theme.colors.border }]}
              onPress={() => {
                lightImpact();
                const rgb = hexToRgb(c);
                if (rgb) { setR(rgb.r); setG(rgb.g); setB(rgb.b); setHexInput(c); }
              }}
              accessibilityLabel={`Select color ${c}`}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  preview: { height: 120, width: '100%' },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hexInput: { fontSize: 24, fontWeight: '700', fontFamily: 'monospace', flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  channelLabel: { fontSize: 16, fontWeight: '700', width: 20 },
  sliderContainer: { flex: 1, height: 8 },
  sliderTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  sliderFill: { height: '100%', borderRadius: 4 },
  channelValue: { width: 32, textAlign: 'right', fontWeight: '600' },
  copyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  presetColor: { width: 40, height: 40, borderRadius: 20 },
});
