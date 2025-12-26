import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tab } from '../components/BottomTabBar';

interface InboxScreenProps {
  onNavigate?: (tab: Tab) => void;
}

export default function InboxScreen({
  onNavigate,
}: InboxScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.composeButton}
            onPress={() => onNavigate?.('Compose')}
          >
            <Text style={styles.composeButtonText}>Compose</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <EmptyState />
      </ScrollView>
    </View>
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
  composeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  composeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
