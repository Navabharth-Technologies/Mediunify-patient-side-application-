import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import colors from '../theme/colors';

const MainTabNavigator = ({ navigation, state }) => {

  const currentRoute = state?.routes?.[state.index]?.name;

  const goTo = (routeName) => {
    navigation.navigate(routeName);
  };

  return (
    <View style={styles.bottomNavigation}>

      {/* HOME */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.8}
        onPress={() => goTo('Home')}
      >

        <View
          style={[
            styles.bottomIcon,
            currentRoute === 'Home' &&
              styles.activeBottomIcon,
          ]}
        >
          <Ionicons
            name={
              currentRoute === 'Home'
                ? 'home'
                : 'home-outline'
            }
            size={22}
            color={
              currentRoute === 'Home'
                ? colors.white
                : colors.secondary
            }
          />
        </View>

        <Text
          style={[
            styles.bottomText,
            currentRoute === 'Home' &&
              styles.activeBottomText,
          ]}
        >
          Home
        </Text>

      </TouchableOpacity>


      {/* IN-PERSON */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.8}
        onPress={() => goTo('DoctorList')}
      >

        <View
          style={[
            styles.bottomIcon,
            currentRoute === 'DoctorList' &&
              styles.activeBottomIcon,
          ]}
        >
          <Ionicons
            name="medical-outline"
            size={22}
            color={
              currentRoute === 'DoctorList'
                ? colors.white
                : colors.secondary
            }
          />
        </View>

        <Text
          style={[
            styles.bottomText,
            currentRoute === 'DoctorList' &&
              styles.activeBottomText,
          ]}
        >
          In-Person
        </Text>

      </TouchableOpacity>


      {/* VIDEO */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.8}
        onPress={() =>
          goTo('VideoConsultation')
        }
      >

        <View
          style={[
            styles.bottomIcon,
            currentRoute ===
              'VideoConsultation' &&
              styles.activeBottomIcon,
          ]}
        >
          <Ionicons
            name="videocam-outline"
            size={22}
            color={
              currentRoute ===
              'VideoConsultation'
                ? colors.white
                : colors.secondary
            }
          />
        </View>

        <Text
          style={[
            styles.bottomText,
            currentRoute ===
              'VideoConsultation' &&
              styles.activeBottomText,
          ]}
        >
          Video
        </Text>

      </TouchableOpacity>


      {/* ACCOUNT */}
      <TouchableOpacity
        style={styles.bottomItem}
        activeOpacity={0.8}
        onPress={() => goTo('Profile')}
      >

        <View
          style={[
            styles.bottomIcon,
            currentRoute === 'Profile' &&
              styles.activeBottomIcon,
          ]}
        >
          <Ionicons
            name={
              currentRoute === 'Profile'
                ? 'person'
                : 'person-outline'
            }
            size={22}
            color={
              currentRoute === 'Profile'
                ? colors.white
                : colors.secondary
            }
          />
        </View>

        <Text
          style={[
            styles.bottomText,
            currentRoute === 'Profile' &&
              styles.activeBottomText,
          ]}
        >
          Account
        </Text>

      </TouchableOpacity>

    </View>
  );
};


const styles = StyleSheet.create({

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

    elevation: 10,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.15,

    shadowRadius: 10,
  },


  bottomItem: {
    flex: 1,

    height: 65,

    alignItems: 'center',

    justifyContent: 'center',
  },


  bottomIcon: {
    width: 42,

    height: 35,

    borderRadius: 20,

    alignItems: 'center',

    justifyContent: 'center',
  },


  activeBottomIcon: {
    backgroundColor: colors.primary,
  },


  bottomText: {
    marginTop: 3,

    fontSize: 9,

    fontWeight: '700',

    color: colors.secondary,

    textAlign: 'center',
  },


  activeBottomText: {
    color: colors.primary,

    fontWeight: '800',
  },

});

export default MainTabNavigator;