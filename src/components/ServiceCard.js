import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const ServiceCard = ({
  title,
  icon,
  image,
  color = '#E8F1FF',
  iconColor = '#1565C0',
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: color,
          },
        ]}
      >
        {image ? (
          <Image
            source={image}
            style={styles.image}
          />
        ) : (
          <Ionicons
            name={icon}
            size={28}
            color={iconColor}
          />
        )}
      </View>

      <Text style={styles.title}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 22,
  },

  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },

  image: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },

  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#263238',
    textAlign: 'center',
  },
});

export default ServiceCard;