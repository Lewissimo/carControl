import React, { useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';

interface JoystickProps {
  orientation: 'vertical' | 'horizontal';
  size?: number;
  stickSize?: number;
  onChange: (value: number) => void;
}

const Joystick: React.FC<JoystickProps> = ({
  orientation,
  size = 150,
  stickSize = 50,
  onChange,
}) => {
  const radius = (size - stickSize) / 2;

  // Klasyczne Animated.Value do przechowywania bieżącego położenia gałki
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  /**
   * Obsługa zmiany gestu
   * - Obliczamy dx i dy na podstawie eventu
   * - Ograniczamy ruch do okręgu o promieniu `radius`
   * - Ustawiamy Animated.Value (translateX, translateY)
   * - Wywołujemy `onChange` z przeskalowaną wartością
   */
  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    let dx = event.nativeEvent.translationX;
    let dy = event.nativeEvent.translationY;

    // Ograniczenie ruchu do jednej osi
    if (orientation === 'vertical') {dx = 0;}
    if (orientation === 'horizontal') {dy = 0;}

    // Ograniczenie ruchu do koła (promień = `radius`)
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) {
      const angle = Math.atan2(dy, dx);
      dx = radius * Math.cos(angle);
      dy = radius * Math.sin(angle);
    }

    // Aktualizacja Animated.Value
    translateX.setValue(dx);
    translateY.setValue(dy);

    // Wywołanie onChange z wartością przeskalowaną do -1000..1000
    if (orientation === 'vertical') {
      const value = Math.round((dy / radius) * 1000);
      onChange(value);
    } else {
      const value = Math.round((dx / radius) * 1000);
      onChange(value);
    }
  };

  /**
   * Obsługa zmian stanu gestu (np. zakończenie)
   * - Po zakończeniu: resetujemy położenie do (0, 0)
   * - Wywołujemy onChange(0)
   */
  const onHandlerStateChange = (event: any) => {
    if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED
    ) {
      // Animacja powrotu gałki do centrum
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      // Wywołujemy onChange(0), bo gałka wróciła do centrum
      onChange(0);
    }
  };

  // Styl przypisany do gałki (Animated.View)
  const stickStyle = {
    transform: [
      { translateX },
      { translateY },
    ],
  };

  return (
    <View
      style={[
        styles.joystickBase,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.joystickStick,
            {
              width: stickSize,
              height: stickSize,
              borderRadius: stickSize / 2,
            },
            stickStyle,
          ]}
        />
      </PanGestureHandler>
    </View>
  );
};

// Przykładowe style (dopasuj do własnego pliku)
const styles = StyleSheet.create({
  joystickBase: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  joystickStick: {
    backgroundColor: '#555',
  },
});

export default Joystick;
