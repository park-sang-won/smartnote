import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NoteScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✍️ 여기에 노트 작성 기능이 들어갈 거야!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
});
