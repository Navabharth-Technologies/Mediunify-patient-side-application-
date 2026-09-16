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
import { partnerFertilityCenters } from '../../../data/fertilityData';
import { ClinicCard, EmptyState } from '../../../components/fertility';
import WebFooter from '../../../components/web/WebFooter';

const CITIES = ['All Cities', 'Mysuru', 'Bengaluru'];

const FertilityClinicsScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [compareList, setCompareList] = useState([]);

  const filteredClinics = useMemo(() => {
    return partnerFertilityCenters.filter((clinic) => {
      const q = search.trim().toLowerCase();
      const matchQuery =
        !q ||
        clinic.name.toLowerCase().includes(q) ||
        clinic.tagline.toLowerCase().includes(q) ||
        clinic.address.toLowerCase().includes(q) ||
        clinic.procedures.some((p) => p.toLowerCase().includes(q));

      const matchCity =
        selectedCity === 'All Cities' || clinic.city === selectedCity;

      return matchQuery && matchCity;
    });
  }, [search, selectedCity]);

  const handleToggleCompare = (clinic) => {
    if (compareList.some((c) => c.id === clinic.id)) {
      setCompareList(compareList.filter((c) => c.id !== clinic.id));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare up to 3 clinics at a time.');
        return;
      }
      setCompareList([...compareList, clinic]);
    }
  };

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
          <Text style={styles.headerTitle}>Fertility Clinics & Hospitals</Text>
          <Text style={styles.headerSubtitle}>
            {filteredClinics.length} ICMR-Registered IVF Centers
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
          compareList.length > 0 && { paddingBottom: 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by clinic name, location, ICSI, cleanroom..."
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

        {/* City Filter Pills */}
        <View style={styles.cityRow}>
          {CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              style={[
                styles.cityPill,
                selectedCity === city && styles.cityPillActive,
              ]}
              onPress={() => setSelectedCity(city)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.cityText,
                  selectedCity === city && styles.cityTextActive,
                ]}
              >
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Clinics List */}
        <View style={[styles.listWrap, isDesktopWeb && styles.desktopGrid]}>
          {filteredClinics.length > 0 ? (
            filteredClinics.map((clinic) => (
              <View key={clinic.id} style={isDesktopWeb ? styles.gridCol : null}>
                <ClinicCard
                  clinic={clinic}
                  onPress={(c, tab) =>
                    navigation.navigate('FertilityClinicProfile', {
                      clinic: c,
                      initialTab: tab || 'overview',
                    })
                  }
                  onCompare={handleToggleCompare}
                  isSelectedForCompare={compareList.some((item) => item.id === clinic.id)}
                />
              </View>
            ))
          ) : (
            <EmptyState
              icon="business-outline"
              title="No clinics found"
              subtitle="Try switching cities or search with different keywords."
              actionLabel="View All Clinics"
              onAction={() => {
                setSearch('');
                setSelectedCity('All Cities');
              }}
            />
          )}
        </View>

        {isDesktopWeb && <WebFooter navigation={navigation} />}
      </ScrollView>

      {/* Compare Floating Bar */}
      {compareList.length > 0 && (
        <View style={styles.compareBar}>
          <View style={styles.compareInfo}>
            <Text style={styles.compareCountText}>
              {compareList.length} Clinic{compareList.length > 1 ? 's' : ''} Selected
            </Text>
            <Text style={styles.compareNames} numberOfLines={1}>
              {compareList.map((c) => c.name.split(' ')[0]).join(', ')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.compareActionBtn}
            onPress={() =>
              navigation.navigate('CompareClinics', { initialClinics: compareList })
            }
            activeOpacity={0.85}
          >
            <Text style={styles.compareActionBtnText}>Compare Now</Text>
            <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
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
  cityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cityPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  cityPillActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  cityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cityTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listWrap: {
    marginTop: 4,
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
  compareBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  compareInfo: {
    flex: 1,
    marginRight: 10,
  },
  compareCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  compareNames: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  compareActionBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compareActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default FertilityClinicsScreen;
