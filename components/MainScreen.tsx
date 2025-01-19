import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList, Modal } from 'react-native';
import BluetoothSerial, { BluetoothDevice } from 'react-native-bluetooth-classic';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { connectById, sendCommand } from '../services/BluetoothService'; 
import Joystick from './Joystick';
import { styles } from '../styles/styles';

// Co ile ms pytamy ESP o prędkość
const SPEED_REQUEST_INTERVAL = 1000;

interface MainScreenProps {
  navigation: any;
}

const MainScreen: React.FC<MainScreenProps> = ({ navigation }) => {
  // Stan podłączonego urządzenia
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);

  // Flagi świateł przednich, tylnych, silników
  const [frontLightsOn, setFrontLightsOn] = useState(false);
  const [rearLightsOn, setRearLightsOn] = useState(false);
  const [motorsOn, setMotorsOn] = useState(false);

  // Stan modala z urządzeniami
  const [showDeviceList, setShowDeviceList] = useState(false);
  // Lista sparowanych urządzeń
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  // Czy trwa próba łączenia z urządzeniem?
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);

  // Przechowujemy prędkość z ESP
  const [speed, setSpeed] = useState<number>(0);

  /**
   * Efekt nasłuchu danych z aktualnie podłączonego urządzenia.
   * Jeśli jest connectedDevice, subskrybujemy onDataReceived i co sekundę pytamy o prędkość.
   */
  useEffect(() => {
    if (!connectedDevice){ return;}

    const subscription = connectedDevice.onDataReceived((event) => {
      const data = event.data.trim();
      const maybeSpeed = parseFloat(data);
      if (!isNaN(maybeSpeed)) {
        setSpeed(maybeSpeed);
      } else {
        console.log('Inne dane od robota:', data);
      }
    });

    // 2. Co 1s wysyłamy komendę "M;" by ESP zwrócił aktualną prędkość
    const intervalId = setInterval(() => {
      sendCommand('M;').catch(console.log);
    }, SPEED_REQUEST_INTERVAL);

    // 3. Sprzątanie przy zmianie urządzenia / odmontowaniu
    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [connectedDevice]);

  /**
   * Pobranie listy sparowanych urządzeń
   */
  const openDeviceList = async () => {
    try {
      const bondedDevices = await BluetoothSerial.getBondedDevices();
      setDevices(bondedDevices);
      setShowDeviceList(true);
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się pobrać listy sparowanych urządzeń.');
    }
  };

  /**
   * Funkcja łącząca z wybranym urządzeniem (po kliknięciu w liście).
   */
  const handleConnectToDevice = async (device: BluetoothDevice) => {
    try {
      setConnectingDeviceId(device.id);
      // 1. Próba połączenia
      const connected = await connectById(device.id);
      setConnectedDevice(connected);
      // 2. Komunikat
      Alert.alert('Sukces', `Połączono z urządzeniem: ${connected.name}`);
      // 3. Zamykamy listę
      setShowDeviceList(false);
    } catch (error) {
      Alert.alert('Błąd', String(error));
    } finally {
      setConnectingDeviceId(null);
    }
  };

  /**
   * Render jednego elementu listy urządzeń
   */
  const renderDeviceItem = ({ item }: { item: BluetoothDevice }) => {
    const isConnecting = connectingDeviceId === item.id;
    return (
      <TouchableOpacity
        style={styles.deviceItem}
        onPress={() => handleConnectToDevice(item)}
        disabled={isConnecting}
      >
        <Text style={styles.deviceName}>{item.name || 'Nieznane urządzenie'}</Text>
        <Text style={styles.deviceAddress}>{item.id}</Text>
        {isConnecting && <Text style={{ color: 'orange' }}>Łączenie...</Text>}
      </TouchableOpacity>
    );
  };

  /**
   * Zamknięcie modala bez łączenia
   */
  const closeDeviceList = () => {
    setShowDeviceList(false);
  };

  /**
   * Przednie światła (H/I)
   */
  const toggleFrontLights = async () => {
    if (!connectedDevice) {return;}
    const cmd = frontLightsOn ? 'I;' : 'H;';
    try {
      await sendCommand(cmd);
      setFrontLightsOn(!frontLightsOn);
    } catch (err) {
      console.error('Błąd toggleFrontLights:', err);
    }
  };

  /**
   * Tylne światła (N/O)
   */
  const toggleRearLights = async () => {
    if (!connectedDevice) {return;}
    const cmd = rearLightsOn ? 'O;' : 'N;';
    try {
      await sendCommand(cmd);
      setRearLightsOn(!rearLightsOn);
    } catch (err) {
      console.error('Błąd toggleRearLights:', err);
    }
  };

  /**
   * Silniki (J/K)
   */
  const toggleMotors = async () => {
    if (!connectedDevice) {return;}
    const cmd = motorsOn ? 'K;' : 'J;';
    try {
      await sendCommand(cmd);
      setMotorsOn(!motorsOn);
    } catch (err) {
      console.error('Błąd toggleMotors:', err);
    }
  };

  /**
   * Joystick (A[value],[value]) - sterowanie przód/tył i prawo/lewo
   */
  const handleJoystickChange = (axis: 'vertical' | 'horizontal', value: number) => {
    if (!connectedDevice) {
      console.log(`Joystick (${axis}) brak połączenia`);
      return;
    }
    const cmd = axis === 'vertical'
      ? `A${value},${value};`
      : `A${value},${-value};`;

    sendCommand(cmd).catch((err) => {
      console.error('Błąd handleJoystickChange:', err);
    });
  };

  return (
    <View style={styles.container}>
      {/* Modal z listą urządzeń */}
      <Modal
        visible={showDeviceList}
        transparent
        animationType="slide"
        onRequestClose={closeDeviceList}
      >
        <View style={styles.devListContainer}>
          {devices.length > 0 ? (
            <FlatList
              data={devices}
              keyExtractor={(item) => item.id}
              renderItem={renderDeviceItem}
            />
          ) : (
            <Text style={styles.noDevicesText}>Brak sparowanych urządzeń</Text>
          )}
          <TouchableOpacity onPress={closeDeviceList} style={{ marginTop: 10 }}>
            <Text style={styles.deviceName}>Zamknij</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Informacja o stanie połączenia */}
      <View style={styles.leftTopContainer}>
        <TouchableOpacity onPress={openDeviceList}>
          <Text style={styles.bluetoothStatus}>
            {connectedDevice ? 'Połączono' : 'Brak połączenia'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tytuł */}
      <Text style={styles.title}>Sterowanie Samochodzikiem</Text>

      {/* Joysticki */}
      <View style={styles.joysticksWrapper}>
        <View style={styles.joystickContainer}>
          <Text style={styles.label}>Prawo / Lewo</Text>
          <Joystick
            orientation="horizontal"
            onChange={(val) => handleJoystickChange('horizontal', val)}
          />
        </View>
        <View style={styles.joystickContainer}>
          <Text style={styles.label}>Przód / Tył</Text>
          <Joystick
            orientation="vertical"
            onChange={(val) => handleJoystickChange('vertical', val)}
          />
        </View>
      </View>

      {/* Ikony - światła, silniki, konsola */}
      <View style={styles.bottomRightContainer}>
  {/* Przednie światła */}
  <TouchableOpacity onPress={toggleFrontLights} style={styles.iconButton}>
    <MaterialIcon
      name={frontLightsOn ? 'highlight' : 'highlight-off'}
      size={32}
      color={frontLightsOn ? '#FFD700' : '#555'}
    />
  </TouchableOpacity>

  {/* Tylne światła */}
  <TouchableOpacity onPress={toggleRearLights} style={styles.iconButton}>
    <MaterialIcon
      name={rearLightsOn ? 'lightbulb' : 'lightbulb-outline'}
      size={32}
      color={rearLightsOn ? '#FF0000' : '#555'}
    />
  </TouchableOpacity>

  {/* Silniki */}
  <TouchableOpacity onPress={toggleMotors} style={styles.iconButton}>
    <MaterialIcon
      name={motorsOn ? 'power' : 'power-off'}
      size={32}
      color={motorsOn ? '#00FF00' : '#555'}
    />
  </TouchableOpacity>

  {/* Przycisk przejścia do konsoli */}
  <TouchableOpacity onPress={() => navigation.navigate('Console')} style={styles.iconButton}>
    <MaterialIcon name="terminal" size={32} color="#555" />
  </TouchableOpacity>
</View>

      {/* Wyświetlanie prędkości w dolnym lewym rogu */}
      <View style={styles.bottomLeftContainer}>
        <Text style={styles.speedLabel}>
          Prędkość: {speed.toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

export default MainScreen;
