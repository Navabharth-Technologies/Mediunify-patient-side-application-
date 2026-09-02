import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

import colors from '../../theme/colors';

const ForgotPasswordScreen = ({ navigation }) => {

  const [email, setEmail] = useState('');

  const handleReset = () => {

    if (!email) {
      Alert.alert(
        'Enter Email',
        'Please enter your email address.'
      );
      return;
    }

    Alert.alert(
      'Password Reset',
      'For frontend testing, your password reset request has been accepted.',
      [
        {
          text: 'Back to Login',
          onPress: () =>
            navigation.navigate('Login'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>

        <Text style={styles.title}>
          Forgot Password?
        </Text>

        <Text style={styles.subtitle}>
          Enter your email address to reset your password.
        </Text>

        <CustomInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <CustomButton
          title="Reset Password"
          onPress={handleReset}
        />

      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  content: {
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
    lineHeight: 22,
    marginBottom: 30,
  },

});

export default ForgotPasswordScreen;