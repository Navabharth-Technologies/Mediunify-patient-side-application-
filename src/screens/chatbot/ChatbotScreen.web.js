import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import colors from '../../theme/colors';
import { showAlert } from '../../utils/alert';
import doctors from '../../data/doctors';
import { radiologyLabs } from '../../data/radiologyLabsData';
import { useCart } from '../../context/CartContext';
import WebBackButton from '../../components/web/WebBackButton';

// ─── Quick topic chips shown in sidebar & welcome ─────────────────────────
const QUICK_CATEGORIES = [
  { id: 'fever',     icon: 'thermometer', label: 'Fever & Cold',       prompt: 'I have fever and body pain',              color: '#FF7F50', bg: '#FFF2ED' },
  { id: 'cardio',    icon: 'heart',       label: 'Heart & Chest',      prompt: 'Best Cardiologist for Chest Pain',        color: '#FF7F50', bg: '#FFF2ED' },
  { id: 'scan',      icon: 'scan',        label: 'Scan Prescription',  prompt: 'Scan My Prescription',                   color: '#00B894', bg: '#E6F8F5' },
  { id: 'lab',       icon: 'flask',       label: 'Lab Tests & MRI',    prompt: 'Suggest nearby Lab for Blood Test',       color: '#00C2CB', bg: '#E0F7FA' },
  { id: 'meds',      icon: 'medkit',      label: 'Medicine Advice',    prompt: 'Can I buy Paracetamol?',                 color: '#1E3A8A', bg: '#E0F7FA' },
  { id: 'ortho',     icon: 'body',        label: 'Joint & Back Pain',  prompt: 'Knee & Joint pain specialist',            color: '#00B894', bg: '#E6F8F5' },
  { id: 'ayurveda',  icon: 'leaf',        label: 'Ayurveda',           prompt: 'Ayurveda & Panchakarma Therapies',        color: '#7BC96F', bg: '#F2FAF0' },
  { id: 'rent',      icon: 'bed',         label: 'Equipment Rental',   prompt: 'Rent Hospital Bed & Oxygen Concentrator', color: '#64748B', bg: '#F1F5F9' },
];

const PRESCRIPTION_SAMPLES = [
  {
    name: 'General Infection & Fever Rx',
    medicines: [
      { name: 'Amoxicillin 500mg', type: 'Antibiotic', use: 'Treats bacterial infections.', timing: 'Twice daily after food for 5 days', caution: 'Complete full course.' },
      { name: 'Paracetamol 650mg', type: 'Fever Relief', use: 'Reduces fever & body ache.', timing: 'Every 6-8 hrs after food', caution: 'Max 3000mg/day.' },
      { name: 'Pantoprazole 40mg', type: 'Antacid', use: 'Prevents stomach acidity.', timing: 'Once before breakfast', caution: 'Swallow whole.' },
    ],
    doctorSpecialty: 'General Physician',
    doctorSuggestionId: '1',
  },
  {
    name: 'Cardio & Hypertension Rx',
    medicines: [
      { name: 'Telmisartan 40mg', type: 'BP Control', use: 'Controls high blood pressure.', timing: 'Once daily, morning', caution: 'Monitor BP regularly.' },
      { name: 'Atorvastatin 10mg', type: 'Cholesterol', use: 'Lowers LDL cholesterol.', timing: '1 tablet at bedtime', caution: 'Avoid grapefruit juice.' },
      { name: 'Ecosprin 75mg', type: 'Blood Thinner', use: 'Prevents blood clots.', timing: 'Once daily after lunch', caution: 'Inform doctor before surgery.' },
    ],
    doctorSpecialty: 'Cardiologist',
    doctorSuggestionId: '2',
  },
];

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: "Hi! I'm MediUnify AI.\n\nHow can I help you today?",
    quickPrompts: [
      { icon: 'fitness-outline',  color: '#FF7F50', bg: '#FFF2ED', text: 'I have fever and body pain' },
      { icon: 'heart-outline',    color: '#FF7F50', bg: '#FFF2ED', text: 'Chest pain – need a cardiologist' },
      { icon: 'scan-outline',     color: '#00B894', bg: '#E6F8F5', text: 'Scan my prescription' },
      { icon: 'flask-outline',    color: '#00C2CB', bg: '#E0F7FA', text: 'Book a blood test' },
      { icon: 'medkit-outline',   color: '#1E3A8A', bg: '#E0F7FA', text: 'Order medicines' },
      { icon: 'leaf-outline',     color: '#7BC96F', bg: '#F2FAF0', text: 'Ayurveda & wellness' },
    ],
  },
];

const ChatbotScreenWeb = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const { addToCart } = useCart();

  const [messages, setMessages]                     = useState(INITIAL_MESSAGES);
  const [inputText, setInputText]                   = useState('');
  const [isTyping, setIsTyping]                     = useState(false);
  const [scanningPrescription, setScanningPrescription] = useState(false);
  const [showRxModal, setShowRxModal]               = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    return () => clearTimeout(t);
  }, [messages, isTyping]);

  const handleSend = (customText = null) => {
    const text = (customText !== null ? customText : inputText).trim();
    if (!text) return;
    if (customText === null) setInputText('');
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text }]);
    setIsTyping(true);
    setTimeout(() => { processHealthQuery(text); setIsTyping(false); }, 600);
  };

  const handleScanPrescription = () => setShowRxModal(true);

  const launchImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        setMessages(prev => [...prev, { id: `user-img-${Date.now()}`, sender: 'user', text: 'Uploaded prescription', image: uri }]);
        setScanningPrescription(true);
        setIsTyping(true);
        setTimeout(() => {
          setScanningPrescription(false);
          setIsTyping(false);
          analyzePrescriptionData(PRESCRIPTION_SAMPLES[0], uri);
        }, 1800);
      }
    } catch (e) {
      setScanningPrescription(false);
      setIsTyping(false);
    }
  };

  const analyzePrescriptionData = (sampleRx) => {
    const suggestedDoctor = doctors.find(d => d.id === sampleRx.doctorSuggestionId) || doctors[0];
    setMessages(prev => [...prev, {
      id: `bot-rx-${Date.now()}`,
      sender: 'bot',
      text: `Prescription scanned! Found **${sampleRx.medicines.length} medicines**:`,
      prescriptionAnalysis: { medicines: sampleRx.medicines, suggestedDoctor },
      actionButtons: [
        {
          title: 'Order from Pharmacy',
          icon: 'cart',
          action: () => {
            sampleRx.medicines.forEach((med, idx) => addToCart({ id: `rx-${idx}-${Date.now()}`, name: med.name, category: 'Medicines', price: 45 + idx * 30, dosage: med.type }, 1, 'pharmacy'));
            showAlert('Added to Cart', 'Medicines added to your pharmacy cart.', [
              { text: 'Keep Chatting', style: 'cancel' },
              { text: 'View Cart', onPress: () => navigation?.navigate('Cart', { initialTab: 'pharmacy' }) },
            ]);
          },
        },
        { title: `Consult ${suggestedDoctor.name}`, icon: 'calendar', action: () => navigation?.navigate('DoctorDetails', { doctor: suggestedDoctor }) },
      ],
    }]);
  };

  const processHealthQuery = (query) => {
    const q = query.toLowerCase();

    if (q.includes('scan') || q.includes('prescription') || q.includes('rx')) {
      handleScanPrescription(); return;
    }
    if (q.includes('sugar') || q.includes('bp') || q.includes('blood pressure') || q.includes('vitals') || q.includes('bmi')) {
      const doc = doctors.find(d => d.specialtyKey === 'general') || doctors[0];
      reply('You can log Blood Sugar, BP, SpO2 & BMI in the app with color-coded alerts.', doc, null, [
        { title: 'Open Health Records', icon: 'pulse', action: () => navigation?.navigate('HealthRecords') },
        { title: `Consult ${doc.name}`, icon: 'calendar', action: () => navigation?.navigate('DoctorDetails', { doctor: doc }) },
      ]); return;
    }
    if (q.includes('return') || q.includes('refund') || q.includes('wrong medicine')) {
      reply('Return medicines via **My Orders → Return Order**. Free pickup within 48 hrs.', null, null, [
        { title: 'View Orders', icon: 'receipt', action: () => navigation?.navigate('MyMedicineOrders') },
      ]); return;
    }
    if (q.includes('ayurved') || q.includes('panchakarma') || q.includes('wellness')) {
      reply('Book AYUSH-certified Vaidyas for Nadi Pariksha, Panchakarma, and herbal therapies.', null, null, [
        { title: 'Ayurveda & Wellness', icon: 'leaf', action: () => navigation?.navigate('AyurvedaWellness') },
      ]); return;
    }
    if (q.includes('fertility') || q.includes('ivf') || q.includes('conceive') || q.includes('infertility')) {
      reply('Confidential IVF & fertility care with 0% EMI financing options.', null, null, [
        { title: 'Fertility & IVF', icon: 'heart', action: () => navigation?.navigate('FertilityIvf') },
      ]); return;
    }
    if (q.includes('equipment') || q.includes('wheelchair') || q.includes('oxygen') || q.includes('bed') || q.includes('rent')) {
      reply('Rent hospital-grade equipment delivered in 2-4 hrs with free technician setup.', null, null, [
        { title: 'Browse Equipment', icon: 'fitness', action: () => navigation?.navigate('EquipmentRental') },
      ]); return;
    }
    if (q.includes('chest pain') || q.includes('heart') || q.includes('cardio') || q.includes('breathless')) {
      const doc = doctors.find(d => d.specialtyKey === 'cardio') || doctors[1];
      const lab = radiologyLabs[0];
      reply('For severe chest pain, call 108 immediately. For clinical evaluation & ECG:', doc, lab, [
        { title: `Book ${doc.name}`, icon: 'heart', action: () => navigation?.navigate('DoctorDetails', { doctor: doc }) },
        { title: `ECG/Echo at ${lab.name}`, icon: 'flask', action: () => navigation?.navigate('RadiologyLabDetails', { labId: lab.id }) },
        { title: 'Emergency (108)', icon: 'call', action: () => navigation?.navigate('Emergency') },
      ]); return;
    }
    if (q.includes('skin') || q.includes('rash') || q.includes('acne') || q.includes('hair')) {
      const doc = doctors.find(d => d.specialtyKey === 'derma') || doctors[2];
      reply('Skin rash, acne or hair loss needs a dermatologist assessment.', doc, null, [
        { title: `Consult ${doc.name}`, icon: 'calendar', action: () => navigation?.navigate('DoctorDetails', { doctor: doc }) },
      ]); return;
    }
    if (q.includes('bone') || q.includes('knee') || q.includes('joint') || q.includes('back pain') || q.includes('ortho')) {
      const doc = doctors.find(d => d.specialtyKey === 'ortho') || doctors[3];
      const lab = radiologyLabs[0];
      reply('Joint or back pain? An X-Ray or MRI helps accurate diagnosis.', doc, lab, [
        { title: `Book ${doc.name}`, icon: 'calendar', action: () => navigation?.navigate('DoctorDetails', { doctor: doc }) },
        { title: `X-Ray & MRI at ${lab.name}`, icon: 'flask', action: () => navigation?.navigate('RadiologyLabDetails', { labId: lab.id }) },
      ]); return;
    }
    if (q.includes('lab') || q.includes('test') || q.includes('mri') || q.includes('ct scan') || q.includes('blood test')) {
      const lab = radiologyLabs[0];
      reply('NABH & NABL certified labs for blood tests, MRI, CT, X-Ray & home sample collection.', null, lab, [
        { title: `Book at ${lab.name}`, icon: 'flask', action: () => navigation?.navigate('RadiologyLabDetails', { labId: lab.id }) },
        { title: 'All Diagnostic Centers', icon: 'business', action: () => navigation?.navigate('RadiologyLabs') },
      ]); return;
    }
    if (q.includes('medicine') || q.includes('tablet') || q.includes('paracetamol') || q.includes('antibiotic')) {
      const doc = doctors.find(d => d.specialtyKey === 'general') || doctors[0];
      reply('OTC meds like Paracetamol are fine for mild symptoms. For prescriptions, consult a doctor.', doc, null, [
        { title: `Consult ${doc.name}`, icon: 'calendar', action: () => navigation?.navigate('DoctorDetails', { doctor: doc }) },
        { title: 'Browse Pharmacy', icon: 'cart', action: () => navigation?.navigate('Pharmacy') },
      ]); return;
    }
    if (q.includes('fever') || q.includes('cold') || q.includes('cough') || q.includes('headache') || q.includes('sick')) {
      const doc = doctors.find(d => d.specialtyKey === 'general') || doctors[0];
      reply('Stay hydrated, rest well, and avoid self-medicating. Our GP can help you quickly.', doc, null, [
        { title: `Book ${doc.name}`, icon: 'calendar', action: () => navigation?.navigate('DoctorDetails', { doctor: doc }) },
        { title: 'Order Medicines', icon: 'cart', action: () => navigation?.navigate('Pharmacy') },
      ]); return;
    }

    // Default
    const doc = doctors[0];
    const lab = radiologyLabs[0];
    reply("I can help with doctors, lab tests, medicines, prescriptions & more. What do you need?", doc, lab, [
      { title: 'Find Specialists', icon: 'people', action: () => navigation?.navigate('DoctorList') },
      { title: 'Scan Prescription', icon: 'camera', action: handleScanPrescription },
      { title: 'Pharmacy', icon: 'medkit', action: () => navigation?.navigate('Pharmacy') },
      { title: 'Book Lab Tests', icon: 'flask', action: () => navigation?.navigate('RadiologyLabs') },
    ]);
  };

  const reply = (text, suggestedDoctor, suggestedLab, actionButtons) => {
    setMessages(prev => [...prev, {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text,
      suggestedDoctor,
      suggestedLab,
      actionButtons,
    }]);
  };

  // ─── Render helpers ───────────────────────────────────────────────────────
  const renderDoctorCard = (doc) => {
    if (!doc) return null;
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <Image source={{ uri: doc.image }} style={styles.cardAvatar} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardDoctorName}>{doc.name}</Text>
            <Text style={styles.cardDoctorSpec}>{doc.specialty}</Text>
            <View style={styles.cardRatingRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.cardRatingText}>{doc.rating} · {doc.experience}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardFooterRow}>
          <Text style={styles.cardFeeVal}>₹{doc.fee}</Text>
          <TouchableOpacity style={styles.cardActionBtn} onPress={() => navigation?.navigate('DoctorDetails', { doctor: doc })} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={13} color="#FFFFFF" />
            <Text style={styles.cardActionBtnText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLabCard = (lab) => {
    if (!lab) return null;
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.labIconCircle}>
            <Ionicons name="business" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardDoctorName} numberOfLines={1}>{lab.name}</Text>
            <Text style={styles.cardDoctorSpec}>{lab.area} · {lab.distance}</Text>
            <View style={styles.cardRatingRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.cardRatingText}>{lab.rating}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardFooterRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={styles.labTimingText}>{lab.openHours || 'Open Today'}</Text>
          </View>
          <TouchableOpacity style={styles.cardActionBtn} onPress={() => navigation?.navigate('RadiologyLabDetails', { labId: lab.id })} activeOpacity={0.85}>
            <Ionicons name="flask-outline" size={13} color="#FFFFFF" />
            <Text style={styles.cardActionBtnText}>View Tests</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPrescriptionAnalysis = (analysis) => {
    if (!analysis) return null;
    return (
      <View style={styles.rxAnalysisBox}>
        <View style={styles.rxAnalysisHeader}>
          <Ionicons name="document-text" size={15} color="#1E3A8A" />
          <Text style={styles.rxAnalysisHeaderTitle}>Detected Medicines ({analysis.medicines.length})</Text>
        </View>
        {analysis.medicines.map((med, idx) => (
          <View key={idx} style={styles.rxMedCard}>
            <View style={styles.rxMedTop}>
              <Text style={styles.rxMedName}>{med.name}</Text>
              <Text style={styles.rxMedType}>{med.type}</Text>
            </View>
            <Text style={styles.rxMedUse}>{med.use}</Text>
            <View style={styles.rxMedTimingRow}>
              <Ionicons name="time-outline" size={12} color="#059669" />
              <Text style={styles.rxMedTimingText}>{med.timing}</Text>
            </View>
            {med.caution && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="alert-circle-outline" size={13} color="#D97706" />
                <Text style={styles.rxMedCaution}>{med.caution}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderMessageItem = ({ item }) => {
    const isBot = item.sender === 'bot';
    return (
      <View style={[styles.messageRow, isBot ? styles.messageRowBot : styles.messageRowUser]}>
        {isBot && (
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={15} color="#FFFFFF" />
          </View>
        )}
        <View style={[styles.messageBubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
          {item.image && <Image source={{ uri: item.image }} style={styles.userUploadedImage} resizeMode="cover" />}

          <Text style={[styles.messageText, isBot ? styles.textBot : styles.textUser]}>
            {item.text}
          </Text>

          {item.prescriptionAnalysis && renderPrescriptionAnalysis(item.prescriptionAnalysis)}
          {item.suggestedDoctor && renderDoctorCard(item.suggestedDoctor)}
          {item.suggestedLab && renderLabCard(item.suggestedLab)}

          {item.actionButtons?.length > 0 && (
            <View style={styles.actionButtonsCol}>
              {item.actionButtons.map((btn, i) => (
                <TouchableOpacity key={i} style={styles.chatActionBtn} onPress={btn.action} activeOpacity={0.8}>
                  <Ionicons name={btn.icon || 'arrow-forward'} size={14} color={colors.primary} />
                  <Text style={styles.chatActionBtnText}>{btn.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Welcome quick-prompt chips */}
          {item.quickPrompts && (
            <View style={styles.quickPromptsGrid}>
              {item.quickPrompts.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickPromptChip}
                  onPress={() => handleSend(p.text)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickChipIcon, { backgroundColor: p.bg }]}>
                    <Ionicons name={p.icon} size={14} color={p.color} />
                  </View>
                  <Text style={styles.quickChipText}>{p.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.webContainer}>

        {/* LEFT SIDEBAR (desktop only) */}
        {isDesktop && (
          <View style={styles.leftSidebar}>
            {/* AI profile */}
            <View style={styles.assistantProfileCard}>
              <View style={styles.assistantAvatarCircle}>
                <Ionicons name="sparkles" size={22} color="#0D9488" />
                <View style={styles.assistantOnlineDot} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.assistantName}>MediUnify AI</Text>
                <View style={styles.liveTagRow}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveTagText}>Online • 24/7</Text>
                </View>
              </View>
            </View>

            {/* Topic chips */}
            <Text style={styles.sidebarSectionTitle}>Quick Topics</Text>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
              {QUICK_CATEGORIES.map(cat => (
                <TouchableOpacity key={cat.id} style={styles.categoryItemBtn} onPress={() => handleSend(cat.prompt)} activeOpacity={0.75}>
                  <View style={[styles.catIconWrap, { backgroundColor: cat.bg }]}>
                    <Ionicons name={cat.icon} size={15} color={cat.color} />
                  </View>
                  <Text style={styles.catLabelText}>{cat.label}</Text>
                  <Ionicons name="chevron-forward" size={13} color="#CBD5E1" />
                </TouchableOpacity>
              ))}

              {/* Emergency banner */}
              <TouchableOpacity style={styles.emergencyCard} onPress={() => navigation?.navigate('Emergency')} activeOpacity={0.85}>
                <View style={styles.emergencyIconWrap}>
                  <Ionicons name="call" size={16} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emergencyTitle}>Emergency?</Text>
                  <Text style={styles.emergencySubtitle}>108 · Free Ambulance 24x7</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* MAIN CHAT AREA */}
        <View style={styles.chatWorkspace}>

          {/* Header */}
          <View style={styles.headerBar}>
            <WebBackButton
              onPress={() => navigation?.canGoBack?.() ? navigation.goBack() : navigation?.navigate('Home')}
            />

            <View style={styles.headerInfoCol}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitleText}>MediUnify AI</Text>
                <View style={styles.headerOnlinePill}>
                  <View style={styles.headerOnlineDot} />
                  <Text style={styles.headerOnlinePillText}>Online</Text>
                </View>
              </View>
              <Text style={styles.headerSubText}>Your 24/7 health assistant</Text>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity style={styles.scanHeaderActionBtn} onPress={handleScanPrescription} activeOpacity={0.85}>
                <Ionicons name="scan-outline" size={15} color="#0D9488" />
                <Text style={styles.scanHeaderActionText}>Scan Rx</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetHeaderActionBtn}
                onPress={() => { setMessages(INITIAL_MESSAGES); }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={17} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={true}
            style={styles.flatListStyle}
            keyboardShouldPersistTaps="always"
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingContainer}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                  </View>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.typingText}>
                      {scanningPrescription ? 'Scanning prescription…' : 'Typing…'}
                    </Text>
                  </View>
                </View>
              ) : null
            }
          />

          {/* Input bar */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
            <View style={styles.inputAreaRoot}>
              <View style={styles.inputRow}>
                <TouchableOpacity style={styles.uploadRxBtn} onPress={handleScanPrescription} activeOpacity={0.8}>
                  <Ionicons name="camera" size={18} color="#0D9488" />
                </TouchableOpacity>

                <TextInput
                  style={styles.webTextInput}
                  placeholder="Ask me anything about your health…"
                  placeholderTextColor="#94A3B8"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSend()}
                  returnKeyType="send"
                />

                <TouchableOpacity style={styles.micBtn} onPress={() => showAlert('Voice', 'Speak your question clearly.')} activeOpacity={0.8}>
                  <Ionicons name="mic" size={18} color="#0D9488" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                  onPress={() => handleSend()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                <Ionicons name="information-circle-outline" size={13} color="#64748B" />
                <Text style={styles.disclaimerText}>
                  AI guidance only — not a substitute for professional medical advice. Emergency? Call 108.
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* PRESCRIPTION SCANNER MODAL */}
        {showRxModal && (
          <View style={styles.rxModalOverlay}>
            <View style={styles.rxModalCard}>
              <View style={styles.rxModalHeader}>
                <View style={styles.rxModalIconCircle}>
                  <Ionicons name="document-text" size={20} color="#0D9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rxModalTitle}>Scan Prescription</Text>
                  <Text style={styles.rxModalSubtitle}>Decode medicines, dosage & safety</Text>
                </View>
                <TouchableOpacity onPress={() => setShowRxModal(false)} style={styles.rxModalCloseBtn}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.rxModalOptions}>
                <TouchableOpacity style={styles.rxModalOptionBtn} onPress={() => { setShowRxModal(false); launchImagePicker(); }} activeOpacity={0.8}>
                  <View style={[styles.rxOptionIconWrap, { backgroundColor: '#CCFBF1' }]}>
                    <Ionicons name="cloud-upload" size={20} color="#0D9488" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rxOptionTitle}>Upload Photo</Text>
                    <Text style={styles.rxOptionDesc}>Select a JPG/PNG from your device</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.rxModalOptionBtn} onPress={() => { setShowRxModal(false); setScanningPrescription(true); setIsTyping(true); setTimeout(() => { setScanningPrescription(false); setIsTyping(false); analyzePrescriptionData(PRESCRIPTION_SAMPLES[0]); }, 1200); }} activeOpacity={0.8}>
                  <View style={[styles.rxOptionIconWrap, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="flask" size={20} color="#1E3A8A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rxOptionTitle}>Sample: Fever & Infection</Text>
                    <Text style={styles.rxOptionDesc}>Amoxicillin, Paracetamol, Pantoprazole</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.rxModalOptionBtn} onPress={() => { setShowRxModal(false); setScanningPrescription(true); setIsTyping(true); setTimeout(() => { setScanningPrescription(false); setIsTyping(false); analyzePrescriptionData(PRESCRIPTION_SAMPLES[1]); }, 1200); }} activeOpacity={0.8}>
                  <View style={[styles.rxOptionIconWrap, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="heart" size={20} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rxOptionTitle}>Sample: Cardiology & BP</Text>
                    <Text style={styles.rxOptionDesc}>Telmisartan, Atorvastatin, Ecosprin</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.rxModalCancelBtn} onPress={() => setShowRxModal(false)} activeOpacity={0.8}>
                <Text style={styles.rxModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFCFD',
    height: Platform.OS === 'web' ? 'calc(100vh - 125px)' : '100%',
  },
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1300,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderRadius: Platform.OS === 'web' ? 16 : 0,
    marginVertical: Platform.OS === 'web' ? 10 : 0,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },

  // LEFT SIDEBAR
  leftSidebar: {
    width: 270,
    borderRightWidth: 1,
    borderRightColor: '#DCE7EC',
    backgroundColor: '#F1F8FB',
    padding: 14,
    flexDirection: 'column',
  },
  assistantProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    marginBottom: 14,
    gap: 10,
  },
  assistantAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  assistantOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#7BC96F',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  assistantName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  liveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7BC96F',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00B894',
  },
  sidebarSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  categoryItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    marginBottom: 5,
    gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  catIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabelText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  emergencyIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
  },
  emergencySubtitle: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
  },

  // CHAT WORKSPACE
  chatWorkspace: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE7EC',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8FB',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    gap: 3,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  headerInfoCol: { flex: 1 },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  headerOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  headerOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7BC96F',
  },
  headerOnlinePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00B894',
  },
  headerSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanHeaderActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#DCE7EC',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  scanHeaderActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#00B894',
  },
  resetHeaderActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F8FB',
    borderWidth: 1,
    borderColor: '#DCE7EC',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },

  // MESSAGES
  flatListStyle: {
    flex: 1,
    backgroundColor: '#FAFCFD',
    ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}),
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  messageRowBot: { justifyContent: 'flex-start' },
  messageRowUser: { justifyContent: 'flex-end' },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: Platform.OS === 'web' ? '76%' : '86%',
    borderRadius: 16,
    padding: 13,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#00B894',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  textBot: { color: '#1E3A8A' },
  textUser: { color: '#FFFFFF' },
  userUploadedImage: {
    width: 200,
    height: 130,
    borderRadius: 10,
    marginBottom: 8,
  },

  // WELCOME CHIPS
  quickPromptsGrid: {
    marginTop: 10,
    gap: 6,
  },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  quickChipIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E3A8A',
  },

  // DOCTOR / LAB CARDS
  cardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 11,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  cardAvatar: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#E2E8F0' },
  labIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDoctorName: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  cardDoctorSpec: { fontSize: 11, color: '#64748B', marginTop: 1 },
  cardRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardRatingText: { fontSize: 10.5, color: '#475569', fontWeight: '600' },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cardFeeVal: { fontSize: 14, fontWeight: '800', color: '#0D9488' },
  labTimingText: { fontSize: 11, color: '#64748B', flex: 1, marginRight: 6 },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  cardActionBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  // ACTION BUTTONS
  actionButtonsCol: { gap: 5, marginTop: 8 },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
    gap: 7,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  chatActionBtnText: { fontSize: 12, fontWeight: '700', color: '#0D9488' },

  // PRESCRIPTION ANALYSIS
  rxAnalysisBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rxAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 7,
  },
  rxAnalysisHeaderTitle: { fontSize: 12.5, fontWeight: '800', color: '#1E3A8A' },
  rxMedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 9,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  rxMedTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  rxMedName: { fontSize: 12.5, fontWeight: '800', color: '#1E293B' },
  rxMedType: { fontSize: 10, color: '#1E3A8A', fontWeight: '700', backgroundColor: '#EEF2FF', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  rxMedUse: { fontSize: 11, color: '#475569', lineHeight: 15, marginBottom: 3 },
  rxMedTimingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rxMedTimingText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  rxMedCaution: { fontSize: 10, color: '#D97706', marginTop: 2 },

  // TYPING
  typingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typingText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  // INPUT
  inputAreaRoot: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadRxBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  webTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0F172A',
    outlineStyle: 'none',
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#99F6E4',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  sendBtnDisabled: { backgroundColor: '#CBD5E1' },
  disclaimerText: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 5,
  },

  // RX MODAL
  rxModalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
  },
  rxModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxWidth: 460,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  rxModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  rxModalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxModalTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  rxModalSubtitle: { fontSize: 11, color: '#64748B', marginTop: 1 },
  rxModalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  rxModalOptions: { gap: 8, marginBottom: 14 },
  rxModalOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  rxOptionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxOptionTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  rxOptionDesc: { fontSize: 11, color: '#64748B', marginTop: 1 },
  rxModalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  rxModalCancelText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
});

export default ChatbotScreenWeb;
