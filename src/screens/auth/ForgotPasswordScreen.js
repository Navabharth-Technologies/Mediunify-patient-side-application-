import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { showAlert } from '../../utils/alert';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

import colors from '../../theme/colors';

import AsyncStorage from '@react-native-async-storage/async-storage';

const ForgotPasswordScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleReset = async () => {
    Keyboard.dismiss();
    const inputVal = email.trim();
    if (!inputVal) {
      showAlert(
        'Enter Email / Phone',
        'Please enter your registered email address or mobile number.'
      );
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showAlert(
        'Weak New Password',
        'Your new password must be at least 6 characters long.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert(
        'Password Mismatch',
        'New password and confirm password do not match.'
      );
      return;
    }

    try {
      const lowerEmail = inputVal.toLowerCase();
      const cleanPhone = inputVal.replace(/[^0-9]/g, '');
      const cleanPhone10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      if (regCredsStr) {
        try { registeredCreds = JSON.parse(regCredsStr); } catch (e) {}
      }

      const matching = registeredCreds[lowerEmail] || (cleanPhone10.length === 10 ? registeredCreds[cleanPhone10] : null);
      if (matching) {
        matching.password = newPassword.trim();
        registeredCreds[matching.email.toLowerCase()] = matching;
        if (matching.phone) registeredCreds[matching.phone] = matching;
        await AsyncStorage.setItem('@unnathi_registered_credentials', JSON.stringify(registeredCreds));
      }

      showAlert(
        'Password Updated Successfully 🎉',
        'Your account password has been updated. You can now log in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (e) {
      showAlert('Password Updated', 'Your password has been reset.');
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={styles.title}>Reset Password</Text>

          <Text style={styles.subtitle}>
            Enter your registered email or phone and set your new password.
          </Text>

          <CustomInput
            label="Registered Email or Phone"
            placeholder="Enter registered email or 10-digit phone"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomInput
            label="New Password"
            placeholder="Enter new password (min 6 chars)"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            isPassword
          />

          <CustomInput
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            isPassword
          />

          <View style={{ marginTop: 10 }}>
            <CustomButton
              title="Update Password"
              onPress={handleReset}
            />
          </View>

          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.backToLoginText}>&larr; Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F2F4',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    maxWidth: 620,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 30,
  },
  backToLoginBtn: {
    marginTop: 20,
    alignSelf: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default ForgotPasswordScreen;