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
      const passedUser = route?.params?.userData;
      try {
        if (passedUser) {
          await AsyncStorage.setItem('user', JSON.stringify(passedUser));
          await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(passedUser));
          await AsyncStorage.setItem('userName', passedUser.name);
          await AsyncStorage.setItem('userEmail', passedUser.email);
          await AsyncStorage.setItem('userPhone', passedUser.phone);

          // If a referral code was provided during registration, credit ₹250 bonus into the Health Wallet!
          if (passedUser.referralCode) {
            const currentBalStr = await AsyncStorage.getItem('@unnathi_wallet_balance');
            const currentBal = currentBalStr ? parseInt(currentBalStr, 10) : 1250;
            const newBal = currentBal + 250;
            await AsyncStorage.setItem('@unnathi_wallet_balance', newBal.toString());

            const storedTxStr = await AsyncStorage.getItem('@unnathi_wallet_transactions');
            let existingTx = [];
            if (storedTxStr) {
              try {
                existingTx = JSON.parse(storedTxStr);
              } catch (e) {}
            }
            const referralBonusTx = {
              id: `tx-ref-${Date.now()}`,
              title: 'Referral Welcome Bonus',
              subtitle: `Code "${passedUser.referralCode}" applied on registration`,
              amount: '+₹250',
              type: 'credit',
              date: 'Just now',
              icon: 'gift-outline',
            };
            await AsyncStorage.setItem('@unnathi_wallet_transactions', JSON.stringify([referralBonusTx, ...existingTx]));
          }
        }
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('userToken', `auth_token_${Date.now()}`);
      } catch (e) {
        console.log('OTP storage save err:', e);
      }
      setVerifying(false);

      const registeredName = passedUser?.name || 'User';
      const hasReferral = passedUser?.referralCode;

      Alert.alert(
        'Account Verified 🎉',
        hasReferral
          ? `Welcome to MediUnify, ${registeredName}!\n\nReferral code "${passedUser.referralCode}" applied successfully. ₹250 Welcome Bonus has been credited to your Health Wallet!`
          : `Welcome to MediUnify, ${registeredName}! Your account details have been saved.`,
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