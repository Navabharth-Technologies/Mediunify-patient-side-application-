import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const Header = ({
  title,
  subtitle,
  onNotificationPress,
  onBackPress,
  showBack = false,
}) => {
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

          <Text style={styles.title}>
            {title}
          </Text>

          {subtitle && (
            <Text style={styles.subtitle}>
              {subtitle}
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
    fontSize: 12,
    color: '#78909C',
    marginTop: 3,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F7F8',
    justifyContent: 'center',
    alignItems: 'center',
  },

});

export default Header;