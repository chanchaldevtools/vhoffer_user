import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, get } from 'firebase/database';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Linking,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';
import apiClient from '../services/apiConfig';

const { width, height } = Dimensions.get('window');

// ==================== SVG ICONS ====================
const BackChevronIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const MovingCarIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 11.5V19c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-7.5l-2.08-5.49zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.27-3.82c.07-.21.27-.36.49-.36h10.48c.22 0 .42.15.49.36L19 10H5z" fill="#F5A623" />
  </Svg>
);

const ChatBubbleIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" fill="#F5A623"/>
  </Svg>
);

const PhoneCallIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M6.62 10.79a15.149 15.149 0 0 0 6.59 6.59l2.2-2.2c.28-.28.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#131313"/>
  </Svg>
);

const DriverPlaceholderAvatar = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="#8E8E93"/>
  </Svg>
);

const RefreshIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="#F5A623"/>
  </Svg>
);

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1EBYCLxKYmEU4aKgjiP_CGRqwFl4i33g",
  authDomain: "driverapp-21839.firebaseapp.com",
  projectId: "driverapp-21839",
  databaseURL: "https://driverapp-21839-default-rtdb.firebaseio.com/",
  storageBucket: "driverapp-21839.firebasestorage.app",
  messagingSenderId: "412454711745",
  appId: "1:412454711745:web:4378996f5dc2d14b0d3f40"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDZMPwuTtTXazrUOsqV2Q3W-zs8Ed2SUM8';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

interface BookingData {
  id: string;
  from_location: string;
  to_location: string;
  status: string;
  total_fee: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
  vehicle?: {
    vehicle_number: string;
  };
  vehicle_class?: {
    vehicle_class: string;
    allowed_passengers: number;
  };
}

type RideStage = 'driver_to_pickup' | 'pickup_to_drop' | 'completed';

const TrackRideScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const bookingId = route.params?.bookingId || route.params?.id || '5';
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [pickupCoord, setPickupCoord] = useState<Coordinate | null>(null);
  const [dropCoord, setDropCoord] = useState<Coordinate | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [driverCoord, setDriverCoord] = useState<Coordinate | null>(null);
  const [driverBearing, setDriverBearing] = useState(0);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(0);
  const [etaToPickup, setEtaToPickup] = useState<number | null>(null);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [etaToDrop, setEtaToDrop] = useState<number | null>(null);
  const [distanceToDrop, setDistanceToDrop] = useState<number | null>(null);
  const [isListeningToDriver, setIsListeningToDriver] = useState(false);
  const [isManuallyInteracting, setIsManuallyInteracting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [rideStage, setRideStage] = useState<RideStage>('driver_to_pickup');
  const [hasDriverArrived, setHasDriverArrived] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const mapRef = useRef<MapView>(null);
  const driverLocationListenerRef = useRef<any>(null);
  const animationFrameRef = useRef<any>(null);
  const lastDriverLocationRef = useRef<DriverLocation | null>(null);
  let manualInteractionTimeout: NodeJS.Timeout;

  // Fetch booking details
  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  // Geocode addresses when booking loads
  useEffect(() => {
    if (booking) {
      geocodeAddresses();
    }
  }, [booking]);

  // Check ride stage based on booking status
  useEffect(() => {
    if (booking?.status?.toLowerCase() === 'arrived' || 
        booking?.status?.toLowerCase() === 'ongoing') {
      setRideStage('pickup_to_drop');
      setHasDriverArrived(true);
    } else if (booking?.status?.toLowerCase() === 'completed') {
      setRideStage('completed');
    } else {
      setRideStage('driver_to_pickup');
    }
  }, [booking?.status]);

  // Auto-zoom to driver when location is first received
  useEffect(() => {
    if (driverCoord && isMapReady && !isManuallyInteracting) {
      centerMapOnDriver();
    }
  }, [driverCoord, isMapReady]);

  // Start listening to driver location when ready
  useEffect(() => {
    if (pickupCoord && !isCancelled && booking?.driver?.id) {
      startListeningToDriverLocation();
      printAllActiveDrivers();
    }
    
    return () => {
      stopListeningToDriverLocation();
    };
  }, [pickupCoord, booking?.driver?.id, isCancelled]);

  // Calculate distances based on current stage
  useEffect(() => {
    if (rideStage === 'driver_to_pickup' && driverCoord && pickupCoord) {
      calculateDistanceAndETAForPickup();
      updateRouteForStage('driver_to_pickup');
    } else if (rideStage === 'pickup_to_drop' && driverCoord && dropCoord) {
      calculateDistanceAndETAForDrop();
      updateRouteForStage('pickup_to_drop');
    }
  }, [driverCoord, rideStage]);

  // Check if driver has arrived at pickup
  useEffect(() => {
    if (rideStage === 'driver_to_pickup' && distanceToPickup !== null && distanceToPickup < 0.1 && !hasDriverArrived) {
      console.log('🎯 Driver has arrived at pickup location!');
      setHasDriverArrived(true);
      setRideStage('pickup_to_drop');
    }
  }, [distanceToPickup, rideStage]);

  // ==================== ROUTE MANAGEMENT ====================
  
  const updateRouteForStage = async (stage: RideStage) => {
    if (stage === 'driver_to_pickup' && driverCoord && pickupCoord) {
      const routePoints = await getRoute(driverCoord, pickupCoord);
      setRouteCoords(routePoints);
    } else if (stage === 'pickup_to_drop' && pickupCoord && dropCoord) {
      const routePoints = await getRoute(pickupCoord, dropCoord);
      setRouteCoords(routePoints);
      
      const directionsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${pickupCoord.latitude},${pickupCoord.longitude}&destination=${dropCoord.latitude},${dropCoord.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await directionsResponse.json();
      if (data.status === 'OK' && data.routes[0]?.legs[0]) {
        const leg = data.routes[0].legs[0];
        setRouteDistance(leg.distance.value / 1000);
        setRouteDuration(Math.ceil(leg.duration.value / 60));
      }
    }
  };

  const getRoute = async (origin: Coordinate, destination: Coordinate): Promise<Coordinate[]> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        return decodePolyline(data.routes[0].overview_polyline.points);
      }
      return [];
    } catch (error) {
      console.error('Directions API error:', error);
      return [];
    }
  };

  const decodePolyline = (encoded: string): Coordinate[] => {
    const points: Coordinate[] = [];
    let index = 0, lat = 0, lng = 0;
    
    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      
      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }
    return points;
  };

  // ==================== ETA CALCULATIONS ====================
  
  const calculateDistanceAndETAForPickup = async () => {
    if (!driverCoord || !pickupCoord) return;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${driverCoord.latitude},${driverCoord.longitude}&destinations=${pickupCoord.latitude},${pickupCoord.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        setDistanceToPickup(element.distance.value / 1000);
        setEtaToPickup(Math.ceil(element.duration.value / 60));
      }
    } catch (error) {
      console.error('Error calculating ETA:', error);
    }
  };

  const calculateDistanceAndETAForDrop = async () => {
    if (!driverCoord || !dropCoord) return;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${driverCoord.latitude},${driverCoord.longitude}&destinations=${dropCoord.latitude},${dropCoord.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        setDistanceToDrop(element.distance.value / 1000);
        setEtaToDrop(Math.ceil(element.duration.value / 60));
      }
    } catch (error) {
      console.error('Error calculating ETA:', error);
    }
  };

  // ==================== FIREBASE FUNCTIONS ====================
  
  const printAllActiveDrivers = async () => {
    console.log('\n========== ACTIVE DRIVERS FROM FIREBASE ==========');
    try {
      const activeDriversRef = ref(database, 'active_drivers');
      const snapshot = await get(activeDriversRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log(`✅ Total Active Drivers: ${Object.keys(data).length}`);
      } else {
        console.log('❌ No active drivers found');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const startListeningToDriverLocation = () => {
    if (!booking?.driver?.id) {
      console.warn('No driver ID available');
      return;
    }

    const driverId = booking.driver.id;
    const driverLocationRef = ref(database, `active_drivers/${driverId}`);
    
    console.log(`🔍 Listening to driver: ${driverId}`);
    
    driverLocationListenerRef.current = onValue(driverLocationRef, (snapshot) => {
      const location = snapshot.val();
      
      if (location && location.latitude && location.longitude) {
        const newLocation: DriverLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          heading: location.heading || 0,
          speed: location.speed || 0,
          timestamp: location.timestamp || Date.now()
        };
        
        if (lastDriverLocationRef.current) {
          animateDriverMovement(lastDriverLocationRef.current, newLocation);
        } else {
          setDriverCoord({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude
          });
          setDriverBearing(newLocation.heading || 0);
        }
        
        lastDriverLocationRef.current = newLocation;
        setIsListeningToDriver(true);
      }
    }, (error) => {
      console.error('Error listening to driver:', error);
    });
  };

  const animateDriverMovement = (from: DriverLocation, to: DriverLocation) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    const startTime = Date.now();
    const duration = 1000;
    
    const startLat = from.latitude;
    const startLng = from.longitude;
    const endLat = to.latitude;
    const endLng = to.longitude;
    const startBearing = from.heading || 0;
    const endBearing = to.heading || 0;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentLat = startLat + (endLat - startLat) * easeProgress;
      const currentLng = startLng + (endLng - startLng) * easeProgress;
      const currentBearing = startBearing + (endBearing - startBearing) * easeProgress;
      
      setDriverCoord({
        latitude: currentLat,
        longitude: currentLng
      });
      setDriverBearing(currentBearing);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const stopListeningToDriverLocation = () => {
    if (driverLocationListenerRef.current && booking?.driver?.id) {
      const driverLocationRef = ref(database, `active_drivers/${booking.driver.id}`);
      off(driverLocationRef);
      driverLocationListenerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsListeningToDriver(false);
    lastDriverLocationRef.current = null;
  };

  const geocodeAddress = async (address: string): Promise<Coordinate | null> => {
    if (!address || address.trim() === '') return null;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const geocodeAddresses = async () => {
    const pickupAddress = booking?.from_location;
    const dropAddress = booking?.to_location;
    
    if (!pickupAddress && !dropAddress) {
      Alert.alert('Error', 'Both pickup and drop locations are missing');
      setLoading(false);
      return;
    }
    
    const pickup = pickupAddress ? await geocodeAddress(pickupAddress) : null;
    const drop = dropAddress ? await geocodeAddress(dropAddress) : null;
    
    if (pickup) setPickupCoord(pickup);
    if (drop) setDropCoord(drop);
  };

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('booking_id', bookingId);

      const response = await apiClient.post('/bookings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success && response.data.data) {
        const bookingData = response.data.data.find(
          (item: any) => item.id.toString() === bookingId.toString()
        );
        
        if (bookingData) {
          setBooking(bookingData);
          setDebugInfo(`Booking loaded: ${bookingData.id}`);
        } else {
          setBooking(response.data.data[0]);
        }
      }
    } catch (error) {
      console.error('Booking fetch error: ', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRideAction = () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel your ride?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes, Cancel", style: "destructive", onPress: cancelRide }
      ]
    );
  };

  const cancelRide = async () => {
    setCancelling(true);
    try {
      const formData = new FormData();
      formData.append('booking_id', bookingId);
      formData.append('reason', 'Cancelled by user');

      const response = await apiClient.post('/cancel-booking', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        stopListeningToDriverLocation();
        Alert.alert('Success', 'Ride cancelled successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to cancel ride');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel ride. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleMapInteractionStart = () => {
    setIsManuallyInteracting(true);
    if (manualInteractionTimeout) clearTimeout(manualInteractionTimeout);
  };

  const handleMapInteractionEnd = () => {
    manualInteractionTimeout = setTimeout(() => {
      setIsManuallyInteracting(false);
    }, 3000);
  };

  const centerMapOnDriver = () => {
    if (driverCoord && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: driverCoord.latitude,
        longitude: driverCoord.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
      setIsManuallyInteracting(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Booking Confirmed',
      'driver_assigned': 'Driver Assigned',
      'vehicle_assigned': 'Vehicle Assigned',
      'arrived': 'Trip Started',
      'ongoing': 'Trip Ongoing',
      'completed': 'Trip Completed',
      'cancelled': 'Cancelled',
    };
    return statusMap[status?.toLowerCase()] || status || 'Processing';
  };

  const getDriverName = () => booking?.driver?.name || 'Driver not assigned';
  const getVehicleClass = () => {
    if (booking?.vehicle_class) {
      return `${booking.vehicle_class.vehicle_class} (${booking.vehicle_class.allowed_passengers} seater)`;
    }
    return 'Vehicle not assigned';
  };
  const getPickupLocation = () => booking?.from_location || 'Not available';
  const getDropLocation = () => booking?.to_location || 'Not available';
  const getCarNumber = () => booking?.vehicle?.vehicle_number || 'Not assigned';
  const getSeats = () => booking?.vehicle_class ? `${booking.vehicle_class.allowed_passengers} seats` : 'Not specified';
  const getTotalFare = () => booking?.total_fee ? `$${booking.total_fee}` : 'Calculating...';

  const isCancelled = booking?.status?.toLowerCase() === 'cancelled';
  const isDriverEnRoute = rideStage === 'driver_to_pickup' && driverCoord && pickupCoord && distanceToPickup !== null && distanceToPickup > 0.1;
  const isTripActive = rideStage === 'pickup_to_drop' && driverCoord && dropCoord;

  if (loading) {
    return (
      <View style={[styles.masterLayout, styles.centeredLoadingIndicator]}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.masterLayout}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

     
      {/* ETA Banner */}
      {!isCancelled && (
        <>
          {rideStage === 'driver_to_pickup' && isDriverEnRoute && etaToPickup !== null && (
            <View style={styles.etaBanner}>
              <View style={styles.etaContent}>
                <Text style={styles.etaLabel}>Driver arriving in</Text>
                <Text style={styles.etaValue}>{etaToPickup} min{etaToPickup !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.etaDivider} />
              <View style={styles.etaContent}>
                <Text style={styles.etaLabel}>Distance away</Text>
                <Text style={styles.etaValue}>{distanceToPickup?.toFixed(1)} km</Text>
              </View>
            </View>
          )}

          {rideStage === 'pickup_to_drop' && isTripActive && etaToDrop !== null && (
            <View style={[styles.etaBanner, styles.tripBanner]}>
              <View style={styles.etaContent}>
                <Text style={styles.etaLabel}>ETA to Destination</Text>
                <Text style={styles.etaValue}>{etaToDrop} min{etaToDrop !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.etaDivider} />
              <View style={styles.etaContent}>
                <Text style={styles.etaLabel}>Distance remaining</Text>
                <Text style={styles.etaValue}>{distanceToDrop?.toFixed(1)} km</Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* Map View - No Tags, Just Route and Driver */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsTraffic={false}
          showsCompass={false}
          showsScale={false}
          showsBuildings={false}
          showsPointsOfInterest={false}
          showsIndoors={false}
          onMapReady={() => setIsMapReady(true)}
          onTouchStart={handleMapInteractionStart}
          onTouchEnd={handleMapInteractionEnd}
          onPanDrag={handleMapInteractionStart}
          initialRegion={{
            latitude: 37.7749,
            longitude: -122.4194,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Route Polyline only - No pickup/drop markers */}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={rideStage === 'pickup_to_drop' ? "#34C759" : "#F5A623"}
              strokeWidth={4}
              strokeDashArray={rideStage === 'driver_to_pickup' ? [10, 5] : []}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Driver Marker Only */}
          {driverCoord && !isCancelled && (
            <Marker 
              coordinate={driverCoord} 
              anchor={{ x: 0.5, y: 0.5 }}
              rotation={driverBearing}
            >
              <View style={styles.carMarker}>
                <MovingCarIcon />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Center Button */}
        {!isCancelled && isListeningToDriver && isManuallyInteracting && driverCoord && (
          <TouchableOpacity style={styles.centerButton} onPress={centerMapOnDriver}>
            <Text style={styles.centerButtonText}>📍 Center on Driver</Text>
          </TouchableOpacity>
        )}

        {/* Live Indicator */}
        {!isCancelled && isListeningToDriver && (
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, rideStage === 'pickup_to_drop' && styles.tripLiveDot]} />
            <Text style={[styles.liveText, rideStage === 'pickup_to_drop' && styles.tripLiveText]}>
              {rideStage === 'pickup_to_drop' ? 'TRIP IN PROGRESS' : 'LIVE TRACKING'}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet - Driver Details Here */}
      <View style={[styles.bottomCardSheetWrapper, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {/* Driver Profile Card */}
        <View style={styles.profileDataRowContainer}>
          <View style={styles.avatarPlaceholderBadge}>
            <DriverPlaceholderAvatar />
          </View>
          
          <View style={styles.identityTextDetailsPane}>
            <Text style={styles.driverDisplayFullName}>{getDriverName()}</Text>
            <Text style={styles.vehicleCategorySubhead}>{getVehicleClass()}</Text>
            <Text style={styles.carNumberText}>🚗 {getCarNumber()}</Text>
            {rideStage === 'driver_to_pickup' && distanceToPickup !== null && distanceToPickup < 0.5 && (
              <Text style={styles.driverStatusText}>Almost there!</Text>
            )}
            {rideStage === 'pickup_to_drop' && (
              <Text style={[styles.driverStatusText, styles.tripStatusText]}>
                On your way to destination
              </Text>
            )}
          </View>

          {!isCancelled && booking?.driver?.phone && (
            <View style={styles.actionCommsButtonsGrid}>
              <TouchableOpacity 
                style={styles.messageBubbleCircleBtn} 
                onPress={() => Linking.openURL(`sms:${booking?.driver?.phone}`)}
              >
                <ChatBubbleIcon />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.phoneCallCircleBtn} 
                onPress={() => Linking.openURL(`tel:${booking?.driver?.phone}`)}
              >
                <PhoneCallIcon />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.horizontalHairlineSeparator} />

       

        <View style={styles.horizontalHairlineSeparator} />

        {/* Metrics Grid */}
        <View style={styles.metaMetricsHorizontalFlexRow}>
          <View style={styles.metricDataColumnNode}>
            <Text style={styles.metricColumnLabelHeading}>Total Fare</Text>
            <Text style={styles.metricColumnValueDigit}>{getTotalFare()}</Text>
          </View>
          <View style={styles.metricDataColumnNode}>
            <Text style={styles.metricColumnLabelHeading}>Distance</Text>
            <Text style={styles.metricColumnValueDigit}>{routeDistance.toFixed(1)} km</Text>
          </View>
          <View style={styles.metricDataColumnNode}>
            <Text style={styles.metricColumnLabelHeading}>Seats</Text>
            <Text style={styles.metricColumnValueDigit}>{getSeats()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  masterLayout: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },
  centeredLoadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
  },
  topStatusBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: '#000000',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 15,
  },
  backButtonTrigger: {
    padding: 4,
    marginRight: 16,
  },
  topHeaderStatusHeadline: {
    color: '#F5A623',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
    flex: 1,
  },
  refreshButton: {
    padding: 8,
  },
  etaBanner: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 16,
    borderWidth: 1,
    borderColor: '#F5A623',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tripBanner: {
    borderColor: '#34C759',
  },
  etaContent: {
    flex: 1,
    alignItems: 'center',
  },
  etaDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#3A3A3C',
    marginHorizontal: 12,
  },
  etaLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 4,
  },
  etaValue: {
    color: '#F5A623',
    fontSize: 18,
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  carMarker: {
    backgroundColor: '#000000',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F5A623',
  },
  centerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#F5A623',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  centerButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  liveIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  liveText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tripLiveDot: {
    backgroundColor: '#34C759',
  },
  tripLiveText: {
    color: '#34C759',
  },
  bottomCardSheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderWidth: 1,
    borderColor: '#1C1C1E',
    zIndex: 20,
  },
  profileDataRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarPlaceholderBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityTextDetailsPane: {
    flex: 1,
    marginLeft: 14,
  },
  driverDisplayFullName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  vehicleCategorySubhead: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  carNumberText: {
    color: '#F5A623',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  driverStatusText: {
    color: '#F5A623',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tripStatusText: {
    color: '#34C759',
  },
  actionCommsButtonsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageBubbleCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  phoneCallCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#32D74B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalHairlineSeparator: {
    height: 1,
    backgroundColor: '#1C1C1E',
    width: '100%',
  },
  tripDetailsContainer: {
    marginVertical: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  pickupBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 65,
  },
  dropBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 65,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  dropDot: {
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  locationText: {
    color: '#E5E5EA',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  dottedLine: {
    height: 20,
    width: 2,
    backgroundColor: '#48484A',
    marginLeft: 32,
    marginVertical: 4,
  },
  metaMetricsHorizontalFlexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 4,
  },
  metricDataColumnNode: {
    flex: 1,
    alignItems: 'flex-start',
  },
  metricColumnLabelHeading: {
    color: '#F5A623',
    fontSize: 12,
    fontWeight: '600',
  },
  metricColumnValueDigit: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  primaryCancelActionBtn: {
    width: '100%',
    backgroundColor: '#FF453A',
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 10,
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelActionBtnLabelText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default TrackRideScreen;