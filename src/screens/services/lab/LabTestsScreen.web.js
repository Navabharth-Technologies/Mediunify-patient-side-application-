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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import WebFooter from '../../../components/web/WebFooter';
import { showAlert } from '../../../utils/alert';
import { useCart } from '../../../context/CartContext';

const LabTestsScreenWeb = (props) => {
  const { navigation, route } = props;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('ALL');
  const [selectedSampleFilter, setSelectedSampleFilter] = useState('ALL');
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState('ALL');

  // Modals & Details State
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Booking Flow State
  const [bookingFlowStep, setBookingFlowStep] = useState(1);
  const [activeBookingTest, setActiveBookingTest] = useState(null);
  const [collectionMethod, setCollectionMethod] = useState('HOME');
  const [selectedCentreId, setSelectedCentreId] = useState('centre-unnathi-main');
  const [selectedDate, setSelectedDate] = useState(getAvailableDates()[0].dateStr);
  const [selectedSlotId, setSelectedSlotId] = useState('slot-2');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
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
  const [bookingsFilter, setBookingsFilter] = useState('ALL');
  const [selectedTrackingBooking, setSelectedTrackingBooking] = useState(null);

  const [reportsList, setReportsList] = useState(INITIAL_LAB_REPORTS);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDownloadToast, setShowDownloadToast] = useState(false);

  // Scroll ref
  const mainScrollRef = useRef(null);

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------------------------
  const filteredTests = useMemo(() => {
    return LAB_TESTS_MASTER.filter((test) => {
      if (selectedCategory !== 'all' && test.category !== selectedCategory) return false;
      if (selectedSubCategory !== 'all' && test.subCategory !== selectedSubCategory) return false;

      if (selectedGenderFilter !== 'ALL' && test.genderApplicability !== 'All') {
        if (selectedGenderFilter === 'MALE' && test.genderApplicability !== 'Male') return false;
        if (selectedGenderFilter === 'FEMALE' && test.genderApplicability !== 'Female') return false;
      }

      if (selectedSampleFilter !== 'ALL' && test.sampleType !== selectedSampleFilter) return false;
      if (selectedCollectionFilter === 'HOME' && !test.homeCollection) return false;
      if (selectedCollectionFilter === 'CENTRE' && !test.centreCollection) return false;

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

  const activeCategoryObj = useMemo(() => {
    return LAB_CATEGORIES.find((c) => c.id === selectedCategory);
  }, [selectedCategory]);

  const popularTests = useMemo(() => {
    return LAB_TESTS_MASTER.filter((t) => t.popular).sort((a, b) => a.popularRank - b.popularRank);
  }, []);

  const startBooking = (test, preferredMethod = null) => {
    setActiveBookingTest(test);
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
  // RENDER: DESKTOP CARD
  // ===========================================================================
  const renderDesktopCard = (test) => {
    return (
      <View key={test.id} style={styles.webTestCard}>
        <View style={styles.webCardBadgesRow}>
          {test.popular && (
            <View style={styles.webPopularBadge}>
              <Ionicons name="flame" size={11} color="#FFFFFF" />
              <Text style={styles.webPopularBadgeText}>Popular #{test.popularRank}</Text>
            </View>
          )}
          {test.recommended && (
            <View style={styles.webRecommendedBadge}>
              <Ionicons name="thumbs-up" size={11} color="#1E3A8A" />
              <Text style={styles.webRecommendedBadgeText}>Recommended</Text>
            </View>
          )}
          <View style={styles.webSampleBadge}>
            <Text style={styles.webSampleBadgeText}>{test.sampleType}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setSelectedTest(test)}>
          <Text style={styles.webCardTitle} numberOfLines={2}>{test.name}</Text>
        </TouchableOpacity>
        <Text style={styles.webCardDesc} numberOfLines={2}>{test.description}</Text>

        <View style={styles.webAvailBox}>
          <View style={styles.webAvailItem}>
            <Ionicons name={test.homeCollection ? 'checkmark-circle' : 'close-circle'} size={14} color={test.homeCollection ? '#00B894' : '#94A3B8'} />
            <Text style={[styles.webAvailText, !test.homeCollection && styles.webAvailTextDisabled]}>
              {test.homeCollection ? 'Home Collection' : 'No Home Collection'}
            </Text>
          </View>
          <View style={styles.webAvailItem}>
            <Ionicons name={test.centreCollection ? 'checkmark-circle' : 'close-circle'} size={14} color={test.centreCollection ? '#00B894' : '#94A3B8'} />
            <Text style={[styles.webAvailText, !test.centreCollection && styles.webAvailTextDisabled]}>
              {test.centreCollection ? 'Lab Visit' : 'No Lab Visit'}
            </Text>
          </View>
        </View>

        <View style={styles.webCardFooter}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={styles.webPriceText}>₹{test.price}</Text>
              {test.mrp && <Text style={styles.webMrpText}>₹{test.mrp}</Text>}
            </View>
            <Text style={styles.webTatText}>TAT: {test.reportTAT}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.webAddToCartBtn, isTestInCart(test.id) && styles.webAddToCartBtnActive]}
              onPress={() => handleToggleCartTest(test)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isTestInCart(test.id) ? 'checkmark-circle' : 'cart-outline'}
                size={13}
                color={isTestInCart(test.id) ? '#FFFFFF' : '#00B894'}
              />
              <Text
                style={[
                  styles.webAddToCartBtnText,
                  isTestInCart(test.id) && styles.webAddToCartBtnTextActive,
                ]}
              >
                {isTestInCart(test.id) ? 'In Cart' : 'Add'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.webDetailsBtn} onPress={() => setSelectedTest(test)}>
              <Text style={styles.webDetailsBtnText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.webBookBtn} onPress={() => startBooking(test)}>
              <Text style={styles.webBookBtnText}>Book</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ===========================================================================
  // RENDER: BROWSE VIEW (WEB)
  // ===========================================================================
  const renderWebBrowse = () => {
    return (
      <View style={styles.webMainContentWrapper}>
        {/* Top Hero Banner */}
        <View style={styles.webHeroBanner}>
          <View style={styles.webHeroTextCol}>
            <View style={styles.webHeroBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#00B894" />
              <Text style={styles.webHeroBadgeText}>NABL & ICMR Certified Clinical Partner Labs</Text>
            </View>
            <Text style={styles.webHeroTitle}>Lab Tests & Diagnostic Services</Text>
            <Text style={styles.webHeroSubtitle}>
              Book diagnostic tests from trusted laboratory services with doorstep phlebotomy and 100% digital reports.
            </Text>
          </View>

          {/* Search Box on Hero */}
          <View style={styles.webSearchWrap}>
            <Ionicons name="search" size={20} color="#00B894" />
            <TextInput
              style={styles.webSearchInput}
              placeholder="Search by test name, sugar, CBC, lipid profile, thyroid..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories Bar */}
        <View style={styles.webCategoriesRow}>
          {LAB_CATEGORIES.map((cat) => {
            const isSel = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.webCategoryPill, isSel && styles.webCategoryPillActive]}
                onPress={() => {
                  setSelectedCategory(isSel ? 'all' : cat.id);
                  setSelectedSubCategory('all');
                }}
              >
                <Ionicons name={cat.icon} size={16} color={isSel ? '#FFFFFF' : '#00B894'} />
                <Text style={[styles.webCategoryPillText, isSel && styles.webCategoryPillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sub-category chips */}
        {activeCategoryObj && (
          <View style={styles.webSubCategoriesBar}>
            <TouchableOpacity
              style={[styles.webSubCatPill, selectedSubCategory === 'all' && styles.webSubCatPillActive]}
              onPress={() => setSelectedSubCategory('all')}
            >
              <Text style={[styles.webSubCatPillText, selectedSubCategory === 'all' && styles.webSubCatPillTextActive]}>
                All {activeCategoryObj.name}
              </Text>
            </TouchableOpacity>
            {activeCategoryObj.subCategories.map((sc) => {
              const isSubSel = selectedSubCategory === sc.id;
              return (
                <TouchableOpacity
                  key={sc.id}
                  style={[styles.webSubCatPill, isSubSel && styles.webSubCatPillActive]}
                  onPress={() => setSelectedSubCategory(isSubSel ? 'all' : sc.id)}
                >
                  <Text style={[styles.webSubCatPillText, isSubSel && styles.webSubCatPillTextActive]}>
                    {sc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Main Two-Column Layout: Sidebar Filters + Test Grid */}
        <View style={styles.webTwoColumnLayout}>
          {/* Sidebar Filters */}
          <View style={styles.webSidebar}>
            <Text style={styles.sidebarHeading}>Filter Diagnostic Tests</Text>

            {/* Collection Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Collection Method</Text>
              {[
                { id: 'ALL', label: 'All Methods' },
                { id: 'HOME', label: '🏠 Home Collection' },
                { id: 'CENTRE', label: '🏥 Diagnostic Centre' },
              ].map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.radioRow}
                  onPress={() => setSelectedCollectionFilter(m.id)}
                >
                  <Ionicons
                    name={selectedCollectionFilter === m.id ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color="#00B894"
                  />
                  <Text style={styles.radioRowLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Gender Applicability */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Gender Applicability</Text>
              {[
                { id: 'ALL', label: 'All (Unrestricted)' },
                { id: 'MALE', label: "Men's Health Only" },
                { id: 'FEMALE', label: "Women's Health Only" },
              ].map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.radioRow}
                  onPress={() => setSelectedGenderFilter(g.id)}
                >
                  <Ionicons
                    name={selectedGenderFilter === g.id ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color="#00B894"
                  />
                  <Text style={styles.radioRowLabel}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sample Type */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Sample Type</Text>
              {[
                { id: 'ALL', label: 'All Samples' },
                { id: 'Blood', label: 'Blood Sample' },
                { id: 'Urine', label: 'Urine Sample' },
                { id: 'Stool', label: 'Stool Sample' },
                { id: 'Swab', label: 'Throat Swab' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.radioRow}
                  onPress={() => setSelectedSampleFilter(s.id)}
                >
                  <Ionicons
                    name={selectedSampleFilter === s.id ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color="#00B894"
                  />
                  <Text style={styles.radioRowLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reset */}
            <TouchableOpacity
              style={styles.resetFiltersBtn}
              onPress={() => {
                setSelectedCategory('all');
                setSelectedSubCategory('all');
                setSelectedGenderFilter('ALL');
                setSelectedSampleFilter('ALL');
                setSelectedCollectionFilter('ALL');
                setSearchQuery('');
              }}
            >
              <Text style={styles.resetFiltersBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>

          {/* Test Cards Grid */}
          <View style={styles.webContentCol}>
            {/* Packages Section */}
            {selectedCategory === 'all' && !searchQuery && (
              <View style={styles.webSectionBlock}>
                <View style={styles.webSectionHeader}>
                  <Text style={styles.webSectionTitle}>Popular Health Checkup Packages</Text>
                  <Text style={styles.webSectionSub}>Bundled clinical profiles with free doorstep sample collection</Text>
                </View>
                <View style={styles.webPackagesGrid}>
                  {LAB_PACKAGES.map((pkg) => (
                    <View key={pkg.id} style={styles.webPackageCard}>
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
                            style={[styles.webAddToCartBtn, isTestInCart(pkg.id) && styles.webAddToCartBtnActive]}
                            onPress={() => handleToggleCartPackage(pkg)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name={isTestInCart(pkg.id) ? 'checkmark-circle' : 'cart-outline'}
                              size={13}
                              color={isTestInCart(pkg.id) ? '#FFFFFF' : '#00B894'}
                            />
                            <Text
                              style={[
                                styles.webAddToCartBtnText,
                                isTestInCart(pkg.id) && styles.webAddToCartBtnTextActive,
                              ]}
                            >
                              {isTestInCart(pkg.id) ? 'In Cart' : 'Add'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.packageViewBtn} onPress={() => setSelectedPackage(pkg)}>
                            <Text style={styles.packageViewBtnText}>View</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Popular Tests Grid */}
            {selectedCategory === 'all' && !searchQuery && (
              <View style={styles.webSectionBlock}>
                <View style={styles.webSectionHeader}>
                  <Text style={styles.webSectionTitle}>Top Prescribed Diagnostic Tests</Text>
                  <Text style={styles.webSectionSub}>High-accuracy routine laboratory profiles</Text>
                </View>
                <View style={styles.webTestsGrid}>
                  {popularTests.slice(0, 4).map((test) => renderDesktopCard(test))}
                </View>
              </View>
            )}

            {/* Filtered Catalog List */}
            <View style={styles.webSectionBlock}>
              <View style={styles.webSectionHeader}>
                <Text style={styles.webSectionTitle}>
                  {searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : selectedCategory !== 'all'
                    ? `${activeCategoryObj?.name} Tests`
                    : 'Diagnostic Tests Catalog'}
                </Text>
                <Text style={styles.webSectionSub}>{filteredTests.length} tests matching your selection</Text>
              </View>

              {filteredTests.length === 0 ? (
                <View style={styles.webEmptyState}>
                  <Ionicons name="search-outline" size={54} color="#94A3B8" />
                  <Text style={styles.webEmptyTitle}>No tests found</Text>
                  <Text style={styles.webEmptyDesc}>Try changing your search terms or clearing your sidebar filters.</Text>
                </View>
              ) : (
                <View style={styles.webTestsGrid}>
                  {filteredTests.map((test) => renderDesktopCard(test))}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ===========================================================================
  // RENDER: BOOKINGS & REPORTS VIEW (WEB)
  // ===========================================================================
  const renderWebBookings = () => {
    return (
      <View style={styles.webTabContentBox}>
        <View style={styles.webTabHeader}>
          <Text style={styles.webTabHeaderTitle}>My Lab Test Bookings</Text>
          <View style={styles.tabFiltersRow}>
            {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabFilterBtn, bookingsFilter === tab && styles.tabFilterBtnActive]}
                onPress={() => setBookingsFilter(tab)}
              >
                <Text style={[styles.tabFilterText, bookingsFilter === tab && styles.tabFilterTextActive]}>
                  {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.webBookingsGrid}>
          {bookingsList.map((b) => (
            <View key={b.id} style={styles.webBookingCard}>
              <View style={styles.bookingCardHeader}>
                <Text style={styles.bookingIdText}>{b.id}</Text>
                <Text style={styles.statusBadgeText}>{b.status}</Text>
              </View>
              <Text style={styles.bookingTestName}>{b.testName}</Text>
              <Text style={styles.bookingDetailLabel}>Date & Time: {b.bookingDate} ({b.timeSlot})</Text>
              <Text style={styles.bookingDetailLabel}>
                Method: {b.collectionMethod === 'HOME' ? `🏠 Home Collection (${b.collectionAddress})` : `🏥 Diagnostic Centre (${b.diagnosticCentre?.name})`}
              </Text>
              <Text style={styles.bookingPriceVal}>Paid: ₹{b.amountPaid}</Text>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { marginTop: 10 }]}
                onPress={() => setSelectedTrackingBooking(b)}
              >
                <Text style={styles.modalPrimaryBtnText}>Track Sample Status</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderWebReports = () => {
    return (
      <View style={styles.webTabContentBox}>
        <View style={styles.webTabHeader}>
          <Text style={styles.webTabHeaderTitle}>My Lab Test Reports</Text>
          <Text style={styles.webSectionSub}>Download digitally signed clinical test reports</Text>
        </View>

        <View style={styles.webBookingsGrid}>
          {reportsList.map((rep) => (
            <View key={rep.id} style={styles.webReportCard}>
              <View style={styles.reportCardTop}>
                <Text style={styles.reportCardId}>{rep.id}</Text>
                <Text style={styles.reportReadyPillText}>✓ Verified & Released</Text>
              </View>
              <Text style={styles.reportTestName}>{rep.testName}</Text>
              <Text style={styles.reportMetaLabel}>Lab: {rep.labName}</Text>
              <Text style={styles.reportMetaLabel}>Collected: {rep.sampleCollectionDate}</Text>
              <Text style={styles.reportMetaLabel}>Reported: {rep.reportDate}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity style={styles.reportDownloadBtn} onPress={() => setShowDownloadToast(true)}>
                  <Ionicons name="download" size={14} color="#00B894" />
                  <Text style={styles.reportDownloadBtnText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportViewFullBtn} onPress={() => setSelectedReport(rep)}>
                  <Text style={styles.reportViewFullBtnText}>View Full Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Web Header Navigation */}
      <View style={styles.webHeaderBar}>
        <View style={styles.webHeaderInner}>
          <View style={styles.webHeaderLogoCol}>
            <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.webHeaderTitle}>Lab Tests & Diagnostics</Text>
              <Text style={styles.webHeaderSub}>MediUnify Patient Healthcare Portal</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView ref={mainScrollRef} style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 60 }}>
        {renderWebBrowse()}
        {activeTab === 'BOOKINGS' && renderWebBookings()}
        {activeTab === 'REPORTS' && renderWebReports()}

        {/* Integrated MediUnify Web Footer */}
        <WebFooter navigation={navigation} />
      </ScrollView>

      {/* ─── MODAL 1: TEST DETAILS ─── */}
      {selectedTest && (
        <Modal visible={!!selectedTest} animationType="fade" transparent onRequestClose={() => setSelectedTest(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModalContent}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle} numberOfLines={2}>{selectedTest.name}</Text>
                  <Text style={styles.modalHeaderSubtitle}>Clinical Laboratory Assay</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTest(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <View style={styles.detailsSectionBlock}>
                  <Text style={styles.detailsBlockTitle}>Clinical Overview</Text>
                  <Text style={styles.detailsBlockDesc}>{selectedTest.description}</Text>
                </View>
                <View style={styles.applicabilityRow}>
                  <View style={styles.appliBadge}><Text style={styles.appliBadgeText}>Gender: {selectedTest.genderApplicability}</Text></View>
                  <View style={styles.appliBadge}><Text style={styles.appliBadgeText}>Sample: {selectedTest.sampleType}</Text></View>
                </View>
                <View style={styles.instructionCard}>
                  <Text style={styles.instructionTitle}>Fasting Requirement</Text>
                  <Text style={styles.instructionBody}>{selectedTest.fastingRequirement}</Text>
                </View>
                <View style={styles.instructionCard}>
                  <Text style={styles.instructionTitle}>Preparation Instructions</Text>
                  <Text style={styles.instructionBody}>{selectedTest.preparation}</Text>
                </View>
                <View style={styles.detailsTwoColGrid}>
                  <View style={styles.detailsColBox}>
                    <Text style={styles.colBoxTitle}>Timing</Text>
                    <Text style={styles.colBoxVal}>{selectedTest.timingInstructions}</Text>
                  </View>
                  <View style={styles.detailsColBox}>
                    <Text style={styles.colBoxTitle}>Expected Report TAT</Text>
                    <Text style={styles.colBoxVal}>{selectedTest.reportTAT}</Text>
                  </View>
                </View>
              </ScrollView>
              <View style={styles.modalFooterRow}>
                <View>
                  <Text style={styles.modalPriceText}>₹{selectedTest.price}</Text>
                  {selectedTest.mrp && <Text style={styles.modalMrpText}>₹{selectedTest.mrp}</Text>}
                </View>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[
                      styles.webAddToCartBtn,
                      isTestInCart(selectedTest.id) && styles.webAddToCartBtnActive,
                      { paddingVertical: 10, paddingHorizontal: 16 },
                    ]}
                    onPress={() => handleToggleCartTest(selectedTest)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={isTestInCart(selectedTest.id) ? 'checkmark-circle' : 'cart-outline'}
                      size={15}
                      color={isTestInCart(selectedTest.id) ? '#FFFFFF' : '#00B894'}
                    />
                    <Text
                      style={[
                        styles.webAddToCartBtnText,
                        isTestInCart(selectedTest.id) && styles.webAddToCartBtnTextActive,
                        { fontSize: 13 },
                      ]}
                    >
                      {isTestInCart(selectedTest.id) ? 'In Cart' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={() => { const t = selectedTest; setSelectedTest(null); startBooking(t); }}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Proceed to Book →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ─── MODAL 2: PACKAGE DETAILS ─── */}
      {selectedPackage && (
        <Modal visible={!!selectedPackage} animationType="fade" transparent onRequestClose={() => setSelectedPackage(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModalContent}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle}>{selectedPackage.name}</Text>
                  <Text style={styles.modalHeaderSubtitle}>{selectedPackage.includedCount} Tests Included</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedPackage(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.packageModalDesc}>{selectedPackage.description}</Text>
                <Text style={styles.includedSectionHeader}>Individual Tests Included ({LAB_TESTS_MASTER.filter((t) => selectedPackage.testIds.includes(t.id)).length})</Text>
                {LAB_TESTS_MASTER.filter((t) => selectedPackage.testIds.includes(t.id)).map((test) => (
                  <TouchableOpacity key={test.id} style={styles.includedItemRow}
                    onPress={() => { setSelectedPackage(null); setSelectedTest(test); }}>
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
                  <Text style={styles.modalPriceText}>₹{selectedPackage.price}</Text>
                  <Text style={styles.modalMrpText}>₹{selectedPackage.mrp}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[
                      styles.webAddToCartBtn,
                      isTestInCart(selectedPackage.id) && styles.webAddToCartBtnActive,
                      { paddingVertical: 10, paddingHorizontal: 16 },
                    ]}
                    onPress={() => handleToggleCartPackage(selectedPackage)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={isTestInCart(selectedPackage.id) ? 'checkmark-circle' : 'cart-outline'}
                      size={15}
                      color={isTestInCart(selectedPackage.id) ? '#FFFFFF' : '#00B894'}
                    />
                    <Text
                      style={[
                        styles.webAddToCartBtnText,
                        isTestInCart(selectedPackage.id) && styles.webAddToCartBtnTextActive,
                        { fontSize: 13 },
                      ]}
                    >
                      {isTestInCart(selectedPackage.id) ? 'In Cart' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalPrimaryBtn}
                    onPress={() => {
                      const firstTest = LAB_TESTS_MASTER.filter((t) => selectedPackage.testIds.includes(t.id))[0];
                      setSelectedPackage(null);
                      if (firstTest) startBooking(firstTest);
                    }}>
                    <Text style={styles.modalPrimaryBtnText}>Book Package →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ─── MODAL 3: BOOKING FLOW ─── */}
      {activeBookingTest && (() => {
        const test = activeBookingTest;
        const isHome = collectionMethod === 'HOME';
        const testPrice = test.price;
        const collectionFee = isHome ? 100 : 0;
        const totalPrice = testPrice + collectionFee;
        const availableDates = getAvailableDates();
        const selectedCentre = DIAGNOSTIC_CENTRES.find((c) => c.id === selectedCentreId);
        return (
          <Modal visible={!!activeBookingTest} animationType="fade" transparent onRequestClose={() => setActiveBookingTest(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.bookingModalContent}>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingStepHeaderTitle}>
                      {bookingFlowStep === 1 ? '1. Collection Method' : bookingFlowStep === 2 ? '2. Date & Slot' : bookingFlowStep === 3 ? '3. Summary' : bookingFlowStep === 4 ? '4. Payment' : 'Confirmed!'}
                    </Text>
                    <Text style={styles.bookingStepHeaderSub}>{test.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setActiveBookingTest(null)}>
                    <Ionicons name="close" size={24} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                {/* STEP 1 */}
                {bookingFlowStep === 1 && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                    <Text style={styles.stepPromptText}>How would you like to provide your sample?</Text>
                    {test.homeCollection && (
                      <TouchableOpacity style={[styles.methodSelectCard, isHome && styles.methodSelectCardActive]} onPress={() => setCollectionMethod('HOME')}>
                        <View style={[styles.methodRadio, isHome && styles.methodRadioActive]}>{isHome && <View style={styles.methodRadioInner} />}</View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.methodSelectTitle}>🏠 Home Sample Collection</Text>
                          <Text style={styles.methodSelectSub}>Trained phlebotomist visits your address.</Text>
                          <Text style={styles.methodFeeTag}>Doorstep Fee: ₹100</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    {test.centreCollection && (
                      <TouchableOpacity style={[styles.methodSelectCard, !isHome && styles.methodSelectCardActive]} onPress={() => setCollectionMethod('CENTRE')}>
                        <View style={[styles.methodRadio, !isHome && styles.methodRadioActive]}>{!isHome && <View style={styles.methodRadioInner} />}</View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.methodSelectTitle}>🏥 Diagnostic Centre Visit</Text>
                          <Text style={styles.methodSelectSub}>Walk into any verified lab partner in Mysuru.</Text>
                          <Text style={[styles.methodFeeTag, { color: '#00B894' }]}>Collection Fee: FREE</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                )}

                  {/* STEP 2 */}
                {bookingFlowStep === 2 && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
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
                      <View style={styles.stepBlock}>
                        <Text style={styles.stepBlockTitle}>Select Diagnostic Centre</Text>
                        {DIAGNOSTIC_CENTRES.map((centre) => {
                          const isSel = selectedCentreId === centre.id;
                          return (
                            <TouchableOpacity key={centre.id} style={[styles.centreSelectCard, isSel && styles.centreSelectCardActive]} onPress={() => setSelectedCentreId(centre.id)}>
                              <Ionicons name="business-outline" size={20} color={isSel ? '#00B894' : '#64748B'} />
                              <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.centreSelectName}>{centre.name}</Text>
                                <Text style={styles.centreSelectAddress}>{centre.address}</Text>
                                <Text style={styles.centreMetaText}>⭐ {centre.rating} • {centre.distanceKm} km away</Text>
                              </View>
                              {isSel && <Ionicons name="checkmark-circle" size={18} color="#00B894" />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    <View style={styles.stepBlock}>
                      <Text style={styles.stepBlockTitle}>Select Date</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePillsRow}>
                        {availableDates.map((item) => {
                          const isSel = selectedDate === item.dateStr;
                          return (
                            <TouchableOpacity key={item.dateStr} style={[styles.datePill, isSel && styles.datePillActive]} onPress={() => setSelectedDate(item.dateStr)}>
                              <Text style={[styles.datePillDay, isSel && styles.datePillDayActive]}>{item.dayName}</Text>
                              <Text style={[styles.datePillDate, isSel && styles.datePillDateActive]}>{item.dateStr}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                    <View style={styles.stepBlock}>
                      <Text style={styles.stepBlockTitle}>Available Time Slots</Text>
                      <View style={styles.slotGrid}>
                        {TIME_SLOTS.map((slot) => {
                          const isSel = selectedSlotId === slot.id;
                          return (
                            <TouchableOpacity key={slot.id} style={[styles.slotCard, isSel && styles.slotCardActive]} onPress={() => setSelectedSlotId(slot.id)}>
                              <Text style={[styles.slotLabel, isSel && styles.slotLabelActive]}>{slot.label}</Text>
                              <Text style={styles.slotPeriod}>{slot.period}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </ScrollView>
                )}

                {/* STEP 3 */}
                {bookingFlowStep === 3 && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryHeading}>Order Summary</Text>
                      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Test:</Text><Text style={styles.summaryVal}>{test.name}</Text></View>
                      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Method:</Text><Text style={styles.summaryVal}>{isHome ? '🏠 Home' : '🏥 Diagnostic Centre'}</Text></View>
                      {isHome ? (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Address:</Text>
                          <Text style={styles.summaryVal}>
                            {homeAddressFlat ? `${homeAddressFlat}, ${homeAddressCity} - ${homeAddressPincode}` : 'Not provided'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Centre:</Text><Text style={styles.summaryVal}>{selectedCentre?.name}</Text></View>
                      )}
                      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Date & Time:</Text><Text style={styles.summaryVal}>{selectedDate} • {TIME_SLOTS.find((s) => s.id === selectedSlotId)?.label}</Text></View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Test Fee:</Text><Text style={styles.summaryVal}>₹{testPrice}</Text></View>
                      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Collection:</Text><Text style={styles.summaryVal}>{collectionFee === 0 ? 'FREE' : `₹${collectionFee}`}</Text></View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryTotalRow}><Text style={styles.summaryTotalLabel}>Total:</Text><Text style={styles.summaryTotalVal}>₹{totalPrice}</Text></View>
                    </View>
                  </ScrollView>
                )}

                {/* STEP 4 */}
                {bookingFlowStep === 4 && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                    <View style={styles.demoPaymentAlert}>
                      <Ionicons name="information-circle" size={18} color="#0284C7" />
                      <Text style={styles.demoPaymentAlertText}>Frontend prototype: No real payment will occur.</Text>
                    </View>
                    <Text style={styles.stepBlockTitle}>Select Payment Method</Text>
                    {[
                      { id: 'UPI', label: 'UPI / Google Pay / PhonePe', icon: 'flash' },
                      { id: 'CARD', label: 'Credit / Debit Card', icon: 'card' },
                      { id: 'NET_BANKING', label: 'Net Banking', icon: 'globe' },
                      { id: 'WALLET', label: 'Pay at Sample Collection', icon: 'wallet' },
                    ].map((m) => {
                      const isSel = paymentMethod === m.id;
                      return (
                        <TouchableOpacity key={m.id} style={[styles.paymentMethodCard, isSel && styles.paymentMethodCardActive]} onPress={() => setPaymentMethod(m.id)}>
                          <Ionicons name={m.icon} size={20} color={isSel ? '#00B894' : '#64748B'} />
                          <Text style={[styles.paymentMethodLabel, isSel && styles.paymentMethodLabelActive]}>{m.label}</Text>
                          {isSel && <Ionicons name="checkmark-circle" size={18} color="#00B894" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {/* STEP 5: CONFIRMED */}
                {bookingFlowStep === 5 && confirmedBookingData && (
                  <View style={styles.confirmedBox}>
                    <Ionicons name="checkmark-circle" size={60} color="#00B894" />
                    <Text style={styles.confirmedTitle}>Booking Confirmed!</Text>
                    <Text style={styles.confirmedBookingId}>Booking ID: {confirmedBookingData.id}</Text>
                    <Text style={styles.confirmedDesc}>
                      {confirmedBookingData.testName} booked for {confirmedBookingData.bookingDate} ({confirmedBookingData.timeSlot}).
                    </Text>
                    <TouchableOpacity style={styles.viewBookingsConfirmedBtn} onPress={() => { setActiveBookingTest(null); setActiveTab('BOOKINGS'); }}>
                      <Text style={styles.viewBookingsConfirmedBtnText}>View My Lab Bookings →</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {bookingFlowStep < 5 && (
                  <View style={styles.modalFooterRow}>
                    {bookingFlowStep > 1 && (
                      <TouchableOpacity style={styles.stepBackBtn} onPress={() => setBookingFlowStep(bookingFlowStep - 1)}>
                        <Text style={styles.stepBackBtnText}>Back</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.modalPrimaryBtn, { flex: 1, marginLeft: bookingFlowStep > 1 ? 10 : 0 }]}
                      onPress={() => {
                        if (bookingFlowStep === 1) setBookingFlowStep(2);
                        else if (bookingFlowStep === 2) {
                          if (collectionMethod === 'HOME' && (!homeAddressName.trim() || !homeAddressPhone.trim() || !homeAddressFlat.trim() || !homeAddressCity.trim() || !homeAddressPincode.trim())) {
                            alert('Please fill in Patient Name, Phone, Address, City and Pincode for home sample collection.');
                            return;
                          }
                          setBookingFlowStep(3);
                        }
                        else if (bookingFlowStep === 3) setBookingFlowStep(4);
                        else if (bookingFlowStep === 4) handleSimulatePayment();
                      }}
                    >
                      <Text style={styles.modalPrimaryBtnText}>
                        {bookingFlowStep === 1 ? 'Continue to Slots' : bookingFlowStep === 2 ? 'Review Summary' : bookingFlowStep === 3 ? 'Proceed to Pay' : `Pay ₹${totalPrice}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* ─── MODAL 4: TRACKING ─── */}
      {selectedTrackingBooking && (() => {
        const b = selectedTrackingBooking;
        const stages = [
          { id: 1, title: 'Test Booked', desc: 'Booking confirmed' },
          { id: 2, title: 'Sample Collection Scheduled', desc: `${b.bookingDate}, ${b.timeSlot}` },
          { id: 3, title: 'Sample Collected', desc: 'Barcoded, temperature transport' },
          { id: 4, title: 'Lab Processing', desc: 'Automated clinical analyzers' },
          { id: 5, title: 'Report Ready', desc: 'Verified by Pathologist & available online' },
        ];
        return (
          <Modal visible={!!selectedTrackingBooking} animationType="fade" transparent onRequestClose={() => setSelectedTrackingBooking(null)}>
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
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                  <Text style={styles.trackingTestTitle}>{b.testName}</Text>
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
                            {idx < stages.length - 1 && <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />}
                          </View>
                          <View style={styles.timelineTextCol}>
                            <Text style={[styles.timelineStepTitle, isCurr && styles.timelineStepTitleCurr]}>{stage.title}</Text>
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
      })()}

      {/* ─── MODAL 5: REPORT VIEWER ─── */}
      {selectedReport && (() => {
        const r = selectedReport;
        return (
          <Modal visible={!!selectedReport} animationType="fade" transparent onRequestClose={() => setSelectedReport(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.reportModalContent}>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportModalTitle}>{r.testName}</Text>
                    <Text style={styles.reportModalSub}>{r.labName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedReport(null)}>
                    <Ionicons name="close" size={24} color="#0F172A" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  <View style={styles.reportPatientCard}>
                    <View style={styles.reportPatientRow}><Text style={styles.repPatientLabel}>Patient:</Text><Text style={styles.repPatientVal}>{r.patientName} ({r.patientAge}, {r.patientGender})</Text></View>
                    <View style={styles.reportPatientRow}><Text style={styles.repPatientLabel}>Referred By:</Text><Text style={styles.repPatientVal}>{r.doctorReferred}</Text></View>
                    <View style={styles.reportPatientRow}><Text style={styles.repPatientLabel}>Collection Date:</Text><Text style={styles.repPatientVal}>{r.sampleCollectionDate}</Text></View>
                    <View style={styles.reportPatientRow}><Text style={styles.repPatientLabel}>Status:</Text><Text style={[styles.repPatientVal, { color: '#00B894', fontWeight: '700' }]}>✓ Verified & Released</Text></View>
                  </View>
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
                          <Text style={styles.paramUnitText}>{param.unit}</Text>
                        </View>
                        <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                          <Text style={[styles.paramResultText, param.status === 'BORDERLINE' && { color: '#D97706' }]}>{param.observed}</Text>
                        </View>
                        <Text style={[styles.paramRefText, { flex: 1.8 }]}>{param.reference}</Text>
                      </View>
                    ))}
                  </View>
                  {r.clinicalConclusion && (
                    <View style={styles.conclusionCard}>
                      <Text style={styles.conclusionTitle}>Pathologist Impression:</Text>
                      <Text style={styles.conclusionText}>{r.clinicalConclusion}</Text>
                    </View>
                  )}
                </ScrollView>
                <View style={styles.reportModalFooter}>
                  <TouchableOpacity style={styles.reportDownloadModalBtn} onPress={() => { setShowDownloadToast(true); setTimeout(() => setShowDownloadToast(false), 3000); }}>
                    <Ionicons name="download" size={16} color="#00B894" />
                    <Text style={styles.reportDownloadModalBtnText}>Download PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reportMyHealthBtn} onPress={() => { setSelectedReport(null); navigation?.navigate?.('HealthRecords'); }}>
                    <Ionicons name="heart" size={16} color="#FFFFFF" />
                    <Text style={styles.reportMyHealthBtnText}>View in My Health</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        );
      })()}


      {/* FLOATING LAB CART BAR */}
      {labCartCount > 0 && (
        <View style={styles.webFloatingCartBar}>
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartIconCircle}>
              <Ionicons name="flask" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.floatingCartTitle}>
                {labCartCount} Diagnostic Test{labCartCount > 1 ? 's' : ''} in Cart
              </Text>
              <Text style={styles.floatingCartSubtitle}>
                Total: ₹{labFinalTotal.toLocaleString('en-IN')} • Doorstep Sample Collection
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.floatingCartBtn}
            onPress={() => navigation.navigate('Cart', { initialTab: 'lab' })}
            activeOpacity={0.88}
          >
            <Text style={styles.floatingCartBtnText}>View Lab Cart</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Download Toast */}
      {showDownloadToast && (
        <View style={styles.downloadToast}>
          <Ionicons name="cloud-download" size={16} color="#FFFFFF" />
          <Text style={styles.downloadToastText}>Report downloaded successfully.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  webAddToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00B894',
    backgroundColor: '#F0FDF4',
  },
  webAddToCartBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  webAddToCartBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#00B894',
  },
  webAddToCartBtnTextActive: {
    color: '#FFFFFF',
  },
  webFloatingCartBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    maxWidth: 680,
    alignSelf: 'center',
    marginHorizontal: 'auto',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 999,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00B894',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingCartSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  floatingCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  floatingCartBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webHeaderBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  webHeaderInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webHeaderLogoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  webHeaderSub: {
    fontSize: 12,
    color: '#64748B',
  },
  webTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  webTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  webTabBtnActive: {
    backgroundColor: '#E6F9F4',
    borderWidth: 1,
    borderColor: '#00B894',
  },
  webTabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  webTabBtnTextActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  webMainContentWrapper: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  webHeroBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  webHeroTextCol: {
    marginBottom: 16,
  },
  webHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F9F4',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  webHeroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  webHeroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  webHeroSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    maxWidth: 700,
  },
  webSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    maxWidth: 650,
  },
  webSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  webCategoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  webCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  webCategoryPillActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  webCategoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  webCategoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  webSubCategoriesBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  webSubCatPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  webSubCatPillActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  webSubCatPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  webSubCatPillTextActive: {
    color: '#FFFFFF',
  },
  webTwoColumnLayout: {
    flexDirection: 'row',
    gap: 24,
  },
  webSidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  sidebarHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  filterGroup: {
    marginBottom: 18,
  },
  filterGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  radioRowLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  resetFiltersBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  resetFiltersBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  webContentCol: {
    flex: 1,
  },
  webSectionBlock: {
    marginBottom: 28,
  },
  webSectionHeader: {
    marginBottom: 14,
  },
  webSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  webSectionSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  webPackagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  webPackageCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
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
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  packageParamCount: {
    fontSize: 12,
    color: '#00B894',
    fontWeight: '700',
  },
  packageName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  packageDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  packagePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B894',
  },
  packageMrp: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  packageViewBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  packageViewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  webTestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  webTestCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  webCardBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  webPopularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  webPopularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  webRecommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  webRecommendedBadgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
  },
  webSampleBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  webSampleBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  webCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  webCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },
  webAvailBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    gap: 12,
    marginBottom: 12,
  },
  webAvailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  webAvailText: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '600',
  },
  webAvailTextDisabled: {
    color: '#94A3B8',
  },
  webCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  webPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B894',
  },
  webMrpText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  webTatText: {
    fontSize: 11,
    color: '#64748B',
  },
  webDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  webDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  webBookBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#00B894',
  },
  webBookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  webEmptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  webEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  webEmptyDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  webTabContentBox: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  webTabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  webTabHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabFiltersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabFilterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tabFilterBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  tabFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  webBookingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  webBookingCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00B894',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bookingTestName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  bookingDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 3,
  },
  bookingPriceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00B894',
    marginTop: 4,
  },
  modalPrimaryBtn: {
    backgroundColor: '#00B894',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  webReportCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportCardId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  reportReadyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reportTestName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  reportMetaLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  reportDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  reportDownloadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  reportViewFullBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00B894',
  },
  reportViewFullBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── MODAL SHARED ───────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  bookingModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  reportModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  addAddressModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  modalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalPriceText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00B894',
  },
  modalMrpText: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  modalPrimaryBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── TEST DETAILS MODAL ───────────────────────────────────────────
  detailsSectionBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  detailsBlockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  detailsBlockDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  applicabilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  appliBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  appliBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  instructionCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  instructionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  instructionBody: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  detailsTwoColGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  detailsColBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  colBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  colBoxVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },

  // ─── PACKAGE MODAL ───────────────────────────────────────────────
  packageModalDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 14,
  },
  includedSectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  includedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  includedItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  includedItemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  includedItemDetailsLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
    marginLeft: 8,
  },

  // ─── BOOKING FLOW ────────────────────────────────────────────────
  bookingStepHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookingStepHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stepPromptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 14,
    marginTop: 4,
  },
  methodSelectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  methodSelectCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  methodRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  methodRadioActive: { borderColor: '#00B894' },
  methodRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B894',
  },
  methodSelectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  methodSelectSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 6,
  },
  methodFeeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  stepBlock: {
    marginBottom: 16,
  },
  stepBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  addAddressLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  addressCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  addressTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  addressLineText: {
    fontSize: 12,
    color: '#64748B',
  },
  centreSelectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  centreSelectCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  centreSelectName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  centreSelectAddress: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 3,
  },
  centreMetaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  centreMetaText: {
    fontSize: 11,
    color: '#00B894',
    fontWeight: '600',
  },
  datePillsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    minWidth: 60,
  },
  datePillActive: {
    borderColor: '#00B894',
    backgroundColor: '#00B894',
  },
  datePillDay: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  datePillDayActive: { color: '#FFFFFF' },
  datePillDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  datePillDateActive: { color: '#FFFFFF' },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    minWidth: 120,
    alignItems: 'center',
  },
  slotCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  slotLabelActive: { color: '#00B894' },
  slotPeriod: {
    fontSize: 10,
    color: '#64748B',
  },

  // ─── SUMMARY ─────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  summaryHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: '55%',
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
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B894',
  },

  // ─── PAYMENT ─────────────────────────────────────────────────────
  demoPaymentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  demoPaymentAlertText: {
    fontSize: 12,
    color: '#1D4ED8',
    flex: 1,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  paymentMethodCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  paymentMethodLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  paymentMethodLabelActive: { color: '#00B894' },
  stepBackBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  // ─── CONFIRMED ───────────────────────────────────────────────────
  confirmedBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  confirmedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 6,
  },
  confirmedBookingId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
    marginBottom: 10,
  },
  confirmedDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  viewBookingsConfirmedBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },
  viewBookingsConfirmedBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── TRACKING ────────────────────────────────────────────────────
  trackingTestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineStepRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeDone: { backgroundColor: '#00B894' },
  timelineNodeCurr: { backgroundColor: '#0284C7' },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 2,
    minHeight: 20,
  },
  timelineLineDone: { backgroundColor: '#00B894' },
  timelineTextCol: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 16,
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  timelineStepTitleCurr: { color: '#0284C7' },
  timelineStepDesc: {
    fontSize: 11,
    color: '#64748B',
  },

  // ─── REPORT VIEWER ───────────────────────────────────────────────
  reportModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  reportModalSub: {
    fontSize: 12,
    color: '#64748B',
  },
  reportPatientCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  reportPatientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  repPatientLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  repPatientVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  tableHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  paramsTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
  },
  paramsTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  paramsTableColHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  paramTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  paramNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  paramUnitText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  paramUnitSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  paramResultText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00B894',
  },
  paramRefText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
  },
  conclusionCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  conclusionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  conclusionText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  reportModalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  reportDownloadModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
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
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#00B894',
  },
  reportMyHealthBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── ADD ADDRESS ─────────────────────────────────────────────────
  addAddressTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  tagToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tagToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tagToggleBtnActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  tagToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tagToggleTextActive: { color: '#00B894' },
  addressInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
  },
  addAddressBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelAddressBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  cancelAddressBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  saveAddressBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#00B894',
    alignItems: 'center',
  },
  saveAddressBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── TOAST ───────────────────────────────────────────────────────
  downloadToast: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: [{ translateX: -130 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  downloadToastText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
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

export default LabTestsScreenWeb;
