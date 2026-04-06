import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/theme';
import type { Theme } from '../../constants/theme';

type BadgeVariant = 'accent' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress?: () => void;
  onRemove?: () => void;
}

function getVariantColors(
  variant: BadgeVariant,
  theme: Theme,
): { bg: string; text: string } {
  switch (variant) {
    case 'accent':
      return { bg: theme.colors.accentMuted, text: theme.colors.accent };
    case 'success':
      return { bg: theme.colors.successBg, text: theme.colors.success };
    case 'warning':
      return { bg: theme.colors.warningBg, text: theme.colors.warning };
    case 'error':
      return { bg: theme.colors.errorBg, text: theme.colors.error };
    case 'neutral':
      return {
        bg: theme.colors.surfaceSecondary,
        text: theme.colors.textSecondary,
      };
  }
}

export function Badge({
  label,
  variant = 'accent',
  icon,
  onPress,
  onRemove,
}: BadgeProps) {
  const { theme } = useTheme();
  const colors = getVariantColors(variant, theme);

  const badgeStyle: ViewStyle = {
    backgroundColor: colors.bg,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  };

  const content = (
    <>
      {icon != null && (
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={colors.text}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          theme.typography.caption,
          { color: colors.text, fontFamily: theme.fontFamily.medium },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {onRemove != null && (
        <Pressable
          onPress={onRemove}
          style={styles.removeButton}
          accessibilityLabel={`Remove ${label}`}
          accessibilityRole="button"
          hitSlop={6}
        >
          <MaterialCommunityIcons
            name="close"
            size={12}
            color={colors.text}
          />
        </Pressable>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={badgeStyle}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={badgeStyle} accessibilityLabel={label}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    marginRight: 4,
  },
  removeButton: {
    marginLeft: 4,
    padding: 2,
  },
});
