import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  useDerivedValue
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';

const { width: SW } = Dimensions.get('window');
const COMPASS_SIZE = SW * 0.7;

export default function CompassScreen() {
  const { theme } = useTheme();
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [subscription, setSubscription] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  
  const rotation = useSharedValue(0);

  useEffect(() => {
    Magnetometer.isAvailableAsync().then(avail => {
      setIsAvailable(avail);
      if (avail) {
        _subscribe();
      } else if (Platform.OS === 'web') {
        // Fallback for browsers
        window.addEventListener('deviceorientation', _handleWebOrientation, true);
      }
    });

    return () => {
      _unsubscribe();
      if (Platform.OS === 'web') {
        window.removeEventListener('deviceorientation', _handleWebOrientation);
      }
    };
  }, []);

  const _handleWebOrientation = (event: any) => {
    // web 'webkitCompassHeading' is often available on iOS safari
    const heading = event.webkitCompassHeading || (360 - event.alpha);
    if (heading) {
      rotation.value = withSpring(-heading, { damping: 20, stiffness: 90 });
    }
  };

  const _subscribe = () => {
    if (subscription) return;
    setSubscription(
      Magnetometer.addListener(result => {
        setData(result);
      })
    );
    Magnetometer.setUpdateInterval(100);
  };

  const _unsubscribe = () => {
    if (subscription) {
      if (subscription.remove) subscription.remove();
      setSubscription(null);
    }
  };

  // Calculate heading
  // Use useDerivedValue to keep rotation smooth without state re-renders for the animation itself
  useEffect(() => {
    let { x, y } = data;
    let angle = 0;
    if (Math.atan2(y, x) >= 0) {
      angle = Math.atan2(y, x) * (180 / Math.PI);
    } else {
      angle = (Math.atan2(y, x) + 2 * Math.PI) * (180 / Math.PI);
    }
    // Adjust for sensor orientation (Experimental, usually -90 offset)
    const heading = Math.round(angle);
    rotation.value = withSpring(-heading, { damping: 20, stiffness: 90 });
  }, [data]);

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

  const currentDegree = Math.round(((-rotation.value % 360) + 360) % 360);
  const direction = getDirection(currentDegree);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader 
        category="UTILITIES / TOOLS" 
        title="Compass" 
      />

      <View style={styles.container}>
        <View style={styles.infoBox}>
          <Text style={[styles.degreeText, { color: theme.colors.text }]}>
            {currentDegree}°
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
          <View style={[styles.centerDot, { backgroundColor: theme.colors.background }]} />
          <View style={[styles.indicator, { backgroundColor: theme.colors.accent }]} />
        </View>

        <Card style={styles.tipsCard}>
          <MaterialCommunityIcons 
            name={isAvailable === false ? "alert-circle-outline" : "information-outline"} 
            size={20} 
            color={isAvailable === false ? "#FF5252" : theme.colors.accent} 
          />
          <Text style={[styles.tipsText, { color: theme.colors.textSecondary }]}>
            {isAvailable === false 
              ? "Your device/browser does not support the Magnetometer sensor required for the compass." 
              : "Hold your device flat and stay away from magnetic objects for best accuracy."}
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
