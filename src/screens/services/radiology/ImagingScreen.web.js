import React, { useState, useMemo, useRef } from 'react';
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
import { radiologyLabs, radiologyCategories, getLabById } from '../../../data/radiologyLabsData';
import { useCart } from '../../../context/CartContext';

// ==================================================
// RADIOLOGY & CARDIOLOGY CATEGORIES (MAPPED FROM SINGLE SOURCE OF TRUTH)
// ==================================================
const CATEGORY_THEMES = {
  all: { bg: '#F1F5F9', color: '#1E3A8A' },
  cardiology: { bg: '#FFF1F2', color: '#E11D48' },
  mri: { bg: '#F0F9FF', color: '#1E3A8A' },
  ct: { bg: '#E0F7FA', color: '#00C2CB' },
  usg: { bg: '#E8F8F5', color: '#00B894' },
  xray: { bg: '#FFF3E0', color: '#FF7F50' },
  mammo: { bg: '#FFEBE6', color: '#FF7F50' },
  dexa: { bg: '#F1F8E9', color: '#7BC96F' },
  doppler: { bg: '#F3E8FF', color: '#8B5CF6' },
  pet: { bg: '#E8EAF6', color: '#1E3A8A' },
};

const RADIOLOGY_CATEGORIES = radiologyCategories.map((cat) => ({
  ...cat,
  bg: CATEGORY_THEMES[cat.id]?.bg || '#F8FAFC',
  color: CATEGORY_THEMES[cat.id]?.color || '#1E3A8A',
}));

// ==================================================
// POPULAR SEARCHES
// ==================================================
const POPULAR_SEARCHES = [
  '2D Echo',
  'ECG',
  'MRI Brain',
  'TMT Test',
  'CT Coronary Angio',
  'CT Scan',
  'Ultrasound Abdomen',
  'X-Ray Chest',
];

// ==================================================
// RECOMMENDED SCAN DEALS
// ==================================================
const RECOMMENDED_DEALS = [
  {
    id: 'REC-CAR-1',
    scanTitle: '2D Echo + Doppler Study',
    price: 1899,
    centreName: 'Unnathi Advanced Diagnostics',
    image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400',
    category: 'cardiology',
  },
  {
    id: 'REC-CAR-2',
    scanTitle: '12-Lead Digital ECG',
    price: 299,
    centreName: 'MediCare Precision Scan Lab',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400',
    category: 'cardiology',
  },
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
// DIAGNOSTIC LABS PHOTOGRAPHY & SLOTS (WEB MAPPING)
// ==================================================
const LAB_IMAGES = {
  'lab-unnathi-main': 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600',
  'lab-medall-02': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600',
  'lab-hp-03': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600',
  'lab-city-04': 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600',
  'lab-apollo-05': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600',
  'lab-clumax-06': 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600',
};

const LAB_SLOTS = {
  'lab-unnathi-main': ['08:30 AM', '10:30 AM', '01:30 PM', '04:30 PM'],
  'lab-medall-02': ['09:00 AM', '11:00 AM', '02:00 PM', '05:00 PM'],
  'lab-hp-03': ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM'],
  'lab-city-04': ['09:30 AM', '11:30 AM', '01:30 PM', '03:30 PM'],
  'lab-apollo-05': ['10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM'],
  'lab-clumax-06': ['10:00 AM', '12:00 PM', '02:00 PM', '05:00 PM'],
};

// Helper to get active test for a lab based on current category or search query
const getLabActiveTest = (lab, category, query = '') => {
  if (!lab || !lab.availableTests || lab.availableTests.length === 0) {
    return {
      id: 'RAD-DEFAULT',
      name: 'Diagnostic Scan',
      category: 'mri',
      categoryLabel: 'Diagnostic Scan',
      price: 2500,
      mrp: 3500,
      discount: '25% OFF',
      reportTime: 'Within 4 Hours',
      fastingRequired: false,
    };
  }

  const q = (query || '').toLowerCase().trim();

  // 1. Search Query keyword match (prioritizing specific test name)
  if (q) {
    if (q.includes('echo')) {
      const echoTest = lab.availableTests.find((t) => t.name.toLowerCase().includes('echo'));
      if (echoTest) return echoTest;
    }
    if (q.includes('ecg')) {
      const ecgTest = lab.availableTests.find((t) => t.name.toLowerCase().includes('ecg'));
      if (ecgTest) return ecgTest;
    }
    if (q.includes('tmt') || q.includes('treadmill') || q.includes('stress')) {
      const tmtTest = lab.availableTests.find((t) => {
        const n = t.name.toLowerCase();
        return n.includes('tmt') || n.includes('treadmill') || n.includes('stress');
      });
      if (tmtTest) return tmtTest;
    }
    if (q.includes('holter')) {
      const holterTest = lab.availableTests.find((t) => t.name.toLowerCase().includes('holter'));
      if (holterTest) return holterTest;
    }
    if (q.includes('angio') || q.includes('coronary')) {
      const angioTest = lab.availableTests.find((t) => {
        const n = t.name.toLowerCase();
        return n.includes('angio') || n.includes('coronary');
      });
      if (angioTest) return angioTest;
    }
    if (q.includes('mri')) {
      const mriTest = lab.availableTests.find((t) => t.name.toLowerCase().includes('mri') || t.category === 'mri');
      if (mriTest) return mriTest;
    }
    if (q.includes('ct')) {
      const ctTest = lab.availableTests.find((t) => t.name.toLowerCase().includes('ct') || t.category === 'ct');
      if (ctTest) return ctTest;
    }
    if (q.includes('usg') || q.includes('ultrasound')) {
      const usgTest = lab.availableTests.find((t) => t.name.toLowerCase().includes('ultrasound') || t.category === 'usg');
      if (usgTest) return usgTest;
    }
    if (q.includes('x-ray') || q.includes('xray')) {
      const xrayTest = lab.availableTests.find((t) => t.name.toLowerCase().includes('x-ray') || t.category === 'xray');
      if (xrayTest) return xrayTest;
    }
    if (q.includes('dexa') || q.includes('bone') || q.includes('bmd')) {
      const dexaTest = lab.availableTests.find((t) => t.name.toLowerCase().includes('dexa') || t.category === 'dexa');
      if (dexaTest) return dexaTest;
    }
    if (q.includes('mammo') || q.includes('breast')) {
      const mammoTest = lab.availableTests.find((t) => t.name.toLowerCase().includes('mammo') || t.category === 'mammo');
      if (mammoTest) return mammoTest;
    }
    if (q.includes('pet')) {
      const petTest = lab.availableTests.find((t) => t.name.toLowerCase().includes('pet') || t.category === 'pet');
      if (petTest) return petTest;
    }

    // Direct test name substring match
    const directNameMatch = lab.availableTests.find((t) => t.name.toLowerCase().includes(q));
    if (directNameMatch) return directNameMatch;

    // Direct category / label substring match
    const directLabelMatch = lab.availableTests.find((t) => (t.categoryLabel || '').toLowerCase().includes(q));
    if (directLabelMatch) return directLabelMatch;
  }

  // 2. Specific category match (e.g. "cardiology", "mri", etc.)
  if (category && category !== 'all') {
    const catMatched = lab.availableTests.find((t) => t.category === category);
    if (catMatched) return catMatched;
  }

  // 3. Fallback to primary test
  return lab.availableTests[0];
};

const ImagingScreenWeb = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const mainScrollViewRef = useRef(null);
  const resultsSectionRef = useRef(null);
  const resultsSectionY = useRef(0);

  // Cart Context & Quick Filter State
  const { radiologyCart, addToCart, removeFromCart, radiologyCartCount, radiologyFinalTotal } = useCart();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const filterTabs = ['All', 'Top Rated (4.8+)', 'Open 24x7', 'Nearest', 'Special Offers'];

  // Search & Filter State (Defaulting to 'all' exactly like mobile)
  const [searchQuery, setSearchQuery] = useState(route?.params?.query || route?.params?.search || '');
  const [selectedCity, setSelectedCity] = useState('Mysuru');
  const [selectedCategory, setSelectedCategory] = useState(route?.params?.initialCategory || 'all');
  const [selectedDistance, setSelectedDistance] = useState('all'); // 'all' | '5km' | '10km' | '20km'
  const [selectedScanTypes, setSelectedScanTypes] = useState(
    route?.params?.initialCategory && route.params.initialCategory !== 'all' ? [route.params.initialCategory] : []
  );
  const [selectedAvailability, setSelectedAvailability] = useState('all'); // 'all' | 'today' | 'tomorrow' | 'week'
  const [selectedFeatures, setSelectedFeatures] = useState({
    cashless: false,
    reports24h: false,
    weekend: false,
    parking: false,
  });
  const [minPrice, setMinPrice] = useState(200);
  const [maxPrice, setMaxPrice] = useState(25000);
  const [sortBy, setSortBy] = useState('price-low'); // 'price-low' | 'price-high' | 'distance' | 'rating'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [uploadToast, setUploadToast] = useState(null);
  const [selectedTestPerLab, setSelectedTestPerLab] = useState({});

  // Sync with route params changes
  React.useEffect(() => {
    if (route?.params?.query !== undefined) {
      setSearchQuery(route.params.query);
    } else if (route?.params?.search !== undefined) {
      setSearchQuery(route.params.search);
    }
    if (route?.params?.initialCategory) {
      setSelectedCategory(route.params.initialCategory);
      setSelectedScanTypes(route.params.initialCategory === 'all' ? [] : [route.params.initialCategory]);
    }
  }, [route?.params?.query, route?.params?.search, route?.params?.initialCategory]);

  // Handle Popular Search pill tap
  const handlePopularSearch = (term) => {
    setSearchQuery(term);
    const q = term.toLowerCase();
    if (q.includes('echo') || q.includes('ecg') || q.includes('tmt') || q.includes('coronary') || q.includes('holter')) {
      setSelectedCategory('cardiology');
      setSelectedScanTypes(['cardiology']);
    } else if (q.includes('mri')) {
      setSelectedCategory('mri');
      setSelectedScanTypes(['mri']);
    } else if (q.includes('ct')) {
      setSelectedCategory('ct');
      setSelectedScanTypes(['ct']);
    } else if (q.includes('ultrasound') || q.includes('usg') || q.includes('abdomen')) {
      setSelectedCategory('usg');
      setSelectedScanTypes(['usg']);
    } else if (q.includes('x-ray') || q.includes('chest')) {
      setSelectedCategory('xray');
      setSelectedScanTypes(['xray']);
    }
    scrollToResults();
  };

  // Robust Smooth Scroll to Results Section Below ("the below screen") on Web
  const scrollToResults = () => {
    const doScroll = () => {
      const targetY = resultsSectionY.current > 100 ? resultsSectionY.current - 15 : 680;

      // 1. Direct React Native Web ScrollView scrollTo
      if (mainScrollViewRef.current && typeof mainScrollViewRef.current.scrollTo === 'function') {
        try {
          mainScrollViewRef.current.scrollTo({ y: targetY, animated: true });
        } catch (e) {}
      }

      // 2. Direct DOM scrollIntoView if element exists
      if (typeof document !== 'undefined') {
        const el =
          document.getElementById('radiologyResultsAnchor') ||
          document.querySelector('[data-testid="radiologyResultsAnchor"]') ||
          document.querySelector('[aria-label="radiologyResultsAnchor"]') ||
          document.querySelector('[data-results-anchor="true"]');

        if (el && typeof el.scrollIntoView === 'function') {
          try {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } catch (e) {
            try { el.scrollIntoView(true); } catch (e2) {}
          }
        }
      }

      // 3. Window scroll fallback
      if (typeof window !== 'undefined') {
        try {
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        } catch (e) {
          window.scrollTo(0, targetY);
        }
      }
    };

    doScroll();
    setTimeout(doScroll, 40);
    setTimeout(doScroll, 120);
    setTimeout(doScroll, 250);
  };

  // Handle Category Selection with Immediate Scroll to the Results Below (Same as Mobile)
  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      setSelectedScanTypes([]);
    } else {
      setSelectedScanTypes([catId]);
    }
    scrollToResults();
  };

  // Toggle Scan Type Checkbox
  const toggleScanType = (typeId) => {
    setSelectedScanTypes((prev) => {
      const updated = prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId];
      if (updated.length === 1) {
        setSelectedCategory(updated[0]);
      } else if (updated.length === 0) {
        setSelectedCategory('all');
      }
      return updated;
    });
  };

  // Toggle Feature Checkbox
  const toggleFeature = (featKey) => {
    setSelectedFeatures((prev) => ({ ...prev, [featKey]: !prev[featKey] }));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDistance('all');
    setSelectedScanTypes([]);
    setSelectedFilter('All');
    setMinPrice(200);
    setMaxPrice(25000);
    setSelectedAvailability('all');
    setSelectedFeatures({
      cashless: false,
      reports24h: false,
      weekend: false,
      parking: false,
    });
    setSortBy('price-low');
    setSelectedTestPerLab({});
  };

  // Handle Add to Cart (supports active test or selected test in card)
  const handleAddToCart = (lab, specificTest = null) => {
    const activeTest =
      specificTest ||
      (selectedTestPerLab[lab.id] && lab.availableTests.find((t) => t.id === selectedTestPerLab[lab.id])) ||
      getLabActiveTest(lab, selectedCategory, searchQuery);
    const cartItem = {
      id: activeTest.id,
      name: activeTest.name,
      category: 'Radiology',
      categoryLabel: activeTest.categoryLabel || 'Radiology',
      modality: activeTest.categoryLabel,
      modalityCode: activeTest.modalityCode,
      price: activeTest.price,
      mrp: activeTest.mrp,
      discount: activeTest.discount,
      duration: activeTest.duration,
      reportTime: activeTest.reportTime,
      fastingRequired: activeTest.fastingRequired,
      fastingHours: activeTest.fastingHours,
      preparation: activeTest.preparation,
      labId: lab.id,
      labName: lab.name,
      labArea: lab.area,
      labAddress: lab.address,
      labPhone: lab.phone,
      itemType: 'radiology',
      quantity: 1,
    };
    addToCart(cartItem, 1, 'radiology');
    setUploadToast(`Added "${activeTest.name}" to Radiology Cart!`);
    setTimeout(() => setUploadToast(null), 3000);
  };

  // Check if test is currently in radiology cart
  const isItemInCart = (testId) => {
    return radiologyCart?.some((item) => item.id === testId);
  };

  // Filtered & Sorted Radiology Labs (Single Source of Truth from radiologyLabsData)
  const filteredLabs = useMemo(() => {
    return radiologyLabs.filter((lab) => {
      // 1. Modality category filter / Scan Type filter (matching mobile)
      if (selectedScanTypes && selectedScanTypes.length > 0) {
        const matchesScanType = selectedScanTypes.some(
          (st) =>
            lab.availableTests.some((t) => t.category === st) ||
            lab.modalities?.some((m) => m.toLowerCase().includes(st))
        );
        if (!matchesScanType) return false;
      } else if (selectedCategory && selectedCategory !== 'all') {
        const hasCategoryTest = lab.availableTests.some((t) => t.category === selectedCategory);
        if (!hasCategoryTest) return false;
      }

      // Relevant tests in this lab for current category/query
      const relevantTests = selectedCategory !== 'all'
        ? lab.availableTests.filter((t) => t.category === selectedCategory)
        : lab.availableTests;

      // 2. Price filter (Interactive Range Slider & Quick Presets)
      const hasTestInPriceRange = relevantTests.some(
        (t) => t.price >= minPrice && t.price <= maxPrice
      );
      if (!hasTestInPriceRange) {
        return false;
      }

      // 3. Search query filter (Lab Name, Area, Modalities, or Tests)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = lab.name.toLowerCase().includes(q);
        const matchesArea = lab.area.toLowerCase().includes(q);
        const matchesModality = lab.modalities?.some((m) => m.toLowerCase().includes(q));
        const matchesTest = lab.availableTests.some(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            (t.categoryLabel && t.categoryLabel.toLowerCase().includes(q)) ||
            (t.description && t.description.toLowerCase().includes(q))
        );
        const matchesKeywords =
          (q.includes('echo') && (lab.modalities?.some((m) => m.toLowerCase().includes('cardio')) || lab.availableTests.some((t) => t.name.toLowerCase().includes('echo')))) ||
          (q.includes('ecg') && (lab.modalities?.some((m) => m.toLowerCase().includes('cardio')) || lab.availableTests.some((t) => t.name.toLowerCase().includes('ecg')))) ||
          (q.includes('tmt') && (lab.modalities?.some((m) => m.toLowerCase().includes('cardio')) || lab.availableTests.some((t) => t.name.toLowerCase().includes('tmt')))) ||
          (q.includes('holter') && (lab.modalities?.some((m) => m.toLowerCase().includes('cardio')) || lab.availableTests.some((t) => t.name.toLowerCase().includes('holter')))) ||
          (q.includes('mri') && lab.availableTests.some((t) => t.category === 'mri')) ||
          (q.includes('ct') && lab.availableTests.some((t) => t.category === 'ct')) ||
          (q.includes('x-ray') && lab.availableTests.some((t) => t.category === 'xray')) ||
          (q.includes('ultrasound') && lab.availableTests.some((t) => t.category === 'usg')) ||
          (q.includes('dexa') && lab.availableTests.some((t) => t.category === 'dexa')) ||
          (q.includes('mammo') && lab.availableTests.some((t) => t.category === 'mammo'));

        if (!matchesName && !matchesArea && !matchesModality && !matchesTest && !matchesKeywords) {
          return false;
        }
      }

      // 4. Quick filter tabs (Same as Mobile)
      if (selectedFilter === 'Top Rated (4.8+)') {
        if (lab.rating < 4.8) return false;
      } else if (selectedFilter === 'Open 24x7') {
        if (!lab.openHours.toLowerCase().includes('24x7')) return false;
      } else if (selectedFilter === 'Nearest') {
        if (parseFloat(lab.distance) > 3.0) return false;
      } else if (selectedFilter === 'Special Offers') {
        if (!lab.discountOffer) return false;
      }

      // 5. Distance filter
      if (selectedDistance === '5km') {
        const distNum = parseFloat(lab.distance) || 0;
        if (distNum > 5.0) return false;
      } else if (selectedDistance === '10km') {
        const distNum = parseFloat(lab.distance) || 0;
        if (distNum > 10.0) return false;
      }

      // 6. Features filter
      if (selectedFeatures.reports24h && !lab.turnaroundTime.toLowerCase().includes('hour')) return false;
      if (selectedFeatures.weekend && !lab.openHours.toLowerCase().includes('24x7')) return false;

      // 7. Availability
      if (selectedAvailability === 'today' && !lab.openHours.toLowerCase().includes('open')) return false;

      return true;
    }).sort((a, b) => {
      const priceA = getLabActiveTest(a, selectedCategory, searchQuery).price;
      const priceB = getLabActiveTest(b, selectedCategory, searchQuery).price;
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
      return 0;
    });
  }, [searchQuery, selectedCategory, selectedScanTypes, selectedFilter, minPrice, maxPrice, selectedDistance, selectedFeatures, selectedAvailability, sortBy]);

  const filteredCentres = filteredLabs;

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
  const handleBookCentre = (lab, specificTest = null) => {
    const bookingTest =
      specificTest ||
      (selectedTestPerLab[lab.id] && lab.availableTests.find((t) => t.id === selectedTestPerLab[lab.id])) ||
      getLabActiveTest(lab, selectedCategory, searchQuery);
    const labSlot = selectedSlot
      ? selectedSlot.split('-').slice(1).join('-')
      : (LAB_SLOTS[lab.id] ? LAB_SLOTS[lab.id][0] : '09:30 AM');

    if (navigation?.navigate) {
      navigation.navigate('RadiologyBooking', {
        lab,
        test: {
          ...bookingTest,
          price: bookingTest.price,
          timeSlot: labSlot,
        },
        selectedTests: [{
          ...bookingTest,
          price: bookingTest.price,
          timeSlot: labSlot,
        }],
      });
    } else {
      showAlert('Booking', `Proceeding to slot booking for ${lab.name} (${bookingTest.name}) at ₹${bookingTest.price.toLocaleString('en-IN')}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={mainScrollViewRef}
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
              <Text style={styles.breadcrumbActive}>Radiology & Cardiology Diagnostics</Text>

              {radiologyCartCount > 0 && (
                <TouchableOpacity
                  style={styles.headerCartPill}
                  onPress={() => navigation?.navigate('Cart', { initialTab: 'radiology' })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="radio-outline" size={13} color="#00B894" />
                  <Text style={styles.headerCartPillText}>
                    Radiology Cart ({radiologyCartCount}) • ₹{radiologyFinalTotal.toLocaleString('en-IN')}
                  </Text>
                  <Ionicons name="arrow-forward" size={11} color="#00B894" />
                </TouchableOpacity>
              )}
            </View>

            {/* Main Hero Row */}
            <View style={[styles.heroRow, !isDesktop && { flexDirection: 'column' }]}>
              {/* Left Column: Heading, Subtitle & Search Bar */}
              <View style={styles.heroLeftCol}>
                <Text style={styles.heroMainTitle}>Book Radiology & Cardiology Tests</Text>
                <Text style={styles.heroSubTitle}>Compare prices. Choose accredited diagnostic centres.</Text>
                <Text style={styles.heroDesc}>
                  2D Echo, 12-Lead ECG, TMT, 3T MRI, CT Scan, Ultrasound, Digital X-Ray, Mammography & more — verified reports.
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
                    onPress={scrollToResults}
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
                        onPress={() => handlePopularSearch(term)}
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
                    onPress={() => handleSelectCategory(cat.id)}
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
                      if (deal.category) handleSelectCategory(deal.category);
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
        <View
          ref={resultsSectionRef}
          testID="radiologyResultsAnchor"
          nativeID="radiologyResultsAnchor"
          accessibilityLabel="radiologyResultsAnchor"
          dataSet={{ resultsAnchor: 'true' }}
          style={styles.mainContentWrap}
          onLayout={(e) => {
            if (e?.nativeEvent?.layout?.y) {
              resultsSectionY.current = e.nativeEvent.layout.y;
            }
          }}
        >
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
                        onPress={() => setSelectedDistance(isChecked ? 'all' : key)}
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
                    { id: 'cardiology', label: 'Cardiology & ECG' },
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.filterGroupLabel}>Price Range</Text>
                  {maxPrice < 25000 && (
                    <TouchableOpacity onPress={() => setMaxPrice(25000)}>
                      <Text style={styles.clearFilterLink}>Reset</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Range Slider */}
                {Platform.OS === 'web' ? (
                  <View style={{ marginVertical: 6, width: '100%' }}>
                    <input
                      type="range"
                      min="200"
                      max="25000"
                      step="100"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: 6,
                        borderRadius: 3,
                        accentColor: '#00B894',
                        cursor: 'pointer',
                        outline: 'none',
                        margin: 0,
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.sliderTrackDummy}>
                    <View style={[styles.sliderFilledDummy, { width: `${Math.min(100, Math.max(10, (maxPrice / 25000) * 100))}%` }]} />
                    <View style={[styles.sliderThumbDummy, { left: `${Math.min(95, Math.max(5, (maxPrice / 25000) * 100))}%` }]} />
                  </View>
                )}

                {/* Live Values Display */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={styles.priceRangeValues}>₹{minPrice.toLocaleString('en-IN')} — ₹{maxPrice.toLocaleString('en-IN')}</Text>
                  <View style={styles.activePriceBadge}>
                    <Text style={styles.activePriceBadgeText}>Up to ₹{maxPrice.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Quick Price Preset Chips */}
                <View style={styles.pricePresetsWrap}>
                  {[
                    { label: 'All', val: 25000 },
                    { label: '< ₹1k', val: 1000 },
                    { label: '< ₹2.5k', val: 2500 },
                    { label: '< ₹5k', val: 5000 },
                    { label: '< ₹10k', val: 10000 },
                  ].map((preset) => {
                    const isActive = maxPrice === preset.val;
                    return (
                      <TouchableOpacity
                        key={preset.label}
                        style={[styles.pricePresetChip, isActive && styles.pricePresetChipActive]}
                        onPress={() => setMaxPrice(preset.val)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.pricePresetChipText, isActive && styles.pricePresetChipTextActive]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
                    {searchQuery
                      ? searchQuery
                      : selectedCategory === 'cardiology'
                      ? 'Cardiology & ECG Diagnostics (2D Echo, TMT, Holter)'
                      : selectedCategory === 'all'
                      ? 'All Diagnostic & Imaging Scans'
                      : `${selectedCategory.toUpperCase()} Scans`}
                  </Text>
                  <Text style={styles.resultsCountSub}>
                    {filteredLabs.length} accredited diagnostic centres available in {selectedCity}
                  </Text>
                </View>

                {/* Sort By Dropdown */}
                <TouchableOpacity
                  style={styles.sortDropdownBtn}
                  onPress={() => {
                    setSortBy(sortBy === 'price-low' ? 'price-high' : sortBy === 'price-high' ? 'rating' : 'price-low');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sortLabel}>
                    Sort by{' '}
                    <Text style={styles.sortValue}>
                      {sortBy === 'price-low' ? 'Price: Low to High' : sortBy === 'price-high' ? 'Price: High to Low' : 'Highest Rated'}
                    </Text>
                  </Text>
                  <Ionicons name="chevron-down" size={13} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Quick Filter Tabs (Same as Mobile App) */}
              <View style={styles.webFilterTabsRow}>
                {filterTabs.map((tab) => {
                  const isSelected = selectedFilter === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.webFilterTab, isSelected && styles.webFilterTabActive]}
                      onPress={() => setSelectedFilter(tab)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.webFilterTabText, isSelected && styles.webFilterTabTextActive]}>
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Empty State */}
              {filteredLabs.length === 0 && (
                <View style={styles.emptyStateBox}>
                  <Ionicons name="search-outline" size={42} color="#94A3B8" />
                  <Text style={styles.emptyStateTitle}>No diagnostic centres match your filters</Text>
                  <Text style={styles.emptyStateDesc}>Try broadening your price range, clearing keywords, or resetting filters.</Text>
                  <TouchableOpacity style={styles.emptyResetBtn} onPress={handleResetFilters} activeOpacity={0.85}>
                    <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Diagnostic Lab Result Cards */}
              <View style={styles.cardsFeedList}>
                {filteredLabs.map((lab) => {
                  const selectedTestId = selectedTestPerLab[lab.id];
                  const activeTest =
                    (selectedTestId && lab.availableTests.find((t) => t.id === selectedTestId)) ||
                    getLabActiveTest(lab, selectedCategory, searchQuery);
                  const isCardio = selectedCategory === 'cardiology' || activeTest.category === 'cardiology';
                  const labImg = LAB_IMAGES[lab.id] || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600';
                  const slots = LAB_SLOTS[lab.id] || ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];
                  const inCart = isItemInCart(activeTest.id);

                  // Relevant tests for selected category
                  const relevantTests = selectedCategory !== 'all'
                    ? lab.availableTests.filter((t) => t.category === selectedCategory)
                    : lab.availableTests;
                  const minPriceInLab = Math.min(
                    ...(relevantTests.length > 0 ? relevantTests : lab.availableTests).map((t) => t.price)
                  );
                  const cardioTestsCount = lab.availableTests.filter((t) => t.category === 'cardiology').length;

                  return (
                    <View key={lab.id} style={styles.centreResultCard}>
                      {/* Left Thumbnail & Badges */}
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => navigation?.navigate('RadiologyLabDetails', { labId: lab.id, initialCategory: selectedCategory })}
                        style={styles.thumbWrapper}
                      >
                        <Image source={{ uri: labImg }} style={styles.centreThumbImg} />
                        <View style={styles.accreditTagOverlay}>
                          <Ionicons name="shield-checkmark" size={10} color="#FFFFFF" />
                          <Text style={styles.accreditTagOverlayText} numberOfLines={1}>{lab.accreditation}</Text>
                        </View>
                        {lab.badge && (
                          <View style={styles.labBadgeOverlay}>
                            <Text style={styles.labBadgeOverlayText}>{lab.badge}</Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Middle Info Column */}
                      <View style={styles.centreMetaCol}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => navigation?.navigate('RadiologyLabDetails', { labId: lab.id, initialCategory: selectedCategory })}
                        >
                          <Text style={styles.centreNameText}>{lab.name}</Text>
                        </TouchableOpacity>

                        {/* Category & Tests Count Badge (Matching Mobile) */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4, marginBottom: 5 }}>
                          {isCardio ? (
                            <View style={[styles.cardioCountBadge, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                              <Ionicons name="heart" size={12} color="#E11D48" />
                              <Text style={styles.cardioCountBadgeText}>
                                {cardioTestsCount} Cardiology Tests Available
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.totalTestsBadge}>
                              <Text style={styles.totalTestsBadgeText}>
                                {relevantTests.length} Tests Available
                              </Text>
                            </View>
                          )}

                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isCardio ? '#FFF1F2' : '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 5, borderWidth: 1, borderColor: isCardio ? '#FECDD3' : '#DBEAFE' }}>
                            <Ionicons
                              name={isCardio ? 'pulse' : 'scan'}
                              size={11}
                              color={isCardio ? '#BE123C' : '#1E40AF'}
                              style={{ marginRight: 4 }}
                            />
                            <Text style={{ fontSize: 11.5, fontWeight: '700', color: isCardio ? '#BE123C' : '#1E40AF' }}>
                              Active: {activeTest.name}
                            </Text>
                          </View>
                        </View>

                        {/* Ratings & Reviews Row */}
                        <View style={styles.ratingDistanceRow}>
                          <View style={styles.starBadge}>
                            <Ionicons name="star" size={11} color="#FF7F50" />
                            <Text style={styles.starText}>{lab.rating}</Text>
                          </View>
                          <Text style={styles.reviewsText}>({lab.reviewCount} reviews)</Text>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={styles.distanceText}>{lab.distance}</Text>
                          <Text style={styles.metaDot}>|</Text>
                          <Text style={styles.areaText} numberOfLines={1}>
                            {lab.area}
                          </Text>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={styles.turnaroundText}>{lab.turnaroundTime}</Text>
                        </View>

                        {/* Modalities Chips */}
                        <View style={styles.modalitiesFeedRow}>
                          {lab.modalities.slice(0, 4).map((modality, mIdx) => (
                            <View key={mIdx} style={styles.modalityPill}>
                              <Text style={styles.modalityPillText}>{modality}</Text>
                            </View>
                          ))}
                          {lab.modalities.length > 4 && (
                            <View style={[styles.modalityPill, styles.modalityMorePill]}>
                              <Text style={styles.modalityMorePillText}>+{lab.modalities.length - 4} more</Text>
                            </View>
                          )}
                        </View>

                        {/* Quick Test Selection Chips (Cardiology & Category Tests) */}
                        {relevantTests.length > 1 && (
                          <View style={styles.testMiniPillsRow}>
                            <Text style={styles.quickTestsLabel}>Tests in this lab:</Text>
                            {relevantTests.slice(0, 4).map((t) => {
                              const isTestActive = activeTest.id === t.id;
                              return (
                                <TouchableOpacity
                                  key={t.id}
                                  style={[styles.testMiniPill, isTestActive && styles.testMiniPillActive]}
                                  onPress={() => setSelectedTestPerLab((prev) => ({ ...prev, [lab.id]: t.id }))}
                                  activeOpacity={0.8}
                                >
                                  <Text style={[styles.testMiniPillName, isTestActive && styles.testMiniPillNameActive]}>
                                    {t.name.split('(')[0].trim()}
                                  </Text>
                                  <Text style={[styles.testMiniPillPrice, isTestActive && styles.testMiniPillPriceActive]}>
                                    ₹{t.price}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}

                        {/* Discount Offer Banner if Available */}
                        {lab.discountOffer && (
                          <View style={styles.labOfferBanner}>
                            <Ionicons name="pricetag" size={12} color="#00875A" />
                            <Text style={styles.labOfferBannerText}>{lab.discountOffer}</Text>
                          </View>
                        )}

                        {/* Time Slots Row */}
                        <View style={styles.slotsRow}>
                          <Text style={styles.slotLabel}>Slots:</Text>
                          {slots.map((slot, sIdx) => {
                            const isSlotSelected = selectedSlot === `${lab.id}-${slot}`;
                            return (
                              <TouchableOpacity
                                key={sIdx}
                                style={[
                                  styles.timeSlotChip,
                                  isSlotSelected && styles.timeSlotChipSelected,
                                ]}
                                onPress={() => setSelectedSlot(`${lab.id}-${slot}`)}
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
                        </View>
                      </View>

                      {/* Right Price & Booking Action Column */}
                      <View style={styles.priceActionCol}>
                        <View style={{ alignItems: 'flex-end', width: '100%' }}>
                          <Text style={styles.fromPriceLabel}>From</Text>
                          <Text style={styles.centrePrice}>₹{minPriceInLab.toLocaleString('en-IN')}</Text>
                          {activeTest.price !== minPriceInLab && (
                            <Text style={styles.activeTestPriceLabel}>
                              {activeTest.name.split('(')[0].trim()}: ₹{activeTest.price.toLocaleString('en-IN')}
                            </Text>
                          )}
                          {activeTest.mrp && activeTest.mrp > activeTest.price && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                              <Text style={styles.mrpText}>₹{activeTest.mrp.toLocaleString('en-IN')}</Text>
                              <View style={styles.discountBadgeWrap}>
                                <Text style={styles.discountBadgeWrapText}>{activeTest.discount || 'Special Price'}</Text>
                              </View>
                            </View>
                          )}
                        </View>

                        {/* Primary View Tests & Book Button (Direct Route to RadiologyLabDetails) */}
                        <TouchableOpacity
                          style={styles.viewTestsPrimaryBtn}
                          onPress={() =>
                            navigation?.navigate('RadiologyLabDetails', {
                              labId: lab.id,
                              initialCategory: selectedCategory,
                            })
                          }
                          activeOpacity={0.88}
                        >
                          <Text style={styles.viewTestsPrimaryBtnText}>View Tests & Book</Text>
                          <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* Action Buttons Row */}
                        <View style={styles.cardActionsContainer}>
                          <TouchableOpacity
                            style={[styles.webAddToCartBtn, inCart && styles.webAddToCartBtnActive]}
                            onPress={() => handleAddToCart(lab, activeTest)}
                            activeOpacity={0.85}
                          >
                            <Ionicons
                              name={inCart ? 'checkmark-circle' : 'cart-outline'}
                              size={13}
                              color={inCart ? '#00875A' : '#1E3A8A'}
                            />
                            <Text style={[styles.webAddToCartText, inCart && styles.webAddToCartTextActive]}>
                              {inCart ? 'In Cart' : 'Add to Cart'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.bookNowBtn}
                            onPress={() => handleBookCentre(lab, activeTest)}
                            activeOpacity={0.88}
                          >
                            <Text style={styles.bookNowBtnText}>Book Now</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
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

      {/* Floating Bottom Cart Bar (Web) */}
      {radiologyCartCount > 0 && (
        <View style={styles.webFloatingCartBar}>
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartIconCircle}>
              <Ionicons name="radio" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.floatingCartTitle}>
                {radiologyCartCount} Radiology Scan{radiologyCartCount > 1 ? 's' : ''} in Cart
              </Text>
              <Text style={styles.floatingCartSubtitle}>
                Total: ₹{radiologyFinalTotal.toLocaleString('en-IN')} • Verified Radiologist Reports
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.floatingCartBtn}
            onPress={() => {
              const firstItem = radiologyCart[0];
              navigation.navigate('RadiologyBooking', {
                selectedTests: radiologyCart,
                lab: firstItem?.labId ? {
                  id: firstItem.labId,
                  name: firstItem.labName || 'Diagnostic Center',
                  area: firstItem.labArea || 'Mysore',
                  address: firstItem.labAddress || '',
                  phone: firstItem.labPhone || '',
                } : null,
              });
            }}
            activeOpacity={0.88}
          >
            <Ionicons name="calendar-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.floatingCartBtnText}>
              Book Scans ({radiologyCartCount}) • Fill Details
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
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
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
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
  headerCartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
    backgroundColor: '#E6FAF5',
    borderWidth: 1,
    borderColor: '#00B894',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  headerCartPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00875A',
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
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  pricePresetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  pricePresetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pricePresetChipActive: {
    backgroundColor: '#E6FAF5',
    borderColor: '#00B894',
  },
  pricePresetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  pricePresetChipTextActive: {
    color: '#00B894',
    fontWeight: '800',
  },
  activePriceBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  activePriceBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00B894',
  },
  clearFilterLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
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
  webFilterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  webFilterTab: {
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  webFilterTabActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  webFilterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  webFilterTabTextActive: {
    color: '#FFFFFF',
  },

  // Empty State Box
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 12,
  },
  emptyStateDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 420,
  },
  emptyResetBtn: {
    marginTop: 16,
    backgroundColor: '#00B894',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  emptyResetBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
    alignItems: 'flex-start',
    gap: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  thumbWrapper: {
    position: 'relative',
    width: 125,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
  },
  centreThumbImg: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  accreditTagOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(30, 58, 138, 0.88)',
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  accreditTagOverlayText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  labBadgeOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#FF7F50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labBadgeOverlayText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  centreMetaCol: {
    flex: 1,
  },
  centreNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  cardioCountBadge: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  cardioCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  totalTestsBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  totalTestsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
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
    color: '#CBD5E1',
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
  turnaroundText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  modalitiesFeedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginVertical: 4,
  },
  modalityPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  modalityPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  modalityMorePill: {
    backgroundColor: '#F1F5F9',
  },
  modalityMorePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00B894',
  },
  labOfferBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E6FAF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 5,
    marginVertical: 4,
    alignSelf: 'flex-start',
  },
  labOfferBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00875A',
  },
  slotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
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

  // PRICE ACTION COLUMN
  priceActionCol: {
    alignItems: 'flex-end',
    minWidth: 175,
    maxWidth: 200,
    gap: 8,
  },
  fromPriceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centrePrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  activeTestPriceLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00875A',
    marginTop: 2,
    textAlign: 'right',
  },
  mrpText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountBadgeWrap: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  discountBadgeWrapText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  viewTestsPrimaryBtn: {
    backgroundColor: '#00C2CB', // MediUnify Cyan
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8.5,
    borderRadius: 8,
    width: '100%',
    shadowColor: '#00C2CB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewTestsPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    justifyContent: 'space-between',
  },
  webAddToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 6.5,
    borderRadius: 7,
  },
  webAddToCartBtnActive: {
    borderColor: '#00875A',
    backgroundColor: '#E6FAF5',
  },
  webAddToCartText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  webAddToCartTextActive: {
    color: '#00875A',
  },
  bookNowBtn: {
    flex: 1,
    backgroundColor: '#00B894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6.5,
    borderRadius: 7,
  },
  bookNowBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // QUICK TEST MINI PILLS (MATCHING MOBILE LAB DETAILS TEST LIST)
  quickTestsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 2,
  },
  testMiniPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  testMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
  },
  testMiniPillActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  testMiniPillName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  testMiniPillNameActive: {
    color: '#BE123C',
    fontWeight: '800',
  },
  testMiniPillPrice: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#00B894',
  },
  testMiniPillPriceActive: {
    color: '#E11D48',
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
  webFloatingCartBar: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: [{ translateX: -320 }],
    width: 640,
    maxWidth: '90%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 9999,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  floatingCartIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingCartSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  floatingCartBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  floatingCartBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default ImagingScreenWeb;
