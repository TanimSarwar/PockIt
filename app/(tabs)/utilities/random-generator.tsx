import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
  FadeInDown,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { mediumImpact, selectionFeedback, notificationSuccess, lightImpact } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;


const DICE_IMAGES: Record<number, any> = {
  1: require('../../../assets/images/dice/face_1.png'),
  2: require('../../../assets/images/dice/face_2.png'),
  3: require('../../../assets/images/dice/face_3.png'),
  4: require('../../../assets/images/dice/face_4.png'),
  5: require('../../../assets/images/dice/face_5.png'),
  6: require('../../../assets/images/dice/face_6.png'),
};

// ─── Dice Component ────────────────────────────────────────────────────────────

function DiceFace({ value, theme, rolling }: { value: number; theme: any; rolling: boolean }) {
  const [displayValue, setDisplayValue] = useState(value);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (rolling) {
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 70);

      rotation.value = withSequence(
        withTiming(20, { duration: 100 }),
        withTiming(-20, { duration: 100 }),
        withTiming(15, { duration: 100 }),
        withTiming(-15, { duration: 100 }),
        withSpring(0)
      );
      translateY.value = withSequence(
        withTiming(3, { duration: 100 }),
        withTiming(-3, { duration: 100 }),
        withSpring(0)
      );
      scale.value = withSequence(withTiming(1.1, { duration: 150 }), withSpring(1));
    } else {
      setDisplayValue(value);
      rotation.value = 0;
      translateY.value = 0;
    }
    return () => clearInterval(interval);
  }, [rolling, value]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotation.value}deg` },
      { rotateY: `${rotation.value}deg` },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  return (
    <Animated.View style={[sc.die, aStyle]}>
      <Image 
        source={DICE_IMAGES[displayValue]} 
        style={sc.img} 
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  die: { 
    width: 100, 
    height: 100, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  img: { 
    width: 90, 
    height: 90 
  },
});


// ─── History Card ──────────────────────────────────────────────────────────────

function HistoryCard({ val, theme }: { val: string; theme: any }) {
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

  const isDice = val.includes('🎲');

  return (
    <Animated.View style={[hc.card, { backgroundColor: theme.colors.surface }, aStyle]}>
      <View style={[hc.iconWrap, { backgroundColor: isDice ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
        <MaterialCommunityIcons 
          name={isDice ? "dice-5-outline" : "pound"} 
          size={18} 
          color={isDice ? "#8B5CF6" : "#10B981"} 
        />
      </View>
      <View style={hc.info}>
        <Text style={[hc.name, { color: theme.colors.text }]} numberOfLines={1}>{val}</Text>
        <Text style={[hc.tags, { color: theme.colors.textTertiary }]} numberOfLines={1}>
          {isDice ? 'Dice Roll' : 'Random Number'}
        </Text>
      </View>
    </Animated.View>
  );
}

const hc = StyleSheet.create({
  card: { width: CARD_W, borderRadius: 16, padding: 10, gap: 10, borderWidth: 1.5, borderColor: 'transparent', elevation: 2, flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '700' },
  tags: { fontSize: 8, fontWeight: '500' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RandomGeneratorScreen() {
  const { theme } = useTheme();
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [result, setResult] = useState<number | null>(null);
  const [diceCount, setDiceCount] = useState(1);
  const [diceValues, setDiceValues] = useState<number[]>([5]);
  const [history, setHistory] = useState<{val: string, id: string}[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const numScale = useSharedValue(1);

  const generateNumber = useCallback(() => {
    if (isGenerating) return;
    mediumImpact();
    setIsGenerating(true);
    setResult(null);

    setTimeout(() => {
      const lo = parseInt(min) || 0;
      const hi = parseInt(max) || 100;
      const num = Math.floor(Math.random() * (hi - lo + 1)) + lo;
      
      setResult(num);
      numScale.value = withSequence(withTiming(1.3, { duration: 100 }), withSpring(1));
      setHistory((h) => [{val: `${num}`, id: Math.random().toString()}, ...h.slice(0, 5)]);
      setIsGenerating(false);
      selectionFeedback();
    }, 400);
  }, [min, max, isGenerating]);

  const rollDice = useCallback(() => {
    if (isRolling) return;
    notificationSuccess();
    setIsRolling(true);
    
    setTimeout(() => {
      const vals = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      setDiceValues(vals);
      const total = vals.reduce((a, b) => a + b, 0);
      setHistory((h) => [{val: `🎲 ${total}`, id: Math.random().toString()}, ...h.slice(0, 5)]);
      setIsRolling(false);
      selectionFeedback();
    }, 600);
  }, [diceCount, isRolling]);

  const resetHistory = () => {
    selectionFeedback();
    setHistory([]);
    setResult(null);
  };

  const resultStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numScale.value }]
  }));

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="UTILITIES / TOOLS"
        title="Random Tool"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          <View style={styles.diceDisplay}>
            {diceValues.map((v, i) => (
              <DiceFace key={i} value={v} theme={theme} rolling={isRolling} />
            ))}
          </View>
          
          <View style={styles.diceConfig}>
            <Text style={styles.featuredLabel}>NUMBER OF DICE</Text>
            <View style={styles.diceSelector}>
              {[1, 2, 3].map((n) => (
                <Pressable 
                  key={n} 
                  onPress={() => { lightImpact(); setDiceCount(n); }}
                  style={[styles.dicePill, { backgroundColor: diceCount === n ? 'rgba(255,255,255,0.2)' : 'transparent' }]}
                >
                  <Text style={[styles.dicePillText, { color: '#fff', opacity: diceCount === n ? 1 : 0.6 }]}>{n}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={rollDice}
            disabled={isRolling}
            style={({ pressed }) => [
              styles.featuredPlay,
              { opacity: (pressed || isRolling) ? 0.8 : 1 }
            ]}
          >
            <MaterialCommunityIcons name="dice-5" size={18} color={theme.colors.accent} />
            <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>ROLL DICE</Text>
          </Pressable>
        </LinearGradient>

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface, marginBottom: 20 }]}>
          <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>Number Generator</Text>
          
          <View style={styles.genArea}>
            <View style={styles.genInputs}>
              <View style={[styles.inputBox, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Text style={[styles.miniLabel, { color: theme.colors.textTertiary }]}>MIN</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  value={min}
                  onChangeText={setMin}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputBox, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <Text style={[styles.miniLabel, { color: theme.colors.textTertiary }]}>MAX</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  value={max}
                  onChangeText={setMax}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.genContent}>
               <Animated.Text style={[styles.genResult, { color: theme.colors.accent }, resultStyle]}>
                 {result ?? '--'}
               </Animated.Text>
               <Pressable onPress={generateNumber} style={[styles.genBtn, { backgroundColor: theme.colors.accent }]}>
                 <MaterialCommunityIcons name="auto-fix" size={16} color="#fff" />
               </Pressable>
            </View>
          </View>
        </View>

        {history.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.settingsHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>RECENT RESULTS</Text>
              <Pressable onPress={resetHistory} style={styles.cardHeaderBtn}>
                <Text style={styles.resetLabel}>RESET</Text>
                <MaterialCommunityIcons name="refresh" size={12} color="#FF5252" />
              </Pressable>
            </View>
            <View style={styles.grid}>
              {history.map(item => (
                <HistoryCard key={item.id} val={item.val} theme={theme} />
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
  featuredCard: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 16, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  diceDisplay: { flexDirection: 'row', gap: 12, marginBottom: 4, minHeight: 90, alignItems: 'center', justifyContent: 'center' },
  diceConfig: { marginBottom: 8, alignItems: 'center' },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  diceSelector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4 },
  dicePill: { width: 44, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dicePillText: { fontSize: 13, fontWeight: '700' },
  featuredPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, gap: 8 },
  featuredPlayText: { fontSize: 11, fontWeight: '800' },
  settingsCard: { borderRadius: 24, padding: 16 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  settingsTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  genArea: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  genInputs: { flex: 1, gap: 8 },
  inputBox: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  miniLabel: { fontSize: 8, fontWeight: '800', marginBottom: 1 },
  textInput: { fontSize: 14, fontWeight: '700', padding: 0 },
  genContent: { width: 80, height: 80, borderRadius: 16, borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  genResult: { fontSize: 28, fontWeight: '900' },
  genBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  cardHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255, 82, 82, 0.08)' },
  resetLabel: { color: '#FF5252', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  historySection: { marginTop: 8 },
});


