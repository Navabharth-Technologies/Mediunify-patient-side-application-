import React, { useState } from 'react';
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
import { useCart } from '../../../context/CartContext';
import {
  equipmentCategories,
  medicalEquipments,
  rentalDurations,
} from '../../../data/equipmentData';
import WebFooter from '../../../components/web/WebFooter';

const EquipmentRentalScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;
  const { addToCart } = useCart() || {};

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('1_month'); // Default 1 month

  // Modal State
  const [rentalModalVisible, setRentalModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('No. 45, 3rd Cross, Kuvempunagar, Mysore - 570023');
  const [contactPhone, setContactPhone] = useState('+91 98450 12345');
  const [patientName, setPatientName] = useState('Ramesh (Self)');
  const [deliveryDate, setDeliveryDate] = useState('Today (Express 4-Hour Delivery)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('COD');

  const PAYMENT_METHODS_EQ = [
    { id: 'COD', label: 'Pay on Delivery & Installation', icon: 'cash-outline', color: '#7C3AED' },
    { id: 'UPI', label: 'UPI / Google Pay / PhonePe', icon: 'phone-portrait-outline', color: '#4F46E5' },
    { id: 'CARD', label: 'Credit / Debit Card', icon: 'card-outline', color: '#0369A1' },
    { id: 'NETBANKING', label: 'Net Banking', icon: 'business-outline', color: '#6D28D9' },
    { id: 'EMI', label: 'No Cost EMI (0% for 6/12 months)', icon: 'calendar-outline', color: '#B45309' },
  ];

  // Filtered equipment list
  const filteredEquipments = medicalEquipments.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const getDurationMultiplier = () => {
    const found = rentalDurations.find((d) => d.id === selectedDuration);
    return found ? found.multiplier : 1.0;
  };

  const calculateRentalPrice = (monthlyRate) => {
    const mult = getDurationMultiplier();
    return Math.round(monthlyRate * mult);
  };

  const handleOpenRental = (equip) => {
    setSelectedEquipment(equip);
    setRentalModalVisible(true);
  };

  const handleBuyNow = (equip) => {
    if (addToCart) {
      addToCart({
        id: equip.id,
        name: `${equip.name} (Brand New Purchase)`,
        price: equip.buyPrice,
        mrp: Math.round(equip.buyPrice * 1.15),
        quantity: 1,
        image: equip.image,
      });
    }
    showAlert(
      'Added to Healthcare Cart 🛒',
      `"${equip.name}" has been added to your cart for direct purchase with warranty.`
    );
  };

  const handleConfirmRental = async () => {
    if (!deliveryAddress.trim() || !contactPhone.trim()) {
      showAlert('Required', 'Please enter your delivery address and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = `EQR-${Date.now().toString().slice(-6)}`;
      const rentAmount = calculateRentalPrice(selectedEquipment?.monthlyRent || 4999);
      const deposit = selectedEquipment?.securityDeposit || 3000;
      const totalInitialPayable = rentAmount + deposit;

      const durationObj = rentalDurations.find((d) => d.id === selectedDuration) || rentalDurations[2];

      const newRentalOrder = {
        id: orderId,
        tokenNumber: `EQ-${Math.floor(100 + Math.random() * 900)}`,
        type: 'Medical Equipment Rental',
        serviceType: 'equipment',
        doctor: {
          name: selectedEquipment?.name || 'Medical Equipment',
          specialty: `${durationObj.label} Rental • Deposit: ₹${deposit}`,
          clinicName: 'MediUnify Equipment Hub & BioMedical Center',
          clinicAddress: deliveryAddress.trim(),
          fee: totalInitialPayable,
          image: selectedEquipment?.image,
        },
        equipment: {
          id: selectedEquipment?.id,
          name: selectedEquipment?.name,
          category: selectedEquipment?.category,
          rentalDuration: durationObj.label,
          rentAmount: rentAmount,
          securityDeposit: deposit,
          refundableNotice: 'Deposit 100% refundable upon equipment pickup',
        },
        date: deliveryDate,
        time: 'Technician Delivery & Setup in 4 Hrs',
        status: 'Confirmed',
        paidAmount: totalInitialPayable,
        paymentStatus: selectedPaymentMethod === 'Pay on Delivery / Installation (Cash/Card/UPI)' || selectedPaymentMethod === 'Cash on Delivery (COD)' || selectedPaymentMethod === 'COD'
          ? 'Pay on Delivery & Installation'
          : `Paid Online via ${selectedPaymentMethod}`,
        patient: {
          name: patientName.trim(),
          phone: contactPhone.trim(),
          address: deliveryAddress.trim(),
        },
      };

      // Save to @unnathi_equipment_orders
      const existingJson = await AsyncStorage.getItem('@unnathi_equipment_orders');
      const existingList = existingJson ? JSON.parse(existingJson) : [];
      existingList.unshift(newRentalOrder);
      await AsyncStorage.setItem('@unnathi_equipment_orders', JSON.stringify(existingList));

      // Also save into standard appointments list for cross-screen visibility
      const apptsJson = await AsyncStorage.getItem('@unnathi_appointments');
      const apptsList = apptsJson ? JSON.parse(apptsJson) : [];
      apptsList.unshift(newRentalOrder);
      await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(apptsList));

      setIsSubmitting(false);
      setRentalModalVisible(false);

      showAlert(
        'Equipment Rental Confirmed! 🛏️',
        `Your rental for "${selectedEquipment?.name}" is scheduled for ${deliveryDate}. A biomedical technician will arrive to install and demonstrate operation. Token: ${newRentalOrder.tokenNumber}.`,
        [
          { text: 'View Bookings', onPress: () => navigation?.navigate('Bookings') },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (e) {
      setIsSubmitting(false);
      showAlert('Error', 'Could not save rental order. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Mobile Header */}
      {!isDesktopWeb && (
        <View style={styles.mobileHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.mobileHeaderCenter}>
            <Text style={styles.mobileHeaderTitle}>Equipment Rental</Text>
            <Text style={styles.mobileHeaderSub}>Hospital Beds, Oxygen & Wheelchairs</Text>
          </View>
          <TouchableOpacity
            style={styles.headerCartBtn}
            onPress={() => navigation?.navigate('Cart')}
            activeOpacity={0.75}
          >
            <Ionicons name="cart-outline" size={22} color="#7C3AED" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            HERO BANNER
        ============================================================ */}
        <View style={styles.heroBannerWrap}>
          <View style={[styles.heroBannerContainer, isDesktopWeb && styles.desktopHeroBanner]}>
            <View style={styles.heroLeftCol}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.sanitizedBadge}>
                  <Ionicons name="shield-checkmark" size={13} color="#5B21B6" />
                  <Text style={styles.sanitizedBadgeText}>STERILIZED & HOSPITAL GRADE</Text>
                </View>
                <View style={styles.speedBadge}>
                  <Ionicons name="flash" size={12} color="#D97706" />
                  <Text style={styles.speedBadgeText}>Delivered in 2-4 Hours</Text>
                </View>
              </View>

              <Text style={styles.heroHeading}>
                Hospital-Grade Care.{'\n'}
                <Text style={styles.heroHeadingAccent}>Delivered to Your Home.</Text>
              </Text>

              <Text style={styles.heroSubHeading}>
                Rent or purchase certified ICU electric beds, 10L oxygen concentrators, BiPAP machines, and motorized wheelchairs. Enjoy free doorstep delivery, professional technician demo, and 100% refundable deposits.
              </Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>4 Hours</Text>
                  <Text style={styles.statLbl}>Doorstep Setup</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>Free</Text>
                  <Text style={styles.statLbl}>Technician Demo</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>100%</Text>
                  <Text style={styles.statLbl}>Refundable Deposit</Text>
                </View>
              </View>
            </View>

            {isDesktopWeb && (
              <View style={styles.heroRightCol}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600' }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>
        </View>

        {/* ============================================================
            DURATION SELECTOR ROW
        ============================================================ */}
        <View style={styles.durationSelectorWrap}>
          <View style={[styles.durationContainer, isDesktopWeb && styles.desktopDurationContainer]}>
            <Text style={styles.durationHeading}>Select Rental Duration:</Text>
            <View style={styles.durationsRow}>
              {rentalDurations.map((dur) => {
                const isSelected = selectedDuration === dur.id;
                return (
                  <TouchableOpacity
                    key={dur.id}
                    style={[styles.durBtn, isSelected && styles.durBtnSelected]}
                    onPress={() => setSelectedDuration(dur.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.durBtnText, isSelected && styles.durBtnTextSelected]}>
                      {dur.label}
                    </Text>
                    <View style={[styles.durBadge, isSelected && styles.durBadgeSelected]}>
                      <Text style={[styles.durBadgeText, isSelected && styles.durBadgeTextSelected]}>
                        {dur.badge}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ============================================================
            CATEGORY FILTER CHIPS
        ============================================================ */}
        <View style={styles.categoryChipsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.categoryChipsRow, isDesktopWeb && styles.desktopCategoryChipsRow]}
          >
            {equipmentCategories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={active ? '#FFFFFF' : '#7C3AED'}
                  />
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ============================================================
            EQUIPMENT CARDS GRID
        ============================================================ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all'
                ? 'All Available Equipment'
                : equipmentCategories.find((c) => c.id === selectedCategory)?.label}
            </Text>
            <Text style={styles.sectionSubtitle}>
              Prices dynamically adjusted for your selected duration ({rentalDurations.find((d) => d.id === selectedDuration)?.label})
            </Text>
          </View>

          <View style={[styles.cardsGrid, isDesktopWeb && styles.desktopTwoColGrid]}>
            {filteredEquipments.map((item) => {
              const computedRent = calculateRentalPrice(item.monthlyRent);
              return (
                <View key={item.id} style={styles.equipmentCard}>
                  <View style={styles.equipmentHeaderRow}>
                    <Image source={{ uri: item.image }} style={styles.equipImg} />
                    <View style={styles.equipInfoCol}>
                      <View style={styles.ratingBadgeRow}>
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={12} color="#F59E0B" />
                          <Text style={styles.ratingBadgeText}>{item.rating}</Text>
                        </View>
                        <Text style={styles.reviewsCountText}>({item.reviewsCount} rentals)</Text>
                      </View>
                      <Text style={styles.equipName}>{item.name}</Text>
                      <Text style={styles.equipSub}>{item.subtitle}</Text>
                      <Text style={styles.equipBrand}>Brand: {item.brand}</Text>
                    </View>
                  </View>

                  <View style={styles.equipPillsRow}>
                    <View style={styles.speedPill}>
                      <Ionicons name="time-outline" size={12} color="#059669" />
                      <Text style={styles.speedPillText}>{item.deliverySpeed}</Text>
                    </View>
                    <View style={styles.sanitizedPill}>
                      <Ionicons name="shield-checkmark" size={12} color="#7C3AED" />
                      <Text style={styles.sanitizedPillText}>{item.sanitization}</Text>
                    </View>
                  </View>

                  <View style={styles.featuresList}>
                    {item.features.map((f, i) => (
                      <View key={i} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={14} color="#7C3AED" />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.depositNoticeBox}>
                    <Ionicons name="information-circle-outline" size={14} color="#6D28D9" />
                    <Text style={styles.depositNoticeText}>
                      Refundable Security Deposit: <Text style={{ fontWeight: '800' }}>₹{item.securityDeposit}</Text> (Returned upon pickup)
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.ratesCol}>
                      <Text style={styles.rentLabel}>Rental for Selected Duration</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.rentPrice}>₹{computedRent.toLocaleString('en-IN')}</Text>
                        <Text style={styles.dailyEquiv}>
                          (~₹{item.dailyRent}/day)
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={styles.buyBtn}
                        onPress={() => handleBuyNow(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.buyBtnText}>Buy: ₹{item.buyPrice.toLocaleString('en-IN')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rentBtn}
                        onPress={() => handleOpenRental(item)}
                        activeOpacity={0.88}
                      >
                        <Ionicons name="key-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.rentBtnText}>Rent Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Web Footer */}
        <WebFooter navigation={navigation} />
      </ScrollView>

      {/* ============================================================
          RENTAL BOOKING MODAL
      ============================================================ */}
      <Modal
        visible={rentalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRentalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDesktopWeb && { maxWidth: 520 }]}>
            <View style={styles.modalHeader}>
              <View>
                <View style={styles.confidentialBadgePill}>
                  <Ionicons name="shield-checkmark" size={11} color="#7C3AED" />
                  <Text style={styles.confidentialBadgePillText}>100% SANITIZED & HOSPITAL GRADE</Text>
                </View>
                <Text style={styles.modalTitle}>Book Medical Equipment Rental</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {selectedEquipment?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRentalModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Patient / Recipient Name</Text>
              <TextInput
                style={styles.textInput}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Enter recipient name"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Contact Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                placeholder="+91 98450 12345"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Delivery & Installation Address</Text>
              <TextInput
                style={[styles.textInput, { height: 64 }]}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
                placeholder="Door number, street, area, city, pincode"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Delivery Time Slot</Text>
              <View style={styles.slotPickerRow}>
                {[
                  'Today (Express 4-Hour Delivery)',
                  'Tomorrow Morning (09:00 AM - 12:00 PM)',
                  'Tomorrow Afternoon (02:00 PM - 05:00 PM)',
                ].map((slot, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.slotChip, deliveryDate === slot && styles.slotChipSelected]}
                    onPress={() => setDeliveryDate(slot)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.slotChipText, deliveryDate === slot && styles.slotChipTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pricing Breakdown Card */}
              <View style={styles.modalBreakdownCard}>
                <View style={styles.modalBreakdownRow}>
                  <Text style={styles.breakdownItemLabel}>
                    Rental Charge ({rentalDurations.find((d) => d.id === selectedDuration)?.label}):
                  </Text>
                  <Text style={styles.breakdownItemVal}>
                    ₹{calculateRentalPrice(selectedEquipment?.monthlyRent || 4999).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.modalBreakdownRow}>
                  <Text style={styles.breakdownItemLabel}>Refundable Security Deposit:</Text>
                  <Text style={styles.breakdownItemVal}>
                    ₹{(selectedEquipment?.securityDeposit || 3000).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.modalBreakdownRow}>
                  <Text style={styles.breakdownItemLabel}>Delivery & Technician Demo:</Text>
                  <Text style={[styles.breakdownItemVal, { color: '#059669' }]}>FREE</Text>
                </View>

                <View style={styles.dividerLine} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Payable on Delivery:</Text>
                  <Text style={styles.totalAmount}>
                    ₹{(
                      calculateRentalPrice(selectedEquipment?.monthlyRent || 4999) +
                      (selectedEquipment?.securityDeposit || 3000)
                    ).toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={styles.totalNote}>
                  * Security deposit is 100% returned immediately when equipment is picked up.
                </Text>
              </View>

              {/* PAYMENT METHOD SELECTION */}
              <Text style={styles.inputLabel}>Select Payment Method</Text>
              <View style={styles.paymentMethodsWrap}>
                {PAYMENT_METHODS_EQ.map((pm) => {
                  const isSelected = selectedPaymentMethod === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      style={[
                        styles.paymentMethodRow,
                        isSelected && { borderColor: pm.color, backgroundColor: pm.color + '12' },
                      ]}
                      onPress={() => setSelectedPaymentMethod(pm.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.paymentRadio, isSelected && { borderColor: pm.color }]}>
                        {isSelected && <View style={[styles.paymentRadioDot, { backgroundColor: pm.color }]} />}
                      </View>
                      <Ionicons name={pm.icon} size={18} color={isSelected ? pm.color : '#64748B'} />
                      <Text style={[styles.paymentMethodLabel, isSelected && { color: pm.color, fontWeight: '700' }]}>
                        {pm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.privacyAssuranceBox}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <Text style={styles.privacyAssuranceText}>
                  Bio-cleaned and calibrated to medical standards. Includes free home delivery, expert installation demo, and 24x7 breakdown support.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.confirmBookingBtn}
                onPress={handleConfirmRental}
                activeOpacity={0.88}
                disabled={isSubmitting}
              >
                <Text style={styles.confirmBookingBtnText}>
                  {isSubmitting ? 'Scheduling Delivery...' : 'Confirm Rental Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF5FF',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // MOBILE HEADER
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileHeaderCenter: {
    flex: 1,
    marginLeft: 12,
  },
  mobileHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  mobileHeaderSub: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  headerCartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // HERO BANNER
  heroBannerWrap: {
    backgroundColor: '#4C1D95',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  heroBannerContainer: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  desktopHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 32,
  },
  heroLeftCol: {
    flex: 1,
  },
  heroRightCol: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  sanitizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sanitizedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5B21B6',
  },
  speedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  speedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  heroHeading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  heroHeadingAccent: {
    color: '#DDD6FE',
  },
  heroSubHeading: {
    fontSize: 13.5,
    color: '#EDE9FE',
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 620,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    gap: 16,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#DDD6FE',
  },
  statLbl: {
    fontSize: 10.5,
    color: '#EDE9FE',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // DURATION SELECTOR
  durationSelectorWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  durationContainer: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  desktopDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  durationsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  durBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  durBtnSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7C3AED',
  },
  durBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  durBtnTextSelected: {
    color: '#6D28D9',
    fontWeight: '800',
  },
  durBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durBadgeSelected: {
    backgroundColor: '#7C3AED',
  },
  durBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },
  durBadgeTextSelected: {
    color: '#FFFFFF',
  },

  // CATEGORY CHIPS
  categoryChipsWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
  },
  categoryChipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  desktopCategoryChipsRow: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  categoryChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },

  // SECTION WRAP
  sectionWrap: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },

  // CARDS GRID
  cardsGrid: {
    gap: 16,
  },
  desktopTwoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  // EQUIPMENT CARD
  equipmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 16,
    flex: 1,
    minWidth: 320,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },
  equipmentHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  equipImg: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  equipInfoCol: {
    flex: 1,
  },
  ratingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewsCountText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  equipName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  equipSub: {
    fontSize: 11.5,
    color: '#6D28D9',
    fontWeight: '600',
    marginTop: 2,
  },
  equipBrand: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  equipPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  speedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  speedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  sanitizedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sanitizedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
  },
  featuresList: {
    gap: 5,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  featureText: {
    fontSize: 11.5,
    color: '#334155',
    flex: 1,
    lineHeight: 16,
  },
  depositNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF5FF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 14,
  },
  depositNoticeText: {
    fontSize: 11,
    color: '#5B21B6',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
    flexWrap: 'wrap',
    gap: 10,
  },
  ratesCol: {},
  rentLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  rentPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  dailyEquiv: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  rentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rentBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
    maxWidth: 280,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalForm: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  slotPickerRow: {
    gap: 6,
    marginTop: 4,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotChipSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7C3AED',
  },
  slotChipText: {
    fontSize: 11.5,
    color: '#475569',
  },
  slotChipTextSelected: {
    fontWeight: '800',
    color: '#6D28D9',
  },
  modalBreakdownCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    gap: 6,
  },
  modalBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItemLabel: {
    fontSize: 11.5,
    color: '#475569',
  },
  breakdownItemVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#DDD6FE',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#6D28D9',
  },
  totalNote: {
    fontSize: 9.5,
    color: '#059669',
    marginTop: 2,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
  },
  confirmBookingBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBookingBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confidentialBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  confidentialBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },

  // PAYMENT METHOD STYLES
  paymentMethodsWrap: {
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  paymentRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  paymentMethodLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
});

export default EquipmentRentalScreen;
