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
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
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

const UserIcon = ({ color = "#E67E22", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const PhoneIcon = ({ color = "#E67E22", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const MailIcon = ({ color = "#E67E22", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="2" y="4" width="20" height="16" rx="2" />
    <Path d="m22 7-10 7L2 7" />
  </Svg>
);

const CarWhiteIcon = ({ color = "#FFFFFF", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <Circle cx="7" cy="17" r="2" />
    <Circle cx="17" cy="17" r="2" />
  </Svg>
);

export default function PickupInfoScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [bookingFor, setBookingFor] = useState<'myself' | 'someone_else'>('myself');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useState(new Animated.Value(0))[0];
  
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

  const handleContinue = async () => {
    // Validation
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
      
      let bookingTypeValue = '';
      if (bookingData.bookingType === 'ONE_WAY') {
        bookingTypeValue = 'one_way';
      } else if (bookingData.bookingType === 'BY_HOUR') {
        bookingTypeValue = 'hourly';
      } else if (bookingData.bookingType === 'BY_AIRPORT') {
        bookingTypeValue = 'airport';
      }
      
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
        const pickupInfo = {
          bookingFor: bookingFor,
          notes: notes,
          reference: reference,
          bookingData: bookingData,
          vehicleData: selectedVehicle,
          bookingResponse: response.data,
          bookingId: response.data.booking_id,
          timestamp: new Date().toISOString(),
        };

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
        
        {/* Simple Progress Line (Without Dots) */}
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

        {/* Someone Else Fields */}
        {bookingFor === 'someone_else' && (
          <View style={styles.someoneElseContainer}>
            <View style={styles.someoneElseInputWrapper}>
              <UserIcon color="#E67E22" size={20} />
              <TextInput
                style={styles.someoneElseInput}
                placeholder="Full Name"
                placeholderTextColor="#8E8E93"
                value={otherName}
                onChangeText={setOtherName}
              />
            </View>
            
            <View style={styles.someoneElseInputWrapper}>
              <PhoneIcon color="#E67E22" size={20} />
              <TextInput
                style={styles.someoneElseInput}
                placeholder="Phone Number"
                placeholderTextColor="#8E8E93"
                keyboardType="phone-pad"
                value={otherPhone}
                onChangeText={setOtherPhone}
              />
            </View>
            
            <View style={styles.someoneElseInputWrapper}>
              <MailIcon color="#E67E22" size={20} />
              <TextInput
                style={styles.someoneElseInput}
                placeholder="Email (Optional)"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
                value={otherEmail}
                onChangeText={setOtherEmail}
              />
            </View>
          </View>
        )}

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

        {/* Confirm Button */}
        <TouchableOpacity 
          style={[styles.continueButton, isSubmitting && styles.disabledButton]} 
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={isSubmitting}
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
  someoneElseContainer: {
    marginBottom: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 12,
  },
  someoneElseInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  someoneElseInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
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
    backgroundColor: '#A0A0A0',
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
});