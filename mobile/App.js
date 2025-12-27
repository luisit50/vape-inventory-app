import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import { useSelector } from 'react-redux';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import MultiCaptureScreen from './src/screens/MultiCaptureScreen';
import ReviewCaptureScreen from './src/screens/ReviewCaptureScreen';
import BottleDetailScreen from './src/screens/BottleDetailScreen';
import PaywallScreen from './src/screens/PaywallScreen';

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
    <Stack.Screen 
      name="Paywall" 
      component={PaywallScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const Navigation = () => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  
  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SubscriptionProvider>
          <PaperProvider>
            <Navigation />
          </PaperProvider>
        </SubscriptionProvider>
      </PersistGate>
    </ReduxProvider>
  );
}
