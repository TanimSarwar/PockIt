import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, mediumImpact, notificationSuccess, selectionFeedback } from '../../../lib/haptics';

import { PockItInput } from '../../../components/ui/Input';

const { width: SW } = Dimensions.get('window');

const SIZES = [
  { label: 'Small', value: 180 },
  { label: 'Medium', value: 250 },
  { label: 'Large', value: 310 },
];

export default function QRGeneratorScreen() {
  const { theme } = useTheme();
  const [text, setText] = useState('https://www.google.com');
  const [size, setSize] = useState(310);
  const [isSaving, setIsSaving] = useState(false);

  const shotRef = useRef<View>(null);

  const handleSizeChange = (s: number) => {
    selectionFeedback();
    setSize(s);
  };

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text or a link first.');
      return;
    }

    mediumImpact();
    setIsSaving(true);

    try {
      // Capture the entire shotRef view which contains the QR + white background + padding
      const uri = await captureRef(shotRef, {
        format: 'png',
        quality: 1,
        // High quality scale for results
        result: 'tmpfile',
      });

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `pockit-qr-${Date.now()}.png`;
        link.click();
        notificationSuccess();
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          notificationSuccess();
          Alert.alert('Success', 'QR Code saved to your gallery!');
        } else {
          Alert.alert('Permission Denied', 'PockIt needs permission to save images to your gallery.');
        }
      }
    } catch (err) {
      console.error('Save failed:', err);
      Alert.alert('Error', 'Failed to save QR code. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="TOOLS / GENERATE"
        title="QR Generator"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Featured Preview Card ── */}
        <LinearGradient 
          colors={theme.palette.gradient as any} 
          style={styles.featuredCard}
        >
          <View style={styles.captureContainer}>
            {/* This is the area that will be captured */}
            <View 
              ref={shotRef} 
              collapsable={false}
              style={[styles.qrCaptureArea, { backgroundColor: '#FFFFFF' }]}
            >
              {text.trim().length > 0 ? (
                <QRCode 
                  value={text} 
                  size={size - 30} 
                  backgroundColor="#FFFFFF" 
                  color="#000000"
                  quietZone={8}
                />
              ) : (
                <View style={styles.placeholder}>
                  <MaterialCommunityIcons name="qrcode-remove" size={50} color="#E5E7EB" />
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* ── Configuration Card ── */}
        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
          {/* Standardized Input Field with Clear Button */}
          <PockItInput
            value={text}
            onChangeText={setText}
            placeholder="Enter link or text..."
            icon={<MaterialCommunityIcons name="link-variant" size={20} color={theme.colors.accent} />}
            showClear={true}
            onClear={() => { setText(''); selectionFeedback(); }}
            multiline
            wrapperStyle={{ height: 'auto', minHeight: 48, backgroundColor: theme.colors.surfaceTertiary }}
            inputStyle={{ paddingVertical: 12, minHeight: 48 }}
          />

          {/* Compact Actions Row */}
          <View style={styles.actionsRow}>
            {/* Size Choice */}
            <View style={styles.sizeSelectionGroup}>
              {SIZES.map((sze) => {
                const active = size === sze.value;
                const labelMap: Record<number, string> = { 180: 'S', 250: 'M', 310: 'L' };
                return (
                  <Pressable
                    key={sze.value}
                    onPress={() => handleSizeChange(sze.value)}
                    style={[
                      styles.sizeIconBtn, 
                      { backgroundColor: active ? theme.colors.accent : theme.colors.surfaceTertiary }
                    ]}
                  >
                    <Text style={[styles.sizeIconText, { color: active ? '#FFF' : theme.colors.textSecondary }]}>
                      {labelMap[sze.value]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Download Button */}
            <Pressable 
              disabled={isSaving}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.downloadBtn, 
                { backgroundColor: theme.colors.accent },
                (pressed || isSaving) && { opacity: 0.8, transform: [{ scale: 0.98 }] }
              ]}
            >
              <MaterialCommunityIcons 
                name={isSaving ? "loading" : "download"} 
                size={20} 
                color="#FFF" 
              />
              <Text style={styles.downloadTxt}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  
  // Featured Card Styles
  featuredCard: { 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16, 
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 380, // Fixed height to prevent layout jumps when size changes
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  captureContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 24,
  },
  qrCaptureArea: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 140,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Settings Card Styles
  settingsCard: { 
    borderRadius: 24, 
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  sizeSelectionGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  sizeIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeIconText: {
    fontSize: 13,
    fontWeight: '800',
  },

  downloadBtn: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    height: 44,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  downloadTxt: { 
    color: '#FFF', 
    fontSize: 15, 
    fontWeight: '800' 
  },
});

