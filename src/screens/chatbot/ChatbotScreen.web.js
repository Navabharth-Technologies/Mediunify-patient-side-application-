import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import colors from '../../theme/colors';
import { showAlert } from '../../utils/alert';
import doctors from '../../data/doctors';
import { radiologyLabs } from '../../data/radiologyLabsData';
import { useCart } from '../../context/CartContext';

// Quick prompt suggestions
const QUICK_SUGGESTIONS = [
  '🤒 I have fever & body pain',
  '❤️ Best Cardiologist for Chest Pain',
  '📷 Scan My Prescription',
  '🧪 Suggest nearby Lab for Blood Test',
  '💊 Can I buy Paracetamol?',
  '🦴 Knee & Joint pain specialist',
  '📊 Update Blood Sugar & BP',
  '📦 How do I return a medicine?',
  '🌿 Ayurveda & Panchakarma Therapies',
  '👶 Fertility & IVF Specialists (0% EMI)',
  '🛏️ Rent Hospital Bed & Oxygen Concentrator',
];

// Sample prescription knowledge base for OCR analysis
const PRESCRIPTION_SAMPLES = [
  {
    name: 'General Infection & Fever Rx',
    medicines: [
      {
        name: 'Amoxicillin 500mg',
        type: 'Antibiotic Capsule',
        use: 'Treats bacterial infections (throat, respiratory, ear, skin).',
        timing: 'Twice daily after food for 5 days',
        caution: 'Complete full course even if you feel better.',
      },
      {
        name: 'Paracetamol 650mg',
        type: 'Antipyretic & Analgesic',
        use: 'Reduces high body temperature (fever) and relieves body ache / headache.',
        timing: '1 tablet every 6-8 hours as needed (after food)',
        caution: 'Do not exceed 3000mg per day to protect liver.',
      },
      {
        name: 'Pantoprazole 40mg',
        type: 'Antacid / PPI',
        use: 'Prevents stomach acidity, heartburn, and gastritis from antibiotics.',
        timing: '1 tablet daily before breakfast on empty stomach',
        caution: 'Swallow whole with a glass of water.',
      },
    ],
    doctorSpecialty: 'General Physician',
    doctorSuggestionId: '1',
  },
  {
    name: 'Cardio & Hypertension Rx',
    medicines: [
      {
        name: 'Telmisartan 40mg',
        type: 'Antihypertensive',
        use: 'Controls high blood pressure and protects heart/kidneys.',
        timing: 'Once daily in the morning',
        caution: 'Monitor BP regularly. Do not stop abruptly.',
      },
      {
        name: 'Atorvastatin 10mg',
        type: 'Cholesterol Lowering Statin',
        use: 'Lowers LDL bad cholesterol and reduces risk of heart stroke.',
        timing: '1 tablet at bedtime',
        caution: 'Avoid grapefruit juice while taking this medication.',
      },
      {
        name: 'Ecosprin 75mg',
        type: 'Blood Thinner / Antiplatelet',
        use: 'Prevents blood clots and improves cardiac arterial circulation.',
        timing: 'Once daily after lunch',
        caution: 'Inform doctor before any dental procedure or surgery.',
      },
    ],
    doctorSpecialty: 'Cardiologist',
    doctorSuggestionId: '2',
  },
];

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: "Hello! Welcome to MediUnify AI Health Assistant.\n\nI am your 24/7 clinical triage partner. I can help evaluate symptoms, explain prescriptions, find certified doctors in Karnataka, book laboratory scans, and assist with pharmacy orders.\n\nHow can I help you today?",
    quickPrompts: [
      { icon: 'fitness-outline', color: '#0284C7', bg: '#E0F2FE', text: 'I have fever and body pain' },
      { icon: 'heart-outline', color: '#E11D48', bg: '#FFE4E6', text: 'Cardiologist for chest discomfort' },
      { icon: 'scan-outline', color: '#0D9488', bg: '#F0FDFA', text: 'Scan doctor prescription' },
      { icon: 'flask-outline', color: '#2563EB', bg: '#EFF6FF', text: 'Book home blood test / MRI' },
      { icon: 'medkit-outline', color: '#D97706', bg: '#FEF3C7', text: 'Order genuine medicines' },
      { icon: 'leaf-outline', color: '#059669', bg: '#ECFDF5', text: 'Ayurveda & Panchakarma' },
    ],
  },
];

const QUICK_CATEGORIES = [
  { id: 'fever', icon: 'thermometer', label: 'Fever & Infection', prompt: 'I have fever and body pain', color: '#EF4444', bg: '#FEE2E2' },
  { id: 'cardio', icon: 'heart', label: 'Chest Pain & Cardio', prompt: 'Best Cardiologist for Chest Pain', color: '#E11D48', bg: '#FFE4E6' },
  { id: 'scan', icon: 'scan', label: 'Scan Prescription', prompt: 'Scan My Prescription', color: '#0D9488', bg: '#CCFBF1' },
  { id: 'lab', icon: 'flask', label: 'Lab Tests & MRI Scans', prompt: 'Suggest nearby Lab for Blood Test', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'meds', icon: 'medkit', label: 'Medicine Advice', prompt: 'Can I buy Paracetamol?', color: '#D97706', bg: '#FEF3C7' },
  { id: 'ortho', icon: 'body', label: 'Joint & Back Pain', prompt: 'Knee & Joint pain specialist', color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'ayurveda', icon: 'leaf', label: 'Ayurveda & Wellness', prompt: 'Ayurveda & Panchakarma Therapies', color: '#059669', bg: '#D1FAE5' },
  { id: 'fertility', icon: 'rose', label: 'Fertility & IVF', prompt: 'Fertility & IVF Specialists (0% EMI)', color: '#DB2777', bg: '#FCE7F3' },
  { id: 'rent', icon: 'bed', label: 'Equipment Rental', prompt: 'Rent Hospital Bed & Oxygen Concentrator', color: '#0284C7', bg: '#E0F2FE' },
];

const ChatbotScreenWeb = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const { addToCart } = useCart();

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scanningPrescription, setScanningPrescription] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);

  const flatListRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const handleSend = (customText = null) => {
    const textToSend = (customText !== null ? customText : inputText).trim();
    if (!textToSend) return;

    if (customText === null) {
      setInputText('');
    }

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      processHealthQuery(textToSend);
      setIsTyping(false);
    }, 600);
  };

  const handleScanPrescription = () => {
    setShowRxModal(true);
  };

  const launchImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        const userImgMsg = {
          id: `user-img-${Date.now()}`,
          sender: 'user',
          text: 'Uploaded doctor prescription for scanning 📷',
          image: imageUri,
        };
        setMessages((prev) => [...prev, userImgMsg]);

        setScanningPrescription(true);
        setIsTyping(true);

        setTimeout(() => {
          setScanningPrescription(false);
          setIsTyping(false);
          analyzePrescriptionData(PRESCRIPTION_SAMPLES[0], imageUri);
        }, 1800);
      }
    } catch (e) {
      setScanningPrescription(false);
      setIsTyping(false);
      console.log('Image picker error:', e);
    }
  };

  const analyzePrescriptionData = (sampleRx, imageUri = null) => {
    const suggestedDoctor = doctors.find((d) => d.id === sampleRx.doctorSuggestionId) || doctors[0];

    const botMsg = {
      id: `bot-rx-${Date.now()}`,
      sender: 'bot',
      text: `✅ **Prescription Scanned & Analyzed Successfully!**\n\nI have detected **${sampleRx.medicines.length} medications** from your prescription with indications and dosage instructions:`,
      prescriptionAnalysis: {
        medicines: sampleRx.medicines,
        suggestedDoctor,
      },
      actionButtons: [
        {
          title: '💊 Order Medicines from Pharmacy',
          icon: 'cart',
          action: () => {
            sampleRx.medicines.forEach((med, idx) => {
              addToCart(
                {
                  id: `rx-item-${idx}-${Date.now()}`,
                  name: med.name,
                  category: 'Medicines',
                  price: 45 + idx * 30,
                  dosage: med.type,
                },
                1,
                'pharmacy'
              );
            });
            showAlert(
              'Medicines Added! 🛒',
              'Prescription tablets have been added to your Pharmacy Cart.',
              [
                { text: 'Keep Chatting', style: 'cancel' },
                { text: 'View Cart', onPress: () => navigation?.navigate('Cart', { initialTab: 'pharmacy' }) },
              ]
            );
          },
        },
        {
          title: `👨‍⚕️ Consult ${suggestedDoctor.name}`,
          icon: 'calendar',
          action: () => navigation?.navigate('DoctorDetails', { doctor: suggestedDoctor }),
        },
      ],
    };

    setMessages((prev) => [...prev, botMsg]);
  };

  const processHealthQuery = (query) => {
    const q = query.toLowerCase();

    // 1. PRESCRIPTION SCAN TRIGGER
    if (q.includes('scan') || q.includes('prescription') || q.includes('upload rx') || q.includes('tablet is used for')) {
      handleScanPrescription();
      return;
    }

    // 2. HEALTH MONITORING & VITALS
    if (
      q.includes('sugar') ||
      q.includes('glucose') ||
      q.includes('bp') ||
      q.includes('blood pressure') ||
      q.includes('vitals') ||
      q.includes('health monitor') ||
      q.includes('spo2') ||
      q.includes('bmi') ||
      q.includes('weight')
    ) {
      const physician = doctors.find((d) => d.specialtyKey === 'general') || doctors[0];
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '📊 **Health Monitor & Vitals Tracking**\n\nYou can log and monitor your **Blood Glucose (Sugar)**, **Blood Pressure (BP)**, **Oxygen (SpO2)**, **Temperature**, and **BMI** directly in the app with color-coded safety indicators.',
        suggestedDoctor: physician,
        actionButtons: [
          {
            title: '📊 Open Health Records',
            icon: 'pulse',
            action: () => navigation?.navigate('HealthRecords'),
          },
          {
            title: `👨‍⚕️ Consult ${physician.name}`,
            icon: 'calendar',
            action: () => navigation?.navigate('DoctorDetails', { doctor: physician }),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 3. PRODUCT RETURN / ORDERS
    if (q.includes('return') || q.includes('refund') || q.includes('replace') || q.includes('damaged') || q.includes('wrong medicine')) {
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🔄 **Pharmacy Product Return Policy**\n\nYou can easily return delivered pharmacy medicines within our return window.\n\n• Go to **My Bookings / Orders** → Tap **Return Order**.\n• Select items and reason (damaged seal, wrong medicine, doctor changed Rx).\n• Choose instant **MediUnify Wallet refund** or Bank account.\n• Free doorstep pickup will be arranged within 24-48 hours.',
        actionButtons: [
          {
            title: '📦 View Orders & Return',
            icon: 'receipt',
            action: () => navigation?.navigate('Bookings'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 4. AYURVEDA & PANCHAKARMA
    if (
      q.includes('ayurved') ||
      q.includes('panchakarma') ||
      q.includes('vaidya') ||
      q.includes('nadi') ||
      q.includes('dosha') ||
      q.includes('shirodhara') ||
      q.includes('abhyanga') ||
      q.includes('shilajit') ||
      q.includes('ashwagandha') ||
      q.includes('triphala')
    ) {
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🌿 **Ayurveda & Panchakarma Healing Sanctuary**\n\nMediUnify provides direct access to senior AYUSH-certified Vaidyas for:\n\n• **Nadi Pariksha (Pulse Diagnosis)** & Dosha assessment.\n• **Classical Panchakarma Therapies**: Abhyanga full-body warm oil massage, Shirodhara stress relief, Janu Basti for knee joints, and 7-Day Detox.\n• **Authentic Classical Herbal Store**: Shilajit resin, KSM-66 Ashwagandha, Chyawanprash, and herbal oils with doorstep delivery.',
        actionButtons: [
          {
            title: '🌿 Open Ayurveda & Wellness',
            icon: 'leaf',
            action: () => navigation?.navigate('AyurvedaWellness'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 5. FERTILITY & IVF
    if (
      q.includes('fertility') ||
      q.includes('ivf') ||
      q.includes('iui') ||
      q.includes('icsi') ||
      q.includes('conceive') ||
      q.includes('pregnancy problem') ||
      q.includes('egg freezing') ||
      q.includes('semen analysis') ||
      q.includes('sperm') ||
      q.includes('infertility') ||
      q.includes('baby planning')
    ) {
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '💖 **Fertility & Advanced IVF Care Desk**\n\nWe provide compassionate, 100% confidential reproductive medicine with accredited centers:\n\n• **Advanced IVF with ICSI** & Blastocyst Day-5 culture (up to 73% clinical pregnancy rate).\n• **Couple Fertility Workup**: AMH ovarian reserve, CASA semen analysis & pelvic 3D ultrasound.\n• **Social & Medical Egg Freezing** with vitrification cryogenic preservation.\n• **0% Interest EMI Financing**: Split treatment costs into 6, 12, 18, or 24 equal monthly installments.',
        actionButtons: [
          {
            title: '💖 Open Fertility & IVF Hub',
            icon: 'heart',
            action: () => navigation?.navigate('FertilityIvf'),
          },
          {
            title: '🔒 Confidential Fertility Consultation',
            icon: 'lock-closed',
            action: () => navigation?.navigate('FertilityCareRequest'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 6. MEDICAL EQUIPMENT RENTAL
    if (
      q.includes('equipment') ||
      q.includes('wheelchair') ||
      q.includes('oxygen concentrator') ||
      q.includes('hospital bed') ||
      q.includes('bipap') ||
      q.includes('cpap') ||
      q.includes('rent cot') ||
      q.includes('rent bed') ||
      q.includes('patient monitor') ||
      q.includes('walker') ||
      q.includes('rent')
    ) {
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🛏️ **Home Medical Equipment Rental Service**\n\nRent certified, hospital-grade equipment with express delivery and free technician installation:\n\n• **Hospital Beds**: 5-Function electric motorized ICU beds with remote control.\n• **Respiratory Care**: 10L medical oxygen concentrators (93% purity) & Auto-BiPAP/CPAP.\n• **Mobility Aids**: Motorized smart electric wheelchairs & foldable wheelchairs.\n• **Delivered within 2-4 hours** with 100% refundable security deposit.',
        actionButtons: [
          {
            title: '🛏️ Browse Equipment Rental',
            icon: 'fitness',
            action: () => navigation?.navigate('EquipmentRental'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 7. HEART / CHEST PAIN / CARDIOLOGY
    if (
      q.includes('chest pain') ||
      q.includes('heart') ||
      q.includes('cardio') ||
      q.includes('palpitation') ||
      q.includes('breathless')
    ) {
      const cardiologist = doctors.find((d) => d.specialtyKey === 'cardio') || doctors[1];
      const nearbyLab = radiologyLabs[0];

      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '⚠️ **Chest Pain & Cardiac Health Advisory**\n\nIf you are experiencing severe crushing chest pain, radiating pain to the left arm or jaw, or acute shortness of breath, please **seek emergency care immediately**.\n\nFor clinical evaluation, ECG, and echocardiography, we recommend consulting our senior Cardiologist:',
        suggestedDoctor: cardiologist,
        suggestedLab: nearbyLab,
        actionButtons: [
          {
            title: `Book ${cardiologist.name} (${cardiologist.fee})`,
            icon: 'heart',
            action: () => navigation?.navigate('DoctorDetails', { doctor: cardiologist }),
          },
          {
            title: `🏥 ECG / Echo at ${nearbyLab.name}`,
            icon: 'flask',
            action: () => navigation?.navigate('RadiologyLabDetails', { labId: nearbyLab.id }),
          },
          {
            title: '🚨 Emergency Hotline (108)',
            icon: 'call',
            action: () => navigation?.navigate('Emergency'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 8. SKIN / DERMATOLOGY
    if (
      q.includes('skin') ||
      q.includes('rash') ||
      q.includes('acne') ||
      q.includes('itching') ||
      q.includes('hair') ||
      q.includes('dandruff') ||
      q.includes('eczema')
    ) {
      const dermatologist = doctors.find((d) => d.specialtyKey === 'derma') || doctors[2];
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '✨ **Skin & Dermatology Guidance**\n\nSkin irritations, allergic rashes, persistent acne, or acute hair loss require specialized dermatological assessment to identify the root cause.',
        suggestedDoctor: dermatologist,
        actionButtons: [
          {
            title: `Consult ${dermatologist.name} (${dermatologist.fee})`,
            icon: 'calendar',
            action: () => navigation?.navigate('DoctorDetails', { doctor: dermatologist }),
          },
          {
            title: '💊 Skin Care in Pharmacy',
            icon: 'medkit',
            action: () => navigation?.navigate('Pharmacy'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 9. BONE / JOINT / ORTHOPEDIC
    if (
      q.includes('bone') ||
      q.includes('joint') ||
      q.includes('knee') ||
      q.includes('back pain') ||
      q.includes('fracture') ||
      q.includes('ortho') ||
      q.includes('arthritis')
    ) {
      const orthoDoctor = doctors.find((d) => d.specialtyKey === 'ortho') || doctors[3];
      const nearbyLab = radiologyLabs[0];

      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🦴 **Orthopedic & Joint Care**\n\nFor joint stiffness, knee pain, ligament sprains, or chronic back pain, resting the joint and obtaining an X-Ray or MRI scan helps accurate diagnosis.',
        suggestedDoctor: orthoDoctor,
        suggestedLab: nearbyLab,
        actionButtons: [
          {
            title: `Book ${orthoDoctor.name}`,
            icon: 'calendar',
            action: () => navigation?.navigate('DoctorDetails', { doctor: orthoDoctor }),
          },
          {
            title: `🏥 Digital X-Ray & MRI at ${nearbyLab.name}`,
            icon: 'flask',
            action: () => navigation?.navigate('RadiologyLabDetails', { labId: nearbyLab.id }),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 10. LAB TESTS / SCANS / MRI / CT SCAN / BLOOD TEST
    if (
      q.includes('lab') ||
      q.includes('test') ||
      q.includes('blood test') ||
      q.includes('mri') ||
      q.includes('ct scan') ||
      q.includes('x-ray') ||
      q.includes('ultrasound') ||
      q.includes('thyroid') ||
      q.includes('lipid')
    ) {
      const topLab = radiologyLabs[0];
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `🧪 **Certified Diagnostic Labs & Imaging Centers**\n\nWe have partnered with NABH & NABL accredited diagnostic centers in Karnataka for 100% verified digital reports.\n\n• **Blood Tests**: Free Home Sample Collection or Center Visit.\n• **Radiology Scans (MRI, CT, X-Ray, Ultrasound)**: Conducted on-site with fast-track appointment tokens.`,
        suggestedLab: topLab,
        actionButtons: [
          {
            title: `🏥 View Tests at ${topLab.name}`,
            icon: 'flask',
            action: () => navigation?.navigate('RadiologyLabDetails', { labId: topLab.id }),
          },
          {
            title: '🧪 All Diagnostic Centers',
            icon: 'business',
            action: () => navigation?.navigate('RadiologyLabs'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 11. MEDICINE ADVICE
    if (
      q.includes('medicine') ||
      q.includes('tablet') ||
      q.includes('drug') ||
      q.includes('syrup') ||
      q.includes('paracetamol') ||
      q.includes('antibiotic') ||
      q.includes('dose') ||
      q.includes('take')
    ) {
      const generalDoctor = doctors.find((d) => d.specialtyKey === 'general') || doctors[0];
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `💊 **Medicine Inquiry & Clinical Safety Guidance**\n\nWhile OTC medications like **Paracetamol (for fever/pain)** offer temporary relief, **prescription drugs, antibiotics, and exact dosages must be prescribed by a certified doctor** based on your medical profile.\n\n⚠️ **Medical Safety Notice**: Self-medication can mask underlying health issues or lead to drug interactions. Please consult a doctor for tailored prescription guidance.`,
        suggestedDoctor: generalDoctor,
        actionButtons: [
          {
            title: `👨‍⚕️ Consult ${generalDoctor.name} (${generalDoctor.fee})`,
            icon: 'calendar',
            action: () => navigation?.navigate('DoctorDetails', { doctor: generalDoctor }),
          },
          {
            title: '💊 Browse MediUnify Pharmacy',
            icon: 'cart',
            action: () => navigation?.navigate('Pharmacy'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 12. FEVER / COLD / COUGH / HEADACHE
    if (
      q.includes('fever') ||
      q.includes('cold') ||
      q.includes('cough') ||
      q.includes('headache') ||
      q.includes('vomit') ||
      q.includes('stomach') ||
      q.includes('sick') ||
      q.includes('infection')
    ) {
      const physician = doctors.find((d) => d.specialtyKey === 'general') || doctors[0];
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `🤒 **Symptom Evaluation & Care Guidance**\n\nFor fever, cold, or acute body ache:\n• Stay hydrated with warm fluids and ORS.\n• Get adequate rest and monitor your body temperature.\n• Avoid unprescribed heavy antibiotics.\n\nWe recommend booking a consultation with our verified General Physician:`,
        suggestedDoctor: physician,
        actionButtons: [
          {
            title: `Book ${physician.name} (${physician.fee})`,
            icon: 'calendar',
            action: () => navigation?.navigate('DoctorDetails', { doctor: physician }),
          },
          {
            title: '💊 Order Fever Medicines',
            icon: 'cart',
            action: () => navigation?.navigate('Pharmacy'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // DEFAULT FALLBACK
    const defaultDoctor = doctors[0];
    const topLab = radiologyLabs[0];

    const botResponse = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `🤖 **MediUnify Health Assistant**\n\nI can assist you with:\n1. **Doctor Consultations**: Find top verified specialists for any health issue.\n2. **Prescription Scanner**: Upload your Rx photo to decode tablet uses, dosages & warnings.\n3. **Pharmacy Delivery**: Order genuine medicines or schedule returns.\n4. **Diagnostic Labs & Scans**: Book blood tests, 3T MRI, and CT scans.\n5. **Health Monitor**: Log Blood Sugar, Blood Pressure, and Vitals.\n\nWhat would you like to explore?`,
      suggestedDoctor: defaultDoctor,
      suggestedLab: topLab,
      actionButtons: [
        {
          title: '👨‍⚕️ Find Specialists',
          icon: 'people',
          action: () => navigation?.navigate('DoctorList'),
        },
        {
          title: '📷 Scan Prescription',
          icon: 'camera',
          action: handleScanPrescription,
        },
        {
          title: '💊 Pharmacy Store',
          icon: 'medkit',
          action: () => navigation?.navigate('Pharmacy'),
        },
        {
          title: '🧪 Book Lab Tests',
          icon: 'flask',
          action: () => navigation?.navigate('RadiologyLabs'),
        },
      ],
    };
    setMessages((prev) => [...prev, botResponse]);
  };

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
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.cardRatingText}>{doc.rating} • {doc.experience}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooterRow}>
          <View>
            <Text style={styles.cardFeeLabel}>Consultation Fee</Text>
            <Text style={styles.cardFeeVal}>₹{doc.fee}</Text>
          </View>

          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => navigation?.navigate('DoctorDetails', { doctor: doc })}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
            <Text style={styles.cardActionBtnText}>Book Appointment</Text>
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
            <Ionicons name="business" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardDoctorName} numberOfLines={1}>{lab.name}</Text>
            <Text style={styles.cardDoctorSpec}>{lab.area} • {lab.distance}</Text>
            <View style={styles.cardRatingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.cardRatingText}>{lab.rating} ({lab.reviewCount || 120}+ reviews)</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooterRow}>
          <Text style={styles.labTimingText}>🕒 {lab.openHours || 'Open Today • Fast-track reports'}</Text>

          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => navigation?.navigate('RadiologyLabDetails', { labId: lab.id })}
            activeOpacity={0.85}
          >
            <Ionicons name="flask-outline" size={14} color="#FFFFFF" />
            <Text style={styles.cardActionBtnText}>View Lab & Tests</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPrescriptionAnalysis = (analysis) => {
    if (!analysis) return null;
    const { medicines = [] } = analysis;

    return (
      <View style={styles.rxAnalysisBox}>
        <View style={styles.rxAnalysisHeader}>
          <Ionicons name="document-text" size={16} color="#1E40AF" />
          <Text style={styles.rxAnalysisHeaderTitle}>Detected Prescription Medicines ({medicines.length})</Text>
        </View>

        {medicines.map((med, idx) => (
          <View key={idx} style={styles.rxMedCard}>
            <View style={styles.rxMedTop}>
              <Text style={styles.rxMedName}>{med.name}</Text>
              <Text style={styles.rxMedType}>{med.type}</Text>
            </View>
            <Text style={styles.rxMedUse}>{med.use}</Text>
            <View style={styles.rxMedTimingRow}>
              <Ionicons name="time-outline" size={13} color="#059669" />
              <Text style={styles.rxMedTimingText}>Dosage: {med.timing}</Text>
            </View>
            {med.caution && (
              <Text style={styles.rxMedCaution}>⚠️ Caution: {med.caution}</Text>
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
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          </View>
        )}

        <View style={[styles.messageBubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.userUploadedImage} resizeMode="cover" />
          )}

          <Text style={[styles.messageText, isBot ? styles.textBot : styles.textUser]}>
            {item.text}
          </Text>

          {item.prescriptionAnalysis && renderPrescriptionAnalysis(item.prescriptionAnalysis)}
          {item.suggestedDoctor && renderDoctorCard(item.suggestedDoctor)}
          {item.suggestedLab && renderLabCard(item.suggestedLab)}

          {item.actionButtons && item.actionButtons.length > 0 && (
            <View style={styles.actionButtonsCol}>
              {item.actionButtons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chatActionBtn}
                  onPress={btn.action}
                  activeOpacity={0.8}
                >
                  <Ionicons name={btn.icon || 'arrow-forward'} size={15} color={colors.primary} />
                  <Text style={styles.chatActionBtnText}>{btn.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {item.quickPrompts && (
            <View style={styles.mockupPromptsContainer}>
              <Text style={styles.mockupPromptsHeading}>Frequently Asked Topics</Text>
              {item.quickPrompts.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.mockupPromptCard}
                  onPress={() => handleSend(p.text)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.mockupPromptIconCircle, { backgroundColor: p.bg }]}>
                    <Ionicons name={p.icon} size={15} color={p.color} />
                  </View>
                  <Text style={styles.mockupPromptCardText}>{p.text}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.webContainer}>
        {/* ============================================================
            DESKTOP LEFT SIDEBAR: HEALTH WORKSTATION DESK
        ============================================================ */}
        {isDesktop && (
          <View style={styles.leftSidebar}>
            {/* Assistant Profile Card */}
            <View style={styles.assistantProfileCard}>
              <View style={styles.assistantAvatarCircle}>
                <Ionicons name="sparkles" size={24} color="#0D9488" />
                <View style={styles.assistantOnlineDot} />
              </View>
              <View style={styles.assistantInfoCol}>
                <Text style={styles.assistantName}>MediUnify AI</Text>
                <Text style={styles.assistantRole}>Clinical Triage & Health Guide</Text>
                <View style={styles.liveTagRow}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveTagText}>24/7 Live • Karnataka Network</Text>
                </View>
              </View>
            </View>

            {/* Quick Stats Banner */}
            <View style={styles.statsBanner}>
              <View style={styles.statPill}>
                <Ionicons name="shield-checkmark" size={13} color="#059669" />
                <Text style={styles.statPillText}>100% Confidential</Text>
              </View>
              <View style={styles.statPill}>
                <Ionicons name="checkmark-circle" size={13} color="#0284C7" />
                <Text style={styles.statPillText}>NABH & NABL Aligned</Text>
              </View>
            </View>

            {/* Triage Categories List */}
            <Text style={styles.sidebarSectionTitle}>Quick Clinical Topics</Text>
            <ScrollView
              style={styles.categoriesScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              {QUICK_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryItemBtn}
                  onPress={() => handleSend(cat.prompt)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.catIconWrap, { backgroundColor: cat.bg }]}>
                    <Ionicons name={cat.icon} size={16} color={cat.color} />
                  </View>
                  <Text style={styles.catLabelText}>{cat.label}</Text>
                  <Ionicons name="chevron-forward" size={13} color="#94A3B8" />
                </TouchableOpacity>
              ))}

              {/* Emergency Banner */}
              <TouchableOpacity
                style={styles.emergencyCard}
                onPress={() => navigation?.navigate('Emergency')}
                activeOpacity={0.85}
              >
                <View style={styles.emergencyIconWrap}>
                  <Ionicons name="call" size={18} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emergencyTitle}>Medical Emergency?</Text>
                  <Text style={styles.emergencySubtitle}>Free Ambulance: 108 / 24x7</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ============================================================
            MAIN CHAT WORKSPACE
        ============================================================ */}
        <View style={styles.chatWorkspace}>
          {/* Chat Workspace Header */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (navigation?.canGoBack && navigation.canGoBack()) {
                  navigation.goBack();
                } else if (navigation?.navigate) {
                  navigation.navigate('Home');
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={20} color="#1E293B" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.headerInfoCol}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitleText}>MediUnify AI Assistant</Text>
                <View style={styles.headerOnlinePill}>
                  <View style={styles.headerOnlineDot} />
                  <Text style={styles.headerOnlinePillText}>Active Now</Text>
                </View>
              </View>
              <Text style={styles.headerSubText}>
                Trained on verified medical guidelines, doctors, diagnostic labs & pharmacy data
              </Text>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={styles.scanHeaderActionBtn}
                onPress={handleScanPrescription}
                activeOpacity={0.85}
              >
                <Ionicons name="scan-outline" size={16} color="#0D9488" />
                <Text style={styles.scanHeaderActionText}>Scan Rx</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetHeaderActionBtn}
                onPress={() => {
                  setMessages(INITIAL_MESSAGES);
                  showAlert('Chat Cleared', 'Conversation history has been reset.');
                }}
                activeOpacity={0.7}
                title="Reset Conversation"
              >
                <Ionicons name="refresh-outline" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Suggestions Horizontal Scroll */}
          <View style={styles.suggestionsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsContent}
              keyboardShouldPersistTaps="always"
            >
              {QUICK_SUGGESTIONS.map((sug, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionPill}
                  onPress={() => handleSend(sug)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.suggestionPillText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Messages Stream */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={true}
            style={styles.flatListStyle}
            keyboardShouldPersistTaps="always"
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingContainer}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.typingBubble}>
                    {scanningPrescription ? (
                      <View style={styles.scanningRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.typingText}>Scanning Prescription OCR & Analyzing Tablets...</Text>
                      </View>
                    ) : (
                      <View style={styles.scanningRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.typingText}>MediUnify AI is typing...</Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : null
            }
          />

          {/* Bottom Chat Input Bar */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={styles.inputAreaRoot}>
              <View style={styles.inputRow}>
                {/* Upload Rx Button */}
                <TouchableOpacity
                  style={styles.uploadRxBtn}
                  onPress={handleScanPrescription}
                  activeOpacity={0.8}
                  title="Upload Prescription Photo"
                >
                  <Ionicons name="camera" size={18} color="#0D9488" />
                </TouchableOpacity>

                {/* Text Input with Enter-to-send */}
                <TextInput
                  style={styles.webTextInput}
                  placeholder="Ask anything about your health, symptoms, medicines, lab tests... (Press Enter)"
                  placeholderTextColor="#94A3B8"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSend()}
                  returnKeyType="send"
                />

                {/* Mic Voice Button */}
                <TouchableOpacity
                  style={styles.micBtn}
                  onPress={() => showAlert('Voice Search', 'Speak your question or symptom clearly into your microphone.')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mic" size={18} color="#0D9488" />
                </TouchableOpacity>

                {/* Send Button */}
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    !inputText.trim() && styles.sendBtnDisabled,
                  ]}
                  onPress={() => handleSend()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Disclaimer */}
              <View style={styles.disclaimerRow}>
                <Ionicons name="information-circle-outline" size={13} color="#64748B" />
                <Text style={styles.disclaimerText}>
                  MediUnify AI provides health guidance and triage. It does not replace professional doctor diagnosis. In life-threatening emergencies, call 108 immediately.
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* PRESCRIPTION SCANNER IN-CHAT MODAL */}
        {showRxModal && (
          <View style={styles.rxModalOverlay}>
            <View style={styles.rxModalCard}>
              <View style={styles.rxModalHeader}>
                <View style={styles.rxModalIconCircle}>
                  <Ionicons name="document-text" size={22} color="#0D9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rxModalTitle}>Scan & Analyze Prescription</Text>
                  <Text style={styles.rxModalSubtitle}>Decode medicines, dosage, uses & safety cautions</Text>
                </View>
                <TouchableOpacity onPress={() => setShowRxModal(false)} style={styles.rxModalCloseBtn}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.rxModalOptions}>
                <TouchableOpacity
                  style={styles.rxModalOptionBtn}
                  onPress={() => {
                    setShowRxModal(false);
                    launchImagePicker();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.rxOptionIconWrap, { backgroundColor: '#CCFBF1' }]}>
                    <Ionicons name="cloud-upload" size={20} color="#0D9488" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rxOptionTitle}>Upload Photo or File</Text>
                    <Text style={styles.rxOptionDesc}>Select prescription JPG / PNG from your computer</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rxModalOptionBtn}
                  onPress={() => {
                    setShowRxModal(false);
                    setScanningPrescription(true);
                    setIsTyping(true);
                    setTimeout(() => {
                      setScanningPrescription(false);
                      setIsTyping(false);
                      analyzePrescriptionData(PRESCRIPTION_SAMPLES[0]);
                    }, 1200);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.rxOptionIconWrap, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="flask" size={20} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rxOptionTitle}>Sample 1: General Infection & Fever Rx</Text>
                    <Text style={styles.rxOptionDesc}>Amoxicillin 500mg, Paracetamol 650mg, Pantoprazole 40mg</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rxModalOptionBtn}
                  onPress={() => {
                    setShowRxModal(false);
                    setScanningPrescription(true);
                    setIsTyping(true);
                    setTimeout(() => {
                      setScanningPrescription(false);
                      setIsTyping(false);
                      analyzePrescriptionData(PRESCRIPTION_SAMPLES[1]);
                    }, 1200);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.rxOptionIconWrap, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="heart" size={20} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rxOptionTitle}>Sample 2: Cardiology & Hypertension Rx</Text>
                    <Text style={styles.rxOptionDesc}>Telmisartan 40mg, Atorvastatin 10mg, Ecosprin 75mg</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.rxModalCancelBtn}
                onPress={() => setShowRxModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.rxModalCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    height: Platform.OS === 'web' ? 'calc(100vh - 125px)' : '100%',
  },
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#E2E8F0',
    borderRadius: Platform.OS === 'web' ? 12 : 0,
    marginVertical: Platform.OS === 'web' ? 8 : 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },

  // LEFT SIDEBAR
  leftSidebar: {
    width: 320,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 16,
    flexDirection: 'column',
  },
  assistantProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 12,
  },
  assistantAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    position: 'relative',
  },
  assistantOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  assistantInfoCol: {
    flex: 1,
  },
  assistantName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  assistantRole: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  liveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  statsBanner: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  statPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  sidebarSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoriesScrollView: {
    flex: 1,
  },
  categoryItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    gap: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.15s ease' } : {}),
  },
  catIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabelText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    gap: 10,
  },
  emergencyIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 10.5,
    color: '#DC2626',
    fontWeight: '600',
  },

  // RIGHT CHAT WORKSPACE
  chatWorkspace: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerInfoCol: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
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
    backgroundColor: '#10B981',
  },
  headerOnlinePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
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
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  scanHeaderActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  resetHeaderActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },

  // SUGGESTIONS BAR
  suggestionsBar: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  suggestionsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  suggestionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  // MESSAGES
  flatListStyle: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}),
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: Platform.OS === 'web' ? '78%' : '88%',
    borderRadius: 16,
    padding: 14,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#0D9488',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  textBot: {
    color: '#1E293B',
  },
  textUser: {
    color: '#FFFFFF',
  },
  userUploadedImage: {
    width: 220,
    height: 140,
    borderRadius: 10,
    marginBottom: 8,
  },

  // CARDS INSIDE BOT MESSAGE
  cardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  labIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDoctorName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  cardDoctorSpec: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardRatingText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cardFeeLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  cardFeeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D9488',
  },
  labTimingText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    marginRight: 6,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  cardActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // PRESCRIPTION ANALYSIS
  rxAnalysisBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rxAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  rxAnalysisHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  rxMedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  rxMedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  rxMedName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  rxMedType: {
    fontSize: 10.5,
    color: '#0284C7',
    fontWeight: '700',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rxMedUse: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 4,
  },
  rxMedTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rxMedTimingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  rxMedCaution: {
    fontSize: 10.5,
    color: '#D97706',
    marginTop: 2,
  },

  // ACTION BUTTONS
  actionButtonsCol: {
    gap: 6,
    marginTop: 10,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  chatActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },

  // FREQUENTLY ASKED PROMPT CARDS
  mockupPromptsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mockupPromptsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
  },
  mockupPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  mockupPromptIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupPromptCardText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },

  // TYPING
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  // INPUT
  inputAreaRoot: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadRxBtn: {
    width: 40,
    height: 40,
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
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
    outlineStyle: 'none',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#99F6E4',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
  },

  // RX MODAL STYLES
  rxModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
  },
  rxModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxWidth: 500,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  rxModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rxModalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  rxModalSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  rxModalCloseBtn: {
    padding: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  rxModalOptions: {
    gap: 10,
    marginBottom: 16,
  },
  rxModalOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.15s ease' } : {}),
  },
  rxOptionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  rxOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  rxModalCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  rxModalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});

export default ChatbotScreenWeb;
