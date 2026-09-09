import React, { useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../../theme/colors';
import { safeNavigateToMain } from '../../utils/navigationHelper';

const SplashScreen = ({ navigation }) => {

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const loggedIn = await AsyncStorage.getItem('isLoggedIn');
        if (loggedIn === 'true') {
          if (isMounted) {
            safeNavigateToMain(navigation);
          }
          return;
        }
      } catch (e) {}

      if (isMounted) {
        navigation.replace('Login');
      }
    };

    const timer = setTimeout(checkAuth, 1800);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [navigation]);


  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.container}>

        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />


        <Text style={styles.tagline}>
          Bringing Healthcare Together
        </Text>


        <View style={styles.loadingContainer}>

          <View style={styles.loadingCircle} />

        </View>

      </View>

    </SafeAreaView>
  );
};


const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  logo: {
    width: 300,
    height: 240,
    marginBottom: 15,
  },

  tagline: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.3,
  },

  loadingContainer: {
    marginTop: 35,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.lightTeal,
    borderTopColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal,
  },

});


export default SplashScreen;