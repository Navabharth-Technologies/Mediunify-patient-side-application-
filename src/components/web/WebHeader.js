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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { useCart } from '../../context/CartContext';

const NAV_LINKS = [
  { id: 'find-care', label: 'Find Care', hasDropdown: true },
  { id: 'consultation', label: 'Consultation', hasDropdown: true },
  { id: 'lab-tests', label: 'Lab Tests', route: 'LabTests' },
  { id: 'radiology', label: 'Radiology', route: 'Imaging' },
  { id: 'pharmacy', label: 'Pharmacy', route: 'Pharmacy' },
  { id: 'hospitals', label: 'Hospital & Surgery', route: 'HospitalCare' },
  { id: 'insurance', label: 'Insurance', route: 'HealthInsurance' },
  { id: 'more', label: 'More', hasDropdown: true },
];

const SCROLLING_ADS = [
  { id: 'ad-med', badge: 'FLAT 20% OFF', text: 'Doorstep Medicines & Jan Aushadhi in 60 mins • Code: MEDI20', icon: 'medkit', route: 'Pharmacy' },
  { id: 'ad-ayu', badge: 'AYURVEDA & WELLNESS', text: 'Authentic Nadi Pariksha & Classical Panchakarma Starting @ ₹999 • AYUSH Certified Vaidyas', icon: 'leaf', route: 'AyurvedaWellness' },
  { id: 'ad-fert', badge: 'FERTILITY & IVF', text: '0% EMI IVF Packages & Confidential Fertility Guidance • Top Specialists across Karnataka', icon: 'heart', route: 'FertilityIvf' },
  { id: 'ad-equip', badge: 'EQUIPMENT RENTAL', text: 'Rent Hospital Beds, 10L Oxygen Concentrators & Wheelchairs at Home in 4 Hours', icon: 'fitness', route: 'EquipmentRental' },
  { id: 'ad-lab', badge: 'NABL CERTIFIED', text: 'Full Body Health Checkup (68 Vital Tests) From ₹999 • Free Home Pickup & Digital Reports in 12h', icon: 'flask', route: 'LabTests' },
  { id: 'ad-doc', badge: 'VERIFIED DOCTORS', text: 'Instant Video Consultation starting @ ₹299 • Zero Waiting Time with Top Specialists', icon: 'videocam', route: 'VideoConsultation' },
  { id: 'ad-scan', badge: 'UP TO 40% OFF', text: 'High-Precision 3T MRI, CT & Ultrasound Scans at Top Diagnostic Centers across Karnataka', icon: 'scan', route: 'Imaging' },
  { id: 'ad-ins', badge: '100% CASHLESS', text: 'Ayushman & Health Insurance Hospitalization Pre-Approval Support • Zero Deposit', icon: 'shield-checkmark', route: 'HealthInsurance' },
  { id: 'ad-nurse', badge: 'HOME NURSING', text: '24/7 Certified Nurse for Injections, Wound Dressing & Post-Op Recovery at Home', icon: 'heart', route: 'NurseBooking' },
  { id: 'ad-emg', badge: '24/7 HOTLINE', text: 'Immediate Medical Emergency & Free Ambulance Response: 1800-425-0099 / 108', icon: 'call', route: 'Emergency' },
];

const CONSULTATION_ITEMS = [
  {
    label: 'In-Clinic Physical Appointment',
    route: 'DoctorList',
    params: { mode: 'physical' },
    icon: 'business-outline',
    desc: 'Physical appointment at doctor clinic or hospital',
  },
  {
    label: 'Online Video Consultation',
    route: 'VideoConsultation',
    params: { mode: 'online' },
    icon: 'videocam-outline',
    desc: 'Connect in 15 mins via private HD video call',
  },
  {
    label: 'Ayurveda & Panchakarma Vaidya',
    route: 'AyurvedaWellness',
    icon: 'leaf-outline',
    desc: 'Pulse diagnosis, classical detox & herbal care',
  },
];

const FIND_CARE_ITEMS = [
  { label: 'Hospitals & Surgeries', route: 'HospitalCare', icon: 'medkit-outline', desc: 'Accredited hospitals & surgical care' },
  { label: 'Fertility & IVF Care', route: 'FertilityIvf', icon: 'heart-outline', desc: 'Advanced IVF, IUI & reproductive medicine' },
  { label: 'Equipment Rental at Home', route: 'EquipmentRental', icon: 'fitness-outline', desc: 'Hospital beds, oxygen & wheelchairs' },
  { label: '24/7 Emergency Care', route: 'Emergency', icon: 'flash-outline', desc: 'Immediate ambulance & emergency' },
];

const MORE_ITEMS = [
  { label: 'Ayurveda & Wellness', route: 'AyurvedaWellness', icon: 'leaf-outline' },
  { label: 'Fertility & IVF Care', route: 'FertilityIvf', icon: 'heart-outline' },
  { label: 'Medical Equipment Rental', route: 'EquipmentRental', icon: 'fitness-outline' },
  { label: 'Home Care & Nursing', route: 'NurseBooking', icon: 'heart-outline' },
  { label: 'Digital Health Records', route: 'HealthRecords', icon: 'document-text-outline' },
  { label: 'My Bookings', route: 'Bookings', icon: 'calendar-outline' },
  { label: 'Health Wallet', route: 'Wallet', icon: 'wallet-outline' },
  { label: 'Help & Support', route: 'HelpSupport', icon: 'help-circle-outline' },
];

const CITIES = ['Mysuru', 'Bengaluru', 'Mangaluru', 'Hubballi', 'Belagavi'];

const WebHeader = ({ navigation, currentRoute = 'Home', currentParams = {} }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const [selectedCity, setSelectedCity] = useState('Mysuru');
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'find-care' | 'more' | null
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  const { pharmacyCartCount = 0, pharmacyFinalTotal = 0, labCartCount = 0 } = useCart() || {};
  const totalCartCount = (pharmacyCartCount || 0) + (labCartCount || 0);

  const getBadgeStyle = (badge) => {
    if (!badge) return { bg: '#CCFBF1', border: '#99F6E4', text: '#0F766E', iconColor: '#0D9488' };
    const b = badge.toUpperCase();
    if (b.includes('20%') || b.includes('40%') || b.includes('OFF')) {
      return { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309', iconColor: '#D97706' };
    }
    if (b.includes('CERTIFIED') || b.includes('NABL')) {
      return { bg: '#E0F2FE', border: '#BAE6FD', text: '#0369A1', iconColor: '#0284C7' };
    }
    if (b.includes('DOCTOR') || b.includes('VERIFIED')) {
      return { bg: '#F3E8FF', border: '#E9D5FF', text: '#7E22CE', iconColor: '#9333EA' };
    }
    if (b.includes('HOTLINE') || b.includes('24/7')) {
      return { bg: '#FEE2E2', border: '#FECACA', text: '#DC2626', iconColor: '#EF4444' };
    }
    if (b.includes('CASHLESS') || b.includes('100%')) {
      return { bg: '#DCFCE7', border: '#BBF7D0', text: '#15803D', iconColor: '#16A34A' };
    }
    if (b.includes('NURSING') || b.includes('HOME')) {
      return { bg: '#FCE7F3', border: '#FBCFE8', text: '#BE185D', iconColor: '#DB2777' };
    }
    if (b.includes('AYURVEDA') || b.includes('PANCHAKARMA')) {
      return { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', iconColor: '#059669' };
    }
    if (b.includes('FERTILITY') || b.includes('IVF')) {
      return { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D', iconColor: '#DB2777' };
    }
    if (b.includes('EQUIPMENT') || b.includes('RENTAL')) {
      return { bg: '#FAF5FF', border: '#DDD6FE', text: '#5B21B6', iconColor: '#7C3AED' };
    }
    return { bg: '#CCFBF1', border: '#99F6E4', text: '#0F766E', iconColor: '#0D9488' };
  };

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'mediunify-ticker-css';
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `
        @keyframes adScrollMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .scrolling-ads-wrapper {
          display: flex;
          align-items: center;
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: relative;
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,1) 24px, rgba(0,0,0,1) calc(100% - 24px), transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,1) 24px, rgba(0,0,0,1) calc(100% - 24px), transparent 100%);
        }
        .scrolling-ads-track {
          display: flex;
          flex-direction: row;
          align-items: center;
          width: max-content;
          animation: adScrollMarquee 38s linear infinite;
          will-change: transform;
        }
        .scrolling-ads-track:hover {
          animation-play-state: paused;
        }
        .scrolling-ads-track * {
          cursor: pointer;
        }
      `;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const stored = await AsyncStorage.getItem('isLoggedIn');
        setIsLoggedIn(stored === 'true');
        const name = await AsyncStorage.getItem('userName');
        if (name) setUserName(name);
      } catch (e) {}
    };
    checkAuth();
  }, [currentRoute]);

  const handleNavigate = (routeName, params = {}) => {
    setOpenDropdown(null);
    setShowSearchModal(false);
    if (!navigation) return;

    // Navigate smoothly inside MainApp
    if (navigation.navigate) {
      if (['Login', 'Register', 'Auth'].includes(routeName)) {
        navigation.navigate('Auth', { screen: routeName === 'Register' ? 'Register' : 'Login' });
      } else {
        navigation.navigate('MainApp', { screen: routeName, params });
      }
    }
  };

  const isTabActive = (item) => {
    if (item.id === 'lab-tests' && currentRoute === 'LabTests') return true;
    if (item.id === 'radiology' && ['Imaging', 'RadiologyLabs'].includes(currentRoute)) return true;
    if (item.id === 'consultation' && ['VideoConsultation', 'VideoBooking', 'AyurvedaWellness'].includes(currentRoute)) return true;
    if (item.id === 'pharmacy' && ['Pharmacy', 'PharmacyStoreDetail', 'Cart'].includes(currentRoute)) return true;
    if (item.id === 'hospitals' && ['HospitalCare', 'HospitalSurgeryDetails'].includes(currentRoute)) return true;
    if (item.id === 'insurance' && currentRoute === 'HealthInsurance') return true;
    if (item.id === 'find-care' && ['DoctorList', 'DoctorDetails', 'FertilityIvf', 'EquipmentRental'].includes(currentRoute)) return true;
    if (item.id === 'more' && ['NurseBooking', 'AyurvedaWellness', 'FertilityIvf', 'EquipmentRental'].includes(currentRoute)) return true;
    return false;
  };

  return (
    <View style={styles.headerRoot}>
      <View style={styles.headerContainer}>
        {/* ============================================================
            LEFT: BRAND LOGO + SUBTITLE
        ============================================================ */}
        <TouchableOpacity
          style={styles.brandCol}
          onPress={() => handleNavigate('Home')}
          activeOpacity={0.85}
        >
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <View style={styles.brandTextCol}>
              <View style={styles.brandTitleRow}>
                <Text style={styles.brandTitle}>Medi</Text>
                <Text style={styles.brandTitleAccent}>Unify</Text>
              </View>
              <Text style={styles.brandTagline} numberOfLines={1}>
                All your healthcare. One intelligent platform.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ============================================================
            CENTER: NAVIGATION LINKS (Desktop only)
        ============================================================ */}
        {isDesktop && (
          <View style={styles.navLinksRow}>
            {NAV_LINKS.map((item) => {
              const active = isTabActive(item);
              const isOpen = openDropdown === item.id;

              return (
                <View key={item.id} style={styles.navItemWrapper}>
                  <TouchableOpacity
                    style={[styles.navLinkBtn, active && styles.navLinkBtnActive]}
                    onPress={() => {
                      if (item.hasDropdown) {
                        setOpenDropdown(isOpen ? null : item.id);
                      } else if (item.route) {
                        setOpenDropdown(null);
                        handleNavigate(item.route);
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.navLinkText,
                        active && styles.navLinkTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.hasDropdown && (
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={12}
                        color={active ? '#00B894' : '#64748B'}
                        style={styles.chevronIcon}
                      />
                    )}
                    {active && <View style={styles.activeUnderline} />}
                  </TouchableOpacity>

                  {/* Find Care Dropdown Menu */}
                  {item.id === 'find-care' && isOpen && (
                    <View style={styles.dropdownMenu}>
                      {FIND_CARE_ITEMS.map((sub, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.dropdownItem}
                          onPress={() => handleNavigate(sub.route, sub.params)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={sub.icon} size={18} color="#00B894" style={{ marginRight: 10 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dropdownItemTitle}>{sub.label}</Text>
                            <Text style={styles.dropdownItemDesc}>{sub.desc}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Consultation Dropdown Menu */}
                  {item.id === 'consultation' && isOpen && (
                    <View style={styles.dropdownMenu}>
                      {CONSULTATION_ITEMS.map((sub, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.dropdownItem}
                          onPress={() => handleNavigate(sub.route, sub.params)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={sub.icon} size={18} color="#00B894" style={{ marginRight: 10 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dropdownItemTitle}>{sub.label}</Text>
                            <Text style={styles.dropdownItemDesc}>{sub.desc}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* More Dropdown Menu */}
                  {item.id === 'more' && isOpen && (
                    <View style={[styles.dropdownMenu, { width: 230, right: 0, left: 'auto' }]}>
                      {MORE_ITEMS.map((sub, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.dropdownItemCompact}
                          onPress={() => handleNavigate(sub.route)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={sub.icon} size={16} color="#00B894" style={{ marginRight: 10 }} />
                          <Text style={styles.dropdownItemTitle}>{sub.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ============================================================
            RIGHT: LOCATION + SEARCH + LOGIN + SIGN UP
        ============================================================ */}
        <View style={styles.rightActionsRow}>
          {/* Location Selector (Mysuru ▾) */}
          <TouchableOpacity
            style={styles.locationSelectorBtn}
            onPress={() => setIsCityModalOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-sharp" size={15} color="#00C2CB" />
            <Text style={styles.locationCityText}>{selectedCity}</Text>
            <Ionicons name="chevron-down" size={12} color="#64748B" />
          </TouchableOpacity>

          {/* Search Icon */}
          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={() => setShowSearchModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={19} color="#1E3A8A" />
          </TouchableOpacity>

          {/* Cart Icon & Badge */}
          <TouchableOpacity
            style={[styles.headerCartBtn, totalCartCount > 0 && styles.headerCartBtnActive]}
            onPress={() => handleNavigate('Cart', { initialTab: 'pharmacy' })}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cart-outline"
              size={20}
              color={totalCartCount > 0 ? '#00B894' : '#1E3A8A'}
            />
            {totalCartCount > 0 && (
              <View style={styles.headerCartBadge}>
                <Text style={styles.headerCartBadgeText}>{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Auth Action Buttons */}
          {isLoggedIn ? (
            <TouchableOpacity
              style={styles.userProfilePill}
              onPress={() => handleNavigate('Profile')}
              activeOpacity={0.85}
            >
              {/* Unique Avatar with Live Verified Dot */}
              <View style={styles.userAvatarWrap}>
                <View style={styles.userAvatarCircle}>
                  <Text style={styles.userAvatarInitial}>
                    {(userName || 'U').trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userStatusDot} />
              </View>

              {/* User Name & Patient Verified Tag */}
              <View style={styles.userTextCol}>
                <Text style={styles.userProfileName} numberOfLines={1}>
                  {userName ? userName.trim().split(' ')[0] : 'My Account'}
                </Text>
                <View style={styles.userRoleTag}>
                  <Ionicons name="shield-checkmark" size={10} color="#00B894" />
                  <Text style={styles.userRoleText}>Verified</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.authButtonsRow}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => handleNavigate('Login')}
                activeOpacity={0.85}
              >
                <Text style={styles.loginBtnText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signUpBtn}
                onPress={() => handleNavigate('Register')}
                activeOpacity={0.88}
              >
                <Text style={styles.signUpBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ============================================================
          CONTINUOUS AUTO-SCROLLING ADS TICKER (ON SCREEN)
      ============================================================ */}
      <View style={styles.tickerRoot}>
        <View style={styles.tickerBadgeBox}>
          <View style={styles.tickerBadgePill}>
            <Ionicons name="sparkles" size={12} color="#FBBF24" />
            <Text style={styles.tickerBadgeTitle}>SPECIAL OFFERS</Text>
            <View style={styles.tickerLiveDot} />
          </View>
          <View style={styles.tickerDivider} />
        </View>

        <View style={styles.tickerContentWrap}>
          {Platform.OS === 'web' ? (
            <div className="scrolling-ads-wrapper">
              <div className="scrolling-ads-track">
                {[...SCROLLING_ADS, ...SCROLLING_ADS].map((ad, idx) => {
                  const bStyle = getBadgeStyle(ad.badge);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.tickerItem}
                      onPress={() => handleNavigate(ad.route)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.adBadgePill,
                          { backgroundColor: bStyle.bg, borderColor: bStyle.border },
                        ]}
                      >
                        <Ionicons
                          name={ad.icon}
                          size={11}
                          color={bStyle.iconColor}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.adBadgePillText, { color: bStyle.text }]}>
                          {ad.badge}
                        </Text>
                      </View>
                      <Text style={styles.tickerAdText}>{ad.text}</Text>
                      <Text style={styles.tickerSeparator}>•</Text>
                    </TouchableOpacity>
                  );
                })}
              </div>
            </div>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SCROLLING_ADS.map((ad, idx) => {
                const bStyle = getBadgeStyle(ad.badge);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.tickerItem}
                    onPress={() => handleNavigate(ad.route)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.adBadgePill,
                        { backgroundColor: bStyle.bg, borderColor: bStyle.border },
                      ]}
                    >
                      <Ionicons
                        name={ad.icon}
                        size={11}
                        color={bStyle.iconColor}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.adBadgePillText, { color: bStyle.text }]}>
                        {ad.badge}
                      </Text>
                    </View>
                    <Text style={styles.tickerAdText}>{ad.text}</Text>
                    <Text style={styles.tickerSeparator}>•</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>

      {/* ============================================================
          LOCATION MODAL
      ============================================================ */}
      <Modal
        visible={isCityModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCityModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCityModalOpen(false)}
        >
          <View style={styles.cityModalCard}>
            <View style={styles.cityModalHeader}>
              <Text style={styles.cityModalTitle}>Select Your City</Text>
              <TouchableOpacity onPress={() => setIsCityModalOpen(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.cityModalSub}>Services & home collection available across Karnataka</Text>
            <View style={styles.cityList}>
              {CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.cityItem, selectedCity === city && styles.cityItemActive]}
                  onPress={() => {
                    setSelectedCity(city);
                    setIsCityModalOpen(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="business-outline"
                    size={17}
                    color={selectedCity === city ? '#00A389' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.cityItemText,
                      selectedCity === city && styles.cityItemTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                  {selectedCity === city && (
                    <Ionicons name="checkmark-circle" size={17} color="#00A389" style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================
          SEARCH MODAL
      ============================================================ */}
      <Modal
        visible={showSearchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSearchModal(false)}
        >
          <View style={styles.searchModalCard}>
            <View style={styles.searchModalInputRow}>
              <Ionicons name="search" size={20} color="#64748B" />
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search doctors, lab tests, scans, medicines..."
                placeholderTextColor="#94A3B8"
                autoFocus
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => {
                  if (searchQuery.trim()) {
                    handleNavigate('GlobalSearch', { query: searchQuery.trim() });
                  }
                }}
              />
              <TouchableOpacity
                style={styles.searchModalSubmit}
                onPress={() => {
                  if (searchQuery.trim()) {
                    handleNavigate('GlobalSearch', { query: searchQuery.trim() });
                  }
                }}
              >
                <Text style={styles.searchModalSubmitText}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Suggestions */}
            <View style={styles.searchSuggestions}>
              <Text style={styles.suggestionsLabel}>Popular searches:</Text>
              <View style={styles.suggestionPills}>
                {['CBC Test', 'Thyroid Profile', 'Vitamin D', 'MRI Scan', 'CT Scan', 'Cardiologist'].map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionPill}
                    onPress={() => handleNavigate('GlobalSearch', { query: s })}
                  >
                    <Text style={styles.suggestionPillText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRoot: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 9999,
    width: '100%',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
      },
    }),
  },
  headerContainer: {
    width: '100%',
    maxWidth: 1360,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    height: 72,
    position: 'relative',
    zIndex: 1000,
  },

  // Brand Logo
  brandCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImg: {
    width: 36,
    height: 36,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    fontSize: 21,
    fontWeight: '900',
    color: '#00B894',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginTop: -1,
  },

  // Center Navigation Links
  navLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'relative',
    zIndex: 1001,
  },
  navItemWrapper: {
    position: 'relative',
    zIndex: 1002,
  },
  navLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    position: 'relative',
  },
  navLinkBtnActive: {
    // Active styling
  },
  navLinkText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  navLinkTextActive: {
    color: '#1E3A8A',
    fontWeight: '800',
  },
  chevronIcon: {
    marginLeft: 4,
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 2,
    left: 12,
    right: 12,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#00B894',
  },

  // Dropdown Popovers
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 20,
    zIndex: 99999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  dropdownItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  dropdownItemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Right Actions
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  locationSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  locationCityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  searchIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerCartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  headerCartBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B894',
  },
  headerCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Auth Buttons
  authButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loginBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    backgroundColor: '#FFFFFF',
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  signUpBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#00B894',
  },
  signUpBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#00B894',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
    cursor: 'pointer',
  },
  userAvatarWrap: {
    position: 'relative',
  },
  userAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  userAvatarInitial: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  userStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  userTextCol: {
    justifyContent: 'center',
    paddingRight: 2,
  },
  userProfileName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: 120,
    lineHeight: 15,
  },
  userRoleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  userRoleText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#00B894',
    letterSpacing: 0.3,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cityModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  cityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cityModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  cityModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  cityList: {
    gap: 8,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cityItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#00B894',
  },
  cityItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  cityItemTextActive: {
    color: '#00B894',
    fontWeight: '800',
  },

  // Search Modal
  searchModalCard: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 10,
  },
  searchModalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E3A8A',
    outlineStyle: 'none',
  },
  searchModalSubmit: {
    backgroundColor: '#00B894',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 7,
  },
  searchModalSubmitText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  searchSuggestions: {
    marginTop: 14,
  },
  suggestionsLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  suggestionPillText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },

  // SCROLLING ADS TICKER
  tickerRoot: {
    backgroundColor: '#F0F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    overflow: 'hidden',
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  tickerBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
    height: '100%',
    zIndex: 10,
    backgroundColor: '#F0F9FF',
  },
  tickerBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tickerBadgeTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  tickerLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7BC96F',
  },
  tickerDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
    marginLeft: 12,
  },
  tickerContentWrap: {
    flex: 1,
    overflow: 'hidden',
    height: '100%',
    justifyContent: 'center',
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
  },
  adBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    marginRight: 8,
  },
  adBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tickerAdText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  tickerSeparator: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 16,
    marginRight: 4,
  },
});

export default WebHeader;
