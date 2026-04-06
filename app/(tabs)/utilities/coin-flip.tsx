import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card, Button } from '../../../components/ui';
import { mediumImpact } from '../../../lib/haptics';

export default function CoinFlipScreen() {
  const { theme } = useTheme();
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [stats, setStats] = useState({ heads: 0, tails: 0 });
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const flip = () => {
    if (flipping) return;
    mediumImpact();
    setFlipping(true);

    Animated.sequence([
      Animated.timing(rotateAnim, { toValue: 6, duration: 800, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start(() => {
      const isHeads = Math.random() < 0.5;
      const outcome = isHeads ? 'heads' : 'tails';
      setResult(outcome);
      setStats((s) => ({ ...s, [outcome]: s[outcome] + 1 }));
      setFlipping(false);
    });
  };

  const resetStats = () => {
    setStats({ heads: 0, tails: 0 });
    setResult(null);
  };

  const total = stats.heads + stats.tails;
  const spin = rotateAnim.interpolate({
    inputRange: [0, 6],
    outputRange: ['0deg', '2160deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Coin Flip" />
      <View style={styles.center}>
        <Animated.View style={[styles.coinWrapper, { transform: [{ rotateY: spin }] }]}>
          <Pressable onPress={flip} accessibilityLabel="Flip coin">
            <View style={[styles.coin, { backgroundColor: result === 'tails' ? theme.colors.accentDark ?? theme.colors.accent : theme.colors.accent }]}>
              <Text style={styles.coinText}>
                {flipping ? '...' : result ? (result === 'heads' ? 'H' : 'T') : '?'}
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {result && !flipping && (
          <Text style={[styles.resultText, { color: theme.colors.text }]}>
            {result === 'heads' ? 'Heads!' : 'Tails!'}
          </Text>
        )}

        <Button title="Flip" onPress={flip} style={{ marginTop: 24, minWidth: 160 }} />

        <Card style={{ marginTop: 32, width: '100%' }}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.colors.accent }]}>{stats.heads}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Heads</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{total}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Total</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.colors.accent }]}>{stats.tails}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Tails</Text>
            </View>
          </View>
          {total > 0 && (
            <View style={[styles.bar, { backgroundColor: theme.colors.border, marginTop: 12 }]}>
              <View style={[styles.barFill, { width: `${(stats.heads / total) * 100}%`, backgroundColor: theme.colors.accent }]} />
            </View>
          )}
        </Card>

        <Button title="Reset Stats" variant="ghost" onPress={resetStats} size="sm" style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 32 },
  coinWrapper: {},
  coin: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  coinText: { fontSize: 48, fontWeight: '700', color: '#fff' },
  resultText: { fontSize: 28, fontWeight: '700', marginTop: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});
