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
  Animated,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import Share from 'react-native-share';
import apiClient from '../services/apiConfig';

const { width, height } = Dimensions.get('window');

// ==================== SVG ICONS ====================
const CarIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M5 13L6 9H18L19 13M5 13H19M5 13V17H7V15H17V17H19V13M7 15H9M15 15H17" stroke="#F29D38" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="7" cy="17" r="2" stroke="#F29D38" strokeWidth="1.5"/>
    <Circle cx="17" cy="17" r="2" stroke="#F29D38" strokeWidth="1.5"/>
  </Svg>
);

const LocationIcon = ({ color = "#34C759" }) => (
  <Svg width="8" height="8" viewBox="0 0 24 24" fill="none">
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

const VehicleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="11" width="20" height="10" rx="2" stroke="#F29D38" strokeWidth="1.5"/>
    <Path d="M7 7L9 4H15L17 7" stroke="#F29D38" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="7" cy="17" r="2" stroke="#F29D38" strokeWidth="1.5"/>
    <Circle cx="17" cy="17" r="2" stroke="#F29D38" strokeWidth="1.5"/>
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

const TagIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M7 7H7.01M7 3H9L21 15L15 21L3 9V5C3 3.89543 3.89543 3 5 3H7Z" stroke="#F29D38" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TrackingIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke="#F29D38" strokeWidth="1.5"/>
    <Path d="M19.4 15.05C18.3718 17.7872 16.1451 19.7846 13.3333 20.2961C10.5215 20.8075 7.65493 19.7755 5.65685 17.4717C3.65878 15.1679 2.86913 12.0669 3.53553 9.12389C4.20193 6.18085 6.18533 3.78775 8.91876 2.73678" stroke="#F29D38" strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M22 12C22 14.6522 20.9464 17.1957 19.0711 19.0711C17.1957 20.9464 14.6522 22 12 22" stroke="#F29D38" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const CloseIcon = ({ color = "#8E8E93" }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const CheckIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const WarningIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M12 8V12M12 16H12.01M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="#F29D38" strokeWidth="2" strokeLinecap="round"/>
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

const InfoIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#F29D38" strokeWidth="2"/>
    <Path d="M12 16V12M12 8H12.01" stroke="#F29D38" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const CancelIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#FF3B30" strokeWidth="2"/>
    <Path d="M15 9L9 15M9 9L15 15" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const InvoiceIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M4 4H20V20H4V4Z" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M8 7H16M8 12H16M8 17H12" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const ShareIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M4 12V20H20V12M12 2V15M12 15L9 12M12 15L15 12" stroke="#5856D6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

// ==================== INVOICE PREVIEW MODAL ====================
const InvoicePreviewModal = ({ visible, htmlContent, onClose, onShare, isLoading }) => {
  const getCompleteHtml = (content) => {
    if (!content) {
      return '<html><body><p>No invoice data available</p></body></html>';
    }
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
          <title>Invoice</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              background-color: #f0f0f0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .invoice-container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            img {
              max-width: 100%;
              height: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            td, th {
              padding: 8px;
              text-align: left;
            }
            .text-center {
              text-align: center;
            }
            .brand-name {
              font-size: 24px;
              font-weight: bold;
              margin: 10px 0;
            }
            .divider {
              border-top: 1px solid #ddd;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            ${content}
          </div>
        </body>
      </html>
    `;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.invoiceModalContainer}>
        <View style={styles.invoiceModalHeader}>
          <Text style={styles.invoiceModalTitle}>Invoice Preview</Text>
          <TouchableOpacity onPress={onClose} style={styles.invoiceModalClose}>
            <CloseIcon color="#8E8E93" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.webviewContainer}>
          {isLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#F29D38" />
              <Text style={styles.loadingText}>Loading invoice...</Text>
            </View>
          ) : htmlContent ? (
            <WebView
              originWhitelist={['*']}
              source={{ html: getCompleteHtml(htmlContent) }}
              style={styles.webview}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              onError={(error) => console.error('WebView error:', error)}
            />
          ) : (
            <View style={styles.emptyInvoiceContainer}>
              <Text style={styles.emptyText}>No invoice data available</Text>
            </View>
          )}
        </View>
        
        
      </View>
    </Modal>
  );
};

// ==================== MAIN COMPONENT ====================
const TripHistoryScreen = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState('');
  const [currentInvoiceTrip, setCurrentInvoiceTrip] = useState(null);
  const navigation = useNavigation();
  
  const slideAnim = useRef(new Animated.Value(height)).current;

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '', type: 'success' });
  };

  const fetchInvoice = async (bookingId) => {
    try {
      const formData = new FormData();
      formData.append('booking_id', bookingId.toString());
      
      const response = await apiClient.post('/get-invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data && response.data.status === 'success') {
        return response.data.html;
      } else {
        throw new Error(response.data?.message || 'Failed to fetch invoice');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  };

  const shareInvoiceAsText = async (htmlContent) => {
    try {
      const textContent = htmlContent
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      await Share.open({
        message: `Here is your invoice details:\n\n${textContent.substring(0, 1000)}...\n\nFor full invoice, please check the app.`,
        title: 'Invoice Details',
      });
      
      showToast('Invoice shared successfully!', 'success');
    } catch (error) {
      console.error('Share error:', error);
      if (error.message !== 'User did not share') {
        showToast('Failed to share invoice', 'error');
      }
    }
  };

  const handleViewInvoice = async (trip) => {
    setLoadingInvoice(true);
    setCurrentInvoiceTrip(trip);
    
    try {
      //showToast('Fetching invoice...', 'info');
      const htmlContent = await fetchInvoice(trip.id);
      
      if (htmlContent) {
        setInvoiceHtml(htmlContent);
        setInvoiceModalVisible(true);
        //showToast('Invoice loaded successfully', 'success');
      } else {
        throw new Error('No invoice data received');
      }
    } catch (error) {
      showToast(error.message || 'Failed to fetch invoice', 'error');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleShareInvoice = async () => {
    if (!invoiceHtml) {
      showToast('No invoice data to share', 'warning');
      return;
    }
    await shareInvoiceAsText(invoiceHtml);
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let requestBody = {};
      
      if (activeTab === 'Pending') {
        requestBody = { status: 'pending' };
      } else if (activeTab === 'Completed') {
        requestBody = { status: 'completed' };
      } else if (activeTab === 'Running') {
        requestBody = { status: 'ongoing' };
      }
      
      const response = await apiClient.post('/bookings', requestBody);
      
      if (response.data && response.data.success) {
        setTrips(response.data.data);
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
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [activeTab])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openCancelModal = (trip) => {
    setSelectedTrip(trip);
    setCancelModalVisible(true);
    setCancelReason('');
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeCancelModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCancelModalVisible(false);
      setSelectedTrip(null);
      setCancelReason('');
    });
  };

  const handleCancelRide = async () => {
    if (!cancelReason.trim()) {
      showToast('Please provide a reason for cancellation', 'warning');
      return;
    }

    setCancelSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('booking_id', selectedTrip.id.toString());
      formData.append('reason', cancelReason);
      
      const response = await apiClient.post('/cancel-booking', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data && response.data.success) {
        showToast(response.data.message || 'Ride cancelled successfully', 'success');
        closeCancelModal();
        fetchBookings();
      } else {
        showToast(response.data.message || 'Failed to cancel ride', 'error');
      }
    } catch (error) {
      showToast('Failed to cancel ride. Please try again.', 'error');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleTrackDriver = (trip) => {
    if (trip.status?.toLowerCase() === 'cancelled') {
      showToast('Cannot track driver for cancelled ride', 'warning');
      return;
    }
    if (trip.status?.toLowerCase() === 'completed') {
      showToast('Trip is completed. You can view the invoice instead.', 'info');
      return;
    }
    navigation.navigate('TrackDriver', { tripId: trip.id });
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

  const RunningAnimation = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const translateXAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      const slideAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(translateXAnim, {
            toValue: 10,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(translateXAnim, {
            toValue: -10,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      slideAnimation.start();

      return () => {
        pulseAnimation.stop();
        slideAnimation.stop();
      };
    }, []);

    return (
      <View style={styles.runningContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <CarIcon />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateX: translateXAnim }] }}>
          <Text style={styles.runningText}>Trip In Progress</Text>
        </Animated.View>
      </View>
    );
  };

  const renderTripItem = ({ item }) => {
    const displayStatus = getDisplayStatus(item.status);
    const statusColor = getStatusColor(item.status);
    const statusBgColor = getStatusBgColor(item.status);
    const isExpanded = expandedId === item.id;
    const isRunning = item.status?.toLowerCase() === 'ongoing';
    const isCompleted = item.status?.toLowerCase() === 'completed';
    const isCancelled = item.status?.toLowerCase() === 'cancelled';
    const hasDriver = item.driver !== null && !isCancelled;
    const hasVehicle = item.vehicle !== null && !isCancelled;
    const trackingHistory = item.tracking || [];
    const isCancellable = !isCancelled && !isCompleted && ['pending', 'driver_assigned', 'vehicle_assigned'].includes(item.status?.toLowerCase());

    return (
      <View style={[styles.tripCard, isCompleted && styles.completedCard]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => toggleExpand(item.id)}>
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
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {displayStatus}
                </Text>
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

            <View style={styles.compactFooter}>
              <View style={styles.fareContainer}>
                <MoneyIcon />
                <Text style={styles.compactFare}>${parseFloat(item.total_fee || 0).toFixed(2)}</Text>
              </View>
              {hasDriver && !isCancelled && !isCompleted && (
                <View style={styles.driverBadge}>
                  <DriverIcon />
                  <Text style={styles.driverBadgeText}>Driver Assigned</Text>
                </View>
              )}
              {isRunning && !isCancelled && <RunningAnimation />}
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>Completed</Text>
                </View>
              )}
              {isCancelled && (
                <View style={styles.cancelledBadge}>
                  <CancelIcon />
                  <Text style={styles.cancelledBadgeText}>Cancelled</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContainer}>
            <View style={styles.divider} />
            
            <View style={styles.actionButtons}>
              {!isCancelled && !isCompleted && hasDriver && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.trackButton]}
                  onPress={() => handleTrackDriver(item)}
                >
                  <TrackingIcon />
                  <Text style={styles.trackButtonText}>Track Driver</Text>
                </TouchableOpacity>
              )}
              
              {isCompleted && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.invoiceButton]}
                  onPress={() => handleViewInvoice(item)}
                  disabled={loadingInvoice}
                >
                  {loadingInvoice && currentInvoiceTrip?.id === item.id ? (
                    <ActivityIndicator size="small" color="#34C759" />
                  ) : (
                    <>
                      <InvoiceIcon />
                      <Text style={styles.invoiceButtonText}>View Invoice</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              {isCancellable && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => openCancelModal(item)}
                >
                  <CloseIcon color="#FF3B30" />
                  <Text style={styles.cancelButtonText}>Cancel Ride</Text>
                </TouchableOpacity>
              )}
            </View>

            {isCancelled && (
              <View style={styles.cancelledMessageContainer}>
                <CancelIcon />
                <Text style={styles.cancelledMessageText}>This trip has been cancelled</Text>
                {item.cancel_reason && (
                  <Text style={styles.cancelReasonText}>Reason: {item.cancel_reason}</Text>
                )}
              </View>
            )}

            {hasDriver && !isCancelled && !isCompleted && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <DriverIcon />
                  <Text style={styles.sectionTitle}>Driver Details</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{item.driver.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{item.driver.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={[styles.infoValue, item.driver.is_online ? styles.onlineText : styles.offlineText]}>
                    {item.driver.is_online ? '🟢 Online' : '⚫ Offline'}
                  </Text>
                </View>
              </View>
            )}

            {hasVehicle && !isCancelled && !isCompleted && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <VehicleIcon />
                  <Text style={styles.sectionTitle}>Vehicle Details</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Model:</Text>
                  <Text style={styles.infoValue}>{item.vehicle.vehicle_model}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Color:</Text>
                  <Text style={styles.infoValue}>{item.vehicle.vehicle_color}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Number:</Text>
                  <Text style={styles.infoValue}>{item.vehicle.vehicle_number}</Text>
                </View>
              </View>
            )}

            {item.vehicle_class && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <TagIcon />
                  <Text style={styles.sectionTitle}>Vehicle Class</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Class:</Text>
                  <Text style={styles.infoValue}>{item.vehicle_class.vehicle_class}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Passengers:</Text>
                  <Text style={styles.infoValue}>{item.vehicle_class.allowed_passengers}</Text>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CalendarIcon />
                <Text style={styles.sectionTitle}>Booking Details</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type:</Text>
                <Text style={styles.infoValue}>{item.booking_type}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Booked For:</Text>
                <Text style={styles.infoValue}>{item.booked_for}</Text>
              </View>
              {item.booking_note && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Note:</Text>
                  <Text style={styles.infoValue}>{item.booking_note}</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MoneyIcon />
                <Text style={styles.sectionTitle}>Fare Breakdown</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Base Fee:</Text>
                <Text style={styles.infoValue}>${parseFloat(item.base_fee || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fuel Surcharge:</Text>
                <Text style={styles.infoValue}>${parseFloat(item.fulesurcharge || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gratuity:</Text>
                <Text style={styles.infoValue}>${parseFloat(item.graduity || 0).toFixed(2)}</Text>
              </View>
              <View style={[styles.infoRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>${parseFloat(item.total_fee || 0).toFixed(2)}</Text>
              </View>
            </View>

            {trackingHistory.length > 0 && !isCancelled && !isCompleted && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <TrackingIcon />
                  <Text style={styles.sectionTitle}>Trip Progress</Text>
                </View>
                {trackingHistory.map((track) => (
                  <View key={track.id} style={styles.trackingItem}>
                    <View style={styles.trackingDot} />
                    <View style={styles.trackingContent}>
                      <Text style={styles.trackingStatus}>{getDisplayStatus(track.status)}</Text>
                      <Text style={styles.trackingNote}>{track.notes}</Text>
                      <Text style={styles.trackingTime}>
                        {new Date(track.created_at).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const tabs = [
    { key: 'All', label: 'All' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Completed', label: 'Completed' },
    { key: 'Running', label: 'Running' }
  ];

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F29D38" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Trip History</Text>
        <Text style={styles.screenSubtitle}>Manage and track your past or live rides</Text>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={trips}
        renderItem={renderTripItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F29D38" colors={["#F29D38"]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} trips found.</Text>
            <Text style={styles.emptySubtext}>Your trips will appear here</Text>
          </View>
        }
      />

      <InvoicePreviewModal
        visible={invoiceModalVisible}
        htmlContent={invoiceHtml}
        isLoading={loadingInvoice}
        onClose={() => {
          setInvoiceModalVisible(false);
          setInvoiceHtml('');
          setCurrentInvoiceTrip(null);
        }}
        onShare={handleShareInvoice}
      />

      <Modal visible={cancelModalVisible} transparent={true} animationType="none" onRequestClose={closeCancelModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeCancelModal} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.bottomSheetHandle}>
              <View style={styles.handleBar} />
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalIconContainer}>
                <CancelIcon />
              </View>
              <Text style={styles.modalTitle}>Cancel Ride</Text>
              <Text style={styles.modalSubtitle}>Are you sure you want to cancel this ride?</Text>

              <View style={styles.tripInfoBox}>
                <View style={styles.tripInfoRow}>
                  <LocationIcon color="#34C759" />
                  <Text style={styles.tripInfoText}>{selectedTrip?.from_location}</Text>
                </View>
                <View style={styles.tripInfoArrow}>
                  <ArrowIcon />
                </View>
                <View style={styles.tripInfoRow}>
                  <LocationIcon color="#F29D38" />
                  <Text style={styles.tripInfoText}>{selectedTrip?.to_location}</Text>
                </View>
                <View style={styles.tripInfoDivider} />
                <View style={styles.tripInfoRow}>
                  <CalendarIcon />
                  <Text style={styles.tripInfoText}>
                    {selectedTrip && formatDate(selectedTrip.booking_date)} at {selectedTrip && formatTime(selectedTrip.pickup_time)}
                  </Text>
                </View>
                <View style={styles.tripInfoRow}>
                  <MoneyIcon />
                  <Text style={styles.tripInfoText}>
                    ${selectedTrip && parseFloat(selectedTrip.total_fee || 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              <Text style={styles.reasonLabel}>Reason for cancellation:</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Please provide a reason..."
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
                value={cancelReason}
                onChangeText={setCancelReason}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelModalButton]} onPress={closeCancelModal}>
                  <CloseIcon color="#8E8E93" />
                  <Text style={styles.cancelModalButtonText}>Go Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.confirmModalButton]} onPress={handleCancelRide} disabled={cancelSubmitting}>
                  {cancelSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckIcon />
                      <Text style={styles.confirmModalButtonText}>Confirm Cancel</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#F29D38',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabButtonTextActive: {
    color: '#000000',
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
  },
  locationPreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewLocation: {
    flex: 1,
    fontSize: 13,
    color: '#E5E5EA',
  },
  compactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactFare: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F29D38',
  },
  driverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 157, 56, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  driverBadgeText: {
    fontSize: 11,
    color: '#F29D38',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    color: '#34C759',
    fontWeight: '600',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  cancelledBadgeText: {
    fontSize: 11,
    color: '#FF3B30',
  },
  runningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 157, 56, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  runningText: {
    fontSize: 11,
    color: '#F29D38',
    fontWeight: '600',
  },
  expandedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackButton: {
    backgroundColor: 'rgba(242, 157, 56, 0.15)',
    borderWidth: 1,
    borderColor: '#F29D38',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F29D38',
  },
  invoiceButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  invoiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  cancelledMessageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  cancelledMessageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  cancelReasonText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F29D38',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 13,
    color: '#8E8E93',
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
  },
  onlineText: {
    color: '#34C759',
  },
  offlineText: {
    color: '#8E8E93',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  totalLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#F29D38',
  },
  trackingItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F29D38',
    marginTop: 4,
    marginRight: 12,
  },
  trackingContent: {
    flex: 1,
  },
  trackingStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trackingNote: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  trackingTime: {
    fontSize: 10,
    color: '#636366',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#636366',
    fontSize: 14,
    marginTop: 8,
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
  invoiceModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  invoiceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  invoiceModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  invoiceModalClose: {
    padding: 8,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5856D6',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    gap: 10,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyInvoiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: height * 0.8,
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
  modalIconContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  tripInfoBox: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  tripInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tripInfoArrow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  tripInfoDivider: {
    height: 1,
    backgroundColor: '#3A3A3C',
    marginVertical: 10,
  },
  tripInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#E5E5EA',
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  reasonInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
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
    backgroundColor: '#FF3B30',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TripHistoryScreen;