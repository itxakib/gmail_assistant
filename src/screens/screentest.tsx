import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Audio } from "expo-av";
import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
} from "expo-speech-recognition";

export default function VoiceTestScreen() {
  const [spokenText, setSpokenText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState("");

  // Listen for speech results
  useSpeechRecognitionEvent("result", (event: any) => {
    const transcript = event.results?.[0]?.transcript ?? "";
    console.log("Transcript:", transcript);
    setSpokenText(transcript);
    setError("");
  });

  // Listen for errors
  useSpeechRecognitionEvent("error", (event: any) => {
    console.log("Speech recognition error:", event);
    setError(event.error || "Recognition error occurred");
    setIsListening(false);
  });

  // Listen for when recognition ends
  useSpeechRecognitionEvent("end", () => {
    console.log("Speech recognition ended");
    setIsListening(false);
  });

  // Listen for when recognition starts
  useSpeechRecognitionEvent("start", () => {
    console.log("Speech recognition started");
    setIsListening(true);
    setError("");
  });

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === "granted");
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Microphone permission is needed for voice recognition"
        );
      }
    } catch (err) {
      console.error("Permission error:", err);
      setError("Failed to request permissions");
    }
  };

  const startListening = async () => {
    if (!hasPermission) {
      await requestPermissions();
      return;
    }

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert("Permission needed", "Speech recognition permission required");
        return;
      }

      await ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        contextualStrings: ["Anthropic", "Claude", "AI"],
      });
    } catch (err: any) {
      console.error("Start error:", err);
      setError(err.message || "Failed to start recognition");
    }
  };

  const stopListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (err: any) {
      console.error("Stop error:", err);
      setError(err.message || "Failed to stop recognition");
    }
  };

  const clearText = () => {
    setSpokenText("");
    setError("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 Voice to Text</Text>

      <View style={styles.box}>
        <Text style={styles.text}>
          {spokenText || "Tap the microphone to start speaking..."}
        </Text>
      </View>

      {error ? (
        <Text style={styles.errorText}>Error: {error}</Text>
      ) : null}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            isListening ? styles.buttonListening : styles.buttonDefault,
          ]}
          onPress={isListening ? stopListening : startListening}
          disabled={!hasPermission}
        >
          <Text style={styles.buttonText}>
            {isListening ? "🔴 Stop" : "🎤 Start"}
          </Text>
        </TouchableOpacity>

        {spokenText ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonClear]}
            onPress={clearText}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.status}>
        {!hasPermission
          ? "⚠️ Microphone permission needed"
          : isListening
          ? "🎙️ Listening..."
          : "Ready"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 30,
    fontWeight: "bold",
    color: "#333",
  },
  box: {
    minHeight: 150,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  buttonDefault: {
    backgroundColor: "#007AFF",
  },
  buttonListening: {
    backgroundColor: "#FF3B30",
  },
  buttonClear: {
    backgroundColor: "#8E8E93",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
  },
  status: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
});