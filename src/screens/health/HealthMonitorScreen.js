import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../../theme/colors';

const STORAGE_KEY = '@unnathi_health_vitals';

const INITIAL_VITALS = [
  {
    id: 'v-1',
    type: 'sugar',
    title: 'Blood Sugar (Fasting)',
    value: '95',
    unit: 'mg/dL',
    subType: 'Fasting',
    status: 'Normal',
    statusColor: '#10B981',
    statusBg: '#ECFDF5',
    date: 'Today, 08:30 AM',
    timestamp: Date.now() - 3600000 * 2,
    patient: 'Self',
    notes: 'Morning before breakfast',
  },
  {
    id: 'v-2',
    type: 'bp',
    title: 'Blood Pressure',
    value: '120/80',
    systolic: '120',
    diastolic: '80',
    pulse: '72',
    unit: 'mmHg',
    status: 'Optimal',
    statusColor: '#10B981',
    statusBg: '#ECFDF5',
    date: 'Yesterday, 06:15 PM',
    timestamp: Date.now() - 86400000,
    patient: 'Self',
    notes: 'Sitting resting BP',
  },
  {
    id: 'v-3',
    type: 'spo2',
    title: 'Blood Oxygen (SpO2)',
    value: '98',
    unit: '%',
    status: 'Healthy',
    statusColor: '#0EA5E9',
    statusBg: '#F0F9FF',
    date: 'Yesterday, 06:15 PM',
    timestamp: Date.now() - 86400000,
    patient: 'Self',
    notes: 'Pulse oximeter reading',
  },
  {
    id: 'v-4',
    type: 'temp',
    title: 'Body Temperature',
    value: '98.4',
    unit: '°F',
    status: 'Normal',
    statusColor: '#10B981',
    statusBg: '#ECFDF5',
    date: '28 Aug, 09:00 AM',
    timestamp: Date.now() - 86400000 * 4,
    patient: 'Self',
    notes: 'Digital thermometer',
  },
  {
    id: 'v-5',
    type: 'weight',
    title: 'Weight & BMI',
    value: '68',
    height: '172',
    bmi: '23.0',
    unit: 'kg',
    status: 'Normal BMI',
    statusColor: '#10B981',
    statusBg: '#ECFDF5',
    date: '25 Aug, 07:30 AM',
    timestamp: Date.now() - 86400000 * 7,
    patient: 'Self',
    notes: 'Morning weight',
  },
];

const PARAM_CONFIG = {
  sugar: {
    name: 'Blood Sugar',
    icon: 'water',
    iconColor: '#E11D48',
    bg: '#FFE4E6',
    units: 'mg/dL',
    description: 'Track Fasting, Post-Meal (PP), or Random glucose',
  },
  bp: {
    name: 'Blood Pressure',
    icon: 'heart',
    iconColor: '#EF4444',
    bg: '#FEE2E2',
    units: 'mmHg',
    description: 'Systolic & Diastolic pressure with pulse',
  },
  spo2: {
    name: 'Oxygen (SpO2)',
    icon: 'pulse',
    iconColor: '#0284C7',
    bg: '#E0F2FE',
    units: '%',
    description: 'Blood oxygen saturation percentage',
  },
  temp: {
    name: 'Temperature',
    icon: 'thermometer',
    iconColor: '#D97706',
    bg: '#FEF3C7',
    units: '°F',
    description: 'Body temperature from home thermometer',
  },
  weight: {
    name: 'Weight & BMI',
    icon: 'scale',
    iconColor: '#16A34A',
    bg: '#DCFCE7',
    units: 'kg',
    description: 'Body mass & calculated BMI',
  },
};

const HealthMonitorScreen = ({ navigation }) => {
  const [vitalsList, setVitalsList] = useState(INITIAL_VITALS);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [activePatient, setActivePatient] = useState('Self');

  // Modal Form State
  const [formType, setFormType] = useState('sugar');
  const [sugarVal, setSugarVal] = useState('');
  const [sugarContext, setSugarContext] = useState('Fasting');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [pulseVal, setPulseVal] = useState('');
  const [spo2Val, setSpo2Val] = useState('');
  const [tempVal, setTempVal] = useState('');
  const [weightVal, setWeightVal] = useState('');
  const [heightVal, setHeightVal] = useState('170');
  const [notesVal, setNotesVal] = useState('');

  // Load from AsyncStorage
  useEffect(() => {
    loadSavedVitals();
  }, []);

  const loadSavedVitals = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVitalsList(parsed);
        }
      }
    } catch (e) {
      console.log('Error loading vitals:', e);
    }
  };

  const saveVitals = async (newList) => {
    try {
      setVitalsList(newList);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.log('Error saving vitals:', e);
    }
  };

  // Status Evaluation Helpers
  const evaluateSugar = (val, context) => {
    const num = parseFloat(val);
    if (isNaN(num)) return { status: 'Unknown', color: '#64748B', bg: '#F1F5F9' };
    if (context === 'Fasting') {
      if (num < 70) return { status: 'Low (Hypoglycemia)', color: '#DC2626', bg: '#FEE2E2' };
      if (num <= 99) return { status: 'Normal', color: '#10B981', bg: '#ECFDF5' };
      if (num <= 125) return { status: 'Pre-diabetes Range', color: '#D97706', bg: '#FEF3C7' };
      return { status: 'High (Diabetic Range)', color: '#E11D48', bg: '#FFE4E6' };
    } else {
      // Post-Meal / Random
      if (num < 70) return { status: 'Low Glucose', color: '#DC2626', bg: '#FEE2E2' };
      if (num <= 140) return { status: 'Normal', color: '#10B981', bg: '#ECFDF5' };
      if (num <= 199) return { status: 'Elevated Range', color: '#D97706', bg: '#FEF3C7' };
      return { status: 'High Glucose', color: '#E11D48', bg: '#FFE4E6' };
    }
  };

  const evaluateBP = (sys, dia) => {
    const s = parseInt(sys, 10);
    const d = parseInt(dia, 10);
    if (isNaN(s) || isNaN(d)) return { status: 'Unknown', color: '#64748B', bg: '#F1F5F9' };
    if (s < 90 || d < 60) return { status: 'Low BP (Hypotension)', color: '#2563EB', bg: '#EFF6FF' };
    if (s <= 120 && d <= 80) return { status: 'Optimal / Normal', color: '#10B981', bg: '#ECFDF5' };
    if (s <= 129 && d <= 80) return { status: 'Elevated BP', color: '#D97706', bg: '#FEF3C7' };
    if (s <= 139 || d <= 89) return { status: 'Stage 1 Hypertension', color: '#EA580C', bg: '#FFF7ED' };
    return { status: 'Stage 2 High BP', color: '#DC2626', bg: '#FEE2E2' };
  };

  const evaluateSpO2 = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return { status: 'Unknown', color: '#64748B', bg: '#F1F5F9' };
    if (num >= 95) return { status: 'Healthy & Normal', color: '#10B981', bg: '#ECFDF5' };
    if (num >= 90) return { status: 'Mild Hypoxia - Monitor', color: '#D97706', bg: '#FEF3C7' };
    return { status: 'Low - Consult Doctor', color: '#DC2626', bg: '#FEE2E2' };
  };

  const evaluateTemp = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return { status: 'Unknown', color: '#64748B', bg: '#F1F5F9' };
    if (num <= 97.0) return { status: 'Slightly Low', color: '#2563EB', bg: '#EFF6FF' };
    if (num <= 99.0) return { status: 'Normal', color: '#10B981', bg: '#ECFDF5' };
    if (num <= 100.4) return { status: 'Low-grade Fever', color: '#D97706', bg: '#FEF3C7' };
    return { status: 'Fever', color: '#DC2626', bg: '#FEE2E2' };
  };

  const evaluateBMI = (weightKg, heightCm) => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (isNaN(w) || isNaN(h) || h <= 0) return { bmi: '22.0', status: 'Normal', color: '#10B981', bg: '#ECFDF5' };
    const bmiVal = (w / (h * h)).toFixed(1);
    const num = parseFloat(bmiVal);
    if (num < 18.5) return { bmi: bmiVal, status: 'Underweight', color: '#2563EB', bg: '#EFF6FF' };
    if (num <= 24.9) return { bmi: bmiVal, status: 'Normal BMI', color: '#10B981', bg: '#ECFDF5' };
    if (num <= 29.9) return { bmi: bmiVal, status: 'Overweight', color: '#D97706', bg: '#FEF3C7' };
    return { bmi: bmiVal, status: 'Obese Range', color: '#DC2626', bg: '#FEE2E2' };
  };

  // Get Latest Values for Dashboard Cards
  const latestVitals = useMemo(() => {
    const getLatest = (type) => vitalsList.find((v) => v.type === type);
    return {
      sugar: getLatest('sugar') || { value: '--', unit: 'mg/dL', status: 'Not logged', statusColor: '#94A3B8' },
      bp: getLatest('bp') || { value: '--/--', unit: 'mmHg', status: 'Not logged', statusColor: '#94A3B8' },
      spo2: getLatest('spo2') || { value: '--', unit: '%', status: 'Not logged', statusColor: '#94A3B8' },
      temp: getLatest('temp') || { value: '--', unit: '°F', status: 'Not logged', statusColor: '#94A3B8' },
      weight: getLatest('weight') || { value: '--', unit: 'kg', bmi: '--', status: 'Not logged', statusColor: '#94A3B8' },
    };
  }, [vitalsList]);

  // Filtered History
  const filteredList = useMemo(() => {
    if (selectedFilter === 'all') return vitalsList;
    return vitalsList.filter((v) => v.type === selectedFilter);
  }, [vitalsList, selectedFilter]);

  // Submit New Log
  const handleSaveEntry = () => {
    const now = new Date();
    const dateStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let newEntry = null;

    if (formType === 'sugar') {
      if (!sugarVal.trim()) {
        Alert.alert('Required', 'Please enter your blood glucose reading.');
        return;
      }
      const evalRes = evaluateSugar(sugarVal, sugarContext);
      newEntry = {
        id: `v-${Date.now()}`,
        type: 'sugar',
        title: `Blood Sugar (${sugarContext})`,
        value: sugarVal.trim(),
        unit: 'mg/dL',
        subType: sugarContext,
        status: evalRes.status,
        statusColor: evalRes.color,
        statusBg: evalRes.bg,
        date: dateStr,
        timestamp: Date.now(),
        patient: activePatient,
        notes: notesVal.trim() || `${sugarContext} reading`,
      };
    } else if (formType === 'bp') {
      if (!bpSystolic.trim() || !bpDiastolic.trim()) {
        Alert.alert('Required', 'Please enter both Systolic and Diastolic blood pressure values.');
        return;
      }
      const evalRes = evaluateBP(bpSystolic, bpDiastolic);
      newEntry = {
        id: `v-${Date.now()}`,
        type: 'bp',
        title: 'Blood Pressure',
        value: `${bpSystolic.trim()}/${bpDiastolic.trim()}`,
        systolic: bpSystolic.trim(),
        diastolic: bpDiastolic.trim(),
        pulse: pulseVal.trim() || '72',
        unit: 'mmHg',
        status: evalRes.status,
        statusColor: evalRes.color,
        statusBg: evalRes.bg,
        date: dateStr,
        timestamp: Date.now(),
        patient: activePatient,
        notes: notesVal.trim() || (pulseVal ? `Pulse: ${pulseVal} bpm` : 'Self BP Monitor'),
      };
    } else if (formType === 'spo2') {
      if (!spo2Val.trim()) {
        Alert.alert('Required', 'Please enter your SpO2 percentage reading.');
        return;
      }
      const evalRes = evaluateSpO2(spo2Val);
      newEntry = {
        id: `v-${Date.now()}`,
        type: 'spo2',
        title: 'Oxygen (SpO2)',
        value: spo2Val.trim(),
        unit: '%',
        status: evalRes.status,
        statusColor: evalRes.color,
        statusBg: evalRes.bg,
        date: dateStr,
        timestamp: Date.now(),
        patient: activePatient,
        notes: notesVal.trim() || 'Finger pulse oximeter',
      };
    } else if (formType === 'temp') {
      if (!tempVal.trim()) {
        Alert.alert('Required', 'Please enter your body temperature in °F.');
        return;
      }
      const evalRes = evaluateTemp(tempVal);
      newEntry = {
        id: `v-${Date.now()}`,
        type: 'temp',
        title: 'Body Temperature',
        value: tempVal.trim(),
        unit: '°F',
        status: evalRes.status,
        statusColor: evalRes.color,
        statusBg: evalRes.bg,
        date: dateStr,
        timestamp: Date.now(),
        patient: activePatient,
        notes: notesVal.trim() || 'Digital thermometer reading',
      };
    } else if (formType === 'weight') {
      if (!weightVal.trim()) {
        Alert.alert('Required', 'Please enter your weight in kg.');
        return;
      }
      const evalRes = evaluateBMI(weightVal, heightVal || '170');
      newEntry = {
        id: `v-${Date.now()}`,
        type: 'weight',
        title: 'Weight & BMI',
        value: weightVal.trim(),
        height: heightVal.trim() || '170',
        bmi: evalRes.bmi,
        unit: 'kg',
        status: evalRes.status,
        statusColor: evalRes.color,
        statusBg: evalRes.bg,
        date: dateStr,
        timestamp: Date.now(),
        patient: activePatient,
        notes: notesVal.trim() || `BMI: ${evalRes.bmi}`,
      };
    }

    if (newEntry) {
      const updated = [newEntry, ...vitalsList];
      saveVitals(updated);
      setModalVisible(false);
      resetForm();
      Alert.alert('Vitals Logged', `Successfully updated your ${PARAM_CONFIG[formType].name} report.`);
    }
  };

  const resetForm = () => {
    setSugarVal('');
    setBpSystolic('');
    setBpDiastolic('');
    setPulseVal('');
    setSpo2Val('');
    setTempVal('');
    setWeightVal('');
    setNotesVal('');
  };

  const handleDeleteEntry = (id) => {
    Alert.alert('Delete Reading', 'Are you sure you want to remove this health record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = vitalsList.filter((v) => v.id !== id);
          saveVitals(updated);
        },
      },
    ]);
  };

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
          <Text style={styles.headerTitle}>Self Health Monitor</Text>
          <Text style={styles.headerSubtitle}>Log & track your Sugar, BP, SpO2 & Vitals</Text>
        </View>

        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* PATIENT PROFILE CHIP */}
        <View style={styles.patientBanner}>
          <View style={styles.patientInfo}>
            <Ionicons name="person-circle" size={24} color={colors.primary} />
            <Text style={styles.patientText}>Monitoring for: <Text style={styles.patientBold}>{activePatient}</Text></Text>
          </View>
          <TouchableOpacity
            style={styles.switchPatientBtn}
            onPress={() => {
              const options = ['Self', 'Sneha (Spouse)', 'Suresh Kumar (Father)'];
              const nextIdx = (options.indexOf(activePatient) + 1) % options.length;
              setActivePatient(options[nextIdx]);
            }}
          >
            <Text style={styles.switchPatientText}>Switch Patient</Text>
          </TouchableOpacity>
        </View>

        {/* VITALS OVERVIEW GRID */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Health Snapshot</Text>
          <Text style={styles.sectionSub}>Your latest self-tested readings</Text>
        </View>

        <View style={styles.gridContainer}>
          {/* BLOOD SUGAR */}
          <TouchableOpacity
            style={[styles.vitalsCard, { borderColor: '#FECDD3' }]}
            onPress={() => {
              setFormType('sugar');
              setModalVisible(true);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFE4E6' }]}>
                <Ionicons name="water" size={20} color="#E11D48" />
              </View>
              <View style={[styles.badge, { backgroundColor: latestVitals.sugar.statusBg || '#ECFDF5' }]}>
                <Text style={[styles.badgeText, { color: latestVitals.sugar.statusColor || '#10B981' }]}>
                  {latestVitals.sugar.status}
                </Text>
              </View>
            </View>
            <Text style={styles.vitalsLabel}>Blood Sugar</Text>
            <View style={styles.valueRow}>
              <Text style={styles.vitalsValue}>{latestVitals.sugar.value}</Text>
              <Text style={styles.vitalsUnit}> {latestVitals.sugar.unit}</Text>
            </View>
            <Text style={styles.vitalsDate}>{latestVitals.sugar.date || 'Tap + to log'}</Text>
          </TouchableOpacity>

          {/* BLOOD PRESSURE */}
          <TouchableOpacity
            style={[styles.vitalsCard, { borderColor: '#FECACA' }]}
            onPress={() => {
              setFormType('bp');
              setModalVisible(true);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="heart" size={20} color="#EF4444" />
              </View>
              <View style={[styles.badge, { backgroundColor: latestVitals.bp.statusBg || '#ECFDF5' }]}>
                <Text style={[styles.badgeText, { color: latestVitals.bp.statusColor || '#10B981' }]}>
                  {latestVitals.bp.status}
                </Text>
              </View>
            </View>
            <Text style={styles.vitalsLabel}>Blood Pressure (BP)</Text>
            <View style={styles.valueRow}>
              <Text style={styles.vitalsValue}>{latestVitals.bp.value}</Text>
              <Text style={styles.vitalsUnit}> {latestVitals.bp.unit}</Text>
            </View>
            <Text style={styles.vitalsDate}>{latestVitals.bp.date || 'Tap + to log'}</Text>
          </TouchableOpacity>

          {/* OXYGEN SPO2 */}
          <TouchableOpacity
            style={[styles.vitalsCard, { borderColor: '#BAE6FD' }]}
            onPress={() => {
              setFormType('spo2');
              setModalVisible(true);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="pulse" size={20} color="#0284C7" />
              </View>
              <View style={[styles.badge, { backgroundColor: latestVitals.spo2.statusBg || '#ECFDF5' }]}>
                <Text style={[styles.badgeText, { color: latestVitals.spo2.statusColor || '#10B981' }]}>
                  {latestVitals.spo2.status}
                </Text>
              </View>
            </View>
            <Text style={styles.vitalsLabel}>Oxygen (SpO2)</Text>
            <View style={styles.valueRow}>
              <Text style={styles.vitalsValue}>{latestVitals.spo2.value}</Text>
              <Text style={styles.vitalsUnit}> {latestVitals.spo2.unit}</Text>
            </View>
            <Text style={styles.vitalsDate}>{latestVitals.spo2.date || 'Tap + to log'}</Text>
          </TouchableOpacity>

          {/* TEMPERATURE */}
          <TouchableOpacity
            style={[styles.vitalsCard, { borderColor: '#FDE68A' }]}
            onPress={() => {
              setFormType('temp');
              setModalVisible(true);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="thermometer" size={20} color="#D97706" />
              </View>
              <View style={[styles.badge, { backgroundColor: latestVitals.temp.statusBg || '#ECFDF5' }]}>
                <Text style={[styles.badgeText, { color: latestVitals.temp.statusColor || '#10B981' }]}>
                  {latestVitals.temp.status}
                </Text>
              </View>
            </View>
            <Text style={styles.vitalsLabel}>Body Temp</Text>
            <View style={styles.valueRow}>
              <Text style={styles.vitalsValue}>{latestVitals.temp.value}</Text>
              <Text style={styles.vitalsUnit}> {latestVitals.temp.unit}</Text>
            </View>
            <Text style={styles.vitalsDate}>{latestVitals.temp.date || 'Tap + to log'}</Text>
          </TouchableOpacity>

          {/* WEIGHT & BMI */}
          <TouchableOpacity
            style={[styles.vitalsCard, { width: '100%', borderColor: '#BBF7D0' }]}
            onPress={() => {
              setFormType('weight');
              setModalVisible(true);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="scale" size={20} color="#16A34A" />
              </View>
              <View style={[styles.badge, { backgroundColor: latestVitals.weight.statusBg || '#ECFDF5' }]}>
                <Text style={[styles.badgeText, { color: latestVitals.weight.statusColor || '#10B981' }]}>
                  {latestVitals.weight.status} (BMI: {latestVitals.weight.bmi || '22.5'})
                </Text>
              </View>
            </View>
            <Text style={styles.vitalsLabel}>Body Weight</Text>
            <View style={styles.valueRow}>
              <Text style={styles.vitalsValue}>{latestVitals.weight.value}</Text>
              <Text style={styles.vitalsUnit}> {latestVitals.weight.unit}</Text>
            </View>
            <Text style={styles.vitalsDate}>{latestVitals.weight.date || 'Tap + to log'}</Text>
          </TouchableOpacity>
        </View>

        {/* LOG NEW VITAL ACTION BUTTON */}
        <TouchableOpacity
          style={styles.mainActionBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.mainActionText}>+ Update New Health Report</Text>
        </TouchableOpacity>

        {/* HEALTH TIPS & GUIDANCE */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={22} color="#F59E0B" />
            <Text style={styles.tipsTitle}>Personalized Doctor Tips</Text>
          </View>
          <Text style={styles.tipsBody}>
            • For accurate Blood Sugar, test Fasting early morning before food (Normal: 70-99 mg/dL).{'\n'}
            • Rest for 5 minutes before checking Blood Pressure to avoid false high readings.{'\n'}
            • If Blood Sugar &gt; 180 or BP &gt; 140/90 repeatedly, consult our specialist doctor.
          </Text>
          <TouchableOpacity
            style={styles.consultDocBtn}
            onPress={() => navigation.navigate('DoctorList')}
          >
            <Text style={styles.consultDocText}>Consult Doctor Online →</Text>
          </TouchableOpacity>
        </View>

        {/* HISTORY & LOGS */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vitals History Log</Text>
            <Text style={styles.sectionSub}>All saved self-tests</Text>
          </View>

          {/* FILTER CHIPS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {[
              { id: 'all', label: 'All Vitals' },
              { id: 'sugar', label: 'Sugar' },
              { id: 'bp', label: 'Blood Pressure' },
              { id: 'spo2', label: 'SpO2' },
              { id: 'temp', label: 'Temperature' },
              { id: 'weight', label: 'Weight' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, selectedFilter === f.id && styles.filterChipActive]}
                onPress={() => setSelectedFilter(f.id)}
              >
                <Text style={[styles.filterText, selectedFilter === f.id && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* LIST */}
          {filteredList.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No records in this category</Text>
              <Text style={styles.emptySub}>Tap '+ Update New Health Report' to add a test.</Text>
            </View>
          ) : (
            filteredList.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={[styles.historyIcon, { backgroundColor: PARAM_CONFIG[item.type]?.bg || '#EEF2FF' }]}>
                  <Ionicons
                    name={PARAM_CONFIG[item.type]?.icon || 'pulse'}
                    size={20}
                    color={PARAM_CONFIG[item.type]?.iconColor || colors.primary}
                  />
                </View>

                <View style={styles.historyDetails}>
                  <View style={styles.historyTopRow}>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <View style={[styles.badge, { backgroundColor: item.statusBg || '#ECFDF5' }]}>
                      <Text style={[styles.badgeText, { color: item.statusColor || '#10B981' }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.historyValue}>
                    {item.value} <Text style={styles.historyUnit}>{item.unit}</Text>
                    {item.pulse ? ` • Pulse: ${item.pulse} bpm` : ''}
                  </Text>

                  <View style={styles.historyMetaRow}>
                    <Text style={styles.historyDate}>
                      <Ionicons name="time-outline" size={12} color="#64748B" /> {item.date}
                    </Text>
                    <Text style={styles.historyPatient}>• For: {item.patient}</Text>
                  </View>
                  {item.notes ? <Text style={styles.historyNotes}>Note: {item.notes}</Text> : null}
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteEntry(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ==================================================
          LOGGING MODAL
      ================================================== */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Health Report</Text>
                <Text style={styles.modalSubtitle}>Enter your self-tested reading</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* PARAMETER SELECTOR TABS */}
              <Text style={styles.inputLabel}>Select Health Test</Text>
              <View style={styles.paramTabsRow}>
                {Object.keys(PARAM_CONFIG).map((key) => {
                  const conf = PARAM_CONFIG[key];
                  const isSelected = formType === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.paramTab,
                        isSelected && { borderColor: conf.iconColor, backgroundColor: conf.bg },
                      ]}
                      onPress={() => setFormType(key)}
                    >
                      <Ionicons
                        name={conf.icon}
                        size={18}
                        color={isSelected ? conf.iconColor : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.paramTabText,
                          isSelected && { color: conf.iconColor, fontWeight: '700' },
                        ]}
                      >
                        {conf.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SPECIFIC PARAMETER FORM INPUTS */}
              {formType === 'sugar' && (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Test Timing / Context</Text>
                  <View style={styles.contextRow}>
                    {['Fasting', 'Post-Meal (PP)', 'Random', 'Bedtime'].map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.contextChip,
                          sugarContext === c && styles.contextChipActive,
                        ]}
                        onPress={() => setSugarContext(c)}
                      >
                        <Text
                          style={[
                            styles.contextText,
                            sugarContext === c && styles.contextTextActive,
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Glucose Level (mg/dL)</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.mainInput}
                      placeholder="e.g. 95"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={sugarVal}
                      onChangeText={setSugarVal}
                    />
                    <Text style={styles.unitSuffix}>mg/dL</Text>
                  </View>
                  <Text style={styles.helperText}>
                    Normal Fasting: 70–99 mg/dL | Normal Post-Meal: &lt;140 mg/dL
                  </Text>
                </View>
              )}

              {formType === 'bp' && (
                <View style={styles.formGroup}>
                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Systolic (High)</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.mainInput}
                          placeholder="120"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={bpSystolic}
                          onChangeText={setBpSystolic}
                        />
                        <Text style={styles.unitSuffix}>mmHg</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.inputLabel}>Diastolic (Low)</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.mainInput}
                          placeholder="80"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={bpDiastolic}
                          onChangeText={setBpDiastolic}
                        />
                        <Text style={styles.unitSuffix}>mmHg</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Pulse / Heart Rate (Optional)</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.mainInput}
                      placeholder="e.g. 72"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={pulseVal}
                      onChangeText={setPulseVal}
                    />
                    <Text style={styles.unitSuffix}>bpm</Text>
                  </View>
                  <Text style={styles.helperText}>Normal resting BP is below 120/80 mmHg.</Text>
                </View>
              )}

              {formType === 'spo2' && (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Blood Oxygen Saturation (%)</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.mainInput}
                      placeholder="e.g. 98"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={spo2Val}
                      onChangeText={setSpo2Val}
                    />
                    <Text style={styles.unitSuffix}>%</Text>
                  </View>
                  <Text style={styles.helperText}>Healthy normal SpO2 is 95% to 100%.</Text>
                </View>
              )}

              {formType === 'temp' && (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Body Temperature (°F)</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.mainInput}
                      placeholder="e.g. 98.6"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={tempVal}
                      onChangeText={setTempVal}
                    />
                    <Text style={styles.unitSuffix}>°F</Text>
                  </View>
                  <Text style={styles.helperText}>Normal human body temp is ~98.6°F (37°C).</Text>
                </View>
              )}

              {formType === 'weight' && (
                <View style={styles.formGroup}>
                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Weight (kg)</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.mainInput}
                          placeholder="e.g. 68"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={weightVal}
                          onChangeText={setWeightVal}
                        />
                        <Text style={styles.unitSuffix}>kg</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.inputLabel}>Height (cm)</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.mainInput}
                          placeholder="170"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={heightVal}
                          onChangeText={setHeightVal}
                        />
                        <Text style={styles.unitSuffix}>cm</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.helperText}>BMI will be automatically computed upon saving.</Text>
                </View>
              )}

              {/* NOTES */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Add Notes / Symptoms (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g. Felt dizzy, taken after 30m walk"
                placeholderTextColor="#94A3B8"
                value={notesVal}
                onChangeText={setNotesVal}
              />

              {/* SAVE BUTTON */}
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveEntry}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitText}>Save Health Record</Text>
              </TouchableOpacity>
            </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addHeaderBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  patientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientText: {
    fontSize: 13,
    color: '#64748B',
  },
  patientBold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  switchPatientBtn: {
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchPatientText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  vitalsCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  vitalsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  vitalsValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  vitalsUnit: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  vitalsDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  mainActionBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  mainActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  tipsBody: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 12,
  },
  consultDocBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  consultDocText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  historySection: {
    marginTop: 4,
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'flex-start',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyDetails: {
    flex: 1,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  historyValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginVertical: 2,
  },
  historyUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  historyDate: {
    fontSize: 11,
    color: '#64748B',
  },
  historyPatient: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },
  historyNotes: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteBtn: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  paramTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  paramTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  paramTabText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 12,
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  contextChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  contextChipActive: {
    backgroundColor: colors.primary,
  },
  contextText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  contextTextActive: {
    color: '#FFFFFF',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  mainInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  unitSuffix: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1E293B',
    marginBottom: 20,
  },
  modalSubmitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default HealthMonitorScreen;
