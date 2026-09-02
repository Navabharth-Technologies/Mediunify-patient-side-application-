import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const EmergencyScreen = ({ navigation }) => {

  const emergencyAlert = () => {

    Alert.alert(
      'Emergency Assistance',
      'Emergency assistance feature will be connected to the backend later.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.back}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Emergency Help
        </Text>

      </View>

      <View style={styles.content}>

        <Text style={styles.icon}>
          🚑
        </Text>

        <Text style={styles.heading}>
          Emergency Assistance
        </Text>

        <Text style={styles.description}>
          Get quick access to emergency healthcare
          services.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={emergencyAlert}
        >
          <Text style={styles.buttonText}>
            Request Emergency Help
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },

  back: {
    fontSize: 40,
    color: '#D32F2F',
    marginRight: 12,
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
  },

  content: {
    alignItems: 'center',
    padding: 30,
    marginTop: 80,
  },

  icon: {
    fontSize: 70,
  },

  heading: {
    fontSize: 25,
    fontWeight: '800',
    marginTop: 20,
  },

  description: {
    textAlign: 'center',
    color: '#687386',
    marginTop: 10,
    lineHeight: 22,
  },

  button: {
    backgroundColor: '#D32F2F',
    padding: 17,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

});

export default EmergencyScreen;