import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { mediumImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;

interface HistoryItem {
  id: string;
  result: 'heads' | 'tails';
  timestamp: number;
}

// ─── History Card ──────────────────────────────────────────────────────────────

function HistoryCard({ item, theme }: { item: HistoryItem; theme: any }) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1);
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const isHeads = item.result === 'heads';

  return (
    <Animated.View style={[sc.card, { backgroundColor: theme.colors.surface }, aStyle]}>
      <View style={[sc.iconWrap, { backgroundColor: isHeads ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
        <Text style={sc.emoji}>{isHeads ? '🪙' : '🦅'}</Text>
      </View>
      <View style={sc.info}>
        <Text style={[sc.name, { color: theme.colors.text }]} numberOfLines={1}>
          {isHeads ? 'Heads' : 'Tails'}
        </Text>
        <Text style={[sc.tags, { color: theme.colors.textTertiary }]} numberOfLines={1}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  card: { width: CARD_W, borderRadius: 16, padding: 12, gap: 10, borderWidth: 1.5, borderColor: 'transparent', elevation: 2, flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700' },
  tags: { fontSize: 9, fontWeight: '500' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CoinFlipScreen() {
  const { theme } = useTheme();
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [stats, setStats] = useState({ heads: 0, tails: 0 });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const flipRotation = useSharedValue(0);
  const coinScale = useSharedValue(1);

  const onFlipEnd = (outcome: 'heads' | 'tails') => {
    setResult(outcome);
    setStats(s => ({ ...s, [outcome]: s[outcome] + 1 }));
    setHistory(prev => [{ id: Math.random().toString(), result: outcome, timestamp: Date.now() }, ...prev].slice(0, 6));
    setFlipping(false);
    selectionFeedback();
  };

  const flip = useCallback(() => {
    if (flipping) return;
    mediumImpact();
    setFlipping(true);
    setResult(null);

    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    const rotations = 6 + Math.floor(Math.random() * 4); // 6 to 10 rotations

    // Animation sequence
    coinScale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 600 })
    );

    flipRotation.value = withSequence(
      withTiming(rotations * 360, { duration: 800 }),
      withTiming(rotations * 360, { duration: 0 }, () => {
        flipRotation.value = 0;
        runOnJS(onFlipEnd)(outcome);
      })
    );
  }, [flipping]);

  const resetStats = () => {
    selectionFeedback();
    setStats({ heads: 0, tails: 0 });
    setHistory([]);
    setResult(null);
  };

  const total = stats.heads + stats.tails;
  
  const animatedCoinStyle = useAnimatedStyle(() => {
    const rotateY = `${flipRotation.value}deg`;
    return {
      transform: [
        { perspective: 1000 },
        { rotateY },
        { scale: coinScale.value }
      ],
    };
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="UTILITIES / TOOLS"
        title="Coin Flip"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          <View style={styles.coinContainer}>
            <Animated.View style={[styles.coin, { backgroundColor: theme.colors.surfaceTertiary }, animatedCoinStyle]}>
               <Text style={styles.coinEmoji}>
                 {flipping ? '❓' : (result === 'tails' ? '🦅' : '🪙')}
               </Text>
            </Animated.View>
          </View>
          
          <Text style={styles.featuredLabel}>TEST YOUR LUCK</Text>
          <Text style={styles.featuredTitle}>
            {flipping ? 'FLIPPING...' : (result ? result.toUpperCase() + '!' : 'TAP TO FLIP')}
          </Text>
          
          <Pressable
            onPress={flip}
            disabled={flipping}
            style={({ pressed }) => [
              styles.featuredPlay,
              { opacity: (pressed || flipping) ? 0.8 : 1 }
            ]}
          >
            <MaterialCommunityIcons name="cached" size={18} color={theme.colors.accent} />
            <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>FLIP COIN</Text>
          </Pressable>
        </LinearGradient>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface, marginBottom: 20 }]}>
          <View style={styles.settingsHeader}>
            <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>Statistics</Text>
            <Pressable onPress={resetStats} style={styles.cardHeaderBtn}>
              <Text style={styles.resetLabel}>RESET</Text>
              <MaterialCommunityIcons name="refresh" size={12} color="#FF5252" />
            </Pressable>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: theme.colors.accent }]}>{stats.heads}</Text>
              <Text style={[styles.statLab, { color: theme.colors.textTertiary }]}>HEADS</Text>
            </View>
            <View style={[styles.statItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.colors.border }]}>
              <Text style={[styles.statNum, { color: theme.colors.text }]}>{total}</Text>
              <Text style={[styles.statLab, { color: theme.colors.textTertiary }]}>TOTAL</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: theme.colors.accent }]}>{stats.tails}</Text>
              <Text style={[styles.statLab, { color: theme.colors.textTertiary }]}>TAILS</Text>
            </View>
          </View>

          {total > 0 && (
            <View style={{ marginTop: 16 }}>
              <View style={styles.barLabelRow}>
                 <Text style={[styles.barLabel, { color: theme.colors.textSecondary }]}>HEADS RATIO</Text>
                 <Text style={[styles.barLabel, { color: theme.colors.textSecondary }]}>{Math.round((stats.heads / total) * 100)}%</Text>
              </View>
              <View style={[styles.bar, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <View style={[styles.barFill, { width: `${(stats.heads / total) * 100}%`, backgroundColor: theme.colors.accent }]} />
              </View>
            </View>
          )}
        </View>

        {history.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>RECENT FLIPS</Text>
            <View style={styles.grid}>
              {history.map(item => (
                <HistoryCard key={item.id} item={item} theme={theme} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  featuredCard: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 18, marginBottom: 20, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  coinContainer: { marginBottom: 12, height: 64, justifyContent: 'center' },
  coin: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  coinEmoji: { fontSize: 28 },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },
  featuredTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 12, textAlign: 'center' },
  featuredPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, gap: 8 },
  featuredPlayText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  settingsCard: { borderRadius: 24, padding: 16 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  settingsTitle: { fontSize: 16, fontWeight: '800' },
  cardHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255, 82, 82, 0.08)' },
  resetLabel: { color: '#FF5252', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  statsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 16, paddingVertical: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLab: { fontSize: 8, fontWeight: '700', marginTop: 1 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: 9, fontWeight: '700' },
  bar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});

