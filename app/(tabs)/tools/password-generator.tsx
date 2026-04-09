import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, mediumImpact, notificationSuccess, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');

const CHARS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

const LENGTHS = [8, 12, 16, 24, 32, 48];

function getStrength(pw: string): { label: string; color: string; percent: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  
  if (score <= 2) return { label: 'Weak', color: '#EF4444', percent: 25 };
  if (score <= 3) return { label: 'Fair', color: '#F59E0B', percent: 50 };
  if (score <= 4) return { label: 'Strong', color: '#10B981', percent: 75 };
  return { label: 'Very Strong', color: '#059669', percent: 100 };
}

export default function PasswordGeneratorScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [length, setLength] = useState(16);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const generate = useCallback(() => {
    mediumImpact();
    let pool = '';
    if (useLower) pool += CHARS.lower;
    if (useUpper) pool += CHARS.upper;
    if (useNumbers) pool += CHARS.numbers;
    if (useSymbols) pool += CHARS.symbols;
    if (!pool) pool = CHARS.lower;

    let pw = '';
    for (let i = 0; i < length; i++) {
        const randIndex = Math.floor(Math.random() * pool.length);
        pw += pool[randIndex];
    }
    setPassword(pw);
    setHistory((prev) => [pw, ...prev.slice(0, 5)]);
  }, [length, useLower, useUpper, useNumbers, useSymbols]);

  // Generate initial password
  useEffect(() => {
    generate();
  }, []);

  const copy = async (textToCopy: string = password) => {
    if (!textToCopy) return;
    await Clipboard.setStringAsync(textToCopy);
    notificationSuccess();
  };

  const strength = password ? getStrength(password) : null;

  return (
    <View style={[s.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="TOOLS / SECURITY"
        title="Password Tool"
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        {/* ── Result Card ── */}
        <View style={[s.resultCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[s.pwContainer, { backgroundColor: theme.colors.surfaceTertiary }]}>
            <Text style={[s.passwordText, { color: theme.colors.text }]} numberOfLines={2}>
              {password || '••••••••'}
            </Text>
          </View>

          {strength && (
            <View style={s.strengthBox}>
              <View style={s.strengthHeader}>
                <Text style={[s.strengthLabel, { color: theme.colors.textTertiary }]}>STRENGTH: <Text style={{ color: strength.color }}>{strength.label.toUpperCase()}</Text></Text>
                <Text style={[s.strengthVal, { color: strength.color }]}>{strength.percent}%</Text>
              </View>
              <View style={[s.barBg, { backgroundColor: theme.colors.border }]}>
                <View style={[s.barFill, { width: `${strength.percent}%`, backgroundColor: strength.color }]} />
              </View>
            </View>
          )}

          <View style={s.actionGrid}>
            <Pressable 
              style={[s.mainBtn, { backgroundColor: theme.colors.accent }]}
              onPress={generate}
            >
              <MaterialCommunityIcons name="cached" size={20} color="#FFF" />
              <Text style={s.mainBtnTxt}>Regenerate</Text>
            </Pressable>
            <Pressable 
              style={[s.iconBtn, { backgroundColor: theme.colors.surfaceTertiary }]}
              onPress={() => copy()}
            >
              <MaterialCommunityIcons name="content-copy" size={20} color={theme.colors.accent} />
            </Pressable>
          </View>
        </View>

        {/* ── Settings Card ── */}
        <View style={[s.settingsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[s.sectionHeader, { color: theme.colors.text }]}>Length: {length}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.lengthScroll}>
            {LENGTHS.map((l) => {
              const active = length === l;
              return (
                <Pressable 
                  key={l}
                  onPress={() => { selectionFeedback(); setLength(l); }}
                  style={[s.lengthPill, { backgroundColor: theme.colors.surfaceTertiary }, active && { backgroundColor: theme.colors.accent }]}
                >
                  <Text style={[s.lengthTxt, { color: theme.colors.textSecondary }, active && { color: '#FFF' }]}>{l}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={s.divider} />

          <Text style={[s.sectionHeader, { color: theme.colors.text, marginBottom: 12 }]}>Complexity</Text>
          {[
            { label: 'Lowercase (a-z)', value: useLower, set: setUseLower, icon: 'format-letter-lowercase' },
            { label: 'Uppercase (A-Z)', value: useUpper, set: setUseUpper, icon: 'format-letter-uppercase' },
            { label: 'Numbers (0-9)', value: useNumbers, set: setUseNumbers, icon: 'numeric' },
            { label: 'Symbols (!@#$)', value: useSymbols, set: setUseSymbols, icon: 'at' },
          ].map((opt) => (
            <View key={opt.label} style={s.optionRow}>
              <View style={s.optionLeading}>
                <MaterialCommunityIcons name={opt.icon as any} size={18} color={theme.colors.textTertiary} />
                <Text style={[s.optionLabel, { color: theme.colors.textSecondary }]}>{opt.label}</Text>
              </View>
              <Switch 
                value={opt.value} 
                onValueChange={opt.set} 
                trackColor={{ true: theme.colors.accent, false: theme.colors.border }} 
                thumbColor={Platform.OS === 'ios' ? undefined : (opt.value ? '#FFF' : '#F4F4F4')}
              />
            </View>
          ))}
        </View>

        {/* ── History ── */}
        {history.length > 0 && (
          <View style={s.historySection}>
            <Text style={[s.historyTitle, { color: theme.colors.text }]}>Recently Generated</Text>
            {history.map((pw, i) => (
              <Pressable 
                key={i} 
                style={[s.histItem, { backgroundColor: theme.colors.surface }]}
                onPress={() => copy(pw)}
              >
                <Text style={[s.histPw, { color: theme.colors.textSecondary }]} numberOfLines={1}>{pw}</Text>
                <MaterialCommunityIcons name="content-copy" size={14} color={theme.colors.accent} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  scroll:     { paddingHorizontal: 20, paddingBottom: 100 },


  resultCard: { borderRadius: 30, padding: 24, marginBottom: 20,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20 }, android: { elevation: 6 } })
  },
  pwContainer: { borderRadius: 20, padding: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  passwordText: { fontSize: 22, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', textAlign: 'center', letterSpacing: 0.5 },

  strengthBox: { marginBottom: 24 },
  strengthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  strengthLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  strengthVal: { fontSize: 13, fontWeight: '800' },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  actionGrid: { flexDirection: 'row', gap: 12 },
  mainBtn: { flex: 1, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  mainBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  iconBtn: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  settingsCard: { borderRadius: 24, padding: 20, marginBottom: 24 },
  sectionHeader: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
  lengthScroll: { marginHorizontal: -4, marginBottom: 4 },
  lengthPill: { width: 54, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  lengthTxt: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  optionLeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionLabel: { fontSize: 14, fontWeight: '600' },

  historySection: { },
  historyTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12, opacity: 0.7 },
  histItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  histPw: { fontSize: 13, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', flex: 1, marginRight: 10 },
});
