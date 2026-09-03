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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import labTests, { labCategories } from '../../../data/labTests';
import colors from '../../../theme/colors';

const LabTestsScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
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
          <Text style={styles.headerTitle}>Diagnostic Lab Tests</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color={colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              Near Kuvempunagar, Mysore
            </Text>
          </View>
        </View>

        {selectedTestIds.length > 0 && (
          <TouchableOpacity
            style={styles.cartBadgeBtn}
            onPress={handleProceedWithSelected}
            activeOpacity={0.8}
          >
            <Ionicons name="flask" size={18} color="#FFFFFF" />
            <View style={styles.cartBadgeCount}>
              <Text style={styles.cartBadgeCountText}>{selectedTestIds.length}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ==================================================
          COLLECTION MODE QUICK FILTER TABS
      ================================================== */}
      <View style={styles.collectionTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.collectionTabsScroll}
        >
          {[
            { id: 'all', label: 'All Tests & Packages' },
            { id: 'home', label: '🏠 Home Collection Available' },
            { id: 'hospital', label: '🏥 Lab / Hospital Visit Only' },
            { id: 'packages', label: '⭐ Full Health Packages' },
          ].map((tab) => {
            const isTabActive = collectionFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.collectionTabPill, isTabActive && styles.collectionTabPillActive]}
                activeOpacity={0.8}
                onPress={() => setCollectionFilter(tab.id)}
              >
                <Text
                  style={[
                    styles.collectionTabText,
                    isTabActive && styles.collectionTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ==================================================
          SEARCH INPUT
      ================================================== */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search test name, CBC, Thyroid, Sugar, LFT..."
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

      {/* ==================================================
          CATEGORY PILLS
      ================================================== */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {labCategories.map((cat) => {
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
                  color={isCatActive ? '#FFFFFF' : colors.primary}
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
          HOME COLLECTION PROMO INFO BAR
      ================================================== */}
      <View style={styles.homePromoBar}>
        <Ionicons name="bicycle-outline" size={16} color={colors.primary} />
        <Text style={styles.homePromoText}>
          <Text style={{ fontWeight: '800' }}>Free Home Sample Collection</Text> • Certified Lab Boy visits doorstep with sterile single-use vacuum kit
        </Text>
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.coral,
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

  // COLLECTION TABS
  collectionTabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  collectionTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
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
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
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
    gap: 8,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  selectBtnActive: {
    backgroundColor: colors.primary,
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  selectBtnTextActive: {
    color: '#FFFFFF',
  },
  bookNowBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
  },
  bookNowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
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
  multiSelectBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default LabTestsScreen;