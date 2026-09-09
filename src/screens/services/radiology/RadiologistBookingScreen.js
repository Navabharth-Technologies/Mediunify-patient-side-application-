import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { showAlert } from '../../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  requestLocationPermissionWebSafe,
  getCurrentPositionWebSafe,
  reverseGeocodeWebSafe,
} from '../../../utils/locationHelper';


const RadiologistBookingScreen = ({
  route,
  navigation,
}) => {

  const radiologist =
    route?.params?.radiologist;


  // ==================================================
  // PATIENT DETAILS
  // ==================================================

  const [name, setName] =
    useState('');

  const [age, setAge] =
    useState('');

  const [gender, setGender] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [reason, setReason] =
    useState('');

  const [address, setAddress] =
    useState('');


  // ==================================================
  // LOCATION
  // ==================================================

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationData, setLocationData] =
    useState(null);


  // ==================================================
  // DATE / TIME
  // ==================================================

  const [selectedDate, setSelectedDate] =
    useState('Today');

  const [selectedTime, setSelectedTime] =
    useState('');


  // ==================================================
  // LOAD USER DATA
  // ==================================================

  useEffect(() => {

    loadUserData();

    getCurrentAddress();

  }, []);


  const loadUserData = async () => {

    try {

      const stored =
        await AsyncStorage.getItem(
          'userData'
        );

      if (stored) {

        const user =
          JSON.parse(stored);

        setName(
          user.name || ''
        );

        setPhone(
          user.phone || ''
        );
      }

    } catch (error) {

      console.log(
        'User load error:',
        error
      );
    }
  };


  // ==================================================
  // GET CURRENT GPS ADDRESS
  // ==================================================

  const getCurrentAddress = async () => {

    try {

      setLocationLoading(true);


      const servicesEnabled =
        await Location.hasServicesEnabledAsync();


      if (!servicesEnabled) {

        Alert.alert(
          'Location Disabled',
          'Please enable GPS/location services.'
        );

        return;
      }


      const perm =
        await requestLocationPermissionWebSafe();


      if (
        !perm.granted && perm.status !== 'granted'
      ) {

        showAlert(
          'Location Permission Required',
          'Allow location access to automatically fill your address.'
        );

        return;
      }


      const location =
        await getCurrentPositionWebSafe({
          accuracy:
            Location.Accuracy.Balanced,
        });


      const latitude =
        location.coords.latitude;

      const longitude =
        location.coords.longitude;


      setLocationData({
        latitude,
        longitude,
      });


      const addresses =
        await reverseGeocodeWebSafe({
          latitude,
          longitude,
        });


      if (
        addresses &&
        addresses.length > 0
      ) {

        const place =
          addresses[0];


        const addressParts = [
          place.name,
          place.street,
          place.subregion,
          place.city,
          place.region,
          place.postalCode,
          place.country,
        ].filter(Boolean);


        setAddress(
          place.formattedAddress || addressParts.join(', ')
        );
      }

    } catch (error) {

      console.log(
        'GPS address error:',
        error
      );

      Alert.alert(
        'Location Error',
        'Unable to get your current address.'
      );

    } finally {

      setLocationLoading(false);

    }
  };


  // ==================================================
  // VALIDATE FORM
  // ==================================================

  const validateForm = () => {

    if (!name.trim()) {

      Alert.alert(
        'Missing Name',
        'Please enter the patient name.'
      );

      return false;
    }


    if (!age.trim()) {

      Alert.alert(
        'Missing Age',
        'Please enter patient age.'
      );

      return false;
    }


    const numericAge =
      Number(age);


    if (
      isNaN(numericAge) ||
      numericAge < 1 ||
      numericAge > 120
    ) {

      Alert.alert(
        'Invalid Age',
        'Please enter a valid age.'
      );

      return false;
    }


    if (!gender) {

      Alert.alert(
        'Gender Required',
        'Please select gender.'
      );

      return false;
    }


    if (!phone.trim()) {

      Alert.alert(
        'Phone Required',
        'Please enter your phone number.'
      );

      return false;
    }


    if (!reason.trim()) {

      Alert.alert(
        'Reason Required',
        'Please enter the reason for consultation.'
      );

      return false;
    }


    if (!address.trim()) {

      Alert.alert(
        'Address Required',
        'Please provide your current address.'
      );

      return false;
    }


    if (!selectedTime) {

      Alert.alert(
        'Time Required',
        'Please select an available time slot.'
      );

      return false;
    }


    return true;
  };


  // ==================================================
  // CONTINUE TO REPORT UPLOAD
  // ==================================================

  const continueToUpload = async () => {

    if (!validateForm()) {
      return;
    }


    const bookingData = {

      id:
        Date.now().toString(),

      type:
        'Radiologist Consultation',

      radiologistId:
        radiologist.id,

      radiologistName:
        radiologist.name,

      specialty:
        radiologist.specialty,

      hospital:
        radiologist.hospital,

      fee:
        radiologist.fee,

      patientName:
        name.trim(),

      age:
        age.trim(),

      gender:
        gender,

      phone:
        phone.trim(),

      reason:
        reason.trim(),

      address:
        address.trim(),

      latitude:
        locationData?.latitude ||
        null,

      longitude:
        locationData?.longitude ||
        null,

      date:
        selectedDate,

      time:
        selectedTime,

      status:
        'Pending Report Verification',

      createdAt:
        new Date().toISOString(),

    };


    try {

      await AsyncStorage.setItem(
        'pendingRadiologyBooking',
        JSON.stringify(
          bookingData
        )
      );


      navigation.navigate(
        'RadiologyReportUpload',
        {
          booking: bookingData,
        }
      );

    } catch (error) {

      console.log(
        'Save booking error:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to continue with the booking.'
      );
    }
  };


  // ==================================================
  // INVALID DOCTOR
  // ==================================================

  if (!radiologist) {

    return (

      <SafeAreaView
        style={styles.container}
      >

        <View
          style={styles.errorContainer}
        >

          <Ionicons
            name="scan-outline"
            size={55}
            color="#90A4AE"
          />

          <Text
            style={styles.errorTitle}
          >
            Radiologist information unavailable
          </Text>

        </View>

      </SafeAreaView>
    );
  }


  return (

    <SafeAreaView
      style={styles.container}
    >

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.content
          }
        >

          {/* HEADER */}

          <View
            style={styles.header}
          >

            <TouchableOpacity
              style={
                styles.headerButton
              }
              onPress={() =>
                navigation.goBack()
              }
            >

              <Ionicons
                name="arrow-back"
                size={24}
                color="#263238"
              />

            </TouchableOpacity>


            <Text
              style={styles.headerTitle}
            >
              Book Radiologist
            </Text>


            <View
              style={styles.headerSpace}
            />

          </View>


          {/* RADIOLOGIST */}

          <View
            style={styles.doctorCard}
          >

            <View
              style={styles.doctorIcon}
            >

              <Ionicons
                name="person-outline"
                size={31}
                color="#00838F"
              />

            </View>


            <View
              style={styles.doctorInfo}
            >

              <Text
                style={styles.doctorName}
              >
                {radiologist.name}
              </Text>

              <Text
                style={styles.specialty}
              >
                {radiologist.specialty}
              </Text>

              <Text
                style={styles.hospital}
              >
                {radiologist.hospital}
              </Text>

              <Text
                style={styles.fee}
              >
                Consultation ₹{radiologist.fee}
              </Text>

            </View>

          </View>


          {/* DATE */}

          <Text
            style={styles.sectionTitle}
          >
            Select Date
          </Text>


          <View
            style={styles.dateRow}
          >

            {[
              'Today',
              'Tomorrow',
            ].map(
              (date) => (

                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateButton,
                    selectedDate === date &&
                      styles.selectedDate,
                  ]}
                  onPress={() =>
                    setSelectedDate(
                      date
                    )
                  }
                >

                  <Ionicons
                    name="calendar-outline"
                    size={17}
                    color={
                      selectedDate === date
                        ? '#FFFFFF'
                        : '#00838F'
                    }
                  />

                  <Text
                    style={[
                      styles.dateText,
                      selectedDate === date &&
                        styles.selectedDateText,
                    ]}
                  >
                    {date}
                  </Text>

                </TouchableOpacity>

              )
            )}

          </View>


          {/* TIME */}

          <Text
            style={styles.sectionTitle}
          >
            Available Time Slots
          </Text>


          <View
            style={styles.slotGrid}
          >

            {radiologist.slots.map(
              (slot) => (

                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotButton,
                    selectedTime === slot &&
                      styles.selectedSlot,
                  ]}
                  onPress={() =>
                    setSelectedTime(
                      slot
                    )
                  }
                >

                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={
                      selectedTime === slot
                        ? '#FFFFFF'
                        : '#00838F'
                    }
                  />

                  <Text
                    style={[
                      styles.slotText,
                      selectedTime === slot &&
                        styles.selectedSlotText,
                    ]}
                  >
                    {slot}
                  </Text>

                </TouchableOpacity>

              )
            )}

          </View>


          {/* PATIENT */}

          <Text
            style={styles.sectionTitle}
          >
            Patient Details
          </Text>


          {/* NAME */}

          <View
            style={styles.inputContainer}
          >

            <Ionicons
              name="person-outline"
              size={20}
              color="#78909C"
            />

            <TextInput
              style={styles.input}
              placeholder="Patient Name"
              placeholderTextColor="#90A4AE"
              value={name}
              onChangeText={setName}
            />

          </View>


          {/* AGE */}

          <View
            style={styles.inputContainer}
          >

            <Ionicons
              name="calendar-outline"
              size={20}
              color="#78909C"
            />

            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor="#90A4AE"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={3}
            />

          </View>


          {/* GENDER */}

          <Text
            style={styles.label}
          >
            Gender
          </Text>


          <View
            style={styles.genderRow}
          >

            {[
              'Male',
              'Female',
              'Other',
            ].map(
              (item) => (

                <TouchableOpacity
                  key={item}
                  style={[
                    styles.genderButton,
                    gender === item &&
                      styles.selectedGender,
                  ]}
                  onPress={() =>
                    setGender(item)
                  }
                >

                  <Ionicons
                    name={
                      item === 'Male'
                        ? 'male-outline'
                        : item === 'Female'
                        ? 'female-outline'
                        : 'person-outline'
                    }
                    size={17}
                    color={
                      gender === item
                        ? '#FFFFFF'
                        : '#00838F'
                    }
                  />

                  <Text
                    style={[
                      styles.genderText,
                      gender === item &&
                        styles.selectedGenderText,
                    ]}
                  >
                    {item}
                  </Text>

                </TouchableOpacity>

              )
            )}

          </View>


          {/* PHONE */}

          <View
            style={styles.inputContainer}
          >

            <Ionicons
              name="call-outline"
              size={20}
              color="#78909C"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#90A4AE"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

          </View>


          {/* REASON */}

          <Text
            style={styles.label}
          >
            Reason for Consultation
          </Text>


          <View
            style={styles.reasonContainer}
          >

            <Ionicons
              name="document-text-outline"
              size={20}
              color="#78909C"
            />

            <TextInput
              style={styles.reasonInput}
              placeholder="Describe your reason or report concern"
              placeholderTextColor="#90A4AE"
              value={reason}
              onChangeText={setReason}
              multiline
              textAlignVertical="top"
            />

          </View>


          {/* ADDRESS */}

          <Text
            style={styles.label}
          >
            Current Address
          </Text>


          <View
            style={styles.addressContainer}
          >

            <Ionicons
              name="location-outline"
              size={20}
              color="#00838F"
            />

            <TextInput
              style={styles.addressInput}
              placeholder="Enter your address"
              placeholderTextColor="#90A4AE"
              value={address}
              onChangeText={setAddress}
              multiline
              textAlignVertical="top"
            />

          </View>


          {/* GPS */}

          <TouchableOpacity
            style={styles.gpsButton}
            onPress={
              getCurrentAddress
            }
          >

            {locationLoading ? (

              <ActivityIndicator
                size="small"
                color="#00838F"
              />

            ) : (

              <Ionicons
                name="locate-outline"
                size={19}
                color="#00838F"
              />

            )}

            <Text
              style={styles.gpsText}
            >
              {locationLoading
                ? 'Getting location...'
                : 'Use My Current Location'}
            </Text>

          </TouchableOpacity>


          {/* SUMMARY */}

          <View
            style={styles.summaryCard}
          >

            <View>

              <Text
                style={styles.summaryTitle}
              >
                Radiologist Appointment
              </Text>

              <Text
                style={styles.summarySubtitle}
              >
                {radiologist.name}
              </Text>

              <Text
                style={styles.summaryDetails}
              >
                {selectedDate}
                {selectedTime
                  ? ` • ${selectedTime}`
                  : ''}
              </Text>

            </View>


            <Text
              style={styles.summaryPrice}
            >
              ₹{radiologist.fee}
            </Text>

          </View>


          {/* CONTINUE */}

          <TouchableOpacity
            style={styles.confirmButton}
            activeOpacity={0.85}
            onPress={
              continueToUpload
            }
          >

            <Ionicons
              name="document-attach-outline"
              size={21}
              color="#FFFFFF"
            />

            <Text
              style={styles.confirmText}
            >
              Continue to Report Upload
            </Text>

          </TouchableOpacity>

        </ScrollView>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
};


const styles =
  StyleSheet.create({

    flex: {
      flex: 1,
    },

    container: {
      flex: 1,
      backgroundColor:
        '#F7F9FC',
    },

    content: {
      paddingBottom: 35,
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

    headerButton: {
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


    // DOCTOR

    doctorCard: {
      margin: 18,
      padding: 17,
      borderRadius: 18,
      backgroundColor:
        '#FFFFFF',
      flexDirection:
        'row',
      borderWidth: 1,
      borderColor:
        '#ECEFF1',
    },

    doctorIcon: {
      width: 62,
      height: 62,
      borderRadius: 17,
      backgroundColor:
        '#E0F7FA',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    doctorInfo: {
      flex: 1,
      marginLeft: 13,
    },

    doctorName: {
      fontSize: 17,
      fontWeight: '800',
      color: '#263238',
    },

    specialty: {
      marginTop: 4,
      fontSize: 12,
      color: '#00838F',
      fontWeight: '700',
    },

    hospital: {
      marginTop: 4,
      fontSize: 11,
      color: '#78909C',
    },

    fee: {
      marginTop: 6,
      fontSize: 14,
      color: '#2E7D32',
      fontWeight: '800',
    },


    // SECTION

    sectionTitle: {
      marginHorizontal: 18,
      marginTop: 7,
      marginBottom: 12,
      fontSize: 18,
      fontWeight: '800',
      color: '#263238',
    },


    // DATE

    dateRow: {
      paddingHorizontal: 18,
      flexDirection:
        'row',
      gap: 9,
    },

    dateButton: {
      flex: 1,
      height: 45,
      borderRadius: 12,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDE4EA',
      flexDirection:
        'row',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    selectedDate: {
      backgroundColor:
        '#00838F',
      borderColor:
        '#00838F',
    },

    dateText: {
      marginLeft: 6,
      fontSize: 12,
      fontWeight: '700',
      color: '#00838F',
    },

    selectedDateText: {
      color: '#FFFFFF',
    },


    // SLOTS

    slotGrid: {
      paddingHorizontal: 18,
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 9,
    },

    slotButton: {
      width: '23%',
      minWidth: 78,
      height: 44,
      borderRadius: 11,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDE4EA',
      flexDirection:
        'row',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    selectedSlot: {
      backgroundColor:
        '#00838F',
      borderColor:
        '#00838F',
    },

    slotText: {
      marginLeft: 4,
      fontSize: 10,
      fontWeight: '700',
      color: '#00838F',
    },

    selectedSlotText: {
      color: '#FFFFFF',
    },


    // INPUT

    inputContainer: {
      height: 52,
      marginHorizontal: 18,
      marginBottom: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDE4EA',
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    input: {
      flex: 1,
      marginLeft: 10,
      fontSize: 14,
      color: '#263238',
    },

    label: {
      marginHorizontal: 18,
      fontSize: 13,
      fontWeight: '700',
      color: '#455A64',
      marginBottom: 9,
    },


    // GENDER

    genderRow: {
      paddingHorizontal: 18,
      flexDirection:
        'row',
      gap: 9,
      marginBottom: 12,
    },

    genderButton: {
      flex: 1,
      height: 44,
      borderRadius: 11,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDE4EA',
      justifyContent:
        'center',
      alignItems:
        'center',
      flexDirection:
        'row',
    },

    selectedGender: {
      backgroundColor:
        '#00838F',
      borderColor:
        '#00838F',
    },

    genderText: {
      marginLeft: 5,
      fontSize: 11,
      fontWeight: '700',
      color: '#00838F',
    },

    selectedGenderText: {
      color: '#FFFFFF',
    },


    // REASON

    reasonContainer: {
      minHeight: 100,
      marginHorizontal: 18,
      padding: 14,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDE4EA',
      flexDirection:
        'row',
      alignItems:
        'flex-start',
    },

    reasonInput: {
      flex: 1,
      minHeight: 70,
      marginLeft: 9,
      paddingTop: 0,
      fontSize: 13,
      color: '#263238',
    },


    // ADDRESS

    addressContainer: {
      minHeight: 95,
      marginHorizontal: 18,
      padding: 14,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDE4EA',
      flexDirection:
        'row',
      alignItems:
        'flex-start',
    },

    addressInput: {
      flex: 1,
      minHeight: 65,
      marginLeft: 9,
      paddingTop: 0,
      fontSize: 13,
      color: '#263238',
    },


    // GPS

    gpsButton: {
      marginHorizontal: 18,
      marginTop: 9,
      height: 44,
      borderRadius: 12,
      backgroundColor:
        '#E0F7FA',
      flexDirection:
        'row',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    gpsText: {
      marginLeft: 6,
      fontSize: 12,
      fontWeight: '800',
      color: '#00838F',
    },


    // SUMMARY

    summaryCard: {
      marginHorizontal: 18,
      marginTop: 22,
      padding: 17,
      borderRadius: 17,
      backgroundColor:
        '#E0F7FA',
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    summaryTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#263238',
    },

    summarySubtitle: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: '700',
      color: '#00838F',
    },

    summaryDetails: {
      marginTop: 3,
      fontSize: 11,
      color: '#607D8B',
    },

    summaryPrice: {
      fontSize: 22,
      fontWeight: '900',
      color: '#00838F',
    },


    // CONFIRM

    confirmButton: {
      height: 56,
      marginHorizontal: 18,
      marginTop: 15,
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

    confirmText: {
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
    },

    errorTitle: {
      marginTop: 15,
      fontSize: 16,
      color: '#78909C',
      fontWeight: '700',
    },

  });


export default RadiologistBookingScreen;