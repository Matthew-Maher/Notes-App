import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NotesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the Notes Page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  text: {
    fontSize: 24, 
    color: '#000',
  },
});
