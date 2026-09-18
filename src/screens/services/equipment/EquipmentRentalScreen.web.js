import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';
import {
  equipmentCategories,
  equipmentCatalog,
  verifiedVendors,
  initialRentalRequests,
  initialActiveRentals,
} from '../../../data/equipmentRentalData';

const ASYNC_KEY_EQUIPMENT_REQUESTS = '@unnathi_equipment_rental_requests';
const ASYNC_KEY_ACTIVE_RENTALS = '@unnathi_equipment_active_rentals';

const EquipmentRentalScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;
  const isTablet = width >= 768 && width < 992;

  // Scroll Ref and Y Position for auto-scrolling to equipment section
  const homeScrollRef = useRef(null);
  const equipmentListingY = useRef(0);

  // View States: 'HOME' | 'DETAILS' | 'REQUEST_FLOW' | 'MY_RENTALS' | 'RENTAL_REQUESTS' | 'REQUEST_DETAILS' | 'RENTAL_DETAILS'
  const [currentView, setCurrentView] = useState('HOME');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterDuration, setFilterDuration] = useState('all'); // 'all' | 'Daily' | 'Weekly' | 'Monthly'
  const [filterMaxPrice, setFilterMaxPrice] = useState(10000);
  const [filterServiceArea, setFilterServiceArea] = useState('all'); // 'all' | 'Mysuru' | 'Bengaluru'
  const [filterInstallationOnly, setFilterInstallationOnly] = useState(false);

  // Selected Equipment for Details and Request Flow
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // Request Multi-step Flow: Step 1: Duration & Qty, Step 2: Address, Step 3: Review, Step 4: Submitted
  const [flowStep, setFlowStep] = useState(1);
  const [rentalDurationType, setRentalDurationType] = useState('Monthly'); // 'Daily' | 'Weekly' | 'Monthly' | 'Custom'
  const [customDays, setCustomDays] = useState('14');
  const [customStartDate, setCustomStartDate] = useState('Immediate / Next Available');
  const [quantity, setQuantity] = useState(1);

  // Delivery Address Form
  const [deliveryName, setDeliveryName] = useState('Ramesh Kumar');
  const [deliveryPhone, setDeliveryPhone] = useState('+91 98450 12345');
  const [deliveryAddress, setDeliveryAddress] = useState('No. 44, 2nd Cross, Saraswathipuram');
  const [deliveryCity, setDeliveryCity] = useState('Mysuru');
  const [deliveryPincode, setDeliveryPincode] = useState('570009');
  const [deliveryInstructions, setDeliveryInstructions] = useState('Please call 30 minutes before arrival.');
  const [addressErrors, setAddressErrors] = useState({});

  // Newly Created Request
  const [newlyCreatedRequest, setNewlyCreatedRequest] = useState(null);

  // Local & Persistent Data Lists
  const [rentalRequests, setRentalRequests] = useState(initialRentalRequests);
  const [activeRentals, setActiveRentals] = useState(initialActiveRentals);

  // Detail View Selected Objects
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
  const [selectedRentalDetail, setSelectedRentalDetail] = useState(null);

  // Modals
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [activeOfferRequest, setActiveOfferRequest] = useState(null);

  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [extendDuration, setExtendDuration] = useState('1 Month');
  const [extendNote, setExtendNote] = useState('');
  const [targetRentalForExtend, setTargetRentalForExtend] = useState(null);

  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [pickupPreferredWindow, setPickupPreferredWindow] = useState('Morning (10 AM - 1 PM)');
  const [pickupInstructions, setPickupInstructions] = useState('Equipment will be packed with all original accessories.');
  const [targetRentalForPickup, setTargetRentalForPickup] = useState(null);

  // Tabs for My Rentals & Rental Requests
  const [rentalRequestsFilterTab, setRentalRequestsFilterTab] = useState('All'); // 'All' | 'In Progress' | 'Confirmed' | 'Completed'
  const [myRentalsFilterTab, setMyRentalsFilterTab] = useState('Active'); // 'Active' | 'Pending' | 'Completed'

  // Load persistent requests & rentals on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedReqs = await AsyncStorage.getItem(ASYNC_KEY_EQUIPMENT_REQUESTS);
        if (storedReqs) {
          const parsed = JSON.parse(storedReqs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = [...parsed];
            initialRentalRequests.forEach((item) => {
              if (!merged.some((m) => m.id === item.id)) {
                merged.push(item);
              }
            });
            setRentalRequests(merged);
          }
        }

        const storedRentals = await AsyncStorage.getItem(ASYNC_KEY_ACTIVE_RENTALS);
        if (storedRentals) {
          const parsedRentals = JSON.parse(storedRentals);
          if (Array.isArray(parsedRentals) && parsedRentals.length > 0) {
            const mergedRentals = [...parsedRentals];
            initialActiveRentals.forEach((item) => {
              if (!mergedRentals.some((m) => m.id === item.id)) {
                mergedRentals.push(item);
              }
            });
            setActiveRentals(mergedRentals);
          }
        }
      } catch (e) {
        console.log('Error reading stored equipment rentals:', e);
      }
    };
    loadStoredData();
  }, []);

  const saveRequests = async (updated) => {
    try {
      await AsyncStorage.setItem(ASYNC_KEY_EQUIPMENT_REQUESTS, JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving requests:', e);
    }
  };

  const saveActiveRentals = async (updated) => {
    try {
      await AsyncStorage.setItem(ASYNC_KEY_ACTIVE_RENTALS, JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving active rentals:', e);
    }
  };

  // Filtered equipment list
  const filteredEquipment = useMemo(() => {
    return equipmentCatalog.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Duration filter
      if (filterDuration === 'Daily' && !item.rentalPrices.daily) return false;
      if (filterDuration === 'Weekly' && !item.rentalPrices.weekly) return false;
      if (filterDuration === 'Monthly' && !item.rentalPrices.monthly) return false;

      // Price filter (monthly rate)
      if (item.rentalPrices.monthly > filterMaxPrice) return false;

      // Installation filter
      if (filterInstallationOnly && !item.installationIncluded) return false;

      // Service area filter
      if (filterServiceArea === 'Mysuru' && !item.serviceArea.toLowerCase().includes('mysuru')) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = item.categoryLabel.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesArea = item.serviceArea.toLowerCase().includes(q);
        const matchesPartner = item.verifiedPartner?.name.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesDesc && !matchesArea && !matchesPartner) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, filterDuration, filterMaxPrice, filterInstallationOnly, filterServiceArea, searchQuery]);

  // Pricing calculations
  const calculateEstimatedPricing = (equip, durType, qty, cDays) => {
    if (!equip) return { rentalRate: 0, deposit: 0, delivery: 0, total: 0, durationLabel: '' };

    let unitRate = equip.rentalPrices.monthly;
    let durationLabel = '1 Month';

    if (durType === 'Daily') {
      unitRate = equip.rentalPrices.daily;
      durationLabel = '1 Day';
    } else if (durType === 'Weekly') {
      unitRate = equip.rentalPrices.weekly;
      durationLabel = '1 Week (7 Days)';
    } else if (durType === 'Monthly') {
      unitRate = equip.rentalPrices.monthly;
      durationLabel = '1 Month (30 Days)';
    } else if (durType === 'Custom') {
      const daysCount = parseInt(cDays, 10) || 14;
      unitRate = Math.round(equip.rentalPrices.daily * daysCount * 0.85); // 15% custom duration discount
      durationLabel = `${daysCount} Days (Custom)`;
    }

    const totalRent = unitRate * qty;
    const deposit = equip.deposit * qty;
    const delivery = equip.deliveryCharge;
    const total = totalRent + deposit + delivery;

    return {
      rentalRate: totalRent,
      deposit,
      delivery,
      total,
      durationLabel,
    };
  };

  // Open Details Screen
  const handleOpenEquipmentDetails = (item) => {
    setSelectedEquipment(item);
    setCurrentView('DETAILS');
  };

  // Select Category & Auto-scroll down to equipment results on mobile & web
  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setTimeout(() => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const el = document.getElementById('equipment-listing-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      if (homeScrollRef.current && equipmentListingY.current > 0) {
        homeScrollRef.current.scrollTo({
          y: Math.max(0, equipmentListingY.current - 12),
          animated: true,
        });
      }
    }, 100);
  };

  // Start Request Flow
  const handleStartRentalRequest = (item) => {
    setSelectedEquipment(item);
    setFlowStep(1);
    setRentalDurationType('Monthly');
    setQuantity(1);
    setCurrentView('REQUEST_FLOW');
  };

  // Quantity Stepper
  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, Math.min(5, prev + delta)));
  };

  // Proceed from Step 1 to Step 2
  const handleProceedToAddress = () => {
    setFlowStep(2);
  };

  // Validate and proceed from Step 2 to Step 3
  const handleProceedToReview = () => {
    const errors = {};
    if (!deliveryName.trim()) errors.name = 'Patient or contact name is required';
    if (!deliveryPhone.trim() || deliveryPhone.trim().length < 8) errors.phone = 'Valid 10-digit phone number required';
    if (!deliveryAddress.trim()) errors.address = 'Street address & flat/house number required';
    if (!deliveryCity.trim()) errors.city = 'City is required';
    if (!deliveryPincode.trim() || deliveryPincode.trim().length < 6) errors.pincode = 'Valid 6-digit postal code required';

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      showAlert('Incomplete Details', 'Please fill in all required delivery address fields.');
      return;
    }

    setAddressErrors({});
    setFlowStep(3);
  };

  // Submit Rental Request (Step 3 -> Step 4)
  const handleSubmitRentalRequest = () => {
    if (!selectedEquipment) return;

    const pricing = calculateEstimatedPricing(selectedEquipment, rentalDurationType, quantity, customDays);
    const newId = `ER-2026-${Math.floor(10000 + Math.random() * 90000).toString().slice(0, 5)}`;
    const nowStr = 'Just now';

    const newReq = {
      id: newId,
      requestDate: nowStr,
      equipmentId: selectedEquipment.id,
      equipmentName: selectedEquipment.name,
      equipmentImage: selectedEquipment.image,
      category: selectedEquipment.category,
      quantity,
      rentalDurationType,
      durationLabel: pricing.durationLabel,
      rentalPrice: pricing.rentalRate,
      deposit: pricing.deposit,
      deliveryCharge: pricing.delivery,
      installationIncluded: selectedEquipment.installationIncluded,
      estimatedTotal: pricing.total,
      deliveryAddress: {
        name: deliveryName,
        contactNumber: deliveryPhone,
        address: deliveryAddress,
        city: deliveryCity,
        pincode: deliveryPincode,
        instructions: deliveryInstructions || 'None specified',
      },
      status: 'Request Received',
      statusStageIndex: 0,
      verifiedPartner: selectedEquipment.verifiedPartner,
      careTeamNote: `MediUnify care coordinator is checking real-time availability with ${selectedEquipment.verifiedPartner?.name || 'verified partner'}.`,
      timeline: [
        { stage: 'Rental Request Submitted', completed: true, timestamp: 'Just now' },
        { stage: 'Equipment Availability Confirmed', completed: false, timestamp: 'Partner availability check in progress' },
        { stage: 'Rental Confirmed', completed: false, timestamp: 'Awaiting patient confirmation' },
        { stage: 'Delivery Scheduled', completed: false, timestamp: 'Logistics coordination' },
        { stage: 'Delivered', completed: false, timestamp: 'Pending delivery' },
        { stage: 'Installation Completed', completed: false, timestamp: 'Technician setup' },
        { stage: 'Active Rental', completed: false, timestamp: 'Ongoing rental' },
        { stage: 'Pickup Requested', completed: false, timestamp: 'Post rental duration' },
        { stage: 'Returned', completed: false, timestamp: 'Return verification' },
      ],
    };

    const updated = [newReq, ...rentalRequests];
    setRentalRequests(updated);
    saveRequests(updated);
    setNewlyCreatedRequest(newReq);
    setFlowStep(4);
  };

  // Open Offer Modal
  const handleOpenRentalOffer = (req) => {
    setActiveOfferRequest(req);
    setOfferModalVisible(true);
  };

  // Confirm Rental Offer
  const handleConfirmRentalOffer = () => {
    if (!activeOfferRequest) return;

    const updated = rentalRequests.map((r) => {
      if (r.id === activeOfferRequest.id) {
        return {
          ...r,
          status: 'Delivery Scheduled',
          statusStageIndex: 3,
          deliveryDetails: {
            scheduledDate: 'Tomorrow, 11:00 AM',
            scheduledWindow: '11:00 AM - 01:00 PM',
            deliveryAgent: 'Kiran Gowda (Verified Partner Logistics)',
            agentPhone: '+91 98451 99882',
            installationStatus: 'Installation & Demo Included',
          },
          careTeamNote: 'Rental confirmed! Logistics partner will deliver and install equipment as scheduled.',
          timeline: r.timeline.map((t, idx) => {
            if (idx <= 3) return { ...t, completed: true, timestamp: idx === 2 ? 'Just now' : idx === 3 ? 'Tomorrow, 11 AM' : t.timestamp };
            return t;
          }),
        };
      }
      return r;
    });

    setRentalRequests(updated);
    saveRequests(updated);
    setOfferModalVisible(false);
    showAlert('Rental Confirmed!', `Your rental for ${activeOfferRequest.equipmentName} has been confirmed. Delivery is scheduled for tomorrow.`);
  };

  // Decline / Modify Offer
  const handleDeclineOffer = () => {
    if (!activeOfferRequest) return;
    const updated = rentalRequests.map((r) => {
      if (r.id === activeOfferRequest.id) {
        return {
          ...r,
          status: 'Cancelled',
          careTeamNote: 'Rental offer declined by patient. Coordinator will contact if alternative equipment required.',
        };
      }
      return r;
    });
    setRentalRequests(updated);
    saveRequests(updated);
    setOfferModalVisible(false);
    showAlert('Offer Declined', 'The rental offer has been declined.');
  };

  // Open Extend Modal
  const handleOpenExtendModal = (rental) => {
    setTargetRentalForExtend(rental);
    setExtendDuration('1 Month');
    setExtendNote('');
    setExtendModalVisible(true);
  };

  // Submit Extension Request
  const handleSubmitExtensionRequest = () => {
    if (!targetRentalForExtend) return;

    const updated = activeRentals.map((item) => {
      if (item.id === targetRentalForExtend.id) {
        return {
          ...item,
          isExtensionRequested: true,
          extensionDetails: {
            requestedDuration: extendDuration,
            note: extendNote || 'Standard extension request',
            requestedAt: 'Just now',
            status: 'Pending Coordinator Review',
          },
        };
      }
      return item;
    });

    setActiveRentals(updated);
    saveActiveRentals(updated);
    setExtendModalVisible(false);
    showAlert('Extension Request Submitted', 'Your extension request will be reviewed and confirmed by MediUnify.');
  };

  // Open Pickup Modal
  const handleOpenPickupModal = (rental) => {
    setTargetRentalForPickup(rental);
    setPickupPreferredWindow('Morning (10 AM - 1 PM)');
    setPickupInstructions('Equipment is deflated/packed with all cables and accessories.');
    setPickupModalVisible(true);
  };

  // Submit Pickup Request
  const handleSubmitPickupRequest = () => {
    if (!targetRentalForPickup) return;

    const updated = activeRentals.map((item) => {
      if (item.id === targetRentalForPickup.id) {
        return {
          ...item,
          status: 'Pickup Requested',
          isPickupRequested: true,
          pickupDetails: {
            requestedDate: 'Just now',
            preferredPickupWindow: pickupPreferredWindow,
            pickupAddress: item.deliveryAddress,
            instructions: pickupInstructions,
            returnStatus: 'Pickup Requested',
            returnTimeline: [
              { stage: 'Pickup Requested', completed: true, timestamp: 'Just now' },
              { stage: 'Pickup Scheduled', completed: false, timestamp: 'Partner logistics assigning van' },
              { stage: 'Equipment Collected', completed: false, timestamp: 'Doorstep pickup' },
              { stage: 'Equipment Inspection', completed: false, timestamp: 'Sanitization & check' },
              { stage: 'Rental Completed', completed: false, timestamp: 'Deposit refund initiated' },
            ],
          },
        };
      }
      return item;
    });

    setActiveRentals(updated);
    saveActiveRentals(updated);
    setPickupModalVisible(false);
    showAlert('Pickup Request Submitted', 'MediUnify will coordinate pickup with the equipment partner.');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setFilterDuration('all');
    setFilterMaxPrice(10000);
    setFilterServiceArea('all');
    setFilterInstallationOnly(false);
    setSearchQuery('');
    setFilterModalVisible(false);
  };

  // ==========================================================
  // VIEW: 1. HOME / BROWSE SCREEN
  // ==========================================================
  const renderHomeView = () => {
    const popularList = equipmentCatalog.filter((item) => item.popular);
    const featuredList = equipmentCatalog.filter((item) => item.featured);

    return (
      <ScrollView
        ref={homeScrollRef}
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Header Row */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              if (navigation?.canGoBack()) navigation.goBack();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mainScreenTitle}>Equipment Rental</Text>
            <Text style={styles.mainScreenSubtitle}>
              Rent healthcare equipment from verified partners
            </Text>
          </View>
        </View>

        {/* Quick Navigation Segmented Tabs */}
        <View style={styles.segmentNavContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, currentView === 'HOME' && styles.segmentBtnActive]}
            onPress={() => setCurrentView('HOME')}
          >
            <Ionicons
              name="grid"
              size={14}
              color={currentView === 'HOME' ? '#00B894' : '#64748B'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                currentView === 'HOME' && styles.segmentBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {isDesktopWeb ? 'Browse Equipment' : 'Browse'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, currentView === 'MY_RENTALS' && styles.segmentBtnActive]}
            onPress={() => setCurrentView('MY_RENTALS')}
          >
            <Ionicons
              name="cube"
              size={14}
              color={currentView === 'MY_RENTALS' ? '#00B894' : '#64748B'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                currentView === 'MY_RENTALS' && styles.segmentBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {isDesktopWeb ? `My Rentals (${activeRentals.length})` : `Rentals (${activeRentals.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              currentView === 'RENTAL_REQUESTS' && styles.segmentBtnActive,
            ]}
            onPress={() => setCurrentView('RENTAL_REQUESTS')}
          >
            <Ionicons
              name="clipboard"
              size={14}
              color={currentView === 'RENTAL_REQUESTS' ? '#00B894' : '#64748B'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                currentView === 'RENTAL_REQUESTS' && styles.segmentBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {isDesktopWeb ? `Requests (${rentalRequests.length})` : `Requests (${rentalRequests.length})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Marketplace & Care Coordination Banner */}
        <View style={styles.marketplaceBanner}>
          <View style={styles.marketplaceIconWrap}>
            <Ionicons name="shield-checkmark" size={22} color="#00B894" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.marketplaceTitle}>
              Verified Partner Fulfilment Model
            </Text>
            <Text style={styles.marketplaceDesc}>
              MediUnify coordinates your rental request with verified biomedical partners. Equipment is thoroughly sterilized, delivered, and installed at your doorstep.
            </Text>
          </View>
        </View>

        {/* Search Bar & Filter Button */}
        <View style={styles.searchFilterRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={19} color="#64748B" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search healthcare equipment (bed, oxygen, wheelchair...)"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.filterTriggerBtn,
              (selectedCategory !== 'all' || filterDuration !== 'all' || filterInstallationOnly) && styles.filterTriggerBtnActive,
            ]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons
              name="options-outline"
              size={19}
              color={
                selectedCategory !== 'all' || filterDuration !== 'all' || filterInstallationOnly
                  ? '#FFFFFF'
                  : '#0F172A'
              }
            />
            <Text
              style={[
                styles.filterTriggerText,
                (selectedCategory !== 'all' || filterDuration !== 'all' || filterInstallationOnly) && styles.filterTriggerTextActive,
              ]}
            >
              Filters
            </Text>
          </TouchableOpacity>
        </View>

        {/* Equipment Categories (Section 2) */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Equipment Categories</Text>
            <Text style={styles.sectionSub}>All categories are available from verified MediUnify partners</Text>
          </View>
          {selectedCategory !== 'all' && (
            <TouchableOpacity onPress={() => handleSelectCategory('all')}>
              <Text style={styles.clearFilterLink}>Show All ({equipmentCatalog.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Cards Grid (All 10 Categories 100% Visible - No Cutoff!) */}
        <View style={styles.categoryCardsGrid}>
          {equipmentCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = cat.id === 'all' ? equipmentCatalog.length : equipmentCatalog.filter(e => e.category === cat.id).length;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCardTile,
                  isDesktopWeb ? styles.categoryCardTileDesktop : isTablet ? styles.categoryCardTileTablet : styles.categoryCardTileMobile,
                  isSelected && styles.categoryCardTileActive,
                ]}
                onPress={() => handleSelectCategory(cat.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryCardIconBox, isSelected && styles.categoryCardIconBoxActive]}>
                  <Text style={styles.categoryCardEmoji}>{cat.emoji}</Text>
                </View>
                <View style={styles.categoryCardTextBox}>
                  <Text
                    style={[styles.categoryCardTitle, isSelected && styles.categoryCardTitleActive]}
                    numberOfLines={2}
                  >
                    {cat.label}
                  </Text>
                  <Text style={[styles.categoryCardCount, isSelected && styles.categoryCardCountActive]}>
                    {count} Item{count !== 1 ? 's' : ''}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.categoryActiveCheck}>
                    <Ionicons name="checkmark-circle" size={14} color="#00B894" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Category Filter Tag Banner */}
        {selectedCategory !== 'all' && (
          <View style={styles.activeCategoryBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: 6 }}>
                {equipmentCategories.find((c) => c.id === selectedCategory)?.emoji}
              </Text>
              <Text style={styles.activeCategoryBannerText}>
                Filtering by: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{equipmentCategories.find((c) => c.id === selectedCategory)?.label}</Text> ({filteredEquipment.length} items)
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleSelectCategory('all')} style={styles.clearCategoryPillBtn}>
              <Text style={styles.clearCategoryPillBtnText}>✕ Show All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Popular Equipment (when no active search/category filter) */}
        {selectedCategory === 'all' && !searchQuery.trim() && (
          <View style={styles.popularSectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Popular Equipment</Text>
                <Text style={styles.sectionSub}>Most requested home healthcare equipment</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 2, gap: 12 }}
            >
              {popularList.map((item) => (
                <View key={`pop-${item.id}`} style={styles.popularCardItem}>
                  <Image source={{ uri: item.image }} style={styles.popularCardImg} />
                  <View style={styles.popularCardBadge}>
                    <Ionicons name="flame" size={11} color="#EA580C" />
                    <Text style={styles.popularCardBadgeText}>Popular</Text>
                  </View>
                  <View style={{ padding: 12, flex: 1, justifyContent: 'space-between' }}>
                    <View>
                      <Text style={styles.popularCardCategory}>{item.categoryLabel}</Text>
                      <Text style={styles.popularCardName} numberOfLines={2}>{item.name}</Text>
                    </View>
                    <View style={styles.popularCardPriceRow}>
                      <View>
                        <Text style={styles.popularPriceVal}>₹{item.rentalPrices.monthly.toLocaleString()}</Text>
                        <Text style={styles.popularPriceUnit}>/ month</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.popularViewBtn}
                        onPress={() => handleOpenEquipmentDetails(item)}
                      >
                        <Text style={styles.popularViewBtnText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Equipment Listing (Section 4) with onLayout & nativeID for smooth scroll target on web & mobile */}
        <View
          nativeID="equipment-listing-section"
          id="equipment-listing-section"
          style={styles.sectionHeaderRow}
          onLayout={(e) => {
            equipmentListingY.current = e.nativeEvent.layout.y;
          }}
        >
          <View>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'All Equipment' : `${equipmentCategories.find((c) => c.id === selectedCategory)?.label || 'Equipment'}`}
            </Text>
            <Text style={styles.sectionSub}>
              Showing {filteredEquipment.length} verified healthcare items
            </Text>
          </View>
        </View>

        {/* Empty State when no results */}
        {filteredEquipment.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Ionicons name="search-outline" size={54} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>No equipment found</Text>
            <Text style={styles.emptyStateDesc}>
              No healthcare equipment matched "{searchQuery}" in the selected filters.
            </Text>
            <TouchableOpacity style={styles.emptyStateBtn} onPress={handleResetFilters}>
              <Text style={styles.emptyStateBtnText}>Clear Search & Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={isDesktopWeb ? styles.equipmentGridWeb : styles.equipmentListMobile}>
            {filteredEquipment.map((item) => (
              <View key={item.id} style={isDesktopWeb ? styles.equipmentCardWeb : styles.equipmentCardMobile}>
                {/* Equipment Image & Partner Badge */}
                <View style={styles.cardImageWrap}>
                  <Image source={{ uri: item.image }} style={styles.cardImg} resizeMode="cover" />
                  <View style={styles.verifiedPartnerBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#059669" />
                    <Text style={styles.verifiedPartnerBadgeText}>Verified Partner</Text>
                  </View>
                  <View style={styles.availabilityTag}>
                    <View style={styles.availDot} />
                    <Text style={styles.availabilityTagText}>{item.availability}</Text>
                  </View>
                </View>

                {/* Content */}
                <View style={styles.cardBody}>
                  <View style={styles.cardCategoryRow}>
                    <Text style={styles.cardCategoryText}>{item.categoryEmoji} {item.categoryLabel}</Text>
                    <Text style={styles.cardDeliverySpeed}>{item.deliverySpeed}</Text>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.shortDescription}</Text>

                  {/* Pricing and Deposit Summary */}
                  <View style={styles.cardPricingBox}>
                    <View style={styles.priceRowItem}>
                      <Text style={styles.rentalPriceLabel}>Rental</Text>
                      <Text style={styles.rentalPriceVal}>
                        ₹{item.rentalPrices.monthly.toLocaleString()}
                        <Text style={styles.rentalPriceUnit}> / month</Text>
                      </Text>
                    </View>

                    <View style={styles.priceRowItem}>
                      <Text style={styles.depositLabel}>Deposit: </Text>
                      <Text style={styles.depositVal}>₹{item.deposit.toLocaleString()}</Text>
                    </View>

                    <View style={styles.deliveryMetaRow}>
                      <Text style={styles.deliveryMetaText}>
                        🚚 Delivery: ₹{item.deliveryCharge} • 🛠️ Installation: {item.installationIncluded ? 'Included' : 'On Request'}
                      </Text>
                    </View>
                  </View>

                  {/* Partner snippet */}
                  <View style={styles.partnerSnippetRow}>
                    <Ionicons name="business-outline" size={13} color="#64748B" />
                    <Text style={styles.partnerSnippetText} numberOfLines={1}>
                      Supplied by: <Text style={{ fontWeight: '600', color: '#1E3A8A' }}>{item.verifiedPartner?.name}</Text>
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.cardViewDetailsBtn}
                      onPress={() => handleOpenEquipmentDetails(item)}
                    >
                      <Text style={styles.cardViewDetailsText}>View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardRequestBtn}
                      onPress={() => handleStartRentalRequest(item)}
                    >
                      <Text style={styles.cardRequestBtnText}>Request Rental →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Customer Support & Care Notice Card */}
        <View style={styles.supportContactCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="headset-outline" size={24} color="#00B894" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>Need assistance choosing equipment?</Text>
              <Text style={styles.supportDesc}>
                MediUnify care coordinators guide you to choose the right clinical bed, respiratory, or mobility aid.
              </Text>
            </View>
          </View>
          <View style={styles.supportActionRow}>
            <TouchableOpacity
              style={styles.supportCallBtn}
              onPress={() => showAlert('Care Coordinator', 'Calling MediUnify Home Equipment Support at 1800-425-0099...')}
            >
              <Ionicons name="call" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.supportCallText}>Call 1800-425-0099</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isDesktopWeb && <WebFooter />}
      </ScrollView>
    );
  };

  // ==========================================================
  // VIEW: 2. EQUIPMENT DETAILS SCREEN
  // ==========================================================
  const renderDetailsView = () => {
    if (!selectedEquipment) return null;
    const item = selectedEquipment;

    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Header */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentView('HOME')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mainScreenTitle}>Equipment Details</Text>
            <Text style={styles.mainScreenSubtitle}>{item.categoryLabel}</Text>
          </View>
        </View>

        {/* Large Equipment Hero Image */}
        <View style={styles.detailsHeroImageContainer}>
          <Image source={{ uri: item.image }} style={styles.detailsHeroImg} resizeMode="cover" />
          <View style={styles.detailsVerifiedBadge}>
            <Ionicons name="shield-checkmark" size={15} color="#00B894" />
            <Text style={styles.detailsVerifiedText}>Verified MediUnify Partner</Text>
          </View>
        </View>

        {/* Title & Category Info */}
        <View style={styles.detailsHeaderCard}>
          <View style={styles.detailsCategoryRow}>
            <Text style={styles.detailsCategoryPill}>
              {item.categoryEmoji} {item.categoryLabel}
            </Text>
            <View style={styles.detailsAvailabilityBadge}>
              <View style={styles.availDot} />
              <Text style={styles.detailsAvailabilityText}>{item.availability}</Text>
            </View>
          </View>

          <Text style={styles.detailsMainTitle}>{item.name}</Text>
          <Text style={styles.detailsShortDesc}>{item.description}</Text>
        </View>

        {/* Pricing Breakdown Card */}
        <View style={styles.detailsPricingCard}>
          <Text style={styles.detailsSectionHeading}>Rental Pricing</Text>
          <View style={styles.pricingOptionRow}>
            <View style={[styles.pricingTierBox, styles.pricingTierHighlight]}>
              <Text style={styles.pricingTierTitle}>Monthly</Text>
              <Text style={styles.pricingTierPrice}>₹{item.rentalPrices.monthly.toLocaleString()}</Text>
              <Text style={styles.pricingTierSub}>Best Value</Text>
            </View>

            <View style={styles.pricingTierBox}>
              <Text style={styles.pricingTierTitle}>Weekly</Text>
              <Text style={styles.pricingTierPrice}>₹{item.rentalPrices.weekly.toLocaleString()}</Text>
              <Text style={styles.pricingTierSub}>7 Days</Text>
            </View>

            <View style={styles.pricingTierBox}>
              <Text style={styles.pricingTierTitle}>Daily</Text>
              <Text style={styles.pricingTierPrice}>₹{item.rentalPrices.daily.toLocaleString()}</Text>
              <Text style={styles.pricingTierSub}>Per Day</Text>
            </View>
          </View>

          <View style={styles.pricingMetaGrid}>
            <View style={styles.pricingMetaItem}>
              <Ionicons name="lock-closed-outline" size={16} color="#0284C7" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.pricingMetaLabel}>Security Deposit</Text>
                <Text style={styles.pricingMetaVal}>₹{item.deposit.toLocaleString()} (100% Refundable)</Text>
              </View>
            </View>

            <View style={styles.pricingMetaItem}>
              <Ionicons name="car-outline" size={16} color="#00B894" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.pricingMetaLabel}>Delivery Charge</Text>
                <Text style={styles.pricingMetaVal}>₹{item.deliveryCharge} (Doorstep Setup)</Text>
              </View>
            </View>

            <View style={styles.pricingMetaItem}>
              <Ionicons name="build-outline" size={16} color="#D97706" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.pricingMetaLabel}>Installation & Demo</Text>
                <Text style={styles.pricingMetaVal}>
                  {item.installationIncluded ? 'Included at No Extra Cost' : 'Available on request'}
                </Text>
              </View>
            </View>

            <View style={styles.pricingMetaItem}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.pricingMetaLabel}>Service Area</Text>
                <Text style={styles.pricingMetaVal}>{item.serviceArea}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verified Partner Information (Section 7) */}
        <View style={styles.vendorInfoCard}>
          <View style={styles.vendorInfoHeader}>
            <View style={styles.vendorAvatarCircle}>
              <Ionicons name="business" size={24} color="#1E3A8A" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.vendorName}>{item.verifiedPartner?.name}</Text>
                <Ionicons name="checkmark-circle" size={16} color="#00B894" style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.vendorSub}>
                ⭐ {item.verifiedPartner?.rating} • {item.verifiedPartner?.serviceArea}
              </Text>
            </View>
          </View>

          <View style={styles.vendorBadgesRow}>
            {item.verifiedPartner?.badges.map((b, i) => (
              <View key={i} style={styles.vendorBadgeChip}>
                <Text style={styles.vendorBadgeChipText}>✓ {b}</Text>
              </View>
            ))}
          </View>

          <View style={styles.partnerModelNotice}>
            <Ionicons name="information-circle" size={16} color="#0284C7" style={{ marginRight: 6 }} />
            <Text style={styles.partnerModelNoticeText}>
              "Equipment supplied and fulfilled by a verified MediUnify partner. MediUnify coordinates your rental request with verified equipment partners."
            </Text>
          </View>
        </View>

        {/* Key Features */}
        <View style={styles.detailsContentBlock}>
          <Text style={styles.detailsSectionHeading}>Clinical Features</Text>
          {item.features.map((feat, idx) => (
            <View key={idx} style={styles.featureBulletRow}>
              <Ionicons name="checkmark-circle-outline" size={17} color="#00B894" style={{ marginTop: 2, marginRight: 8 }} />
              <Text style={styles.featureBulletText}>{feat}</Text>
            </View>
          ))}
        </View>

        {/* Specifications Table */}
        <View style={styles.detailsContentBlock}>
          <Text style={styles.detailsSectionHeading}>Technical Specifications</Text>
          {Object.entries(item.specifications).map(([key, val], idx) => (
            <View key={idx} style={styles.specTableRow}>
              <Text style={styles.specTableKey}>{key}</Text>
              <Text style={styles.specTableVal}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Rental Terms & Conditions */}
        <View style={styles.detailsContentBlock}>
          <Text style={styles.detailsSectionHeading}>Rental Terms</Text>
          {item.rentalTerms.map((term, idx) => (
            <View key={idx} style={styles.termItemRow}>
              <Ionicons name="shield-outline" size={15} color="#64748B" style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.termItemText}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Sticky Action Bar */}
        <View style={styles.detailsStickyFooter}>
          <View>
            <Text style={styles.footerPriceLabel}>Starting from</Text>
            <Text style={styles.footerPriceVal}>
              ₹{item.rentalPrices.monthly.toLocaleString()}
              <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '400' }}> / mo</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={styles.footerPrimaryBtn}
            onPress={() => handleStartRentalRequest(item)}
          >
            <Text style={styles.footerPrimaryBtnText}>Request Rental →</Text>
          </TouchableOpacity>
        </View>

        {isDesktopWeb && <WebFooter />}
      </ScrollView>
    );
  };

  // ==========================================================
  // VIEW: 3. RENTAL REQUEST FLOW (Steps 1, 2, 3, 4)
  // ==========================================================
  const renderRequestFlowView = () => {
    if (!selectedEquipment) return null;
    const item = selectedEquipment;
    const pricing = calculateEstimatedPricing(item, rentalDurationType, quantity, customDays);

    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Header */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              if (flowStep > 1 && flowStep < 4) {
                setFlowStep(flowStep - 1);
              } else {
                setCurrentView('DETAILS');
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mainScreenTitle}>Rental Request</Text>
            <Text style={styles.mainScreenSubtitle}>Step {flowStep} of 3 • {item.name}</Text>
          </View>
        </View>

        {/* Step Progress Pills */}
        <View style={styles.stepProgressRow}>
          {(isDesktopWeb
            ? ['Duration & Quantity', 'Delivery Address', 'Review Request']
            : ['Duration', 'Address', 'Review']
          ).map((sName, idx) => {
            const stepNum = idx + 1;
            const isDone = flowStep > stepNum;
            const isCurr = flowStep === stepNum;
            return (
              <View key={sName} style={[styles.stepPillBox, isCurr && styles.stepPillBoxActive]}>
                <Text style={[styles.stepPillNum, (isDone || isCurr) && styles.stepPillNumActive]}>
                  {isDone ? '✓' : stepNum}
                </Text>
                <Text
                  style={[styles.stepPillLabel, isCurr && styles.stepPillLabelActive]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {sName}
                </Text>
              </View>
            );
          })}
        </View>

        {/* STEP 1: DURATION & QUANTITY */}
        {flowStep === 1 && (
          <View>
            <View style={styles.cardHeaderSnippet}>
              <Image source={{ uri: item.image }} style={styles.snippetImg} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.snippetTitle} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.snippetPartner}>Fulfilled by {item.verifiedPartner?.name}</Text>
              </View>
            </View>

            {/* Rental Duration Options (Section 8) */}
            <View style={styles.formCardBox}>
              <View style={styles.formCardHeader}>
                <Ionicons name="calendar-outline" size={18} color="#00B894" />
                <Text style={styles.formCardTitle}>Select Rental Duration</Text>
              </View>
              <Text style={styles.formCardDesc}>
                Select the expected rental duration. You can easily request an extension later if required.
              </Text>

              <View style={styles.durationOptionsGrid}>
                {[
                  { type: 'Daily', label: 'Daily', rate: item.rentalPrices.daily, unit: '/ day' },
                  { type: 'Weekly', label: 'Weekly', rate: item.rentalPrices.weekly, unit: '/ 7 days' },
                  { type: 'Monthly', label: 'Monthly', rate: item.rentalPrices.monthly, unit: '/ month (Popular)' },
                  { type: 'Custom', label: 'Custom Duration', rate: null, unit: 'Flexible Days' },
                ].map((opt) => {
                  const isSelected = rentalDurationType === opt.type;
                  return (
                    <TouchableOpacity
                      key={opt.type}
                      style={[styles.durationCard, isSelected && styles.durationCardActive]}
                      onPress={() => setRentalDurationType(opt.type)}
                    >
                      <View style={styles.durationRadioCircle}>
                        {isSelected && <View style={styles.durationRadioInner} />}
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.durationCardLabel, isSelected && styles.durationCardLabelActive]}>
                          {opt.label}
                        </Text>
                        {opt.rate && (
                          <Text style={styles.durationCardPrice}>
                            ₹{opt.rate.toLocaleString()} <Text style={{ fontSize: 11, color: '#64748B' }}>{opt.unit}</Text>
                          </Text>
                        )}
                        {!opt.rate && (
                          <Text style={styles.durationCardPrice}>Choose number of days</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* If Custom Duration Selected */}
              {rentalDurationType === 'Custom' && (
                <View style={styles.customDurationSubBox}>
                  <Text style={styles.inputFieldLabel}>Number of Rental Days:</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={customDays}
                    onChangeText={setCustomDays}
                    placeholder="e.g. 14"
                  />
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    Estimated custom rental: ₹{pricing.rentalRate.toLocaleString()} for {customDays} days.
                  </Text>
                </View>
              )}
            </View>

            {/* Quantity Stepper (Section 9) */}
            <View style={styles.formCardBox}>
              <View style={styles.formCardHeader}>
                <Ionicons name="cube-outline" size={18} color="#00B894" />
                <Text style={styles.formCardTitle}>Quantity</Text>
              </View>

              <View style={styles.quantityStepperRow}>
                <TouchableOpacity
                  style={[styles.stepperBtn, quantity <= 1 && styles.stepperBtnDisabled]}
                  onPress={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Ionicons name="remove" size={20} color={quantity <= 1 ? '#CBD5E1' : '#0F172A'} />
                </TouchableOpacity>

                <View style={styles.stepperCountBox}>
                  <Text style={styles.stepperCountText}>{quantity}</Text>
                  <Text style={styles.stepperCountUnit}>Unit{quantity > 1 ? 's' : ''}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.stepperBtn, quantity >= 5 && styles.stepperBtnDisabled]}
                  onPress={() => handleQuantityChange(1)}
                  disabled={quantity >= 5}
                >
                  <Ionicons name="add" size={20} color={quantity >= 5 ? '#CBD5E1' : '#0F172A'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Real-time Estimated Pricing Preview */}
            <View style={styles.estimatedPricingBox}>
              <Text style={styles.estimatedPricingTitle}>Estimated Cost Summary</Text>
              <View style={styles.pricingSummaryLine}>
                <Text style={styles.pricingSummaryLabel}>
                  Rental ({quantity} unit × {pricing.durationLabel})
                </Text>
                <Text style={styles.pricingSummaryVal}>₹{pricing.rentalRate.toLocaleString()}</Text>
              </View>

              <View style={styles.pricingSummaryLine}>
                <Text style={styles.pricingSummaryLabel}>Security Deposit (100% Refundable)</Text>
                <Text style={styles.pricingSummaryVal}>₹{pricing.deposit.toLocaleString()}</Text>
              </View>

              <View style={styles.pricingSummaryLine}>
                <Text style={styles.pricingSummaryLabel}>Doorstep Delivery & Logistics</Text>
                <Text style={styles.pricingSummaryVal}>₹{pricing.delivery}</Text>
              </View>

              <View style={styles.pricingSummaryLine}>
                <Text style={styles.pricingSummaryLabel}>Technician Installation & Demo</Text>
                <Text style={[styles.pricingSummaryVal, { color: '#00B894' }]}>Included</Text>
              </View>

              <View style={styles.dividerThin} />

              <View style={styles.pricingSummaryLineTotal}>
                <Text style={styles.totalPriceLabel}>Estimated Initial Total</Text>
                <Text style={styles.totalPriceVal}>₹{pricing.total.toLocaleString()}</Text>
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity style={styles.flowPrimaryBtn} onPress={handleProceedToAddress}>
              <Text style={styles.flowPrimaryBtnText}>Continue to Delivery Address →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: DELIVERY REQUIREMENTS & ADDRESS (Section 10) */}
        {flowStep === 2 && (
          <View>
            <View style={styles.formCardBox}>
              <View style={styles.formCardHeader}>
                <Ionicons name="location-outline" size={18} color="#00B894" />
                <Text style={styles.formCardTitle}>Delivery Address</Text>
              </View>
              <Text style={styles.formCardDesc}>
                Technician will deliver, inspect, and demonstrate the equipment at this address.
              </Text>

              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Patient / Contact Full Name *</Text>
                <TextInput
                  style={[styles.formInput, addressErrors.name && styles.formInputError]}
                  value={deliveryName}
                  onChangeText={setDeliveryName}
                  placeholder="e.g. Ramesh Kumar"
                />
                {addressErrors.name && <Text style={styles.errorText}>{addressErrors.name}</Text>}
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Phone Number *</Text>
                <TextInput
                  style={[styles.formInput, addressErrors.phone && styles.formInputError]}
                  value={deliveryPhone}
                  onChangeText={setDeliveryPhone}
                  keyboardType="phone-pad"
                  placeholder="e.g. +91 98450 12345"
                />
                {addressErrors.phone && <Text style={styles.errorText}>{addressErrors.phone}</Text>}
              </View>

              {/* Street Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Door / Flat No., Street, Landmark *</Text>
                <TextInput
                  style={[styles.formInput, addressErrors.address && styles.formInputError]}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  multiline
                  numberOfLines={2}
                  placeholder="e.g. No. 44, 2nd Cross, Saraswathipuram"
                />
                {addressErrors.address && <Text style={styles.errorText}>{addressErrors.address}</Text>}
              </View>

              {/* City & Pincode Row */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TextInput
                    style={[styles.formInput, addressErrors.city && styles.formInputError]}
                    value={deliveryCity}
                    onChangeText={setDeliveryCity}
                    placeholder="e.g. Mysuru"
                  />
                  {addressErrors.city && <Text style={styles.errorText}>{addressErrors.city}</Text>}
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Pincode *</Text>
                  <TextInput
                    style={[styles.formInput, addressErrors.pincode && styles.formInputError]}
                    value={deliveryPincode}
                    onChangeText={setDeliveryPincode}
                    keyboardType="numeric"
                    placeholder="e.g. 570009"
                  />
                  {addressErrors.pincode && <Text style={styles.errorText}>{addressErrors.pincode}</Text>}
                </View>
              </View>

              {/* Delivery Instructions */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Delivery Instructions (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={deliveryInstructions}
                  onChangeText={setDeliveryInstructions}
                  placeholder="e.g. 1st floor elevator available, please call before delivery"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={styles.flowSecondaryBtn}
                onPress={() => setFlowStep(1)}
              >
                <Text style={styles.flowSecondaryBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.flowPrimaryBtn, { flex: 2 }]}
                onPress={handleProceedToReview}
              >
                <Text style={styles.flowPrimaryBtnText}>Review Request →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: REVIEW RENTAL REQUEST (Section 12) */}
        {flowStep === 3 && (
          <View>
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewMainTitle}>Review Rental Request</Text>
                <Text style={styles.reviewSubTitle}>
                  Verify all details before submitting your request to MediUnify.
                </Text>
              </View>

              {/* Section: Equipment */}
              <View style={styles.reviewSectionBlock}>
                <View style={styles.reviewSectionHeaderRow}>
                  <Text style={styles.reviewSectionTitle}>Equipment & Quantity</Text>
                  <TouchableOpacity onPress={() => setFlowStep(1)}>
                    <Text style={styles.reviewEditLink}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Equipment</Text>
                  <Text style={styles.reviewVal}>{item.name}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Quantity</Text>
                  <Text style={styles.reviewVal}>{quantity} Unit{quantity > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Rental Duration</Text>
                  <Text style={styles.reviewVal}>{pricing.durationLabel}</Text>
                </View>
              </View>

              {/* Section: Delivery Address */}
              <View style={styles.reviewSectionBlock}>
                <View style={styles.reviewSectionHeaderRow}>
                  <Text style={styles.reviewSectionTitle}>Delivery Address</Text>
                  <TouchableOpacity onPress={() => setFlowStep(2)}>
                    <Text style={styles.reviewEditLink}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Recipient</Text>
                  <Text style={styles.reviewVal}>{deliveryName} ({deliveryPhone})</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Address</Text>
                  <Text style={styles.reviewVal}>{deliveryAddress}, {deliveryCity} - {deliveryPincode}</Text>
                </View>
                {deliveryInstructions ? (
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Note</Text>
                    <Text style={styles.reviewVal}>{deliveryInstructions}</Text>
                  </View>
                ) : null}
              </View>

              {/* Section: Pricing Breakdown */}
              <View style={styles.reviewSectionBlock}>
                <View style={styles.reviewSectionHeaderRow}>
                  <Text style={styles.reviewSectionTitle}>Pricing Summary</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Rental Amount</Text>
                  <Text style={styles.reviewVal}>₹{pricing.rentalRate.toLocaleString()}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Deposit (Refundable)</Text>
                  <Text style={styles.reviewVal}>₹{pricing.deposit.toLocaleString()}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Delivery</Text>
                  <Text style={styles.reviewVal}>₹{pricing.delivery}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Installation</Text>
                  <Text style={[styles.reviewVal, { color: '#00B894' }]}>Included</Text>
                </View>
                <View style={styles.dividerThin} />
                <View style={styles.reviewRowTotal}>
                  <Text style={styles.reviewTotalLabel}>Estimated Total</Text>
                  <Text style={styles.reviewTotalVal}>₹{pricing.total.toLocaleString()}</Text>
                </View>
              </View>

              {/* MediUnify Coordination Disclaimer */}
              <View style={styles.coordinationNoticeBox}>
                <Ionicons name="shield-checkmark" size={18} color="#00B894" style={{ marginRight: 8 }} />
                <Text style={styles.coordinationNoticeText}>
                  "MediUnify coordinates your rental request with verified equipment partners. Payment is settled upon physical doorstep inspection."
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.flowSecondaryBtn}
                onPress={() => setFlowStep(2)}
              >
                <Text style={styles.flowSecondaryBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.flowPrimaryBtn, { flex: 2 }]}
                onPress={handleSubmitRentalRequest}
              >
                <Text style={styles.flowPrimaryBtnText}>Request Rental</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 4: REQUEST SUBMITTED (Section 13) */}
        {flowStep === 4 && newlyCreatedRequest && (
          <View style={styles.submittedCard}>
            <View style={styles.submittedCheckCircle}>
              <Ionicons name="checkmark-circle" size={68} color="#00B894" />
            </View>
            <Text style={styles.submittedTitle}>Rental Request Submitted</Text>
            <Text style={styles.submittedDesc}>
              "Your rental request has been submitted. MediUnify will confirm equipment availability and rental terms with a suitable verified partner."
            </Text>

            <View style={styles.submittedDetailsBox}>
              <View style={styles.submittedRow}>
                <Text style={styles.submittedLabel}>Request ID</Text>
                <Text style={styles.submittedValId}>{newlyCreatedRequest.id}</Text>
              </View>
              <View style={styles.submittedRow}>
                <Text style={styles.submittedLabel}>Status</Text>
                <View style={styles.statusBadgeReceived}>
                  <Text style={styles.statusBadgeReceivedText}>Request Received</Text>
                </View>
              </View>
              <View style={styles.submittedRow}>
                <Text style={styles.submittedLabel}>Equipment</Text>
                <Text style={styles.submittedVal}>{newlyCreatedRequest.equipmentName}</Text>
              </View>
              <View style={styles.submittedRow}>
                <Text style={styles.submittedLabel}>Duration</Text>
                <Text style={styles.submittedVal}>{newlyCreatedRequest.durationLabel}</Text>
              </View>
              <View style={styles.submittedRow}>
                <Text style={styles.submittedLabel}>Delivery Address</Text>
                <Text style={styles.submittedVal} numberOfLines={2}>
                  {newlyCreatedRequest.deliveryAddress.address}, {newlyCreatedRequest.deliveryAddress.city}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.flowSecondaryBtn, { flex: 1 }]}
                onPress={() => setCurrentView('HOME')}
              >
                <Text style={styles.flowSecondaryBtnText}>Browse Equipment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.flowPrimaryBtn, { flex: 1.5 }]}
                onPress={() => {
                  setSelectedRequestDetail(newlyCreatedRequest);
                  setCurrentView('RENTAL_REQUESTS');
                }}
              >
                <Text style={styles.flowPrimaryBtnText}>View Request →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isDesktopWeb && <WebFooter />}
      </ScrollView>
    );
  };

  // ==========================================================
  // VIEW: 4. MY RENTALS SCREEN (Active, Completed, Extensions, Return)
  // ==========================================================
  const renderMyRentalsView = () => {
    const displayedRentals = activeRentals.filter((item) => {
      if (myRentalsFilterTab === 'Active') return item.status === 'Active Rental' || item.status === 'Pickup Requested';
      if (myRentalsFilterTab === 'Completed') return item.status === 'Rental Completed';
      return true;
    });

    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Header */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentView('HOME')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mainScreenTitle}>My Rentals</Text>
            <Text style={styles.mainScreenSubtitle}>Manage active equipment, extensions, and pickups</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabFiltersRow}>
          {['Active', 'Pending', 'Completed'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabFilterBtn, myRentalsFilterTab === tab && styles.tabFilterBtnActive]}
              onPress={() => setMyRentalsFilterTab(tab)}
            >
              <Text style={[styles.tabFilterText, myRentalsFilterTab === tab && styles.tabFilterTextActive]}>
                {tab} Rentals
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List of Rentals */}
        {displayedRentals.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Ionicons name="cube-outline" size={54} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>No Active Rentals</Text>
            <Text style={styles.emptyStateDesc}>You don't have any active equipment rentals currently.</Text>
            <TouchableOpacity style={styles.emptyStateBtn} onPress={() => setCurrentView('HOME')}>
              <Text style={styles.emptyStateBtnText}>Browse Equipment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedRentals.map((rental) => (
            <View key={rental.id} style={styles.rentalActiveCard}>
              <View style={styles.rentalActiveHeader}>
                <Image source={{ uri: rental.equipmentImage }} style={styles.rentalActiveImg} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.rentalStatusBadge}>
                    <Text style={styles.rentalStatusBadgeText}>{rental.status}</Text>
                  </View>
                  <Text style={styles.rentalActiveTitle}>{rental.equipmentName}</Text>
                  <Text style={styles.rentalActiveId}>Rental ID: {rental.rentalId}</Text>
                </View>
              </View>

              <View style={styles.rentalDetailsGrid}>
                <View style={styles.rentalGridItem}>
                  <Text style={styles.rentalGridLabel}>Started</Text>
                  <Text style={styles.rentalGridVal}>{rental.startDate}</Text>
                </View>
                <View style={styles.rentalGridItem}>
                  <Text style={styles.rentalGridLabel}>Expected End</Text>
                  <Text style={styles.rentalGridVal}>{rental.expectedEndDate}</Text>
                </View>
                <View style={styles.rentalGridItem}>
                  <Text style={styles.rentalGridLabel}>Monthly Rent</Text>
                  <Text style={styles.rentalGridVal}>₹{rental.monthlyRent.toLocaleString()}</Text>
                </View>
                <View style={styles.rentalGridItem}>
                  <Text style={styles.rentalGridLabel}>Deposit Held</Text>
                  <Text style={styles.rentalGridVal}>₹{rental.deposit.toLocaleString()}</Text>
                </View>
              </View>

              {/* Extension Notification if requested */}
              {rental.isExtensionRequested && (
                <View style={styles.extensionInfoNotice}>
                  <Ionicons name="time" size={16} color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={styles.extensionInfoText}>
                    Extension Requested: +{rental.extensionDetails?.requestedDuration} (Pending Coordinator Review)
                  </Text>
                </View>
              )}

              {/* Return / Pickup Timeline if requested (Section 21) */}
              {rental.isPickupRequested && rental.pickupDetails && (
                <View style={styles.returnTimelineCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="swap-horizontal" size={16} color="#0284C7" style={{ marginRight: 6 }} />
                    <Text style={styles.returnTimelineTitle}>Return / Pickup Status</Text>
                  </View>
                  {rental.pickupDetails.returnTimeline.map((step, idx) => (
                    <View key={idx} style={styles.timelineRowItem}>
                      <View style={[styles.timelineNode, step.completed && styles.timelineNodeDone]}>
                        <Ionicons
                          name={step.completed ? 'checkmark' : 'ellipse'}
                          size={10}
                          color={step.completed ? '#FFFFFF' : '#94A3B8'}
                        />
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={[styles.timelineStageName, step.completed && styles.timelineStageNameDone]}>
                          {step.stage}
                        </Text>
                        <Text style={styles.timelineStageTime}>{step.timestamp}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Interactive Actions: Extend Rental & Request Pickup (Section 19 & 20) */}
              {!rental.isPickupRequested && (
                <View style={styles.rentalActionsRow}>
                  <TouchableOpacity
                    style={styles.rentalExtendBtn}
                    onPress={() => handleOpenExtendModal(rental)}
                  >
                    <Ionicons name="add-circle-outline" size={15} color="#00B894" style={{ marginRight: 4 }} />
                    <Text style={styles.rentalExtendBtnText}>Extend Rental</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rentalPickupBtn}
                    onPress={() => handleOpenPickupModal(rental)}
                  >
                    <Ionicons name="arrow-undo-outline" size={15} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text style={styles.rentalPickupBtnText}>Request Pickup</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        {isDesktopWeb && <WebFooter />}
      </ScrollView>
    );
  };

  // ==========================================================
  // VIEW: 5. RENTAL REQUESTS SCREEN & TIMELINE (Section 23 & 16)
  // ==========================================================
  const renderRentalRequestsView = () => {
    const displayedRequests = rentalRequests.filter((req) => {
      if (rentalRequestsFilterTab === 'In Progress') return req.status === 'Request Received' || req.status === 'Availability Confirmed';
      if (rentalRequestsFilterTab === 'Confirmed') return req.status === 'Rental Confirmed' || req.status === 'Delivery Scheduled';
      if (rentalRequestsFilterTab === 'Completed') return req.status === 'Delivered' || req.status === 'Active Rental';
      return true;
    });

    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Header */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentView('HOME')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mainScreenTitle}>Rental Requests</Text>
            <Text style={styles.mainScreenSubtitle}>Track real-time coordination with equipment partners</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabFiltersRow}>
          {['All', 'In Progress', 'Confirmed', 'Completed'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabFilterBtn, rentalRequestsFilterTab === tab && styles.tabFilterBtnActive]}
              onPress={() => setRentalRequestsFilterTab(tab)}
            >
              <Text style={[styles.tabFilterText, rentalRequestsFilterTab === tab && styles.tabFilterTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Request Cards List */}
        {displayedRequests.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Ionicons name="clipboard-outline" size={54} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>No Rental Requests</Text>
            <Text style={styles.emptyStateDesc}>You don't have any equipment rental requests in this status.</Text>
            <TouchableOpacity style={styles.emptyStateBtn} onPress={() => setCurrentView('HOME')}>
              <Text style={styles.emptyStateBtnText}>Browse Equipment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedRequests.map((req) => (
            <View key={req.id} style={styles.requestTrackingCard}>
              <View style={styles.requestCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestIdText}>ID: {req.id}</Text>
                  <Text style={styles.requestDateText}>Submitted: {req.requestDate}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadgeUniversal,
                    req.status === 'Availability Confirmed' && styles.statusBadgeOffer,
                    req.status === 'Delivery Scheduled' && styles.statusBadgeDelivery,
                  ]}
                >
                  <Text style={styles.statusBadgeUniversalText}>{req.status}</Text>
                </View>
              </View>

              <View style={styles.requestSnippetBody}>
                <Image source={{ uri: req.equipmentImage }} style={styles.requestSnippetImg} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.requestSnippetTitle}>{req.equipmentName}</Text>
                  <Text style={styles.requestSnippetSub}>
                    Quantity: {req.quantity} • Duration: {req.durationLabel}
                  </Text>
                  <Text style={styles.requestSnippetTotal}>Total: ₹{req.estimatedTotal?.toLocaleString()}</Text>
                </View>
              </View>

              {/* Care coordinator note */}
              {req.careTeamNote && (
                <View style={styles.requestCareNoteBox}>
                  <Ionicons name="information-circle" size={15} color="#0284C7" style={{ marginRight: 6 }} />
                  <Text style={styles.requestCareNoteText}>{req.careTeamNote}</Text>
                </View>
              )}

              {/* Action for Rental Offer / Availability Confirmed (Section 14) */}
              {req.status === 'Availability Confirmed' && (
                <View style={styles.offerActionBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offerActionTitle}>Equipment Available & Ready!</Text>
                    <Text style={styles.offerActionSub}>Verified partner has reserved this item for you.</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.offerConfirmBtn}
                    onPress={() => handleOpenRentalOffer(req)}
                  >
                    <Text style={styles.offerConfirmBtnText}>Review Offer →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Delivery Scheduled Details (Section 17) */}
              {req.status === 'Delivery Scheduled' && req.deliveryDetails && (
                <View style={styles.deliveryScheduledCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="car" size={18} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.deliveryScheduledTitle}>Delivery Scheduled</Text>
                  </View>
                  <Text style={styles.deliveryScheduledDate}>
                    Scheduled Date: <Text style={{ fontWeight: '700' }}>{req.deliveryDetails.scheduledDate}</Text>
                  </Text>
                  <Text style={styles.deliveryScheduledWindow}>
                    Window: {req.deliveryDetails.scheduledWindow}
                  </Text>
                  <Text style={styles.deliveryAgentSnippet}>
                    Agent: {req.deliveryDetails.deliveryAgent} • {req.deliveryDetails.installationStatus}
                  </Text>
                </View>
              )}

              {/* Status Tracking Timeline (Section 16) */}
              <View style={styles.timelineContainer}>
                <Text style={styles.timelineHeading}>Rental Lifecycle</Text>
                {req.timeline?.map((stg, i) => (
                  <View key={i} style={styles.timelineStepRow}>
                    <View style={[styles.timelineBullet, stg.completed && styles.timelineBulletDone]}>
                      {stg.completed ? (
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      ) : (
                        <View style={styles.timelineBulletInactive} />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.timelineStageTitle, stg.completed && styles.timelineStageTitleDone]}>
                        {stg.stage}
                      </Text>
                      <Text style={styles.timelineStageNote}>{stg.timestamp}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        {isDesktopWeb && <WebFooter />}
      </ScrollView>
    );
  };

  // ==========================================================
  // MODALS: Filters, Rental Offer, Extension, Pickup
  // ==========================================================

  // 1. FILTERS MODAL (Section 5)
  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Filter Equipment</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
            {/* Category Filter */}
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.filterChipsRow}>
              {equipmentCategories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.filterChip, selectedCategory === c.id && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(c.id)}
                >
                  <Text style={[styles.filterChipText, selectedCategory === c.id && styles.filterChipTextActive]}>
                    {c.emoji} {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rental Duration Filter */}
            <Text style={styles.filterSectionTitle}>Rental Duration</Text>
            <View style={styles.filterChipsRow}>
              {['all', 'Daily', 'Weekly', 'Monthly'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.filterChip, filterDuration === d && styles.filterChipActive]}
                  onPress={() => setFilterDuration(d)}
                >
                  <Text style={[styles.filterChipText, filterDuration === d && styles.filterChipTextActive]}>
                    {d === 'all' ? 'All Durations' : d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Location / Service Area */}
            <Text style={styles.filterSectionTitle}>Service Area</Text>
            <View style={styles.filterChipsRow}>
              {['all', 'Mysuru', 'Bengaluru'].map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.filterChip, filterServiceArea === loc && styles.filterChipActive]}
                  onPress={() => setFilterServiceArea(loc)}
                >
                  <Text style={[styles.filterChipText, filterServiceArea === loc && styles.filterChipTextActive]}>
                    {loc === 'all' ? 'All Areas' : loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Installation Toggle */}
            <Text style={styles.filterSectionTitle}>Equipment Services</Text>
            <TouchableOpacity
              style={styles.filterToggleRow}
              onPress={() => setFilterInstallationOnly(!filterInstallationOnly)}
            >
              <Ionicons
                name={filterInstallationOnly ? 'checkbox' : 'square-outline'}
                size={20}
                color={filterInstallationOnly ? '#00B894' : '#64748B'}
              />
              <Text style={styles.filterToggleText}>Free Technician Installation Included</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.filterActionButtonsRow}>
            <TouchableOpacity style={styles.filterClearBtn} onPress={handleResetFilters}>
              <Text style={styles.filterClearBtnText}>Clear Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterApplyBtn}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.filterApplyBtnText}>Apply Filters ({filteredEquipment.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // 2. RENTAL OFFER MODAL (Section 14)
  const renderOfferModal = () => {
    if (!activeOfferRequest) return null;
    const req = activeOfferRequest;

    return (
      <Modal
        visible={offerModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.offerModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Rental Offer Available</Text>
                <Text style={styles.modalSubTitle}>ID: {req.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setOfferModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.offerPartnerBanner}>
              <Ionicons name="shield-checkmark" size={24} color="#00B894" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.offerPartnerName}>{req.verifiedPartner?.name}</Text>
                <Text style={styles.offerPartnerSub}>⭐ {req.verifiedPartner?.rating} • Verified MediUnify Partner</Text>
              </View>
            </View>

            <View style={styles.offerSummaryGrid}>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>Equipment</Text>
                <Text style={styles.offerVal}>{req.equipmentName}</Text>
              </View>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>Rental Duration</Text>
                <Text style={styles.offerVal}>{req.durationLabel}</Text>
              </View>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>Rental Rate</Text>
                <Text style={styles.offerVal}>₹{req.rentalPrice?.toLocaleString()}</Text>
              </View>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>Refundable Deposit</Text>
                <Text style={styles.offerVal}>₹{req.deposit?.toLocaleString()}</Text>
              </View>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>Delivery & Setup</Text>
                <Text style={styles.offerVal}>₹{req.deliveryCharge} (Installation Included)</Text>
              </View>
              <View style={styles.dividerThin} />
              <View style={styles.offerRowTotal}>
                <Text style={styles.offerTotalLabel}>Total Initial Payable</Text>
                <Text style={styles.offerTotalVal}>₹{req.estimatedTotal?.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.offerActionsRow}>
              <TouchableOpacity style={styles.offerDeclineBtn} onPress={handleDeclineOffer}>
                <Text style={styles.offerDeclineBtnText}>Decline / Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.offerAcceptBtn} onPress={handleConfirmRentalOffer}>
                <Text style={styles.offerAcceptBtnText}>Confirm Rental</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // 3. EXTEND RENTAL MODAL (Section 19)
  const renderExtendModal = () => (
    <Modal
      visible={extendModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setExtendModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.actionModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Extend Rental Duration</Text>
            <TouchableOpacity onPress={() => setExtendModalVisible(false)}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalBodyDesc}>
            Select the additional duration you wish to extend for {targetRentalForExtend?.equipmentName}.
          </Text>

          <View style={styles.extendDurationChoices}>
            {['1 Week', '1 Month', 'Custom'].map((dur) => (
              <TouchableOpacity
                key={dur}
                style={[styles.extendChoiceBtn, extendDuration === dur && styles.extendChoiceBtnActive]}
                onPress={() => setExtendDuration(dur)}
              >
                <Text style={[styles.extendChoiceText, extendDuration === dur && styles.extendChoiceTextActive]}>
                  {dur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Additional Message (Optional)</Text>
          <TextInput
            style={styles.formInput}
            value={extendNote}
            onChangeText={setExtendNote}
            placeholder="e.g. Doctor advised continuing bed rest for 2 more weeks"
          />

          <View style={styles.modalActionButtons}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setExtendModalVisible(false)}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSubmitExtensionRequest}>
              <Text style={styles.modalSubmitBtnText}>Request Extension</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // 4. PICKUP / RETURN REQUEST MODAL (Section 20)
  const renderPickupModal = () => (
    <Modal
      visible={pickupModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setPickupModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.actionModalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Request Equipment Pickup</Text>
            <TouchableOpacity onPress={() => setPickupModalVisible(false)}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalBodyDesc}>
            MediUnify will coordinate doorstep equipment pickup with our partner logistics team.
          </Text>

          <View style={styles.pickupAddressPreview}>
            <Ionicons name="location" size={16} color="#00B894" style={{ marginRight: 6 }} />
            <Text style={styles.pickupAddressText}>
              Pickup Address: {targetRentalForPickup?.deliveryAddress}
            </Text>
          </View>

          <Text style={styles.inputLabel}>Preferred Pickup Window</Text>
          <View style={styles.extendDurationChoices}>
            {['Morning (10 AM - 1 PM)', 'Afternoon (2 PM - 5 PM)', 'Flexible Timing'].map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.extendChoiceBtn, pickupPreferredWindow === w && styles.extendChoiceBtnActive]}
                onPress={() => setPickupPreferredWindow(w)}
              >
                <Text style={[styles.extendChoiceText, pickupPreferredWindow === w && styles.extendChoiceTextActive]}>
                  {w}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Special Instructions</Text>
          <TextInput
            style={styles.formInput}
            value={pickupInstructions}
            onChangeText={setPickupInstructions}
            placeholder="e.g. Please ring bell, equipment is in ground floor living room"
          />

          <View style={styles.modalActionButtons}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPickupModalVisible(false)}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: '#EF4444' }]} onPress={handleSubmitPickupRequest}>
              <Text style={styles.modalSubmitBtnText}>Request Pickup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {currentView === 'HOME' && renderHomeView()}
      {currentView === 'DETAILS' && renderDetailsView()}
      {currentView === 'REQUEST_FLOW' && renderRequestFlowView()}
      {currentView === 'MY_RENTALS' && renderMyRentalsView()}
      {currentView === 'RENTAL_REQUESTS' && renderRentalRequestsView()}

      {/* Global Modals */}
      {renderFilterModal()}
      {renderOfferModal()}
      {renderExtendModal()}
      {renderPickupModal()}
    </SafeAreaView>
  );
};

// ==========================================================
// STYLES
// ==========================================================
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  desktopContainer: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },

  // Header Bar
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainScreenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  mainScreenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  // Segment Navigation
  segmentNavContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtnActive: {
    backgroundColor: '#E6F9F4',
    borderColor: '#00B894',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  segmentBtnTextActive: {
    color: '#00B894',
    fontWeight: '700',
  },

  // Marketplace Banner
  marketplaceBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
  },
  marketplaceIconWrap: {
    marginTop: 2,
  },
  marketplaceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  marketplaceDesc: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 17,
  },

  // Search & Filter Row
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingHorizontal: 10,
  },
  filterTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
  },
  filterTriggerBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  filterTriggerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 6,
  },
  filterTriggerTextActive: {
    color: '#FFFFFF',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  clearFilterLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B894',
  },

  // Category Cards Grid (All Categories Visible)
  categoryCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 10,
  },
  categoryCardTile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'column',
    alignItems: 'flex-start',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryCardTileDesktop: {
    width: '18.8%', // 5 per row with 10px gap
  },
  categoryCardTileTablet: {
    width: '31%', // 3 per row
  },
  categoryCardTileMobile: {
    width: '48%', // 2 per row
  },
  categoryCardTileActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B894',
  },
  categoryCardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryCardIconBoxActive: {
    backgroundColor: '#DCFCE7',
  },
  categoryCardEmoji: {
    fontSize: 20,
  },
  categoryCardTextBox: {
    width: '100%',
  },
  categoryCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 17,
  },
  categoryCardTitleActive: {
    color: '#15803D',
  },
  categoryCardCount: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  categoryCardCountActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  categoryActiveCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  activeCategoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E6F9F4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 10,
    marginTop: 14,
  },
  activeCategoryBannerText: {
    fontSize: 13,
    color: '#065F46',
  },
  clearCategoryPillBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  clearCategoryPillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Popular Section
  popularSectionWrap: {
    marginTop: 10,
  },
  popularCardItem: {
    width: 200,
    height: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  popularCardImg: {
    width: '100%',
    height: 110,
  },
  popularCardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularCardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
    marginLeft: 3,
  },
  popularCardCategory: {
    fontSize: 11,
    color: '#00B894',
    fontWeight: '600',
  },
  popularCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  popularCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  popularPriceVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  popularPriceUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  popularViewBtn: {
    backgroundColor: '#E6F9F4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  popularViewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },

  // Equipment Listing Cards
  equipmentListMobile: {
    paddingHorizontal: 16,
    gap: 14,
  },
  equipmentGridWeb: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  equipmentCardMobile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  equipmentCardWeb: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardImageWrap: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  verifiedPartnerBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedPartnerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 4,
  },
  availabilityTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 5,
  },
  availabilityTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 14,
  },
  cardCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  cardDeliverySpeed: {
    fontSize: 11,
    color: '#64748B',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 21,
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  cardPricingBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  priceRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rentalPriceLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  rentalPriceVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  rentalPriceUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  depositLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  depositVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  deliveryMetaRow: {
    marginTop: 4,
  },
  deliveryMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  partnerSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  partnerSnippetText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cardViewDetailsBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardViewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardRequestBtn: {
    flex: 1.3,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRequestBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Details Screen
  detailsHeroImageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  detailsHeroImg: {
    width: '100%',
    height: '100%',
  },
  detailsVerifiedBadge: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  detailsVerifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 5,
  },
  detailsHeaderCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailsCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsCategoryPill: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },
  detailsAvailabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailsAvailabilityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  detailsMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 26,
  },
  detailsShortDesc: {
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
    lineHeight: 19,
  },
  detailsPricingCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsSectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  pricingOptionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pricingTierBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  pricingTierHighlight: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  pricingTierTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  pricingTierPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  pricingTierSub: {
    fontSize: 11,
    color: '#00B894',
    fontWeight: '700',
  },
  pricingMetaGrid: {
    marginTop: 14,
    gap: 10,
  },
  pricingMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingMetaLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  pricingMetaVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Vendor Information Card
  vendorInfoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  vendorInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  vendorSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  vendorBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  vendorBadgeChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vendorBadgeChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  partnerModelNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  partnerModelNoticeText: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
    lineHeight: 17,
  },

  // Details Content Blocks
  detailsContentBlock: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureBulletText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    lineHeight: 18,
  },
  specTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specTableKey: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  specTableVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1.2,
    textAlign: 'right',
  },
  termItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  termItemText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 17,
  },
  detailsStickyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 10,
  },
  footerPriceLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  footerPriceVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  footerPrimaryBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  footerPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Request Flow
  stepProgressRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  stepPillBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 0,
  },
  stepPillBoxActive: {
    backgroundColor: '#E6F9F4',
    borderColor: '#00B894',
  },
  stepPillNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginRight: 4,
  },
  stepPillNumActive: {
    backgroundColor: '#00B894',
    color: '#FFFFFF',
  },
  stepPillLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    flexShrink: 1,
  },
  stepPillLabelActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  cardHeaderSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  snippetImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  snippetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  snippetPartner: {
    fontSize: 11,
    color: '#00B894',
    marginTop: 2,
  },
  formCardBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  formCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 6,
  },
  formCardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 17,
  },
  durationOptionsGrid: {
    gap: 8,
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  durationCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B894',
  },
  durationRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00B894',
  },
  durationCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  durationCardLabelActive: {
    color: '#0F172A',
  },
  durationCardPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B894',
    marginTop: 2,
  },
  customDurationSubBox: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  quantityStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperCountBox: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  stepperCountText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepperCountUnit: {
    fontSize: 11,
    color: '#64748B',
  },
  estimatedPricingBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  estimatedPricingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  pricingSummaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pricingSummaryLabel: {
    fontSize: 13,
    color: '#475569',
  },
  pricingSummaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  dividerThin: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  pricingSummaryLineTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalPriceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalPriceVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B894',
  },
  flowPrimaryBtn: {
    backgroundColor: '#00B894',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
  },
  flowPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  flowSecondaryBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginLeft: 16,
    marginTop: 14,
  },
  flowSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },

  // Form Inputs
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  formInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 3,
  },

  // Review Card
  reviewCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewHeader: {
    marginBottom: 12,
  },
  reviewMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  reviewSectionBlock: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  reviewSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewEditLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewLabel: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  reviewVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1.5,
    textAlign: 'right',
  },
  reviewRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  reviewTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B894',
  },
  coordinationNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  coordinationNoticeText: {
    fontSize: 12,
    color: '#15803D',
    flex: 1,
    lineHeight: 17,
  },

  // Submitted Card
  submittedCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  submittedCheckCircle: {
    marginVertical: 10,
  },
  submittedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  submittedDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 19,
  },
  submittedDetailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  submittedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  submittedLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  submittedValId: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  submittedVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  statusBadgeReceived: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeReceivedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },

  // My Rentals Screen
  tabFiltersRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabFilterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabFilterBtnActive: {
    backgroundColor: '#00B894',
  },
  tabFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rentalActiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
  },
  rentalActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rentalActiveImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  rentalStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  rentalStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  rentalActiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rentalActiveId: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  rentalDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    gap: 10,
  },
  rentalGridItem: {
    width: '45%',
  },
  rentalGridLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  rentalGridVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  extensionInfoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  extensionInfoText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
    flex: 1,
  },
  returnTimelineCard: {
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  returnTimelineTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  timelineRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  timelineNode: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineNodeDone: {
    backgroundColor: '#0284C7',
  },
  timelineStageName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  timelineStageNameDone: {
    color: '#0F172A',
    fontWeight: '700',
  },
  timelineStageTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  rentalActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  rentalExtendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E6F9F4',
    borderWidth: 1,
    borderColor: '#00B894',
  },
  rentalExtendBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  rentalPickupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  rentalPickupBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Rental Requests Tracking Screen
  requestTrackingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  requestIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  requestDateText: {
    fontSize: 11,
    color: '#64748B',
  },
  statusBadgeUniversal: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeOffer: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeDelivery: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeUniversalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestSnippetBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  requestSnippetImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  requestSnippetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestSnippetSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  requestSnippetTotal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00B894',
    marginTop: 2,
  },
  requestCareNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  requestCareNoteText: {
    fontSize: 11,
    color: '#0369A1',
    flex: 1,
    lineHeight: 15,
  },
  offerActionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  offerActionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  offerActionSub: {
    fontSize: 11,
    color: '#B45309',
  },
  offerConfirmBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  offerConfirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deliveryScheduledCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  deliveryScheduledTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  deliveryScheduledDate: {
    fontSize: 12,
    color: '#15803D',
  },
  deliveryScheduledWindow: {
    fontSize: 11,
    color: '#15803D',
  },
  deliveryAgentSnippet: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },
  timelineContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timelineHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  timelineStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  timelineBullet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineBulletDone: {
    backgroundColor: '#00B894',
  },
  timelineBulletInactive: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
  },
  timelineStageTitle: {
    fontSize: 11,
    color: '#64748B',
  },
  timelineStageTitleDone: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineStageNote: {
    fontSize: 10,
    color: '#94A3B8',
  },

  // Support Card
  supportContactCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 20,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  supportDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  supportActionRow: {
    marginTop: 10,
  },
  supportCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 8,
    borderRadius: 8,
  },
  supportCallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty State
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptyStateDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  emptyStateBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 14,
  },
  emptyStateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  offerModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 500,
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  actionModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 12,
    color: '#64748B',
  },
  modalBodyDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 17,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  filterChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterToggleText: {
    fontSize: 13,
    color: '#0F172A',
    marginLeft: 8,
  },
  filterActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  filterClearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  filterClearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  filterApplyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#00B894',
    alignItems: 'center',
  },
  filterApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Offer Modal Items
  offerPartnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  offerPartnerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  offerPartnerSub: {
    fontSize: 11,
    color: '#15803D',
  },
  offerSummaryGrid: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  offerLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  offerVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  offerRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  offerTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  offerTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00B894',
  },
  offerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  offerDeclineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  offerDeclineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  offerAcceptBtn: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#00B894',
    alignItems: 'center',
  },
  offerAcceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Extend Duration Choices
  extendDurationChoices: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  extendChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  extendChoiceBtnActive: {
    backgroundColor: '#E6F9F4',
    borderColor: '#00B894',
  },
  extendChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  extendChoiceTextActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  pickupAddressPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  pickupAddressText: {
    fontSize: 11,
    color: '#15803D',
    flex: 1,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#00B894',
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default EquipmentRentalScreen;
