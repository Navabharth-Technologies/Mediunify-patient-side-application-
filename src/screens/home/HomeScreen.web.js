import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import doctors, { doctorSpecialties } from '../../data/doctors';
import { labPackages } from '../../data/homeData';
import WebFooter from '../../components/web/WebFooter';

const FEATURED_MEDICINES = [
  {
    id: 'MED-1',
    name: 'Dolo 650mg Tablet',
    brand: 'Micro Labs',
    category: 'Fever & Pain Relief',
    price: 30,
    mrp: 35,
    discount: '₹5 off',
    badge: '₹5 off',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    subText: 'Coupon offer',
  },
  {
    id: 'MED-2',
    name: 'Dr. Ananya Rao',
    brand: 'Mediunify Heart Clinic',
    category: 'Cardiology Specialist',
    price: 600,
    mrp: 800,
    discount: '25% off',
    badge: '⭐ 4.9',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    subText: 'Book Clinic Visit',
    isDoctor: true,
  },
  {
    id: 'MED-3',
    name: 'Full Body Lipid & Sugar Panel',
    brand: 'NABL Certified Labs',
    category: 'Diagnostic Pathology',
    price: 799,
    mrp: 1499,
    discount: '↓ 45%',
    badge: '↓ 45%',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400',
    subText: 'Free Home Pickup',
    isLab: true,
  },
  {
    id: 'MED-4',
    name: 'High-Precision 3T MRI Scan',
    brand: 'Advanced Radiology Centre',
    category: 'Brain & Spine Imaging',
    price: 3800,
    mrp: 5500,
    discount: '₹1,700 off',
    badge: '₹1,700 off',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400',
    subText: 'Instant Slot Booking',
    isScan: true,
  },
  {
    id: 'MED-5',
    name: 'Volini Pain Relief Gel 50g',
    brand: 'Sun Pharma',
    category: 'Joint & Muscle Care',
    price: 135,
    mrp: 165,
    discount: '↓ 20%',
    badge: '↓ 20%',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1550572017-ed24058d844c?w=400',
    subText: 'Deals for you',
  },
  {
    id: 'MED-6',
    name: 'Augmentin 625 Duo',
    brand: 'GSK Pharmaceuticals',
    category: 'Antibiotics',
    price: 180,
    mrp: 205,
    discount: '12% off',
    badge: '₹25 off',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
    subText: 'Pharmacy Store',
  },
];

const TESTIMONIALS = [
  {
    id: '1',
    name: 'Suresh Kumar',
    locality: 'Jayalakshmipuram, Mysore',
    service: 'In-Person Consultation & Pharmacy',
    comment:
      'Booked an appointment with Dr. Ananya Rao through Mediunify. Zero wait time at the clinic and prescribed medicines reached home in under 45 minutes.',
    rating: 5,
    date: '3 days ago',
  },
  {
    id: '2',
    name: 'Dr. Meenakshi Sundaram',
    locality: 'Kuvempunagar, Mysore',
    service: 'Home Blood Sample Collection',
    comment:
      'Scheduled a full body health package for my elderly parents. Phlebotomist arrived on time with sterile vacuum vials. Reports online same evening.',
    rating: 5,
    date: '1 week ago',
  },
  {
    id: '3',
    name: 'Vikas Gowda',
    locality: 'Indiranagar, Bangalore',
    service: '3T MRI Brain Scan',
    comment:
      'Smooth booking experience for 3T MRI at an accredited imaging centre. Saved almost ₹1,500 compared to walk-in rates. Highly recommended medical platform.',
    rating: 5,
    date: '2 weeks ago',
  },
];

const HomeScreenWeb = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { addToCart } = useCart();
  const [userName, setUserName] = useState('Hemanth');
  const [walletBalance, setWalletBalance] = useState(1250);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedActive = await AsyncStorage.getItem('@unnathi_active_patient');
        if (savedActive) {
          const parsed = JSON.parse(savedActive);
          if (parsed?.displayName || parsed?.name) {
            const raw = (parsed.displayName || parsed.name).trim();
            const first = raw.replace(/\s*\([Ss]elf\)/g, '').split(' ')[0] || raw;
            if (first) {
              setUserName(first);
            }
          }
        } else {
          const stored = await AsyncStorage.getItem('userName');
          if (stored && stored.trim()) {
            setUserName(stored.trim());
          }
        }

        const storedWallet = await AsyncStorage.getItem('@unnathi_wallet_balance');
        if (storedWallet !== null) {
          setWalletBalance(parseInt(storedWallet, 10) || 1250);
        }
      } catch (e) {
        console.log('Error loading user data in HomeScreenWeb:', e);
      }
    };
    loadUserData();
  }, []);

  const handleAddToCart = (med) => {
    addToCart({
      id: med.id,
      name: med.name,
      price: med.price,
      mrp: med.mrp,
      quantity: 1,
      image: med.image,
    });
    alert(`"${med.name}" has been added to your cart.`);
  };

  const handleCardClick = (item) => {
    if (item.isDoctor) {
      navigation?.navigate('DoctorList');
    } else if (item.isLab) {
      navigation?.navigate('LabTests');
    } else if (item.isScan) {
      navigation?.navigate('Imaging');
    } else {
      navigation?.navigate('Pharmacy');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            1. FLIPKART MULTI-BANNER PROMO HERO CAROUSEL
        ============================================================ */}
        <View style={styles.heroCarouselWrap}>
          <View style={styles.heroCarouselInner}>
            {/* Banner 1: Full Body Checkup (Flipkart POCO style card) */}
            <TouchableOpacity
              style={[styles.bannerCard, { backgroundColor: '#FDF7E7' }]}
              onPress={() => navigation?.navigate('LabTests')}
              activeOpacity={0.92}
            >
              <View style={styles.bannerBadgeRow}>
                <View style={styles.brandPillYellow}>
                  <Text style={styles.brandPillYellowText}>HEALTH CHECK</Text>
                </View>
                <View style={styles.brandTagFlipkart}>
                  <Ionicons name="shield-checkmark" size={11} color="#0071DC" />
                  <Text style={styles.brandTagFlipkartText}>NABL Certified</Text>
                </View>
              </View>

              <Text style={styles.bannerMainTitle}>
                Full Body Health Checkup{'\n'}
                <Text style={styles.bannerPriceText}>From ₹999*</Text>
              </Text>
              <Text style={styles.bannerSubTitle}>
                Includes 68 Vital Parameters • Free Home Pickup
              </Text>

              <View style={styles.bannerBottomRow}>
                <Text style={styles.bannerBadgeSale}>Digital Reports in 12h</Text>
                <Text style={styles.bannerAdNotice}>AD</Text>
              </View>

              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400' }}
                style={styles.bannerRightImage}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {/* Banner 2: Express Pharmacy (Flipkart Zebronics style card) */}
            <TouchableOpacity
              style={[styles.bannerCard, { backgroundColor: '#F3F4F6' }]}
              onPress={() => navigation?.navigate('Pharmacy')}
              activeOpacity={0.92}
            >
              <View style={styles.bannerBadgeRow}>
                <View style={[styles.brandPillYellow, { backgroundColor: '#EA580C' }]}>
                  <Text style={[styles.brandPillYellowText, { color: '#FFFFFF' }]}>60-MIN EXPRESS</Text>
                </View>
              </View>

              <Text style={styles.bannerMainTitle}>
                Doorstep Medicines{'\n'}
                <Text style={[styles.bannerPriceText, { color: '#EA580C' }]}>Flat 20% OFF</Text>
              </Text>
              <Text style={styles.bannerSubTitle}>
                100% Genuine Branded Drugs & Jan Aushadhi
              </Text>

              <View style={styles.bannerBottomRow}>
                <Text style={styles.bannerBadgeSale}>Order with Prescription</Text>
                <Text style={styles.bannerAdNotice}>AD</Text>
              </View>

              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400' }}
                style={styles.bannerRightImage}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {/* Banner 3: Specialist Consult (Flipkart Intel Gamer Days style card) */}
            <TouchableOpacity
              style={[styles.bannerCard, { backgroundColor: '#0B0F19' }]}
              onPress={() => navigation?.navigate('VideoConsultation')}
              activeOpacity={0.92}
            >
              <View style={styles.bannerBadgeRow}>
                <View style={[styles.brandPillYellow, { backgroundColor: '#2563EB' }]}>
                  <Text style={[styles.brandPillYellowText, { color: '#FFFFFF' }]}>VERIFIED DOCTORS</Text>
                </View>
              </View>

              <Text style={[styles.bannerMainTitle, { color: '#FFFFFF' }]}>
                Instant Video Consult{'\n'}
                <Text style={[styles.bannerPriceText, { color: '#38BDF8' }]}>From ₹299*</Text>
              </Text>
              <Text style={[styles.bannerSubTitle, { color: '#94A3B8' }]}>
                Cardiologists, Physicians, Pediatricians & Gynecologists
              </Text>

              <View style={styles.bannerBottomRow}>
                <Text style={[styles.bannerBadgeSale, { backgroundColor: '#1E293B', color: '#38BDF8' }]}>
                  Zero Waiting Time
                </Text>
                <Text style={[styles.bannerAdNotice, { color: '#64748B' }]}>AD</Text>
              </View>

              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400' }}
                style={styles.bannerRightImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>

          {/* Flipkart Pagination Dots */}
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* ============================================================
            1.5 MEDIUNIFY HEALTH WALLET & CARE POINTS BANNER
        ============================================================ */}
        <View style={styles.walletHomeSectionWrap}>
          <View style={styles.walletHomeCard}>
            {/* Left Balance & Details */}
            <View style={styles.walletHomeLeft}>
              <View style={styles.walletIconBox}>
                <Ionicons name="wallet" size={28} color="#059669" />
              </View>
              <View style={styles.walletHomeInfo}>
                <View style={styles.walletTitleRow}>
                  <Text style={styles.walletHomeTitle}>MediUnify Health Wallet</Text>
                  <View style={styles.walletStatusBadge}>
                    <View style={styles.walletGreenDot} />
                    <Text style={styles.walletStatusText}>Active & 100% Secured</Text>
                  </View>
                </View>
                <View style={styles.walletAmountsRow}>
                  <Text style={styles.walletBalanceBig}>
                    ₹{walletBalance.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.walletCoinsBadge}>
                    + 150 MediCoins (Worth ₹150)
                  </Text>
                </View>
                <Text style={styles.walletHomeSub}>
                  1-Click Instant Pay for Clinic Appointments, Diagnostic Lab Tests & 60-min Medicine Orders. Earn 5% Cashback on every transaction.
                </Text>
              </View>
            </View>

            {/* Right Action CTAs */}
            <View style={styles.walletHomeRight}>
              <TouchableOpacity
                style={styles.topUpWalletBtn}
                onPress={() => navigation?.navigate('Wallet')}
                activeOpacity={0.88}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.topUpWalletBtnText}>Top Up Wallet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewPassbookBtn}
                onPress={() => navigation?.navigate('Wallet')}
                activeOpacity={0.8}
              >
                <Ionicons name="receipt-outline" size={15} color="#065F46" />
                <Text style={styles.viewPassbookBtnText}>View Passbook & History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ============================================================
            1.8 FEATURED DIGITAL HEALTH: VIDEO CALL & HEALTH INSURANCE
        ============================================================ */}
        <View style={styles.featuredServicesWrap}>
          <View style={styles.featuredServicesInner}>
            {/* Card 1: Instant Video Consultation */}
            <TouchableOpacity
              style={styles.featuredServiceCard}
              onPress={() => navigation?.navigate('VideoConsultation')}
              activeOpacity={0.9}
            >
              <View style={styles.featuredCardHeader}>
                <View style={[styles.featuredTagPill, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="videocam" size={13} color="#2563EB" />
                  <Text style={[styles.featuredTagText, { color: '#2563EB' }]}>ONLINE CONSULTATION</Text>
                </View>
                <View style={styles.featuredLiveDotRow}>
                  <View style={styles.greenPulseDot} />
                  <Text style={styles.featuredLiveText}>18 Doctors Online</Text>
                </View>
              </View>

              <Text style={styles.featuredCardTitle}>
                Consult Specialist Doctors Online
              </Text>
              <Text style={styles.featuredCardDesc}>
                Connect within 15 minutes via 100% private HD video call. Get verified digital prescriptions & free 3-day follow-up.
              </Text>

              <View style={styles.featuredCardFooter}>
                <View style={styles.featuredPriceBox}>
                  <Text style={styles.featuredPriceLabel}>Starting from</Text>
                  <Text style={styles.featuredPriceVal}>₹299</Text>
                </View>
                <View style={[styles.featuredCtaBtn, { backgroundColor: '#00B894' }]}>
                  <Text style={styles.featuredCtaBtnText}>Book Video Slot</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 2: Health Insurance & Mediclaim */}
            <TouchableOpacity
              style={[styles.featuredServiceCard, { borderColor: '#E2E8F0' }]}
              onPress={() => navigation?.navigate('HealthInsurance')}
              activeOpacity={0.9}
            >
              <View style={styles.featuredCardHeader}>
                <View style={[styles.featuredTagPill, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="shield-checkmark" size={13} color="#059669" />
                  <Text style={[styles.featuredTagText, { color: '#059669' }]}>IRDAI APPROVED MEDICLAIM</Text>
                </View>
                <View style={[styles.featuredTagPill, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="receipt" size={12} color="#D97706" />
                  <Text style={[styles.featuredTagText, { color: '#D97706' }]}>Save ₹75K Tax</Text>
                </View>
              </View>

              <Text style={styles.featuredCardTitle}>
                100% Cashless Health Insurance
              </Text>
              <Text style={styles.featuredCardDesc}>
                Guaranteed cashless admission at 10,000+ top hospitals. 20-minute claim approval with dedicated MediUnify desk.
              </Text>

              <View style={styles.featuredCardFooter}>
                <View style={styles.featuredPriceBox}>
                  <Text style={styles.featuredPriceLabel}>Plans from</Text>
                  <Text style={styles.featuredPriceVal}>₹399<Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>/mo</Text></Text>
                </View>
                <View style={[styles.featuredCtaBtn, { backgroundColor: '#059669' }]}>
                  <Text style={styles.featuredCtaBtnText}>Explore Plans</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================
            2. FLIPKART PERSONALIZED CONTAINER: "{userName}, still looking for these?"
        ============================================================ */}
        <View style={styles.personalizedSectionWrap}>
          <View style={styles.personalizedContainer}>
            {/* Section Header */}
            <View style={styles.personalizedHeaderRow}>
              <Text style={styles.personalizedTitle}>
                {userName}, still looking for these?
              </Text>
            </View>

            {/* Horizontal Track of Recommendation Cards */}
            <View style={styles.cardsTrackRow}>
              {FEATURED_MEDICINES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recommendCard}
                  onPress={() => handleCardClick(item)}
                  activeOpacity={0.88}
                >
                  {/* Discount Badge Pill */}
                  {item.badge && (
                    <View style={styles.recommendDiscountBadge}>
                      <Text style={styles.recommendDiscountBadgeText}>{item.badge}</Text>
                    </View>
                  )}

                  {/* Card Image */}
                  <Image
                    source={{ uri: item.image }}
                    style={styles.recommendCardImg}
                    resizeMode="contain"
                  />

                  {/* Card Info */}
                  <View style={styles.recommendCardInfo}>
                    <Text style={styles.recommendItemTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.recommendItemSub} numberOfLines={1}>
                      {item.subText}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Floating Next Arrow Button (Flipkart Signature Circular Chevron) */}
              <TouchableOpacity
                style={styles.nextArrowFloatingBtn}
                onPress={() => navigation?.navigate('Pharmacy')}
                activeOpacity={0.85}
              >
                <Ionicons name="chevron-forward" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ============================================================
            3. "Best quality in healthcare services ->" SECTION
        ============================================================ */}
        <View style={styles.bestQualitySectionWrap}>
          <View style={styles.bestQualityHeaderRow}>
            <Text style={styles.bestQualityTitle}>Best quality in healthcare services</Text>
            <TouchableOpacity
              style={styles.bestQualityArrowBtn}
              onPress={() => navigation?.navigate('DoctorList')}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Curated Grid of Services: Doctors, Diagnostics, Medicines */}
          <View style={styles.bestQualityGrid}>
            {/* Doctor 1 */}
            {doctors.slice(0, 2).map((doc) => (
              <View key={doc.id} style={styles.doctorDealCard}>
                <Image source={{ uri: doc.image }} style={styles.doctorDealImg} />
                <View style={styles.doctorDealContent}>
                  <View style={styles.docDealBadgeRow}>
                    <View style={styles.verifiedTag}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={styles.verifiedTagText}>Verified</Text>
                    </View>
                    <View style={styles.ratingTag}>
                      <Ionicons name="star" size={11} color="#F59E0B" />
                      <Text style={styles.ratingTagText}>{doc.rating}</Text>
                    </View>
                  </View>

                  <Text style={styles.doctorDealName}>{doc.name}</Text>
                  <Text style={styles.doctorDealSpec}>{doc.specialty}</Text>
                  <Text style={styles.doctorDealHospital}>{doc.hospital || 'Mediunify Clinic, Mysore'}</Text>

                  <View style={styles.docDealFooter}>
                    <View>
                      <Text style={styles.docDealFeeLabel}>Consultation</Text>
                      <Text style={styles.docDealFeePrice}>₹{doc.fee}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.docDealBookBtn}
                      onPress={() => navigation?.navigate('DoctorBooking', { doctor: doc })}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.docDealBookBtnText}>Book Visit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* Lab Package 1 */}
            {labPackages.slice(0, 2).map((pkg) => (
              <View key={pkg.id} style={styles.labDealCard}>
                <View style={styles.labDealHeader}>
                  <View style={styles.labDealDiscount}>
                    <Text style={styles.labDealDiscountText}>50% OFF</Text>
                  </View>
                  <Text style={styles.labDealTitle}>{pkg.title}</Text>
                  <Text style={styles.labDealSub}>{pkg.subtitle}</Text>
                </View>

                <View style={styles.labDealBody}>
                  <Text style={styles.labDealParam}>{pkg.highlight}</Text>
                  <View style={styles.labDealPriceRow}>
                    <Text style={styles.labDealPrice}>{pkg.price}</Text>
                    <Text style={styles.labDealMrp}>{pkg.mrp}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.labDealBookBtn}
                    onPress={() => {
                      const numPrice = parseInt(String(pkg.price).replace(/[^\d]/g, '')) || 999;
                      navigation?.navigate('LabBooking', {
                        test: {
                          id: pkg.id,
                          name: pkg.title,
                          price: numPrice,
                          mrp: numPrice + 800,
                          homeCollectionAvailable: true,
                        },
                      });
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.labDealBookBtnText}>Book with Home Pickup</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ============================================================
            4. ESSENTIAL PHARMACY MEDICINES ROW (Flipkart Style Cards)
        ============================================================ */}
        <View style={styles.pharmacySectionWrap}>
          <View style={styles.sectionHeaderLine}>
            <View>
              <Text style={styles.sectionHeadingTitle}>Essential Medicines & Daily Care</Text>
              <Text style={styles.sectionSubHeading}>
                Flat 20% OFF with guaranteed 60-minute doorstep delivery in Mysore
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewStoreBtn}
              onPress={() => navigation?.navigate('Pharmacy')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewStoreBtnText}>View Pharmacy Store</Text>
              <Ionicons name="arrow-forward" size={14} color="#00B894" />
            </TouchableOpacity>
          </View>

          <View style={styles.pharmacyCardsRow}>
            {FEATURED_MEDICINES.slice(0, 4).map((med) => (
              <View key={med.id} style={styles.pharmacyCard}>
                <View style={styles.pharmacyBadge}>
                  <Text style={styles.pharmacyBadgeText}>FLAT 20% OFF</Text>
                </View>
                <Image source={{ uri: med.image }} style={styles.pharmacyCardImg} />
                <View style={styles.pharmacyCardBody}>
                  <Text style={styles.pharmacyCat}>{med.category}</Text>
                  <Text style={styles.pharmacyName} numberOfLines={1}>{med.name}</Text>
                  <Text style={styles.pharmacyBrand}>{med.brand}</Text>

                  <View style={styles.pharmacyPriceRow}>
                    <Text style={styles.pharmacyPrice}>₹{med.price}</Text>
                    <Text style={styles.pharmacyMrp}>MRP ₹{med.mrp}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => handleAddToCart(med)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="cart-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ============================================================
            5. PATIENT FEEDBACK & REVIEWS
        ============================================================ */}
        <View style={styles.reviewsSectionWrap}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>Trusted by 50,000+ Happy Patients</Text>
            <Text style={styles.reviewsSub}>
              Real healthcare reviews from patients across Mysore & Bangalore
            </Text>
          </View>

          <View style={styles.reviewsGrid}>
            {TESTIMONIALS.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={15} color="#F59E0B" />
                  ))}
                  <Text style={styles.reviewDateText}>{rev.date}</Text>
                </View>
                <Text style={styles.reviewContent}>"{rev.comment}"</Text>
                <View style={styles.reviewerInfo}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerAvatarLetter}>{rev.name[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewerFullName}>{rev.name}</Text>
                    <Text style={styles.reviewerCity}>{rev.locality}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ============================================================
            6. MOBILE APP PROMO BANNER
        ============================================================ */}
        <View style={styles.appBannerSection}>
          <View style={styles.appBannerInner}>
            <View style={styles.appBannerLeft}>
              <View style={styles.appBadgePill}>
                <Ionicons name="phone-portrait" size={14} color="#38BDF8" />
                <Text style={styles.appBadgePillText}>Available on iOS & Android</Text>
              </View>
              <Text style={styles.appBannerTitle}>Healthcare In Your Pocket</Text>
              <Text style={styles.appBannerDesc}>
                Track live medicine delivery riders on map, consult clinicians via 1-tap video, and access encrypted diagnostic lab records anytime on your mobile device.
              </Text>
              <View style={styles.storeBadgesRow}>
                <View style={styles.storeBadge}>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <View>
                    <Text style={styles.storeMini}>Download on the</Text>
                    <Text style={styles.storeName}>Apple App Store</Text>
                  </View>
                </View>
                <View style={styles.storeBadge}>
                  <Ionicons name="logo-google-playstore" size={20} color="#FFFFFF" />
                  <View>
                    <Text style={styles.storeMini}>Get it on</Text>
                    <Text style={styles.storeName}>Google Play</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.appBannerRight}>
              <View style={styles.appFeatureBox}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                <Text style={styles.appFeatureTitle}>100% Secure & Encrypted</Text>
                <Text style={styles.appFeatureSub}>HIPAA Compliant Health Vault</Text>
              </View>
              <View style={styles.appFeatureBox}>
                <Ionicons name="alarm" size={24} color="#F59E0B" />
                <Text style={styles.appFeatureTitle}>Pill Reminders</Text>
                <Text style={styles.appFeatureSub}>Never miss your daily dose</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 7. ENTERPRISE FOOTER */}
        <WebFooter navigation={navigation} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F2F4', // Flipkart subtle page background
  },
  scrollContent: {
    flexGrow: 1,
  },

  // 1. FLIPKART MULTI-BANNER HERO CAROUSEL
  heroCarouselWrap: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  heroCarouselInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  bannerCard: {
    flex: 1,
    minHeight: 210,
    borderRadius: 14,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
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
    color: '#0071DC',
  },
  bannerMainTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 24,
    marginTop: 10,
    maxWidth: '68%',
    letterSpacing: -0.3,
  },
  bannerPriceText: {
    color: '#0071DC',
  },
  bannerSubTitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginTop: 4,
    maxWidth: '65%',
    fontWeight: '500',
  },
  bannerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    maxWidth: '65%',
  },
  bannerBadgeSale: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bannerAdNotice: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  bannerRightImage: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 135,
    height: 155,
    borderRadius: 12,
    opacity: 0.9,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#00B894',
    borderRadius: 4,
  },

  // 1.8 FEATURED DIGITAL HEALTH: VIDEO CALL & HEALTH INSURANCE
  featuredServicesWrap: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  featuredServicesInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  featuredServiceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    justifyContent: 'space-between',
    minHeight: 185,
  },
  featuredCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  featuredLiveDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  featuredLiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  featuredCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  featuredCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  featuredCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
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
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  featuredCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    height: 38,
  },
  featuredCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // 2. FLIPKART PERSONALIZED CONTAINER: "{userName}, still looking for these?"
  personalizedSectionWrap: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  personalizedContainer: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#EDF4FF', // Flipkart Soft Baby-Blue Container
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  personalizedHeaderRow: {
    marginBottom: 16,
  },
  personalizedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  cardsTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    position: 'relative',
  },
  recommendCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    position: 'relative',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 220,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  recommendDiscountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#00B894',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 2,
  },
  recommendDiscountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  recommendCardImg: {
    width: 105,
    height: 105,
    borderRadius: 8,
    marginTop: 18,
    marginBottom: 8,
  },
  recommendCardInfo: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  recommendItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
    width: '100%',
  },
  recommendItemSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  nextArrowFloatingBtn: {
    position: 'absolute',
    right: -14,
    width: 42,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // 3. "Best quality in healthcare services ->"
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
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  bestQualityArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestQualityGrid: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  doctorDealCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  doctorDealImg: {
    width: '100%',
    height: 160,
    backgroundColor: '#F8FAFC',
  },
  doctorDealContent: {
    padding: 16,
  },
  docDealBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  ratingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  doctorDealName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  doctorDealSpec: {
    fontSize: 13,
    color: '#00B894',
    fontWeight: '600',
    marginTop: 2,
  },
  doctorDealHospital: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  docDealFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  docDealFeeLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  docDealFeePrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  docDealBookBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docDealBookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // LAB DEAL CARDS
  labDealCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  labDealHeader: {
    marginBottom: 10,
  },
  labDealDiscount: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  labDealDiscountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  labDealTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  labDealSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  labDealBody: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  labDealParam: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 10,
  },
  labDealPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  labDealPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  labDealMrp: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  labDealBookBtn: {
    backgroundColor: '#00B894',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labDealBookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 4. PHARMACY ROW
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
    color: '#0F172A',
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  viewStoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  pharmacyCardsRow: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  pharmacyCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  pharmacyBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  pharmacyBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#B45309',
  },
  pharmacyCardImg: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 10,
  },
  pharmacyCardBody: {},
  pharmacyCat: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00B894',
    textTransform: 'uppercase',
  },
  pharmacyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  pharmacyBrand: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pharmacyPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 8,
  },
  pharmacyPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
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
    backgroundColor: '#00B894',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  addToCartButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // 5. REVIEWS
  reviewsSectionWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  reviewsHeader: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 24,
    alignItems: 'center',
  },
  reviewsTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  reviewsSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  reviewsGrid: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  reviewCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  reviewContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  reviewerFullName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewerCity: {
    fontSize: 11,
    color: '#64748B',
  },

  // 6. APP BANNER SECTION
  appBannerSection: {
    backgroundColor: '#0F172A',
    paddingVertical: 50,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  appBannerInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 30,
  },
  appBannerLeft: {
    flex: 2,
    minWidth: 320,
  },
  appBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  appBadgePillText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
  },
  appBannerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  appBannerDesc: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 560,
  },
  storeBadgesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  storeMini: {
    fontSize: 9,
    color: '#94A3B8',
  },
  storeName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appBannerRight: {
    flex: 1,
    minWidth: 280,
    gap: 14,
  },
  appFeatureBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 18,
  },
  appFeatureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 2,
  },
  appFeatureSub: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // MEDIUNIFY HEALTH WALLET CARD
  walletHomeSectionWrap: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  walletHomeCard: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  walletHomeLeft: {
    flex: 2,
    minWidth: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  walletIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  walletHomeInfo: {
    flex: 1,
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  walletHomeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: -0.2,
  },
  walletStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  walletGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  walletStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  walletAmountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 4,
  },
  walletBalanceBig: {
    fontSize: 24,
    fontWeight: '900',
    color: '#065F46',
  },
  walletCoinsBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  walletHomeSub: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
  },
  walletHomeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topUpWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  topUpWalletBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewPassbookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewPassbookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
});

export default HomeScreenWeb;
