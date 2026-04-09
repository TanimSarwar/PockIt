import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/theme';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
  autoFocus?: boolean;
  onSearch?: (text: string) => void;
  containerStyle?: any;
}

export function SearchBar({
  value: controlledValue,
  onChangeText,
  placeholder = 'Search...',
  debounceMs = 300,
  autoFocus = false,
  onSearch,
  containerStyle,
}: SearchBarProps) {
  const { theme } = useTheme();
  const [internalValue, setInternalValue] = useState(controlledValue ?? '');
  const borderAnim = useRef(new Animated.Value(0)).current;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Sync controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleFocus = useCallback(() => {
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderAnim]);

  const handleBlur = useCallback(() => {
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderAnim]);

  const handleChangeText = useCallback(
    (text: string) => {
      setInternalValue(text);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        onChangeText?.(text);
      }, debounceMs);
    },
    [onChangeText, debounceMs],
  );

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChangeText?.('');
    inputRef.current?.focus();
  }, [onChangeText]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceSecondary,
          borderRadius: theme.borderRadius.md,
        },
        containerStyle,
      ]}
    >
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color={theme.colors.textTertiary}
        style={styles.searchIcon}
      />
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          theme.typography.body,
          { color: theme.colors.text },
        ]}
        value={internalValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        underlineColorAndroid="transparent"
        accessibilityLabel={placeholder}
      />
      {internalValue.length > 0 && !onSearch && (
        <Pressable
          onPress={handleClear}
          style={styles.clearButton}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={18}
            color={theme.colors.textTertiary}
          />
        </Pressable>
      )}
      {onSearch && (
        <Pressable
          onPress={() => onSearch(internalValue)}
          style={[styles.searchButton, { backgroundColor: theme.colors.accent }]}
          accessibilityLabel="Submit search"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color="#fff"
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    // NO borderWidth — blends with background
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
