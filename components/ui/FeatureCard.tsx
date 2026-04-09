import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  withDelay,
  FadeInDown
} from 'react-native-reanimated';

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
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const iconDraw = useSharedValue(0);
  const iconRotate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  React.useEffect(() => {
    iconDraw.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 150 }));
    iconRotate.value = withDelay(100, withSpring(1, { damping: 10, stiffness: 120 }));
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconDraw.value,
    transform: [
      { scale: iconDraw.value },
      { rotate: `${(1 - iconRotate.value) * 15}deg` },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 100 });
  };

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

  const resolvedIconColor = iconColor ?? catColors?.icon ?? theme.colors.accent;

  const iconSize      = isSmall ? 18 : 22;
  const iconBoxSize   = isSmall ? 40 : 48;

  const isNarrow = layout === 'narrow';
  const isWide = layout === 'wide';
  const isRegular = layout === 'regular';

  return (
    <Animated.View style={[animatedStyle]}>
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
            borderRadius: isNarrow ? 20 : 28,
            paddingVertical: isNarrow ? 10 : 12,
            paddingHorizontal: isNarrow ? 12 : 14,
            flexDirection: isRegular ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: isRegular ? 'center' : 'flex-start',
            minHeight: isWide ? 85 : isNarrow ? 60 : (description ? 120 : 100),
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.2 : 0.03,
            shadowRadius: 10,
          },
        ]}
      >
        {/* Icon (No Background) */}
        <Animated.View
          style={[
            styles.iconBox,
            {
              width: isNarrow ? 36 : iconBoxSize,
              height: isNarrow ? 36 : iconBoxSize,
              marginRight: !isRegular ? 14 : 0,
              marginBottom: isRegular ? 8 : 0,
            },
            iconAnimatedStyle
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={isNarrow ? 20 : iconSize + 2}
            color={resolvedIconColor}
          />
        </Animated.View>

        {/* Pin badge */}
        {isPinned && (
          <View style={[styles.pinBadge, { backgroundColor: theme.colors.accent }]}>
            <MaterialCommunityIcons name="pin" size={10} color="#fff" />
          </View>
        )}

        {/* Text Container */}
        <View style={{ flex: 1, alignItems: isRegular ? 'center' : 'flex-start' }}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: isNarrow ? 14 : 15,
                fontFamily: theme.fontFamily.bold,
                textAlign: isRegular ? 'center' : 'left',
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {description && !isNarrow && (
            <Text
              style={[
                styles.description,
                { 
                  color: theme.colors.textSecondary, 
                  fontFamily: theme.fontFamily.medium, 
                  textAlign: isRegular ? 'center' : 'left',
                  marginTop: 2,
                },
              ]}
              numberOfLines={isWide ? 2 : 1}
            >
              {description}
            </Text>
          )}
        </View>

        {isNarrow && (
           <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.textTertiary} style={{ opacity: 0.4 }} />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    lineHeight: 20,
  },
  description: {
    fontSize: 11,
    opacity: 0.8,
  },
});
