import { Canvas, Skia, Path as SkiaPath } from '@shopify/react-native-skia';
import React, { useState } from 'react';
import { Dimensions, GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height, width } = Dimensions.get('window');
type Point = { x: number; y: number };

export default function NotesScreen(): React.JSX.Element {
  const [pages, setPages] = useState<Point[][][]>([[]]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);



  const onTouchEnd = () => {
    if (currentPath.length > 0) {
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = [
        ...updatedPages[currentPageIndex],
        currentPath,
      ];
      setPages(updatedPages);
      setCurrentPath([]);
    }
  };

  const onTouchMove = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
  };

  const handleAddPage = () => {
    setPages((prev) => [...prev, []]);
    setCurrentPageIndex(pages.length);
  };

  const makeSkiaPath = (points: Point[]) => {
    const path = Skia.Path.Make();
    if (points.length > 0) {
      path.moveTo(points[0].x, points[0].y);
      points.forEach((p) => path.lineTo(p.x, p.y));
    }
    return path;
  };

  return (
    <View style={styles.container}>
      <View style={styles.canvasWrapper} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <Canvas style={StyleSheet.absoluteFill}>
          {pages[currentPageIndex].map((p, idx) => (<SkiaPath key={idx} path={makeSkiaPath(p)} color="black" style="stroke" strokeWidth={3}/>))}
          {currentPath.length > 0 && (<SkiaPath path={makeSkiaPath(currentPath)} color="black" style="stroke" strokeWidth={3}/>)}
        </Canvas>
      </View>

      <Text style={styles.pagesIndicator}>
        Page {currentPageIndex + 1} / {pages.length}
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={handleAddPage} style={styles.pageButton}>
          <Text style={styles.pageButtonText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {const last = (currentPageIndex - 1) < 0 ? pages.length-1: (currentPageIndex - 1); setCurrentPageIndex(last);}} style={styles.pageButton}>
          <Text style={styles.pageButtonText}>{"<"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {const next = (currentPageIndex + 1) % pages.length; setCurrentPageIndex(next);}} style={styles.pageButton}>
          <Text style={styles.pageButtonText}>{">"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  canvasWrapper: {
    height: height * 0.82,
    width: width,
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 16,
  },
  pagesIndicator: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 5,
    width: '100%',
  },
  pageButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
