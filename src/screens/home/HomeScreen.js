import React, { useEffect, useState, useMemo } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../../theme/colors';

import LabPackageCard from '../../components/LabPackageCard';
import FloatingCareAI from '../../components/FloatingCareAI';
import labPackages from '../../data/labPackages';
import { consultationServices, quickServices, moreServices } from '../../data/homeData';

const POPULAR_MYSORE_AREAS = [
  'Kuvempunagar, Mysore',
  'Jayalakshmipuram, Mysore',
  'Saraswathipuram, Mysore',
  'Vijayanagar, Mysore',
  'Gokulam, Mysore',
  'V.V. Mohalla, Mysore',
  'Bannimantap, Mysore',
  'Nazarbad, Mysore',
  'Hebbal, Mysore',
  'Agrahara, Mysore',
  'Devanur, Mysore',
  'Mysore Central',
  'Bangalore Central',
  'Indiranagar, Bangalore',
  'Koramangala, Bangalore',
  'Mangalore Central',
];

const HomeScreen = ({ navigation }) => {
  // ==================================================
  // STATE
  // ==================================================

  const [search, setSearch] = useState('');
  const [userName, setUserName] = useState('User');
  const [locationName, setLocationName] = useState('Kuvempunagar, Mysore');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [customLocalityInput, setCustomLocalityInput] = useState('');
  const [locationToast, setLocationToast] = useState(null);

  const [familyMembers, setFamilyMembers] = useState([
    { id: 'self', name: 'Self', relation: 'Self', isPrimary: true, icon: 'person' },
    { id: 'fam-1', name: 'Sneha', relation: 'Spouse', isPrimary: false, icon: 'woman' },
    { id: 'fam-2', name: 'Suresh Kumar', relation: 'Father', isPrimary: false, icon: 'man' },
    { id: 'fam-3', name: 'Aarav', relation: 'Son', isPrimary: false, icon: 'happy' },
  ]);
  const [activePatient, setActivePatient] = useState({ id: 'self', name: 'Self', relation: 'Self' });
  const [walletBalance, setWalletBalance] = useState(1250);
  const [carePoints, setCarePoints] = useState(500);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [quickTopUpAmount, setQuickTopUpAmount] = useState('500');


  // ==================================================
  // LOAD USER NAME & SAVED LOCATION
  // ==================================================

  const loadUserData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName && storedName.trim()) {
        setUserName(storedName.trim());
      }
      const savedLoc = await AsyncStorage.getItem('@unnathi_user_location');
      if (savedLoc && savedLoc.trim()) {
        setLocationName(savedLoc.trim());
      }

      // Load saved family profiles if any
      const savedFamily = await AsyncStorage.getItem('@family_members');
      if (savedFamily) {
        const parsed = JSON.parse(savedFamily);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = [
            { id: 'self', name: storedName || 'Self', relation: 'Self', isPrimary: true, icon: 'person' },
            ...parsed.map((m) => ({
              id: m.id || `fam-${Math.random()}`,
              name: m.name.split('(')[0].trim(),
              relation: m.relation || 'Family',
              isPrimary: false,
              icon: m.relation === 'Father' || m.gender === 'Male' ? 'man' : 'woman',
            })),
          ];
          setFamilyMembers(formatted);
        }
      }

      // Load active patient
      const savedActive = await AsyncStorage.getItem('@unnathi_active_patient');
      if (savedActive) {
        setActivePatient(JSON.parse(savedActive));
      }

      // Load wallet balance
      const savedWallet = await AsyncStorage.getItem('@unnathi_wallet_balance');
      if (savedWallet) {
        setWalletBalance(parseInt(savedWallet, 10) || 1250);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const handleQuickAddMoney = async (amt) => {
    const num = parseInt(amt, 10);
    if (isNaN(num) || num <= 0) return;
    const newBal = walletBalance + num;
    setWalletBalance(newBal);
    await AsyncStorage.setItem('@unnathi_wallet_balance', newBal.toString());
    showToast(`₹${num.toLocaleString('en-IN')} added to Wallet!`);
  };

  const handleSelectPatient = async (patient) => {
    setActivePatient(patient);
    await AsyncStorage.setItem('@unnathi_active_patient', JSON.stringify(patient));
    showToast(`Care & booking set for: ${patient.name} (${patient.relation})`);
  };

  const showToast = (msg) => {
    setLocationToast(msg);
    setTimeout(() => {
      setLocationToast(null);
    }, 2500);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);


  // ==================================================
  // GET CURRENT GPS LOCATION
  // ==================================================

  const getCurrentLocation = async () => {

    try {

      setLoadingLocation(true);

      const {
        status,
        canAskAgain,
      } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {

        setLocationName(
          'Location unavailable'
        );

        if (canAskAgain) {

          Alert.alert(
            'Location Permission Required',
            'Please allow Unnathi OneCare to access your location so we can show healthcare services near you.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Try Again',
                onPress: getCurrentLocation,
              },
            ]
          );

        } else {

          Alert.alert(
            'Location Permission Denied',
            'Location permission has been denied. Please enable it from your phone settings.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => {
                  Linking.openSettings();
                },
              },
            ]
          );

        }

        return;
      }


      // ==================================================
      // CHECK GPS SERVICE
      // ==================================================

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {

        Alert.alert(
          'GPS is Disabled',
          'Please turn on Location/GPS on your phone and try again.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );

        setLocationName(
          'GPS unavailable'
        );

        return;
      }


      // ==================================================
      // GET CURRENT POSITION
      // ==================================================

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });


      const {
        latitude,
        longitude,
      } = location.coords;


      console.log(
        'GPS Latitude:',
        latitude
      );

      console.log(
        'GPS Longitude:',
        longitude
      );


      // ==================================================
      // REVERSE GEOCODING
      // ==================================================

      const address =
        await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });


      if (
        address &&
        address.length > 0
      ) {

        const place = address[0];

        const city =
          place.city ||
          place.subregion ||
          place.district ||
          place.region;

        const country =
          place.country;


        if (city) {
          const locStr = `${city}, Mysore`;
          setLocationName(locStr);
          await AsyncStorage.setItem('@unnathi_user_location', locStr);
          showToast(`Location set to: ${locStr}`);
        } else {
          setLocationName('Current Location');
        }
      } else {
        setLocationName('Current Location');
      }

      setLocationModalVisible(false);
    } catch (error) {
      console.log('Location Error:', error);
      setLocationName('Kuvempunagar, Mysore');
      Alert.alert(
        'Unable to Get GPS',
        'Could not detect precise GPS position. You can choose any area from the list.'
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  // ==================================================
  // GET GPS WHEN HOME SCREEN OPENS
  // ==================================================

  useEffect(() => {
    // Only detect if no saved location
    AsyncStorage.getItem('@unnathi_user_location').then((saved) => {
      if (!saved) {
        getCurrentLocation();
      }
    });
  }, []);

  // ==================================================
  // LOCATION SELECTOR
  // ==================================================

  const openLocationSelector = () => {
    setLocationModalVisible(true);
  };

  // ==================================================
  // MANUAL LOCATION SELECTION
  // ==================================================

  const selectManualLocation = async (area) => {
    setLocationName(area);
    await AsyncStorage.setItem('@unnathi_user_location', area);
    setLocationModalVisible(false);
    setLocationSearchQuery('');
    showToast(`Location set to: ${area}!`);
  };

  const handleCustomLocalitySubmit = async () => {
    if (!customLocalityInput.trim()) return;
    const custom = `${customLocalityInput.trim()}, Mysore`;
    setLocationName(custom);
    await AsyncStorage.setItem('@unnathi_user_location', custom);
    setLocationModalVisible(false);
    setCustomLocalityInput('');
    showToast(`Location set to: ${custom}!`);
  };

  const filteredLocalities = useMemo(() => {
    if (!locationSearchQuery.trim()) return POPULAR_MYSORE_AREAS;
    return POPULAR_MYSORE_AREAS.filter((loc) =>
      loc.toLowerCase().includes(locationSearchQuery.toLowerCase())
    );
  }, [locationSearchQuery]);


  // ==================================================
  // SEARCH FUNCTION
  // ==================================================

  const handleSearchSubmit = () => {

    const query =
      search
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');


    // ==================================================
    // EMPTY SEARCH
    // ==================================================

    if (!query) {

      Alert.alert(
        'Search',
        'Please enter something to search.'
      );

      return;

    }


    console.log(
      'Search Query:',
      query
    );


    // ==================================================
    // DOCTORS
    // ==================================================

    const doctorKeywords = [

      'doctor',
      'doctors',
      'dr',
      'specialist',
      'specialists',
      'physician',
      'physicians',

      'dermatologist',
      'dermatology',

      'cardiologist',
      'cardiology',

      'neurologist',
      'neurology',

      'orthopedic',
      'orthopaedic',
      'orthopedics',

      'gynecologist',
      'gynaecologist',
      'gynecology',

      'pediatrician',
      'paediatrician',
      'pediatrics',

      'dentist',
      'dentists',
      'dental',

      'psychiatrist',
      'psychiatry',

      'surgeon',

      'skin doctor',
      'heart doctor',
      'child doctor',

    ];


    if (
      doctorKeywords.some(
        keyword => query.includes(keyword)
      )
    ) {

      navigation.navigate(
        'DoctorList'
      );

      return;

    }


    // ==================================================
    // VIDEO CONSULTATION
    // ==================================================

    const videoKeywords = [

      'video',
      'video consultation',
      'video consult',
      'video doctor',

      'online consultation',
      'online consult',
      'online doctor',

      'remote consultation',

      'telemedicine',
      'telehealth',

    ];


    if (
      videoKeywords.some(
        keyword => query.includes(keyword)
      )
    ) {

      navigation.navigate(
        'VideoConsultation'
      );

      return;

    }


    // ==================================================
    // LAB TESTS
    // ==================================================

    const labKeywords = [

      'lab',
      'labs',
      'laboratory',

      'test',
      'tests',

      'blood',
      'blood test',
      'blood tests',

      'urine',
      'urine test',
      'urine tests',

      'diagnostic',
      'diagnostics',

      'health test',
      'health tests',

      'health check',
      'health checkup',
      'health check-up',

      'checkup',
      'check-up',

      'pathology',

      'cbc',
      'cbc test',

      'sugar test',
      'blood sugar',

      'thyroid test',
      'thyroid',

      'cholesterol test',
      'cholesterol',

      'vitamin test',
      'vitamin',

    ];


    if (
      labKeywords.some(
        keyword => query.includes(keyword)
      )
    ) {

      navigation.navigate(
        'LabTests'
      );

      return;

    }


    // ==================================================
    // NEARBY HOSPITALS
    // ==================================================

    const nearbyHospitalKeywords = [

      'nearby hospital',
      'nearby hospitals',

      'hospital near me',
      'hospitals near me',

      'nearest hospital',
      'nearest hospitals',

      'hospital nearby',
      'hospitals nearby',

    ];


    if (
      nearbyHospitalKeywords.some(
        keyword => query.includes(keyword)
      )
    ) {

      navigation.navigate(
        'HospitalList'
      );

      return;

    }


    // ==================================================
    // HOSPITAL / SURGERY
    // ==================================================

    const hospitalKeywords = [

      'hospital',
      'hospitals',

      'surgery',
      'surgeries',

      'operation',
      'operations',

      'hospital care',
      'hospital treatment',

      'surgical',

    ];


    if (
      hospitalKeywords.some(
        keyword => query.includes(keyword)
      )
    ) {

      navigation.navigate(
        'HospitalCare'
      );

      return;

    }


    // ==================================================
    // PHARMACY / MEDICINES
    // ==================================================

    const pharmacyKeywords = [

      'pharmacy',
      'pharmacies',

      'medicine',
      'medicines',

      'tablet',
      'tablets',

      'capsule',
      'capsules',

      'drug',
      'drugs',

      'prescription',
      'prescriptions',

      'medication',
      'medications',

      'medical store',
      'medical shop',

      'chemist',

    ];


    if (
      pharmacyKeywords.some(
        keyword => query.includes(keyword)
      )
    ) {

      navigation.navigate(
        'Pharmacy'
      );

      return;

    }


    // ==================================================
    // IMAGING / SCANS
    // ==================================================

    const imagingKeywords = [

      'scan',
      'scans',

      'imaging',

      'xray',
      'x-ray',
      'x ray',

      'mri',

      'ct',
      'ct scan',
      'ultrasound',
      'sonography',
      'radiology scan',
      'diagnostic imaging',
      'scan',
      'scans',
      'radiology lab',
      'radiology tests',
      'radiology service',
      'radiology',
      'x-ray',
      'xray',
      'mammography',
      'dexa',
      'pet-ct',
      'doppler',
    ];

    if (
      imagingKeywords.some(
        keyword => query.includes(keyword)
      )
    ) {
      navigation.navigate(
        'RadiologyLabs'
      );
      return;
    }

    // ==================================================
    // RADIOLOGIST DOCTOR
    // ==================================================

    const radiologistKeywords = [
      'radiologist',
      'radiologists',
      'radiology doctor',
      'radiology consultation',
    ];

    if (
      radiologistKeywords.some(
        keyword => query.includes(keyword)
      )
    ) {
      navigation.navigate(
        'RadiologyLabs'
      );
      return;
    }


    // ==================================================
    // HEALTH RECORDS
    // ==================================================

    const healthRecordKeywords = [

      'record',
      'records',

      'health record',
      'health records',

      'medical record',
      'medical records',

      'report',
      'reports',

      'medical report',
      'medical reports',

      'prescription history',

      'health history',

    ];


    if (
      healthRecordKeywords.some(
        keyword => query.includes(keyword)
      )
    ) {

      navigation.navigate(
        'HealthRecords'
      );

      return;

    }


    // ==================================================
    // BOOKINGS / APPOINTMENTS
    // ==================================================

    const bookingKeywords = [

      'booking',
      'bookings',

      'appointment',
      'appointments',

      'my appointment',
      'my appointments',

      'my booking',
      'my bookings',

      'scheduled appointment',

    ];


    if (
      bookingKeywords.some(
        keyword => query.includes(keyword)
      )
    ) {

      navigation.navigate(
        'Bookings'
      );

      return;

    }


    // ==================================================
    // EMERGENCY
    // ==================================================

    const emergencyKeywords = [

      'emergency',

      'ambulance',

      'urgent',
      'urgent help',

      'emergency help',

      'medical emergency',

      '108',

    ];


    if (
      emergencyKeywords.some(
        keyword => query.includes(keyword)
      )
    ) {

      navigation.navigate(
        'Emergency'
      );

      return;

    }


    // ==================================================
    // NO RESULTS
    // ==================================================

    Alert.alert(
      'No Results',
      `No healthcare service found for "${search}".`
    );

  };


  // ==================================================
  // CONSULTATION SERVICES
  // ==================================================

  const consultationCards = consultationServices;

  // ==================================================
  // QUICK SERVICES
  // ==================================================

  const homeQuickServices = quickServices;

  // ==================================================
  // MORE SERVICES
  // ==================================================

  const homeMoreServices = moreServices;


  // ==================================================
  // CONSULTATION CARD
  // ==================================================

  const renderConsultationCard = (service) => (
    <TouchableOpacity
        key={service.title}
        style={[
          styles.consultationCard,
          {
            backgroundColor: service.background || colors.lightTeal,
            borderColor: service.borderColor || '#A7F3D0',
          },
        ]}
        activeOpacity={0.88}
        onPress={() => {
          navigation.navigate(service.route);
        }}
      >
        <View style={styles.consultationTextContainer}>
          <Text style={styles.consultationTitle}>
            {service.title}
          </Text>
          <Text style={styles.consultationSubtitle}>
            {service.subtitle}
          </Text>
          <View
            style={[
              styles.consultationArrow,
              { backgroundColor: service.iconColor || colors.primary },
            ]}
          >
            <Ionicons name="arrow-forward" size={14} color={colors.white} />
          </View>
        </View>

        <View style={styles.consultationIconCircle}>
          <Ionicons
            name={service.icon}
            size={38}
            color={service.iconColor || colors.primary}
          />
        </View>
      </TouchableOpacity>
    );

  // ==================================================
  // QUICK SERVICE
  // ==================================================

  const renderQuickService = (service) => (
    <TouchableOpacity
      key={service.title}
      style={styles.quickService}
      activeOpacity={0.85}
      onPress={() => {
        navigation.navigate(service.route);
      }}
    >
      <View
        style={[
          styles.quickIcon,
          {
            backgroundColor: service.background || colors.lightTeal,
          },
        ]}
      >
        <Ionicons
          name={service.icon}
          size={24}
          color={service.iconColor || colors.primary}
        />
      </View>

      <Text style={styles.quickServiceTitle} numberOfLines={1}>
        {service.title}
      </Text>
      <Text style={styles.quickServiceSubtitle} numberOfLines={1}>
        {service.subtitle || ''}
      </Text>
    </TouchableOpacity>
  );

  // ==================================================
  // MORE SERVICE
  // ==================================================

  const renderMoreService = (service) => (
    <TouchableOpacity
      key={service.title}
      style={styles.moreServiceCard}
      activeOpacity={0.85}
      onPress={() => {
        navigation.navigate(service.route);
      }}
    >
      <View
        style={[
          styles.moreServiceIcon,
          {
            backgroundColor: service.color || colors.lightTeal,
          },
        ]}
      >
        <Ionicons
          name={service.icon}
          size={22}
          color={service.iconColor || colors.primary}
        />
      </View>

      <View style={styles.moreServiceInfo}>
        <Text style={styles.moreServiceTitle}>
          {service.title}
        </Text>
        <Text style={styles.moreServiceSubtitle}>
          {service.subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.slate}
      />
    </TouchableOpacity>
  );


  // ==================================================
  // CITY OPTION
  // ==================================================

  const renderCityOption = (city) => (

    <TouchableOpacity
      key={city}
      style={styles.cityOption}
      activeOpacity={0.8}
      onPress={() =>
        selectManualLocation(city)
      }
    >

      <View
        style={styles.cityIcon}
      >

        <Ionicons
          name="business-outline"
          size={21}
          color={colors.primary}
        />

      </View>

      <Text
        style={styles.cityText}
      >
        {city}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={colors.slate}
      />

    </TouchableOpacity>

  );


  // ==================================================
  // BOTTOM NAVIGATION
  // ==================================================

  const goHome = () => {

    navigation.navigate(
      'Home'
    );

  };


  const goInPerson = () => {

    navigation.navigate(
      'DoctorList'
    );

  };


  const goVideo = () => {

    navigation.navigate(
      'VideoConsultation'
    );

  };


  const goAccount = () => {

    navigation.navigate(
      'Profile'
    );

  };


  // ==================================================
  // HOME UI
  // ==================================================

  return (

    <SafeAreaView
      style={styles.container}
    >

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >


        {/* ==================================================
            USER GREETING + LOCATION HEADER
        ================================================== */}

        <View style={styles.topBrandBar}>
          <TouchableOpacity
            style={styles.brandLogoRow}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Home')}
          >
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.mainBrandLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            {/* WALLET BUTTON NEXT TO NOTIFICATION */}
            <TouchableOpacity
              style={styles.headerWalletPill}
              activeOpacity={0.8}
              onPress={() => setWalletModalVisible(true)}
            >
              <Ionicons
                name="wallet"
                size={15}
                color={colors.primary}
              />
              <Text style={styles.headerWalletText}>
                ₹{walletBalance.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIcon}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons
                name="notifications-outline"
                size={21}
                color={colors.secondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileHeaderIcon}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================================
            USER GREETING + LOCATION HEADER
        ================================================== */}

        <View style={styles.locationHeader}>
          <TouchableOpacity
            style={styles.locationLeft}
            activeOpacity={0.78}
            onPress={openLocationSelector}
          >
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={18} color={colors.white} />
            </View>

            <View style={styles.locationDetails}>
              <Text style={styles.greetingText} numberOfLines={1}>
                Hello, {userName} 👋
              </Text>

              <View style={styles.locationChip}>
                <Text style={styles.locationName} numberOfLines={1}>
                  {locationName}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={13}
                  color={colors.secondary}
                  style={{ marginLeft: 3 }}
                />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.changeAreaPillBtn}
            onPress={openLocationSelector}
            activeOpacity={0.8}
          >
            <Text style={styles.changeAreaPillText}>Change Area</Text>
          </TouchableOpacity>
        </View>

        {/* ==================================================
            PATIENT CARE SWITCHER: SELF & FAMILY MEMBERS
        ================================================== */}

        <View style={styles.patientCareSection}>
          <View style={styles.patientCareHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="people" size={16} color={colors.secondary} />
              <Text style={styles.patientCareTitle}>Booking & Care For:</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('FamilyProfiles')}
              activeOpacity={0.8}
            >
              <Text style={styles.manageFamilyText}>Manage Family ›</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.patientChipsScroll}
          >
            {familyMembers.map((member) => {
              const isSelected = activePatient.id === member.id;
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.patientChip,
                    isSelected && styles.patientChipActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => handleSelectPatient(member)}
                >
                  <View
                    style={[
                      styles.patientChipIconBox,
                      isSelected && styles.patientChipIconBoxActive,
                    ]}
                  >
                    <Ionicons
                      name={member.icon || 'person'}
                      size={14}
                      color={isSelected ? colors.white : colors.primary}
                    />
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.patientChipName,
                        isSelected && styles.patientChipNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {member.name}
                    </Text>
                    <Text
                      style={[
                        styles.patientChipRelation,
                        isSelected && styles.patientChipRelationActive,
                      ]}
                    >
                      {member.relation}
                    </Text>
                  </View>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={colors.white}
                      style={{ marginLeft: 3 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* ADD FAMILY MEMBER BUTTON */}
            <TouchableOpacity
              style={styles.addMemberChip}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('FamilyProfiles')}
            >
              <Ionicons name="add-circle" size={16} color={colors.primary} />
              <Text style={styles.addMemberChipText}>+ Add Member</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ACTIVE PATIENT BANNER IF FAMILY MEMBER SELECTED */}
          {activePatient.id !== 'self' && (
            <View style={styles.activePatientBanner}>
              <Ionicons name="information-circle" size={15} color="#059669" />
              <Text style={styles.activePatientBannerText}>
                Active Profile: <Text style={{ fontWeight: '800' }}>{activePatient.name} ({activePatient.relation})</Text> • All test bookings & appointments will be scheduled for this member.
              </Text>
            </View>
          )}
        </View>

        {/* ==================================================
            UNNATHI HEALTH WALLET WIDGET
        ================================================== */}

        <View style={styles.walletHomeCard}>
          <TouchableOpacity
            style={styles.walletHomeLeft}
            activeOpacity={0.85}
            onPress={() => setWalletModalVisible(true)}
          >
            <View style={styles.walletHomeIconBox}>
              <Ionicons name="wallet" size={20} color={colors.primary} />
            </View>

            <View style={{ marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.walletHomeTitle}>Unnathi Wallet</Text>
                <View style={styles.walletHomePointsBadge}>
                  <Ionicons name="sparkles" size={10} color="#D97706" />
                  <Text style={styles.walletHomePointsText}>{carePoints} Pts</Text>
                </View>
              </View>
              <Text style={styles.walletHomeBalance}>
                ₹{walletBalance.toLocaleString('en-IN')}{' '}
                <Text style={{ fontSize: 10.5, fontWeight: '600', color: colors.slate }}>
                  Health Cash
                </Text>
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.walletHomeRightBtns}>
            <TouchableOpacity
              style={styles.walletHomeAddBtn}
              activeOpacity={0.8}
              onPress={() => setWalletModalVisible(true)}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.walletHomeAddBtnText}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.walletHomeReferBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ReferEarn')}
            >
              <Ionicons name="gift-outline" size={14} color={colors.secondary} />
              <Text style={styles.walletHomeReferBtnText}>Earn ₹250</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================================
            SEARCH
        ================================================== */}

        <View
          style={styles.searchContainer}
        >

          <Ionicons
            name="search-outline"
            size={23}
            color={colors.slate}
          />


          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors, hospitals, tests..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={
              handleSearchSubmit
            }
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />


          {search.length > 0 && (

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setSearch('')
              }
              style={
                styles.searchClearButton
              }
            >

              <Ionicons
                name="close-circle"
                size={20}
                color={colors.slate}
              />

            </TouchableOpacity>

          )}


          <TouchableOpacity
            activeOpacity={0.7}
            onPress={
              handleSearchSubmit
            }
            style={styles.searchButton}
          >

            <Ionicons
              name="arrow-forward"
              size={20}
              color={colors.white}
            />

          </TouchableOpacity>

        </View>


        {/* ==================================================
            MAIN BANNER
        ================================================== */}

        <View
          style={styles.carePlanCard}
        >

          <View
            style={styles.carePlanContent}
          >

            <Text
              style={styles.carePlanSmall}
            >
              MEDIUNIFY
            </Text>

            <Text
              style={styles.carePlanTitle}
            >
              Your Health,
              {'\n'}
              Our Priority
            </Text>

            <Text
              style={styles.carePlanText}
            >
              Complete healthcare support
              {'\n'}
              in one place.
            </Text>

            <TouchableOpacity
              style={styles.carePlanButton}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate(
                  'DoctorList'
                )
              }
            >

              <Text
                style={
                  styles.carePlanButtonText
                }
              >
                Explore Care
              </Text>

              <Ionicons
                name="arrow-forward"
                size={17}
                color={colors.white}
              />

            </TouchableOpacity>

          </View>


          <View
            style={styles.carePlanGraphic}
          >

            <View
              style={styles.heartCircle}
            >

              <Ionicons
                name="heart"
                size={55}
                color={colors.accent}
              />

            </View>


            <View
              style={styles.graphicCircle}
            >

              <Ionicons
                name="medical"
                size={30}
                color={colors.white}
              />

            </View>

          </View>

        </View>


        {/* ==================================================
            CONSULTATION
        ================================================== */}

        <View
          style={styles.sectionHeader}
        >

          <Text
            style={styles.sectionTitle}
          >
            Consult a Doctor
          </Text>

          <Text
            style={styles.sectionSubtitle}
          >
            Get expert medical care your way
          </Text>

        </View>


        <View
          style={styles.consultationRow}
        >

          {consultationCards.map(
            renderConsultationCard
          )}

        </View>


        {/* ==================================================
            LAB PACKAGES
        ================================================== */}

        <View
          style={styles.labSectionHeader}
        >

          <View
            style={styles.labHeaderText}
          >

            <Text
              style={styles.sectionTitle}
            >
              Lab Test Packages
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Complete health analysis at affordable prices
            </Text>

          </View>


          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate(
                'LabTests'
              )
            }
          >

            <Text
              style={styles.viewAll}
            >
              View All
            </Text>

          </TouchableOpacity>

        </View>


        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.labPackagesList
          }
        >

          {labPackages.map(
            (item) => (

              <LabPackageCard
                key={item.id}
                packageData={item}
                navigation={navigation}
              />

            )
          )}

        </ScrollView>


        {/* ==================================================
            QUICK ACTIONS (4 KEY HUBS)
        ================================================== */}

        <View style={styles.quickActionsBox}>
          <View style={styles.quickGrid}>
            {homeQuickServices.map(renderQuickService)}
          </View>
        </View>


        {/* ==================================================
            HEALTH INSURANCE & MEDICLAIM BANNER
        ================================================== */}

        <View style={styles.insuranceHomeCard}>
          <View style={styles.insuranceHomeTopRow}>
            <View style={styles.insuranceHomeBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
              <Text style={styles.insuranceHomeBadgeText}>100% CASHLESS AT 10,000+ HOSPITALS</Text>
            </View>
            <View style={styles.taxSavingTag}>
              <Text style={styles.taxSavingTagText}>Save ₹75k Tax (80D)</Text>
            </View>
          </View>

          <Text style={styles.insuranceHomeTitle}>Health Insurance & Mediclaim</Text>
          <Text style={styles.insuranceHomeSub}>
            Protect your family with up to ₹25 Lakh cover. Zero room rent capping & 20-minute cashless claim approvals.
          </Text>

          <View style={styles.insuranceHomeActionsRow}>
            <TouchableOpacity
              style={styles.insuranceHomeCallBtn}
              activeOpacity={0.85}
              onPress={() => {
                Linking.openURL('tel:+918212568888');
              }}
            >
              <Ionicons name="call" size={14} color={colors.secondary} />
              <Text style={styles.insuranceHomeCallBtnText}>Call Enquiry (Free)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.insuranceHomeBuyBtn}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('HealthInsurance')}
            >
              <Text style={styles.insuranceHomeBuyBtnText}>Explore & Buy Plans</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================================
            HOME NURSE & CAREGIVER BOOKING CARD
        ================================================== */}

        <View style={styles.nurseHomeCard}>
          <View style={styles.nurseHomeTopRow}>
            <View style={styles.nurseHomeBadge}>
              <Ionicons name="heart-circle" size={14} color={colors.accent} />
              <Text style={styles.nurseHomeBadgeText}>VERIFIED GNM & B.SC NURSES</Text>
            </View>
            <View style={styles.nurseRateTag}>
              <Text style={styles.nurseRateTagText}>From ₹349/hr • 1-30 Days</Text>
            </View>
          </View>

          <Text style={styles.nurseHomeTitle}>Book Home Nurse & Caregiver</Text>
          <Text style={styles.nurseHomeSub}>
            Book certified nurses for 1 Hour, 12-Hour shifts, or 1 to 30 Days. Post-surgery recovery, IV injections, wound dressing, and elderly care at home.
          </Text>

          <View style={styles.nurseHomeActionsRow}>
            <TouchableOpacity
              style={styles.nurseHomeCallBtn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL('tel:+918212568888')}
            >
              <Ionicons name="call" size={14} color={colors.secondary} />
              <Text style={styles.nurseHomeCallBtnText}>Enquiry Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nurseHomeBookBtn}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('NurseBooking')}
            >
              <Text style={styles.nurseHomeBookBtnText}>Book a Nurse Now</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================================
            EMERGENCY
        ================================================== */}

        <TouchableOpacity
          style={styles.emergencyCard}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate(
              'Emergency'
            )
          }
        >

          <View
            style={styles.emergencyIcon}
          >

            <Ionicons
              name="call"
              size={25}
              color={colors.white}
            />

          </View>


          <View
            style={styles.emergencyInfo}
          >

            <Text
              style={styles.emergencyTitle}
            >
              Emergency Help
            </Text>

            <Text
              style={styles.emergencySubtitle}
            >
              Get immediate medical assistance
            </Text>

          </View>


          <Ionicons
            name="chevron-forward"
            size={24}
            color={colors.white}
          />

        </TouchableOpacity>


        {/* ==================================================
            PROMOTIONAL BANNER
        ================================================== */}

        <View
          style={styles.exploreBanner}
        >

          <View
            style={styles.bannerContent}
          >

            <Text
              style={styles.bannerSmall}
            >
              MEDIUNIFY
            </Text>

            <Text
              style={styles.bannerTitle}
            >
              Everything you need
              {'\n'}
              for better health.
            </Text>

            <Text
              style={styles.bannerText}
            >
              Doctors, hospitals, lab tests,
              {'\n'}
              medicines and more.
            </Text>

          </View>


          <View
            style={styles.bannerIllustration}
          >

            <View
              style={styles.bannerMedicalCircle}
            >

              <Ionicons
                name="medical"
                size={45}
                color={colors.white}
              />

            </View>


            <View
              style={styles.bannerPlus}
            >

              <Ionicons
                name="add"
                size={20}
                color={colors.white}
              />

            </View>

          </View>

        </View>


        {/* ==================================================
            MORE SERVICES
        ================================================== */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            More Healthcare Services
          </Text>
          <Text style={styles.sectionSubtitle}>
            Manage all your healthcare needs
          </Text>
        </View>

        <View style={styles.moreServices}>
          {homeMoreServices.map(renderMoreService)}
        </View>


        {/* ==================================================
            EXTRA SPACE
        ================================================== */}

        <View
          style={{
            height: 130,
          }}
        />

      </ScrollView>


      {/* ==================================================
          FLOATING CARE AI
      ================================================== */}

      <FloatingCareAI
        onPress={() =>
          navigation.navigate(
            'Chatbot'
          )
        }
      />


      {/* ==================================================
          LOCATION SELECTION MODAL
      ================================================== */}

      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choose Location</Text>
                <Text style={styles.modalSubtitle}>
                  Select your area to find nearby doctors, labs & hospitals
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.8}
                onPress={() => setLocationModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* GPS */}
            <TouchableOpacity
              style={styles.gpsOption}
              activeOpacity={0.85}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
            >
              <View style={styles.gpsIcon}>
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="locate" size={22} color={colors.primary} />
                )}
              </View>

              <View style={styles.locationOptionInfo}>
                <Text style={styles.locationOptionTitle}>
                  {loadingLocation ? 'Detecting Live Position...' : 'Use My Current Live GPS'}
                </Text>
                <Text style={styles.locationOptionSubtitle}>
                  Auto-detect GPS coordinates and find closest services
                </Text>
              </View>
            </TouchableOpacity>

            {/* SEARCH AREA */}
            <View style={styles.modalSearchBox}>
              <Ionicons name="search-outline" size={17} color="#94A3B8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search neighborhood or street name..."
                placeholderTextColor="#94A3B8"
                value={locationSearchQuery}
                onChangeText={setLocationSearchQuery}
              />
              {locationSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* POPULAR AREAS LIST */}
            <Text style={styles.popularTitle}>Popular Neighborhoods & Cities:</Text>
            <ScrollView
              style={{ maxHeight: 220 }}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
            >
              {filteredLocalities.map((loc, idx) => {
                const isSelected = locationName.toLowerCase().includes(loc.split(',')[0].toLowerCase());
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.cityOption, isSelected && styles.cityOptionActive]}
                    activeOpacity={0.8}
                    onPress={() => selectManualLocation(loc)}
                  >
                    <View style={[styles.cityIcon, isSelected && { backgroundColor: colors.lightTeal }]}>
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={isSelected ? colors.primary : colors.secondary}
                      />
                    </View>
                    <Text style={[styles.cityText, isSelected && { fontWeight: '800', color: colors.primary }]}>
                      {loc}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={colors.slate} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* CUSTOM LOCATION INPUT */}
            <View style={styles.customAreaBox}>
              <TextInput
                style={styles.customAreaInput}
                placeholder="Or type custom address (e.g. Vijayanagar 4th Stage)"
                placeholderTextColor="#94A3B8"
                value={customLocalityInput}
                onChangeText={setCustomLocalityInput}
              />
              <TouchableOpacity
                style={styles.customAreaSubmitBtn}
                onPress={handleCustomLocalitySubmit}
              >
                <Text style={styles.customAreaSubmitText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================
          WALLET POP-UP MODAL (FLOATING BOTTOM SHEET)
      ================================================== */}
      <Modal
        visible={walletModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.walletModalCard}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.walletModalHeaderIcon}>
                  <Ionicons name="wallet" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Unnathi Health Wallet</Text>
                  <Text style={styles.modalSubtitle}>100% usable on all bookings & orders</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setWalletModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* BALANCE DISPLAY CARD */}
            <View style={styles.walletPopupBalanceBox}>
              <View>
                <Text style={styles.walletPopupLabel}>TOTAL HEALTH CASH</Text>
                <Text style={styles.walletPopupBalanceText}>
                  ₹{walletBalance.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.walletPopupPointsTag}>
                <Ionicons name="sparkles" size={13} color="#F59E0B" />
                <Text style={styles.walletPopupPointsText}>{carePoints} Care Pts</Text>
              </View>
            </View>

            {/* QUICK TOP UP CHIPS */}
            <Text style={styles.walletSectionLabel}>Quick Top-Up via Instant UPI:</Text>
            <View style={styles.walletQuickChipsRow}>
              {['500', '1000', '2000', '5000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.walletQuickChip,
                    quickTopUpAmount === amt && styles.walletQuickChipActive,
                  ]}
                  onPress={() => setQuickTopUpAmount(amt)}
                >
                  <Text
                    style={[
                      styles.walletQuickChipText,
                      quickTopUpAmount === amt && styles.walletQuickChipTextActive,
                    ]}
                  >
                    +₹{parseInt(amt, 10).toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ADD MONEY BUTTON */}
            <TouchableOpacity
              style={styles.walletPopupAddBtn}
              activeOpacity={0.88}
              onPress={() => handleQuickAddMoney(quickTopUpAmount)}
            >
              <Ionicons name="add-circle" size={17} color="#FFFFFF" />
              <Text style={styles.walletPopupAddBtnText}>
                Add ₹{parseInt(quickTopUpAmount, 10).toLocaleString('en-IN')} to Wallet
              </Text>
            </TouchableOpacity>

            {/* PASSBOOK SUMMARY ITEMS */}
            <View style={styles.walletMiniPassbook}>
              <View style={styles.walletMiniRow}>
                <Ionicons name="arrow-down-circle" size={16} color="#059669" />
                <Text style={styles.walletMiniDesc}>+₹250 Referral bonus from Sneha R.</Text>
                <Text style={styles.walletMiniCredit}>+₹250</Text>
              </View>
              <View style={styles.walletMiniRow}>
                <Ionicons name="gift" size={16} color={colors.primary} />
                <Text style={styles.walletMiniDesc}>+₹150 Cashback on Lab Test booking</Text>
                <Text style={styles.walletMiniCredit}>+₹150</Text>
              </View>
            </View>

            {/* FOOTER ACTIONS */}
            <View style={styles.walletPopupFooterRow}>
              <TouchableOpacity
                style={styles.walletPopupReferBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setWalletModalVisible(false);
                  navigation.navigate('ReferEarn');
                }}
              >
                <Ionicons name="gift" size={15} color={colors.secondary} />
                <Text style={styles.walletPopupReferBtnText}>Refer & Earn ₹250</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.walletPopupFullBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setWalletModalVisible(false);
                  navigation.navigate('Wallet');
                }}
              >
                <Text style={styles.walletPopupFullBtnText}>Full Passbook ›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* ==================================================
          BOTTOM FLOATING NAVIGATION
      ================================================== */}

      <View
        style={
          styles.bottomNavigationWrapper
        }
        pointerEvents="box-none"
      >

        <View
          style={styles.bottomNavigation}
          pointerEvents="auto"
        >

          {/* HOME */}

          <TouchableOpacity
            style={styles.bottomItem}
            activeOpacity={0.7}
            onPress={goHome}
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >

            <View
              style={styles.activeBottomIcon}
            >

              <Ionicons
                name="home"
                size={23}
                color={colors.white}
              />

            </View>

            <Text
              style={styles.activeBottomText}
            >
              Home
            </Text>

          </TouchableOpacity>


          {/* IN-PERSON */}

          <TouchableOpacity
            style={styles.bottomItem}
            activeOpacity={0.7}
            onPress={goInPerson}
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >

            <Ionicons
              name="medical-outline"
              size={25}
              color={colors.secondary}
            />

            <Text
              style={styles.bottomText}
            >
              In-Person
            </Text>

          </TouchableOpacity>


          {/* VIDEO */}

          <TouchableOpacity
            style={styles.bottomItem}
            activeOpacity={0.7}
            onPress={goVideo}
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >

            <Ionicons
              name="videocam-outline"
              size={25}
              color={colors.secondary}
            />

            <Text
              style={styles.bottomText}
            >
              Video
            </Text>

          </TouchableOpacity>


          {/* ACCOUNT */}

          <TouchableOpacity
            style={styles.bottomItem}
            activeOpacity={0.7}
            onPress={goAccount}
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >

            <Ionicons
              name="person-circle-outline"
              size={26}
              color={colors.secondary}
            />

            <Text
              style={styles.bottomText}
            >
              Account
            </Text>

          </TouchableOpacity>

        </View>

      </View>

    </SafeAreaView>

  );

};


// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },


  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },


  // ==================================================
  // TOP BRAND BAR WITH LOGO
  // ==================================================

  topBrandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 6,
  },

  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  mainBrandLogo: {
    width: 170,
    height: 52,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  headerWalletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 4,
  },

  headerWalletText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primary,
  },

  // ==================================================
  // LOCATION + USER HEADER
  // ==================================================

  locationHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },

  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  locationDetails: {
    flex: 1,
  },

  greetingText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondary,
  },

  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  locationName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
    maxWidth: 160,
  },

  changeAreaPillBtn: {
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  changeAreaPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
  },

  // ==================================================
  // PATIENT CARE SWITCHER (SELF & FAMILY)
  // ==================================================

  patientCareSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },

  patientCareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  patientCareTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },

  manageFamilyText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },

  patientChipsScroll: {
    gap: 8,
  },

  patientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginRight: 8,
    gap: 6,
  },

  patientChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  patientChipIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },

  patientChipIconBoxActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  patientChipName: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
  },

  patientChipNameActive: {
    color: colors.white,
  },

  patientChipRelation: {
    fontSize: 9.5,
    color: colors.slate,
    marginTop: -1,
  },

  patientChipRelationActive: {
    color: '#D1FAE5',
  },

  addMemberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderStyle: 'dashed',
    gap: 4,
  },

  addMemberChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },

  activePatientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 8,
    gap: 5,
  },

  activePatientBannerText: {
    flex: 1,
    fontSize: 10,
    color: '#065F46',
    lineHeight: 14,
  },


  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },


  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },


  profileHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },


  // ==================================================
  // UNNATHI WALLET HOME CARD
  // ==================================================

  walletHomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.lightTeal,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  walletHomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  walletHomeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },

  walletHomeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },

  walletHomePointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },

  walletHomePointsText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },

  walletHomeBalance: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 1,
  },

  walletHomeRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  walletHomeAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 3,
  },

  walletHomeAddBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  walletHomeReferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    gap: 4,
  },

  walletHomeReferBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E67E22',
  },

  // ==================================================
  // SEARCH
  // ==================================================

  searchContainer: {
    height: 52,
    backgroundColor: colors.white,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
    marginBottom: 16,
  },


  searchInput: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 0,
  },


  searchClearButton: {
    width: 32,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },


  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },


  // ==================================================
  // MAIN BANNER
  // ==================================================

  carePlanCard: {
    height: 190,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    padding: 20,
    overflow: 'hidden',
    flexDirection: 'row',
  },


  carePlanContent: {
    flex: 1,
    zIndex: 2,
  },


  carePlanSmall: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: colors.accent,
  },


  carePlanTitle: {
    marginTop: 8,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    color: colors.white,
  },


  carePlanText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
    color: '#DCE8FF',
  },


  carePlanButton: {
    marginTop: 13,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },


  carePlanButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
    marginRight: 6,
  },


  carePlanGraphic: {
    width: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },


  heartCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor:
      'rgba(0,194,203,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },


  graphicCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
    marginLeft: 25,
  },


  // ==================================================
  // SECTION
  // ==================================================

  sectionHeader: {
    marginTop: 22,
    marginBottom: 12,
  },


  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.secondary,
  },


  sectionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: colors.slate,
  },


  // ==================================================
  // CONSULTATION
  // ==================================================

  consultationRow: {
    flexDirection: 'row',
  },


  consultationCard: {
    flex: 1,
    minHeight: 145,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    marginRight: 10,
  },


  consultationTextContainer: {
    flex: 1,
  },


  consultationTitle: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
    color: colors.secondary,
  },


  consultationSubtitle: {
    marginTop: 7,
    fontSize: 10,
    lineHeight: 15,
    color: colors.slate,
  },


  consultationArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },


  consultationIconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor:
      'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },


  // ==================================================
  // LAB
  // ==================================================

  labSectionHeader: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },


  labHeaderText: {
    flex: 1,
    paddingRight: 10,
  },


  viewAll: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 2,
  },


  labPackagesList: {
    paddingRight: 8,
  },


  // ==================================================
  // QUICK SERVICES
  // ==================================================

  quickActionsBox: {
    marginTop: 14,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  quickService: {
    width: '24%',
    minHeight: 96,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  quickServiceTitle: {
    textAlign: 'center',
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.secondary,
  },

  quickServiceSubtitle: {
    textAlign: 'center',
    fontSize: 8.5,
    color: colors.slate,
    marginTop: 1,
  },

  // ==================================================
  // HEALTH INSURANCE HOME CARD
  // ==================================================

  insuranceHomeCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.lightTeal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  insuranceHomeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  insuranceHomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },

  insuranceHomeBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  taxSavingTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },

  taxSavingTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
  },

  insuranceHomeTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
  },

  insuranceHomeSub: {
    fontSize: 11.5,
    color: colors.slate,
    lineHeight: 16,
    marginTop: 3,
    marginBottom: 12,
  },

  insuranceHomeActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  insuranceHomeCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 5,
  },

  insuranceHomeCallBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.secondary,
  },

  insuranceHomeBuyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },

  insuranceHomeBuyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ==================================================
  // HOME NURSE CARD
  // ==================================================

  nurseHomeCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.lightAqua,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  nurseHomeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  nurseHomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightAqua,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },

  nurseHomeBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.5,
  },

  nurseRateTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },

  nurseRateTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },

  nurseHomeTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
  },

  nurseHomeSub: {
    fontSize: 11.5,
    color: colors.slate,
    lineHeight: 16,
    marginTop: 3,
    marginBottom: 12,
  },

  nurseHomeActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  nurseHomeCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 5,
  },

  nurseHomeCallBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.secondary,
  },

  nurseHomeBookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },

  nurseHomeBookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ==================================================
  // EMERGENCY
  // ==================================================

  emergencyCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.coral,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },


  emergencyIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor:
      'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },


  emergencyInfo: {
    flex: 1,
    marginLeft: 12,
  },


  emergencyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
  },


  emergencySubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: colors.white,
  },


  // ==================================================
  // PROMOTIONAL BANNER
  // ==================================================

  exploreBanner: {
    marginTop: 18,
    minHeight: 155,
    borderRadius: 22,
    backgroundColor: colors.primary,
    padding: 20,
    flexDirection: 'row',
    overflow: 'hidden',
  },


  bannerContent: {
    flex: 1,
  },


  bannerSmall: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '800',
    color: colors.white,
  },


  bannerTitle: {
    marginTop: 7,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    color: colors.white,
  },


  bannerText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: colors.white,
  },


  bannerIllustration: {
    width: 95,
    justifyContent: 'center',
    alignItems: 'center',
  },


  bannerMedicalCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor:
      'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },


  bannerPlus: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -5,
    marginLeft: 35,
  },


  // ==================================================
  // MORE SERVICES
  // ==================================================

  moreServices: {
    gap: 10,
  },


  moreServiceCard: {
    minHeight: 72,
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },


  moreServiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },


  moreServiceInfo: {
    flex: 1,
    marginLeft: 12,
  },


  moreServiceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },


  moreServiceSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: colors.slate,
  },


  // ==================================================
  // LOCATION MODAL
  // ==================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },


  locationModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom:
      Platform.OS === 'ios'
        ? 35
        : 25,
  },


  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },


  modalTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.secondary,
  },


  modalSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: colors.slate,
  },


  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },


  // ==================================================
  // GPS
  // ==================================================

  gpsOption: {
    minHeight: 76,
    borderRadius: 18,
    backgroundColor: '#E9FAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#C5EEEE',
  },


  gpsIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },


  locationOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },


  locationOptionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondary,
  },


  locationOptionSubtitle: {
    marginTop: 4,
    fontSize: 10,
    color: colors.slate,
  },


  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 10,
  },

  modalSearchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    color: colors.text,
  },

  popularTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 8,
  },

  cityOption: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  cityOptionActive: {
    backgroundColor: colors.lightTeal,
    borderColor: '#A7F3D0',
  },

  cityIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cityText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.secondary,
  },

  customAreaBox: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },

  customAreaInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 11.5,
    color: colors.text,
  },

  customAreaSubmitBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  customAreaSubmitText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },

  // ==================================================
  // WALLET POPUP MODAL STYLES
  // ==================================================

  walletModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 35,
  },

  walletModalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },

  walletPopupBalanceBox: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 14,
  },

  walletPopupLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 1,
  },

  walletPopupBalanceText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },

  walletPopupPointsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },

  walletPopupPointsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDE68A',
  },

  walletSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 8,
  },

  walletQuickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },

  walletQuickChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  walletQuickChipActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },

  walletQuickChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.secondary,
  },

  walletQuickChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  walletPopupAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },

  walletPopupAddBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  walletMiniPassbook: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginBottom: 14,
  },

  walletMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  walletMiniDesc: {
    flex: 1,
    fontSize: 11,
    color: colors.secondary,
    marginLeft: 6,
  },

  walletMiniCredit: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#059669',
  },

  walletPopupFooterRow: {
    flexDirection: 'row',
    gap: 8,
  },

  walletPopupReferBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    gap: 5,
  },

  walletPopupReferBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E67E22',
  },

  walletPopupFullBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 10,
  },

  walletPopupFullBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },


  // ==================================================
  // BOTTOM NAVIGATION WRAPPER
  // ==================================================

  bottomNavigationWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    zIndex: 100,
    elevation: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },


  // ==================================================
  // BOTTOM NAVIGATION
  // ==================================================

  bottomNavigation: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    height: 72,
    borderRadius: 28,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,

    zIndex: 101,
    elevation: 101,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },


  // ==================================================
  // BOTTOM ITEM
  // ==================================================

  bottomItem: {
    flex: 1,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 102,
  },


  activeBottomIcon: {
    width: 42,
    height: 35,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },


  activeBottomText: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },


  bottomText: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
    textAlign: 'center',
  },

});


export default HomeScreen;
