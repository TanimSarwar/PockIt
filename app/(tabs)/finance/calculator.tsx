import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact } from '../../../lib/haptics';

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

export default function CalculatorScreen() {
  const { theme } = useTheme();
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [isScientific, setIsScientific] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const handlePress = (btn: string) => {
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
          setHistory((h) => [`${expression}${display} = ${resultStr}`, ...h.slice(0, 9)]);
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
  };

  const isOperator = (btn: string) => ['+', '−', '×', '÷', '='].includes(btn);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Calculator"
        rightAction={
          <Pressable onPress={() => setIsScientific(!isScientific)} accessibilityLabel="Toggle scientific">
            <Text style={{ color: theme.colors.accent, fontWeight: '600', fontSize: 13 }}>{isScientific ? 'STD' : 'SCI'}</Text>
          </Pressable>
        }
      />

      <View style={styles.displayArea}>
        <Text style={[styles.expression, { color: theme.colors.textTertiary }]} numberOfLines={1}>{expression}</Text>
        <Text style={[styles.display, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{display}</Text>
      </View>

      <View style={styles.buttons}>
        {isScientific && SCI_BUTTONS.map((row, ri) => (
          <View key={`sci-${ri}`} style={styles.row}>
            {row.map((btn) => (
              <Pressable
                key={btn}
                style={[styles.btn, styles.sciBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
                onPress={() => handlePress(btn)}
                accessibilityLabel={btn}
              >
                <Text style={[styles.sciBtnText, { color: theme.colors.accent }]}>{btn}</Text>
              </Pressable>
            ))}
          </View>
        ))}

        {STANDARD_BUTTONS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((btn) => (
              <Pressable
                key={btn}
                style={[
                  styles.btn,
                  {
                    backgroundColor: btn === '=' ? theme.colors.accent
                      : isOperator(btn) ? theme.colors.accentMuted
                      : ['C', '±', '%', '⌫'].includes(btn) ? theme.colors.surfaceSecondary
                      : theme.colors.surface,
                  },
                  btn === '0' && styles.wideBtn,
                ]}
                onPress={() => handlePress(btn)}
                accessibilityLabel={btn}
              >
                <Text style={[
                  styles.btnText,
                  {
                    color: btn === '=' ? '#fff'
                      : isOperator(btn) ? theme.colors.accent
                      : theme.colors.text,
                  },
                ]}>{btn}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      {history.length > 0 && (
        <ScrollView style={[styles.history, { borderTopColor: theme.colors.border }]} horizontal showsHorizontalScrollIndicator={false}>
          {history.map((h, i) => (
            <Text key={i} style={[styles.historyItem, { color: theme.colors.textTertiary }]}>{h}</Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  displayArea: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'flex-end' },
  expression: { fontSize: 18, minHeight: 24 },
  display: { fontSize: 48, fontWeight: '300' },
  buttons: { paddingHorizontal: 12, gap: 8, flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', maxHeight: 72 },
  wideBtn: { flex: 1 },
  btnText: { fontSize: 24, fontWeight: '500' },
  sciBtn: { aspectRatio: undefined, paddingVertical: 10 },
  sciBtnText: { fontSize: 16, fontWeight: '600' },
  history: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 36 },
  historyItem: { fontSize: 12, marginRight: 16 },
});
