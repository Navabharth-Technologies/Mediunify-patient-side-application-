import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fertilitySpecialists } from '../../../data/fertilityData';
import { FertilityDoctorCard, EmptyState } from '../../../components/fertility';
import WebFooter from '../../../components/web/WebFooter';

const LANGUAGES = ['All', 'Kannada', 'English', 'Hindi', 'Telugu', 'Tamil'];
const SPECIALTIES = [
  'All',
  'IVF & Blastocyst',
  'Male Fertility',
  'Egg Freezing',
  'PCOS & Low AMH',
  'Endometriosis',
  'Genetics',
];

const FertilitySpecialistsScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [clinicFilter, setClinicFilter] = useState(route?.params?.clinicFilter || null);
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [availableTodayOnly, setAvailableTodayOnly] = useState(false);
  const [genderFilter, setGenderFilter] = useState('All'); // 'All' | 'Female' | 'Male'

  const filteredDoctors = useMemo(() => {
    return fertilitySpecialists.filter((doc) => {
      const q = search.trim().toLowerCase();
      const matchQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.clinicName.toLowerCase().includes(q) ||
        doc.specializations.some((s) => s.toLowerCase().includes(q));

      const matchLang =
        selectedLanguage === 'All' || doc.languages.includes(selectedLanguage);

      const matchSpec =
        selectedSpecialty === 'All' ||
        doc.specializations.some((s) =>
          s.toLowerCase().includes(selectedSpecialty.toLowerCase())
        );

      const matchToday = !availableTodayOnly || doc.availableToday;

      const matchGender =
        genderFilter === 'All' || doc.gender === genderFilter;

      const matchClinic =
        !clinicFilter ||
        doc.clinicName.toLowerCase().includes(clinicFilter.toLowerCase()) ||
        (route?.params?.clinicId && doc.clinicId === route?.params?.clinicId);

      return (
        matchQuery &&
        matchLang &&
        matchSpec &&
        matchToday &&
        matchGender &&
        matchClinic
      );
    });
  }, [
    search,
    selectedLanguage,
    selectedSpecialty,
    availableTodayOnly,
    genderFilter,
    clinicFilter,
    route?.params?.clinicId,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('FertilityIvf')}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Fertility Specialists</Text>
          <Text style={styles.headerSubtitle}>
            {filteredDoctors.length} Verified Reproductive Endocrinologists & Andrologists
          </Text>
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
        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by doctor name, IVF, PCOS, Andrology..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {clinicFilter && (
          <View style={styles.activeClinicBanner}>
            <View style={styles.activeClinicInfo}>
              <Ionicons name="business" size={14} color="#0F766E" />
              <Text style={styles.activeClinicText} numberOfLines={1}>
                Doctors at: {clinicFilter}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setClinicFilter(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color="#0F766E" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Filter Toggles */}
        <View style={styles.quickFiltersRow}>
          <TouchableOpacity
            style={[styles.togglePill, availableTodayOnly && styles.togglePillActive]}
            onPress={() => setAvailableTodayOnly(!availableTodayOnly)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flash-outline"
              size={13}
              color={availableTodayOnly ? '#FFFFFF' : '#E11D48'}
            />
            <Text
              style={[
                styles.togglePillText,
                availableTodayOnly && styles.togglePillTextActive,
              ]}
            >
              Available Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.togglePill, genderFilter === 'Female' && styles.togglePillActive]}
            onPress={() =>
              setGenderFilter(genderFilter === 'Female' ? 'All' : 'Female')
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.togglePillText,
                genderFilter === 'Female' && styles.togglePillTextActive,
              ]}
            >
              Female Doctors
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.togglePill, genderFilter === 'Male' && styles.togglePillActive]}
            onPress={() =>
              setGenderFilter(genderFilter === 'Male' ? 'All' : 'Male')
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.togglePillText,
                genderFilter === 'Male' && styles.togglePillTextActive,
              ]}
            >
              Andrologists (Male)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Language Filter Chips */}
        <View style={styles.chipsSection}>
          <Text style={styles.filterSectionLabel}>Language Spoken:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.chip,
                  selectedLanguage === lang && styles.chipActive,
                ]}
                onPress={() => setSelectedLanguage(lang)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedLanguage === lang && styles.chipTextActive,
                  ]}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Specialists List */}
        <View style={[styles.doctorsList, isDesktopWeb && styles.desktopGrid]}>
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doc) => (
              <View key={doc.id} style={isDesktopWeb ? styles.gridCol : null}>
                <FertilityDoctorCard
                  doctor={doc}
                  onPress={(d) =>
                    navigation.navigate('FertilityDoctorProfile', { doctor: d })
                  }
                  onBook={(d) =>
                    navigation.navigate('FertilityDoctorProfile', {
                      doctor: d,
                      autoOpenBooking: true,
                    })
                  }
                />
              </View>
            ))
          ) : (
            <EmptyState
              icon="search-outline"
              title="No specialists match your criteria"
              subtitle="Try clearing or adjusting your filters to view more fertility doctors."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearch('');
                setSelectedLanguage('All');
                setSelectedSpecialty('All');
                setAvailableTodayOnly(false);
                setGenderFilter('All');
              }}
            />
          )}
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
    fontSize: 17,
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
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  quickFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  togglePillActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  togglePillTextActive: {
    color: '#FFFFFF',
  },
  chipsSection: {
    marginBottom: 14,
  },
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  doctorsList: {
    marginTop: 4,
  },
  activeClinicBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 10,
  },
  activeClinicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  activeClinicText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
    flex: 1,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  gridCol: {
    width: '50%',
    paddingHorizontal: 8,
  },
});

export default FertilitySpecialistsScreen;
