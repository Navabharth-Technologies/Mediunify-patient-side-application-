import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MEMBERSHIP_PLANS,
  MEMBERSHIP_COMPARISON_ROWS,
  MEMBERSHIP_FAQS,
} from '../../../data/membershipData';
import { showAlert } from '../../../utils/alert';

const MembershipScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const [selectedPlanId, setSelectedPlanId] = useState('gold');
  const [activeMembership, setActiveMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [userName, setUserName] = useState('Valued Patient');

  useEffect(() => {
    loadMembershipStatus();
  }, []);

  const loadMembershipStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem('@mediunify_membership');
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) setUserName(storedName.trim());

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.status === 'active') {
          setActiveMembership(parsed);
          setSelectedPlanId(parsed.tierId || 'gold');
        }
      }
    } catch (e) {
      console.log('Error loading membership:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePlan = async (plan) => {
    setProcessingPayment(true);
    setTimeout(async () => {
      try {
        const now = new Date();
        const durationMonths = plan.id === 'silver' ? 3 : 12;
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + durationMonths);

        const membershipData = {
          status: 'active',
          tierId: plan.id,
          tierName: plan.title,
          price: plan.price,
          activatedAt: now.toISOString(),
          expiresAt: expiry.toISOString(),
          membershipId: `MU-VIP-${Math.floor(100000 + Math.random() * 900000)}`,
          vouchers: plan.vouchers.map((v) => ({ ...v, redeemed: false })),
          savingsToDate: plan.id === 'silver' ? 450 : plan.id === 'gold' ? 1850 : 3400,
        };

        await AsyncStorage.setItem('@mediunify_membership', JSON.stringify(membershipData));
        setActiveMembership(membershipData);
        setShowSuccessModal(true);
      } catch (err) {
        showAlert('Error', 'Could not activate membership. Please try again.');
      } finally {
        setProcessingPayment(false);
      }
    }, 1200);
  };

  const handleRedeemVoucher = (voucher) => {
    if (voucher.title.toLowerCase().includes('consult')) {
      navigation.navigate('VideoConsultation');
    } else if (voucher.title.toLowerCase().includes('medicine')) {
      navigation.navigate('Pharmacy');
    } else {
      navigation.navigate('LabTests');
    }
  };

  const activePlanObj = MEMBERSHIP_PLANS.find((p) => p.id === selectedPlanId) || MEMBERSHIP_PLANS[1];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Loading MediUnify Care+ VIP...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>MediUnify Care+ VIP</Text>
          <Text style={styles.headerSub}>Loyalty & Healthcare Savings</Text>
        </View>
        <TouchableOpacity
          style={styles.headerHelpBtn}
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <Ionicons name="help-circle-outline" size={22} color="#E2E8F0" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && { maxWidth: 1080, alignSelf: 'center', width: '100%', paddingHorizontal: 20 },
        ]}
      >
        {/* ============================================================
            1. HERO BANNER
        ============================================================ */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.crownBadge}>
              <Ionicons name="ribbon" size={14} color="#D97706" />
              <Text style={styles.crownBadgeText}>OFFICIAL HEALTHCARE VIP</Text>
            </View>
            <Text style={styles.karnatakaBadge}>Across Karnataka</Text>
          </View>

          <Text style={styles.heroTitle}>
            Unlock Infinite Savings on Every Consult, Scan & Medicine
          </Text>
          <Text style={styles.heroDesc}>
            Join over 45,000+ patients saving up to ₹10,000 every year with MediUnify Care+ VIP Membership.
          </Text>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>Flat 15%</Text>
              <Text style={styles.metricSub}>Extra OFF</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>Free Doctors</Text>
              <Text style={styles.metricSub}>Video Calls</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>₹0 Delivery</Text>
              <Text style={styles.metricSub}>Doorstep 60m</Text>
            </View>
          </View>
        </View>

        {/* ============================================================
            2. ACTIVE MEMBERSHIP STATUS (IF ALREADY A MEMBER)
        ============================================================ */}
        {activeMembership && (
          <View style={styles.activeCard}>
            <View style={styles.activeCardHeader}>
              <View style={styles.activeCardLeft}>
                <View style={styles.activeCrownBox}>
                  <Ionicons name="ribbon" size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.activeTierTitle}>{activeMembership.tierName} Member</Text>
                  <Text style={styles.activeMemberId}>ID: {activeMembership.membershipId}</Text>
                </View>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.savingsCounterBox}>
              <Text style={styles.savingsCounterLabel}>Total Savings Accumulated</Text>
              <Text style={styles.savingsCounterValue}>
                ₹{activeMembership.savingsToDate?.toLocaleString('en-IN') || '1,850'}
              </Text>
              <Text style={styles.savingsCounterSub}>
                Valid until {new Date(activeMembership.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>

            {/* Member Free Vouchers */}
            <Text style={styles.vouchersSectionTitle}>Your Active Vouchers & Perks</Text>
            <View style={styles.vouchersList}>
              {(activeMembership.vouchers || []).map((v, i) => (
                <View key={i} style={styles.voucherCard}>
                  <View style={styles.voucherLeft}>
                    <Ionicons name="gift-outline" size={20} color="#00A389" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.voucherTitle}>{v.title}</Text>
                      <Text style={styles.voucherCode}>CODE: {v.code}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.redeemBtn}
                    onPress={() => handleRedeemVoucher(v)}
                  >
                    <Text style={styles.redeemBtnText}>Redeem</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================
            3. PLAN SELECTOR CARDS
        ============================================================ */}
        <Text style={styles.sectionHeading}>Choose Your Membership Plan</Text>
        <Text style={styles.sectionSub}>Select the plan that fits you or your whole family</Text>

        <View style={[styles.plansGrid, isDesktop && styles.plansGridDesktop]}>
          {MEMBERSHIP_PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                  isDesktop && { flex: 1 },
                ]}
                onPress={() => setSelectedPlanId(plan.id)}
                activeOpacity={0.88}
              >
                {/* Header Badge */}
                {plan.badge && (
                  <View style={[styles.planTopBadge, { backgroundColor: plan.badgeBg }]}>
                    <Text style={[styles.planTopBadgeText, { color: plan.badgeColor }]}>
                      {plan.badge}
                    </Text>
                  </View>
                )}

                <View style={styles.planCardHeader}>
                  <View>
                    <Text style={styles.planCardTitle}>{plan.title}</Text>
                    <Text style={styles.planCardDuration}>{plan.duration}</Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                </View>

                {/* Price Row */}
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPriceCurrency}>₹</Text>
                  <Text style={styles.planPriceNumber}>{plan.price}</Text>
                  <Text style={styles.planPriceOriginal}>₹{plan.originalPrice}</Text>
                </View>

                <Text style={styles.planSavingsTag}>{plan.savingsText}</Text>
                <Text style={styles.planTagline}>{plan.tagline}</Text>

                <View style={styles.planDivider} />

                {/* Perks Checklist */}
                <View style={styles.planPerksList}>
                  {plan.perks.map((perk, idx) => (
                    <View key={idx} style={styles.planPerkItem}>
                      <Ionicons name="checkmark-circle" size={17} color="#00A389" style={{ marginTop: 2 }} />
                      <Text style={styles.planPerkText}>{perk}</Text>
                    </View>
                  ))}
                </View>

                {/* Card CTA */}
                <TouchableOpacity
                  style={[
                    styles.planCardBtn,
                    isSelected ? { backgroundColor: plan.themeColor } : { backgroundColor: '#F1F5F9' },
                  ]}
                  onPress={() => handleActivatePlan(plan)}
                  disabled={processingPayment}
                >
                  <Text
                    style={[
                      styles.planCardBtnText,
                      isSelected ? { color: '#FFFFFF' } : { color: '#475569' },
                    ]}
                  >
                    {activeMembership?.tierId === plan.id
                      ? 'Current Active Plan'
                      : `Get ${plan.title} • ₹${plan.price}`}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ============================================================
            4. COMPARISON MATRIX TABLE
        ============================================================ */}
        <Text style={styles.sectionHeading}>Standard vs Care+ Member</Text>
        <Text style={styles.sectionSub}>See how much more you receive as a VIP member</Text>

        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Benefit</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Free</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center', color: '#D97706' }]}>Care+ VIP</Text>
          </View>

          {MEMBERSHIP_COMPARISON_ROWS.map((row, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 && { backgroundColor: '#F8FAFC' }]}>
              <Text style={[styles.tableCellFeature, { flex: 2 }]}>{row.feature}</Text>
              <Text style={[styles.tableCellFree, { flex: 1, textAlign: 'center' }]}>{row.free}</Text>
              <Text style={[styles.tableCellVip, { flex: 1.2, textAlign: 'center' }]}>
                {selectedPlanId === 'platinum' ? row.platinum : selectedPlanId === 'silver' ? row.silver : row.gold}
              </Text>
            </View>
          ))}
        </View>

        {/* ============================================================
            5. FREQUENTLY ASKED QUESTIONS
        ============================================================ */}
        <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
        <View style={styles.faqsCard}>
          {MEMBERSHIP_FAQS.map((faq, i) => {
            const isOpen = expandedFaq === i;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.faqItem, i === MEMBERSHIP_FAQS.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => setExpandedFaq(isOpen ? null : i)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748B"
                  />
                </View>
                {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ============================================================
          BOTTOM ACTION BAR (MOBILE VIEW)
      ============================================================ */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarLeft}>
          <Text style={styles.bottomBarPlan}>{activePlanObj.title}</Text>
          <View style={styles.bottomBarPriceRow}>
            <Text style={styles.bottomBarPrice}>₹{activePlanObj.price}</Text>
            <Text style={styles.bottomBarDuration}>/ {activePlanObj.duration}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => handleActivatePlan(activePlanObj)}
          disabled={processingPayment}
          activeOpacity={0.88}
        >
          {processingPayment ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="flash" size={17} color="#FFFFFF" />
              <Text style={styles.bottomBarBtnText}>
                {activeMembership?.tierId === activePlanObj.id ? 'Active Plan' : 'Join Care+ VIP'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ============================================================
          CELEBRATION SUCCESS MODAL
      ============================================================ */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="ribbon" size={38} color="#D97706" />
            </View>

            <Text style={styles.modalTitle}>Welcome to MediUnify Care+ VIP!</Text>
            <Text style={styles.modalSub}>
              Congratulations {userName}, your {activeMembership?.tierName} membership is now active.
            </Text>

            <View style={styles.modalPerksBox}>
              <Text style={styles.modalPerksTitle}>Instant Benefits Unlocked:</Text>
              <Text style={styles.modalPerksItem}>✓ Extra discounts applied across all carts</Text>
              <Text style={styles.modalPerksItem}>✓ Free Doctor Consultation vouchers credited</Text>
              <Text style={styles.modalPerksItem}>✓ ₹0 Delivery fee enabled on all medicines</Text>
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalDoneBtnText}>Start Exploring Benefits</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  headerHelpBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 90,
  },

  // Hero Banner
  heroBanner: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  crownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  crownBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.4,
  },
  karnatakaBadge: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 18,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FBBF24',
  },
  metricSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },

  // Active Membership Card
  activeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -14,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 20,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  activeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeCrownBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTierTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  activeMemberId: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#15803D',
  },
  savingsCounterBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  savingsCounterLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  savingsCounterValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#B45309',
    marginTop: 2,
  },
  savingsCounterSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  vouchersSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  vouchersList: {
    gap: 8,
  },
  voucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  voucherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voucherTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  voucherCode: {
    fontSize: 10,
    color: '#00A389',
    fontWeight: '800',
    marginTop: 1,
  },
  redeemBtn: {
    backgroundColor: '#00A389',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  redeemBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Section Headers
  sectionHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginHorizontal: 16,
    marginTop: 24,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 14,
  },

  // Plans Grid
  plansGrid: {
    paddingHorizontal: 16,
    gap: 14,
  },
  plansGridDesktop: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  planCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
  },
  planTopBadge: {
    position: 'absolute',
    top: -11,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  planTopBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  planCardDuration: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#D97706',
  },
  radioInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D97706',
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 4,
  },
  planPriceCurrency: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  planPriceNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
  },
  planPriceOriginal: {
    fontSize: 14,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginLeft: 6,
    fontWeight: '600',
  },
  planSavingsTag: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  planTagline: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 4,
  },
  planDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  planPerksList: {
    gap: 8,
    marginBottom: 16,
  },
  planPerkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  planPerkText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    flex: 1,
  },
  planCardBtn: {
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCardBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Comparison Table
  tableCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCellFeature: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  tableCellFree: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  tableCellVip: {
    fontSize: 11.5,
    color: '#D97706',
    fontWeight: '800',
  },

  // FAQs Card
  faqsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 8,
  },

  // Bottom Action Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomBarLeft: {},
  bottomBarPlan: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomBarPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  bottomBarPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  bottomBarDuration: {
    fontSize: 11,
    color: '#64748B',
  },
  bottomBarBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 14,
  },
  bottomBarBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  modalPerksBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalPerksTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalPerksItem: {
    fontSize: 11.5,
    color: '#15803D',
    fontWeight: '700',
    lineHeight: 18,
  },
  modalDoneBtn: {
    width: '100%',
    backgroundColor: '#00A389',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default MembershipScreen;
