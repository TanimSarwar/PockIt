import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card, Button } from '../../../components/ui';
import { fetchTranslation } from '../../../lib/api';
import { lightImpact, notificationSuccess } from '../../../lib/haptics';

const LANGUAGES = [
  { code: 'en', name: 'English' },
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
  const [from, setFrom] = useState('en');
  const [to, setTo] = useState('es');
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const translate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await fetchTranslation(text.trim(), from, to);
      setResult(data?.translatedText || 'Translation unavailable');
    } catch {
      setResult('Error — check your connection');
    } finally {
      setLoading(false);
    }
  };

  const swap = () => {
    lightImpact();
    const tmp = from;
    setFrom(to);
    setTo(tmp);
    setText(result);
    setResult(text);
  };

  const copy = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result);
    notificationSuccess();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Translator" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Language selectors */}
        <View style={styles.langRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {LANGUAGES.map((l) => (
              <Pressable
                key={l.code}
                style={[styles.langChip, { backgroundColor: from === l.code ? theme.colors.accent : theme.colors.surface }]}
                onPress={() => { lightImpact(); setFrom(l.code); }}
              >
                <Text style={{ color: from === l.code ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '600' }}>{l.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <TextInput
          style={[styles.textInput, { color: theme.colors.text, backgroundColor: theme.colors.surface }]}
          value={text}
          onChangeText={setText}
          placeholder="Enter text to translate..."
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          textAlignVertical="top"
          underlineColorAndroid="transparent"
        />

        <View style={styles.midRow}>
          <Pressable onPress={swap} style={[styles.swapBtn, { backgroundColor: theme.colors.accentMuted }]} accessibilityLabel="Swap languages">
            <MaterialCommunityIcons name="swap-vertical" size={24} color={theme.colors.accent} />
          </Pressable>
          <Button title="Translate" onPress={translate} style={{ flex: 1 }} />
        </View>

        {/* Target language */}
        <View style={styles.langRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {LANGUAGES.map((l) => (
              <Pressable
                key={l.code}
                style={[styles.langChip, { backgroundColor: to === l.code ? theme.colors.accent : theme.colors.surface }]}
                onPress={() => { lightImpact(); setTo(l.code); }}
              >
                <Text style={{ color: to === l.code ? '#fff' : theme.colors.text, fontSize: 12, fontWeight: '600' }}>{l.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Card style={{ marginTop: 8 }}>
          {loading ? (
            <ActivityIndicator color={theme.colors.accent} />
          ) : (
            <>
              <Text style={[styles.resultText, { color: theme.colors.text }]}>{result || 'Translation will appear here'}</Text>
              {result && (
                <Pressable onPress={copy} style={styles.copyBtn} accessibilityLabel="Copy translation">
                  <MaterialCommunityIcons name="content-copy" size={18} color={theme.colors.accent} />
                  <Text style={{ color: theme.colors.accent, fontSize: 13, marginLeft: 4 }}>Copy</Text>
                </Pressable>
              )}
            </>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  langRow: { marginBottom: 8 },
  langChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 6 },
  textInput: { height: 100, borderWidth: 0, borderRadius: 12, padding: 12, fontSize: 16, lineHeight: 22,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  midRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 },
  swapBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  resultText: { fontSize: 16, lineHeight: 24 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, alignSelf: 'flex-end' },
});
