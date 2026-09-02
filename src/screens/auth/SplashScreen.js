import React, { useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';

import colors from '../../theme/colors';


const SplashScreen = ({ navigation }) => {

  useEffect(() => {

    const timer = setTimeout(() => {

      navigation.replace('Login');

    }, 2500);

    return () => clearTimeout(timer);

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
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 10,
  },

  loadingContainer: {
    marginTop: 35,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#D9EAF7',
    borderTopColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

});


export default SplashScreen;