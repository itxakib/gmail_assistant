import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getAssistantHistory,
  sendAssistantMessage,
  AssistantMessage,
} from '../services/api';
import { useAlert } from '../services/alertService';

export default function AutoAssistantScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAssistantHistory();
      setMessages(response.messages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat history';
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (inputText.trim() === '' || sending) return;

    const userMessage = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistically add user message
    const tempUserMessage: AssistantMessage = {
      id: Date.now(),
      message: userMessage,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await sendAssistantMessage(userMessage);
      setMessages(prev => {
        const updated = prev.filter(msg => msg.id !== tempUserMessage.id);
        return [...updated, response.user_message, response.assistant_message];
      });
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      showAlert('Error', errorMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar
          barStyle="light-content"
          translucent={Platform.OS === 'android'}
          backgroundColor={Platform.OS === 'android' ? '#6366f1' : undefined}
        />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Auto Assistant</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Email Helper</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading chat history...</Text>
          </View>
        ) : (
          <>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>💬</Text>
                  <Text style={styles.emptyTitle}>No messages yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Start a conversation with your AI assistant
                  </Text>
                </View>
              ) : (
                messages.map(message => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}
              {sending && (
                <View style={styles.aiMessage}>
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              )}
            </ScrollView>

            <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!sending}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || sending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || sending}
                activeOpacity={0.7}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

interface MessageBubbleProps {
  message: AssistantMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          isUser ? styles.userMessageText : styles.aiMessageText,
        ]}
      >
        {message.message}
      </Text>
      <Text
        style={[
          styles.messageTime,
          isUser ? styles.userMessageTime : styles.aiMessageTime,
        ]}
      >
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#c7d2fe',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffffff',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#1f2937',
  },
  aiMessageText: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userMessageTime: {
    color: '#6b7280',
  },
  aiMessageTime: {
    color: '#c7d2fe',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#6366f1',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sendButtonText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '600',
  },
});
