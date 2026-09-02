import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';

const NotificationsScreen = ({ navigation }) => {
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
          Notifications
        </Text>

      </View>

      <View style={styles.empty}>
        <Text style={styles.icon}>
          🔔
        </Text>

        <Text style={styles.message}>
          No new notifications
        </Text>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },

  back: {
    fontSize: 40,
    color: '#1976D2',
    marginRight: 12,
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    fontSize: 50,
  },

  message: {
    marginTop: 15,
    color: '#687386',
  },

});

export default NotificationsScreen;