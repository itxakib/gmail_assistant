import React from 'react';
import { View, StyleSheet } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  isActive?: boolean;
}

export function HomeIcon({
  size = 24,
  color = '#c7d2fe',
  isActive = false,
}: IconProps) {
  const iconColor = isActive ? '#ffffff' : color;
  const s = size;

  return (
    <View style={[styles.container, { width: s, height: s }]}>
      <View
        style={[
          styles.triangle,
          {
            borderBottomColor: iconColor,
            borderLeftWidth: s * 0.4,
            borderRightWidth: s * 0.4,
            borderBottomWidth: s * 0.3,
            top: s * 0.1,
          },
        ]}
      />
      <View
        style={[
          styles.rect,
          {
            backgroundColor: iconColor,
            width: s * 0.55,
            height: s * 0.4,
            bottom: 0,
          },
        ]}
      />
    </View>
  );
}

export function InboxIcon({
  size = 24,
  color = '#c7d2fe',
  isActive = false,
}: IconProps) {
  const iconColor = isActive ? '#ffffff' : color;
  const s = size;

  return (
    <View style={[styles.container, { width: s, height: s }]}>
      <View
        style={[
          styles.rect,
          {
            borderColor: iconColor,
            borderWidth: 2,
            borderRadius: 2,
            width: s * 0.85,
            height: s * 0.6,
            top: s * 0.15,
          },
        ]}
      />
      <View
        style={[
          styles.triangle,
          {
            borderBottomColor: iconColor,
            borderLeftWidth: s * 0.425,
            borderRightWidth: s * 0.425,
            borderBottomWidth: s * 0.2,
            top: s * 0.15,
          },
        ]}
      />
      <View
        style={[
          styles.line,
          { backgroundColor: iconColor, width: s * 0.4, top: s * 0.4 },
        ]}
      />
      <View
        style={[
          styles.line,
          { backgroundColor: iconColor, width: s * 0.3, top: s * 0.55 },
        ]}
      />
    </View>
  );
}

export function AssistantIcon({
  size = 24,
  color = '#c7d2fe',
  isActive = false,
}: IconProps) {
  const iconColor = isActive ? '#ffffff' : color;
  const s = size;

  return (
    <View style={[styles.container, { width: s, height: s }]}>
      <View
        style={[
          styles.circle,
          {
            borderColor: iconColor,
            borderWidth: 2,
            width: s * 0.7,
            height: s * 0.7,
            top: s * 0.05,
          },
        ]}
      />
      <View
        style={[
          styles.circle,
          {
            backgroundColor: iconColor,
            width: s * 0.3,
            height: s * 0.3,
            top: s * 0.2,
          },
        ]}
      />
      <View
        style={[
          styles.rect,
          {
            backgroundColor: iconColor,
            width: s * 0.5,
            height: s * 0.15,
            bottom: s * 0.1,
            borderRadius: 2,
          },
        ]}
      />
    </View>
  );
}

export function SettingsIcon({
  size = 24,
  color = '#c7d2fe',
  isActive = false,
}: IconProps) {
  const iconColor = isActive ? '#ffffff' : color;
  const s = size;

  return (
    <View style={[styles.container, { width: s, height: s }]}>
      <View
        style={[
          styles.circle,
          {
            borderColor: iconColor,
            borderWidth: 2,
            width: s * 0.85,
            height: s * 0.85,
          },
        ]}
      />
      <View
        style={[
          styles.circle,
          {
            backgroundColor: iconColor,
            width: s * 0.4,
            height: s * 0.4,
          },
        ]}
      />
      <View
        style={[
          styles.tooth,
          {
            backgroundColor: iconColor,
            width: s * 0.12,
            height: s * 0.18,
            top: -s * 0.03,
          },
        ]}
      />
      <View
        style={[
          styles.tooth,
          {
            backgroundColor: iconColor,
            width: s * 0.12,
            height: s * 0.18,
            bottom: -s * 0.03,
          },
        ]}
      />
      <View
        style={[
          styles.tooth,
          {
            backgroundColor: iconColor,
            width: s * 0.18,
            height: s * 0.12,
            left: -s * 0.03,
          },
        ]}
      />
      <View
        style={[
          styles.tooth,
          {
            backgroundColor: iconColor,
            width: s * 0.18,
            height: s * 0.12,
            right: -s * 0.03,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  triangle: {
    position: 'absolute',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  rect: {
    position: 'absolute',
    borderRadius: 1,
  },
  circle: {
    borderRadius: 50,
    position: 'absolute',
  },
  line: {
    position: 'absolute',
    height: 1.5,
    left: '50%',
    marginLeft: -12,
    borderRadius: 1,
  },
  tooth: {
    position: 'absolute',
    borderRadius: 1,
  },
});
