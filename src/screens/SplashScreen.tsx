import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  ImageBackground,
  Dimensions,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function CarInteriorScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
          {/* Dark Overlay */}
          <View style={styles.overlay} />

          {/* Center Content */}
          <View style={styles.contentContainer}>
            <View style={styles.centerContent}>
              <Image
                source={require('../screens/assets/logo.png')} // Apne logo ka path yahan do
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.brandName}>
                BlackLane Cab Booking
              </Text>

              <Text style={styles.tagline}>
                Premium Ride Experience
              </Text>
            </View>
          </View>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    
  },

  container: {
    flex: 1,
    
  },

  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },

  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#080808',
    letterSpacing: 2,
    textAlign: 'center',

    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 5,
  },

  tagline: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 1,
    textAlign: 'center',
  },
});