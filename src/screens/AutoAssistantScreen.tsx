import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
} from "expo-speech-recognition";

import { Feather, Ionicons } from "@expo/vector-icons";

import {
  getAssistantHistory,
  sendAssistantMessage,
  AssistantMessage,
} from "../services/api";
import { useAlert } from "../services/alertService";

export default function AutoAssistantScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // 🎤 Voice states
  const [isListening, setIsListening] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /* =========================
     Load Chat History
  ========================= */
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAssistantHistory();
      setMessages(response.messages);
    } catch (error) {
      showAlert("Error", "Failed to load chat history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  /* =========================
     Mic Permission
  ========================= */
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasMicPermission(status === "granted");
    })();
  }, []);

  /* =========================
     Pulse Animation
  ========================= */
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  /* =========================
     Speech Events
  ========================= */
  useSpeechRecognitionEvent("start", () => {
    setIsListening(true);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent("error", () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent("result", (event: any) => {
    const transcript = event.results?.[0]?.transcript ?? "";
    setInputText(transcript);
  });

  /* =========================
     Voice Controls
  ========================= */
  const startVoice = async () => {
    if (!hasMicPermission) {
      showAlert("Permission", "Microphone permission required");
      return;
    }

    try {
      await ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
    } catch (err) {
      showAlert("Error", "Failed to start voice recognition");
    }
  };

  const stopVoice = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch {}
  };

  /* =========================
     Send Message
  ========================= */
  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    const tempMessage: AssistantMessage = {
      id: Date.now(),
      message: text,
      role: "user",
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await sendAssistantMessage(text);
      setMessages(prev =>
        prev.filter(m => m.id !== tempMessage.id).concat([
          response.user_message,
          response.assistant_message,
        ])
      );
    } catch (error) {
      showAlert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Auto Assistant</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Email Helper</Text>
        </View>

        {/* Messages */}
        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {sending && (
              <View style={styles.aiMessage}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          {/* Listening Indicator */}
          {isListening && (
            <View style={styles.listeningIndicator}>
              <Animated.View 
                style={[
                  styles.listeningDot,
                  { transform: [{ scale: pulseAnim }] }
                ]} 
              />
              <Text style={styles.listeningText}>Listening...</Text>
            </View>
          )}

          <View style={styles.inputRow}>
            {/* 🎤 MIC BUTTON */}
            <TouchableOpacity
              style={[
                styles.micButton,
                isListening && styles.micButtonActive,
              ]}
              onPress={isListening ? stopVoice : startVoice}
            >
              <Feather
                name={isListening ? "mic-off" : "mic"}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Type or speak..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!isListening}
            />

            {/* 📤 SEND BUTTON */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Ionicons name="send" size={20} color="#6366f1" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* =========================
   Message Bubble
========================= */
function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <Text style={isUser ? styles.userText : styles.aiText}>
        {message.message}
      </Text>
    </View>
  );
}

/* =========================
   Styles
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6366f1",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    color: "#e0e7ff",
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#fff",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  userText: {
    color: "#111",
  },
  aiText: {
    color: "#fff",
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  listeningIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    marginRight: 8,
  },
  listeningText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  micButtonActive: {
    backgroundColor: "#ef4444",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 12,
    color: "#fff",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sendDisabled: {
    opacity: 0.4,
  },
});