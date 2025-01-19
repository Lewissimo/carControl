import React, { useEffect } from 'react';
import { PermissionsAndroid, Platform, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Orientation from 'react-native-orientation-locker';

import MainScreen from './components/MainScreen';
import ConsoleScreen from './components/ConsoleScreen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

MaterialIcons.loadFont().then(() => {
  console.log('Fonty MaterialIcons załadowane');
});
const Stack = createStackNavigator();

async function requestBluetoothPermissions() {
  // Działa tylko na Androidzie
  if (Platform.OS !== 'android') {return;}

  // Dla Androida 12+ (API 31)
  if (Platform.Version >= 31) {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);

      if (
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('Bluetooth permissions granted (Android 12+)');
      } else {
        console.log('Bluetooth permissions denied (Android 12+)');
      }
    } catch (err) {
      console.warn('Error requesting Bluetooth permissions (Android 12+):', err);
    }
  } else {
    // Dla starszych wersji Androida (potrzebny dostęp do lokalizacji)
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission granted (below Android 12)');
      } else {
        console.log('Location permission denied (below Android 12)');
      }
    } catch (err) {
      console.warn('Error requesting Location permission (below Android 12):', err);
    }
  }
}

const RootApp: React.FC = () => {
  useEffect(() => {
    // Po zmontowaniu komponentu prosimy o uprawnienia
    requestBluetoothPermissions();

    // Lock the orientation to landscape
    Orientation.lockToLandscape();

    // Cleanup po odmontowaniu komponentu
    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Console" component={ConsoleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <RootApp />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
