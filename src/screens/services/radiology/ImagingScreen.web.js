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
// RADIOLOGY CATEGORIES
// ==================================================
const RADIOLOGY_CATEGORIES = [
  { id: 'mri', name: 'MRI', icon: 'scan-outline', bg: '#F0F9FF', color: '#1E3A8A' },
  { id: 'ct', name: 'CT Scan', icon: 'radio-outline', bg: '#E0F7FA', color: '#00C2CB' },
  { id: 'xray', name: 'X-Ray', icon: 'body-outline', bg: '#FFF3E0', color: '#FF7F50' },
  { id: 'usg', name: 'Ultrasound', icon: 'water-outline', bg: '#E8F8F5', color: '#00B894' },
  { id: 'mammo', name: 'Mammography', icon: 'female-outline', bg: '#FFEBE6', color: '#FF7F50' },
  { id: 'dexa', name: 'DEXA Scan', icon: 'fitness-outline', bg: '#F1F8E9', color: '#7BC96F' },
  { id: 'pet', name: 'PET-CT', icon: 'nuclear-outline', bg: '#E8EAF6', color: '#1E3A8A' },
  { id: 'interventional', name: 'Interventional Radiology', icon: 'medkit-outline', bg: '#E0F7FA', color: '#00C2CB' },
  { id: 'other', name: 'Other Scans', icon: 'ellipsis-horizontal-circle-outline', bg: '#F8FAFC', color: '#64748B' },
];

// ==================================================
// POPULAR SEARCHES
// ==================================================
const POPULAR_SEARCHES = [
  'MRI Brain',
  'CT Scan',
  'Ultrasound Abdomen',
  'X-Ray Chest',
  'Mammography',
  'CT KUB',
];

// ==================================================
// RECOMMENDED SCAN DEALS
// ==================================================
const RECOMMENDED_DEALS = [
  {
    id: 'REC-1',
    scanTitle: 'MRI Brain (With Contrast)',
    price: 4500,
    centreName: 'Mysore Scan & Diagnostic Centre',
    image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400',
    category: 'mri',
  },
  {
    id: 'REC-2',
    scanTitle: 'CT Chest (Plain)',
    price: 3200,
    centreName: 'Apollo BGS Hospitals',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400',
    category: 'ct',
  },
  {
    id: 'REC-3',
    scanTitle: 'Ultrasound Whole Abdomen',
    price: 1000,
    centreName: 'Narayana Health City',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400',
    category: 'usg',
  },
  {
    id: 'REC-4',
    scanTitle: 'X-Ray Chest',
    price: 350,
    centreName: 'Spark Diagnostic Centre',
    image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=400',
    category: 'xray',
  },
];

// ==================================================
// RADIOLOGY CENTRES DATA
// ==================================================
const CENTRES_DATA = [
  {
    id: 'centre-1',
    name: 'Mysore Scan & Diagnostic Centre',
    rating: 4.6,
    reviews: '1.2k',
    distance: '3.2 km',
    area: 'Kuvempunagar, Mysuru',
    price: 4500,
    availableToday: true,
    reportsIn24h: true,
    parking: true,
    cashless: true,
    weekend: true,
    slots: ['10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM'],
    moreSlots: 3,
    image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=500',
    category: 'mri',
  },
  {
    id: 'centre-2',
    name: 'Apollo BGS Hospitals',
    rating: 4.4,
    reviews: '2.8k',
    distance: '5.1 km',
    area: 'Adichunchanagiri Road, Mysuru',
    price: 5200,
    availableToday: true,
    reportsIn24h: true,
    parking: true,
    cashless: true,
    weekend: true,
    slots: ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM'],
    moreSlots: 5,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500',
    category: 'mri',
  },
  {
    id: 'centre-3',
    name: 'Narayana Health City',
    rating: 4.5,
    reviews: '1.9k',
    distance: '6.3 km',
    area: 'Bengaluru-Mysuru Road, Mysuru',
    price: 5500,
    availableToday: false,
    reportsIn24h: true,
    parking: true,
    cashless: true,
    weekend: false,
    slots: ['10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM'],
    moreSlots: 4,
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=500',
    category: 'mri',
  },
  {
    id: 'centre-4',
    name: 'Spark Diagnostic Centre',
    rating: 4.3,
    reviews: '980',
    distance: '2.8 km',
    area: 'Saraswathipuram, Mysuru',
    price: 6000,
    availableToday: true,
    reportsIn24h: true,
    parking: false,
    cashless: false,
    weekend: true,
    slots: ['09:30 AM', '11:30 AM', '01:30 PM', '03:30 PM'],
    moreSlots: 2,
    image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=500',
    category: 'mri',
  },
  {
    id: 'centre-5',
    name: 'Aster CMI Hospital',
    rating: 4.5,
    reviews: '1.7k',
    distance: '7.1 km',
    area: 'Hebbal Industrial Area, Mysuru',
    price: 6500,
    availableToday: true,
    reportsIn24h: true,
    parking: true,
    cashless: true,
    weekend: true,
    slots: ['10:00 AM', '12:00 PM', '02:00 PM', '05:00 PM'],
    moreSlots: 4,
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500',
    category: 'mri',
  },
];

const ImagingScreenWeb = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Mysuru');
  const [selectedCategory, setSelectedCategory] = useState('mri');
  const [selectedDistance, setSelectedDistance] = useState('5km'); // '5km' | '10km' | '20km'
  const [selectedScanTypes, setSelectedScanTypes] = useState(['mri']);
  const [selectedAvailability, setSelectedAvailability] = useState('today'); // 'today' | 'tomorrow' | 'week'
  const [selectedFeatures, setSelectedFeatures] = useState({
    cashless: false,
    reports24h: false,
    weekend: false,
    parking: false,
  });
  const [sortBy, setSortBy] = useState('price-low'); // 'price-low' | 'price-high' | 'distance' | 'rating'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [uploadToast, setUploadToast] = useState(null);

  // Toggle Scan Type Checkbox
  const toggleScanType = (typeId) => {
    setSelectedScanTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  // Toggle Feature Checkbox
  const toggleFeature = (featKey) => {
    setSelectedFeatures((prev) => ({ ...prev, [featKey]: !prev[featKey] }));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('mri');
    setSelectedDistance('5km');
    setSelectedScanTypes(['mri']);
    setSelectedAvailability('today');
    setSelectedFeatures({
      cashless: false,
      reports24h: false,
      weekend: false,
      parking: false,
    });
    setSortBy('price-low');
  };

  // Filtered & Sorted Centres
  const filteredCentres = useMemo(() => {
    return CENTRES_DATA.filter((centre) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = centre.name.toLowerCase().includes(q);
        const matchesArea = centre.area.toLowerCase().includes(q);
        if (!matchesName && !matchesArea) return false;
      }

      // Feature filters
      if (selectedFeatures.cashless && !centre.cashless) return false;
      if (selectedFeatures.reports24h && !centre.reportsIn24h) return false;
      if (selectedFeatures.weekend && !centre.weekend) return false;
      if (selectedFeatures.parking && !centre.parking) return false;

      // Availability
      if (selectedAvailability === 'today' && !centre.availableToday) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [searchQuery, selectedFeatures, selectedAvailability, sortBy]);

  // Handle File Upload
  const handleFileUpload = () => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          setUploadToast(`Prescription "${file.name}" uploaded successfully! AI is analyzing scans.`);
          setTimeout(() => setUploadToast(null), 4000);
        }
      };
      input.click();
    }
  };

  // Handle Booking Action
  const handleBookCentre = (centre) => {
    if (navigation?.navigate) {
      navigation.navigate('RadiologyBooking', {
        lab: centre,
        test: {
          name: 'MRI Brain (With Contrast)',
          price: centre.price,
          timeSlot: selectedSlot || centre.slots[0],
        },
      });
    } else {
      showAlert('Booking', `Proceeding to slot booking for ${centre.name} at ₹${centre.price.toLocaleString('en-IN')}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            1. BREADCRUMB & HERO BANNER SECTION (Blue Tinted Background)
        ============================================================ */}
        <View style={styles.heroSectionWrap}>
          <View style={styles.heroInner}>
            {/* Breadcrumb */}
            <View style={styles.breadcrumbRow}>
              <TouchableOpacity onPress={() => navigation?.navigate('Home')} activeOpacity={0.7}>
                <Text style={styles.breadcrumbLink}>Home</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={12} color="#64748B" />
              <Text style={styles.breadcrumbActive}>Radiology</Text>
            </View>

            {/* Main Hero Row */}
            <View style={[styles.heroRow, !isDesktop && { flexDirection: 'column' }]}>
              {/* Left Column: Heading, Subtitle & Search Bar */}
              <View style={styles.heroLeftCol}>
                <Text style={styles.heroMainTitle}>Book Radiology Tests</Text>
                <Text style={styles.heroSubTitle}>Compare prices. Choose the right centre.</Text>
                <Text style={styles.heroDesc}>
                  MRI, CT, X-Ray, Ultrasound, Mammography and more — at trusted diagnostic centres near you.
                </Text>

                {/* Search & Location Bar */}
                <View style={styles.searchBarBox}>
                  <View style={styles.searchInputWrap}>
                    <Ionicons name="search" size={19} color="#1E3A8A" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search for a scan (e.g. MRI Brain, CT Chest, X-Ray, Ultrasound Abdomen...)"
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

                {/* Popular Searches Pills */}
                <View style={styles.popularSearchesRow}>
                  <Text style={styles.popularLabel}>Popular searches:</Text>
                  <View style={styles.popularPillsWrap}>
                    {POPULAR_SEARCHES.map((term, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.popularPill,
                          searchQuery === term && styles.popularPillActive,
                        ]}
                        onPress={() => setSearchQuery(term)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.popularPillText,
                            searchQuery === term && styles.popularPillTextActive,
                          ]}
                        >
                          {term}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Right Column: High-Tech Machine Visual & Floating Highlights Card */}
              <View style={styles.heroRightCol}>
                <View style={styles.heroImageWrapper}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800' }}
                    style={styles.heroMachineImg}
                    resizeMode="cover"
                  />

                  {/* Floating Highlights Card */}
                  <View style={styles.floatingHighlightCard}>
                    <Text style={styles.floatingHighlightHeading}>
                      Advanced Imaging For A Healthier Tomorrow
                    </Text>

                    <View style={styles.highlightItem}>
                      <Ionicons name="shield-checkmark" size={15} color="#00B894" />
                      <Text style={styles.highlightText}>Trusted Diagnostic Centres</Text>
                    </View>

                    <View style={styles.highlightItem}>
                      <Ionicons name="pricetag" size={14} color="#00C2CB" />
                      <Text style={styles.highlightText}>Transparent Pricing</Text>
                    </View>

                    <View style={styles.highlightItem}>
                      <Ionicons name="flash" size={14} color="#7BC96F" />
                      <Text style={styles.highlightText}>Quick Online Booking</Text>
                    </View>

                    <View style={styles.highlightItem}>
                      <Ionicons name="phone-portrait" size={14} color="#1E3A8A" />
                      <Text style={styles.highlightText}>Reports Delivered Digitally</Text>
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
            2. RADIOLOGY CATEGORIES STRIP
        ============================================================ */}
        <View style={styles.categoriesSectionWrap}>
          <View style={styles.sectionMaxWidth}>
            <Text style={styles.sectionHeaderTitle}>Radiology Categories</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesTrack}
            >
              {RADIOLOGY_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catCard, isSelected && styles.catCardActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.catIconCircle, { backgroundColor: cat.bg }]}>
                      <Ionicons name={cat.icon} size={22} color={cat.color} />
                    </View>
                    <Text
                      style={[styles.catName, isSelected && styles.catNameActive]}
                      numberOfLines={2}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* ============================================================
            3. "RECOMMENDED FOR YOU" PROMO CONTAINER
        ============================================================ */}
        <View style={styles.recommendedSectionWrap}>
          <View style={styles.sectionMaxWidth}>
            <View style={styles.recommendedBox}>
              <View style={styles.recommendedHeaderRow}>
                <View style={styles.crownBadgeIcon}>
                  <Ionicons name="ribbon" size={15} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.recommendedTitle}>Recommended for you</Text>
                  <Text style={styles.recommendedSubtitle}>
                    Top-rated centres with great availability and competitive pricing
                  </Text>
                </View>
              </View>

              {/* 4 Cards Track */}
              <View style={styles.recommendedGrid}>
                {RECOMMENDED_DEALS.map((deal) => (
                  <TouchableOpacity
                    key={deal.id}
                    style={styles.recommendedCard}
                    onPress={() => {
                      setSearchQuery(deal.scanTitle);
                    }}
                    activeOpacity={0.88}
                  >
                    <Image source={{ uri: deal.image }} style={styles.dealThumb} />
                    <View style={styles.dealBody}>
                      <Text style={styles.dealScanTitle} numberOfLines={1}>
                        {deal.scanTitle}
                      </Text>
                      <Text style={styles.dealPrice}>₹{deal.price.toLocaleString('en-IN')}</Text>
                      <Text style={styles.dealCentreName} numberOfLines={1}>
                        {deal.centreName}
                      </Text>
                    </View>
                    <View style={styles.dealArrowCircle}>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            4. MAIN THREE-COLUMN WORKSPACE
        ============================================================ */}
        <View style={styles.mainContentWrap}>
          <View style={[styles.sectionMaxWidth, styles.threeColLayout, !isDesktop && { flexDirection: 'column' }]}>
            {/* ----------------------------------------------------
                COLUMN 1: FILTERS SIDEBAR
            ---------------------------------------------------- */}
            <View style={styles.filtersCol}>
              <View style={styles.filtersHeaderRow}>
                <Text style={styles.filtersHeading}>Filters</Text>
                <TouchableOpacity onPress={handleResetFilters} activeOpacity={0.7}>
                  <Text style={styles.resetAllLink}>Reset All</Text>
                </TouchableOpacity>
              </View>

              {/* Location Section */}
              <View style={styles.filterSectionGroup}>
                <Text style={styles.filterGroupLabel}>Location</Text>
                <View style={styles.filterSelectDropdown}>
                  <Text style={styles.filterSelectVal}>Mysuru</Text>
                  <Ionicons name="chevron-down" size={13} color="#64748B" />
                </View>

                <View style={styles.checkboxList}>
                  {['Within 5 km', 'Within 10 km', 'Within 20 km'].map((dist, idx) => {
                    const key = idx === 0 ? '5km' : idx === 1 ? '10km' : '20km';
                    const isChecked = selectedDistance === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={styles.checkboxRow}
                        onPress={() => setSelectedDistance(key)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={17}
                          color={isChecked ? '#00B894' : '#CBD5E1'}
                        />
                        <Text style={[styles.checkboxLabel, isChecked && styles.checkboxLabelActive]}>
                          {dist}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Scan Type Section */}
              <View style={styles.filterSectionGroup}>
                <Text style={styles.filterGroupLabel}>Scan Type</Text>
                <View style={styles.checkboxList}>
                  {[
                    { id: 'mri', label: 'MRI' },
                    { id: 'ct', label: 'CT Scan' },
                    { id: 'xray', label: 'X-Ray' },
                    { id: 'usg', label: 'Ultrasound' },
                    { id: 'mammo', label: 'Mammography' },
                    { id: 'dexa', label: 'DEXA Scan' },
                  ].map((scan) => {
                    const isChecked = selectedScanTypes.includes(scan.id);
                    return (
                      <TouchableOpacity
                        key={scan.id}
                        style={styles.checkboxRow}
                        onPress={() => toggleScanType(scan.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={17}
                          color={isChecked ? '#00B894' : '#CBD5E1'}
                        />
                        <Text style={[styles.checkboxLabel, isChecked && styles.checkboxLabelActive]}>
                          {scan.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity style={{ marginTop: 4 }}>
                  <Text style={styles.showMoreLink}>Show more</Text>
                </TouchableOpacity>
              </View>

              {/* Price Range Section */}
              <View style={styles.filterSectionGroup}>
                <Text style={styles.filterGroupLabel}>Price Range</Text>
                <View style={styles.sliderTrackDummy}>
                  <View style={styles.sliderFilledDummy} />
                  <View style={styles.sliderThumbDummy} />
                </View>
                <Text style={styles.priceRangeValues}>₹500 — ₹25,000</Text>
              </View>

              {/* Availability Section */}
              <View style={styles.filterSectionGroup}>
                <Text style={styles.filterGroupLabel}>Availability</Text>
                <View style={styles.checkboxList}>
                  {[
                    { key: 'today', label: 'Today' },
                    { key: 'tomorrow', label: 'Tomorrow' },
                    { key: 'week', label: 'This Week' },
                  ].map((avail) => {
                    const isChecked = selectedAvailability === avail.key;
                    return (
                      <TouchableOpacity
                        key={avail.key}
                        style={styles.checkboxRow}
                        onPress={() => setSelectedAvailability(avail.key)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={17}
                          color={isChecked ? '#00B894' : '#CBD5E1'}
                        />
                        <Text style={[styles.checkboxLabel, isChecked && styles.checkboxLabelActive]}>
                          {avail.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Features Section */}
              <View style={styles.filterSectionGroup}>
                <Text style={styles.filterGroupLabel}>Features</Text>
                <View style={styles.checkboxList}>
                  {[
                    { key: 'cashless', label: 'Cashless Available' },
                    { key: 'reports24h', label: 'Reports in 24 hrs' },
                    { key: 'weekend', label: 'Weekend Available' },
                    { key: 'parking', label: 'Parking Available' },
                  ].map((feat) => {
                    const isChecked = selectedFeatures[feat.key];
                    return (
                      <TouchableOpacity
                        key={feat.key}
                        style={styles.checkboxRow}
                        onPress={() => toggleFeature(feat.key)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={17}
                          color={isChecked ? '#00B894' : '#CBD5E1'}
                        />
                        <Text style={[styles.checkboxLabel, isChecked && styles.checkboxLabelActive]}>
                          {feat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* ----------------------------------------------------
                COLUMN 2: SCAN RESULTS FEED
            ---------------------------------------------------- */}
            <View style={styles.resultsCol}>
              {/* Header with Sort Filter */}
              <View style={styles.resultsHeaderRow}>
                <View>
                  <Text style={styles.resultsScanHeading}>
                    {searchQuery ? searchQuery : 'MRI Brain (With Contrast)'}
                  </Text>
                  <Text style={styles.resultsCountSub}>
                    {filteredCentres.length} centres available in {selectedCity}
                  </Text>
                </View>

                {/* Sort By Dropdown */}
                <TouchableOpacity
                  style={styles.sortDropdownBtn}
                  onPress={() => {
                    setSortBy(sortBy === 'price-low' ? 'price-high' : 'price-low');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sortLabel}>
                    Sort by{' '}
                    <Text style={styles.sortValue}>
                      {sortBy === 'price-low' ? 'Price: Low to High' : 'Price: High to Low'}
                    </Text>
                  </Text>
                  <Ionicons name="chevron-down" size={13} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Centre Result Cards */}
              <View style={styles.cardsFeedList}>
                {filteredCentres.map((centre) => (
                  <View key={centre.id} style={styles.centreResultCard}>
                    {/* Left Thumbnail */}
                    <Image source={{ uri: centre.image }} style={styles.centreThumbImg} />

                    {/* Middle Info Column */}
                    <View style={styles.centreMetaCol}>
                      <Text style={styles.centreNameText}>{centre.name}</Text>

                      {/* Ratings & Reviews Row */}
                      <View style={styles.ratingDistanceRow}>
                        <View style={styles.starBadge}>
                          <Ionicons name="star" size={11} color="#FF7F50" />
                          <Text style={styles.starText}>{centre.rating}</Text>
                        </View>
                        <Text style={styles.reviewsText}>({centre.reviews} reviews)</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.distanceText}>{centre.distance}</Text>
                        <Text style={styles.metaDot}>|</Text>
                        <Text style={styles.areaText} numberOfLines={1}>
                          {centre.area}
                        </Text>
                      </View>

                      {/* Feature Tags Row */}
                      <View style={styles.badgeTagsRow}>
                        {centre.availableToday && (
                          <View style={styles.featurePill}>
                            <Ionicons name="calendar-outline" size={12} color="#00B894" />
                            <Text style={styles.featurePillText}>Today Available</Text>
                          </View>
                        )}

                        {centre.reportsIn24h && (
                          <View style={styles.featurePill}>
                            <Ionicons name="time-outline" size={12} color="#00C2CB" />
                            <Text style={styles.featurePillText}>Reports in 24 hrs</Text>
                          </View>
                        )}

                        {centre.parking && (
                          <View style={styles.featurePill}>
                            <Ionicons name="car-outline" size={12} color="#64748B" />
                            <Text style={styles.featurePillText}>Parking Available</Text>
                          </View>
                        )}

                        {centre.cashless && (
                          <View style={styles.featurePill}>
                            <Ionicons name="shield-checkmark-outline" size={12} color="#1E3A8A" />
                            <Text style={styles.featurePillText}>Cashless Available</Text>
                          </View>
                        )}
                      </View>

                      {/* Time Slots Row */}
                      <View style={styles.slotsRow}>
                        {centre.slots.map((slot, sIdx) => {
                          const isSlotSelected = selectedSlot === `${centre.id}-${slot}`;
                          return (
                            <TouchableOpacity
                              key={sIdx}
                              style={[
                                styles.timeSlotChip,
                                isSlotSelected && styles.timeSlotChipSelected,
                              ]}
                              onPress={() => setSelectedSlot(`${centre.id}-${slot}`)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.timeSlotText,
                                  isSlotSelected && styles.timeSlotTextSelected,
                                ]}
                              >
                                {slot}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                        {centre.moreSlots > 0 && (
                          <Text style={styles.moreSlotsText}>+{centre.moreSlots} more</Text>
                        )}
                      </View>
                    </View>

                    {/* Right Price & Booking Action Column */}
                    <View style={styles.priceActionCol}>
                      <Text style={styles.centrePrice}>₹{centre.price.toLocaleString('en-IN')}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          showAlert(
                            'Price Breakdown',
                            `Includes scan procedure, radiologist consultation report, and digital high-res DICOM access. GST Included.`
                          )
                        }
                      >
                        <Text style={styles.viewPriceLink}>View Price Details</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.bookNowBtn}
                        onPress={() => handleBookCentre(centre)}
                        activeOpacity={0.88}
                      >
                        <Text style={styles.bookNowBtnText}>Book Now</Text>
                        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ----------------------------------------------------
                COLUMN 3: SIDEBAR WIDGETS (MAP, AI, UPLOAD)
            ---------------------------------------------------- */}
            <View style={styles.sidebarCol}>
              {/* Widget 1: Interactive Map Preview Card */}
              <View style={styles.mapCardWidget}>
                <View style={styles.mapHeaderRow}>
                  <Text style={styles.mapCardTitle}>Centres Near You</Text>
                  <TouchableOpacity
                    onPress={() => showAlert('Map View', 'Viewing all accredited centres across Mysuru on interactive Google Map.')}
                  >
                    <Text style={styles.viewOnMapLink}>View on Map ↗</Text>
                  </TouchableOpacity>
                </View>

                {/* Map Graphic Canvas */}
                <View style={styles.mapCanvasBox}>
                  {/* Street Pattern Background */}
                  <View style={styles.mapGridPattern} />

                  {/* Concentric Radar Rings */}
                  <View style={styles.radarRingOuter} />
                  <View style={styles.radarRingMiddle} />

                  {/* User Location Pulsing Center Dot */}
                  <View style={styles.userLocationPulse}>
                    <View style={[styles.userLocationDot, { backgroundColor: '#00C2CB' }]} />
                  </View>

                  {/* Mysuru Label */}
                  <Text style={styles.mapCityLabel}>Mysuru</Text>
                  <Text style={styles.mapSubLabel}>K.L. Layout</Text>

                  {/* Price Map Pins */}
                  <View style={[styles.mapPricePin, { top: 38, left: 75, backgroundColor: '#00B894' }]}>
                    <Ionicons name="location" size={12} color="#FFFFFF" />
                    <Text style={styles.mapPricePinText}>₹4,500</Text>
                  </View>

                  <View style={[styles.mapPricePin, { top: 22, right: 28, backgroundColor: '#00B894' }]}>
                    <Ionicons name="location" size={12} color="#FFFFFF" />
                    <Text style={styles.mapPricePinText}>₹6,000</Text>
                  </View>

                  <View style={[styles.mapPricePin, { top: 96, right: 12, backgroundColor: '#00B894' }]}>
                    <Ionicons name="location" size={12} color="#FFFFFF" />
                    <Text style={styles.mapPricePinText}>₹5,200</Text>
                  </View>

                  <View style={[styles.mapPricePin, { bottom: 30, left: 45, backgroundColor: '#00B894' }]}>
                    <Ionicons name="location" size={12} color="#FFFFFF" />
                    <Text style={styles.mapPricePinText}>₹5,500</Text>
                  </View>

                  <View style={[styles.mapPricePin, { bottom: 42, right: 36, backgroundColor: '#00B894' }]}>
                    <Ionicons name="location" size={12} color="#FFFFFF" />
                    <Text style={styles.mapPricePinText}>₹5,500</Text>
                  </View>

                  {/* Zoom Controls */}
                  <View style={styles.mapZoomControls}>
                    <TouchableOpacity style={styles.zoomBtn}>
                      <Text style={styles.zoomBtnText}>+</Text>
                    </TouchableOpacity>
                    <View style={styles.zoomDivider} />
                    <TouchableOpacity style={styles.zoomBtn}>
                      <Text style={styles.zoomBtnText}>-</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Widget 2: "Need Help Choosing?" AI Chatbot Card */}
              <View style={styles.aiHelpCard}>
                <View style={styles.aiHelpContentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aiHelpTitle}>Need Help Choosing?</Text>
                    <Text style={styles.aiHelpSub}>
                      Chat with MediUnify AI for guidance on the right scan, preparation and centre selection.
                    </Text>
                  </View>

                  {/* AI Avatar */}
                  <View style={styles.aiRobotAvatarCircle}>
                    <Ionicons name="hardware-chip" size={22} color="#00B894" />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.chatNowBtn}
                  onPress={() => navigation?.navigate('Chatbot')}
                  activeOpacity={0.88}
                >
                  <Text style={styles.chatNowBtnText}>Chat Now →</Text>
                </TouchableOpacity>
              </View>

              {/* Widget 3: "Have a Prescription or Scan Advice?" Upload Card */}
              <View style={styles.uploadCard}>
                <View style={styles.uploadHeaderRow}>
                  <Ionicons name="sparkles" size={16} color="#00C2CB" />
                  <Text style={styles.uploadCardHeading}>
                    Have a Prescription or Scan Advice?
                  </Text>
                </View>
                <Text style={styles.uploadCardDesc}>
                  Upload and let MediUnify AI find the best centres and prices for you.
                </Text>

                <TouchableOpacity
                  style={styles.uploadDottedBtn}
                  onPress={handleFileUpload}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cloud-upload" size={20} color="#00B894" />
                  <Text style={styles.uploadDottedBtnText}>Upload Prescription / Report</Text>
                  <Text style={styles.uploadSupportedText}>PDF, JPG, PNG (Max 10 MB)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            5. "WHY CHOOSE MEDIUNIFY FOR RADIOLOGY" HORIZONTAL BAR
        ============================================================ */}
        <View style={styles.whySectionWrap}>
          <View style={styles.sectionMaxWidth}>
            <Text style={styles.whyMainTitle}>Why Choose MediUnify for Radiology</Text>

            <View style={styles.whyFeaturesRow}>
              <View style={styles.whyItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#F0F9FF' }]}>
                  <Ionicons name="business" size={20} color="#1E3A8A" />
                </View>
                <Text style={styles.whyItemText}>Multiple trusted centres</Text>
              </View>

              <View style={styles.whyItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#E6FAF5' }]}>
                  <Ionicons name="pricetag" size={19} color="#00B894" />
                </View>
                <Text style={styles.whyItemText}>Transparent pricing</Text>
              </View>

              <View style={styles.whyItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#E0F7FA' }]}>
                  <Ionicons name="calendar" size={19} color="#00C2CB" />
                </View>
                <Text style={styles.whyItemText}>Online booking with real-time slots</Text>
              </View>

              <View style={styles.whyItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#F1F8E9' }]}>
                  <Ionicons name="speedometer" size={19} color="#7BC96F" />
                </View>
                <Text style={styles.whyItemText}>Accurate & quick reports</Text>
              </View>

              <View style={styles.whyItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="shield-checkmark" size={19} color="#FF7F50" />
                </View>
                <Text style={styles.whyItemText}>Secure & digital access to reports</Text>
              </View>

              <View style={styles.whyItem}>
                <View style={[styles.whyIconCircle, { backgroundColor: '#E6FAF5' }]}>
                  <Ionicons name="bulb" size={19} color="#00B894" />
                </View>
                <Text style={styles.whyItemText}>AI assistance for the right test</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 6. ENTERPRISE FOOTER */}
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
    paddingTop: 20,
    paddingBottom: 32,
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
    fontSize: 34,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  heroSubTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00B894',
    marginTop: 4,
  },
  heroDesc: {
    fontSize: 14.5,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 22,
    maxWidth: 620,
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

  // POPULAR SEARCHES
  popularSearchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 8,
  },
  popularLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  popularPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  popularPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  popularPillActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#00B894',
  },
  popularPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  popularPillTextActive: {
    color: '#00B894',
    fontWeight: '700',
  },

  // HERO RIGHT IMAGE & FLOATING CARD
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
  heroMachineImg: {
    width: '100%',
    height: 240,
  },
  floatingHighlightCard: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    maxWidth: 240,
  },
  floatingHighlightHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 8,
    lineHeight: 16,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  highlightText: {
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

  // 2. CATEGORIES SECTION
  categoriesSectionWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionMaxWidth: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  categoriesTrack: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 4,
  },
  catCard: {
    width: 105,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
  },
  catIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  catName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E3A8A',
    textAlign: 'center',
    lineHeight: 14,
  },
  catNameActive: {
    color: '#00B894',
    fontWeight: '800',
  },

  // 3. RECOMMENDED SECTION
  recommendedSectionWrap: {
    backgroundColor: '#F0F9FF', // Official Light Blue
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  recommendedBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  recommendedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  crownBadgeIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#00B894',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  recommendedSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recommendedCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dealThumb: {
    width: 60,
    height: 52,
    borderRadius: 8,
  },
  dealBody: {
    flex: 1,
  },
  dealScanTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  dealPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 2,
  },
  dealCentreName: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  dealArrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00B894',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 4. THREE-COLUMN WORKSPACE
  mainContentWrap: {
    backgroundColor: '#F8FAFC', // Official Light Gray
    paddingTop: 20,
    paddingBottom: 40,
  },
  threeColLayout: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },

  // COLUMN 1: FILTERS
  filtersCol: {
    width: 230,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 14,
  },
  filtersHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  resetAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  filterSectionGroup: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 14,
  },
  filterGroupLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  filterSelectDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  filterSelectVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  checkboxList: {
    gap: 7,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  checkboxLabelActive: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  showMoreLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 4,
  },
  sliderTrackDummy: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    position: 'relative',
    marginVertical: 10,
  },
  sliderFilledDummy: {
    width: '60%',
    height: '100%',
    backgroundColor: '#00B894',
    borderRadius: 2,
  },
  sliderThumbDummy: {
    position: 'absolute',
    top: -5,
    left: '60%',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00B894',
  },
  priceRangeValues: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },

  // COLUMN 2: RESULTS FEED
  resultsCol: {
    flex: 1,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  resultsScanHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  resultsCountSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  sortDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  sortLabel: {
    fontSize: 11.5,
    color: '#64748B',
  },
  sortValue: {
    fontWeight: '800',
    color: '#1E3A8A',
  },
  cardsFeedList: {
    gap: 14,
  },
  centreResultCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  centreThumbImg: {
    width: 115,
    height: 105,
    borderRadius: 10,
  },
  centreMetaCol: {
    flex: 1,
  },
  centreNameText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  ratingDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginVertical: 4,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FF7F50',
  },
  reviewsText: {
    fontSize: 11,
    color: '#64748B',
  },
  metaDot: {
    fontSize: 11,
    color: '#E2E8F0',
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
  },
  areaText: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: 160,
  },
  badgeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
    gap: 4,
  },
  featurePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  slotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  timeSlotChip: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    backgroundColor: '#F8FAFC',
  },
  timeSlotChipSelected: {
    borderColor: '#00B894',
    backgroundColor: '#F0F9FF',
  },
  timeSlotText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  timeSlotTextSelected: {
    color: '#00B894',
    fontWeight: '800',
  },
  moreSlotsText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },

  // PRICE ACTION COLUMN
  priceActionCol: {
    alignItems: 'flex-end',
    minWidth: 130,
    gap: 4,
  },
  centrePrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  viewPriceLink: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  bookNowBtn: {
    backgroundColor: '#00B894',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8.5,
    borderRadius: 8,
  },
  bookNowBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // COLUMN 3: SIDEBAR WIDGETS
  sidebarCol: {
    width: 260,
    gap: 16,
  },

  // MAP WIDGET
  mapCardWidget: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  viewOnMapLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  mapCanvasBox: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapGridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radarRingOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 148, 0.25)',
  },
  radarRingMiddle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 148, 0.4)',
  },
  userLocationPulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 194, 203, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C2CB',
  },
  mapCityLabel: {
    position: 'absolute',
    top: 60,
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  mapSubLabel: {
    position: 'absolute',
    top: 96,
    left: 10,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  mapPricePin: {
    position: 'absolute',
    backgroundColor: '#00B894',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 10,
    gap: 3,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mapPricePinText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mapZoomControls: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 20,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
    lineHeight: 14,
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },

  // AI HELP CARD
  aiHelpCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
  },
  aiHelpContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiHelpTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  aiHelpSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  aiRobotAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00B894',
  },
  chatNowBtn: {
    backgroundColor: '#00B894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7.5,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  chatNowBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // UPLOAD CARD
  uploadCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  uploadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  uploadCardHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    flex: 1,
  },
  uploadCardDesc: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
    marginBottom: 10,
  },
  uploadDottedBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#00B894',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  uploadDottedBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#00B894',
    marginTop: 4,
  },
  uploadSupportedText: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },

  // 5. WHY CHOOSE SECTION
  whySectionWrap: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 32,
  },
  whyMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E3A8A',
    marginBottom: 24,
    textAlign: 'center',
  },
  whyFeaturesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  whyItem: {
    flex: 1,
    minWidth: 160,
    maxWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  whyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whyItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
    flex: 1,
    lineHeight: 16,
  },
});

export default ImagingScreenWeb;
