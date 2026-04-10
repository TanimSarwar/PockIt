import React from 'react';
import { TextInput, TextInputProps, StyleSheet, Platform, View, ViewStyle, TextStyle, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/theme';


interface PockItInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  wrapperStyle?: ViewStyle;
  icon?: React.ReactNode;
  label?: string;
  showClear?: boolean;
  onClear?: () => void;
}

export const PockItInput = React.forwardRef<TextInput, PockItInputProps>(({ 
  containerStyle, 
  inputStyle, 
  wrapperStyle,
  icon,
  label,
  showClear,
  onClear,
  ...props 
}, ref) => {
  const { theme } = useTheme();

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputWrapper, 
        { 
          backgroundColor: theme.colors.surfaceSecondary,
          borderRadius: 16,
        },
        wrapperStyle
      ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          {...props}
          ref={ref}
          placeholderTextColor={theme.colors.textTertiary}
          selectionColor={theme.colors.accent}
          underlineColorAndroid="transparent"
          style={[
            styles.input,
            { 
              color: theme.colors.text,
            },
            inputStyle
          ]}
        />
        {showClear && props.value && props.value.length > 0 && (
          <Pressable 
            onPress={onClear} 
            hitSlop={10}
            style={styles.clearBtn}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textTertiary} />
          </Pressable>
        )}
      </View>
    </View>
  );
});

export const Input = PockItInput;

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    width: '100%',
    overflow: 'hidden',
  },
  iconContainer: {
    marginRight: 8,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderColor: 'transparent',
      } as any,
    }),
  },
});
