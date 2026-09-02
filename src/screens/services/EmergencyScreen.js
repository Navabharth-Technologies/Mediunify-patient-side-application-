import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const EmergencyScreen = ({ navigation }) => {

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#263238"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Emergency Help
        </Text>

        <View style={{ width: 25 }} />

      </View>

      <View style={styles.content}>

        <View style={styles.iconContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color="#D32F2F"
          />
        </View>

        <Text style={styles.title}>
          Emergency Assistance
        </Text>

        <Text style={styles.description}>
          Get immediate assistance during a medical emergency.
        </Text>

        <TouchableOpacity style={styles.emergencyButton}>
          <Ionicons
            name="call-outline"
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.buttonText}>
            Emergency Call
          </Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },

  header: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#263238',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 35,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#263238',
  },

  description: {
    textAlign: 'center',
    color: '#78909C',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 30,
  },

  emergencyButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 8,
  },

});

export default EmergencyScreen;