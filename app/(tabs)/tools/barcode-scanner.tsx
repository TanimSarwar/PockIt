import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card, Button } from '../../../components/ui';
import { notificationSuccess, lightImpact, selectionFeedback } from '../../../lib/haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  FadeInDown, 
  FadeIn 
} from 'react-native-reanimated';

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
           title="Universal Scanner" 
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
           title="Universal Scanner" 
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
           title="Universal Scanner" 
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
         title="Universal Scanner" 
         subtitle="Scan QR codes and barcodes with total precision."
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {scanning ? (
          <Animated.View entering={FadeIn} style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e", "pdf417", "datamatrix"],
              }}
            >
              <View style={styles.overlay}>
                <View style={styles.scanFrame}>
                   <View style={styles.cornerTL} />
                   <View style={styles.cornerTR} />
                   <View style={styles.cornerBL} />
                   <View style={styles.cornerBR} />
                </View>
                <Pressable onPress={() => { lightImpact(); setScanning(false); }} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={24} color="white" />
                </Pressable>
                <Text style={styles.overlayText}>Align code within frame</Text>
              </View>
            </CameraView>
          </Animated.View>
        ) : (
          <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
            <MaterialCommunityIcons name="qrcode-scan" size={42} color="white" style={{ marginBottom: 16 }} />
            <Text style={styles.featuredLabel}>AI POWERED SCANNER</Text>
            <Text style={styles.featuredTitle}>Capture Anything</Text>
            <Pressable
              onPress={() => { selectionFeedback(); setScanning(true); }}
              style={styles.featuredPlay}
            >
              <MaterialCommunityIcons name="camera" size={18} color={theme.colors.accent} />
              <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>Open Scanner</Text>
            </Pressable>
          </LinearGradient>
        )}

        <View style={[styles.historySection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.historyHead}>
            <Text style={[styles.historyTitle, { color: theme.colors.text }]}>Recent Activity</Text>
            <Pressable onPress={() => { lightImpact(); setHistory([]); }}>
              <Text style={{ color: theme.colors.accent, fontSize: 13, fontWeight: '700' }}>{history.length > 0 ? 'Clear' : ''}</Text>
            </Pressable>
          </View>
          
          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="history" size={32} color={theme.colors.textTertiary} opacity={0.5} />
              <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>No recent scans</Text>
            </View>
          ) : (
            history.map((item, idx) => (
              <Animated.View 
                entering={FadeInDown.delay(idx * 50)} 
                key={item.id} 
                style={[styles.historyItem, { borderBottomColor: theme.colors.surfaceSecondary }]}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <MaterialCommunityIcons 
                    name={item.type.includes('qr') ? 'qrcode' : 'barcode'} 
                    size={20} 
                    color={theme.colors.accent} 
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
                  <MaterialCommunityIcons name="content-copy" size={16} color={theme.colors.textSecondary} />
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  permissionText: { textAlign: 'center', marginTop: 16, fontSize: 15, fontWeight: '500' },
  featuredCard: { borderRadius: 24, padding: 24, marginBottom: 24, minHeight: 180, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center', marginBottom: 4 },
  featuredTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 20, textAlign: 'center' },
  featuredPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  featuredPlayText: { fontSize: 14, fontWeight: '700' },
  cameraContainer: { height: SW - 32, borderRadius: 28, overflow: 'hidden', backgroundColor: '#000', marginBottom: 24 },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 240, height: 240, position: 'relative' },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#fff', borderTopLeftRadius: 20 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#fff', borderTopRightRadius: 20 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#fff', borderBottomLeftRadius: 20 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#fff', borderBottomRightRadius: 20 },
  closeBtn: { position: 'absolute', top: 20, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  overlayText: { color: 'white', marginTop: 40, fontSize: 15, fontWeight: '600', opacity: 0.8 },
  placeholder: { alignItems: 'center', paddingVertical: 40 },
  historySection: { borderRadius: 24, padding: 20 },
  historyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  historyTitle: { fontSize: 18, fontWeight: '800' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyText: { fontSize: 15, fontWeight: '700' },
  historyMeta: { fontSize: 11, fontWeight: '800', marginTop: 3, letterSpacing: 0.5 },
  copyBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '600' },
});
