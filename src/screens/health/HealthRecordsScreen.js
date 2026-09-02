import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../theme/colors';

const HealthRecordsScreen = ({ navigation }) => {
  const categories = [
    {
      id: 'prescriptions',
      title: 'Doctor Prescriptions',
      subtitle: '3 Active & past prescriptions',
      count: '3 Files',
      icon: 'document-text',
      color: colors.primary,
      background: '#E8F7F4',
      route: 'Prescriptions',
    },
    {
      id: 'reports',
      title: 'Lab & Diagnostic Reports',
      subtitle: 'CBC, HbA1c, Lipid profile, X-Ray',
      count: '4 Reports',
      icon: 'flask',
      color: '#0284C7',
      background: '#E0F2FE',
      route: 'Reports',
    },
    {
      id: 'radiology',
      title: 'Radiology Scans & Imaging',
      subtitle: 'MRI, CT Scans, Ultrasound scans',
      count: '2 Scans',
      icon: 'scan',
      color: '#7C3AED',
      background: '#EDE9FE',
      route: 'Imaging',
    },
    {
      id: 'pharmacy_orders',
      title: 'Pharmacy Orders & Invoices',
      subtitle: 'Bills, receipts & medicine tracking',
      count: 'Orders',
      icon: 'receipt',
      color: '#E67E22',
      background: '#FFF3E0',
      route: 'MyOrders',
    },
  ];

  const recentRecords = [
    {
      id: 'rec-1',
      title: 'Complete Blood Count (CBC)',
      type: 'Lab Report',
      date: '25 Aug 2026',
      status: 'Normal',
      icon: 'flask-outline',
      route: 'Reports',
    },
    {
      id: 'rec-2',
      title: 'Prescription - Dr. Anita Sharma',
      type: 'Doctor Advice',
      date: '28 Aug 2026',
      status: 'Active',
      icon: 'document-text-outline',
      route: 'Prescriptions',
    },
    {
      id: 'rec-3',
      title: 'Pharmacy Order #UNC10245',
      type: 'Medicine Order',
      date: '25 Aug 2026',
      status: 'Delivered',
      icon: 'medkit-outline',
      route: 'MyOrders',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Health Records</Text>
          <Text style={styles.headerSubtitle}>Centralized digital health vault</Text>
        </View>

        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() =>
            Alert.alert('Upload Document', 'Select whether to upload a Prescription or a Lab Report:', [
              { text: 'Prescription', onPress: () => navigation.navigate('Prescriptions') },
              { text: 'Lab Report', onPress: () => navigation.navigate('Reports') },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* BANNER */}
        <View style={styles.vaultBanner}>
          <View style={styles.vaultInfo}>
            <View style={styles.abdmBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#00B894" />
              <Text style={styles.abdmText}>ABHA / ABDM Compliant Vault</Text>
            </View>
            <Text style={styles.vaultTitle}>Your Health History, 100% Secured</Text>
            <Text style={styles.vaultDesc}>
              Access prescriptions, diagnostic results & medical invoices anytime.
            </Text>
          </View>
          <View style={styles.vaultIconCircle}>
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
          </View>
        </View>

        {/* MAIN CATEGORIES */}
        <Text style={styles.sectionTitle}>Medical Folders</Text>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate(cat.route)}
          >
            <View style={[styles.catIconWrap, { backgroundColor: cat.background }]}>
              <Ionicons name={cat.icon} size={24} color={cat.color} />
            </View>
            <View style={styles.catDetails}>
              <Text style={styles.catTitle}>{cat.title}</Text>
              <Text style={styles.catSubtitle}>{cat.subtitle}</Text>
            </View>
            <View style={styles.catRight}>
              <Text style={styles.catCount}>{cat.count}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.slate} />
            </View>
          </TouchableOpacity>
        ))}

        {/* RECENT RECORDS */}
        <Text style={styles.sectionTitle}>Recent Documents</Text>
        {recentRecords.map((rec) => (
          <TouchableOpacity
            key={rec.id}
            style={styles.recentCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(rec.route)}
          >
            <View style={styles.recentIconWrap}>
              <Ionicons name={rec.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.recentDetails}>
              <Text style={styles.recentTitle}>{rec.title}</Text>
              <Text style={styles.recentMeta}>
                {rec.type} • {rec.date}
              </Text>
            </View>
            <View style={styles.recentStatusTag}>
              <Text style={styles.recentStatusText}>{rec.status}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.slate,
    fontWeight: '600',
  },
  uploadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  vaultBanner: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  vaultInfo: {
    flex: 1,
    marginRight: 10,
  },
  abdmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 6,
  },
  abdmText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  vaultTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  vaultDesc: {
    color: '#A5F3FC',
    fontSize: 10,
    marginTop: 3,
    lineHeight: 14,
  },
  vaultIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.secondary,
    marginBottom: 10,
    marginTop: 4,
  },
  categoryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catDetails: {
    flex: 1,
  },
  catTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },
  catSubtitle: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 2,
  },
  catRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  catCount: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  recentCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  recentIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0FAF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentDetails: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  recentMeta: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 2,
  },
  recentStatusTag: {
    backgroundColor: '#E8F8F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recentStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00A382',
  },
});

export default HealthRecordsScreen;