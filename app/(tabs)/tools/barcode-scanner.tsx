import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card, Button } from '../../../components/ui';
import { notificationSuccess } from '../../../lib/haptics';

export default function BarcodeScannerScreen() {
  const { theme } = useTheme();
  const [history, setHistory] = useState<string[]>([]);

  // Camera-based scanning requires native modules; show placeholder on web
  const isWeb = Platform.OS === 'web';

  const addToHistory = (value: string) => {
    setHistory((prev) => [value, ...prev.slice(0, 19)]);
  };

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    notificationSuccess();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Barcode Scanner" />
      <ScrollView contentContainerStyle={styles.content}>
        {isWeb ? (
          <Card>
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="camera-off" size={48} color={theme.colors.textTertiary} />
              <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                Camera scanning is available on mobile devices only.
              </Text>
              <Text style={{ color: theme.colors.textTertiary, marginTop: 8, textAlign: 'center', fontSize: 13 }}>
                Use the Expo Go app or a native build to scan barcodes.
              </Text>
            </View>
          </Card>
        ) : (
          <Card>
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="barcode-scan" size={48} color={theme.colors.accent} />
              <Text style={[styles.placeholderText, { color: theme.colors.text }]}>
                Tap to scan a barcode or QR code
              </Text>
              <Button
                title="Open Scanner"
                onPress={() => {
                  // In a real implementation, this would open the camera
                  addToHistory('SAMPLE-BARCODE-' + Date.now().toString().slice(-6));
                }}
                style={{ marginTop: 16 }}
              />
            </View>
          </Card>
        )}

        {history.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.historyTitle, { color: theme.colors.text }]}>Scan History</Text>
            {history.map((item, i) => (
              <Card key={i} style={{ marginTop: 8 }}>
                <View style={styles.historyRow}>
                  <Text style={[styles.historyText, { color: theme.colors.text }]} numberOfLines={1}>{item}</Text>
                  <Pressable onPress={() => copy(item)} accessibilityLabel="Copy">
                    <MaterialCommunityIcons name="content-copy" size={18} color={theme.colors.accent} />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  placeholder: { alignItems: 'center', paddingVertical: 32 },
  placeholderText: { marginTop: 12, fontSize: 16, textAlign: 'center' },
  historyTitle: { fontSize: 16, fontWeight: '600' },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyText: { flex: 1, fontFamily: 'monospace', marginRight: 8 },
});
