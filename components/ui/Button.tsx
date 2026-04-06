import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../store/theme';
import { lightImpact } from '../../lib/haptics';
import type { Theme } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 13 },
  md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 },
  lg: { paddingVertical: 16, paddingHorizontal: 28, fontSize: 17 },
};

function getVariantStyles(
  variant: ButtonVariant,
  theme: Theme,
): { container: ViewStyle; text: TextStyle } {
  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: theme.colors.accent,
        },
        text: {
          color: '#FFFFFF',
        },
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: theme.colors.surfaceSecondary,
        },
        text: {
          color: theme.colors.text,
        },
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.border,
        },
        text: {
          color: theme.colors.text,
        },
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
        },
        text: {
          color: theme.colors.accent,
        },
      };
  }
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const variantStyle = getVariantStyles(variant, theme);
  const sizeStyle = sizeStyles[size];

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (loading || disabled) return;
    lightImpact();
    onPress?.();
  }, [loading, disabled, onPress]);

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <Animated.View
        style={[
          styles.container,
          variantStyle.container,
          {
            paddingVertical: sizeStyle.paddingVertical,
            paddingHorizontal: sizeStyle.paddingHorizontal,
            borderRadius: theme.borderRadius.md,
            opacity: isDisabled ? 0.5 : 1,
            transform: [{ scale: scaleAnim }],
          },
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variantStyle.text.color as string}
          />
        ) : (
          <>
            {leftIcon}
            <Animated.Text
              style={[
                styles.text,
                variantStyle.text,
                {
                  fontSize: sizeStyle.fontSize,
                  fontFamily: theme.fontFamily.semiBold,
                  marginLeft: leftIcon ? 8 : 0,
                  marginRight: rightIcon ? 8 : 0,
                },
              ]}
              numberOfLines={1}
            >
              {title}
            </Animated.Text>
            {rightIcon}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  text: {
    textAlign: 'center',
  },
});
