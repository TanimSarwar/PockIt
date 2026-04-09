import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card, Button } from '../../../components/ui';
import { notificationSuccess, lightImpact } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');

export default function BarcodeScannerScreen() {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState<{val: string, type: string, id: number}[]>([]);

  const isWeb = Platform.OS === 'web';

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!scanning) return;
    setScanning(false);
    notificationSuccess();
    setHistory((prev) => [{val: data, type, id: Date.now()}, ...prev.slice(0, 19)]);
  };

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    notificationSuccess();
  };

  if (isWeb) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader 
           category="TOOLS / SCANNER" 
           title="Barcode Scanner" 
        />
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="camera-off" size={48} color={theme.colors.textTertiary} />
              <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
                Camera scanning is available on mobile devices only.
              </Text>
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader 
           category="TOOLS / SCANNER" 
           title="Barcode Scanner" 
           subtitle="Scanning is initializing..."
        />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader 
           category="TOOLS / SCANNER" 
           title="Barcode Scanner" 
           subtitle="Grant camera permissions to start scanning."
        />
        <View style={styles.centered}>
          <MaterialCommunityIcons name="camera-off" size={64} color={theme.colors.textTertiary} />
          <Text style={[styles.permissionText, { color: theme.colors.text }]}>We need your permission to show the camera</Text>
          <Button title="Grant Permission" onPress={requestPermission} style={{ marginTop: 16, paddingHorizontal: 32 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
         category="TOOLS / SCANNER" 
         title="Barcode Scanner" 
         subtitle="Scan barcodes and QR codes with your camera instantly."
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {scanning ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e"],
              }}
            >
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
                <Pressable onPress={() => setScanning(false)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={24} color="white" />
                </Pressable>
              </View>
            </CameraView>
          </View>
        ) : (
          <Card style={styles.scanPromptCard}>
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="barcode-scan" size={64} color={theme.colors.accent} />
              <Text style={[styles.placeholderTitle, { color: theme.colors.text }]}>Ready to scan</Text>
              <Text style={[styles.placeholderSub, { color: theme.colors.textSecondary }]}>Place the barcode or QR code inside the frame to scan it automatically.</Text>
              <Button
                title="Open Camera"
                onPress={() => { lightImpact(); setScanning(true); }}
                style={{ marginTop: 24, width: '100%' }}
              />
            </View>
          </Card>
        )}

        {history.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historyHead}>
              <Text style={[styles.historyTitle, { color: theme.colors.text }]}>Recent Scans</Text>
              <Pressable onPress={() => setHistory([])}>
                <Text style={{ color: theme.colors.accent, fontSize: 13, fontWeight: '600' }}>Clear All</Text>
              </Pressable>
            </View>
            
            {history.map((item) => (
              <Card key={item.id} style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <View style={styles.iconBox}>
                    <MaterialCommunityIcons 
                      name={item.type.includes('qr') ? 'qrcode' : 'barcode'} 
                      size={20} 
                      color={theme.colors.textSecondary} 
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyText, { color: theme.colors.text }]} numberOfLines={1}>{item.val}</Text>
                    <Text style={[styles.historyMeta, { color: theme.colors.textTertiary }]}>{item.type.toUpperCase()}</Text>
                  </View>
                  <Pressable 
                    onPress={() => copy(item.val)} 
                    style={[styles.copyBtn, { backgroundColor: theme.colors.surfaceTertiary }]}
                  >
                    <MaterialCommunityIcons name="content-copy" size={16} color={theme.colors.accent} />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  permissionText: { textAlign: 'center', marginTop: 16, fontSize: 15, fontWeight: '500' },
  cameraContainer: { height: SW - 40, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 220, height: 220, borderWidth: 2, borderColor: '#fff', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  closeBtn: { position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  scanPromptCard: { padding: 10 },
  placeholder: { alignItems: 'center', paddingVertical: 20 },
  placeholderTitle: { marginTop: 16, fontSize: 20, fontWeight: '800' },
  placeholderSub: { marginTop: 8, fontSize: 14, textAlign: 'center', opacity: 0.7, paddingHorizontal: 10 },
  historySection: { marginTop: 32 },
  historyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  historyTitle: { fontSize: 18, fontWeight: '800' },
  historyCard: { marginTop: 10, padding: 12 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyText: { fontSize: 14, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  historyMeta: { fontSize: 10, fontWeight: '800', marginTop: 2 },
  copyBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
