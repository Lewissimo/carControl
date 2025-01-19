import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { getConnectedDevice, sendCommand } from '../services/BluetoothService';
import { styles } from '../styles/styles';

const ConsoleScreen: React.FC = () => {
  const [receivedMessages, setReceivedMessages] = useState<string[]>(['Oczekiwanie na dane...']);
  const [myCommand, setMyCommand] = useState('');

  useEffect(() => {
    const device = getConnectedDevice();
    if (!device) {return;}

    // Subskrybuj dane przychodzące z tego urządzenia:
    const subscription = device.onDataReceived((event) => {
      setReceivedMessages((prev) => [...prev, `Otrzymano: ${event.data}`]);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleSendCommand = async () => {
    if (myCommand.trim() === '') {return;}
    try {
      // Komenda z terminatorem, jeśli tak wymaga Twój protokół
      await sendCommand(`${myCommand.trim()};`);
      setReceivedMessages((prev) => [...prev, `Wysłano: ${myCommand}`]);
      setMyCommand('');
    } catch (err) {
      setReceivedMessages((prev) => [
        ...prev,
        `Błąd wysyłania komendy: ${String(err)}`,
      ]);
    }
  };

  return (
    <View style={styles.containerConsole}>
      <ScrollView style={styles.consoleOutput}>
        {receivedMessages.map((msg, index) => (
          <Text key={index}>{msg}</Text>
        ))}
      </ScrollView>
      <View style={styles.commandInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Wpisz komendę"
          value={myCommand}
          onChangeText={setMyCommand}
        />
        <TouchableOpacity onPress={handleSendCommand} style={styles.sendButton}>
          <Text>Wyślij</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ConsoleScreen;
