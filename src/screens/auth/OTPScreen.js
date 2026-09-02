import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';

import CustomButton from '../../components/CustomButton';
import colors from '../../theme/colors';

const OTPScreen = ({ navigation }) => {

  const [otp, setOtp] = useState('');

  const handleVerify = () => {

    if (otp === '123456') {

      Alert.alert(
        'Verification Complete',
        'Your account has been verified.',
        [
          {
            text: 'Continue',
            onPress: () =>
              navigation.navigate('Login'),
          },
        ]
      );

    } else {

      Alert.alert(
        'Invalid OTP',
        'Please enter 123456.'
      );

    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.container}>

        <Text style={styles.title}>
          Verify Your Account
        </Text>

        <Text style={styles.subtitle}>
          Enter the OTP to continue.
        </Text>

        <Text style={styles.demo}>
          Demo OTP: 123456
        </Text>

        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
          placeholderTextColor={colors.textSecondary}
        />

        <CustomButton
          title="Verify OTP"
          onPress={handleVerify}
        />

      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    marginBottom: 15,
  },

  demo: {
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 15,
  },

  otpInput: {
    height: 60,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    color: colors.text,
    marginBottom: 25,
  },

});

export default OTPScreen;