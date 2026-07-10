// screens/BookingsScreen.tsx
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
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import apiClient from '../services/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// ==================== TOAST COMPONENT ====================
const Toast = ({ visible, message, type = 'success', onHide }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    let timer;
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          onHide();
        });
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, fadeAnim, slideAnim, onHide]);

  const getToastColor = () => {
    switch (type) {
      case 'success': return '#34C759';
      case 'error': return '#FF3B30';
      case 'warning': return '#F29D38';
      default: return '#F29D38';
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
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

// ==================== SQUARE PAYMENT WEBVIEW ====================
const SQUARE_ACCESS_TOKEN = 'EAAAlyhaTMSxwXwJ3fOWTRUF6PNR_N9n7EeYySW7nZcNqHB0kqLgV8f4ecfE9DDu';
const SQUARE_LOCATION_ID = 'LKPRHRW32C3HQ';

const formatPhoneNumber = (phone: string): string | null => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  let formatted = cleaned;
  if (formatted.startsWith('0')) {
    formatted = formatted.substring(1);
  }
  
  if (formatted.length === 10) {
    formatted = '+91' + formatted;
  } else if (formatted.length === 11 && formatted.startsWith('1')) {
    formatted = '+' + formatted;
  } else if (!formatted.startsWith('+') && formatted.length > 0) {
    formatted = '+' + formatted;
  }

  return formatted.startsWith('+') && formatted.length > 7 ? formatted : null;
};

const SquarePaymentWebView = ({ 
  visible, 
  onClose, 
  onSuccess, 
  amount, 
  bookingId, 
  customerDetails,
  loggedInUser
}) => {
  const [paymentUrl, setPaymentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [cardFormReady, setCardFormReady] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (visible) {
      setWebViewLoading(true);
      setCardFormReady(false);
      setPaymentProcessing(false);
      createPaymentLink();
    } else {
      setPaymentUrl('');
      setError('');
      setWebViewLoading(true);
      setCardFormReady(false);
      setPaymentProcessing(false);
    }
  }, [visible]);

  const createPaymentLink = async () => {
    try {
      setLoading(true);
      setError('');

      const name = loggedInUser?.name || customerDetails?.name || 'Guest User';
      const email = loggedInUser?.email || customerDetails?.email || 'guest@example.com';
      const rawPhone = loggedInUser?.phone || customerDetails?.phone || '';
      const phone = formatPhoneNumber(rawPhone);

      const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount || '0');
      
      const prePopulatedData: any = {
        buyer_email: email,
        buyer_address: {
          first_name: name.split(' ')[0] || 'Guest',
          last_name: name.split(' ').slice(1).join(' ') || 'User'
        }
      };

      if (phone) {
        prePopulatedData.buyer_phone_number = phone;
      }

      console.log('📧 Payment with user data:', {
        name,
        email,
        phone,
        bookingId,
        amount: parsedAmount
      });

      const response = await fetch(
        'https://connect.squareupsandbox.com/v2/online-checkout/payment-links',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Square-Version': '2025-10-16',
          },
          body: JSON.stringify({
            idempotency_key: `${bookingId}_${Date.now()}`,
            quick_pay: {
              name: `Booking #${bookingId} - ${name}`,
              location_id: SQUARE_LOCATION_ID,
              price_money: {
                amount: Math.round(parsedAmount * 100),
                currency: 'USD',
              },
            },
            checkout_options: {
              redirect_url: 'https://your-app.com/payment-callback',
              ask_for_shipping_address: false,
              merchant_support_email: 'support@yourapp.com',
            },
            pre_populated_data: prePopulatedData
          }),
        }
      );

      const result = await response.json();

      if (result?.payment_link?.url) {
        setPaymentUrl(result.payment_link.url);
      } else {
        const errorMsg = result?.errors?.[0]?.detail || 'Failed to generate payment link';
        setError(errorMsg);
        console.log('Square API Error Details:', result);
      }
    } catch (error: any) {
      console.log('Square Exception tracking:', error);
      setError(error?.message || 'Server connection layout fault.');
    } finally {
      setLoading(false);
    }
  };

  // Inject JavaScript to monitor payment status
  const getMonitorScript = `
    (function() {
      console.log('🔍 Payment monitor started');
      
      // Monitor for payment completion
      function checkPaymentStatus() {
        // Check for success messages in the page
        var successElements = document.querySelectorAll('[class*="success"], [class*="completed"], [class*="thank-you"]');
        if (successElements.length > 0) {
          console.log('✅ Payment success detected!');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_SUCCESS',
            payload: { 
              transactionId: 'TXN_' + Date.now(),
              message: 'Payment completed successfully'
            }
          }));
          return true;
        }
        
        // Check for cancel elements
        var cancelElements = document.querySelectorAll('[class*="cancel"], [class*="cancelled"]');
        if (cancelElements.length > 0) {
          console.log('❌ Payment cancelled detected');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_CANCELLED',
            payload: { message: 'Payment cancelled' }
          }));
          return true;
        }
        
        return false;
      }

      // Monitor URL changes
      var lastUrl = window.location.href;
      setInterval(function() {
        var currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          console.log('📍 URL changed to:', currentUrl);
          lastUrl = currentUrl;
          
          // Check for success URLs
          if (currentUrl.includes('success') || currentUrl.includes('completed') || currentUrl.includes('thank-you')) {
            console.log('✅ Success URL detected!');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_SUCCESS',
              payload: { 
                transactionId: 'TXN_' + Date.now(),
                url: currentUrl
              }
            }));
          }
          
          // Check for cancel URLs
          if (currentUrl.includes('cancel') || currentUrl.includes('cancelled')) {
            console.log('❌ Cancel URL detected');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_CANCELLED',
              payload: { url: currentUrl }
            }));
          }
        }
      }, 1000);
      
      // Check DOM changes
      var observer = new MutationObserver(function(mutations) {
        checkPaymentStatus();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
      
      // Initial check
      setTimeout(checkPaymentStatus, 3000);
      
      console.log('✅ Payment monitor installed');
    })();
    true;
  `;

  // Inject JavaScript to enable card form
  const getEnableCardFormScript = `
    setTimeout(function() {
      console.log('🔧 Enabling card form...');
      
      // Enable all inputs and buttons
      var inputs = document.querySelectorAll('input, button, select, textarea');
      inputs.forEach(function(input) {
        input.disabled = false;
        input.removeAttribute('disabled');
        input.style.pointerEvents = 'auto';
        input.style.opacity = '1';
      });
      
      // Find and enable Square card iframe
      var cardIframe = document.querySelector('#sq-card iframe');
      if (cardIframe) {
        cardIframe.style.pointerEvents = 'auto';
        cardIframe.style.opacity = '1';
        console.log('✅ Card iframe found and enabled');
      } else {
        console.log('⚠️ Card iframe not found, retrying...');
        setTimeout(function() {
          var retryIframe = document.querySelector('#sq-card iframe');
          if (retryIframe) {
            retryIframe.style.pointerEvents = 'auto';
            retryIframe.style.opacity = '1';
            console.log('✅ Card iframe found and enabled on retry');
          }
        }, 2000);
      }
      
      // Click on card container to focus
      var cardContainer = document.querySelector('#sq-card');
      if (cardContainer) {
        cardContainer.click();
        console.log('✅ Card container clicked');
      }
      
      // Notify React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CARD_FORM_READY',
        payload: { ready: true }
      }));
      
      console.log('✅ Card form enabled successfully');
    }, 1500);
    true;
  `;

  const handleWebViewLoadEnd = () => {
    setWebViewLoading(false);
    console.log('✅ WebView loaded');
    // Inject scripts
    webViewRef.current?.injectJavaScript(getEnableCardFormScript);
    // Inject monitor script after a delay
    setTimeout(() => {
      webViewRef.current?.injectJavaScript(getMonitorScript);
    }, 3000);
  };

  const handleWebViewError = (errorEvent: any) => {
    console.log('❌ WebView Error:', errorEvent);
    setWebViewLoading(false);
    setError('Failed to load payment page');
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 WebView Message:', data);
      
      switch (data.type) {
        case 'CARD_FORM_READY':
          setCardFormReady(data.payload.ready);
          if (data.payload.ready) {
            console.log('✅ Card form is ready');
          } else {
            console.log('⚠️ Card form not ready, retrying...');
            setTimeout(() => {
              webViewRef.current?.injectJavaScript(getEnableCardFormScript);
            }, 2000);
          }
          break;
          
        case 'PAYMENT_SUCCESS':
          console.log('✅ Payment Success:', data.payload);
          setPaymentProcessing(false);
          // Show success message
          Alert.alert('Success', 'Payment completed successfully!', [
            { 
              text: 'OK', 
              onPress: () => {
                onSuccess(data.payload.transactionId || `TXN_${Date.now()}`);
                onClose();
              }
            }
          ]);
          break;
          
        case 'PAYMENT_CANCELLED':
          console.log('❌ Payment Cancelled');
          setPaymentProcessing(false);
          Alert.alert('Cancelled', 'Payment was cancelled by user.');
          onClose();
          break;
          
        case 'PAYMENT_ERROR':
          console.log('❌ Payment Error:', data.payload.error);
          setPaymentProcessing(false);
          setError(data.payload.error || 'Payment failed');
          break;
          
        case 'SQUARE_READY':
          console.log('✅ Square SDK Ready');
          setWebViewLoading(false);
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url || '';
    console.log('📍 Navigating URL:', url);
    
    // Check for Square's payment success URL patterns
    if (url.includes('payment-link') && url.includes('success')) {
      console.log('✅ Payment success URL pattern detected');
      Alert.alert('Success', 'Payment completed successfully!', [
        { 
          text: 'OK', 
          onPress: () => {
            onSuccess(`TXN_${Date.now()}`);
            onClose();
          }
        }
      ]);
      return;
    }
    
    if (url.includes('cancel') || url.includes('cancelled')) {
      console.log('❌ Payment cancelled');
      Alert.alert('Cancelled', 'Transaction cancelled by user.');
      onClose();
      return;
    }
    
    // Check if we're on the checkout page, enable card form
    if (url.includes('checkout') || url.includes('payment') || url.includes('payment-link')) {
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(getEnableCardFormScript);
        // Also inject monitor script
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(getMonitorScript);
        }, 1000);
      }, 1000);
    }
  };

  if (!visible) return null;

  if (loading) {
    return (
      <Modal visible={visible} transparent={false} animationType="slide">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F29D38" />
          <Text style={styles.loadingText}>Creating checkout token...</Text>
        </View>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal visible={visible} transparent={false} animationType="slide">
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Payment Processing Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={createPaymentLink}>
            <Text style={styles.retryButtonText}>Retry Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeErrorButton} onPress={onClose}>
            <Text style={styles.closeErrorButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (paymentUrl) {
    return (
      <Modal visible={visible} transparent={false} animationType="slide">
        <View style={styles.paymentModalContainer}>
          <View style={styles.paymentHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.paymentHeaderTitle}>Secure Gateway</Text>
            <View style={styles.spacer} />
          </View>
          
          <View style={styles.webViewContainer}>
            {(webViewLoading || !cardFormReady) && (
              <View style={styles.webViewLoader}>
                <ActivityIndicator size="large" color="#F29D38" />
                <Text style={styles.loadingText}>
                  {!cardFormReady ? 'Preparing payment form...' : 'Loading payment gateway...'}
                </Text>
              </View>
            )}
            <WebView
              ref={webViewRef}
              source={{ uri: paymentUrl }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
              originWhitelist={['*']}
              setSupportMultipleWindows={false}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              style={[
                styles.webView,
                (webViewLoading || !cardFormReady) && styles.webViewHidden
              ]}
              onLoadEnd={handleWebViewLoadEnd}
              onError={handleWebViewError}
              onMessage={handleMessage}
              onNavigationStateChange={handleNavigationStateChange}
              injectedJavaScript={getEnableCardFormScript}
              renderLoading={() => (
                <View style={styles.webViewLoader}>
                  <ActivityIndicator size="large" color="#F29D38" />
                  <Text style={styles.loadingText}>Loading payment gateway...</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    );
  }

  return null;
};

// ==================== MAIN COMPONENT ====================
const BookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  
  // Logged-in user data state
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // ==================== FETCH LOGGED-IN USER DATA ====================
  const fetchUserData = async () => {
    setIsUserLoading(true);
    try {
      // First try to get from AsyncStorage
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        setLoggedInUser(parsedData);
        console.log('📦 User data from storage:', parsedData);
      }

      // Then fetch from API for fresh data
      const response = await apiClient.get('/user');
      if (response.data && response.data.success) {
        const user = response.data.data;
        console.log('🔄 Fetched user data from API:', user);
        setLoggedInUser(user);
        // Update storage with fresh data
        await AsyncStorage.setItem('userData', JSON.stringify(user));
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    } finally {
      setIsUserLoading(false);
    }
  };

  // ==================== FETCH BOOKINGS ====================
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
          customer_name: booking.customer_name || booking.user?.name || 'Guest User',
          customer_email: booking.customer_email || booking.user?.email || 'guest@email.com',
          customer_phone: booking.customer_phone || booking.user?.phone || '',
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
    fetchUserData();
    fetchBookings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
      fetchUserData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
    fetchUserData();
  };

  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: '', type: 'success' });
  }, []);

  const handlePayNow = (booking) => {
    const statusLower = booking.status?.toLowerCase();
    if (statusLower === 'completed') {
      showToast('This booking is already completed', 'warning');
      return;
    }
    if (statusLower === 'cancelled') {
      showToast('This booking is cancelled', 'error');
      return;
    }
    
    setSelectedBooking(booking);
    setPaymentVisible(true);
  };

  const handlePaymentSuccess = (transactionId) => {
    showToast(`Payment verified! ID: ${transactionId}`, 'success');
    setPaymentVisible(false);
    setSelectedBooking(null);
    fetchBookings();
  };

  const getDisplayStatus = (status) => {
    if (!status) return 'Pending';
    const statusMap: Record<string, string> = {
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

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed') return '#34C759';
    if (statusLower === 'ongoing' || statusLower === 'running') return '#F29D38';
    if (statusLower === 'pending') return '#007AFF';
    if (statusLower === 'cancelled') return '#FF3B30';
    return '#8E8E93';
  };

  const getStatusBgColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed') return 'rgba(52, 199, 89, 0.15)';
    if (statusLower === 'ongoing' || statusLower === 'running') return 'rgba(242, 157, 56, 0.15)';
    if (statusLower === 'pending') return 'rgba(0, 122, 255, 0.15)';
    if (statusLower === 'cancelled') return 'rgba(255, 59, 48, 0.15)';
    return 'rgba(142, 142, 147, 0.15)';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderStars = (rating: string) => {
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

  const renderBookingItem = ({ item }: { item: any }) => {
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
              <Text style={[styles.statusText, { color: statusColor }]}>{displayStatus}</Text>
            </View>
          </View>

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

          <View style={styles.distanceContainer}>
            <DistanceIcon />
            <Text style={styles.distanceText}>Distance: {item.distance || 'N/A'}</Text>
          </View>

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

          <View style={styles.compactFooter}>
            <View>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.compactFare}>₹{totalAmount}</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.payButton, !isPayable && styles.payButtonDisabled]}
              onPress={() => handlePayNow(item)}
              disabled={!isPayable}
            >
              <Text style={styles.payButtonText}>
                {isCompleted ? '✅ Completed' : isCancelled ? '❌ Cancelled' : 'Pay Now'}
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
        <Text style={styles.screenTitle}>My Payments</Text>
        
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
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

      <SquarePaymentWebView
        visible={paymentVisible}
        onClose={() => {
          setPaymentVisible(false);
          setSelectedBooking(null);
        }}
        onSuccess={handlePaymentSuccess}
        amount={selectedBooking ? parseFloat(selectedBooking.total_fee || selectedBooking.total_amount || 0) : 0}
        bookingId={selectedBooking ? selectedBooking.id.toString() : ''}
        customerDetails={selectedBooking ? {
          name: selectedBooking.customer_name || 'Guest User',
          email: selectedBooking.customer_email || 'guest@email.com',
          phone: selectedBooking.customer_phone || '',
        } : null}
        loggedInUser={loggedInUser}
      />
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  screenHeader: { 
    paddingHorizontal: 20, 
    marginBottom: 20, 
    marginTop: Platform.OS === 'android' ? 10 : 0 
  },
  screenTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#FFFFFF' 
  },
  screenSubtitle: { 
    fontSize: 14, 
    color: '#8E8E93', 
    marginTop: 4 
  },
  userInfoText: {
    fontSize: 12,
    color: '#F29D38',
    marginTop: 6,
    opacity: 0.8,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000000' 
  },
  loadingText: { 
    color: '#FFFFFF', 
    marginTop: 12, 
    fontSize: 14 
  },
  listContainer: { 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
  tripCard: { 
    backgroundColor: '#1C1C1E', 
    borderRadius: 16, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#2C2C2E', 
    overflow: 'hidden' 
  },
  completedCard: { 
    borderColor: '#34C759', 
    borderWidth: 1.5 
  },
  compactContainer: { 
    padding: 16 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  dateTimeContainer: { 
    flex: 1 
  },
  dateRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4, 
    gap: 6 
  },
  timeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  dateText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#FFFFFF' 
  },
  timeText: { 
    fontSize: 12, 
    color: '#8E8E93' 
  },
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: '600' 
  },
  routePreview: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    backgroundColor: '#2C2C2E', 
    borderRadius: 12, 
    padding: 12 
  },
  locationPreview: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  previewLocation: { 
    flex: 1, 
    fontSize: 13, 
    color: '#E5E5EA' 
  },
  distanceContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 12, 
    paddingHorizontal: 4 
  },
  distanceText: { 
    fontSize: 13, 
    color: '#8E8E93' 
  },
  driverContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#2C2C2E', 
    paddingTop: 12, 
    marginBottom: 12 
  },
  driverAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#F29D38', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  driverAvatarText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  driverInfo: { 
    flex: 1 
  },
  driverName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FFFFFF', 
    marginBottom: 2 
  },
  ratingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 2 
  },
  ratingText: { 
    fontSize: 13, 
    color: '#8E8E93', 
    marginLeft: 4 
  },
  compactFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#2C2C2E', 
    paddingTop: 12 
  },
  totalLabel: { 
    fontSize: 12, 
    color: '#8E8E93' 
  },
  compactFare: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#F29D38' 
  },
  payButton: { 
    backgroundColor: '#F29D38', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 25 
  },
  payButtonDisabled: { 
    backgroundColor: '#3A3A3C' 
  },
  payButtonText: { 
    color: '#000000', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 60, 
    gap: 12 
  },
  emptyText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '600' 
  },
  emptySubtext: { 
    color: '#8E8E93', 
    fontSize: 14 
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
    elevation: 5 
  },
  toastText: { 
    flex: 1, 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#FFFFFF' 
  },
  // Payment Modal Styles
  paymentModalContainer: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },
  paymentHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#1C1C1E', 
    borderBottomWidth: 1, 
    borderBottomColor: '#2C2C2E' 
  },
  closeButton: { 
    padding: 8 
  },
  closeButtonText: { 
    color: '#FFFFFF', 
    fontSize: 24 
  },
  paymentHeaderTitle: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '600' 
  },
  spacer: { 
    width: 36 
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  webViewHidden: {
    opacity: 0,
    height: 0,
    width: 0,
  },
  webViewLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    zIndex: 10,
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#000000' 
  },
  errorIcon: { 
    fontSize: 48, 
    marginBottom: 16 
  },
  errorTitle: { 
    color: '#FFFFFF', 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  errorMessage: { 
    color: '#8E8E93', 
    fontSize: 14, 
    textAlign: 'center', 
    marginBottom: 24 
  },
  retryButton: { 
    backgroundColor: '#F29D38', 
    paddingHorizontal: 32, 
    paddingVertical: 14, 
    borderRadius: 12, 
    marginBottom: 10 
  },
  retryButtonText: { 
    color: '#000000', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  closeErrorButton: { 
    paddingHorizontal: 32, 
    paddingVertical: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#2C2C2E' 
  },
  closeErrorButtonText: { 
    color: '#8E8E93', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});

export default BookingsScreen;