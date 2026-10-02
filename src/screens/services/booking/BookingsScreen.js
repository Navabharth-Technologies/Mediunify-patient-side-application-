import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

const BookingsScreen = ({ navigation, route }) => {
  useEffect(() => {
    const params = route?.params || {};
    if (
      params.type === 'video' ||
      params.serviceType === 'video' ||
      params.initialTab === 'Video Consults' ||
      params.initialTab === 'Consultations'
    ) {
      navigation.replace('MyOnlineConsultations', params);
    } else if (
      params.type === 'doctor' ||
      params.serviceType === 'doctor' ||
      params.initialTab === 'In-Clinic Visits' ||
      params.initialTab === 'Doctor Visits'
    ) {
      navigation.replace('MyAppointments', params);
    } else {
      navigation.replace('MyTests', params);
    }
  }, [navigation, route]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#00B894" />
    </View>
  );
};

export default BookingsScreen;