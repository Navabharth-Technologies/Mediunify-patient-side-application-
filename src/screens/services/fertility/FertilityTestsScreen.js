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
import { fertilityDiagnosticTests } from '../../../data/fertilityData';
import { TestCard, EmptyState } from '../../../components/fertility';
import WebFooter from '../../../components/web/WebFooter';

const CATEGORIES = [
  'All Tests',
  'Hormonal & Ovarian Reserve',
  'Male Fertility',
  'Ultrasound & Imaging',
  'Genetic Screening',
  'Infection & Pre-Conception',
];

const GENDERS = ['All', 'Female', 'Male', 'Both Partners'];

const FertilityTestsScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Tests');
  const [selectedGender, setSelectedGender] = useState('All');

  const filteredTests = useMemo(() => {
    return fertilityDiagnosticTests.filter((test) => {
      const q = search.trim().toLowerCase();
      const matchQuery =
        !q ||
        test.name.toLowerCase().includes(q) ||
        test.category.toLowerCase().includes(q) ||
        test.description.toLowerCase().includes(q);

      const matchCategory =
        selectedCategory === 'All Tests' || test.category === selectedCategory;

      const matchGender =
        selectedGender === 'All' || test.targetGender === selectedGender;

      return matchQuery && matchCategory && matchGender;
    });
  }, [search, selectedCategory, selectedGender]);

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
          <Text style={styles.headerTitle}>Fertility Tests Catalogue</Text>
          <Text style={styles.headerSubtitle}>
            {filteredTests.length} Accredited Diagnostic Screens (Lab & Clinic)
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
            placeholder="Search AMH, Semen CASA, DFI, TVS Ultrasound..."
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

        {/* Gender Filter Pills */}
        <View style={styles.genderRow}>
          {GENDERS.map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.genderPill,
                selectedGender === gender && styles.genderPillActive,
              ]}
              onPress={() => setSelectedGender(gender)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.genderText,
                  selectedGender === gender && styles.genderTextActive,
                ]}
              >
                {gender}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryChipsScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                selectedCategory === cat && styles.catChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.catChipText,
                  selectedCategory === cat && styles.catChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tests List */}
        <View style={[styles.listWrap, isDesktopWeb && styles.desktopGrid]}>
          {filteredTests.length > 0 ? (
            filteredTests.map((test) => (
              <View key={test.id} style={isDesktopWeb ? styles.gridCol : null}>
                <TestCard
                  test={test}
                  onPress={(t) =>
                    navigation.navigate('FertilityTestDetails', { test: t })
                  }
                  onBook={(t) =>
                    navigation.navigate('FertilityTestDetails', {
                      test: t,
                      autoOpenBooking: true,
                    })
                  }
                />
              </View>
            ))
          ) : (
            <EmptyState
              icon="flask-outline"
              title="No diagnostic tests found"
              subtitle="Try switching categories or clearing search keywords."
              actionLabel="View All Tests"
              onAction={() => {
                setSearch('');
                setSelectedCategory('All Tests');
                setSelectedGender('All');
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
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  genderPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genderPillActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  genderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  genderTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryChipsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  catChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  catChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listWrap: {
    marginTop: 2,
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

export default FertilityTestsScreen;
