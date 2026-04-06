import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact } from '../../../lib/haptics';

const COLORS = ['#000000', '#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#FFFFFF'];
const SIZES = [2, 5, 10];

interface Stroke {
  points: string;
  color: string;
  width: number;
}

export default function DrawingPadScreen() {
  const { theme } = useTheme();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const pathRef = useRef('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        pathRef.current = `M${locationX},${locationY}`;
        setCurrentPath(pathRef.current);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        pathRef.current += ` L${locationX},${locationY}`;
        setCurrentPath(pathRef.current);
      },
      onPanResponderRelease: () => {
        if (pathRef.current) {
          setStrokes((s) => [...s, { points: pathRef.current, color, width: brushSize }]);
        }
        pathRef.current = '';
        setCurrentPath('');
      },
    })
  ).current;

  const undo = () => {
    lightImpact();
    setStrokes((s) => s.slice(0, -1));
  };

  const clear = () => {
    lightImpact();
    setStrokes([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Drawing Pad"
        rightAction={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={undo} accessibilityLabel="Undo">
              <MaterialCommunityIcons name="undo" size={24} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={clear} accessibilityLabel="Clear canvas">
              <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colors.error} />
            </Pressable>
          </View>
        }
      />

      {/* Canvas */}
      <View style={[styles.canvas, { backgroundColor: '#FFFFFF', borderColor: theme.colors.border }]} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {strokes.map((stroke, i) => (
            <Path key={i} d={stroke.points} stroke={stroke.color} strokeWidth={stroke.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {currentPath ? (
            <Path d={currentPath} stroke={color} strokeWidth={brushSize} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
        </Svg>
      </View>

      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorBtn, { backgroundColor: c, borderWidth: c === '#FFFFFF' ? 1 : 0, borderColor: theme.colors.border }, color === c && styles.colorSelected]}
              onPress={() => { lightImpact(); setColor(c); }}
              accessibilityLabel={`Color ${c}`}
            />
          ))}
        </View>
        <View style={styles.sizeRow}>
          {SIZES.map((s) => (
            <Pressable
              key={s}
              style={[styles.sizeBtn, { backgroundColor: brushSize === s ? theme.colors.accentMuted : theme.colors.surfaceSecondary }]}
              onPress={() => { lightImpact(); setBrushSize(s); }}
              accessibilityLabel={`Brush size ${s}`}
            >
              <View style={[styles.sizeDot, { width: s * 2, height: s * 2, backgroundColor: theme.colors.text }]} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  canvas: { flex: 1, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  toolbar: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  colorRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  colorBtn: { width: 30, height: 30, borderRadius: 15 },
  colorSelected: { borderWidth: 3, borderColor: '#6366F1' },
  sizeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  sizeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sizeDot: { borderRadius: 999 },
});
