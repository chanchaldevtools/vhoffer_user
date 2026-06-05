// src/services/authService.js
import apiClient from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginUser = async (email, password) => {
  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const response = await apiClient.post('/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      await AsyncStorage.setItem('userToken', response.data.data.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
      
      return {
        success: true,
        message: response.data.message || 'Login successful!',
        user: response.data.data.user,
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Login failed',
        errors: response.data.errors || {},
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.response) {
      // Server responded with error
      const { data } = error.response;
      return {
        success: false,
        message: data.message || 'Login failed',
        errors: data.errors || {},
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        errors: {},
      };
    } else {
      // Something else happened
      return {
        success: false,
        message: 'An error occurred. Please try again.',
        errors: {},
      };
    }
  }
};

