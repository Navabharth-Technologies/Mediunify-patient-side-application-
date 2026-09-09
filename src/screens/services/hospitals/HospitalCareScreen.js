import React, { useMemo, useState, useEffect } from 'react';
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
  Linking,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { showAlert } from '../../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { requestLocationPermissionWebSafe, getCurrentPositionWebSafe, reverseGeocodeWebSafe } from '../../../utils/locationHelper';
import colors from '../../../theme/colors';
import {
  surgeryHospitals,
  surgerySpecialties,
} from '../../../data/surgeryHospitalsData';

export const POPULAR_LOCALITIES = [
  { id: '1', name: 'Kuvempunagar', city: 'Mysore', full: 'Kuvempunagar, Mysore', latitude: 12.2858, longitude: 76.6341 },
  { id: '2', name: 'Jayalakshmipuram', city: 'Mysore', full: 'Jayalakshmipuram, Mysore', latitude: 12.3180, longitude: 76.6260 },
  { id: '3', name: 'Saraswathipuram', city: 'Mysore', full: 'Saraswathipuram, Mysore', latitude: 12.3020, longitude: 76.6350 },
  { id: '4', name: 'Vijayanagar 2nd Stage', city: 'Mysore', full: 'Vijayanagar, Mysore', latitude: 12.3350, longitude: 76.6120 },
  { id: '5', name: 'Gokulam 3rd Stage', city: 'Mysore', full: 'Gokulam, Mysore', latitude: 12.3290, longitude: 76.6280 },
  { id: '6', name: 'V.V. Mohalla', city: 'Mysore', full: 'V.V. Mohalla, Mysore', latitude: 12.3210, longitude: 76.6390 },
  { id: '7', name: 'Bannimantap', city: 'Mysore', full: 'Bannimantap, Mysore', latitude: 12.3380, longitude: 76.6520 },
  { id: '8', name: 'Nazarbad', city: 'Mysore', full: 'Nazarbad, Mysore', latitude: 12.3080, longitude: 76.6650 },
  { id: '9', name: 'Hebbal 1st Stage', city: 'Mysore', full: 'Hebbal, Mysore', latitude: 12.3610, longitude: 76.6150 },
  { id: '10', name: 'Mysore Central / Agrahara', city: 'Mysore', full: 'Agrahara, Mysore', latitude: 12.2965, longitude: 76.6540 },
  { id: '11', name: 'Devanur / Ring Road', city: 'Mysore', full: 'Devanur, Mysore', latitude: 12.3210, longitude: 76.6780 },
];

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.0;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

const HospitalCareScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;
  const [search, setSearch] = useState(route?.params?.query || route?.params?.search || '');

  useEffect(() => {
    if (route?.params?.query !== undefined) {
      setSearch(route.params.query);
    } else if (route?.params?.search !== undefined) {
      setSearch(route.params.search);
    }
  }, [route?.params?.query, route?.params?.search]);

  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Location State
  const initialLocality = route?.params?.locality || 'Kuvempunagar, Mysore';
  const [userLocality, setUserLocality] = useState(initialLocality);
  const [userCoords, setUserCoords] = useState({ latitude: 12.2858, longitude: 76.6341 });
  const [loadingGps, setLoadingGps] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [customLocalityInput, setCustomLocalityInput] = useState('');
  const [locationToast, setLocationToast] = useState(null);

  const filterTabs = [
    'All',
    'NABH Accredited',
    'Cashless TPA / Insurance',
    'Minimally Invasive Daycare',
    'Open 24x7',
  ];

  // Detect Live GPS Location
  const detectLocation = async () => {
    try {
      setLoadingGps(true);
      const perm = await requestLocationPermissionWebSafe();
      if (!perm.granted && perm.status !== 'granted') {
        setLoadingGps(false);
        showAlert(
          'Location Permission Required',
          'Please enable device location permission or pick an area from the list below.'
        );
        return;
      }
      const position = await getCurrentPositionWebSafe({
        accuracy: Location.Accuracy.Balanced,
      });

      const newCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setUserCoords(newCoords);

      const reverse = await reverseGeocodeWebSafe(newCoords);
      let detectedName = 'Current Location';
      if (reverse && reverse.length > 0) {
        const item = reverse[0];
        detectedName = item.formattedAddress || `${item.district || item.subregion || item.name || 'Current Area'}, ${item.city || 'Mysore'}`;
      }
      setUserLocality(detectedName);
      setLocationModalVisible(false);
      showToast(`Location set to: ${detectedName}`);
    } catch (e) {
      console.log('GPS detection error:', e);
      showAlert('GPS Notice', 'Could not detect live position. You can select any neighborhood from the list.');
    } finally {
      setLoadingGps(false);
    }
  };

  const showToast = (msg) => {
    setLocationToast(msg);
    setTimeout(() => {
      setLocationToast(null);
    }, 2500);
  };

  // Filtered Localities for Location Picker
  const filteredLocalities = useMemo(() => {
    if (!locationSearchQuery.trim()) return POPULAR_LOCALITIES;
    return POPULAR_LOCALITIES.filter((loc) =>
      loc.full.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
      loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
    );
  }, [locationSearchQuery]);

  // Handle Select Location from list
  const handleSelectLocality = (loc) => {
    setUserLocality(loc.full);
    setUserCoords({ latitude: loc.latitude, longitude: loc.longitude });
    setLocationModalVisible(false);
    setLocationSearchQuery('');
    showToast(`Hospitals sorted near ${loc.name}!`);
  };

  // Handle custom typed location
  const handleCustomLocalitySubmit = () => {
    if (!customLocalityInput.trim()) return;
    setUserLocality(`${customLocalityInput.trim()}, Mysore`);
    setUserCoords({ latitude: 12.3050, longitude: 76.6450 });
    setLocationModalVisible(false);
    setCustomLocalityInput('');
    showToast(`Hospitals sorted near ${customLocalityInput.trim()}!`);
  };

  // Filter and Sort Hospitals (Nearby First)
  const filteredHospitals = useMemo(() => {
    const list = surgeryHospitals.map((hosp) => {
      const dist = calculateDistanceKm(
        userCoords.latitude,
        userCoords.longitude,
        hosp.latitude,
        hosp.longitude
      );
      return {
        ...hosp,
        calculatedDistanceKm: dist,
        dynamicDistanceStr: `${dist} km away`,
      };
    });

    const filtered = list.filter((hosp) => {
      // 1. Search Query
      const query = search.toLowerCase();
      const matchesSearch =
        hosp.name.toLowerCase().includes(query) ||
        hosp.area.toLowerCase().includes(query) ||
        hosp.tagline.toLowerCase().includes(query) ||
        hosp.availableSurgeries.some(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.categoryLabel.toLowerCase().includes(query) ||
            s.technique.toLowerCase().includes(query)
        );

      if (!matchesSearch) return false;

      // 2. Specialty Filter
      if (selectedSpecialty !== 'all') {
        const hasSpecialty = hosp.availableSurgeries.some(
          (s) => s.specialty === selectedSpecialty
        );
        if (!hasSpecialty) return false;
      }

      // 3. Quick Tabs
      if (selectedFilter === 'NABH Accredited') {
        return hosp.accreditation.includes('NABH');
      }
      if (selectedFilter === 'Cashless TPA / Insurance') {
        return hosp.cashlessInsurance && hosp.cashlessInsurance.length > 0;
      }
      if (selectedFilter === 'Minimally Invasive Daycare') {
        return hosp.availableSurgeries.some(
          (s) =>
            s.stayRequired.toLowerCase().includes('daycare') ||
            s.stayRequired.toLowerCase().includes('1 day')
        );
      }
      if (selectedFilter === 'Open 24x7') {
        return hosp.openHours.toLowerCase().includes('24x7');
      }

      return true;
    });

    // Sort: Nearby location first (ascending distance)
    return filtered.sort((a, b) => a.calculatedDistanceKm - b.calculatedDistanceKm);
  }, [search, selectedSpecialty, selectedFilter, userCoords]);

  const openHospitalGps = (hosp) => {
    const lat = hosp.latitude;
    const lng = hosp.longitude;
    const label = encodeURIComponent(`${hosp.name}, ${hosp.address}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  const renderHospitalCard = ({ item: hosp, index }) => {
    const matchingSurgeries =
      selectedSpecialty === 'all'
        ? hosp.availableSurgeries
        : hosp.availableSurgeries.filter((s) => s.specialty === selectedSpecialty);

    const isNearest = index === 0;

    return (
      <View style={[styles.card, isNearest && styles.nearestCardHighlight]}>
        {/* TOP ACCREDITATION & DISTANCE ROW */}
        <View style={styles.cardHeader}>
          <View style={styles.accreditBadge}>
            <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
            <Text style={styles.accreditBadgeText}>{hosp.accreditation}</Text>
          </View>

          <View style={[styles.distanceBadge, isNearest && styles.nearestDistanceBadge]}>
            <Ionicons
              name="navigate"
              size={12}
              color={isNearest ? '#FFFFFF' : colors.secondary}
            />
            <Text
              style={[
                styles.distanceBadgeText,
                isNearest && { color: '#FFFFFF', fontWeight: '800' },
              ]}
            >
              {isNearest ? `📍 NEAREST (${hosp.dynamicDistanceStr})` : hosp.dynamicDistanceStr}
            </Text>
          </View>
        </View>

        {/* HOSPITAL TITLE & LOCATION */}
        <TouchableOpacity
          style={styles.hospitalInfoRow}
          activeOpacity={0.88}
          onPress={() =>
            navigation.navigate('HospitalSurgeryDetails', {
              hospitalId: hosp.id,
              initialSpecialty: selectedSpecialty,
            })
          }
        >
          <View style={styles.hospitalIconBox}>
            <Ionicons name="business" size={26} color={colors.primary} />
          </View>

          <View style={styles.hospitalTextCol}>
            <Text style={styles.hospitalName} numberOfLines={1}>
              {hosp.name}
            </Text>
            <Text style={styles.hospitalTagline} numberOfLines={1}>
              {hosp.tagline}
            </Text>
            <View style={styles.areaRow}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.areaText} numberOfLines={1}>
                {hosp.area}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* METRICS ROW (ICU, OT, RATING) */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Ionicons name="star" size={13} color="#FFA000" />
            <Text style={styles.metricBold}>{hosp.rating}</Text>
            <Text style={styles.metricSub}>({hosp.reviewCount})</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Ionicons name="bed-outline" size={14} color={colors.secondary} />
            <Text style={styles.metricSub}>{hosp.icuBeds}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Ionicons name="medkit-outline" size={14} color={colors.primary} />
            <Text style={styles.metricSub}>{hosp.otCount}</Text>
          </View>
        </View>

        {/* CASHLESS INSURANCE TPA SUPPORT PILL */}
        <View style={styles.cashlessBox}>
          <Ionicons name="checkmark-circle" size={14} color="#059669" />
          <Text style={styles.cashlessText} numberOfLines={1}>
            Cashless TPA: Star Health, HDFC ERGO, Medi Assist & 15+ more
          </Text>
        </View>

        {/* SURGERIES PREVIEW TAGS */}
        <View style={styles.surgeriesPreviewSection}>
          <Text style={styles.surgeriesPreviewTitle}>
            Key Surgeries Performed ({matchingSurgeries.length} Procedures):
          </Text>
          <View style={styles.surgeryChipsWrap}>
            {matchingSurgeries.slice(0, 3).map((surg) => (
              <View key={surg.id} style={styles.surgeryChip}>
                <Ionicons name="medical" size={11} color={colors.primary} />
                <Text style={styles.surgeryChipText} numberOfLines={1}>
                  {surg.name.split('(')[0]}
                </Text>
              </View>
            ))}
            {matchingSurgeries.length > 3 && (
              <View style={[styles.surgeryChip, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.surgeryChipText, { color: colors.secondary }]}>
                  +{matchingSurgeries.length - 3} More
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* DUAL ACTION BUTTONS */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.directionsBtn}
            activeOpacity={0.8}
            onPress={() => openHospitalGps(hosp)}
          >
            <Ionicons name="navigate" size={15} color={colors.secondary} />
            <Text style={styles.directionsBtnText}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewSurgeriesBtn}
            activeOpacity={0.88}
            onPress={() =>
              navigation.navigate('HospitalSurgeryDetails', {
                hospitalId: hosp.id,
                initialSpecialty: selectedSpecialty,
              })
            }
          >
            <Text style={styles.viewSurgeriesBtnText}>View Surgeries</Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </TouchableOpacity>
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
            <Ionicons name="arrow-back" size={22} color={colors.secondary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Surgeries & Hospital Care</Text>
            <Text style={styles.headerSubtitle}>
              Nearest Surgical Hospitals & Custom Price Estimates
            </Text>
          </View>

          <TouchableOpacity
            style={styles.quoteHistoryBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('TransactionHistory')}
          >
            <Ionicons name="receipt-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      )}



      {/* ==================================================
          LOCATION SELECTOR BANNER BAR (MOBILE ONLY)
      ================================================== */}
      {!isDesktopWeb && (
        <TouchableOpacity
          style={styles.locationBannerBar}
          activeOpacity={0.88}
          onPress={() => setLocationModalVisible(true)}
        >
          <View style={styles.locationBannerIconBox}>
            <Ionicons name="location" size={16} color={colors.primary} />
          </View>

          <View style={styles.locationBannerTextCol}>
            <Text style={styles.locationBannerLabel}>SHOWING HOSPITALS NEARBY</Text>
            <Text style={styles.locationBannerArea} numberOfLines={1}>
              {userLocality}
            </Text>
          </View>

          <View style={styles.changeLocBtn}>
            <Text style={styles.changeLocBtnText}>Change</Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>
      )}

      {/* TOAST NOTIFICATION */}
      {locationToast && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text style={styles.toastText}>{locationToast}</Text>
        </View>
      )}

      {/* ==================================================
          SEARCH BAR (MOBILE ONLY)
      ================================================== */}
      {!isDesktopWeb && (
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search surgery, procedure, hospital, or area..."
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
        </View>
      )}

      {/* ==================================================
          SURGERY SPECIALTY PILLS SCROLL
      ================================================== */}
      <View style={styles.specialtiesScrollWrap}>
        {Platform.OS === 'web' ? (
          <View style={styles.specialtiesWrap}>
            {surgerySpecialties.map((spec) => {
              const isSelected = selectedSpecialty === spec.id;
              return (
                <TouchableOpacity
                  key={spec.id}
                  style={[
                    styles.specialtyPill,
                    isSelected && styles.specialtyPillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedSpecialty(spec.id)}
                >
                  <Ionicons
                    name={spec.icon}
                    size={14}
                    color={isSelected ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.specialtyPillText,
                      isSelected && styles.specialtyPillTextActive,
                    ]}
                  >
                    {spec.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtiesScroll}
          >
            {surgerySpecialties.map((spec) => {
              const isSelected = selectedSpecialty === spec.id;
              return (
                <TouchableOpacity
                  key={spec.id}
                  style={[
                    styles.specialtyPill,
                    isSelected && styles.specialtyPillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedSpecialty(spec.id)}
                >
                  <Ionicons
                    name={spec.icon}
                    size={14}
                    color={isSelected ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.specialtyPillText,
                      isSelected && styles.specialtyPillTextActive,
                    ]}
                  >
                    {spec.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ==================================================
          QUICK FILTER TABS
      ================================================== */}
      <View style={styles.filterTabsWrap}>
        {Platform.OS === 'web' ? (
          <View style={styles.filterTabsWrapRow}>
            {filterTabs.map((tab) => {
              const isTabActive = selectedFilter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterTab, isTabActive && styles.filterTabActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedFilter(tab)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      isTabActive && styles.filterTabTextActive,
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
              const isTabActive = selectedFilter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterTab, isTabActive && styles.filterTabActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedFilter(tab)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      isTabActive && styles.filterTabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ==================================================
          RESULT COUNT & SORT INDICATOR
      ================================================== */}
      <View style={styles.resultsHeaderRow}>
        <View style={styles.sortIndicatorBadge}>
          <Ionicons name="swap-vertical" size={12} color={colors.secondary} />
          <Text style={styles.resultsCountText}>
            {filteredHospitals.length} Hospitals • Sorted Nearest First
          </Text>
        </View>
        <Text style={styles.cashlessSubtext}>✓ Cashless TPA Supported</Text>
      </View>

      {/* ==================================================
          HOSPITAL LIST (SORTED NEARBY FIRST)
      ================================================== */}
      <FlatList
        data={filteredHospitals}
        keyExtractor={(item) => item.id}
        renderItem={renderHospitalCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Surgical Hospitals Found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with another procedure name or reset filters.
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setSearch('');
                setSelectedSpecialty('all');
                setSelectedFilter('All');
              }}
            >
              <Text style={styles.resetBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ==================================================
          LOCATION SELECTION MODAL
      ================================================== */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModalCard}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choose Location</Text>
                <Text style={styles.modalSub}>
                  Sort surgical hospitals nearest to your area
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setLocationModalVisible(false)}
              >
                <Ionicons name="close" size={22} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* LIVE GPS BUTTON */}
            <TouchableOpacity
              style={styles.gpsButton}
              activeOpacity={0.88}
              onPress={detectLocation}
              disabled={loadingGps}
            >
              <View style={styles.gpsIconBox}>
                {loadingGps ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="locate" size={20} color={colors.primary} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.gpsButtonTitle}>
                  {loadingGps ? 'Detecting Precise Location...' : 'Use My Current Live GPS'}
                </Text>
                <Text style={styles.gpsButtonSub}>
                  Auto-detect GPS coordinates and find nearest hospitals
                </Text>
              </View>
            </TouchableOpacity>

            {/* SEARCH AREA INPUT */}
            <View style={styles.modalSearchBox}>
              <Ionicons name="search-outline" size={17} color="#94A3B8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search neighborhood or street name..."
                placeholderTextColor="#94A3B8"
                value={locationSearchQuery}
                onChangeText={setLocationSearchQuery}
              />
            </View>

            {/* POPULAR AREAS LIST */}
            <Text style={styles.popularAreasTitle}>Popular Areas in Mysore:</Text>
            <ScrollView
              style={{ maxHeight: 220 }}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
            >
              {filteredLocalities.map((loc) => {
                const isCurrent = userLocality.toLowerCase().includes(loc.name.toLowerCase());
                return (
                  <TouchableOpacity
                    key={loc.id}
                    style={[styles.localityRow, isCurrent && styles.localityRowActive]}
                    activeOpacity={0.8}
                    onPress={() => handleSelectLocality(loc)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={isCurrent ? colors.primary : '#64748B'}
                    />
                    <Text
                      style={[styles.localityText, isCurrent && styles.localityTextActive]}
                    >
                      {loc.full}
                    </Text>
                    {isCurrent && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* CUSTOM LOCALITY ENTRY */}
            <View style={styles.customAreaBox}>
              <TextInput
                style={styles.customAreaInput}
                placeholder="Or type custom locality (e.g. Siddartha Layout)"
                placeholderTextColor="#94A3B8"
                value={customLocalityInput}
                onChangeText={setCustomLocalityInput}
              />
              <TouchableOpacity
                style={styles.customAreaSubmitBtn}
                onPress={handleCustomLocalitySubmit}
              >
                <Text style={styles.customAreaSubmitText}>Apply</Text>
              </TouchableOpacity>
            </View>
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
  quoteHistoryBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // LOCATION BANNER BAR
  locationBannerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.lightTeal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  locationBannerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBannerTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  locationBannerLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  locationBannerArea: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 1,
  },
  changeLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
  },
  changeLocBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },

  // TOAST BANNER
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
  },
  toastText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },

  // SEARCH
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text,
  },

  // SPECIALTY PILLS
  specialtiesScrollWrap: {
    paddingVertical: 6,
  },
  specialtiesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    rowGap: 8,
  },
  specialtyPill: {
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
  specialtyPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  specialtyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  specialtyPillTextActive: {
    color: '#FFFFFF',
  },

  // FILTER TABS
  filterTabsWrap: {
    paddingBottom: 6,
  },
  filterTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTabsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    rowGap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // RESULTS
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 6,
  },
  sortIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultsCountText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.secondary,
  },
  cashlessSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },

  // LIST & CARD
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
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
  nearestCardHighlight: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accreditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  accreditBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  nearestDistanceBadge: {
    backgroundColor: colors.primary,
  },
  distanceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },

  hospitalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hospitalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  hospitalTextCol: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
  },
  hospitalTagline: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 3,
  },
  areaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricBold: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  metricSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  metricDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E2E8F0',
  },

  cashlessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 10,
    gap: 5,
  },
  cashlessText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },

  surgeriesPreviewSection: {
    marginBottom: 12,
  },
  surgeriesPreviewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 6,
  },
  surgeryChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  surgeryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightAqua,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  surgeryChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },

  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  directionsBtn: {
    height: 36,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 4,
  },
  directionsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  viewSurgeriesBtn: {
    height: 36,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    gap: 5,
  },
  viewSurgeriesBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginTop: 4,
  },
  resetBtn: {
    marginTop: 14,
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // LOCATION MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  locationModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.secondary,
  },
  modalSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: 12,
  },
  gpsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsButtonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  gpsButtonSub: {
    fontSize: 10,
    color: '#065F46',
    marginTop: 1,
  },

  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    color: colors.text,
  },

  popularAreasTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 8,
  },
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
    gap: 8,
  },
  localityRowActive: {
    backgroundColor: colors.lightTeal,
  },
  localityText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  localityTextActive: {
    fontWeight: '800',
    color: colors.primary,
  },

  customAreaBox: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  customAreaInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 12,
    color: colors.text,
  },
  customAreaSubmitBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAreaSubmitText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  webBreadcrumbWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  webBreadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webBreadcrumbLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  webBreadcrumbCurrent: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '700',
  },
  webBreadcrumbQuery: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
});

export default HospitalCareScreen;