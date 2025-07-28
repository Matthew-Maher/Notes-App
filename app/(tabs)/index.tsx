import Slider from '@react-native-community/slider';
import { Canvas, Skia, Path as SkiaPath } from '@shopify/react-native-skia';
import React, { useState } from 'react';
import { Dimensions, GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';



const { height, width } = Dimensions.get('window');
type Point = { x: number; y: number };

export default function NotesScreen(): React.JSX.Element {
  const [pages, setPages] = useState<Point[][][]>([[]]); //pages 3d array
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [toolboxVisible, setToolboxVisible] = useState(false); //useState for toolbox toggle with boolean
  const [colors, setColors] = useState<string[][]>([[]]);
  const [color, setColor] = useState("black");
  const [strokeWidths, setStrokeWidths] = useState<number[][]>([[]]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [showSlider, setShowSlider] = useState(false);


  const onTouchEnd = () => {
    if (currentPath.length > 0) {
      const updatedPages = [...pages];
      const updatedWidths = [...strokeWidths];
      const updatedColors = [...colors];

      updatedPages[currentPageIndex] = [
        ...updatedPages[currentPageIndex],
        currentPath,
      ];

      updatedWidths[currentPageIndex] = [
        ...updatedWidths[currentPageIndex],
        strokeWidth,
      ];

      updatedColors[currentPageIndex] = [
        ...updatedColors[currentPageIndex],
        color,
      ];

      setPages(updatedPages);
      setStrokeWidths(updatedWidths);
      setColors(updatedColors);
      setCurrentPath([]);
    }
  };

  const onTouchMove = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
  };

  const handleAddPage = () => {
    setPages((prev) => [...prev, []]);
    setStrokeWidths((prev) => [...prev, []]);
    setColors((prev) => [...prev, []]);
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
      {/* Toolbox Toggle Button */}
      <TouchableOpacity onPress={() => setToolboxVisible(prev => !prev)} style={styles.toolboxToggle}>
        <Text style={styles.toolboxText}>Tools</Text>
      </TouchableOpacity>

      {/* Toolbox Panel */}
      {toolboxVisible && ( //only renders if toolboxVisible = true
        <View style={styles.toolboxPanel}>
          <Text style={styles.toolboxLabel}>Toolbox</Text>
          {/* color and pen width go here. more tags besides text */
            <View style={{flexDirection: 'row'}}>
              <TouchableOpacity onPress={() => setColor("black")} style={styles.blackBtn}></TouchableOpacity>
              <TouchableOpacity onPress={() => setColor("red")} style={styles.redBtn}></TouchableOpacity>
              <TouchableOpacity onPress={() => setColor("green")} style={styles.greenBtn}></TouchableOpacity>
              <TouchableOpacity onPress={() => setColor("blue")} style={styles.blueBtn}></TouchableOpacity>
              <TouchableOpacity onPress={() => setColor("white")} style={styles.eraserBtn}></TouchableOpacity>
              <TouchableOpacity onPress={() => setShowSlider(prev => !prev)} style={styles.pageButton}>
                <Text style={styles.pageButtonText}>{"Width"}</Text>
              </TouchableOpacity>
            </View>
          }

          {showSlider && (
            <Slider
              style={styles.strokeSlider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={strokeWidth}
              onValueChange={setStrokeWidth}
            />
          )}
        </View>
      )}


      <View style={styles.canvasWrapper} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <Canvas style={StyleSheet.absoluteFill}>
          {pages[currentPageIndex].map((p, idx) => (
            <SkiaPath key={idx} path={makeSkiaPath(p)} color={colors[currentPageIndex][idx]} style="stroke" strokeWidth={strokeWidths[currentPageIndex][idx]} />
          ))}
          {currentPath.length > 0 && (
            <SkiaPath path={makeSkiaPath(currentPath)} color={color} style="stroke" strokeWidth={strokeWidth} />
          )}
        </Canvas>
      </View>

      <Text style={styles.pagesIndicator}>
        Page {currentPageIndex + 1} / {pages.length}
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={handleAddPage} style={styles.pageButton}>
          <Text style={styles.pageButtonText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          const last = (currentPageIndex - 1) < 0 ? pages.length - 1 : (currentPageIndex - 1);
          setCurrentPageIndex(last);
        }} style={styles.pageButton}>
          <Text style={styles.pageButtonText}>{"<"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          const next = (currentPageIndex + 1) % pages.length;
          setCurrentPageIndex(next);
        }} style={styles.pageButton}>
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
  toolboxToggle: { //toolbox button
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#0a7ea4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 5, //prevent drawing on top of button (higher = closer to top)
  },
  toolboxText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  toolboxPanel: { //pop-up box
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    width: 350, //adjust how long toolbox is
    height: 300, //adjust how tall toolbox is
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
    zIndex: 4, //prevent drawing on top of panel
  },
  toolboxLabel: {
    fontWeight: 'bold',
  },
  redBtn: {
    height: 25,
    width: 25,
    backgroundColor: '#f00',
    borderWidth: 1.5,
    margin: 3,
  },
  greenBtn: {
    height: 25,
    width: 25,
    backgroundColor: '#0f0',
    borderWidth: 1.5,
    margin: 3,
  },
  blueBtn: {
    height: 25,
    width: 25,
    backgroundColor: '#00f',
    borderWidth: 1.5,
    margin: 3,
  },
  blackBtn: {
    height: 25,
    width: 25,
    backgroundColor: '#000',
    borderWidth: 1.5,
    margin: 3,
  },
  strokeSlider: {
    width: 200,
    height: 40,
    alignSelf: 'center',
    marginTop: 10,
  },
  eraserBtn: {
    height: 25,
    width: 25,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    margin: 3,
  },
});
