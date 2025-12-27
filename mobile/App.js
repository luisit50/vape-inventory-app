import React, { useEffect, useState, useCallback } from 'react';
import { AuthContext } from './src/contexts/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
// Redux and persistence removed
import { TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import MultiCaptureScreen from './src/screens/MultiCaptureScreen';
import ReviewCaptureScreen from './src/screens/ReviewCaptureScreen';
import BottleDetailScreen from './src/screens/BottleDetailScreen';


const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Login" 
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Register" 
      component={RegisterScreen}
      options={{ title: 'Create Account' }}
    />
  </Stack.Navigator>
);


const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Home" 
      component={HomeScreen}
      options={{ title: 'Inventory' }}
    />
    <Stack.Screen 
      name="Camera" 
      component={CameraScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="MultiCapture" 
      component={MultiCaptureScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="ReviewCapture" 
      component={ReviewCaptureScreen}
      options={{ title: 'Review Capture' }}
    />
    <Stack.Screen 
      name="BottleDetail" 
      component={BottleDetailScreen}
      options={{ title: 'Bottle Details' }}
    />
    {/* PaywallScreen removed */}
  </Stack.Navigator>
);



const Navigation = ({ isAuthenticated }) => (
  <NavigationContainer>
    {isAuthenticated ? <AppStack /> : <AuthStack />}
  </NavigationContainer>
);


export default function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from AsyncStorage on mount
  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
      setLoading(false);
    };
    loadToken();
  }, []);

  // Handler to set token after login
  const handleLogin = useCallback(async (newToken) => {
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);
  }, []);

  // Handler to clear token on logout
  const handleLogout = useCallback(async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
  }, []);

  if (loading) return null;

  return (
    <PaperProvider>
      <AuthContext.Provider value={{ token, setToken, logout: handleLogout }}>
        <Navigation isAuthenticated={!!token} />
      </AuthContext.Provider>
    </PaperProvider>
  );
}
