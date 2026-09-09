import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const WebFooter = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  if (!isDesktop) {
    return null; // Footer shown on desktop / tablet web views
  }

  const handleNavigate = (route) => {
    if (navigation?.navigate) {
      navigation.navigate('MainApp', { screen: route });
    }
  };

  return (
    <View style={styles.footerContainer}>
      <View style={styles.footerInner}>
        {/* Column 1: Brand & Emergency Hotline */}
        <View style={styles.footerColMain}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.footerLogoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>
              MEDI<Text style={{ color: '#00B894' }}>UNIFY</Text>
            </Text>
          </View>
          <Text style={styles.brandDescription}>
            Integrated multi-specialty healthcare platform providing hospital consultations, accredited diagnostic pathology, advanced radiology scanning, and prompt doorstep pharmacy delivery across Karnataka.
          </Text>

          <View style={styles.emergencyCard}>
            <Ionicons name="call" size={16} color="#EF4444" />
            <View>
              <Text style={styles.emergencyLabel}>24/7 Medical Emergency Response</Text>
              <Text style={styles.emergencyPhone}>1800-425-0099 / 108</Text>
            </View>
          </View>
        </View>

        {/* Column 2: Clinical Specialties */}
        <View style={styles.footerCol}>
          <Text style={styles.colTitle}>Specialties</Text>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('DoctorList')}>
            <Text style={styles.footerLinkText}>General Physician</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('DoctorList')}>
            <Text style={styles.footerLinkText}>Cardiology & Heart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('DoctorList')}>
            <Text style={styles.footerLinkText}>Dermatology & Skin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('DoctorList')}>
            <Text style={styles.footerLinkText}>Pediatrics & Child Care</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('DoctorList')}>
            <Text style={styles.footerLinkText}>Orthopedics & Joints</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('VideoBooking')}>
            <Text style={styles.footerLinkText}>Telehealth Video Call</Text>
          </TouchableOpacity>
        </View>

        {/* Column 3: Diagnostics & Pharmacy */}
        <View style={styles.footerCol}>
          <Text style={styles.colTitle}>Diagnostics & Meds</Text>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('LabTests')}>
            <Text style={styles.footerLinkText}>Full Body Health Checks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('LabTests')}>
            <Text style={styles.footerLinkText}>Home Blood Sample Pickup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('Imaging')}>
            <Text style={styles.footerLinkText}>MRI 3T & CT Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('Imaging')}>
            <Text style={styles.footerLinkText}>Ultrasound & Digital X-Ray</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('Pharmacy')}>
            <Text style={styles.footerLinkText}>Express Pharmacy 60-Mins</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink} onPress={() => handleNavigate('NurseBooking')}>
            <Text style={styles.footerLinkText}>Home Nursing Attendants</Text>
          </TouchableOpacity>
        </View>

        {/* Column 4: Quality & Trust Badges */}
        <View style={styles.footerCol}>
          <Text style={styles.colTitle}>Accredited Quality</Text>
          <View style={styles.trustItem}>
            <Ionicons name="ribbon-outline" size={16} color="#10B981" />
            <Text style={styles.trustItemText}>NABH Accredited Clinic Network</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="checkmark-done-circle-outline" size={16} color="#38BDF8" />
            <Text style={styles.trustItemText}>NABL Certified Diagnostic Labs</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed-outline" size={16} color="#F59E0B" />
            <Text style={styles.trustItemText}>100% Genuine Pharmacy Products</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="shield-outline" size={16} color="#8B5CF6" />
            <Text style={styles.trustItemText}>ISO 27001 Encrypted Health Data</Text>
          </View>
        </View>
      </View>

      {/* Bottom Copyright Bar */}
      <View style={styles.copyrightBar}>
        <View style={styles.copyrightInner}>
          <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} Mediunify Healthcare Platform. All rights reserved. Registered Medical Telehealth Provider.
          </Text>
          <View style={styles.legalLinks}>
            <Text style={styles.legalText}>Privacy Policy</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.legalText}>Terms of Service</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.legalText}>Patient Bill of Rights</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    marginTop: 40,
  },
  footerInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 30,
  },
  footerColMain: {
    flex: 1.4,
    minWidth: 280,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  footerLogoImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 19,
    marginBottom: 20,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emergencyLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  emergencyPhone: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F87171',
  },
  footerCol: {
    flex: 1,
    minWidth: 180,
  },
  colTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  footerLink: {
    paddingVertical: 6,
  },
  footerLinkText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  trustItemText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  copyrightBar: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#0A0F1D',
  },
  copyrightInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  copyrightText: {
    fontSize: 11,
    color: '#64748B',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legalText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  dot: {
    color: '#475569',
    fontSize: 10,
  },
});

export default WebFooter;
