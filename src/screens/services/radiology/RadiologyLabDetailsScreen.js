import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { getLabById, radiologyCategories } from '../../../data/radiologyLabsData';
import { useCart } from '../../../context/CartContext';

const RadiologyLabDetailsScreen = ({ route, navigation }) => {
  const { labId, initialCategory } = route.params || {};
  const lab = getLabById(labId);

  const { labCart, addToCart, removeFromCart, labCartCount, labFinalTotal } = useCart();

  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTestId, setExpandedTestId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Show temporary toast message
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Filter tests inside this lab
  const filteredTests = useMemo(() => {
    return lab.availableTests.filter((test) => {
      const matchesCategory =
        selectedCategory === 'all' || test.category === selectedCategory;
      const matchesSearch =
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [lab, selectedCategory, searchQuery]);

  // Handle Add to Cart
  const handleAddToCart = (test) => {
    const cartItem = {
      id: test.id,
      name: test.name,
      category: 'Diagnostic Scan',
      categoryLabel: test.categoryLabel || 'Radiology',
      modality: test.categoryLabel,
      modalityCode: test.modalityCode,
      price: test.price,
      mrp: test.mrp,
      discount: test.discount,
      duration: test.duration,
      reportTime: test.reportTime,
      fastingRequired: test.fastingRequired,
      fastingHours: test.fastingHours,
      preparation: test.preparation,
      labId: lab.id,
      labName: lab.name,
      labArea: lab.area,
      labAddress: lab.address,
      labPhone: lab.phone,
      itemType: 'diagnostic',
      quantity: 1,
    };
    addToCart(cartItem, 1, 'lab');
    showToast(`Added "${test.name}" to Lab Cart`);
  };

  // Handle Direct Instant Booking
  const handleBookNow = (test) => {
    navigation.navigate('RadiologyBooking', {
      lab,
      test,
      selectedTests: [test],
    });
  };

  // Check if test is already in cart
  const isItemInCart = (testId) => {
    return labCart.some((item) => item.id === testId);
  };

  const toggleExpand = (testId) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#263238" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lab.name}
          </Text>
          <Text style={styles.headerSubtitle}>{lab.area}</Text>
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

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================================================
            LAB PROFILE CARD
        ================================================== */}
        <View style={styles.labProfileCard}>
          {/* BADGES */}
          <View style={styles.labBadgeRow}>
            <View style={styles.accreditTag}>
              <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
              <Text style={styles.accreditText}>{lab.accreditation}</Text>
            </View>
            <View style={styles.hoursTag}>
              <Ionicons name="time" size={13} color={colors.secondary} />
              <Text style={styles.hoursText}>{lab.openHours}</Text>
            </View>
          </View>

          <Text style={styles.labProfileName}>{lab.name}</Text>
          <Text style={styles.labTagline}>{lab.tagline}</Text>

          {/* ADDRESS & CONTACT */}
          <View style={styles.addressBox}>
            <Ionicons name="location" size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={styles.addressText}>{lab.address}</Text>
          </View>

          {/* STATS ROW */}
          <View style={styles.labStatsGrid}>
            <View style={styles.labStatBox}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFA000" />
                <Text style={styles.statBoldText}>{lab.rating}</Text>
              </View>
              <Text style={styles.statSubText}>{lab.reviewCount} Ratings</Text>
            </View>

            <View style={styles.labStatDivider} />

            <View style={styles.labStatBox}>
              <Text style={styles.statBoldText}>{lab.distance}</Text>
              <Text style={styles.statSubText}>Distance</Text>
            </View>

            <View style={styles.labStatDivider} />

            <View style={styles.labStatBox}>
              <Text style={[styles.statBoldText, { color: colors.coral }]}>3-4 Hrs</Text>
              <Text style={styles.statSubText}>Report Time</Text>
            </View>
          </View>

          {/* ACTION BUTTONS: CALL / MAPS */}
          <View style={styles.labActionRow}>
            <TouchableOpacity
              style={styles.labCallButton}
              activeOpacity={0.8}
              onPress={() => {
                Linking.openURL(`tel:${lab.phone}`);
              }}
            >
              <Ionicons name="call" size={15} color={colors.primary} />
              <Text style={styles.labCallText}>Call Lab Desk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.labDirectionsButton}
              activeOpacity={0.8}
              onPress={() => {
                const lat = lab.latitude || 12.2858;
                const lng = lab.longitude || 76.6341;
                const label = encodeURIComponent(`${lab.name}, ${lab.address}`);
                const url = Platform.select({
                  ios: `maps:0,0?q=${label}@${lat},${lng}`,
                  android: `geo:0,0?q=${lat},${lng}(${label})`,
                  default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`,
                });
                Linking.openURL(url).catch(() => {
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
                });
              }}
            >
              <Ionicons name="navigate" size={15} color={colors.secondary} />
              <Text style={styles.labDirectionsText}>Directions (GPS)</Text>
            </TouchableOpacity>
          </View>

          {/* EQUIPMENT HIGHLIGHTS */}
          {lab.equipmentList && (
            <View style={styles.equipmentBox}>
              <Text style={styles.equipmentTitle}>Technology & Equipment:</Text>
              <View style={styles.equipmentList}>
                {lab.equipmentList.map((eq, i) => (
                  <View key={i} style={styles.equipmentItem}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                    <Text style={styles.equipmentItemText}>{eq}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ==================================================
            SEARCH WITHIN LAB
        ================================================== */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search in ${lab.name.split(' ')[0]}...`}
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

        {/* ==================================================
            CATEGORY FILTER PILLS
        ================================================== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          {radiologyCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const countInLab =
              cat.id === 'all'
                ? lab.availableTests.length
                : lab.availableTests.filter((t) => t.category === cat.id).length;

            if (cat.id !== 'all' && countInLab === 0) return null;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon}
                  size={15}
                  color={isSelected ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.name} ({countInLab})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ==================================================
            TESTS CATALOG
        ================================================== */}
        <View style={styles.testsCatalogHeader}>
          <Text style={styles.testsCatalogTitle}>Available Scans & Diagnostic Tests</Text>
          <Text style={styles.testsCatalogCount}>{filteredTests.length} Tests</Text>
        </View>

        {filteredTests.length === 0 ? (
          <View style={styles.noTestsContainer}>
            <Ionicons name="flask-outline" size={45} color="#CBD5E1" />
            <Text style={styles.noTestsTitle}>No Tests in this Category</Text>
            <Text style={styles.noTestsSubtitle}>
              Try selecting 'All Tests' or clear your search keyword.
            </Text>
            <TouchableOpacity
              style={styles.showAllButton}
              onPress={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              <Text style={styles.showAllButtonText}>Show All Lab Tests</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.testsList}>
            {filteredTests.map((test) => {
              const inCart = isItemInCart(test.id);
              const isExpanded = expandedTestId === test.id;

              return (
                <View key={test.id} style={styles.testCard}>
                  {/* TOP ROW: MODALITY & FASTING BADGES */}
                  <View style={styles.testTopRow}>
                    <View style={styles.modalityBadge}>
                      <Ionicons name="scan" size={12} color={colors.primary} />
                      <Text style={styles.modalityBadgeText}>{test.modalityCode}</Text>
                    </View>

                    {test.fastingRequired ? (
                      <View style={styles.fastingRequiredBadge}>
                        <Ionicons name="alert-circle" size={12} color="#D97706" />
                        <Text style={styles.fastingRequiredText}>Fasting Required</Text>
                      </View>
                    ) : (
                      <View style={styles.noFastingBadge}>
                        <Ionicons name="checkmark" size={12} color="#059669" />
                        <Text style={styles.noFastingText}>No Fasting Required</Text>
                      </View>
                    )}
                  </View>

                  {/* TEST NAME & DESCRIPTION */}
                  <Text style={styles.testName}>{test.name}</Text>
                  <Text style={styles.testDesc} numberOfLines={isExpanded ? undefined : 2}>
                    {test.description}
                  </Text>

                  {/* DURATION & REPORT SPEED */}
                  <View style={styles.testMetaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="hourglass-outline" size={13} color={colors.secondary} />
                      <Text style={styles.metaText}>{test.duration}</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Ionicons name="document-text-outline" size={13} color={colors.coral} />
                      <Text style={styles.metaText}>{test.reportTime}</Text>
                    </View>
                  </View>

                  {/* EXPANDABLE PREPARATION & PARAMETERS */}
                  <TouchableOpacity
                    style={styles.expandToggle}
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(test.id)}
                  >
                    <Text style={styles.expandToggleText}>
                      {isExpanded ? 'Hide Test Preparation & Details' : 'View Preparation & Included Checks'}
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* PREPARATION GUIDELINES */}
                      {test.preparation && test.preparation.length > 0 && (
                        <View style={styles.prepSection}>
                          <Text style={styles.prepSectionTitle}>
                            <Ionicons name="information-circle-outline" size={14} color={colors.secondary} /> Pre-Test Preparation:
                          </Text>
                          {test.preparation.map((p, pIdx) => (
                            <View key={pIdx} style={styles.prepBulletRow}>
                              <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginTop: 5 }} />
                              <Text style={styles.prepBulletText}>{p}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* INCLUDED PARAMETERS */}
                      {test.includedParameters && test.includedParameters.length > 0 && (
                        <View style={styles.parametersSection}>
                          <Text style={styles.prepSectionTitle}>
                            <Ionicons name="checkbox-outline" size={14} color={colors.primary} /> What the Radiologist Examines:
                          </Text>
                          {test.includedParameters.map((param, pmIdx) => (
                            <View key={pmIdx} style={styles.prepBulletRow}>
                              <Ionicons name="checkmark" size={12} color={colors.primary} style={{ marginTop: 2 }} />
                              <Text style={styles.paramBulletText}>{param}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* PRICING & ACTION ROW */}
                  <View style={styles.testPricingRow}>
                    <View style={styles.priceContainer}>
                      <View style={styles.priceMainRow}>
                        <Text style={styles.currentPrice}>₹{test.price}</Text>
                        <Text style={styles.mrpPrice}>₹{test.mrp}</Text>
                      </View>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{test.discount}</Text>
                      </View>
                    </View>

                    <View style={styles.testActionButtons}>
                      {/* ADD TO CART BUTTON */}
                      <TouchableOpacity
                        style={[
                          styles.cartAddBtn,
                          inCart && styles.cartAddBtnActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (inCart) {
                            removeFromCart(test.id);
                            showToast(`Removed from Cart`);
                          } else {
                            handleAddToCart(test);
                          }
                        }}
                      >
                        <Ionicons
                          name={inCart ? 'checkmark-circle' : 'cart-outline'}
                          size={16}
                          color={inCart ? '#FFFFFF' : colors.primary}
                        />
                        <Text
                          style={[
                            styles.cartAddBtnText,
                            inCart && styles.cartAddBtnTextActive,
                          ]}
                        >
                          {inCart ? 'In Cart' : 'Add to Cart'}
                        </Text>
                      </TouchableOpacity>

                      {/* DIRECT BOOK NOW BUTTON */}
                      <TouchableOpacity
                        style={styles.bookNowBtn}
                        activeOpacity={0.88}
                        onPress={() => handleBookNow(test)}
                      >
                        <Text style={styles.bookNowBtnText}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
    marginRight: 10,
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

  // TOAST
  toastContainer: {
    position: 'absolute',
    top: 65,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  scrollContent: {
    paddingBottom: 110,
  },

  // LAB PROFILE CARD
  labProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  labBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  accreditTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  accreditText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  hoursTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  hoursText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
  },
  labProfileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.secondary,
    lineHeight: 24,
  },
  labTagline: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    marginBottom: 10,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
  },

  // STATS GRID
  labStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  labStatBox: {
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statBoldText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  statSubText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  labStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  // ACTION BUTTONS
  labActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  labCallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightTeal,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  labCallText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  labDirectionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  labDirectionsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },

  // EQUIPMENT
  equipmentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  equipmentTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 6,
  },
  equipmentList: {
    gap: 4,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  equipmentItemText: {
    fontSize: 11,
    color: colors.text,
  },

  // SEARCH SECTION
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
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

  // CATEGORY PILLS
  categoryPillsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },

  // TESTS CATALOG
  testsCatalogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  testsCatalogTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
  },
  testsCatalogCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  testsList: {
    paddingHorizontal: 16,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  testTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  modalityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  fastingRequiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  fastingRequiredText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  noFastingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  noFastingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },

  testName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  testDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },

  testMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },

  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 6,
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  expandedContent: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  prepSection: {},
  prepSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 4,
  },
  prepBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 3,
  },
  prepBulletText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
  },
  parametersSection: {},
  paramBulletText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
  },

  // PRICING & ACTIONS
  testPricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceContainer: {},
  priceMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  currentPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  mrpPrice: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  discountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },

  testActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 4,
  },
  cartAddBtnActive: {
    backgroundColor: colors.primary,
  },
  cartAddBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  cartAddBtnTextActive: {
    color: '#FFFFFF',
  },
  bookNowBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  bookNowBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // NO TESTS
  noTestsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noTestsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 10,
  },
  noTestsSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  showAllButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  showAllButtonText: {
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
});

export default RadiologyLabDetailsScreen;
