import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import colors from '../../theme/colors';
import FloatingCareAI from '../../components/FloatingCareAI';


const ProfileScreen = ({ navigation, route }) => {

  // =========================================================
  // USER
  // =========================================================

  const [user, setUser] = useState({
    name: route?.params?.updatedUser?.name || 'Hemanth',
    email: route?.params?.updatedUser?.email || 'hemanth@example.com',
    phone: route?.params?.updatedUser?.phone || '+91 98765 43210',
  });


  // =========================================================
  // RECEIVE UPDATED USER
  // =========================================================

  React.useEffect(() => {

    if (route?.params?.updatedUser) {

      setUser({
        name: route.params.updatedUser.name || '',
        email: route.params.updatedUser.email || '',
        phone: route.params.updatedUser.phone || '',
      });

    }

  }, [route?.params?.updatedUser]);


  // =========================================================
  // EDIT PROFILE
  // =========================================================

  const handleEditProfile = () => {

    console.log('Edit Profile pressed');

    navigation.navigate('EditProfile', {
      user: user,
    });

  };


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            console.log('Logout pressed');
            console.log('Logging out...');

            navigation.getParent()?.reset({
              index: 0,
              routes: [
                {
                  name: 'Auth',
                },
              ],
            });
          },
        },
      ],
    );
  };

  // =========================================================
  // BOTTOM NAVIGATION
  // =========================================================

  const goHome = () => {

    navigation.navigate('Home');

  };


  const goInPerson = () => {

    navigation.navigate('DoctorList');

  };


  const goVideo = () => {

    navigation.navigate('VideoConsultation');

  };


  const goProfile = () => {

    navigation.navigate('Profile');

  };


  // =========================================================
  // ACCOUNT OPTIONS
  // =========================================================

  const profileOptions = [
    {
      title: 'Unnathi Health Wallet',
      subtitle: '₹1,250 Health Cash • 500 Care Points',
      icon: 'wallet-outline',
      color: '#059669',
      background: '#ECFDF5',
      badge: '₹1,250',
      route: 'Wallet',
    },
    {
      title: 'Family Profiles',
      subtitle: 'Manage family members & dependents',
      icon: 'people-outline',
      color: colors.primary,
      background: '#E6F7F7',
      route: 'FamilyProfiles',
    },
    {
      title: 'My Prescriptions',
      subtitle: 'Doctor advice, medicines & refills',
      icon: 'medkit-outline',
      color: '#5967D8',
      background: '#EEF0FF',
      route: 'Prescriptions',
    },
    {
      title: 'Lab & Diagnostic Reports',
      subtitle: 'CBC, Blood Sugar, Thyroid, X-Ray',
      icon: 'flask-outline',
      color: '#1596A5',
      background: '#E7F7FA',
      route: 'Reports',
    },
    {
      title: 'Pharmacy Orders',
      subtitle: 'Order tracking & invoices',
      icon: 'receipt-outline',
      color: '#E67E22',
      background: '#FFF3E0',
      route: 'MyOrders',
    },
    {
      title: 'Transaction & Payment History',
      subtitle: 'Invoices, receipts & payment records',
      icon: 'receipt-outline',
      color: '#059669',
      background: '#ECFDF5',
      route: 'TransactionHistory',
    },
    {
      title: 'Notifications',
      subtitle: 'Reminders & health updates',
      icon: 'notifications-outline',
      color: colors.primary,
      background: '#E6F7F7',
      route: 'Notifications',
    },
    {
      title: 'Help & 24/7 Support',
      subtitle: 'Call helpline & WhatsApp chat',
      icon: 'headset-outline',
      color: '#1596A5',
      background: '#E7F7FA',
      route: 'HelpSupport',
    },
    {
      title: 'App Settings',
      subtitle: 'Preferences, security & language',
      icon: 'settings-outline',
      color: '#5967D8',
      background: '#EEF0FF',
      route: 'Settings',
    },
  ];

  // =========================================================
  // ACCOUNT OPTION PRESS
  // =========================================================

  const handleOptionPress = (item) => {
    if (item.route) {
      navigation.navigate(item.route);
      return;
    }

    Alert.alert(item.title, `${item.title} is coming soon.`);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <SafeAreaView style={styles.container}>
      {/* =====================================================
          SCROLLABLE CONTENT
      ===================================================== */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===================================================
            HEADER
        =================================================== */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>MY ACCOUNT</Text>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.settingsButton,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.navigate('Settings')}
            hitSlop={10}
          >
            <Ionicons
              name="settings-outline"
              size={21}
              color={colors.secondary}
            />
          </Pressable>
        </View>


        {/* ===================================================
            PROFILE CARD
        =================================================== */}

        <View style={styles.profileCard}>

          {/* AVATAR */}

          <View style={styles.avatar}>

            <Ionicons
              name="person"
              size={34}
              color={colors.white}
            />

          </View>


          {/* USER INFORMATION */}

          <View style={styles.userInfo}>

            <Text
              style={styles.userName}
              numberOfLines={1}
            >
              {user.name}
            </Text>

            <View style={styles.infoRow}>

              <Ionicons
                name="mail-outline"
                size={13}
                color="#C8D8F2"
              />

              <Text
                style={styles.userEmail}
                numberOfLines={1}
              >
                {user.email}
              </Text>

            </View>


            <View style={styles.infoRow}>

              <Ionicons
                name="call-outline"
                size={13}
                color="#C8D8F2"
              />

              <Text
                style={styles.userPhone}
                numberOfLines={1}
              >
                {user.phone}
              </Text>

            </View>

          </View>


          {/* =================================================
              EDIT BUTTON
          ================================================= */}

          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.editButtonPressed,
            ]}
            onPress={handleEditProfile}
            hitSlop={10}
          >

            <Ionicons
              name="create-outline"
              size={21}
              color={colors.primary}
            />

          </Pressable>

        </View>


        {/* ===================================================
            ACCOUNT
        =================================================== */}

        <View style={styles.sectionHeader}>



        </View>


        {/* ===================================================
            OPTIONS
        =================================================== */}

        <View style={styles.optionsContainer}>

          {profileOptions.map((item) => (

            <Pressable
              key={item.title}
              style={({ pressed }) => [
                styles.profileOption,
                pressed && styles.optionPressed,
              ]}
              onPress={() => handleOptionPress(item)}
              android_ripple={{
                color: '#E8EEF5',
              }}
            >

              {/* ICON */}

              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: item.background,
                  },
                ]}
              >

                <Ionicons
                  name={item.icon}
                  size={23}
                  color={item.color}
                />

              </View>


              {/* TEXT */}

              <View style={styles.optionInfo}>

                <Text style={styles.optionTitle}>
                  {item.title}
                </Text>

                <Text style={styles.optionSubtitle}>
                  {item.subtitle}
                </Text>

              </View>


              {/* BADGE OR ARROW */}
              {item.badge && (
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>{item.badge}</Text>
                </View>
              )}

              <View style={styles.arrowCircle}>
                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={colors.slate}
                />
              </View>

            </Pressable>

          ))}

        </View>


        {/* ===================================================
            LOGOUT
        =================================================== */}

        <View style={styles.logoutSection}>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutPressed,
            ]}
            onPress={handleLogout}
            hitSlop={5}
          >

            {/* LOGOUT ICON */}

            <View style={styles.logoutIcon}>

              <Ionicons
                name="log-out-outline"
                size={24}
                color="#D32F2F"
              />

            </View>


            {/* TEXT */}

            <View style={styles.logoutInfo}>

              <Text style={styles.logoutTitle}>
                Logout
              </Text>

              <Text style={styles.logoutSubtitle}>
                Sign out of your Mediunify account
              </Text>

            </View>


            {/* ARROW */}

            <View style={styles.logoutArrow}>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#D32F2F"
              />

            </View>

          </Pressable>

        </View>


        {/* ===================================================
            VERSION
        =================================================== */}

        <View style={styles.versionContainer}>

          <View style={styles.versionLine} />

          <Text style={styles.brandText}>
            MEDIUNIFY
          </Text>

          <Text style={styles.versionText}>
            Version 1.0.0
          </Text>

        </View>


        {/* ===================================================
            EXTRA SPACE
        =================================================== */}

        <View style={styles.bottomSpace} />

      </ScrollView>


      {/* =====================================================
          CARE AI
          
          OUTSIDE SCROLLVIEW
          ABOVE BOTTOM NAVIGATION
      ===================================================== */}

      <View
        style={styles.aiWrapper}
        pointerEvents="box-none"
      >

        <FloatingCareAI
          onPress={() => {
            console.log('Care AI pressed');
            navigation.navigate('Chatbot');
          }}
        />

      </View>


      {/* =====================================================
          BOTTOM NAVIGATION
      ===================================================== */}

      <View
        style={styles.bottomNavWrapper}
        pointerEvents="box-none"
      >

        <View style={styles.bottomNav}>


          {/* HOME */}

          <Pressable
            style={({ pressed }) => [
              styles.bottomItem,
              pressed && styles.navPressed,
            ]}
            onPress={goHome}
          >

            <Ionicons
              name="home-outline"
              size={23}
              color={colors.secondary}
            />

            <Text style={styles.bottomText}>
              Home
            </Text>

          </Pressable>


          {/* IN PERSON */}

          <Pressable
            style={({ pressed }) => [
              styles.bottomItem,
              pressed && styles.navPressed,
            ]}
            onPress={goInPerson}
          >

            <Ionicons
              name="medical-outline"
              size={24}
              color={colors.secondary}
            />

            <Text style={styles.bottomText}>
              In-Person
            </Text>

          </Pressable>


          {/* VIDEO */}

          <Pressable
            style={({ pressed }) => [
              styles.bottomItem,
              pressed && styles.navPressed,
            ]}
            onPress={goVideo}
          >

            <Ionicons
              name="videocam-outline"
              size={24}
              color={colors.secondary}
            />

            <Text style={styles.bottomText}>
              Video
            </Text>

          </Pressable>


          {/* PROFILE */}

          <Pressable
            style={({ pressed }) => [
              styles.bottomItem,
              pressed && styles.navPressed,
            ]}
            onPress={goProfile}
          >

            <View style={styles.activeIcon}>

              <Ionicons
                name="person"
                size={20}
                color={colors.white}
              />

            </View>

            <Text style={styles.activeText}>
              Account
            </Text>

          </Pressable>

        </View>

      </View>

    </SafeAreaView>

  );

};


// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({

  // ===========================================================
  // CONTAINER
  // ===========================================================

  container: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },


  scrollView: {
    flex: 1,
  },


  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,

    /*
     * Space reserved for bottom navigation + Care AI.
     */

    paddingBottom: 190,
  },


  // ===========================================================
  // HEADER
  // ===========================================================

  header: {
    minHeight: 62,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },


  headerLabel: {
    fontSize: 10,

    fontWeight: '800',

    letterSpacing: 1.5,

    color: colors.primary,
  },


  headerTitle: {
    marginTop: 3,

    fontSize: 27,

    fontWeight: '900',

    color: colors.secondary,
  },


  settingsButton: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: colors.white,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: colors.border,

    elevation: 2,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },


  // ===========================================================
  // PROFILE CARD
  // ===========================================================

  profileCard: {
    marginTop: 14,

    minHeight: 126,

    padding: 16,

    borderRadius: 24,

    backgroundColor: colors.secondary,

    flexDirection: 'row',

    alignItems: 'center',

    elevation: 5,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.13,
    shadowRadius: 10,
  },


  avatar: {
    width: 68,
    height: 68,

    borderRadius: 34,

    backgroundColor: colors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 3,

    borderColor: 'rgba(255,255,255,0.18)',
  },


  userInfo: {
    flex: 1,

    marginLeft: 13,

    marginRight: 8,
  },


  userName: {
    fontSize: 19,

    fontWeight: '900',

    color: colors.white,

    marginBottom: 5,
  },


  infoRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 3,

    minWidth: 0,
  },


  userEmail: {
    flex: 1,

    marginLeft: 5,

    fontSize: 10,

    color: '#DCE8FF',
  },


  userPhone: {
    flex: 1,

    marginLeft: 5,

    fontSize: 10,

    color: '#DCE8FF',
  },


  // ===========================================================
  // EDIT
  // ===========================================================

  editButton: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: colors.white,

    alignItems: 'center',
    justifyContent: 'center',

    elevation: 4,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },


  editButtonPressed: {
    opacity: 0.65,

    transform: [
      {
        scale: 0.94,
      },
    ],
  },


  // ===========================================================
  // SECTION
  // ===========================================================

  sectionHeader: {
    marginTop: 25,

    marginBottom: 12,
  },


  sectionTitle: {
    fontSize: 19,

    fontWeight: '900',

    color: colors.secondary,
  },


  sectionSubtitle: {
    marginTop: 4,

    fontSize: 10,

    color: colors.slate,
  },


  // ===========================================================
  // OPTIONS
  // ===========================================================

  optionsContainer: {
    gap: 10,
  },


  profileOption: {
    minHeight: 76,

    borderRadius: 18,

    backgroundColor: colors.white,

    paddingHorizontal: 12,

    paddingVertical: 11,

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderColor: colors.border,

    elevation: 2,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.035,

    shadowRadius: 5,
  },


  optionPressed: {
    opacity: 0.72,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },


  optionIcon: {
    width: 49,
    height: 49,

    borderRadius: 16,

    alignItems: 'center',
    justifyContent: 'center',
  },


  optionInfo: {
    flex: 1,

    marginLeft: 12,
  },


  optionTitle: {
    fontSize: 14,

    fontWeight: '800',

    color: colors.secondary,
  },


  optionSubtitle: {
    marginTop: 4,

    fontSize: 10,

    color: colors.slate,
  },


  optionBadge: {
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },

  optionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },

  arrowCircle: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: '#F7F9FB',

    alignItems: 'center',
    justifyContent: 'center',
  },


  // ===========================================================
  // LOGOUT
  // ===========================================================

  logoutSection: {
    marginTop: 22,
    marginBottom: 8,
  },


  logoutButton: {
    minHeight: 80,

    borderRadius: 19,

    backgroundColor: '#FFF3F3',

    borderWidth: 1,

    borderColor: '#FFD7D7',

    paddingHorizontal: 13,

    paddingVertical: 12,

    flexDirection: 'row',

    alignItems: 'center',

    elevation: 2,
  },


  logoutPressed: {
    opacity: 0.68,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },


  logoutIcon: {
    width: 49,
    height: 49,

    borderRadius: 16,

    backgroundColor: '#FFE4E4',

    alignItems: 'center',
    justifyContent: 'center',
  },


  logoutInfo: {
    flex: 1,

    marginLeft: 12,
  },


  logoutTitle: {
    fontSize: 14,

    fontWeight: '900',

    color: '#D32F2F',
  },


  logoutSubtitle: {
    marginTop: 4,

    fontSize: 10,

    color: '#A94444',
  },


  logoutArrow: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: '#FFE8E8',

    alignItems: 'center',
    justifyContent: 'center',
  },


  // ===========================================================
  // VERSION
  // ===========================================================

  versionContainer: {
    alignItems: 'center',

    marginTop: 19,
  },


  versionLine: {
    width: 65,

    height: 1,

    backgroundColor: colors.border,

    marginBottom: 10,
  },


  brandText: {
    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 1.6,

    color: colors.primary,
  },


  versionText: {
    marginTop: 3,

    fontSize: 9,

    color: colors.slate,
  },


  // ===========================================================
  // BOTTOM SPACE
  // ===========================================================

  bottomSpace: {
    height: 25,
  },


  // ===========================================================
  // CARE AI
  // ===========================================================

  aiWrapper: {
    position: 'absolute',

    right: 18,

    /*
     * AI sits above the bottom navigation.
     */

    bottom: 94,

    zIndex: 50,

    elevation: 50,

    alignItems: 'flex-end',
  },


  // ===========================================================
  // BOTTOM NAVIGATION
  // ===========================================================

  bottomNavWrapper: {
    position: 'absolute',

    left: 0,
    right: 0,
    bottom: 0,

    height: 88,

    justifyContent: 'flex-end',

    alignItems: 'center',

    zIndex: 100,

    elevation: 100,

    pointerEvents: 'box-none',
  },


  bottomNav: {
    position: 'absolute',

    left: 14,
    right: 14,

    bottom: Platform.OS === 'ios' ? 10 : 11,

    height: 70,

    borderRadius: 26,

    backgroundColor: colors.white,

    borderWidth: 1,

    borderColor: colors.border,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-around',

    paddingHorizontal: 5,

    elevation: 12,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.14,

    shadowRadius: 10,

    zIndex: 101,
  },


  bottomItem: {
    flex: 1,

    height: 62,

    alignItems: 'center',

    justifyContent: 'center',

    zIndex: 102,
  },


  navPressed: {
    opacity: 0.65,
  },


  bottomText: {
    marginTop: 4,

    fontSize: 9,

    fontWeight: '700',

    color: colors.secondary,

    textAlign: 'center',
  },


  activeIcon: {
    width: 40,
    height: 34,

    borderRadius: 18,

    backgroundColor: colors.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },


  activeText: {
    marginTop: 3,

    fontSize: 9,

    fontWeight: '800',

    color: colors.primary,
  },


  // ===========================================================
  // GENERAL PRESS
  // ===========================================================

  pressed: {
    opacity: 0.65,
  },

});


export default ProfileScreen;