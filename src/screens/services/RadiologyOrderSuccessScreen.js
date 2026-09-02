import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const RadiologyOrderSuccessScreen = ({ route, navigation }) => {
  const { booking } = route.params || {};
  const {
    id: bookingId = 'RAD-894102',
    tokenNumber = 'TK-24',
    appointmentDate,
    appointmentSlot,
    lab,
    tests = [],
    patient,
    payment,
  } = booking || {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==================================================
          TOP HEADER
      ================================================== */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Booking Confirmed</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="close" size={22} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================================================
            SUCCESS HERO
        ================================================== */}
        <View style={styles.successHero}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Scan Appointment Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your slot has been reserved at the diagnostic center. A digital receipt has been generated.
          </Text>

          {/* TOKEN & BOOKING ID BANNER */}
          <View style={styles.tokenCard}>
            <View style={styles.tokenCol}>
              <Text style={styles.tokenLabel}>QUEUE TOKEN</Text>
              <Text style={styles.tokenValue}>{tokenNumber}</Text>
            </View>
            <View style={styles.tokenDivider} />
            <View style={styles.tokenCol}>
              <Text style={styles.tokenLabel}>BOOKING ID</Text>
              <Text style={styles.bookingIdValue}>{bookingId}</Text>
            </View>
          </View>
        </View>

        {/* ==================================================
            APPOINTMENT & LAB DETAILS
        ================================================== */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="calendar" size={18} color={colors.primary} />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Appointment Schedule</Text>
              <Text style={styles.detailValue}>
                {appointmentDate} • {appointmentSlot}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="business" size={18} color={colors.secondary} />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Diagnostic Center</Text>
              <Text style={styles.detailValue}>{lab?.name || 'Diagnostic Center'}</Text>
              <Text style={styles.detailSub}>{lab?.address}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="person" size={18} color={colors.coral} />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Patient Details</Text>
              <Text style={styles.detailValue}>
                {patient?.name} ({patient?.age} yrs, {patient?.gender})
              </Text>
              <Text style={styles.detailSub}>Phone: +91 {patient?.phone}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="card" size={18} color="#059669" />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Payment Status</Text>
              <Text style={[styles.detailValue, { color: '#059669' }]}>
                {payment?.status || 'Paid'} (₹{payment?.paidAmount})
              </Text>
              <Text style={styles.detailSub}>Via {payment?.method}</Text>
            </View>
          </View>
        </View>

        {/* ==================================================
            BOOKED SCANS LIST
        ================================================== */}
        <View style={styles.scansCard}>
          <Text style={styles.cardHeading}>Scheduled Scans & Tests ({tests.length})</Text>

          {tests.map((test, index) => (
            <View key={index} style={styles.scanItem}>
              <View style={styles.scanIconWrap}>
                <Ionicons name="scan-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.scanInfoCol}>
                <Text style={styles.scanName}>{test.name}</Text>
                <Text style={styles.scanMeta}>
                  {test.modalityCode} • {test.duration || '30 mins'} • Report: {test.reportTime || 'Within 4h'}
                </Text>
              </View>
              <Text style={styles.scanPrice}>₹{test.price}</Text>
            </View>
          ))}
        </View>

        {/* ==================================================
            IMPORTANT PRE-SCAN GUIDELINES
        ================================================== */}
        <View style={styles.guidelinesCard}>
          <View style={styles.guidelinesHeader}>
            <Ionicons name="information-circle" size={18} color="#D97706" />
            <Text style={styles.guidelinesTitle}>Important Pre-Scan Guidelines</Text>
          </View>

          <View style={styles.guidelineBulletRow}>
            <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
            <Text style={styles.guidelineText}>
              Arrive 15 minutes before your scheduled appointment time.
            </Text>
          </View>

          <View style={styles.guidelineBulletRow}>
            <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
            <Text style={styles.guidelineText}>
              Wear comfortable clothing without metal zippers, buttons, or metal snaps.
            </Text>
          </View>

          <View style={styles.guidelineBulletRow}>
            <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
            <Text style={styles.guidelineText}>
              Carry all your previous scan films, doctor prescription, and medical records.
            </Text>
          </View>

          <View style={styles.guidelineBulletRow}>
            <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
            <Text style={styles.guidelineText}>
              Digital report & high-resolution DICOM images will be delivered on your Unnathi OneCare app.
            </Text>
          </View>
        </View>

        {/* ==================================================
            CALL LAB & HELP DESK
        ================================================== */}
        {lab?.phone && (
          <TouchableOpacity
            style={styles.callLabCard}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(`tel:${lab.phone}`)}
          >
            <View style={styles.callLabIcon}>
              <Ionicons name="call" size={18} color={colors.primary} />
            </View>
            <View style={styles.callLabInfo}>
              <Text style={styles.callLabTitle}>Need assistance or direction help?</Text>
              <Text style={styles.callLabSub}>Call {lab.name} Helpdesk</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ==================================================
          BOTTOM ACTION BUTTONS
      ================================================== */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.viewBookingsButton}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Bookings')}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.secondary} />
          <Text style={styles.viewBookingsButtonText}>My Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
          <Ionicons name="home" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },

  // SUCCESS HERO
  successHero: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.secondary,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
    maxWidth: 290,
  },

  // TOKEN CARD
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tokenCol: {
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  tokenValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 2,
  },
  bookingIdValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 4,
  },
  tokenDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#CBD5E1',
  },

  // DETAILS CARD
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 2,
  },
  detailSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },

  // SCANS LIST CARD
  scansCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 10,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  scanIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  scanInfoCol: {
    flex: 1,
  },
  scanName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  scanMeta: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scanPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },

  // GUIDELINES
  guidelinesCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  guidelinesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  guidelineBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  guidelineText: {
    flex: 1,
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },

  // CALL LAB
  callLabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  callLabIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  callLabInfo: {
    flex: 1,
  },
  callLabTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  callLabSub: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },

  // BOTTOM BAR
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  viewBookingsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  viewBookingsButtonText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '800',
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default RadiologyOrderSuccessScreen;
