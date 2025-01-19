import { connectToDevice, sendCommand, disconnectDevice } from '../services/BluetoothService';

// Połącz z urządzeniem
await connectToDevice('CONAN II');

// Wyślij komendę
await sendCommand('H;');

// Rozłącz z urządzeniem
await disconnectDevice();
