import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  StatusBar,
  TextInput,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { loginUser } from '../services/authService';
import { AuthContext } from '../../App';
import apiClient from '../services/apiConfig';
import messaging from '@react-native-firebase/messaging';

const { width, height } = Dimensions.get('window');

export default function CarInteriorScreen() {
  const navigation = useNavigation();
  const { setIsLoggedIn } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Forgot Password Modal states
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  // Toast Notification states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error'); // 'error' or 'success'
  
  // Flag to prevent double navigation
  const isNavigating = useRef(false);

  // Bottom Sheet Animation Setup
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Manage animation lifecycle based on state changes
  useEffect(() => {
    if (forgotModalVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [forgotModalVisible]);

  // Function to get FCM Token
  const getFCMToken = async () => {
    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Notification permission not granted');
        return null;
      }

      // Get the FCM token
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  };

  // Combined function to show either error or success alerts
  const showToast = (message, type = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000); // 3 seconds visibility
  };

  const closeForgotModal = (onAnimationComplete) => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setForgotModalVisible(false);
      setForgotEmail('');
      // Execute subsequent code (like showing a toast) only after sheet is completely closed
      if (onAnimationComplete) onAnimationComplete();
    });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      showToast(firstError, 'error');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    if (isNavigating.current) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      // Get FCM token before login
      const fcmToken = await getFCMToken();
      
      // Call login with email, password, and FCM token
      const result = await loginUser(email, password, fcmToken);

      if (result.success) {
        isNavigating.current = true;
        
        setTimeout(() => {
          setIsLoggedIn(true);
          navigation.replace('Authenticated');
          
          setTimeout(() => {
            isNavigating.current = false;
          }, 500);
        }, 1500);
      } else {
        showToast(result.message, 'error');
        if (result.errors && Object.keys(result.errors).length > 0) {
          setErrors(result.errors);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('An error occurred during login', 'error');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsSendingReset(true);

    try {
      const response = await apiClient.post('/reset-password', {
        email: forgotEmail,
      });

      if (response.data && response.data.success) {
        const successMsg = response.data.message || 'Password reset link sent successfully!';
        
        // 1. Hide bottom sheet modal first
        closeForgotModal(() => {
          // 2. Display success toast alert after it closes
          showToast(successMsg, 'success');
        });
      } else {
        throw new Error(response.data?.message || 'Failed to send reset link');
      }
    } catch (error) {
      let errorMessage = 'Failed to send reset link. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors?.email) {
        errorMessage = error.response.data.errors.email[0];
      } else if (error.message) {
        errorMessage = error.message;
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.logoText}>Welcome Back</Text>
            <Text style={styles.logoSubtext}>Sign in to continue</Text>
          </View>

          {/* Centered Form Content */}
          <View style={styles.formContentContainer}>
            {/* Email Input Field */}
            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <Path d="m22 6-10 7L2 6" />
              </Svg>
            </View>

            {/* Password Input Field */}
            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                secureTextEntry={secureText}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} disabled={isLoading}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <Circle cx="12" cy="12" r="3" />
                  {secureText && <Path d="M2 2l20 20" stroke="#E57C23" strokeWidth="2" />}
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Options Links row */}
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
                <Text style={styles.linkTextDim}>Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.linkTextBright}>Sign up</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={styles.gradientButtonContainer} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              <View style={styles.buttonInnerLayout}>
                {isLoading ? (
                  <ActivityIndicator color="#E57C23" size="small" />
                ) : (
                  <>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" style={{ marginRight: 10 }}>
                      <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <Path d="M10 17l5-5-5-5" />
                      <Path d="M15 12H3" />
                    </Svg>
                    <Text style={styles.buttonText}>Sign In</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Bottom Sheet Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={forgotModalVisible}
        onRequestClose={() => closeForgotModal()}
      >
        <TouchableWithoutFeedback onPress={() => closeForgotModal()}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.modalContent, 
                  { transform: [{ translateY: slideAnim }] }
                ]}
              >
                {/* Decorative Handle Bar */}
                <View style={styles.sheetHandle} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Reset Password</Text>
                  <TouchableOpacity onPress={() => closeForgotModal()}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                      <Path d="M18 6L6 18M6 6L18 18" />
                    </Svg>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>

                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Email Address"
                    placeholderTextColor="#8E8E93"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={handleForgotPassword}
                  disabled={isSendingReset}
                >
                  {isSendingReset ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalButtonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Dynamic Toast Modal (Handles both Errors and Successes) */}
      <Modal
        transparent={true}
        visible={toastVisible}
        animationType="slide"
        onRequestClose={() => setToastVisible(false)}
      >
        <View style={styles.toastOverlay}>
          <View 
            style={[
              styles.toastContent, 
              { backgroundColor: toastType === 'success' ? '#2E7D32' : '#C62828' }
            ]}
          >
            {toastType === 'success' ? (
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <Path d="M22 4L12 14.01l-3-3" />
              </Svg>
            ) : (
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 8v4M12 16h.01" />
              </Svg>
            )}
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    width: '100%',
    paddingHorizontal: 26,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  logoSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  formContentContainer: {
    width: '100%',
    paddingHorizontal: 26,
    paddingBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 60,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputError: {
    borderColor: '#C62828',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    height: '100%',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 35,
    marginTop: 16,
  },
  linkTextDim: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  linkTextBright: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  gradientButtonContainer: {
    height: 56,
    borderRadius: 28,
    padding: 2,
    backgroundColor: '#E57C23',
    marginBottom: 30,
    overflow: 'hidden',
  },
  buttonInnerLayout: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Bottom Sheet Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 34,
    width: width,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#48484A',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInputWrapper: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 24,
  },
  modalInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  modalButton: {
    backgroundColor: '#E57C23',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Dynamic Toast Notification Styles
  toastOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});