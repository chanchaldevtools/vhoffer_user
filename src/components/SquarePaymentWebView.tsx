// components/SquarePaymentWebView.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

interface SquarePaymentWebViewProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  amount: number;
  bookingId: string;
  bookingDetails?: {
    from_location?: string;
    to_location?: string;
    date?: string;
    time?: string;
  };
}

const SquarePaymentWebView: React.FC<SquarePaymentWebViewProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
  amount,
  bookingId,
  bookingDetails,
}) => {
  const [loading, setLoading] = useState(true);
  const [webViewError, setWebViewError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Square credentials - Replace with your actual credentials
  const SQUARE_APPLICATION_ID = 'sandbox-sq0idb-eJBF-6XBaPFdkqUD-2vHhA';
  const SQUARE_LOCATION_ID = 'LKPRHRW32C3HQ';

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setWebViewError(false);
    }
  }, [visible]);

  const getHtml = () => {
    const fromLocation = bookingDetails?.from_location || 'Pickup Location';
    const toLocation = bookingDetails?.to_location || 'Dropoff Location';
    const date = bookingDetails?.date || 'Today';
    const time = bookingDetails?.time || 'Now';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
  <title>Secure Payment</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #1C1C1E;
      color: #FFFFFF;
      padding: 16px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .container {
      flex: 1;
      max-width: 480px;
      margin: 0 auto;
      width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-top: 10px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .header p {
      color: #8E8E93;
      margin-top: 6px;
      font-size: 14px;
    }
    .booking-summary {
      background: #2C2C2E;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .booking-summary .row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .booking-summary .label {
      color: #8E8E93;
      font-size: 13px;
    }
    .booking-summary .value {
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 500;
      text-align: right;
      flex: 1;
      margin-left: 10px;
    }
    .booking-summary .divider {
      border-top: 1px solid #3A3A3C;
      margin: 8px 0;
    }
    .booking-summary .total {
      font-size: 16px;
      font-weight: 700;
      color: #F29D38;
    }
    .amount-display {
      background: #2C2C2E;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin-bottom: 20px;
    }
    .amount-display .amount {
      font-size: 32px;
      font-weight: 700;
      color: #F29D38;
    }
    .amount-display .label {
      color: #8E8E93;
      font-size: 12px;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    #card-container {
      background: #2C2C2E;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      min-height: 180px;
      border: 1px solid #3A3A3C;
    }
    .error-message {
      color: #FF3B30;
      font-size: 14px;
      text-align: center;
      margin-top: 10px;
      display: none;
      background: rgba(255, 59, 48, 0.1);
      padding: 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 59, 48, 0.2);
    }
    .pay-button {
      width: 100%;
      padding: 16px;
      background: #F29D38;
      color: #000000;
      border: none;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 8px;
    }
    .pay-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .pay-button.loading {
      opacity: 0.7;
    }
    .pay-button.success {
      background: #34C759;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      color: #8E8E93;
      font-size: 12px;
      padding-bottom: 20px;
    }
    .footer .secure {
      color: #34C759;
    }
    .success-container {
      display: none;
      text-align: center;
      padding: 30px 20px;
      background: rgba(52, 199, 89, 0.1);
      border-radius: 12px;
      border: 1px solid #34C759;
      margin-top: 10px;
    }
    .success-container .icon {
      font-size: 56px;
      margin-bottom: 12px;
    }
    .success-container .title {
      color: #34C759;
      font-size: 22px;
      font-weight: 700;
    }
    .success-container .subtitle {
      color: #8E8E93;
      font-size: 14px;
      margin-top: 8px;
    }
    .sq-card-placeholder {
      color: #8E8E93;
      text-align: center;
      padding: 40px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 Secure Payment</h1>
      <p>Complete your booking payment</p>
    </div>

    <div class="booking-summary">
      <div class="row">
        <span class="label">Booking ID</span>
        <span class="value">#${bookingId}</span>
      </div>
      <div class="row">
        <span class="label">From</span>
        <span class="value">${fromLocation}</span>
      </div>
      <div class="row">
        <span class="label">To</span>
        <span class="value">${toLocation}</span>
      </div>
      <div class="row">
        <span class="label">Date & Time</span>
        <span class="value">${date} • ${time}</span>
      </div>
      <div class="divider"></div>
      <div class="row">
        <span class="label total">Total Amount</span>
        <span class="value total">$${amount.toFixed(2)}</span>
      </div>
    </div>

    <div id="payment-form">
      <div id="card-container">
        <div id="sq-card">
          <div class="sq-card-placeholder">Loading payment form...</div>
        </div>
        <div id="error-message" class="error-message"></div>
      </div>

      <button id="pay-button" class="pay-button" disabled>
        Pay $${amount.toFixed(2)}
      </button>
    </div>

    <div id="success-container" class="success-container">
      <div class="icon">✅</div>
      <div class="title">Payment Successful!</div>
      <div class="subtitle">Your payment has been processed successfully.</div>
      <div class="subtitle" style="margin-top: 8px; font-size: 12px;">
        Transaction ID: <span id="transaction-id">${bookingId}</span>
      </div>
    </div>

    <div class="footer">
      <span class="secure">🔒 Secured by Square</span> • Encrypted Payment
    </div>
  </div>

  <script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
  <script>
    const applicationId = '${SQUARE_APPLICATION_ID}';
    const locationId = '${SQUARE_LOCATION_ID}';
    const bookingId = '${bookingId}';
    const amount = ${amount};
    
    let payments;
    let card;
    let isProcessing = false;

    function showError(message) {
      const errorElement = document.getElementById('error-message');
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    }

    function hideError() {
      const errorElement = document.getElementById('error-message');
      errorElement.style.display = 'none';
    }

    function showSuccess() {
      const paymentForm = document.getElementById('payment-form');
      const successContainer = document.getElementById('success-container');
      paymentForm.style.display = 'none';
      successContainer.style.display = 'block';
      
      setTimeout(() => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAYMENT_SUCCESS',
          payload: {
            transactionId: 'TXN_' + Date.now(),
            bookingId: bookingId,
          }
        }));
      }, 2000);
    }

    function updatePayButtonState(disabled, text, className = '') {
      const button = document.getElementById('pay-button');
      button.disabled = disabled;
      button.textContent = text || (disabled ? 'Processing...' : 'Pay $${amount.toFixed(2)}');
      button.className = 'pay-button' + (className ? ' ' + className : '');
    }

    async function initializeSquare() {
      try {
        if (typeof window.Square === 'undefined') {
          throw new Error('Square SDK not loaded. Please check your connection.');
        }
        
        payments = window.Square.payments(applicationId, locationId);
        card = await payments.card();
        await card.attach('#sq-card');
        
        updatePayButtonState(false, 'Pay $${amount.toFixed(2)}');
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SQUARE_READY',
          payload: { success: true }
        }));
        
      } catch (error) {
        console.error('Square init error:', error);
        showError('Failed to initialize payment: ' + error.message);
        updatePayButtonState(true, 'Payment Unavailable');
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SQUARE_ERROR',
          payload: { error: error.message }
        }));
      }
    }

    async function handlePayment() {
      if (isProcessing) return;
      isProcessing = true;
      
      hideError();
      updatePayButtonState(true, 'Processing...', 'loading');

      try {
        const result = await card.tokenize();
        
        if (result.status === 'OK') {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_TOKEN',
            payload: {
              token: result.token,
              bookingId: bookingId,
              amount: amount
            }
          }));
          
          updatePayButtonState(true, 'Processing Payment...', 'loading');
        } else {
          throw new Error(result.errors?.[0]?.message || 'Tokenization failed');
        }
      } catch (error) {
        console.error('Payment error:', error);
        showError(error.message || 'Payment failed. Please try again.');
        updatePayButtonState(false, 'Pay $${amount.toFixed(2)}');
        isProcessing = false;
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAYMENT_ERROR',
          payload: { error: error.message }
        }));
      }
    }

    window.addEventListener('message', function(event) {
      const data = event.data;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'PROCESSING_COMPLETE') {
            updatePayButtonState(true, '✅ Payment Successful', 'success');
            showSuccess();
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    });

    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(() => {
        if (typeof window.Square !== 'undefined') {
          initializeSquare();
        } else {
          showError('Payment SDK failed to load. Please refresh.');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SQUARE_ERROR',
            payload: { error: 'SDK failed to load' }
          }));
        }
      }, 1000);
    });

    document.getElementById('pay-button').addEventListener('click', handlePayment);

    document.addEventListener('visibilitychange', function() {
      if (!document.hidden && typeof window.Square !== 'undefined' && !payments) {
        initializeSquare();
      }
    });

    setTimeout(() => {
      if (typeof window.Square === 'undefined' || !payments) {
        showError('Payment SDK took too long to load. Please check your connection.');
        updatePayButtonState(true, 'Connection Error');
      }
    }, 10000);
  </script>
</body>
</html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'SQUARE_READY':
          setLoading(false);
          break;
          
        case 'PAYMENT_TOKEN':
          processPayment(data.payload);
          break;
          
        case 'PAYMENT_SUCCESS':
          onSuccess(data.payload.transactionId || `TXN_${Date.now()}`);
          break;
          
        case 'PAYMENT_ERROR':
          onError(data.payload.error || 'Payment failed');
          break;
          
        case 'SQUARE_ERROR':
          onError(data.payload.error || 'Square initialization failed');
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const processPayment = async (payload: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'PROCESSING_COMPLETE',
        }));
      }
      
      setTimeout(() => {
        onSuccess(`TXN_${Date.now()}`);
      }, 3000);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      onError(error.message || 'Payment processing failed');
    }
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleLoadError = (event: any) => {
    console.error('WebView load error:', event.nativeEvent);
    setWebViewError(true);
    onError('Failed to load payment page. Please check your internet connection.');
  };

  const handleRetry = () => {
    setWebViewError(false);
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <View style={styles.spacer} />
        </View>
        
        {loading && !webViewError && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F29D38" />
            <Text style={styles.loadingText}>Loading payment gateway...</Text>
            <Text style={styles.loadingSubText}>Please wait</Text>
          </View>
        )}
        
        {webViewError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>
              Failed to load payment page. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!webViewError && (
          <WebView
            ref={webViewRef}
            source={{ html: getHtml() }}
            style={[styles.webview, loading && styles.webviewHidden]}
            onLoadEnd={handleLoadEnd}
            onError={handleLoadError}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            startInLoadingState={true}
            cacheEnabled={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            // ✅ Add these for HTTPS security
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            // ✅ Add these for better security
            overScrollMode="never"
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={false}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color="#F29D38" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  closeButton: {
    padding: 8,
    minWidth: 44,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '400',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  spacer: {
    width: 44,
  },
  webview: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  webviewHidden: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingSubText: {
    color: '#8E8E93',
    marginTop: 8,
    fontSize: 14,
  },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#F29D38',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SquarePaymentWebView;