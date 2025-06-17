import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

const { height, width } = Dimensions.get('window');


export default function NotesScreen() {
  const [paths, setPaths] = useState<string[][]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isClearButtonClicked, setClearButtonClicked] = useState<boolean>(false);

  const onTouchEnd = () => {
    if (currentPath.length > 0) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath([]);
      setClearButtonClicked(false);
    }
  };

  const onTouchMove = (event: import('react-native').GestureResponderEvent) => {
    const locationX = event.nativeEvent.locationX;
    const locationY = event.nativeEvent.locationY;

    const newPoint = `${currentPath.length === 0 ? 'M' : 'L'}${locationX.toFixed(0)},${locationY.toFixed(0)}`;
    setCurrentPath(prev => [...prev, newPoint]);
  };

  const handleClearButtonClick = () => {
    setPaths([]);
    setCurrentPath([]);
    setClearButtonClicked(true);
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.svgContainer}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Svg height={height} width={width}>
          <Path
            d={paths.map(path => path.join(' ')).join(' ')}
            stroke={isClearButtonClicked ? 'transparent' : 'red'}
            fill="transparent"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </View>

      <TouchableOpacity style={styles.clearButton} onPress={handleClearButtonClick}>
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  svgContainer: {
    height: height * 0.85,
    width,
    borderColor: 'black',
    borderWidth: 2,
  },
  clearButton: {
    marginTop: 10,
    backgroundColor: '#0a7ea4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6, // optional: round the corners
    alignSelf: 'center', // prevent full width; center the button
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
