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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../theme/colors';
import { useCart } from '../../context/CartContext';

const TABS = ['All', 'Active', 'Delivered'];

const MyOrdersScreen = ({ navigation }) => {
  const { orders, addToCart } = useCart();

  const [activeTab, setActiveTab] = useState('All');
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);

  // Filter orders by tab
  const filteredOrders = (orders || []).filter((order) => {
    if (activeTab === 'Active') {
      return order.status === 'Confirmed' || order.status === 'Out for Delivery';
    }
    if (activeTab === 'Delivered') {
      return order.status === 'Delivered';
    }
    return true;
  });

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        brand: item.brand || 'Unnathi Care',
        price: item.price,
        category: item.category || 'Medicines',
      }, item.quantity || 1);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return '#00B894';
      case 'Out for Delivery':
        return '#0284C7';
      case 'Confirmed':
        return '#E67E22';
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
          <Text style={styles.subtitle}>Track active & past orders</Text>
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
              <Text
                style={[styles.tabText, isActive && styles.tabTextActive]}
              >
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
          filteredOrders.map((order) => (
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

              {/* PROGRESS BAR TRACKER */}
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

              <View style={styles.divider} />

              {/* ITEMS LIST */}
              <Text style={styles.itemsTitle}>
                Items ({order.items?.length || 0})
              </Text>
              {order.items?.map((item, index) => (
                <View key={`${order.id}-${index}`} style={styles.itemRow}>
                  <Ionicons name="medical" size={14} color={colors.primary} />
                  <Text style={styles.itemText} numberOfLines={1}>
                    {item.quantity ? `${item.quantity} × ` : ''}{item.name || item}
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
                <TouchableOpacity
                  style={styles.trackBtn}
                  activeOpacity={0.8}
                  onPress={() => setSelectedTrackingOrder(order)}
                >
                  <Ionicons name="navigate-outline" size={15} color={colors.primary} />
                  <Text style={styles.trackBtnText}>Live Tracker</Text>
                </TouchableOpacity>

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
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

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
                onPress={() => Alert.alert('Calling Partner', 'Connecting to delivery partner...')}
              >
                <Ionicons name="call" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* TIMELINE STEPS */}
            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconActive}>
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Order Received & Confirmed</Text>
                  <Text style={styles.timelineDesc}>Pharmacist verified order items</Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineIconActive}>
                  <Ionicons name="cube-outline" size={14} color={colors.white} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Packed with Safety Seal</Text>
                  <Text style={styles.timelineDesc}>Temperature-controlled medicine bag</Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View
                  style={
                    selectedTrackingOrder?.status === 'Delivered'
                      ? styles.timelineIconActive
                      : styles.timelineIconCurrent
                  }
                >
                  <Ionicons
                    name="bicycle"
                    size={14}
                    color={
                      selectedTrackingOrder?.status === 'Delivered'
                        ? colors.white
                        : colors.primary
                    }
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Out for Delivery</Text>
                  <Text style={styles.timelineDesc}>
                    Rider is on the way to your address
                  </Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View
                  style={
                    selectedTrackingOrder?.status === 'Delivered'
                      ? styles.timelineIconActive
                      : styles.timelineIconPending
                  }
                >
                  <Ionicons
                    name="home-outline"
                    size={14}
                    color={
                      selectedTrackingOrder?.status === 'Delivered'
                        ? colors.white
                        : colors.slate
                    }
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Delivered</Text>
                  <Text style={styles.timelineDesc}>At your doorstep</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeTrackerBtn}
              onPress={() => setSelectedTrackingOrder(null)}
            >
              <Text style={styles.closeTrackerText}>Done</Text>
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
    backgroundColor: '#F4F8FA',
  },
  header: {
    minHeight: 65,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.secondary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 1,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0F4F6',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.slate,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '900',
  },
  content: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.secondary,
  },
  date: {
    marginTop: 2,
    fontSize: 10,
    color: colors.slate,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  progressSection: {
    marginTop: 12,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#E8EEF0',
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
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  stepPending: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.slate,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F6',
    marginVertical: 12,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.secondary,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  itemText: {
    fontSize: 12,
    color: colors.secondary,
    flex: 1,
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaCol: {
    flex: 1,
  },
  metaColRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 10,
    color: colors.slate,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  trackBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E6FAF7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#B3EFE6',
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
  },
  reorderBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.white,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.secondary,
  },
  emptyText: {
    fontSize: 12,
    color: colors.slate,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  shopButton: {
    marginTop: 20,
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shopText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.secondary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  riderCard: {
    backgroundColor: '#F8FAFB',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  riderSub: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 2,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeline: {
    paddingLeft: 6,
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
  },
  timelineIconActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconCurrent: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E6FAF7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  timelineIconPending: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F0F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  timelineDesc: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 2,
  },
  closeTrackerBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  closeTrackerText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
});

export default MyOrdersScreen;