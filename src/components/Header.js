import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const Header = ({
  title,
  subtitle,
  onNotificationPress,
  onBackPress,
  showBack = false,
}) => {
  const { t, isIndic } = useTheme();

  const renderedTitle = typeof title === 'string' ? t(title) : title;
  const renderedSubtitle = typeof subtitle === 'string' ? t(subtitle) : subtitle;

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#263238"
            />
          </TouchableOpacity>
        )}

        <View>
          <Text style={[styles.title, isIndic && { lineHeight: 28 }]}>
            {renderedTitle}
          </Text>

          {subtitle && (
            <Text style={[styles.subtitle, isIndic && { lineHeight: 18 }]}>
              {renderedSubtitle}
            </Text>
          )}
        </View>
      </View>

      {onNotificationPress && (
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onNotificationPress}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color="#263238"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#263238',
  },
  subtitle: {
    fontSize: 13,
    color: '#78909C',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Header;