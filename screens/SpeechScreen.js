import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SpeechScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎤 음성 인식 화면입니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20 },
});
