import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const OUR_SERVICES = [
  { label: 'Lab Tests', route: 'LabTests' },
  { label: 'Radiology', route: 'Imaging' },
  { label: 'Consultation', route: 'VideoConsultation' },
  { label: 'Pharmacy', route: 'Pharmacy' },
  { label: 'Hospital & Surgery', route: 'HospitalCare' },
  { label: 'Health Insurance', route: 'HealthInsurance' },
  { label: 'Ayurveda & Wellness', route: 'AyurvedaWellness' },
  { label: 'Fertility & IVF Care', route: 'FertilityIvf' },
  { label: 'Equipment Rental', route: 'EquipmentRental' },
  { label: 'Emergency', route: 'Emergency' },
];

const SUPPORT_LINKS = [
  { label: 'Help Center', route: 'HelpSupport' },
  { label: 'FAQs', route: 'HelpSupport' },
  { label: 'Contact Us', route: 'HelpSupport' },
  { label: 'For Providers', route: 'HelpSupport' },
  { label: 'For Corporates', route: 'HelpSupport' },
  { label: 'Terms of Service', route: 'HelpSupport' },
  { label: 'Privacy Policy', route: 'HelpSupport' },
  { label: 'Refund Policy', route: 'HelpSupport' },
];

const WebFooter = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (!isDesktop) {
    return null;
  }

  const handleNavigate = (route) => {
    if (navigation?.navigate) {
      navigation.navigate('MainApp', { screen: route });
    }
  };

  const handleSubscribe = () => {
    if (emailInput.trim().includes('@')) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const scrollToTop = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <View style={styles.footerWrapper}>
      <View style={styles.footerContainer}>
        {/* ============================================================
            MAIN 5-COLUMN ROW
        ============================================================ */}
        <View style={styles.colsRow}>
          {/* Column 1: MediUnify Brand Info & Socials */}
          <View style={[styles.footerCol, { flex: 1.4 }]}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
              <View>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.brandTitle}>Medi</Text>
                  <Text style={styles.brandTitleAccent}>Unify</Text>
                </View>
                <Text style={styles.brandTagline}>
                  All your healthcare. One intelligent platform.
                </Text>
              </View>
            </View>

            <Text style={styles.brandDesc}>
              MediUnify brings together lab tests, consultation, pharmacy, hospital care, insurance and more — to make quality healthcare simple, accessible and intelligent for everyone.
            </Text>

            {/* Social Icons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={[styles.socialIconBtn, { backgroundColor: '#0077B5' }]}>
                <Ionicons name="logo-linkedin" size={15} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialIconBtn, { backgroundColor: '#E4405F' }]}>
                <Ionicons name="logo-instagram" size={15} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialIconBtn, { backgroundColor: '#1877F2' }]}>
                <Ionicons name="logo-facebook" size={15} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialIconBtn, { backgroundColor: '#FF0000' }]}>
                <Ionicons name="logo-youtube" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Column 2: Our Services */}
          <View style={styles.footerCol}>
            <Text style={styles.colHeading}>Our Services</Text>
            {OUR_SERVICES.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.footerLinkItem}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLinkText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Column 3: Support */}
          <View style={styles.footerCol}>
            <Text style={styles.colHeading}>Support</Text>
            {SUPPORT_LINKS.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.footerLinkItem}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
              >
                <Text style={styles.footerLinkText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Column 4: Download App */}
          <View style={styles.footerCol}>
            <Text style={styles.colHeading}>Download App</Text>
            <TouchableOpacity style={styles.storeBadge} activeOpacity={0.85}>
              <Ionicons name="logo-google-playstore" size={20} color="#FFFFFF" />
              <View>
                <Text style={styles.storeBadgeSmall}>GET IT ON</Text>
                <Text style={styles.storeBadgeLarge}>Google Play</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.storeBadge, { marginTop: 10 }]} activeOpacity={0.85}>
              <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
              <View>
                <Text style={styles.storeBadgeSmall}>Download on the</Text>
                <Text style={styles.storeBadgeLarge}>App Store</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Column 5: Subscribe to our newsletter */}
          <View style={[styles.footerCol, { flex: 1.2 }]}>
            <Text style={styles.colHeading}>Subscribe to our newsletter</Text>
            <Text style={styles.newsletterSub}>
              Get health tips, offers and updates.
            </Text>

            <View style={styles.subscribeInputRow}>
              <TextInput
                style={styles.newsletterInput}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.subscribeBtn}
                onPress={handleSubscribe}
                activeOpacity={0.88}
              >
                <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {subscribed && (
              <Text style={styles.subscribedSuccess}>
                ✓ Thank you for subscribing!
              </Text>
            )}
          </View>
        </View>

        {/* ============================================================
            BOTTOM STRIP: COPYRIGHT & SCROLL TO TOP
        ============================================================ */}
        <View style={styles.bottomStrip}>
          <Text style={styles.copyrightText}>
            © 2025 MediUnify. All rights reserved.
          </Text>

          <Text style={styles.madeWithText}>
            Made with <Text style={{ color: '#EF4444' }}>❤️</Text> for a healthier tomorrow.
          </Text>

          <TouchableOpacity
            style={styles.scrollTopBtn}
            onPress={scrollToTop}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    width: '100%',
    paddingTop: 54,
    paddingBottom: 30,
  },
  footerContainer: {
    width: '100%',
    maxWidth: 1360,
    alignSelf: 'center',
    paddingHorizontal: 28,
  },
  colsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
    justifyContent: 'space-between',
    marginBottom: 44,
  },
  footerCol: {
    flex: 1,
    minWidth: 160,
  },

  // Brand Info
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  logoImg: {
    width: 34,
    height: 34,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  brandTitleAccent: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00B894',
  },
  brandTagline: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: -1,
  },
  brandDesc: {
    fontSize: 12.5,
    lineHeight: 19,
    color: '#64748B',
    marginBottom: 18,
    maxWidth: 320,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  socialIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Headings & Links
  colHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  footerLinkItem: {
    paddingVertical: 5.5,
  },
  footerLinkText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  // Download Badges
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 10,
    maxWidth: 170,
  },
  storeBadgeSmall: {
    fontSize: 9,
    color: '#E2E8F0',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  storeBadgeLarge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Newsletter
  newsletterSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
  },
  subscribeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    height: 44,
  },
  newsletterInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E3A8A',
    outlineStyle: 'none',
  },
  subscribeBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribedSuccess: {
    fontSize: 12,
    color: '#00B894',
    fontWeight: '700',
    marginTop: 8,
  },

  // Bottom Strip
  bottomStrip: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
  },
  copyrightText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  madeWithText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  scrollTopBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WebFooter;
