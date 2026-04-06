import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../store/theme';
import { lightImpact } from '../../lib/haptics';

type PaddingVariant = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: PaddingVariant;
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

const paddingMap: Record<PaddingVariant, number> = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
};

export function Card({
  children,
  onPress,
  padding = 'md',
  title,
  subtitle,
  style,
}: CardProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim, onPress]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim, onPress]);

  const handlePress = useCallback(() => {
    lightImpact();
    onPress?.();
  }, [onPress]);

  const cardContent = (
    <>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title != null && (
            <Text
              style={[
                theme.typography.h4,
                { color: theme.colors.text },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle != null && (
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textSecondary, marginTop: 2 },
              ]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children}
    </>
  );

  const containerStyle: ViewStyle[] = [
    styles.container,
    theme.shadows.card,
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.borderLight,
      padding: paddingMap[padding],
    },
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            ...containerStyle,
            { transform: [{ scale: scaleAnim }] },
            style,
          ]}
        >
          {cardContent}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={[...containerStyle, style]}>
      {cardContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  header: {
    marginBottom: 12,
  },
});
