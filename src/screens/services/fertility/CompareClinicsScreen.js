import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { partnerFertilityCenters } from '../../../data/fertilityData';
import { ClinicComparisonCard } from '../../../components/fertility';
import WebFooter from '../../../components/web/WebFooter';

const CompareClinicsScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const initialClinics =
    route?.params?.initialClinics && route.params.initialClinics.length > 0
      ? route.params.initialClinics
      : [partnerFertilityCenters[0], partnerFertilityCenters[1]];

  const [selectedClinics, setSelectedClinics] = useState(initialClinics);

  const handleRemoveClinic = (id) => {
    if (selectedClinics.length <= 1) {
      alert('Keep at least 1 clinic to compare.');
      return;
    }
    setSelectedClinics(selectedClinics.filter((c) => c.id !== id));
  };

  const handleAddClinic = (clinic) => {
    if (selectedClinics.some((c) => c.id === clinic.id)) return;
    if (selectedClinics.length >= 3) {
      alert('You can compare a maximum of 3 clinics simultaneously.');
      return;
    }
    setSelectedClinics([...selectedClinics, clinic]);
  };

  const remainingClinics = partnerFertilityCenters.filter(
    (c) => !selectedClinics.some((sc) => sc.id === c.id)
  );

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
          <Text style={styles.headerTitle}>Compare Fertility Clinics</Text>
          <Text style={styles.headerSubtitle}>
            Comparing {selectedClinics.length} Accredited IVF Centers
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
        <Text style={styles.leadText}>
          Review clinical pregnancy rates, embryology cleanroom grades, transparent package pricing, and specialist teams side-by-side to make an informed decision.
        </Text>

        {/* Side-by-Side Comparison Matrix */}
        <ClinicComparisonCard
          clinics={selectedClinics}
          onRemoveClinic={handleRemoveClinic}
          onSelectClinic={(c) =>
            navigation.navigate('FertilityClinicProfile', { clinic: c })
          }
        />

        {/* Add More Clinics Section */}
        {selectedClinics.length < 3 && remainingClinics.length > 0 && (
          <View style={styles.addSection}>
            <Text style={styles.addTitle}>Add Another Clinic to Compare</Text>
            <View style={styles.addPillRow}>
              {remainingClinics.map((clinic) => (
                <TouchableOpacity
                  key={clinic.id}
                  style={styles.addPill}
                  onPress={() => handleAddClinic(clinic)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={16} color="#E11D48" />
                  <Text style={styles.addPillText}>{clinic.name.split(' - ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
  leadText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 10,
  },
  addSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 16,
  },
  addTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  addPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
});

export default CompareClinicsScreen;
