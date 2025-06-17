import { Canvas, Skia, Path as SkiaPath } from '@shopify/react-native-skia';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height, width } = Dimensions.get('window');
type Point = { x: number; y: number };


export default function NotesScreen(): React.JSX.Element {
  const [paths, setPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isClearButtonClicked, setClearButtonClicked] = useState<boolean>(false);

  const onTouchEnd = () => {
    if (currentPath.length > 0) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath([]);
    }
  };

  const onTouchMove = (event: import('react-native').GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath(prev => [...prev, { x: locationX, y: locationY }]);
  };

  const handleClearButtonClick = () => {
    setPaths([]);
    setCurrentPath([]);
  };
  
  const makeSkiaPath = (points: Point[]) => {
    const path = Skia.Path.Make();
    if (points.length > 0) {
      path.moveTo(points[0].x, points[0].y);
      points.forEach(p => path.lineTo(p.x, p.y));
    }
    return path;
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.canvasWrapper}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Canvas style={StyleSheet.absoluteFill}>
          {paths.map((p, idx) => (
            <SkiaPath
              key={idx}
              path={makeSkiaPath(p)}
              color="black"
              style="stroke"
              strokeWidth={3}
            />
          ))}
          {currentPath.length > 0 && (
            <SkiaPath
              path={makeSkiaPath(currentPath)}
              color="black"
              style="stroke"
              strokeWidth={3}
            />
          )}
        </Canvas>
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
  canvasWrapper: {
    height: height * 0.85,
    width: width,
    borderWidth: 2,
    borderColor: '#000',
  },
  clearButton: {
    marginTop: 10,
    backgroundColor: '#0a7ea4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});