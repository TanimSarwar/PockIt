/**
 * SoundAnimations.tsx
 * Lively, looping animated visuals for each ambient sound type.
 * Uses react-native-reanimated + react-native-svg (already in the project).
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Rect,
  Ellipse,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// ─── Reusable loop helper ─────────────────────────────────────────────────────
function useLoop(duration: number, start = 0, end = 1) {
  const val = useSharedValue(start);
  useEffect(() => {
    val.value = withRepeat(
      withTiming(end, { duration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(val);
  }, []);
  return val;
}

function usePingPong(duration: number) {
  const val = useSharedValue(0);
  useEffect(() => {
    val.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(val);
  }, []);
  return val;
}

// ─── OCEAN WAVE ───────────────────────────────────────────────────────────────
export function OceanAnimation({ size = 56, active = false }: { size?: number; active?: boolean }) {
  const phase = useLoop(2200);

  const wave1Props = useAnimatedProps(() => {
    const t = phase.value * Math.PI * 2;
    const amp = active ? 7 : 4;
    const s = size;
    const h = s * 0.55;
    return {
      d: `M0,${h} C${s * 0.2},${h - amp * Math.sin(t)} ${s * 0.4},${h + amp * Math.sin(t + 1)} ${s * 0.6},${h - amp * Math.sin(t + 0.5)} S${s},${h + amp * Math.sin(t)} ${s},${h} L${s},${s} L0,${s} Z`,
    };
  });

  const wave2Props = useAnimatedProps(() => {
    const t = phase.value * Math.PI * 2 + 1;
    const amp = active ? 5 : 3;
    const s = size;
    const h = s * 0.65;
    return {
      d: `M0,${h} C${s * 0.25},${h - amp * Math.sin(t)} ${s * 0.5},${h + amp * Math.sin(t + 0.8)} ${s * 0.75},${h - amp * Math.sin(t + 0.3)} S${s},${h + amp * Math.sin(t)} ${s},${h} L${s},${s} L0,${s} Z`,
    };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <SvgGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={active ? '#29B6F6' : '#64B5F6'} stopOpacity="0.9" />
          <Stop offset="1" stopColor={active ? '#0277BD' : '#1565C0'} stopOpacity="1" />
        </SvgGradient>
        <SvgGradient id="oceanGrad2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={active ? '#4FC3F7' : '#90CAF9'} stopOpacity="0.7" />
          <Stop offset="1" stopColor={active ? '#0288D1' : '#1976D2'} stopOpacity="0.9" />
        </SvgGradient>
      </Defs>
      {/* Sun/moon reflection dot */}
      <Circle cx={size * 0.5} cy={size * 0.22} r={size * 0.1} fill={active ? '#FFF59D' : '#B3E5FC'} opacity={0.85} />
      <AnimatedPath animatedProps={wave1Props} fill="url(#oceanGrad)" />
      <AnimatedPath animatedProps={wave2Props} fill="url(#oceanGrad2)" />
    </Svg>
  );
}

// ─── FIREPLACE ────────────────────────────────────────────────────────────────
export function FireplaceAnimation({ size = 56, active = false }: { size?: number; active?: boolean }) {
  const flicker1 = usePingPong(400 + Math.random() * 100);
  const flicker2 = usePingPong(350 + Math.random() * 150);
  const flicker3 = usePingPong(500 + Math.random() * 100);

  const flame1Style = useAnimatedStyle(() => ({
    transform: [
      { scaleY: interpolate(flicker1.value, [0, 1], [0.85, 1.15]) },
      { scaleX: interpolate(flicker1.value, [0, 1], [0.9, 1.1]) },
      { translateY: interpolate(flicker1.value, [0, 1], [2, -2]) },
    ],
    opacity: interpolate(flicker1.value, [0, 1], [0.85, 1]),
  }));

  const flame2Style = useAnimatedStyle(() => ({
    transform: [
      { scaleY: interpolate(flicker2.value, [0, 1], [0.8, 1.2]) },
      { scaleX: interpolate(flicker2.value, [0, 1], [1.1, 0.9]) },
      { translateY: interpolate(flicker2.value, [0, 1], [3, -3]) },
    ],
    opacity: interpolate(flicker2.value, [0, 1], [0.7, 1]),
  }));

  const emberStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(flicker3.value, [0, 1], [0, -8]) }],
    opacity: interpolate(flicker3.value, [0, 1], [1, 0]),
  }));

  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="logGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#795548" />
            <Stop offset="1" stopColor="#3E2723" />
          </SvgGradient>
        </Defs>
        {/* Log base */}
        <Rect x={s * 0.18} y={s * 0.72} width={s * 0.64} height={s * 0.16} rx={s * 0.06} fill="url(#logGrad)" />
        <Rect x={s * 0.25} y={s * 0.7} width={s * 0.5} height={s * 0.1} rx={s * 0.05} fill="#5D4037" />
        {/* Embers glow */}
        <Circle cx={s * 0.38} cy={s * 0.76} r={s * 0.06} fill={active ? '#FF6D00' : '#FF8F00'} opacity={0.9} />
        <Circle cx={s * 0.5} cy={s * 0.75} r={s * 0.05} fill={active ? '#FFAB00' : '#FFC107'} opacity={0.8} />
        <Circle cx={s * 0.63} cy={s * 0.77} r={s * 0.055} fill={active ? '#FF3D00' : '#FF6D00'} opacity={0.85} />
      </Svg>

      {/* Outer flame */}
      <Animated.View style={[{ position: 'absolute', bottom: s * 0.22, alignSelf: 'center' }, flame1Style]}>
        <Svg width={s * 0.75} height={s * 0.65} viewBox="0 0 42 38">
          <Defs>
            <SvgGradient id="flame1" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor={active ? '#FFEE58' : '#FFF176'} stopOpacity="0.95" />
              <Stop offset="0.5" stopColor={active ? '#FF6D00' : '#FF8F00'} stopOpacity="1" />
              <Stop offset="1" stopColor={active ? '#D50000' : '#E53935'} stopOpacity="0.8" />
            </SvgGradient>
          </Defs>
          <Path d="M21,1 C15,10 6,14 8,26 C10,34 32,34 34,26 C36,14 27,10 21,1 Z" fill="url(#flame1)" />
        </Svg>
      </Animated.View>

      {/* Inner bright flame */}
      <Animated.View style={[{ position: 'absolute', bottom: s * 0.28, alignSelf: 'center' }, flame2Style]}>
        <Svg width={s * 0.45} height={s * 0.45} viewBox="0 0 26 26">
          <Defs>
            <SvgGradient id="flame2" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
              <Stop offset="0.6" stopColor={active ? '#FFD740' : '#FFE082'} stopOpacity="1" />
              <Stop offset="1" stopColor={active ? '#FF6D00' : '#FF8F00'} stopOpacity="0.9" />
            </SvgGradient>
          </Defs>
          <Path d="M13,1 C9,8 4,11 5,18 C6.5,23 19.5,23 21,18 C22,11 17,8 13,1 Z" fill="url(#flame2)" />
        </Svg>
      </Animated.View>

      {/* Floating ember particle */}
      <Animated.View style={[{ position: 'absolute', bottom: s * 0.5, left: s * 0.35 }, emberStyle]}>
        <Svg width={6} height={6} viewBox="0 0 6 6">
          <Circle cx={3} cy={3} r={2.5} fill={active ? '#FF6D00' : '#FF8F00'} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ─── FOREST ───────────────────────────────────────────────────────────────────
export function ForestAnimation({ size = 56, active = false }: { size?: number; active?: boolean }) {
  const sway1 = usePingPong(2000);
  const sway2 = usePingPong(2400);
  const sway3 = usePingPong(1800);
  const bird = useLoop(3500);

  const tree1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: size * 0.23 },
      { rotate: `${interpolate(sway1.value, [0, 1], [-3, 3])}deg` },
      { translateX: -(size * 0.23) },
    ],
  }));
  const tree2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: size * 0.5 },
      { rotate: `${interpolate(sway2.value, [0, 1], [-4, 4])}deg` },
      { translateX: -(size * 0.5) },
    ],
  }));
  const tree3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: size * 0.77 },
      { rotate: `${interpolate(sway3.value, [0, 1], [-2.5, 2.5])}deg` },
      { translateX: -(size * 0.77) },
    ],
  }));

  const birdProps = useAnimatedProps(() => ({
    cx: interpolate(bird.value, [0, 1], [-4, size + 4]),
    cy: interpolate(bird.value, [0, 0.3, 0.6, 1], [size * 0.2, size * 0.15, size * 0.22, size * 0.18]),
  }));

  const s = size;
  const treeColor = active ? '#2E7D32' : '#388E3C';
  const trunkColor = '#5D4037';
  const darkTreeColor = active ? '#1B5E20' : '#2E7D32';

  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={active ? '#64B5F6' : '#B3E5FC'} />
            <Stop offset="1" stopColor={active ? '#E3F2FD' : '#F3F9FF'} />
          </SvgGradient>
          <SvgGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={active ? '#66BB6A' : '#81C784'} />
            <Stop offset="1" stopColor={active ? '#388E3C' : '#4CAF50'} />
          </SvgGradient>
        </Defs>
        {/* Sky */}
        <Rect x={0} y={0} width={s} height={s} fill="url(#skyGrad)" />
        {/* Ground */}
        <Ellipse cx={s * 0.5} cy={s * 0.88} rx={s * 0.55} ry={s * 0.13} fill="url(#groundGrad)" />
      </Svg>

      {/* Tree 1 (left) */}
      <Animated.View style={[StyleSheet.absoluteFill, tree1Style]}>
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Rect x={s * 0.19} y={s * 0.7} width={s * 0.08} height={s * 0.2} fill={trunkColor} />
          <Path d={`M${s * 0.23},${s * 0.25} L${s * 0.1},${s * 0.62} L${s * 0.36},${s * 0.62} Z`} fill={darkTreeColor} />
          <Path d={`M${s * 0.23},${s * 0.15} L${s * 0.12},${s * 0.48} L${s * 0.34},${s * 0.48} Z`} fill={treeColor} />
        </Svg>
      </Animated.View>

      {/* Tree 2 (center) */}
      <Animated.View style={[StyleSheet.absoluteFill, tree2Style]}>
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Rect x={s * 0.46} y={s * 0.65} width={s * 0.08} height={s * 0.25} fill={trunkColor} />
          <Path d={`M${s * 0.5},${s * 0.18} L${s * 0.34},${s * 0.62} L${s * 0.66},${s * 0.62} Z`} fill={darkTreeColor} />
          <Path d={`M${s * 0.5},${s * 0.08} L${s * 0.36},${s * 0.44} L${s * 0.64},${s * 0.44} Z`} fill={treeColor} />
        </Svg>
      </Animated.View>

      {/* Tree 3 (right) */}
      <Animated.View style={[StyleSheet.absoluteFill, tree3Style]}>
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Rect x={s * 0.73} y={s * 0.7} width={s * 0.08} height={s * 0.2} fill={trunkColor} />
          <Path d={`M${s * 0.77},${s * 0.28} L${s * 0.64},${s * 0.65} L${s * 0.9},${s * 0.65} Z`} fill={darkTreeColor} />
          <Path d={`M${s * 0.77},${s * 0.18} L${s * 0.66},${s * 0.5} L${s * 0.88},${s * 0.5} Z`} fill={treeColor} />
        </Svg>
      </Animated.View>

      {/* Flying bird */}
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={StyleSheet.absoluteFill}>
        <AnimatedCircle animatedProps={birdProps} r={2.5} fill={active ? '#1A237E' : '#37474F'} />
      </Svg>
    </View>
  );
}

// ─── RAIN ─────────────────────────────────────────────────────────────────────
export function RainAnimation({ size = 56, active = false }: { size?: number; active?: boolean }) {
  const drops = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
    x: (i % 4) * (size / 3.5) + size * 0.05 + (i > 3 ? size * 0.12 : 0),
    delay: i * 150,
    speed: 700 + i * 80,
    opacity: 0.5 + (i % 3) * 0.2,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="rainCloudGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={active ? '#78909C' : '#90A4AE'} />
            <Stop offset="1" stopColor={active ? '#455A64' : '#607D8B'} />
          </SvgGradient>
        </Defs>
        {/* Cloud */}
        <Ellipse cx={size * 0.5} cy={size * 0.28} rx={size * 0.38} ry={size * 0.16} fill="url(#rainCloudGrad)" />
        <Ellipse cx={size * 0.35} cy={size * 0.24} rx={size * 0.2} ry={size * 0.14} fill={active ? '#78909C' : '#90A4AE'} />
        <Ellipse cx={size * 0.65} cy={size * 0.25} rx={size * 0.18} ry={size * 0.12} fill={active ? '#78909C' : '#90A4AE'} />
      </Svg>
      {drops.map((drop, i) => (
        <Raindrop key={i} x={drop.x} size={size} delay={drop.delay} speed={drop.speed} opacity={drop.opacity} active={active} />
      ))}
    </View>
  );
}

function Raindrop({ x, size, delay, speed, opacity, active }: {
  x: number; size: number; delay: number; speed: number; opacity: number; active: boolean;
}) {
  const ty = useSharedValue(-size * 0.1);
  useEffect(() => {
    ty.value = withDelay(
      delay,
      withRepeat(
        withTiming(size * 1.1, { duration: speed, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(ty);
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x,
    top: ty.value,
    opacity,
  }));

  return (
    <Animated.View style={style}>
      <Svg width={3} height={10} viewBox="0 0 3 10">
        <Rect x={0} y={0} width={3} height={10} rx={1.5} fill={active ? '#5B9BD5' : '#90CAF9'} />
      </Svg>
    </Animated.View>
  );
}

// ─── WHITE NOISE (Waveform Bars) ──────────────────────────────────────────────
export function WhiteNoiseAnimation({ size = 56, active = false }: { size?: number; active?: boolean }) {
  const numBars = 8;
  const bars = Array.from({ length: numBars }, (_, i) => i);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        {bars.map((i) => (
          <WaveBar key={i} index={i} size={size} active={active} color="#A0A0A0" />
        ))}
      </View>
    </View>
  );
}

// ─── BROWN NOISE ──────────────────────────────────────────────────────────────
export function BrownNoiseAnimation({ size = 56, active = false }: { size?: number; active?: boolean }) {
  const numBars = 8;
  const bars = Array.from({ length: numBars }, (_, i) => i);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        {bars.map((i) => (
          <WaveBar key={i} index={i} size={size} active={active} color="#8B6F47" />
        ))}
      </View>
    </View>
  );
}

function WaveBar({ index, size, active, color }: { index: number; size: number; active: boolean; color: string }) {
  const heightAnim = useSharedValue(0.3);
  const maxH = size * 0.55;
  const minH = size * 0.08;

  useEffect(() => {
    const dur = active ? 300 + index * 60 + Math.random() * 200 : 600 + index * 80;
    heightAnim.value = withDelay(
      index * 80,
      withRepeat(
        withSequence(
          withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.1, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(heightAnim);
  }, [active]);

  const style = useAnimatedStyle(() => ({
    width: size * 0.065,
    height: minH + heightAnim.value * (maxH - minH),
    backgroundColor: color,
    borderRadius: size * 0.03,
    opacity: active ? 0.85 + heightAnim.value * 0.15 : 0.4 + heightAnim.value * 0.3,
  }));

  return <Animated.View style={style} />;
}

// ─── BIRDS ────────────────────────────────────────────────────────────────────
export function BirdsAnimation({ size = 56, active = false }: { size?: number; active?: boolean }) {
  const b1 = useLoop(2800);
  const b2 = useLoop(3400);
  const b3 = useLoop(4100);
  const wingFlap = usePingPong(300);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="birdSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={active ? '#FFF9C4' : '#FFFDE7'} />
            <Stop offset="1" stopColor={active ? '#FFF59D' : '#FFF9C4'} />
          </SvgGradient>
          <SvgGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFEE58" />
            <Stop offset="1" stopColor="#FFA000" />
          </SvgGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} fill="url(#birdSky)" />
        {/* Sun */}
        <Circle cx={size * 0.82} cy={size * 0.2} r={size * 0.1} fill="url(#sunGrad)" opacity={0.9} />
      </Svg>
      <AnimatedBird progress={b1} size={size} yBase={size * 0.25} active={active} wingFlap={wingFlap} scale={0.9} />
      <AnimatedBird progress={b2} size={size} yBase={size * 0.4} active={active} wingFlap={wingFlap} scale={0.7} delay={0.3} />
      <AnimatedBird progress={b3} size={size} yBase={size * 0.32} active={active} wingFlap={wingFlap} scale={0.55} delay={0.6} />
    </View>
  );
}

function AnimatedBird({ progress, size, yBase, active, wingFlap, scale = 1, delay = 0 }: any) {
  const birdStyle = useAnimatedStyle(() => {
    const p = (progress.value + delay) % 1;
    const x = interpolate(p, [0, 1], [-size * 0.15, size * 1.1]);
    const yWave = Math.sin(p * Math.PI * 3) * size * 0.07;
    return {
      position: 'absolute',
      left: x,
      top: yBase + yWave,
    };
  });

  const wingStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: interpolate(wingFlap.value, [0, 1], active ? [0.5, 1.4] : [0.7, 1.1]) }],
  }));

  const birdSize = size * 0.22 * scale;
  const color = active ? '#333' : '#5D4037';

  return (
    <Animated.View style={birdStyle}>
      <Animated.View style={wingStyle}>
        <Svg width={birdSize} height={birdSize * 0.55} viewBox="0 0 24 14">
          {/* Simple M-shape bird */}
          <Path d="M0,7 Q4,1 7,5 Q9,7 12,5 Q15,1 19,7" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

// ─── THUNDER ─────────────────────────────────────────────────────────────────
export function ThunderAnimation({ size = 56, active = false }: { size?: number; active?: boolean }) {
  const flash = useSharedValue(0);
  const cloudShake = usePingPong(120);

  useEffect(() => {
    const doFlash = () => {
      flash.value = withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(0.3, { duration: 80 }),
        withTiming(0.9, { duration: 50 }),
        withTiming(0, { duration: 100 }),
      );
    };
    const interval = setInterval(doFlash, active ? 1800 : 3500);
    doFlash();
    return () => clearInterval(interval);
  }, [active]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(cloudShake.value, [0, 1], [-0.5, 0.5]) }],
  }));

  const s = size;
  const cloudColor = active ? '#37474F' : '#607D8B';
  const darkCloud = active ? '#263238' : '#455A64';

  return (
    <View style={{ width: s, height: s }}>
      {/* Background flash */}
      <Animated.View style={[StyleSheet.absoluteFill, flashStyle]}>
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Rect x={0} y={0} width={s} height={s} fill="#FFF9C4" rx={12} />
        </Svg>
      </Animated.View>

      {/* Cloud */}
      <Animated.View style={[StyleSheet.absoluteFill, shakeStyle]}>
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Defs>
            <SvgGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={cloudColor} />
              <Stop offset="1" stopColor={darkCloud} />
            </SvgGradient>
          </Defs>
          <Ellipse cx={s * 0.5} cy={s * 0.3} rx={s * 0.4} ry={s * 0.18} fill="url(#cloudGrad)" />
          <Ellipse cx={s * 0.33} cy={s * 0.27} rx={s * 0.22} ry={s * 0.15} fill={cloudColor} />
          <Ellipse cx={s * 0.68} cy={s * 0.28} rx={s * 0.2} ry={s * 0.13} fill={cloudColor} />
        </Svg>
      </Animated.View>

      {/* Lightning bolt */}
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={StyleSheet.absoluteFill}>
        <Path
          d={`M${s * 0.52},${s * 0.44} L${s * 0.38},${s * 0.63} L${s * 0.5},${s * 0.63} L${s * 0.38},${s * 0.86} L${s * 0.62},${s * 0.6} L${s * 0.5},${s * 0.6} L${s * 0.62},${s * 0.44} Z`}
          fill={active ? '#FFD740' : '#FFEE58'}
        />
      </Svg>
    </View>
  );
}

// ─── FACTORY MAP ─────────────────────────────────────────────────────────────
export type SoundAnimationId = 'ocean' | 'fireplace' | 'forest' | 'rain' | 'white-noise' | 'brown-noise' | 'birds' | 'thunder';

export function SoundAnimation({
  id,
  size = 56,
  active = false,
}: {
  id: SoundAnimationId | string;
  size?: number;
  active?: boolean;
}) {
  switch (id) {
    case 'ocean': return <OceanAnimation size={size} active={active} />;
    case 'fireplace': return <FireplaceAnimation size={size} active={active} />;
    case 'forest': return <ForestAnimation size={size} active={active} />;
    case 'rain': return <RainAnimation size={size} active={active} />;
    case 'white-noise': return <WhiteNoiseAnimation size={size} active={active} />;
    case 'brown-noise': return <BrownNoiseAnimation size={size} active={active} />;
    case 'birds': return <BirdsAnimation size={size} active={active} />;
    case 'thunder': return <ThunderAnimation size={size} active={active} />;
    default: return null;
  }
}
