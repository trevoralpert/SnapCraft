import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../stores/authStore';

const REMEMBER_ME_KEY = '@snapcraft_remember_me';
const SAVED_CREDENTIALS_KEY = '@snapcraft_saved_credentials';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  // Debug form field changes
  React.useEffect(() => {
    console.log('📊 Form state:', { email, password, displayName, isSignUp, rememberMe });
  }, [email, password, displayName, isSignUp, rememberMe]);

  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

  const loadSavedCredentials = async () => {
    try {
      const savedRememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      if (savedRememberMe === 'true') {
        setRememberMe(true);
        const savedCredentials = await AsyncStorage.getItem(SAVED_CREDENTIALS_KEY);
        if (savedCredentials) {
          const { email: savedEmail, password: savedPassword } = JSON.parse(savedCredentials);
          setEmail(savedEmail || '');
          setPassword(savedPassword || '');
          console.log('📱 Loaded saved credentials for:', savedEmail);
        }
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async (email: string, password: string) => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
        await AsyncStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify({ email, password }));
        console.log('💾 Credentials saved for:', email);
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
        await AsyncStorage.removeItem(SAVED_CREDENTIALS_KEY);
        console.log('🗑️ Credentials cleared');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const handleSubmit = async () => {
    console.log('🚀 Authentication started:', { email, isSignUp });
    
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && !displayName) {
      Alert.alert('Error', 'Please enter your display name');
      return;
    }

    try {
      clearError();
      if (isSignUp) {
        console.log('📝 Starting signUp...');
        await signUp(email, password, displayName);
        console.log('✅ SignUp successful');
        
        // Save credentials if remember me is checked
        await saveCredentials(email, password);
        
        // Use web-compatible notification
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Success: Account created! Welcome to SnapCraft!');
        } else {
          Alert.alert('Success', 'Account created! Welcome to SnapCraft!');
        }
        // Clear form only after successful authentication (unless remembering)
        if (!rememberMe) {
          setEmail('');
          setPassword('');
        }
        setDisplayName('');
      } else {
        console.log('🔑 Starting signIn...');
        await signIn(email, password);
        console.log('✅ SignIn successful');
        
        // Save credentials if remember me is checked
        await saveCredentials(email, password);
        
        // Use web-compatible notification
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Success: Welcome back to SnapCraft!');
        } else {
          Alert.alert('Success', 'Welcome back to SnapCraft!');
        }
        // Clear form only after successful authentication (unless remembering)
        if (!rememberMe) {
          setEmail('');
          setPassword('');
        }
      }
    } catch (err: any) {
      console.error('❌ Authentication error:', err);
      
      // Handle Firebase-specific errors
      let errorMessage = 'Authentication failed';
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please check your credentials.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'An account already exists with this email address.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          default:
            errorMessage = err.message || 'Authentication failed';
        }
      } else {
        errorMessage = err.message || 'Authentication failed';
      }
      
      // Use web-compatible error notification
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Authentication Error: ${errorMessage}`);
      } else {
        Alert.alert('Authentication Error', errorMessage);
      }
      console.log('Showing error alert:', errorMessage);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    clearError();
    setDisplayName('');
  };



  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {isSignUp ? 'Join SnapCraft' : 'Welcome Back'}
        </Text>
        <Text style={styles.subtitle}>
          {isSignUp 
            ? 'Start your craft journey today' 
            : 'Sign in to continue your craft adventure'
          }
        </Text>

        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {/* Remember Me Checkbox */}
        <TouchableOpacity 
          style={styles.rememberMeContainer} 
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View style={styles.checkbox}>
            {rememberMe && (
              <Ionicons name="checkmark" size={16} color="#8B4513" />
            )}
          </View>
          <Text style={styles.rememberMeText}>Remember me</Text>
        </TouchableOpacity>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
          <Text style={styles.toggleText}>
            {isSignUp 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up"
            }
          </Text>
        </TouchableOpacity>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>✅ Firebase Connected</Text>
          <Text style={styles.demoText}>
            Real Firebase authentication is now active! Try creating an account or signing in.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC', // Beige background
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B4513', // Saddle brown
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0522D',
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: 3,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  rememberMeText: {
    fontSize: 16,
    color: '#8B4513',
  },
  button: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    padding: 12,
    alignItems: 'center',
  },
  toggleText: {
    color: '#8B4513',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
  },
  demoSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8B4513',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 14,
    color: '#654321',
    lineHeight: 20,
  },
}); 