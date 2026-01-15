import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tab } from '../components/BottomTabBar';
import { fetchEmails, Email, syncEmails } from '../services/api';
import EmailDetailScreen from './EmailDetailScreen';
import { useAlert } from '../services/alertService';

interface InboxScreenProps {
  onNavigate?: (tab: Tab) => void;
}

export default function InboxScreen({
  onNavigate,
}: InboxScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [emailDetailVisible, setEmailDetailVisible] = useState(false);

  const loadEmails = useCallback(async (page: number = 1, showRefresh: boolean = false, append: boolean = false) => {
    try {
      if (page === 1 && !showRefresh) {
        setLoading(true);
      } else if (append) {
        setLoadingMore(true);
      }
      setError(null);

      const response = await fetchEmails(page, 20);
      
      if (page === 1 || showRefresh) {
        setEmails(response.emails);
      } else {
        setEmails(prev => [...prev, ...response.emails]);
      }
      
      setCurrentPage(response.pagination.current_page);
      setTotalPages(response.pagination.total_pages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load emails';
      setError(errorMessage);
      if (page === 1) {
        showAlert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [showAlert]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Wait for sync to complete
      try {
        await syncEmails();
        // Small delay to ensure backend has processed the synced emails
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (syncError) {
        // Log sync error but continue to load emails anyway
        console.warn('Sync error:', syncError);
      }
      
      // Load emails after sync completes
      await loadEmails(1, true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh emails';
      setError(errorMessage);
      showAlert('Refresh Error', errorMessage);
      setRefreshing(false);
    }
  }, [loadEmails, showAlert]);

  // Load emails on mount (when user navigates to this tab, component remounts)
  useEffect(() => {
    loadEmails(1);
  }, [loadEmails]);

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore && !loading) {
      loadEmails(currentPage + 1, false, true);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleEmailPress = (emailId: number) => {
    setSelectedEmailId(emailId);
    setEmailDetailVisible(true);
  };

  const handleCloseEmailDetail = () => {
    setEmailDetailVisible(false);
    setSelectedEmailId(null);
  };

  const handleReplySent = async () => {
    await loadEmails(currentPage, true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        translucent={Platform.OS === 'android'}
        backgroundColor={Platform.OS === 'android' ? '#6366f1' : undefined}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.syncButtonText}>Sync</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading && emails.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading emails...</Text>
        </View>
      ) : error && emails.length === 0 ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadEmails(1)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : emails.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ffffff" />
          }
        >
          <EmptyState />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ffffff" />
          }
        >
          {emails.map((email) => (
            <EmailItem
              key={email.id}
              email={email}
              formatDate={formatDate}
              onPress={() => handleEmailPress(email.id)}
            />
          ))}
          
          {currentPage < totalPages && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={loadingMore}
              activeOpacity={0.7}
            >
              {loadingMore ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.loadMoreButtonText}>Loading...</Text>
                </>
              ) : (
                <Text style={styles.loadMoreButtonText}>
                  Load More ({totalPages - currentPage} page{totalPages - currentPage > 1 ? 's' : ''} remaining)
                </Text>
              )}
            </TouchableOpacity>
          )}
          
          {currentPage >= totalPages && emails.length > 0 && (
            <View style={styles.endMessage}>
              <Text style={styles.endMessageText}>You've reached the end</Text>
            </View>
          )}
        </ScrollView>
      )}

      <EmailDetailScreen
        emailId={selectedEmailId}
        visible={emailDetailVisible}
        onClose={handleCloseEmailDetail}
        onReplySent={handleReplySent}
      />
    </View>
  );
}

interface EmailItemProps {
  email: Email;
  formatDate: (dateString: string) => string;
  onPress: () => void;
}

function EmailItem({ email, formatDate, onPress }: EmailItemProps) {
  return (
    <TouchableOpacity style={styles.emailItem} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.emailHeader}>
        <View style={styles.emailSenderInfo}>
          <Text style={styles.senderName} numberOfLines={1}>
            {email.from_email.split('@')[0]}
          </Text>
          {!email.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.emailDate}>{formatDate(email.received_at)}</Text>
      </View>
      <Text style={[styles.emailSubject, !email.read && styles.unreadSubject]} numberOfLines={1}>
        {email.subject || '(No Subject)'}
      </Text>
      <Text style={styles.emailPreview} numberOfLines={2}>
        {email.body.replace(/<[^>]*>/g, '').trim() || 'No preview available'}
      </Text>
      <View style={styles.emailFooter}>
        <View style={[styles.providerBadge, email.provider === 'gmail' && styles.gmailBadge]}>
          <Text style={styles.providerText}>{email.provider.toUpperCase()}</Text>
        </View>
        {email.replied_at && (
          <Text style={styles.repliedText}>✓ Replied</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📬</Text>
      <Text style={styles.emptyTitle}>No emails yet</Text>
      <Text style={styles.emptySubtitle}>
        Connect your email account to start managing your inbox
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emailItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emailSenderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  emailDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  emailSubject: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  unreadSubject: {
    fontWeight: '700',
    color: '#1f2937',
  },
  emailPreview: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  emailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  gmailBadge: {
    backgroundColor: '#fef3c7',
  },
  providerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  repliedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
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
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadMoreButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  endMessage: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  endMessageText: {
    fontSize: 14,
    color: '#c7d2fe',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
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
});
