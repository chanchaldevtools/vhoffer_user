import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Polyline as SvgPolyline } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiClient from '../services/apiConfig';

const { width } = Dimensions.get('window');

// Precise SVG Icons Match
const SVGIcons = {
  CarHeader: () => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="2">
      <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <Circle cx="7" cy="17" r="2" />
      <Circle cx="17" cy="17" r="2" />
    </Svg>
  ),
  CarOutlineWhite: () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
      <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <Circle cx="7" cy="17" r="2" />
      <Circle cx="17" cy="17" r="2" />
    </Svg>
  ),
  ArrowForward: () => (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="2.5">
      <Path d="M5 12h14M12 5l7 7-7 7" />
    </Svg>
  ),
  Person: ({ color = "#FFF" }) => (
    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  ),
  Briefcase: ({ color = "#FFF" }) => (
    <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M20 7h-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5z" />
    </Svg>
  ),
};

interface VehicleData {
  vehicle_id: number;
  vehicle_class: string;
  vehicle_photo: string;
  allowed_passengers?: number;
  distance_miles?: number;
  distance_km?: number;
  duration?: number;
  ratePerMile?: number;
  base_fee?: number;
  subTotal?: number;
  fuleSurcharge?: number;
  gratuity?: number;
  duration_hours?: number;
  base_hourly_rate?: number;
  adjusted_hourly_rate?: number;
  price?: string;
}

export default function VehicleSelectionScreen() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const params = route.params as any;
    
    if (params && params.bookingData) {
      setBookingData(params.bookingData);
      fetchVehicles(params.bookingData);
    } else if (params) {
      setBookingData(params);
      fetchVehicles(params);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchVehicles = async (data: any) => {
    try {
      setLoading(true);
      let response;

      if (data.bookingType === 'ONE_WAY') {
        response = await apiClient.post('/pricing/point-to-point', {
          from: data.from,
          to: data.to
        });
      } else if (data.bookingType === 'BY_HOUR') {
        let formattedDate = data.date;
        if (data.selectedDate) {
          const dateObj = new Date(data.selectedDate);
          formattedDate = dateObj.toLocaleDateString('en-GB');
        }
        
        response = await apiClient.post('/pricing/hourly', {
          from: data.from,
          duration: parseInt(data.duration) || 0,
          travel_date: formattedDate || data.date,
          pickup_time: data.pickupTime
        });
      } else if (data.bookingType === 'BY_AIRPORT') {
        let formattedDate = data.date;
        if (data.selectedDate) {
          const dateObj = new Date(data.selectedDate);
          formattedDate = dateObj.toLocaleDateString('en-GB');
        }
        
        if (data.airportDirection === 'FROM_AIRPORT') {
          response = await apiClient.post('/pricing/airport', {
            airport: data.airport,
            origin: data.destination,
            travel_date: formattedDate || data.date,
            pickup_time: data.pickupTime
          });
        } else {
          response = await apiClient.post('/pricing/airport', {
            origin: data.origin,
            airport: data.airport,
            travel_date: formattedDate || data.date,
            pickup_time: data.pickupTime
          });
        }
      }

      //console.log('API Response:', response?.data);

      if (response?.data && response.data.status) {
        setVehicles(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedId(response.data.data[0].vehicle_id);
        }
      } else {
        console.error('No data received from API or API returned error:', response?.data);
        if (response?.data?.errors) {
          const errorMessages = Object.values(response.data.errors).flat();
          alert(errorMessages.join('\n'));
        }
      }
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        alert(errorMessages.join('\n'));
      } else {
        alert('Failed to fetch vehicles. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTotalPrice = useCallback((vehicle: VehicleData) => {
    if (bookingData?.bookingType === 'ONE_WAY') {
      return (vehicle.subTotal || 0) + (vehicle.fuleSurcharge || 0) + (vehicle.gratuity || 0);
    } else if (bookingData?.bookingType === 'BY_HOUR') {
      return (vehicle.subTotal || 0) + (vehicle.fuleSurcharge || 0) + (vehicle.gratuity || 0);
    } else if (bookingData?.bookingType === 'BY_AIRPORT') {
      return parseFloat(vehicle.price || '0');
    }
    return 0;
  }, [bookingData?.bookingType]);

  const getBaseFee = useCallback((vehicle: VehicleData) => {
    if (bookingData?.bookingType === 'ONE_WAY') {
      return vehicle.base_fee || 0;
    } else if (bookingData?.bookingType === 'BY_HOUR') {
      return vehicle.adjusted_hourly_rate || vehicle.base_hourly_rate || 0;
    } else if (bookingData?.bookingType === 'BY_AIRPORT') {
      return parseFloat(vehicle.price || '0');
    }
    return 0;
  }, [bookingData?.bookingType]);

  const getTax = useCallback((vehicle: VehicleData) => {
    if (bookingData?.bookingType === 'ONE_WAY') {
      return vehicle.fuleSurcharge || 0;
    } else if (bookingData?.bookingType === 'BY_HOUR') {
      return vehicle.fuleSurcharge || 0;
    }
    return 0;
  }, [bookingData?.bookingType]);

  const getGratuity = useCallback((vehicle: VehicleData) => {
    if (bookingData?.bookingType === 'ONE_WAY') {
      return vehicle.gratuity || 0;
    } else if (bookingData?.bookingType === 'BY_HOUR') {
      return vehicle.gratuity || 0;
    }
    return 0;
  }, [bookingData?.bookingType]);

  const getImageUrl = useCallback((photoPath: string) => {
    const baseUrl = 'https://cdp.xka.mybluehost.me/cabbooking-backend/storage/app/public/';
    return `${baseUrl}${photoPath}`;
  }, []);

  const handleVehicleSelect = useCallback((vehicle: VehicleData) => {
    setSelectedId(vehicle.vehicle_id);
  }, []);

  const handleContinue = useCallback(() => {
    // Prevent multiple taps
    if (isNavigating) return;
    
    const selectedVehicle = vehicles.find(v => v.vehicle_id === selectedId);
    
    if (!selectedVehicle) {
      alert('Please select a vehicle');
      return;
    }

    // Set loading state immediately
    setIsNavigating(true);

    const totalPrice = getTotalPrice(selectedVehicle);
    
    // Prepare complete data to send
    const completeData = {
      selectedVehicle: {
        id: selectedVehicle.vehicle_id,
        name: selectedVehicle.vehicle_class,
        class: selectedVehicle.vehicle_class,
        photo: selectedVehicle.vehicle_photo,
        imageUrl: getImageUrl(selectedVehicle.vehicle_photo),
        capacity: selectedVehicle.allowed_passengers,
        distanceKm: selectedVehicle.distance_km,
        durationMinutes: selectedVehicle.duration,
        baseFee: getBaseFee(selectedVehicle),
        subTotal: selectedVehicle.subTotal,
        fuelSurcharge: selectedVehicle.fuleSurcharge,
        gratuity: selectedVehicle.gratuity,
        totalPrice: totalPrice,
        durationHours: selectedVehicle.duration_hours,
        baseHourlyRate: selectedVehicle.base_hourly_rate,
        adjustedHourlyRate: selectedVehicle.adjusted_hourly_rate,
        price: selectedVehicle.price,
      },
      bookingData: bookingData,
      totalPrice: totalPrice,
    };

    // Use setTimeout to ensure loading state is shown
    setTimeout(() => {
      navigation.navigate('BookingInfo', { 
        selectedVehicle: completeData.selectedVehicle,
        bookingData: bookingData,
        totalPrice: totalPrice,
        fromScreen: 'VehicleSelection'
      });
      
      // Reset navigation flag after navigation
      setTimeout(() => setIsNavigating(false), 500);
    }, 50);
  }, [selectedId, vehicles, bookingData, getTotalPrice, getBaseFee, getTax, getGratuity, getImageUrl, isNavigating]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E67E22" />
          <Text style={styles.loadingText}>Loading available vehicles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SVGIcons.CarHeader />
          <Text style={styles.headerTitle}>Service class</Text>
        </View>
        <Text style={styles.headerStep}>Step 1 of 5</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressLine} />
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={[styles.progressDot, styles.inactiveDot]} />
        <View style={[styles.progressDot, styles.inactiveDot]} />
        <View style={[styles.progressDot, styles.inactiveDot]} />
        <View style={[styles.progressDot, styles.inactiveDot]} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
      >
        <View style={styles.routeCard}>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>
              {bookingData?.date} at {bookingData?.pickupTime}
            </Text>
          </View>
          <View style={styles.locationContainer}>
            <SVGIcons.CarOutlineWhite />
            <Text style={styles.locationText} numberOfLines={1}>
              {bookingData?.bookingType === 'ONE_WAY' && `${bookingData?.from} ➔ ${bookingData?.to}`}
              {bookingData?.bookingType === 'BY_HOUR' && `${bookingData?.from} (${bookingData?.duration} hours)`}
              {bookingData?.bookingType === 'BY_AIRPORT' && (
                bookingData?.airportDirection === 'FROM_AIRPORT' 
                  ? `${bookingData?.airport} ➔ ${bookingData?.destination}`
                  : `${bookingData?.origin} ➔ ${bookingData?.airport}`
              )}
            </Text>
          </View>
          {vehicles.length > 0 && vehicles[0].distance_km && (
            <Text style={styles.metaText}>Distance: {vehicles[0].distance_km.toFixed(2)} km | Est. duration: {vehicles[0].duration} mins</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Select a vehicle class</Text>
        <Text style={styles.sectionSubtitle}>All prices include estimated VAT, fees, and tolls.</Text>

        <View style={styles.listContainer}>
          {vehicles.map((item) => {
            const isSelected = item.vehicle_id === selectedId;
            const totalPrice = getTotalPrice(item);
            const baseFee = getBaseFee(item);
            const tax = getTax(item);
            const gratuity = getGratuity(item);
            
            return (
              <TouchableOpacity
                key={item.vehicle_id}
                activeOpacity={0.9}
                onPress={() => handleVehicleSelect(item)}
                style={[styles.cardWrapper, !isSelected && styles.cardInactiveBg]}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={['#E07726', '#EA3B1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mainCardContent}
                  >
                    <VehicleCardInner 
                      item={item} 
                      isSelected={true} 
                      bookingType={bookingData?.bookingType}
                      totalPrice={totalPrice}
                      getImageUrl={getImageUrl}
                    />
                  </LinearGradient>
                ) : (
                  <View style={styles.mainCardContent}>
                    <VehicleCardInner 
                      item={item} 
                      isSelected={false} 
                      bookingType={bookingData?.bookingType}
                      totalPrice={totalPrice}
                      getImageUrl={getImageUrl}
                    />
                  </View>
                )}

                {isSelected && (
                  <LinearGradient
                    colors={['#E07726', '#EA3B1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.breakdownContainer}
                  >
                    <View style={styles.breakdownHeaderRow}>
                      <Text style={styles.breakdownTitle}>Price Break Down</Text>
                      <Text style={styles.breakdownRateHeader}>Rate</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Base Fare :</Text>
                      <Text style={styles.breakdownValue}>USD : ${baseFee.toFixed(2)}</Text>
                    </View>
                    {tax > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Fuel Surcharge :</Text>
                        <Text style={styles.breakdownValue}>USD : ${tax.toFixed(2)}</Text>
                      </View>
                    )}
                    {gratuity > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Gratuity :</Text>
                        <Text style={styles.breakdownValue}>USD : ${gratuity.toFixed(2)}</Text>
                      </View>
                    )}
                    <View style={[styles.breakdownRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total :</Text>
                      <Text style={styles.totalValue}>USD : ${totalPrice.toFixed(2)}</Text>
                    </View>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.promoSection}>
          <Text style={styles.promoHeadline}>Eligible promotion auto-applied.</Text>
          <Text style={styles.promoSubtitle}>All classes include :</Text>
          
          <View style={styles.bulletRow}>
            <SVGIcons.ArrowForward />
            <Text style={styles.bulletText}>Free cancellation up until 1 hour before pickup</Text>
          </View>
          <View style={styles.bulletRow}>
            <SVGIcons.ArrowForward />
            <Text style={styles.bulletText}>Free 15 minutes of wait time</Text>
          </View>
          <View style={styles.bulletRow}>
            <SVGIcons.ArrowForward />
            <Text style={styles.bulletText}>Meet & Greet</Text>
          </View>
          <View style={styles.bulletRow}>
            <SVGIcons.ArrowForward />
            <Text style={styles.bulletText}>Complimentary bottle of water</Text>
          </View>

          <Text style={styles.pleaseNoteHeader}>Please note:</Text>
          <View style={styles.bulletRow}>
            <SVGIcons.ArrowForward />
            <Text style={styles.bulletText}>
              Guest/luggage capacities must be adhered to for safety reasons. If you are unsure, select a larger class as chauffeurs may turn down service when they are exceeded.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <SVGIcons.ArrowForward />
            <Text style={styles.bulletText}>
              The vehicle images above are exemplars. You may get a different vehicle of similar quality.
            </Text>
          </View>
        </View>

        {/* Action Bottom Submit Button with Loader */}
        <TouchableOpacity 
          onPress={handleContinue} 
          activeOpacity={0.8} 
          style={styles.buttonWrapper}
          disabled={isNavigating}
        >
          <LinearGradient
            colors={['#E07726', '#EA3B1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButtonBorder}
          >
            <View style={styles.innerButtonContainer}>
              {isNavigating ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.buttonText}>Please wait...</Text>
                </>
              ) : (
                <>
                  <SVGIcons.CarOutlineWhite />
                  <Text style={styles.buttonText}>Continue</Text>
                </>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Memoized Inner Content Component
const VehicleCardInner = React.memo(({ item, isSelected, bookingType, totalPrice, getImageUrl }: any) => {
  return (
    <View style={styles.rowAlign}>
      <Image 
        source={{ uri: getImageUrl(item.vehicle_photo) }} 
        style={styles.vehicleImage} 
        resizeMode="contain" 
        defaultSource={require('../screens/assets/placeholder.png')}
      />
      <View style={styles.detailsBlock}>
        <Text style={[styles.vehicleName, isSelected && styles.vehicleNameSelected]}>
          {item.vehicle_class}
        </Text>
        {item.allowed_passengers !== undefined && (
          <View style={styles.specsRow}>
            <View style={styles.specBadge}>
              <SVGIcons.Person color="#FFF" />
              <Text style={styles.specText}>{item.allowed_passengers}</Text>
            </View>
          </View>
        )}
        {bookingType === 'BY_HOUR' && item.duration_hours && (
          <Text style={styles.specText}>Duration: {item.duration_hours} hours</Text>
        )}
        <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
          USD : ${totalPrice.toFixed(2)}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFFFFF', marginTop: 10 },
  
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '500' },
  headerStep: { color: '#8E8E93', fontSize: 13 },
  
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 20, position: 'relative' },
  progressLine: { position: 'absolute', left: 20, right: 20, height: 2, backgroundColor: '#D35400', zIndex: 1 },
  progressDot: { width: 8, height: 8, borderRadius: 4, zIndex: 2 },
  activeDot: { backgroundColor: '#FF3B30' },
  inactiveDot: { backgroundColor: '#D35400' },
  
  scrollContent: { paddingHorizontal: 16, paddingBottom: 30 },
  
  routeCard: { backgroundColor: '#111112', borderRadius: 24, padding: 16, marginBottom: 20 },
  timeRow: { borderBottomWidth: 1, borderBottomColor: '#222224', paddingBottom: 10, marginBottom: 12 },
  timeText: { color: '#34A853', fontWeight: '500', fontSize: 14 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222225', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 20, gap: 12 },
  locationText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500', flex: 1 },
  metaText: { color: '#77777A', fontSize: 11, marginTop: 10, marginLeft: 4 },
  
  sectionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  sectionSubtitle: { color: '#77777A', fontSize: 12, marginTop: 4, marginBottom: 15 },
  
  listContainer: { gap: 12 },
  cardWrapper: { borderRadius: 24, overflow: 'hidden' },
  cardInactiveBg: { backgroundColor: '#2C2C2E' },
  mainCardContent: { padding: 16 },
  rowAlign: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  
  vehicleImage: { width: 100, height: 100, resizeMode: 'contain', borderRadius: 12 },
  
  detailsBlock: { flex: 1 },
  vehicleName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  vehicleNameSelected: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  specsRow: { flexDirection: 'row', gap: 12, marginTop: 6, marginBottom: 8 },
  specBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specText: { color: '#FFFFFF', fontSize: 13 },
  priceText: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
  priceTextSelected: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  
  breakdownContainer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  breakdownHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.8, borderColor: 'rgba(255,255,255,0.3)', paddingTop: 12, marginBottom: 10, marginTop: 4 },
  breakdownTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  breakdownRateHeader: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  breakdownLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  breakdownValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.3)' },
  totalLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  totalValue: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  
  promoSection: { marginTop: 25 },
  promoHeadline: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  promoSubtitle: { color: '#A8A8AD', fontSize: 13, marginTop: 4, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 5, gap: 10 },
  bulletText: { color: '#A8A8AD', fontSize: 13, flex: 1, lineHeight: 18 },
  pleaseNoteHeader: { color: '#A8A8AD', fontSize: 14, fontWeight: '600', marginTop: 15, marginBottom: 6 },
  
  buttonWrapper: { marginTop: 30, marginBottom: 20 },
  gradientButtonBorder: { padding: 2, borderRadius: 30 },
  innerButtonContainer: { backgroundColor: '#000000', borderRadius: 28, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});