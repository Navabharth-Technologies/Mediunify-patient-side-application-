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
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

import colors from '../../theme/colors';

const LoginScreen = ({ navigation }) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    const loadLastSaved = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail && storedEmail.trim()) {
          setEmail(storedEmail.trim());
        }
      } catch (e) {}
    };
    loadLastSaved();
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async () => {
    const inputVal = email.trim();
    const inputPassword = password.trim();

    if (!inputVal || !inputPassword) {
      Alert.alert(
        'Missing Information',
        'Please enter your registered email/phone and password.'
      );
      return;
    }

    try {
      const cleanPhone = inputVal.replace(/[^0-9]/g, '');
      const cleanPhone10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
      const lowerEmail = inputVal.toLowerCase();

      // 1. Check registered credentials store
      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      if (regCredsStr) {
        try {
          registeredCreds = JSON.parse(regCredsStr);
        } catch (e) {}
      }

      const matchingCred =
        registeredCreds[lowerEmail] ||
        (cleanPhone10.length === 10 ? registeredCreds[cleanPhone10] : null);

      if (matchingCred) {
        // Enforce password match
        if (matchingCred.password && matchingCred.password !== inputPassword) {
          Alert.alert(
            'Incorrect Password',
            'The password you entered is incorrect. Please verify and try again.',
            [
              { text: 'Try Again' },
              { text: 'Forgot Password?', onPress: () => navigation.navigate('ForgotPassword') },
            ]
          );
          return;
        }
      }

      // 2. Load registered user data
      const regUsersStr = await AsyncStorage.getItem('@unnathi_registered_users');
      let registeredUsers = {};
      if (regUsersStr) {
        try {
          registeredUsers = JSON.parse(regUsersStr);
        } catch (e) {}
      }

      const foundReg =
        (matchingCred && matchingCred.userData) ||
        registeredUsers[lowerEmail] ||
        (cleanPhone10.length === 10 ? registeredUsers[cleanPhone10] : null);

      let userFullName = '';
      let existingEmail = lowerEmail.includes('@') ? lowerEmail : (foundReg?.email || 'user@example.com');
      let existingPhone = cleanPhone10.length === 10 ? `+91 ${cleanPhone10}` : (foundReg?.phone || '+91 98450 12345');
      let existingBlood = 'O+ Positive';
      let existingAge = '28 Yrs';
      let existingGender = 'Male';
      let existingEmergency = `${existingPhone} (Family)`;
      let existingDob = '15/08/1998';

      if (foundReg && foundReg.name && !foundReg.name.includes('@')) {
        userFullName = foundReg.name.trim();
        if (foundReg.email) existingEmail = foundReg.email;
        if (foundReg.phone) existingPhone = foundReg.phone;
        if (foundReg.bloodGroup) existingBlood = foundReg.bloodGroup;
        if (foundReg.age) existingAge = foundReg.age;
        if (foundReg.gender) existingGender = foundReg.gender;
        if (foundReg.emergencyContact) existingEmergency = foundReg.emergencyContact;
        if (foundReg.dob) existingDob = foundReg.dob;
      }

      // Check existing storage if not in registered map
      if (!userFullName) {
        const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
        const storedUser = await AsyncStorage.getItem('user');
        const storedName = await AsyncStorage.getItem('userName');

        let parsed = null;
        if (storedPrimary) {
          try { parsed = JSON.parse(storedPrimary); } catch (e) {}
        } else if (storedUser) {
          try { parsed = JSON.parse(storedUser); } catch (e) {}
        }

        if (parsed?.name && !parsed.name.includes('@') && (!parsed?.email || parsed.email.toLowerCase() === lowerEmail)) {
          userFullName = parsed.name.trim();
          if (parsed.email) existingEmail = parsed.email;
          if (parsed.phone) existingPhone = parsed.phone;
          if (parsed.bloodGroup) existingBlood = parsed.bloodGroup;
          if (parsed.age) existingAge = parsed.age;
          if (parsed.gender) existingGender = parsed.gender;
          if (parsed.emergencyContact) existingEmergency = parsed.emergencyContact;
          if (parsed.dob) existingDob = parsed.dob;
        } else if (storedName && !storedName.includes('@') && storedName.trim()) {
          userFullName = storedName.trim();
        }
      }

      // Fallback: format clean readable full name
      if (!userFullName) {
        const rawPart = lowerEmail.includes('@')
          ? lowerEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/[0-9]/g, '').trim() || lowerEmail.split('@')[0].replace(/[._-]/g, ' ').trim()
          : `User ${cleanPhone10.slice(-4)}`;
        userFullName = rawPart
          .split(' ')
          .filter(Boolean)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ') || 'User Profile';
      }

      // ==========================================
      // SAVE USER DATA
      // ==========================================

      const userData = {
        name: userFullName,
        email: existingEmail,
        phone: existingPhone,
        dob: existingDob,
        bloodGroup: existingBlood,
        age: existingAge,
        gender: existingGender,
        emergencyContact: existingEmergency,
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(userData));
      await AsyncStorage.setItem('userName', userFullName);
      await AsyncStorage.setItem('userEmail', existingEmail);
      await AsyncStorage.setItem('userPhone', existingPhone);

      // Account-specific family members isolation
      const userKey = (existingEmail || cleanPhone10 || 'default').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userFamKey = `@unnathi_family_members_${userKey}`;
      const savedFam = await AsyncStorage.getItem(userFamKey);
      let userFamilyList = [];
      if (savedFam) {
        try {
          userFamilyList = JSON.parse(savedFam);
        } catch (e) {}
      }

      const primaryMember = {
        id: 'self',
        name: `${userFullName} (Self)`,
        displayName: userFullName.split(' ')[0],
        relation: 'Self',
        age: existingAge || '28 Yrs',
        gender: existingGender || 'Male',
        bloodGroup: existingBlood ? existingBlood.split(' ')[0] : 'O+',
        allergies: 'None',
        conditions: 'None',
        icon: 'person',
        themeColor: '#00B894',
        bgLight: '#E6F8F4',
        isPrimary: true,
      };

      if (!Array.isArray(userFamilyList) || userFamilyList.length === 0) {
        userFamilyList = [primaryMember];
      } else {
        // Sync self profile
        let foundSelf = false;
        userFamilyList = userFamilyList.map((m) => {
          if (m.id === 'self' || m.isPrimary || m.relation === 'Self') {
            foundSelf = true;
            return {
              ...m,
              name: `${userFullName} (Self)`,
              displayName: `${userFullName.split(' ')[0]} (Self)`,
              bloodGroup: existingBlood ? existingBlood.split(' ')[0] : m.bloodGroup,
              age: existingAge || m.age,
              gender: existingGender || m.gender,
            };
          }
          return m;
        });
        if (!foundSelf) {
          userFamilyList.unshift(primaryMember);
        }
      }

      await AsyncStorage.setItem(userFamKey, JSON.stringify(userFamilyList));
      await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(userFamilyList));
      await AsyncStorage.setItem('@unnathi_active_patient', JSON.stringify(userFamilyList[0] || primaryMember));


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
    <SafeAreaView style={styles.safeArea}>
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
          {/* LOGO */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Login to your MediUnify account.
            </Text>
          </View>

          {/* EMAIL OR PHONE */}
          <CustomInput
            label="Email or Mobile Phone"
            placeholder="Enter your email or 10-digit phone"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* PASSWORD WITH EYE TOGGLE */}
          <CustomInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            isPassword
          />

          {/* FORGOT PASSWORD */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleForgotPassword}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* LOGIN BUTTON */}
          <CustomButton
            title="Login"
            onPress={() => {
              Keyboard.dismiss();
              handleLogin();
            }}
          />

          {/* REGISTER */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRegister}
            >
              <Text style={styles.registerLink}> Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: 4,
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