import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';

const { width: SW } = Dimensions.get('window');
const COMPASS_SIZE = SW * 0.7;

export default function CompassScreen() {
  const { theme } = useTheme();
  const [heading, setHeading] = useState(0);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const rotation = useSharedValue(0);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      if (Platform.OS === 'web') {
        setIsAvailable(true);
        window.addEventListener('deviceorientation', _handleWebOrientation, true);
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied. Compass requires location for accuracy.');
          setIsAvailable(false);
          return;
        }

        // Check if compass is available
        const hasServices = await Location.hasServicesEnabledAsync();
        if (!hasServices) {
           setErrorMsg('Location services are disabled.');
           setIsAvailable(false);
           return;
        }

        setIsAvailable(true);
        subscription = await Location.watchHeadingAsync((data) => {
          const newHeading = data.trueHeading !== -1 ? data.trueHeading : data.magHeading;
          setHeading(Math.round(newHeading));
          rotation.value = withSpring(-newHeading, { damping: 20, stiffness: 90 });
        });
      } catch (err) {
        console.error(err);
        setErrorMsg('Error accessing compass sensors.');
        setIsAvailable(false);
      }
    };

    startWatching();

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (Platform.OS === 'web') {
        window.removeEventListener('deviceorientation', _handleWebOrientation);
      }
    };
  }, []);

  const _handleWebOrientation = (event: any) => {
    // web 'webkitCompassHeading' is often available on iOS safari
    const h = event.webkitCompassHeading || (360 - event.alpha);
    if (h !== undefined && h !== null) {
      setHeading(Math.round(h));
      rotation.value = withSpring(-h, { damping: 20, stiffness: 90 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const getDirection = (degree: number) => {
    const d = (degree % 360 + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'N';
    if (d >= 22.5 && d < 67.5) return 'NE';
    if (d >= 67.5 && d < 112.5) return 'E';
    if (d >= 112.5 && d < 157.5) return 'SE';
    if (d >= 157.5 && d < 202.5) return 'S';
    if (d >= 202.5 && d < 247.5) return 'SW';
    if (d >= 247.5 && d < 292.5) return 'W';
    if (d >= 292.5 && d < 337.5) return 'NW';
    return 'N';
  };

  const direction = getDirection(heading);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
        category="UTILITIES / TOOLS" 
        title="Compass" 
      />

      <View style={styles.container}>
        <View style={styles.infoBox}>
          <Text style={[styles.degreeText, { color: theme.colors.text }]}>
            {heading}°
          </Text>
          <Text style={[styles.directionText, { color: theme.colors.accent }]}>
            {direction}
          </Text>
        </View>

        <View style={styles.compassWrapper}>
          {/* Static outer ring */}
          <View style={[styles.outerRing, { borderColor: theme.colors.borderLight }]} />
          
          {/* Rotating compass */}
          <Animated.View style={[styles.compass, animatedStyle]}>
            <View style={styles.markings}>
               <Text style={[styles.mark, styles.markN, { color: theme.colors.textTertiary }]}>N</Text>
               <Text style={[styles.mark, styles.markE, { color: theme.colors.textTertiary }]}>E</Text>
               <Text style={[styles.mark, styles.markS, { color: theme.colors.textTertiary }]}>S</Text>
               <Text style={[styles.mark, styles.markW, { color: theme.colors.textTertiary }]}>W</Text>
            </View>
            
            {/* Needle */}
            <View style={styles.needleWrapper}>
               <View style={[styles.needleNorth, { borderBottomColor: theme.colors.accent }]} />
               <View style={[styles.needleSouth, { borderTopColor: theme.colors.textTertiary }]} />
            </View>
          </Animated.View>
          
          {/* Static Center Point */}
          <View style={[styles.centerDot, { backgroundColor: theme.colors.background, borderColor: theme.colors.accent }]} />
          <View style={[styles.indicator, { backgroundColor: theme.colors.accent }]} />
        </View>

        <Card style={styles.tipsCard}>
          <MaterialCommunityIcons 
            name={isAvailable === false ? "alert-circle-outline" : "information-outline"} 
            size={20} 
            color={isAvailable === false ? "#FF5252" : theme.colors.accent} 
          />
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            {errorMsg ? errorMsg : (isAvailable === false 
              ? "Your device/browser does not support the sensors required for the compass." 
              : "Hold your device flat and stay away from magnetic objects for best accuracy.")}
          </Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  infoBox: { alignItems: 'center', marginBottom: 40 },
  degreeText: { fontSize: 64, fontWeight: '900', letterSpacing: -2 },
  directionText: { fontSize: 24, fontWeight: '800', marginTop: -8, letterSpacing: 2 },
  compassWrapper: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  outerRing: {
    position: 'absolute',
    width: COMPASS_SIZE + 20,
    height: COMPASS_SIZE + 20,
    borderRadius: (COMPASS_SIZE + 20) / 2,
    borderWidth: 2,
    opacity: 0.3,
  },
  compass: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markings: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  mark: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: '900',
  },
  markN: { top: 10, alignSelf: 'center' },
  markE: { right: 10, top: '50%', marginTop: -10 },
  markS: { bottom: 10, alignSelf: 'center' },
  markW: { left: 10, top: '50%', marginTop: -10 },
  needleWrapper: {
    width: 20,
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleNorth: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: COMPASS_SIZE / 2.5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  needleSouth: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: COMPASS_SIZE / 2.5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  centerDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#7C3AED',
  },
  indicator: {
    position: 'absolute',
    top: -30,
    width: 4,
    height: 30,
    borderRadius: 2,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
