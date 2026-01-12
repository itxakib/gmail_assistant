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
import { getDashboardData, DashboardResponse } from '../services/api';
import EmailDetailScreen from './EmailDetailScreen';
import { useAlert } from '../services/alertService';

interface HomeScreenProps {
  onNavigate?: (tab: Tab) => void;
}

export default function HomeScreen({
  onNavigate,
}: HomeScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [emailDetailVisible, setEmailDetailVisible] = useState(false);

  const loadDashboard = useCallback(async (showRefresh: boolean = false) => {
    try {
      if (!showRefresh) setLoading(true);
      setError(null);

      const data = await getDashboardData();
      setDashboardData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(errorMessage);
      if (!showRefresh) {
        showAlert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard(true);
  }, [loadDashboard]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        translucent={Platform.OS === 'android'}
        backgroundColor={Platform.OS === 'android' ? '#6366f1' : undefined}
      />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>N</Text>
            </View>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Nebubots</Text>
            <Text style={styles.headerSubtitle}>
              AI-Powered Email Assistant
            </Text>
          </View>
        </View>
      </View>

      {loading && !dashboardData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : error && !dashboardData ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadDashboard()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ffffff" />
          }
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>
              Your emails are being managed intelligently
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <StatCard
              number={dashboardData?.stats.total_emails || 0}
              label="Total Emails"
              icon="📧"
            />
            <StatCard
              number={dashboardData?.stats.unread_emails || 0}
              label="Unread"
              icon="📬"
            />
            <StatCard
              number={dashboardData?.stats.replied_emails || 0}
              label="Replied"
              icon="✓"
            />
          </View>

          {dashboardData?.recent_emails && dashboardData.recent_emails.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Emails</Text>
              {dashboardData.recent_emails.slice(0, 3).map((email) => (
                <RecentEmailItem
                  key={email.id}
                  email={email}
                  onPress={() => {
                    setSelectedEmailId(email.id);
                    setEmailDetailVisible(true);
                  }}
                />
              ))}
            </View>
          )}

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Features</Text>
            <FeatureCard
              icon="📧"
              title="Smart Email Management"
              description="Automatically sync and organize your Gmail messages with intelligent categorization"
            />
            <FeatureCard
              icon="🤖"
              title="AI-Powered Replies"
              description="Generate intelligent, context-aware email replies using advanced AI technology"
            />
            <FeatureCard
              icon="🔄"
              title="Auto Sync"
              description="Set up automatic email syncing on your schedule - daily, weekly, or custom intervals"
            />
          </View>

          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigate?.('Inbox')}
            >
              <Text style={styles.actionButtonText}>View Inbox</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <EmailDetailScreen
        emailId={selectedEmailId}
        visible={emailDetailVisible}
        onClose={() => {
          setEmailDetailVisible(false);
          setSelectedEmailId(null);
        }}
      />
    </View>
  );
}

interface StatCardProps {
  number: number;
  label: string;
  icon: string;
}

function StatCard({ number, label, icon }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statNumber}>{number.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface RecentEmailItemProps {
  email: {
    id: number;
    subject: string;
    from_email: string;
    received_at: string;
    read: boolean;
    provider: 'gmail' | 'outlook';
  };
  onPress: () => void;
}

function RecentEmailItem({ email, onPress }: RecentEmailItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.recentEmailItem} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.recentEmailContent}>
        <View style={styles.recentEmailIconContainer}>
          <Text style={styles.recentEmailIcon}>✉</Text>
        </View>
        <View style={styles.recentEmailMain}>
          <View style={styles.recentEmailHeader}>
            <Text style={styles.recentEmailSubject} numberOfLines={1}>
              {email.subject || '(No Subject)'}
            </Text>
            {!email.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.recentEmailFrom} numberOfLines={1}>
            {email.from_email}
          </Text>
          <Text style={styles.recentEmailDate}>{formatDate(email.received_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 12,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  headerText: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#c7d2fe',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  recentEmailItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  recentEmailContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recentEmailIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentEmailIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  recentEmailMain: {
    flex: 1,
  },
  recentEmailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentEmailSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginLeft: 8,
  },
  recentEmailFrom: {
    fontSize: 12,
    color: '#c7d2fe',
    marginBottom: 4,
  },
  recentEmailDate: {
    fontSize: 11,
    color: '#a5b4fc',
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#c7d2fe',
    lineHeight: 20,
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
});
