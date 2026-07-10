import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  Platform,
  StyleSheet,
  StatusBar,
  View,
  TouchableOpacity,
  PermissionsAndroid,
  AppState,
} from 'react-native';

// --- FIREBASE & NOTIFEE IMPORTS ---
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

import apiClient from './src/services/apiConfig';
import Login from './src/screens/Home';
import SplashScreen from './src/screens/SplashScreen';
import SignUp from './src/screens/SignUp';
import Home from './src/screens/dashboard';
import VehicleList from './src/screens/vehicleList';
import BookingInfo from './src/screens/bookinginfo';
import Rides from './src/screens/Rides';
import Account from './src/screens/Account';
import Help from './src/screens/Help';
import ChatScreen from './src/screens/ChatScreen';
import PaymentScreen from './src/screens/PaymentsScreen';

// Import SVG Icons
import HomeIcon from './src/screens/assets/icons/HomeIcon';
import RidesIcon from './src/screens/assets/icons/RidesIcon';
import AccountIcon from './src/screens/assets/icons/AccountIcon';
import HelpIcon from './src/screens/assets/icons/HelpIcon';
import TrackDriver from './src/screens/trackDriver';

// Create an Auth Context so children screens can cleanly alter authentication state
export const AuthContext = createContext();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- BACKGROUND MESSAGE HANDLER ---
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('FCM Message Handled in Background State:', remoteMessage);
  
  // Display notification when app is in background
  await displayNotification(remoteMessage);
});

// --- NOTIFICATION DISPLAY FUNCTION ---
const displayNotification = async (remoteMessage) => {
  try {
    const channelId = await notifee.createChannel({
      id: 'cab_booking_default',
      name: 'Ride Updates',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      lights: true,
    });

    await notifee.displayNotification({
      title: remoteMessage.notification?.title || 'Ride Update',
      body: remoteMessage.notification?.body || 'You have a new notification',
      data: remoteMessage.data || {},
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        sound: 'default',
        pressAction: {
          id: 'default',
        },
        smallIcon: 'ic_notification',
        color: '#F29D38',
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
      },
    });
  } catch (error) {
    console.error('Error displaying notification:', error);
  }
};

const GlobalStatusBar = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
    StatusBar.setBarStyle('dark-content');
  }, []);

  return (
    <StatusBar
      barStyle="dark-content"
      backgroundColor="transparent"
      translucent={true}
    />
  );
};

const TabBarIcon = ({ focused, color, size, IconComponent }) => {
  return (
    <View style={styles.iconContainer}>
      {focused && <View style={styles.topActiveLine} />}
      <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
        <IconComponent color={focused ? '#FFFFFF' : color} size={size} />
      </View>
      {focused && <View style={styles.dotIndicator} />}
    </View>
  );
};

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          height:
            Platform.OS === 'android' ? 85 + insets.bottom : 90 + insets.bottom,
          paddingTop: 10,
          paddingBottom:
            Platform.OS === 'android'
              ? Math.max(10, insets.bottom)
              : Math.max(20, insets.bottom),
          elevation: 20,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0,
          shadowRadius: 0,
          overflow: 'visible',
        },
        tabBarButton: props => (
          <TouchableOpacity {...props} activeOpacity={1} />
        ),
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500', marginBottom: 5 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              IconComponent={HomeIcon}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Trips"
        component={Rides}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              IconComponent={RidesIcon}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={Account}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              IconComponent={AccountIcon}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Help"
        component={Help}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              IconComponent={HelpIcon}
            />
          ),
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
};

const AuthenticatedStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="VehicleList" component={VehicleList} />
      <Stack.Screen name="BookingInfo" component={BookingInfo} />
      <Stack.Screen name="TrackDriver" component={TrackDriver} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Payments" component={PaymentScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  // --- FCM NOTIFICATION SERVICE ENGINE ---
  useEffect(() => {
    // 1. Request Runtime Permission (Android 13+ and iOS target handling)
    const requestPermission = async () => {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const authStatus = await messaging().requestPermission();
          return (
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL
          );
        }
      } catch (error) {
        console.error('Permission request error:', error);
        return false;
      }
    };

    // 2. Fetch FCM Unique Device Token and save to backend
    const getFcmToken = async () => {
      try {
        await messaging().registerDeviceForRemoteMessages();
        const token = await messaging().getToken();
        console.log('--- YOUR DEVICE FCM TOKEN ---');
        console.log(token);
        
        // // Save token to backend
        // if (token && isLoggedIn) {
        //   try {
        //     await apiClient.post('/user/fcm-token', { fcmToken: token });
        //     console.log('FCM token saved to backend successfully');
        //   } catch (error) {
        //     console.error('Error saving FCM token to backend:', error);
        //   }
        // }
        
        return token;
      } catch (error) {
        console.error('Error fetching FCM device token:', error);
        return null;
      }
    };

    // 3. Token Refresh Listener
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
      console.log('FCM Token Refreshed:', token);
      if (isLoggedIn) {
        try {
          await apiClient.post('/user/fcm-token', { fcmToken: token });
          console.log('Refreshed FCM token saved to backend');
        } catch (error) {
          console.error('Error saving refreshed FCM token:', error);
        }
      }
    });

    // 4. Initialize notification processes when user logs into their dashboard profile
    const initializeNotifications = async () => {
      if (isLoggedIn) {
        const hasPermission = await requestPermission();
        if (hasPermission) {
          await getFcmToken();
        }
      }
    };

    initializeNotifications();

    // 5. Foreground Message Display Listener (Uses Notifee UI layer engine)
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground Message received:', remoteMessage);
      await displayNotification(remoteMessage);
    });

    // 6. Handle notification press (when user taps on notification)
    const unsubscribeNotificationPress = notifee.onForegroundEvent(
      async ({ type, detail }) => {
        if (type === EventType.PRESS) {
          console.log('Notification Pressed:', detail);
          // Handle navigation based on notification data
          const data = detail.notification?.data;
          if (data?.screen) {
            // Navigation logic here
            console.log('Navigate to:', data.screen);
          }
        }
      }
    );

    // 7. Handle app state changes for token refresh
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && isLoggedIn) {
        // Refresh token when app comes to foreground
        getFcmToken();
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeTokenRefresh();
      unsubscribeNotificationPress();
      subscription.remove();
    };
  }, [isLoggedIn]);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        try {
          const response = await apiClient.get('/user');
          if (response.data.success) {
            setIsLoggedIn(true);
          } else {
            await clearSession();
          }
        } catch (apiError) {
          await clearSession();
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Login check error:', error);
      setIsLoggedIn(false);
    } finally {
      setTimeout(() => setLoading(false), 3000);
    }
  };

  const clearSession = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    setIsLoggedIn(false);
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="Authenticated" component={AuthenticatedStack} />
      ) : (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
        </>
      )}
    </Stack.Navigator>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
        <NavigationContainer>
          <GlobalStatusBar />
          <AppNavigator />
        </NavigationContainer>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 60,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#F29D38',
    elevation: 10,
    transform: [{ translateY: -15 }],
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  
 
});

export default App;