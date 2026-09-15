import React from 'react';
import {
  NavigationContainer,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['/', 'http://localhost:8081', 'http://localhost:19006', 'https://hemanthgowdatn2003.github.io/mediunify-patient'],
  config: {
    screens: {
      Auth: {
        screens: {
          Splash: 'splash',
          Login: 'login',
          Register: 'register',
          OTP: 'otp',
          ForgotPassword: 'forgot-password',
        },
      },
      MainApp: {
        screens: {
          Home: '',
          LabTests: 'lab-tests',
          Imaging: 'radiology',
          RadiologyLabs: 'radiology-labs',
          Pharmacy: 'pharmacy',
          DoctorList: 'doctors',
          VideoConsultation: 'consultation',
          HospitalCare: 'hospital-care',
          HealthInsurance: 'insurance',
          NurseBooking: 'home-care',
          Emergency: 'emergency',
          AyurvedaWellness: 'ayurveda-wellness',
          FertilityIvf: 'fertility-ivf',
          EquipmentRental: 'equipment-rental',
          Profile: 'profile',
        },
      },
    },
  },
};

const AppNavigator = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
        />

        <Stack.Screen
          name="MainApp"
          component={MainNavigator}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;