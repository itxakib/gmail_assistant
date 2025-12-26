import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tab } from '../components/BottomTabBar';

interface ComposeEmailScreenProps {
  onNavigate?: (tab: Tab) => void;
}

export default function ComposeEmailScreen({
  onNavigate,
}: ComposeEmailScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSend = () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      return;
    }
    console.log('Sending email:', { to, subject, body });
    onNavigate?.('Inbox');
  };

  const handleDiscard = () => {
    setTo('');
    setSubject('');
    setBody('');
    onNavigate?.('Inbox');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleDiscard}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Message</Text>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!to.trim() || !subject.trim() || !body.trim()) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!to.trim() || !subject.trim() || !body.trim()}
          >
            <Text
              style={[
                styles.sendButtonText,
                (!to.trim() || !subject.trim() || !body.trim()) &&
                  styles.sendButtonTextDisabled,
              ]}
            >
              Send
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>To</Text>
            <TextInput
              style={styles.input}
              placeholder="Recipient email"
              placeholderTextColor="#9ca3af"
              value={to}
              onChangeText={setTo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="Email subject"
              placeholderTextColor="#9ca3af"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.bodyInput]}
              placeholder="Type your message here..."
              placeholderTextColor="#9ca3af"
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sendButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sendButtonText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: 'rgba(99, 102, 241, 0.5)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bodyInput: {
    minHeight: 200,
    paddingTop: 12,
  },
});
