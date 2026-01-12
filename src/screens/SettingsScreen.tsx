import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSettings, updateSettings, Settings, SettingsResponse } from '../services/api';
import { clearSession } from '../services/session';
import { initializeAutoSync, stopAutoSync } from '../services/autoSyncService';
import { initializeAutoReply, stopAutoReply } from '../services/autoReplyService';
import { useAlert } from '../services/alertService';

interface SettingsScreenProps {
  onLogout?: () => void;
}

export default function SettingsScreen({ onLogout }: SettingsScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [settingsData, setSettingsData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Partial<Settings>>({});

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettingsData(data);
      setLocalSettings(data.settings);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Initialize services when settings load
  useEffect(() => {
    if (settingsData && !loading) {
      initializeAutoSync().catch(console.error);
      initializeAutoReply().catch(console.error);
    }

    // Cleanup on unmount
    return () => {
      stopAutoSync();
      stopAutoReply();
    };
  }, [settingsData, loading]);

  const handleToggleSetting = async (key: keyof Settings, value: boolean) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    await saveSettings(updated);

    // Start/stop services based on settings
    if (key === 'auto_sync_enabled') {
      if (value) {
        await initializeAutoSync();
      } else {
        stopAutoSync();
      }
    } else if (key === 'auto_reply_enabled') {
      if (value) {
        await initializeAutoReply();
      } else {
        stopAutoReply();
      }
    }
  };

  const handleUpdateSetting = async (key: keyof Settings, value: string | number) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    await saveSettings(updated);
  };

  const saveSettings = async (settings: Partial<Settings>) => {
    try {
      setSaving(true);
      await updateSettings(settings);
      const data = await getSettings();
      setSettingsData(data);
      setLocalSettings(data.settings);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      showAlert('Error', errorMessage);
      await loadSettings();
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSession();
              // Trigger session check in App.tsx
              onLogout?.();
            } catch (error) {
              showAlert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        translucent={Platform.OS === 'android'}
        backgroundColor={Platform.OS === 'android' ? '#6366f1' : undefined}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {settingsData?.user && (
            <SettingsSection title="Account">
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {settingsData.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{settingsData.user.name}</Text>
                  <Text style={styles.userEmail}>{settingsData.user.email}</Text>
                </View>
              </View>
            </SettingsSection>
          )}

          <SettingsSection title="Preferences">
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Auto Sync</Text>
                <Text style={styles.settingDescription}>
                  Automatically sync emails
                </Text>
              </View>
              <Switch
                value={localSettings.auto_sync_enabled ?? false}
                onValueChange={(value) => handleToggleSetting('auto_sync_enabled', value)}
                disabled={saving}
                trackColor={{ false: '#767577', true: '#ffffff' }}
                thumbColor={localSettings.auto_sync_enabled ? '#6366f1' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Auto Reply</Text>
                <Text style={styles.settingDescription}>
                  Enable automatic email replies
                </Text>
              </View>
              <Switch
                value={localSettings.auto_reply_enabled ?? false}
                onValueChange={(value) => handleToggleSetting('auto_reply_enabled', value)}
                disabled={saving}
                trackColor={{ false: '#767577', true: '#ffffff' }}
                thumbColor={localSettings.auto_reply_enabled ? '#6366f1' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Email Signature</Text>
                <Text style={styles.settingDescription}>
                  Add a signature to your emails
                </Text>
              </View>
            </View>
            <View style={styles.signatureContainer}>
              <TextInput
                style={styles.signatureInput}
                placeholder="Your signature..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={localSettings.signature || ''}
                onChangeText={(value) => handleUpdateSetting('signature', value)}
                multiline
                editable={!saving}
              />
            </View>
          </SettingsSection>

          <SettingsSection title="About">
            <SettingItem label="Version" value="1.0.0" onPress={() => {}} />
            <SettingItem label="Privacy Policy" value="" onPress={() => {}} />
            <SettingItem label="Terms of Service" value="" onPress={() => {}} />
          </SettingsSection>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#c7d2fe',
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
  signatureContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  signatureInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chevron: {
    fontSize: 24,
    color: '#c7d2fe',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
