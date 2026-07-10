import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  StatusBar,
  Easing,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height, width } = Dimensions.get('window');

export default function CarInteriorScreen() {
  // Animation References
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance Animation - Zoom In from small to normal
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 25,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous Zoom In/Out Animation (more dramatic)
    Animated.loop(
      Animated.sequence([
        // Zoom In
        Animated.timing(zoomAnim, {
          toValue: 1.3, // Zoom in 30%
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        // Zoom Out
        Animated.timing(zoomAnim, {
          toValue: 0.7, // Zoom out 30%
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        // Back to Normal
        Animated.timing(zoomAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.container}>
        {/* Dark Background */}
        <View style={styles.background} />

        {/* Center-Aligned Animated Logo */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { scale: zoomAnim } // Continuous zoom effect
              ]
            }
          ]}
        >
          {/* Logo Section */}
          <Animated.Image
            source={require('../screens/assets/logo11.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: width * 0.5,
    height: height * 0.3,
    maxWidth: 350,
    maxHeight: 350,
  },
});