import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  Modal,
  Image,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import { detectUserLocationWithAddress, MYSORE_LOCALITIES } from '../../utils/locationHelper';

// Flipkart-style Category Strip (Filtered & Focused)
const FLIPKART_CATEGORIES = [
  { id: 'for-you', label: 'For You', icon: 'bag-handle-outline', activeIcon: 'bag-handle', route: 'Home' },
  { id: 'doctors', label: 'Doctors', icon: 'people-outline', activeIcon: 'people', route: 'DoctorList' },
  { id: 'video-call', label: 'Video Call', icon: 'videocam-outline', activeIcon: 'videocam', route: 'VideoConsultation' },
  { id: 'hospitals', label: 'Nearby Hospitals', icon: 'business-outline', activeIcon: 'business', route: 'HospitalList' },
  { id: 'medicines', label: 'Medicines', icon: 'medkit-outline', activeIcon: 'medkit', route: 'Pharmacy' },
  { id: 'lab-tests', label: 'Lab Tests', icon: 'flask-outline', activeIcon: 'flask', route: 'LabTests' },
  { id: 'scans', label: 'Scans & MRI', icon: 'scan-outline', activeIcon: 'scan', route: 'Imaging' },
  { id: 'surgeries', label: 'Surgeries', icon: 'medkit-outline', activeIcon: 'medkit', route: 'HospitalCare' },
  { id: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline', activeIcon: 'shield-checkmark', route: 'HealthInsurance' },
  { id: 'home-care', label: 'Home Care', icon: 'heart-outline', activeIcon: 'heart', route: 'NurseBooking' },
];

const LOCATIONS = [
  'Kuvempunagar, Mysore',
  'Jayalakshmipuram, Mysore',
  'Gokulam, Mysore',
  'Vijayanagar, Mysore',
  'Indiranagar, Bangalore',
  'Koramangala, Bangalore',
];

const WebHeader = ({ navigation, currentRoute = 'Home', currentParams = {} }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { cartItems } = useCart();
  const cartCount = cartItems?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;

  const [selectedLocation, setSelectedLocation] = useState('Mysore Central');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [locSearchQuery, setLocSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState(currentParams?.query || '');
  const [userName, setUserName] = useState('Hemanth');
  const [walletBalance, setWalletBalance] = useState(1250);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('for-you');

  useEffect(() => {
    const routeCategoryMap = {
      Home: 'for-you',
      DoctorList: 'doctors',
      DoctorBooking: 'doctors',
      VideoConsultation: 'video-call',
      VideoBooking: 'video-call',
      VideoMeeting: 'video-call',
      HospitalList: 'hospitals',
      Pharmacy: 'medicines',
      PharmacyStoreDetail: 'medicines',
      LabTests: 'lab-tests',
      Imaging: 'scans',
      RadiologyLabs: 'scans',
      HospitalCare: 'surgeries',
      HospitalSurgeryDetails: 'surgeries',
      SurgeryQuoteRequest: 'surgeries',
      HealthInsurance: 'insurance',
      NurseBooking: 'home-care',
    };
    if (routeCategoryMap[currentRoute]) {
      setActiveCategory(routeCategoryMap[currentRoute]);
    }
  }, [currentRoute]);

  useEffect(() => {
    if (currentRoute === 'GlobalSearch' && currentParams?.query !== undefined) {
      setSearchQuery(currentParams.query);
    }
  }, [currentRoute, currentParams?.query]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const savedActive = await AsyncStorage.getItem('@unnathi_active_patient');
        if (savedActive) {
          const parsed = JSON.parse(savedActive);
          if (parsed?.displayName || parsed?.name) {
            const raw = (parsed.displayName || parsed.name).trim();
            const first = raw.replace(/\s*\([Ss]elf\)/g, '').split(' ')[0] || raw;
            if (first) {
              setUserName(first);
            }
          }
        } else {
          const stored = await AsyncStorage.getItem('userName');
          if (stored && stored.trim()) {
            setUserName(stored.trim());
          }
        }

        const storedWallet = await AsyncStorage.getItem('@unnathi_wallet_balance');
        if (storedWallet !== null) {
          setWalletBalance(parseInt(storedWallet, 10) || 1250);
        }

        const savedLoc = await AsyncStorage.getItem('@unnathi_user_location');
        if (savedLoc && savedLoc.trim()) {
          setSelectedLocation(savedLoc.trim());
        }
      } catch (e) {
        console.log('Error reading user data in WebHeader:', e);
      }
    };
    fetchUserData();
  }, []);

  const handleDetectLiveGps = async () => {
    try {
      setDetectingGps(true);
      const res = await detectUserLocationWithAddress();
      if (res.success) {
        setSelectedLocation(res.shortLoc);
        setIsLocationModalOpen(false);
      } else {
        alert(res.message || 'Unable to detect GPS position. Please select an area from the list.');
      }
    } catch (e) {
      alert('Could not detect location. Please select an area from the list.');
    } finally {
      setDetectingGps(false);
    }
  };

  const handleNavigate = (routeName) => {
    if (navigation?.navigate) {
      navigation.navigate('MainApp', { screen: routeName });
    }
  };

  const handleLogout = async () => {
    setIsMoreMenuOpen(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to securely log out of your healthcare account?');
      if (!confirmed) return;
    }
    try {
      await AsyncStorage.multiRemove([
        'userToken',
        'isLoggedIn',
        '@unnathi_active_patient',
        'user',
        'userName',
        'userEmail',
        'userPhone',
      ]);
    } catch (e) {
      console.log('Logout storage clear err:', e);
    }

    let navigated = false;
    const parent = navigation?.getParent?.();
    if (parent?.reset) {
      try {
        parent.reset({
          index: 0,
          routes: [{ name: 'Auth', state: { routes: [{ name: 'Login' }] } }],
        });
        navigated = true;
      } catch (e) {}
    }
    if (!navigated && parent?.navigate) {
      try {
        parent.navigate('Auth', { screen: 'Login' });
        navigated = true;
      } catch (e) {}
    }
    if (!navigated && navigation?.reset) {
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
        navigated = true;
      } catch (e) {}
    }
    if (!navigated && navigation?.navigate) {
      try {
        navigation.navigate('Auth', { screen: 'Login' });
        navigated = true;
      } catch (e) {}
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setTimeout(() => {
        if (window.location) {
          window.location.href = '/';
        }
      }, 150);
    }
  };

  return (
    <View style={styles.headerWrapper}>
      {/* ============================================================
          MAIN SEARCH & BRAND ROW (Official Logo + Search + User + Cart)
      ============================================================ */}
      <View style={styles.mainSearchNav}>
        <View style={styles.mainSearchInner}>
          {/* Official Mediunify Brand Logo */}
          <TouchableOpacity
            style={styles.brandContainer}
            onPress={() => handleNavigate('Home')}
            activeOpacity={0.85}
          >
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.brandLogoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Location Delivery Selector with Live GPS */}
          <TouchableOpacity
            style={styles.locationPillBtn}
            onPress={() => setIsLocationModalOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-sharp" size={17} color="#00B894" />
            <View style={styles.locationPillTextCol}>
              <Text style={styles.locationPillSmall}>Deliver to</Text>
              <Text style={styles.locationPillMain} numberOfLines={1}>
                {selectedLocation}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={13} color="#64748B" />
          </TouchableOpacity>

          {/* Search Bar Box */}
          <View style={styles.searchBarBox}>
            <TouchableOpacity
              onPress={() => {
                if (searchQuery.trim()) {
                  handleNavigate('GlobalSearch', { query: searchQuery.trim() });
                }
              }}
              activeOpacity={0.7}
              style={{ marginRight: 8, padding: 2 }}
            >
              <Ionicons name="search" size={19} color="#717478" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for Doctors, Medicines, Lab Tests, Scans and More"
              placeholderTextColor="#717478"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (currentRoute === 'GlobalSearch' && navigation?.navigate) {
                  navigation.navigate('GlobalSearch', { query: text });
                }
              }}
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  handleNavigate('GlobalSearch', { query: searchQuery.trim() });
                }
              }}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  if (currentRoute === 'GlobalSearch' && navigation?.navigate) {
                    navigation.navigate('GlobalSearch', { query: '' });
                  }
                }}
                style={{ padding: 2 }}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Right Side Actions: Notification, Wallet, User, More, Cart */}
          <View style={styles.actionButtonsRow}>
            {/* Notification Alerts Icon */}
            <TouchableOpacity
              style={styles.notifButton}
              onPress={() => handleNavigate('Notifications')}
              activeOpacity={0.8}
            >
              <View style={styles.notifIconWrapper}>
                <Ionicons name="notifications-outline" size={21} color="#0F172A" />
                <View style={styles.notifRedDot} />
              </View>
              <Text style={styles.notifLabelText}>Alerts</Text>
            </TouchableOpacity>

            {/* Health Wallet Quick Button */}
            <TouchableOpacity
              style={styles.walletQuickBtn}
              onPress={() => handleNavigate('Wallet')}
              activeOpacity={0.8}
            >
              <View style={styles.walletIconCircle}>
                <Ionicons name="wallet-outline" size={17} color="#059669" />
              </View>
              <View style={styles.walletTextCol}>
                <Text style={styles.walletMiniTitle}>Wallet</Text>
                <Text style={styles.walletMiniBal}>₹{walletBalance.toLocaleString('en-IN')}</Text>
              </View>
            </TouchableOpacity>

            {/* User Profile (Hemanth / Ramesh) - Arrow mark removed */}
            <TouchableOpacity
              style={styles.userProfileBtn}
              onPress={() => handleNavigate('Profile')}
              activeOpacity={0.8}
            >
              <Ionicons name="person-circle-outline" size={21} color="#0F172A" />
              <Text style={styles.userNameText} numberOfLines={1}>
                {userName || 'Account'}
              </Text>
            </TouchableOpacity>

            {/* More Menu Dropdown Container */}
            <View style={styles.moreMenuWrapper}>
              <TouchableOpacity
                style={styles.moreMenuBtn}
                onPress={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                activeOpacity={0.8}
              >
                <Text style={styles.moreMenuText}>More</Text>
                <Ionicons name="chevron-down" size={14} color="#0F172A" />
              </TouchableOpacity>

              {/* More Dropdown Modal / Popover right below More button */}
              {isMoreMenuOpen && (
                <View style={styles.dropdownPopover}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setIsMoreMenuOpen(false);
                      handleNavigate('Bookings');
                    }}
                  >
                    <Ionicons name="calendar-outline" size={16} color="#475569" />
                    <Text style={styles.dropdownItemText}>My Appointments & Bookings</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setIsMoreMenuOpen(false);
                      handleNavigate('Notifications');
                    }}
                  >
                    <Ionicons name="notifications-outline" size={16} color="#475569" />
                    <Text style={styles.dropdownItemText}>Notification Preferences</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setIsMoreMenuOpen(false);
                      handleNavigate('Emergency');
                    }}
                  >
                    <Ionicons name="call-outline" size={16} color="#EF4444" />
                    <Text style={[styles.dropdownItemText, { color: '#EF4444' }]}>24/7 Emergency Care</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={handleLogout}
                  >
                    <Ionicons name="log-out-outline" size={16} color="#DC2626" />
                    <Text style={[styles.dropdownItemText, { color: '#DC2626', fontWeight: '700' }]}>Sign Out / Log Out</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Cart with Notification Counter */}
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => handleNavigate('Cart')}
              activeOpacity={0.85}
            >
              <View style={styles.cartIconWrapper}>
                <Ionicons name="cart-outline" size={22} color="#0F172A" />
                {cartCount > 0 && (
                  <View style={styles.cartRedBadge}>
                    <Text style={styles.cartRedBadgeText}>{cartCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cartLabelText}>Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ============================================================
          3. FLIPKART HORIZONTAL CATEGORY STRIP (Clean & Focused)
      ============================================================ */}
      <View style={styles.categoryStrip}>
        <View style={styles.categoryStripInner}>
          {FLIPKART_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  isSelected && styles.categoryItemActive,
                ]}
                onPress={() => {
                  setActiveCategory(cat.id);
                  handleNavigate(cat.route);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.catIconWrap}>
                  <Ionicons
                    name={isSelected ? cat.activeIcon : cat.icon}
                    size={22}
                    color={isSelected ? '#00B894' : '#1E293B'}
                  />
                </View>
                <Text
                  style={[
                    styles.catLabel,
                    isSelected && styles.catLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
                {isSelected && <View style={styles.activeCategoryUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Location Modal */}
      <Modal
        visible={isLocationModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLocationModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsLocationModalOpen(false)}
        >
          <View style={styles.locationModalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.locationModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location-sharp" size={20} color={colors.primary} />
                <Text style={styles.locationModalTitle}>Select Delivery Location</Text>
              </View>
              <TouchableOpacity onPress={() => setIsLocationModalOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Live GPS Detection Button */}
            <TouchableOpacity
              style={styles.gpsDetectButton}
              onPress={handleDetectLiveGps}
              disabled={detectingGps}
              activeOpacity={0.85}
            >
              {detectingGps ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="navigate-circle" size={22} color="#FFFFFF" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsDetectButtonText}>
                  {detectingGps ? 'Detecting Live GPS Position...' : 'Use My Current Live GPS Location'}
                </Text>
                <Text style={styles.gpsDetectSubtext}>
                  Instant auto-detect via satellite GPS / Wi-Fi
                </Text>
              </View>
            </TouchableOpacity>

            {/* Area Search Box */}
            <View style={styles.locSearchBox}>
              <Ionicons name="search" size={16} color="#94A3B8" />
              <TextInput
                style={styles.locSearchInput}
                placeholder="Search neighborhood or area..."
                placeholderTextColor="#94A3B8"
                value={locSearchQuery}
                onChangeText={setLocSearchQuery}
              />
            </View>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {MYSORE_LOCALITIES.filter((l) =>
                !locSearchQuery ||
                l.name.toLowerCase().includes(locSearchQuery.toLowerCase()) ||
                l.full.toLowerCase().includes(locSearchQuery.toLowerCase())
              ).map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={[
                    styles.locationOption,
                    selectedLocation.includes(loc.name) && styles.locationOptionSelected,
                  ]}
                  onPress={async () => {
                    setSelectedLocation(loc.full);
                    await AsyncStorage.setItem('@unnathi_user_location', loc.full);
                    setIsLocationModalOpen(false);
                  }}
                >
                  <Ionicons
                    name={selectedLocation.includes(loc.name) ? 'checkmark-circle' : 'radio-button-off'}
                    size={18}
                    color={selectedLocation.includes(loc.name) ? colors.primary : '#94A3B8'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.locationOptionText,
                        selectedLocation.includes(loc.name) && styles.locationOptionTextSelected,
                      ]}
                    >
                      {loc.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>{loc.city} • Pincode: {loc.pincode}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 999,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  // 1. TOP UTILITY ROW
  topBar: {
    backgroundColor: '#F1F2F4',
    paddingVertical: 6,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topBarInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emergencyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  emergencyLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  topRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  locationTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationStaticText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
  },
  locationActionLink: {
    color: '#00B894',
    fontWeight: '700',
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  coinCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },

  // 2. MAIN SEARCH & BRAND ROW
  mainSearchNav: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
    zIndex: 100,
  },
  mainSearchInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  brandLogoImage: {
    width: 140,
    height: 52,
  },
  searchBarBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5FF', // Flipkart Soft Search Blue-Grey
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    outlineStyle: 'none',
    padding: 0,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    position: 'relative',
    zIndex: 101,
  },
  notifButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  notifIconWrapper: {
    position: 'relative',
  },
  notifRedDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  notifLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  walletQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  walletIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTextCol: {
    justifyContent: 'center',
  },
  walletMiniTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
  },
  walletMiniBal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  walletHeaderTinyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    marginRight: 4,
  },
  userProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: 100,
  },
  moreMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  moreMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cartIconWrapper: {
    position: 'relative',
  },
  cartRedBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF7F50',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartRedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cartLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  moreMenuWrapper: {
    position: 'relative',
    zIndex: 1002,
  },
  dropdownPopover: {
    position: 'absolute',
    top: 36,
    right: -75,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 220,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  // 3. FLIPKART HORIZONTAL CATEGORY STRIP
  categoryStrip: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
    zIndex: 1,
  },
  categoryStripInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  categoryItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    position: 'relative',
  },
  categoryItemActive: {},
  catIconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  catLabelActive: {
    color: '#00B894',
    fontWeight: '800',
  },
  activeCategoryUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: '#00B894',
    borderRadius: 2,
  },

  // LOCATION MODAL
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  locationModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: 440,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationList: {
    gap: 8,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  locationOptionSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: colors.primary,
  },
  locationOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  locationOptionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Location Selector Button in Header
  locationPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 7,
    maxWidth: 160,
  },
  locationPillTextCol: {
    flex: 1,
  },
  locationPillSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 12,
  },
  locationPillMain: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 15,
  },

  // GPS Detect Button in Modal
  gpsDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 14,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  gpsDetectButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gpsDetectSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginTop: 1,
  },

  // Location Search Box
  locSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none',
  },
});

export default WebHeader;
