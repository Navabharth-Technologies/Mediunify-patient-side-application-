import React from 'react';

import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

import colors from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

const CustomButton = ({
  title,
  onPress,
  disabled = false,
}) => {
  const { t, isIndic } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, isIndic && { lineHeight: 22 }]}>
        {title ? t(title, title) : ''}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  disabled: {
    opacity: 0.5,
  },

  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CustomButton;