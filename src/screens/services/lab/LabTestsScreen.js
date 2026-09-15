import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import labTests, { labCategories } from '../../../data/labTests';
import colors from '../../../theme/colors';
import LabTestsScreenWeb from './LabTestsScreen.web';

const LabTestsScreen = (props) => {
  if (Platform.OS === 'web') {
    return <LabTestsScreenWeb {...props} />;
  }

  const { navigation, route } = props;
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  const [search, setSearch] = useState(route?.params?.query || route?.params?.search || '');

  React.useEffect(() => {
    if (route?.params?.query !== undefined) {
      setSearch(route.params.query);
    } else if (route?.params?.search !== undefined) {
      setSearch(route.params.search);
    }
  }, [route?.params?.query, route?.params?.search]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState('all'); // 'all' | 'home' | 'hospital' | 'packages'

  // Multi-selected test IDs
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [expandedTestId, setExpandedTestId] = useState(null);

  // Toggle selection
  const toggleTestSelection = (test) => {
    if (selectedTestIds.includes(test.id)) {
      setSelectedTestIds(selectedTestIds.filter((id) => id !== test.id));
    } else {
      setSelectedTestIds([...selectedTestIds, test.id]);
    }
  };

  // Direct Book single test
  const handleDirectBook = (test) => {
    navigation.navigate('LabBooking', {
      selectedTests: [test],
      source: 'single',
    });
  };

  // Upgrade directly to the 6-in-1 Master Health Package for ₹666
  const handleUpgradeToPackage = (fromTest) => {
    const pkg = labTests.find((t) => t.id === 'pkg-6in1');
    if (pkg) {
      navigation.navigate('LabBooking', {
        selectedTests: [pkg],
        source: 'upgrade_package',
        upgradedFrom: fromTest?.name,
      });
    }
  };

  // Proceed with multiple selected tests
  const handleProceedWithSelected = () => {
    const selectedList = labTests.filter((t) => selectedTestIds.includes(t.id));
    if (selectedList.length === 0) return;
    navigation.navigate('LabBooking', {
      selectedTests: selectedList,
      source: 'multi',
    });
  };

  // Filtered tests
  const filteredTests = useMemo(() => {
    return labTests.filter((test) => {
      // 1. Search
      const matchesSearch =
        test.name.toLowerCase().includes(search.toLowerCase()) ||
        test.description.toLowerCase().includes(search.toLowerCase()) ||
        test.parametersList.some((p) => p.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Collection filter
      if (collectionFilter === 'home' && !test.homeCollectionAvailable) return false;
      if (collectionFilter === 'hospital' && test.homeCollectionAvailable) return false;
      if (collectionFilter === 'packages' && test.category !== 'packages') return false;

      // 3. Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'home' && !test.homeCollectionAvailable) return false;
        if (selectedCategory === 'hospital' && test.homeCollectionAvailable) return false;
        if (selectedCategory !== 'home' && selectedCategory !== 'hospital' && test.category !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [search, collectionFilter, selectedCategory]);

  // Selected items calculations
  const selectedTestsList = useMemo(() => {
    return labTests.filter((t) => selectedTestIds.includes(t.id));
  }, [selectedTestIds]);

  const selectedTotalAmount = useMemo(() => {
    return selectedTestsList.reduce((sum, item) => sum + item.price, 0);
  }, [selectedTestsList]);

  const hasHospitalOnlyTest = useMemo(() => {
    return selectedTestsList.some((t) => !t.homeCollectionAvailable);
  }, [selectedTestsList]);

  const renderTestCard = ({ item }) => {
    const isSelected = selectedTestIds.includes(item.id);
    const isExpanded = expandedTestId === item.id;
    const isSpecialPackage = item.id === 'pkg-6in1' || item.category === 'packages';

    return (
      <View style={[styles.testCard, isSelected && styles.testCardSelected]}>
        {/* CARD TOP ROW: BADGES */}
        <View style={styles.cardTopRow}>
          {item.homeCollectionAvailable ? (
            <View style={styles.homeBadge}>
              <Ionicons name="home" size={12} color="#059669" />
              <Text style={styles.homeBadgeText}>Home Sample Collection</Text>
            </View>
          ) : (
            <View style={styles.hospitalBadge}>
              <Ionicons name="business" size={12} color="#D97706" />
              <Text style={styles.hospitalBadgeText}>Lab / Hospital Visit Only</Text>
            </View>
          )}

          <View style={styles.discountPill}>
            <Text style={styles.discountPillText}>{item.discount}</Text>
          </View>
        </View>

        {/* TEST NAME & DESCRIPTION */}
        <Text style={styles.testName}>{item.name}</Text>
        <Text style={styles.testDesc}>{item.description}</Text>

        {/* HOSPITAL REASON WARNING (IF APPLICABLE) */}
        {!item.homeCollectionAvailable && item.hospitalReason && (
          <View style={styles.hospitalReasonBox}>
            <Ionicons name="information-circle" size={14} color="#D97706" style={{ marginTop: 1 }} />
            <Text style={styles.hospitalReasonText}>{item.hospitalReason}</Text>
          </View>
        )}

        {/* KEY HIGHLIGHTS: SAMPLE TYPE, FASTING, REPORT TIME */}
        <View style={styles.testHighlightsGrid}>
          <View style={styles.highlightItem}>
            <Ionicons name="flask-outline" size={13} color={colors.secondary} />
            <Text style={styles.highlightText}>{item.sampleType}</Text>
          </View>
          <View style={styles.highlightItem}>
            <Ionicons
              name={item.fastingRequired ? 'alert-circle-outline' : 'checkmark-circle-outline'}
              size={13}
              color={item.fastingRequired ? '#DC2626' : '#059669'}
            />
            <Text style={[styles.highlightText, item.fastingRequired && { color: '#DC2626' }]}>
              {item.fastingRequired ? 'Fasting Required' : 'No Fasting'}
            </Text>
          </View>
          <View style={styles.highlightItem}>
            <Ionicons name="time-outline" size={13} color={colors.primary} />
            <Text style={styles.highlightText}>{item.reportTime}</Text>
          </View>
        </View>

        {/* EXPANDABLE PARAMETERS */}
        <TouchableOpacity
          style={styles.expandParamsBtn}
          activeOpacity={0.7}
          onPress={() => setExpandedTestId(isExpanded ? null : item.id)}
        >
          <Text style={styles.expandParamsText}>
            Includes {item.parametersCount} Parameters {isExpanded ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.parametersBox}>
            <Text style={styles.parametersTitle}>Parameters Tested:</Text>
            {item.parametersList.map((param, pIdx) => (
              <View key={pIdx} style={styles.paramRow}>
                <Ionicons name="ellipse" size={5} color={colors.primary} style={{ marginTop: 5 }} />
                <Text style={styles.paramText}>{param}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ==========================================
            SMART PACKAGE UPGRADE SUGGESTION (FOR INDIVIDUAL TESTS)
        ========================================== */}
        {!isSpecialPackage && (
          <View style={styles.upgradeCard}>
            <View style={styles.upgradeHeaderRow}>
              <View style={styles.upgradeBadge}>
                <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                <Text style={styles.upgradeBadgeText}>SMART VALUE UPGRADE</Text>
              </View>
              <Text style={styles.upgradePriceChip}>6 Tests for ₹666</Text>
            </View>

            <Text style={styles.upgradeHeading}>
              Get <Text style={{ fontWeight: '900', color: colors.teal }}>{item.name.split('(')[0].trim()}</Text> + 5 Extra Vital Tests!
            </Text>
            <Text style={styles.upgradeSubText}>
              Includes CBC, Lipid Profile, Thyroid, Sugar, Liver LFT & Kidney KFT (58 Parameters).
            </Text>

            <TouchableOpacity
              style={styles.upgradeActionBtn}
              activeOpacity={0.88}
              onPress={() => handleUpgradeToPackage(item)}
            >
              <Ionicons name="arrow-up-circle" size={16} color="#FFFFFF" />
              <Text style={styles.upgradeActionBtnText}>Upgrade to 6-in-1 Package @ ₹666</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PRICE & DUAL ACTION BUTTONS */}
        <View style={styles.cardFooter}>
          <View style={styles.priceCol}>
            <Text style={styles.mrpText}>₹{item.mrp}</Text>
            <Text style={styles.priceText}>₹{item.price}</Text>
          </View>

          <View style={styles.actionsGroup}>
            {/* SELECT / ADD TO CART TOGGLE */}
            <TouchableOpacity
              style={[styles.selectBtn, isSelected && styles.selectBtnActive]}
              activeOpacity={0.8}
              onPress={() => toggleTestSelection(item)}
            >
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                size={16}
                color={isSelected ? '#FFFFFF' : colors.primary}
              />
              <Text style={[styles.selectBtnText, isSelected && styles.selectBtnTextActive]}>
                {isSelected ? 'Selected' : 'Select'}
              </Text>
            </TouchableOpacity>

            {/* DIRECT BOOK NOW */}
            <TouchableOpacity
              style={styles.bookNowBtn}
              activeOpacity={0.88}
              onPress={() => handleDirectBook(item)}
            >
              <Text style={styles.bookNowBtnText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==================================================
          HEADER (MOBILE ONLY)
      ================================================== */}
      {!isDesktopWeb && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#1E3A8A" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Lab Tests</Text>
            <Text style={styles.headerSub}>Accurate. Affordable. At your convenience.</Text>
          </View>

          <TouchableOpacity
            style={styles.cartBadgeBtn}
            onPress={handleProceedWithSelected}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={20} color="#1E3A8A" />
            {selectedTestIds.length > 0 && (
              <View style={styles.cartBadgeCount}>
                <Text style={styles.cartBadgeCountText}>{selectedTestIds.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ==================================================
          SEARCH INPUT
      ================================================== */}
      {!isDesktopWeb && (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={19} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tests, packages, parameters..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ==================================================
          FILTER CHIP STRIP (FROM MOCKUP)
      ================================================== */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {[
            { id: 'all', name: 'Popular', icon: 'sparkles' },
            { id: 'packages', name: 'Full Body', icon: 'fitness-outline' },
            { id: 'diabetes', name: 'Diabetes', icon: 'pulse-outline' },
            { id: 'thyroid', name: 'Thyroid', icon: 'water-outline' },
            { id: 'vitamins', name: 'Vitamin', icon: 'sunny-outline' },
            { id: 'blood', name: 'Blood', icon: 'medkit-outline' },
          ].map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, isCatActive && styles.catPillActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isCatActive ? '#FFFFFF' : '#0D9488'}
                />
                <Text style={[styles.catPillText, isCatActive && styles.catPillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ==================================================
          HERO PROMO CARD: BOOK A TEST AT HOME (FROM MOCKUP)
      ================================================== */}
      <View style={styles.homeHeroCard}>
        <View style={styles.homeHeroLeft}>
          <Text style={styles.homeHeroTitle}>Book a Test at Home</Text>
          <View style={styles.homeHeroBullets}>
            <View style={styles.heroBulletRow}>
              <Ionicons name="checkmark-circle" size={14} color="#00B894" />
              <Text style={styles.heroBulletText}>100% Safe & Hygienic</Text>
            </View>
            <View style={styles.heroBulletRow}>
              <Ionicons name="checkmark-circle" size={14} color="#00B894" />
              <Text style={styles.heroBulletText}>Free Sample Collection</Text>
            </View>
            <View style={styles.heroBulletRow}>
              <Ionicons name="checkmark-circle" size={14} color="#00B894" />
              <Text style={styles.heroBulletText}>Digital Reports in 24 hrs</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.homeHeroCta}
            activeOpacity={0.85}
            onPress={() => setCollectionFilter(collectionFilter === 'home' ? 'all' : 'home')}
          >
            <Text style={styles.homeHeroCtaText}>
              {collectionFilter === 'home' ? 'Showing Home Tests ✓' : 'Book Home Visit →'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.homeHeroRight}>
          <View style={styles.heroFlaskCircle}>
            <Ionicons name="flask" size={38} color="#00B894" />
          </View>
        </View>
      </View>

      {/* ==================================================
          POPULAR HEALTH PACKAGES SECTION (FROM MOCKUP)
      ================================================== */}
      <View style={styles.packagesSectionHeader}>
        <Text style={styles.packagesSectionTitle}>Popular Health Packages</Text>
        <Text style={styles.packagesSectionSub}>Comprehensive full-body preventive checks</Text>
      </View>

      {/* ==================================================
          TESTS LIST
      ================================================== */}
      <FlatList
        data={filteredTests}
        keyExtractor={(item) => item.id}
        renderItem={renderTestCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          selectedTestIds.length > 0 && { paddingBottom: 110 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Lab Tests Found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with another keyword or reset the category filters.
            </Text>
          </View>
        }
      />

      {/* ==================================================
          STICKY MULTI-SELECT BOTTOM BAR
      ================================================== */}
      {selectedTestIds.length > 0 && (
        <View style={styles.multiSelectBottomContainer}>
          {/* SMART UPGRADE RECOMMENDATION STRIP (IF 2+ TESTS OR TOTAL >= 500) */}
          {(selectedTestIds.length >= 2 || selectedTotalAmount >= 500) && (
            <TouchableOpacity
              style={styles.stickyUpgradeStrip}
              onPress={() => handleUpgradeToPackage({ name: 'Selected Tests' })}
              activeOpacity={0.88}
            >
              <View style={styles.stickyUpgradeLeft}>
                <Ionicons name="sparkles" size={15} color="#D97706" />
                <Text style={styles.stickyUpgradeText}>
                  Upgrade to <Text style={{ fontWeight: '900', color: colors.teal }}>6-in-1 Master Package (₹666)</Text> — Save more!
                </Text>
              </View>
              <View style={styles.stickyUpgradePill}>
                <Text style={styles.stickyUpgradePillText}>Upgrade ›</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.multiSelectBottomBar}>
            <View style={styles.bottomBarLeft}>
              <Text style={styles.bottomCountText}>
                {selectedTestIds.length} {selectedTestIds.length === 1 ? 'Test' : 'Tests'} Selected
              </Text>
              <Text style={styles.bottomTotalText}>₹{selectedTotalAmount}</Text>
              {hasHospitalOnlyTest ? (
                <Text style={styles.bottomNoticeHospital}>⚠️ Includes Lab / Hospital Visit Test</Text>
              ) : (
                <Text style={styles.bottomNoticeHome}>✓ Eligible for Free Home Collection</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.proceedButton}
              activeOpacity={0.88}
              onPress={handleProceedWithSelected}
            >
              <Text style={styles.proceedButtonText}>Proceed to Schedule</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.secondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  cartBadgeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // HERO HOME PROMO CARD (MOCKUP)
  homeHeroCard: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  homeHeroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  homeHeroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  homeHeroBullets: {
    gap: 4,
    marginBottom: 12,
  },
  heroBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBulletText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  homeHeroCta: {
    alignSelf: 'flex-start',
    backgroundColor: '#00B894',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  homeHeroCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  homeHeroRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroFlaskCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#99F6E4',
  },

  // PACKAGES SECTION HEADER
  packagesSectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  packagesSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  packagesSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // COLLECTION TABS
  collectionTabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  collectionTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  collectionTabsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    rowGap: 8,
  },
  collectionTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  collectionTabPillActive: {
    backgroundColor: colors.secondary,
  },
  collectionTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  collectionTabTextActive: {
    color: '#FFFFFF',
  },

  // SEARCH BAR
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text,
  },

  // CATEGORIES
  categoriesContainer: {
    paddingVertical: 6,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    rowGap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    gap: 5,
  },
  catPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },

  // PROMO BAR
  homePromoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  homePromoText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 15,
  },

  // LIST & CARDS
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  testCardSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#FAFEFD',
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  homeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  hospitalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  hospitalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  discountPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
  },

  testName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
    lineHeight: 20,
  },
  testDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },

  hospitalReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hospitalReasonText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },

  testHighlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
    gap: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },

  expandParamsBtn: {
    paddingVertical: 6,
    marginTop: 4,
  },
  expandParamsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  parametersBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  parametersTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 4,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 3,
  },
  paramText: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 15,
  },

  // SMART UPGRADE SUGGESTION CARD
  upgradeCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#99F6E4',
  },
  upgradeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  upgradeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  upgradePriceChip: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.navyBlue,
  },
  upgradeHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 17,
  },
  upgradeSubText: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 15,
  },
  upgradeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    height: 38,
    gap: 6,
  },
  upgradeActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  mrpText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  priceText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.secondary,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    height: 38,
    gap: 5,
  },
  selectBtnActive: {
    backgroundColor: colors.primary,
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  selectBtnTextActive: {
    color: '#FFFFFF',
  },
  bookNowBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // EMPTY
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },

  // MULTI-SELECT STICKY BOTTOM BAR
  multiSelectBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  stickyUpgradeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  stickyUpgradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  stickyUpgradeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
  stickyUpgradePill: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  stickyUpgradePillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  multiSelectBottomBar: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  bottomTotalText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  bottomNoticeHospital: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 1,
  },
  bottomNoticeHome: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginTop: 1,
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    height: 44,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  webBreadcrumbWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 10,
  },
  webBreadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webBreadcrumbLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0071DC',
  },
  webBreadcrumbCurrent: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  webBreadcrumbQuery: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
});

export default LabTestsScreen;