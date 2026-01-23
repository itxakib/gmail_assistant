import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Voice from "@react-native-voice/voice";

export default function SpeechToText() {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    Voice.onSpeechResults = (event) => {
        if (event.value && event.value.length > 0) {
          setText(event.value[0]);
        }
      };
      
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      await Voice.start("en-US");
    } catch (e) {
      console.log(e);
    }
  };

  const stopListening = async () => {
    await Voice.stop();
  };

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity onPress={startListening}>
        <Text>🎤 Start Speaking</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={stopListening}>
        <Text>⏹ Stop</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 20 }}>Result:</Text>
      <Text>{text}</Text>
    </View>
  );
}
