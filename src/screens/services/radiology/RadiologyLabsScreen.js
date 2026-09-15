import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { radiologyLabs, radiologyCategories } from '../../../data/radiologyLabsData';
import { useCart } from '../../../context/CartContext';
import ImagingScreenWeb from './ImagingScreen.web';

const RadiologyLabsScreen = (props) => {
  if (Platform.OS === 'web') {
    return <ImagingScreenWeb {...props} />;
  }

  const { navigation, route } = props;
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  const { labCartCount, labFinalTotal } = useCart();
  const [searchQuery, setSearchQuery] = useState(route?.params?.query || route?.params?.search || '');

  React.useEffect(() => {
    if (route?.params?.query !== undefined) {
      setSearchQuery(route.params.query);
    } else if (route?.params?.search !== undefined) {
      setSearchQuery(route.params.search);
    }
  }, [route?.params?.query, route?.params?.search]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filterTabs = ['All', 'Top Rated (4.8+)', 'Open 24x7', 'Nearest', 'Special Offers'];

  // Filter labs based on search, modality category, and tabs
  const filteredLabs = useMemo(() => {
    return radiologyLabs.filter((lab) => {
      // Search filter
      const matchesSearch =
        lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.availableTests.some((t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())
        );

      if (!matchesSearch) return false;

      // Modality category filter
      if (selectedCategory !== 'all') {
        const hasCategoryTest = lab.availableTests.some(
          (t) => t.category === selectedCategory
        );
        if (!hasCategoryTest) return false;
      }

      // Quick filter tabs
      if (selectedFilter === 'Top Rated (4.8+)') {
        return lab.rating >= 4.8;
      }
      if (selectedFilter === 'Open 24x7') {
        return lab.openHours.toLowerCase().includes('24x7');
      }
      if (selectedFilter === 'Nearest') {
        return parseFloat(lab.distance) <= 3.0;
      }
      if (selectedFilter === 'Special Offers') {
        return !!lab.discountOffer;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedFilter]);

  const renderLabCard = ({ item: lab }) => {
    return (
      <TouchableOpacity
        style={styles.labCard}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('RadiologyLabDetails', {
            labId: lab.id,
            initialCategory: selectedCategory,
          })
        }
      >
        {/* TOP ROW: BADGE & DISTANCE */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.certifiedBadge}>
              <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
              <Text style={styles.certifiedBadgeText}>{lab.accreditation}</Text>
            </View>
            {lab.badge && (
              <View style={styles.specialBadge}>
                <Text style={styles.specialBadgeText}>{lab.badge}</Text>
              </View>
            )}
          </View>
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={12} color={colors.secondary} />
            <Text style={styles.distanceText}>{lab.distance}</Text>
          </View>
        </View>

        {/* LAB TITLE & LOCATION */}
        <View style={styles.labMainInfo}>
          <View style={styles.labIconBox}>
            <Ionicons name="radio-outline" size={26} color={colors.primary} />
          </View>
          <View style={styles.labTitleContent}>
            <Text style={styles.labName} numberOfLines={2}>
              {lab.name}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.labArea} numberOfLines={1}>
                {lab.area}
              </Text>
            </View>
          </View>
        </View>

        {/* STATS ROW: RATING, TIMINGS & TURNAROUND */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={12} color="#FFA000" />
              <Text style={styles.ratingNumber}>{lab.rating}</Text>
            </View>
            <Text style={styles.statLabel}>({lab.reviewCount} reviews)</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={colors.secondary} />
            <Text style={styles.statText} numberOfLines={1}>
              {lab.openHours.includes('24x7') ? '24x7 Open' : 'Open Today'}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="flash-outline" size={14} color={colors.coral} />
            <Text style={styles.statText}>Reports in 4h</Text>
          </View>
        </View>

        {/* MODALITIES CHIPS */}
        <View style={styles.modalitiesRow}>
          {lab.modalities.slice(0, 4).map((modality, idx) => (
            <View key={idx} style={styles.modalityChip}>
              <Text style={styles.modalityChipText}>{modality}</Text>
            </View>
          ))}
          {lab.modalities.length > 4 && (
            <View style={[styles.modalityChip, styles.modalityMoreChip]}>
              <Text style={styles.modalityMoreText}>+{lab.modalities.length - 4} more</Text>
            </View>
          )}
        </View>

        {/* OFFER BANNER */}
        {lab.discountOffer && (
          <View style={styles.offerBanner}>
            <Ionicons name="pricetag" size={13} color="#00875A" />
            <Text style={styles.offerText}>{lab.discountOffer}</Text>
          </View>
        )}

        {/* ACTION BUTTON */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.testsAvailableCount}>
              {lab.availableTests.length} Tests & Scans Available
            </Text>
            <Text style={styles.startingPriceText}>
              From ₹{Math.min(...lab.availableTests.map((t) => t.price))}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.viewTestsButton}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('RadiologyLabDetails', {
                labId: lab.id,
                initialCategory: selectedCategory,
              })
            }
          >
            <Text style={styles.viewTestsButtonText}>View Tests & Book</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==================================================
          HEADER
      ================================================== */}
      {/* HEADER (MOBILE ONLY) */}
      {!isDesktopWeb && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color={colors.secondary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Radiology & Scans</Text>
              <View style={styles.headerLiveDot} />
            </View>
            <Text style={styles.headerSubtitle}>Accredited Diagnostic Labs & Imaging</Text>
          </View>

          <TouchableOpacity
            style={styles.cartHeaderButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Cart', { initialTab: 'lab' })}
          >
            <Ionicons name="flask-outline" size={24} color={colors.secondary} />
            {labCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{labCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}



      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SEARCH BAR (MOBILE ONLY) */}
        {!isDesktopWeb && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search MRI, CT Scan, X-Ray, Lab name..."
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
        )}

        {/* ==================================================
            HERO PROMO BANNER
        ================================================== */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={styles.heroTag}>
              <Ionicons name="sparkles" size={12} color="#FFFFFF" />
              <Text style={styles.heroTagText}>MEDIUNIFY RADIOLOGY NETWORK</Text>
            </View>
            <Text style={styles.heroTitle}>Book Scans with Top Diagnostic Centers</Text>
            <Text style={styles.heroDesc}>
              3T MRI • 128-Slice CT • 4D Ultrasound • Digital X-Ray • Instant Digital Reports
            </Text>
          </View>
        </View>

        {/* ==================================================
            MODALITY SELECTOR CHIPS
        ================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Scan Modalities</Text>
          <Text style={styles.sectionCount}>{radiologyCategories.length} Categories</Text>
        </View>

        {Platform.OS === 'web' ? (
          <View style={styles.categoriesWrap}>
            {radiologyCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <View
                    style={[
                      styles.categoryIconWrap,
                      isSelected && styles.categoryIconWrapActive,
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={18}
                      color={isSelected ? '#FFFFFF' : colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {radiologyCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <View
                    style={[
                      styles.categoryIconWrap,
                      isSelected && styles.categoryIconWrapActive,
                    ]}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={18}
                      color={isSelected ? '#FFFFFF' : colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ==================================================
            QUICK FILTER TABS
        ================================================== */}
        {Platform.OS === 'web' ? (
          <View style={styles.filterTabsWrap}>
            {filterTabs.map((tab) => {
              const isSelected = selectedFilter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.filterTab,
                    isSelected && styles.filterTabActive,
                  ]}
                  onPress={() => setSelectedFilter(tab)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      isSelected && styles.filterTabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsScroll}
          >
            {filterTabs.map((tab) => {
              const isSelected = selectedFilter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.filterTab,
                    isSelected && styles.filterTabActive,
                  ]}
                  onPress={() => setSelectedFilter(tab)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      isSelected && styles.filterTabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ==================================================
            LAB LISTINGS
        ================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Diagnostic Centers</Text>
          <Text style={styles.sectionCount}>{filteredLabs.length} Labs Near You</Text>
        </View>

        {filteredLabs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Diagnostic Centers Found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching for a different test or change your filters.
            </Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedFilter('All');
              }}
            >
              <Text style={styles.resetButtonText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredLabs}
            keyExtractor={(item) => item.id}
            renderItem={renderLabCard}
            scrollEnabled={false}
            contentContainerStyle={styles.labsList}
          />
        )}
      </ScrollView>

      {/* ==================================================
          FLOATING BOTTOM CART BAR
      ================================================== */}
      {labCartCount > 0 && (
        <View style={styles.floatingCartBar}>
          <View style={styles.cartInfoSection}>
            <View style={styles.cartBadgeSmall}>
              <Ionicons name="flask" size={16} color="#FFFFFF" />
              <Text style={styles.cartBadgeSmallText}>{labCartCount}</Text>
            </View>
            <View style={styles.cartPriceCol}>
              <Text style={styles.cartTotalLabel}>Lab Tests Total</Text>
              <Text style={styles.cartTotalAmount}>₹{labFinalTotal}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.cartProceedButton}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Cart', { initialTab: 'lab' })}
          >
            <Text style={styles.cartProceedText}>View Lab Cart</Text>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.secondary,
  },
  headerLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cartHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.coral,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  scrollContent: {
    paddingBottom: 100,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },

  // SEARCH
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },

  // HERO BANNER
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  heroContent: {},
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  heroTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  heroDesc: {
    color: '#93C5FD',
    fontSize: 11,
    marginTop: 5,
    lineHeight: 16,
    fontWeight: '500',
  },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // CATEGORIES SCROLL
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 8,
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 6,
    rowGap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },

  // FILTER TABS
  filterTabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTabsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 10,
    rowGap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // LABS LIST & CARDS
  labsList: {
    paddingHorizontal: 16,
  },
  labCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  certifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  certifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  specialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
  },

  labMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  labTitleContent: {
    flex: 1,
  },
  labName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  labArea: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // STATS
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },

  // MODALITIES
  modalitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  modalityChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalityChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
  },
  modalityMoreChip: {
    backgroundColor: '#F1F5F9',
  },
  modalityMoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // OFFER
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  offerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },

  // CARD FOOTER
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  testsAvailableCount: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  startingPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  viewTestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    height: 38,
    gap: 6,
  },
  viewTestsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // EMPTY STATE
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
  resetButton: {
    marginTop: 16,
    backgroundColor: colors.secondary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // FLOATING CART BAR
  floatingCartBar: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cartInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  cartBadgeSmallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cartPriceCol: {},
  cartTotalLabel: {
    fontSize: 10,
    color: '#93C5FD',
    fontWeight: '600',
  },
  cartTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cartProceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 5,
  },
  cartProceedText: {
    color: '#FFFFFF',
    fontSize: 12,
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

export default RadiologyLabsScreen;
