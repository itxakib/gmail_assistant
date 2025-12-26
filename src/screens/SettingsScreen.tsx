import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [autoSync, setAutoSync] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <SettingsSection title="Account">
          <SettingItem
            label="Email Account"
            value="Not connected"
            onPress={() => {}}
          />
          <SettingItem label="Sync Status" value="Active" onPress={() => {}} />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Auto Sync</Text>
              <Text style={styles.settingDescription}>
                Automatically sync emails
              </Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: '#767577', true: '#ffffff' }}
              thumbColor={autoSync ? '#6366f1' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive email notifications
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#ffffff' }}
              thumbColor={notifications ? '#6366f1' : '#f4f3f4'}
            />
          </View>
        </SettingsSection>

        <SettingsSection title="About">
          <SettingItem label="Version" value="1.0.0" onPress={() => {}} />
          <SettingItem label="Privacy Policy" value="" onPress={() => {}} />
          <SettingItem label="Terms of Service" value="" onPress={() => {}} />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

interface SettingItemProps {
  label: string;
  value: string;
  onPress: () => void;
}

function SettingItem({ label, value, onPress }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLabelContainer}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0e7ff',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#c7d2fe',
  },
  settingValue: {
    fontSize: 14,
    color: '#c7d2fe',
    marginTop: 4,
  },
  chevron: {
    fontSize: 24,
    color: '#c7d2fe',
    marginLeft: 12,
  },
});
