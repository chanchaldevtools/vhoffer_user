import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, get } from 'firebase/database';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import Svg, { Path } from 'react-native-svg';
import apiClient from '../services/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  apiKey: "AIzaSyDo3PzZFL_3YCs0Fl_WUTJ8j4Lw6dx0XSQ",
  authDomain: "driverapp-4cb59.firebaseapp.com",
  projectId: "driverapp-4cb59",
  storageBucket: "driverapp-4cb59.firebasestorage.app",
  databaseURL: "https://driverapp-4cb59-default-rtdb.firebaseio.com",
  messagingSenderId: "294874049573",
  appId: "1:294874049573:web:a88f375fb35ad1f7c863cc"
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
  distance?: string;
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

// ==================== ENHANCED HTML TEMPLATE WITH POLYLINES ====================
const getMapHTML = (apiKey: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      background: #1C1C1E;
    }
    #map {
      height: 100%;
      width: 100%;
    }
    .gm-style .gm-style-iw-c {
      background-color: #1C1C1E !important;
      color: #FFFFFF !important;
    }
    .gm-style .gm-style-iw-t::after {
      background: #1C1C1E !important;
    }
    .gm-style .gm-style-iw-d {
      color: #FFFFFF !important;
    }
    .route-info {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      border: 1px solid #F5A623;
      z-index: 1000;
      display: none;
    }
    .route-info.visible {
      display: block;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="routeInfo" class="route-info">
    <span id="routeDistance">0</span> km • <span id="routeDuration">0</span> min
  </div>
  <script>
    let map;
    let markers = {};
    let polylines = {};
    let routeCoords = [];
    let mapInitialized = false;
    let isMapReady = false;
    let isManuallyInteracting = false;
    let routeInfoVisible = false;
    
    // Function to initialize map
    function initMap() {
      try {
        const defaultCenter = { lat: 37.7749, lng: -122.4194 };
        
        map = new google.maps.Map(document.getElementById('map'), {
          center: defaultCenter,
          zoom: 15,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          },
          styles: [
            {
              "featureType": "all",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#FFFFFF" }]
            },
            {
              "featureType": "all",
              "elementType": "labels.text.stroke",
              "stylers": [{ "color": "#000000" }]
            },
            {
              "featureType": "road",
              "elementType": "geometry",
              "stylers": [{ "color": "#2C2C2E" }]
            },
            {
              "featureType": "road.arterial",
              "elementType": "geometry",
              "stylers": [{ "color": "#3A3A3C" }]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry",
              "stylers": [{ "color": "#4A4A4C" }]
            },
            {
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [{ "color": "#1A1A1E" }]
            },
            {
              "featureType": "landscape",
              "elementType": "geometry",
              "stylers": [{ "color": "#121214" }]
            },
            {
              "featureType": "poi",
              "elementType": "geometry",
              "stylers": [{ "color": "#1C1C1E" }]
            },
            {
              "featureType": "transit",
              "elementType": "geometry",
              "stylers": [{ "color": "#1C1C1E" }]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry",
              "stylers": [{ "color": "#2C2C2E" }]
            }
          ]
        });
        
        // Add interaction listeners
        google.maps.event.addListener(map, 'dragstart', function() {
          isManuallyInteracting = true;
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_DRAG_START' }));
          }
        });
        
        google.maps.event.addListener(map, 'dragend', function() {
          setTimeout(function() {
            isManuallyInteracting = false;
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_DRAG_END' }));
            }
          }, 3000);
        });
        
        mapInitialized = true;
        isMapReady = true;
        
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'MAP_READY',
            status: 'success'
          }));
        }
        
        console.log('✅ Map initialized successfully');
      } catch (error) {
        console.error('❌ Map initialization error:', error);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'MAP_ERROR',
            error: error.message
          }));
        }
      }
    }
    
    // Function to create or update driver marker
    function updateDriverLocation(lat, lng, heading) {
      if (!isMapReady || !map) {
        console.warn('Map not ready for driver update');
        return;
      }
      
      try {
        if (!markers.driver) {
          markers.driver = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map,
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 10,
              fillColor: '#F5A623',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              rotation: heading || 0
            },
            title: 'Driver',
            zIndex: 1000
          });
        } else {
          markers.driver.setPosition({ lat: lat, lng: lng });
          if (heading !== undefined) {
            markers.driver.setIcon({
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 10,
              fillColor: '#F5A623',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              rotation: heading
            });
          }
        }
        
        if (!isManuallyInteracting) {
          map.panTo({ lat: lat, lng: lng });
        }
        
        console.log('📍 Driver location updated:', lat, lng);
      } catch (error) {
        console.error('Error updating driver location:', error);
      }
    }
    
    // Function to create or update pickup marker
    function updatePickupLocation(lat, lng) {
      if (!isMapReady || !map) return;
      
      try {
        if (!markers.pickup) {
          markers.pickup = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#34C759',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3
            },
            label: {
              text: 'P',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 'bold'
            },
            title: 'Pickup Location',
            zIndex: 500
          });
        } else {
          markers.pickup.setPosition({ lat: lat, lng: lng });
        }
        console.log('📍 Pickup location updated:', lat, lng);
      } catch (error) {
        console.error('Error updating pickup location:', error);
      }
    }
    
    // Function to create or update drop marker
    function updateDropLocation(lat, lng) {
      if (!isMapReady || !map) return;
      
      try {
        if (!markers.drop) {
          markers.drop = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#FF3B30',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3
            },
            label: {
              text: 'D',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 'bold'
            },
            title: 'Drop Location',
            zIndex: 500
          });
        } else {
          markers.drop.setPosition({ lat: lat, lng: lng });
        }
        console.log('📍 Drop location updated:', lat, lng);
      } catch (error) {
        console.error('Error updating drop location:', error);
      }
    }
    
    // ============= ENHANCED POLYLINE FUNCTIONS =============
    
    // Function to draw multiple polylines with different styles
    function drawPolylines(coordinates, options) {
      if (!isMapReady || !map || !coordinates || coordinates.length < 2) {
        console.warn('Cannot draw polyline: insufficient data');
        return null;
      }
      
      try {
        const path = coordinates.map(coord => ({ 
          lat: coord.lat, 
          lng: coord.lng 
        }));
        
        // Create polyline with enhanced options
        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: options.color || '#F5A623',
          strokeOpacity: options.opacity || 1.0,
          strokeWeight: options.weight || 5,
          strokeDasharray: options.dashArray || '',
          zIndex: options.zIndex || 100,
          clickable: options.clickable || false,
          editable: false,
          visible: true
        });
        
        polyline.setMap(map);
        
        // Add click listener for info
        if (options.showInfo) {
          google.maps.event.addListener(polyline, 'click', function() {
            const distance = options.distance || '0';
            const duration = options.duration || '0';
            showRouteInfo(distance, duration);
          });
        }
        
        console.log('🛣️ Polyline drawn:', coordinates.length, 'points');
        return polyline;
      } catch (error) {
        console.error('Error drawing polyline:', error);
        return null;
      }
    }
    
    // Function to update route with multiple polylines
    function updateRoute(coordinates, isActive = false, routeData = null) {
      if (!isMapReady || !map) return;
      
      try {
        // Clear existing polylines
        clearPolylines();
        
        if (!coordinates || coordinates.length < 2) {
          console.log('No route coordinates to draw');
          return;
        }
        
        // Draw main route polyline
        const mainOptions = {
          color: isActive ? '#34C759' : '#F5A623',
          opacity: 1.0,
          weight: 5,
          dashArray: isActive ? '' : '',
          zIndex: 100,
          showInfo: true,
          distance: routeData?.distance || '0',
          duration: routeData?.duration || '0'
        };
        
        const mainPolyline = drawPolylines(coordinates, mainOptions);
        if (mainPolyline) {
          polylines.main = mainPolyline;
        }
        
        // If active trip, draw a glowing effect polyline underneath
        if (isActive) {
          const glowOptions = {
            color: '#34C759',
            opacity: 0.3,
            weight: 12,
            dashArray: '',
            zIndex: 99,
            showInfo: false
          };
          const glowPolyline = drawPolylines(coordinates, glowOptions);
          if (glowPolyline) {
            polylines.glow = glowPolyline;
          }
        }
        
        // Show route info
        if (routeData?.distance && routeData?.duration) {
          showRouteInfo(routeData.distance, routeData.duration);
        }
        
        console.log('✅ Route updated with polylines');
      } catch (error) {
        console.error('Error updating route:', error);
      }
    }
    
    // Function to clear all polylines
    function clearPolylines() {
      Object.keys(polylines).forEach(key => {
        if (polylines[key]) {
          polylines[key].setMap(null);
          delete polylines[key];
        }
      });
      hideRouteInfo();
      console.log('🗑️ Polylines cleared');
    }
    
    // Function to show route info
    function showRouteInfo(distance, duration) {
      const infoEl = document.getElementById('routeInfo');
      const distEl = document.getElementById('routeDistance');
      const durEl = document.getElementById('routeDuration');
      
      if (infoEl && distEl && durEl) {
        distEl.textContent = distance;
        durEl.textContent = duration;
        infoEl.classList.add('visible');
        routeInfoVisible = true;
      }
    }
    
    function hideRouteInfo() {
      const infoEl = document.getElementById('routeInfo');
      if (infoEl) {
        infoEl.classList.remove('visible');
        routeInfoVisible = false;
      }
    }
    
    // Function to draw route with traffic or alternative routes
    function drawAlternativeRoutes(coordinates, color = '#FF6B6B') {
      if (!isMapReady || !map || !coordinates || coordinates.length < 2) return;
      
      try {
        const altOptions = {
          color: color,
          opacity: 0.7,
          weight: 3,
          dashArray: '5, 10',
          zIndex: 80,
          showInfo: false
        };
        const altPolyline = drawPolylines(coordinates, altOptions);
        if (altPolyline) {
          polylines.alternative = altPolyline;
        }
      } catch (error) {
        console.error('Error drawing alternative route:', error);
      }
    }
    
    // Function to center on driver
    function centerOnDriver() {
      if (!isMapReady || !map || !markers.driver) return;
      
      try {
        const pos = markers.driver.getPosition();
        map.panTo(pos);
        isManuallyInteracting = false;
        console.log('🎯 Centered on driver');
      } catch (error) {
        console.error('Error centering on driver:', error);
      }
    }
    
    // Function to fit bounds with all markers and route
    function fitMapBounds(coordinates) {
      if (!isMapReady || !map) return;
      
      try {
        const bounds = new google.maps.LatLngBounds();
        
        // Add all coordinates to bounds
        if (coordinates && coordinates.length > 0) {
          coordinates.forEach(coord => {
            bounds.extend({ lat: coord.lat, lng: coord.lng });
          });
        }
        
        // Add markers if they exist
        if (markers.driver) {
          bounds.extend(markers.driver.getPosition());
        }
        if (markers.pickup) {
          bounds.extend(markers.pickup.getPosition());
        }
        if (markers.drop) {
          bounds.extend(markers.drop.getPosition());
        }
        
        map.fitBounds(bounds);
        console.log('📐 Map bounds updated with all points');
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
    
    // Listen for messages from React Native
    document.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received message:', data.type);
        
        switch(data.type) {
          case 'UPDATE_DRIVER':
            updateDriverLocation(data.lat, data.lng, data.heading);
            break;
          case 'UPDATE_PICKUP':
            updatePickupLocation(data.lat, data.lng);
            break;
          case 'UPDATE_DROP':
            updateDropLocation(data.lat, data.lng);
            break;
          case 'UPDATE_ROUTE':
            updateRoute(data.coordinates, data.isActive || false, data.routeData || null);
            break;
          case 'CLEAR_ROUTE':
            clearPolylines();
            break;
          case 'SET_INTERACTION':
            isManuallyInteracting = data.interacting;
            break;
          case 'CENTER_ON_DRIVER':
            centerOnDriver();
            break;
          case 'FIT_BOUNDS':
            fitMapBounds(data.coordinates);
            break;
          case 'DRAW_ALTERNATIVE_ROUTE':
            drawAlternativeRoutes(data.coordinates, data.color);
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    // Handle Google Maps auth failure
    window.gm_authFailure = function() {
      console.error('❌ Google Maps authentication failed');
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'MAP_ERROR',
          error: 'Authentication failed'
        }));
      }
    };
    
    // Initialize map when script loads
    if (typeof google !== 'undefined' && google.maps) {
      console.log('🌐 Google Maps loaded, initializing...');
      initMap();
    } else {
      console.log('⏳ Waiting for Google Maps to load...');
      setTimeout(function() {
        if (typeof google !== 'undefined' && google.maps) {
          initMap();
        } else {
          console.error('❌ Google Maps failed to load');
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'MAP_ERROR',
              error: 'Google Maps failed to load'
            }));
          }
        }
      }, 3000);
    }
    
    console.log('📱 WebView HTML loaded');
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=3.exp&libraries=geometry,places"></script>
</body>
</html>
`;

const TrackRideScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const bookingId = route.params?.tripId;
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
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [isDataRestored, setIsDataRestored] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);
  
  const webViewRef = useRef<WebView>(null);
  const driverLocationListenerRef = useRef<any>(null);
  const lastDriverLocationRef = useRef<DriverLocation | null>(null);
  const routeCoordsRef = useRef<Coordinate[]>([]);
  const pickupCoordRef = useRef<Coordinate | null>(null);
  const dropCoordRef = useRef<Coordinate | null>(null);
  const driverCoordRef = useRef<Coordinate | null>(null);
  const rideStageRef = useRef<RideStage>('driver_to_pickup');
  const bookingRef = useRef<BookingData | null>(null);
  let manualInteractionTimeout: NodeJS.Timeout;

  // Keep refs updated
  useEffect(() => {
    pickupCoordRef.current = pickupCoord;
    dropCoordRef.current = dropCoord;
    driverCoordRef.current = driverCoord;
    rideStageRef.current = rideStage;
    bookingRef.current = booking;
  }, [pickupCoord, dropCoord, driverCoord, rideStage, booking]);

  // ==================== WEBVIEW COMMUNICATION ====================
  
  const sendToWebView = (data: any) => {
    if (webViewRef.current && isMapReady) {
      webViewRef.current.postMessage(JSON.stringify(data));
    }
  };

  const updateMapDriverLocation = (lat: number, lng: number, heading?: number) => {
    sendToWebView({
      type: 'UPDATE_DRIVER',
      lat,
      lng,
      heading: heading || 0
    });
  };

  const updateMapPickupLocation = (lat: number, lng: number) => {
    sendToWebView({
      type: 'UPDATE_PICKUP',
      lat,
      lng
    });
  };

  const updateMapDropLocation = (lat: number, lng: number) => {
    sendToWebView({
      type: 'UPDATE_DROP',
      lat,
      lng
    });
  };

  const updateMapRoute = (coordinates: Coordinate[], isActive: boolean = false, routeData?: {distance: string, duration: string}) => {
    const coords = coordinates.map(c => ({ lat: c.latitude, lng: c.longitude }));
    sendToWebView({
      type: 'UPDATE_ROUTE',
      coordinates: coords,
      isActive,
      routeData: routeData || null
    });
  };

  const clearMapRoute = () => {
    sendToWebView({
      type: 'CLEAR_ROUTE'
    });
  };

  const centerMapOnDriver = () => {
    if (driverCoord && webViewRef.current) {
      sendToWebView({
        type: 'CENTER_ON_DRIVER'
      });
      setIsManuallyInteracting(false);
    }
  };

  const fitMapBounds = (coordinates: Coordinate[]) => {
    const coords = coordinates.map(c => ({ lat: c.latitude, lng: c.longitude }));
    sendToWebView({
      type: 'FIT_BOUNDS',
      coordinates: coords
    });
  };

  const drawAlternativeRoute = (coordinates: Coordinate[], color?: string) => {
    const coords = coordinates.map(c => ({ lat: c.latitude, lng: c.longitude }));
    sendToWebView({
      type: 'DRAW_ALTERNATIVE_ROUTE',
      coordinates: coords,
      color: color || '#FF6B6B'
    });
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Received from WebView:', data);
      
      switch(data.type) {
        case 'MAP_READY':
          setIsMapReady(true);
          setMapError(null);
          console.log('✅ Map is ready');
          // Send initial data to map
          if (driverCoord) {
            updateMapDriverLocation(driverCoord.latitude, driverCoord.longitude, driverBearing);
          }
          if (pickupCoord) {
            updateMapPickupLocation(pickupCoord.latitude, pickupCoord.longitude);
          }
          if (dropCoord) {
            updateMapDropLocation(dropCoord.latitude, dropCoord.longitude);
          }
          if (routeCoords.length > 0) {
            const routeData = {
              distance: routeDistance.toFixed(1),
              duration: routeDuration.toString()
            };
            updateMapRoute(routeCoords, rideStage === 'pickup_to_drop', routeData);
          }
          break;
        case 'MAP_ERROR':
          console.error('Map error from WebView:', data.error);
          setMapError(data.error || 'Map failed to load');
          setTimeout(() => {
            setForceRenderKey(prev => prev + 1);
          }, 5000);
          break;
        case 'MAP_DRAG_START':
          setIsManuallyInteracting(true);
          break;
        case 'MAP_DRAG_END':
          setTimeout(() => {
            setIsManuallyInteracting(false);
          }, 3000);
          break;
        default:
          console.log('Unknown message type from WebView:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // ==================== PERSISTENCE FUNCTIONS ====================
  
  const persistBookingData = async () => {
    if (booking && bookingId) {
      try {
        await AsyncStorage.setItem(`booking_${bookingId}`, JSON.stringify(booking));
        console.log('💾 Persisted booking data');
      } catch (error) {
        console.error('Error persisting booking:', error);
      }
    }
  };

  const persistRouteData = async () => {
    if (routeCoords.length > 0 && bookingId) {
      try {
        await AsyncStorage.setItem(`route_${bookingId}`, JSON.stringify(routeCoords));
        routeCoordsRef.current = routeCoords;
        console.log('💾 Saved route to storage:', routeCoords.length, 'points');
      } catch (error) {
        console.error('Error persisting route:', error);
      }
    }
  };

  const persistPickupDropCoords = async () => {
    if (pickupCoord && dropCoord && bookingId) {
      try {
        await AsyncStorage.setItem(`coordinates_${bookingId}`, JSON.stringify({
          pickup: pickupCoord,
          drop: dropCoord
        }));
        console.log('💾 Persisted pickup/drop coordinates');
      } catch (error) {
        console.error('Error persisting coordinates:', error);
      }
    }
  };

  const loadPersistedData = async () => {
    if (!bookingId) return;
    
    try {
      console.log('🔄 Loading persisted data for booking:', bookingId);
      
      const savedBooking = await AsyncStorage.getItem(`booking_${bookingId}`);
      if (savedBooking && !booking) {
        const parsedBooking = JSON.parse(savedBooking);
        setBooking(parsedBooking);
        bookingRef.current = parsedBooking;
        console.log('✅ Loaded persisted booking data');
      }
      
      const savedRoute = await AsyncStorage.getItem(`route_${bookingId}`);
      if (savedRoute && routeCoords.length === 0) {
        const parsedRoute = JSON.parse(savedRoute);
        if (parsedRoute.length > 0) {
          setRouteCoords(parsedRoute);
          routeCoordsRef.current = parsedRoute;
          console.log('✅ Loaded persisted route data:', parsedRoute.length, 'points');
        }
      }
      
      const savedCoords = await AsyncStorage.getItem(`coordinates_${bookingId}`);
      if (savedCoords && !pickupCoord) {
        const { pickup, drop } = JSON.parse(savedCoords);
        if (pickup) setPickupCoord(pickup);
        if (drop) setDropCoord(drop);
        console.log('✅ Loaded persisted coordinates');
      }
      
      setIsDataRestored(true);
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  // ==================== FOCUS HANDLING ====================
  
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 Screen focused - restoring all data');
      
      const restoreOnFocus = async () => {
        await loadPersistedData();
        if (bookingId) {
          await fetchBookingDetails(true);
        }
        if (routeCoordsRef.current.length > 0) {
          setForceRenderKey(prev => prev + 1);
          console.log('🔄 Forced map re-render');
        }
        if (pickupCoordRef.current && bookingRef.current?.driver?.id && !isListeningToDriver) {
          console.log('🔄 Re-attaching driver listener on focus');
          startListeningToDriverLocation();
        }
        if (rideStageRef.current === 'driver_to_pickup' && driverCoordRef.current && pickupCoordRef.current) {
          calculateDistanceAndETAForPickup();
        } else if (rideStageRef.current === 'pickup_to_drop' && driverCoordRef.current && dropCoordRef.current) {
          calculateDistanceAndETAForDrop();
        }
      };
      
      restoreOnFocus();
      
      return () => {
        console.log('📱 Screen unfocused - keeping data in memory');
      };
    }, [bookingId])
  );

  // Load all data on mount
  useEffect(() => {
    const initializeScreen = async () => {
      await loadPersistedData();
      await fetchBookingDetails();
    };
    
    initializeScreen();
    
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('🔄 App became active, refreshing data');
        loadPersistedData();
        fetchBookingDetails(true);
      }
    });
    
    return () => {
      appStateSubscription.remove();
    };
  }, []);

  // Persist data when it changes
  useEffect(() => {
    if (booking) {
      persistBookingData();
    }
  }, [booking]);

  useEffect(() => {
    if (routeCoords.length > 0) {
      persistRouteData();
    }
  }, [routeCoords]);

  useEffect(() => {
    if (pickupCoord && dropCoord) {
      persistPickupDropCoords();
    }
  }, [pickupCoord, dropCoord]);

  // Geocode addresses when booking loads
  useEffect(() => {
    if (booking && !pickupCoord && !dropCoord) {
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

  // Start listening to driver location when ready
  useEffect(() => {
    if (pickupCoord && booking?.driver?.id) {
      startListeningToDriverLocation();
    }
    
    return () => {
      stopListeningToDriverLocation();
    };
  }, [pickupCoord, booking?.driver?.id]);

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

  // Update map when coordinates change
  useEffect(() => {
    if (isMapReady && driverCoord) {
      updateMapDriverLocation(driverCoord.latitude, driverCoord.longitude, driverBearing);
    }
  }, [driverCoord, driverBearing, isMapReady]);

  useEffect(() => {
    if (isMapReady && pickupCoord) {
      updateMapPickupLocation(pickupCoord.latitude, pickupCoord.longitude);
    }
  }, [pickupCoord, isMapReady]);

  useEffect(() => {
    if (isMapReady && dropCoord) {
      updateMapDropLocation(dropCoord.latitude, dropCoord.longitude);
    }
  }, [dropCoord, isMapReady]);

  useEffect(() => {
    if (isMapReady && routeCoords.length > 0) {
      const routeData = {
        distance: routeDistance.toFixed(1),
        duration: routeDuration.toString()
      };
      updateMapRoute(routeCoords, rideStage === 'pickup_to_drop', routeData);
    }
  }, [routeCoords, rideStage, isMapReady]);

  // ==================== ENHANCED ROUTE MANAGEMENT ====================
  
  const updateRouteForStage = async (stage: RideStage) => {
    if (stage === 'driver_to_pickup' && driverCoord && pickupCoord) {
      // Get main route
      const routePoints = await getRoute(driverCoord, pickupCoord);
      if (routePoints.length > 0) {
        setRouteCoords(routePoints);
        routeCoordsRef.current = routePoints;
        await persistRouteData();
        
        // Calculate route distance and duration
        const directionsData = await getDirections(driverCoord, pickupCoord);
        if (directionsData) {
          setRouteDistance(directionsData.distance);
          setRouteDuration(directionsData.duration);
        }
        
        if (isMapReady) {
          const routeData = {
            distance: routeDistance.toFixed(1),
            duration: routeDuration.toString()
          };
          updateMapRoute(routePoints, false, routeData);
          fitMapBounds([driverCoord, pickupCoord, ...routePoints]);
        }
      }
    } else if (stage === 'pickup_to_drop' && pickupCoord && dropCoord) {
      // Get main route
      const routePoints = await getRoute(pickupCoord, dropCoord);
      if (routePoints.length > 0) {
        setRouteCoords(routePoints);
        routeCoordsRef.current = routePoints;
        await persistRouteData();
        
        // Calculate route distance and duration
        const directionsData = await getDirections(pickupCoord, dropCoord);
        if (directionsData) {
          setRouteDistance(directionsData.distance);
          setRouteDuration(directionsData.duration);
          
          // Try to get alternative route
          try {
            const altRoute = await getAlternativeRoute(pickupCoord, dropCoord);
            if (altRoute && altRoute.length > 0 && isMapReady) {
              drawAlternativeRoute(altRoute, '#FF6B6B');
            }
          } catch (e) {
            console.log('No alternative route available');
          }
        }
        
        if (isMapReady) {
          const routeData = {
            distance: routeDistance.toFixed(1),
            duration: routeDuration.toString()
          };
          updateMapRoute(routePoints, true, routeData);
          fitMapBounds([pickupCoord, dropCoord, ...routePoints]);
        }
      }
    }
  };

  const getRoute = async (origin: Coordinate, destination: Coordinate): Promise<Coordinate[]> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}&alternatives=false`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        console.log('📍 Got route points:', points.length);
        return points;
      }
      return [];
    } catch (error) {
      console.error('Directions API error:', error);
      return [];
    }
  };

  const getAlternativeRoute = async (origin: Coordinate, destination: Coordinate): Promise<Coordinate[]> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}&alternatives=true`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 1) {
        const points = decodePolyline(data.routes[1].overview_polyline.points);
        console.log('📍 Got alternative route points:', points.length);
        return points;
      }
      return [];
    } catch (error) {
      console.error('Alternative route error:', error);
      return [];
    }
  };

  const getDirections = async (origin: Coordinate, destination: Coordinate) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes[0]?.legs[0]) {
        const leg = data.routes[0].legs[0];
        return {
          distance: leg.distance.value / 1000, // in km
          duration: Math.ceil(leg.duration.value / 60) // in minutes
        };
      }
      return null;
    } catch (error) {
      console.error('Directions API error:', error);
      return null;
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
  
  const startListeningToDriverLocation = () => {
    if (!booking?.driver?.id) {
      console.warn('No driver ID available');
      return;
    }

    if (driverLocationListenerRef.current) {
      stopListeningToDriverLocation();
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
        
        setDriverCoord({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude
        });
        setDriverBearing(newLocation.heading || 0);
        
        if (isMapReady) {
          updateMapDriverLocation(newLocation.latitude, newLocation.longitude, newLocation.heading || 0);
        }
        
        lastDriverLocationRef.current = newLocation;
        setIsListeningToDriver(true);
      }
    }, (error) => {
      console.error('Error listening to driver:', error);
    });
  };

  const stopListeningToDriverLocation = () => {
    if (driverLocationListenerRef.current && booking?.driver?.id) {
      const driverLocationRef = ref(database, `active_drivers/${booking.driver.id}`);
      off(driverLocationRef);
      driverLocationListenerRef.current = null;
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
    
    if (pickup && drop) {
      fitMapBounds([pickup, drop]);
    }
  };

  const fetchBookingDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
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
          bookingRef.current = bookingData;
          setDebugInfo(`Booking loaded: ${bookingData.id}`);
          await persistBookingData();
          console.log('✅ Booking details refreshed');
        } else if (response.data.data[0]) {
          setBooking(response.data.data[0]);
          bookingRef.current = response.data.data[0];
          await persistBookingData();
        }
      }
    } catch (error) {
      console.error('Booking fetch error: ', error);
      if (!silent) {
        Alert.alert('Error', 'Failed to load booking details');
      }
    } finally {
      if (!silent) setLoading(false);
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
        clearMapRoute();
        await AsyncStorage.removeItem(`booking_${bookingId}`);
        await AsyncStorage.removeItem(`route_${bookingId}`);
        await AsyncStorage.removeItem(`coordinates_${bookingId}`);
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

  const navigateToChat = () => {
    navigation.push('Chat', {
      driver: {
        id: booking?.driver?.id,
        name: booking?.driver?.name,
        phone: booking?.driver?.phone,
        driver_id: booking?.driver?.id
      },
      booking: {
        id: booking?.id,
        from_location: booking?.from_location,
        to_location: booking?.to_location
      },
      onBack: () => {
        console.log('Coming back from chat, refreshing data');
        loadPersistedData();
        fetchBookingDetails(true);
      }
    });
  };

  const getDriverName = () => booking?.driver?.name || 'Driver not assigned';
  const getVehicleClass = () => {
    if (booking?.vehicle_class) {
      return `${booking.vehicle_class.vehicle_class} (${booking.vehicle_class.allowed_passengers} seater)`;
    }
    return 'Vehicle not assigned';
  };
  const getCarNumber = () => booking?.vehicle?.vehicle_number || 'Not assigned';
  const getSeats = () => booking?.vehicle_class ? `${booking.vehicle_class.allowed_passengers} seats` : 'Not specified';
  const getTotalFare = () => booking?.total_fee ? `$${booking.total_fee}` : 'Calculating...';

  const isCancelled = booking?.status?.toLowerCase() === 'cancelled';
  const isDriverEnRoute = rideStage === 'driver_to_pickup' && driverCoord && pickupCoord && distanceToPickup !== null && distanceToPickup > 0.1;
  const isTripActive = rideStage === 'pickup_to_drop' && driverCoord && dropCoord;

  if (loading && !isDataRestored) {
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

      {/* Route Info Banner */}
      {routeCoords.length > 0 && routeDistance > 0 && (
        <View style={styles.routeInfoBanner}>
          <Text style={styles.routeInfoText}>
            🛣️ {routeDistance.toFixed(1)} km • {routeDuration} min
          </Text>
        </View>
      )}

      {/* Map Error Banner */}
      {mapError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {mapError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => setForceRenderKey(prev => prev + 1)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map WebView */}
      <View style={styles.mapContainer}>
        <WebView
          key={`webview-${forceRenderKey}`}
          ref={webViewRef}
          source={{ html: getMapHTML(GOOGLE_MAPS_API_KEY) }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          onError={(error) => {
            console.error('WebView error:', error);
            setMapError('WebView failed to load');
            setTimeout(() => setForceRenderKey(prev => prev + 1), 5000);
          }}
          onLoadStart={() => console.log('WebView loading...')}
          onLoadEnd={() => console.log('WebView loaded')}
          onLoadProgress={({ nativeEvent }) => {
            if (nativeEvent.progress === 1) {
              console.log('WebView fully loaded');
            }
          }}
          scrollEnabled={false}
          containerStyle={{ flex: 1 }}
          cacheEnabled={false}
          cacheMode="LOAD_NO_CACHE"
        />

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

      {/* Bottom Sheet - Driver Details */}
      <View style={[styles.bottomCardSheetWrapper, { paddingBottom: Math.max(insets.bottom, 24) }]}>
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
                onPress={navigateToChat}
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

        <View style={styles.metaMetricsHorizontalFlexRow}>
          <View style={styles.metricDataColumnNode}>
            <Text style={styles.metricColumnLabelHeading}>Total Fare</Text>
            <Text style={styles.metricColumnValueDigit}>{getTotalFare()}</Text>
          </View>
          <View style={styles.metricDataColumnNode}>
            <Text style={styles.metricColumnLabelHeading}>Distance</Text>
            <Text style={styles.metricColumnValueDigit}>{booking?.distance || '0'} Mile</Text>
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
  routeInfoBanner: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    zIndex: 16,
    borderWidth: 1,
    borderColor: '#F5A623',
  },
  routeInfoText: {
    color: '#F5A623',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  map: {
    flex: 1,
    backgroundColor: '#1C1C1E',
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
  errorBanner: {
    position: 'absolute',
    top: 180,
    left: 20,
    right: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 17,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  retryButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 12,
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
});

export default TrackRideScreen;