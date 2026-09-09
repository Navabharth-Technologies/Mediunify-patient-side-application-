import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '../../../utils/alert';

import * as ImagePicker from 'expo-image-picker';

import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';


const RadiologyReportUploadScreen = ({
  route,
  navigation,
}) => {

  const booking =
    route?.params?.booking;


  const [imageUri, setImageUri] =
    useState(null);

  const [saving, setSaving] =
    useState(false);


  // ==================================================
  // TAKE PHOTO
  // ==================================================

  const takePhoto = async () => {

    try {

      const permission =
        await ImagePicker.requestCameraPermissionsAsync();


      if (!permission.granted) {

        showAlert(
          'Camera Permission Required',
          'Please allow camera access to capture your medical report.'
        );

        return;
      }


      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 1,
        });


      if (
        !result.canceled &&
        result.assets?.length > 0
      ) {

        setImageUri(
          result.assets[0].uri
        );
      }

    } catch (error) {

      console.log(
        'Camera Error:',
        error
      );

      showAlert(
        'Camera Error',
        'Unable to open the camera.'
      );
    }
  };


  // ==================================================
  // SELECT FROM GALLERY
  // ==================================================

  const chooseFromGallery = async () => {

    try {

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();


      if (!permission.granted) {

        showAlert(
          'Gallery Permission Required',
          'Please allow access to your photos.'
        );

        return;
      }


      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 1,
        });


      if (
        !result.canceled &&
        result.assets?.length > 0
      ) {

        setImageUri(
          result.assets[0].uri
        );
      }

    } catch (error) {

      console.log(
        'Gallery Error:',
        error
      );

      showAlert(
        'Gallery Error',
        'Unable to open your gallery.'
      );
    }
  };


  // ==================================================
  // SELECT SOURCE
  // ==================================================

  const chooseImage = () => {

    showAlert(
      'Upload Scan / Report',
      'Choose how you want to add your medical image.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Take Photo',
          onPress: takePhoto,
        },

        {
          text: 'Choose from Gallery',
          onPress:
            chooseFromGallery,
        },
      ]
    );
  };


  // ==================================================
  // REMOVE IMAGE
  // ==================================================

  const removeImage = () => {

    showAlert(
      'Remove Image',
      'Do you want to remove this image?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            setImageUri(null),
        },
      ]
    );
  };


  // ==================================================
  // SUBMIT
  // ==================================================

  const submitBooking = async () => {

    if (!booking) {

      showAlert(
        'Booking Error',
        'Booking information is unavailable.'
      );

      return;
    }


    if (!imageUri) {

      showAlert(
        'Report Required',
        'Please upload an X-ray, CT, MRI, ultrasound image, or medical report.'
      );

      return;
    }


    try {

      setSaving(true);


      const finalBooking = {

        ...booking,

        reportImage:
          imageUri,

        status:
          'Pending Verification',

        submittedAt:
          new Date().toISOString(),

      };


      const existing =
        await AsyncStorage.getItem(
          'radiologyBookings'
        );


      const bookings =
        existing
          ? JSON.parse(existing)
          : [];


      bookings.push(
        finalBooking
      );


      await AsyncStorage.setItem(
        'radiologyBookings',
        JSON.stringify(
          bookings
        )
      );


      await AsyncStorage.removeItem(
        'pendingRadiologyBooking'
      );


      setSaving(false);


      showAlert(
        'Appointment Submitted',
        `Your radiology appointment with ${booking.radiologistName} has been submitted successfully.`,
        [
          {
            text: 'View Bookings',
            onPress: () =>
              navigation.navigate(
                'Bookings'
              ),
          },

          {
            text: 'Done',
            onPress: () =>
              navigation.navigate(
                'Home'
              ),
          },
        ]
      );

    } catch (error) {

      console.log(
        'Submit Error:',
        error
      );


      setSaving(false);


      showAlert(
        'Submission Error',
        'Unable to save the radiology appointment.'
      );
    }
  };


  // ==================================================
  // NO BOOKING
  // ==================================================

  if (!booking) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <View
          style={styles.errorContainer}
        >

          <Ionicons
            name="document-outline"
            size={55}
            color="#90A4AE"
          />

          <Text
            style={styles.errorTitle}
          >
            Booking information unavailable
          </Text>

        </View>

      </SafeAreaView>
    );
  }


  return (

    <SafeAreaView
      style={styles.container}
    >

      {/* HEADER */}

      <View
        style={styles.header}
      >

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation.goBack()
          }
        >

          <Ionicons
            name="arrow-back"
            size={25}
            color="#263238"
          />

        </TouchableOpacity>


        <Text
          style={styles.headerTitle}
        >
          Upload Scan / Report
        </Text>


        <View
          style={styles.headerSpace}
        />

      </View>


      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >

        {/* BOOKING SUMMARY */}

        <View
          style={styles.summaryCard}
        >

          <View
            style={styles.summaryIcon}
          >

            <Ionicons
              name="scan-outline"
              size={28}
              color="#00838F"
            />

          </View>


          <View
            style={styles.summaryInfo}
          >

            <Text
              style={styles.summaryDoctor}
            >
              {booking.radiologistName}
            </Text>

            <Text
              style={styles.summarySpecialty}
            >
              {booking.specialty}
            </Text>

            <Text
              style={styles.summaryDate}
            >
              {booking.date}
              {booking.time
                ? ` • ${booking.time}`
                : ''}
            </Text>

          </View>

        </View>


        {/* TITLE */}

        <Text
          style={styles.sectionTitle}
        >
          Medical Image / Report
        </Text>


        <Text
          style={styles.description}
        >
          Upload an X-ray, CT scan, MRI, ultrasound image, or an existing radiology report for the radiologist to review.
        </Text>


        {/* UPLOAD */}

        {!imageUri ? (

          <TouchableOpacity
            style={styles.uploadCard}
            activeOpacity={0.8}
            onPress={
              chooseImage
            }
          >

            <View
              style={
                styles.uploadIcon
              }
            >

              <Ionicons
                name="cloud-upload-outline"
                size={42}
                color="#00838F"
              />

            </View>


            <Text
              style={
                styles.uploadTitle
              }
            >
              Upload Scan or Report
            </Text>


            <Text
              style={
                styles.uploadText
              }
            >
              Take a photo or select an existing image from your gallery.
            </Text>


            <View
              style={
                styles.uploadButton
              }
            >

              <Ionicons
                name="add"
                size={19}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.uploadButtonText
                }
              >
                Add Image
              </Text>

            </View>

          </TouchableOpacity>

        ) : (

          <View
            style={styles.previewCard}
          >

            {/* PREVIEW HEADER */}

            <View
              style={
                styles.previewHeader
              }
            >

              <Text
                style={
                  styles.previewTitle
                }
              >
                Uploaded Image
              </Text>


              <TouchableOpacity
                onPress={
                  removeImage
                }
              >

                <Ionicons
                  name="trash-outline"
                  size={21}
                  color="#D32F2F"
                />

              </TouchableOpacity>

            </View>


            {/* IMAGE */}

            <Image
              source={{
                uri: imageUri,
              }}
              style={
                styles.previewImage
              }
              resizeMode="contain"
            />


            {/* CHANGE */}

            <TouchableOpacity
              style={
                styles.changeButton
              }
              onPress={
                chooseImage
              }
            >

              <Ionicons
                name="camera-outline"
                size={18}
                color="#00838F"
              />

              <Text
                style={
                  styles.changeText
                }
              >
                Change Image
              </Text>

            </TouchableOpacity>

          </View>

        )}


        {/* SECURITY INFO */}

        <View
          style={styles.infoCard}
        >

          <Ionicons
            name="shield-checkmark-outline"
            size={23}
            color="#1976D2"
          />


          <Text
            style={styles.infoText}
          >
            Your uploaded image is attached to this appointment for radiology review.
          </Text>

        </View>


        {/* SUBMIT */}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!imageUri ||
              saving) &&
              styles.disabledButton,
          ]}
          disabled={
            !imageUri ||
            saving
          }
          activeOpacity={0.8}
          onPress={
            submitBooking
          }
        >

          {saving ? (

            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

          ) : (

            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="#FFFFFF"
            />

          )}


          <Text
            style={
              styles.submitText
            }
          >
            {saving
              ? 'Submitting...'
              : 'Confirm Appointment'}
          </Text>

        </TouchableOpacity>

      </ScrollView>

    </SafeAreaView>
  );
};


// ==================================================
// STYLES
// ==================================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        '#F7F9FC',
    },


    // HEADER

    header: {
      height: 70,
      paddingHorizontal: 18,
      backgroundColor:
        '#FFFFFF',
      flexDirection:
        'row',
      alignItems:
        'center',
      borderBottomWidth: 1,
      borderBottomColor:
        '#ECEFF1',
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        '#F1F5F9',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    headerTitle: {
      flex: 1,
      marginLeft: 14,
      fontSize: 19,
      fontWeight: '800',
      color: '#263238',
    },

    headerSpace: {
      width: 42,
    },


    // CONTENT

    content: {
      padding: 18,
      paddingBottom: 40,
    },


    // SUMMARY

    summaryCard: {
      backgroundColor:
        '#E0F7FA',
      borderRadius: 17,
      padding: 15,
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 22,
    },

    summaryIcon: {
      width: 54,
      height: 54,
      borderRadius: 15,
      backgroundColor:
        '#FFFFFF',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    summaryInfo: {
      flex: 1,
      marginLeft: 12,
    },

    summaryDoctor: {
      fontSize: 16,
      fontWeight: '800',
      color: '#263238',
    },

    summarySpecialty: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '700',
      color: '#00838F',
    },

    summaryDate: {
      marginTop: 4,
      fontSize: 10,
      color: '#607D8B',
    },


    // SECTION

    sectionTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: '#263238',
      marginBottom: 7,
    },

    description: {
      fontSize: 12,
      lineHeight: 18,
      color: '#78909C',
      marginBottom: 15,
    },


    // UPLOAD

    uploadCard: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 18,
      padding: 25,
      borderWidth: 1,
      borderColor:
        '#DDE4EA',
      borderStyle:
        'dashed',
      alignItems:
        'center',
    },

    uploadIcon: {
      width: 78,
      height: 78,
      borderRadius: 23,
      backgroundColor:
        '#E0F7FA',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    uploadTitle: {
      marginTop: 15,
      fontSize: 17,
      fontWeight: '800',
      color: '#263238',
    },

    uploadText: {
      marginTop: 7,
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'center',
      color: '#78909C',
      maxWidth: 290,
    },

    uploadButton: {
      marginTop: 18,
      height: 45,
      borderRadius: 12,
      backgroundColor:
        '#00838F',
      paddingHorizontal: 18,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    uploadButtonText: {
      marginLeft: 6,
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },


    // PREVIEW

    previewCard: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 18,
      padding: 15,
      borderWidth: 1,
      borderColor:
        '#ECEFF1',
    },

    previewHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      marginBottom: 12,
    },

    previewTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#263238',
    },

    previewImage: {
      width: '100%',
      height: 330,
      borderRadius: 12,
      backgroundColor:
        '#F1F4F6',
    },

    changeButton: {
      height: 44,
      marginTop: 12,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        '#00838F',
      justifyContent:
        'center',
      alignItems:
        'center',
      flexDirection:
        'row',
    },

    changeText: {
      marginLeft: 6,
      color: '#00838F',
      fontSize: 13,
      fontWeight: '700',
    },


    // INFO

    infoCard: {
      marginTop: 17,
      padding: 14,
      borderRadius: 14,
      backgroundColor:
        '#E8F1FF',
      flexDirection:
        'row',
      alignItems:
        'flex-start',
    },

    infoText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 11,
      lineHeight: 17,
      color: '#607D8B',
    },


    // SUBMIT

    submitButton: {
      height: 56,
      marginTop: 18,
      borderRadius: 15,
      backgroundColor:
        '#00838F',
      justifyContent:
        'center',
      alignItems:
        'center',
      flexDirection:
        'row',
    },

    disabledButton: {
      opacity: 0.5,
    },

    submitText: {
      marginLeft: 8,
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },


    // ERROR

    errorContainer: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      paddingHorizontal: 25,
    },

    errorTitle: {
      marginTop: 15,
      fontSize: 16,
      fontWeight: '700',
      color: '#78909C',
      textAlign:
        'center',
    },

  });


export default RadiologyReportUploadScreen;