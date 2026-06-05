import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { AuthContext } from '../../App';
import apiClient from '../services/apiConfig';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// ==================== SVG ICONS COMPONENTS ====================
const ChevronRightIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M9 5L15 12L9 19" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PhoneIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PrivacyIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SafetyIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TermsIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const LogoutIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H9" stroke="#FF453A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M16 17L21 12L16 7" stroke="#FF453A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M21 12H9" stroke="#FF453A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const EmailIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#8E8E93" strokeWidth="2"/>
    <Path d="m22 6-10 7L2 6" stroke="#8E8E93" strokeWidth="2"/>
  </Svg>
);

const PhoneIconSmall = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="#8E8E93" strokeWidth="2"/>
  </Svg>
);

const CameraIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="13" r="4" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CloseIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CheckIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const WhatsAppIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Svg>
);

const WebIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <Path d="M2 12h20" />
  </Svg>
);

const ProfileScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { setIsLoggedIn } = useContext(AuthContext);
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  
  // Edit profile states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // New Custom Bottom Sheet Modal Visibilities
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalContent, setLegalContent] = useState({ title: '', body: '' });

  // Animation Timing Drivers
  const editSlideAnim = useRef(new Animated.Value(height)).current;
  const contactSlideAnim = useRef(new Animated.Value(height)).current;
  const logoutSlideAnim = useRef(new Animated.Value(height)).current;
  const legalSlideAnim = useRef(new Animated.Value(height)).current;

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => { fetchUserData(); }, []);

  useEffect(() => { triggerAnimation(editModalVisible, editSlideAnim); }, [editModalVisible]);
  useEffect(() => { triggerAnimation(contactModalVisible, contactSlideAnim); }, [contactModalVisible]);
  useEffect(() => { triggerAnimation(logoutModalVisible, logoutSlideAnim); }, [logoutModalVisible]);
  useEffect(() => { triggerAnimation(legalModalVisible, legalSlideAnim); }, [legalModalVisible]);

  const triggerAnimation = (visible, animValue) => {
    Animated.timing(animValue, {
      toValue: visible ? 0 : height,
      duration: visible ? 300 : 250,
      useNativeDriver: true,
    }).start();
  };

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        setUserData(parsedData);
        setEditName(parsedData.name || '');
        setEditPhone(parsedData.phone || '');
        if (parsedData.profile_photo) setProfileImage(parsedData.profile_photo);
      }

      const response = await apiClient.get('/user');
      if (response.data && response.data.success) {
        const user = response.data.data;
        console.log('Fetched user data:', user);
        setUserData(user);
        setEditName(user.name || '');
        setEditPhone(user.phone || '');
        if (user.address) setProfileImage(user.address);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleDisplay = (role) => {
    if (!role) return 'Verified User';
    if (role === 'driver') return 'Verified Driver';
    if (role === 'admin') return 'Admin';
    return role;
  };

  const selectImage = () => {
    const options = { mediaType: 'photo', includeBase64: false, maxHeight: 500, maxWidth: 500, quality: 0.8 };
    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setProfileImage(asset.uri);
        setProfileImageFile({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        });
      }
    });
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('name', editName);
      if (editPhone) {
        formData.append('phone', editPhone);
      }
      if (profileImageFile) {
        formData.append('profile_photo', profileImageFile);
      }

      const response = await apiClient.post('/user-update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.success) {
        const updatedUser = { 
          ...userData, 
          name: editName, 
          phone: editPhone || userData?.phone,
          profile_photo: response.data.data?.profile_photo || profileImage 
        };
        setUserData(updatedUser);
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        showToast(response.data.message || 'Profile updated successfully', 'success');
        setTimeout(() => setEditModalVisible(false), 1500);
      } else {
        showToast(response.data?.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        showToast(Array.isArray(firstError) ? firstError[0] : firstError, 'error');
      } else {
        showToast('Failed to update profile. Please try again.', 'error');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const performLogoutDataFlush = async () => {
    setIsLoggingOut(true);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setLogoutModalVisible(false);
      setIsLoggedIn(false);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

  const openLegalModal = (type) => {
    let title = '', body = '';
    if (type === 'privacy') {
      title = 'Privacy Policy';
      body = 'Your security data infrastructure remains strictly audited. Personal operational background logs are cached inside safe local storage modules securely encrypted.\n\nWe do not map runtime analytics parameters to public nodes.';
    } else if (type === 'safety') {
      title = 'Safety Policy';
      body = 'Active tracking operations configure dynamic foreground processes keeping operational telemetry reliable.\n\nAlways secure parameters properly prior to shifting deployment operations into transport runtime execution context.';
    } else {
      title = 'Terms & Conditions';
      body = 'Usage elements specify that all components match legal structures explicitly configured within platform rates rules configurations.\n\nUnauthorized profile cloning directly terminates secure session verification indices.';
    }
    setLegalContent({ title, body });
    setLegalModalVisible(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5A623" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
      <View style={styles.header}><Text style={styles.headerTitle}>Account Settings</Text></View>

      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: Math.max(insets.bottom, 16) + 64 }]} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header Block */}
        <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : userData?.profile_photo ? (
              <Image source={{ uri: userData.profile_photo }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(userData?.name)}</Text>
            )}
            <View style={styles.cameraIconContainer}><CameraIcon /></View>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{userData?.name || 'User Name'}</Text>
            <View style={styles.userInfoRow}><EmailIcon /><Text style={styles.profileEmail}>{userData?.email || 'user@example.com'}</Text></View>
            <View style={styles.userInfoRow}><PhoneIconSmall /><Text style={styles.profilePhone}>{userData?.phone || 'Not provided'}</Text></View>
            <View style={styles.statusBadge}><Text style={styles.statusText}>{getRoleDisplay(userData?.role)}</Text></View>
          </View>
          <View style={styles.editBadge}><Text style={styles.editBadgeText}>Edit</Text></View>
        </TouchableOpacity>

        {/* General Preferences Block */}
        <Text style={styles.sectionLabel}>General Settings</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={[styles.menuItem, styles.noBorder]} onPress={() => setContactModalVisible(true)}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconWrapper}><PhoneIcon /></View>
              <Text style={styles.menuItemText}>Contact Us</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Legal Functional Block */}
        <Text style={styles.sectionLabel}>Legal & Compliance</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => openLegalModal('privacy')}>
            <View style={styles.menuItemLeft}><View style={styles.iconWrapper}><PrivacyIcon /></View><Text style={styles.menuItemText}>Privacy Policy</Text></View>
            <ChevronRightIcon />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => openLegalModal('safety')}>
            <View style={styles.menuItemLeft}><View style={styles.iconWrapper}><SafetyIcon /></View><Text style={styles.menuItemText}>Safety Policy</Text></View>
            <ChevronRightIcon />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.noBorder]} onPress={() => openLegalModal('terms')}>
            <View style={styles.menuItemLeft}><View style={styles.iconWrapper}><TermsIcon /></View><Text style={styles.menuItemText}>Terms & Conditions</Text></View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Session Security Block */}
        <Text style={styles.sectionLabel}>Session Management</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={[styles.menuItem, styles.noBorder]} onPress={() => setLogoutModalVisible(true)}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconWrapper, styles.logoutIconWrapper]}><LogoutIcon /></View>
              <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.appVersionText}>Version 2.4.1 (Build 2026)</Text>
      </ScrollView>

      {/* ==================== BOTTOM SHEET MODALS CONTAINER ==================== */}

      {/* 1. Edit Profile Sheet */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.modalContent, { transform: [{ translateY: editSlideAnim }] }]}>
                <View style={styles.sheetHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  <TouchableOpacity onPress={() => setEditModalVisible(false)}><CloseIcon /></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <TouchableOpacity style={styles.editAvatarContainer} onPress={selectImage}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.editAvatarImage} />
                    ) : userData?.profile_photo ? (
                      <Image source={{ uri: userData.profile_photo }} style={styles.editAvatarImage} />
                    ) : (
                      <View style={styles.editAvatarPlaceholder}>
                        <Text style={styles.editAvatarText}>{getInitials(editName)}</Text>
                      </View>
                    )}
                    <View style={styles.editCameraIcon}><CameraIcon /></View>
                    
                  </TouchableOpacity>
                  <View style={styles.editInputWrapper}>
                    <Text style={styles.editLabel}>Full Name</Text>
                    <TextInput 
                      style={styles.editInput} 
                      placeholder="Enter your name" 
                      placeholderTextColor="#8E8E93" 
                      value={editName} 
                      onChangeText={setEditName} 
                    />
                  </View>
                  <View style={styles.editInputWrapper}>
                    <Text style={styles.editLabel}>Phone Number</Text>
                    <TextInput 
                      style={styles.editInput} 
                      placeholder="Enter your phone number" 
                      placeholderTextColor="#8E8E93" 
                      value={editPhone} 
                      onChangeText={setEditPhone} 
                      keyboardType="phone-pad" 
                    />
                  </View>
                  <View style={styles.editInputWrapper}>
                    <Text style={styles.editLabel}>Email Address</Text>
                    <TextInput 
                      style={[styles.editInput, styles.readOnlyInput]} 
                      value={userData?.email} 
                      editable={false} 
                    />
                  </View>
                  <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile} disabled={isUpdating}>
                    {isUpdating ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <>
                        <CheckIcon />
                        <Text style={styles.updateButtonText}>Update Profile</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 2. Contact Us Bottom Sheet */}
      <Modal visible={contactModalVisible} transparent animationType="fade" onRequestClose={() => setContactModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setContactModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.modalContent, { transform: [{ translateY: contactSlideAnim }] }]}>
                <View style={styles.sheetHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Contact Us</Text>
                  <TouchableOpacity onPress={() => setContactModalVisible(false)}><CloseIcon /></TouchableOpacity>
                </View>
                
                <View style={styles.contactContainer}>
                  <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('tel:+1234567890')}>
                    <View style={styles.iconWrapper}><PhoneIcon /></View>
                    <View><Text style={styles.contactLabel}>Call Center</Text><Text style={styles.contactValue}>+1 (234) 567-890</Text></View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('whatsapp://send?phone=1234567890')}>
                    <View style={styles.iconWrapper}><WhatsAppIcon /></View>
                    <View><Text style={styles.contactLabel}>WhatsApp Support</Text><Text style={styles.contactValue}>+1 (234) 567-890</Text></View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('mailto:support@platform.com')}>
                    <View style={styles.iconWrapper}><EmailIcon /></View>
                    <View><Text style={styles.contactLabel}>Email Support</Text><Text style={styles.contactValue}>support@platform.com</Text></View>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.contactItem, styles.noBorder]} onPress={() => Linking.openURL('https://platform.com')}>
                    <View style={styles.iconWrapper}><WebIcon /></View>
                    <View><Text style={styles.contactLabel}>Official Website</Text><Text style={styles.contactValue}>www.platform.com</Text></View>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 3. Legal & Compliance Full View Bottom Sheet */}
      <Modal visible={legalModalVisible} transparent animationType="fade" onRequestClose={() => setLegalModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setLegalModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.modalContent, styles.fullModalContent, { transform: [{ translateY: legalSlideAnim }] }]}>
                <View style={styles.sheetHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{legalContent.title}</Text>
                  <TouchableOpacity onPress={() => setLegalModalVisible(false)}><CloseIcon /></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.legalScroll}>
                  <Text style={styles.legalBodyText}>{legalContent.body}</Text>
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 4. Logout Confirmation Bottom Sheet */}
      <Modal visible={logoutModalVisible} transparent animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setLogoutModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.modalContent, { transform: [{ translateY: logoutSlideAnim }] }]}>
                <View style={styles.sheetHandle} />
                <Text style={styles.confirmTitle}>Confirm Logout</Text>
                <Text style={styles.confirmSubtitle}>Are you sure you want to log out of your session? You will need to re-verify credentials to re-enter application modules.</Text>
                
                <View style={styles.confirmActionRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setLogoutModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.destructiveBtn} onPress={performLogoutDataFlush} disabled={isLoggingOut}>
                    {isLoggingOut ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.destructiveBtnText}>Log Out</Text>}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Toast Notification */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity, backgroundColor: toastType === 'success' ? '#2E7D32' : '#C62828' }]}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { backgroundColor: '#1C1C1E', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 0.5, borderColor: '#2C2C2E' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  scrollContainer: { padding: 16 },
  profileCard: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24, borderWidth: 0.5, borderColor: '#2C2C2E', position: 'relative' },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F5A623', justifyContent: 'center', alignItems: 'center', marginRight: 16, position: 'relative' },
  avatarImage: { width: 70, height: 70, borderRadius: 35 },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#000000' },
  cameraIconContainer: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#ffffff', borderRadius: 15, padding: 4 },
  profileMeta: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  profileEmail: { fontSize: 12, color: '#8E8E93' },
  profilePhone: { fontSize: 12, color: '#8E8E93' },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(52, 199, 89, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  statusText: { color: '#34C759', fontSize: 11, fontWeight: '600' },
  editBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  editBadgeText: { color: '#000000', fontSize: 11, fontWeight: '600' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  menuContainer: { backgroundColor: '#1C1C1E', borderRadius: 16, borderWidth: 0.5, borderColor: '#2C2C2E', marginBottom: 24, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderColor: '#2C2C2E' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrapper: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  logoutIconWrapper: { backgroundColor: 'rgba(255, 69, 58, 0.1)' },
  menuItemText: { fontSize: 15, color: '#FFFFFF', fontWeight: '500' },
  logoutText: { color: '#FF453A', fontWeight: '600' },
  noBorder: { borderBottomWidth: 0 },
  appVersionText: { textAlign: 'center', color: '#48484A', fontSize: 12, marginTop: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFFFFF', marginTop: 12, fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 26, width: width },
  fullModalContent: { height: height * 0.85 },
  sheetHandle: { width: 42, height: 5, backgroundColor: '#48484A', borderRadius: 2.5, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  
  editAvatarContainer: { alignItems: 'center', marginBottom: 24 },
  editAvatarImage: { width: 100, height: 100, borderRadius: 50 },
  editAvatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  editAvatarText: { fontSize: 36, fontWeight: '700', color: '#000000' },
  editCameraIcon: { position: 'absolute', bottom: 0, right: width * 0.32, backgroundColor: '#ffffff', borderRadius: 20, padding: 6 },
  changePhotoText: { color: '#F5A623', fontSize: 12, marginTop: 8 },
  editInputWrapper: { marginBottom: 16 },
  editLabel: { color: '#8E8E93', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  editInput: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#FFFFFF', fontSize: 15 },
  readOnlyInput: { opacity: 0.6 },
  updateButton: { backgroundColor: '#F5A623', borderRadius: 28, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, marginBottom: 10 },
  updateButtonText: { color: '#000000', fontSize: 16, fontWeight: '600' },
  
  contactContainer: { marginVertical: 8 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderBottomWidth: 0.5, borderColor: '#2C2C2E' },
  contactLabel: { color: '#8E8E93', fontSize: 12, marginBottom: 2 },
  contactValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  
  legalScroll: { paddingBottom: 30 },
  legalBodyText: { color: '#E5E5EA', fontSize: 15, lineHeight: 24, textAlign: 'justify' },
  
  confirmTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
  confirmSubtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  confirmActionRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  cancelBtn: { flex: 1, backgroundColor: '#2C2C2E', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  destructiveBtn: { flex: 1, backgroundColor: '#FF453A', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  destructiveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  
  toastContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, left: 20, right: 20, paddingVertical: 14, borderRadius: 12, zIndex: 99999, justifyContent: 'center', alignItems: 'center' },
  toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});

export default ProfileScreen;