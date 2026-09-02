import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import colors from '../../theme/colors';


// ==================================================
// EDIT PROFILE SCREEN
// ==================================================

const EditProfileScreen = ({ navigation, route }) => {

  // ==================================================
  // GET USER DATA FROM PROFILE SCREEN
  // ==================================================

  const passedUser = route?.params?.user || {};

  // ==================================================
  // FORM STATE
  // ==================================================

  const [name, setName] = useState(
    passedUser.name || 'Hemanth'
  );

  const [email, setEmail] = useState(
    passedUser.email || 'hemanth@example.com'
  );

  const [phone, setPhone] = useState(
    passedUser.phone || '+91 98765 43210'
  );


  // ==================================================
  // SAVE PROFILE
  // ==================================================

  const handleSave = () => {

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    // ----------------------------------------------
    // VALIDATION
    // ----------------------------------------------

    if (!trimmedName) {

      Alert.alert(
        'Missing Name',
        'Please enter your name.'
      );

      return;
    }


    if (!trimmedEmail) {

      Alert.alert(
        'Missing Email',
        'Please enter your email address.'
      );

      return;
    }


    if (!trimmedEmail.includes('@')) {

      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.'
      );

      return;
    }


    if (!trimmedPhone) {

      Alert.alert(
        'Missing Phone',
        'Please enter your phone number.'
      );

      return;
    }


    // ==================================================
    // UPDATED USER
    // ==================================================

    const updatedUser = {

      name: trimmedName,

      email: trimmedEmail,

      phone: trimmedPhone,

    };


    console.log(
      'Profile updated:',
      updatedUser
    );


    // ==================================================
    // SEND DATA BACK TO PROFILE
    // ==================================================

    navigation.navigate(
      'Profile',
      {
        updatedUser,
      }
    );

  };


  // ==================================================
  // CANCEL
  // ==================================================

  const handleCancel = () => {

    navigation.goBack();

  };


  // ==================================================
  // INPUT COMPONENT
  // ==================================================

  const renderInput = ({
    icon,
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    autoCapitalize,
  }) => {

    return (

      <View
        style={styles.inputGroup}
      >

        {/* LABEL */}

        <Text
          style={styles.inputLabel}
        >
          {label}
        </Text>


        {/* INPUT BOX */}

        <View
          style={styles.inputContainer}
        >

          <View
            style={styles.inputIconContainer}
          >

            <Ionicons
              name={icon}
              size={20}
              color={colors.primary}
            />

          </View>


          <TextInput

            style={styles.input}

            value={value}

            onChangeText={onChangeText}

            placeholder={placeholder}

            placeholderTextColor="#94A3B8"

            keyboardType={
              keyboardType || 'default'
            }

            autoCapitalize={
              autoCapitalize || 'sentences'
            }

            autoCorrect={false}

            selectionColor={
              colors.primary
            }

          />

        </View>

      </View>

    );

  };


  // ==================================================
  // UI
  // ==================================================

  return (

    <SafeAreaView
      style={styles.container}
    >

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.scrollContent
          }
        >

          {/* ==================================================
              HEADER
          ================================================== */}

          <View
            style={styles.header}
          >

            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={handleCancel}
            >

              <Ionicons
                name="arrow-back"
                size={22}
                color={colors.secondary}
              />

            </TouchableOpacity>


            <View
              style={styles.headerTitleContainer}
            >

              <Text
                style={styles.headerSmall}
              >
                MY ACCOUNT
              </Text>

              <Text
                style={styles.headerTitle}
              >
                Edit Profile
              </Text>

            </View>


            <View
              style={styles.headerSpacer}
            />

          </View>


          {/* ==================================================
              PROFILE INTRO
          ================================================== */}

          <View
            style={styles.introCard}
          >

            <View
              style={styles.introIcon}
            >

              <Ionicons
                name="person-outline"
                size={28}
                color={colors.primary}
              />

            </View>


            <View
              style={styles.introTextContainer}
            >

              <Text
                style={styles.introTitle}
              >
                Personal Information
              </Text>

              <Text
                style={styles.introSubtitle}
              >
                Keep your Mediunify profile details
                up to date.
              </Text>

            </View>

          </View>


          {/* ==================================================
              FORM CARD
          ================================================== */}

          <View
            style={styles.formCard}
          >

            {/* NAME */}

            {renderInput({

              icon: 'person-outline',

              label: 'Full Name',

              value: name,

              onChangeText: setName,

              placeholder: 'Enter your full name',

              keyboardType: 'default',

              autoCapitalize: 'words',

            })}


            {/* EMAIL */}

            {renderInput({

              icon: 'mail-outline',

              label: 'Email Address',

              value: email,

              onChangeText: setEmail,

              placeholder: 'Enter your email',

              keyboardType: 'email-address',

              autoCapitalize: 'none',

            })}


            {/* PHONE */}

            {renderInput({

              icon: 'call-outline',

              label: 'Phone Number',

              value: phone,

              onChangeText: setPhone,

              placeholder: 'Enter your phone number',

              keyboardType: 'phone-pad',

              autoCapitalize: 'none',

            })}

          </View>


          {/* ==================================================
              INFORMATION NOTE
          ================================================== */}

          <View
            style={styles.infoBox}
          >

            <View
              style={styles.infoIcon}
            >

              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color={colors.primary}
              />

            </View>


            <Text
              style={styles.infoText}
            >
              Your profile information is used to
              personalize your healthcare experience
              on Mediunify.
            </Text>

          </View>


          {/* ==================================================
              SAVE BUTTON
          ================================================== */}

          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.85}
            onPress={handleSave}
          >

            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color={colors.white}
            />

            <Text
              style={styles.saveButtonText}
            >
              Save Changes
            </Text>

          </TouchableOpacity>


          {/* ==================================================
              CANCEL BUTTON
          ================================================== */}

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.8}
            onPress={handleCancel}
          >

            <Text
              style={styles.cancelButtonText}
            >
              Cancel
            </Text>

          </TouchableOpacity>


          {/* ==================================================
              BOTTOM SPACE
          ================================================== */}

          <View
            style={styles.bottomSpace}
          />

        </ScrollView>

      </KeyboardAvoidingView>

    </SafeAreaView>

  );
};


// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

  // ==================================================
  // CONTAINER
  // ==================================================

  container: {

    flex: 1,

    backgroundColor:
      '#F4F8FA',

  },


  keyboardContainer: {

    flex: 1,

  },


  scrollContent: {

    paddingHorizontal: 18,

    paddingTop: 10,

    paddingBottom: 125,

  },


  // ==================================================
  // HEADER
  // ==================================================

  header: {

    minHeight: 62,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },


  backButton: {

    width: 44,

    height: 44,

    borderRadius: 22,

    backgroundColor:
      colors.white,

    justifyContent: 'center',

    alignItems: 'center',

    borderWidth: 1,

    borderColor:
      colors.border,

    elevation: 2,

    shadowColor: '#000',

    shadowOffset: {

      width: 0,

      height: 2,

    },

    shadowOpacity: 0.05,

    shadowRadius: 5,

  },


  headerTitleContainer: {

    flex: 1,

    marginLeft: 14,

  },


  headerSmall: {

    fontSize: 9,

    fontWeight: '800',

    letterSpacing: 1.4,

    color:
      colors.primary,

  },


  headerTitle: {

    marginTop: 3,

    fontSize: 25,

    fontWeight: '900',

    color:
      colors.secondary,

  },


  headerSpacer: {

    width: 44,

  },


  // ==================================================
  // INTRO CARD
  // ==================================================

  introCard: {

    marginTop: 15,

    backgroundColor:
      '#E8F7F7',

    borderRadius: 20,

    padding: 16,

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderColor:
      '#D5EEEE',

  },


  introIcon: {

    width: 54,

    height: 54,

    borderRadius: 17,

    backgroundColor:
      colors.white,

    justifyContent: 'center',

    alignItems: 'center',

  },


  introTextContainer: {

    flex: 1,

    marginLeft: 13,

  },


  introTitle: {

    fontSize: 15,

    fontWeight: '900',

    color:
      colors.secondary,

  },


  introSubtitle: {

    marginTop: 4,

    fontSize: 10,

    lineHeight: 15,

    color:
      colors.slate,

  },


  // ==================================================
  // FORM CARD
  // ==================================================

  formCard: {

    marginTop: 18,

    backgroundColor:
      colors.white,

    borderRadius: 22,

    padding: 17,

    borderWidth: 1,

    borderColor:
      colors.border,

    elevation: 2,

    shadowColor: '#000',

    shadowOffset: {

      width: 0,

      height: 2,

    },

    shadowOpacity: 0.04,

    shadowRadius: 6,

  },


  // ==================================================
  // INPUT GROUP
  // ==================================================

  inputGroup: {

    marginBottom: 18,

  },


  inputLabel: {

    marginBottom: 7,

    fontSize: 12,

    fontWeight: '800',

    color:
      colors.secondary,

  },


  inputContainer: {

    minHeight: 56,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      '#F8FAFC',

    borderWidth: 1,

    borderColor:
      colors.border,

    borderRadius: 15,

    paddingHorizontal: 9,

  },


  inputIconContainer: {

    width: 38,

    height: 38,

    borderRadius: 12,

    backgroundColor:
      '#E6F7F7',

    justifyContent: 'center',

    alignItems: 'center',

  },


  input: {

    flex: 1,

    minHeight: 52,

    marginLeft: 10,

    paddingHorizontal: 2,

    fontSize: 14,

    fontWeight: '600',

    color:
      colors.secondary,

  },


  // ==================================================
  // INFORMATION BOX
  // ==================================================

  infoBox: {

    marginTop: 16,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      '#F0F7FF',

    borderRadius: 16,

    padding: 13,

    borderWidth: 1,

    borderColor:
      '#DCEBFA',

  },


  infoIcon: {

    width: 34,

    height: 34,

    borderRadius: 11,

    backgroundColor:
      colors.white,

    justifyContent: 'center',

    alignItems: 'center',

  },


  infoText: {

    flex: 1,

    marginLeft: 10,

    fontSize: 10,

    lineHeight: 15,

    color:
      colors.slate,

  },


  // ==================================================
  // SAVE BUTTON
  // ==================================================

  saveButton: {

    marginTop: 22,

    height: 56,

    borderRadius: 17,

    backgroundColor:
      colors.primary,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    elevation: 4,

    shadowColor:
      colors.primary,

    shadowOffset: {

      width: 0,

      height: 4,

    },

    shadowOpacity: 0.22,

    shadowRadius: 7,

  },


  saveButtonText: {

    marginLeft: 8,

    fontSize: 14,

    fontWeight: '900',

    color:
      colors.white,

  },


  // ==================================================
  // CANCEL
  // ==================================================

  cancelButton: {

    marginTop: 10,

    height: 50,

    borderRadius: 16,

    backgroundColor:
      colors.white,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor:
      colors.border,

  },


  cancelButtonText: {

    fontSize: 13,

    fontWeight: '800',

    color:
      colors.secondary,

  },


  // ==================================================
  // BOTTOM
  // ==================================================

  bottomSpace: {

    height: 50,

  },

});


export default EditProfileScreen;