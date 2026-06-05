import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../services/apiConfig';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const navigation = useNavigation();
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [confirmSecureText, setConfirmSecureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Store registration data for final API call
  const [registrationData, setRegistrationData] = useState(null);
  
  // OTP states
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpId, setOtpId] = useState(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const otpInputs = useRef([]);
  
  // Bottom sheet animation
  const slideAnim = useRef(new Animated.Value(height)).current;
  
  // Modal Toast states
  const [modalToastMessage, setModalToastMessage] = useState('');
  const [modalToastType, setModalToastType] = useState('success');
  const modalToastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (otpModalVisible) {
      // Animate bottom sheet up when modal opens
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animation when modal closes
      slideAnim.setValue(height);
    }
  }, [otpModalVisible]);

  const showModalToast = (message, type = 'success') => {
    setModalToastMessage(message);
    setModalToastType(type);
    Animated.sequence([
      Animated.timing(modalToastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(modalToastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const validateForm = () => {
    let newErrors = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Final registration API call after OTP verification
  const completeRegistration = async () => {
    setIsRegistering(true);
    
    const formData = new FormData();
    formData.append('name', registrationData.name);
    formData.append('email', registrationData.email);
    formData.append('phone', registrationData.phone);
    formData.append('password', registrationData.password);
    formData.append('password_confirmation', registrationData.confirmPassword);

    try {
      const response = await apiClient.post('/user-registration', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        setOtpSuccessMessage(response.data.message || 'Registration successful!');
        showModalToast(response.data.message || 'Registration successful!', 'success');
        
        // Wait 2 seconds then redirect to login
        setTimeout(() => {
          setOtpModalVisible(false);
          setRegistrationData(null);
          setOtpSuccessMessage('');
          navigation.replace('Login');
        }, 2000);
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
      setOtpError(errorMessage);
      showModalToast(errorMessage, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});

    // Store registration data for later use
    setRegistrationData({
      name,
      email,
      phone,
      password,
      confirmPassword
    });

    // Use FormData to match Backend requirements
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('password', password);
    formData.append('password_confirmation', confirmPassword);

    try {
      const response = await apiClient.post('/register-validation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        setOtpId(response.data.otp_id);
        setOtpEmail(response.data.email || email);
        setOtp(['', '', '', '', '', '']); 
        setOtpError('');
        setOtpSuccessMessage('');
        setOtpModalVisible(true);
        setCountdown(60);
        setOtpSuccessMessage('OTP sent successfully to your email!');
        showModalToast('OTP sent to your email', 'success');
        
        // Clear success message after 3 seconds
        setTimeout(() => setOtpSuccessMessage(''), 3000);
      } else {
        throw new Error(response.data?.message || 'Registration validation failed');
      }
    } catch (error) {
      let errorMessage = 'Registration validation failed. Please try again.';
      let errorFields = {};
      
      if (error.response?.data?.errors) {
        errorFields = error.response.data.errors;
        const firstError = Object.values(errorFields)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setErrors(errorFields);
      showModalToast(errorMessage, 'error');
      setRegistrationData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setOtpError('Please enter valid 6-digit OTP');
      return;
    }

    setOtpError('');
    setIsVerifyingOtp(true);

    const formData = new FormData();
    formData.append('email', otpEmail);
    formData.append('otp', otpString);

    try {
      const response = await apiClient.post('/verify-otp', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        setOtpSuccessMessage('OTP verified! Completing registration...');
        showModalToast('OTP verified! Completing registration...', 'success');
        // Call the final registration API
        await completeRegistration();
      } else {
        throw new Error(response.data?.message || 'Invalid OTP');
      }
    } catch (error) {
      let errorMessage = 'Invalid OTP. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setOtpError(errorMessage);
      showModalToast(errorMessage, 'error');
      
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      otpInputs.current[0]?.focus();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) {
      setOtpError(`Please wait ${countdown} seconds before resending`);
      return;
    }

    setIsResendingOtp(true);
    setOtpError('');

    const formData = new FormData();
    formData.append('email', otpEmail);

    try {
      const response = await apiClient.post('/resend-otp', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        if (response.data.otp_id) setOtpId(response.data.otp_id);
        setCountdown(60);
        setOtpSuccessMessage('OTP resent successfully!');
        showModalToast('OTP resent successfully!', 'success');
        setOtp(['', '', '', '', '', '']);
        otpInputs.current[0]?.focus();
        
        // Clear success message after 3 seconds
        setTimeout(() => setOtpSuccessMessage(''), 3000);
      } else {
        throw new Error(response.data?.message || 'Failed to resend OTP');
      }
    } catch (error) {
      let errorMessage = 'Failed to resend OTP. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setOtpError(errorMessage);
      showModalToast(errorMessage, 'error');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanedText.substring(cleanedText.length - 1);
    setOtp(newOtp);
    
    // Clear error when user starts typing
    if (otpError) setOtpError('');

    if (cleanedText && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpInputs.current[index - 1]?.focus();
    }
  };

  const closeModal = () => {
    if (!isRegistering) {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setOtpModalVisible(false);
        setRegistrationData(null);
        setOtpError('');
        setOtpSuccessMessage('');
      });
    }
  };

  // Success/Error Icon Components
  const SuccessIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill="#2E7D32" />
      <Path d="M8 12L11 15L16 9" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  const ErrorIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill="#C62828" />
      <Path d="M12 8V12M12 16H12.01" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );

  const InfoIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill="#E57C23" />
      <Path d="M12 12V16M12 8H12.01" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          <View style={styles.headerContainer}>
            <Image
              source={require('../screens/assets/header.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>

          <View style={styles.formContentContainer}>
            {/* Name Input */}
            <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#A0A0A0"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
                editable={!isLoading}
              />
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <Circle cx="12" cy="7" r="4" />
              </Svg>
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            {/* Email Input */}
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
            {errors.email && <Text style={styles.errorText}>{errors.email[0] || errors.email}</Text>}

            {/* Phone Input */}
            <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#A0A0A0"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text.replace(/[^0-9]/g, ''));
                  if (errors.phone) setErrors({ ...errors, phone: null });
                }}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!isLoading}
              />
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </Svg>
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone[0] || errors.phone}</Text>}

            {/* Password Input */}
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
            {errors.password && <Text style={styles.errorText}>{errors.password[0] || errors.password}</Text>}

            {/* Confirm Password Input */}
            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#A0A0A0"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                secureTextEntry={confirmSecureText}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setConfirmSecureText(!confirmSecureText)} disabled={isLoading}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <Circle cx="12" cy="12" r="3" />
                  {confirmSecureText && <Path d="M2 2l20 20" stroke="#E57C23" strokeWidth="2" />}
                </Svg>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            {/* Sign Up Button */}
            <TouchableOpacity 
              style={styles.gradientButtonContainer} 
              onPress={handleRegister}
              disabled={isLoading}
            >
              <View style={styles.buttonInnerLayout}>
                {isLoading ? (
                  <ActivityIndicator color="#E57C23" size="small" />
                ) : (
                  <>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" style={{ marginRight: 10 }}>
                      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <Circle cx="9" cy="7" r="4" />
                      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </Svg>
                    <Text style={styles.buttonText}>Sign Up</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkTextDim}>Already have an account? Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP Modal - Bottom Sheet */}
      <Modal
        visible={otpModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={closeModal}
          />
          <Animated.View 
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.bottomSheetHandle}>
              <View style={styles.handleBar} />
            </View>
            
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bottomSheetContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Verify OTP</Text>
                {!isRegistering && (
                  <TouchableOpacity onPress={closeModal}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                      <Path d="M18 6L6 18M6 6L18 18" />
                    </Svg>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.modalSubtitle}>Enter OTP sent to</Text>
              <Text style={styles.modalEmail}>{otpEmail}</Text>

              {/* Success Message */}
              {otpSuccessMessage ? (
                <View style={styles.successMessageContainer}>
                  <SuccessIcon />
                  <Text style={styles.successMessageText}>{otpSuccessMessage}</Text>
                </View>
              ) : null}

              {/* OTP Inputs Grid */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => otpInputs.current[index] = ref}
                    style={[
                      styles.otpInput,
                      otpError && styles.otpInputError,
                      digit && styles.otpInputFilled
                    ]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                    editable={!isVerifyingOtp && !isRegistering}
                  />
                ))}
              </View>

              {/* Error Message */}
              {otpError ? (
                <Text style={styles.otpErrorMessage}>{otpError}</Text>
              ) : null}

              {/* Resend Options Container */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive code? </Text>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>Resend in {countdown}s</Text>
                ) : (
                  <TouchableOpacity 
                    onPress={handleResendOtp} 
                    disabled={isResendingOtp || isVerifyingOtp || isRegistering}
                  >
                    <Text style={styles.resendButton}>
                      {isResendingOtp ? 'Sending...' : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Verify Action Button */}
              <TouchableOpacity 
                style={[styles.verifyButton, (isVerifyingOtp || isRegistering) && styles.verifyButtonDisabled]} 
                onPress={handleVerifyOtp}
                disabled={isVerifyingOtp || isRegistering}
              >
                {isVerifyingOtp || isRegistering ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify & Register</Text>
                )}
              </TouchableOpacity>
            </ScrollView>

            {/* Modal Internal Toast */}
            
          </Animated.View>
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
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  logo: {
    width: '100%',
    height: height * 0.22,
  },
  formContentContainer: {
    flex: 1,
    marginTop: height * 0.26,
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
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    height: '100%',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 12,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginTop: 16,
  },
  linkTextDim: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  gradientButtonContainer: {
    height: 56,
    borderRadius: 28,
    padding: 2,
    backgroundColor: '#E57C23',
    marginTop: 20,
    marginBottom: 20,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E57C23',
    textAlign: 'center',
    marginBottom: 24,
  },
  successMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  successMessageText: {
    flex: 1,
    fontSize: 13,
    color: '#4CAF50',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  otpInput: {
    width: 44,
    height: 48,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3A3A3C',
  },
  otpInputFilled: {
    borderColor: '#E57C23',
    backgroundColor: 'rgba(229, 124, 35, 0.1)',
  },
  otpInputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  otpErrorMessage: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  resendButton: {
    color: '#E57C23',
    fontSize: 14,
    fontWeight: '600',
  },
  countdownText: {
    color: '#E57C23',
    fontSize: 14,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#E57C23',
    borderRadius: 28,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalToastContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalToastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default RegisterScreen;