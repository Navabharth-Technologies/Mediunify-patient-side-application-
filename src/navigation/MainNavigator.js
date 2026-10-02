import React, { useRef, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Image,
  Animated,
} from 'react-native';

import WebHeader from '../components/web/WebHeader';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  Ionicons,
} from '@expo/vector-icons';

import colors from '../theme/colors';
import { useCart } from '../context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// ==================================================
// HOME
// ==================================================

import HomeScreen from '../screens/home/HomeScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';


// ==================================================
// DOCTORS
// ==================================================

import FindDoctorsScreen from '../screens/services/doctors/FindDoctorsScreen';
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
import MembershipScreen from '../screens/services/membership/MembershipScreen';

// ==================================================
// DEDICATED PATIENT PROFILE MENU SCREENS
// ==================================================
import MyAppointmentsScreen from '../screens/services/booking/MyAppointmentsScreen.web';
import MyTestsScreen from '../screens/services/lab/MyTestsScreen.web';
import MyMedicineOrdersScreen from '../screens/services/pharmacy/MyMedicineOrdersScreen.web';
import MyMedicalRecordsScreen from '../screens/health/MyMedicalRecordsScreen.web';
import MyOnlineConsultationsScreen from '../screens/services/videocall/MyOnlineConsultationsScreen.web';
import MyFeedbackScreen from '../screens/settings/MyFeedbackScreen.web';

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
  const { width } = useWindowDimensions();
  const isTabletDevice = width >= 600;
  const insets = useSafeAreaInsets();

  // Gentle breathing aura animation for the AI bot floating button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, [pulseAnim]);

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
      style={[
        styles.bottomNavigation,
        isTabletDevice && {
          left: (width - Math.min(width * 0.9, 520)) / 2,
          right: 'auto',
          width: Math.min(width * 0.9, 520),
          height: 64,
          bottom: insets.bottom > 0 ? insets.bottom : 0,
          borderRadius: 24,
          paddingHorizontal: 8,
        },
      ]}
    >
      {/* 1. HOME */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.7}
        onPress={() => goTo('Home')}
      >
        <Ionicons
          name={currentRoute === 'Home' ? 'home' : 'home-outline'}
          size={isTabletDevice ? 21 : 23}
          color={currentRoute === 'Home' ? '#007D69' : '#64748B'}
        />
        <Text
          style={[
            styles.bottomText,
            currentRoute === 'Home' && styles.activeBottomText,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* 2. SEARCH */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.7}
        onPress={() => goTo('GlobalSearch')}
      >
        <Ionicons
          name={currentRoute === 'GlobalSearch' ? 'search' : 'search-outline'}
          size={isTabletDevice ? 21 : 23}
          color={currentRoute === 'GlobalSearch' ? '#007D69' : '#64748B'}
        />
        <Text
          style={[
            styles.bottomText,
            currentRoute === 'GlobalSearch' && styles.activeBottomText,
          ]}
        >
          Search
        </Text>
      </TouchableOpacity>

      {/* 3. CENTER ELEVATED BUTTON: AI CHAT BOT */}
      <TouchableOpacity
        style={styles.centerVaultTabBtn}
        activeOpacity={0.85}
        onPress={() => goTo('Chatbot')}
      >
        <View style={styles.centerButtonWrapper}>
          {/* Subtle living breathing aura */}
          <Animated.View
            style={[
              styles.vaultGlowHalo,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />

          {/* Elevated Circular Medallion */}
          <View
            style={[
              styles.centerVaultCircle,
              currentRoute === 'Chatbot' && styles.centerVaultCircleActive,
            ]}
          >
            <Image
              source={require('../../assets/ai-bot-avatar.png')}
              style={[
                styles.centerAiBotImg,
                isTabletDevice && { width: 44, height: 44 },
              ]}
              resizeMode="contain"
            />

            {/* Sparkle Badge / Live AI Status */}
            <View style={styles.aiSparkleBadge}>
              <Ionicons name="sparkles" size={9.5} color="#FFFFFF" />
            </View>
          </View>
        </View>

        <Text
          style={[
            styles.bottomText,
            styles.centerAiText,
            currentRoute === 'Chatbot' && styles.activeBottomText,
          ]}
          numberOfLines={1}
        >
          AI Chat Bot
        </Text>
      </TouchableOpacity>

      {/* 4. ALERTS */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.7}
        onPress={() => goTo('Notifications')}
      >
        <View style={{ position: 'relative' }}>
          <Ionicons
            name={currentRoute === 'Notifications' ? 'notifications' : 'notifications-outline'}
            size={isTabletDevice ? 21 : 23}
            color={currentRoute === 'Notifications' ? '#007D69' : '#64748B'}
          />
          <View style={styles.notifBadgeDot} />
        </View>
        <Text
          style={[
            styles.bottomText,
            currentRoute === 'Notifications' && styles.activeBottomText,
          ]}
        >
          Alerts
        </Text>
      </TouchableOpacity>

      {/* 5. HISTORY */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.7}
        onPress={() => goTo('MyAppointments')}
      >
        <Ionicons
          name={currentRoute === 'MyAppointments' ? 'time' : 'time-outline'}
          size={isTabletDevice ? 21 : 23}
          color={currentRoute === 'MyAppointments' ? '#007D69' : '#64748B'}
        />
        <Text
          style={[
            styles.bottomText,
            currentRoute === 'MyAppointments' && styles.activeBottomText,
          ]}
        >
          History
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
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [
    currentRoute,
    setCurrentRoute,
  ] = React.useState('Home');
  const [
    currentParams,
    setCurrentParams,
  ] = React.useState({});

  const cartCtx = useCart();
  const radiologyCartCount = cartCtx?.radiologyCartCount || 0;
  const labCartCount = cartCtx?.labCartCount || 0;
  const pharmacyCartCount = cartCtx?.pharmacyCartCount || 0;
  const totalCartCount = cartCtx?.totalCartCount || 0;

  const hasBottomBar = (
    (['RadiologyLabDetails', 'RadiologyLabs', 'Imaging'].includes(currentRoute) && radiologyCartCount > 0) ||
    (['LabTests'].includes(currentRoute) && labCartCount > 0) ||
    (['Pharmacy', 'PharmacyStoreDetail'].includes(currentRoute) && pharmacyCartCount > 0) ||
    (['Cart', 'Checkout', 'Payment'].includes(currentRoute)) ||
    (['DoctorList', 'DoctorDetails', 'HospitalList'].includes(currentRoute) && totalCartCount > 0)
  );


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
      {isDesktopWeb && currentRoute !== 'Login' && (
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
          (isDesktopWeb || (Platform.OS !== 'web' && width >= 768)) &&
          ![
            'Home',
            'LabTests',
            'Imaging',
            'RadiologyLabs',
            'RadiologyLabDetails',
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
            'FindDoctors',
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
            'Chatbot',
            'Membership',
            'MyAppointments',
            'MyTests',
            'MyMedicineOrders',
            'MyOrders',
            'MyMedicalRecords',
            'MyOnlineConsultations',
            'MyFeedback',
            'Settings',
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
                '#FAFCFD',
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
          name="FindDoctors"
          component={FindDoctorsScreen}
        />

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
          component={MyMedicineOrdersScreen}
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
          component={RadiologistListScreen}
        />

        <Stack.Screen
          name="RadiologistBooking"
          component={RadiologistBookingScreen}
        />

        <Stack.Screen
          name="RadiologyReportUpload"
          component={RadiologyReportUploadScreen}
        />


        {/* ==================================================
            BOOKINGS
        ================================================== */}

        <Stack.Screen
          name="Bookings"
          component={MyTestsScreen}
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
          name="MyAppointments"
          component={MyAppointmentsScreen}
        />

        <Stack.Screen
          name="MyTests"
          component={MyTestsScreen}
        />

        <Stack.Screen
          name="MyMedicineOrders"
          component={MyMedicineOrdersScreen}
        />

        <Stack.Screen
          name="MyMedicalRecords"
          component={MyMedicalRecordsScreen}
        />

        <Stack.Screen
          name="MyOnlineConsultations"
          component={MyOnlineConsultationsScreen}
        />

        <Stack.Screen
          name="OnlineConsultant"
          component={MyOnlineConsultationsScreen}
        />

        <Stack.Screen
          name="MyFeedback"
          component={MyFeedbackScreen}
        />

        <Stack.Screen
          name="HelpSupport"
          component={HelpSupportScreen}
        />

        <Stack.Screen
          name="Membership"
          component={MembershipScreen}
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

      {!isDesktopWeb && ['Home', 'DoctorList', 'VideoConsultation', 'Bookings', 'MyTests', 'MyAppointments', 'HealthRecords', 'Profile', 'AllServices', 'GlobalSearch', 'Notifications', 'Chatbot'].includes(currentRoute) && (
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
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    left: 14,
    right: 14,
    bottom: Platform.OS === 'ios' ? 20 : 10,
    maxWidth: 520,
    marginHorizontal: 'auto',
    height: 62,
    borderRadius: 24,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 4 : 2,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 999,
  },

  bottomItem: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },

  bottomIcon: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeBottomIcon: {
    backgroundColor: colors.primary,
  },

  bottomText: {
    marginTop: 2,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },

  activeBottomText: {
    color: '#007D69',
    fontWeight: '800',
  },

  centerVaultTabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    zIndex: 1002,
    minWidth: 72,
  },
  centerButtonWrapper: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vaultGlowHalo: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0, 184, 148, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 184, 148, 0.35)',
  },
  centerVaultCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#00B894',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.36,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  centerVaultCircleActive: {
    borderColor: '#007D69',
    backgroundColor: '#F0FDF9',
    shadowColor: '#007D69',
    shadowOpacity: 0.5,
    elevation: 10,
  },
  centerAiBotImg: {
    width: 44,
    height: 44,
  },
  aiSparkleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 6,
    zIndex: 10,
  },
  centerAiText: {
    marginTop: 2,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#007D69',
    letterSpacing: 0.1,
  },
  centerAiTabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    zIndex: 1001,
  },
  centerAiCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  centerAiCircleActive: {
    backgroundColor: '#00B894',
    shadowColor: '#00B894',
  },

  floatingAiLauncher: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0F766E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2DD4BF',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99999,
    gap: 7,
    transition: 'bottom 0.25s ease',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } : {}),
  },
  floatingAiLauncherLifted: {
    bottom: 84,
  },
  floatingAiGlowIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#115E59',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#5EEAD4',
    position: 'relative',
  },
  floatingAiPulseDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  floatingAiTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  floatingAiOnlineBadge: {
    backgroundColor: '#134E4A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#2DD4BF',
  },
  floatingAiOnlineText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 0.3,
  },
});


export default MainNavigator;