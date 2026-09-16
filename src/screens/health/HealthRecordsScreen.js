import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../theme/colors';

const HealthRecordsScreen = ({ navigation }) => {
  // State
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [selectedTab, setSelectedTab] = useState('all'); // all, labs, rx, scans, bills
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [viewDocModalVisible, setViewDocModalVisible] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSyncingAbha, setIsSyncingAbha] = useState(false);

  // Dynamic Family Profiles & User Data
  const [familyMembers, setFamilyMembers] = useState([]);
  const [primaryUserName, setPrimaryUserName] = useState('Account Holder');
  const [primaryUserDisplayName, setPrimaryUserDisplayName] = useState('Self');
  const [userRecords, setUserRecords] = useState([]);
  const [selectedUploadPatientId, setSelectedUploadPatientId] = useState('self');

  // Load Family Members & User on mount and focus
  useEffect(() => {
    loadFamilyAndRecords();
    const unsubscribe = navigation.addListener('focus', () => {
      loadFamilyAndRecords();
    });
    return unsubscribe;
  }, [navigation]);

  const loadFamilyAndRecords = async () => {
    try {
      // 1. Get primary account user name
      const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
      const storedUser = await AsyncStorage.getItem('user');
      const storedName = await AsyncStorage.getItem('userName');

      let currentPrimaryName = '';
      if (storedPrimary) {
        try {
          const p = JSON.parse(storedPrimary);
          if (p?.name && p.name.trim()) currentPrimaryName = p.name.trim();
        } catch (e) {}
      }
      if (!currentPrimaryName && storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u?.name && u.name.trim()) currentPrimaryName = u.name.trim();
        } catch (e) {}
      }
      if (!currentPrimaryName && storedName && storedName.trim()) {
        currentPrimaryName = storedName.trim();
      }

      const effectivePrimary = currentPrimaryName || 'Ramesh Kumar';
      setPrimaryUserName(effectivePrimary);
      const cleanFirst = effectivePrimary.split(' ')[0];
      setPrimaryUserDisplayName(cleanFirst);

      // 2. Load linked family members
      const savedFam = await AsyncStorage.getItem('@unnathi_family_members');
      let loadedMembers = [];
      if (savedFam) {
        try {
          const parsed = JSON.parse(savedFam);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedMembers = parsed;
          }
        } catch (e) {}
      }

      if (!loadedMembers || loadedMembers.length === 0) {
        loadedMembers = [
          {
            id: 'self',
            name: `${effectivePrimary} (Self)`,
            displayName: `${cleanFirst} (Self)`,
            relation: 'Self',
            isPrimary: true,
          },
        ];
      } else {
        loadedMembers = loadedMembers.map((m) => {
          if (m.id === 'self' || m.isPrimary || m.relation === 'Self') {
            return {
              ...m,
              name: `${effectivePrimary} (Self)`,
              displayName: `${cleanFirst} (Self)`,
            };
          }
          return m;
        });
      }

      setFamilyMembers(loadedMembers);

      // 3. Load user-added custom health records
      const savedRecordsJson = await AsyncStorage.getItem('@unnathi_health_records');
      if (savedRecordsJson) {
        try {
          const parsedRecs = JSON.parse(savedRecordsJson);
          if (Array.isArray(parsedRecs)) {
            setUserRecords(parsedRecs);
          }
        } catch (e) {}
      }
    } catch (err) {
      console.log('Error loading family & health records:', err);
    }
  };

  // Dynamically map base medical records to synced family members
  const allRecords = useMemo(() => {
    const selfMember = familyMembers.find((m) => m.id === 'self' || m.isPrimary) || {
      id: 'self',
      name: `${primaryUserName} (Self)`,
      displayName: primaryUserDisplayName,
    };
    const spouseMember = familyMembers.find(
      (m) => m.relation === 'Spouse' || m.id === 'fam-1' || m.id === 'sneha'
    );
    const fatherMember = familyMembers.find(
      (m) => m.relation === 'Father' || m.id === 'fam-2' || m.id === 'suresh'
    );
    const sonMember = familyMembers.find(
      (m) => m.relation === 'Son' || m.relation === 'Daughter' || m.id === 'fam-3' || m.id === 'aarav'
    );

    const defaultRecords = [
      {
        id: 'rec-1',
        title: 'Complete Blood Count (CBC) & ESR',
        category: 'labs',
        patient: 'self',
        patientId: selfMember.id,
        patientName: selfMember.name || `${primaryUserName} (Self)`,
        facility: 'Suburban Diagnostic Center, Mysore',
        doctor: 'Dr. Rajesh Sharma (MD Pathologist)',
        date: '28 Aug 2026',
        fileSize: '1.8 MB PDF',
        status: 'Normal',
        statusColor: '#059669',
        statusBg: '#ECFDF5',
        icon: 'flask',
        iconColor: '#0284C7',
        iconBg: '#E0F2FE',
        summary: 'Hemoglobin: 14.5 g/dL (Normal) • Platelets: 240,000 /mcL • WBC: 6,800 /mcL.',
      },
      {
        id: 'rec-2',
        title: 'Brain 3T MRI & Diffusion Scan',
        category: 'scans',
        patient: fatherMember ? fatherMember.id : 'fam-2',
        patientId: fatherMember ? fatherMember.id : 'fam-2',
        patientName: fatherMember ? `${fatherMember.name} (${fatherMember.relation})` : 'Father',
        facility: 'Unnathi Advanced 3T MRI & Scan Center',
        doctor: 'Dr. Anand Verma (Radiologist)',
        date: '25 Aug 2026',
        fileSize: '14.2 MB DICOM/PDF',
        status: 'Doctor Reviewed',
        statusColor: '#7C3AED',
        statusBg: '#F5F3FF',
        icon: 'scan',
        iconColor: '#7C3AED',
        iconBg: '#EDE9FE',
        summary: 'No acute intracranial hemorrhage or infarct. Age-related normal cerebral findings.',
      },
      {
        id: 'rec-3',
        title: 'Cardiology Rx - Telmisartan & Atorvastatin',
        category: 'rx',
        patient: 'self',
        patientId: selfMember.id,
        patientName: selfMember.name || `${primaryUserName} (Self)`,
        facility: 'Apollo Cardiology Clinic',
        doctor: 'Dr. Rajesh Sharma, MD DM (Cardio)',
        date: '20 Aug 2026',
        fileSize: '840 KB PDF',
        status: 'Active Refill',
        statusColor: '#0D9488',
        statusBg: '#F0FDFA',
        icon: 'medkit',
        iconColor: '#0D9488',
        iconBg: '#CCFBF1',
        summary: 'Telmisartan 40mg (1-0-0) After Breakfast • Atorvastatin 10mg (0-0-1) After Dinner.',
      },
      {
        id: 'rec-4',
        title: 'HbA1c & Fasting Plasma Glucose',
        category: 'labs',
        patient: 'self',
        patientId: selfMember.id,
        patientName: selfMember.name || `${primaryUserName} (Self)`,
        facility: 'Thyrocare Home Sample Lab',
        doctor: 'Dr. Anita Desai (Endocrinologist)',
        date: '15 Aug 2026',
        fileSize: '1.2 MB PDF',
        status: 'Optimal 5.6%',
        statusColor: '#059669',
        statusBg: '#ECFDF5',
        icon: 'water',
        iconColor: '#059669',
        iconBg: '#D1FAE5',
        summary: 'HbA1c: 5.6% (Non-Diabetic Range) • Fasting Blood Sugar: 98 mg/dL.',
      },
      {
        id: 'rec-5',
        title: 'Pediatric Vaccine Chart & Record',
        category: 'rx',
        patient: sonMember ? sonMember.id : 'fam-3',
        patientId: sonMember ? sonMember.id : 'fam-3',
        patientName: sonMember ? `${sonMember.name} (${sonMember.relation})` : 'Child Record',
        facility: 'Rainbow Children Hospital',
        doctor: 'Dr. Ananya Rao (Pediatrician)',
        date: '10 Aug 2026',
        fileSize: '2.4 MB PDF',
        status: 'Up to Date',
        statusColor: '#2563EB',
        statusBg: '#EFF6FF',
        icon: 'shield-checkmark',
        iconColor: '#2563EB',
        iconBg: '#DBEAFE',
        summary: 'MMR Dose 2 administered. Next scheduled vaccine: Typhoid Booster at 2 Years.',
      },
      {
        id: 'rec-6',
        title: 'Pharmacy Order Bill & GST Receipt',
        category: 'bills',
        patient: 'self',
        patientId: selfMember.id,
        patientName: selfMember.name || `${primaryUserName} (Self)`,
        facility: 'MediUnify Online Pharmacy',
        doctor: 'Prescription Verified Order #UNC10245',
        date: '05 Aug 2026',
        fileSize: '450 KB PDF',
        status: 'Paid ₹1,240',
        statusColor: '#D97706',
        statusBg: '#FEF3C7',
        icon: 'receipt',
        iconColor: '#EA580C',
        iconBg: '#FFEDD5',
        summary: 'GST Invoice #INV-883492 • Delivered to Kuvempunagar, Mysore • 20% Discount Applied.',
      },
    ];

    return [...userRecords, ...defaultRecords];
  }, [familyMembers, primaryUserName, primaryUserDisplayName, userRecords]);

  // Counts for tabs
  const categoryCounts = useMemo(() => {
    return {
      all: allRecords.length,
      labs: allRecords.filter((r) => r.category === 'labs').length,
      rx: allRecords.filter((r) => r.category === 'rx').length,
      scans: allRecords.filter((r) => r.category === 'scans').length,
      bills: allRecords.filter((r) => r.category === 'bills').length,
    };
  }, [allRecords]);

  const filterTabs = [
    { id: 'all', label: 'All Files', icon: 'documents', count: categoryCounts.all },
    { id: 'labs', label: 'Lab Tests', icon: 'flask', count: categoryCounts.labs },
    { id: 'rx', label: 'Prescriptions', icon: 'medkit', count: categoryCounts.rx },
    { id: 'scans', label: '3T Scans', icon: 'scan', count: categoryCounts.scans },
    { id: 'bills', label: 'Invoices', icon: 'receipt', count: categoryCounts.bills },
  ];

  // Dynamic patient switcher chips
  const dynamicFilterChips = useMemo(() => {
    const chips = [
      {
        id: 'all',
        name: 'All Vaults',
        relation: 'All Members',
        initials: 'ALL',
        count: allRecords.length,
      },
    ];

    familyMembers.forEach((member) => {
      const isSelf = member.id === 'self' || member.isPrimary || member.relation === 'Self';
      const memberCount = allRecords.filter(
        (r) =>
          r.patient === member.id ||
          r.patientId === member.id ||
          (isSelf && (r.patient === 'self' || r.patientId === 'self'))
      ).length;

      const rawName = isSelf ? (primaryUserDisplayName || 'You') : member.name.split(' ')[0];
      const initials = rawName.slice(0, 2).toUpperCase();

      chips.push({
        id: member.id,
        name: rawName,
        relation: isSelf ? 'Self' : (member.relation || 'Family'),
        initials,
        count: memberCount,
        member,
      });
    });

    return chips;
  }, [familyMembers, allRecords, primaryUserDisplayName]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      const isSelfSelected = selectedPatient === 'self';
      const matchesPatient =
        selectedPatient === 'all' ||
        rec.patient === selectedPatient ||
        rec.patientId === selectedPatient ||
        (isSelfSelected && (rec.patient === 'self' || rec.patientId === 'self'));

      const matchesTab = selectedTab === 'all' || rec.category === selectedTab;
      const matchesSearch =
        searchQuery.trim() === '' ||
        rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.facility.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.patientName && rec.patientName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesPatient && matchesTab && matchesSearch;
    });
  }, [allRecords, selectedPatient, selectedTab, searchQuery]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const handleSyncAbha = async () => {
    setIsSyncingAbha(true);
    await new Promise((res) => setTimeout(res, 800));
    setIsSyncingAbha(false);
    showToast('ABHA Digital Locker Synced • All Verified Records Loaded');
  };

  const handleShareDoc = async (doc) => {
    try {
      await Share.share({
        title: doc.title,
        message: `📄 MediUnify Verified Health Record:\n${doc.title}\nPatient: ${doc.patientName}\nDate: ${doc.date}\nDoctor: ${doc.doctor}\nView PDF: https://hemanthgowdatn2003.github.io/mediunify-patient/`,
      });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  const openDocViewer = (doc) => {
    setActiveDoc(doc);
    setViewDocModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. TOP APP BAR */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Health</Text>
          <View style={styles.headerSubtitleRow}>
            <View style={styles.headerLiveDot} />
            <Text style={styles.headerSubtitleText}>ABHA Verified • Digital Locker</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.uploadHeaderBtn}
          onPress={() => setUploadModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="cloud-upload" size={15} color="#FFFFFF" />
          <Text style={styles.uploadHeaderBtnText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <View style={styles.toastCard}>
          <Ionicons name="shield-checkmark" size={17} color="#34D399" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. ABHA DIGITAL HEALTH VAULT HERO CARD */}
        <View style={styles.abhaCard}>
          <View style={styles.abhaCardBgGlow} />

          <View style={styles.abhaTopRow}>
            <View style={styles.abhaBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#A7F3D0" />
              <Text style={styles.abhaBadgeText}>ABDM COMPLIANT</Text>
            </View>

            <View style={styles.abhaEncryptedTag}>
              <Ionicons name="lock-closed" size={11} color="#CCFBF1" />
              <Text style={styles.abhaEncryptedText}>256-Bit Encrypted</Text>
            </View>
          </View>

          <View style={styles.abhaTitleBlock}>
            <Text style={styles.abhaTitle}>Govt. Health Locker (ABHA)</Text>
            <View style={styles.abhaIdRow}>
              <Text style={styles.abhaIdText}>abha.id: </Text>
              <Text style={styles.abhaIdValue}>hemanth@abdm</Text>
              <Ionicons name="checkmark-circle" size={14} color="#34D399" style={{ marginLeft: 4 }} />
            </View>
          </View>

          {/* METRIC STRIP */}
          <View style={styles.abhaMetricsRow}>
            <View style={styles.abhaMetricItem}>
              <Text style={styles.abhaMetricNum}>{allRecords.length}</Text>
              <Text style={styles.abhaMetricLabel}>Documents</Text>
            </View>
            <View style={styles.abhaMetricDivider} />
            <View style={styles.abhaMetricItem}>
              <Text style={styles.abhaMetricNum}>{familyMembers.length}</Text>
              <Text style={styles.abhaMetricLabel}>Vault Profiles</Text>
            </View>
            <View style={styles.abhaMetricDivider} />
            <View style={styles.abhaMetricItem}>
              <Text style={styles.abhaMetricNum}>100%</Text>
              <Text style={styles.abhaMetricLabel}>Private & Safe</Text>
            </View>
          </View>

          {/* SYNC ABHA BUTTON */}
          <TouchableOpacity
            style={styles.syncAbhaBtn}
            onPress={handleSyncAbha}
            activeOpacity={0.85}
            disabled={isSyncingAbha}
          >
            {isSyncingAbha ? (
              <ActivityIndicator size="small" color="#047857" />
            ) : (
              <>
                <Ionicons name="sync" size={15} color="#047857" />
                <Text style={styles.syncAbhaBtnText}>Sync ABDM Health Stack</Text>
                <Ionicons name="chevron-forward" size={14} color="#047857" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. QUICK HEALTH HUB (4 VIBRANT TILES) */}
        <View style={styles.quickHubSection}>
          <Text style={styles.sectionHeaderTitle}>Health Services & Hub</Text>
          <View style={styles.quickHubGrid}>
            {/* Tile 1: Vitals */}
            <TouchableOpacity
              style={[styles.quickTile, { backgroundColor: '#FFF1F2', borderColor: '#FFE4E6' }]}
              onPress={() => navigation.navigate('HealthMonitor')}
              activeOpacity={0.82}
            >
              <View style={[styles.quickTileIconCircle, { backgroundColor: '#FFE4E6' }]}>
                <Ionicons name="heart" size={18} color="#E11D48" />
              </View>
              <View style={styles.quickTileContent}>
                <View style={styles.quickTileHeader}>
                  <Text style={styles.quickTileTitle}>Daily Vitals</Text>
                  <View style={[styles.quickTileMiniBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.quickTileMiniBadgeText, { color: '#BE123C' }]}>Live</Text>
                  </View>
                </View>
                <Text style={styles.quickTileSubtitle}>BP 120/80 • Sugar 95</Text>
              </View>
            </TouchableOpacity>

            {/* Tile 2: Prescriptions */}
            <TouchableOpacity
              style={[styles.quickTile, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}
              onPress={() => navigation.navigate('Prescriptions')}
              activeOpacity={0.82}
            >
              <View style={[styles.quickTileIconCircle, { backgroundColor: '#CCFBF1' }]}>
                <Ionicons name="medkit" size={18} color="#0D9488" />
              </View>
              <View style={styles.quickTileContent}>
                <View style={styles.quickTileHeader}>
                  <Text style={styles.quickTileTitle}>Prescriptions</Text>
                  <View style={[styles.quickTileMiniBadge, { backgroundColor: '#CCFBF1' }]}>
                    <Text style={[styles.quickTileMiniBadgeText, { color: '#0F766E' }]}>{categoryCounts.rx} Rx</Text>
                  </View>
                </View>
                <Text style={styles.quickTileSubtitle}>Dosages & Refills</Text>
              </View>
            </TouchableOpacity>

            {/* Tile 3: Diagnostic Lab Reports */}
            <TouchableOpacity
              style={[styles.quickTile, { backgroundColor: '#F0F9FF', borderColor: '#E0F2FE' }]}
              onPress={() => navigation.navigate('Reports')}
              activeOpacity={0.82}
            >
              <View style={[styles.quickTileIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="flask" size={18} color="#0284C7" />
              </View>
              <View style={styles.quickTileContent}>
                <View style={styles.quickTileHeader}>
                  <Text style={styles.quickTileTitle}>Lab Reports</Text>
                  <View style={[styles.quickTileMiniBadge, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.quickTileMiniBadgeText, { color: '#0369A1' }]}>{categoryCounts.labs} Files</Text>
                  </View>
                </View>
                <Text style={styles.quickTileSubtitle}>Blood, CBC & Sugar</Text>
              </View>
            </TouchableOpacity>

            {/* Tile 4: Scans & X-Ray */}
            <TouchableOpacity
              style={[styles.quickTile, { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' }]}
              onPress={() => setSelectedTab('scans')}
              activeOpacity={0.82}
            >
              <View style={[styles.quickTileIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="scan" size={18} color="#7C3AED" />
              </View>
              <View style={styles.quickTileContent}>
                <View style={styles.quickTileHeader}>
                  <Text style={styles.quickTileTitle}>3T Scans</Text>
                  <View style={[styles.quickTileMiniBadge, { backgroundColor: '#F3E8FF' }]}>
                    <Text style={[styles.quickTileMiniBadgeText, { color: '#6D28D9' }]}>{categoryCounts.scans} Scans</Text>
                  </View>
                </View>
                <Text style={styles.quickTileSubtitle}>MRI, CT & X-Ray</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. FAMILY VAULT AVATARS SWITCHER */}
        <View style={styles.familySection}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="people" size={17} color="#0F766E" />
              <Text style={styles.sectionHeaderTitle}>Family Health Vaults</Text>
            </View>
            <TouchableOpacity
              style={styles.manageFamilyBtn}
              onPress={() => navigation.navigate('FamilyProfiles')}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={14} color="#0F766E" />
              <Text style={styles.manageFamilyBtnText}>Manage ({familyMembers.length})</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.familyAvatarsScroll}
          >
            {dynamicFilterChips.map((chip) => {
              const isSelected = selectedPatient === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.familyCard, isSelected && styles.familyCardActive]}
                  onPress={() => setSelectedPatient(chip.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.familyAvatarCircle, isSelected && styles.familyAvatarCircleActive]}>
                    {chip.id === 'all' ? (
                      <Ionicons name="file-tray-full" size={18} color={isSelected ? '#FFFFFF' : '#0F766E'} />
                    ) : (
                      <Text style={[styles.familyAvatarText, isSelected && styles.familyAvatarTextActive]}>
                        {chip.initials}
                      </Text>
                    )}
                    <View style={[styles.familyCountBadge, isSelected && styles.familyCountBadgeActive]}>
                      <Text style={[styles.familyCountBadgeText, isSelected && styles.familyCountBadgeTextActive]}>
                        {chip.count}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.familyName, isSelected && styles.familyNameActive]} numberOfLines={1}>
                    {chip.name}
                  </Text>
                  <Text style={[styles.familyRelation, isSelected && styles.familyRelationActive]} numberOfLines={1}>
                    {chip.relation}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Add Member Card */}
            <TouchableOpacity
              style={styles.familyAddCard}
              onPress={() => navigation.navigate('FamilyProfiles')}
              activeOpacity={0.75}
            >
              <View style={styles.familyAddCircle}>
                <Ionicons name="person-add" size={16} color="#0F766E" />
              </View>
              <Text style={styles.familyAddText}>+ Add</Text>
              <Text style={styles.familyAddSub}>Member</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 5. SEARCH BAR */}
        <View style={styles.searchWrap}>
          <View style={styles.searchInputBox}>
            <Ionicons name="search" size={17} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search record by test, doctor or lab..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 6. CATEGORY FILTER PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          {filterTabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedTab(tab.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={isActive ? '#FFFFFF' : '#475569'}
                />
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.categoryPillCount, isActive && styles.categoryPillCountActive]}>
                  <Text style={[styles.categoryPillCountText, isActive && styles.categoryPillCountTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 7. SAVED DOCUMENTS LIST */}
        <View style={styles.recordsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>
              Medical Records ({filteredRecords.length})
            </Text>
            <TouchableOpacity onPress={() => setUploadModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.addRecordLinkText}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {filteredRecords.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="folder-open-outline" size={42} color="#0D9488" />
              </View>
              <Text style={styles.emptyTitle}>No medical records found</Text>
              <Text style={styles.emptySub}>
                {searchQuery.trim() !== ''
                  ? `No documents matching "${searchQuery}".`
                  : selectedPatient !== 'all'
                  ? 'No records linked to this member yet.'
                  : 'Start building your vault by uploading a medical slip or test report.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyUploadBtn}
                onPress={() => setUploadModalVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
                <Text style={styles.emptyUploadBtnText}>Upload Medical Document</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredRecords.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.recordCard}
                onPress={() => openDocViewer(doc)}
                activeOpacity={0.92}
              >
                {/* TOP ROW: ICON + TITLE + STATUS */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.cardIconBox, { backgroundColor: doc.iconBg }]}>
                    <Ionicons name={doc.icon} size={20} color={doc.iconColor} />
                  </View>

                  <View style={styles.cardTitleCol}>
                    <View style={styles.cardPatientPill}>
                      <Ionicons name="person" size={10} color="#0F766E" />
                      <Text style={styles.cardPatientPillText} numberOfLines={1}>
                        {doc.patientName}
                      </Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {doc.title}
                    </Text>
                  </View>

                  <View style={[styles.cardStatusBadge, { backgroundColor: doc.statusBg }]}>
                    <Text style={[styles.cardStatusBadgeText, { color: doc.statusColor }]}>
                      {doc.status}
                    </Text>
                  </View>
                </View>

                {/* DOCTOR & FACILITY ROW */}
                <View style={styles.cardDoctorRow}>
                  <View style={styles.cardDoctorLine}>
                    <Ionicons name="medkit-outline" size={13} color="#64748B" />
                    <Text style={styles.cardDoctorText} numberOfLines={1}>
                      {doc.doctor}
                    </Text>
                  </View>
                  <View style={styles.cardDoctorLine}>
                    <Ionicons name="business-outline" size={13} color="#64748B" />
                    <Text style={styles.cardFacilityText} numberOfLines={1}>
                      {doc.facility}
                    </Text>
                  </View>
                </View>

                {/* SUMMARY SNIPPET BOX */}
                <View style={styles.cardSummaryBox}>
                  <Ionicons name="analytics" size={13} color="#0F766E" />
                  <Text style={styles.cardSummaryText} numberOfLines={2}>
                    {doc.summary}
                  </Text>
                </View>

                {/* FOOTER ROW: DATE & ACTIONS */}
                <View style={styles.cardFooter}>
                  <View style={styles.cardMetaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#64748B" />
                    <Text style={styles.cardMetaText}>{doc.date}</Text>
                    <Text style={styles.cardMetaDot}>•</Text>
                    <Ionicons name="document-text-outline" size={13} color="#64748B" />
                    <Text style={styles.cardMetaText}>{doc.fileSize}</Text>
                  </View>

                  <View style={styles.cardActionsGroup}>
                    <TouchableOpacity
                      style={styles.cardShareBtn}
                      onPress={() => handleShareDoc(doc)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="share-social-outline" size={15} color="#0F766E" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardViewPdfBtn}
                      onPress={() => openDocViewer(doc)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="eye" size={13} color="#FFFFFF" />
                      <Text style={styles.cardViewPdfBtnText}>View PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ==========================================
          UPLOAD HEALTH DOCUMENT MODAL
      ========================================== */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTag}>DIGITAL HEALTH LOCKER</Text>
                <Text style={styles.modalTitle}>Upload Medical Document</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setUploadModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select document type to securely encrypt and sync with your ABHA ID.
            </Text>

            {/* FAMILY MEMBER SELECTION IN UPLOAD */}
            <Text style={styles.uploadModalSectionLabel}>Select Patient Profile:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.uploadPatientChips}
            >
              {familyMembers.map((m) => {
                const isSelected = selectedUploadPatientId === m.id;
                const isSelf = m.id === 'self' || m.isPrimary || m.relation === 'Self';
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.uploadPatientChip,
                      isSelected && styles.uploadPatientChipActive,
                    ]}
                    onPress={() => setSelectedUploadPatientId(m.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="person"
                      size={12}
                      color={isSelected ? '#FFFFFF' : '#0F766E'}
                    />
                    <Text
                      style={[
                        styles.uploadPatientChipText,
                        isSelected && styles.uploadPatientChipTextActive,
                      ]}
                    >
                      {isSelf
                        ? `Self (${primaryUserDisplayName})`
                        : m.relation
                        ? `${m.name.split(' ')[0]} (${m.relation})`
                        : m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.uploadOptionCard}
              onPress={() => {
                setUploadModalVisible(false);
                const targetMember = familyMembers.find((m) => m.id === selectedUploadPatientId);
                const targetName = targetMember ? targetMember.name : primaryUserName;
                showToast(`Camera Scanner ready for ${targetName}. Capture prescription.`);
                navigation.navigate('Prescriptions');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.uploadOptionIcon, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="camera" size={22} color="#0F766E" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.uploadOptionTitle}>Scan with Camera</Text>
                <Text style={styles.uploadOptionSub}>
                  Take a photo of physical prescription or doctor slip
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadOptionCard}
              onPress={() => {
                setUploadModalVisible(false);
                const targetMember = familyMembers.find((m) => m.id === selectedUploadPatientId);
                const targetName = targetMember ? targetMember.name : primaryUserName;
                showToast(`File picker ready for ${targetName}.`);
                navigation.navigate('Reports');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.uploadOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="document-attach" size={22} color="#2563EB" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.uploadOptionTitle}>Upload PDF or Image File</Text>
                <Text style={styles.uploadOptionSub}>
                  Choose CBC, MRI, CT scan or lab PDF from your phone
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadOptionCard}
              onPress={() => {
                setUploadModalVisible(false);
                showToast('Auto-syncing diagnostic lab reports via OTP.');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.uploadOptionIcon, { backgroundColor: '#FAF5FF' }]}>
                <Ionicons name="cloud-download" size={22} color="#9333EA" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.uploadOptionTitle}>Auto-Fetch from Hospital/Lab</Text>
                <Text style={styles.uploadOptionSub}>
                  Sync reports automatically using your Registered Mobile No.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          VIEW DOCUMENT PREVIEW MODAL
      ========================================== */}
      <Modal
        visible={viewDocModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewDocModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.viewDocModalContent}>
            {activeDoc && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTag}>VERIFIED REPORT PREVIEW</Text>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {activeDoc.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setViewDocModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* SIMULATED PDF VIEW */}
                <View style={styles.pdfPreviewBox}>
                  <Ionicons name="document-text" size={48} color="#0D9488" />
                  <Text style={styles.pdfPreviewName}>{activeDoc.title}</Text>
                  <Text style={styles.pdfPreviewMeta}>
                    {activeDoc.facility} • {activeDoc.date}
                  </Text>
                  <View style={styles.pdfStamp}>
                    <Ionicons name="shield-checkmark" size={14} color="#059669" />
                    <Text style={styles.pdfStampText}>ABDM Digitally Signed</Text>
                  </View>
                  <Text style={styles.pdfSummaryBoxText}>{activeDoc.summary}</Text>
                </View>

                {/* MODAL ACTIONS */}
                <View style={styles.pdfModalActions}>
                  <TouchableOpacity
                    style={styles.downloadModalBtn}
                    onPress={() => {
                      setViewDocModalVisible(false);
                      showToast('Document downloaded to device storage.');
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="download-outline" size={16} color="#0F766E" />
                    <Text style={styles.downloadModalBtnText}>Download PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareModalBtn}
                    onPress={() => {
                      setViewDocModalVisible(false);
                      handleShareDoc(activeDoc);
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.shareModalBtnText}>Share Record</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HealthRecordsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 1. TOP APP BAR
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  headerLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  uploadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // TOAST
  toastCard: {
    position: 'absolute',
    top: 72,
    alignSelf: 'center',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // 2. ABHA DIGITAL HEALTH VAULT HERO CARD
  abhaCard: {
    backgroundColor: '#064E3B',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#059669',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  abhaCardBgGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  abhaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  abhaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  abhaBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  abhaEncryptedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  abhaEncryptedText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  abhaTitleBlock: {
    marginBottom: 14,
  },
  abhaTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  abhaIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  abhaIdText: {
    fontSize: 12,
    color: '#A7F3D0',
    fontWeight: '600',
  },
  abhaIdValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  abhaMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  abhaMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  abhaMetricNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  abhaMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A7F3D0',
    marginTop: 2,
  },
  abhaMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  syncAbhaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  syncAbhaBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#047857',
  },

  // 3. QUICK HEALTH HUB
  quickHubSection: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  quickHubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  quickTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  quickTileIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTileContent: {
    flex: 1,
  },
  quickTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  quickTileTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickTileMiniBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  quickTileMiniBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  quickTileSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },

  // 4. FAMILY VAULTS AVATAR SWITCHER
  familySection: {
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  manageFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 3,
  },
  manageFamilyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  familyAvatarsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  familyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 82,
  },
  familyCardActive: {
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  familyAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  familyAvatarCircleActive: {
    backgroundColor: '#0F766E',
  },
  familyAvatarText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F766E',
  },
  familyAvatarTextActive: {
    color: '#FFFFFF',
  },
  familyCountBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#0F172A',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  familyCountBadgeActive: {
    backgroundColor: '#059669',
  },
  familyCountBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  familyCountBadgeTextActive: {
    color: '#FFFFFF',
  },
  familyName: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
  },
  familyNameActive: {
    color: '#0F766E',
  },
  familyRelation: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
    textAlign: 'center',
  },
  familyRelationActive: {
    color: '#0D9488',
  },
  familyAddCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    width: 76,
  },
  familyAddCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  familyAddText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  familyAddSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },

  // 5. SEARCH WRAP
  searchWrap: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },

  // 6. CATEGORY PILLS
  categoryPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  categoryPillCount: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  categoryPillCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  categoryPillCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  categoryPillCountTextActive: {
    color: '#FFFFFF',
  },

  // 7. RECORDS SECTION
  recordsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  addRecordLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleCol: {
    flex: 1,
  },
  cardPatientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  cardPatientPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 19,
  },
  cardStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cardStatusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  cardDoctorRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 3,
  },
  cardDoctorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardDoctorText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  cardFacilityText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardSummaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  cardSummaryText: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cardMetaDot: {
    color: '#CBD5E1',
    marginHorizontal: 2,
  },
  cardActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardShareBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  cardViewPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  cardViewPdfBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },

  // EMPTY STATE
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 17,
  },
  emptyUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  emptyUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  modalTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadModalSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    marginTop: 4,
  },
  uploadPatientChips: {
    gap: 8,
    paddingBottom: 12,
  },
  uploadPatientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  uploadPatientChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  uploadPatientChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  uploadPatientChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  uploadOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  uploadOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadOptionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  uploadOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // VIEW DOC MODAL
  viewDocModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    margin: 20,
    padding: 20,
  },
  pdfPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pdfPreviewName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 10,
    textAlign: 'center',
  },
  pdfPreviewMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
  },
  pdfStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  pdfStampText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  pdfSummaryBoxText: {
    fontSize: 11.5,
    color: '#334155',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 12,
    lineHeight: 16,
    width: '100%',
  },
  pdfModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  downloadModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 6,
  },
  downloadModalBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F766E',
  },
  shareModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  shareModalBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});