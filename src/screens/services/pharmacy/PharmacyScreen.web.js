import React, { useState, useMemo, useEffect } from 'react';
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
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import { useCart } from '../../../context/CartContext';
import pharmacyProducts from '../../../data/pharmacyProducts';
import pharmacyStores, { POPULAR_LOCALITIES } from '../../../data/pharmacyStores';
import WebFooter from '../../../components/web/WebFooter';

// ==================================================
// 1. HERO ADS SLIDES (Exact HomeScreen.web.js Standard)
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
    pillColor: '#0D9488',
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
    bgColor: '#F0FDF4',
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
// 2. HEALTHCARE CATEGORIES (Matching HomeScreen Cat Circles)
// ==================================================
// 2. BROWSE HEALTH CONDITIONS (Creative Rich Mockup)
// ==================================================
export const BROWSE_HEALTH_CONDITIONS = [
  {
    id: 'skin-care',
    titlePrimary: 'SKIN',
    titleSecondary: 'CARE',
    badge: 'DERMA APPROVED',
    tagline: 'Glow, Acne & Hydration',
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
    tagline: 'Safe, Vigor & Stamina',
    bg: '#6DBFA0',
    accentColor: '#0D9488',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    filterKeywords: ['wellness', 'condom', 'test', 'fertility', 'care', 'stamina', 'energy', 'supplement', 'vigor', 'multivitamin'],
    categoryFilter: 'Sexual Wellness',
  },
  {
    id: 'weight-management',
    titlePrimary: 'WEIGHT',
    titleSecondary: 'MANAGEMENT',
    badge: 'ACTIVE DIET',
    tagline: 'Slim, Detox & Fiber',
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
    tagline: 'Joint, Muscle & Sprain',
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
    tagline: 'Diapers, Gentle Wash & Nutrition',
    bg: '#869DC2',
    accentColor: '#2563EB',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80',
    categoryFilter: 'Baby Care',
  },
  {
    id: 'fitness-wellness',
    titlePrimary: 'FITNESS &',
    titleSecondary: 'WELLNESS',
    badge: 'POWER & IMMUNITY',
    tagline: 'Proteins, BCAA & Energy',
    bg: '#5EB895',
    accentColor: '#059669',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    categoryFilter: 'Vitamins & Minerals',
  },
  {
    id: 'family-care',
    titlePrimary: 'FAMILY',
    titleSecondary: 'CARE',
    badge: 'DAILY ESSENTIALS',
    tagline: 'Whole Family Immunity & First Aid',
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
    tagline: 'Ayurveda, Siddha & Homeopathy',
    bg: '#9480AD',
    accentColor: '#6B21A8',
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&auto=format&fit=crop&q=80',
    categoryFilter: 'Ayurvedic',
  },
];


// ==================================================
// 3. 4 FEATURED ACTION CARDS (Below Hero)
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
    iconColor: '#059669',
    ctaColor: '#059669',
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
    iconType: 'ionicons',
    color: '#0284C7',
    bg: '#E0F2FE',
    filterKeywords: ['glucose', 'sugar', 'diabet', 'accu-chek', 'metformin', 'strip'],
  },
  {
    id: 'cardiac',
    name: 'Cardiac Care',
    iconName: 'heart-pulse',
    iconType: 'mci',
    color: '#DC2626',
    bg: '#FEE2E2',
    filterKeywords: ['bp', 'blood pressure', 'omron', 'cardiac', 'heart', 'cholesterol'],
  },
  {
    id: 'stomach',
    name: 'Stomach Care',
    iconName: 'stomach',
    iconType: 'mci',
    color: '#D97706',
    bg: '#FEF3C7',
    filterKeywords: ['antacid', 'digestion', 'stomach', 'pantocid', 'gelusil', 'gas', 'acid'],
  },
  {
    id: 'pain-relief',
    name: 'Pain Relief',
    iconName: 'human-handsdown',
    iconType: 'mci',
    color: '#7C3AED',
    bg: '#EDE9FE',
    filterKeywords: ['pain', 'volini', 'spray', 'dolo', 'paracetamol', 'sprain', 'ache', 'joint', 'moov'],
  },
  {
    id: 'liver',
    name: 'Liver Care',
    iconName: 'pill',
    iconType: 'mci',
    color: '#059669',
    bg: '#DCFCE7',
    filterKeywords: ['liv.52', 'liver', 'himalaya', 'detox', 'herbal', 'appetite'],
  },
  {
    id: 'oral',
    name: 'Oral Care',
    iconName: 'tooth-outline',
    iconType: 'mci',
    color: '#00C2CB',
    bg: '#E0F7FA',
    filterKeywords: ['tooth', 'oral', 'cleanser', 'mouth', 'dental', 'paste', 'gum', 'sensodyne'],
  },
  {
    id: 'respiratory',
    name: 'Respiratory',
    iconName: 'lungs',
    iconType: 'mci',
    color: '#2563EB',
    bg: '#DBEAFE',
    filterKeywords: ['antibiotic', 'respiratory', 'cough', 'cold', 'chest', 'augmentin', 'inhaler', 'vicks'],
  },
  {
    id: 'cold-immunity',
    name: 'Cold & Immunity',
    iconName: 'shield-check-outline',
    iconType: 'mci',
    color: '#00B894',
    bg: '#E6FAF5',
    filterKeywords: ['vitamin c', 'zinc', 'immunity', 'antiseptic', 'dettol', 'sanitizer', 'fever'],
  },
];

// ==================================================
// 5. HIGH-RESOLUTION PRODUCT IMAGES DICTIONARY
// ==================================================
const PRODUCT_IMAGES = {
  '1': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', // Dolo Paracetamol
  '2': 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400', // Vitamin C Limcee
  '3': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400', // Multivitamin Becadexamin
  '4': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400', // Digital Thermometer
  '5': 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400', // Dettol Antiseptic
  '6': 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400', // Hand Sanitizer
  '7': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400', // First Aid Kit
  '8': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400', // Augmentin Antibiotic
  '9': 'https://images.unsplash.com/photo-1550572017-ed24058d844c?w=400', // Volini Spray
  '10': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400', // Accu-Chek Monitor
  '11': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', // CeraVe Cleanser
  '12': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400', // Pampers Diapers
  '13': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', // Himalaya Liv.52
  '14': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400', // Omron BP Monitor
  '15': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400', // Glucose Monitor
  '16': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400', // Glucose Monitor
  'ext-1': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400', // Gelusil Antacid
  'ext-2': 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400', // Sensodyne
  'ext-3': 'https://images.unsplash.com/photo-1550572017-ed24058d844c?w=400', // Moov Ointment
  'ext-4': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400', // Accu-Chek Strips
  'ext-5': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', // Vicks VapoRub
};

const getProductImage = (prod) => {
  if (prod.image) return prod.image;
  if (PRODUCT_IMAGES[prod.id]) return PRODUCT_IMAGES[prod.id];
  if (prod.category === 'Healthcare Devices') return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400';
  if (prod.category === 'Baby Care') return 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400';
  if (prod.category === 'Skin Care') return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400';
  if (prod.category === 'Ayurvedic') return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400';
  if (prod.category === 'First Aid') return 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400';
  if (prod.category === 'Pain Relief') return 'https://images.unsplash.com/photo-1550572017-ed24058d844c?w=400';
  return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400';
};

// ==================================================
// 6. EXTENDED PRODUCTS LIST
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
    oldPrice: 140,
    discount: '21% OFF',
    rating: 4.8,
    reviewsCount: 1650,
    requiresPrescription: false,
    inStock: true,
    packSize: 'Bottle of 200ml',
    uses: 'Acidity, heartburn, gas and stomach discomfort',
  },
  {
    id: 'ext-2',
    name: 'Sensodyne Rapid Relief Toothpaste 80g',
    brand: 'GSK Consumer',
    category: 'Oral Care',
    price: 195,
    mrp: 230,
    oldPrice: 230,
    discount: '15% OFF',
    rating: 4.9,
    reviewsCount: 3200,
    requiresPrescription: false,
    inStock: true,
    packSize: '80g Tube',
    uses: 'Fast relief from tooth sensitivity within 60 seconds',
  },
  {
    id: 'ext-3',
    name: 'Moov Fast Pain Relief Ointment 50g',
    brand: 'Reckitt Benckiser',
    category: 'Pain Relief',
    price: 145,
    mrp: 175,
    oldPrice: 175,
    discount: '17% OFF',
    rating: 4.7,
    reviewsCount: 2100,
    requiresPrescription: false,
    inStock: true,
    packSize: '50g Tube',
    uses: 'Back pain, joint aches, muscle spasms and stiff neck',
  },
  {
    id: 'ext-4',
    name: 'Accu-Chek Active 50 Test Strips',
    brand: 'Roche Diagnostics',
    category: 'Healthcare Devices',
    price: 849,
    mrp: 1050,
    oldPrice: 1050,
    discount: '19% OFF',
    rating: 4.8,
    reviewsCount: 4500,
    requiresPrescription: false,
    inStock: true,
    packSize: 'Pack of 50 Test Strips',
    uses: 'Quantitative blood glucose measurement with Accu-Chek meter',
  },
  {
    id: 'ext-5',
    name: 'Vicks VapoRub Balm 50ml (Relief from Cold)',
    brand: 'Procter & Gamble',
    category: 'Medicines',
    price: 135,
    mrp: 160,
    oldPrice: 160,
    discount: '16% OFF',
    rating: 4.9,
    reviewsCount: 5200,
    requiresPrescription: false,
    inStock: true,
    packSize: '50ml Jar',
    uses: 'Cough, cold, blocked nose, breathing difficulty and body aches',
  },
];



const PharmacyScreenWeb = ({ navigation, route }) => {
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
  } = useCart();

  // Active Hero Slide Index
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  // Auto-scroll hero ads every 6 seconds (matching HomeScreen)
  useEffect(() => {
    if (isSlidePaused) return;
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % PHARMACY_HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isSlidePaused]);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState(route?.params?.query || route?.params?.search || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Delivery Address
  const [currentAddress, setCurrentAddress] = useState(
    selectedAddress?.locality
      ? `${selectedAddress.locality}, ${selectedAddress.city || 'Mysuru'}`
      : 'Kuvempunagar, Mysuru'
  );

  useEffect(() => {
    if (selectedAddress?.locality) {
      setCurrentAddress(`${selectedAddress.locality}, ${selectedAddress.city || 'Mysuru'}`);
    }
  }, [selectedAddress]);

  // Handle Route Params
  useEffect(() => {
    if (route?.params?.query !== undefined) {
      setSearchQuery(route.params.query);
    } else if (route?.params?.search !== undefined) {
      setSearchQuery(route.params.search);
    }
  }, [route?.params?.query, route?.params?.search]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let list = EXTENDED_PRODUCTS;

    // Filter by condition if selected
    if (selectedCondition) {
      const condObj =
        BROWSE_HEALTH_CONDITIONS.find((c) => c.id === selectedCondition) ||
        HEALTH_CONDITIONS.find((c) => c.id === selectedCondition);
      if (condObj) {
        list = list.filter((p) => {
          const text = `${p.name} ${p.brand} ${p.category} ${p.uses || ''} ${p.description || ''}`.toLowerCase();
          return condObj.filterKeywords.some((k) => text.includes(k));
        });
      }
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter((p) => {
        if (p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return true;
        }
        if (selectedCategory === 'Pain Relief' && (p.category === 'Pain Relief' || (p.uses && p.uses.toLowerCase().includes('pain')))) {
          return true;
        }
        return false;
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.uses && p.uses.toLowerCase().includes(q))
      );
    }

    return list;
  }, [searchQuery, selectedCategory, selectedCondition]);

  // ==========================================
  // PAGINATION: 15 ITEMS PER PAGE
  // ==========================================
  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedCondition]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleConditionSelect = (conditionId) => {
    if (selectedCondition === conditionId) {
      setSelectedCondition(null);
    } else {
      setSelectedCondition(conditionId);
      setSelectedCategory('all');
    }
  };

  const handleTriggerUpload = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          setSelectedFile(file.name);
          setShowUploadModal(true);
        }
      };
      input.click();
    } else {
      setShowUploadModal(true);
    }
  };

  const handleConfirmUpload = () => {
    setShowUploadModal(false);
    setUploadSuccessToast(true);
    setTimeout(() => {
      setUploadSuccessToast(false);
    }, 4000);
  };

  const handleHeroCta = (slide) => {
    if (slide.actionType === 'upload') {
      handleTriggerUpload();
    } else if (slide.actionType === 'filter-devices') {
      setSelectedCategory('Healthcare Devices');
      setSelectedCondition(null);
    } else {
      setSelectedCategory('all');
      setSelectedCondition(null);
    }
  };

  const activeSlide = PHARMACY_HERO_SLIDES[activeSlideIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* MOBILE TOP HEADER (SHOWN ON MOBILE WEBPAGE WIDTHS) */}
      {!isDesktop && (
        <View style={styles.mobileHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#1E3A8A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerLocalityBtn}
            onPress={() => setShowAddressModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.headerLocalityIconWrap}>
              <Ionicons name="location" size={14} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerDeliverTo}>Deliver to</Text>
              <Text style={styles.headerLocalityName} numberOfLines={1}>
                {currentAddress}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerCartBtn}
            onPress={() => navigation?.navigate('Cart', { initialTab: 'pharmacy' })}
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
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ============================================================
            1. FULL-WIDTH HERO SHOWCASE BANNER (Exact HomeScreen Standard)
        ============================================================ */}
        <View
          style={styles.heroCarouselWrap}
          {...(Platform.OS === 'web'
            ? {
                onMouseEnter: () => setIsSlidePaused(true),
                onMouseLeave: () => setIsSlidePaused(false),
              }
            : {})}
        >
          <View style={styles.heroCarouselInner}>
            <View
              key={activeSlide.id}
              style={[
                styles.fullWidthBannerCard,
                {
                  backgroundColor: activeSlide.bgColor,
                  borderColor: activeSlide.borderColor || '#E2E8F0',
                },
              ]}
            >
              {/* Left Navigation Chevron Button */}
              <TouchableOpacity
                style={styles.carouselNavArrowLeft}
                onPress={() =>
                  setActiveSlideIndex((prev) => (prev - 1 + PHARMACY_HERO_SLIDES.length) % PHARMACY_HERO_SLIDES.length)
                }
                activeOpacity={0.85}
              >
                <Ionicons name="chevron-back" size={20} color="#1E3A8A" />
              </TouchableOpacity>

              {/* Left Column: Offer Details, Bullets & CTAs */}
              <View style={styles.fullWidthLeftCol}>
                <View style={styles.bannerBadgeRow}>
                  <View style={[styles.brandPillYellow, { backgroundColor: activeSlide.pillBg }]}>
                    <Text style={[styles.brandPillYellowText, { color: activeSlide.pillColor }]}>
                      {activeSlide.pillText}
                    </Text>
                  </View>
                  <View style={styles.brandTagFlipkart}>
                    <Ionicons
                      name={activeSlide.certIcon || 'shield-checkmark'}
                      size={12}
                      color={activeSlide.priceColor || '#00B894'}
                    />
                    <Text style={[styles.brandTagFlipkartText, { color: activeSlide.priceColor || '#00B894' }]}>
                      {activeSlide.certText}
                    </Text>
                  </View>
                  <View style={styles.adNoticePill}>
                    <Text style={styles.adNoticePillText}>VERIFIED PHARMACY</Text>
                  </View>
                </View>

                <Text style={styles.fullWidthTitle}>{activeSlide.title}</Text>

                <View style={styles.fullWidthPriceRow}>
                  <Text style={[styles.fullWidthPriceText, { color: activeSlide.priceColor }]}>
                    {activeSlide.priceText}
                  </Text>
                  {activeSlide.priceSub && (
                    <Text style={styles.fullWidthPriceSubText}>• {activeSlide.priceSub}</Text>
                  )}
                </View>

                <Text style={styles.fullWidthSubTitle} numberOfLines={2}>
                  {activeSlide.subTitle}
                </Text>

                {/* Feature Bullets */}
                <View style={styles.fullWidthBulletsCol}>
                  {activeSlide.bullets.map((b, bIdx) => (
                    <View key={bIdx} style={styles.fullWidthBulletItem}>
                      <Ionicons name="checkmark-circle" size={15} color={activeSlide.priceColor || '#00B894'} />
                      <Text style={styles.fullWidthBulletText} numberOfLines={1}>
                        {b}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Dual CTA Buttons */}
                <View style={styles.fullWidthCtaRow}>
                  <TouchableOpacity
                    style={[styles.fullWidthCtaBtn, { backgroundColor: activeSlide.ctaBg }]}
                    onPress={() => handleHeroCta(activeSlide)}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.fullWidthCtaText}>{activeSlide.ctaText}</Text>
                    <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.heroSecondaryUploadBtn}
                    onPress={handleTriggerUpload}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color="#1E3A8A" />
                    <Text style={styles.heroSecondaryUploadText}>Upload Prescription</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Right Column: High-Res Lifestyle Photo with Trust Badge */}
              <View style={styles.fullWidthRightCol}>
                <Image
                  source={{ uri: activeSlide.image }}
                  style={styles.fullWidthImage}
                  resizeMode="cover"
                />
                {activeSlide.trustBadge && (
                  <View style={styles.floatingTrustBadge}>
                    <Ionicons name="shield-checkmark" size={13} color="#00B894" />
                    <Text style={styles.floatingTrustBadgeText}>{activeSlide.trustBadge}</Text>
                  </View>
                )}
              </View>

              {/* Right Navigation Chevron Button */}
              <TouchableOpacity
                style={styles.carouselNavArrowRight}
                onPress={() => setActiveSlideIndex((prev) => (prev + 1) % PHARMACY_HERO_SLIDES.length)}
                activeOpacity={0.85}
              >
                <Ionicons name="chevron-forward" size={20} color="#1E3A8A" />
              </TouchableOpacity>
            </View>

            {/* Pagination Dots */}
            <View style={styles.dotsRow}>
              {PHARMACY_HERO_SLIDES.map((slide, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveSlideIndex(idx)}
                  style={[styles.dot, activeSlideIndex === idx && styles.dotActive]}
                  activeOpacity={0.7}
                />
              ))}
            </View>
          </View>
        </View>

        {/* ============================================================
            2. PROMINENT SEARCH BAR (High-Visibility Design)
        ============================================================ */}
        <View style={styles.searchSectionWrap}>
          <View style={styles.searchSectionInner}>
            <View style={styles.searchBarBox}>
              <View style={styles.searchIconBox}>
                <Ionicons name="search" size={20} color="#00B894" />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Search 50,000+ medicines, vitamins, health devices, or brands..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={20} color="#64748B" />
                </TouchableOpacity>
              ) : null}

              {/* Action Buttons inside Search Bar */}
              <View style={styles.searchBarActions}>
                <TouchableOpacity
                  style={styles.searchSubmitBtn}
                  onPress={() => {}}
                  activeOpacity={0.88}
                >
                  <Text style={styles.searchSubmitBtnText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            3. BROWSE MEDICINES & HEALTH PRODUCTS (Creative Mockup Layout)
        ============================================================ */}
        <View style={styles.browseSectionWrap}>
          <View style={styles.browseSectionInner}>
            <View style={styles.browseHeaderBadgeRow}>
              <Text style={styles.browseMainHeading}>Browse medicines & health products</Text>
              <View style={styles.browseHeaderPill}>
                <Ionicons name="sparkles" size={13} color="#00B894" />
                <Text style={styles.browseHeaderPillText}>100% Genuine & Verified</Text>
              </View>
            </View>

            {/* SUBSECTION 1: HEALTH CONDITION */}
            <View style={styles.browseSubSection}>
              <View style={styles.subSectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.browseSubHeading}>Health condition</Text>
                  <Text style={styles.subSectionCountText}>4 specialized therapies</Text>
                </View>
                {selectedCondition && (
                  <TouchableOpacity
                    onPress={() => setSelectedCondition(null)}
                    style={styles.activeFilterChip}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.activeFilterChipText}>Clear Filter</Text>
                    <Ionicons name="close-circle" size={14} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.browseCardsRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.browseCardsScroll}
                >
                  {BROWSE_HEALTH_CONDITIONS.map((item) => {
                    const isSelected = selectedCondition === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.browseBannerCard,
                          { backgroundColor: item.bg },
                          isSelected && styles.browseBannerCardActive,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedCondition(null);
                          } else {
                            setSelectedCategory('all');
                            setSelectedCondition(item.id);
                          }
                        }}
                        activeOpacity={0.88}
                      >
                        {/* Decorative Background Glow Disc */}
                        <View style={styles.cardBackdropGlow} />

                        {/* Top Micro Pill */}
                        <View style={styles.bannerMicroPill}>
                          <Text style={styles.bannerMicroPillText}>{item.badge}</Text>
                        </View>

                        {/* Left Column (Typography) */}
                        <View style={styles.bannerTextCol}>
                          <Text style={styles.bannerTitlePrimary}>{item.titlePrimary}</Text>
                          <Text style={styles.bannerTitleSecondary}>{item.titleSecondary}</Text>
                          <Text style={styles.bannerTagline} numberOfLines={1}>{item.tagline}</Text>

                          <View style={[styles.bannerExploreChip, isSelected && styles.bannerExploreChipActive]}>
                            <Text style={styles.bannerExploreText}>
                              {isSelected ? 'Selected' : 'Explore'}
                            </Text>
                            <Ionicons
                              name={isSelected ? 'checkmark-circle' : 'arrow-forward'}
                              size={12}
                              color="#FFFFFF"
                            />
                          </View>
                        </View>

                        {/* Right Column (Cutout Image) */}
                        <View style={styles.bannerImageContainer}>
                          <View style={styles.imageBackdropDisc} />
                          <Image
                            source={{ uri: item.image }}
                            style={styles.bannerCutoutImage}
                            resizeMode="cover"
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <View style={styles.carouselNextBtn}>
                  <Ionicons name="chevron-forward" size={18} color="#1E293B" />
                </View>
              </View>
            </View>

            {/* SUBSECTION 2: CATEGORIES */}
            <View style={styles.browseSubSection}>
              <View style={styles.subSectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.browseSubHeading}>Categories</Text>
                  <Text style={styles.subSectionCountText}>Curated everyday care</Text>
                </View>
                {selectedCategory !== 'all' && !selectedCondition && (
                  <TouchableOpacity
                    onPress={() => setSelectedCategory('all')}
                    style={styles.activeFilterChip}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.activeFilterChipText}>View All</Text>
                    <Ionicons name="close-circle" size={14} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.browseCardsRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.browseCardsScroll}
                >
                  {BROWSE_CATEGORIES.map((item) => {
                    const isSelected = selectedCategory === item.categoryFilter && !selectedCondition;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.browseBannerCard,
                          { backgroundColor: item.bg },
                          isSelected && styles.browseBannerCardActive,
                        ]}
                        onPress={() => {
                          setSelectedCondition(null);
                          setSelectedCategory(item.categoryFilter);
                        }}
                        activeOpacity={0.88}
                      >
                        {/* Decorative Background Glow Disc */}
                        <View style={styles.cardBackdropGlow} />

                        {/* Top Micro Pill */}
                        <View style={styles.bannerMicroPill}>
                          <Text style={styles.bannerMicroPillText}>{item.badge}</Text>
                        </View>

                        {/* Left Column (Typography) */}
                        <View style={styles.bannerTextCol}>
                          <Text style={styles.bannerTitlePrimary}>{item.titlePrimary}</Text>
                          <Text style={styles.bannerTitleSecondary}>{item.titleSecondary}</Text>
                          <Text style={styles.bannerTagline} numberOfLines={1}>{item.tagline}</Text>

                          <View style={[styles.bannerExploreChip, isSelected && styles.bannerExploreChipActive]}>
                            <Text style={styles.bannerExploreText}>
                              {isSelected ? 'Selected' : 'Explore'}
                            </Text>
                            <Ionicons
                              name={isSelected ? 'checkmark-circle' : 'arrow-forward'}
                              size={12}
                              color="#FFFFFF"
                            />
                          </View>
                        </View>

                        {/* Right Column (Cutout Image) */}
                        <View style={styles.bannerImageContainer}>
                          <View style={styles.imageBackdropDisc} />
                          <Image
                            source={{ uri: item.image }}
                            style={styles.bannerCutoutImage}
                            resizeMode="cover"
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <View style={styles.carouselNextBtn}>
                  <Ionicons name="chevron-forward" size={18} color="#1E293B" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            6. GUARANTEE / TRUST STRIP
        ============================================================ */}
        <View style={styles.guaranteeSectionWrap}>
          <View style={styles.guaranteeCard}>
            <View style={styles.guaranteeItem}>
              <View style={[styles.guaranteeIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
              </View>
              <View>
                <Text style={styles.guaranteeTitle}>100% Genuine Medicines</Text>
                <Text style={styles.guaranteeSub}>Directly sourced from verified manufacturers</Text>
              </View>
            </View>

            <View style={styles.guaranteeDivider} />

            <View style={styles.guaranteeItem}>
              <View style={[styles.guaranteeIconCircle, { backgroundColor: '#FFEDD5' }]}>
                <Ionicons name="flash" size={20} color="#EA580C" />
              </View>
              <View>
                <Text style={styles.guaranteeTitle}>60-Min Express Delivery</Text>
                <Text style={styles.guaranteeSub}>Guaranteed swift delivery in Mysuru</Text>
              </View>
            </View>

            <View style={styles.guaranteeDivider} />

            <View style={styles.guaranteeItem}>
              <View style={[styles.guaranteeIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="medkit" size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.guaranteeTitle}>Pharmacist Review 24/7</Text>
                <Text style={styles.guaranteeSub}>Free dosage & interaction verification</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            POPULAR PRODUCTS (Matching Mockup Heading)
        ============================================================ */}
        <View style={styles.pharmacySectionWrap}>
          <View style={styles.sectionHeaderLine}>
            <View>
              <Text style={styles.sectionHeadingTitle}>
                {selectedCondition
                  ? `${BROWSE_HEALTH_CONDITIONS.find((c) => c.id === selectedCondition)?.titlePrimary || 'Selected'} Care Products`
                  : selectedCategory !== 'all'
                  ? `${selectedCategory} Products`
                  : searchQuery
                  ? `Search Results for "${searchQuery}"`
                  : 'Popular Products'}
              </Text>
              <Text style={styles.sectionSubHeading}>
                Showing {filteredProducts.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} items (15 per page)
              </Text>
            </View>

            {(selectedCategory !== 'all' || selectedCondition || searchQuery) && (
              <TouchableOpacity
                style={styles.viewStoreBtn}
                onPress={() => {
                  setSelectedCategory('all');
                  setSelectedCondition(null);
                  setSearchQuery('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.viewStoreBtnText}>View All Products</Text>
                <Ionicons name="arrow-forward" size={14} color="#00B894" />
              </TouchableOpacity>
            )}
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyProductsState}>
              <Ionicons name="search-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No matching medicines found</Text>
              <Text style={styles.emptySub}>
                Try another search keyword or explore all categories.
              </Text>
              <TouchableOpacity
                style={styles.resetCatalogBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedCondition(null);
                }}
              >
                <Text style={styles.resetCatalogBtnText}>Show All Products</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.pharmacyCardsGrid}>
                {paginatedProducts.map((prod) => {
                  const cartItem = (pharmacyCart || []).find((ci) => ci.id === prod.id);
                  const quantity = cartItem?.quantity || 0;
                  const prodImg = getProductImage(prod);

                return (
                  <View key={prod.id} style={styles.pharmacyCard}>
                    {/* Badge */}
                    <View style={styles.pharmacyBadge}>
                      <Text style={styles.pharmacyBadgeText}>
                        {prod.discount ? prod.discount.toUpperCase() : 'FLAT 20% OFF'}
                      </Text>
                    </View>

                    {prod.requiresPrescription && (
                      <View style={styles.pharmacyRxBadge}>
                        <Text style={styles.pharmacyRxBadgeText}>Rx</Text>
                      </View>
                    )}

                    {/* Image */}
                    <TouchableOpacity
                      onPress={() => navigation?.navigate('ProductDetails', { product: prod, productId: prod.id })}
                      activeOpacity={0.9}
                      style={styles.pharmacyCardImgWrap}
                    >
                      <Image source={{ uri: prodImg }} style={styles.pharmacyCardImg} resizeMode="contain" />
                    </TouchableOpacity>

                    {/* Card Content */}
                    <View style={styles.pharmacyCardBody}>
                      <Text style={styles.pharmacyCat}>{prod.category || 'MEDICINES'}</Text>
                      <TouchableOpacity
                        onPress={() => navigation?.navigate('ProductDetails', { product: prod, productId: prod.id })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.pharmacyName} numberOfLines={1}>
                          {prod.name}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.pharmacyBrand} numberOfLines={1}>
                        {prod.brand} • {prod.packSize || '1 Unit'}
                      </Text>

                      {/* Rating */}
                      <View style={styles.pharmacyRatingRow}>
                        <View style={styles.ratingTag}>
                          <Ionicons name="star" size={11} color="#FF7F50" />
                          <Text style={styles.ratingTagText}>{prod.rating || 4.8}</Text>
                        </View>
                        <Text style={styles.reviewsCountText}>({prod.reviewsCount || 850}+)</Text>
                      </View>

                      {/* Price Row */}
                      <View style={styles.pharmacyPriceRow}>
                        <Text style={styles.pharmacyPrice}>₹{prod.price}</Text>
                        {(prod.mrp || prod.oldPrice) && (
                          <Text style={styles.pharmacyMrp}>MRP ₹{prod.mrp || prod.oldPrice}</Text>
                        )}
                      </View>

                      {/* Add to Cart or Stepper */}
                      {quantity > 0 ? (
                        <View style={styles.quantityStepper}>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => decreaseQuantity(prod.id, 'pharmacy')}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="remove" size={14} color="#00B894" />
                          </TouchableOpacity>
                          <Text style={styles.stepperQuantity}>{quantity}</Text>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => increaseQuantity(prod.id, 'pharmacy')}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="add" size={14} color="#00B894" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addToCartButton}
                          onPress={() => addToCart(prod, 1, 'pharmacy')}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="cart-outline" size={15} color="#FFFFFF" />
                          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Pagination Controls Bar */}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[styles.pageNavBtn, currentPage === 1 && styles.pageNavBtnDisabled]}
                  onPress={() => {
                    if (currentPage > 1) {
                      setCurrentPage((prev) => prev - 1);
                    }
                  }}
                  disabled={currentPage === 1}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#94A3B8' : '#1E3A8A'} />
                  <Text style={[styles.pageNavBtnText, currentPage === 1 && styles.pageNavBtnTextDisabled]}>
                    Previous
                  </Text>
                </TouchableOpacity>

                <View style={styles.pageNumbersTrack}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isActive = pageNum === currentPage;
                    return (
                      <TouchableOpacity
                        key={pageNum}
                        style={[styles.pageNumberChip, isActive && styles.pageNumberChipActive]}
                        onPress={() => setCurrentPage(pageNum)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.pageNumberText, isActive && styles.pageNumberTextActive]}>
                          {pageNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.pageNavBtn, currentPage === totalPages && styles.pageNavBtnDisabled]}
                  onPress={() => {
                    if (currentPage < totalPages) {
                      setCurrentPage((prev) => prev + 1);
                    }
                  }}
                  disabled={currentPage === totalPages}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pageNavBtnText, currentPage === totalPages && styles.pageNavBtnTextDisabled]}>
                    Next
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={currentPage === totalPages ? '#94A3B8' : '#1E3A8A'}
                  />
                </TouchableOpacity>
              </View>
            )}
            </>
          )}
        </View>


        {/* ============================================================
            10. ENTERPRISE FOOTER
        ============================================================ */}
        <WebFooter navigation={navigation} />

        {/* ============================================================
            11. MODAL: PRESCRIPTION UPLOAD DIALOG
        ============================================================ */}
        <Modal
          visible={showUploadModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUploadModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Upload Doctor's Prescription</Text>
                <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.uploadDropzone}>
                  <Ionicons name="cloud-upload" size={48} color="#00B894" />
                  <Text style={styles.dropzoneTitle}>
                    {selectedFile ? `Selected: ${selectedFile}` : 'Drag & Drop prescription image or PDF here'}
                  </Text>
                  <Text style={styles.dropzoneSub}>Supports JPG, PNG, PDF up to 10MB</Text>
                  <TouchableOpacity style={styles.dropzoneBrowseBtn} onPress={handleTriggerUpload}>
                    <Text style={styles.dropzoneBrowseText}>Browse File</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.rxGuidelinesBox}>
                  <Text style={styles.guidelinesTitle}>Prescription Guidelines:</Text>
                  <Text style={styles.guidelineItem}>• Patient name & doctor's stamp/signature clearly visible</Text>
                  <Text style={styles.guidelineItem}>• Valid date within last 6 months</Text>
                  <Text style={styles.guidelineItem}>• Do not crop or blur medication details</Text>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowUploadModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmUpload}>
                  <Text style={styles.modalConfirmText}>Confirm & Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ============================================================
            12. MODAL: DELIVERY LOCALITY SELECTOR
        ============================================================ */}
        <Modal
          visible={showAddressModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddressModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Delivery Location in Mysuru</Text>
                <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380, paddingVertical: 10 }}>
                {POPULAR_LOCALITIES.map((loc, idx) => {
                  const isActive = currentAddress.includes(loc.name);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.localitySelectItem, isActive && styles.localitySelectItemActive]}
                      onPress={() => {
                        setCurrentAddress(`${loc.name}, Mysuru`);
                        updateAddress({ locality: loc.name, city: 'Mysuru' });
                        setShowAddressModal(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="location"
                        size={18}
                        color={isActive ? '#00B894' : '#64748B'}
                        style={{ marginRight: 12 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.localityName, isActive && styles.localityNameActive]}>
                          {loc.name}
                        </Text>
                        <Text style={styles.localitySub}>Pincode: {loc.pincode} • Express Delivery Available</Text>
                      </View>
                      {isActive && <Ionicons name="checkmark-circle" size={18} color="#00B894" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Upload Success Toast */}
        {uploadSuccessToast && (
          <View style={styles.successToastWrap}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.successToastText}>
              Prescription submitted! Our pharmacist will review it shortly.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Cart FAB */}
      <TouchableOpacity
        style={[
          styles.floatingCartFab,
          pharmacyCartCount > 0 && styles.floatingCartFabActive,
        ]}
        onPress={() => navigation?.navigate('Cart', { initialTab: 'pharmacy' })}
        activeOpacity={0.85}
      >
        <Ionicons name="cart" size={24} color="#FFFFFF" />
        {pharmacyCartCount > 0 && (
          <View style={styles.fabCountBadge}>
            <Text style={styles.fabCountText}>{pharmacyCartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ==================================================
// STYLESHEET (Exact HomeScreen.web.js Design System)
// ==================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Match HomeScreen background
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
    backgroundColor: '#ECFDF5',
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

  // 1. HERO SHOWCASE CAROUSEL
  heroCarouselWrap: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  heroCarouselInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    position: 'relative',
  },
  carouselNavArrowLeft: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: [{ translateY: -21 }],
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    cursor: 'pointer',
  },
  carouselNavArrowRight: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -21 }],
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    cursor: 'pointer',
  },
  fullWidthBannerCard: {
    width: '100%',
    minHeight: 290,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fullWidthLeftCol: {
    flex: 1.15,
    paddingVertical: 26,
    paddingLeft: 76,
    paddingRight: 24,
    justifyContent: 'center',
  },
  fullWidthRightCol: {
    flex: 0.85,
    height: '100%',
    minHeight: 280,
    position: 'relative',
    overflow: 'hidden',
  },
  fullWidthImage: {
    width: '100%',
    height: '100%',
    minHeight: 280,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  floatingTrustBadge: {
    position: 'absolute',
    bottom: 18,
    right: 76,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  floatingTrustBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandPillYellow: {
    backgroundColor: '#FFE11B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  brandPillYellowText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  brandTagFlipkart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  brandTagFlipkartText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00B894',
  },
  adNoticePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adNoticePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  fullWidthTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 34,
    marginTop: 8,
    letterSpacing: -0.6,
  },
  fullWidthPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  fullWidthPriceText: {
    fontSize: 20,
    fontWeight: '900',
  },
  fullWidthPriceSubText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  fullWidthSubTitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500',
    maxWidth: '92%',
  },
  fullWidthBulletsCol: {
    marginTop: 10,
    marginBottom: 14,
    gap: 6,
  },
  fullWidthBulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullWidthBulletText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  fullWidthCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  fullWidthCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  fullWidthCtaText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSecondaryUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  heroSecondaryUploadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    cursor: 'pointer',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#00A389',
    borderRadius: 4,
  },

  // 2. PROMINENT SEARCH BAR
  searchSectionWrap: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    width: '100%',
  },
  searchSectionInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  searchBarBox: {
    width: '100%',
    maxWidth: 1080,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    height: '100%',
    outlineStyle: 'none',
  },
  searchClearBtn: {
    padding: 6,
    marginRight: 8,
  },
  searchBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchUploadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  searchUploadChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  searchSubmitBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Pagination Styles
  paginationRow: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 32,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    cursor: 'pointer',
  },
  pageNavBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    cursor: 'not-allowed',
  },
  pageNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  pageNavBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageNumbersTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageNumberChip: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  pageNumberChipActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  localityLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  localityValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },

  // 3. BROWSE MEDICINES & HEALTH PRODUCTS (Creative Rich)
  browseSectionWrap: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: '100%',
  },
  browseSectionInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  browseHeaderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  browseMainHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  browseHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  browseHeaderPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  browseSubSection: {
    marginBottom: 26,
  },
  subSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  browseSubHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  subSectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  browseCardsRow: {
    position: 'relative',
    width: '100%',
  },
  browseCardsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingRight: 50,
  },
  browseBannerCard: {
    width: 300,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 4,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    cursor: 'pointer',
  },
  browseBannerCardActive: {
    borderWidth: 3,
    borderColor: '#0F172A',
    shadowOpacity: 0.2,
    transform: [{ scale: 1.02 }],
  },
  cardBackdropGlow: {
    position: 'absolute',
    left: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  bannerMicroPill: {
    position: 'absolute',
    top: 10,
    left: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    zIndex: 4,
  },
  bannerMicroPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  bannerTextCol: {
    zIndex: 3,
    justifyContent: 'center',
    maxWidth: '54%',
    paddingTop: 18,
  },
  bannerTitlePrimary: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 23,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerTitleSecondary: {
    fontSize: 10.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  bannerTagline: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  bannerExploreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  bannerExploreChipActive: {
    backgroundColor: '#0F172A',
  },
  bannerExploreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerImageContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '52%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  imageBackdropDisc: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  bannerCutoutImage: {
    width: '100%',
    height: '100%',
  },
  carouselNextBtn: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -18 }],
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    cursor: 'pointer',
  },

  // 4. 4 FEATURED ACTION CARDS
  featuredServicesWrap: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  featuredServicesInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featuredServiceCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    justifyContent: 'space-between',
    minHeight: 160,
  },
  featuredCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  featuredTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  featuredCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 10,
  },
  featuredCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  featuredPriceBox: {
    justifyContent: 'center',
  },
  featuredPriceLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  featuredPriceVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  featuredCtaBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 5. BROWSE BY HEALTH CONDITIONS
  bestQualitySectionWrap: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  bestQualityHeaderRow: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bestQualityTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.4,
  },
  clearConditionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  clearConditionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  conditionsGrid: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  conditionCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  conditionCardSelected: {
    borderColor: '#00B894',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4',
  },
  conditionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionInfo: {
    flex: 1,
  },
  conditionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  conditionNameSelected: {
    color: '#00B894',
  },
  conditionActionText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },

  // 6. GUARANTEE / TRUST STRIP
  guaranteeSectionWrap: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  guaranteeCard: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 220,
    marginVertical: 4,
  },
  guaranteeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  guaranteeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  guaranteeSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  // 7. ESSENTIAL MEDICINES & DAILY CARE (Flipkart Cards Standard)
  pharmacySectionWrap: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  sectionHeaderLine: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeadingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.4,
  },
  sectionSubHeading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  viewStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  viewStoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  pharmacyCardsGrid: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  pharmacyCard: {
    flex: 1,
    minWidth: 240,
    maxWidth: 310,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    position: 'relative',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    justifyContent: 'space-between',
  },
  pharmacyBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  pharmacyBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FF7F50',
  },
  pharmacyRxBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FECDD3',
    zIndex: 2,
  },
  pharmacyRxBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  pharmacyCardImgWrap: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginTop: 18,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pharmacyCardImg: {
    width: '85%',
    height: '85%',
  },
  pharmacyCardBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pharmacyCat: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00B894',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pharmacyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 4,
    lineHeight: 18,
  },
  pharmacyBrand: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pharmacyRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF7F50',
  },
  reviewsCountText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  pharmacyPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 10,
  },
  pharmacyPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  pharmacyMrp: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    paddingVertical: 9,
    borderRadius: 8,
    height: 38,
  },
  addToCartButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#00B894',
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    height: 38,
    paddingHorizontal: 8,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQuantity: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00B894',
  },
  emptyProductsState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  resetCatalogBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetCatalogBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // 8. WALLET / RX PRESCRIPTION HOME BANNER
  walletHomeSectionWrap: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  walletHomeCard: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
  },
  walletHomeLeft: {
    flex: 1,
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  walletIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletHomeInfo: {
    flex: 1,
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  walletHomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065F46',
  },
  walletStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  walletGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  walletStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  walletHomeSub: {
    fontSize: 13,
    color: '#065F46',
    lineHeight: 19,
  },
  walletHomeRight: {
    alignItems: 'flex-end',
  },
  topUpWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  topUpWalletBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 9. TOP PHARMA BRANDS
  brandsGrid: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  brandCard: {
    flex: 1,
    minWidth: 140,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCardText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // 11. MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalBody: {
    paddingVertical: 16,
  },
  uploadDropzone: {
    borderWidth: 2,
    borderColor: '#A7F3D0',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dropzoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    textAlign: 'center',
  },
  dropzoneSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 12,
  },
  dropzoneBrowseBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dropzoneBrowseText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  rxGuidelinesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  guidelinesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  guidelineItem: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalConfirmBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Locality Modal
  localitySelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  localitySelectItemActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF4',
  },
  localityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  localityNameActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  localitySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Toast Notification
  successToastWrap: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  successToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // 13. FLOATING BOTTOM CART DOCK (Navy Blue & Emerald Theme)
  floatingCartDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E3A8A', // Deep navy matching header & Home design
    borderTopWidth: 1,
    borderTopColor: '#1E40AF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 900,
  },
  floatingCartInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  floatingCartIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingCartMiniBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
  },
  floatingCartMiniBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  floatingCartInfo: {
    justifyContent: 'center',
  },
  floatingCartTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  floatingCartSub: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  floatingCartPriceBold: {
    color: '#34D399',
    fontWeight: '800',
    fontSize: 13,
  },
  floatingCartActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00B894',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingCartActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Floating FAB
  floatingCartFab: {
    position: 'absolute',
    right: 28,
    bottom: 28,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 950,
  },
  floatingCartFabActive: {
    backgroundColor: '#00B894',
  },
  fabCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fabCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});

export default PharmacyScreenWeb;
