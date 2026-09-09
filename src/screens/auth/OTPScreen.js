import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { showAlert } from '../../utils/alert';

import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../../components/CustomButton';
import colors from '../../theme/colors';
import { safeNavigateToMain } from '../../utils/navigationHelper';

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

      // Directly and safely navigate to MainApp on both Web and Mobile!
      await safeNavigateToMain(navigation);
    } else {
      showAlert(
        'Invalid OTP',
        'Please enter the demo OTP code 123456.'
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
    backgroundColor: '#F1F2F4',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    maxWidth: 580,
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