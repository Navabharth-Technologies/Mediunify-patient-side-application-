import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

import colors from '../../theme/colors';

const RegisterScreen = ({ navigation }) => {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {

    if (!name || !email || !phone || !password) {
      Alert.alert(
        'Missing Information',
        'Please fill in all fields.'
      );
      return;
    }

    // Frontend demo OTP
    navigation.navigate('OTP');
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.header}>

          <Text style={styles.title}>
            Create Account
          </Text>

          <Text style={styles.subtitle}>
            Join Unnathi OneCare today.
          </Text>

        </View>

        <CustomInput
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <CustomInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <CustomInput
          label="Phone Number"
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <CustomInput
          label="Password"
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <CustomButton
          title="Create Account"
          onPress={handleRegister}
        />

        <View style={styles.loginContainer}>

          <Text style={styles.loginText}>
            Already have an account?
          </Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Login')
            }
          >
            <Text style={styles.loginLink}>
              {' '}Login
            </Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 30,
  },

  header: {
    marginBottom: 30,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },

  loginText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  loginLink: {
    color: colors.primary,
    fontWeight: '700',
  },

});

export default RegisterScreen;