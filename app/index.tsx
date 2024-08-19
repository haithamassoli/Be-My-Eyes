import { Image, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";
import { Modal, Portal } from "react-native-paper";
import { hs, ms, vs, width } from "@/src/utils/platform";
import Loading from "@/src/components/loading";
import { Audio } from "expo-av";
import { StatusBar } from "expo-status-bar";

const greenSound = require("@/assets/green.mp3");
const redSound = require("@/assets/red.mp3");
const noneSound = require("@/assets/none.mp3");

export default function HomeScreen() {
  const [captureImage, setCaptureImage] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [color, setColor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const hideModal = () => setPreviewVisible(false);

  const findColor = async (colors: any) => {
    let colorTitle = "";

    const { image_colors, background_colors, foreground_colors } =
      colors.result.colors;
    const colorsArray = [
      ...image_colors,
      ...background_colors,
      ...foreground_colors,
    ];

    const color = colorsArray.filter((color) => {
      const colorName = color.closest_palette_color_parent.toLowerCase();
      if (colorName.includes("red")) {
        setColor("الصورة تحتوي اللون الأحمر");
        colorTitle = "red";
        return colorName.includes("red");
      }
      if (colorName.includes("green")) {
        setColor("الصورة تحتوي اللون الأخضر");
        colorTitle = "green";
        return colorName.includes("green");
      }
    });

    if (color.length === 0) {
      setColor("الصورة لا تحتوي على اللون الأحمر أو الأخضر");
      colorTitle = "none";
    }

    const colorSound =
      colorTitle === "red"
        ? redSound
        : colorTitle === "green"
        ? greenSound
        : noneSound;

    const { sound } = await Audio.Sound.createAsync(colorSound);
    await sound.playAsync();

    return;
  };

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          يرجى منح الصلاحية للوصول إلى الكاميرا
        </Text>
        <Button
          onPress={requestPermission}
          title="السماح بالوصول إلى الكاميرا"
        />
      </View>
    );
  }

  const capturePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        base64: true,
        imageType: "png",
        quality: 0.34,
      });
      setIsLoading(true);

      let body = new FormData();
      body.append("image", {
        uri: photo!.uri,
        name: "photo.png",
        filename: "imageName.jpg",
        type: "image/jpg",
      });
      body.append("Content-Type", "image/png");

      const response = await fetch(`https://api.imagga.com/v2/colors`, {
        method: "POST",
        body,
        headers: {
          accept: "application/json",
          Authorization:
            "Basic YWNjX2I5ZDliNmJkNTYzNTA2Mzo1YTJjMDg4MjYzZTA1NmU2MGJhNGUyYWNhOTJmNzc4NA==",
        },
      });
      const data = await response.json();
      await findColor(data);
      // console.log("Primary color detected!", JSON.stringify(data, null, 4));
      setCaptureImage(photo?.uri);
      setPreviewVisible(true);
    } catch (error) {
      // console.error("Failed to capture photo", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <StatusBar style="light" />
      <View
        style={{
          flex: 1,
          marginHorizontal: hs(16),
          marginTop: vs(16),
        }}
      >
        <Portal>
          <Modal
            visible={previewVisible}
            onDismiss={hideModal}
            contentContainerStyle={{
              backgroundColor: "#fff",
              paddingVertical: vs(16),
              paddingHorizontal: hs(16),
              marginHorizontal: hs(16),
              borderRadius: ms(12),
              alignItems: "center",
            }}
          >
            <Image
              source={{ uri: captureImage }}
              resizeMode="contain"
              style={{
                width: width - hs(164),
                justifyContent: "center",
                aspectRatio: 9 / 16,
              }}
            />
            <Text
              style={{
                marginBottom: vs(16),
                fontSize: ms(18),
                textAlign: "center",
              }}
            >
              {color}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                gap: hs(16),
              }}
            ></View>
          </Modal>
        </Portal>
        <View style={styles.mainContainer}>
          <CameraView
            style={styles.camera}
            facing={"back"}
            ref={cameraRef}
            autofocus="on"
          >
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={capturePhoto}>
                <View
                  style={{
                    height: ms(72),
                    width: ms(72),
                    backgroundColor: "#fff",
                    borderRadius: ms(36),
                  }}
                />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontSize: ms(20),
    textAlign: "center",
    paddingBottom: 10,
  },
  mainContainer: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 100,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
  },
});
