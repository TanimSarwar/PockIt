import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/theme';
import { CATEGORY_COLORS, type FeatureCategory } from '../../constants/theme';
import { lightImpact } from '../../lib/haptics';

interface FeatureCardProps {
  icon: string;
  title: string;
  description?: string;
  onPress: () => void;
  onLongPress?: () => void;
  isPinned?: boolean;
  size?: 'small' | 'medium';
  category?: FeatureCategory;
  /** Override icon background color */
  iconBg?: string;
  /** Override icon color */
  iconColor?: string;
  /** Layout mode */
  layout?: 'regular' | 'wide' | 'narrow';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  onPress,
  onLongPress,
  isPinned,
  size = 'medium',
  category,
  iconBg,
  iconColor,
  layout = 'regular',
}) => {
  const { theme, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 60, bounciness: 0 }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();

  const handlePress = () => {
    lightImpact();
    onPress();
  };

  const isSmall = size === 'small';

  // Resolve icon colors: explicit > category > theme accent
  const catColors = category
    ? isDark
      ? CATEGORY_COLORS[category]?.dark
      : CATEGORY_COLORS[category]?.light
    : null;

  const resolvedIconBg    = iconBg    ?? catColors?.bg    ?? theme.colors.accentLight;
  const resolvedIconColor = iconColor ?? catColors?.icon  ?? theme.colors.accent;

  const iconSize      = isSmall ? 18 : 22;
  const iconBoxSize   = isSmall ? 40 : 48;
  const iconBoxRadius = isSmall ? 12 : 16;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={title}
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: layout === 'narrow' ? 24 : 32,
            padding: layout === 'narrow' ? 12 : 20,
            flexDirection: layout === 'regular' ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: layout === 'regular' ? 'center' : 'flex-start',
            minHeight: layout === 'wide' ? 110 : layout === 'narrow' ? 68 : 140,
          },
          theme.shadows.card,
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: resolvedIconBg,
              width: layout === 'narrow' ? 36 : iconBoxSize,
              height: layout === 'narrow' ? 36 : iconBoxSize,
              borderRadius: layout === 'narrow' ? 10 : iconBoxRadius,
              marginRight: layout !== 'regular' ? 16 : 0,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={layout === 'narrow' ? 16 : iconSize}
            color={resolvedIconColor}
          />
        </View>

        {/* Pin badge */}
        {isPinned && (
          <View style={[styles.pinBadge, { backgroundColor: theme.colors.accent }]}>
            <MaterialCommunityIcons name="pin" size={10} color="#fff" />
          </View>
        )}

        {/* Text Container */}
        <View style={{ flex: 1, alignItems: layout === 'regular' ? 'center' : 'flex-start' }}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: layout === 'narrow' ? 14 : 15,
                marginTop: layout === 'regular' ? 12 : 0,
                fontFamily: theme.fontFamily.bold,
                textAlign: layout === 'regular' ? 'center' : 'left',
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {description && layout !== 'narrow' && (
            <Text
              style={[
                styles.description,
                { color: theme.colors.textTertiary, fontFamily: theme.fontFamily.medium, textAlign: layout === 'regular' ? 'center' : 'left' },
              ]}
              numberOfLines={layout === 'wide' ? 2 : 1}
            >
              {description}
            </Text>
          )}
        </View>

        {layout === 'narrow' && (
           <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textTertiary} style={{ opacity: 0.5 }} />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    lineHeight: 18,
  },
  description: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.7,
    letterSpacing: 0.2,
  },
});
