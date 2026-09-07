import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../theme/colors';

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  isPassword = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
  rightComponent,
}) => {
  const isPasswordField = secureTextEntry || isPassword;
  const [hidePassword, setHidePassword] = useState(isPasswordField);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, isPasswordField && styles.passwordInput]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary || '#94A3B8'}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPasswordField ? hidePassword : false}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />

        {isPasswordField && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setHidePassword(!hidePassword)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={hidePassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={hidePassword ? '#64748B' : colors.primary || '#00B894'}
            />
          </TouchableOpacity>
        )}

        {rightComponent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text || '#0F172A',
    marginBottom: 8,
  },

  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },

  input: {
    height: 52,
    backgroundColor: colors.inputBackground || '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border || '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text || '#0F172A',
  },

  passwordInput: {
    paddingRight: 48,
  },

  eyeBtn: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
});

export default CustomInput;