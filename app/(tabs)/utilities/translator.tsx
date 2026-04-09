import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator, Platform, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { fetchTranslation } from '../../../lib/api';
import { lightImpact, selectionFeedback, notificationSuccess } from '../../../lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';

const LANGUAGES = [
  { code: 'Autodetect', name: 'Auto' },
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'Bengali' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ru', name: 'Russian' },
];

export default function TranslatorScreen() {
  const { theme } = useTheme();
  const [from, setFrom] = useState('Autodetect');
  const [to, setTo] = useState('es');
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [detected, setDetected] = useState('');
  const [loading, setLoading] = useState(false);
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.12, duration: 1000, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setDetected('');
    try {
      const data = await fetchTranslation(text.trim(), from, to);
      setResult(data?.translatedText || 'Translation unavailable');
      if (data?.detectedLanguage) {
        setDetected(data.detectedLanguage);
      }
    } catch {
      setResult('Error — check your connection');
    } finally {
      setLoading(false);
    }
  };


  const copy = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result);
    notificationSuccess();
  };

  const speak = () => {
    if (!result) return;
    Speech.speak(result, {
      language: to,
      pitch: 1.0,
      rate: 0.9,
    });
  };

  return <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="UTILITIES / TOOLS" 
         title="Translator" 
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceSecondary }]}>
          {/* Source Section */}
          <View style={styles.section}>
            <View style={styles.cardHeader}>
              <Text style={[styles.label, { color: theme.colors.textTertiary }]}>FROM</Text>
              <View style={[styles.langBadge, { backgroundColor: theme.colors.accentMuted }]}>
                <Text style={[styles.langBadgeText, { color: theme.colors.accent }]}>
                  {LANGUAGES.find(l => l.code === from)?.name.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.langPickerWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langPicker}>
                {LANGUAGES.map((l) => (
                  <Pressable
                    key={l.code}
                    style={[
                      styles.langPill, 
                      { backgroundColor: from === l.code ? theme.colors.accent : theme.colors.surfaceSecondary }
                    ]}
                    onPress={() => { 
                      selectionFeedback(); 
                      setFrom(l.code); 
                      if (l.code === to) {
                        setTo(l.code === 'en' ? 'es' : 'en');
                      }
                    }}
                  >
                    <Text style={[styles.langPillText, { color: from === l.code ? '#fff' : theme.colors.textSecondary }]}>
                      {l.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

              <View style={[styles.inputWrap, { backgroundColor: theme.colors.surfaceSecondary }]}>
                 <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  value={text}
                  onChangeText={setText}
                  placeholder="What would you like to translate?"
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                />
                <View style={styles.inputHint}>
                  <MaterialCommunityIcons name="microphone" size={16} color={theme.colors.textTertiary} />
                  <Text style={[styles.hintText, { color: theme.colors.textTertiary }]}>Use keyboard for voice</Text>
                </View>
              </View>
          </View>

          {/* Button Interaction Area */}
          <View style={styles.buttonBridge}>
            <View style={[styles.divider, { backgroundColor: theme.colors.surfaceSecondary }]} />
            <Animated.View style={[styles.blendedBtnAnim, { transform: [{ scale: bounceAnim }] }]}>
              <Pressable 
                onPress={translate}
                style={({ pressed }) => [styles.blendedBtnPressable, { opacity: pressed ? 0.9 : 1 }]}
              >
                 <LinearGradient 
                  colors={theme.palette.gradient as any} 
                  style={styles.blendedGradient}
                 >
                    {loading 
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <MaterialCommunityIcons name="translate" size={20} color="#fff" />
                    }
                 </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          {/* Target Section */}
          <View style={styles.section}>
            <View style={styles.cardHeader}>
              <Text style={[styles.label, { color: theme.colors.textTertiary }]}>TO</Text>
              <View style={[styles.langBadge, { backgroundColor: theme.colors.accentMuted }]}>
                <Text style={[styles.langBadgeText, { color: theme.colors.accent }]}>
                  {LANGUAGES.find(l => l.code === to)?.name.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.langPickerWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langPicker}>
                {LANGUAGES.filter(l => l.code !== 'Autodetect' && l.code !== from).map((l) => (
                  <Pressable
                    key={l.code}
                    style={[
                      styles.langPill, 
                      { backgroundColor: to === l.code ? theme.colors.accent : theme.colors.surfaceSecondary }
                    ]}
                    onPress={() => { selectionFeedback(); setTo(l.code); }}
                  >
                    <Text style={[styles.langPillText, { color: to === l.code ? '#fff' : theme.colors.textSecondary }]}>
                      {l.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.resultArea, { backgroundColor: theme.colors.surfaceSecondary }]}>
              <Text style={[styles.resultText, { color: result ? theme.colors.text : theme.colors.textTertiary }]}>
                {result || 'The translation will appear here...'}
              </Text>
              {result && (
                 <View style={styles.resultActions}>
                   {from === 'Autodetect' && detected && (
                      <View style={[styles.detectBadge, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.surfaceTertiary }]}>
                         <MaterialCommunityIcons name="auto-fix" size={10} color={theme.colors.accent} />
                         <Text style={[styles.detectText, { color: theme.colors.textSecondary }]}>
                           {LANGUAGES.find(l => l.code === detected)?.name.toUpperCase() || detected.toUpperCase()}
                         </Text>
                      </View>
                   )}
                   <View style={styles.row}>
                     <Pressable 
                      onPress={speak} 
                      style={({ pressed }) => [
                        styles.copyBtn, 
                        { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.surfaceTertiary, borderWidth: 1, opacity: pressed ? 0.8 : 1 }
                      ]}
                     >
                       <MaterialCommunityIcons name="volume-high" size={14} color={theme.colors.textSecondary} />
                       <Text style={[styles.copyBtnText, { color: theme.colors.textSecondary }]}>SPEAK</Text>
                     </Pressable>

                     <Pressable 
                      onPress={copy} 
                      style={({ pressed }) => [
                        styles.copyBtn, 
                        { backgroundColor: theme.colors.accent, opacity: pressed ? 0.8 : 1 }
                      ]}
                     >
                       <MaterialCommunityIcons name="content-copy" size={14} color="#fff" />
                       <Text style={styles.copyBtnText}>COPY</Text>
                     </Pressable>
                   </View>
                 </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  
  mainCard: { borderRadius: 32, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 22, marginBottom: 10, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  langBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  langBadgeText: { fontSize: 11, fontWeight: '900' },
  
  langPickerWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginHorizontal: -4 },
  langPicker: { flex: 1 },
  langPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8 },
  langPillText: { fontSize: 13, fontWeight: '700' },
  
  unifiedCardWrapper: { zIndex: 1 },
  divider: { height: 1, marginHorizontal: -18, opacity: 0.1, position: 'absolute', top: '50%', left: 0, right: 0 },
  section: { paddingVertical: 8 },
  
  buttonBridge: { height: 74, alignItems: 'center', justifyContent: 'center', zIndex: 10, marginVertical: -14 },
  blendedBtnAnim: { width: 48, height: 48, zIndex: 11 },
  blendedBtnPressable: { flex: 1, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, borderRadius: 24 },
  blendedGradient: { flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  inputWrap: { padding: 16, borderRadius: 20, minHeight: 110, justifyContent: 'space-between' },
  inputHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, opacity: 0.6 },
  hintText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  textInput: { flex: 1, fontSize: 16, lineHeight: 24, fontWeight: '600', 
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  
  translateBtn: { flex: 1, height: 50, borderRadius: 16, overflow: 'hidden' },
  gradientBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  
  row: { flexDirection: 'row', gap: 8 },
  resultArea: { padding: 16, borderRadius: 20, minHeight: 110, justifyContent: 'space-between' },
  resultText: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginBottom: 40 },
  resultActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', bottom: 12, left: 12, right: 12 },
  detectBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  detectText: { fontSize: 11, fontWeight: '900' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  copyBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
});
