import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = (token, isPremium) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Check subscription status when user is authenticated
    const checkStatus = async () => {
      if (!token || !isPremium || !isSupported) return;
      
      try {
        const response = await axios.get(`${API_URL}/api/push/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsSubscribed(response.data.subscribed);
      } catch (error) {
        console.error('Error checking push status:', error);
      }
    };
    
    checkStatus();
  }, [token, isPremium, isSupported]);

  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported || !token || !isPremium) {
      throw new Error('Push notifications not supported or user not premium');
    }
    
    setIsLoading(true);
    
    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied');
      }
      
      // Register service worker
      const registration = await registerServiceWorker();
      await navigator.serviceWorker.ready;
      
      // Get VAPID public key
      const vapidResponse = await axios.get(`${API_URL}/api/push/vapid-key`);
      const vapidPublicKey = vapidResponse.data.publicKey;
      
      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      // Send subscription to backend
      await axios.post(`${API_URL}/api/push/subscribe`, subscription.toJSON(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, token, isPremium, registerServiceWorker]);

  const unsubscribe = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }
      
      await axios.delete(`${API_URL}/api/push/unsubscribe`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const sendTestNotification = useCallback(async () => {
    if (!token) return;
    
    try {
      await axios.post(`${API_URL}/api/push/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      throw error;
    }
  }, [token]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
};

export default usePushNotifications;
