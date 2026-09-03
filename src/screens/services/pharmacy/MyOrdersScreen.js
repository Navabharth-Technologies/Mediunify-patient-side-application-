import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../../theme/colors';
import { useCart } from '../../../context/CartContext';

const TABS = ['All', 'Active', 'Delivered', 'Returns'];

const RETURN_REASONS = [
  {
    id: 'WRONG_ITEM',
    title: 'Wrong Medicine / Product Delivered',
    desc: 'Item received is different from what was ordered',
    icon: 'shuffle-outline',
  },
  {
    id: 'DAMAGED',
    title: 'Damaged Packaging / Broken Seal',
    desc: 'Medicine bottle/strip was opened, leaking, or damaged',
    icon: 'cube-outline',
  },
  {
    id: 'EXPIRED',
    title: 'Expired or Near Expiry Date',
    desc: 'Product is near or past its expiration date',
    icon: 'hourglass-outline',
  },
  {
    id: 'PRESCRIPTION_CHANGE',
    title: 'Doctor Changed Prescription',
    desc: 'Physician revised medications or dosage',
    icon: 'medkit-outline',
  },
  {
    id: 'QUALITY_ISSUE',
    title: 'Quality or Efficacy Issue',
    desc: 'Color, smell, or consistency appears irregular',
    icon: 'alert-circle-outline',
  },
  {
    id: 'NOT_NEEDED',
    title: 'No Longer Needed',
    desc: 'Ordered by mistake or alternative arranged',
    icon: 'close-circle-outline',
  },
  {
    id: 'OTHER',
    title: 'Other Issue',
    desc: 'Any other feedback or concern with the product',
    icon: 'help-circle-outline',
  },
];

const MyOrdersScreen = ({ navigation }) => {
  const { orders, addToCart, requestProductReturn } = useCart();

  const [activeTab, setActiveTab] = useState('All');
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);

  // Return Flow States
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [orderToReturn, setOrderToReturn] = useState(null);
  const [selectedReason, setSelectedReason] = useState(RETURN_REASONS[0].title);
  const [issueDescription, setIssueDescription] = useState('');
  const [selectedReturnItems, setSelectedReturnItems] = useState({});
  const [refundMethod, setRefundMethod] = useState('WALLET'); // WALLET vs SOURCE

  // Filter orders by tab
  const filteredOrders = (orders || []).filter((order) => {
    if (activeTab === 'Active') {
      return order.status === 'Confirmed' || order.status === 'Out for Delivery';
    }
    if (activeTab === 'Delivered') {
      return order.status === 'Delivered';
    }
    if (activeTab === 'Returns') {
      return order.status === 'Return Requested' || order.status === 'Returned';
    }
    return true;
  });

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach((item) => {
      addToCart(
        {
          id: item.id,
          name: item.name,
          brand: item.brand || 'Unnathi Care',
          price: item.price,
          category: item.category || 'Medicines',
        },
        item.quantity || 1
      );
    });

    Alert.alert(
      'Items Added to Cart! 🛒',
      'All items from this order have been added to your basket.',
      [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  // Open Return Modal
  const openReturnModal = (order) => {
    setOrderToReturn(order);
    setSelectedReason(RETURN_REASONS[0].title);
    setIssueDescription('');
    setRefundMethod('WALLET');

    // Default select all items in order
    const initialSelected = {};
    (order.items || []).forEach((item) => {
      initialSelected[item.id] = true;
    });
    setSelectedReturnItems(initialSelected);

    setReturnModalVisible(true);
  };

  // Toggle item selection for return
  const toggleItemForReturn = (itemId) => {
    setSelectedReturnItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Submit Product Return
  const handleSubmitReturn = () => {
    const selectedItemIds = Object.keys(selectedReturnItems).filter(
      (id) => selectedReturnItems[id]
    );

    if (selectedItemIds.length === 0) {
      Alert.alert(
        'Select Items',
        'Please select at least one item from the order to return.'
      );
      return;
    }

    if (!issueDescription.trim() || issueDescription.trim().length < 5) {
      Alert.alert(
        'Provide Issue Details',
        'Please write a brief description of the issue to help our quality & returns team.'
      );
      return;
    }

    const returnedItems = (orderToReturn.items || []).filter((item) =>
      selectedReturnItems[item.id]
    );

    requestProductReturn(orderToReturn.id, {
      reason: selectedReason,
      issueDescription: issueDescription.trim(),
      items: returnedItems,
      refundMethod:
        refundMethod === 'WALLET'
          ? 'Instant MediUnnathi Wallet'
          : 'Original Bank / Payment Source',
      refundAmount: orderToReturn.total,
    });

    setReturnModalVisible(false);

    Alert.alert(
      'Return Request Submitted! 🔄',
      `Your return request for Order #${orderToReturn.id} has been accepted.\n\nDoorstep pickup will be completed within 24-48 hours. Refund of ₹${orderToReturn.total} will be credited to your ${
        refundMethod === 'WALLET' ? 'MediUnnathi Wallet' : 'Original Bank Account'
      } upon inspection.`,
      [{ text: 'Great, Got it!' }]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return '#00B894';
      case 'Out for Delivery':
        return '#0284C7';
      case 'Confirmed':
        return '#E67E22';
      case 'Return Requested':
        return '#8B5CF6';
      case 'Returned':
        return '#64748B';
      default:
        return colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>My Pharmacy Orders</Text>
          <Text style={styles.subtitle}>Track, reorder & return medicines</Text>
        </View>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={22} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={54} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyText}>
              You don't have any {activeTab.toLowerCase()} pharmacy orders at the moment.
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('Pharmacy')}
              activeOpacity={0.85}
            >
              <Ionicons name="medkit-outline" size={18} color={colors.white} />
              <Text style={styles.shopText}>Explore Pharmacy</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const isDelivered = order.status === 'Delivered';
            const isReturnRequested = order.status === 'Return Requested';

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* ORDER TOP HEADER */}
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>#{order.id}</Text>
                    <Text style={styles.date}>{order.date}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(order.status)}18` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(order.status) },
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* RETURN DETAILS BANNER (IF RETURN REQUESTED) */}
                {isReturnRequested && order.returnDetails && (
                  <View style={styles.returnBanner}>
                    <View style={styles.returnBannerHeader}>
                      <Ionicons name="repeat" size={18} color="#7C3AED" />
                      <Text style={styles.returnBannerTitle}>Return in Progress</Text>
                    </View>
                    <Text style={styles.returnReasonText}>
                      Reason: <Text style={{ fontWeight: '700' }}>{order.returnDetails.reason}</Text>
                    </Text>
                    {order.returnDetails.issueDescription ? (
                      <Text style={styles.returnIssueText}>
                        "{order.returnDetails.issueDescription}"
                      </Text>
                    ) : null}
                    <View style={styles.returnMetaRow}>
                      <View style={styles.returnMetaChip}>
                        <Ionicons name="bicycle" size={13} color="#7C3AED" />
                        <Text style={styles.returnMetaChipText}>
                          {order.returnDetails.pickupStatus || 'Pickup Scheduled'}
                        </Text>
                      </View>
                      <View style={styles.returnMetaChip}>
                        <Ionicons name="wallet" size={13} color="#059669" />
                        <Text style={[styles.returnMetaChipText, { color: '#059669' }]}>
                          Refund ₹{order.total}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* PROGRESS BAR TRACKER (FOR ACTIVE/DELIVERED ORDERS) */}
                {!isReturnRequested && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width:
                              order.status === 'Delivered'
                                ? '100%'
                                : order.status === 'Out for Delivery'
                                ? '70%'
                                : '35%',
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.progressStepsRow}>
                      <Text style={styles.stepActive}>Confirmed</Text>
                      <Text
                        style={
                          order.status === 'Out for Delivery' ||
                          order.status === 'Delivered'
                            ? styles.stepActive
                            : styles.stepPending
                        }
                      >
                        Out for Delivery
                      </Text>
                      <Text
                        style={
                          order.status === 'Delivered'
                            ? styles.stepActive
                            : styles.stepPending
                        }
                      >
                        Delivered
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.divider} />

                {/* ITEMS LIST */}
                <Text style={styles.itemsTitle}>
                  Items ({order.items?.length || 0})
                </Text>
                {order.items?.map((item, index) => (
                  <View key={`${order.id}-${index}`} style={styles.itemRow}>
                    <Ionicons name="medical" size={14} color={colors.primary} />
                    <Text style={styles.itemText} numberOfLines={1}>
                      {item.quantity ? `${item.quantity} × ` : ''}
                      {item.name || item}
                    </Text>
                    {item.price ? (
                      <Text style={styles.itemPriceText}>
                        ₹{item.price * (item.quantity || 1)}
                      </Text>
                    ) : null}
                  </View>
                ))}

                <View style={styles.divider} />

                {/* PAYMENT & ADDRESS SUMMARY */}
                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Payment Mode</Text>
                    <Text style={styles.metaValue}>{order.paymentMethod}</Text>
                  </View>
                  <View style={styles.metaColRight}>
                    <Text style={styles.metaLabel}>Total Paid / Due</Text>
                    <Text style={styles.totalValue}>₹{order.total}</Text>
                  </View>
                </View>

                {/* ACTIONS */}
                <View style={styles.actionBtnRow}>
                  {!isReturnRequested && (
                    <TouchableOpacity
                      style={styles.trackBtn}
                      activeOpacity={0.8}
                      onPress={() => setSelectedTrackingOrder(order)}
                    >
                      <Ionicons name="navigate-outline" size={15} color={colors.primary} />
                      <Text style={styles.trackBtnText}>Live Tracker</Text>
                    </TouchableOpacity>
                  )}

                  {/* RETURN BUTTON FOR DELIVERED ORDERS */}
                  {isDelivered && (
                    <TouchableOpacity
                      style={styles.returnBtn}
                      activeOpacity={0.85}
                      onPress={() => openReturnModal(order)}
                    >
                      <Ionicons name="repeat-outline" size={15} color="#DC2626" />
                      <Text style={styles.returnBtnText}>Return Order</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.reorderBtn}
                    activeOpacity={0.8}
                    onPress={() => handleReorder(order)}
                  >
                    <Ionicons name="repeat-outline" size={15} color={colors.white} />
                    <Text style={styles.reorderBtnText}>Re-Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ==========================================
          PRODUCT RETURN MODAL
      ========================================== */}
      <Modal
        visible={returnModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReturnModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Return Products</Text>
                <Text style={styles.modalSubtitle}>
                  Order #{orderToReturn?.id} • Hassle-free pickup
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReturnModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
              {/* SELECT ITEMS TO RETURN */}
              <Text style={styles.returnSectionTitle}>1. Select Items to Return</Text>
              <View style={styles.returnItemsBox}>
                {(orderToReturn?.items || []).map((item) => {
                  const isChecked = !!selectedReturnItems[item.id];
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.returnItemRow,
                        isChecked && styles.returnItemRowSelected,
                      ]}
                      onPress={() => toggleItemForReturn(item.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isChecked ? colors.primary : '#94A3B8'}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.returnItemName}>{item.name}</Text>
                        <Text style={styles.returnItemSub}>
                          Qty: {item.quantity || 1} • Price: ₹{item.price}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SELECT REASON */}
              <Text style={styles.returnSectionTitle}>2. Why are you returning this?</Text>
              <View style={styles.reasonsList}>
                {RETURN_REASONS.map((r) => {
                  const isSelected = selectedReason === r.title;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.reasonCard,
                        isSelected && styles.reasonCardSelected,
                      ]}
                      onPress={() => setSelectedReason(r.title)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={r.icon}
                        size={20}
                        color={isSelected ? colors.primary : '#64748B'}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text
                          style={[
                            styles.reasonTitle,
                            isSelected && { color: colors.primary, fontWeight: '800' },
                          ]}
                        >
                          {r.title}
                        </Text>
                        <Text style={styles.reasonDesc}>{r.desc}</Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isSelected ? colors.primary : '#CBD5E1'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SPECIFIC ISSUE DETAILS */}
              <Text style={styles.returnSectionTitle}>3. Describe the Issue</Text>
              <TextInput
                style={styles.issueInput}
                placeholder="Tell us more details (e.g. seal was broken, wrong strength delivered, expired date printed on strip etc.)..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={issueDescription}
                onChangeText={setIssueDescription}
              />

              {/* REFUND PREFERENCE */}
              <Text style={styles.returnSectionTitle}>4. Refund Preference</Text>
              <View style={styles.refundRow}>
                <TouchableOpacity
                  style={[
                    styles.refundCard,
                    refundMethod === 'WALLET' && styles.refundCardSelected,
                  ]}
                  onPress={() => setRefundMethod('WALLET')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="wallet"
                    size={20}
                    color={refundMethod === 'WALLET' ? colors.primary : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.refundTitle,
                      refundMethod === 'WALLET' && styles.refundTitleSelected,
                    ]}
                  >
                    MediUnnathi Wallet
                  </Text>
                  <Text style={styles.refundSubtitle}>Instant Credit • Use anytime</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.refundCard,
                    refundMethod === 'SOURCE' && styles.refundCardSelected,
                  ]}
                  onPress={() => setRefundMethod('SOURCE')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="card"
                    size={20}
                    color={refundMethod === 'SOURCE' ? colors.primary : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.refundTitle,
                      refundMethod === 'SOURCE' && styles.refundTitleSelected,
                    ]}
                  >
                    Original Payment
                  </Text>
                  <Text style={styles.refundSubtitle}>Bank / UPI (3-5 business days)</Text>
                </TouchableOpacity>
              </View>

              {/* PICKUP ADDRESS NOTICE */}
              <View style={styles.pickupNoticeBox}>
                <Ionicons name="location-outline" size={18} color="#0284C7" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.pickupNoticeTitle}>Doorstep Pickup Address</Text>
                  <Text style={styles.pickupNoticeAddr}>
                    {orderToReturn?.address?.addressLine || 'Your saved delivery address'}
                  </Text>
                  <Text style={styles.pickupNoticeTime}>Free Doorstep Pickup within 24-48 Hours</Text>
                </View>
              </View>

              {/* SUBMIT RETURN BUTTON */}
              <TouchableOpacity
                style={styles.submitReturnBtn}
                onPress={handleSubmitReturn}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                <Text style={styles.submitReturnBtnText}>
                  Confirm & Schedule Return
                </Text>
              </TouchableOpacity>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* LIVE TRACKING MODAL */}
      <Modal
        visible={!!selectedTrackingOrder}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTrackingOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Order #{selectedTrackingOrder?.id}</Text>
                <Text style={styles.modalSubtitle}>
                  Estimated Arrival: 25 - 35 mins
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedTrackingOrder(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {/* RIDER INFO CARD */}
            <View style={styles.riderCard}>
              <View style={styles.riderAvatar}>
                <Ionicons name="person" size={24} color={colors.primary} />
              </View>
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>Delivery Partner: Santosh M.</Text>
                <Text style={styles.riderSub}>Vaccinated • Temperature 98.4°F</Text>
              </View>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Alert.alert('Calling Partner', 'Connecting to delivery partner: 9876543210')}
              >
                <Ionicons name="call" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* TIMELINE */}
            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineDotActive} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitleActive}>Order Placed & Packed</Text>
                  <Text style={styles.timelineTime}>{selectedTrackingOrder?.date}</Text>
                </View>
              </View>

              <View style={styles.timelineLine} />

              <View style={styles.timelineItem}>
                <View style={styles.timelineDotActive} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitleActive}>Out for Delivery</Text>
                  <Text style={styles.timelineTime}>Partner picked up your medicine packet</Text>
                </View>
              </View>

              <View style={styles.timelineLine} />

              <View style={styles.timelineItem}>
                <View style={styles.timelineDotPending} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitlePending}>Arriving at Doorstep</Text>
                  <Text style={styles.timelineTime}>Expected in 25-35 minutes</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setSelectedTrackingOrder(null)}
            >
              <Text style={styles.closeModalBtnText}>Close Tracker</Text>
            </TouchableOpacity>
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  cartButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  content: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  date: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // RETURN BANNER
  returnBanner: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 10,
  },
  returnBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  returnBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7C3AED',
  },
  returnReasonText: {
    fontSize: 12,
    color: '#4B5563',
  },
  returnIssueText: {
    fontSize: 11.5,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  returnMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  returnMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  returnMetaChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },

  progressSection: {
    marginVertical: 6,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepActive: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
  },
  stepPending: {
    fontSize: 10.5,
    color: '#94A3B8',
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 6,
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  itemPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaColRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
  },

  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  trackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.lightTeal,
    gap: 4,
  },
  trackBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.primary,
  },
  returnBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
  },
  returnBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  reorderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.primary,
    gap: 4,
  },
  reorderBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // RETURN MODAL STYLES
  returnSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 14,
    marginBottom: 8,
  },
  returnItemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  returnItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  returnItemRowSelected: {
    backgroundColor: '#F0FDFA',
  },
  returnItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  returnItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  reasonsList: {
    gap: 6,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonCardSelected: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  reasonTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  reasonDesc: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  issueInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1E293B',
    textAlignVertical: 'top',
  },
  refundRow: {
    flexDirection: 'row',
    gap: 8,
  },
  refundCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    textAlign: 'center',
  },
  refundCardSelected: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  refundTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
    textAlign: 'center',
  },
  refundTitleSelected: {
    color: colors.primary,
  },
  refundSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  pickupNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 14,
    alignItems: 'flex-start',
  },
  pickupNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E40AF',
  },
  pickupNoticeAddr: {
    fontSize: 11.5,
    color: '#3B82F6',
    marginTop: 1,
  },
  pickupNoticeTime: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    marginTop: 3,
  },
  submitReturnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 6,
  },
  submitReturnBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // EMPTY STATE
  empty: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  shopText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // RIDER CARD
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riderName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  riderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },

  timeline: {
    paddingHorizontal: 24,
    marginVertical: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  timelineDotPending: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CBD5E1',
  },
  timelineContent: {
    marginLeft: 14,
  },
  timelineTitleActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  timelineTitlePending: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  timelineTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.primary,
    marginLeft: 5,
    marginVertical: 3,
  },

  closeModalBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 10,
  },
  closeModalBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
});

export default MyOrdersScreen;