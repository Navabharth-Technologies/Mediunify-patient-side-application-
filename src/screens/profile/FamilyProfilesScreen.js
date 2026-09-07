import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../../theme/colors';

const INITIAL_MEMBERS = [
  {
    id: 'self',
    name: 'Ramesh Kumar (Self)',
    displayName: 'Ramesh (Self)',
    relation: 'Self',
    age: '32 yrs',
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: 'None',
    conditions: 'None',
    icon: 'person',
    themeColor: '#00B894',
    bgLight: '#E6F8F4',
    isPrimary: true,
  },
  {
    id: 'fam-1',
    name: 'Sneha Ramesh',
    displayName: 'Sneha',
    relation: 'Spouse',
    age: '29 yrs',
    gender: 'Female',
    bloodGroup: 'B+',
    allergies: 'Penicillin',
    conditions: 'None',
    icon: 'heart',
    themeColor: '#EC4899',
    bgLight: '#FDF2F8',
    isPrimary: false,
  },
  {
    id: 'fam-2',
    name: 'Suresh Kumar',
    displayName: 'Father',
    relation: 'Father',
    age: '62 yrs',
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: 'Dust & Pollen',
    conditions: 'Hypertension',
    icon: 'shield-checkmark',
    themeColor: '#3B82F6',
    bgLight: '#EFF6FF',
    isPrimary: false,
  },
  {
    id: 'fam-3',
    name: 'Aarav Kumar',
    displayName: 'Aarav',
    relation: 'Son',
    age: '4 yrs',
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: 'None',
    conditions: 'None',
    icon: 'happy',
    themeColor: '#F59E0B',
    bgLight: '#FFFBEB',
    isPrimary: false,
  },
];

const RELATIONSHIPS = ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Sibling', 'Grandparent', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const FamilyProfilesScreen = ({ navigation }) => {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMemberId, setActiveMemberId] = useState('self');

  // Form states
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Spouse');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');

  useEffect(() => {
    loadMembers();
    const unsubscribe = navigation.addListener('focus', () => {
      loadMembers();
    });
    return unsubscribe;
  }, [navigation]);

  const loadMembers = async () => {
    try {
      // 1. Get Primary Account Holder Info
      const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
      const storedUser = await AsyncStorage.getItem('user');
      const storedName = await AsyncStorage.getItem('userName');

      let primaryOwnerName = '';
      let primaryOwnerAge = '28 yrs';
      let primaryOwnerGender = 'Male';
      let primaryOwnerBlood = 'O+';

      if (storedPrimary) {
        try {
          const p = JSON.parse(storedPrimary);
          if (p?.name && p.name.trim()) primaryOwnerName = p.name.trim();
          if (p?.age) primaryOwnerAge = p.age;
          if (p?.gender) primaryOwnerGender = p.gender;
          if (p?.bloodGroup) primaryOwnerBlood = p.bloodGroup.split(' ')[0];
        } catch (e) {}
      }
      if (!primaryOwnerName && storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u?.name && u.name.trim()) primaryOwnerName = u.name.trim();
        } catch (e) {}
      }
      if (!primaryOwnerName && storedName && storedName.trim()) {
        primaryOwnerName = storedName.trim();
      }

      const savedFam = await AsyncStorage.getItem('@unnathi_family_members');
      let currentMembers = INITIAL_MEMBERS;
      if (savedFam) {
        try {
          const parsed = JSON.parse(savedFam);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentMembers = parsed;
          }
        } catch (e) {}
      }

      // If we have an account owner name, dynamically sync the self/primary profile
      if (primaryOwnerName) {
        const cleanDisplayName = primaryOwnerName.split(' ')[0];
        let hasSelf = false;
        currentMembers = currentMembers.map((m) => {
          if (m.id === 'self' || m.isPrimary || m.relation === 'Self') {
            hasSelf = true;
            return {
              ...m,
              name: `${primaryOwnerName} (Self)`,
              displayName: `${cleanDisplayName} (Self)`,
              age: primaryOwnerAge,
              gender: primaryOwnerGender,
              bloodGroup: primaryOwnerBlood,
            };
          }
          return m;
        });

        if (!hasSelf) {
          currentMembers.unshift({
            id: 'self',
            name: `${primaryOwnerName} (Self)`,
            displayName: `${cleanDisplayName} (Self)`,
            relation: 'Self',
            age: primaryOwnerAge,
            gender: primaryOwnerGender,
            bloodGroup: primaryOwnerBlood,
            allergies: 'None',
            conditions: 'None',
            icon: 'person',
            themeColor: '#00B894',
            bgLight: '#E6F8F4',
            isPrimary: true,
          });
        }

        await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(currentMembers));
      }

      setMembers(currentMembers);

      const savedActive = await AsyncStorage.getItem('@unnathi_active_patient');
      if (savedActive) {
        try {
          const parsedActive = JSON.parse(savedActive);
          if (parsedActive?.id) {
            setActiveMemberId(parsedActive.id);
          }
        } catch (e) {}
      }
    } catch (e) {
      console.log('Error loading family profiles:', e);
    }
  };

  const handleSelectActiveMember = async (member) => {
    setActiveMemberId(member.id);
    await AsyncStorage.setItem('@unnathi_active_patient', JSON.stringify(member));
    if (member.isPrimary || member.relation === 'Self') {
      const cleanName = (member.displayName || member.name).replace(/\s*\([Ss]elf\)/g, '').split(' ')[0];
      await AsyncStorage.setItem('userName', cleanName);
    }
    const cleanName = (member.displayName || member.name).replace(/\s*\([Ss]elf\)/g, '').split(' ')[0];
    Alert.alert('Active Patient Selected 🩺', `${member.name} is now selected for appointments & orders.`);
  };

  const handleAddMember = async () => {
    if (!name.trim() || !age.trim()) {
      Alert.alert('Incomplete Info', 'Please enter member name and age.');
      return;
    }

    const newMember = {
      id: `fam-${Date.now()}`,
      name: name.trim(),
      displayName: name.trim().split(' ')[0],
      relation,
      age: `${age.trim()} yrs`,
      gender,
      bloodGroup,
      allergies: allergies.trim() || 'None',
      conditions: conditions.trim() || 'None',
      icon: relation === 'Spouse' ? 'heart' : relation === 'Father' ? 'shield-checkmark' : relation === 'Mother' ? 'rose' : relation === 'Son' || relation === 'Daughter' ? 'happy' : 'person',
      themeColor: relation === 'Spouse' ? '#EC4899' : relation === 'Father' ? '#3B82F6' : relation === 'Mother' ? '#8B5CF6' : '#00B894',
      bgLight: '#F0FDFA',
      isPrimary: false,
    };

    const updated = [...members, newMember];
    setMembers(updated);
    await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(updated));
    await AsyncStorage.setItem('@unnathi_active_patient', JSON.stringify(newMember));
    setActiveMemberId(newMember.id);
    setShowAddModal(false);
    setName('');
    setAge('');
    setAllergies('');
    setConditions('');
    Alert.alert('Family Member Added! 👨‍👩‍👧', `${newMember.name} is now linked and set as active patient for appointments.`);
  };

  const handleDeleteMember = (member) => {
    if (member.isPrimary) {
      Alert.alert('Cannot Remove', 'Primary account holder profile cannot be deleted.');
      return;
    }

    Alert.alert('Remove Member', `Do you want to remove ${member.name} from family profiles?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updated = members.filter((m) => m.id !== member.id);
          setMembers(updated);
          await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(updated));
          if (activeMemberId === member.id) {
            const fallback = updated[0] || INITIAL_MEMBERS[0];
            setActiveMemberId(fallback.id);
            await AsyncStorage.setItem('@unnathi_active_patient', JSON.stringify(fallback));
          }
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
          <Text style={styles.headerTitle}>Family Profiles</Text>
          <Text style={styles.headerSubtitle}>Manage health records for your family</Text>
        </View>

        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* BANNER */}
        <View style={styles.banner}>
          <View style={styles.bannerIconCircle}>
            <Ionicons name="people" size={28} color={colors.primary} />
          </View>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle}>One Account, Entire Family Care</Text>
            <Text style={styles.bannerSub}>
              Book appointments, order medicines, and track lab tests for any family member.
            </Text>
          </View>
        </View>

        {/* MEMBERS LIST */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Linked Family Members ({members.length})</Text>
        </View>

        {members.map((member) => {
          const isActive = activeMemberId === member.id;
          return (
            <TouchableOpacity
              key={member.id}
              style={[styles.memberCard, isActive && styles.memberCardActive]}
              activeOpacity={0.9}
              onPress={() => handleSelectActiveMember(member)}
            >
              <View style={styles.cardTop}>
                <View style={styles.avatarCircle}>
                  <Ionicons
                    name={
                      member.relation === 'Self'
                        ? 'person'
                        : member.gender === 'Female'
                        ? 'woman'
                        : 'man'
                    }
                    size={22}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.memberInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>Primary</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.memberMeta}>
                    {member.relation} • {member.age} • {member.gender}
                  </Text>
                </View>

                {!member.isPrimary && (
                  <TouchableOpacity
                    onPress={() => handleDeleteMember(member)}
                    style={styles.trashBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color="#E53935" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.divider} />

              {/* MEDICAL STATS */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Blood Group</Text>
                  <Text style={styles.statValue}>{member.bloodGroup}</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Allergies</Text>
                  <Text style={styles.statValue}>{member.allergies}</Text>
                </View>

                {member.conditions && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Condition</Text>
                    <Text style={styles.statValue}>{member.conditions}</Text>
                  </View>
                )}
              </View>

              {/* SWITCH / ACTIVE BUTTON */}
              <View style={styles.cardBottomAction}>
                <View style={styles.activeCheckRow}>
                  <Ionicons
                    name={isActive ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={isActive ? colors.primary : colors.slate}
                  />
                  <Text
                    style={[
                      styles.activeCheckText,
                      isActive && styles.activeCheckTextActive,
                    ]}
                  >
                    {isActive ? 'Active Booking Profile' : 'Tap to Switch Active Profile'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ADD MEMBER BUTTON */}
        <TouchableOpacity
          style={styles.addBtnLarge}
          activeOpacity={0.85}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle" size={22} color={colors.white} />
          <Text style={styles.addBtnLargeText}>Add New Family Member</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ADD MEMBER MODAL */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowAddModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={Keyboard.dismiss}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={() => {}}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Family Member</Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowAddModal(false);
                  }}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={22} color={colors.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Priya Kumar"
                  placeholderTextColor={colors.slate}
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.inputLabel}>Relationship</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                  {RELATIONSHIPS.map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      style={[styles.modalPill, relation === rel && styles.modalPillActive]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setRelation(rel);
                      }}
                    >
                      <Text style={[styles.modalPillText, relation === rel && styles.modalPillTextActive]}>
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Age (Years) *</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. 28"
                      placeholderTextColor={colors.slate}
                      value={age}
                      onChangeText={setAge}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Gender</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      {['Male', 'Female'].map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.genderPill, gender === g && styles.genderPillActive]}
                          onPress={() => {
                            Keyboard.dismiss();
                            setGender(g);
                          }}
                        >
                          <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Blood Group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                  {BLOOD_GROUPS.map((bg) => (
                    <TouchableOpacity
                      key={bg}
                      style={[styles.modalPill, bloodGroup === bg && styles.modalPillActive]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setBloodGroup(bg);
                      }}
                    >
                      <Text style={[styles.modalPillText, bloodGroup === bg && styles.modalPillTextActive]}>
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Known Allergies (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Penicillin, Peanuts, None"
                  placeholderTextColor={colors.slate}
                  value={allergies}
                  onChangeText={setAllergies}
                />

                <TouchableOpacity
                  style={styles.saveBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleAddMember();
                  }}
                >
                  <Text style={styles.saveBtnText}>Save Family Member</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
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
  addHeaderBtn: {
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
  banner: {
    backgroundColor: '#E8F7F4',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#C0EFE5',
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.secondary,
  },
  bannerSub: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 2,
    lineHeight: 14,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.secondary,
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FAFFFD',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondary,
  },
  primaryBadge: {
    backgroundColor: '#E8F8F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: '#00A382',
    fontSize: 9,
    fontWeight: '900',
  },
  memberMeta: {
    fontSize: 11,
    color: colors.slate,
    marginTop: 2,
  },
  trashBtn: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F6',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: colors.slate,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 2,
  },
  cardBottomAction: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F6',
  },
  activeCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeCheckText: {
    fontSize: 11,
    color: colors.slate,
    fontWeight: '700',
  },
  activeCheckTextActive: {
    color: colors.primary,
    fontWeight: '900',
  },
  addBtnLarge: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  addBtnLargeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.secondary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '600',
    marginBottom: 10,
  },
  pillsScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  modalPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F0F4F6',
    marginRight: 8,
  },
  modalPillActive: {
    backgroundColor: colors.primary,
  },
  modalPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  modalPillTextActive: {
    color: colors.white,
    fontWeight: '900',
  },
  genderPill: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F0F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderPillActive: {
    backgroundColor: colors.primary,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  genderTextActive: {
    color: colors.white,
    fontWeight: '900',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
});

export default FamilyProfilesScreen;
