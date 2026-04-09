import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { lightImpact, mediumImpact, notificationSuccess, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');

const SIZES = [
  { label: 'Small', value: 160 },
  { label: 'Medium', value: 220 },
  { label: 'Large', value: 280 },
];

export default function QRGeneratorScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [text, setText] = useState('https://lotto.com.bd');
  const [size, setSize] = useState(220);

  const handleSizeChange = (s: number) => {
    selectionFeedback();
    setSize(s);
  };

  const qrRef = React.useRef<any>(null);

  const handleSave = () => {
    mediumImpact();
    if (!qrRef.current) {
      console.warn('QR Code ref not ready');
      return;
    }

    qrRef.current.toDataURL((data: string) => {
      if (Platform.OS === 'web') {
        try {
          const link = document.createElement('a');
          link.href = `data:image/png;base64,${data}`;
          link.download = `pockit-qr-${Date.now()}.png`;
          link.click();
        } catch (err) {
          console.error('Web download failed:', err);
        }
      } else {
        // For native, we would typically use expo-media-library
        // For now, providing a console log and feedback
        console.log('Native save triggered with length:', data.length);
      }
    });
  };

  return (
    <View style={[s.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        category="TOOLS / GENERATE"
        title="QR Generator"
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Input Card ── */}
        <View style={[s.glassCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[s.inputLabel, { color: theme.colors.textTertiary }]}>TEXT OR URL</Text>
          <View style={[s.inputWrap, { backgroundColor: theme.colors.surfaceTertiary }]}>
            <MaterialCommunityIcons name="link-variant" size={18} color={theme.colors.accent} />
            <TextInput
              style={[s.input, { color: theme.colors.text }]}
              value={text}
              onChangeText={setText}
              placeholder="Enter your link here..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              underlineColorAndroid="transparent"
            />
          </View>
        </View>

        {/* ── Preview Card ── */}
        <View style={[s.previewCard, { backgroundColor: theme.colors.surface }]}>
          <View style={s.qrWrapper}>
            <View style={[s.qrBg, { backgroundColor: '#FFF' }]}>
              {text.trim().length > 0 ? (
                <QRCode 
                  getRef={(c) => (qrRef.current = c)}
                  value={text} 
                  size={size - 40} 
                  backgroundColor="#FFFFFF" 
                  color={theme.colors.text} 
                />
              ) : (
                <MaterialCommunityIcons name="qrcode-remove" size={60} color="#E5E7EB" />
              )}
            </View>
            <Text style={[s.sizeIndicator, { color: theme.colors.textTertiary }]}>{size}px</Text>
          </View>

          <View style={s.divider} />

          <Text style={[s.sectionTitle, { color: theme.colors.text }]}>Size Options</Text>
          <View style={s.sizePills}>
            {SIZES.map((sze) => {
              const active = size === sze.value;
              return (
                <Pressable
                  key={sze.value}
                  onPress={() => handleSizeChange(sze.value)}
                  style={[
                    s.pill, 
                    { backgroundColor: theme.colors.surfaceTertiary },
                    active && { backgroundColor: theme.colors.accent }
                  ]}
                >
                  <Text style={[s.pillText, { color: theme.colors.textSecondary }, active && { color: '#FFF' }]}>
                    {sze.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable 
            style={[s.downloadBtn, { backgroundColor: theme.colors.accent }]}
            onPress={handleSave}
          >
            <MaterialCommunityIcons name="download" size={20} color="#FFF" />
            <Text style={s.downloadTxt}>Save to Gallery</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  scroll:    { paddingHorizontal: 20, paddingBottom: 100 },


  glassCard: { borderRadius: 24, padding: 20, marginBottom: 20, 
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 3 } })
  },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16 },
  input: { flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '500', maxHeight: 80, borderWidth: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },

  previewCard: { borderRadius: 30, padding: 24, alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20 }, android: { elevation: 6 } })
  },
  qrWrapper: { alignItems: 'center', marginBottom: 20 },
  qrBg: { padding: 20, borderRadius: 24, backgroundColor: '#FFF', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  sizeIndicator: { fontSize: 11, fontWeight: '700', marginTop: 14 },
  
  divider: { height: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16, alignSelf: 'flex-start' },
  sizePills: { flexDirection: 'row', gap: 10, marginBottom: 24, width: '100%' },
  pill: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 13, fontWeight: '700' },

  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', paddingVertical: 16, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  downloadTxt: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
