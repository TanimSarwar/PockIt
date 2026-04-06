import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { SearchBar, Card, Button } from '../../../components/ui';
import { fetchDictionaryWord } from '../../../lib/api';

interface Definition {
  partOfSpeech: string;
  definitions: { definition: string; example?: string }[];
  synonyms: string[];
}

interface WordResult {
  word: string;
  phonetic?: string;
  meanings: Definition[];
}

export default function DictionaryScreen() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<WordResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await fetchDictionaryWord(query.trim());
      if (data && data.length > 0) {
        setResult(data[0]);
        setRecent((prev) => [query.trim(), ...prev.filter((w) => w !== query.trim()).slice(0, 9)]);
      } else {
        setError('No definition found.');
      }
    } catch {
      setError('Could not look up word. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Dictionary" />
      <View style={{ paddingHorizontal: 16 }}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Look up a word..."
        />
        <Button title="Search" onPress={search} size="sm" style={{ marginTop: 8 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 32 }} />}
        {error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}

        {result && (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.word, { color: theme.colors.text }]}>{result.word}</Text>
            {result.phonetic && <Text style={{ color: theme.colors.textSecondary }}>{result.phonetic}</Text>}

            {result.meanings.map((meaning, mi) => (
              <Card key={mi} style={{ marginTop: 12 }}>
                <Text style={[styles.pos, { color: theme.colors.accent }]}>{meaning.partOfSpeech}</Text>
                {meaning.definitions.slice(0, 5).map((def, di) => (
                  <View key={di} style={styles.defRow}>
                    <Text style={[styles.defNum, { color: theme.colors.textTertiary }]}>{di + 1}.</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text }}>{def.definition}</Text>
                      {def.example && (
                        <Text style={[styles.example, { color: theme.colors.textSecondary }]}>"{def.example}"</Text>
                      )}
                    </View>
                  </View>
                ))}
                {meaning.synonyms.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 12, marginBottom: 4 }}>Synonyms</Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{meaning.synonyms.slice(0, 8).join(', ')}</Text>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {!result && !loading && recent.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.recentTitle, { color: theme.colors.text }]}>Recent Searches</Text>
            {recent.map((w) => (
              <Text
                key={w}
                style={[styles.recentWord, { color: theme.colors.accent }]}
                onPress={() => { setQuery(w); }}
              >
                {w}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  error: { marginTop: 20, textAlign: 'center' },
  word: { fontSize: 28, fontWeight: '700' },
  pos: { fontSize: 14, fontWeight: '600', fontStyle: 'italic', marginBottom: 8 },
  defRow: { flexDirection: 'row', marginBottom: 8, gap: 6 },
  defNum: { fontSize: 14, fontWeight: '600' },
  example: { fontStyle: 'italic', marginTop: 4, fontSize: 13 },
  recentTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  recentWord: { fontSize: 15, paddingVertical: 6 },
});
