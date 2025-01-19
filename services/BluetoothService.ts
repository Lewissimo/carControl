import BluetoothSerial, { BluetoothDevice } from 'react-native-bluetooth-classic';

let connectedDevice: BluetoothDevice | null = null;

/**
 * Zwraca obiekt aktualnie podłączonego urządzenia (albo null).
 */
export const getConnectedDevice = (): BluetoothDevice | null => {
  return connectedDevice;
};

/**
 * Łączy się z urządzeniem po `deviceId`.
 * Po pomyślnym połączeniu ustawia globalne `connectedDevice`.
 */
export const connectById = async (deviceId: string): Promise<BluetoothDevice> => {
  try {
    const device = await BluetoothSerial.connectToDevice(deviceId);
    connectedDevice = device;
    console.log(`Połączono z urządzeniem: ${device.name}`);
    return device;
  } catch (error) {
    console.error('Błąd podczas łączenia z urządzeniem:', error);
    throw error;
  }
};

/**
 * Wysyła komendę do aktualnie podłączonego urządzenia.
 * Jeśli nie ma połączenia (connectedDevice == null), rzuca błąd.
 */
export const sendCommand = async (command: string): Promise<void> => {
  if (!connectedDevice) {
    throw new Error('Brak połączonego urządzenia');
  }

  try {
    // Zakładając, że w Twojej wersji biblioteki .write() jest obsługiwane
    await connectedDevice.write(command, 'utf-8');
    console.log(`Wysłano komendę: ${command}`);
  } catch (error) {
    console.error('Błąd wysyłania komendy:', error);
    throw error;
  }
};

/**
 * Rozłącza aktualnie połączone urządzenie (jeśli jest).
 */
export const disconnectDevice = async (): Promise<void> => {
  if (!connectedDevice) {
    console.warn('Brak urządzenia do rozłączenia');
    return;
  }

  try {
    await connectedDevice.disconnect();
    console.log('Rozłączono z urządzeniem');
    connectedDevice = null;
  } catch (error) {
    console.error('Błąd podczas rozłączania:', error);
    throw error;
  }
};
