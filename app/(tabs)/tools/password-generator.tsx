import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
  Dimensions,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [length, setLength] = useState(16);
  const [useLower, setUseLower] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const strengthAnim = useRef(new Animated.Value(0)).current;

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
    setHistory((prev) => [pw, ...prev.slice(0, 4)]);

    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [length, useLower, useUpper, useNumbers, useSymbols]);

  useEffect(() => {
    generate();
  }, []);

  const strength = password ? getStrength(password) : { label: 'None', color: '#ccc', percent: 0 };

  useEffect(() => {
    Animated.timing(strengthAnim, {
      toValue: strength.percent,
      duration: 500,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: false,
    }).start();
  }, [strength.percent]);

  const copy = async (textToCopy: string = password) => {
    if (!textToCopy) return;
    await Clipboard.setStringAsync(textToCopy);
    notificationSuccess();
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="TOOLS / SECURITY"
        title="Password Tool"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          <Text style={styles.featuredLabel}>SECURE GENERATOR</Text>
          <Text style={styles.featuredTitle}>{strength.label.toUpperCase()}</Text>
          <Pressable onPress={() => copy()} style={styles.featuredCopy}>
            <MaterialCommunityIcons name="content-copy" size={16} color={theme.colors.accent} />
            <Text style={[styles.featuredCopyText, { color: theme.colors.accent }]}>COPY</Text>
          </Pressable>
        </LinearGradient>

        <View style={[styles.mainCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceSecondary }]}>
          
          {/* Result Section */}
          <View style={styles.section}>
             <View style={styles.cardHeader}>
                <Text style={[styles.label, { color: theme.colors.textTertiary }]}>GENERATED PASSWORD</Text>
                <View style={[styles.strengthBadge, { backgroundColor: strength.color + '20' }]}>
                   <Text style={[styles.strengthBadgeText, { color: strength.color }]}>{strength.percent}%</Text>
                </View>
             </View>
             
             <View style={[styles.pwBox, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Text style={[styles.pwText, { color: theme.colors.text }]} numberOfLines={2}>
                  {password || '••••••••'}
                </Text>
                <View style={styles.strengthBarBg}>
                   <Animated.View 
                    style={[
                      styles.strengthBarFill, 
                      { 
                        backgroundColor: strength.color,
                        width: strengthAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]} 
                   />
                </View>
             </View>
          </View>

          {/* Regenerate Bridge */}
          <View style={styles.buttonBridge}>
            <View style={[styles.divider, { backgroundColor: theme.colors.surfaceSecondary }]} />
            <Animated.View style={[styles.genBtnAnim, { transform: [{ scale: bounceAnim }] }]}>
              <Pressable onPress={generate} style={({ pressed }) => [styles.genBtnPressable, { opacity: pressed ? 0.9 : 1 }]}>
                <LinearGradient colors={theme.palette.gradient as any} style={styles.genGradient}>
                  <MaterialCommunityIcons name="cached" size={24} color="#fff" />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <View style={styles.cardHeader}>
              <Text style={[styles.label, { color: theme.colors.textTertiary }]}>LENGTH: {length}</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lengthPicker}>
              {LENGTHS.map((l) => {
                const active = length === l;
                return (
                  <Pressable 
                    key={l}
                    onPress={() => { selectionFeedback(); setLength(l); }}
                    style={[styles.lengthPill, { backgroundColor: active ? theme.colors.accent : theme.colors.surfaceSecondary }]}
                  >
                    <Text style={[styles.lengthPillText, { color: active ? '#fff' : theme.colors.textSecondary }]}>{l}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.optionsWrap}>
               {[
                 { label: 'Lowercase', value: useLower, set: setUseLower, icon: 'format-lowercase' },
                 { label: 'Uppercase', value: useUpper, set: setUseUpper, icon: 'format-uppercase' },
                 { label: 'Numbers', value: useNumbers, set: setUseNumbers, icon: 'numeric' },
                 { label: 'Symbols', value: useSymbols, set: setUseSymbols, icon: 'at' },
               ].map((opt) => (
                 <View key={opt.label} style={styles.optionRow}>
                    <View style={styles.optionInfo}>
                       <MaterialCommunityIcons name={opt.icon as any} size={16} color={theme.colors.textTertiary} />
                       <Text style={[styles.optionText, { color: theme.colors.textSecondary }]}>{opt.label}</Text>
                    </View>
                    <Switch 
                      value={opt.value} 
                      onValueChange={(val) => { lightImpact(); opt.set(val); }} 
                      trackColor={{ true: theme.colors.accent, false: theme.colors.border }} 
                      thumbColor={Platform.OS === 'ios' ? undefined : '#FFF'}
                      style={Platform.OS === 'ios' ? { transform: [{ scale: 0.8 }] } : { transform: [{ scale: 0.9 }, { translateX: 4 }] }}
                    />
                 </View>
               ))}
            </View>
          </View>
        </View>

        {/* History */}
        {history.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>RECENTLY GENERATED</Text>
            <View style={styles.historyList}>
              {history.map((pw, i) => (
                <Pressable 
                  key={i} 
                  style={[styles.historyItem, { backgroundColor: theme.colors.surface }]}
                  onPress={() => copy(pw)}
                >
                  <Text style={[styles.historyPw, { color: theme.colors.textSecondary }]} numberOfLines={1}>{pw}</Text>
                  <MaterialCommunityIcons name="content-copy" size={14} color={theme.colors.accent} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

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
  featuredCopy: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  featuredCopyText: { fontSize: 12, fontWeight: '700' },

  mainCard: { borderRadius: 32, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 22, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  strengthBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  strengthBadgeText: { fontSize: 11, fontWeight: '900' },

  section: { paddingVertical: 8 },
  pwBox: { padding: 16, borderRadius: 20, alignItems: 'center', minHeight: 80 },
  pwText: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 12, letterSpacing: 1, 
    ...Platform.select({ ios: { fontFamily: 'Courier' }, android: { fontFamily: 'monospace' } })
  },
  strengthBarBg: { height: 4, width: '100%', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 2 },

  buttonBridge: { height: 74, alignItems: 'center', justifyContent: 'center', zIndex: 10, marginVertical: -14 },
  divider: { height: 1, position: 'absolute', top: '50%', left: -22, right: -22, opacity: 0.1 },
  genBtnAnim: { width: 48, height: 48, zIndex: 11 },
  genBtnPressable: { flex: 1, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, borderRadius: 24 },
  genGradient: { flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  lengthPicker: { marginBottom: 16, marginHorizontal: -4 },
  lengthPill: { width: 44, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  lengthPillText: { fontSize: 13, fontWeight: '700' },

  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  optionRow: { width: '48%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  optionInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionText: { fontSize: 12, fontWeight: '600' },

  historyContainer: { marginTop: 24 },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
  historyList: { gap: 8 },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16 },
  historyPw: { fontSize: 13, fontWeight: '600', flex: 1, marginRight: 12, opacity: 0.7,
    ...Platform.select({ ios: { fontFamily: 'Courier' }, android: { fontFamily: 'monospace' } })
  },
});

