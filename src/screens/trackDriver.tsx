import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import apiClient from '../services/apiConfig';

const { width, height } = Dimensions.get('window');

// ==================== SVG ICONS ====================
const BackChevronIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const UserPersonIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 3.58-8 8v1h16v-1c0-4.42-3.58-8-8-8z" fill="#F5A623"/>
  </Svg>
);

const MovingCarIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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

// Google Maps API Key for Geocoding
const GOOGLE_MAPS_API_KEY = 'AIzaSyDZMPwuTtTXazrUOsqV2Q3W-zs8Ed2SUM8';

interface Coordinate {
  latitude: number;
  longitude: number;
}

const TrackRideScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const bookingId = route.params?.bookingId || route.params?.id || '5';
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [pickupCoord, setPickupCoord] = useState<Coordinate | null>(null);
  const [dropCoord, setDropCoord] = useState<Coordinate | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [driverCoord, setDriverCoord] = useState<Coordinate | null>(null);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(0);
  
  const mapRef = useRef<MapView>(null);
  const driverProgress = useRef(new Animated.Value(0)).current;

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

  // Start animation when route is loaded
  useEffect(() => {
    if (routeCoords.length > 0 && booking?.status !== 'cancelled') {
      startProgressAnimation();
    }
  }, [routeCoords]);

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

  // Geocode address to coordinates using Google Maps API
  const geocodeAddress = async (address: string): Promise<Coordinate | null> => {
    if (!address || address.trim() === '') {
      return null;
    }
    
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

  // Get route between two points using Google Maps Directions API
  const getRoute = async (origin: Coordinate, destination: Coordinate) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Extract polyline points
        const points = decodePolyline(route.overview_polyline.points);
        
        setRouteDistance(leg.distance.value / 1000); // km
        setRouteDuration(Math.ceil(leg.duration.value / 60)); // minutes
        
        return points;
      }
      return [];
    } catch (error) {
      console.error('Directions API error:', error);
      return [];
    }
  };

  // Decode Google Maps polyline
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

  // Get driver's current location (simulated - in real app, would come from WebSocket)
  const getDriverLocation = (progress: number, routePoints: Coordinate[]): Coordinate | null => {
    if (routePoints.length === 0) return null;
    
    const index = Math.floor(progress * (routePoints.length - 1));
    return routePoints[index];
  };

  const geocodeAddresses = async () => {
    const pickupAddress = booking?.from_location;
    const dropAddress = booking?.to_location;
    
    // Handle missing addresses
    if (!pickupAddress && !dropAddress) {
      Alert.alert('Error', 'Both pickup and drop locations are missing');
      setLoading(false);
      return;
    }
    
    // Geocode available addresses
    const pickup = pickupAddress ? await geocodeAddress(pickupAddress) : null;
    const drop = dropAddress ? await geocodeAddress(dropAddress) : null;
    
    if (pickup) setPickupCoord(pickup);
    if (drop) setDropCoord(drop);
    
    // Get route only if both coordinates exist
    if (pickup && drop) {
      const routePoints = await getRoute(pickup, drop);
      setRouteCoords(routePoints);
      
      // Fit map to show entire route
      if (mapRef.current && routePoints.length > 0) {
        mapRef.current.fitToCoordinates([pickup, drop, ...routePoints], {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } else if (mapRef.current) {
        const pointsToShow = [];
        if (pickup) pointsToShow.push(pickup);
        if (drop) pointsToShow.push(drop);
        
        if (pointsToShow.length > 0) {
          mapRef.current.fitToCoordinates(pointsToShow, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      }
    } else if (pickup) {
      // Only pickup exists - center map on pickup
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } else if (drop) {
      // Only drop exists - center map on drop
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: drop.latitude,
          longitude: drop.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }
  };

  const startProgressAnimation = () => {
    driverProgress.setValue(0);
    Animated.timing(driverProgress, {
      toValue: 1,
      duration: routeDuration * 60 * 1000, // Duration in milliseconds
      useNativeDriver: false,
    }).start();
    
    // Animate driver position
    driverProgress.addListener(({ value }) => {
      const newDriverPos = getDriverLocation(value, routeCoords);
      if (newDriverPos) {
        setDriverCoord(newDriverPos);
      }
    });
  };

  const handleCancelRideAction = () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel your ongoing ride request?",
      [
        { text: "No, Keep Ride", style: "cancel" },
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

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Booking Confirmed',
      'driver_assigned': 'Driver Assigned',
      'vehicle_assigned': 'Vehicle Assigned',
      'ongoing': 'Trip Started',
      'completed': 'Trip Completed',
      'cancelled': 'Cancelled',
    };
    return statusMap[status?.toLowerCase()] || status || 'Processing';
  };

  const getDriverName = () => booking?.driver?.name || 'Driver not assigned yet';
  
  const getVehicleClass = () => {
    if (booking?.vehicle_class) {
      return `${booking.vehicle_class.vehicle_class} (${booking.vehicle_class.allowed_passengers} seater)`;
    }
    return 'Vehicle class not assigned';
  };

  const getPickupLocation = () => booking?.from_location || 'Pickup location not available';
  const getDropLocation = () => booking?.to_location || 'Drop location not available';
  const getCarNumber = () => booking?.vehicle?.vehicle_number || 'Not assigned';
  const getSeats = () => booking?.vehicle_class ? `${booking.vehicle_class.allowed_passengers} seats` : 'Not specified';
  const getTotalFare = () => booking?.total_fee ? `$${booking.total_fee}` : 'Calculating...';

  const isCancelled = booking?.status?.toLowerCase() === 'cancelled';

  // Loading state
  if (loading) {
    return (
      <View style={[styles.masterLayout, styles.centeredLoadingIndicator]}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  // Error state - both locations missing
 

  return (
    <View style={styles.masterLayout}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

     

      {/* Map View with Actual Route */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsTraffic={false}
          initialRegion={{
            latitude: pickupCoord?.latitude || dropCoord?.latitude || 0,
            longitude: pickupCoord?.longitude || dropCoord?.longitude || 0,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Pickup Marker - only show if exists */}
          {pickupCoord && (
            <Marker
              coordinate={pickupCoord}
              title="Pickup Location"
              description={getPickupLocation()}
            >
              <View style={styles.pickupMarker}>
                <View style={styles.pickupDot} />
                <Text style={styles.markerLabel}>Pickup</Text>
              </View>
            </Marker>
          )}

          {/* Drop Marker - only show if exists */}
          {dropCoord && (
            <Marker
              coordinate={dropCoord}
              title="Drop Location"
              description={getDropLocation()}
            >
              <View style={styles.dropMarker}>
                <View style={styles.dropDot} />
                <Text style={styles.markerLabel}>Drop</Text>
              </View>
            </Marker>
          )}

          {/* Route Polyline - only show if both coordinates exist */}
          {pickupCoord && dropCoord && routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#F5A623"
              strokeWidth={4}
              strokeDashArray={[10, 5]}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Driver Marker - only show if route exists and not cancelled */}
          {pickupCoord && dropCoord && driverCoord && !isCancelled && routeCoords.length > 0 && (
            <Marker coordinate={driverCoord} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.carMarker}>
                <MovingCarIcon />
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      {/* Bottom Sheet */}
      <View style={[styles.bottomCardSheetWrapper, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Text style={styles.sheetMainStatusHeadline}>
          {isCancelled ? 'Ride Cancelled' : getStatusDisplay(booking?.status)}
        </Text>
        <View style={styles.horizontalHairlineSeparator} />

        {/* Profile Card */}
        <View style={styles.profileDataRowContainer}>
          <View style={styles.avatarPlaceholderBadge}>
            <DriverPlaceholderAvatar />
          </View>
          
          <View style={styles.identityTextDetailsPane}>
            <Text style={styles.driverDisplayFullName}>{getDriverName()}</Text>
            <Text style={styles.vehicleCategorySubhead}>{getVehicleClass()}</Text>
          </View>

          {!isCancelled && (
            <View style={styles.actionCommsButtonsGrid}>
              <TouchableOpacity 
                style={styles.messageBubbleCircleBtn} 
                onPress={() => Linking.openURL(`sms:${booking?.driver?.phone || ''}`)}
              >
                <ChatBubbleIcon />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.phoneCallCircleBtn} 
                onPress={() => Linking.openURL(`tel:${booking?.driver?.phone || ''}`)}
              >
                <PhoneCallIcon />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Journey Info - only show if route exists */}
        {pickupCoord && dropCoord && routeCoords.length > 0 && (
          <>
            <View style={styles.journeyInfoContainer}>
              <View style={styles.journeyItem}>
                <Text style={styles.journeyLabel}>Distance</Text>
                <Text style={styles.journeyValue}>{routeDistance.toFixed(1)} km</Text>
              </View>
              <View style={styles.journeyDivider} />
              <View style={styles.journeyItem}>
                <Text style={styles.journeyLabel}>Est. Duration</Text>
                <Text style={styles.journeyValue}>{routeDuration} mins</Text>
              </View>
            </View>
            <View style={styles.horizontalHairlineSeparator} />
          </>
        )}

        {/* Route Timeline - show available locations */}
        <View style={styles.routeTimelineContainerBlock}>
          <View style={styles.timelineVisualAxisVector}>
            <View style={styles.timelineCircleTerminalNode} />
            {dropCoord && (
              <>
                <View style={styles.timelineDottedVerticalConnectiveLine} />
                <View style={styles.timelineDestinationPinNode}>
                  <View style={styles.timelineInnerTargetDot} />
                </View>
              </>
            )}
          </View>
          <View style={styles.addressLabelsTextStackBlock}>
            <Text style={styles.addressSummaryValueText} numberOfLines={2}>
              {getPickupLocation()}
            </Text>
            {dropCoord && (
              <Text style={styles.addressSummaryValueText} numberOfLines={2}>
                {getDropLocation()}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.horizontalHairlineSeparator} />

        {/* Metrics Grid */}
        <View style={styles.metaMetricsHorizontalFlexRow}>
          <View style={styles.metricDataColumnNode}>
            <Text style={styles.metricColumnLabelHeading}>Total Fare</Text>
            <Text style={styles.metricColumnValueDigit}>{getTotalFare()}</Text>
          </View>
          <View style={styles.metricDataColumnNode}>
            <Text style={styles.metricColumnLabelHeading}>Car Number</Text>
            <Text style={styles.metricColumnValueDigit}>{getCarNumber()}</Text>
          </View>
          <View style={styles.metricDataColumnNode}>
            <Text style={styles.metricColumnLabelHeading}>Seats</Text>
            <Text style={styles.metricColumnValueDigit}>{getSeats()}</Text>
          </View>
        </View>

        {/* Cancel Button - Only show if not cancelled */}
         
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
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  goBackButton: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  goBackButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
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
  },

  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },

  pickupMarker: {
    alignItems: 'center',
  },
  pickupDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dropMarker: {
    alignItems: 'center',
  },
  dropDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  carMarker: {
    backgroundColor: '#000000',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F5A623',
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
  sheetMainStatusHeadline: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  horizontalHairlineSeparator: {
    height: 1,
    backgroundColor: '#1C1C1E',
    width: '100%',
  },

  profileDataRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
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

  journeyInfoContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 12,
    marginVertical: 12,
  },
  journeyItem: {
    flex: 1,
    alignItems: 'center',
  },
  journeyDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#3A3A3C',
  },
  journeyLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 4,
  },
  journeyValue: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: '700',
  },

  routeTimelineContainerBlock: {
    flexDirection: 'row',
    paddingLeft: 6,
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  timelineVisualAxisVector: {
    alignItems: 'center',
    width: 20,
    height: 80,
    paddingTop: 6,
  },
  timelineCircleTerminalNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#8E8E93',
  },
  timelineDottedVerticalConnectiveLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#48484A',
    marginVertical: 4,
  },
  timelineDestinationPinNode: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInnerTargetDot: {
    width: 10,
    height: 10,
    backgroundColor: '#FF3B30',
    transform: [{ rotate: '45deg' }],
  },
  addressLabelsTextStackBlock: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    height: 84,
  },
  addressSummaryValueText: {
    color: '#E5E5EA',
    fontSize: 13,
    fontWeight: '500',
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