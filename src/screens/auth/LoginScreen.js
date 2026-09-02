import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

import colors from '../../theme/colors';

const LoginScreen = ({ navigation }) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async () => {

    if (!email.trim() || !password.trim()) {

      Alert.alert(
        'Missing Information',
        'Please enter your email and password.'
      );

      return;
    }

    try {

      // ==========================================
      // CREATE USER NAME FROM EMAIL
      // ==========================================

      const emailValue = email.trim();

      let userName =
        emailValue
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .trim();

      // Capitalize each word
      userName = userName
        .split(' ')
        .filter(Boolean)
        .map(
          word =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
        )
        .join(' ');


      // ==========================================
      // SAVE USER DATA
      // ==========================================

      const userData = {

        name: userName,

        email: emailValue,

      };


      await AsyncStorage.setItem(
        'user',
        JSON.stringify(userData)
      );


      // ==========================================
      // SAVE LOGIN STATUS
      // ==========================================

      await AsyncStorage.setItem(
        'isLoggedIn',
        'true'
      );


      console.log(
        'User saved:',
        userData
      );


      // ==========================================
      // GO TO MAIN APP
      // ==========================================

      navigation
        .getParent()
        ?.replace('MainApp');


    } catch (error) {

      console.log(
        'Login storage error:',
        error
      );

      Alert.alert(
        'Login Error',
        'Something went wrong while logging in.'
      );

    }

  };


  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  const handleForgotPassword = () => {

    navigation.navigate(
      'ForgotPassword'
    );

  };


  // ==========================================
  // CREATE ACCOUNT
  // ==========================================

  const handleRegister = () => {

    navigation.navigate(
      'Register'
    );

  };


  return (

    <SafeAreaView
      style={styles.safeArea}
    >

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* LOGO */}

        <View
          style={styles.logoContainer}
        >

          <Image
            source={
              require('../../../assets/logo.png')
            }
            style={styles.logo}
            resizeMode="contain"
          />

        </View>


        {/* HEADER */}

        <View
          style={styles.header}
        >

          <Text
            style={styles.title}
          >
            Welcome Back
          </Text>

          <Text
            style={styles.subtitle}
          >
            Login to your Unnathi OneCare account.
          </Text>

        </View>


        {/* EMAIL */}

        <CustomInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />


        {/* PASSWORD */}

        <CustomInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />


        {/* FORGOT PASSWORD */}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleForgotPassword}
        >

          <Text
            style={styles.forgot}
          >
            Forgot Password?
          </Text>

        </TouchableOpacity>


        {/* LOGIN BUTTON */}

        <CustomButton
          title="Login"
          onPress={handleLogin}
        />


        {/* REGISTER */}

        <View
          style={styles.registerContainer}
        >

          <Text
            style={styles.registerText}
          >
            Don't have an account?
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleRegister}
          >

            <Text
              style={styles.registerLink}
            >
              {' '}Create Account
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

    </SafeAreaView>

  );

};


// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({

  safeArea: {

    flex: 1,

    backgroundColor:
      colors.white,

  },

  content: {

    flexGrow: 1,

    justifyContent:
      'center',

    paddingHorizontal:
      24,

    paddingVertical:
      30,

  },

  logoContainer: {

    alignItems:
      'center',

    marginBottom:
      25,

  },

  logo: {

    width:
      180,

    height:
      90,

  },

  header: {

    marginBottom:
      30,

  },

  title: {

    fontSize:
      30,

    fontWeight:
      '800',

    color:
      colors.text,

    marginBottom:
      10,

  },

  subtitle: {

    fontSize:
      15,

    color:
      colors.textSecondary,

    lineHeight:
      22,

  },

  forgot: {

    textAlign:
      'right',

    color:
      colors.primary,

    fontWeight:
      '600',

    marginBottom:
      15,

  },

  registerContainer: {

    flexDirection:
      'row',

    justifyContent:
      'center',

    marginTop:
      25,

  },

  registerText: {

    color:
      colors.textSecondary,

    fontSize:
      14,

  },

  registerLink: {

    color:
      colors.primary,

    fontWeight:
      '700',

    fontSize:
      14,

  },

});

export default LoginScreen;