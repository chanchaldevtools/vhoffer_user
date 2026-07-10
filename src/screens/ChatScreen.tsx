// screens/ChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
  Linking,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { database } from '../services/config/firebase';
import {
  ref,
  get,
  set,
  update,
  push,
  onChildAdded,
  off,
  onValue
} from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const CallIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.76 15.51 20 15.51C20.55 15.51 21 15.96 21 16.51V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </Svg>
);

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const isMounted = useRef(true);
  
  const { driver, booking } = route.params || {};
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [userId, setUserId] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: Generate chat ID based on booking ID
  const generateChatId = (bookingId) => {
    return `booking_${bookingId}`;
  };

  const getCurrentUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      console.log('📱 User Data from AsyncStorage:', userData);
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        return user.id;
      }
      return null;
    } catch (error) {
      console.log('Error getting user ID:', error);
      return null;
    }
  };

  // ✅ FIXED: Initialize Firebase chat with booking ID
  const initializeChat = async (userId, driverId, bookingId) => {
    try {
      console.log('🚀 Initializing chat with:', { userId, driverId, bookingId });
      
      if (!bookingId) {
        console.log('❌ No booking ID provided');
        Alert.alert('Error', 'Booking information missing');
        return;
      }
      
      const newChatId = generateChatId(bookingId);
      setChatId(newChatId);
      console.log('💬 Chat ID (based on booking):', newChatId);
      
      const chatRef = ref(database, `chats/${newChatId}`);
      console.log('📡 Fetching chat snapshot...');

      // Set timeout to avoid infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DATABASE_TIMEOUT')), 8000)
      );

      const chatSnapshot = await Promise.race([
        get(chatRef),
        timeoutPromise
      ]);
      
      console.log('📁 Chat exists?', chatSnapshot.exists());
      
      if (!chatSnapshot.exists()) {
        const chatData = {
          user_id: userId,
          driver_id: driverId,
          driver_name: driver?.name || 'Driver',
          driver_phone: driver?.phone || '',
          booking_id: bookingId,
          created_at: Date.now(),
          last_message: '',
          last_message_time: Date.now(),
          last_message_sender: null
        };
        console.log('📝 Creating new chat with data:', chatData);
        await set(chatRef, chatData);
        console.log('✅ New chat created');
        
        const messagesRef = ref(database, `chats/${newChatId}/messages`);
        const welcomeMessageRef = push(messagesRef);
        await set(welcomeMessageRef, {
          message: `Hello! I'm ${driver?.name || 'your driver'}. I'm on my way to your location.`,
          sender_id: driverId,
          receiver_id: userId,
          timestamp: Date.now()
        });
        console.log('✅ Welcome message added');
      }
      
      const messagesRef = ref(database, `chats/${newChatId}/messages`);
      
      // Load existing messages
      const existingMessagesSnapshot = await get(messagesRef);
      const messagesData = existingMessagesSnapshot.val();
      console.log('📋 Messages data:', messagesData);
      
      let messagesList = [];
      if (messagesData) {
        messagesList = Object.keys(messagesData).map(key => ({
          id: key,
          ...messagesData[key]
        })).sort((a, b) => a.timestamp - b.timestamp);
        console.log('📋 Loaded', messagesList.length, 'existing messages');
        messagesList.forEach(msg => {
          console.log(`  - ${msg.sender_id === userId ? 'Me' : 'Driver'}: ${msg.message}`);
        });
      } else {
        console.log('No existing messages found');
      }
      
      if (isMounted.current) {
        setMessages(messagesList);
        setLoading(false); 
        console.log('🔓 Loading set to FALSE, messages count:', messagesList.length);
      }

      // Remove existing listener
      if (unsubscribeRef.current) {
        console.log('Removing existing listener');
        unsubscribeRef.current();
      }
      
      // ✅ Setup new listener for real-time messages
      const listenerCallback = onChildAdded(messagesRef, (snapshot) => {
        const message = { id: snapshot.key, ...snapshot.val() };
        console.log('📨 REAL-TIME MESSAGE RECEIVED:', message);
        
        if (isMounted.current) {
          setMessages(prev => {
            if (prev.some(msg => msg.id === message.id)) return prev;
            const newMessages = [...prev, message].sort((a, b) => a.timestamp - b.timestamp);
            console.log('Updated messages count:', newMessages.length);
            return newMessages;
          });
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });

      // Store unsubscribe function
      unsubscribeRef.current = () => off(messagesRef, 'child_added', listenerCallback);
      
      console.log('👂 Listener setup complete');
      
    } catch (error) {
      console.log('❌ Initialize chat error:', error.message);
      
      if (isMounted.current) {
        setLoading(false);
        if (error.message === 'DATABASE_TIMEOUT') {
          Alert.alert(
            "Connection Warning", 
            "Database connection is slow. Please check your internet connection."
          );
        }
      }
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputText.trim() || sendingMessage || !chatId) return;
    
    const driverId = driver?.id || driver?.driver_id;
    const messageText = inputText;
    setInputText('');
    setSendingMessage(true);
    
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);
    const timestamp = Date.now();
    
    const newMessage = {
      message: messageText,
      sender_id: userId,
      receiver_id: driverId,
      timestamp: timestamp
    };
    
    console.log('📤 Sending message:', newMessage);
    
    try {
      await set(newMessageRef, newMessage);
      console.log('✅ Message sent successfully');
      
      // Update last message in chat metadata
      const chatRef = ref(database, `chats/${chatId}`);
      await update(chatRef, {
        last_message: messageText,
        last_message_time: timestamp,
        last_message_sender: userId
      });
      
    } catch (error) {
      console.log('❌ Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      if (isMounted.current) {
        setSendingMessage(false);
      }
    }
  };
  
  // ✅ FIXED: Initialize screen with booking ID
  useEffect(() => {
    isMounted.current = true;
    
    const init = async () => {
      try {
        const currentUserId = await getCurrentUserId();
        const driverId = driver?.id || driver?.driver_id;
        const bookingId = booking?.id;
        
        console.log('🔍 Initialization check:', { currentUserId, driverId, bookingId });
        
        if (!currentUserId) {
          console.log('❌ No user ID found');
          if (isMounted.current) {
            setLoading(false);
            Alert.alert('Error', 'Please login again');
            navigation.goBack();
          }
          return;
        }
        
        if (!driverId) {
          console.log('❌ No driver ID found');
          if (isMounted.current) {
            setLoading(false);
            Alert.alert('Error', 'Driver information missing');
            navigation.goBack();
          }
          return;
        }
        
        if (!bookingId) {
          console.log('❌ No booking ID found');
          if (isMounted.current) {
            setLoading(false);
            Alert.alert('Error', 'Booking information missing');
            navigation.goBack();
          }
          return;
        }
        
        await initializeChat(currentUserId, driverId, bookingId);
      } catch (error) {
        console.log('❌ Initialization error:', error);
        if (isMounted.current) {
          setLoading(false);
          Alert.alert('Error', 'Failed to load chat');
          navigation.goBack();
        }
      }
    };
    
    init();
    
    return () => {
      console.log('🧹 Cleaning up ChatScreen');
      isMounted.current = false;
      if (unsubscribeRef.current) {
        console.log('Removing Firebase listener');
        unsubscribeRef.current();
      }
    };
  }, []); // ✅ Empty dependency array - runs once on mount
  
  // Keyboard listeners
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      if (isMounted.current) {
        setKeyboardVisible(true);
        setTimeout(() => {
          if (flatListRef.current && isMounted.current) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      if (isMounted.current) {
        setKeyboardVisible(false);
      }
    });
    
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  
  // Hide bottom tabs
  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none', height: 0 } });
    }
    return () => {
      if (parent) {
        parent.setOptions({
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
  }, [navigation]);
  
  const renderMessage = ({ item }) => {
    const isUser = item.sender_id === userId;
    
    return (
      <View style={[
        styles.messageRow,
        isUser ? styles.userMessageRow : styles.driverMessageRow
      ]}>
        {!isUser && (
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {driver?.name?.charAt(0) || 'D'}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.driverBubble
        ]}>
          {!isUser && (
            <Text style={styles.senderName}>{driver?.name}</Text>
          )}
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.driverMessageText
          ]}>
            {item.message || item.text}
          </Text>
          <Text style={styles.timeText}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        {isUser && <View style={styles.userSpacer} />}
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{driver?.name || 'Driver'}</Text>
          <Text style={styles.headerSubtitle}>Online</Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => {
            if (driver?.phone) {
              Linking.openURL(`tel:${driver.phone}`);
            } else {
              Alert.alert('Error', 'Phone number not available');
            }
          }} 
          style={styles.callButton}
        >
          <CallIcon />
        </TouchableOpacity>
      </View>
      
      {/* Booking Info */}
      {booking && (
        <View style={styles.bookingInfoBar}>
          <Text style={styles.bookingInfoText}>
            Booking #{booking?.id} • {booking?.from_location || 'Pickup'} → {booking?.to_location || 'Dropoff'}
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
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (flatListRef.current && isMounted.current) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          onLayout={() => {
            if (flatListRef.current && isMounted.current) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          }
        />
        
        {/* Input Footer */}
        <View style={[
          styles.inputContainer,
          { 
            paddingBottom: Platform.OS === 'ios' ? (keyboardVisible ? 34 : insets.bottom + 12) : 12,
          }
        ]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#8E8E93"
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!sendingMessage}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!inputText.trim() || sendingMessage) && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!inputText.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#F5A623" />
            ) : (
              <SendIcon color={inputText.trim() ? "#F5A623" : "#48484A"} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  keyboardContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  backButton: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 11, color: '#34C759', marginTop: 3, fontWeight: '500' },
  callButton: { padding: 8 },
  bookingInfoBar: {
    backgroundColor: '#121214',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#2C2C2E',
  },
  bookingInfoText: { color: '#F5A623', fontSize: 11, textAlign: 'center' },
  messagesList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, flexGrow: 1 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  userMessageRow: { justifyContent: 'flex-end' },
  driverMessageRow: { justifyContent: 'flex-start' },
  driverAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5A623',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  driverAvatarText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  
  messageBubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  userBubble: { backgroundColor: '#F5A623', borderBottomRightRadius: 4 },
  driverBubble: { backgroundColor: '#1C1C1E', borderBottomLeftRadius: 4, borderWidth: 0.5, borderColor: '#2C2C2E' },
  senderName: { fontSize: 10, color: '#F5A623', marginBottom: 4, fontWeight: '600' },
  messageText: { fontSize: 14, lineHeight: 19 },
  userMessageText: { color: '#000000' },
  driverMessageText: { color: '#FFFFFF' },
  timeText: { fontSize: 10, marginTop: 4, color: '#efeff0', textAlign: 'left' },
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
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.6 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  loadingText: { color: '#FFFFFF', marginTop: 12, fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { color: '#8E8E93', fontSize: 14, textAlign: 'center' },
});

export default ChatScreen;