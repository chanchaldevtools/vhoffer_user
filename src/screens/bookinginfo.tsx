import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import apiClient from '../services/apiConfig';

// SVG Icons
const CarIcon = ({ color = "#E67E22", size = 24 }) => (
   <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <Circle cx="7" cy="17" r="2" />
    <Circle cx="17" cy="17" r="2" />
  </Svg>
);

const ArrowRightIcon = ({ color = "#A0A0A0", size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);

const CarWhiteIcon = ({ color = "#FFFFFF", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <Circle cx="7" cy="17" r="2" />
    <Circle cx="17" cy="17" r="2" />
  </Svg>
);

const CheckIcon = ({ color = "#FFFFFF", size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const CloseIcon = ({ color = "#FFFFFF", size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

export default function PickupInfoScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  
  const [bookingFor, setBookingFor] = useState<'myself' | 'someone_else'>('myself');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useState(new Animated.Value(0))[0];
  
  // Terms and Conditions States
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [legalContent, setLegalContent] = useState({ title: '', body: '' });
  const [isLoadingLegal, setIsLoadingLegal] = useState(false);
  
  // State for "someone else" fields
  const [otherName, setOtherName] = useState('');
  const [otherPhone, setOtherPhone] = useState('');
  const [otherEmail, setOtherEmail] = useState('');

  // Get booking data from previous screens
  const bookingData = route.params?.bookingData || {};
  const selectedVehicle = route.params?.selectedVehicle || {};
  const totalPrice = route.params?.totalPrice || 0;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  // Fetch Terms and Conditions
  const fetchTermsAndConditions = async () => {
    setIsLoadingLegal(true);
    try {
      const formData = new FormData();
      formData.append('content_for', 'terms_and_conditions');
      
      const response = await apiClient.post('/legal-content/get', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
      });
      
      console.log('Legal content response:', response.data);
      
      if (response.data && response.data.success) {
        let content = '';
        if (response.data.data.terms_and_conditions) {
          content = response.data.data.terms_and_conditions.content || '';
        }
        
        setLegalContent({ title: 'Terms and Conditions', body: content });
      } else {
        showToast('Failed to load terms and conditions', 'error');
        setTermsModalVisible(false);
      }
    } catch (error) {
      console.error('Error fetching legal content:', error);
      showToast('Failed to load terms. Please try again.', 'error');
      setTermsModalVisible(false);
    } finally {
      setIsLoadingLegal(false);
    }
  };

  // Open Terms Modal
  const openTermsModal = () => {
    setTermsModalVisible(true);
    fetchTermsAndConditions();
  };

  // Format time to H:i format (24-hour format)
  const formatTimeForAPI = (timeString: string) => {
    if (!timeString) return '14:32';
    
    const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    return '14:32';
  };

  // Format date to YYYY-MM-DD
  const formatDateForAPI = (dateString: string) => {
    if (!dateString) return '2024-02-20';
    
    const months: { [key: string]: string } = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    
    const match = dateString.match(/(\w+), (\w+) (\d+)/);
    if (match) {
      const month = months[match[2]];
      const day = match[3].padStart(2, '0');
      const year = new Date().getFullYear();
      return `${year}-${month}-${day}`;
    }
    return '2024-02-20';
  };

  // Strip HTML tags for plain text fallback
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const handleContinue = async () => {
    // Validation
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please accept the Terms and Conditions to continue');
      return;
    }

    if (bookingFor === 'someone_else') {
      if (!otherName || !otherPhone) {
        Alert.alert('Validation Error', 'Please fill passenger name and phone number');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formattedPickupTime = formatTimeForAPI(bookingData.pickupTime);
      const formattedDate = formatDateForAPI(bookingData.date);
      
      const createBookingPayload = {
        booking_type: bookingData.bookingType === 'ONE_WAY' ? 'Point to Point' : 
                bookingData.bookingType === 'BY_HOUR' ? 'Hourly' : 
                bookingData.bookingType === 'BY_AIRPORT' ? 'Airport' : 'Point to Point',
        from_location: bookingData.from || bookingData.origin || '',
        to_location: bookingData.to || bookingData.destination || '',
        distance: parseFloat(selectedVehicle.distanceKm || bookingData.distance || 0),
        pickup_time: formattedPickupTime,
        booking_date: formattedDate,
        duration: bookingData.duration ? parseInt(bookingData.duration) : null,
        
        vehicle_class: selectedVehicle.id,
        base_fee: parseFloat(selectedVehicle.baseFee || 0),
        fulesurcharge: parseFloat(selectedVehicle.fuelSurcharge || 0),
        graduity: parseFloat(selectedVehicle.gratuity || 0),
        total_fee: parseFloat(totalPrice || selectedVehicle.totalPrice || 0),
        booked_for: bookingFor === 'myself' ? 'self' : 'other',
       
        special_requests: notes || null,
        reference_code: reference || null,
      };

      if (bookingData.bookingType === 'BY_AIRPORT') {
        createBookingPayload.airport_direction = bookingData.airportDirection === 'FROM_AIRPORT' ? 'from' : 'to';
        createBookingPayload.from_location = bookingData.airport;
      }

      if (bookingData.bookingType === 'BY_HOUR') {
        createBookingPayload.duration = (bookingData.duration);
        createBookingPayload.hourly_rate = parseFloat(selectedVehicle.baseHourlyRate || 0);
      }

      console.log('=== CREATE BOOKING API REQUEST ===');
      console.log('Payload:', JSON.stringify(createBookingPayload, null, 2));

      const response = await apiClient.post('/create-booking', createBookingPayload);
      
      if (response.data && response.data.status === true) {
        console.log('================== BOOKING SUCCESS ==================');
        console.log('Booking ID:', response.data.booking_id);
        console.log('======================================================');

        showToast('Booking created successfully!', 'success');

        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Authenticated',
                  params: {
                    screen: 'Trips',
                    params: {
                      bookingSuccess: true,
                      bookingId: response.data.booking_id
                    }
                  }
                }
              ],
            })
          );
        }, 1500);
      } else {
        const errors = response.data?.errors;
        let errorMessage = response.data?.message || 'Failed to create booking';
        
        if (errors) {
          const errorList = [];
          for (const key in errors) {
            if (errors[key] && Array.isArray(errors[key])) {
              errorList.push(`${key}: ${errors[key].join(', ')}`);
            }
          }
          if (errorList.length > 0) {
            errorMessage = errorList.join('\n');
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Create booking error:', error);
      
      let errorMessage = 'Failed to create booking. Please try again.';
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorList = [];
        for (const key in errors) {
          if (errors[key] && Array.isArray(errors[key])) {
            errorList.push(`• ${key}: ${errors[key].join(', ')}`);
          }
        }
        if (errorList.length > 0) {
          errorMessage = errorList.join('\n');
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
      setIsSubmitting(false);
    }
  };

  // Custom renderer for HTML content
  const renderHtmlContent = () => {
    if (!legalContent.body) {
      return (
        <Text style={styles.modalBodyText}>No content available.</Text>
      );
    }

    // Check if content contains HTML tags
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(legalContent.body);
    
    if (hasHtmlTags) {
      return (
        <RenderHtml
          contentWidth={width - 40}
          source={{ html: legalContent.body }}
          tagsStyles={{
            p: {
              color: '#E5E5EA',
              fontSize: 14,
              lineHeight: 22,
              marginBottom: 12,
            },
            h1: {
              color: '#FFFFFF',
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 12,
            },
            h2: {
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: 'bold',
              marginBottom: 10,
            },
            h3: {
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            },
            ul: {
              marginBottom: 12,
              paddingLeft: 20,
            },
            ol: {
              marginBottom: 12,
              paddingLeft: 20,
            },
            li: {
              color: '#E5E5EA',
              fontSize: 14,
              lineHeight: 22,
              marginBottom: 4,
            },
            strong: {
              color: '#FFFFFF',
              fontWeight: 'bold',
            },
            a: {
              color: '#E67E22',
              textDecorationLine: 'underline',
            },
            br: {
              marginBottom: 8,
            },
          }}
        />
      );
    } else {
      // Plain text fallback
      return (
        <Text style={styles.modalBodyText}>{legalContent.body}</Text>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerLeft}>
            <CarIcon color="#E67E22" size={24} />
            <Text style={styles.headerTitle}>Pickup info</Text>
          </View>
          <Text style={styles.stepText}>Step 2 of 5</Text>
        </View>
      </View>

      {/* Main Content (Dark Background) */}
      <ScrollView style={styles.contentContainer} bounces={false}>
        
        {/* Simple Progress Line */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={styles.progressSegment} />
          <View style={styles.progressSegment} />
          <View style={styles.progressSegment} />
        </View>

        {/* Vehicle Info Card */}
        {selectedVehicle && selectedVehicle.name && (
          <View style={styles.vehicleInfoCard}>
            <View style={styles.vehicleInfoHeader}>
              <CarIcon color="#E67E22" size={20} />
              <Text style={styles.vehicleInfoTitle}>Selected Vehicle</Text>
            </View>
            <View style={styles.vehicleInfoContent}>
              <Text style={styles.vehicleName}>{selectedVehicle.name}</Text>
              <View style={styles.vehicleSpecs}>
                <Text style={styles.specText}>{selectedVehicle.capacity || 4} seats</Text>
                <Text style={styles.specPrice}>${totalPrice || selectedVehicle.totalPrice}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Trip Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.dateTimeText}>
            {bookingData.date || 'Fri, Feb 20'} at {bookingData.pickupTime || '02:32 PM'}
          </Text>
          
          <View style={styles.routeBadge}>
            <CarIcon color="#A0A0A0" size={16} />
            <Text style={styles.routeText} numberOfLines={1}>
              {bookingData.from || bookingData.origin || 'Pickup Location'}
            </Text>
            <ArrowRightIcon color="#A0A0A0" size={14} />
            <Text style={styles.routeText} numberOfLines={1}>
              {bookingData.to || bookingData.destination || 'Dropoff Location'}
            </Text>
          </View>
        </View>

        {/* Radio Selection Section */}
        <Text style={styles.sectionTitle}>Select who you are booking for</Text>
        
        <TouchableOpacity 
          style={styles.radioRow} 
          activeOpacity={0.7}
          onPress={() => setBookingFor('myself')}
        >
          <View style={[styles.radioOuter, bookingFor === 'myself' && styles.radioOuterActive]}>
            {bookingFor === 'myself' && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioLabel}>Book for myself</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.radioRow} 
          activeOpacity={0.7}
          onPress={() => setBookingFor('someone_else')}
        >
          <View style={[styles.radioOuter, bookingFor === 'someone_else' && styles.radioOuterActive]}>
            {bookingFor === 'someone_else' && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioLabel}>Book for someone else</Text>
        </TouchableOpacity>

        {/* Additional Info Section */}
        <Text style={styles.sectionTitle}>Provide additional information</Text>

        {/* Notes Input */}
        <TextInput
          style={styles.textArea}
          placeholder="Notes for the chauffeur"
          placeholderTextColor="#8E8E93"
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />
        <Text style={styles.inputSubtext}>
          Add special requests, e.g. number of bags, child seats, etc.
        </Text>

        {/* Reference Input */}
        <TextInput
          style={styles.textInputSingle}
          placeholder="Reference code or cost center"
          placeholderTextColor="#8E8E93"
          value={reference}
          onChangeText={setReference}
        />
        <Text style={styles.inputSubtext}>
          Booking for business? This will appear on the invoice.
        </Text>

        {/* Terms and Conditions Checkbox */}
        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.termsCheckboxRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.7}
          >
            <View style={[styles.termsCheckbox, termsAccepted && styles.termsCheckboxActive]}>
              {termsAccepted && <CheckIcon color="#FFFFFF" size={14} />}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text 
                style={styles.termsLink} 
                onPress={openTermsModal}
              >
                Terms and Conditions
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity 
          style={[
            styles.continueButton, 
            (isSubmitting || !termsAccepted) && styles.disabledButton
          ]} 
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={isSubmitting || !termsAccepted}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <CarWhiteIcon color="#FFFFFF" size={20} />
              <Text style={styles.continueButtonText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* Terms and Conditions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={termsModalVisible}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms and Conditions</Text>
              <TouchableOpacity 
                onPress={() => setTermsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <CloseIcon color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>
            
            {isLoadingLegal ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#E67E22" />
                <Text style={styles.modalLoadingText}>Loading terms...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {renderHtmlContent()}
              </ScrollView>
            )}
            
            <TouchableOpacity 
              style={styles.modalAcceptButton}
              onPress={() => {
                setTermsAccepted(true);
                setTermsModalVisible(false);
              }}
            >
              <Text style={styles.modalAcceptButtonText}>Accept Terms</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, backgroundColor: toastType === 'success' ? '#2E7D32' : '#C62828' }]}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  stepText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#000000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  vehicleInfoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E67E22',
  },
  vehicleInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 8,
  },
  vehicleInfoTitle: {
    color: '#E67E22',
    fontSize: 14,
    fontWeight: '600',
  },
  vehicleInfoContent: {
    padding: 12,
  },
  vehicleName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  vehicleSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specText: {
    color: '#AEAEB2',
    fontSize: 12,
  },
  specPrice: {
    color: '#E67E22',
    fontSize: 14,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    height: 3,
    backgroundColor: '#3A3A3C',
    marginBottom: 24,
    marginHorizontal: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressSegment: {
    flex: 1,
    height: '100%',
  },
  progressActive: {
    backgroundColor: '#E67E22',
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  dateTimeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  routeBadge: {
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  routeText: {
    color: '#E5E5EA',
    fontSize: 13,
    flex: 1,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#AEAEB2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterActive: {
    borderColor: '#E67E22',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#E67E22',
  },
  radioLabel: {
    color: '#E5E5EA',
    fontSize: 15,
  },
  textArea: {
    backgroundColor: '#48484A',
    borderRadius: 16,
    color: '#FFFFFF',
    padding: 14,
    fontSize: 14,
    height: 100,
  },
  textInputSingle: {
    backgroundColor: '#48484A',
    borderRadius: 16,
    color: '#FFFFFF',
    padding: 14,
    fontSize: 14,
    height: 54,
    marginTop: 8,
  },
  inputSubtext: {
    color: '#AEAEB2',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  // Terms and Conditions Styles
  termsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  termsCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  termsCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#AEAEB2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  termsCheckboxActive: {
    backgroundColor: '#E67E22',
    borderColor: '#E67E22',
  },
  termsText: {
    color: '#E5E5EA',
    fontSize: 14,
    flex: 1,
  },
  termsLink: {
    color: '#E67E22',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  continueButton: {
    backgroundColor: '#E67E22',
    borderRadius: 28,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#48484A',
    opacity: 0.7,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    paddingVertical: 14,
    borderRadius: 12,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 400,
    marginBottom: 20,
  },
  modalBodyText: {
    color: '#E5E5EA',
    fontSize: 14,
    lineHeight: 22,
  },
  modalLoadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  modalLoadingText: {
    color: '#AEAEB2',
    fontSize: 14,
  },
  modalAcceptButton: {
    backgroundColor: '#E67E22',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalAcceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});