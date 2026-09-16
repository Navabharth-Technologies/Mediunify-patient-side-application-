import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';

import WebHeader from '../components/web/WebHeader';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  Ionicons,
} from '@expo/vector-icons';

import colors from '../theme/colors';


// ==================================================
// HOME
// ==================================================

import HomeScreen from '../screens/home/HomeScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';


// ==================================================
// DOCTORS
// ==================================================

import DoctorListScreen from '../screens/services/doctors/DoctorListScreen';
import DoctorDetailsScreen from '../screens/services/doctors/DoctorDetailsScreen';
import DoctorBookingScreen from '../screens/services/doctors/DoctorBookingScreen';


// ==================================================
// HOSPITALS
// ==================================================

import HospitalListScreen from '../screens/services/hospitals/HospitalListScreen';


// ==================================================
// SERVICES
// ==================================================

import VideoBookingScreen from '../screens/services/videocall/VideoBookingScreen';
import VideoConsultationScreen from '../screens/services/videocall/VideoConsultationScreen';
import VideoMeetingScreen from '../screens/services/videocall/VideoMeetingScreen';

import LabTestsScreen from '../screens/services/lab/LabTestsScreen';
import LabBookingScreen from '../screens/services/lab/LabBookingScreen';


// ==================================================
// PHARMACY
// ==================================================

import PharmacyScreen from '../screens/services/pharmacy/PharmacyScreen';
import PharmacyStoreDetailScreen from '../screens/services/pharmacy/PharmacyStoreDetailScreen';
import PharmacyLocationScreen from '../screens/services/pharmacy/PharmacyLocationScreen';
import ProductDetailsScreen from '../screens/services/pharmacy/ProductDetailsScreen';
import CartScreen from '../screens/services/pharmacy/CartScreen';
import CheckoutScreen from '../screens/services/pharmacy/CheckoutScreen';
import PaymentScreen from '../screens/services/pharmacy/PaymentScreen';
import OrderSuccessScreen from '../screens/services/pharmacy/OrderSuccessScreen';
import MyOrdersScreen from '../screens/services/pharmacy/MyOrdersScreen';


// ==================================================
// OTHER SERVICES
// ==================================================

import ImagingScreen from '../screens/services/radiology/ImagingScreen';

import HospitalCareScreen from '../screens/services/hospitals/HospitalCareScreen';
import HospitalSurgeryDetailsScreen from '../screens/services/hospitals/HospitalSurgeryDetailsScreen';
import SurgeryQuoteRequestScreen from '../screens/services/hospitals/SurgeryQuoteRequestScreen';
import HealthInsuranceScreen from '../screens/services/insurance/HealthInsuranceScreen';
import NurseBookingScreen from '../screens/services/nurse/NurseBookingScreen';
import EmergencyScreen from '../screens/services/emergency/EmergencyScreen';
import AyurvedaWellnessScreen from '../screens/services/ayurveda/AyurvedaWellnessScreen';
import {
  FertilityIvfScreen,
  FertilitySpecialistsScreen,
  FertilityDoctorProfileScreen,
  FertilityClinicsScreen,
  FertilityClinicProfileScreen,
  CompareClinicsScreen,
  FertilityCareRequestScreen,
  FertilityConsentScreen,
  FertilityTestsScreen,
  FertilityTestDetailsScreen,
  IUIJourneyScreen,
  IVFJourneyScreen,
  TreatmentDetailsScreen,
  IVFPackageScreen,
  SecondOpinionScreen,
  MyFertilityJourneyScreen,
  FertilityRecordsScreen,
  FertilityInsuranceScreen,
  FertilityCoordinatorScreen,
  FertilityNotificationsScreen,
  FertilityAIScreen,
} from '../screens/services/fertility';
import EquipmentRentalScreen from '../screens/services/equipment/EquipmentRentalScreen';
import AllServicesScreen from '../screens/services/AllServicesScreen';


// ==================================================
// RADIOLOGY & SCANS
// ==================================================

import RadiologyLabsScreen from '../screens/services/radiology/RadiologyLabsScreen';
import RadiologyLabDetailsScreen from '../screens/services/radiology/RadiologyLabDetailsScreen';
import RadiologyBookingScreen from '../screens/services/radiology/RadiologyBookingScreen';
import RadiologyPaymentScreen from '../screens/services/radiology/RadiologyPaymentScreen';
import RadiologyOrderSuccessScreen from '../screens/services/radiology/RadiologyOrderSuccessScreen';

import RadiologistListScreen from '../screens/services/radiology/RadiologistListScreen';
import RadiologistBookingScreen from '../screens/services/radiology/RadiologistBookingScreen';
import RadiologyReportUploadScreen from '../screens/services/radiology/RadiologyReportUploadScreen';



// ==================================================
// CHATBOT
// ==================================================

import ChatbotScreen from '../screens/chatbot/ChatbotScreen';


// ==================================================
// HEALTH & MONITOR
// ==================================================

import HealthMonitorScreen from '../screens/health/HealthMonitorScreen';
import HealthRecordsScreen from '../screens/health/HealthRecordsScreen';
import PrescriptionsScreen from '../screens/health/PrescriptionsScreen';
import ReportsScreen from '../screens/health/ReportsScreen';


// ==================================================
// BOOKINGS
// ==================================================

import BookingsScreen from '../screens/services/booking/BookingsScreen';
import BookingDetailsScreen from '../screens/services/booking/BookingDetailsScreen';


// ==================================================
// SEARCH
// ==================================================

import GlobalSearchScreen from '../screens/search/GlobalSearchScreen';


// ==================================================
// PROFILE & SETTINGS
// ==================================================

import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import FamilyProfilesScreen from '../screens/profile/FamilyProfilesScreen';
import TransactionHistoryScreen from '../screens/profile/TransactionHistoryScreen';
import WalletScreen from '../screens/profile/WalletScreen';
import ReferEarnScreen from '../screens/profile/ReferEarnScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';

// ==================================================
// AUTH SCREENS
// ==================================================
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OTPScreen from '../screens/auth/OTPScreen';


// ==================================================
// STACK
// ==================================================

const Stack = createNativeStackNavigator();


// ==================================================
// BOTTOM NAVIGATION
// ==================================================

const BottomNavigation = ({
  navigation,
  currentRoute,
}) => {

  // ==================================================
  // NAVIGATE
  // ==================================================

  const goTo = (route) => {

    console.log(
      'Bottom navigation pressed:',
      route
    );

    navigation.navigate(
      'MainApp',
      {
        screen: route,
      }
    );
  };


  return (

    <View
      style={styles.bottomNavigation}
    >

      {/* 1. HOME */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.7}
        onPress={() => goTo('Home')}
      >
        <View
          style={[
            styles.bottomIcon,
            currentRoute === 'Home' && styles.activeBottomIcon,
          ]}
        >
          <Ionicons
            name={currentRoute === 'Home' ? 'home' : 'home-outline'}
            size={22}
            color={currentRoute === 'Home' ? colors.white : '#64748B'}
          />
        </View>
        <Text
          style={[
            styles.bottomText,
            currentRoute === 'Home' && styles.activeBottomText,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* 2. BOOKINGS */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.7}
        onPress={() => goTo('Bookings')}
      >
        <View
          style={[
            styles.bottomIcon,
            currentRoute === 'Bookings' && styles.activeBottomIcon,
          ]}
        >
          <Ionicons
            name={currentRoute === 'Bookings' ? 'calendar' : 'calendar-outline'}
            size={22}
            color={currentRoute === 'Bookings' ? colors.white : '#64748B'}
          />
        </View>
        <Text
          style={[
            styles.bottomText,
            currentRoute === 'Bookings' && styles.activeBottomText,
          ]}
        >
          Bookings
        </Text>
      </TouchableOpacity>

      {/* 3. CENTER AI ASSISTANT BUTTON */}
      <TouchableOpacity
        style={styles.centerAiTabBtn}
        activeOpacity={0.85}
        onPress={() => goTo('Chatbot')}
      >
        <View style={[styles.centerAiCircle, currentRoute === 'Chatbot' && styles.centerAiCircleActive]}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
        </View>
        <Text style={[styles.bottomText, currentRoute === 'Chatbot' && styles.activeBottomText, { marginTop: 2 }]}>
          AI
        </Text>
      </TouchableOpacity>

      {/* 4. MY HEALTH */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.7}
        onPress={() => goTo('HealthRecords')}
      >
        <View
          style={[
            styles.bottomIcon,
            currentRoute === 'HealthRecords' && styles.activeBottomIcon,
          ]}
        >
          <Ionicons
            name={currentRoute === 'HealthRecords' ? 'document-text' : 'document-text-outline'}
            size={22}
            color={currentRoute === 'HealthRecords' ? colors.white : '#64748B'}
          />
        </View>
        <Text
          style={[
            styles.bottomText,
            currentRoute === 'HealthRecords' && styles.activeBottomText,
          ]}
        >
          My Health
        </Text>
      </TouchableOpacity>

      {/* 5. ACCOUNT */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.7}
        onPress={() => goTo('Profile')}
      >
        <View
          style={[
            styles.bottomIcon,
            currentRoute === 'Profile' && styles.activeBottomIcon,
          ]}
        >
          <Ionicons
            name={currentRoute === 'Profile' ? 'person' : 'person-outline'}
            size={22}
            color={currentRoute === 'Profile' ? colors.white : '#64748B'}
          />
        </View>
        <Text
          style={[
            styles.bottomText,
            currentRoute === 'Profile' && styles.activeBottomText,
          ]}
        >
          Account
        </Text>
      </TouchableOpacity>

    </View>
  );
};


// ==================================================
// MAIN NAVIGATOR
// ==================================================

const MainNavigator = ({
  navigation,
}) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  const [
    currentRoute,
    setCurrentRoute,
  ] = React.useState('Home');
  const [
    currentParams,
    setCurrentParams,
  ] = React.useState({});


  // ==================================================
  // HANDLE ROUTE CHANGE
  // ==================================================

  const handleNavigationStateChange = (
    event
  ) => {

    const state =
      event?.data?.state;

    if (!state) {
      return;
    }

    const route =
      state.routes?.[
        state.index
      ];

    if (route) {

      console.log(
        'Current route:',
        route.name
      );

      setCurrentRoute(
        route.name
      );
      setCurrentParams(
        route.params || {}
      );
    }
  };


  return (

    <View
      style={styles.mainContainer}
    >
      {/* ==================================================
          DESKTOP REAL WEBSITE HEADER
      ================================================== */}
      {isDesktopWeb && (
        <WebHeader
          navigation={navigation}
          currentRoute={currentRoute}
          currentParams={currentParams}
        />
      )}

      {/* ==================================================
          INNER STACK
      ================================================== */}
      <View
        style={[
          styles.stackWrapper,
          isDesktopWeb &&
          ![
            'Home',
            'LabTests',
            'Imaging',
            'RadiologyLabs',
            'Pharmacy',
            'AyurvedaWellness',
            'FertilityIvf',
            'FertilitySpecialists',
            'FertilityDoctorProfile',
            'FertilityClinics',
            'FertilityClinicProfile',
            'CompareClinics',
            'FertilityCareRequest',
            'FertilityConsent',
            'FertilityTests',
            'FertilityTestDetails',
            'IUIJourney',
            'IVFJourney',
            'TreatmentDetails',
            'IVFPackage',
            'SecondOpinion',
            'MyFertilityJourney',
            'FertilityRecords',
            'FertilityInsurance',
            'FertilityCoordinator',
            'FertilityNotifications',
            'FertilityAI',
            'EquipmentRental',
            'DoctorList',
            'DoctorDetails',
            'DoctorBooking',
            'VideoConsultation',
            'VideoBooking',
            'HospitalCare',
            'HospitalList',
            'SurgeryQuoteRequest',
            'HealthInsurance',
            'NurseBooking',
            'Emergency',
            'RadiologistList',
            'RadiologistBooking',
            'LabBooking',
            'RadiologyBooking',
            'Cart',
            'Checkout',
            'Payment',
            'Bookings',
          ].includes(currentRoute) &&
          styles.desktopStackWrapper,
        ]}
      >
        <Stack.Navigator

          initialRouteName="Home"

          screenOptions={{
            headerShown: false,

            contentStyle: {
              backgroundColor:
                '#F1F2F4',
            },
          }}

          screenListeners={{
            state:
              handleNavigationStateChange,
          }}

        >

        {/* ==================================================
            HOME
        ================================================== */}

        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />


        {/* ==================================================
            GLOBAL SEARCH
        ================================================== */}

        <Stack.Screen
          name="GlobalSearch"
          component={GlobalSearchScreen}
        />


        {/* ==================================================
            NOTIFICATIONS
        ================================================== */}

        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
        />


        {/* ==================================================
            CHATBOT
        ================================================== */}

        <Stack.Screen
          name="Chatbot"
          component={ChatbotScreen}
        />


        {/* ==================================================
            DOCTOR FLOW
        ================================================== */}

        <Stack.Screen
          name="DoctorList"
          component={DoctorListScreen}
        />

        <Stack.Screen
          name="DoctorDetails"
          component={DoctorDetailsScreen}
        />

        <Stack.Screen
          name="DoctorBooking"
          component={DoctorBookingScreen}
        />


        {/* ==================================================
            HOSPITAL FLOW
        ================================================== */}

        <Stack.Screen
          name="HospitalList"
          component={HospitalListScreen}
        />

        <Stack.Screen
          name="HospitalCare"
          component={HospitalCareScreen}
        />

        <Stack.Screen
          name="HospitalSurgeryDetails"
          component={HospitalSurgeryDetailsScreen}
        />

        <Stack.Screen
          name="SurgeryQuoteRequest"
          component={SurgeryQuoteRequestScreen}
        />

        <Stack.Screen
          name="HealthInsurance"
          component={HealthInsuranceScreen}
        />

        <Stack.Screen
          name="NurseBooking"
          component={NurseBookingScreen}
        />

        <Stack.Screen
          name="AyurvedaWellness"
          component={AyurvedaWellnessScreen}
        />

        <Stack.Screen
          name="FertilityIvf"
          component={FertilityIvfScreen}
        />
        <Stack.Screen
          name="FertilitySpecialists"
          component={FertilitySpecialistsScreen}
        />
        <Stack.Screen
          name="FertilityDoctorProfile"
          component={FertilityDoctorProfileScreen}
        />
        <Stack.Screen
          name="FertilityClinics"
          component={FertilityClinicsScreen}
        />
        <Stack.Screen
          name="FertilityClinicProfile"
          component={FertilityClinicProfileScreen}
        />
        <Stack.Screen
          name="CompareClinics"
          component={CompareClinicsScreen}
        />
        <Stack.Screen
          name="FertilityCareRequest"
          component={FertilityCareRequestScreen}
        />
        <Stack.Screen
          name="FertilityConsent"
          component={FertilityConsentScreen}
        />
        <Stack.Screen
          name="FertilityTests"
          component={FertilityTestsScreen}
        />
        <Stack.Screen
          name="FertilityTestDetails"
          component={FertilityTestDetailsScreen}
        />
        <Stack.Screen
          name="IUIJourney"
          component={IUIJourneyScreen}
        />
        <Stack.Screen
          name="IVFJourney"
          component={IVFJourneyScreen}
        />
        <Stack.Screen
          name="TreatmentDetails"
          component={TreatmentDetailsScreen}
        />
        <Stack.Screen
          name="IVFPackage"
          component={IVFPackageScreen}
        />
        <Stack.Screen
          name="SecondOpinion"
          component={SecondOpinionScreen}
        />
        <Stack.Screen
          name="MyFertilityJourney"
          component={MyFertilityJourneyScreen}
        />
        <Stack.Screen
          name="FertilityRecords"
          component={FertilityRecordsScreen}
        />
        <Stack.Screen
          name="FertilityInsurance"
          component={FertilityInsuranceScreen}
        />
        <Stack.Screen
          name="FertilityCoordinator"
          component={FertilityCoordinatorScreen}
        />
        <Stack.Screen
          name="FertilityNotifications"
          component={FertilityNotificationsScreen}
        />
        <Stack.Screen
          name="FertilityAI"
          component={FertilityAIScreen}
        />

        <Stack.Screen
          name="EquipmentRental"
          component={EquipmentRentalScreen}
        />

        <Stack.Screen
          name="AllServices"
          component={AllServicesScreen}
        />


        {/* ==================================================
            VIDEO CONSULTATION
        ================================================== */}

        <Stack.Screen
          name="VideoConsultation"
          component={VideoConsultationScreen}
        />

        <Stack.Screen
          name="VideoBooking"
          component={VideoBookingScreen}
        />

        <Stack.Screen
          name="VideoMeeting"
          component={VideoMeetingScreen}
        />


        {/* ==================================================
            LAB TESTS
        ================================================== */}

        <Stack.Screen
          name="LabTests"
          component={LabTestsScreen}
        />

        <Stack.Screen
          name="LabBooking"
          component={LabBookingScreen}
        />


        {/* ==================================================
            PHARMACY
        ================================================== */}

        <Stack.Screen
          name="Pharmacy"
          component={PharmacyScreen}
        />

        <Stack.Screen
          name="PharmacyStoreDetail"
          component={PharmacyStoreDetailScreen}
        />

        <Stack.Screen
          name="PharmacyLocation"
          component={PharmacyLocationScreen}
        />

        <Stack.Screen
          name="ProductDetails"
          component={ProductDetailsScreen}
        />

        <Stack.Screen
          name="Cart"
          component={CartScreen}
        />

        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
        />

        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
        />

        <Stack.Screen
          name="OrderSuccess"
          component={OrderSuccessScreen}
        />

        <Stack.Screen
          name="MyOrders"
          component={MyOrdersScreen}
        />


        {/* ==================================================
            IMAGING
        ================================================== */}

        <Stack.Screen
          name="Imaging"
          component={ImagingScreen}
        />


        {/* ==================================================
            EMERGENCY
        ================================================== */}

        <Stack.Screen
          name="Emergency"
          component={EmergencyScreen}
        />


        {/* ==================================================
            HEALTH RECORDS & SELF MONITOR
        ================================================== */}

        <Stack.Screen
          name="HealthMonitor"
          component={HealthMonitorScreen}
        />

        <Stack.Screen
          name="HealthRecords"
          component={HealthRecordsScreen}
        />

        <Stack.Screen
          name="Prescriptions"
          component={PrescriptionsScreen}
        />

        <Stack.Screen
          name="Reports"
          component={ReportsScreen}
        />


        {/* ==================================================
            RADIOLOGY & SCANS
        ================================================== */}

        <Stack.Screen
          name="RadiologyLabs"
          component={RadiologyLabsScreen}
        />

        <Stack.Screen
          name="RadiologyLabDetails"
          component={RadiologyLabDetailsScreen}
        />

        <Stack.Screen
          name="RadiologyBooking"
          component={RadiologyBookingScreen}
        />

        <Stack.Screen
          name="RadiologyPayment"
          component={RadiologyPaymentScreen}
        />

        <Stack.Screen
          name="RadiologyOrderSuccess"
          component={RadiologyOrderSuccessScreen}
        />

        <Stack.Screen
          name="RadiologistList"
          component={RadiologyLabsScreen}
        />

        <Stack.Screen
          name="RadiologistBooking"
          component={RadiologyBookingScreen}
        />


        {/* ==================================================
            BOOKINGS
        ================================================== */}

        <Stack.Screen
          name="Bookings"
          component={BookingsScreen}
        />

        <Stack.Screen
          name="BookingDetails"
          component={BookingDetailsScreen}
        />


        {/* ==================================================
            PROFILE & SETTINGS
        ================================================== */}

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
        />

        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
        />

        <Stack.Screen
          name="FamilyProfiles"
          component={FamilyProfilesScreen}
        />

        <Stack.Screen
          name="TransactionHistory"
          component={TransactionHistoryScreen}
        />

        <Stack.Screen
          name="Wallet"
          component={WalletScreen}
        />

        <Stack.Screen
          name="ReferEarn"
          component={ReferEarnScreen}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
        />

        <Stack.Screen
          name="HelpSupport"
          component={HelpSupportScreen}
        />

        {/* ==================================================
            AUTH FLOW
        ================================================== */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />

        <Stack.Screen
          name="OTP"
          component={OTPScreen}
        />

      </Stack.Navigator>
      </View>


      {/* ==================================================
          BOTTOM NAVIGATION (ONLY ON MAIN TAB SCREENS)
      ================================================== */}

      {!isDesktopWeb && ['Home', 'DoctorList', 'VideoConsultation', 'Bookings', 'HealthRecords', 'Profile'].includes(currentRoute) && (
        <BottomNavigation
          navigation={navigation}
          currentRoute={currentRoute}
        />
      )}

    </View>
  );
};


// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

  // ==================================================
  // MAIN CONTAINER
  // ==================================================

  mainContainer: {

    flex: 1,

    backgroundColor:
      '#F8FAFC',
  },

  stackWrapper: {
    flex: 1,
    width: '100%',
  },

  desktopStackWrapper: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
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

    backgroundColor:
      colors.white,

    flexDirection:
      'row',

    alignItems:
      'center',

    justifyContent:
      'space-around',

    paddingHorizontal: 6,

    borderWidth: 1,

    borderColor:
      colors.border,

    elevation: 15,

    shadowColor:
      '#000',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity:
      0.18,

    shadowRadius:
      10,

    zIndex: 999,

  },


  // ==================================================
  // BOTTOM ITEM
  // ==================================================

  bottomItem: {

    flex: 1,

    height: 68,

    alignItems:
      'center',

    justifyContent:
      'center',

    zIndex: 1000,

  },


  // ==================================================
  // ICON
  // ==================================================

  bottomIcon: {

    width: 42,

    height: 35,

    borderRadius: 20,

    alignItems:
      'center',

    justifyContent:
      'center',

  },


  // ==================================================
  // ACTIVE ICON
  // ==================================================

  activeBottomIcon: {

    backgroundColor:
      colors.primary,

  },


  // ==================================================
  // TEXT
  // ==================================================

  bottomText: {

    marginTop: 3,

    fontSize: 9,

    fontWeight: '700',

    color:
      colors.secondary,

    textAlign:
      'center',

  },


  // ==================================================
  // ACTIVE TEXT
  // ==================================================

  activeBottomText: {

    color:
      colors.primary,

    fontWeight: '900',

  },

  centerAiTabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    zIndex: 1001,
  },
  centerAiCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  centerAiCircleActive: {
    backgroundColor: '#00B894',
    shadowColor: '#00B894',
  },

});


export default MainNavigator;