import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fertilityTreatments } from '../../../data/fertilityData';
import WebFooter from '../../../components/web/WebFooter';

const TREATMENT_TABS = [
  { id: 'all', label: 'All Treatments' },
  { id: 'ivf', label: 'IVF & ICSI' },
  { id: 'iui', label: 'IUI Protocol' },
  { id: 'freezing', label: 'Egg & Embryo Freezing' },
];

const TreatmentDetailsScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [activeTab, setActiveTab] = useState('all');
  const [expandedTreatmentId, setExpandedTreatmentId] = useState(fertilityTreatments[1].id);

  const filteredTreatments = fertilityTreatments.filter((t) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'ivf') return t.id === 'fert-treat-2';
    if (activeTab === 'iui') return t.id === 'fert-treat-3';
    if (activeTab === 'freezing') return t.id === 'fert-treat-4' || t.id === 'fert-treat-5';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Assisted Reproductive Treatments</Text>
          <Text style={styles.headerSubtitle}>Procedures, Timelines, Costs & Success</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {TREATMENT_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === tab.id && styles.tabBtnTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Treatment Cards List */}
        <View style={styles.listWrap}>
          {filteredTreatments.map((treatment) => {
            const isExpanded = expandedTreatmentId === treatment.id;

            return (
              <View key={treatment.id} style={styles.treatmentCard}>
                <Image source={{ uri: treatment.image }} style={styles.treatmentImg} />

                <View style={styles.cardBody}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badgePill, { backgroundColor: treatment.badgeColor || '#E11D48' }]}>
                      <Text style={styles.badgeText}>{treatment.badge}</Text>
                    </View>
                    <Text style={styles.durationText}>{treatment.duration}</Text>
                  </View>

                  <Text style={styles.title}>{treatment.title}</Text>
                  <Text style={styles.subtitle}>{treatment.subtitle}</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceVal}>₹{treatment.price.toLocaleString('en-IN')}</Text>
                    {treatment.originalPrice && (
                      <Text style={styles.origPrice}>₹{treatment.originalPrice.toLocaleString('en-IN')}</Text>
                    )}
                    {treatment.emiStartsAt && (
                      <Text style={styles.emiPill}>{treatment.emiStartsAt}</Text>
                    )}
                  </View>

                  {/* Expanded Medical Details */}
                  {isExpanded && (
                    <View style={styles.expandedSection}>
                      <Text style={styles.incHeading}>Standard Protocol Inclusions:</Text>
                      {treatment.inclusions.map((inc, i) => (
                        <View key={i} style={styles.incRow}>
                          <Ionicons name="checkmark-circle" size={14} color="#059669" />
                          <Text style={styles.incText}>{inc}</Text>
                        </View>
                      ))}

                      <View style={styles.recBox}>
                        <Text style={styles.recTitle}>Recommended Clinical Indication:</Text>
                        <Text style={styles.recText}>{treatment.recommendedFor}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={styles.detailsToggleBtn}
                      onPress={() =>
                        setExpandedTreatmentId(isExpanded ? null : treatment.id)
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.detailsToggleText}>
                        {isExpanded ? 'Show Less' : 'View Full Clinical Protocol'}
                      </Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#E11D48"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.bookCtaBtn}
                      onPress={() =>
                        navigation.navigate('FertilitySpecialists', {
                          serviceFilter: treatment.title,
                        })
                      }
                      activeOpacity={0.85}
                    >
                      <Text style={styles.bookCtaText}>Consult Specialist</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {isDesktopWeb && <WebFooter navigation={navigation} />}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  desktopContainer: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listWrap: {
    gap: 16,
  },
  treatmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  treatmentImg: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8FAFC',
  },
  cardBody: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  durationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  priceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  origPrice: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  emiPill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expandedSection: {
    marginTop: 4,
    marginBottom: 12,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  incHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  incRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  incText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  recBox: {
    backgroundColor: '#FFF1F2',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E11D48',
  },
  recTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9F1239',
  },
  recText: {
    fontSize: 11,
    color: '#4C0519',
    marginTop: 2,
    lineHeight: 15,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 10,
  },
  detailsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  detailsToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  bookCtaBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default TreatmentDetailsScreen;
