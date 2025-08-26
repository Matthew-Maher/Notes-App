import { GoogleGenAI } from "@google/genai";
import { SafeAreaView, StatusBar } from "react-native";
import Slider from '@react-native-community/slider';
import { Canvas, ImageFormat, Rect, Skia, Path as SkiaPath, useCanvasRef } from '@shopify/react-native-skia';
import React, { useState } from 'react';
import { Dimensions, GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height, width } = Dimensions.get('window');
type Point = { x: number; y: number };

/* THIS IS FOR TETING PURPOSES ONLY. 
The key can be visible at compile time when using EXPO_PUBLIC_. 
For a more secure approach, storing the key in a server would be better.
Since this is not posted and a free key was used, we opted to use EXPO_PUBLIC_ for efficiency. */
const ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY }); 

export default function NotesScreen(): React.JSX.Element {
  const [pages, setPages] = useState<Point[][][]>([[]]); //[page][stroke][point]
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [toolboxVisible, setToolboxVisible] = useState(false); //useState for toolbox toggle with boolean
  const [colors, setColors] = useState<string[][]>([[]]);
  const [color, setColor] = useState("black");
  const [strokeWidths, setStrokeWidths] = useState<number[][]>([[]]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [aiText, setAiText] = useState<string>(""); //store AI output
  const canvasRef = useCanvasRef(); // Skia canvas ref for snapshotting

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
    setToolboxVisible(false); //when drawing minimizes toolbox
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

  const clearPage = () => {
    const updatedPages = [...pages]; //shallow copies each catagory we need to clear
    const updatedWidths = [...strokeWidths];
    const updatedColors = [...colors];

    updatedPages[currentPageIndex] = []; //reset each category (at current index)
    updatedWidths[currentPageIndex] = [];
    updatedColors[currentPageIndex] = [];

    setPages(updatedPages); //return andsave changes
    setStrokeWidths(updatedWidths);
    setColors(updatedColors);
  };

  const updateColor = (color: string) => {
    if (strokeWidth > 20 && color != 'white') {
      setStrokeWidth(20);
    }
    setColor(color);
  }


  // Snapshot canvas → send JPEG → show response under AI button
  const callGemini = async () => {
    try {
      if (pages[currentPageIndex].length === 0 && currentPath.length === 0) { //nothing on screen
        setAiText("No content to analyze yet.");
        return;
      }

      // Take snapshot of the current canvas with explicit rect matching the drawing area
      const image = canvasRef.current?.makeImageSnapshot({
        x: 0,
        y: 0,
        width,
        height: height * 0.82,
      });
      if (!image) { //check image is made
        setAiText("Could not capture the canvas.");
        return;
      }

      const base64 = image.encodeToBase64(ImageFormat.JPEG, 80); //convert so AI can read it

      //send image + instruction
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { inlineData: { data: base64, mimeType: "image/jpeg" } },
          { text: "Summarize/ explain/ answer what is written/drawn in at most 4 sentences." }
        ],
      });

      // Some SDK versions return errors/messages within the object
      const serverMsg =
        (response as any)?.promptFeedback?.blockReason ??
        (response as any)?.error?.message ??
        (response as any)?.candidates?.[0]?.finishReason ??
        "";

      //grab text depending on SDK quirks
      //The if/ else blocks are fallbacks that check diff types of Gemini responses 
      let text = "";
      if (typeof (response as any)?.text === "function") {
        text = (response as any).text();
      } else if ((response as any)?.output_text) {
        text = (response as any).output_text;
      } else if ((response as any)?.candidates?.[0]?.content?.parts) {
        text = (response as any).candidates[0].content.parts.map((p: any) => p.text).join(" ");
      }

      setAiText(String(text).trim()); //apply AI output

    } catch (err) {
      console.error("Gemini call failed:", err);
      setAiText("AI request failed.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0c0be4' }}>
      <StatusBar barStyle="dark-content" backgroundColor='#0b0c0be4' />
    
        <View style={styles.container}>
          {/* Toolbox Toggle Button */}
          <TouchableOpacity onPress={() => setToolboxVisible(prev => !prev)} style={styles.toolboxToggle}>
            <Text style={styles.toolboxText}>≡</Text>
          </TouchableOpacity>

          {/* Toolbox Panel */}
          {toolboxVisible && ( //only renders if toolboxVisible = true
            <View style={styles.toolboxPanel}>
              <Text style={styles.toolboxLabel}>Toolbox</Text>
              {/* color and pen width go here. more tags besides text */}
              <View>
                <View style={{flexDirection: 'row'}}>
                  {/* Each Button sets pen color. It only highlights if cond (that color is selected) is true -> applies selected color highlight */}
                  <TouchableOpacity onPress={() => updateColor("black")} style={[styles.blackBtn, color === "black" && styles.selectedColor]} />
                  <TouchableOpacity onPress={() => updateColor("red")}   style={[styles.redBtn,   color === "red"   && styles.selectedColor]} />
                  <TouchableOpacity onPress={() => updateColor("green")} style={[styles.greenBtn, color === "green" && styles.selectedColor]} />
                  <TouchableOpacity onPress={() => updateColor("blue")}  style={[styles.blueBtn,  color === "blue"  && styles.selectedColor]} />
                  <TouchableOpacity onPress={() => updateColor("white")} style={[styles.eraserBtn, color === "white" && styles.selectedColor]} />
                </View>
                <TouchableOpacity onPress={() => setStrokeWidth(3)} style={styles.pageButton}>
                  <Text style={styles.pageButtonText}>Width: {strokeWidth}</Text>
                </TouchableOpacity>
              </View>

              {(
                <Slider
                  style={styles.strokeSlider}
                  minimumValue={1}
                  maximumValue={color == 'white' ? 50 : 20}
                  step={1}
                  value={strokeWidth}
                  onValueChange={setStrokeWidth}
                />
              )}

              <View>
                {/* Calls Clear Func */}
                <TouchableOpacity onPress={clearPage} style={styles.pageButton}>
                  <Text style={styles.pageButtonText}>Clear</Text>
                </TouchableOpacity>
                {/* Calls Gemini */}
                <TouchableOpacity onPress={callGemini} style={styles.pageButton}>
                  <Text style={styles.pageButtonText}>AI</Text>
                </TouchableOpacity>

                {/*Gemini Output*/}
                {aiText.length > 0 && (
                  <View style={styles.aiOutputBox}>
                    <Text style={styles.aiOutputLabel}>AI summary</Text>
                    <Text style={styles.aiOutputText}>{aiText}</Text>
                  </View>
                )}

              </View>
            </View>
          )}

          <View style={styles.canvasWrapper} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <Canvas ref={canvasRef} style={StyleSheet.absoluteFill}>
              {/* Solid white background so snapshots aren't black */}
              <Rect x={0} y={0} width={width} height={height * 0.82} color="white" />

              {pages[currentPageIndex].map((p, idx) => (
                <SkiaPath
                  key={idx}
                  path={makeSkiaPath(p)}
                  color={colors[currentPageIndex][idx]}
                  style="stroke"
                  strokeWidth={strokeWidths[currentPageIndex][idx]}
                />
              ))}
              {currentPath.length > 0 && (
                <SkiaPath path={makeSkiaPath(currentPath)} color={color} style="stroke" strokeWidth={strokeWidth}/>
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
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010e4',
    alignItems: 'center',
  },
  canvasWrapper: {
    height: height,
    width: width,
    // updated canvas frame:
    borderWidth: 1,
    borderColor: '#E3E7EA', //softer border
    backgroundColor: '#fff',
    borderRadius: 16, //rounded corners
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    flex: 1,
  },
  pagesIndicator: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 5,
    width: '100%',
    backgroundColor: '#101010e4',
    height: height * 0.05,
  },
  pageButton: {
    backgroundColor: '#101010e4',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  pageButtonText: {
    color: '#258761ff',
    fontWeight: '900',
    textShadowOffset: {width: 1, height: 1},
    fontSize: height*0.05*0.8,
  },
  toolboxToggle: { //toolbox button
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#101010e4',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 5,
    zIndex: 5, //prevent drawing on top of button (higher = closer to top)
    shadowOffset: {width: 1.7, height: 1.7},
    shadowRadius: 1.5,
    shadowOpacity: 0.6,
    shadowColor: '#101010e4',
  },
  toolboxText: {
    color: '#258761ff',
    fontWeight: '800',
    fontSize: 30,
  },
  toolboxPanel: { //pop-up box
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    width: 350, //adjust how long toolbox is
    height: 500, //fixed height for now
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
  //color blocks
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
  eraserBtn: {
    height: 25,
    width: 25,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderStyle: 'dashed',   //looks like an eraser
    borderColor: '#94a3b8',
    margin: 3,
  },
  //highlight around current color
  selectedColor: {
    borderWidth: 3,
    borderColor: '#0a7ea4',
    shadowColor: '#0a7ea4',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  strokeSlider: {
    width: 200,
    height: 40,
    alignSelf: 'center',
    marginTop: 10,
  },
  //AI output styling (under the AI button)
  aiOutputBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E7EA',
  },
  aiOutputLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#0a7ea4',
  },
  aiOutputText: {
    fontSize: 13,
    color: '#0f172a',
  },
});
