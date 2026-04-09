import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Pressable, Dimensions, ScrollView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, selectionFeedback, notificationSuccess } from '../../../lib/haptics';
import { Platform, Alert } from 'react-native';

const COLORS = [
  { name: 'Ink', hex: '#0F172A' },
  { name: 'Slate', hex: '#64748B' },
  { name: 'Paper', hex: '#F8FAFC' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Lime', hex: '#84CC16' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Sky', hex: '#0EA5E9' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Pink', hex: '#EC4899' },
];

const SIZES = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 5 },
  { label: 'Bold', value: 10 },
  { label: 'Thick', value: 18 },
];

interface Stroke {
  points: string;
  color: string;
  width: number;
}

const { width: SW } = Dimensions.get('window');
const CANVAS_SIZE = SW - 32;

export default function DrawingPadScreen() {
  const { theme } = useTheme();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [color, setColor] = useState(COLORS[0].hex);
  const [brushSize, setBrushSize] = useState(SIZES[1].value);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const pathRef = useRef('');
  const colorRef = useRef(color);
  const sizeRef = useRef(brushSize);
  const viewShotRef = useRef<any>(null);

  // Keep refs in sync with state for PanResponder closure
  colorRef.current = color;
  sizeRef.current = brushSize;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        setIsDrawing(true);
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
        const finishedPath = pathRef.current;
        if (finishedPath) {
          setStrokes((s) => [...s, { 
            points: finishedPath, 
            color: colorRef.current, 
            width: sizeRef.current 
          }]);
        }
        pathRef.current = '';
        setCurrentPath('');
        setIsDrawing(false);
      },
      onPanResponderTerminate: () => {
        const finishedPath = pathRef.current;
        if (finishedPath) {
          setStrokes((s) => [...s, { 
            points: finishedPath, 
            color: colorRef.current, 
            width: sizeRef.current 
          }]);
        }
        pathRef.current = '';
        setCurrentPath('');
        setIsDrawing(false);
      },
    })
  ).current;

  const undo = () => {
    lightImpact();
    setStrokes((s) => s.slice(0, -1));
  };

  const clear = () => {
    selectionFeedback();
    setStrokes([]);
  };

  const save = async () => {
    selectionFeedback();
    
    if (strokes.length === 0 && !currentPath) {
      Alert.alert('Empty Canvas', 'Draw something before saving!');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        // SVG to PNG Conversion for Web
        const svgHeader = `<svg width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg" style="background:white">`;
        const svgBody = strokes.map(s => `<path d="${s.points}" stroke="${s.color}" stroke-width="${s.width}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`).join('');
        const svgFooter = '</svg>';
        const svgData = svgHeader + svgBody + svgFooter;
        
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = CANVAS_SIZE;
          canvas.height = CANVAS_SIZE;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `pockit-sketch-${Date.now()}.png`;
            downloadLink.click();
            notificationSuccess();
          }
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } else {
        // Native Save + Share for absolute certainty
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need gallery permissions to save your sketch.');
          return;
        }

        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile'
        });

        // 1. Try to save to library
        await MediaLibrary.saveToLibraryAsync(uri);
        
        // 2. Also offer to Share/Save via system sheet (more reliable)
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Save your Drawing',
            UTI: 'public.png'
          });
        }
        
        notificationSuccess();
      }
    } catch (err) {
      console.error('Save failed:', err);
      Alert.alert('Error', 'Failed to save sketch. Please ensure you have given storage permissions.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="UTILITIES / TOOLS" 
         title="Drawing Pad" 
      />

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDrawing}
      >
        <View style={[styles.canvasContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Floating Canvas Controls */}
          <View style={styles.canvasActions}>
            <Pressable onPress={save} style={styles.actionBtn} accessibilityLabel="Save Image">
              <MaterialCommunityIcons name="content-save-outline" size={20} color={theme.colors.accent} />
            </Pressable>
            <Pressable onPress={undo} style={styles.actionBtn} accessibilityLabel="Undo">
              <MaterialCommunityIcons name="undo" size={20} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={clear} style={styles.actionBtn} accessibilityLabel="Clear">
              <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
            </Pressable>
          </View>

          <ViewShot ref={viewShotRef} style={styles.canvas} options={{ format: 'png', quality: 1 }}>
            <View 
              style={[styles.canvas, { backgroundColor: '#FFFFFF' }]} 
              {...panResponder.panHandlers}
            >
            <Svg style={StyleSheet.absoluteFill}>
              {strokes.map((stroke, i) => (
                <Path 
                  key={i} 
                  d={stroke.points} 
                  stroke={stroke.color} 
                  strokeWidth={stroke.width} 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              ))}
              {currentPath ? (
                <Path 
                  d={currentPath} 
                  stroke={color} 
                  strokeWidth={brushSize} 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              ) : null}
            </Svg>
            </View>
          </ViewShot>
        </View>

        <View style={styles.controlsRow}>
          {/* Ink Card */}
          <View style={[styles.controlCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.colorGridHoney}>
              {COLORS.map((c) => (
                <Pressable
                  key={c.hex}
                  style={[
                    styles.colorCircle, 
                    { backgroundColor: c.hex },
                    color === c.hex && { borderColor: theme.colors.accent, borderWidth: 2, transform: [{ scale: 1.15 }] }
                  ]}
                  onPress={() => { lightImpact(); setColor(c.hex); }}
                />
              ))}
            </View>
          </View>

          {/* Brush Card */}
          <View style={[styles.controlCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.sizeGrid2x2}>
              {SIZES.map((s) => (
                <Pressable
                  key={s.label}
                  onPress={() => { lightImpact(); setBrushSize(s.value); }}
                  style={[
                    styles.sizeBox, 
                    { backgroundColor: brushSize === s.value ? theme.colors.accentMuted : theme.colors.surfaceSecondary }
                  ]}
                >
                  <Svg width="40" height="20" viewBox="0 0 40 20">
                    <Path 
                      d="M 8 10 Q 20 2, 32 10" 
                      stroke={brushSize === s.value ? theme.colors.accent : color} 
                      strokeWidth={s.value} 
                      fill="none" 
                      strokeLinecap="round" 
                    />
                    <Circle 
                      cx="6" 
                      cy="10" 
                      r={s.value / 2 < 1 ? 1 : s.value / 2} 
                      fill={brushSize === s.value ? theme.colors.accent : color} 
                    />
                  </Svg>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
  canvasContainer: {
    borderRadius: 24,
    padding: 8,
    borderWidth: 1.5,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative'
  },
  canvasActions: { 
    position: 'absolute', 
    top: 14, 
    right: 14, 
    zIndex: 20, 
    flexDirection: 'row', 
    gap: 8 
  },
  actionBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  canvas: { 
    width: '100%', 
    height: CANVAS_SIZE - 16, 
    borderRadius: 18, 
    overflow: 'hidden' 
  },
  controlsRow: { flexDirection: 'row', gap: 12 },
  controlCard: { 
    flex: 1, 
    borderRadius: 24, 
    padding: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: 120 
  },
  colorGridHoney: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6, 
    justifyContent: 'center',
    paddingHorizontal: 2 
  },
  colorCircle: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: 'rgba(0,0,0,0.05)' 
  },
  sizeGrid2x2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeBox: { width: '47%', aspectRatio: 1.5, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  sizeText: { fontSize: 9, fontWeight: '800' },
});

