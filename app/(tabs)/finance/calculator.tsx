import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;

const STANDARD_BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

const SCI_BUTTONS = [
  ['sin', 'cos', 'tan', 'π'],
  ['log', 'ln', '√', '^'],
  ['(', ')', 'e', '!'],
];

function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// ─── Calculator Button Component ─────────────────────────────────────────────

function CalcButton({ 
  label, 
  onPress, 
  theme, 
  isOperator, 
  isAction, 
  isWide 
}: { 
  label: string; 
  onPress: () => void; 
  theme: any; 
  isOperator?: boolean; 
  isAction?: boolean; 
  isWide?: boolean;
}) {
  const scale = useSharedValue(1);
  const pressIn = () => { scale.value = withTiming(0.92, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); onPress(); };
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bgColor = label === '=' ? theme.colors.accent 
    : isOperator ? theme.colors.accentMuted 
    : isAction ? theme.colors.surfaceSecondary 
    : theme.colors.surface;

  const textColor = label === '=' ? '#fff' 
    : isOperator ? theme.colors.accent 
    : theme.colors.text;

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} style={{ flex: 1 }}>
      <Animated.View style={[
        sc.card, 
        { backgroundColor: bgColor, height: 46, justifyContent: 'center', alignItems: 'center', width: '100%' },
        aStyle
      ]}>
        <Text style={[sc.name, { color: textColor, fontSize: 16 }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── History Item Card (Matches SoundCard exactly) ───────────────────────────

function HistoryCard({ 
  expression, 
  result, 
  theme, 
  onPress 
}: { 
  expression: string; 
  result: string; 
  theme: any; 
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const pressIn = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); onPress(); };
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[sc.card, { backgroundColor: theme.colors.surface, width: CARD_W }, aStyle]}>
        <View style={[sc.playBtn, { backgroundColor: theme.colors.surfaceTertiary }]}>
          <MaterialCommunityIcons name="history" size={12} color={theme.colors.textTertiary} />
        </View>
        <View style={sc.iconWrap}>
          <Text style={sc.emoji}>🔢</Text>
        </View>
        <View style={sc.info}>
          <Text style={[sc.name, { color: theme.colors.text }]} numberOfLines={1}>{result}</Text>
          <Text style={[sc.tags, { color: theme.colors.textTertiary }]} numberOfLines={1}>{expression}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const sc = StyleSheet.create({
  card: { borderRadius: 16, padding: 12, gap: 4, borderWidth: 1.5, borderColor: 'transparent', elevation: 2 },
  iconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  info: { gap: 0 },
  name: { fontSize: 13, fontWeight: '700' },
  tags: { fontSize: 10, fontWeight: '500' },
  playBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 8, right: 8, zIndex: 10 },
});

// ─── Pulsing Mode Toggle ─────────────────────────────────────────────────────

function PulsingMode({ label, onPress, theme }: { label: string; onPress: () => void; theme: any }) {
  const opacity = useSharedValue(0.6);
  
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.4, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.modeToggle, aStyle]}>
        <Text style={{ color: theme.colors.accent, fontWeight: '800', fontSize: 10 }}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CalculatorScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [isScientific, setIsScientific] = useState(false);
  const [history, setHistory] = useState<{ expr: string; res: string }[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (params.display) setDisplay(params.display as string);
    if (params.expression) setExpression(params.expression as string);
  }, [params]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [expression]);

  const handlePress = useCallback((btn: string) => {
    lightImpact();

    switch (btn) {
      case 'C':
        setDisplay('0');
        setExpression('');
        return;
      case '⌫':
        setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'));
        return;
      case '±':
        setDisplay((d) => (d.startsWith('-') ? d.slice(1) : '-' + d));
        return;
      case '=': {
        try {
          let expr = (expression + display)
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/π/g, String(Math.PI))
            .replace(/e(?![x])/g, String(Math.E))
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/(\d+)!/g, (_, n) => String(factorial(parseInt(n))))
            .replace(/\^/g, '**');
          const result = Function('"use strict"; return (' + expr + ')')();
          const resultStr = String(parseFloat(result.toPrecision(12)));
          const fullExpr = `${expression}${display}`;
          setHistory((h) => [{ expr: fullExpr, res: resultStr }, ...h.slice(0, 9)]);
          setDisplay(resultStr);
          setExpression('');
        } catch {
          setDisplay('Error');
          setExpression('');
        }
        return;
      }
      case '%':
        setDisplay((d) => String(parseFloat(d) / 100));
        return;
      case '+': case '−': case '×': case '÷': case '^':
        setExpression((e) => e + display + btn);
        setDisplay('0');
        return;
      case 'sin': case 'cos': case 'tan': case 'log': case 'ln': case '√':
        setExpression((e) => e + btn + '(');
        setDisplay('0');
        return;
      case 'π':
        setDisplay(String(Math.PI));
        return;
      case 'e':
        setDisplay(String(Math.E));
        return;
      case '!':
        setDisplay(String(factorial(parseInt(display))));
        return;
      case '(': case ')':
        setExpression((e) => e + btn);
        return;
      default:
        setDisplay((d) => (d === '0' && btn !== '.' ? btn : d + btn));
    }
  }, [display, expression]);

  const toggleScientific = () => {
    selectionFeedback();
    setIsScientific(!isScientific);
  };

  const isOperator = (btn: string) => ['+', '−', '×', '÷', '='].includes(btn);
  const isAction = (btn: string) => ['C', '±', '%', '⌫'].includes(btn);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="FINANCE / COMPUTE"
        title="Calculator"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Featured Display Card */}
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          <View style={styles.featuredBottomLeft}>
            <Pressable onPress={() => handlePress('C')} style={styles.featuredResetBtn}>
              <MaterialCommunityIcons name="restart" size={12} color={theme.colors.accent} />
              <Text style={[styles.featuredResetText, { color: theme.colors.accent }]}>RESET</Text>
            </Pressable>
          </View>

          <View style={styles.expressionScrollWrap}>
            <ScrollView 
              ref={scrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.expressionScrollContent}
            >
              <Text style={styles.featuredTitle}>{expression || ' '}</Text>
            </ScrollView>
          </View>
          <View style={styles.displayWrap}>
             <Text style={styles.displayValue} numberOfLines={1} adjustsFontSizeToFit>{display}</Text>
          </View>
        </LinearGradient>

        <View style={{ marginTop: 4, marginBottom: 12 }}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, marginBottom: 0 }]}>Keypad</Text>
              <PulsingMode 
                label={isScientific ? 'SCIENTIFIC' : 'STANDARD'} 
                onPress={toggleScientific} 
                theme={theme} 
              />
           </View>

           <View style={styles.gridContainer}>
              {isScientific && SCI_BUTTONS.map((row, ri) => (
                <View key={`sci-${ri}`} style={styles.row}>
                  {row.map((btn) => (
                    <CalcButton 
                      key={btn} 
                      label={btn} 
                      onPress={() => handlePress(btn)} 
                      theme={theme} 
                      isOperator={false}
                    />
                  ))}
                </View>
              ))}

              {STANDARD_BUTTONS.map((row, ri) => (
                <View key={`std-${ri}`} style={styles.row}>
                  {row.map((btn) => (
                    <CalcButton 
                      key={btn} 
                      label={btn} 
                      onPress={() => handlePress(btn)} 
                      theme={theme} 
                      isOperator={isOperator(btn)}
                      isAction={isAction(btn)}
                    />
                  ))}
                </View>
              ))}
           </View>
        </View>

        {history.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, marginLeft: 4 }]}>RECENT CALCULATIONS</Text>
            <View style={styles.grid}>
              {history.map((h, i) => (
                <HistoryCard 
                  key={i} 
                  expression={h.expr} 
                  result={h.res} 
                  theme={theme} 
                  onPress={() => setDisplay(h.res)}
                />
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
  featuredCard: { borderRadius: 24, padding: 16, marginBottom: 12, height: 90, justifyContent: 'flex-end', alignItems: 'flex-end', position: 'relative', overflow: 'hidden' },
  featuredBottomLeft: { position: 'absolute', bottom: 12, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 20 },
  featuredResetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  featuredResetText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  expressionScrollWrap: { width: '100%', height: 20, marginBottom: 2 },
  expressionScrollContent: { flexGrow: 1, justifyContent: 'flex-end', alignItems: 'center' },
  featuredTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600', textAlign: 'right' },
  displayWrap: { width: '100%', alignItems: 'flex-end' },
  displayValue: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  
  gridContainer: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  
  settingsCard: { borderRadius: 24, padding: 20 },
  settingsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  modeToggle: { backgroundColor: 'rgba(99, 102, 241, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});
