import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { SearchBar } from '../../../components/ui/SearchBar';
import { fetchDictionaryWord } from '../../../lib/api';
import { lightImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const RECENT_CARD_W = (SW - 44) / 3;

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
    lightImpact();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await fetchDictionaryWord(query.trim());
      if (data && data.meanings) {
        setResult(data);
        setRecent((prev) => [query.trim(), ...prev.filter((w) => w !== query.trim()).slice(0, 8)]);
      } else {
        setError('No definition found.');
      }
    } catch {
      setError('Could not look up word.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="UTILITIES / TOOLS" 
         title="Dictionary" 
      />

      {/* Integrated Search Bar - Blended UI */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a word..."
          onSearch={search}
          containerStyle={{ backgroundColor: theme.colors.surface, elevation: 2, borderRadius: 24, height: 56 }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {loading && <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 32 }} />}
        {error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}

        {result && (
          <View style={{ marginTop: 12 }}>
            <View style={[styles.defCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceSecondary }]}>
              {/* Word Title & Phonetic */}
              <View style={styles.resultHeader}>
                <Text style={[styles.resultWord, { color: theme.colors.text }]}>{result.word}</Text>
                {result.phonetic && (
                  <View style={styles.phoneticRow}>
                    <MaterialCommunityIcons name="volume-high" size={16} color={theme.colors.accent} />
                    <Text style={[styles.phoneticText, { color: theme.colors.textSecondary }]}>{result.phonetic}</Text>
                  </View>
                )}
              </View>

              {result.meanings.map((meaning, mi) => (
                <View key={mi} style={[styles.meaningSection, mi > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16 }]}>
                  <View style={styles.posRow}>
                    <Text style={[styles.posLabel, { color: theme.colors.textTertiary }]}>PART OF SPEECH</Text>
                    <Text style={[styles.posValue, { color: theme.colors.accent }]}>{meaning.partOfSpeech.toUpperCase()}</Text>
                  </View>

                  {meaning.definitions.slice(0, 3).map((def, di) => (
                    <View key={di} style={styles.defItem}>
                      <View style={styles.defMarker}>
                        <Text style={[styles.defNum, { color: theme.colors.textTertiary }]}>{di + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.definition, { color: theme.colors.text }]}>{def.definition}</Text>
                        {def.example && (
                          <Text style={[styles.example, { color: theme.colors.textSecondary }]}>
                            “{def.example}”
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}

                  {meaning.synonyms.length > 0 && (
                    <View style={styles.synonymsBox}>
                      <Text style={[styles.synLabel, { color: theme.colors.textTertiary }]}>SYNONYMS</Text>
                      <View style={styles.synRow}>
                        {meaning.synonyms.slice(0, 5).map((s, si) => (
                          <View key={si} style={[styles.synPill, { backgroundColor: theme.colors.surfaceSecondary }]}>
                            <Text style={[styles.synText, { color: theme.colors.textSecondary }]}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {!result && !loading && recent.length > 0 && (
          <View style={{ marginTop: 32 }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>RECENT SEARCHES</Text>
            <View style={styles.recentGrid}>
              {recent.map((w) => (
                <Pressable
                  key={w}
                  onPress={() => { selectionFeedback(); setQuery(w); search(); }}
                  style={({ pressed }) => [
                    styles.recentCard,
                    { backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <MaterialCommunityIcons name="history" size={14} color={theme.colors.textTertiary} style={{ marginBottom: 4 }} />
                  <Text style={[styles.recentText, { color: theme.colors.text }]} numberOfLines={1}>
                    {w}
                  </Text>
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
  error: { marginTop: 20, textAlign: 'center', fontWeight: '600' },
  
  resultHeader: { marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  resultWord: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  phoneticRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  phoneticText: { fontSize: 15, fontWeight: '600' },

  meaningSection: { marginBottom: 24 },

  defCard: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1.5 },
  posRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  posLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  posValue: { fontSize: 12, fontWeight: '900' },
  defItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  defMarker: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
  defNum: { fontSize: 11, fontWeight: '800' },
  definition: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  example: { fontStyle: 'italic', marginTop: 6, fontSize: 13, opacity: 0.8 },
  
  synonymsBox: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  synLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  synRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  synPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  synText: { fontSize: 11, fontWeight: '600' },

  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 16, letterSpacing: 1.5, marginLeft: 4 },
  recentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  recentCard: { width: RECENT_CARD_W, padding: 12, borderRadius: 16, alignItems: 'center', elevation: 1 },
  recentText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
