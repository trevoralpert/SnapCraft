import React from 'react';
import { Text } from 'react-native';

export default function ModalScreen() {
  console.log('🟢 MINIMAL ModalScreen RENDERING!');
  
  return (
    <Text style={{ 
      fontSize: 50, 
      color: 'red', 
      backgroundColor: 'white',
      position: 'absolute',
      top: 100,
      left: 50,
      right: 50,
      textAlign: 'center',
      zIndex: 9999
    }}>
      HELLO WORLD
    </Text>
  );
}
