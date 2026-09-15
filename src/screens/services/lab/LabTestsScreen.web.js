import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

// ==================================================
// POPULAR TESTS DATA (10 TESTS)
// ==================================================
const POPULAR_TESTS = [
  { id: 't1', name: 'CBC (Complete Blood Count)', icon: 'water', bg: '#FEE2E2', color: '#DC2626', price: 299 },
  { id: 't2', name: 'Thyroid Profile (TSH, T3, T4)', icon: 'sparkles', bg: '#F3E8FF', color: '#7C3AED', price: 499 },
  { id: 't3', name: 'Vitamin D', icon: 'sunny', bg: '#FEF3C7', color: '#D97706', price: 999 },
  { id: 't4', name: 'HbA1c (Diabetes)', icon: 'pulse', bg: '#E0F2FE', color: '#0284C7', price: 399 },
  { id: 't5', name: 'Lipid Profile (Cholesterol)', icon: 'heart', bg: '#FEE2E2', color: '#EF4444', price: 549 },
  { id: 't6', name: 'Liver Function Test (LFT)', icon: 'fitness', bg: '#FFEDD5', color: '#EA580C', price: 699 },
  { id: 't7', name: 'Kidney Function Test (KFT)', icon: 'medkit', bg: '#FCE7F3', color: '#DB2777', price: 699 },
  { id: 't8', name: 'Urine Routine & Microscopy', icon: 'flask', bg: '#CCFBF1', color: '#0D9488', price: 199 },
  { id: 't9', name: 'Iron Profile', icon: 'eyedrop', bg: '#FEE2E2', color: '#B91C1C', price: 799 },
  { id: 't10', name: 'CRP (Inflammation)', icon: 'shield-checkmark', bg: '#E6F8F4', color: '#00B894', price: 449 },
];

// ==================================================
// POPULAR HEALTH CHECKUPS (10 CATEGORIES)
// ==================================================
const POPULAR_CHECKUP_TABS = [
  { id: 'full-body', name: 'Full Body Checkup', icon: 'body-outline' },
  { id: 'diabetes', name: 'Diabetes Checkup', icon: 'pulse-outline' },
  { id: 'thyroid', name: 'Thyroid Checkup', icon: 'sparkles-outline' },
  { id: 'heart', name: 'Heart Health Checkup', icon: 'heart-outline' },
  { id: 'women', name: "Women's Health Checkup", icon: 'female-outline' },
  { id: 'men', name: "Men's Health Checkup", icon: 'male-outline' },
  { id: 'senior', name: 'Senior Citizen Checkup', icon: 'person-outline' },
  { id: 'child', name: 'Child Health Checkup', icon: 'happy-outline' },
  { id: 'executive', name: 'Executive Health Checkup', icon: 'briefcase-outline' },
  { id: 'surgery', name: 'Pre-surgery Checkup', icon: 'medkit-outline' },
];

// ==================================================
// FULL BODY CHECKUP PACKAGES (5 CARDS)
// ==================================================
const CHECKUP_PACKAGES = [
  {
    id: 'pkg-1',
    name: 'Basic Health Checkup',
    badge: 'Most Popular',
    testsCount: 'Includes 40+ tests',
    bullets: [
      { text: 'General health assessment', icon: 'fitness-outline' },
      { text: 'Home collection available', icon: 'home-outline' },
      { text: 'Reports in 24–48 hrs', icon: 'time-outline' },
    ],
    price: 999,
    mrp: 1899,
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500',
  },
  {
    id: 'pkg-2',
    name: 'Standard Health Checkup',
    badge: null,
    testsCount: 'Includes 60+ tests',
    bullets: [
      { text: 'Comprehensive health screening', icon: 'fitness-outline' },
      { text: 'Home collection available', icon: 'home-outline' },
      { text: 'Reports in 24–48 hrs', icon: 'time-outline' },
    ],
    price: 1499,
    mrp: 2799,
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500',
  },
  {
    id: 'pkg-3',
    name: 'Advanced Health Checkup',
    badge: null,
    testsCount: 'Includes 80+ tests',
    bullets: [
      { text: 'Detailed health assessment', icon: 'fitness-outline' },
      { text: 'Home collection available', icon: 'home-outline' },
      { text: 'Reports in 24–48 hrs', icon: 'time-outline' },
    ],
    price: 2499,
    mrp: 4499,
    image: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=500',
  },
  {
    id: 'pkg-4',
    name: 'Executive Health Checkup',
    badge: null,
    testsCount: 'Includes 100+ tests',
    bullets: [
      { text: 'For working professionals', icon: 'briefcase-outline' },
      { text: 'Home collection available', icon: 'home-outline' },
      { text: 'Reports in 24–48 hrs', icon: 'time-outline' },
    ],
    price: 3999,
    mrp: 6999,
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=500',
  },
  {
    id: 'pkg-5',
    name: 'Senior Citizen Checkup',
    badge: null,
    testsCount: 'Includes 70+ tests',
    bullets: [
      { text: 'Age-specific screening', icon: 'person-outline' },
      { text: 'Home collection available', icon: 'home-outline' },
      { text: 'Reports in 24–48 hrs', icon: 'time-outline' },
    ],
    price: 1799,
    mrp: 3299,
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500',
  },
];

// ==================================================
// BROWSE BY CATEGORY GRID ITEMS
// ==================================================
const BROWSE_CATEGORIES = [
  { id: 'b1', name: 'Full Body Checkup', icon: 'body', color: '#00B894', bg: '#E6F8F4' },
  { id: 'b2', name: 'Diabetes Checkup', icon: 'pulse', color: '#0284C7', bg: '#E0F2FE' },
  { id: 'b3', name: 'Thyroid Checkup', icon: 'sparkles', color: '#7C3AED', bg: '#F3E8FF' },
  { id: 'b4', name: 'Heart Health Checkup', icon: 'heart', color: '#EF4444', bg: '#FEE2E2' },
  { id: 'b5', name: "Women's Health Checkup", icon: 'female', color: '#DB2777', bg: '#FCE7F3' },
  { id: 'b6', name: "Men's Health Checkup", icon: 'male', color: '#0284C7', bg: '#E0F2FE' },
  { id: 'b7', name: 'Senior Citizen Checkup', icon: 'person', color: '#0D9488', bg: '#CCFBF1' },
  { id: 'b8', name: 'Child Health Checkup', icon: 'happy', color: '#10B981', bg: '#ECFDF5' },
  { id: 'b9', name: 'Executive Checkup', icon: 'briefcase', color: '#4F46E5', bg: '#E0E7FF' },
  { id: 'b10', name: 'Pre-surgery Checkup', icon: 'medkit', color: '#0284C7', bg: '#E0F2FE' },
];

const LabTestsScreenWeb = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Mysuru');
  const [selectedCheckupTab, setSelectedCheckupTab] = useState('full-body');
  const [uploadToast, setUploadToast] = useState(null);

  // File Upload Handler
  const handleFileUpload = () => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          setUploadToast(`Prescription "${file.name}" uploaded! MediUnify AI is scanning tests.`);
          setTimeout(() => setUploadToast(null), 4000);
        }
      };
      input.click();
    }
  };

  // Booking Handler
  const handleBookPackage = (pkg) => {
    if (navigation?.navigate) {
      navigation.navigate('LabBooking', {
        test: {
          id: pkg.id,
          name: pkg.name,
          price: pkg.price,
          mrp: pkg.mrp,
          homeCollectionAvailable: true,
          includesCount: pkg.testsCount,
        },
      });
    } else {
      showAlert('Book Package', `Proceeding to slot booking for ${pkg.name} (₹${pkg.price.toLocaleString('en-IN')})`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            1. BREADCRUMB & HERO BANNER SECTION
        ============================================================ */}
        <View style={styles.heroSectionWrap}>
          <View style={styles.heroInner}>
            {/* Breadcrumb */}
            <View style={styles.breadcrumbRow}>
              <TouchableOpacity onPress={() => navigation?.navigate('Home')} activeOpacity={0.7}>
                <Text style={styles.breadcrumbLink}>Home</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={12} color="#64748B" />
              <Text style={styles.breadcrumbActive}>Lab Tests</Text>
            </View>

            {/* Hero Main Row */}
            <View style={[styles.heroRow, !isDesktop && { flexDirection: 'column' }]}>
              {/* Left Column: Heading, Badges & Search Bar */}
              <View style={styles.heroLeftCol}>
                <Text style={styles.heroMainTitle}>
                  Book Lab Tests &{'\n'}
                  <Text style={styles.heroTitleTeal}>Health Checkups</Text>
                </Text>
                <Text style={styles.heroSubTitle}>
                  Accurate results. Convenient home sample collection.
                </Text>

                {/* Trust Badges Strip */}
                <View style={styles.trustBadgesRow}>
                  <View style={styles.trustBadgeItem}>
                    <Ionicons name="shield-checkmark" size={14} color="#00B894" />
                    <Text style={styles.trustBadgeText}>NABL aligned laboratories</Text>
                  </View>
                  <View style={styles.trustBadgeItem}>
                    <Ionicons name="home" size={14} color="#00C2CB" />
                    <Text style={styles.trustBadgeText}>Home collection in Mysuru</Text>
                  </View>
                  <View style={styles.trustBadgeItem}>
                    <Ionicons name="lock-closed" size={14} color="#1E3A8A" />
                    <Text style={styles.trustBadgeText}>Safe & secure process</Text>
                  </View>
                  <View style={styles.trustBadgeItem}>
                    <Ionicons name="document-text" size={14} color="#7BC96F" />
                    <Text style={styles.trustBadgeText}>Reports delivered digitally</Text>
                  </View>
                </View>

                {/* Search & Location Bar */}
                <View style={styles.searchBarBox}>
                  <View style={styles.searchInputWrap}>
                    <Ionicons name="search" size={19} color="#1E3A8A" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search for a test, package or health condition (e.g. CBC, Vitamin D, Thyroid, Diabetes...)"
                      placeholderTextColor="#94A3B8"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  <View style={styles.locationDivider} />

                  <TouchableOpacity
                    style={styles.locationDropdownBtn}
                    onPress={() => {
                      setSelectedCity(selectedCity === 'Mysuru' ? 'Bengaluru' : 'Mysuru');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="location-sharp" size={16} color="#00C2CB" />
                    <Text style={styles.locationBtnText}>{selectedCity}</Text>
                    <Ionicons name="chevron-down" size={13} color="#64748B" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.searchSubmitBtn}
                    onPress={() => {}}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.searchSubmitBtnText}>Search</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Right Column: Smiling Patient Photo & Floating Priority Card */}
              <View style={styles.heroRightCol}>
                <View style={styles.heroImageWrapper}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800' }}
                    style={styles.heroPatientImg}
                    resizeMode="cover"
                  />

                  {/* Floating Highlights Card */}
                  <View style={styles.floatingHighlightCard}>
                    <Text style={styles.floatingHighlightHeading}>
                      Your Health{'\n'}Our Priority{'\n'}
                      <Text style={{ color: '#00B894' }}>At Your Home</Text>
                    </Text>

                    <View style={styles.highlightBullet}>
                      <Ionicons name="checkmark-circle" size={15} color="#00B894" />
                      <Text style={styles.highlightBulletText}>Accurate Reports</Text>
                    </View>

                    <View style={styles.highlightBullet}>
                      <Ionicons name="checkmark-circle" size={15} color="#00C2CB" />
                      <Text style={styles.highlightBulletText}>Home Collection</Text>
                    </View>

                    <View style={styles.highlightBullet}>
                      <Ionicons name="checkmark-circle" size={15} color="#7BC96F" />
                      <Text style={styles.highlightBulletText}>Trusted & Secure</Text>
                    </View>

                    <View style={styles.highlightBullet}>
                      <Ionicons name="checkmark-circle" size={15} color="#1E3A8A" />
                      <Text style={styles.highlightBulletText}>Digital Reports</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* TOAST ALERT */}
        {uploadToast && (
          <View style={styles.toastBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#00B894" />
            <Text style={styles.toastBannerText}>{uploadToast}</Text>
          </View>
        )}

        {/* ============================================================
            2. POPULAR TESTS (10 CIRCLE ICONS)
        ============================================================ */}
        <View style={styles.sectionWrapWhite}>
          <View style={styles.sectionMaxWidth}>
            <View style={styles.sectionHeaderLine}>
              <View>
                <Text style={styles.sectionHeading}>Popular Tests</Text>
                <Text style={styles.sectionSubHeading}>Most booked tests</Text>
              </View>
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Text style={styles.viewAllLink}>View all tests ➔</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularTestsTrack}
            >
              {POPULAR_TESTS.map((test) => (
                <TouchableOpacity
                  key={test.id}
                  style={styles.popularTestCard}
                  onPress={() => setSearchQuery(test.name.split(' (')[0])}
                  activeOpacity={0.8}
                >
                  <View style={[styles.testIconCircle, { backgroundColor: test.bg }]}>
                    <Ionicons name={test.icon} size={22} color={test.color} />
                  </View>
                  <Text style={styles.testNameText} numberOfLines={2}>
                    {test.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ============================================================
            3. POPULAR HEALTH CHECKUPS (10 CATEGORY BUTTONS)
        ============================================================ */}
        <View style={styles.sectionWrapSubtle}>
          <View style={styles.sectionMaxWidth}>
            <View style={styles.sectionHeaderLine}>
              <View>
                <Text style={styles.sectionHeading}>Popular Health Checkups</Text>
                <Text style={styles.sectionSubHeading}>Choose from our comprehensive health checkups</Text>
              </View>
              <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
                <Text style={styles.viewAllLink}>View all packages ➔</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularCheckupsTrack}
            >
              {POPULAR_CHECKUP_TABS.map((tab) => {
                const isSelected = selectedCheckupTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.checkupTabBox, isSelected && styles.checkupTabBoxSelected]}
                    onPress={() => setSelectedCheckupTab(tab.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={24}
                      color={isSelected ? '#00B894' : '#64748B'}
                      style={{ marginBottom: 6 }}
                    />
                    <Text
                      style={[styles.checkupTabName, isSelected && styles.checkupTabNameSelected]}
                      numberOfLines={2}
                    >
                      {tab.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* ============================================================
            4. FULL BODY CHECKUP PACKAGES (5 CARDS SIDE BY SIDE)
        ============================================================ */}
        <View style={styles.sectionWrapWhite}>
          <View style={styles.sectionMaxWidth}>
            <View style={styles.sectionHeaderLine}>
              <View>
                <Text style={styles.sectionHeading}>Full Body Checkup Packages</Text>
                <Text style={styles.sectionSubHeading}>
                  Complete health assessment for you and your family
                </Text>
              </View>
              <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
                <Text style={styles.viewAllLink}>Compare Packages ➔</Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Grid of 5 Package Cards */}
            <View style={styles.packagesRowGrid}>
              {CHECKUP_PACKAGES.map((pkg) => (
                <View key={pkg.id} style={styles.packageCard}>
                  {/* Card Image with Optional Badge */}
                  <View style={styles.packageImgWrap}>
                    <Image source={{ uri: pkg.image }} style={styles.packageImg} />
                    {pkg.badge && (
                      <View style={styles.popularBadgePill}>
                        <Text style={styles.popularBadgeText}>{pkg.badge}</Text>
                      </View>
                    )}
                  </View>

                  {/* Body Content */}
                  <View style={styles.packageBody}>
                    <Text style={styles.pkgTitleText}>{pkg.name}</Text>
                    <Text style={styles.pkgIncludesText}>{pkg.testsCount}</Text>

                    {/* Feature Bullets */}
                    <View style={styles.pkgBulletsCol}>
                      {pkg.bullets.map((b, bIdx) => (
                        <View key={bIdx} style={styles.bulletItemRow}>
                          <Ionicons name={b.icon} size={13} color="#00B894" />
                          <Text style={styles.bulletItemText}>{b.text}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Price & Book Action */}
                    <View style={styles.pkgFooterRow}>
                      <Text style={styles.pkgPriceText}>₹{pkg.price.toLocaleString('en-IN')}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.bookNowBtn}
                      onPress={() => handleBookPackage(pkg)}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.bookNowBtnText}>Book Now ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ============================================================
            5. TWO-COLUMN SECTION: BROWSE BY CATEGORY & UPLOAD PRESCRIPTION
        ============================================================ */}
        <View style={styles.sectionWrapSubtle}>
          <View style={[styles.sectionMaxWidth, styles.splitTwoColRow, !isDesktop && { flexDirection: 'column' }]}>
            {/* Left Column: Browse Checkups by Category */}
            <View style={styles.browseCol}>
              <Text style={styles.sectionHeading}>Browse Checkups by Category</Text>
              <Text style={[styles.sectionSubHeading, { marginBottom: 16 }]}>
                Find the right health checkup for your needs
              </Text>

              <View style={styles.browseGrid}>
                {BROWSE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.browseCard}
                    onPress={() => {
                      setSelectedCheckupTab('full-body');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.browseIconCircle, { backgroundColor: cat.bg }]}>
                      <Ionicons name={cat.icon} size={20} color={cat.color} />
                    </View>
                    <Text style={styles.browseCardTitle} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Right Column: "Have a prescription or test list?" Upload Card */}
            <View style={styles.uploadCol}>
              <View style={styles.prescriptionCardBox}>
                <View style={styles.uploadCardTitleRow}>
                  <Ionicons name="sparkles" size={17} color="#00B894" />
                  <Text style={styles.prescriptionHeading}>
                    Have a prescription or test list?
                  </Text>
                </View>
                <Text style={styles.prescriptionSub}>
                  Upload it and let MediUnify AI find the right tests for you.
                </Text>

                {/* Dotted Upload Zone */}
                <TouchableOpacity
                  style={styles.dottedUploadBox}
                  onPress={handleFileUpload}
                  activeOpacity={0.85}
                >
                  <Ionicons name="document-text" size={32} color="#0284C7" />
                  <Text style={styles.uploadBoxPrompt}>Upload Prescription / Test List</Text>
                  <Text style={styles.uploadBoxPromptSub}>Drag & drop or click to upload</Text>
                  <Text style={styles.uploadBoxFormats}>PDF, JPG, PNG (Max 10 MB)</Text>
                </TouchableOpacity>

                {/* MediUnify AI Explanation Strip */}
                <View style={styles.aiHelperStrip}>
                  <View style={styles.aiRobotCircle}>
                    <Ionicons name="hardware-chip" size={22} color="#00B894" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.aiHelperTitle}>MediUnify AI</Text>
                    <Text style={styles.aiHelperDesc}>
                      We'll read your prescription, identify the tests and show you the best options.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            6. "WHY CHOOSE MEDIUNIFY FOR LAB TESTS"
        ============================================================ */}
        <View style={styles.whySectionWrap}>
          <View style={styles.sectionMaxWidth}>
            <Text style={styles.whyMainHeading}>Why Choose MediUnify for Lab Tests</Text>

            <View style={styles.whyFeaturesRow}>
              <View style={styles.whyFeatureItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#F0F9FF' }]}>
                  <Ionicons name="business" size={18} color="#1E3A8A" />
                </View>
                <Text style={styles.whyFeatureText}>NABL aligned laboratories</Text>
              </View>

              <View style={styles.whyFeatureItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#E6FAF5' }]}>
                  <Ionicons name="flask" size={18} color="#00B894" />
                </View>
                <Text style={styles.whyFeatureText}>Wide range of tests</Text>
              </View>

              <View style={styles.whyFeatureItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#E0F7FA' }]}>
                  <Ionicons name="home" size={18} color="#00C2CB" />
                </View>
                <Text style={styles.whyFeatureText}>Convenient home collection</Text>
              </View>

              <View style={styles.whyFeatureItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#F1F8E9' }]}>
                  <Ionicons name="speedometer" size={18} color="#7BC96F" />
                </View>
                <Text style={styles.whyFeatureText}>Accurate & reliable reports</Text>
              </View>

              <View style={styles.whyFeatureItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#FF7F50" />
                </View>
                <Text style={styles.whyFeatureText}>Safe & secure your data</Text>
              </View>

              <View style={styles.whyFeatureItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#E6FAF5' }]}>
                  <Ionicons name="calendar" size={18} color="#00B894" />
                </View>
                <Text style={styles.whyFeatureText}>Easy online booking</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            7. "HOW IT WORKS" (6 NUMBERED STEPS)
        ============================================================ */}
        <View style={styles.howItWorksWrap}>
          <View style={styles.sectionMaxWidth}>
            <Text style={styles.howItWorksHeading}>How It Works</Text>

            <View style={styles.stepsRow}>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumberBadge, { backgroundColor: '#F0F9FF' }]}>
                  <Text style={[styles.stepNumberText, { color: '#1E3A8A' }]}>1</Text>
                </View>
                <Text style={styles.stepTitle}>Search</Text>
                <Text style={styles.stepDesc}>Find your test or package</Text>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepNumberBadge, { backgroundColor: '#E6FAF5' }]}>
                  <Text style={[styles.stepNumberText, { color: '#00B894' }]}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Choose</Text>
                <Text style={styles.stepDesc}>Select the right test or health checkup</Text>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepNumberBadge, { backgroundColor: '#E0F7FA' }]}>
                  <Text style={[styles.stepNumberText, { color: '#00C2CB' }]}>3</Text>
                </View>
                <Text style={styles.stepTitle}>Book</Text>
                <Text style={styles.stepDesc}>Choose a date & time for home collection</Text>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepNumberBadge, { backgroundColor: '#F1F8E9' }]}>
                  <Text style={[styles.stepNumberText, { color: '#7BC96F' }]}>4</Text>
                </View>
                <Text style={styles.stepTitle}>Sample Collection</Text>
                <Text style={styles.stepDesc}>Our professionals collect samples at your home</Text>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepNumberBadge, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={[styles.stepNumberText, { color: '#FF7F50' }]}>5</Text>
                </View>
                <Text style={styles.stepTitle}>Report</Text>
                <Text style={styles.stepDesc}>Get notified when reports are ready</Text>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepNumberBadge, { backgroundColor: '#F0F9FF' }]}>
                  <Text style={[styles.stepNumberText, { color: '#1E3A8A' }]}>6</Text>
                </View>
                <Text style={styles.stepTitle}>View Reports</Text>
                <Text style={styles.stepDesc}>Download reports from your account</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 8. ENTERPRISE FOOTER */}
        <WebFooter navigation={navigation} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // 1. HERO SECTION
  heroSectionWrap: {
    backgroundColor: '#F0F9FF', // Official MediUnify Light Blue
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  heroInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  breadcrumbLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 28,
  },
  heroLeftCol: {
    flex: 1.15,
  },
  heroMainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  heroTitleTeal: {
    color: '#00B894',
  },
  heroSubTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    marginBottom: 4,
  },
  trustBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustBadgeText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },

  // SEARCH BAR BOX
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    padding: 6,
    marginTop: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E3A8A',
    fontWeight: '500',
    outlineStyle: 'none',
  },
  locationDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
  },
  locationDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  locationBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  searchSubmitBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  searchSubmitBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // HERO RIGHT PATIENT PHOTO & FLOATING CARD
  heroRightCol: {
    flex: 0.85,
  },
  heroImageWrapper: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  heroPatientImg: {
    width: '100%',
    height: 240,
  },
  floatingHighlightCard: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    maxWidth: 220,
  },
  floatingHighlightHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 8,
    lineHeight: 16,
  },
  highlightBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  highlightBulletText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E3A8A',
  },

  // TOAST BANNER
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 8,
  },
  toastBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },

  // 2. POPULAR TESTS
  sectionWrapWhite: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 22,
  },
  sectionWrapSubtle: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 22,
  },
  sectionMaxWidth: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  sectionSubHeading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  viewAllLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#00B894',
  },
  popularTestsTrack: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 4,
  },
  popularTestCard: {
    width: 105,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  testNameText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E3A8A',
    textAlign: 'center',
    lineHeight: 14,
  },

  // 3. POPULAR CHECKUPS
  popularCheckupsTrack: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 4,
  },
  checkupTabBox: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkupTabBoxSelected: {
    borderColor: '#00B894',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
  },
  checkupTabName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
  checkupTabNameSelected: {
    color: '#00B894',
    fontWeight: '800',
  },

  // 4. PACKAGES ROW GRID (5 CARDS)
  packagesRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  packageCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  packageImgWrap: {
    position: 'relative',
    height: 125,
    backgroundColor: '#E2E8F0',
  },
  packageImg: {
    width: '100%',
    height: '100%',
  },
  popularBadgePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#00B894',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  packageBody: {
    padding: 12,
  },
  pkgTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  pkgIncludesText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  pkgBulletsCol: {
    gap: 5,
    marginBottom: 12,
  },
  bulletItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulletItemText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  pkgFooterRow: {
    marginBottom: 8,
  },
  pkgPriceText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  bookNowBtn: {
    backgroundColor: '#00B894',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNowBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 5. TWO-COLUMN SPLIT
  splitTwoColRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
  },
  browseCol: {
    flex: 1.25,
  },
  browseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  browseCard: {
    width: '18.5%',
    minWidth: 105,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  browseCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
    textAlign: 'center',
    lineHeight: 14,
  },

  // UPLOAD CARD COL
  uploadCol: {
    flex: 0.75,
  },
  prescriptionCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  uploadCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  prescriptionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  prescriptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  dottedUploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#00B894',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    marginBottom: 14,
  },
  uploadBoxPrompt: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#00B894',
    marginTop: 6,
  },
  uploadBoxPromptSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  uploadBoxFormats: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  aiHelperStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiRobotCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00B894',
  },
  aiHelperTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  aiHelperDesc: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
    marginTop: 1,
  },

  // 6. WHY CHOOSE SECTION
  whySectionWrap: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 24,
  },
  whyMainHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E3A8A',
    marginBottom: 18,
  },
  whyFeaturesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  whyFeatureItem: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  whyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whyFeatureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
    flex: 1,
    lineHeight: 16,
  },

  // 7. HOW IT WORKS
  howItWorksWrap: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 26,
  },
  howItWorksHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E3A8A',
    marginBottom: 18,
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stepItem: {
    flex: 1,
    minWidth: 150,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
});

export default LabTestsScreenWeb;
