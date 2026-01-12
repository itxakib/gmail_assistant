import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getEmailDetails,
  generateReply,
  sendReply,
  Email,
} from '../services/api';
import { useAlert } from '../services/alertService';

interface EmailDetailScreenProps {
  emailId: number | null;
  visible: boolean;
  onClose: () => void;
  onReplySent?: () => void;
}

export default function EmailDetailScreen({
  emailId,
  visible,
  onClose,
  onReplySent,
}: EmailDetailScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedReply, setGeneratedReply] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible && emailId) {
      loadEmailDetails();
    } else {
      setEmail(null);
      setGeneratedReply(null);
    }
  }, [visible, emailId]);

  const loadEmailDetails = async () => {
    if (!emailId) return;
    try {
      setLoading(true);
      const response = await getEmailDetails(emailId);
      setEmail(response.email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load email';
      showAlert('Error', errorMessage);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReply = async () => {
    if (!emailId) return;
    try {
      setGenerating(true);
      const response = await generateReply(emailId);
      setGeneratedReply(response.reply);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate reply';
      showAlert('Error', errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReply = async () => {
    if (!emailId || !generatedReply) return;
    try {
      setSending(true);
      await sendReply(emailId, generatedReply);
      showAlert('Success', 'Reply sent successfully!', [
        {
          text: 'OK',
          onPress: () => {
            onReplySent?.();
            onClose();
          },
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reply';
      showAlert('Error', errorMessage);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar
          barStyle="light-content"
          translucent={Platform.OS === 'android'}
          backgroundColor={Platform.OS === 'android' ? '#6366f1' : undefined}
        />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Email Details</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading email...</Text>
          </View>
        ) : email ? (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.emailHeader}>
              <Text style={styles.emailSubject}>{email.subject || '(No Subject)'}</Text>
              <View style={styles.emailMeta}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>From:</Text>
                  <Text style={styles.metaValue}>{email.from_email}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>To:</Text>
                  <Text style={styles.metaValue}>{email.to_email}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Date:</Text>
                  <Text style={styles.metaValue}>{formatDate(email.received_at)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Status:</Text>
                  <View style={styles.statusContainer}>
                    {email.read ? (
                      <Text style={styles.statusText}>✓ Read</Text>
                    ) : (
                      <Text style={[styles.statusText, styles.unreadText]}>● Unread</Text>
                    )}
                    {email.replied_at && (
                      <Text style={[styles.statusText, styles.repliedText]}>✓ Replied</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.emailBody}>
              <Text style={styles.bodyText}>
                {email.body.replace(/<[^>]*>/g, '').trim() || 'No content available'}
              </Text>
            </View>

            <View style={styles.replySection}>
              {!generatedReply && (
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleGenerateReply}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.generateButtonText}>Generate Auto Reply</Text>
                  )}
                </TouchableOpacity>
              )}

              {generatedReply && (
                <View style={styles.replyPreview}>
                  <Text style={styles.replyPreviewLabel}>Generated Reply:</Text>
                  <View style={styles.replyPreviewBox}>
                    <Text style={styles.replyPreviewText}>{generatedReply}</Text>
                  </View>
                  <View style={styles.replyActions}>
                    <TouchableOpacity
                      style={styles.regenerateButton}
                      onPress={() => {
                        setGeneratedReply(null);
                        handleGenerateReply();
                      }}
                      disabled={generating}
                    >
                      <Text style={styles.regenerateButtonText}>Regenerate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={handleSendReply}
                      disabled={sending}
                    >
                      {sending ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.sendButtonText}>Send Reply</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 32,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emailHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  emailSubject: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  emailMeta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c7d2fe',
    width: 60,
  },
  metaValue: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  unreadText: {
    color: '#fbbf24',
  },
  repliedText: {
    color: '#10b981',
  },
  emailBody: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    minHeight: 200,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#1f2937',
  },
  replySection: {
    marginTop: 20,
  },
  generateButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  replyPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  replyPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e0e7ff',
    marginBottom: 12,
  },
  replyPreviewBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    minHeight: 150,
  },
  replyPreviewText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#1f2937',
  },
  replyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  regenerateButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  regenerateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
