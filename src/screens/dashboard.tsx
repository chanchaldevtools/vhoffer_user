import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  StatusBar,
  TextInput,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import apiClient from '../services/apiConfig';

const { width, height } = Dimensions.get('window');

// Your Google Places API Key
const GOOGLE_PLACES_API_KEY = 'AIzaSyDZMPwuTtTXazrUOsqV2Q3W-zs8Ed2SUM8';

type BookingTab = 'ONE_WAY' | 'BY_HOUR' | 'BY_AIRPORT';
type AirportSubTab = 'FROM_AIRPORT' | 'TO_AIRPORT';

interface Airport {
  id: string;
  airport_code: string;
  name?: string;
  location?: string;
}

interface VehicleData {
  id: string;
  name: string;
  price: number;
  image: string;
  capacity: number;
  luggage: number;
  features: string[];
}

export default function App() {
  const route = useRoute();
  const navigation = useNavigation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<BookingTab>('ONE_WAY');
  const [airportSubTab, setAirportSubTab] = useState<AirportSubTab>('FROM_AIRPORT');

  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [airportName, setAirportName] = useState('');
  const [durationHours, setDurationHours] = useState('');

  // Selected vehicle data
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  // Validation errors
  const [errors, setErrors] = useState({
    fromLocation: '',
    toLocation: '',
    durationHours: '',
    airportName: '',
  });

  // Refs for Google Places
  const fromPlacesRef = useRef<any>(null);
  const toPlacesRef = useRef<any>(null);

  // Airports state
  const [airports, setAirports] = useState<Airport[]>([]);
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([]);
  const [showAirportDropdown, setShowAirportDropdown] = useState(false);
  const [isLoadingAirports, setIsLoadingAirports] = useState(false);

  // Date and Time States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [bookingDate, setBookingDate] = useState(() => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  });
  const [pickupTime, setPickupTime] = useState(() => {
    const date = new Date();
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  });

  // Check if vehicle data is passed from VehicleList screen
  useEffect(() => {
    if (route.params?.selectedVehicle) {
      setSelectedVehicle(route.params.selectedVehicle);
      console.log('Vehicle received:', route.params.selectedVehicle);
    }
  }, [route.params?.selectedVehicle]);

  // Fetch airports on component mount
  useEffect(() => {
    fetchAirports();
  }, []);

  const fetchAirports = async () => {
    setIsLoadingAirports(true);
    try {
      const response = await apiClient.post('/airports', {});
      console.log('Airports response:', response.data);

      if (response.data.success && response.data.data) {
        const airportList = response.data.data.map((airport: any, index: number) => ({
          id: index.toString(),
          airport_code: airport.airport_code,
          name: `${airport.airport_code} Airport`,
          location: airport.airport_code
        }));
        setAirports(airportList);
        console.log('Airports loaded:', airportList.length);
      }
    } catch (error) {
      console.error('Error fetching airports:', error);
      showToast('Failed to load airports', 'error');
    } finally {
      setIsLoadingAirports(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  // Clear specific error
  const clearError = (field: keyof typeof errors) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Validate One Way form
  const validateOneWay = () => {
    let isValid = true;
    const newErrors = { fromLocation: '', toLocation: '', durationHours: '', airportName: '' };

    if (!fromLocation || fromLocation.trim() === '') {
      newErrors.fromLocation = 'Please select pickup location';
      isValid = false;
    }

    if (!toLocation || toLocation.trim() === '') {
      newErrors.toLocation = 'Please select destination location';
      isValid = false;
    }

    if (fromLocation && toLocation && fromLocation === toLocation) {
      newErrors.toLocation = 'Pickup and destination cannot be same';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Validate By Hour form
  const validateByHour = () => {
    let isValid = true;
    const newErrors = { fromLocation: '', toLocation: '', durationHours: '', airportName: '' };

    if (!fromLocation || fromLocation.trim() === '') {
      newErrors.fromLocation = 'Please select pickup location';
      isValid = false;
    }

    if (!durationHours || durationHours.trim() === '') {
      newErrors.durationHours = 'Please enter duration in hours';
      isValid = false;
    } else if (isNaN(Number(durationHours)) || Number(durationHours) <= 0) {
      newErrors.durationHours = 'Please enter a valid number of hours';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Validate By Airport form
  const validateByAirport = () => {
    let isValid = true;
    const newErrors = { fromLocation: '', toLocation: '', durationHours: '', airportName: '' };

    if (airportSubTab === 'FROM_AIRPORT') {
      if (!airportName || airportName.trim() === '') {
        newErrors.airportName = 'Please select an airport';
        isValid = false;
      }
      if (!toLocation || toLocation.trim() === '') {
        newErrors.toLocation = 'Please select destination location';
        isValid = false;
      }
    } else {
      if (!fromLocation || fromLocation.trim() === '') {
        newErrors.fromLocation = 'Please select pickup location';
        isValid = false;
      }
      if (!airportName || airportName.trim() === '') {
        newErrors.airportName = 'Please select an airport';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSearchChauffeur = () => {
    let isValid = false;

    if (activeTab === 'ONE_WAY') {
      isValid = validateOneWay();
    } else if (activeTab === 'BY_HOUR') {
      isValid = validateByHour();
    } else if (activeTab === 'BY_AIRPORT') {
      isValid = validateByAirport();
    }

    if (!isValid) {
      showToast('Please fill all required fields correctly', 'error');
      return;
    }

    setIsSubmitting(true);

    const bookingPayload = {
      bookingType: activeTab,
      date: bookingDate,
      pickupTime: pickupTime,
      selectedDate: selectedDate.toISOString(),
      ...(activeTab === 'ONE_WAY' && {
        from: fromLocation,
        to: toLocation
      }),
      ...(activeTab === 'BY_HOUR' && {
        from: fromLocation,
        duration: durationHours
      }),
      ...(activeTab === 'BY_AIRPORT' && {
        airportDirection: airportSubTab,
        airport: airportName,
        ...(airportSubTab === 'FROM_AIRPORT' ? { destination: toLocation } : { origin: fromLocation }),
      }),
    };

    console.log('--- INITIALIZING CHAUFFEUR SEARCH PARAMETERS ---');
    console.log('Booking Data:', JSON.stringify(bookingPayload, null, 2));
    console.log('Selected Vehicle:', selectedVehicle);
    console.log('------------------------------------------------');

    setTimeout(() => {
      setIsSubmitting(false);
      // Navigate to VehicleList with booking data
      navigation.navigate('VehicleList', {
        bookingData: bookingPayload,
        previousScreen: 'BookingScreen'
      });
    }, 500);
  };

  const handleContinueWithVehicle = () => {
    // This function will be called when continue button is pressed on VehicleList
    // The vehicle data will be passed back to this screen via route params
    if (!selectedVehicle) {
      showToast('Please select a vehicle first', 'error');
      return;
    }

    // Combine booking data with selected vehicle
    const completeBookingData = {
      vehicle: selectedVehicle,
      bookingDetails: {
        bookingType: activeTab,
        date: bookingDate,
        pickupTime: pickupTime,
        selectedDate: selectedDate.toISOString(),
        ...(activeTab === 'ONE_WAY' && {
          from: fromLocation,
          to: toLocation
        }),
        ...(activeTab === 'BY_HOUR' && {
          from: fromLocation,
          duration: durationHours
        }),
        ...(activeTab === 'BY_AIRPORT' && {
          airportDirection: airportSubTab,
          airport: airportName,
          ...(airportSubTab === 'FROM_AIRPORT' ? { destination: toLocation } : { origin: fromLocation }),
        }),
      }
    };

    console.log('--- COMPLETE BOOKING DATA ---');
    console.log(JSON.stringify(completeBookingData, null, 2));
    console.log('----------------------------');

    // Navigate to BookingInfo screen with all data
    navigation.navigate('BookingInfo', {
      bookingData: completeBookingData
    });
  };

  const handleAirportSearch = (text: string) => {
    setAirportName(text);
    clearError('airportName');
    if (text.trim() === '') {
      setFilteredAirports([]);
      setShowAirportDropdown(false);
      return;
    }
    const filtered = airports.filter((airport) =>
      airport.airport_code.toLowerCase().includes(text.toLowerCase()) ||
      airport.name?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredAirports(filtered);
    setShowAirportDropdown(true);
  };

  const handleSelectAirport = (airport: Airport) => {
    setAirportName(`${airport.airport_code}`);
    setShowAirportDropdown(false);
    clearError('airportName');
  };

  const onDateChange = (event: any, selectedDateValue?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDateValue) {
      setSelectedDate(selectedDateValue);
      const formattedDate = selectedDateValue.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      setBookingDate(formattedDate);
    }
  };

  const onTimeChange = (event: any, selectedTimeValue?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTimeValue) {
      const formattedTime = selectedTimeValue.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setPickupTime(formattedTime);
    }
  };

  const googleAutocompleteStyles = {
    container: {
      flex: 1,
      zIndex: 999,
    },
    textInputContainer: {
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      borderBottomWidth: 0,
      paddingHorizontal: 0,
      marginHorizontal: 0,
    },
    textInput: {
      color: '#FFFFFF',
      fontSize: 14,
      height: 35,
      paddingHorizontal: 0,
      margin: 0,
      backgroundColor: 'transparent',
      paddingTop: 0,
      paddingBottom: 0,
    },
    listView: {
      backgroundColor: '#1a1a1a',
      position: 'absolute',
      top: 45,
      left: -46,
      width: width - 72,
      zIndex: 9999,
      borderRadius: 12,
      elevation: 5,
      maxHeight: 200,
      borderWidth: 1,
      borderColor: '#333333',
    },
    row: {
      padding: 12,
      height: 44,
      flexDirection: 'row',
      backgroundColor: '#1a1a1a',
    },
    separator: {
      height: 0.5,
      backgroundColor: '#333333'
    },
    description: {
      color: '#FFFFFF',
      fontSize: 13,
    },
    predefinedPlacesDescription: {
      color: '#FFFFFF',
    },
  };

  // Back Icon Component
  const BackIcon = () => (
    <></>
  );

  return (
    <SafeAreaView style={styles.masterSafeContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Simple Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flexOne}>
        <ScrollView
          contentContainerStyle={styles.scrollGrow}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.screenInnerLayout}>
            <View style={styles.dashboardContentWrapper}>
              {/* Selected Vehicle Info */}
              {selectedVehicle && (
                <View style={styles.selectedVehicleContainer}>
                  <Text style={styles.selectedVehicleTitle}>Selected Vehicle:</Text>
                  <View style={styles.selectedVehicleCard}>
                    <Text style={styles.selectedVehicleName}>{selectedVehicle.name}</Text>
                    <Text style={styles.selectedVehiclePrice}>${selectedVehicle.price}/hour</Text>
                  </View>
                </View>
              )}

              {/* Tabs */}
              <View style={styles.tabSegmentationSegmentRow}>
                <TouchableOpacity style={[styles.tabButtonAnchor, activeTab === 'ONE_WAY' && styles.activeTabButtonBackground]} onPress={() => setActiveTab('ONE_WAY')}>
                  <Text style={[styles.tabButtonText, activeTab === 'ONE_WAY' && styles.activeTabText]}>One way</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.tabButtonAnchor, activeTab === 'BY_HOUR' && styles.activeTabButtonBackground]} onPress={() => setActiveTab('BY_HOUR')}>
                  <Text style={[styles.tabButtonText, activeTab === 'BY_HOUR' && styles.activeTabText]}>By the hour</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.tabButtonAnchor, activeTab === 'BY_AIRPORT' && styles.activeTabButtonBackground]} onPress={() => setActiveTab('BY_AIRPORT')}>
                  <Text style={[styles.tabButtonText, activeTab === 'BY_AIRPORT' && styles.activeTabText]}>By Airport</Text>
                </TouchableOpacity>
              </View>

              {/* Airport Sub-tabs */}
              {activeTab === 'BY_AIRPORT' && (
                <View style={styles.airportSubTabContainer}>
                  <TouchableOpacity style={[styles.airportSubTabItem, airportSubTab === 'FROM_AIRPORT' && styles.airportSubTabActive]} onPress={() => setAirportSubTab('FROM_AIRPORT')}>
                    <Text style={[styles.airportSubTabText, airportSubTab === 'FROM_AIRPORT' && styles.airportSubTextActive]}>From Airport</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.airportSubTabItem, airportSubTab === 'TO_AIRPORT' && styles.airportSubTabActive]} onPress={() => setAirportSubTab('TO_AIRPORT')}>
                    <Text style={[styles.airportSubTabText, airportSubTab === 'TO_AIRPORT' && styles.airportSubTextActive]}>To Airport</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Form Fields */}
              <View style={styles.bookingDynamicFormBlock}>

                {activeTab === 'ONE_WAY' && (
                  <>
                    {/* From Field */}
                    <View style={[styles.dashboardParamInputField, errors.fromLocation && styles.inputError]}>
                      <View style={styles.fieldIconWrapper}>
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                          <Circle cx="12" cy="12" r="10" />
                          <Circle cx="12" cy="12" r="3" fill="#E57C23" />
                        </Svg>
                      </View>
                      <View style={styles.labelValueInlineContainer}>
                        <Text style={styles.fieldHeaderCaptionLabel}>From</Text>
                        <GooglePlacesAutocomplete
                          ref={fromPlacesRef}
                          placeholder="Search address, airport, hotel..."
                          onPress={(data, details = null) => {
                            setFromLocation(data.description);
                            clearError('fromLocation');
                          }}
                          query={{
                            key: GOOGLE_PLACES_API_KEY,
                            language: 'en',
                            types: 'geocode',
                          }}
                          styles={googleAutocompleteStyles}
                          textInputProps={{
                            placeholderTextColor: '#555555',
                            autoCapitalize: 'none',
                            onFocus: () => clearError('fromLocation'),
                          }}
                          enablePoweredByContainer={false}
                          fetchDetails={true}
                          debounce={300}
                          keepResultsOnBlur={false}
                          disableScroll={false}
                          listUnderlayColor="#1a1a1a"
                        />
                      </View>
                    </View>
                    {errors.fromLocation ? <Text style={styles.errorText}>{errors.fromLocation}</Text> : null}

                    {/* To Field */}
                    <View style={[styles.dashboardParamInputField, errors.toLocation && styles.inputError]}>
                      <View style={styles.fieldIconWrapper}>
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                          <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </Svg>
                      </View>
                      <View style={styles.labelValueInlineContainer}>
                        <Text style={styles.fieldHeaderCaptionLabel}>To</Text>
                        <GooglePlacesAutocomplete
                          ref={toPlacesRef}
                          placeholder="Search address, airport, hotel..."
                          onPress={(data, details = null) => {
                            setToLocation(data.description);
                            clearError('toLocation');
                          }}
                          query={{
                            key: GOOGLE_PLACES_API_KEY,
                            language: 'en',
                            types: 'geocode',
                          }}
                          styles={googleAutocompleteStyles}
                          textInputProps={{
                            placeholderTextColor: '#555555',
                            autoCapitalize: 'none',
                            onFocus: () => clearError('toLocation'),
                          }}
                          enablePoweredByContainer={false}
                          fetchDetails={true}
                          debounce={300}
                          keepResultsOnBlur={false}
                          disableScroll={false}
                          listUnderlayColor="#1a1a1a"
                        />
                      </View>
                    </View>
                    {errors.toLocation ? <Text style={styles.errorText}>{errors.toLocation}</Text> : null}
                  </>
                )}

                {activeTab === 'BY_HOUR' && (
                  <>
                    {/* From Field */}
                    <View style={[styles.dashboardParamInputField, errors.fromLocation && styles.inputError]}>
                      <View style={styles.fieldIconWrapper}>
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                          <Circle cx="12" cy="12" r="10" />
                          <Circle cx="12" cy="12" r="3" fill="#E57C23" />
                        </Svg>
                      </View>
                      <View style={styles.labelValueInlineContainer}>
                        <Text style={styles.fieldHeaderCaptionLabel}>From</Text>
                        <GooglePlacesAutocomplete
                          placeholder="Search address, airport, hotel..."
                          onPress={(data, details = null) => {
                            setFromLocation(data.description);
                            clearError('fromLocation');
                          }}
                          query={{
                            key: GOOGLE_PLACES_API_KEY,
                            language: 'en',
                            types: 'geocode',
                          }}
                          styles={googleAutocompleteStyles}
                          textInputProps={{
                            placeholderTextColor: '#555555',
                            onFocus: () => clearError('fromLocation'),
                          }}
                          enablePoweredByContainer={false}
                          fetchDetails={true}
                          debounce={300}
                          keepResultsOnBlur={false}
                        />
                      </View>
                    </View>
                    {errors.fromLocation ? <Text style={styles.errorText}>{errors.fromLocation}</Text> : null}

                    {/* Duration Field */}
                    <View style={[styles.dashboardParamInputField, errors.durationHours && styles.inputError]}>
                      <View style={styles.fieldIconWrapper}>
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                          <Circle cx="12" cy="12" r="10" />
                          <Path d="M12 6v6l4 2" />
                        </Svg>
                      </View>
                      <View style={styles.labelValueInlineContainer}>
                        <Text style={styles.fieldHeaderCaptionLabel}>Duration (Hours)</Text>
                        <TextInput
                          style={styles.fieldValueEditableInput}
                          placeholder="Enter duration in hours"
                          placeholderTextColor="#555555"
                          value={durationHours}
                          onChangeText={(text) => {
                            setDurationHours(text);
                            clearError('durationHours');
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    {errors.durationHours ? <Text style={styles.errorText}>{errors.durationHours}</Text> : null}
                  </>
                )}

                {activeTab === 'BY_AIRPORT' && (
                  <>
                    {airportSubTab === 'FROM_AIRPORT' ? (
                      <>
                        {/* From Airport Field */}
                        <View style={[styles.dashboardParamInputField, errors.airportName && styles.inputError]}>
                          <View style={styles.fieldIconWrapper}>
                            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                              <Path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
                            </Svg>
                          </View>
                          <View style={styles.labelValueInlineContainer}>
                            <Text style={styles.fieldHeaderCaptionLabel}>From Airport</Text>
                            {isLoadingAirports ? (
                              <ActivityIndicator size="small" color="#E57C23" />
                            ) : (
                              <>
                                <TextInput
                                  style={styles.fieldValueEditableInput}
                                  placeholder="Search airport code (e.g., JFK, LGA)..."
                                  placeholderTextColor="#555555"
                                  value={airportName}
                                  onChangeText={handleAirportSearch}
                                  onFocus={() => {
                                    setShowAirportDropdown(true);
                                    clearError('airportName');
                                  }}
                                />
                                {showAirportDropdown && filteredAirports.length > 0 && !isLoadingAirports && (
                                  <View style={styles.airportDropdown}>
                                    <ScrollView style={{ maxHeight: 200 }}>
                                      {filteredAirports.map((item) => (
                                        <TouchableOpacity key={item.id} style={styles.dropdownItem} onPress={() => handleSelectAirport(item)}>
                                          <Text style={styles.dropdownTextMain}>{item.airport_code}</Text>
                                          <Text style={styles.dropdownTextSub}>{item.name}</Text>
                                        </TouchableOpacity>
                                      ))}
                                    </ScrollView>
                                  </View>
                                )}
                              </>
                            )}
                          </View>
                        </View>
                        {errors.airportName ? <Text style={styles.errorText}>{errors.airportName}</Text> : null}

                        {/* Destination To Field */}
                        <View style={[styles.dashboardParamInputField, errors.toLocation && styles.inputError]}>
                          <View style={styles.fieldIconWrapper}>
                            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </Svg>
                          </View>
                          <View style={styles.labelValueInlineContainer}>
                            <Text style={styles.fieldHeaderCaptionLabel}>To Location</Text>
                            <GooglePlacesAutocomplete
                              placeholder="Drop-off address, hotel..."
                              onPress={(data, details = null) => {
                                setToLocation(data.description);
                                clearError('toLocation');
                              }}
                              query={{
                                key: GOOGLE_PLACES_API_KEY,
                                language: 'en',
                                types: 'geocode',
                              }}
                              styles={googleAutocompleteStyles}
                              textInputProps={{
                                placeholderTextColor: '#555555',
                                onFocus: () => clearError('toLocation'),
                              }}
                              enablePoweredByContainer={false}
                              fetchDetails={true}
                              debounce={300}
                              keepResultsOnBlur={false}
                            />
                          </View>
                        </View>
                        {errors.toLocation ? <Text style={styles.errorText}>{errors.toLocation}</Text> : null}
                      </>
                    ) : (
                      <>
                        {/* Origin Field */}
                        <View style={[styles.dashboardParamInputField, errors.fromLocation && styles.inputError]}>
                          <View style={styles.fieldIconWrapper}>
                            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                              <Circle cx="12" cy="12" r="10" />
                              <Circle cx="12" cy="12" r="3" fill="#E57C23" />
                            </Svg>
                          </View>
                          <View style={styles.labelValueInlineContainer}>
                            <Text style={styles.fieldHeaderCaptionLabel}>From Location</Text>
                            <GooglePlacesAutocomplete
                              placeholder="Pickup address, hotel..."
                              onPress={(data, details = null) => {
                                setFromLocation(data.description);
                                clearError('fromLocation');
                              }}
                              query={{
                                key: GOOGLE_PLACES_API_KEY,
                                language: 'en',
                                types: 'geocode',
                              }}
                              styles={googleAutocompleteStyles}
                              textInputProps={{
                                placeholderTextColor: '#555555',
                                onFocus: () => clearError('fromLocation'),
                              }}
                              enablePoweredByContainer={false}
                              fetchDetails={true}
                              debounce={300}
                              keepResultsOnBlur={false}
                            />
                          </View>
                        </View>
                        {errors.fromLocation ? <Text style={styles.errorText}>{errors.fromLocation}</Text> : null}

                        {/* To Airport Field */}
                        <View style={[styles.dashboardParamInputField, errors.airportName && styles.inputError]}>
                          <View style={styles.fieldIconWrapper}>
                            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                              <Path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" transform="rotate(180 12 12)" />
                            </Svg>
                          </View>
                          <View style={styles.labelValueInlineContainer}>
                            <Text style={styles.fieldHeaderCaptionLabel}>To Airport</Text>
                            {isLoadingAirports ? (
                              <ActivityIndicator size="small" color="#E57C23" />
                            ) : (
                              <>
                                <TextInput
                                  style={styles.fieldValueEditableInput}
                                  placeholder="Search airport code (e.g., JFK, LGA)..."
                                  placeholderTextColor="#555555"
                                  value={airportName}
                                  onChangeText={handleAirportSearch}
                                  onFocus={() => {
                                    setShowAirportDropdown(true);
                                    clearError('airportName');
                                  }}
                                />
                                {showAirportDropdown && filteredAirports.length > 0 && !isLoadingAirports && (
                                  <View style={styles.airportDropdown}>
                                    <ScrollView style={{ maxHeight: 200 }}>
                                      {filteredAirports.map((item) => (
                                        <TouchableOpacity key={item.id} style={styles.dropdownItem} onPress={() => handleSelectAirport(item)}>
                                          <Text style={styles.dropdownTextMain}>{item.airport_code}</Text>
                                          <Text style={styles.dropdownTextSub}>{item.name}</Text>
                                        </TouchableOpacity>
                                      ))}
                                    </ScrollView>
                                  </View>
                                )}
                              </>
                            )}
                          </View>
                        </View>
                        {errors.airportName ? <Text style={styles.errorText}>{errors.airportName}</Text> : null}
                      </>
                    )}
                  </>
                )}

                {/* Date Picker Field */}
                <TouchableOpacity activeOpacity={0.7} style={styles.dashboardParamInputField} onPress={() => setShowDatePicker(true)}>
                  <View style={styles.fieldIconWrapper}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <Path d="M16 2v4M8 2v4M3 10h18" />
                    </Svg>
                  </View>
                  <View style={styles.labelValueInlineContainer}>
                    <Text style={styles.fieldHeaderCaptionLabel}>Date</Text>
                    <Text style={styles.fieldValuePickerText}>{bookingDate}</Text>
                  </View>
                </TouchableOpacity>

                {/* Time Picker Field */}
                <TouchableOpacity activeOpacity={0.7} style={styles.dashboardParamInputField} onPress={() => setShowTimePicker(true)}>
                  <View style={styles.fieldIconWrapper}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E57C23" strokeWidth="2">
                      <Circle cx="12" cy="12" r="10" />
                      <Path d="M12 6v6l4 2" />
                    </Svg>
                  </View>
                  <View style={styles.labelValueInlineContainer}>
                    <Text style={styles.fieldHeaderCaptionLabel}>Pickup time</Text>
                    <Text style={styles.fieldValuePickerText}>{pickupTime}</Text>
                  </View>
                </TouchableOpacity>

                <Text style={styles.complementaryGracePeriodNoticeText}>Chauffeur will wait 15 minutes free of charge.</Text>

                {/* Search Button */}
                <TouchableOpacity style={styles.actionGradientButtonBorder} onPress={handleSearchChauffeur} disabled={isSubmitting}>
                  <View style={styles.actionInnerBlackFill}>
                    {isSubmitting ? (
                      <ActivityIndicator color="#E57C23" size="small" />
                    ) : (
                      <View style={styles.searchButtonContentRow}>
                        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" style={styles.searchIconSpace}>
                          <Circle cx="11" cy="11" r="8" />
                          <Path d="M21 21l-4.35-4.35" />
                        </Svg>
                        <Text style={styles.actionButtonLabel}>Search Chauffeur</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Continue Button - Only show when vehicle is selected */}
                {selectedVehicle && (
                  <TouchableOpacity style={styles.continueButtonBorder} onPress={handleContinueWithVehicle}>
                    <View style={styles.continueInnerFill}>
                      <Text style={styles.continueButtonLabel}>Continue to Booking</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          style={Platform.OS === 'ios' ? styles.datePickerIOS : undefined}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          style={Platform.OS === 'ios' ? styles.datePickerIOS : undefined}
        />
      )}

      {/* Toast */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, backgroundColor: toastType === 'success' ? '#2E7D32' : '#C62828' }]}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  masterSafeContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flexOne: {
    flex: 1,
  },
  scrollGrow: {
    flexGrow: 1,
  },
  screenInnerLayout: {
    flex: 1,
    backgroundColor: '#000000',
   
  },
  selectedVehicleContainer: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E57C23',
  },
  selectedVehicleTitle: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedVehicleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedVehicleName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  selectedVehiclePrice: {
    color: '#E57C23',
    fontSize: 16,
    fontWeight: '700',
  },
  actionGradientButtonBorder: {
    height: 54,
    borderRadius: 27,
    padding: 1.5,
    backgroundColor: '#E57C23',
    marginTop: 25,
    overflow: 'hidden',
    zIndex: 1,
  },
  continueButtonBorder: {
    height: 54,
    borderRadius: 27,
    padding: 1.5,
    backgroundColor: '#2E7D32',
    marginTop: 15,
    overflow: 'hidden',
    zIndex: 1,
  },
  continueInnerFill: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionInnerBlackFill: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconSpace: {
    marginRight: 8,
  },
  actionButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dashboardContentWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  tabSegmentationSegmentRow: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 30,
    height: 48,
    padding: 3,
    width: '100%',
    marginBottom: 20,
  },
  tabButtonAnchor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  activeTabButtonBackground: {
    backgroundColor: '#E57C23',
  },
  tabButtonText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  airportSubTabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  airportSubTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#121212',
  },
  airportSubTabActive: {
    borderBottomColor: '#E57C23',
  },
  airportSubTabText: {
    color: '#444444',
    fontSize: 13,
    fontWeight: '600',
  },
  airportSubTextActive: {
    color: '#E57C23',
  },
  bookingDynamicFormBlock: {
    width: '100%',
  },
  dashboardParamInputField: {
    backgroundColor: '#121212',
    borderRadius: 16,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  inputError: {
    borderColor: '#C62828',
    borderWidth: 1,
  },
  errorText: {
    color: '#C62828',
    fontSize: 11,
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 12,
  },
  fieldIconWrapper: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 10,
  },
  labelValueInlineContainer: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  fieldHeaderCaptionLabel: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValueEditableInput: {
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
    margin: 0,
    height: 35,
  },
  fieldValuePickerText: {
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 4,
  },
  airportDropdown: {
    position: 'absolute',
    top: 55,
    left: -46,
    width: width - 72,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: '#333333',
    elevation: 5,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  dropdownTextMain: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownTextSub: {
    color: '#999999',
    fontSize: 11,
    marginTop: 3,
  },
  complementaryGracePeriodNoticeText: {
    color: '#444444',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 5,
  },
  toastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 45 : 30,
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
  headerContainer: {
    top: 0,
    left: 0,
    right: 0,
  },
  logo: {
    width: '100%',
    height: height * 0.2,
  },
  datePickerIOS: {
    height: 200,
  },
  // Simple Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
    paddingBottom: 15,
    backgroundColor: '#000000',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 34,
  },
});