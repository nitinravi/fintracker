import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { saveGmailToken, getGmailToken, GmailToken } from '../api/gmail';
import { Alert } from 'react-native';

// Required for web browser to close properly after auth
WebBrowser.maybeCompleteAuthSession();

// OAuth endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Gmail API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
].join(' ');

// Generate random state for CSRF protection
const generateRandomString = (length: number): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const useGmailAuth = (userId: string | undefined) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForCode, setWaitingForCode] = useState(false);

  // Get OAuth credentials from environment
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET;

  // Use localhost with port for redirect
  const redirectUri = 'http://localhost:8080';

  // Check if Gmail is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!userId) return;
      
      try {
        const token = await getGmailToken(userId);
        setIsConnected(!!token);
      } catch (error) {
        console.error('Error checking Gmail connection:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, [userId]);

  const connect = async () => {
    if (!clientId || !clientSecret) {
      Alert.alert('Error', 'Google OAuth credentials not configured. Check .env file.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    setIsLoading(true);
    try {
      // Build authorization URL
      const state = generateRandomString(16);
      const authUrl = `${GOOGLE_AUTH_URL}?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: SCOPES,
        access_type: 'offline',
        prompt: 'consent',
        state,
      })}`;

      console.log('🌐 Opening OAuth URL...');
      
      // Open browser immediately
      await WebBrowser.openBrowserAsync(authUrl);
      
      console.log('📱 Browser closed, waiting for code entry');
      
      // Show alert with instructions
      Alert.alert(
        'Copy Authorization Code',
        'You should have seen a "site cannot be reached" error in the browser.\n\n' +
        '1. Look at the URL bar\n' +
        '2. Copy the long code after "code=" and before "&"\n' +
        '3. Come back to the app\n' +
        '4. Enter the code in the text field below the "Connect Gmail" button',
        [
          {
            text: 'OK',
            onPress: () => {
              setWaitingForCode(true);
              setIsLoading(false);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error in OAuth flow:', error);
      Alert.alert('Error', error.message || 'Failed to start OAuth flow');
      setIsLoading(false);
    }
  };

  const exchangeCodeForToken = async (code: string, uid: string) => {
    setIsLoading(true);
    setWaitingForCode(false);
    
    try {
      console.log('🔄 Exchanging authorization code for tokens...');
      
      // Exchange code for tokens
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId || '',
          client_secret: clientSecret || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      const tokens = await tokenResponse.json();
      
      console.log('📦 Token response:', tokens.access_token ? '✅ Success' : '❌ Failed');
      
      if (tokens.access_token) {
        // Calculate expiry time
        const expiresAt = Date.now() + (tokens.expires_in * 1000);
        
        // Save tokens to Firestore
        await saveGmailToken(uid, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        });
        
        console.log('✅ Gmail connected successfully!');
        setIsConnected(true);
        Alert.alert('Success', 'Gmail connected successfully!');
      } else {
        const errorMsg = tokens.error_description || tokens.error || 'Failed to get access token';
        console.error('❌ Token error:', errorMsg);
        Alert.alert('Error', errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Error exchanging code for token:', error);
      Alert.alert('Error', 'Failed to connect Gmail: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const submitCode = async (code: string) => {
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    if (!code || code.trim().length === 0) {
      Alert.alert('Error', 'Please enter the authorization code');
      return;
    }
    
    // Clean up the code
    const cleanCode = code.trim().split('&')[0].split('#')[0];
    await exchangeCodeForToken(cleanCode, userId);
  };

  return {
    isConnected,
    isLoading,
    waitingForCode,
    connect,
    submitCode,
  };
};
