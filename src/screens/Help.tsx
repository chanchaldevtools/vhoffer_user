import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Modal,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiConfig';

// ============ PUSHER SETUP - CORRECT ============
import 'react-native-get-random-values';
import Pusher from 'pusher-js/react-native';
import { decode, encode } from 'base-64';

if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;

// WebSocket polyfill for React Native
if (!global.WebSocket) {
  global.WebSocket = require('react-native-websocket');
}

// Enable Pusher logging in development
if (__DEV__) {
  Pusher.logToConsole = true;
}

const PUSHER_APP_KEY = '17ab68f89fd4b710e004';
const PUSHER_CLUSTER = 'ap2';

// ==================== SVG ICONS ====================
const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SendIcon = ({ color = "#F5A623" }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SupportIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#F5A623" strokeWidth="1.5"/>
    <Path d="M12 16V12M12 8H12.01" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const TaxiIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M5 18H3C2.44772 18 2 17.5523 2 17V14C2 13.4477 2.44772 13 3 13H5" stroke="#000000" strokeWidth="1.5"/>
    <Path d="M19 18H21C21.5527 18 22 17.5523 22 17V14C22 13.4477 21.5527 13 21 13H19" stroke="#000000" strokeWidth="1.5"/>
    <Path d="M7 18H17" stroke="#000000" strokeWidth="1.5"/>
    <Circle cx="7.5" cy="15.5" r="2.5" fill="#F5A623" stroke="#000000" strokeWidth="1"/>
    <Circle cx="16.5" cy="15.5" r="2.5" fill="#F5A623" stroke="#000000" strokeWidth="1"/>
    <Path d="M8 9L11 5H13L16 9" stroke="#000000" strokeWidth="1.5"/>
    <Path d="M10 13H14" stroke="#000000" strokeWidth="1.5"/>
  </Svg>
);

const CloseIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TicketIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M4 4H20C21.1 22 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#F5A623" strokeWidth="1.5"/>
    <Path d="M8 8H16" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 12H14" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M8 16H12" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const AgentIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <Path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="#34C759" strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="12" cy="7" r="4" stroke="#34C759" strokeWidth="1.5"/>
  </Svg>
);

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  
  const initialBookingId = route.params?.bookingId;
  const initialTicketId = route.params?.ticketId;
  
  const [messages, setMessages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(initialBookingId || null);
  const [currentTicketId, setCurrentTicketId] = useState(initialTicketId || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickIssues, setQuickIssues] = useState([]);
  const [showQuickIssues, setShowQuickIssues] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [showOtherIssueInput, setShowOtherIssueInput] = useState(false);
  const [otherIssueText, setOtherIssueText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [pusherStatus, setPusherStatus] = useState('disconnected');
  const [agentName, setAgentName] = useState(null);
  const [isAgentAssigned, setIsAgentAssigned] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const getCurrentUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        return String(user.id);
      }
      return null;
    } catch (error) {
      console.log('Error getting user ID:', error);
      return null;
    }
  };

  // Initialize Pusher - CORRECTED VERSION

const initializePusher = async (ticketId, currentUserId) => {
  if (!ticketId || !currentUserId) {
    console.log('❌ Cannot initialize Pusher: Missing ticketId or userId');
    return;
  }

  try {
    // Clean up existing connection
    if (pusherRef.current) {
      try { 
        pusherRef.current.disconnect(); 
      } catch(e) {
        console.log('Pusher disconnect error:', e);
      }
      pusherRef.current = null;
    }

    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
      } catch(e) {
        console.log('Channel unsubscribe error:', e);
      }
      channelRef.current = null;
    }

    console.log('🔌 Initializing Pusher...');

    // Create Pusher instance - SIMPLIFIED
    const pusher = new Pusher(PUSHER_APP_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
      // Minimal configuration for React Native
    });

    pusherRef.current = pusher;

    // Connection event handlers
    pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully');
      setPusherStatus('connected');
    });

    pusher.connection.bind('disconnected', () => {
      console.log('❌ Pusher disconnected');
      setPusherStatus('disconnected');
    });

    pusher.connection.bind('error', (err) => {
      console.log('❌ Pusher connection error:', err);
      setPusherStatus('error');
    });

    pusher.connection.bind('connecting', () => {
      console.log('🔄 Pusher connecting...');
      setPusherStatus('connecting');
    });

    // Subscribe to channel
    const channelName = `ticket.${ticketId}`;
    console.log('📡 Subscribing to channel:', channelName);
    
    channelRef.current = pusher.subscribe(channelName);
    
    channelRef.current.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Successfully subscribed to channel:', channelName);
      setPusherStatus('connected');
    });

    channelRef.current.bind('pusher:subscription_error', (err) => {
      console.log('❌ Subscription error:', err);
      setPusherStatus('error');
    });

    // Listen for new messages from agent
    channelRef.current.bind('new-message', async (data) => {
      console.log('📨 New message received:', data);
      try {
        const userData = await AsyncStorage.getItem('userData');
        let localUserId = null;
        if (userData) {
          const user = JSON.parse(userData);
          localUserId = user.id;
        }

        // Skip own messages
        if (localUserId && String(data.sender_id) === String(localUserId)) {
          console.log('⏭️ Skipping own message');
          return;
        }

        // Check if agent is assigned
        if (data.sender_id && !isAgentAssigned) {
          await fetchTicketInfo(ticketId);
        }

        const senderName = data.sender?.name || agentName || 'Support Agent';
        
        const newMessage = {
          id: data.id?.toString() || Date.now().toString(),
          text: data.message || '',
          sender: 'admin',
          senderName: senderName,
          time: new Date(data.created_at || Date.now()).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
        };

        setMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
        
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (err) {
        console.log('Error processing message:', err);
      }
    });

    // Listen for agent assignment
    channelRef.current.bind('agent-assigned', (data) => {
      console.log('👤 Agent assigned:', data);
      if (data.agent_id) {
        setAgentName(data.agent_name || 'Agent');
        setIsAgentAssigned(true);
        appendMessage(`✨ ${data.agent_name || 'An Agent'} has been assigned to your ticket.`, 'system');
      }
    });

    console.log('✅ Pusher initialization complete');

  } catch (error) {
    console.log('❌ Pusher initialization error:', error);
    setPusherStatus('error');
  }
};
  // Fetch ticket info
  const fetchTicketInfo = async (ticketId) => {
    try {
      const response = await apiClient.get(`/tickets/${ticketId}`);
      if (response.data?.ticket) {
        const ticketData = response.data.ticket;
        if (ticketData.agent_id && ticketData.agent_id !== null) {
          setIsAgentAssigned(true);
          const agent = response.data.agent;
          if (agent && agent.name) {
            setAgentName(agent.name);
          }
        }
      }
    } catch (error) {
      console.log('Fetch ticket info error:', error);
    }
  };

  // Create or get existing ticket
  const createOrGetTicket = async (bookingId, issueText) => {
    try {
      const formData = new FormData();
      formData.append('booking_id', bookingId);
      formData.append('subject', issueText.substring(0, 100));
      formData.append('message', issueText);
      
      const response = await apiClient.post('/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('Create/Get Ticket Response:', response.data);
      
      if (response.data?.ticket) {
        const ticketData = response.data.ticket;
        if (ticketData.agent_id && ticketData.agent_id !== null) {
          setIsAgentAssigned(true);
          setAgentName(response.data.agent?.name || 'Agent');
        } else {
          setIsAgentAssigned(false);
          setAgentName(null);
        }
        return ticketData;
      }
      
      return null;
    } catch (error) {
      console.log('Create/Get Ticket Error:', error.response?.data);
      
      if (error.response?.data?.ticket) {
        const ticketData = error.response.data.ticket;
        if (ticketData.agent_id && ticketData.agent_id !== null) {
          setIsAgentAssigned(true);
          setAgentName(error.response.data.agent?.name || 'Agent');
        } else {
          setIsAgentAssigned(false);
          setAgentName(null);
        }
        return ticketData;
      }
      
      return null;
    }
  };

  // Fetch ticket messages
  const fetchTicketMessages = async (ticketId) => {
    setLoadingMessages(true);

    try {
      const currentUserId = await getCurrentUserId();
      const response = await apiClient.get(`/tickets/${ticketId}/messages`);

      console.log('Messages API response:', response.data);

      if (response.data?.ticket) {
        const ticketData = response.data.ticket;
        if (ticketData.agent_id && ticketData.agent_id !== null) {
          setIsAgentAssigned(true);
          if (response.data.agent?.name) {
            setAgentName(response.data.agent.name);
          } else if (ticketData.agent_name) {
            setAgentName(ticketData.agent_name);
          } else {
            setAgentName('Agent');
          }
        } else {
          setIsAgentAssigned(false);
          setAgentName(null);
        }
      }

      let messagesArray = [];

      if (response.data?.messages && Array.isArray(response.data.messages)) {
        messagesArray = response.data.messages;
      } else if (Array.isArray(response.data)) {
        messagesArray = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        messagesArray = response.data.data;
      }

      const chatMessages = messagesArray.map((msg) => {
        const isUser = String(msg.sender_id) === String(currentUserId);
        return {
          id: String(msg.id),
          text: msg.message || '',
          sender: isUser ? 'user' : 'admin',
          senderName: isUser ? 'You' : (msg.sender?.name || agentName || 'Support Agent'),
          time: new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      });

      setMessages(chatMessages);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (error) {
      console.log('Fetch messages error:', error);
    } finally {
      setLoadingMessages(false);
      setInitialLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputText.trim()) return;
    if (!currentTicketId) {
      Alert.alert('Error', 'No active ticket found');
      return;
    }
    
    const messageText = inputText.trim();
    setInputText('');
    
    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      text: messageText,
      sender: 'user',
      senderName: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isTemp: true,
    };
    
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    
    try {
      const formData = new FormData();
      formData.append('message', messageText);
      
      const response = await apiClient.post(`/tickets/${currentTicketId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('Send message response:', response.data);
      
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      await fetchTicketMessages(currentTicketId);
      
    } catch (error) {
      console.log('Send message error:', error.response?.data);
      
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      if (error.response?.data?.error === 'This ticket has been marked as closed. Conversation is closed.') {
        setIsAgentAssigned(false);
        const errorMessage = {
          id: Date.now().toString(),
          text: 'This ticket has been closed. Please create a new ticket for further assistance.',
          sender: 'system',
          senderName: 'System',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        };
        setMessages(prev => [...prev, errorMessage]);
        setCurrentTicketId(null);
        setSelectedRide(null);
        setSelectedBookingId(null);
      } else {
        const errorMessage = {
          id: Date.now().toString(),
          text: `Failed to send message: ${error.response?.data?.error || 'Unknown error'}`,
          sender: 'system',
          senderName: 'System',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  // Fetch user bookings
  const fetchUserBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await apiClient.post('/bookings');
      if (response.data.success && response.data.data) {
        const filteredBookings = response.data.data.filter(booking => 
          booking.status === 'pending' || booking.status === 'confirmed'
        );
        setBookings(filteredBookings);
      }
    } catch (error) {
      console.log('Bookings error:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch common issues
  const fetchCommonIssues = async (bookingId) => {
    setLoadingIssues(true);
    try {
      const response = await apiClient.get(`/common-issues/${bookingId}`);
      if (response.data && response.data.issues) {
        const issuesWithOthers = [
          ...response.data.issues,
          { id: 'others', question: "Others", answer: "Please describe your issue in detail below." }
        ];
        setQuickIssues(issuesWithOthers);
        setShowQuickIssues(true);
      }
    } catch (error) {
      console.log('Fetch common issues error:', error);
      const defaultIssues = [
        { id: '1', question: "Driver asked for extra cash", answer: "We will investigate this matter." },
        { id: '2', question: "Wrong route / Detour taken", answer: "We will review the trip route." },
        { id: '3', question: "Safety issue / Rude behaviour", answer: "An incident agent will contact you." },
        { id: '4', question: "Paid twice for the ride", answer: "We will review payment details." },
        { id: '5', question: "Left something in vehicle", answer: "We will contact the driver." },
        { id: 'others', question: "Others", answer: "Please describe your issue." }
      ];
      setQuickIssues(defaultIssues);
      setShowQuickIssues(true);
    } finally {
      setLoadingIssues(false);
    }
  };

  const appendMessage = (text, sender, isAction = false) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      text, 
      sender, 
      time: timeString, 
      isAction
    }]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const handleSelectTrip = (booking) => {
    setSelectedRide(booking);
    setSelectedBookingId(booking.id);
    setIsModalOpen(false);
    
    const rideDisplay = `Booking #${booking.id}`;
    appendMessage(`Selected ${rideDisplay}`, 'user');
    
    setTimeout(() => {
      appendMessage("What went wrong on this trip? Please pick an option below.", 'system');
      fetchCommonIssues(booking.id);
    }, 600);
  };

  const handleQuickIssueSelect = async (issue) => {
    setShowQuickIssues(false);
    
    if (issue.question === "Others") {
      setShowOtherIssueInput(true);
      appendMessage("Others", 'user');
      appendMessage("Please describe your issue in detail below.", 'system');
    } else {
      appendMessage(issue.question, 'user');

      setTimeout(async () => {
        const ticket = await createOrGetTicket(selectedBookingId, issue.question);
        
        if (ticket && ticket.id) {
          setCurrentTicketId(ticket.id);
          const currentUserId = await getCurrentUserId();
          await fetchTicketMessages(ticket.id);
          await initializePusher(ticket.id, currentUserId);
          
          if (!isAgentAssigned) {
            appendMessage("⏳ Your ticket has been created. You'll be able to chat once an agent is assigned to your ticket.", 'system');
          } else {
            const resolution = issue.answer || "We have received your issue. Our team will investigate and get back to you within 24 hours.";
            appendMessage(resolution, 'system');
          }
        } else {
          appendMessage("We're having trouble creating a support ticket. Please try again.", 'system');
        }
      }, 800);
    }
  };

  const submitOtherIssue = async () => {
    if (!otherIssueText.trim()) {
      Alert.alert('Error', 'Please describe your issue.');
      return;
    }
    
    setShowOtherIssueInput(false);
    appendMessage(otherIssueText, 'user');
    
    const issueText = otherIssueText;
    setOtherIssueText('');
    
    setTimeout(async () => {
      const ticket = await createOrGetTicket(selectedBookingId, issueText);
      
      if (ticket && ticket.id) {
        setCurrentTicketId(ticket.id);
        const currentUserId = await getCurrentUserId();
        await fetchTicketMessages(ticket.id);
        await initializePusher(ticket.id, currentUserId);
        
        if (!isAgentAssigned) {
          appendMessage("⏳ Your ticket has been created. You'll be able to chat once an agent is assigned to your ticket.", 'system');
        } else {
          appendMessage("Thank you for sharing. We have created a support ticket. Our team will investigate and update you within 24 hours.", 'system');
        }
      } else {
        appendMessage("We're having trouble submitting your issue. Please try again.", 'system');
      }
    }, 800);
  };

  const formatBookingDisplay = (booking) => {
    const fromLoc = booking.from_location || 'Unknown';
    const toLoc = booking.to_location || 'Unknown';
    const fare = `₹${booking.total_fee || '0'}`;
    const date = new Date(booking.booking_date).toLocaleDateString();
    
    return {
      id: `#${booking.id}`,
      date: date,
      vehicle: booking.booking_type || 'Ride',
      fare: fare,
      route: `${fromLoc} → ${toLoc}`,
      raw: booking
    };
  };

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      if (initialTicketId) {
        const currentUserId = await getCurrentUserId();
        setCurrentTicketId(initialTicketId);
        await fetchTicketMessages(initialTicketId);
        await initializePusher(initialTicketId, currentUserId);
      } else {
        await fetchUserBookings();
        setInitialLoading(false);
      }
    };
    initialize();
  }, [initialTicketId]);

  useEffect(() => {
    if (initialBookingId && bookings.length > 0 && !selectedRide && !initialTicketId) {
      const booking = bookings.find(b => b.id === parseInt(initialBookingId));
      if (booking) handleSelectTrip(booking);
    }
  }, [initialBookingId, bookings, selectedRide, initialTicketId]);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        try { 
          channelRef.current.unsubscribe(); 
        } catch(e) {
          console.log('Unsubscribe error:', e);
        }
      }
      if (pusherRef.current) {
        try { 
          pusherRef.current.disconnect(); 
        } catch(e) {
          console.log('Disconnect error:', e);
        }
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const parentNavigator = navigation.getParent();
      if (parentNavigator) {
        parentNavigator.setOptions({ tabBarStyle: { display: 'none', height: 0 } });
      }
      return () => {
        if (parentNavigator) {
          parentNavigator.setOptions({
            tabBarStyle: {
              display: 'flex',
              backgroundColor: '#FFFFFF',
              height: Platform.OS === 'ios' ? 85 : 60,
              paddingBottom: Platform.OS === 'ios' ? 20 : 8,
              paddingTop: 8,
            }
          });
        }
      };
    }, [navigation])
  );

  const availableTrips = bookings.map(booking => formatBookingDisplay(booking));
  const isAdminConnected = currentTicketId !== null;

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
      
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.chatHeaderCenter}>
          <Text style={styles.chatHeaderTitle}>Ride Help Desk</Text>
          <Text style={styles.chatHeaderSubtitle}>
            {isAdminConnected ? `● Ticket #${currentTicketId}` : 'Select a trip to start'}
          </Text>
        </View>
        <View style={styles.placeholderIcon} />
      </View>

      {/* Agent Status Bar */}
      {currentTicketId && (
        <View style={styles.agentStatusBar}>
          {isAgentAssigned && agentName ? (
            <>
              <AgentIcon />
              <Text style={styles.agentStatusText}>
                Assigned to: <Text style={styles.agentName}>{agentName}</Text>
              </Text>
              <View style={styles.statusDotOnline} />
              <Text style={styles.onlineText}>Online</Text>
            </>
          ) : (
            <>
              <View style={styles.statusDotWaiting} />
              <Text style={styles.waitingText}>Waiting for agent assignment...</Text>
            </>
          )}
        </View>
      )}

      {/* Connection Status */}
      {currentTicketId && (
        <View style={styles.statusBar}>
          <View style={[styles.statusDot, { 
            backgroundColor: pusherStatus === 'connected' ? '#34C759' : '#F5A623' 
          }]} />
          <Text style={[styles.statusText, { 
            color: pusherStatus === 'connected' ? '#34C759' : '#F5A623' 
          }]}>
            {pusherStatus === 'connected' ? '● Connected' : '○ Connecting...'}
          </Text>
          <View style={styles.ticketInfo}>
            <TicketIcon />
            <Text style={styles.ticketIdText}>Ticket #{currentTicketId}</Text>
          </View>
        </View>
      )}

      {selectedRide && !currentTicketId && (
        <View style={styles.rideContext}>
          <TaxiIcon />
          <Text style={styles.rideContextText}>
            Issue Scope: <Text style={styles.highlightText}>Booking #{selectedRide.id}</Text>
          </Text>
        </View>
      )}

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            !currentTicketId && !selectedRide ? (
              <View style={styles.systemIntroContainer}>
                <View style={styles.systemTextBubble}>
                  <Text style={styles.systemMessageText}>Welcome to Support. Please select the trip you are experiencing issues with.</Text>
                </View>
                <TouchableOpacity style={styles.actionSelectButton} onPress={() => setIsModalOpen(true)}>
                  <TaxiIcon />
                  <Text style={styles.actionSelectButtonText}>
                    {loadingBookings ? 'Loading trips...' : 'Select Trip'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            if (item.isAction || item.sender === 'system') {
              return (
                <View style={styles.systemMessageContainer}>
                  <View style={styles.systemMessageWrapper}>
                    <Text style={styles.systemMessageTextStyle}>{item.text}</Text>
                  </View>
                </View>
              );
            }

            const isUser = item.sender === 'user';
            const displayName = isUser ? 'You' : (item.senderName || agentName || 'Support Agent');
            
            return (
              <View style={[
                styles.messageRow,
                isUser ? styles.userMessageRow : styles.adminMessageRow
              ]}>
                {!isUser && (
                  <View style={styles.adminAvatar}>
                    <SupportIcon />
                  </View>
                )}
                
                <View style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.adminBubble
                ]}>
                  {!isUser && (
                    <Text style={styles.senderName}>{displayName}</Text>
                  )}
                  <Text style={[
                    styles.messageText,
                    isUser ? styles.userMessageText : styles.adminMessageText
                  ]}>
                    {item.text}
                  </Text>
                  <Text style={[
                    styles.timeText,
                    isUser ? styles.userTimeText : styles.adminTimeText
                  ]}>
                    {item.time}
                  </Text>
                </View>
                
                {isUser && <View style={styles.userSpacer} />}
              </View>
            );
          }}
        />

        {showOtherIssueInput && (
          <View style={styles.otherIssueContainer}>
            <Text style={styles.otherIssueTitle}>Describe your issue in detail</Text>
            <TextInput
              style={styles.otherIssueInput}
              placeholder="Please provide detailed information..."
              placeholderTextColor="#8E8E93"
              value={otherIssueText}
              onChangeText={setOtherIssueText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.otherIssueButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowOtherIssueInput(false);
                setOtherIssueText('');
                setShowQuickIssues(true);
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={submitOtherIssue}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showQuickIssues && selectedRide && !showOtherIssueInput && !currentTicketId && (
          <View style={styles.quickIssuesContainer}>
            <Text style={styles.quickIssuesLabel}>Select issue type:</Text>
            {loadingIssues ? (
              <ActivityIndicator color="#F5A623" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickIssuesScroll}>
                {quickIssues.map(issue => (
                  <TouchableOpacity 
                    key={issue.id} 
                    style={styles.quickIssueChip} 
                    onPress={() => handleQuickIssueSelect(issue)}
                  >
                    <Text style={styles.quickIssueText}>{issue.question}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Message Input */}
        {currentTicketId && (
          <View style={[
            styles.inputContainer,
            { 
              paddingBottom: Platform.OS === 'ios' ? (keyboardVisible ? 34 : insets.bottom + 12) : 12,
            }
          ]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#8E8E93"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendBtn, (!inputText.trim()) && styles.sendBtnDisabled]} 
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <SendIcon color={inputText.trim() ? "#F5A623" : "#48484A"} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Trip Selection Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleContainer}>
                <TicketIcon />
                <Text style={styles.modalTitle}>Your Trips</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeButton}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            {loadingBookings ? (
              <ActivityIndicator size="large" color="#F5A623" style={styles.modalLoader} />
            ) : availableTrips.length === 0 ? (
              <View style={styles.emptyTripsContainer}>
                <Text style={styles.emptyTripsText}>No pending trips found</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={fetchUserBookings}>
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {availableTrips.map(ride => (
                  <TouchableOpacity key={ride.id} style={styles.tripCard} onPress={() => handleSelectTrip(ride.raw)}>
                    <View style={styles.tripMetaRow}>
                      <View style={styles.tripIdContainer}>
                        <TicketIcon />
                        <Text style={styles.tripIdTag}>{ride.id}</Text>
                      </View>
                      <Text style={styles.tripCostText}>{ride.fare}</Text>
                    </View>
                    <Text style={styles.tripRouteText}>📍 {ride.route}</Text>
                    <Text style={styles.tripDateText}>{ride.date} • {ride.vehicle}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000',
  },
  keyboardContainer: { 
    flex: 1 
  },
  
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  backButton: { 
    padding: 4 
  },
  chatHeaderCenter: { 
    flex: 1, 
    alignItems: 'center' 
  },
  placeholderIcon: { 
    width: 32 
  },
  chatHeaderTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#FFFFFF' 
  },
  chatHeaderSubtitle: { 
    fontSize: 11, 
    color: '#F5A623', 
    marginTop: 3, 
    fontWeight: '500' 
  },
  
  agentStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#2C2C2E',
    gap: 8,
  },
  agentStatusText: {
    color: '#8E8E93',
    fontSize: 12,
    flex: 1,
  },
  agentName: {
    color: '#F5A623',
    fontWeight: '600',
  },
  statusDotOnline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  onlineText: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: '500',
  },
  statusDotWaiting: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5A623',
    marginRight: 8,
  },
  waitingText: {
    color: '#F5A623',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  statusDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    marginRight: 8 
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: '500', 
    flex: 1 
  },
  ticketInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  ticketIdText: { 
    color: '#F5A623', 
    fontSize: 11, 
    fontWeight: '600' 
  },
  
  rideContext: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#2C2C2E',
    gap: 8,
  },
  rideContextText: { 
    color: '#8E8E93', 
    fontSize: 12, 
    flex: 1 
  },
  highlightText: { 
    color: '#F5A623', 
    fontWeight: '600' 
  },
  
  messagesList: { 
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20, 
    flexGrow: 1 
  },
  
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  adminMessageRow: {
    justifyContent: 'flex-start',
  },
  
  adminAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },

  
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#F5A623',
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  
  senderName: {
    fontSize: 10,
    color: '#F5A623',
    marginBottom: 4,
    fontWeight: '600',
  },
  
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  userMessageText: {
    color: '#000000',
  },
  adminMessageText: {
    color: '#FFFFFF',
  },
  
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  userTimeText: {
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'right',
  },
  adminTimeText: {
    color: '#8E8E93',
    textAlign: 'left',
  },
  
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  systemMessageWrapper: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '85%',
  },
  systemMessageTextStyle: {
    color: '#F5A623',
    fontSize: 12,
    textAlign: 'center',
  },
  
  systemIntroContainer: { 
    marginVertical: 12, 
    alignItems: 'center', 
    width: '100%' 
  },
  systemTextBubble: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  systemMessageText: { 
    color: '#AEAEB2', 
    fontSize: 13, 
    textAlign: 'center' 
  },
  actionSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5A623',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
    gap: 8,
  },
  actionSelectButtonText: { 
    color: '#000000', 
    fontSize: 13, 
    fontWeight: '700' 
  },
  
  quickIssuesContainer: {
    backgroundColor: '#1C1C1E',
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  quickIssuesLabel: { 
    color: '#8E8E93', 
    fontSize: 12, 
    marginBottom: 8, 
    paddingHorizontal: 16, 
    fontWeight: '500' 
  },
  quickIssuesScroll: { 
    paddingLeft: 16, 
    paddingRight: 16 
  },
  quickIssueChip: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickIssueText: { 
    color: '#FFFFFF', 
    fontSize: 12, 
    fontWeight: '500' 
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  input: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: '#2C2C2E',
    maxHeight: 90,
  },
  sendBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#2C2C2E', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sendBtnDisabled: { 
    opacity: 0.6 
  },
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'flex-end' 
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  modalTitleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  modalTitle: { 
    color: '#FFF', 
    fontSize: 20, 
    fontWeight: '700' 
  },
  closeButton: { 
    padding: 4 
  },
  modalLoader: { 
    marginVertical: 40 
  },
  
  tripCard: { 
    backgroundColor: '#2C2C2E', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 12 
  },
  tripMetaRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  tripIdContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  tripIdTag: { 
    color: '#F5A623', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  tripCostText: { 
    color: '#F5A623', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  tripRouteText: { 
    color: '#FFF', 
    fontSize: 13, 
    marginVertical: 6 
  },
  tripDateText: { 
    color: '#8E8E93', 
    fontSize: 11 
  },
  
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#000000', 
  },
  loadingText: { 
    color: '#8E8E93', 
    marginTop: 12, 
    fontSize: 14 
  },
  emptyTripsContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 40 
  },
  emptyTripsText: { 
    color: '#8E8E93', 
    fontSize: 14, 
    marginBottom: 16, 
    textAlign: 'center' 
  },
  refreshButton: { 
    backgroundColor: '#F5A623', 
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  refreshButtonText: { 
    color: '#000', 
    fontWeight: '600' 
  },
  
  otherIssueContainer: { 
    backgroundColor: '#1C1C1E', 
    padding: 16, 
    margin: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#F5A623' 
  },
  otherIssueTitle: { 
    color: '#F5A623', 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 12 
  },
  otherIssueInput: { 
    backgroundColor: '#000000', 
    borderRadius: 8, 
    padding: 12, 
    color: '#FFFFFF', 
    fontSize: 14, 
    minHeight: 100 
  },
  otherIssueButtons: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 12, 
    gap: 12 
  },
  cancelButton: { 
    backgroundColor: '#2C2C2E', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  submitButton: { 
    backgroundColor: '#F5A623', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  cancelButtonText: { 
    color: '#FFFFFF', 
    fontSize: 14 
  },
  submitButtonText: { 
    color: '#000000', 
    fontSize: 14, 
    fontWeight: '600' 
  },
});

export default ChatScreen;