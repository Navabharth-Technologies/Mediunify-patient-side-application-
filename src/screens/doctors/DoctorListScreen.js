import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Linking,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import doctors, { doctorSpecialties } from '../../data/doctors';
import colors from '../../theme/colors';

export const POPULAR_LOCALITIES = [
  { id: '1', name: 'Kuvempunagar', city: 'Mysore', full: 'Kuvempunagar, Mysore', latitude: 12.2858, longitude: 76.6341 },
  { id: '2', name: 'Jayalakshmipuram', city: 'Mysore', full: 'Jayalakshmipuram, Mysore', latitude: 12.3168, longitude: 76.6285 },
  { id: '3', name: 'Saraswathipuram', city: 'Mysore', full: 'Saraswathipuram, Mysore', latitude: 12.3021, longitude: 76.6318 },
  { id: '4', name: 'Vijayanagar 2nd Stage', city: 'Mysore', full: 'Vijayanagar 2nd Stage, Mysore', latitude: 12.3312, longitude: 76.6120 },
  { id: '5', name: 'Gokulam 3rd Stage', city: 'Mysore', full: 'Gokulam 3rd Stage, Mysore', latitude: 12.3355, longitude: 76.6310 },
  { id: '6', name: 'V.V. Mohalla', city: 'Mysore', full: 'V.V. Mohalla, Mysore', latitude: 12.3210, longitude: 76.6390 },
  { id: '7', name: 'Bannimantap', city: 'Mysore', full: 'Bannimantap, Mysore', latitude: 12.3380, longitude: 76.6520 },
  { id: '8', name: 'Nazarbad', city: 'Mysore', full: 'Nazarbad, Mysore', latitude: 12.3080, longitude: 76.6650 },
  { id: '9', name: 'Hebbal 1st Stage', city: 'Mysore', full: 'Hebbal, Mysore', latitude: 12.3610, longitude: 76.6150 },
  { id: '10', name: 'Mysore Central', city: 'Mysore', full: 'Mysore Central, Mysore', latitude: 12.3050, longitude: 76.6550 },
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

const DoctorListScreen = ({ navigation, route }) => {
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  // Location State
  const initialLocality = route?.params?.locality || 'Kuvempunagar, Mysore';
  const [userLocality, setUserLocality] = useState(initialLocality);
  const [userCoords, setUserCoords] = useState({ latitude: 12.2858, longitude: 76.6341 });
  const [loadingGps, setLoadingGps] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [customLocalityInput, setCustomLocalityInput] = useState('');
  const [locationToast, setLocationToast] = useState(null);

  // Filter & Sort State
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [maxDistance, setMaxDistance] = useState('all'); // 'all' | '2' | '5' | '10'
  const [minExperience, setMinExperience] = useState('all'); // 'all' | '5' | '10' | '15'
  const [onlyAvailableToday, setOnlyAvailableToday] = useState(false);
  const [maxFee, setMaxFee] = useState('all'); // 'all' | '500' | '700'
  const [sortBy, setSortBy] = useState('nearest'); // 'nearest' | 'rating' | 'experience' | 'fee'

  // Navigation / Directions Modal state
  const [directionsDoctor, setDirectionsDoctor] = useState(null);

  // Detect Live GPS Location
  const detectLocation = async () => {
    try {
      setLoadingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoadingGps(false);
        Alert.alert(
          'Location Permission Required',
          'Please enable device location permission or pick an area from the list below.'
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setUserCoords(newCoords);

      const reverse = await Location.reverseGeocodeAsync(newCoords);
      let detectedName = 'Current Location';
      if (reverse && reverse.length > 0) {
        const item = reverse[0];
        detectedName = `${item.subregion || item.district || item.name || 'Current Area'}, ${item.city || 'Mysore'}`;
      }
      setUserLocality(detectedName);
      setLocationModalVisible(false);
      showToast(`Location set to: ${detectedName}`);
    } catch (e) {
      console.log('GPS detection error:', e);
      Alert.alert('GPS Notice', 'Could not detect live position. You can select any neighborhood from the list.');
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
    showToast(`Location updated to ${loc.name}!`);
  };

  // Handle Custom Location Set
  const handleSetCustomLocation = () => {
    if (!customLocalityInput.trim()) return;
    const name = customLocalityInput.trim();
    setUserLocality(name);
    // Find if matching or default center
    const match = POPULAR_LOCALITIES.find(
      (p) => p.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.name.toLowerCase())
    );
    if (match) {
      setUserCoords({ latitude: match.latitude, longitude: match.longitude });
    } else {
      setUserCoords({ latitude: 12.3050, longitude: 76.6550 });
    }
    setCustomLocalityInput('');
    setLocationModalVisible(false);
    showToast(`Location updated to ${name}!`);
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSpecialty !== 'all') count++;
    if (maxDistance !== 'all') count++;
    if (minExperience !== 'all') count++;
    if (onlyAvailableToday) count++;
    if (maxFee !== 'all') count++;
    if (sortBy !== 'nearest') count++;
    return count;
  }, [selectedSpecialty, maxDistance, minExperience, onlyAvailableToday, maxFee, sortBy]);

  const resetFilters = () => {
    setSelectedSpecialty('all');
    setMaxDistance('all');
    setMinExperience('all');
    setOnlyAvailableToday(false);
    setMaxFee('all');
    setSortBy('nearest');
  };

  // Filtered & Dynamically Distance-Calculated Doctors
  const filteredDoctors = useMemo(() => {
    let result = doctors.map((doc) => {
      // Calculate dynamic distance from user's current selected location
      const calculatedKm = calculateDistanceKm(
        userCoords.latitude,
        userCoords.longitude,
        doc.latitude,
        doc.longitude
      );
      return {
        ...doc,
        distanceKm: calculatedKm,
        distance: `${calculatedKm} km away`,
      };
    });

    result = result.filter((doc) => {
      // 1. Search filter
      const matchesSearch =
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
        doc.clinicName.toLowerCase().includes(search.toLowerCase()) ||
        doc.clinicArea.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Specialty filter
      if (selectedSpecialty !== 'all' && doc.specialtyKey !== selectedSpecialty) {
        return false;
      }

      // 3. Distance filter
      if (maxDistance !== 'all') {
        const maxD = parseFloat(maxDistance);
        if (doc.distanceKm > maxD) return false;
      }

      // 4. Experience filter
      if (minExperience !== 'all') {
        const minExp = parseInt(minExperience, 10);
        if (doc.experienceYears < minExp) return false;
      }

      // 5. Availability today
      if (onlyAvailableToday && !doc.availableToday) {
        return false;
      }

      // 6. Fee filter
      if (maxFee !== 'all') {
        const feeLimit = parseInt(maxFee, 10);
        if (doc.fee > feeLimit) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'nearest') {
        return a.distanceKm - b.distanceKm;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'experience') {
        return b.experienceYears - a.experienceYears;
      }
      if (sortBy === 'fee') {
        return a.fee - b.fee;
      }
      return 0;
    });

    return result;
  }, [userCoords, search, selectedSpecialty, maxDistance, minExperience, onlyAvailableToday, maxFee, sortBy]);

  // Open Turn-by-Turn Navigation Map
  const openExternalNavigation = (doc) => {
    const lat = doc.latitude;
    const lng = doc.longitude;
    const label = encodeURIComponent(`${doc.clinicName}, ${doc.clinicAddress}`);

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`,
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
          );
        }
      })
      .catch(() => {
        Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        );
      });
  };

  const handleOpenDirectionsModal = (doc) => {
    setDirectionsDoctor(doc);
  };

  const renderDoctor = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* TOP ROW: CLINIC LOCATION & DISTANCE BADGE */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.clinicLocationWrap}>
            <Ionicons name="business" size={13} color={colors.primary} />
            <Text style={styles.clinicNameText} numberOfLines={1}>
              {item.clinicName}
            </Text>
          </View>
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={12} color={colors.secondary} />
            <Text style={styles.distanceBadgeText}>{item.distance}</Text>
          </View>
        </View>

        {/* DOCTOR MAIN DETAILS */}
        <TouchableOpacity
          style={styles.doctorMainRow}
          activeOpacity={0.88}
          onPress={() =>
            navigation.navigate('DoctorDetails', {
              doctor: item,
            })
          }
        >
          <Image source={{ uri: item.image }} style={styles.avatar} />

          <View style={styles.doctorInfoCol}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.doctorName}>{item.name}</Text>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            </View>

            <Text style={styles.specialtyText}>{item.specialty}</Text>
            <Text style={styles.qualificationText} numberOfLines={1}>
              {item.qualification}
            </Text>

            {/* EXPERIENCE & RATING CHIPS */}
            <View style={styles.metricsRow}>
              <View style={styles.experienceChip}>
                <Ionicons name="ribbon-outline" size={12} color="#D97706" />
                <Text style={styles.experienceChipText}>{item.experience}</Text>
              </View>

              <View style={styles.ratingChip}>
                <Ionicons name="star" size={12} color="#FFA000" />
                <Text style={styles.ratingChipText}>{item.rating}</Text>
                <Text style={styles.reviewsCountText}>({item.reviewCount})</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* CLINIC ADDRESS ROW */}
        <View style={styles.clinicAddressRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} style={{ marginTop: 2 }} />
          <Text style={styles.clinicAddressText} numberOfLines={2}>
            {item.clinicAddress}
          </Text>
        </View>

        {/* NEXT AVAILABLE SLOT & CONSULTATION FEE */}
        <View style={styles.slotAndFeeRow}>
          <View style={styles.slotBox}>
            <Ionicons name="time-outline" size={13} color={colors.primary} />
            <Text style={styles.slotText}>{item.nextSlot}</Text>
          </View>

          <View style={styles.feeBox}>
            <Text style={styles.feeLabel}>In-Person Fee:</Text>
            <Text style={styles.feeAmount}>₹{item.fee}</Text>
          </View>
        </View>

        {/* DUAL ACTION BUTTONS: NAVIGATE & BOOK APPOINTMENT */}
        <View style={styles.cardActionsRow}>
          {/* NAVIGATE BUTTON */}
          <TouchableOpacity
            style={styles.navigateButton}
            activeOpacity={0.82}
            onPress={() => handleOpenDirectionsModal(item)}
          >
            <Ionicons name="navigate" size={15} color={colors.secondary} />
            <Text style={styles.navigateButtonText}>Directions</Text>
          </TouchableOpacity>

          {/* BOOK IN-PERSON BUTTON */}
          <TouchableOpacity
            style={styles.bookAppointmentButton}
            activeOpacity={0.88}
            onPress={() =>
              navigation.navigate('DoctorBooking', {
                doctor: item,
              })
            }
          >
            <Text style={styles.bookAppointmentButtonText}>Book In-Person Visit</Text>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>In-Person Doctor Visit</Text>
          <Text style={styles.headerSub}>Find verified doctors near you</Text>
        </View>

        <TouchableOpacity
          style={[styles.filterHeaderBtn, activeFiltersCount > 0 && styles.filterHeaderBtnActive]}
          activeOpacity={0.8}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFiltersCount > 0 ? '#FFFFFF' : colors.secondary}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadgeCount}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ==================================================
          TOAST FEEDBACK MESSAGE
      ================================================== */}
      {locationToast && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
          <Text style={styles.toastBannerText}>{locationToast}</Text>
        </View>
      )}

      {/* ==================================================
          PROMINENT LOCATION SELECTOR BAR
      ================================================== */}
      <TouchableOpacity
        style={styles.locationBannerBar}
        activeOpacity={0.85}
        onPress={() => setLocationModalVisible(true)}
      >
        <View style={styles.locationBannerLeft}>
          <View style={styles.locationBannerPinCircle}>
            <Ionicons name="location" size={16} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.locationBannerSub}>CURRENT SEARCH AREA</Text>
            <Text style={styles.locationBannerTitle} numberOfLines={1}>
              {loadingGps ? 'Detecting GPS...' : userLocality}
            </Text>
          </View>
        </View>
        <View style={styles.changeLocationBtn}>
          <Text style={styles.changeLocationBtnText}>Change</Text>
          <Ionicons name="chevron-down" size={12} color={colors.secondary} />
        </View>
      </TouchableOpacity>

      {/* ==================================================
          SEARCH BAR & FILTER CHIP
      ================================================== */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctor, specialty, clinic, or area..."
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

        <TouchableOpacity
          style={[styles.filterTriggerPill, activeFiltersCount > 0 && styles.filterTriggerPillActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons
            name="filter"
            size={14}
            color={activeFiltersCount > 0 ? '#FFFFFF' : colors.secondary}
          />
          <Text
            style={[
              styles.filterTriggerPillText,
              activeFiltersCount > 0 && styles.filterTriggerPillTextActive,
            ]}
          >
            {activeFiltersCount > 0 ? `${activeFiltersCount} Filters` : 'Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==================================================
          SPECIALTY SELECTOR PILLS
      ================================================== */}
      <View style={styles.specialtyContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtiesScroll}
        >
          {doctorSpecialties.map((spec) => {
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
                  size={15}
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
      </View>

      {/* ==================================================
          RESULT COUNT & SORT INDICATOR
      ================================================== */}
      <View style={styles.resultsHeaderRow}>
        <Text style={styles.resultsCountText}>
          {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'} near {userLocality.split(',')[0]}
        </Text>
        <Text style={styles.sortedByText}>
          Sorted: {sortBy === 'nearest' ? 'Nearest First' : sortBy === 'rating' ? 'Highest Rated' : sortBy === 'experience' ? 'Most Experienced' : 'Lowest Fee'}
        </Text>
      </View>

      {/* ==================================================
          DOCTORS LIST
      ================================================== */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={renderDoctor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Nearby Doctors Found</Text>
            <Text style={styles.emptySubtitle}>
              Try picking another area or resetting distance and specialty filters.
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearch('');
                setSelectedSpecialty('all');
                resetFilters();
              }}
            >
              <Text style={styles.resetFilterBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ==================================================
          LOCATION SELECTION & GPS MODAL
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
            <View style={styles.modalHeaderRow}>
              <View style={styles.locationModalIconBox}>
                <Ionicons name="location" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalHeaderTitle}>Select Location</Text>
                <Text style={styles.modalHeaderSub}>Find doctors in your neighborhood</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setLocationModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              style={{ maxHeight: 460 }}
            >
              {/* GPS CURRENT LOCATION BUTTON */}
              <TouchableOpacity
                style={styles.currentGpsBtn}
                activeOpacity={0.85}
                onPress={detectLocation}
                disabled={loadingGps}
              >
                {loadingGps ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <View style={styles.gpsIconCircle}>
                    <Ionicons name="navigate" size={16} color="#FFFFFF" />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.currentGpsTitle}>Use My Current Live GPS</Text>
                  <Text style={styles.currentGpsSub}>
                    {loadingGps ? 'Fetching GPS coordinates...' : 'Auto-detect position and calculate distances'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>

              {/* SEARCH LOCALITY INPUT */}
              <View style={styles.localitySearchBox}>
                <Ionicons name="search-outline" size={17} color={colors.textSecondary} />
                <TextInput
                  style={styles.localitySearchInput}
                  placeholder="Search area, locality, or city..."
                  placeholderTextColor="#94A3B8"
                  value={locationSearchQuery}
                  onChangeText={setLocationSearchQuery}
                />
                {locationSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* POPULAR LOCALITIES LIST */}
              <Text style={styles.popularLocTitle}>Select Area / Locality</Text>
              <View style={styles.localitiesListContainer}>
                {filteredLocalities.map((loc) => {
                  const isSelected = userLocality === loc.full;
                  return (
                    <TouchableOpacity
                      key={loc.id}
                      style={[styles.localityRow, isSelected && styles.localityRowActive]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectLocality(loc)}
                    >
                      <View style={[styles.localityPinCircle, isSelected && styles.localityPinCircleActive]}>
                        <Ionicons
                          name={isSelected ? 'location' : 'location-outline'}
                          size={16}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.localityName, isSelected && styles.localityNameActive]}>
                          {loc.name}
                        </Text>
                        <Text style={styles.localityCity}>{loc.city}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* CUSTOM ADDRESS MANUAL ENTRY */}
              <View style={styles.customLocBox}>
                <Text style={styles.customLocLabel}>Or Type Any Custom Area / Street</Text>
                <View style={styles.customLocInputRow}>
                  <TextInput
                    style={styles.customLocInput}
                    placeholder="e.g. Ring Road, Bogadi, Mysore"
                    placeholderTextColor="#94A3B8"
                    value={customLocalityInput}
                    onChangeText={setCustomLocalityInput}
                  />
                  <TouchableOpacity
                    style={[
                      styles.customLocApplyBtn,
                      !customLocalityInput.trim() && { opacity: 0.5 },
                    ]}
                    disabled={!customLocalityInput.trim()}
                    onPress={handleSetCustomLocation}
                  >
                    <Text style={styles.customLocApplyText}>Set</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================
          DIRECTIONS & NAVIGATION MODAL
      ================================================== */}
      <Modal
        visible={!!directionsDoctor}
        transparent
        animationType="slide"
        onRequestClose={() => setDirectionsDoctor(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.directionsModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.directionsHeaderIcon}>
                <Ionicons name="navigate" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalHeaderTitle}>Clinic Location & Route</Text>
                <Text style={styles.modalHeaderSub}>Turn-by-turn Navigation</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setDirectionsDoctor(null)}
              >
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {directionsDoctor && (
              <View style={styles.modalBodyContent}>
                {/* CLINIC CARD */}
                <View style={styles.directionsClinicCard}>
                  <Text style={styles.directionsClinicName}>
                    {directionsDoctor.clinicName}
                  </Text>
                  <Text style={styles.directionsDoctorConsultant}>
                    Consultant: {directionsDoctor.name} ({directionsDoctor.specialty})
                  </Text>
                  <View style={styles.directionsAddressRow}>
                    <Ionicons name="location" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                    <Text style={styles.directionsAddressText}>
                      {directionsDoctor.clinicAddress}
                    </Text>
                  </View>
                </View>

                {/* DISTANCE & TRAVEL ESTIMATE */}
                <View style={styles.travelStatsRow}>
                  <View style={styles.travelStatItem}>
                    <Ionicons name="navigate" size={16} color={colors.secondary} />
                    <Text style={styles.travelStatValue}>{directionsDoctor.distance}</Text>
                    <Text style={styles.travelStatLabel}>From {userLocality.split(',')[0]}</Text>
                  </View>
                  <View style={styles.travelStatDivider} />
                  <View style={styles.travelStatItem}>
                    <Ionicons name="car-outline" size={18} color="#059669" />
                    <Text style={styles.travelStatValue}>
                      ~{Math.max(2, Math.round(directionsDoctor.distanceKm * 3))} Mins
                    </Text>
                    <Text style={styles.travelStatLabel}>Approx Drive Time</Text>
                  </View>
                  <View style={styles.travelStatDivider} />
                  <View style={styles.travelStatItem}>
                    <Ionicons name="time-outline" size={16} color={colors.coral} />
                    <Text style={styles.travelStatValue}>Open Today</Text>
                    <Text style={styles.travelStatLabel}>{directionsDoctor.openHours.split(',')[0]}</Text>
                  </View>
                </View>

                {/* ACTION BUTTONS */}
                <View style={styles.modalActionButtonsCol}>
                  <TouchableOpacity
                    style={styles.openGoogleMapsBtn}
                    activeOpacity={0.88}
                    onPress={() => {
                      openExternalNavigation(directionsDoctor);
                      setDirectionsDoctor(null);
                    }}
                  >
                    <Ionicons name="map" size={18} color="#FFFFFF" />
                    <Text style={styles.openGoogleMapsBtnText}>
                      Start Turn-by-Turn GPS Navigation
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.callClinicModalBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      Linking.openURL(`tel:${directionsDoctor.phone}`);
                    }}
                  >
                    <Ionicons name="call" size={16} color={colors.secondary} />
                    <Text style={styles.callClinicModalBtnText}>
                      Call Clinic Reception ({directionsDoctor.phone})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================================================
          FILTERS & SORT BOTTOM SHEET / MODAL
      ================================================== */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterSheetCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Filter & Sort Doctors</Text>
                <Text style={styles.modalHeaderSub}>Refine by Distance, Experience & Fee</Text>
              </View>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetTextBtn}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {/* 1. DOCTOR SPECIALIZATION */}
              <Text style={styles.filterGroupTitle}>Doctor Specialization</Text>
              <View style={styles.filterOptionsGrid}>
                {doctorSpecialties.map((spec) => {
                  const isSelected = selectedSpecialty === spec.id;
                  return (
                    <TouchableOpacity
                      key={spec.id}
                      style={[
                        styles.filterOptionPill,
                        { flexDirection: 'row', alignItems: 'center' },
                        isSelected && styles.filterOptionPillActive,
                      ]}
                      onPress={() => setSelectedSpecialty(spec.id)}
                    >
                      <Ionicons
                        name={spec.icon}
                        size={13}
                        color={isSelected ? colors.primary : colors.textSecondary}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.filterOptionText,
                          isSelected && styles.filterOptionTextActive,
                        ]}
                      >
                        {spec.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. DISTANCE RADIUS */}
              <Text style={styles.filterGroupTitle}>Distance from Selected Location</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { label: 'All Distances', value: 'all' },
                  { label: '< 2 km (Nearest)', value: '2' },
                  { label: '< 5 km', value: '5' },
                  { label: '< 10 km', value: '10' },
                ].map((opt) => {
                  const isSelected = maxDistance === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.filterOptionPill, isSelected && styles.filterOptionPillActive]}
                      onPress={() => setMaxDistance(opt.value)}
                    >
                      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3. EXPERIENCE YEARS */}
              <Text style={styles.filterGroupTitle}>Doctor's Experience</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { label: 'Any Experience', value: 'all' },
                  { label: '5+ Years', value: '5' },
                  { label: '10+ Years', value: '10' },
                  { label: '15+ Years', value: '15' },
                ].map((opt) => {
                  const isSelected = minExperience === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.filterOptionPill, isSelected && styles.filterOptionPillActive]}
                      onPress={() => setMinExperience(opt.value)}
                    >
                      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 4. CONSULTATION FEE */}
              <Text style={styles.filterGroupTitle}>Consultation Fee Range</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { label: 'Any Fee', value: 'all' },
                  { label: 'Under ₹500', value: '500' },
                  { label: 'Under ₹700', value: '700' },
                ].map((opt) => {
                  const isSelected = maxFee === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.filterOptionPill, isSelected && styles.filterOptionPillActive]}
                      onPress={() => setMaxFee(opt.value)}
                    >
                      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 5. SORT BY */}
              <Text style={styles.filterGroupTitle}>Sort Results By</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { label: 'Nearest First', value: 'nearest' },
                  { label: 'Highest Rated', value: 'rating' },
                  { label: 'Most Experienced', value: 'experience' },
                  { label: 'Fee: Low to High', value: 'fee' },
                ].map((opt) => {
                  const isSelected = sortBy === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.filterOptionPill, isSelected && styles.filterOptionPillActive]}
                      onPress={() => setSortBy(opt.value)}
                    >
                      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 6. ONLY AVAILABLE TODAY TOGGLE */}
              <TouchableOpacity
                style={styles.toggleRow}
                activeOpacity={0.8}
                onPress={() => setOnlyAvailableToday(!onlyAvailableToday)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Available Today Only</Text>
                  <Text style={styles.toggleSub}>Show doctors accepting in-person patients today</Text>
                </View>
                <View
                  style={[
                    styles.toggleSwitch,
                    onlyAvailableToday && styles.toggleSwitchActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      onlyAvailableToday && styles.toggleKnobActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              activeOpacity={0.88}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyFilterBtnText}>
                Show {filteredDoctors.length} Matching Doctors
              </Text>
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
  headerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  filterHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterHeaderBtnActive: {
    backgroundColor: colors.secondary,
  },
  filterBadgeCount: {
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
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // TOAST BANNER
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // PROMINENT LOCATION BANNER BAR
  locationBannerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.lightTeal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  locationBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationBannerPinCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBannerSub: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  locationBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 1,
  },
  changeLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    marginLeft: 8,
  },
  changeLocationBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
  },

  // SEARCH BAR
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  searchBox: {
    flex: 1,
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
  filterTriggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 6,
  },
  filterTriggerPillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filterTriggerPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  filterTriggerPillTextActive: {
    color: '#FFFFFF',
  },

  // SPECIALTIES SCROLL
  specialtyContainer: {
    paddingVertical: 6,
  },
  specialtiesScroll: {
    paddingHorizontal: 16,
    gap: 8,
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  specialtyPillTextActive: {
    color: '#FFFFFF',
  },

  // RESULTS HEADER
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 6,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  sortedByText: {
    fontSize: 11,
    color: colors.textSecondary,
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

  // CARD HEADER
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clinicLocationWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 5,
  },
  clinicNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },

  // DOCTOR MAIN
  doctorMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  doctorInfoCol: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  qualificationText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  experienceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  experienceChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  reviewsCountText: {
    fontSize: 10,
    color: colors.textSecondary,
  },

  // CLINIC ADDRESS
  clinicAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    gap: 6,
  },
  clinicAddressText: {
    flex: 1,
    fontSize: 11,
    color: colors.text,
    lineHeight: 15,
  },

  // SLOT & FEE
  slotAndFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  slotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  feeBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  feeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  feeAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },

  // ACTIONS
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navigateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  navigateButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  bookAppointmentButton: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  bookAppointmentButtonText: {
    fontSize: 12,
    fontWeight: '800',
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
    marginTop: 6,
    lineHeight: 17,
  },
  resetFilterBtn: {
    marginTop: 16,
    backgroundColor: colors.secondary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // MODAL OVERLAY
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  // LOCATION MODAL
  locationModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  locationModalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  gpsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentGpsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  currentGpsSub: {
    fontSize: 10,
    color: '#065F46',
    marginTop: 2,
  },

  localitySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  localitySearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text,
  },

  popularLocTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 6,
  },
  localitiesListContainer: {
    gap: 4,
  },
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  localityRowActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  localityPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  localityPinCircleActive: {
    backgroundColor: colors.lightTeal,
  },
  localityName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  localityNameActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  localityCity: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },

  customLocBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  customLocLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  customLocInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customLocInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customLocApplyBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customLocApplyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // DIRECTIONS MODAL
  directionsModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  directionsHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },
  modalHeaderSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBodyContent: {},
  directionsClinicCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  directionsClinicName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 2,
  },
  directionsDoctorConsultant: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 8,
  },
  directionsAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  directionsAddressText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
  },

  travelStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  travelStatItem: {
    alignItems: 'center',
  },
  travelStatValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  travelStatLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  travelStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },

  modalActionButtonsCol: {
    gap: 10,
  },
  openGoogleMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  openGoogleMapsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  callClinicModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  callClinicModalBtnText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
  },

  // FILTER SHEET
  filterSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  resetTextBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.coral,
  },
  filterGroupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 12,
    marginBottom: 8,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterOptionPillActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterOptionTextActive: {
    color: colors.primary,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
  },
  toggleSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },

  applyFilterBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  applyFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default DoctorListScreen;