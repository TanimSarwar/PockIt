import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming,
  withRepeat,
  FadeInDown,
  Layout
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Input } from '../../../components/ui/Input';
import { lightImpact, mediumImpact, notificationSuccess } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');

const DICE_DOTS: Record<number, number[][]> = {
  1: [[1, 1]], 
  2: [[0, 0], [2, 2]], 
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]], 
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

// ─── Animated Dice Component ──────────────────────────────────────────────────

function DiceFace({ value, theme, rolling }: { value: number; theme: any; rolling: boolean }) {
  const dots = DICE_DOTS[value] || [];
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (rolling) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 })
        ),
        5,
        true
      );
      scale.value = withSequence(withTiming(0.8, { duration: 250 }), withSpring(1.1), withSpring(1));
    } else {
      rotation.value = withSpring(0);
    }
  }, [rolling]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.die, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }, aStyle]}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.dieRow}>
          {[0, 1, 2].map((col) => (
            <View key={col} style={styles.dieCell}>
              {dots.some(([r, rCol]) => r === row && rCol === col) && (
                <View style={[styles.dieDot, { backgroundColor: theme.colors.text }]} />
              )}
            </View>
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RandomGeneratorScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [result, setResult] = useState<number | null>(null);
  const [diceCount, setDiceCount] = useState(1);
  const [diceValues, setDiceValues] = useState<number[]>([5]);
  const [history, setHistory] = useState<{val: string, id: number}[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  const numScale = useSharedValue(1);

  const generateNumber = useCallback(() => {
    mediumImpact();
    const lo = parseInt(min) || 0;
    const hi = parseInt(max) || 100;
    const num = Math.floor(Math.random() * (hi - lo + 1)) + lo;
    
    setResult(num);
    numScale.value = withSequence(withTiming(1.3, { duration: 100 }), withSpring(1));
    setHistory((h) => [{val: `${num}`, id: Date.now()}, ...h.slice(0, 11)]);
  }, [min, max]);

  const rollDice = useCallback(() => {
    notificationSuccess();
    setIsRolling(true);
    
    setTimeout(() => {
      const vals = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      setDiceValues(vals);
      const total = vals.reduce((a, b) => a + b, 0);
      setHistory((h) => [{val: `🎲 ${total}`, id: Date.now()}, ...h.slice(0, 11)]);
      setIsRolling(false);
    }, 600);
  }, [diceCount]);

  const resultStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numScale.value }]
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
        title="Random & Dice" 
        onBack={() => router.replace('/(tabs)/utilities')}
      />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Dice Section (NOW 1st) */}
        <Animated.View entering={FadeInDown.delay(100)} style={[styles.mainCard, { backgroundColor: theme.colors.surface }]}>
           <LinearGradient colors={theme.palette.gradient as any} style={styles.cardHeader}>
             <MaterialCommunityIcons name="dice-6-outline" size={20} color="white" style={{ opacity: 0.8 }} />
             <Text style={styles.cardHeaderTitle}>DICE ROLLER</Text>
          </LinearGradient>

          <View style={styles.cardBody}>
            <View style={styles.diceCountContainer}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Number of dice</Text>
              <View style={styles.diceSelector}>
                {[1, 2, 3, 4].map((n) => (
                  <Pressable 
                    key={n} 
                    onPress={() => { lightImpact(); setDiceCount(n); }}
                    style={[styles.dicePill, { backgroundColor: theme.colors.surfaceSecondary }, diceCount === n && { backgroundColor: theme.colors.accent }]}
                  >
                    <Text style={[styles.dicePillText, { color: theme.colors.textTertiary }, diceCount === n && { color: 'white' }]}>{n}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.diceDisplay}>
              {diceValues.map((v, i) => (
                <DiceFace key={`${i}-${v}`} value={v} theme={theme} rolling={isRolling} />
              ))}
            </View>

            <Pressable onPress={rollDice} disabled={isRolling} style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.colors.accent, opacity: pressed || isRolling ? 0.8 : 1, marginTop: 24 }]}>
               <Text style={styles.actionButtonText}>{isRolling ? 'Rolling...' : 'Roll Dice'}</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Random Number Section (NOW 2nd) */}
        <Animated.View entering={FadeInDown.delay(200)} style={[styles.mainCard, { backgroundColor: theme.colors.surface, marginTop: 24 }]}>
          <LinearGradient colors={theme.palette.gradient as any} style={styles.cardHeader}>
             <MaterialCommunityIcons name="auto-fix" size={20} color="white" style={{ opacity: 0.8 }} />
             <Text style={styles.cardHeaderTitle}>NUMBER GENERATOR</Text>
          </LinearGradient>

          <View style={styles.cardBody}>
            <View style={styles.inputRow}>
              <Input label="Min" value={min} onChangeText={setMin} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
              <View style={styles.inputSpacer} />
              <Input label="Max" value={max} onChangeText={setMax} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
            </View>

            <Pressable onPress={generateNumber} style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.colors.accent, opacity: pressed ? 0.8 : 1 }]}>
               <Text style={styles.actionButtonText}>Generate number</Text>
            </Pressable>

            <View style={styles.resultContainer}>
              {result !== null ? (
                <Animated.Text style={[styles.resultText, { color: theme.colors.text }, resultStyle]}>
                  {result}
                </Animated.Text>
              ) : (
                <Text style={[styles.placeholderText, { color: theme.colors.textTertiary }]}>--</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* History Pills */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.historyLabel, { color: theme.colors.textSecondary }]}>RECENT RESULTS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
               {history.map((h) => (
                 <Animated.View 
                    layout={Layout.springify()} 
                    entering={FadeInDown} 
                    key={h.id} 
                    style={[styles.historyPill, { backgroundColor: theme.colors.surface }]}
                  >
                   <Text style={[styles.historyPillText, { color: theme.colors.text }]}>{h.val}</Text>
                 </Animated.View>
               ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  mainCard: { borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20 },
  cardHeaderTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: 'white' },
  cardBody: { padding: 22 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20 },
  inputSpacer: { width: 12 },
  actionButton: { height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  resultContainer: { height: 100, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  resultText: { fontSize: 64, fontWeight: '900', letterSpacing: -2 },
  placeholderText: { fontSize: 48, fontWeight: '800', opacity: 0.3 },
  diceCountContainer: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 10, marginLeft: 4 },
  diceSelector: { flexDirection: 'row', gap: 8 },
  dicePill: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dicePillText: { fontSize: 15, fontWeight: '700' },
  diceDisplay: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15, minHeight: 80 },
  die: { width: 70, height: 70, borderRadius: 16, borderWidth: 1.5, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5 },
  dieRow: { flexDirection: 'row', flex: 1 },
  dieCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dieDot: { width: 12, height: 12, borderRadius: 6 },
  historySection: { marginTop: 32 },
  historyLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
  historyScroll: { gap: 10, paddingRight: 40 },
  historyPill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  historyPillText: { fontSize: 15, fontWeight: '700' },
});
