import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../../theme/colors';
import {
  insurancePlans,
  insuranceCategories,
  insuranceHelpline,
} from '../../../data/healthInsuranceData';

const HealthInsuranceScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');

  // Call Enquiry Modal
  const [callbackModalVisible, setCallbackModalVisible] = useState(false);
  const [enquiryName, setEnquiryName] = useState('Ramesh Kumar');
  const [enquiryPhone, setEnquiryPhone] = useState('+91 98450 12345');
  const [enquiryType, setEnquiryType] = useState('Family Floater Plan');

  // Buy Policy Modal
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedPlanForBuy, setSelectedPlanForBuy] = useState(null);
  const [coveredMembers, setCoveredMembers] = useState(['Self', 'Spouse', 'Children']);
  const [selectedSumInsured, setSelectedSumInsured] = useState('₹10 Lakh');
  const [paymentTenure, setPaymentTenure] = useState('Annual'); // 'Monthly' | 'Annual'

  // Success Modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [issuedPolicy, setIssuedPolicy] = useState(null);

  const filteredPlans = useMemo(() => {
    return insurancePlans.filter((plan) => {
      const query = search.toLowerCase();
      const matchesSearch =
        plan.name.toLowerCase().includes(query) ||
        plan.insurer.toLowerCase().includes(query) ||
        plan.categoryLabel.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (selectedCategory !== 'all' && plan.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [search, selectedCategory]);

  const handleCallAdvisor = () => {
    const phone = insuranceHelpline.directPhone.replace(/\s+/g, '');
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Phone Dialing', `Please call the Insurance Desk directly at ${insuranceHelpline.directPhone}`);
    });
  };

  const handleWhatsAppEnquiry = () => {
    const url = `whatsapp://send?phone=+919876543210&text=${encodeURIComponent(
      'Hi MediUnify Healthcare Insurance Desk! I would like to get a quote and enquiry for Health Insurance plans.'
    )}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp', 'Could not open WhatsApp. Please call our toll-free number.');
    });
  };

  const handleSubmitCallback = () => {
    if (!enquiryName.trim() || !enquiryPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter your name and phone number.');
      return;
    }
    setCallbackModalVisible(false);
    Alert.alert(
      'Callback Scheduled! 📞',
      `Our certified IRDAI health insurance specialist will call you at ${enquiryPhone} within 15 minutes.`
    );
  };

  const openBuyModal = (plan) => {
    setSelectedPlanForBuy(plan);
    setBuyModalVisible(true);
  };

  const toggleMember = (member) => {
    if (coveredMembers.includes(member)) {
      if (coveredMembers.length === 1) {
        Alert.alert('Member Selection', 'At least 1 member must be covered under the policy.');
        return;
      }
      setCoveredMembers(coveredMembers.filter((m) => m !== member));
    } else {
      setCoveredMembers([...coveredMembers, member]);
    }
  };

  // DYNAMIC PRICING CALCULATOR FUNCTION
  const getDynamicPlanPrice = (plan, members = coveredMembers, sum = selectedSumInsured, isMonthly = (paymentTenure === 'Monthly')) => {
    if (!plan) return { annual: 7499, monthly: 649, displayPrice: '₹649/mo' };

    const baseYearly =
      parseInt((plan.pricePerYear || '7499').replace(/[^0-9]/g, ''), 10) || 7499;

    let memberFactor = 0;
    members.forEach((m) => {
      if (m === 'Self') memberFactor += 1.0;
      else if (m === 'Spouse') memberFactor += 0.55;
      else if (m === 'Children') memberFactor += 0.35;
      else if (m === 'Father') memberFactor += 0.85;
      else if (m === 'Mother') memberFactor += 0.85;
      else memberFactor += 0.5;
    });
    if (memberFactor <= 0) memberFactor = 1.0;

    let sumFactor = 1.0;
    if (sum.includes('5 Lakh') || sum.includes('₹5 Lakh')) {
      sumFactor = 0.75;
    } else if (sum.includes('10 Lakh') || sum.includes('₹10 Lakh')) {
      sumFactor = 1.0;
    } else if (sum.includes('25 Lakh') || sum.includes('₹25 Lakh')) {
      sumFactor = 1.55;
    } else if (sum.includes('50 Lakh') || sum.includes('₹50 Lakh')) {
      sumFactor = 2.1;
    }

    const calculatedAnnual = Math.round(baseYearly * memberFactor * sumFactor);
    const calculatedMonthly = Math.round((calculatedAnnual * 1.1) / 12);
    const gstAmount = Math.round(calculatedAnnual * 0.18);

    return {
      annual: calculatedAnnual,
      monthly: calculatedMonthly,
      gst: gstAmount,
      annualFormatted: `₹${calculatedAnnual.toLocaleString('en-IN')}`,
      monthlyFormatted: `₹${calculatedMonthly.toLocaleString('en-IN')}`,
      displayPrice: isMonthly
        ? `₹${calculatedMonthly.toLocaleString('en-IN')}/mo`
        : `₹${calculatedAnnual.toLocaleString('en-IN')}/yr`,
      memberCount: members.length,
    };
  };

  // DYNAMIC LIVE PREMIUM CALCULATION FOR MODAL
  const calculatedPremium = useMemo(() => {
    if (!selectedPlanForBuy) {
      return {
        annual: 7499,
        monthly: 649,
        gst: 1143,
        finalPayable: 7499,
        finalPayableFormatted: '₹7,499',
        annualFormatted: '₹7,499',
        monthlyFormatted: '₹649',
        memberCount: 1,
        breakdownText: '1 Member • ₹10 Lakh',
      };
    }

    const priceInfo = getDynamicPlanPrice(selectedPlanForBuy, coveredMembers, selectedSumInsured, paymentTenure === 'Monthly');
    const isAnnual = paymentTenure === 'Annual';
    const finalPayable = isAnnual ? priceInfo.annual : priceInfo.monthly;

    return {
      annual: priceInfo.annual,
      monthly: priceInfo.monthly,
      gst: priceInfo.gst,
      finalPayable,
      finalPayableFormatted: `₹${finalPayable.toLocaleString('en-IN')}`,
      annualFormatted: priceInfo.annualFormatted,
      monthlyFormatted: priceInfo.monthlyFormatted,
      memberCount: coveredMembers.length,
      breakdownText: `${coveredMembers.length} ${
        coveredMembers.length === 1 ? 'Member' : 'Members'
      } (${coveredMembers.join(', ')}) • ${selectedSumInsured}`,
    };
  }, [selectedPlanForBuy, coveredMembers, selectedSumInsured, paymentTenure]);

  const handleCompletePurchase = async () => {
    try {
      const policyId = `POL-MEDI-${Math.floor(100000 + Math.random() * 900000)}`;
      const policyObj = {
        id: policyId,
        policyNumber: policyId,
        planName: selectedPlanForBuy?.name || 'Comprehensive Health Shield',
        insurer: selectedPlanForBuy?.insurer || 'Star Health',
        holderName: enquiryName,
        coveredMembers,
        sumInsured: selectedSumInsured,
        premiumPaid: `${calculatedPremium.finalPayableFormatted} / ${paymentTenure.toLowerCase()}`,
        tenure: paymentTenure,
        issuedDate: new Date().toLocaleDateString('en-IN'),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
        status: 'Active (Instant Cashless Enabled)',
      };

      const existingPolicies = await AsyncStorage.getItem('@unnathi_insurance_policies');
      const policiesList = existingPolicies ? JSON.parse(existingPolicies) : [];
      policiesList.unshift(policyObj);
      await AsyncStorage.setItem('@unnathi_insurance_policies', JSON.stringify(policiesList));

      setBuyModalVisible(false);
      setIssuedPolicy(policyObj);
      setSuccessModalVisible(true);
    } catch (e) {
      console.log('Error saving policy:', e);
      Alert.alert('Purchase Error', 'Could not complete policy registration. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==================================================
          HEADER
      ================================================== */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Health Insurance & Mediclaim</Text>
          <Text style={styles.headerSubtitle}>
            100% Cashless at Top Hospitals & Instant Policy
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerCallBtn}
          activeOpacity={0.8}
          onPress={handleCallAdvisor}
        >
          <Ionicons name="call" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================================================
            24/7 ENQUIRY & CALL HELPLINE CARD
        ================================================== */}
        <View style={styles.helplineCard}>
          <View style={styles.helplineHeaderRow}>
            <View style={styles.helplineIconBox}>
              <Ionicons name="headset" size={22} color={colors.primary} />
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.helplineTitle}>Have Questions? Talk to an Expert</Text>
              <Text style={styles.helplineSub}>
                Free 1-on-1 policy guidance from IRDAI certified advisors
              </Text>
            </View>
          </View>

          {/* DUAL CALL & CALLBACK BUTTONS */}
          <View style={styles.helplineActionsRow}>
            <TouchableOpacity
              style={styles.callNowBtn}
              activeOpacity={0.88}
              onPress={handleCallAdvisor}
            >
              <Ionicons name="call" size={15} color="#FFFFFF" />
              <Text style={styles.callNowBtnText}>Call Advisor (Free)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.requestCallbackBtn}
              activeOpacity={0.85}
              onPress={() => setCallbackModalVisible(true)}
            >
              <Ionicons name="chatbubbles-outline" size={15} color={colors.secondary} />
              <Text style={styles.requestCallbackBtnText}>Request Callback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================================
            KEY BENEFITS 4-ITEM PILL BAR
        ================================================== */}
        <View style={styles.benefitsGrid}>
          <View style={styles.benefitItem}>
            <Ionicons name="business" size={16} color={colors.primary} />
            <Text style={styles.benefitText}>10,000+ Cashless Hospitals</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="flash" size={16} color="#059669" />
            <Text style={styles.benefitText}>20-Min Claim Approval</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="receipt" size={16} color={colors.secondary} />
            <Text style={styles.benefitText}>Save ₹75,000 in Tax (80D)</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="medkit" size={16} color={colors.coral} />
            <Text style={styles.benefitText}>Pre & Post Care Covered</Text>
          </View>
        </View>

        {/* ==================================================
            SEARCH BAR
        ================================================== */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search health insurance plans, insurers..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ==================================================
            QUICK FAMILY MEMBERS SELECTOR (REAL-TIME PRICE RECALCULATOR)
        ================================================== */}
        <View style={styles.quickMemberCard}>
          <View style={styles.quickMemberHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="people" size={16} color={colors.secondary} />
              <Text style={styles.quickMemberTitle}>Select Members to Cover:</Text>
            </View>
            <View style={styles.memberCountTag}>
              <Text style={styles.memberCountTagText}>
                {coveredMembers.length} {coveredMembers.length === 1 ? 'Person' : 'People'} Covered
              </Text>
            </View>
          </View>

          <View style={styles.quickMemberPillsWrap}>
            {[
              { label: 'Self', sub: 'Base' },
              { label: 'Spouse', sub: '+Adult' },
              { label: 'Children', sub: '+Kid' },
              { label: 'Father', sub: '+Senior' },
              { label: 'Mother', sub: '+Senior' },
            ].map((item) => {
              const isSelected = coveredMembers.includes(item.label);
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.quickMemberPill,
                    isSelected && styles.quickMemberPillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => toggleMember(item.label)}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={15}
                    color={isSelected ? colors.white : colors.slate}
                  />
                  <Text
                    style={[
                      styles.quickMemberPillText,
                      isSelected && styles.quickMemberPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.quickMemberPillSub,
                      isSelected && styles.quickMemberPillSubActive,
                    ]}
                  >
                    ({item.sub})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ==================================================
            CATEGORY SELECTOR PILLS
        ================================================== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {insuranceCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ==================================================
            INSURANCE PLANS LIST
        ================================================== */}
        <View style={styles.plansSection}>
          <Text style={styles.plansSectionHeader}>
            Available Health Insurance Plans ({filteredPlans.length})
          </Text>

          {filteredPlans.map((plan) => {
            const planPricing = getDynamicPlanPrice(plan, coveredMembers, selectedSumInsured, false);
            return (
              <View key={plan.id} style={styles.planCard}>
                {/* TOP ROW: BADGE & CLAIM RATIO */}
                <View style={styles.planTopRow}>
                  <View style={styles.badgeTag}>
                    <Text style={styles.badgeTagText}>{plan.badge}</Text>
                  </View>
                  <View style={styles.claimRatioTag}>
                    <Ionicons name="shield-checkmark" size={12} color="#059669" />
                    <Text style={styles.claimRatioText}>{plan.claimRatio}</Text>
                  </View>
                </View>

                {/* PLAN NAME & INSURER */}
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.insurerName}>By {plan.insurer}</Text>

                {/* COVER & DYNAMIC PRICING BOX */}
                <View style={styles.pricingBox}>
                  <View style={styles.pricingCol}>
                    <Text style={styles.pricingLabel}>Sum Insured Cover</Text>
                    <Text style={styles.sumInsuredVal}>{plan.sumInsured}</Text>
                  </View>
                  <View style={styles.pricingDivider} />
                  <View style={styles.pricingCol}>
                    <Text style={styles.pricingLabel}>
                      Premium for {coveredMembers.length} {coveredMembers.length === 1 ? 'Person' : 'People'}
                    </Text>
                    <Text style={styles.priceVal}>
                      {planPricing.monthlyFormatted}
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.slate }}>
                        /mo
                      </Text>
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>
                      ({planPricing.annualFormatted}/yr)
                    </Text>
                  </View>
                </View>

                {/* CASHLESS HOSPITALS PILL */}
                <View style={styles.hospitalsCountBox}>
                  <Ionicons name="checkmark-circle" size={13} color="#059669" />
                  <Text style={styles.hospitalsCountText}>{plan.hospitalsCount}</Text>
                </View>

                {/* KEY FEATURES CHECKLIST */}
                <View style={styles.featuresBox}>
                  {plan.keyFeatures.map((feat, i) => (
                    <View key={i} style={styles.featureItem}>
                      <Ionicons name="checkmark" size={14} color={colors.primary} />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* TAX SAVING TAG */}
                <View style={styles.taxBenefitBox}>
                  <Ionicons name="gift-outline" size={13} color={colors.secondary} />
                  <Text style={styles.taxBenefitText}>{plan.taxBenefit}</Text>
                </View>

                {/* DUAL ACTION BUTTONS (BUY ONLINE / CALL ENQUIRY) */}
                <View style={styles.planActionsRow}>
                  <TouchableOpacity
                    style={styles.planCallBtn}
                    activeOpacity={0.8}
                    onPress={handleCallAdvisor}
                  >
                    <Ionicons name="call" size={14} color={colors.secondary} />
                    <Text style={styles.planCallBtnText}>Enquire</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.planBuyBtn}
                    activeOpacity={0.88}
                    onPress={() => openBuyModal(plan)}
                  >
                    <Text style={styles.planBuyBtnText}>
                      Buy Plan ({planPricing.annualFormatted})
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ==================================================
          REQUEST CALLBACK MODAL
      ================================================== */}
      <Modal
        visible={callbackModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCallbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Request Free Callback</Text>
                <Text style={styles.modalSub}>
                  Our insurance team will call you with customized quotes
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCallbackModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Your Full Name</Text>
            <TextInput
              style={styles.input}
              value={enquiryName}
              onChangeText={setEnquiryName}
              placeholder="Enter full name"
            />

            <Text style={styles.inputLabel}>Mobile Phone Number</Text>
            <TextInput
              style={styles.input}
              value={enquiryPhone}
              onChangeText={setEnquiryPhone}
              keyboardType="phone-pad"
              placeholder="Contact number for callback"
            />

            <Text style={styles.inputLabel}>Plan Type of Interest</Text>
            <View style={styles.enquiryOptionsWrap}>
              {['Family Floater', 'Senior Parents', 'Individual Cover', 'Top-Up'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.enquiryPill,
                    enquiryType.includes(t) && styles.enquiryPillActive,
                  ]}
                  onPress={() => setEnquiryType(t)}
                >
                  <Text
                    style={[
                      styles.enquiryPillText,
                      enquiryType.includes(t) && styles.enquiryPillTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              activeOpacity={0.88}
              onPress={handleSubmitCallback}
            >
              <Text style={styles.modalSubmitBtnText}>Call Me Back in 15 Mins</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappBtn}
              activeOpacity={0.8}
              onPress={handleWhatsAppEnquiry}
            >
              <Ionicons name="logo-whatsapp" size={17} color="#059669" />
              <Text style={styles.whatsappBtnText}>Or Chat on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================
          BUY POLICY PROPOSAL MODAL
      ================================================== */}
      <Modal
        visible={buyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBuyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Instant Policy Issuance</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {selectedPlanForBuy?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setBuyModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* MEMBERS SELECTION WITH PRICE DELTAS */}
              <Text style={styles.inputLabel}>Select Members to Cover:</Text>
              <View style={styles.membersChoiceRow}>
                {[
                  { label: 'Self', delta: 'Base' },
                  { label: 'Spouse', delta: '+55%' },
                  { label: 'Children', delta: '+35%' },
                  { label: 'Father', delta: '+85%' },
                  { label: 'Mother', delta: '+85%' },
                ].map((item) => {
                  const isIncluded = coveredMembers.includes(item.label);
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.memberChoicePill,
                        isIncluded && styles.memberChoicePillActive,
                      ]}
                      onPress={() => toggleMember(item.label)}
                    >
                      <Ionicons
                        name={isIncluded ? 'checkbox' : 'square-outline'}
                        size={15}
                        color={isIncluded ? colors.primary : colors.slate}
                      />
                      <Text
                        style={[
                          styles.memberChoiceText,
                          isIncluded && styles.memberChoiceTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.memberDeltaTag,
                          isIncluded && styles.memberDeltaTagActive,
                        ]}
                      >
                        ({item.delta})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SUM INSURED CHOICE */}
              <Text style={styles.inputLabel}>Choose Sum Insured Cover:</Text>
              <View style={styles.sumInsuredRow}>
                {['₹5 Lakh', '₹10 Lakh', '₹25 Lakh', '₹50 Lakh'].map((amt) => {
                  const isSelected = selectedSumInsured === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.sumInsuredPill, isSelected && styles.sumInsuredPillActive]}
                      onPress={() => setSelectedSumInsured(amt)}
                    >
                      <Text
                        style={[
                          styles.sumInsuredText,
                          isSelected && styles.sumInsuredTextActive,
                        ]}
                      >
                        {amt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* TENURE SELECTOR TABS (ANNUAL / MONTHLY) */}
              <Text style={styles.inputLabel}>Payment Tenure:</Text>
              <View style={styles.tenureTabsRow}>
                <TouchableOpacity
                  style={[
                    styles.tenureTab,
                    paymentTenure === 'Annual' && styles.tenureTabActive,
                  ]}
                  onPress={() => setPaymentTenure('Annual')}
                >
                  <Text
                    style={[
                      styles.tenureTabText,
                      paymentTenure === 'Annual' && styles.tenureTabTextActive,
                    ]}
                  >
                    Annual (Best Value - Save 10%)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tenureTab,
                    paymentTenure === 'Monthly' && styles.tenureTabActive,
                  ]}
                  onPress={() => setPaymentTenure('Monthly')}
                >
                  <Text
                    style={[
                      styles.tenureTabText,
                      paymentTenure === 'Monthly' && styles.tenureTabTextActive,
                    ]}
                  >
                    Monthly EMI
                  </Text>
                </TouchableOpacity>
              </View>

              {/* TENURE & PRICE SUMMARY */}
              <View style={styles.tenureBox}>
                <View style={styles.tenureRow}>
                  <View>
                    <Text style={styles.tenureLabel}>
                      Total {paymentTenure} Premium:
                    </Text>
                    <Text style={styles.tenureBreakdownSub}>
                      {calculatedPremium.breakdownText}
                    </Text>
                  </View>
                  <Text style={styles.tenureVal}>
                    {calculatedPremium.finalPayableFormatted}
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.slate }}>
                      {paymentTenure === 'Annual' ? ' / yr' : ' / mo'}
                    </Text>
                  </Text>
                </View>

                <View style={styles.tenureDivider} />

                <View style={styles.tenureSubRow}>
                  <Text style={styles.tenureSubItem}>
                    • 18% GST Included (₹{calculatedPremium.gst.toLocaleString('en-IN')})
                  </Text>
                  <Text style={styles.tenureSubItem}>
                    • 80D Tax Exemption Certificate Generated
                  </Text>
                </View>
              </View>

              {/* COMPLETE REGISTRATION BUTTON */}
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                activeOpacity={0.88}
                onPress={handleCompletePurchase}
              >
                <Text style={styles.modalSubmitBtnText}>
                  Pay {calculatedPremium.finalPayableFormatted} & Issue Policy
                </Text>
                <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================
          SUCCESS POLICY ISSUANCE MODAL
      ================================================== */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconBox}>
              <Ionicons name="shield-checkmark" size={36} color="#FFFFFF" />
            </View>

            <Text style={styles.successTitle}>Policy Issued Successfully!</Text>
            <Text style={styles.successSub}>
              Your health insurance policy is active with instant 100% cashless admission enabled.
            </Text>

            <View style={styles.policySummaryBox}>
              <View style={styles.policySummaryRow}>
                <Text style={styles.policySummaryLabel}>Policy Number:</Text>
                <Text style={styles.policySummaryVal}>{issuedPolicy?.policyNumber}</Text>
              </View>
              <View style={styles.policySummaryRow}>
                <Text style={styles.policySummaryLabel}>Plan Name:</Text>
                <Text style={styles.policySummaryVal} numberOfLines={1}>
                  {issuedPolicy?.planName}
                </Text>
              </View>
              <View style={styles.policySummaryRow}>
                <Text style={styles.policySummaryLabel}>Sum Insured:</Text>
                <Text style={styles.policySummaryVal}>{issuedPolicy?.sumInsured}</Text>
              </View>
              <View style={styles.policySummaryRow}>
                <Text style={styles.policySummaryLabel}>Status:</Text>
                <Text style={[styles.policySummaryVal, { color: '#059669' }]}>
                  Active & Cashless Ready
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.navigate('TransactionHistory');
              }}
            >
              <Text style={styles.modalSubmitBtnText}>View in My Transactions & Cards</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.whatsappBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  safeArea: {
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  headerCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // HELPLINE CARD
  helplineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.lightTeal,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  helplineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helplineIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helplineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },
  helplineSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  helplineActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  callNowBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  requestCallbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  requestCallbackBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },

  // BENEFITS GRID
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
    flex: 1,
    minWidth: '45%',
  },
  benefitText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.secondary,
  },

  // QUICK MEMBER SELECTOR CARD
  quickMemberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.lightTeal,
    marginBottom: 12,
  },
  quickMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickMemberTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  memberCountTag: {
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  memberCountTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  quickMemberPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  quickMemberPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickMemberPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.secondary,
  },
  quickMemberPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  quickMemberPillSub: {
    fontSize: 9.5,
    color: colors.slate,
  },
  quickMemberPillSubActive: {
    color: '#D1FAE5',
  },

  // SEARCH BOX
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12.5,
    color: colors.text,
  },

  // CATEGORY PILLS
  categoryScroll: {
    paddingBottom: 10,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    gap: 5,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },

  // PLANS LIST
  plansSection: {
    marginTop: 4,
  },
  plansSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 10,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeTag: {
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  claimRatioTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  claimRatioText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  planName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.secondary,
  },
  insurerName: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
    marginBottom: 10,
  },

  pricingBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  pricingCol: {
    flex: 1,
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  sumInsuredVal: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.secondary,
    marginTop: 2,
  },
  priceVal: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 2,
  },
  pricingDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },

  hospitalsCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
    gap: 4,
  },
  hospitalsCountText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },

  featuresBox: {
    gap: 5,
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  featureText: {
    flex: 1,
    fontSize: 11,
    color: colors.text,
    lineHeight: 15,
  },

  taxBenefitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 12,
    gap: 4,
  },
  taxBenefitText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.secondary,
  },

  planActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  planCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  planCallBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  planBuyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  planBuyBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.secondary,
  },
  modalSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 5,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
  },
  enquiryOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  enquiryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  enquiryPillActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  enquiryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  enquiryPillTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  modalSubmitBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  whatsappBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  // BUY PROPOSAL MODAL
  membersChoiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  memberChoicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  memberChoicePillActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  memberChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  memberChoiceTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  memberDeltaTag: {
    fontSize: 9.5,
    color: colors.slate,
    fontWeight: '700',
  },
  memberDeltaTagActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  sumInsuredRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  sumInsuredPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sumInsuredPillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  sumInsuredText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sumInsuredTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // TENURE TABS
  tenureTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tenureTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenureTabActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  tenureTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tenureTabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  // DYNAMIC PRICE BOX
  tenureBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 12,
  },
  tenureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tenureLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  tenureBreakdownSub: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 200,
  },
  tenureVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  tenureDivider: {
    height: 1,
    backgroundColor: '#DBEAFE',
    marginVertical: 8,
  },
  tenureSubRow: {
    gap: 3,
  },
  tenureSubItem: {
    fontSize: 10,
    color: colors.textSecondary,
  },

  // SUCCESS MODAL
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.secondary,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 12,
  },
  policySummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginBottom: 14,
  },
  policySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  policySummaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  policySummaryVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    maxWidth: '65%',
  },
});

export default HealthInsuranceScreen;
