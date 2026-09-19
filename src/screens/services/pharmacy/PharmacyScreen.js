import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Linking,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { useCart } from '../../../context/CartContext';
import pharmacyProducts, { POPULAR_LOCALITIES, calculateDistanceKm } from '../../../data/pharmacyProducts';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { showAlert } from '../../../utils/alert';

// ==================================================
// 1. HERO ADS SLIDES (Exact Web Standard)
// ==================================================
const PHARMACY_HERO_SLIDES = [
  {
    id: 'pharma-slide-1',
    pillText: '60-MIN EXPRESS',
    pillBg: '#FFEDD5',
    pillColor: '#EA580C',
    certText: 'Flat 20% OFF',
    certIcon: 'flash',
    title: 'Doorstep Medicines & Jan Aushadhi Store',
    priceText: 'Flat 20% OFF',
    priceSub: 'Use Code: MEDI20',
    priceColor: '#EA580C',
    subTitle: '100% Genuine branded drugs & affordable Jan Aushadhi generic medicines delivered in 60 mins.',
    bullets: [
      'Superfast 60-min delivery to your doorstep across Mysuru',
      'Order effortlessly by uploading your doctor prescription',
      'Temperature-controlled cold-chain transit for insulin & vaccines',
    ],
    ctaText: 'Order Medicines Now',
    ctaBg: '#EA580C',
    bgColor: '#FFF7ED',
    borderColor: '#FED7AA',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900',
    trustBadge: '100% Genuine Branded Drugs',
    actionType: 'scroll-to-products',
  },
  {
    id: 'pharma-slide-2',
    pillText: 'RX VERIFICATION',
    pillBg: '#CCFBF1',
    pillColor: '#FF5252',
    certText: 'Verified Pharmacists',
    certIcon: 'shield-checkmark',
    title: 'Upload Doctor Prescription for Instant Order',
    priceText: 'Zero Extra Fee',
    priceSub: 'Free Dosage Review',
    priceColor: '#00A389',
    subTitle: 'Just upload your prescription. Our licensed registered pharmacist will verify and confirm your order within minutes.',
    bullets: [
      'Automatic prescription reading & digital medicine mapping',
      'Licensed pharmacist calls to confirm exact brand & dosage',
      'Easy refills for monthly chronic diabetes & BP medications',
    ],
    ctaText: 'Upload Prescription Now',
    ctaBg: '#00A389',
    bgColor: '#FFF5F5',
    borderColor: '#CCFBF1',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900',
    trustBadge: 'Licensed & Registered Pharmacists',
    actionType: 'upload',
  },
  {
    id: 'pharma-slide-3',
    pillText: 'CHRONIC CARE',
    pillBg: '#DBEAFE',
    pillColor: '#1D4ED8',
    certText: 'Up to 35% OFF',
    certIcon: 'pulse',
    title: 'Diabetes, BP & Vital Healthcare Devices',
    priceText: 'Save up to 35%',
    priceSub: 'Certified Devices',
    priceColor: '#2563EB',
    subTitle: 'Accu-Chek glucometers, Omron blood pressure monitors, digital thermometers & test strips with full warranty.',
    bullets: [
      'Clinical-grade precision certified by ISO & CE standards',
      'Instant slot delivery with doorstep demo & calibration',
      'Discounted combo strips & lancet refill packs',
    ],
    ctaText: 'Explore Health Devices',
    ctaBg: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=900',
    trustBadge: 'Certified Clinical Accuracy',
    actionType: 'filter-devices',
  },
];

// ==================================================
// 2. HEALTHCARE CATEGORIES
// ==================================================
// 2. BROWSE HEALTH CONDITIONS (Creative Rich Mockup)
// ==================================================
export const BROWSE_HEALTH_CONDITIONS = [
  {
    id: 'skin-care',
    titlePrimary: 'SKIN',
    titleSecondary: 'CARE',
    badge: 'DERMA APPROVED',
    tagline: 'Glow & Hydration',
    bg: '#7B9ECC',
    accentColor: '#4F46E5',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
    filterKeywords: ['skin', 'derma', 'acne', 'glow', 'face', 'cream', 'lotion', 'sunscreen', 'cleanse', 'serum', 'facewash', 'derma'],
    categoryFilter: 'Skin Care',
  },
  {
    id: 'sexual-wellness',
    titlePrimary: 'SEXUAL',
    titleSecondary: 'WELLNESS',
    badge: '100% DISCREET',
    tagline: 'Safe & Stamina',
    bg: '#6DBFA0',
    accentColor: '#FF5252',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    filterKeywords: ['wellness', 'condom', 'test', 'fertility', 'care', 'stamina', 'energy', 'supplement', 'vigor', 'multivitamin'],
    categoryFilter: 'Sexual Wellness',
  },
  {
    id: 'weight-management',
    titlePrimary: 'WEIGHT',
    titleSecondary: 'MANAGEMENT',
    badge: 'ACTIVE DIET',
    tagline: 'Slim & Fiber',
    bg: '#9BC862',
    accentColor: '#65A30D',
    image: 'https://images.unsplash.com/photo-1576097449798-7c7f90e1248a?w=600&auto=format&fit=crop&q=80',
    filterKeywords: ['weight', 'slim', 'apple', 'green tea', 'fiber', 'detox', 'burn', 'protein', 'nutrition', 'diet'],
    categoryFilter: 'Weight Care',
  },
  {
    id: 'pain-relief',
    titlePrimary: 'PAIN',
    titleSecondary: 'RELIEF',
    badge: 'FAST ACTING',
    tagline: 'Joint & Muscle',
    bg: '#9688BD',
    accentColor: '#7C3AED',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
    filterKeywords: ['pain', 'volini', 'spray', 'dolo', 'paracetamol', 'sprain', 'ache', 'joint', 'moov', 'relief', 'balm', 'gel', 'fast'],
    categoryFilter: 'Pain Relief',
  },
];

// ==================================================
// 3. BROWSE CATEGORIES (Creative Rich Mockup)
// ==================================================
export const BROWSE_CATEGORIES = [
  {
    id: 'baby-care',
    titlePrimary: 'BABY',
    titleSecondary: 'CARE',
    badge: 'PEDIATRIC SAFE',
    tagline: 'Gentle Baby Care',
    bg: '#869DC2',
    accentColor: '#2563EB',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80',
    categoryFilter: 'Baby Care',
  },
  {
    id: 'fitness-wellness',
    titlePrimary: 'FITNESS &',
    titleSecondary: 'WELLNESS',
    badge: 'ENERGY & POWER',
    tagline: 'Proteins & Nutrition',
    bg: '#5EB895',
    accentColor: '#FF5252',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    categoryFilter: 'Vitamins & Minerals',
  },
  {
    id: 'family-care',
    titlePrimary: 'FAMILY',
    titleSecondary: 'CARE',
    badge: 'DAILY ESSENTIALS',
    tagline: 'Family Immunity',
    bg: '#7B98BC',
    accentColor: '#0284C7',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
    categoryFilter: 'all',
  },
  {
    id: 'alternate-medicines',
    titlePrimary: 'ALTERNATE',
    titleSecondary: 'MEDICINES',
    badge: '100% HERBAL',
    tagline: 'Ayurveda & Herbals',
    bg: '#9480AD',
    accentColor: '#6B21A8',
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&auto=format&fit=crop&q=80',
    categoryFilter: 'Ayurvedic',
  },
];


// ==================================================
// 3. 4 FEATURED ACTION CARDS
// ==================================================
const ACTION_CARDS = [
  {
    id: 'discount-upload',
    title: 'Get 20%* off on\nMedicines',
    ctaText: 'UPLOAD PRESCRIPTION',
    iconName: 'document-text-outline',
    iconType: 'ionicons',
    bgColor: '#EDFAF5',
    borderColor: '#BBF7D0',
    iconBg: '#DCFCE7',
    iconColor: '#FF5252',
    ctaColor: '#FF5252',
    actionType: 'upload',
  },
  {
    id: 'doctor-appointment',
    title: 'Consult Doctor\nOnline',
    ctaText: 'BOOK VIDEO SLOT',
    iconName: 'videocam-outline',
    iconType: 'ionicons',
    bgColor: '#F5EFFF',
    borderColor: '#E9D5FF',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    ctaColor: '#7C3AED',
    actionType: 'navigate',
    route: 'VideoConsultation',
  },
  {
    id: 'lab-tests',
    title: 'Diagnostic Lab Tests\nat Home',
    ctaText: 'BOOK CHECKUP',
    iconName: 'flask-outline',
    iconType: 'ionicons',
    bgColor: '#FFF0F3',
    borderColor: '#FECDD3',
    iconBg: '#FFE4E6',
    iconColor: '#E11D48',
    ctaColor: '#E11D48',
    actionType: 'navigate',
    route: 'LabTests',
  },
  {
    id: 'health-insurance',
    title: 'Health Insurance\n& Mediclaim',
    ctaText: '100% CASHLESS',
    iconName: 'shield-checkmark-outline',
    iconType: 'ionicons',
    bgColor: '#FFF6E9',
    borderColor: '#FED7AA',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    ctaColor: '#D97706',
    badge: 'New',
    actionType: 'navigate',
    route: 'HealthInsurance',
  },
];

// ==================================================
// 4. BROWSE BY HEALTH CONDITIONS
// ==================================================
const HEALTH_CONDITIONS = [
  {
    id: 'diabetes',
    name: 'Diabetes Care',
    iconName: 'water-outline',
    color: '#0284C7',
    bg: '#E0F2FE',
    filterKeywords: ['glucose', 'sugar', 'diabet', 'accu-chek', 'metformin', 'strip'],
  },
  {
    id: 'cardiac',
    name: 'Cardiac Care',
    iconName: 'heart-pulse',
    color: '#DC2626',
    bg: '#FEE2E2',
    filterKeywords: ['bp', 'blood pressure', 'omron', 'cardiac', 'heart', 'cholesterol'],
  },
  {
    id: 'stomach',
    name: 'Stomach Care',
    iconName: 'medkit-outline',
    color: '#D97706',
    bg: '#FEF3C7',
    filterKeywords: ['antacid', 'digestion', 'stomach', 'pantocid', 'gelusil', 'gas', 'acid'],
  },
  {
    id: 'pain-relief',
    name: 'Pain Relief',
    iconName: 'flash-outline',
    color: '#7C3AED',
    bg: '#EDE9FE',
    filterKeywords: ['pain', 'volini', 'spray', 'dolo', 'paracetamol', 'sprain', 'ache', 'joint', 'moov'],
  },
  {
    id: 'liver',
    name: 'Liver Care',
    iconName: 'leaf-outline',
    color: '#FF5252',
    bg: '#DCFCE7',
    filterKeywords: ['liv.52', 'liver', 'himalaya', 'detox', 'herbal', 'appetite'],
  },
  {
    id: 'oral',
    name: 'Oral Care',
    iconName: 'sparkles-outline',
    color: '#00C2CB',
    bg: '#E0F7FA',
    filterKeywords: ['tooth', 'oral', 'cleanser', 'mouth', 'dental', 'paste', 'gum', 'sensodyne'],
  },
  {
    id: 'cold-immunity',
    name: 'Cold & Immunity',
    iconName: 'shield-checkmark-outline',
    color: '#FF5252',
    bg: '#E6FAF5',
    filterKeywords: ['vitamin c', 'zinc', 'immunity', 'antiseptic', 'dettol', 'sanitizer', 'fever'],
  },
];

// ==================================================
// 5. EXTENDED PRODUCTS LIST
// ==================================================
const EXTENDED_PRODUCTS = [
  ...pharmacyProducts,
  {
    id: 'ext-1',
    name: 'Gelusil MPS Antacid Liquid (Mint 200ml)',
    brand: 'Pfizer India',
    category: 'Stomach Care',
    price: 110,
    mrp: 140,
    discount: '21% OFF',
    rating: 4.8,
    reviewsCount: 1650,
    requiresPrescription: false,
    inStock: true,
    packSize: 'Bottle of 200ml',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
  },
  {
    id: 'ext-2',
    name: 'Sensodyne Rapid Relief Toothpaste 80g',
    brand: 'GSK Consumer',
    category: 'Oral Care',
    price: 195,
    mrp: 230,
    discount: '15% OFF',
    rating: 4.9,
    reviewsCount: 3200,
    requiresPrescription: false,
    inStock: true,
    packSize: '80g Tube',
    image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400',
  },
  {
    id: 'ext-3',
    name: 'Moov Fast Pain Relief Ointment 50g',
    brand: 'Reckitt Benckiser',
    category: 'Pain Relief',
    price: 145,
    mrp: 175,
    discount: '17% OFF',
    rating: 4.7,
    reviewsCount: 2100,
    requiresPrescription: false,
    inStock: true,
    packSize: '50g Tube',
    image: 'https://images.unsplash.com/photo-1550572017-ed24058d844c?w=400',
  },
  {
    id: 'ext-4',
    name: 'Accu-Chek Active 50 Test Strips',
    brand: 'Roche Diagnostics',
    category: 'Healthcare Devices',
    price: 849,
    mrp: 1050,
    discount: '19% OFF',
    rating: 4.8,
    reviewsCount: 4500,
    requiresPrescription: false,
    inStock: true,
    packSize: 'Pack of 50 Test Strips',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400',
  },
  {
    id: 'ext-5',
    name: 'Vicks VapoRub Balm 50ml (Relief from Cold)',
    brand: 'Procter & Gamble',
    category: 'Medicines',
    price: 135,
    mrp: 160,
    discount: '16% OFF',
    rating: 4.9,
    reviewsCount: 5200,
    requiresPrescription: false,
    inStock: true,
    packSize: '50ml Jar',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  },
];

const getProductImage = (prod) => {
  if (prod.image) return prod.image;
  if (prod.category === 'Healthcare Devices') return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400';
  if (prod.category === 'Baby Care') return 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400';
  if (prod.category === 'Skin Care') return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400';
  if (prod.category === 'Ayurvedic') return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400';
  return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400';
};

const PharmacyScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const {
    pharmacyCart,
    pharmacyCartCount,
    pharmacyFinalTotal,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    selectedAddress,
    updateAddress,
    setSelectedPharmacyStore,
  } = useCart();

  // Active Hero Slide Index
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Auto-scroll hero ads every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % PHARMACY_HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState(route?.params?.query || route?.params?.search || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [activeCatalogTab, setActiveCatalogTab] = useState('all'); // 'all', 'generic', 'devices', 'ayurveda'
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Delivery Locality
  const [selectedLocality, setSelectedLocality] = useState(POPULAR_LOCALITIES[0]);

  // Scroll ref & auto-scroll to catalog
  const mainScrollRef = useRef(null);
  const [catalogY, setCatalogY] = useState(0);

  const scrollToCatalog = () => {
    setTimeout(() => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const el = document.getElementById('pharmacy-catalog-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({
          y: Math.max(0, catalogY - 10),
          animated: true,
        });
      }
    }, 80);
  };

  // Filtered Products based on search, category, catalog tab, condition
  const filteredProducts = useMemo(() => {
    let list = EXTENDED_PRODUCTS;

    if (selectedCondition) {
      const cond =
        BROWSE_HEALTH_CONDITIONS.find((c) => c.id === selectedCondition) ||
        HEALTH_CONDITIONS.find((c) => c.id === selectedCondition);
      if (cond && cond.filterKeywords) {
        list = list.filter((p) => {
          const text = `${p.name} ${p.brand} ${p.category} ${p.uses || ''}`.toLowerCase();
          return cond.filterKeywords.some((kw) => text.includes(kw.toLowerCase()));
        });
      }
    } else if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (activeCatalogTab === 'generic') {
      list = list.filter((p) => p.isGeneric || p.brand?.toLowerCase().includes('jan aushadhi') || p.category?.toLowerCase().includes('generic'));
    } else if (activeCatalogTab === 'devices') {
      list = list.filter((p) => p.category === 'Healthcare Devices');
    } else if (activeCatalogTab === 'ayurveda') {
      list = list.filter((p) => p.category === 'Ayurvedic');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [searchQuery, selectedCategory, selectedCondition, activeCatalogTab]);

  // Handle PDF or Image Upload
  const handlePickDocument = async (type = 'any') => {
    try {
      if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Needed', 'Camera permission is required.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!res.canceled && res.assets?.[0]) {
          setSelectedFile({
            name: res.assets[0].fileName || `Prescription_Photo_${Date.now()}.jpg`,
            uri: res.assets[0].uri,
            type: 'image',
          });
        }
        return;
      }

      if (type === 'image') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Needed', 'Gallery access is required.');
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (!res.canceled && res.assets?.[0]) {
          setSelectedFile({
            name: res.assets[0].fileName || `Prescription_${Date.now()}.jpg`,
            uri: res.assets[0].uri,
            type: 'image',
          });
        }
        return;
      }

      // Document / PDF
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,image/*,application/pdf';
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (file) {
            setSelectedFile({
              name: file.name,
              uri: URL.createObjectURL(file),
              type: file.type.includes('pdf') ? 'pdf' : 'image',
            });
          }
        };
        input.click();
      } else {
        const res = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/*'],
          copyToCacheDirectory: true,
        });
        if (!res.canceled && res.assets?.[0]) {
          const f = res.assets[0];
          setSelectedFile({
            name: f.name,
            uri: f.uri,
            type: f.mimeType?.includes('pdf') || f.name?.endsWith('.pdf') ? 'pdf' : 'image',
          });
        }
      }
    } catch (err) {
      console.log('Error picking upload:', err);
    }
  };

  const handleConfirmPrescription = () => {
    if (!selectedFile) {
      showAlert('Attach Prescription', 'Please select a PDF or photo of your prescription.');
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setShowUploadModal(false);
      showAlert(
        'Prescription Received! 📄',
        `Your prescription "${selectedFile.name}" has been uploaded. A verified pharmacist will confirm your medicine order shortly.`
      );
      setSelectedFile(null);
    }, 1000);
  };

  const activeSlide = PHARMACY_HERO_SLIDES[activeSlideIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER (MOBILE & TABLET VIEW) */}
      <View style={styles.mobileHeader}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#1E3A8A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerLocalityBtn}
          onPress={() => setShowLocationModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.headerLocalityIconWrap}>
            <Ionicons name="location" size={14} color="#FF5252" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerDeliverTo}>Deliver to</Text>
            <Text style={styles.headerLocalityName} numberOfLines={1}>
              {selectedLocality.name}, Mysuru
            </Text>
          </View>
          <Ionicons name="chevron-down" size={14} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCartBtn}
          onPress={() => navigation.navigate('Cart', { initialTab: 'pharmacy' })}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={22} color="#1E3A8A" />
          {pharmacyCartCount > 0 && (
            <View style={styles.headerCartBadge}>
              <Text style={styles.headerCartBadgeText}>
                {pharmacyCartCount > 99 ? '99+' : pharmacyCartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={mainScrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          pharmacyCartCount > 0 && { paddingBottom: 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            1. HERO SHOWCASE CAROUSEL BANNER
        ============================================================ */}
        <View style={styles.heroWrap}>
          <View
            style={[
              styles.heroBannerCard,
              { backgroundColor: activeSlide.bgColor, borderColor: activeSlide.borderColor },
              !isDesktop && styles.heroBannerCardMobile,
            ]}
          >
            {/* Left Content */}
            <View style={[styles.heroLeftCol, !isDesktop && styles.heroLeftColMobile]}>
              <View style={styles.heroBadgeRow}>
                <View style={[styles.pillBadge, { backgroundColor: activeSlide.pillBg }]}>
                  <Text style={[styles.pillBadgeText, { color: activeSlide.pillColor }]}>
                    {activeSlide.pillText}
                  </Text>
                </View>
                <View style={styles.discountTag}>
                  <Ionicons name={activeSlide.certIcon} size={12} color="#FF5252" />
                  <Text style={styles.discountTagText}>{activeSlide.certText}</Text>
                </View>
              </View>

              <Text style={[styles.heroTitle, !isDesktop && styles.heroTitleMobile]}>
                {activeSlide.title}
              </Text>

              <Text style={styles.heroPriceHighlight} numberOfLines={1}>
                {activeSlide.priceText} <Text style={{ color: '#64748B', fontSize: 12 }}>• {activeSlide.priceSub}</Text>
              </Text>

              <Text style={styles.heroSubTitle} numberOfLines={2}>
                {activeSlide.subTitle}
              </Text>

              {/* Bullets (Shown on tablet and desktop) */}
              {isTablet || isDesktop ? (
                <View style={styles.heroBulletsBox}>
                  {activeSlide.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={styles.heroBulletRow}>
                      <Ionicons name="checkmark-circle" size={14} color="#FF5252" />
                      <Text style={styles.heroBulletText} numberOfLines={1}>
                        {b}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.heroCtaRow}>
                <TouchableOpacity
                  style={[styles.heroPrimaryBtn, { backgroundColor: activeSlide.ctaBg }]}
                  onPress={() => {
                    if (activeSlide.actionType === 'upload') {
                      setShowUploadModal(true);
                    } else if (activeSlide.actionType === 'filter-devices') {
                      setActiveCatalogTab('devices');
                    } else {
                      setActiveCatalogTab('all');
                    }
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.heroPrimaryBtnText}>{activeSlide.ctaText}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.heroSecondaryBtn}
                  onPress={() => setShowUploadModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="document-text-outline" size={14} color="#FF5252" />
                  <Text style={styles.heroSecondaryBtnText}>Upload Rx</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Graphic/Image (Desktop / Tablet) */}
            {isDesktop || isTablet ? (
              <View style={styles.heroRightCol}>
                <Image source={{ uri: activeSlide.image }} style={styles.heroImage} resizeMode="cover" />
                <View style={styles.heroTrustPill}>
                  <Ionicons name="shield-checkmark" size={12} color="#FF5252" />
                  <Text style={styles.heroTrustPillText}>{activeSlide.trustBadge}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {PHARMACY_HERO_SLIDES.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActiveSlideIndex(idx)}
                style={[styles.dot, activeSlideIndex === idx && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* ============================================================
            2. SEARCH BAR WITH FAST PRESCRIPTION SCANNER
        ============================================================ */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search 50,000+ medicines, vitamins, brands..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 6 }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.searchCameraBtn}
              onPress={() => setShowUploadModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={18} color="#FF5252" />
              <Text style={styles.searchCameraText}>Scan Rx</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================
            3. 4 FEATURED ACTION TILES
        ============================================================ */}
        <View style={styles.actionCardsWrap}>
          <View style={styles.actionCardsGrid}>
            {ACTION_CARDS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.actionCard, { backgroundColor: item.bgColor, borderColor: item.borderColor }]}
                onPress={() => {
                  if (item.actionType === 'upload') {
                    setShowUploadModal(true);
                  } else if (item.route) {
                    navigation.navigate(item.route);
                  }
                }}
                activeOpacity={0.88}
              >
                <View style={[styles.actionCardIconWrap, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.iconName} size={20} color={item.iconColor} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.actionCardTitle}>{item.title}</Text>
                  <Text style={[styles.actionCardCta, { color: item.ctaColor }]}>
                    {item.ctaText} →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ============================================================
            BROWSE MEDICINES & HEALTH PRODUCTS (Creative Mockup Layout)
        ============================================================ */}
        <View style={styles.mobileBrowseSection}>
          <View style={styles.mobileBrowseHeaderRow}>
            <Text style={styles.mobileBrowseMainHeading}>Browse medicines & health products</Text>
            <View style={styles.mobileBrowseHeaderBadge}>
              <Ionicons name="sparkles" size={11} color="#FF5252" />
              <Text style={styles.mobileBrowseHeaderBadgeText}>100% Genuine</Text>
            </View>
          </View>

          {/* SUBSECTION 1: HEALTH CONDITION */}
          <View style={styles.mobileBrowseSubSection}>
            <View style={styles.subSectionHeaderRow}>
              <Text style={styles.mobileBrowseSubHeading}>Health condition</Text>
              {selectedCondition && (
                <TouchableOpacity onPress={() => setSelectedCondition(null)}>
                  <Text style={styles.clearFilterLink}>Clear Filter</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileBrowseScroll}
            >
              {BROWSE_HEALTH_CONDITIONS.map((item) => {
                const isSelected = selectedCondition === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.mobileBrowseCard,
                      { backgroundColor: item.bg },
                      isSelected && styles.mobileBrowseCardActive,
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedCondition(null);
                      } else {
                        setSelectedCategory('all');
                        setSelectedCondition(item.id);
                        scrollToCatalog();
                      }
                    }}
                    activeOpacity={0.88}
                  >
                    <View style={styles.mobileMicroPill}>
                      <Text style={styles.mobileMicroPillText}>{item.badge}</Text>
                    </View>
                    <View style={styles.mobileBannerTextCol}>
                      <Text style={styles.mobileBannerTitlePrimary}>{item.titlePrimary}</Text>
                      <Text style={styles.mobileBannerTitleSecondary}>{item.titleSecondary}</Text>
                      <Text style={styles.mobileBannerTagline} numberOfLines={1}>{item.tagline}</Text>
                    </View>
                    <View style={styles.mobileBannerImageContainer}>
                      <View style={styles.mobileImageBackdrop} />
                      <Image
                        source={{ uri: item.image }}
                        style={styles.mobileBannerImage}
                        resizeMode="cover"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* SUBSECTION 2: CATEGORIES */}
          <View style={styles.mobileBrowseSubSection}>
            <View style={styles.subSectionHeaderRow}>
              <Text style={styles.mobileBrowseSubHeading}>Categories</Text>
              {selectedCategory !== 'all' && !selectedCondition && (
                <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                  <Text style={styles.clearFilterLink}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileBrowseScroll}
            >
              {BROWSE_CATEGORIES.map((item) => {
                const isSelected = selectedCategory === item.categoryFilter && !selectedCondition;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.mobileBrowseCard,
                      { backgroundColor: item.bg },
                      isSelected && styles.mobileBrowseCardActive,
                    ]}
                    onPress={() => {
                      setSelectedCondition(null);
                      setSelectedCategory(item.categoryFilter);
                      scrollToCatalog();
                    }}
                    activeOpacity={0.88}
                  >
                    <View style={styles.mobileMicroPill}>
                      <Text style={styles.mobileMicroPillText}>{item.badge}</Text>
                    </View>
                    <View style={styles.mobileBannerTextCol}>
                      <Text style={styles.mobileBannerTitlePrimary}>{item.titlePrimary}</Text>
                      <Text style={styles.mobileBannerTitleSecondary}>{item.titleSecondary}</Text>
                      <Text style={styles.mobileBannerTagline} numberOfLines={1}>{item.tagline}</Text>
                    </View>
                    <View style={styles.mobileBannerImageContainer}>
                      <View style={styles.mobileImageBackdrop} />
                      <Image
                        source={{ uri: item.image }}
                        style={styles.mobileBannerImage}
                        resizeMode="cover"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* ============================================================
            6. PRODUCTS CATALOG WITH FILTER TABS
        ============================================================ */}
        <View
          style={styles.catalogSection}
          nativeID="pharmacy-catalog-section"
          {...(Platform.OS === 'web' ? { id: 'pharmacy-catalog-section' } : {})}
          onLayout={(event) => {
            const layout = event.nativeEvent.layout;
            if (layout && layout.y) {
              setCatalogY(layout.y);
            }
          }}
        >
          <View style={styles.catalogHeaderRow}>
            <Text style={styles.sectionTitle}>Medicines & Health Products</Text>
            <Text style={styles.catalogItemCount}>{filteredProducts.length} items</Text>
          </View>

          {/* Catalog Filter Tabs */}
          <View style={styles.catalogTabsRow}>
            {[
              { key: 'all', label: 'All Medicines' },
              { key: 'generic', label: 'Jan Aushadhi' },
              { key: 'devices', label: 'Health Devices' },
              { key: 'ayurveda', label: 'Ayurvedic' },
            ].map((tab) => {
              const isActive = activeCatalogTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.catalogTabBtn, isActive && styles.catalogTabBtnActive]}
                  onPress={() => {
                    setSelectedCondition(null);
                    setActiveCatalogTab(tab.key);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catalogTabBtnText, isActive && styles.catalogTabBtnTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Product Cards Grid */}
          <View style={[styles.productsGrid, width >= 600 && { maxWidth: 1100, width: '100%', alignSelf: 'center' }]}>
            {filteredProducts.map((prod) => {
              const inCartItem = pharmacyCart?.find((ci) => ci.id === prod.id);
              const qty = inCartItem?.quantity || 0;

              return (
                <View
                  key={prod.id}
                  style={[
                    styles.productCard,
                    width >= 960 ? { width: '23.5%' } : (width >= 640 ? { width: '31.8%' } : null),
                  ]}
                >
                  {/* Discount Pill */}
                  {prod.discount && (
                    <View style={styles.productDiscountBadge}>
                      <Text style={styles.productDiscountText}>{prod.discount}</Text>
                    </View>
                  )}

                  {/* Image */}
                  <TouchableOpacity
                    style={styles.productImageWrap}
                    onPress={() => navigation.navigate('ProductDetails', { product: prod, productId: prod.id })}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: getProductImage(prod) }}
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>

                  {/* Details */}
                  <View style={styles.productInfo}>
                    <Text style={styles.productBrand} numberOfLines={1}>
                      {prod.brand || 'Unnathi Pharmacy'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ProductDetails', { product: prod, productId: prod.id })}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.productName} numberOfLines={2}>
                        {prod.name}
                      </Text>
                    </TouchableOpacity>

                    {prod.packSize && (
                      <Text style={styles.productPack} numberOfLines={1}>
                        {prod.packSize}
                      </Text>
                    )}

                    {/* Rating */}
                    <View style={styles.productRatingRow}>
                      <Ionicons name="star" size={11} color="#F59E0B" />
                      <Text style={styles.productRatingText}>{prod.rating || 4.8}</Text>
                      <Text style={styles.productReviewsText}>({prod.reviewsCount || 420}+)</Text>
                    </View>

                    {/* Price & Add to Cart */}
                    <View style={styles.productBottomRow}>
                      <View>
                        <Text style={styles.productPrice}>₹{prod.price}</Text>
                        {Boolean(prod.mrp) && <Text style={styles.productMrp}>MRP ₹{prod.mrp}</Text>}
                      </View>

                      {qty > 0 ? (
                        <View style={styles.stepperWrap}>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => decreaseQuantity(prod.id, 'pharmacy')}
                          >
                            <Ionicons name="remove" size={13} color="#FF5252" />
                          </TouchableOpacity>
                          <Text style={styles.stepperQty}>{qty}</Text>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => increaseQuantity(prod.id, 'pharmacy')}
                          >
                            <Ionicons name="add" size={13} color="#FF5252" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addToCartBtn}
                          onPress={() => addToCart(prod, 1, 'pharmacy')}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="add" size={14} color="#FFFFFF" />
                          <Text style={styles.addToCartBtnText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ============================================================
          8. FLOATING BOTTOM CART BAR (MOBILE ONLY)
      ============================================================ */}
      {pharmacyCartCount > 0 && (
        <View style={styles.floatingCartBar}>
          <View style={styles.cartBarInfo}>
            <View style={styles.cartBarBadge}>
              <Text style={styles.cartBarBadgeText}>{pharmacyCartCount}</Text>
            </View>
            <View>
              <Text style={styles.cartBarItems}>
                {pharmacyCartCount} {pharmacyCartCount === 1 ? 'item' : 'items'} in cart
              </Text>
              <Text style={styles.cartBarTotal}>Total: ₹{pharmacyFinalTotal}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.cartBarButton}
            onPress={() => navigation.navigate('Cart', { initialTab: 'pharmacy' })}
            activeOpacity={0.88}
          >
            <Text style={styles.cartBarButtonText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ============================================================
          9. PRESCRIPTION UPLOAD MODAL (PDF / IMAGE / CAMERA)
      ============================================================ */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDesktop && { maxWidth: 480 }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <View style={styles.modalTrustBadge}>
                  <Ionicons name="shield-checkmark" size={11} color="#FF5252" />
                  <Text style={styles.modalTrustBadgeText}>LICENSED PHARMACISTS</Text>
                </View>
                <Text style={styles.modalTitle}>Upload Prescription</Text>
                <Text style={styles.modalSub}>Order verified medicines in 3 easy steps</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUploadModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              {!selectedFile ? (
                <View style={styles.uploadOptionsBox}>
                  <View style={styles.uploadOptionsRow}>
                    <TouchableOpacity
                      style={styles.uploadOptionCard}
                      onPress={() => handlePickDocument('pdf')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="document-text" size={24} color="#DC2626" />
                      <Text style={styles.uploadOptionTitle}>Upload PDF</Text>
                      <Text style={styles.uploadOptionSub}>E-Prescription / Report</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.uploadOptionCard}
                      onPress={() => handlePickDocument('image')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="image" size={24} color="#FF5252" />
                      <Text style={styles.uploadOptionTitle}>Gallery Image</Text>
                      <Text style={styles.uploadOptionSub}>From Photo Library</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.uploadOptionCard}
                      onPress={() => handlePickDocument('camera')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="camera" size={24} color="#2563EB" />
                      <Text style={styles.uploadOptionTitle}>Camera</Text>
                      <Text style={styles.uploadOptionSub}>Snap Rx Paper</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.uploadNotice}>
                    Supports PDF, JPG, PNG up to 15MB. Your prescription is encrypted and reviewed only by licensed pharmacists.
                  </Text>
                </View>
              ) : (
                <View style={styles.attachedFileCard}>
                  <View style={styles.attachedFileIconWrap}>
                    {selectedFile.type === 'pdf' ? (
                      <Ionicons name="document-text" size={26} color="#DC2626" />
                    ) : (
                      <Image source={{ uri: selectedFile.uri }} style={styles.attachedThumb} />
                    )}
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={styles.attachedFileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.attachedFileStatus}>✓ Ready for Pharmacist Verification</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedFile(null)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Verified Points */}
              <View style={styles.verifiedPointsBox}>
                <View style={styles.verifiedPointItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#FF5252" />
                  <Text style={styles.verifiedPointText}>Free dosage & drug interaction check</Text>
                </View>
                <View style={styles.verifiedPointItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#FF5252" />
                  <Text style={styles.verifiedPointText}>Up to 20% discount on branded medicines</Text>
                </View>
                <View style={styles.verifiedPointItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#FF5252" />
                  <Text style={styles.verifiedPointText}>Pharmacist calls to confirm exact brand</Text>
                </View>
              </View>
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmUploadBtn, isUploading && { opacity: 0.6 }]}
                onPress={handleConfirmPrescription}
                activeOpacity={0.88}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmUploadBtnText}>Submit Prescription</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================
          10. LOCATION SELECTOR MODAL
      ============================================================ */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDesktop && { maxWidth: 450 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Delivery Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16, maxHeight: 380 }}>
              <Text style={styles.locationSectionTitle}>Popular Mysuru Localities</Text>
              {POPULAR_LOCALITIES.map((loc) => {
                const isSelected = selectedLocality.name === loc.name;
                return (
                  <TouchableOpacity
                    key={loc.name}
                    style={[styles.localityRow, isSelected && styles.localityRowSelected]}
                    onPress={() => {
                      setSelectedLocality(loc);
                      setShowLocationModal(false);
                      showAlert('Location Selected', `Delivering medicines to ${loc.name}, Mysuru.`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="location"
                      size={18}
                      color={isSelected ? '#FF5252' : '#94A3B8'}
                    />
                    <Text
                      style={[styles.localityRowText, isSelected && styles.localityRowTextSelected]}
                    >
                      {loc.name}, Mysuru
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#FF5252" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // MOBILE HEADER
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLocalityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  headerLocalityIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDeliverTo: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  headerLocalityName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerCartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerCartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  headerCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // HERO SHOWCASE
  heroWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  heroBannerCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({

      web: { boxShadow: '0px 3px 16px rgba(0,0,0,0.05)' },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 3 },

        shadowOpacity: 0.05,

        shadowRadius: 8,

        elevation: 2,

      },

    }),
  },
  heroBannerCardMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  heroLeftCol: {
    flex: 1.2,
    padding: 20,
    justifyContent: 'center',
  },
  heroLeftColMobile: {
    padding: 16,
  },
  heroRightCol: {
    flex: 0.8,
    height: 220,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTrustPill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroTrustPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  discountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFBDBD',
  },
  discountTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF5252',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 24,
  },
  heroTitleMobile: {
    fontSize: 16,
    lineHeight: 22,
  },
  heroPriceHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
    marginTop: 4,
  },
  heroSubTitle: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 4,
    lineHeight: 16,
  },
  heroBulletsBox: {
    marginTop: 8,
    gap: 4,
  },
  heroBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBulletText: {
    fontSize: 11,
    color: '#334155',
  },
  heroCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  heroPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  heroSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FF5252',
  },

  // SEARCH SECTION
  searchWrap: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Platform.select({

      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 2 },

        shadowOpacity: 0.04,

        shadowRadius: 4,

        elevation: 1,

      },

    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    marginLeft: 8,
    paddingVertical: 0,
  },
  searchCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFBDBD',
  },
  searchCameraText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF5252',
  },

  // 4 ACTION CARDS
  actionCardsWrap: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  actionCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionCardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 15,
  },
  actionCardCta: {
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 3,
  },

  // SECTION HEADERS
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSeeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5252',
  },

  // CATEGORIES SCROLL
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  // BROWSE MEDICINES MOBILE
  mobileBrowseSection: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  mobileBrowseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mobileBrowseMainHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  mobileBrowseHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  mobileBrowseHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF5252',
  },
  mobileBrowseSubSection: {
    marginBottom: 16,
  },
  subSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mobileBrowseSubHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  clearFilterLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  mobileBrowseScroll: {
    gap: 12,
    paddingRight: 16,
  },
  mobileBrowseCard: {
    width: 230,
    height: 116,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 14,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({

      web: { boxShadow: '0px 2px 12px rgba(30,58,138,0.08)' },

      default: {

        shadowColor: '#1E3A8A',

        shadowOffset: { width: 0, height: 2 },

        shadowOpacity: 0.08,

        shadowRadius: 6,

        elevation: 2,

      },

    }),
  },
  mobileBrowseCardActive: {
    borderWidth: 2.5,
    borderColor: '#0F172A',
  },
  mobileMicroPill: {
    position: 'absolute',
    top: 8,
    left: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 4,
  },
  mobileMicroPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mobileBannerTextCol: {
    zIndex: 2,
    justifyContent: 'center',
    maxWidth: '54%',
    paddingTop: 14,
  },
  mobileBannerTitlePrimary: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  mobileBannerTitleSecondary: {
    fontSize: 9.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  mobileBannerTagline: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
    fontWeight: '600',
  },
  mobileBannerImageContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '52%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  mobileImageBackdrop: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  mobileBannerImage: {
    width: '100%',
    height: '100%',
  },

  // CATALOG SECTION
  catalogSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  catalogHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catalogItemCount: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  catalogTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  catalogTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catalogTabBtnActive: {
    backgroundColor: '#FF5252',
    borderColor: '#FF5252',
  },
  catalogTabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  catalogTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    position: 'relative',
    ...Platform.select({

      web: { boxShadow: '0px 1px 8px rgba(0,0,0,0.03)' },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 1 },

        shadowOpacity: 0.03,

        shadowRadius: 4,

        elevation: 1,

      },

    }),
  },
  productDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  productDiscountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  productImageWrap: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  productImage: {
    width: '85%',
    height: '85%',
  },
  productInfo: {
    marginTop: 4,
  },
  productBrand: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  productName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
    height: 32,
    lineHeight: 16,
    marginTop: 2,
  },
  productPack: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  productRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  productRatingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  productReviewsText: {
    fontSize: 9.5,
    color: '#94A3B8',
  },
  productBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  productMrp: {
    fontSize: 9.5,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FF5252',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addToCartBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFBDBD',
    borderRadius: 6,
  },
  stepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  stepperQty: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B91C1C',
    paddingHorizontal: 4,
  },

  // STORES SCROLL
  storesScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  storeCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  storeImage: {
    width: '100%',
    height: 90,
  },
  storeInfo: {
    padding: 10,
  },
  storeBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  storeVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storeVerifiedText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FF5252',
  },
  store24x7Tag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  store24x7Text: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#D97706',
  },
  storeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  storeLocality: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  storeDelivery: {
    fontSize: 10,
    color: '#FF5252',
    fontWeight: '600',
    marginTop: 2,
  },

  // FLOATING CART BAR
  floatingCartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({

      web: { boxShadow: '0px 4px 20px rgba(0,0,0,0.25)' },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.25,

        shadowRadius: 10,

        elevation: 8,

      },

    }),
  },
  cartBarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBarBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF5252',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBarBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  cartBarItems: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  cartBarTotal: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
  },
  cartBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF5252',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cartBarButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // MODAL OVERLAY & CARD
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    ...Platform.select({

      web: { boxShadow: '0px 6px 32px rgba(0,0,0,0.2)' },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 6 },

        shadowOpacity: 0.2,

        shadowRadius: 16,

        elevation: 8,

      },

    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  modalTrustBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF5252',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  uploadOptionsBox: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  uploadOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadOptionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  uploadOptionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  uploadOptionSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },
  uploadNotice: {
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 14,
  },
  attachedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFBDBD',
    borderRadius: 10,
    padding: 10,
  },
  attachedFileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachedThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
  },
  attachedFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  attachedFileStatus: {
    fontSize: 10.5,
    color: '#FF5252',
    fontWeight: '700',
    marginTop: 2,
  },
  verifiedPointsBox: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  verifiedPointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedPointText: {
    fontSize: 11,
    color: '#334155',
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  confirmUploadBtn: {
    backgroundColor: '#FF5252',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // LOCATION SELECTOR
  locationSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 8,
  },
  localityRowSelected: {
    backgroundColor: '#FFF0F0',
  },
  localityRowText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  localityRowTextSelected: {
    color: '#FF5252',
    fontWeight: '800',
  },
});

export default PharmacyScreen;