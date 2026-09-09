import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Share,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../theme/colors';

const DEFAULT_TRANSACTIONS = [
  {
    id: 'TXN-892140',
    refId: 'RAD-739201',
    service: 'Radiology Scan',
    serviceType: 'radiology',
    title: '3.0T MRI Brain (Plain & Contrast)',
    facility: 'MediUnify Advanced Diagnostics & 3T MRI Centre',
    facilityArea: 'Kuvempunagar, Mysore',
    date: 'Today, 02:45 PM',
    amount: 3200,
    mrp: 4500,
    status: 'Success',
    paymentMode: 'Google Pay (UPI)',
    paymentGateway: 'Razorpay Secure',
    gstin: '29AABCU9603R1ZX',
    items: [
      { name: '3.0T MRI Brain with Contrast', qty: 1, price: 3200 },
      { name: 'Radiologist Digital Film & CD', qty: 1, price: 0 },
    ],
  },
  {
    id: 'TXN-845129',
    refId: 'VID-492100',
    service: 'Video Consultation',
    serviceType: 'consultation',
    title: 'Dr. Ananya Rao • General Physician',
    facility: 'MediUnify TeleHealth Network',
    facilityArea: 'Online HD Video Room',
    date: 'Yesterday, 04:30 PM',
    amount: 450,
    mrp: 650,
    status: 'Success',
    paymentMode: 'PhonePe (UPI)',
    paymentGateway: 'Instant TelePay',
    gstin: '29AABCU9603R1ZX',
    items: [
      { name: 'Tele-Consultation (15 Mins)', qty: 1, price: 450 },
      { name: 'Digital Verified e-Prescription', qty: 1, price: 0 },
    ],
  },
  {
    id: 'TXN-791022',
    refId: 'LAB-510293',
    service: 'Diagnostic Lab Test',
    serviceType: 'lab',
    title: 'CBC with ESR + Thyroid Profile Total',
    facility: 'MediUnify Central Pathology (Home Collection)',
    facilityArea: 'Doorstep Phlebotomist Visit',
    date: '28 Aug 2026, 08:00 AM',
    amount: 748,
    mrp: 1150,
    status: 'Success',
    paymentMode: 'Pay on Sample Collection (UPI)',
    paymentGateway: 'Doorstep Collection',
    gstin: '29AABCU9603R1ZX',
    items: [
      { name: 'Complete Blood Count (CBC + ESR)', qty: 1, price: 349 },
      { name: 'Thyroid Profile (T3, T4, TSH)', qty: 1, price: 399 },
      { name: 'Home Sample Collection Charge', qty: 1, price: 0 },
    ],
  },
  {
    id: 'TXN-723901',
    refId: 'DOC-190284',
    service: 'In-Person Doctor Visit',
    serviceType: 'consultation',
    title: 'Dr. Rahul Sharma • Senior Cardiologist',
    facility: 'MediCare Heart & Vascular Institute',
    facilityArea: 'Jayalakshmipuram, Mysore',
    date: '25 Aug 2026, 05:15 PM',
    amount: 800,
    mrp: 800,
    status: 'Success',
    paymentMode: 'Pay at Clinic Reception (Card)',
    paymentGateway: 'POS Counter',
    gstin: '29AABCU9603R1ZX',
    items: [
      { name: 'In-Person Specialist Consultation', qty: 1, price: 800 },
      { name: 'Clinic Registration & Queue Token', qty: 1, price: 0 },
    ],
  },
  {
    id: 'TXN-692110',
    refId: 'MED-902184',
    service: 'Pharmacy & Medicines',
    serviceType: 'pharmacy',
    title: 'Prescription Refill & Wellness Items',
    facility: 'MediUnify Express Pharmacy',
    facilityArea: 'Express 45-Min Delivery',
    date: '22 Aug 2026, 11:30 AM',
    amount: 385,
    mrp: 520,
    status: 'Success',
    paymentMode: 'Paytm (UPI)',
    paymentGateway: 'Pharmacy Checkout',
    gstin: '29AABCU9603R1ZX',
    items: [
      { name: 'Dolo 650 Tablets (Strip of 15)', qty: 2, price: 110 },
      { name: 'Azithromycin 500mg (Strip of 5)', qty: 1, price: 145 },
      { name: 'Zincovit Multivitamin Strip', qty: 1, price: 130 },
      { name: 'Express Delivery Fee', qty: 1, price: 0 },
    ],
  },
  {
    id: 'TXN-581903',
    refId: 'LAB-881920',
    service: 'Full Body Health Package',
    serviceType: 'lab',
    title: 'MediUnify Executive Full Body Package (68 Tests)',
    facility: 'MediUnify Central Pathology & Diagnostic Center',
    facilityArea: 'Kuvempunagar, Mysore',
    date: '18 Aug 2026, 07:30 AM',
    amount: 1299,
    mrp: 2800,
    status: 'Success',
    paymentMode: 'BHIM UPI',
    paymentGateway: 'Razorpay Secure',
    gstin: '29AABCU9603R1ZX',
    items: [
      { name: 'Executive Master Health Package (68 Tests)', qty: 1, price: 1299 },
      { name: 'Doctor Consultation Follow-up Review', qty: 1, price: 0 },
    ],
  },
];

const FILTER_TABS = [
  { id: 'all', label: 'All Transactions' },
  { id: 'consultation', label: '👨‍⚕️ Consultations' },
  { id: 'radiology', label: '☢️ Radiology Scans' },
  { id: 'lab', label: '🧪 Lab Tests' },
  { id: 'pharmacy', label: '💊 Pharmacy' },
];

const TransactionHistoryScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [transactions, setTransactions] = useState(DEFAULT_TRANSACTIONS);
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Load dynamically created transactions from AsyncStorage on mount
  useEffect(() => {
    loadTransactionsFromStorage();
  }, []);

  const loadTransactionsFromStorage = async () => {
    try {
      const storedRadJson = await AsyncStorage.getItem('@radiologyBookings');
      const storedApptJson = await AsyncStorage.getItem('@unnathi_appointments');

      const dynamicList = [];

      if (storedRadJson) {
        const radList = JSON.parse(storedRadJson);
        radList.forEach((rad) => {
          if (rad.transactionId || rad.bookingId) {
            dynamicList.push({
              id: rad.transactionId || `TXN-${rad.bookingId ? rad.bookingId.replace(/\D/g, '') : '902183'}`,
              refId: rad.bookingId || rad.id || 'RAD-000000',
              service: 'Radiology Scan',
              serviceType: 'radiology',
              title: rad.tests ? rad.tests.map((t) => t.name).join(', ') : 'Radiology Scan',
              facility: rad.labName || 'Unnathi Advanced Diagnostics',
              facilityArea: rad.labArea || 'Mysore',
              date: `${rad.date || 'Recent'}, ${rad.slot || ''}`.trim(),
              amount: rad.totalAmount || rad.paidAmount || 1800,
              mrp: (rad.totalAmount || 1800) + 500,
              status: 'Success',
              paymentMode: rad.paymentMethod === 'LAB_COUNTER' ? 'Pay at Lab Counter' : 'Online UPI',
              paymentGateway: 'Razorpay Secure',
              gstin: '29AABCU9603R1ZX',
              items: rad.tests
                ? rad.tests.map((t) => ({ name: t.name, qty: 1, price: t.price }))
                : [{ name: 'Radiology Imaging', qty: 1, price: rad.totalAmount || 1800 }],
            });
          }
        });
      }

      if (storedApptJson) {
        const apptList = JSON.parse(storedApptJson);
        apptList.forEach((appt) => {
          if (appt.id && !dynamicList.some((d) => d.refId === appt.id)) {
            const isLab = appt.type === 'Diagnostic Lab Test';
            const isVideo = appt.type === 'Video Consultation';
            const isDoctor = appt.type === 'In-Person';

            dynamicList.push({
              id: `TXN-${appt.id.replace(/\D/g, '') || Math.floor(100000 + Math.random() * 900000)}`,
              refId: appt.id,
              service: appt.type || 'Healthcare Service',
              serviceType: isLab ? 'lab' : isVideo || isDoctor ? 'consultation' : 'pharmacy',
              title: isLab
                ? appt.tests ? appt.tests.map((t) => t.name).join(', ') : 'Diagnostic Lab Tests'
                : isVideo
                ? `${appt.doctor?.name || 'Doctor'} • Video Consultation`
                : `${appt.doctor?.name || 'Doctor'} • In-Person Consultation`,
              facility: isLab
                ? appt.labCenter?.name || appt.collectionMode || 'Unnathi Pathology'
                : isDoctor
                ? appt.doctor?.clinicName || 'Specialty Clinic'
                : 'Unnathi TeleHealth Network',
              facilityArea: appt.doctor?.clinicArea || 'Mysore',
              date: `${appt.date || 'Recent'}, ${appt.time || appt.slot || ''}`.trim(),
              amount: appt.paidAmount || appt.totalAmount || 500,
              mrp: (appt.paidAmount || 500) + 200,
              status: 'Success',
              paymentMode: appt.paymentStatus || 'Online UPI',
              paymentGateway: 'Instant Pay',
              gstin: '29AABCU9603R1ZX',
              items: isLab && appt.tests
                ? appt.tests.map((t) => ({ name: t.name, qty: 1, price: t.price }))
                : [{ name: appt.type, qty: 1, price: appt.paidAmount || 500 }],
            });
          }
        });
      }

      // Merge unique
      const merged = [...dynamicList, ...DEFAULT_TRANSACTIONS];
      const uniqueMap = new Map();
      merged.forEach((item) => {
        if (!uniqueMap.has(item.refId)) {
          uniqueMap.set(item.refId, item);
        }
      });
      setTransactions(Array.from(uniqueMap.values()));
    } catch (e) {
      console.log('Error loading transactions:', e);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // 1. Search
      const matchesSearch =
        txn.id.toLowerCase().includes(search.toLowerCase()) ||
        txn.refId.toLowerCase().includes(search.toLowerCase()) ||
        txn.title.toLowerCase().includes(search.toLowerCase()) ||
        txn.facility.toLowerCase().includes(search.toLowerCase()) ||
        txn.paymentMode.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Tab
      if (selectedTab !== 'all' && txn.serviceType !== selectedTab) {
        return false;
      }

      return true;
    });
  }, [transactions, search, selectedTab]);

  // Total expenditure calculation
  const totalSpent = useMemo(() => {
    return filteredTransactions.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredTransactions]);

  // Share Receipt
  const handleShareReceipt = async (txn) => {
    try {
      await Share.share({
        message: `MEDIUNIFY HEALTHCARE PAYMENT RECEIPT\n--------------------------------\nTransaction ID: ${txn.id}\nBooking Ref: ${txn.refId}\nService: ${txn.service}\nTitle: ${txn.title}\nFacility: ${txn.facility}\nAmount Paid: ₹${txn.amount}\nPayment Mode: ${txn.paymentMode}\nDate: ${txn.date}\nStatus: ${txn.status}\n--------------------------------\nThank you for choosing MediUnify Healthcare.`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case 'radiology':
        return { name: 'radio-outline', bg: '#E0F7FA', color: '#00838F' };
      case 'consultation':
        return { name: 'person-outline', bg: '#EEF4FF', color: '#1976D2' };
      case 'lab':
        return { name: 'flask-outline', bg: '#ECFDF5', color: '#059669' };
      case 'pharmacy':
        return { name: 'medical-outline', bg: '#FFF0F1', color: colors.coral };
      default:
        return { name: 'receipt-outline', bg: '#F1F5F9', color: colors.secondary };
    }
  };

  const renderTransactionCard = ({ item }) => {
    const iconConfig = getServiceIcon(item.serviceType);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => setSelectedTxn(item)}
      >
        {/* CARD TOP ROW */}
        <View style={styles.cardHeader}>
          <View style={styles.serviceHeaderWrap}>
            <View style={[styles.serviceIconBox, { backgroundColor: iconConfig.bg }]}>
              <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.serviceCategoryText}>{item.service}</Text>
              <Text style={styles.txnIdText}>{item.id}</Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#059669" />
            <Text style={styles.statusBadgeText}>{item.status}</Text>
          </View>
        </View>

        {/* TITLE & FACILITY */}
        <Text style={styles.txnTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.facilityText} numberOfLines={1}>
          🏥 {item.facility}
        </Text>

        {/* DATE & PAYMENT MODE */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="card-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.paymentMode.split('(')[0]}
            </Text>
          </View>
        </View>

        {/* FOOTER: AMOUNT & RECEIPT BUTTON */}
        <View style={styles.cardFooter}>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Paid Amount</Text>
            <Text style={styles.amountValue}>₹{item.amount}</Text>
          </View>

          <TouchableOpacity
            style={styles.viewInvoiceBtn}
            activeOpacity={0.8}
            onPress={() => setSelectedTxn(item)}
          >
            <Ionicons name="receipt-outline" size={14} color={colors.secondary} />
            <Text style={styles.viewInvoiceBtnText}>View Receipt</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==================================================
          HEADER
      ================================================== */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <Text style={styles.headerSubtitle}>Invoices & Payment Receipts</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={loadTransactionsFromStorage}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* ==================================================
          TOTAL EXPENDITURE SUMMARY BANNER
      ================================================== */}
      <View style={styles.totalBanner}>
        <View style={styles.totalBannerContent}>
          <Text style={styles.totalBannerLabel}>Total Healthcare Transactions</Text>
          <Text style={styles.totalBannerAmount}>₹{totalSpent.toLocaleString('en-IN')}</Text>
          <Text style={styles.totalBannerCount}>
            Across {filteredTransactions.length} Confirmed Appointments & Orders
          </Text>
        </View>
        <View style={styles.totalBannerIconCircle}>
          <Ionicons name="wallet-outline" size={28} color="#FFFFFF" />
        </View>
      </View>

      {/* ==================================================
          SEARCH INPUT
      ================================================== */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Txn ID, Doctor, Lab, Scan or Mode..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ==================================================
          FILTER TABS
      ================================================== */}
      <View style={styles.tabsContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.tabsWrap}>
            {FILTER_TABS.map((tab) => {
              const isTabActive = selectedTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabPill, isTabActive && styles.tabPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedTab(tab.id)}
                >
                  <Text style={[styles.tabPillText, isTabActive && styles.tabPillTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {FILTER_TABS.map((tab) => {
              const isTabActive = selectedTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabPill, isTabActive && styles.tabPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedTab(tab.id)}
                >
                  <Text style={[styles.tabPillText, isTabActive && styles.tabPillTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ==================================================
          TRANSACTION LIST
      ================================================== */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Transactions Found</Text>
            <Text style={styles.emptySubtitle}>
              You have no payment records under this category.
            </Text>
          </View>
        }
      />

      {/* ==================================================
          ITEMIZED INVOICE / RECEIPT MODAL
      ================================================== */}
      <Modal
        visible={!!selectedTxn}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTxn(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.invoiceCard}>
            {/* INVOICE HEADER */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.invoiceHeaderIcon}>
                <Ionicons name="checkmark-done" size={22} color="#059669" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalHeaderTitle}>Payment Tax Invoice</Text>
                <Text style={styles.modalHeaderSub}>GST Compliant Health Receipt</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedTxn(null)}
              >
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {selectedTxn && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                {/* INVOICE AMOUNT HERO */}
                <View style={styles.invoiceAmountBox}>
                  <Text style={styles.invoiceAmountLabel}>Amount Paid</Text>
                  <Text style={styles.invoiceAmountValue}>₹{selectedTxn.amount}</Text>
                  <View style={styles.invoiceStatusRow}>
                    <View style={styles.invoiceStatusDot} />
                    <Text style={styles.invoiceStatusText}>Payment Confirmed & Verified</Text>
                  </View>
                </View>

                {/* META DETAILS GRID */}
                <View style={styles.metaGrid}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Transaction ID</Text>
                    <Text style={styles.metaValue}>{selectedTxn.id}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Booking Reference</Text>
                    <Text style={styles.metaValue}>{selectedTxn.refId}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Payment Mode</Text>
                    <Text style={styles.metaValue}>{selectedTxn.paymentMode}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Date & Time</Text>
                    <Text style={styles.metaValue}>{selectedTxn.date}</Text>
                  </View>
                </View>

                {/* FACILITY / CLINIC DETAILS */}
                <View style={styles.invoiceFacilityBox}>
                  <Text style={styles.invoiceFacilityTitle}>{selectedTxn.service}</Text>
                  <Text style={styles.invoiceFacilityName}>{selectedTxn.title}</Text>
                  <Text style={styles.invoiceFacilityLoc}>🏥 {selectedTxn.facility}</Text>
                  <Text style={styles.invoiceGstin}>GSTIN: {selectedTxn.gstin}</Text>
                </View>

                {/* ITEMIZED BREAKDOWN */}
                <Text style={styles.itemsBreakdownTitle}>Itemized Billing</Text>
                <View style={styles.itemsTable}>
                  {selectedTxn.items &&
                    selectedTxn.items.map((it, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {it.name}
                        </Text>
                        <Text style={styles.itemPrice}>
                          {it.price === 0 ? 'FREE' : `₹${it.price}`}
                        </Text>
                      </View>
                    ))}

                  <View style={styles.itemDivider} />

                  <View style={styles.itemRow}>
                    <Text style={styles.itemTotalLabel}>Total Net Paid</Text>
                    <Text style={styles.itemTotalAmount}>₹{selectedTxn.amount}</Text>
                  </View>
                </View>

                {/* SHARE & DOWNLOAD BUTTONS */}
                <View style={styles.invoiceActionsRow}>
                  <TouchableOpacity
                    style={styles.shareInvoiceBtn}
                    activeOpacity={0.85}
                    onPress={() => handleShareReceipt(selectedTxn)}
                  >
                    <Ionicons name="share-social-outline" size={16} color={colors.secondary} />
                    <Text style={styles.shareInvoiceBtnText}>Share Receipt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.downloadInvoiceBtn}
                    activeOpacity={0.88}
                    onPress={() => {
                      showAlert(
                        'Invoice Downloaded',
                        `Tax Invoice receipt for ${selectedTxn.id} has been saved to your downloads.`
                      );
                    }}
                  >
                    <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.downloadInvoiceBtnText}>Download PDF</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // HEADER
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // TOTAL EXPENDITURE BANNER
  totalBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalBannerContent: {
    flex: 1,
  },
  totalBannerLabel: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  totalBannerAmount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  totalBannerCount: {
    color: '#CBD5E1',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '500',
  },
  totalBannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  // SEARCH BAR
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.text,
  },

  // TABS
  tabsContainer: {
    paddingVertical: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    rowGap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },

  // LIST & CARDS
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceHeaderWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCategoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  txnIdText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },

  txnTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 2,
  },
  facilityText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: colors.text,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  amountCol: {},
  amountLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },
  viewInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  viewInvoiceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
  },

  // EMPTY
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },

  // MODAL INVOICE
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  invoiceHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },
  modalHeaderSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  invoiceAmountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  invoiceAmountLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  invoiceAmountValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: 2,
  },
  invoiceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  invoiceStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  invoiceStatusText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },

  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metaCol: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    marginTop: 2,
  },

  invoiceFacilityBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invoiceFacilityTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  invoiceFacilityName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 2,
  },
  invoiceFacilityLoc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  invoiceGstin: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  itemsBreakdownTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 6,
  },
  itemsTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 11,
    color: colors.text,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  itemTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  itemTotalAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },

  invoiceActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareInvoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  shareInvoiceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  downloadInvoiceBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  downloadInvoiceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default TransactionHistoryScreen;
