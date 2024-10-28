import {
  Text,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, useEffect, useRef } from "react";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from "react-native-vision-camera";
import * as MediaLibrary from "expo-media-library";
import { io, Socket } from "socket.io-client";

export default function HomeScreen() {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const [permission, setPermission] = useState<null | boolean>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isScaning, setIsScaning] = useState(false);

  const cameraRef = useRef<Camera>(null);

  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    (async () => {
      const status = await requestPermission();

      if (status) {
        setPermission(true);
      }

      const { status: statusMediaLibrary } =
        await MediaLibrary.requestPermissionsAsync();
      if (statusMediaLibrary !== "granted") {
        console.log("Media Library não autorizada!");
        setPermission(false);
        return;
      }
    })();

    socket.current = io("http://192.168.1.3:3000");
    socket.current.on("connect", () => {
      console.log("Conectado ao servidor socket");
    });
  }, []);

  // Função que escaneia códigos de barras
  const codeScanner = useCodeScanner({
    codeTypes: ["qr", "ean-13"], // Tipos de código que você deseja escanear
    onCodeScanned: (codes) => {
      if (isScaning) {
        codes.forEach((code) => {
          console.log(`Código escaneado: ${code.value}, Tipo: ${code.type}`);

          // Enviar pro socket
          if (socket.current) {
            socket.current.emit("barcode", code.value);
            Alert.alert("Código escaneado");
          }
        });
      }
      setIsScaning(false);
    },
  });

  // função para o botão acionar a leitura do código de barras
  const scanBarcode = async () => {
    setIsScaning(true);
  };

  if (!permission) return <View></View>;

  if (!device || device === null) return <View></View>;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {!showCamera && (
        <>
          <Image
            source={require("./images/logo.png")}
            style={styles.logoImage}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowCamera(true)}
          >
            <Ionicons name="camera" size={40} color="#eebc16" />
            <Text style={styles.buttonText}>Escanear</Text>
          </TouchableOpacity>
        </>
      )}

      {showCamera && (
        <>
          <Camera
            style={StyleSheet.absoluteFill}
            ref={cameraRef}
            device={device}
            isActive={true}
            resizeMode="cover"
            outputOrientation="device"
            codeScanner={codeScanner}
          />

          <Ionicons name="scan-outline" size={400} color="white" />

          <TouchableOpacity
            onPress={scanBarcode}
            style={{
              width: 70,
              height: 70,
              borderRadius: 99,
              borderWidth: 7,
              borderColor: "white",
              position: "absolute",
              bottom: 70,
              alignSelf: "center",
              backgroundColor: "white",
            }}
          >
            <Ionicons
              name="barcode-outline"
              size={40}
              color="#101010"
              style={{
                position: "absolute",
                width: 70,
                height: 70,
                alignSelf: "center",
                left: 8,
                top: 7,
              }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowCamera(false)}
            style={{
              width: 100,
              height: 30,
              borderRadius: 20,
              position: "absolute",
              top: 10,
              left: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
            }}
          >
            <Text style={{ color: "#101010", fontWeight: "bold" }}>Voltar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#101010",
  },
  button: {
    backgroundColor: "#f1f1f1",
    width: "60%",
    borderRadius: 17,
    flexDirection: "row",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 32,
    textTransform: "uppercase",
  },
  logoImage: {
    width: 250,
    height: 200,
    resizeMode: "contain",
  },
});
