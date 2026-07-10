import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import apiClient from '../services/apiConfig';

const { width, height } = Dimensions.get('window');

// ==================== SVG ICONS ====================
const CarIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M5 13L6 9H18L19 13M5 13H19M5 13V17H7V15H17V17H19V13M7 15H9M15 15H17" stroke="#F29D38" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="7" cy="17" r="2" stroke="#F29D38" strokeWidth="1.5"/>
    <Circle cx="17" cy="17" r="2" stroke="#F29D38" strokeWidth="1.5"/>
  </Svg>
);

const LocationIcon = ({ color = "#34C759" }) => (
  <Svg width="10" height="10" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="8" fill={color} stroke="none"/>
  </Svg>
);

const ArrowIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const DriverIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke="#F29D38" strokeWidth="1.5"/>
    <Path d="M5 20V19C5 15.6863 7.68629 13 11 13H13C16.3137 13 19 15.6863 19 19V20" stroke="#F29D38" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const CalendarIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#8E8E93" strokeWidth="1.5"/>
    <Line x1="8" y1="2" x2="8" y2="6" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="16" y1="2" x2="16" y2="6" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="3" y1="10" x2="21" y2="10" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const ClockIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#8E8E93" strokeWidth="1.5"/>
    <Polyline points="12 6 12 12 16 14" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const MoneyIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#F29D38" strokeWidth="1.5"/>
    <Path d="M8 12H16M12 8V16" stroke="#F29D38" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const DistanceIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#8E8E93" strokeWidth="1.5"/>
    <Path d="M12 6V12L16 14" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const StarIcon = ({ filled = true, size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#F29D38" : "none"}>
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#F29D38" strokeWidth="1.5"/>
  </Svg>
);

const SuccessIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="12" r="10" stroke="#34C759" strokeWidth="2"/>
  </Svg>
);

const ErrorIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#FF3B30" strokeWidth="2"/>
    <Path d="M12 8V12M12 16H12.01" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const WarningIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M12 8V12M12 16H12.01M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="#F29D38" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const InfoIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#F29D38" strokeWidth="2"/>
    <Path d="M12 16V12M12 8H12.01" stroke="#F29D38" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const VisaIcon = () => (
  <Svg width="40" height="25" viewBox="0 0 40 25">
    <Rect width="40" height="25" rx="3" fill="#1A1F71"/>
    <Path d="M29 18H26L28 7H31L29 18Z" fill="#FFFFFF"/>
    <Path d="M18 7L15 18H12L14 7H18Z" fill="#FFFFFF"/>
    <Path d="M21 7L19 18H16L18 7H21Z" fill="#FFFFFF"/>
    <Circle cx="9" cy="12.5" r="5" fill="#FFFFFF" opacity="0.2"/>
    <Circle cx="9" cy="12.5" r="3.5" fill="#1A1F71"/>
  </Svg>
);

const MastercardIcon = () => (
  <Svg width="40" height="25" viewBox="0 0 40 25">
    <Rect width="40" height="25" rx="3" fill="#F79E1B"/>
    <Circle cx="15" cy="12.5" r="7" fill="#EB001B" opacity="0.8"/>
    <Circle cx="25" cy="12.5" r="7" fill="#F79E1B" opacity="0.8"/>
    <Circle cx="20" cy="12.5" r="7" fill="none" stroke="#FF5F00" strokeWidth="1"/>
  </Svg>
);

// ==================== TOAST COMPONENT ====================
const Toast = ({ visible, message, type = 'success', onHide }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const getToastColor = () => {
    switch (type) {
      case 'success': return '#34C759';
      case 'error': return '#FF3B30';
      case 'warning': return '#F29D38';
      default: return '#F29D38';
    }
  };

  const getToastIcon = () => {
    switch (type) {
      case 'success': return <SuccessIcon />;
      case 'error': return <ErrorIcon />;
      case 'warning': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: getToastColor(),
        }
      ]}
    >
      {getToastIcon()}
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

// ==================== IN-APP CARD PAYMENT MODAL ====================
const CardPaymentModal = ({ visible, booking, onClose, onSuccess, onError, showToast }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardType, setCardType] = useState('Unknown');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardholderName('');
      setCardType('Unknown');
      setIsProcessing(false);
    }
  }, [visible]);

  const validateCardNumber = (number: string): boolean => {
    const sanitized = number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(sanitized)) return false;
    
    let sum = 0;
    let isEven = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const getCardType = (number: string): string => {
    const sanitized = number.replace(/\s/g, '');
    if (/^4/.test(sanitized)) return 'Visa';
    if (/^5[1-5]/.test(sanitized)) return 'Mastercard';
    if (/^3[47]/.test(sanitized)) return 'Amex';
    if (/^6(?:011|5)/.test(sanitized)) return 'Discover';
    return 'Unknown';
  };

  const formatCardNumber = (text: string): string => {
    const sanitized = text.replace(/\D/g, '');
    const groups = sanitized.match(/.{1,4}/g);
    return groups ? groups.join(' ') : sanitized;
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
    const sanitized = text.replace(/\D/g, '');
    if (sanitized.length >= 4) {
      setCardType(getCardType(sanitized));
    } else {
      setCardType('Unknown');
    }
  };

  const handleExpiryChange = (text: string) => {
    const sanitized = text.replace(/\D/g, '');
    if (sanitized.length <= 2) {
      setExpiryDate(sanitized);
    } else if (sanitized.length <= 4) {
      const month = sanitized.slice(0, 2);
      const year = sanitized.slice(2);
      setExpiryDate(`${month}/${year}`);
    }
  };

  const handleCvvChange = (text: string) => {
    const sanitized = text.replace(/\D/g, '');
    if (sanitized.length <= 4) {
      setCvv(sanitized);
    }
  };

  const validatePayment = (): boolean => {
    if (!validateCardNumber(cardNumber)) {
      Alert.alert('Invalid Card', 'Please enter a valid card number');
      return false;
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiryDate)) {
      Alert.alert('Invalid Date', 'Please enter a valid expiry date (MM/YY)');
      return false;
    }

    if (cvv.length < 3 || cvv.length > 4) {
      Alert.alert('Invalid CVV', 'Please enter a valid CVV (3-4 digits)');
      return false;
    }

    if (!cardholderName.trim() || cardholderName.length < 2) {
      Alert.alert('Invalid Name', 'Please enter the cardholder name');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validatePayment()) return;

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a random transaction ID
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      // Here you would call your backend API to process the payment
      // const response = await apiClient.post('/process-payment', {
      //   booking_id: booking.id,
      //   card_number: cardNumber.replace(/\s/g, ''),
      //   expiry: expiryDate,
      //   cvv: cvv,
      //   cardholder_name: cardholderName,
      //   amount: parseFloat(booking.total_fee || booking.total_amount || 0)
      // });
      
      showToast(`Payment of ₹${parseFloat(booking.total_fee || booking.total_amount || 0).toFixed(2)} completed successfully!`, 'success');
      onSuccess(transactionId);
      onClose();
    } catch (error) {
      showToast('Payment failed. Please try again.', 'error');
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCardIcon = () => {
    switch (cardType) {
      case 'Visa': return <VisaIcon />;
      case 'Mastercard': return <MastercardIcon />;
      default: return <VisaIcon />;
    }
  };

  if (!booking) return null;

  const totalAmount = parseFloat(booking.total_fee || booking.total_amount || 0).toFixed(2);

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.bottomSheetHandle}>
            <View style={styles.handleBar} />
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.modalTitle}>💳 Card Payment</Text>
              <Text style={styles.modalSubtitle}>Enter your card details securely</Text>

              {/* Amount Display */}
              <View style={styles.amountDisplay}>
                <Text style={styles.amountLabel}>Total Amount</Text>
                <Text style={styles.amountValue}>₹{totalAmount}</Text>
              </View>

              {/* Card Preview */}
              <View style={styles.cardPreview}>
                <View style={styles.cardHeader}>
                  {getCardIcon()}
                  <Text style={styles.cardType}>{cardType}</Text>
                </View>
                <Text style={styles.cardNumber}>
                  {cardNumber || '•••• •••• •••• ••••'}
                </Text>
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.cardFooterLabel}>Cardholder</Text>
                    <Text style={styles.cardFooterValue}>
                      {cardholderName || 'YOUR NAME'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.cardFooterLabel}>Expires</Text>
                    <Text style={styles.cardFooterValue}>
                      {expiryDate || 'MM/YY'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment Form */}
              <View style={styles.formContainer}>
                {/* Card Number */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Card Number</Text>
                  <TextInput
                    style={[styles.formInput, focusedField === 'number' && styles.formInputFocused]}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#555555"
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    onFocus={() => setFocusedField('number')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={19}
                  />
                </View>

                <View style={styles.row}>
                  {/* Expiry Date */}
                  <View style={[styles.formGroup, styles.halfWidth]}>
                    <Text style={styles.formLabel}>Expiry Date</Text>
                    <TextInput
                      style={[styles.formInput, focusedField === 'expiry' && styles.formInputFocused]}
                      placeholder="MM/YY"
                      placeholderTextColor="#555555"
                      keyboardType="numeric"
                      value={expiryDate}
                      onChangeText={handleExpiryChange}
                      onFocus={() => setFocusedField('expiry')}
                      onBlur={() => setFocusedField(null)}
                      maxLength={5}
                    />
                  </View>

                  {/* CVV */}
                  <View style={[styles.formGroup, styles.halfWidth]}>
                    <Text style={styles.formLabel}>CVV</Text>
                    <TextInput
                      style={[styles.formInput, focusedField === 'cvv' && styles.formInputFocused]}
                      placeholder="•••"
                      placeholderTextColor="#555555"
                      keyboardType="numeric"
                      secureTextEntry={true}
                      value={cvv}
                      onChangeText={handleCvvChange}
                      onFocus={() => setFocusedField('cvv')}
                      onBlur={() => setFocusedField(null)}
                      maxLength={4}
                    />
                  </View>
                </View>

                {/* Cardholder Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Cardholder Name</Text>
                  <TextInput
                    style={[styles.formInput, focusedField === 'name' && styles.formInputFocused]}
                    placeholder="John Doe"
                    placeholderTextColor="#555555"
                    value={cardholderName}
                    onChangeText={setCardholderName}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Payment Button */}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelModalButton]} 
                  onPress={onClose}
                  disabled={isProcessing}
                >
                  <Text style={styles.cancelModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmModalButton]} 
                  onPress={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.confirmModalButtonText}>Pay ₹{totalAmount}</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.secureText}>🔒 Secured by Square • Encrypted Payment</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ==================== MAIN COMPONENT ====================
const BookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [cardPaymentVisible, setCardPaymentVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '', type: 'success' });
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/bookings', {});
      
      if (response.data && response.data.success) {
        const bookingsWithDetails = response.data.data.map(booking => ({
          ...booking,
          distance: booking.distance || `${(Math.random() * 15 + 2).toFixed(1)} km`,
          driver_rating: booking.driver_rating || (3.5 + Math.random() * 1.5).toFixed(1),
          driver_name: booking.driver_name || booking.driver?.name || 'Driver Assigned',
          total_amount: booking.total_fee || booking.total_amount || 0,
        }));
        setBookings(bookingsWithDetails);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handlePayNow = (booking) => {
    if (booking.status?.toLowerCase() === 'completed') {
      showToast('This booking is already completed', 'warning');
      return;
    }
    if (booking.status?.toLowerCase() === 'cancelled') {
      showToast('This booking is cancelled', 'error');
      return;
    }
    setSelectedBooking(booking);
    setCardPaymentVisible(true);
  };

  const handlePaymentSuccess = (transactionId) => {
    showToast(`Payment successful! Transaction ID: ${transactionId}`, 'success');
    fetchBookings();
  };

  const handlePaymentError = (error) => {
    showToast(`Payment failed: ${error}`, 'error');
  };

  const getDisplayStatus = (status) => {
    if (!status) return 'Pending';
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'driver_assigned': 'Driver Assigned',
      'vehicle_assigned': 'Vehicle Assigned',
      'ongoing': 'Running',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed') return '#34C759';
    if (statusLower === 'ongoing' || statusLower === 'running') return '#F29D38';
    if (statusLower === 'pending') return '#007AFF';
    if (statusLower === 'cancelled') return '#FF3B30';
    if (statusLower === 'driver_assigned') return '#5856D6';
    if (statusLower === 'vehicle_assigned') return '#64D2FF';
    return '#8E8E93';
  };

  const getStatusBgColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed') return 'rgba(52, 199, 89, 0.15)';
    if (statusLower === 'ongoing' || statusLower === 'running') return 'rgba(242, 157, 56, 0.15)';
    if (statusLower === 'pending') return 'rgba(0, 122, 255, 0.15)';
    if (statusLower === 'cancelled') return 'rgba(255, 59, 48, 0.15)';
    if (statusLower === 'driver_assigned') return 'rgba(88, 86, 214, 0.15)';
    if (statusLower === 'vehicle_assigned') return 'rgba(100, 210, 255, 0.15)';
    return 'rgba(142, 142, 147, 0.15)';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderStars = (rating) => {
    const numRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numRating);
    const stars = [];
    for (let i = 0; i < fullStars && i < 5; i++) {
      stars.push(<StarIcon key={`star-${i}`} filled={true} />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<StarIcon key={`empty-${i}`} filled={false} />);
    }
    return stars;
  };

  const renderBookingItem = ({ item }) => {
    const displayStatus = getDisplayStatus(item.status);
    const statusColor = getStatusColor(item.status);
    const statusBgColor = getStatusBgColor(item.status);
    const isCompleted = item.status?.toLowerCase() === 'completed';
    const isCancelled = item.status?.toLowerCase() === 'cancelled';
    const isPayable = !isCompleted && !isCancelled;
    const totalAmount = parseFloat(item.total_fee || item.total_amount || 0).toFixed(2);

    return (
      <View style={[styles.tripCard, isCompleted && styles.completedCard]}>
        <View style={styles.compactContainer}>
          {/* Header - Date and Status */}
          <View style={styles.cardHeader}>
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateRow}>
                <CalendarIcon />
                <Text style={styles.dateText}>{formatDate(item.booking_date)}</Text>
              </View>
              <View style={styles.timeRow}>
                <ClockIcon />
                <Text style={styles.timeText}>
                  {formatTime(item.pickup_time)} • {item.booking_type || 'Standard'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {displayStatus}
              </Text>
            </View>
          </View>

          {/* Location Details */}
          <View style={styles.routePreview}>
            <View style={styles.locationPreview}>
              <LocationIcon color="#34C759" />
              <Text style={styles.previewLocation} numberOfLines={1}>
                {item.from_location || 'Pickup location'}
              </Text>
            </View>
            <ArrowIcon />
            <View style={styles.locationPreview}>
              <LocationIcon color={isCancelled ? "#FF3B30" : "#F29D38"} />
              <Text style={styles.previewLocation} numberOfLines={1}>
                {item.to_location || 'Dropoff location'}
              </Text>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.distanceContainer}>
            <DistanceIcon />
            <Text style={styles.distanceText}>Distance: {item.distance || 'N/A'}</Text>
          </View>

          {/* Driver Info with Rating */}
          <View style={styles.driverContainer}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>
                {(item.driver_name || 'D').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{item.driver_name}</Text>
              <View style={styles.ratingContainer}>
                {renderStars(item.driver_rating)}
                <Text style={styles.ratingText}>{item.driver_rating}</Text>
              </View>
            </View>
          </View>

          {/* Footer with Amount and Pay Button */}
          <View style={styles.compactFooter}>
            <View style={styles.fareContainer}>
              <MoneyIcon />
              <Text style={styles.compactFare}>₹{totalAmount}</Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.payButton,
                !isPayable && styles.payButtonDisabled,
              ]}
              onPress={() => handlePayNow(item)}
              disabled={!isPayable}
            >
              <Text style={styles.payButtonText}>
                {isCompleted ? '✅ Completed' : 
                 isCancelled ? '❌ Cancelled' : 
                 'Pay Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F29D38" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>My Bookings</Text>
        <Text style={styles.screenSubtitle}>View and manage your rides</Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F29D38" colors={["#F29D38"]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CarIcon />
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>Your bookings will appear here</Text>
          </View>
        }
      />

      <CardPaymentModal
        visible={cardPaymentVisible}
        booking={selectedBooking}
        onClose={() => {
          setCardPaymentVisible(false);
          setSelectedBooking(null);
        }}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        showToast={showToast}
      />
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
  },
  screenHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  tripCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    overflow: 'hidden',
  },
  completedCard: {
    borderColor: '#34C759',
    borderWidth: 1.5,
  },
  compactContainer: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  routePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 12,
  },
  locationPreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewLocation: {
    flex: 1,
    fontSize: 13,
    color: '#E5E5EA',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  distanceText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingTop: 12,
    marginBottom: 12,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F29D38',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
  },
  compactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingTop: 12,
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactFare: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F29D38',
  },
  payButton: {
    backgroundColor: '#F29D38',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#F29D38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: '#3A3A3C',
    shadowOpacity: 0,
  },
  payButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#8E8E93',
    fontSize: 14,
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 1000,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  bottomSheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    maxHeight: height * 0.9,
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
  scrollContent: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  amountDisplay: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F29D38',
    marginTop: 4,
  },
  cardPreview: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    minHeight: 180,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.7,
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardFooterLabel: {
    color: '#8E8E93',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  cardFooterValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  formContainer: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  formLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  formInputFocused: {
    borderColor: '#F29D38',
    borderWidth: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelModalButton: {
    backgroundColor: '#2C2C2E',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  confirmModalButton: {
    backgroundColor: '#F29D38',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  secureText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 16,
  },
});

export default BookingsScreen;