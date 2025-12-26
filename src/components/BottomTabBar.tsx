import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HomeIcon,
  InboxIcon,
  ComposeIcon,
  AssistantIcon,
  SettingsIcon,
} from './TabIcons';

export type Tab = 'Home' | 'Inbox' | 'Compose' | 'Assistant' | 'Settings';

interface BottomTabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function BottomTabBar({
  activeTab,
  onTabChange,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const tabs: { key: Tab; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'Home', label: 'Home', icon: HomeIcon },
    { key: 'Inbox', label: 'Inbox', icon: InboxIcon },
    { key: 'Compose', label: 'Compose', icon: ComposeIcon },
    { key: 'Assistant', label: 'AI Assist', icon: AssistantIcon },
    { key: 'Settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 4) }]}
    >
      {tabs.map(tab => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.6}
          >
            <IconComponent isActive={isActive} size={22} />
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 4,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabLabel: {
    fontSize: 10,
    color: '#c7d2fe',
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  activeTabLabel: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
