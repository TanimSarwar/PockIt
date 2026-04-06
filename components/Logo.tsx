import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  textColor?: string;
  animate?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 22, fontSize: 20, gap: 6, padding: 6, radius: 10 },
  md: { icon: 30, fontSize: 26, gap: 8,  padding: 8,  radius: 14 },
  lg: { icon: 48, fontSize: 42, gap: 12, padding: 12, radius: 20 },
};

export function Logo({ size = 'md', color = '#7C3AED', textColor = '#FFFFFF', animate = false }: LogoProps) {
  const s = SIZE_MAP[size];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, pulseAnim]);

  return (
    <View style={styles.row}>
      <Animated.View
        style={[
          styles.iconBox,
          {
            backgroundColor: color,
            padding: s.padding,
            borderRadius: s.radius,
            marginRight: s.gap,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <MaterialCommunityIcons name="lightning-bolt" size={s.icon} color="#FFFFFF" />
      </Animated.View>
      <Text style={[styles.wordmark, { fontSize: s.fontSize, color: textColor }]}>
        Pock<Text style={{ fontWeight: '900' }}>It</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
