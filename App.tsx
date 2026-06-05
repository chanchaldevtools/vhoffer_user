import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StyleSheet, StatusBar, View, TouchableOpacity } from 'react-native';
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

// Import SVG Icons
import HomeIcon from './src/screens/assets/icons/HomeIcon';
import RidesIcon from './src/screens/assets/icons/RidesIcon';
import AccountIcon from './src/screens/assets/icons/AccountIcon';
import HelpIcon from './src/screens/assets/icons/HelpIcon';
import TrackDriver from './src/screens/trackDriver'
// Create an Auth Context so children screens can cleanly alter authentication state
export const AuthContext = createContext();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const GlobalStatusBar = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
    StatusBar.setBarStyle('dark-content');
  }, []);

  return <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />;
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
          height: Platform.OS === 'android' ? 85 + insets.bottom : 90 + insets.bottom,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'android' ? Math.max(10, insets.bottom) : Math.max(20, insets.bottom),
          elevation: 20,

          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0,
          shadowRadius: 0,
          overflow: 'visible',
        },
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            activeOpacity={1}

          />
        ),
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500', marginBottom: 5 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={size} IconComponent={HomeIcon} />
          ),
        }}
      />
      <Tab.Screen
        name="Trips"
        component={Rides}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={size} IconComponent={RidesIcon} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={Account}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={size} IconComponent={AccountIcon} />
          ),
        }}
      />
      <Tab.Screen
        name="Help"
        component={Help}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon focused={focused} color={color} size={size} IconComponent={HelpIcon} />
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
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

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
      setTimeout(() => setLoading(false), 1000);
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

// Main Entry Point wrapped around the Auth Provider configuration context
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
  iconContainer: { alignItems: 'center', justifyContent: 'center', width: 70, height: 60 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  iconCircleActive: {
    backgroundColor: '#F29D38',
    elevation: 10,
    transform: [{ translateY: -15 }],

    shadowOpacity: 0,
    shadowRadius: 0,
  },
});

export default App;