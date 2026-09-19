import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  StatusBar,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import {
  LAB_CATEGORIES,
  LAB_TESTS_MASTER,
  LAB_PACKAGES,
  DIAGNOSTIC_CENTRES,
  getAvailableDates,
  TIME_SLOTS,
  INITIAL_SAVED_ADDRESSES,
  INITIAL_LAB_BOOKINGS,
  INITIAL_LAB_REPORTS,
} from '../../../data/labTestData';
import LabTestsScreenWeb from './LabTestsScreen.web';
import { showAlert } from '../../../utils/alert';
import { useCart } from '../../../context/CartContext';

const LabTestsScreen = (props) => {
  // Delegate to web version on web platform
  if (Platform.OS === 'web') {
    return <LabTestsScreenWeb {...props} />;
  }

  const { navigation, route } = props;
  const { width } = useWindowDimensions();

  // Cart integration
  const { labCart = [], addToCart, removeFromCart, labCartCount = 0, labFinalTotal = 0 } = useCart();

  const isTestInCart = (id) => labCart?.some((item) => item.id === id);

  const handleToggleCartTest = (test) => {
    if (isTestInCart(test.id)) {
      removeFromCart(test.id, 'lab');
      showAlert('Removed from Cart', `${test.name} removed from your diagnostic cart.`);
    } else {
      const cartItem = {
        id: test.id,
        name: test.name,
        category: 'Lab Test',
        itemType: 'lab',
        price: test.price,
        mrp: test.mrp || Math.round(test.price * 1.25),
        centerName: 'Unnathi Certified Clinical Labs',
        reportTime: test.reportTAT || 'Within 24 Hours',
        sampleType: test.sampleType || 'Blood Sample',
        homeSample: Boolean(test.homeCollection),
        fastingRequired: test.fastingRequired,
      };
      addToCart(cartItem, 1, 'lab');
      showAlert('Added to Cart! 🧪', `${test.name} has been added to your cart.`);
    }
  };

  const handleToggleCartPackage = (pkg) => {
    if (isTestInCart(pkg.id)) {
      removeFromCart(pkg.id, 'lab');
      showAlert('Removed from Cart', `${pkg.name} removed from your diagnostic cart.`);
    } else {
      const cartItem = {
        id: pkg.id,
        name: pkg.name,
        category: 'Lab Test',
        itemType: 'lab',
        price: pkg.price,
        mrp: pkg.mrp || Math.round(pkg.price * 1.3),
        centerName: 'Unnathi Comprehensive Care Lab',
        reportTime: 'Within 24-48 Hours',
        sampleType: `${pkg.includedCount || 'Multiple'} Tests Included`,
        homeSample: true,
        isPackage: true,
      };
      addToCart(cartItem, 1, 'lab');
      showAlert('Added to Cart! 🧪', `${pkg.name} has been added to your cart.`);
    }
  };

  // Root Tabs: 'BROWSE' | 'BOOKINGS' | 'REPORTS'
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'BROWSE');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState(route?.params?.query || route?.params?.search || '');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' or category ID
  const [selectedSubCategory, setSelectedSubCategory] = useState('all'); // 'all' or subcategory ID
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('ALL'); // 'ALL' | 'MALE' | 'FEMALE'
  const [selectedSampleFilter, setSelectedSampleFilter] = useState('ALL'); // 'ALL' | 'Blood' | 'Urine' | 'Stool' | 'Swab'
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState('ALL'); // 'ALL' | 'HOME' | 'CENTRE'

  // Modal Views State
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Booking Flow State
  const [bookingFlowStep, setBookingFlowStep] = useState(1); // 1: Method, 2: Slot/Address, 3: Summary, 4: Payment, 5: Confirmed
  const [activeBookingTest, setActiveBookingTest] = useState(null);
  const [collectionMethod, setCollectionMethod] = useState('HOME'); // 'HOME' | 'CENTRE'
  const [selectedCentreId, setSelectedCentreId] = useState('centre-unnathi-main');
  const [selectedDate, setSelectedDate] = useState(getAvailableDates()[0].dateStr);
  const [selectedSlotId, setSelectedSlotId] = useState('slot-2');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET'
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);

  // Manual Home Collection Address Form
  const [homeAddressName, setHomeAddressName] = useState('');
  const [homeAddressPhone, setHomeAddressPhone] = useState('');
  const [homeAddressFlat, setHomeAddressFlat] = useState('');
  const [homeAddressCity, setHomeAddressCity] = useState('');
  const [homeAddressPincode, setHomeAddressPincode] = useState('');
  const [homeAddressLandmark, setHomeAddressLandmark] = useState('');

  // Bookings & Reports State
  const [bookingsList, setBookingsList] = useState(INITIAL_LAB_BOOKINGS);
  const [bookingsFilter, setBookingsFilter] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
  const [selectedTrackingBooking, setSelectedTrackingBooking] = useState(null);

  const [reportsList, setReportsList] = useState(INITIAL_LAB_REPORTS);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDownloadToast, setShowDownloadToast] = useState(false);

  // Scroll reference
  const mainScrollRef = useRef(null);

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC (Section 7: Search by name, keywords, synonyms, consumer terms)
  // ---------------------------------------------------------------------------
  const filteredTests = useMemo(() => {
    return LAB_TESTS_MASTER.filter((test) => {
      // Category filter
      if (selectedCategory !== 'all' && test.category !== selectedCategory) {
        return false;
      }
      // Sub-category filter
      if (selectedSubCategory !== 'all' && test.subCategory !== selectedSubCategory) {
        return false;
      }
      // Gender filter
      if (selectedGenderFilter !== 'ALL' && test.genderApplicability !== 'All') {
        if (selectedGenderFilter === 'MALE' && test.genderApplicability !== 'Male') return false;
        if (selectedGenderFilter === 'FEMALE' && test.genderApplicability !== 'Female') return false;
      }
      // Sample filter
      if (selectedSampleFilter !== 'ALL' && test.sampleType !== selectedSampleFilter) {
        return false;
      }
      // Collection filter
      if (selectedCollectionFilter === 'HOME' && !test.homeCollection) return false;
      if (selectedCollectionFilter === 'CENTRE' && !test.centreCollection) return false;

      // Multi-keyword and consumer terms search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = test.name.toLowerCase().includes(q);
        const matchesDesc = test.description.toLowerCase().includes(q);
        const matchesKeywords = test.keywords?.some((k) => k.toLowerCase().includes(q));
        const matchesSynonyms = test.synonyms?.some((s) => s.toLowerCase().includes(q));
        const matchesAlternate = test.alternateNames?.some((a) => a.toLowerCase().includes(q));
        const matchesConsumer = test.consumerTerms?.some((c) => c.toLowerCase().includes(q));

        if (!matchesName && !matchesDesc && !matchesKeywords && !matchesSynonyms && !matchesAlternate && !matchesConsumer) {
          return false;
        }
      }
      return true;
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedGenderFilter,
    selectedSampleFilter,
    selectedCollectionFilter,
  ]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    if (bookingsFilter === 'UPCOMING') {
      return bookingsList.filter((b) => b.status === 'CONFIRMED' || b.status === 'PROCESSING');
    }
    if (bookingsFilter === 'COMPLETED') {
      return bookingsList.filter((b) => b.status === 'COMPLETED');
    }
    if (bookingsFilter === 'CANCELLED') {
      return bookingsList.filter((b) => b.status === 'CANCELLED');
    }
    return bookingsList;
  }, [bookingsList, bookingsFilter]);

  // Selected Category Object
  const activeCategoryObj = useMemo(() => {
    return LAB_CATEGORIES.find((c) => c.id === selectedCategory);
  }, [selectedCategory]);

  // ---------------------------------------------------------------------------
  // BOOKING HANDLERS
  // ---------------------------------------------------------------------------
  const startBooking = (test, preferredMethod = null) => {
    setActiveBookingTest(test);
    // Determine default method based on test configuration
    if (preferredMethod) {
      setCollectionMethod(preferredMethod);
    } else if (test.homeCollection) {
      setCollectionMethod('HOME');
    } else {
      setCollectionMethod('CENTRE');
    }
    setBookingFlowStep(1);
  };

  const handleSimulatePayment = () => {
    const isHome = collectionMethod === 'HOME';
    if (isHome && (!homeAddressName.trim() || !homeAddressPhone.trim() || !homeAddressFlat.trim() || !homeAddressCity.trim() || !homeAddressPincode.trim())) {
      return;
    }
    const testPrice = activeBookingTest.price;
    const collectionFee = isHome ? 100 : 0;
    const total = testPrice + collectionFee;
    const selectedCentre = DIAGNOSTIC_CENTRES.find((c) => c.id === selectedCentreId);
    const selectedSlot = TIME_SLOTS.find((s) => s.id === selectedSlotId);

    const manualAddr = isHome
      ? `${homeAddressFlat.trim()}, ${homeAddressCity.trim()} - ${homeAddressPincode.trim()}${homeAddressLandmark.trim() ? ` (${homeAddressLandmark.trim()})` : ''}`
      : null;

    const newBookingId = `LAB-2026-00${Math.floor(100 + Math.random() * 900)}`;

    const newBooking = {
      id: newBookingId,
      testId: activeBookingTest.id,
      testName: activeBookingTest.name,
      collectionMethod: collectionMethod,
      collectionAddress: manualAddr,
      collectionContactName: isHome ? homeAddressName.trim() : null,
      collectionContactPhone: isHome ? homeAddressPhone.trim() : null,
      diagnosticCentre: isHome ? null : { name: selectedCentre?.name, location: selectedCentre?.location },
      bookingDate: selectedDate,
      timeSlot: selectedSlot?.label || '8:30 AM – 9:30 AM',
      amountPaid: total,
      testPrice: testPrice,
      collectionFee: collectionFee,
      status: 'CONFIRMED',
      trackingStage: 1,
      patientName: homeAddressName.trim() || 'Patient',
      phlebotomistName: isHome ? 'Muralidhar Rao (Senior Phlebotomist)' : null,
      phlebotomistPhone: isHome ? '+91 98452 33110' : null,
      reportReady: false,
    };

    setConfirmedBookingData(newBooking);
    setBookingsList([newBooking, ...bookingsList]);
    setBookingFlowStep(5);
  };

  // ===========================================================================
  // RENDER: POPULAR TESTS SECTION
  // ===========================================================================
  const popularTests = useMemo(() => {
    return LAB_TESTS_MASTER.filter((t) => t.popular).sort((a, b) => a.popularRank - b.popularRank);
  }, []);

  // Recommended Tests (Configured priority, NOT AI)
  const recommendedTests = useMemo(() => {
    return LAB_TESTS_MASTER.filter((t) => t.recommended).sort(
      (a, b) => a.recommendationPriority - b.recommendationPriority
    );
  }, []);

  // Featured Tests
  const featuredTests = useMemo(() => {
    return LAB_TESTS_MASTER.filter((t) => t.featured);
  }, []);

  // ===========================================================================
  // RENDER: LAB TEST CARD (Section 11)
  // ===========================================================================
  const renderLabTestCard = (test) => {
    return (
      <View key={test.id} style={styles.testCard}>
        {/* Badges Row */}
        <View style={styles.cardBadgesRow}>
          {test.popular && (
            <View style={styles.popularBadge}>
              <Ionicons name="flame" size={12} color="#FFFFFF" />
              <Text style={styles.popularBadgeText}>Popular #{test.popularRank}</Text>
            </View>
          )}
          {test.recommended && (
            <View style={styles.recommendedBadge}>
              <Ionicons name="thumbs-up" size={11} color="#1E3A8A" />
              <Text style={styles.recommendedBadgeText}>Recommended</Text>
            </View>
          )}
          {test.featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={11} color="#D97706" />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
          <View style={styles.sampleBadge}>
            <Ionicons
              name={test.sampleType === 'Blood' ? 'water' : test.sampleType === 'Urine' ? 'flask' : 'fitness'}
              size={11}
              color="#0284C7"
            />
            <Text style={styles.sampleBadgeText}>{test.sampleType}</Text>
          </View>
        </View>

        {/* Test Name & Description */}
        <TouchableOpacity onPress={() => setSelectedTest(test)} activeOpacity={0.8}>
          <Text style={styles.testCardTitle} numberOfLines={2}>
            {test.name}
          </Text>
        </TouchableOpacity>
        <Text style={styles.testCardDesc} numberOfLines={2}>
          {test.description}
        </Text>

        {/* Collection Availability Indicators (Section 11, 19, 20) */}
        <View style={styles.availabilityRow}>
          <View style={styles.availItem}>
            <Ionicons
              name={test.homeCollection ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={test.homeCollection ? '#00B894' : '#94A3B8'}
            />
            <Text style={[styles.availText, !test.homeCollection && styles.availTextDisabled]}>
              {test.homeCollection ? 'Home Collection' : 'No Home Collection'}
            </Text>
          </View>
          <View style={styles.availDivider} />
          <View style={styles.availItem}>
            <Ionicons
              name={test.centreCollection ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={test.centreCollection ? '#00B894' : '#94A3B8'}
            />
            <Text style={[styles.availText, !test.centreCollection && styles.availTextDisabled]}>
              {test.centreCollection ? 'Centre Collection' : 'No Centre Collection'}
            </Text>
          </View>
        </View>

        {/* Parameters & TAT snippet */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={styles.metaText}>TAT: {test.reportTAT}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="restaurant-outline" size={13} color="#64748B" />
            <Text style={styles.metaText}>{test.fastingRequirement.includes('Required') ? 'Fasting' : 'No Fasting'}</Text>
          </View>
        </View>

        {/* Price & Action Buttons */}
        <View style={styles.cardFooterRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={styles.testPriceText}>₹{test.price}</Text>
              {test.mrp && <Text style={styles.testMrpText}>₹{test.mrp}</Text>}
            </View>
            {test.discount && <Text style={styles.testDiscountText}>{test.discount}</Text>}
          </View>

          <View style={styles.cardBtnsRow}>
            <TouchableOpacity
              style={[styles.cartAddBtnSmall, isTestInCart(test.id) && styles.cartAddBtnSmallActive]}
              onPress={() => handleToggleCartTest(test)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isTestInCart(test.id) ? 'checkmark-circle' : 'cart-outline'}
                size={14}
                color={isTestInCart(test.id) ? '#FFFFFF' : '#00B894'}
              />
              <Text
                style={[
                  styles.cartAddBtnSmallText,
                  isTestInCart(test.id) && styles.cartAddBtnSmallTextActive,
                ]}
              >
                {isTestInCart(test.id) ? 'In Cart' : 'Add'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => setSelectedTest(test)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewDetailsBtnText}>Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookTestBtn}
              onPress={() => startBooking(test)}
              activeOpacity={0.85}
            >
              <Text style={styles.bookTestBtnText}>Book Test</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ===========================================================================
  // RENDER: MAIN DISCOVERY CONTENT (Section 1)
  // ===========================================================================
  const renderBrowseView = () => {
    return (
      <ScrollView
        ref={mainScrollRef}
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          width >= 600 && { maxWidth: 960, width: '100%', alignSelf: 'center' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner / Trust Header */}
        <View style={styles.heroHeaderBox}>
          <View style={styles.heroTextCol}>
            <View style={styles.heroMicroPill}>
              <Ionicons name="shield-checkmark" size={12} color="#00B894" />
              <Text style={styles.heroMicroPillText}>100% NABL & ICMR Certified Labs</Text>
            </View>
            <Text style={styles.mainTitle}>Lab Tests</Text>
            <Text style={styles.mainSubtitle}>
              Book diagnostic tests from trusted laboratory services
            </Text>
          </View>
        </View>

        {/* Search Bar (Section 7) */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#00B894" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by test name, sugar, CBC, lipid..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Filter Chips */}
        <View style={styles.filterChipsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
            {[
              { label: 'All Tests', active: selectedGenderFilter === 'ALL' && selectedCollectionFilter === 'ALL' && selectedSampleFilter === 'ALL', onPress: () => { setSelectedGenderFilter('ALL'); setSelectedCollectionFilter('ALL'); setSelectedSampleFilter('ALL'); } },
              { label: '🏠 Home Collection', active: selectedCollectionFilter === 'HOME', onPress: () => setSelectedCollectionFilter(selectedCollectionFilter === 'HOME' ? 'ALL' : 'HOME') },
              { label: '🏥 Lab Visit', active: selectedCollectionFilter === 'CENTRE', onPress: () => setSelectedCollectionFilter(selectedCollectionFilter === 'CENTRE' ? 'ALL' : 'CENTRE') },
              { label: "Women's", active: selectedGenderFilter === 'FEMALE', onPress: () => setSelectedGenderFilter(selectedGenderFilter === 'FEMALE' ? 'ALL' : 'FEMALE') },
              { label: "Men's", active: selectedGenderFilter === 'MALE', onPress: () => setSelectedGenderFilter(selectedGenderFilter === 'MALE' ? 'ALL' : 'MALE') },
              { label: 'Blood Tests', active: selectedSampleFilter === 'Blood', onPress: () => setSelectedSampleFilter(selectedSampleFilter === 'Blood' ? 'ALL' : 'Blood') },
              { label: 'Urine Tests', active: selectedSampleFilter === 'Urine', onPress: () => setSelectedSampleFilter(selectedSampleFilter === 'Urine' ? 'ALL' : 'Urine') },
            ].map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.filterChip, chip.active && styles.filterChipActive]}
                onPress={chip.onPress}
              >
                <Text style={[styles.filterChipText, chip.active && styles.filterChipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories Section (Section 2 & 4) */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>Test Categories</Text>
          {selectedCategory !== 'all' && (
            <TouchableOpacity onPress={() => { setSelectedCategory('all'); setSelectedSubCategory('all'); }}>
              <Text style={styles.seeAllLink}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {LAB_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
                onPress={() => {
                  if (isSelected) {
                    setSelectedCategory('all');
                    setSelectedSubCategory('all');
                  } else {
                    setSelectedCategory(cat.id);
                    setSelectedSubCategory('all');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIconCircle, isSelected && styles.categoryIconCircleActive]}>
                  <Ionicons name={cat.icon} size={22} color={isSelected ? '#FFFFFF' : '#00B894'} />
                </View>
                <Text style={[styles.categoryCardName, isSelected && styles.categoryCardNameActive]}>
                  {cat.name}
                </Text>
                <Text style={styles.categoryCardBadge}>{cat.badge}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sub-Categories (Section 3: Category -> Sub-category -> Tests) */}
        {activeCategoryObj && (
          <View style={styles.subCategoryRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subCategoryScroll}>
              <TouchableOpacity
                style={[styles.subCatChip, selectedSubCategory === 'all' && styles.subCatChipActive]}
                onPress={() => setSelectedSubCategory('all')}
              >
                <Text style={[styles.subCatChipText, selectedSubCategory === 'all' && styles.subCatChipTextActive]}>
                  All {activeCategoryObj.name}
                </Text>
              </TouchableOpacity>
              {activeCategoryObj.subCategories.map((sc) => {
                const isSubSel = selectedSubCategory === sc.id;
                return (
                  <TouchableOpacity
                    key={sc.id}
                    style={[styles.subCatChip, isSubSel && styles.subCatChipActive]}
                    onPress={() => setSelectedSubCategory(isSubSel ? 'all' : sc.id)}
                  >
                    <Text style={[styles.subCatChipText, isSubSel && styles.subCatChipTextActive]}>
                      {sc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Health Packages Carousel (Section 18) */}
        {selectedCategory === 'all' && !searchQuery && (
          <View style={styles.packagesSection}>
            <View style={styles.sectionHeaderWrap}>
              <View>
                <Text style={styles.sectionTitle}>Available Health Packages</Text>
                <Text style={styles.sectionSub}>Multiple bundled parameters with free doorstep collection</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packagesScroll}>
              {LAB_PACKAGES.map((pkg) => (
                <View key={pkg.id} style={styles.packageCard}>
                  <View style={styles.packageCardHeader}>
                    <View style={styles.packageBadgePill}>
                      <Text style={styles.packageBadgePillText}>{pkg.badge}</Text>
                    </View>
                    <Text style={styles.packageParamCount}>{pkg.includedCount} Tests Included</Text>
                  </View>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packageDesc} numberOfLines={2}>{pkg.description}</Text>
                  <View style={styles.packagePriceRow}>
                    <View>
                      <Text style={styles.packagePrice}>₹{pkg.price}</Text>
                      <Text style={styles.packageMrp}>₹{pkg.mrp}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={[styles.cartAddBtnSmall, isTestInCart(pkg.id) && styles.cartAddBtnSmallActive]}
                        onPress={() => handleToggleCartPackage(pkg)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name={isTestInCart(pkg.id) ? 'checkmark-circle' : 'cart-outline'}
                          size={13}
                          color={isTestInCart(pkg.id) ? '#FFFFFF' : '#00B894'}
                        />
                        <Text
                          style={[
                            styles.cartAddBtnSmallText,
                            isTestInCart(pkg.id) && styles.cartAddBtnSmallTextActive,
                          ]}
                        >
                          {isTestInCart(pkg.id) ? 'In Cart' : 'Add'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.packageViewBtn}
                        onPress={() => setSelectedPackage(pkg)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.packageViewBtnText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popular Tests Section (Section 8) */}
        {selectedCategory === 'all' && !searchQuery && (
          <View style={styles.curatedBlock}>
            <View style={styles.sectionHeaderWrap}>
              <View>
                <Text style={styles.sectionTitle}>Popular Tests</Text>
                <Text style={styles.sectionSub}>Most frequently prescribed routine diagnostic screenings</Text>
              </View>
            </View>
            {popularTests.slice(0, 3).map((test) => renderLabTestCard(test))}
          </View>
        )}

        {/* Recommended Tests (Section 9: Admin configured priority, NOT AI) */}
        {selectedCategory === 'all' && !searchQuery && (
          <View style={styles.curatedBlock}>
            <View style={styles.sectionHeaderWrap}>
              <View>
                <Text style={styles.sectionTitle}>Recommended Preventive Tests</Text>
                <Text style={styles.sectionSub}>Standard baseline wellness screenings recommended by clinical partners</Text>
              </View>
            </View>
            {recommendedTests.slice(0, 2).map((test) => renderLabTestCard(test))}
          </View>
        )}

        {/* Featured Tests (Section 10) */}
        {selectedCategory === 'all' && !searchQuery && (
          <View style={styles.curatedBlock}>
            <View style={styles.sectionHeaderWrap}>
              <View>
                <Text style={styles.sectionTitle}>Featured Tests</Text>
                <Text style={styles.sectionSub}>High accuracy rapid turnaround clinical assays</Text>
              </View>
            </View>
            {featuredTests.slice(0, 2).map((test) => renderLabTestCard(test))}
          </View>
        )}

        {/* All / Filtered Tests Catalog List */}
        <View style={styles.curatedBlock}>
          <View style={styles.sectionHeaderWrap}>
            <View>
              <Text style={styles.sectionTitle}>
                {searchQuery
                  ? `Search Results for "${searchQuery}"`
                  : selectedCategory !== 'all'
                  ? `${activeCategoryObj?.name} Tests`
                  : 'All Diagnostic Tests'}
              </Text>
              <Text style={styles.sectionSub}>{filteredTests.length} tests available</Text>
            </View>
          </View>

          {filteredTests.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Ionicons name="search-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyStateTitle}>No tests found</Text>
              <Text style={styles.emptyStateDesc}>
                We couldn't find any lab tests matching "{searchQuery}". Try searching for sugar, CBC, cholesterol, or thyroid.
              </Text>
              <TouchableOpacity
                style={styles.emptyResetBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedSubCategory('all');
                  setSelectedGenderFilter('ALL');
                  setSelectedSampleFilter('ALL');
                  setSelectedCollectionFilter('ALL');
                }}
              >
                <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTests.map((test) => renderLabTestCard(test))
          )}
        </View>

        {/* Diagnostic Centers Info Banner (Section 24) */}
        <View style={styles.centresSectionBox}>
          <View style={styles.centresHeader}>
            <Ionicons name="business" size={20} color="#00B894" />
            <Text style={styles.centresTitle}>Our Diagnostic Partners in Mysuru</Text>
          </View>
          <Text style={styles.centresDesc}>
            All sample processing is carried out in certified ISO/NABL accredited laboratory hubs with barcode tracking and digital verification.
          </Text>
          <View style={styles.centresList}>
            {DIAGNOSTIC_CENTRES.map((centre) => (
              <View key={centre.id} style={styles.centreSnippetRow}>
                <Ionicons name="medkit-outline" size={16} color="#00B894" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.centreSnippetName}>{centre.name}</Text>
                  <Text style={styles.centreSnippetLoc}>{centre.location} • {centre.distanceKm} km</Text>
                </View>
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={styles.ratingText}>{centre.rating}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  // ===========================================================================
  // RENDER: MY LAB BOOKINGS (Section 30, 31, 32)
  // ===========================================================================
  const renderBookingsView = () => {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          width >= 600 && { maxWidth: 960, width: '100%', alignSelf: 'center' },
        ]}
      >
        {/* Sub filter tabs */}
        <View style={styles.tabFiltersRow}>
          {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabFilterBtn, bookingsFilter === tab && styles.tabFilterBtnActive]}
              onPress={() => setBookingsFilter(tab)}
            >
              <Text style={[styles.tabFilterText, bookingsFilter === tab && styles.tabFilterTextActive]}>
                {tab === 'ALL' ? 'All Bookings' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredBookings.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>No Bookings Found</Text>
            <Text style={styles.emptyStateDesc}>
              You don't have any lab test bookings in this section.
            </Text>
            <TouchableOpacity style={styles.emptyResetBtn} onPress={() => setActiveTab('BROWSE')}>
              <Text style={styles.emptyResetBtnText}>Book a Lab Test</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredBookings.map((b) => (
            <View key={b.id} style={styles.bookingCard}>
              <View style={styles.bookingCardHeader}>
                <View>
                  <Text style={styles.bookingIdText}>{b.id}</Text>
                  <Text style={styles.bookingDateText}>
                    {b.bookingDate} • {b.timeSlot}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    b.status === 'COMPLETED'
                      ? styles.statusCompleted
                      : b.status === 'CANCELLED'
                      ? styles.statusCancelled
                      : styles.statusConfirmed,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      b.status === 'COMPLETED'
                        ? styles.statusCompletedText
                        : b.status === 'CANCELLED'
                        ? styles.statusCancelledText
                        : styles.statusConfirmedText,
                    ]}
                  >
                    {b.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.bookingTestName}>{b.testName}</Text>

              <View style={styles.bookingDetailsBox}>
                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Collection Method:</Text>
                  <Text style={styles.bookingDetailVal}>
                    {b.collectionMethod === 'HOME' ? '🏠 Home Collection' : '🏥 Centre Collection'}
                  </Text>
                </View>
                {b.collectionMethod === 'HOME' && (
                  <View style={styles.bookingDetailRow}>
                    <Text style={styles.bookingDetailLabel}>Address:</Text>
                    <Text style={styles.bookingDetailVal} numberOfLines={1}>
                      {b.collectionAddress}
                    </Text>
                  </View>
                )}
                {b.collectionMethod === 'CENTRE' && (
                  <View style={styles.bookingDetailRow}>
                    <Text style={styles.bookingDetailLabel}>Diagnostic Centre:</Text>
                    <Text style={styles.bookingDetailVal} numberOfLines={1}>
                      {b.diagnosticCentre?.name}
                    </Text>
                  </View>
                )}
                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Amount Paid:</Text>
                  <Text style={styles.bookingPriceVal}>₹{b.amountPaid}</Text>
                </View>
              </View>

              <View style={styles.bookingActionsRow}>
                <TouchableOpacity
                  style={styles.trackBookingBtn}
                  onPress={() => setSelectedTrackingBooking(b)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="pulse" size={14} color="#00B894" />
                  <Text style={styles.trackBookingBtnText}>Track Sample Status</Text>
                </TouchableOpacity>

                {b.reportReady && (
                  <TouchableOpacity
                    style={styles.viewReportActionBtn}
                    onPress={() => {
                      const rep = reportsList.find((r) => r.bookingId === b.id);
                      if (rep) setSelectedReport(rep);
                      else setActiveTab('REPORTS');
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="document-text" size={14} color="#FFFFFF" />
                    <Text style={styles.viewReportActionBtnText}>View Report</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  // ===========================================================================
  // RENDER: MY LAB REPORTS (Section 33, 34, 35)
  // ===========================================================================
  const renderReportsView = () => {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          width >= 600 && { maxWidth: 960, width: '100%', alignSelf: 'center' },
        ]}
      >
        <View style={styles.reportsHeaderBanner}>
          <Ionicons name="document-attach" size={24} color="#00B894" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.reportsBannerTitle}>Certified Laboratory Reports</Text>
            <Text style={styles.reportsBannerSub}>
              Digitally verified by registered pathologists and available for download 24/7.
            </Text>
          </View>
        </View>

        {reportsList.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>No Reports Available</Text>
            <Text style={styles.emptyStateDesc}>
              Your completed lab test reports will appear here as soon as processing is completed.
            </Text>
          </View>
        ) : (
          reportsList.map((rep) => (
            <View key={rep.id} style={styles.reportCard}>
              <View style={styles.reportCardTop}>
                <View>
                  <Text style={styles.reportCardId}>{rep.id}</Text>
                  <Text style={styles.reportTestName}>{rep.testName}</Text>
                </View>
                <View style={styles.reportReadyPill}>
                  <Ionicons name="checkmark-circle" size={13} color="#15803D" />
                  <Text style={styles.reportReadyPillText}>Ready</Text>
                </View>
              </View>

              <View style={styles.reportMetaGrid}>
                <View style={styles.reportMetaItem}>
                  <Text style={styles.reportMetaLabel}>Lab Centre</Text>
                  <Text style={styles.reportMetaVal} numberOfLines={1}>{rep.labName}</Text>
                </View>
                <View style={styles.reportMetaItem}>
                  <Text style={styles.reportMetaLabel}>Sample Collected</Text>
                  <Text style={styles.reportMetaVal}>{rep.sampleCollectionDate}</Text>
                </View>
                <View style={styles.reportMetaItem}>
                  <Text style={styles.reportMetaLabel}>Report Released</Text>
                  <Text style={styles.reportMetaVal}>{rep.reportDate}</Text>
                </View>
                <View style={styles.reportMetaItem}>
                  <Text style={styles.reportMetaLabel}>Verified By</Text>
                  <Text style={styles.reportMetaVal} numberOfLines={1}>{rep.pathologistVerified}</Text>
                </View>
              </View>

              <View style={styles.reportCardActions}>
                <TouchableOpacity
                  style={styles.reportDownloadBtn}
                  onPress={() => {
                    setShowDownloadToast(true);
                    setTimeout(() => setShowDownloadToast(false), 3000);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="download-outline" size={15} color="#00B894" />
                  <Text style={styles.reportDownloadBtnText}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reportViewFullBtn}
                  onPress={() => setSelectedReport(rep)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.reportViewFullBtnText}>View Full Report</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  // ===========================================================================
  // MODAL 1: TEST DETAILS (Section 12, 13, 14, 15, 16, 17)
  // ===========================================================================
  const renderTestDetailsModal = () => {
    if (!selectedTest) return null;
    const t = selectedTest;

    return (
      <Modal visible={!!selectedTest} animationType="slide" transparent onRequestClose={() => setSelectedTest(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle} numberOfLines={2}>{t.name}</Text>
                <Text style={styles.modalHeaderSubtitle}>Clinical Laboratory Assay</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTest(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '72%' }}>
              {/* Description */}
              <View style={styles.detailsSectionBlock}>
                <Text style={styles.detailsBlockTitle}>Clinical Overview</Text>
                <Text style={styles.detailsBlockDesc}>{t.description}</Text>
              </View>

              {/* Applicability Badges (Section 5 & 6) */}
              <View style={styles.applicabilityRow}>
                <View style={styles.appliBadge}>
                  <Ionicons name="person-outline" size={14} color="#00B894" />
                  <Text style={styles.appliBadgeText}>Gender: {t.genderApplicability}</Text>
                </View>
                <View style={styles.appliBadge}>
                  <Ionicons name="calendar-outline" size={14} color="#0284C7" />
                  <Text style={styles.appliBadgeText}>Age: {t.ageApplicability}</Text>
                </View>
                <View style={styles.appliBadge}>
                  <Ionicons name="water-outline" size={14} color="#EA580C" />
                  <Text style={styles.appliBadgeText}>Sample: {t.sampleType}</Text>
                </View>
              </View>

              {/* Fasting & Preparation (Section 14 & 15) */}
              <View style={styles.instructionCard}>
                <View style={styles.instructionHeader}>
                  <Ionicons name="restaurant" size={16} color="#D97706" />
                  <Text style={styles.instructionTitle}>Fasting Requirement</Text>
                </View>
                <Text style={styles.instructionBody}>{t.fastingRequirement}</Text>
              </View>

              <View style={styles.instructionCard}>
                <View style={styles.instructionHeader}>
                  <Ionicons name="document-text" size={16} color="#0284C7" />
                  <Text style={styles.instructionTitle}>Preparation Instructions</Text>
                </View>
                <Text style={styles.instructionBody}>{t.preparation}</Text>
              </View>

              {/* Timing & TAT (Section 16 & 17) */}
              <View style={styles.detailsTwoColGrid}>
                <View style={styles.detailsColBox}>
                  <Ionicons name="alarm-outline" size={18} color="#00B894" />
                  <Text style={styles.colBoxTitle}>Timing</Text>
                  <Text style={styles.colBoxVal}>{t.timingInstructions}</Text>
                </View>
                <View style={styles.detailsColBox}>
                  <Ionicons name="hourglass-outline" size={18} color="#00B894" />
                  <Text style={styles.colBoxTitle}>Expected Report TAT</Text>
                  <Text style={styles.colBoxVal}>{t.reportTAT}</Text>
                </View>
              </View>

              {/* Collection Methods Available (Section 19 & 20) */}
              <View style={styles.collectionOptionsBlock}>
                <Text style={styles.detailsBlockTitle}>How would you like to provide your sample?</Text>
                {t.homeCollection && (
                  <View style={styles.methodOptionCard}>
                    <Ionicons name="home" size={20} color="#00B894" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.methodOptionTitle}>🏠 Home Collection (Available)</Text>
                      <Text style={styles.methodOptionDesc}>Phlebotomist collects sample from your doorstep.</Text>
                    </View>
                  </View>
                )}
                {t.centreCollection && (
                  <View style={styles.methodOptionCard}>
                    <Ionicons name="business" size={20} color="#0284C7" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.methodOptionTitle}>🏥 Centre Collection (Available)</Text>
                      <Text style={styles.methodOptionDesc}>Visit any verified partner diagnostic lab in Mysuru.</Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Bottom Booking CTA */}
            <View style={styles.modalFooterRow}>
              <View>
                <Text style={styles.modalPriceText}>₹{t.price}</Text>
                {t.mrp && <Text style={styles.modalMrpText}>₹{t.mrp}</Text>}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[
                    styles.cartAddBtnSmall,
                    isTestInCart(t.id) && styles.cartAddBtnSmallActive,
                    { paddingVertical: 10, paddingHorizontal: 14 },
                  ]}
                  onPress={() => handleToggleCartTest(t)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={isTestInCart(t.id) ? 'checkmark-circle' : 'cart-outline'}
                    size={15}
                    color={isTestInCart(t.id) ? '#FFFFFF' : '#00B894'}
                  />
                  <Text
                    style={[
                      styles.cartAddBtnSmallText,
                      isTestInCart(t.id) && styles.cartAddBtnSmallTextActive,
                      { fontSize: 13 },
                    ]}
                  >
                    {isTestInCart(t.id) ? 'In Cart' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    const target = t;
                    setSelectedTest(null);
                    startBooking(target);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.modalPrimaryBtnText}>Proceed to Book →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ===========================================================================
  // MODAL 2: PACKAGE DETAILS MODAL (Section 18)
  // ===========================================================================
  const renderPackageModal = () => {
    if (!selectedPackage) return null;
    const pkg = selectedPackage;
    const includedTests = LAB_TESTS_MASTER.filter((t) => pkg.testIds.includes(t.id));

    return (
      <Modal visible={!!selectedPackage} animationType="slide" transparent onRequestClose={() => setSelectedPackage(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>{pkg.name}</Text>
                <Text style={styles.modalHeaderSubtitle}>{pkg.includedCount} Comprehensive Clinical Parameters</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPackage(null)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: '72%' }} showsVerticalScrollIndicator={false}>
              <Text style={styles.packageModalDesc}>{pkg.description}</Text>
              <Text style={styles.includedSectionHeader}>Individual Tests Included ({includedTests.length})</Text>

              {includedTests.map((test) => (
                <TouchableOpacity
                  key={test.id}
                  style={styles.includedItemRow}
                  onPress={() => {
                    setSelectedPackage(null);
                    setSelectedTest(test);
                  }}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#00B894" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.includedItemName}>{test.name}</Text>
                    <Text style={styles.includedItemDesc} numberOfLines={1}>{test.description}</Text>
                  </View>
                  <Text style={styles.includedItemDetailsLink}>Details →</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <View>
                <Text style={styles.modalPriceText}>₹{pkg.price}</Text>
                <Text style={styles.modalMrpText}>₹{pkg.mrp}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[
                    styles.cartAddBtnSmall,
                    isTestInCart(pkg.id) && styles.cartAddBtnSmallActive,
                    { paddingVertical: 10, paddingHorizontal: 14 },
                  ]}
                  onPress={() => handleToggleCartPackage(pkg)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={isTestInCart(pkg.id) ? 'checkmark-circle' : 'cart-outline'}
                    size={15}
                    color={isTestInCart(pkg.id) ? '#FFFFFF' : '#00B894'}
                  />
                  <Text
                    style={[
                      styles.cartAddBtnSmallText,
                      isTestInCart(pkg.id) && styles.cartAddBtnSmallTextActive,
                      { fontSize: 13 },
                    ]}
                  >
                    {isTestInCart(pkg.id) ? 'In Cart' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    // Book primary test of package or first test
                    const primaryTest = includedTests[0];
                    setSelectedPackage(null);
                    if (primaryTest) startBooking(primaryTest);
                  }}
                >
                  <Text style={styles.modalPrimaryBtnText}>Book Package →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ===========================================================================
  // MODAL 3: BOOKING FLOW (Section 21, 22, 23, 25, 26, 27, 28, 29)
  // ===========================================================================
  const renderBookingFlowModal = () => {
    if (!activeBookingTest) return null;
    const test = activeBookingTest;
    const isHome = collectionMethod === 'HOME';
    const testPrice = test.price;
    const collectionFee = isHome ? 100 : 0;
    const totalPrice = testPrice + collectionFee;
    const availableDates = getAvailableDates();
    const selectedCentre = DIAGNOSTIC_CENTRES.find((c) => c.id === selectedCentreId);

    return (
      <Modal visible={!!activeBookingTest} animationType="slide" transparent onRequestClose={() => setActiveBookingTest(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.bookingModalContent}>
            {/* Modal Header with Step indicator */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingStepHeaderTitle}>
                  {bookingFlowStep === 1
                    ? '1. Select Collection Method'
                    : bookingFlowStep === 2
                    ? '2. Select Slot & Address'
                    : bookingFlowStep === 3
                    ? '3. Booking Summary'
                    : bookingFlowStep === 4
                    ? '4. Payment'
                    : 'Booking Confirmed'}
                </Text>
                <Text style={styles.bookingStepHeaderSub}>{test.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveBookingTest(null)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* STEP 1: SELECT COLLECTION METHOD (Section 21) */}
            {bookingFlowStep === 1 && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '72%' }}>
                <Text style={styles.stepPromptText}>How would you like to provide your sample?</Text>

                {test.homeCollection && (
                  <TouchableOpacity
                    style={[styles.methodSelectCard, isHome && styles.methodSelectCardActive]}
                    onPress={() => setCollectionMethod('HOME')}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.methodRadio, isHome && styles.methodRadioActive]}>
                      {isHome && <View style={styles.methodRadioInner} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.methodSelectTitle}>🏠 Home Sample Collection</Text>
                      <Text style={styles.methodSelectSub}>
                        Trained certified phlebotomist visits your selected address. Barcoded sample vials with cold chain.
                      </Text>
                      <Text style={styles.methodFeeTag}>Doorstep Collection Fee: ₹100</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {test.centreCollection && (
                  <TouchableOpacity
                    style={[styles.methodSelectCard, !isHome && styles.methodSelectCardActive]}
                    onPress={() => setCollectionMethod('CENTRE')}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.methodRadio, !isHome && styles.methodRadioActive]}>
                      {!isHome && <View style={styles.methodRadioInner} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.methodSelectTitle}>🏥 Diagnostic Centre Visit</Text>
                      <Text style={styles.methodSelectSub}>
                        Walk into any verified clinical laboratory partner in Mysuru. Dedicated fast-track queue.
                      </Text>
                      <Text style={[styles.methodFeeTag, { color: '#00B894' }]}>Collection Fee: FREE (₹0)</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}

            {/* STEP 2: ADDRESS & DATE / TIME SLOT (Section 22, 23, 25, 26) */}
            {bookingFlowStep === 2 && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '72%' }}>
                {/* If Home Collection: Manual Address Entry */}
                {isHome ? (
                  <View style={styles.stepBlock}>
                    <View style={styles.manualAddressHeader}>
                      <Ionicons name="home" size={18} color="#00B894" />
                      <Text style={styles.stepBlockTitle}>Sample Collection Address</Text>
                    </View>
                    <Text style={styles.manualAddressSubtitle}>Enter the address where the phlebotomist should visit</Text>

                    <Text style={styles.addressFieldLabel}>Patient / Contact Name *</Text>
                    <TextInput
                      style={styles.addressFieldInput}
                      placeholder="e.g. Hemanth Gowda"
                      placeholderTextColor="#94A3B8"
                      value={homeAddressName}
                      onChangeText={setHomeAddressName}
                    />

                    <Text style={styles.addressFieldLabel}>Contact Phone *</Text>
                    <TextInput
                      style={styles.addressFieldInput}
                      placeholder="e.g. 9741422544"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={homeAddressPhone}
                      onChangeText={setHomeAddressPhone}
                    />

                    <Text style={styles.addressFieldLabel}>Flat / House No., Street, Area *</Text>
                    <TextInput
                      style={styles.addressFieldInput}
                      placeholder="e.g. 12/A, 3rd Cross, Vijayanagar"
                      placeholderTextColor="#94A3B8"
                      value={homeAddressFlat}
                      onChangeText={setHomeAddressFlat}
                    />

                    <View style={styles.addressRowFields}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addressFieldLabel}>City *</Text>
                        <TextInput
                          style={styles.addressFieldInput}
                          placeholder="e.g. Mysuru"
                          placeholderTextColor="#94A3B8"
                          value={homeAddressCity}
                          onChangeText={setHomeAddressCity}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.addressFieldLabel}>Pincode *</Text>
                        <TextInput
                          style={styles.addressFieldInput}
                          placeholder="e.g. 570023"
                          placeholderTextColor="#94A3B8"
                          keyboardType="number-pad"
                          maxLength={6}
                          value={homeAddressPincode}
                          onChangeText={setHomeAddressPincode}
                        />
                      </View>
                    </View>

                    <Text style={styles.addressFieldLabel}>Landmark (Optional)</Text>
                    <TextInput
                      style={styles.addressFieldInput}
                      placeholder="e.g. Near City Hospital"
                      placeholderTextColor="#94A3B8"
                      value={homeAddressLandmark}
                      onChangeText={setHomeAddressLandmark}
                    />
                  </View>
                ) : (
                  /* If Centre Collection: Select Diagnostic Centre (Section 24) */
                  <View style={styles.stepBlock}>
                    <Text style={styles.stepBlockTitle}>Select Diagnostic Centre</Text>
                    {DIAGNOSTIC_CENTRES.map((centre) => {
                      const isSel = selectedCentreId === centre.id;
                      return (
                        <TouchableOpacity
                          key={centre.id}
                          style={[styles.centreSelectCard, isSel && styles.centreSelectCardActive]}
                          onPress={() => setSelectedCentreId(centre.id)}
                        >
                          <Ionicons name="business-outline" size={20} color={isSel ? '#00B894' : '#64748B'} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.centreSelectName}>{centre.name}</Text>
                            <Text style={styles.centreSelectAddress}>{centre.address}</Text>
                            <View style={styles.centreMetaRow}>
                              <Text style={styles.centreMetaText}>⭐ {centre.rating} ({centre.reviewsCount}+ reviews)</Text>
                              <Text style={styles.centreMetaText}>• {centre.distanceKm} km away</Text>
                            </View>
                          </View>
                          {isSel && <Ionicons name="checkmark-circle" size={18} color="#00B894" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Date Selector (Section 26) */}
                <View style={styles.stepBlock}>
                  <Text style={styles.stepBlockTitle}>Select Date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePillsRow}>
                    {availableDates.map((item) => {
                      const isSel = selectedDate === item.dateStr;
                      return (
                        <TouchableOpacity
                          key={item.dateStr}
                          style={[styles.datePill, isSel && styles.datePillActive]}
                          onPress={() => setSelectedDate(item.dateStr)}
                        >
                          <Text style={[styles.datePillDay, isSel && styles.datePillDayActive]}>{item.dayName}</Text>
                          <Text style={[styles.datePillDate, isSel && styles.datePillDateActive]}>{item.dateStr}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Time Slots (Section 26) */}
                <View style={styles.stepBlock}>
                  <Text style={styles.stepBlockTitle}>Available Time Slots</Text>
                  <View style={styles.slotGrid}>
                    {TIME_SLOTS.map((slot) => {
                      const isSel = selectedSlotId === slot.id;
                      return (
                        <TouchableOpacity
                          key={slot.id}
                          style={[styles.slotCard, isSel && styles.slotCardActive]}
                          onPress={() => setSelectedSlotId(slot.id)}
                        >
                          <Text style={[styles.slotLabel, isSel && styles.slotLabelActive]}>{slot.label}</Text>
                          <Text style={styles.slotPeriod}>{slot.period}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            )}

            {/* STEP 3: BOOKING SUMMARY (Section 27) */}
            {bookingFlowStep === 3 && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '72%' }}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryHeading}>Order Summary</Text>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Test Name:</Text>
                    <Text style={styles.summaryVal}>{test.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Collection Method:</Text>
                    <Text style={styles.summaryVal}>{isHome ? '🏠 Home Collection' : '🏥 Diagnostic Centre'}</Text>
                  </View>
                  {isHome ? (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Address:</Text>
                      <Text style={styles.summaryVal} numberOfLines={2}>
                        {homeAddressFlat ? `${homeAddressFlat}, ${homeAddressCity} - ${homeAddressPincode}` : 'Not provided'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Centre:</Text>
                      <Text style={styles.summaryVal} numberOfLines={2}>{selectedCentre?.name}</Text>
                    </View>
                  )}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Date & Time:</Text>
                    <Text style={styles.summaryVal}>{selectedDate} • {TIME_SLOTS.find((s) => s.id === selectedSlotId)?.label}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Test Fee:</Text>
                    <Text style={styles.summaryVal}>₹{testPrice}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Collection Charge:</Text>
                    <Text style={styles.summaryVal}>{collectionFee === 0 ? 'FREE' : `₹${collectionFee}`}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryTotalRow}>
                    <Text style={styles.summaryTotalLabel}>Total Amount:</Text>
                    <Text style={styles.summaryTotalVal}>₹{totalPrice}</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* STEP 4: PAYMENT UI - FRONTEND DEMO ONLY (Section 28) */}
            {bookingFlowStep === 4 && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '72%' }}>
                <View style={styles.demoPaymentAlert}>
                  <Ionicons name="information-circle" size={18} color="#0284C7" />
                  <Text style={styles.demoPaymentAlertText}>
                    Frontend Prototype: Simulating payment flow. No real transaction will occur.
                  </Text>
                </View>

                <Text style={styles.stepBlockTitle}>Select Payment Method</Text>

                {[
                  { id: 'UPI', label: 'UPI / Google Pay / PhonePe', icon: 'flash' },
                  { id: 'CARD', label: 'Credit / Debit Card', icon: 'card' },
                  { id: 'NET_BANKING', label: 'Net Banking', icon: 'globe' },
                  { id: 'WALLET', label: 'Digital Wallet / Pay at Sample Collection', icon: 'wallet' },
                ].map((m) => {
                  const isSel = paymentMethod === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.paymentMethodCard, isSel && styles.paymentMethodCardActive]}
                      onPress={() => setPaymentMethod(m.id)}
                    >
                      <Ionicons name={m.icon} size={20} color={isSel ? '#00B894' : '#64748B'} />
                      <Text style={[styles.paymentMethodLabel, isSel && styles.paymentMethodLabelActive]}>
                        {m.label}
                      </Text>
                      {isSel && <Ionicons name="checkmark-circle" size={18} color="#00B894" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* STEP 5: BOOKING CONFIRMED (Section 29) */}
            {bookingFlowStep === 5 && confirmedBookingData && (
              <View style={styles.confirmedBox}>
                <Ionicons name="checkmark-circle" size={60} color="#00B894" />
                <Text style={styles.confirmedTitle}>Booking Confirmed!</Text>
                <Text style={styles.confirmedBookingId}>Booking ID: {confirmedBookingData.id}</Text>
                <Text style={styles.confirmedDesc}>
                  Your appointment for {confirmedBookingData.testName} has been booked for {confirmedBookingData.bookingDate} ({confirmedBookingData.timeSlot}).
                </Text>

                <View style={styles.confirmedMetaBox}>
                  <Text style={styles.confirmedMetaText}>
                    {confirmedBookingData.collectionMethod === 'HOME'
                      ? `Phlebotomist assigned: ${confirmedBookingData.phlebotomistName}`
                      : `Diagnostic Centre: ${confirmedBookingData.diagnosticCentre?.name}`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.viewBookingsConfirmedBtn}
                  onPress={() => {
                    setActiveBookingTest(null);
                    setActiveTab('BOOKINGS');
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.viewBookingsConfirmedBtnText}>View My Lab Bookings →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Modal Bottom Controls */}
            {bookingFlowStep < 5 && (
              <View style={styles.modalFooterRow}>
                {bookingFlowStep > 1 && (
                  <TouchableOpacity
                    style={styles.stepBackBtn}
                    onPress={() => setBookingFlowStep(bookingFlowStep - 1)}
                  >
                    <Text style={styles.stepBackBtnText}>Back</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modalPrimaryBtn, { flex: 1, marginLeft: bookingFlowStep > 1 ? 10 : 0 }]}
                  onPress={() => {
                    if (bookingFlowStep === 1) setBookingFlowStep(2);
                    else if (bookingFlowStep === 2) {
                      if (collectionMethod === 'HOME' && (!homeAddressName.trim() || !homeAddressPhone.trim() || !homeAddressFlat.trim() || !homeAddressCity.trim() || !homeAddressPincode.trim())) {
                        Alert.alert('Required Details', 'Please fill in Patient Name, Phone, Address, City and Pincode for home sample collection.');
                        return;
                      }
                      setBookingFlowStep(3);
                    }
                    else if (bookingFlowStep === 3) setBookingFlowStep(4);
                    else if (bookingFlowStep === 4) handleSimulatePayment();
                  }}
                >
                  <Text style={styles.modalPrimaryBtnText}>
                    {bookingFlowStep === 1
                      ? 'Continue to Slots'
                      : bookingFlowStep === 2
                      ? 'Review Summary'
                      : bookingFlowStep === 3
                      ? 'Proceed to Pay'
                      : `Pay ₹${totalPrice}`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // ===========================================================================
  // MODAL 4: TRACKING SAMPLE COLLECTION STATUS (Section 31 & 32)
  // ===========================================================================
  const renderTrackingModal = () => {
    if (!selectedTrackingBooking) return null;
    const b = selectedTrackingBooking;

    const stages = [
      { id: 1, title: 'Test Booked', desc: 'Booking confirmed on portal' },
      { id: 2, title: 'Sample Collection Scheduled', desc: `${b.bookingDate}, ${b.timeSlot}` },
      { id: 3, title: 'Sample Collected', desc: 'Barcoded and placed in temperature transport' },
      { id: 4, title: 'Lab Processing', desc: 'Automated clinical chemistry analyzers' },
      { id: 5, title: 'Report Ready', desc: 'Verified by Pathologist & available online' },
    ];

    return (
      <Modal visible={!!selectedTrackingBooking} animationType="slide" transparent onRequestClose={() => setSelectedTrackingBooking(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Sample Tracking</Text>
                <Text style={styles.modalHeaderSubtitle}>Booking ID: {b.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTrackingBooking(null)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '70%' }}>
              <Text style={styles.trackingTestTitle}>{b.testName}</Text>

              {/* Timeline (Section 31 & 32) */}
              <View style={styles.timelineContainer}>
                {stages.map((stage, idx) => {
                  const isDone = b.trackingStage >= stage.id;
                  const isCurr = b.trackingStage === stage.id;
                  return (
                    <View key={stage.id} style={styles.timelineStepRow}>
                      <View style={styles.timelineIconCol}>
                        <View style={[styles.timelineNode, isDone && styles.timelineNodeDone, isCurr && styles.timelineNodeCurr]}>
                          <Ionicons name={isDone ? 'checkmark' : 'ellipse'} size={12} color="#FFFFFF" />
                        </View>
                        {idx < stages.length - 1 && (
                          <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                        )}
                      </View>
                      <View style={styles.timelineTextCol}>
                        <Text style={[styles.timelineStepTitle, isCurr && styles.timelineStepTitleCurr]}>
                          {stage.title}
                        </Text>
                        <Text style={styles.timelineStepDesc}>{stage.desc}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setSelectedTrackingBooking(null)}>
              <Text style={styles.modalPrimaryBtnText}>Close Tracker</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ===========================================================================
  // MODAL 5: DETAILED LAB REPORT VIEWER (Section 34 & 35)
  // ===========================================================================
  const renderReportDetailsModal = () => {
    if (!selectedReport) return null;
    const r = selectedReport;

    return (
      <Modal visible={!!selectedReport} animationType="slide" transparent onRequestClose={() => setSelectedReport(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalContent}>
            {/* Report Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportModalTitle}>{r.testName}</Text>
                <Text style={styles.reportModalSub}>{r.labName}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedReport(null)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '72%' }}>
              {/* Patient and verification box */}
              <View style={styles.reportPatientCard}>
                <View style={styles.reportPatientRow}>
                  <Text style={styles.repPatientLabel}>Patient:</Text>
                  <Text style={styles.repPatientVal}>{r.patientName} ({r.patientAge}, {r.patientGender})</Text>
                </View>
                <View style={styles.reportPatientRow}>
                  <Text style={styles.repPatientLabel}>Referred By:</Text>
                  <Text style={styles.repPatientVal}>{r.doctorReferred}</Text>
                </View>
                <View style={styles.reportPatientRow}>
                  <Text style={styles.repPatientLabel}>Collection Date:</Text>
                  <Text style={styles.repPatientVal}>{r.sampleCollectionDate}</Text>
                </View>
                <View style={styles.reportPatientRow}>
                  <Text style={styles.repPatientLabel}>Report Status:</Text>
                  <Text style={[styles.repPatientVal, { color: '#00B894', fontWeight: '700' }]}>✓ Verified & Released</Text>
                </View>
              </View>

              {/* Quantitative Parameters & Reference Ranges Table (Section 34) */}
              <Text style={styles.tableHeading}>Observed Test Parameters</Text>
              <View style={styles.paramsTable}>
                <View style={styles.paramsTableHeader}>
                  <Text style={[styles.paramsTableColHeader, { flex: 2.2 }]}>Parameter</Text>
                  <Text style={[styles.paramsTableColHeader, { flex: 1.2, textAlign: 'right' }]}>Result</Text>
                  <Text style={[styles.paramsTableColHeader, { flex: 1.8, textAlign: 'right' }]}>Ref Range</Text>
                </View>

                {r.parameters.map((param, pIdx) => (
                  <View key={pIdx} style={styles.paramTableRow}>
                    <View style={{ flex: 2.2 }}>
                      <Text style={styles.paramNameText}>{param.name}</Text>
                      <Text style={styles.paramUnitText}>Unit: {param.unit}</Text>
                    </View>
                    <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                      <Text style={[styles.paramResultText, param.status === 'BORDERLINE' && { color: '#D97706' }]}>
                        {param.observed}
                      </Text>
                      <Text style={styles.paramUnitSub}>{param.unit}</Text>
                    </View>
                    <Text style={[styles.paramRefText, { flex: 1.8 }]}>{param.reference}</Text>
                  </View>
                ))}
              </View>

              {/* Pathologist Conclusion & Stamp */}
              <View style={styles.conclusionCard}>
                <Text style={styles.conclusionTitle}>Pathologist Impression:</Text>
                <Text style={styles.conclusionText}>{r.clinicalConclusion}</Text>
                <View style={styles.conclusionSignRow}>
                  <Ionicons name="checkmark-done-circle" size={16} color="#00B894" />
                  <Text style={styles.conclusionSignText}>{r.pathologistVerified}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Footer: Download Report & View in My Health (Section 34 & 35) */}
            <View style={styles.reportModalFooter}>
              <TouchableOpacity
                style={styles.reportDownloadModalBtn}
                onPress={() => {
                  setShowDownloadToast(true);
                  setTimeout(() => setShowDownloadToast(false), 3000);
                }}
              >
                <Ionicons name="download" size={16} color="#00B894" />
                <Text style={styles.reportDownloadModalBtnText}>Download PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportMyHealthBtn}
                onPress={() => {
                  setSelectedReport(null);
                  navigation.navigate('HealthRecords');
                }}
              >
                <Ionicons name="heart" size={16} color="#FFFFFF" />
                <Text style={styles.reportMyHealthBtnText}>View in My Health</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header Bar */}
      <View style={[styles.topNavBar, width >= 600 && { maxWidth: 960, width: '100%', alignSelf: 'center' }]}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => (activeTab !== 'BROWSE' ? setActiveTab('BROWSE') : navigation.goBack())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>
            {activeTab === 'REPORTS' ? 'My Lab Reports' : activeTab === 'BOOKINGS' ? 'My Bookings' : 'Lab Tests'}
          </Text>
          <Text style={styles.headerSub}>Mysuru Healthcare Hub</Text>
        </View>

        <TouchableOpacity
          style={styles.headerCartIconBtn}
          onPress={() => setActiveTab(activeTab === 'REPORTS' ? 'BROWSE' : 'REPORTS')}
        >
          <Ionicons name={activeTab === 'REPORTS' ? 'flask-outline' : 'document-text-outline'} size={22} color="#00B894" />
          {reportsList.length > 0 && activeTab !== 'REPORTS' && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{reportsList.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Download Toast */}
      {showDownloadToast && (
        <View style={styles.toastBox}>
          <Ionicons name="cloud-download" size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>Official PDF Report downloaded successfully.</Text>
        </View>
      )}

      {/* Active Tab View */}
      {activeTab === 'BROWSE' && renderBrowseView()}
      {activeTab === 'BOOKINGS' && renderBookingsView()}
      {activeTab === 'REPORTS' && renderReportsView()}

      {/* Modals */}
      {renderTestDetailsModal()}
      {renderPackageModal()}
      {renderBookingFlowModal()}
      {renderTrackingModal()}
      {renderReportDetailsModal()}

      {/* FLOATING CART BAR FOR MOBILE */}
      {labCartCount > 0 && activeTab === 'BROWSE' && (
        <View style={styles.mobileFloatingCartBar}>
          <View style={styles.mobileFloatingCartInfo}>
            <View style={styles.mobileFloatingCartBadge}>
              <Ionicons name="flask" size={16} color="#FFFFFF" />
              <Text style={styles.mobileFloatingCartBadgeText}>{labCartCount}</Text>
            </View>
            <View>
              <Text style={styles.mobileFloatingCartTitle}>Tests Added</Text>
              <Text style={styles.mobileFloatingCartPrice}>₹{labFinalTotal}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.mobileFloatingCartBtn}
            onPress={() => navigation.navigate('Cart', { initialTab: 'lab' })}
            activeOpacity={0.88}
          >
            <Text style={styles.mobileFloatingCartBtnText}>View Lab Cart</Text>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  cartAddBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00B894',
    backgroundColor: '#F0FDF4',
  },
  cartAddBtnSmallActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  cartAddBtnSmallText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#00B894',
  },
  cartAddBtnSmallTextActive: {
    color: '#FFFFFF',
  },
  mobileFloatingCartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  mobileFloatingCartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileFloatingCartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00B894',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mobileFloatingCartBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mobileFloatingCartTitle: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  mobileFloatingCartPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mobileFloatingCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00B894',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mobileFloatingCartBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
  },
  headerCartIconBtn: {
    position: 'relative',
    padding: 6,
  },
  headerBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  segmentedTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  segmentedTabActive: {
    backgroundColor: '#E6F9F4',
    borderWidth: 1,
    borderColor: '#00B894',
  },
  segmentedTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentedTabTextActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  toastBox: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Hero Box
  heroHeaderBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  heroTextCol: {
    gap: 4,
  },
  heroMicroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F9F4',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  heroMicroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  // Search Wrap
  searchWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },

  // Filter Chips Row
  filterChipsRow: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  filterChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Section Headers
  sectionHeaderWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },

  // Category Cards
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryCard: {
    width: 105,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#E6F9F4',
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryIconCircleActive: {
    backgroundColor: '#00B894',
  },
  categoryCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  categoryCardNameActive: {
    color: '#00B894',
  },
  categoryCardBadge: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  // Sub Categories
  subCategoryRow: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  subCategoryScroll: {
    gap: 6,
  },
  subCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  subCatChipActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  subCatChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  subCatChipTextActive: {
    color: '#FFFFFF',
  },

  // Packages
  packagesSection: {
    marginTop: 10,
  },
  packagesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  packageCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  packageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageBadgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  packageBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  packageParamCount: {
    fontSize: 11,
    color: '#00B894',
    fontWeight: '700',
  },
  packageName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  packageDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 10,
  },
  packagePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00B894',
  },
  packageMrp: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  packageViewBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  packageViewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Curated Block
  curatedBlock: {
    marginTop: 4,
  },

  // Lab Test Card
  testCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  recommendedBadgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  featuredBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
  },
  sampleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  sampleBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  testCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  testCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  availItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availText: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '600',
  },
  availTextDisabled: {
    color: '#94A3B8',
  },
  availDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  testPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B894',
  },
  testMrpText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  testDiscountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  cardBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  bookTestBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#00B894',
  },
  bookTestBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Centres Snippet
  centresSectionBox: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  centresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  centresTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  centresDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 10,
  },
  centresList: {
    gap: 8,
  },
  centreSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  centreSnippetName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  centreSnippetLoc: {
    fontSize: 11,
    color: '#64748B',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },

  // Empty State
  emptyStateBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptyStateDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyResetBtn: {
    marginTop: 14,
    backgroundColor: '#00B894',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Bookings Tab
  tabFiltersRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  tabFilterBtnActive: {
    backgroundColor: '#00B894',
  },
  tabFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookingIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00B894',
  },
  bookingDateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: '#E0F2FE',
  },
  statusConfirmedText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  statusCompleted: {
    backgroundColor: '#F0FDF4',
  },
  statusCompletedText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusCancelledText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  bookingTestName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  bookingDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookingDetailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  bookingDetailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
  },
  bookingPriceVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00B894',
  },
  bookingActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  trackBookingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  trackBookingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  viewReportActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00B894',
    gap: 6,
  },
  viewReportActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Reports Tab
  reportsHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F9F4',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  reportsBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  reportsBannerSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reportCardId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  reportTestName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  reportReadyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  reportReadyPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  reportMetaGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  reportMetaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportMetaLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  reportMetaVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
  },
  reportCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  reportDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  reportDownloadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  reportViewFullBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00B894',
    gap: 6,
  },
  reportViewFullBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modals General
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  detailsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '88%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  detailsSectionBlock: {
    marginBottom: 12,
  },
  detailsBlockTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  detailsBlockDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  applicabilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  appliBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  appliBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  instructionCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  instructionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  instructionBody: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  detailsTwoColGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  detailsColBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
  },
  colBoxVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  collectionOptionsBlock: {
    marginBottom: 12,
  },
  methodOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  methodOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginTop: 8,
  },
  modalPriceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00B894',
  },
  modalMrpText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  modalPrimaryBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Package Modal
  packageModalDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  includedSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  includedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  includedItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  includedItemDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  includedItemDetailsLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
  },

  // Booking Flow Modal
  bookingModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  bookingStepHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookingStepHeaderSub: {
    fontSize: 12,
    color: '#00B894',
    fontWeight: '700',
    marginTop: 1,
  },
  stepPromptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  methodSelectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  methodSelectCardActive: {
    backgroundColor: '#E6F9F4',
    borderColor: '#00B894',
  },
  methodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  methodRadioActive: {
    borderColor: '#00B894',
  },
  methodRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00B894',
  },
  methodSelectTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  methodSelectSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginVertical: 4,
  },
  methodFeeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },

  // Step 2
  stepBlock: {
    marginBottom: 14,
  },
  stepBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepBlockTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  addAddressLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  addressCardActive: {
    backgroundColor: '#E6F9F4',
    borderColor: '#00B894',
  },
  addressTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  addressLineText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  centreSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  centreSelectCardActive: {
    backgroundColor: '#E6F9F4',
    borderColor: '#00B894',
  },
  centreSelectName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  centreSelectAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  centreMetaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 3,
  },
  centreMetaText: {
    fontSize: 10,
    color: '#00B894',
    fontWeight: '600',
  },
  datePillsRow: {
    gap: 8,
  },
  datePill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  datePillActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  datePillDay: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  datePillDayActive: {
    color: '#FFFFFF',
  },
  datePillDate: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  datePillDateActive: {
    color: '#FFFFFF',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotCardActive: {
    backgroundColor: '#E6F9F4',
    borderColor: '#00B894',
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  slotLabelActive: {
    color: '#00B894',
  },
  slotPeriod: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  // Step 3 Summary
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryTotalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00B894',
  },

  // Step 4 Payment
  demoPaymentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  demoPaymentAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 16,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 10,
  },
  paymentMethodCardActive: {
    backgroundColor: '#E6F9F4',
    borderColor: '#00B894',
  },
  paymentMethodLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  paymentMethodLabelActive: {
    color: '#00B894',
    fontWeight: '700',
  },

  // Step 5 Confirmed
  confirmedBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  confirmedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  confirmedBookingId: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00B894',
    marginTop: 4,
  },
  confirmedDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 18,
  },
  confirmedMetaBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
  confirmedMetaText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'center',
  },
  viewBookingsConfirmedBtn: {
    backgroundColor: '#00B894',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  viewBookingsConfirmedBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepBackBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  stepBackBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },

  // Tracking Timeline Modal
  trackingTestTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 6,
  },
  timelineStepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 26,
  },
  timelineNode: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeDone: {
    backgroundColor: '#00B894',
  },
  timelineNodeCurr: {
    backgroundColor: '#0284C7',
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#CBD5E1',
    marginTop: 2,
  },
  timelineLineDone: {
    backgroundColor: '#00B894',
  },
  timelineTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  timelineStepTitleCurr: {
    color: '#0284C7',
    fontWeight: '800',
  },
  timelineStepDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Report Modal
  reportModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '92%',
  },
  reportModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  reportModalSub: {
    fontSize: 12,
    color: '#00B894',
    fontWeight: '700',
  },
  reportPatientCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportPatientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  repPatientLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  repPatientVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  tableHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  paramsTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  paramsTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  paramsTableColHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  paramTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paramNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  paramUnitText: {
    fontSize: 10,
    color: '#64748B',
  },
  paramResultText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  paramUnitSub: {
    fontSize: 9,
    color: '#94A3B8',
  },
  paramRefText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'right',
  },
  conclusionCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  conclusionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  conclusionText: {
    fontSize: 12,
    color: '#14532D',
    marginTop: 2,
    lineHeight: 16,
  },
  conclusionSignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  conclusionSignText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
  },
  reportModalFooter: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  reportDownloadModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  reportDownloadModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },
  reportMyHealthBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#00B894',
    gap: 6,
  },
  reportMyHealthBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Add Address Modal
  addAddressModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    margin: 20,
  },
  addAddressTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  tagToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tagToggleBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tagToggleBtnActive: {
    backgroundColor: '#00B894',
  },
  tagToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tagToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addressInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10,
  },
  addAddressBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  cancelAddressBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelAddressBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  saveAddressBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#00B894',
    alignItems: 'center',
  },
  saveAddressBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── MANUAL ADDRESS FORM ───────────────────────────────────────
  manualAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  manualAddressSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  addressFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 5,
    marginTop: 10,
  },
  addressFieldInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  addressRowFields: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
});

export default LabTestsScreen;