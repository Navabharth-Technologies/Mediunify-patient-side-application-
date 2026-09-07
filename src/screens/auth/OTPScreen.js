import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../../components/CustomButton';
import colors from '../../theme/colors';

const OTPScreen = ({ navigation, route }) => {

  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {

    if (otp === '123456') {
      setVerifying(true);
      try {
        const passedUser = route?.params?.userData;
        if (passedUser) {
          await AsyncStorage.setItem('user', JSON.stringify(passedUser));
          await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(passedUser));
          await AsyncStorage.setItem('userName', passedUser.name);
          await AsyncStorage.setItem('userEmail', passedUser.email);
          await AsyncStorage.setItem('userPhone', passedUser.phone);
        }
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('userToken', `auth_token_${Date.now()}`);
      } catch (e) {
        console.log('OTP storage save err:', e);
      }
      setVerifying(false);

      const registeredName = route?.params?.userData?.name || 'User';

      Alert.alert(
        'Account Verified 🎉',
        `Welcome to MediUnify, ${registeredName}! Your account details have been saved.`,
        [
          {
            text: 'Get Started',
            onPress: () => {
              navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'MainApp' }],
              });
            },
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