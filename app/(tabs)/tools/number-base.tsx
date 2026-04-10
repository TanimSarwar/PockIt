import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { PockItInput } from '../../../components/ui/Input';
import { lightImpact, selectionFeedback, notificationSuccess } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');

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
  const bounceAnim = useRef(new Animated.Value(1)).current;

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

  const handleBaseChange = (base: number) => {
    selectionFeedback();
    setSelectedBase(base);
    setInput('');
    
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
        category="TOOLS / MATH" 
        title="Base Converter" 
      />
      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          <Text style={styles.featuredLabel}>NUMBER SYSTEM CONVERTER</Text>
          <Text style={styles.featuredTitle}>{BASES.find(b => b.base === selectedBase)?.label.toUpperCase()}</Text>
          <View style={styles.featuredBadge}>
            <MaterialCommunityIcons name="calculator-variant" size={14} color={theme.colors.accent} />
            <Text style={[styles.featuredBadgeText, { color: theme.colors.accent }]}>
              Base {selectedBase}
            </Text>
          </View>
        </LinearGradient>

        <View style={[styles.mainCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceSecondary }]}>
          
          {/* Input Section */}
          <View style={styles.section}>
            <View style={styles.cardHeader}>
              <Text style={[styles.label, { color: theme.colors.textTertiary }]}>INPUT VALUE</Text>
              <View style={[styles.baseIndicator, { backgroundColor: theme.colors.accentMuted }]}>
                <Text style={[styles.baseIndicatorText, { color: theme.colors.accent }]}>BASE {selectedBase}</Text>
              </View>
            </View>

            <View style={styles.basePickerWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.basePicker}>
                {BASES.map((b) => {
                  const active = b.base === selectedBase;
                  return (
                    <Pressable
                      key={b.base}
                      onPress={() => handleBaseChange(b.base)}
                      style={[styles.basePill, { backgroundColor: active ? theme.colors.accent : theme.colors.surfaceSecondary }]}
                    >
                      <Text style={[styles.basePillText, { color: active ? '#fff' : theme.colors.textSecondary }]}>{b.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
              <PockItInput
                value={input}
                onChangeText={setInput}
                placeholder="0"
                keyboardType={selectedBase === 10 ? 'numeric' : 'default'}
                autoCapitalize="characters"
                icon={<MaterialCommunityIcons name="format-list-numbered" size={20} color={theme.colors.accent} />}
                containerStyle={styles.inputContainer}
              />
            </Animated.View>
            
            {!isValid && input.length > 0 && (
              <Text style={[styles.error, { color: theme.colors.error }]}>Invalid input for base {selectedBase}</Text>
            )}
          </View>

          {/* Results Section */}
          <View style={[styles.section, { marginTop: 12 }]}>
            <Text style={[styles.label, { color: theme.colors.textTertiary, marginBottom: 16 }]}>CONVERSIONS</Text>
            
            <View style={styles.resultsList}>
              {conversions.map((c) => (
                <Pressable 
                  key={c.base} 
                  onPress={() => copyValue(c.value)}
                  style={({ pressed }) => [
                    styles.resultItem, 
                    { backgroundColor: theme.colors.surfaceSecondary, opacity: pressed ? 0.8 : 1 }
                  ]}
                >
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>{c.label.toUpperCase()}</Text>
                    <Text style={[styles.resultValue, { color: theme.colors.text }]} numberOfLines={1}>
                      {c.prefix}<Text style={{ fontWeight: '800', color: theme.colors.accent }}>{c.value}</Text>
                    </Text>
                  </View>
                  <View style={[styles.copyIcon, { backgroundColor: theme.colors.surfaceTertiary }]}>
                    <MaterialCommunityIcons name="content-copy" size={14} color={theme.colors.textTertiary} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

        </View>

        <View style={styles.infoCard}>
           <MaterialCommunityIcons name="information" size={14} color={theme.colors.textTertiary} />
           <Text style={[styles.infoText, { color: theme.colors.textTertiary }]}>
             Prefixes indicate the standard notation for each base.
           </Text>
        </View>
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  featuredCard: { borderRadius: 24, padding: 20, marginBottom: 20, minHeight: 100, justifyContent: 'center', alignItems: 'center' },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  featuredTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 12 },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  featuredBadgeText: { fontSize: 12, fontWeight: '700' },

  mainCard: { borderRadius: 32, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 22, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  baseIndicator: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  baseIndicatorText: { fontSize: 10, fontWeight: '900' },

  section: { paddingVertical: 8 },
  basePickerWrapper: { marginBottom: 16, marginHorizontal: -4 },
  basePicker: { flex: 1 },
  basePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginRight: 8, minWidth: 60, alignItems: 'center' },
  basePillText: { fontSize: 12, fontWeight: '700' },

  inputContainer: { marginBottom: 4 },
  error: { fontSize: 11, fontWeight: '600', marginLeft: 4, marginTop: 4 },

  resultsList: { gap: 10 },
  resultItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16 },
  resultInfo: { flex: 1 },
  resultLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  resultValue: { fontSize: 18, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  copyIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  infoCard: { marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  infoText: { fontSize: 11, fontWeight: '600' },
});

