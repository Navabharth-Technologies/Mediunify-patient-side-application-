import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../theme/colors';

const OrderSuccessScreen = ({ navigation, route }) => {
  const { order } = route?.params || {};

  const orderId = order?.id || `UNC${Math.floor(10000 + Math.random() * 90000)}`;

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const handleViewOrders = () => {
    navigation.navigate('MyOrders');
  };

  const handleContinueShopping = () => {
    navigation.navigate('Pharmacy');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP HEADER BAR */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleGoHome}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={22} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Order Confirmation</Text>
        <TouchableOpacity
          style={styles.homeIconBtn}
          onPress={handleGoHome}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* CELEBRATION ICON */}
        <View style={styles.successRing}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={54} color={colors.white} />
          </View>
        </View>

        <Text style={styles.successHeading}>Order Placed Successfully! 🎉</Text>
        <Text style={styles.successSub}>
          Thank you for choosing Unnathi Healthcare. Your pharmacy order is confirmed and being prepared for dispatch.
        </Text>

        {/* ORDER ID & ESTIMATED ARRIVAL BANNER */}
        <View style={styles.etaCard}>
          <View style={styles.etaHeader}>
            <View style={styles.etaIconWrap}>
              <Ionicons name="bicycle" size={26} color={colors.primary} />
            </View>
            <View style={styles.etaInfo}>
              <Text style={styles.etaTitle}>Estimated Delivery</Text>
              <Text style={styles.etaTime}>30 - 45 Minutes (Express)</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>Confirmed</Text>
            </View>
          </View>
          <Text style={styles.orderIdText}>Order ID: #{orderId}</Text>
        </View>

        {/* ORDER SUMMARY CARD */}
        {order && (
          <View style={styles.orderCard}>
            <Text style={styles.cardSectionTitle}>Order Details</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Payment Mode</Text>
              <View style={styles.paymentPill}>
                <Ionicons
                  name={order.paymentMethod?.includes('Cash') ? 'cash-outline' : 'card-outline'}
                  size={13}
                  color={colors.primary}
                />
                <Text style={styles.paymentPillText}>{order.paymentMethod}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Payment Status</Text>
              <Text style={styles.metaValue}>{order.paymentStatus || 'Confirmed'}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Delivery Slot</Text>
              <Text style={styles.metaValue}>{order.deliverySlot || 'Express (30-45 mins)'}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.cardSectionTitle}>Delivery Address</Text>
            <Text style={styles.addressName}>
              {order.address?.name || 'User'} ({order.address?.phone || '9876543210'})
            </Text>
            <Text style={styles.addressText}>
              {order.address?.addressLine}, {order.address?.city}, {order.address?.state} -{' '}
              {order.address?.pincode}
            </Text>

            {order.prescriptionAttached && (
              <>
                <View style={styles.divider} />
                <Text style={styles.cardSectionTitle}>Attached Prescription</Text>
                <View style={styles.rxAttachedRow}>
                  <Ionicons name="document-text" size={16} color={colors.primary} />
                  <Text style={styles.rxAttachedText} numberOfLines={1}>
                    {order.prescriptionAttached}
                  </Text>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>Verified</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />

            <Text style={styles.cardSectionTitle}>
              Items Ordered ({order.items?.length || 0})
            </Text>

            {order.items?.map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.itemRow}>
                <Ionicons name="medical" size={14} color={colors.primary} />
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.quantity} × {item.name}
                </Text>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid / Payable</Text>
              <Text style={styles.totalValue}>₹{order.total}</Text>
            </View>
          </View>
        )}

        {/* SUPPORT NOTE */}
        <View style={styles.supportCard}>
          <Ionicons name="headset-outline" size={20} color={colors.primary} />
          <Text style={styles.supportText}>
            Need help with this order? Call our 24/7 Helpline at 1800-UNNATHI.
          </Text>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* FLOATING BOTTOM ACTION BUTTONS */}
      <View style={styles.floatingBottomBar}>
        {/* PRIMARY GO TO HOME BUTTON */}
        <TouchableOpacity
          style={styles.floatingHomeBtn}
          activeOpacity={0.88}
          onPress={handleGoHome}
        >
          <Ionicons name="home" size={20} color={colors.white} />
          <Text style={styles.floatingHomeText}>Go to Home Screen</Text>
        </TouchableOpacity>

        {/* SECONDARY ROW: TRACK ORDERS & CONTINUE SHOPPING */}
        <View style={styles.secondaryBtnRow}>
          <TouchableOpacity
            style={styles.trackOrdersBtn}
            activeOpacity={0.85}
            onPress={handleViewOrders}
          >
            <Ionicons name="receipt-outline" size={16} color={colors.primary} />
            <Text style={styles.trackOrdersText}>Track Order Live</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueShoppingBtn}
            activeOpacity={0.85}
            onPress={handleContinueShopping}
          >
            <Ionicons name="cart-outline" size={16} color={colors.secondary} />
            <Text style={styles.continueShoppingText}>Pharmacy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },
  topHeader: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.secondary,
  },
  homeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  successRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#D1F4EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  successCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successHeading: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.secondary,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 12,
    color: colors.slate,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  etaCard: {
    width: '100%',
    backgroundColor: '#E8F7F4',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#C0EFE5',
  },
  etaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  etaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaInfo: {
    flex: 1,
  },
  etaTitle: {
    fontSize: 11,
    color: colors.slate,
    fontWeight: '700',
  },
  etaTime: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondary,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#00B894',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  orderIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#C0EFE5',
  },
  orderCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.secondary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 11,
    color: colors.slate,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
  },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F7F4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  paymentPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  addressName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  addressText: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 2,
    lineHeight: 16,
  },
  rxAttachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF8',
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  rxAttachedText: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '700',
    flex: 1,
  },
  verifiedTag: {
    backgroundColor: '#E8F8F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00A382',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  itemName: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '700',
    flex: 1,
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F6',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.secondary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  supportCard: {
    width: '100%',
    backgroundColor: '#E6FAF7',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#C0EFE5',
  },
  supportText: {
    fontSize: 11,
    color: colors.secondary,
    flex: 1,
    fontWeight: '600',
    lineHeight: 16,
  },
  floatingBottomBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  floatingHomeBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  floatingHomeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trackOrdersBtn: {
    flex: 1.4,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F7F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#C0EFE5',
  },
  trackOrdersText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  continueShoppingBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  continueShoppingText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
});

export default OrderSuccessScreen;