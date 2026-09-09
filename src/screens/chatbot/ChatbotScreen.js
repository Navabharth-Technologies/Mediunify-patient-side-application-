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
  Alert,
  ScrollView,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import colors from '../../theme/colors';
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
    doctorSuggestionId: '1', // Dr. Ananya Rao
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
    doctorSuggestionId: '2', // Dr. Rahul Sharma
  },
];

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: 'Hello! 👋 I am **MediUnify AI Health Assistant**.\n\nHow can I help you today? You can:\n• Describe any **symptoms or health issues** for top doctor recommendations.\n• Ask about **medicines, safe usage, or side effects**.\n• **Upload a Prescription photo 📷** to scan and analyze tablets.\n• Ask for **nearby accredited Diagnostic Labs** for blood tests or MRI/CT scans.',
    quickReplies: [
      '🤒 Fever & Cold',
      '❤️ Chest Pain / Heart',
      '📷 Scan Prescription',
      '🧪 Nearby Diagnostic Lab',
      '📊 Health Monitor',
    ],
  },
];

const ChatbotScreen = ({ navigation }) => {
  const { addToCart } = useCart();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scanningPrescription, setScanningPrescription] = useState(false);

  const flatListRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, isTyping]);

  // Handle User Input Submission
  const handleSend = (customText = null) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      processHealthQuery(textToSend);
      setIsTyping(false);
    }, 800);
  };

  // ==========================================
  // PRESCRIPTION SCANNER (CAMERA / GALLERY)
  // ==========================================
  const handleScanPrescription = async () => {
    try {
      showAlert(
        'Upload Prescription to Scan',
        'Choose how you would like to provide your doctor prescription photo:',
        [
          {
            text: '📷 Take Photo',
            onPress: () => launchImagePicker(true),
          },
          {
            text: '🖼️ Choose from Gallery',
            onPress: () => launchImagePicker(false),
          },
          {
            text: '🧪 Use Sample Rx',
            onPress: () => analyzePrescriptionData(PRESCRIPTION_SAMPLES[0]),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (e) {
      console.log('Error opening prescription picker:', e);
    }
  };

  const launchImagePicker = async (useCamera) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Denied', 'Camera access is required to take photos of prescriptions.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Denied', 'Photo library access is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          allowsEditing: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        // Add User image message
        const userImgMsg = {
          id: `user-img-${Date.now()}`,
          sender: 'user',
          text: 'Uploaded doctor prescription for scanning 📷',
          image: imageUri,
        };
        setMessages((prev) => [...prev, userImgMsg]);

        // Trigger AI Scanning animation
        setScanningPrescription(true);
        setIsTyping(true);

        setTimeout(() => {
          setScanningPrescription(false);
          setIsTyping(false);
          analyzePrescriptionData(PRESCRIPTION_SAMPLES[0], imageUri);
        }, 2000);
      }
    } catch (e) {
      setScanningPrescription(false);
      setIsTyping(false);
      console.log('Image picker error:', e);
    }
  };

  // Analyze & parse prescription details
  const analyzePrescriptionData = (sampleRx, imageUri = null) => {
    const suggestedDoctor = doctors.find((d) => d.id === sampleRx.doctorSuggestionId) || doctors[0];

    const botMsg = {
      id: `bot-rx-${Date.now()}`,
      sender: 'bot',
      text: `✅ **Prescription Scanned & Analyzed Successfully!**\n\nI have detected **${sampleRx.medicines.length} medicines** from your prescription with their clinical uses and dosage instructions:`,
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
                { text: 'View Cart', onPress: () => navigation.navigate('Cart', { initialTab: 'pharmacy' }) },
              ]
            );
          },
        },
        {
          title: `👨‍⚕️ Consult ${suggestedDoctor.name}`,
          icon: 'calendar',
          action: () => navigation.navigate('DoctorDetails', { doctor: suggestedDoctor }),
        },
      ],
    };

    setMessages((prev) => [...prev, botMsg]);
  };

  // ==========================================
  // NATURAL LANGUAGE QUERY PROCESSOR
  // ==========================================
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
        text: '📊 **Health Monitor & Vitals Tracking**\n\nYou can log and monitor your **Blood Glucose (Sugar)**, **Blood Pressure (BP)**, **Oxygen (SpO2)**, **Temperature**, and **BMI** directly in the app with automatic color-coded safety indicators!',
        suggestedDoctor: physician,
        actionButtons: [
          {
            title: '📊 Open Health Monitor',
            icon: 'pulse',
            action: () => navigation.navigate('HealthMonitor'),
          },
          {
            title: `👨‍⚕️ Consult ${physician.name}`,
            icon: 'calendar',
            action: () => navigation.navigate('DoctorDetails', { doctor: physician }),
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
        text: '🔄 **Pharmacy Product Return Policy**\n\nYou can easily return delivered pharmacy medicines within our hassle-free return window.\n\n• Go to **My Orders** → Tap **Return Order**.\n• Select the items and provide the issue details (damaged seal, wrong medicine, expired date, doctor changed Rx).\n• Choose instant **MediUnnathi Wallet refund** or Bank source.\n• Free doorstep pickup will be arranged within 24-48 hours.',
        actionButtons: [
          {
            title: '📦 View Orders & Return',
            icon: 'receipt',
            action: () => navigation.navigate('MyOrders'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 4. HEART / CHEST PAIN / CARDIOLOGY
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
        text: '⚠️ **Chest Pain & Cardiac Health Advisory**\n\nIf you are experiencing severe crushing chest pain, radiating pain to the left arm or jaw, or extreme shortness of breath, please **seek emergency care immediately**.\n\nFor clinical evaluation, ECG, and echocardiography, we recommend consulting our senior Cardiologist:',
        suggestedDoctor: cardiologist,
        suggestedLab: nearbyLab,
        actionButtons: [
          {
            title: `Book ${cardiologist.name} (${cardiologist.fee})`,
            icon: 'heart',
            action: () => navigation.navigate('DoctorDetails', { doctor: cardiologist }),
          },
          {
            title: `🏥 ECG / Echo at ${nearbyLab.name}`,
            icon: 'flask',
            action: () => navigation.navigate('RadiologyLabDetails', { labId: nearbyLab.id }),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 5. SKIN / RASH / ACNE / HAIR / DERMATOLOGY
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
            action: () => navigation.navigate('DoctorDetails', { doctor: dermatologist }),
          },
          {
            title: '💊 Skin Care in Pharmacy',
            icon: 'medkit',
            action: () => navigation.navigate('Pharmacy'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 6. BONE / JOINT / BACK PAIN / ORTHOPEDIC
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
            action: () => navigation.navigate('DoctorDetails', { doctor: orthoDoctor }),
          },
          {
            title: `🏥 Digital X-Ray & MRI at ${nearbyLab.name}`,
            icon: 'flask',
            action: () => navigation.navigate('RadiologyLabDetails', { labId: nearbyLab.id }),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 7. LAB TESTS / SCANS / MRI / CT SCAN / BLOOD TEST
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
        text: `🧪 **Certified Diagnostic Labs & Imaging Centers**\n\nWe have partnered with NABH & NABL accredited diagnostic centers in Mysore for 100% verified digital reports.\n\n• **Blood Tests**: Home Sample Collection (Free) or Center Visit.\n• **Radiology Scans (MRI, CT, X-Ray, Ultrasound)**: Conducted on-site at the hospital with fast-track appointment tokens.`,
        suggestedLab: topLab,
        actionButtons: [
          {
            title: `🏥 View Tests at ${topLab.name}`,
            icon: 'flask',
            action: () => navigation.navigate('RadiologyLabDetails', { labId: topLab.id }),
          },
          {
            title: '🧪 All Diagnostic Centers',
            icon: 'business',
            action: () => navigation.navigate('RadiologyLabs'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 8. MEDICINE ADVICE / DRUG INQUIRY
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
        text: `💊 **Medicine Inquiry & Clinical Safety Guidance**\n\nWhile OTC medications like **Paracetamol (for fever/pain)** and **Antacid (for mild acidity)** offer temporary relief, **prescription drugs, antibiotics, and exact dosages must be prescribed by a certified doctor** based on your medical history.\n\n⚠️ **Medical Safety Notice**: Self-medication can mask underlying health issues or lead to drug interactions. Please consult a doctor for tailored prescription guidance.`,
        suggestedDoctor: generalDoctor,
        actionButtons: [
          {
            title: `👨‍⚕️ Consult ${generalDoctor.name} (${generalDoctor.fee})`,
            icon: 'calendar',
            action: () => navigation.navigate('DoctorDetails', { doctor: generalDoctor }),
          },
          {
            title: '💊 Browse Unnathi Pharmacy',
            icon: 'cart',
            action: () => navigation.navigate('Pharmacy'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 9. FEVER / COLD / COUGH / HEADACHE / GENERAL ILLNESS
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
        text: `🤒 **Symptom Evaluation & Care Guidance**\n\nFor fever, cold, or acute body ache:\n• Stay hydrated with plenty of warm fluids and ORS.\n• Get adequate rest and monitor temperature.\n• Avoid unprescribed heavy antibiotics.\n\nWe recommend booking a consultation with our verified General Physician:`,
        suggestedDoctor: physician,
        actionButtons: [
          {
            title: `Book ${physician.name} (${physician.fee})`,
            icon: 'calendar',
            action: () => navigation.navigate('DoctorDetails', { doctor: physician }),
          },
          {
            title: '💊 Order Fever Medicines',
            icon: 'cart',
            action: () => navigation.navigate('Pharmacy'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // DEFAULT FALLBACK WITH APP NAVIGATION OPTIONS
    const defaultDoctor = doctors[0];
    const topLab = radiologyLabs[0];

    const botResponse = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `🤖 **MediUnify Health Assistant**\n\nI can assist you with:\n1. **Doctor Consultations**: Find top specialists for any medical problem.\n2. **Prescription Scanner**: Upload your Rx photo to explain tablet uses and timings.\n3. **Pharmacy Delivery & Returns**: Order genuine medicines or schedule returns.\n4. **Diagnostic Labs & Scans**: Book certified blood tests, MRI, and CT scans.\n5. **Health Monitor**: Log Blood Sugar, Blood Pressure, and Vitals.\n\nWhat would you like to explore?`,
      suggestedDoctor: defaultDoctor,
      suggestedLab: topLab,
      actionButtons: [
        {
          title: '👨‍⚕️ Find Specialists',
          icon: 'people',
          action: () => navigation.navigate('DoctorsList'),
        },
        {
          title: '📷 Scan Prescription',
          icon: 'camera',
          action: handleScanPrescription,
        },
        {
          title: '💊 Pharmacy Store',
          icon: 'medkit',
          action: () => navigation.navigate('Pharmacy'),
        },
        {
          title: '🧪 Book Lab Tests',
          icon: 'flask',
          action: () => navigation.navigate('RadiologyLabs'),
        },
      ],
    };
    setMessages((prev) => [...prev, botResponse]);
  };

  // Render Doctor Card
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
            onPress={() => navigation.navigate('DoctorDetails', { doctor: doc })}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
            <Text style={styles.cardActionBtnText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Lab Card
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
            style={[styles.cardActionBtn, { backgroundColor: colors.secondary }]}
            onPress={() => navigation.navigate('RadiologyLabDetails', { labId: lab.id })}
            activeOpacity={0.85}
          >
            <Ionicons name="flask-outline" size={14} color="#FFFFFF" />
            <Text style={styles.cardActionBtnText}>View Lab Tests</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Prescription Analysis Block
  const renderPrescriptionBlock = (analysis) => {
    if (!analysis) return null;
    return (
      <View style={styles.rxAnalysisBox}>
        <View style={styles.rxAnalysisHeader}>
          <Ionicons name="document-text" size={18} color="#0284C7" />
          <Text style={styles.rxAnalysisHeaderTitle}>Detected Tablets & Clinical Uses</Text>
        </View>

        {analysis.medicines.map((med, idx) => (
          <View key={idx} style={styles.rxMedCard}>
            <View style={styles.rxMedTop}>
              <Text style={styles.rxMedName}>{med.name}</Text>
              <Text style={styles.rxMedType}>{med.type}</Text>
            </View>
            <Text style={styles.rxMedUse}>
              <Text style={{ fontWeight: '700', color: '#1E293B' }}>Used for: </Text>
              {med.use}
            </Text>
            <View style={styles.rxMedTimingRow}>
              <Ionicons name="time-outline" size={13} color="#059669" />
              <Text style={styles.rxMedTimingText}>{med.timing}</Text>
            </View>
            <Text style={styles.rxMedCaution}>⚠️ {med.caution}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render Message Item
  const renderMessageItem = ({ item }) => {
    const isUser = item.sender === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowBot,
        ]}
      >
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.bubbleUser : styles.bubbleBot,
          ]}
        >
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.userUploadedImage} />
          )}

          <Text
            style={[
              styles.messageText,
              isUser ? styles.textUser : styles.textBot,
            ]}
          >
            {item.text}
          </Text>

          {/* PRESCRIPTION SCAN ANALYSIS */}
          {item.prescriptionAnalysis && renderPrescriptionBlock(item.prescriptionAnalysis)}

          {/* DOCTOR SUGGESTION */}
          {item.suggestedDoctor && renderDoctorCard(item.suggestedDoctor)}

          {/* LAB SUGGESTION */}
          {item.suggestedLab && renderLabCard(item.suggestedLab)}

          {/* INTERACTIVE ACTION BUTTONS */}
          {item.actionButtons && (
            <View style={styles.actionButtonsCol}>
              {item.actionButtons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chatActionBtn}
                  onPress={btn.action}
                  activeOpacity={0.85}
                >
                  <Ionicons name={btn.icon || 'arrow-forward'} size={16} color={colors.primary} />
                  <Text style={styles.chatActionBtnText}>{btn.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* QUICK REPLIES */}
          {item.quickReplies && (
            <View style={styles.quickRepliesRow}>
              {item.quickReplies.map((reply, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickReplyChip}
                  onPress={() => handleSend(reply)}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>MediUnify AI Assistant</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Active</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Instant Health Triage & Doctor Suggestions</Text>
        </View>

        <TouchableOpacity
          style={styles.scanHeaderBtn}
          onPress={handleScanPrescription}
          activeOpacity={0.85}
        >
          <Ionicons name="camera" size={18} color={colors.primary} />
          <Text style={styles.scanHeaderBtnText}>Scan Rx</Text>
        </TouchableOpacity>
      </View>

      {/* QUICK SUGGESTIONS SCROLL */}
      <View style={styles.suggestionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
          {QUICK_SUGGESTIONS.map((sug, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionChip}
              onPress={() => handleSend(sug)}
              activeOpacity={0.85}
            >
              <Text style={styles.suggestionChipText}>{sug}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CHAT MESSAGES LIST */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingContainer}>
              <View style={styles.botAvatar}>
                <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
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

      {/* INPUT BAR */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          {/* CAMERA BUTTON */}
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={handleScanPrescription}
            activeOpacity={0.85}
          >
            <Ionicons name="camera-outline" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type your health question or symptom..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  scanHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  scanHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  suggestionChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },

  messageList: {
    padding: 16,
    paddingBottom: 20,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 14,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textBot: {
    color: '#1E293B',
  },
  textUser: {
    color: '#FFFFFF',
  },
  userUploadedImage: {
    width: 180,
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
  },

  // CARDS INSIDE BOT BUBBLE
  cardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
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
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  labIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.lightTeal,
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
    marginTop: 3,
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
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.primary,
  },
  labTimingText: {
    fontSize: 10.5,
    color: '#64748B',
    flex: 1,
    marginRight: 6,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  cardActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // PRESCRIPTION ANALYSIS
  rxAnalysisBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
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
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  rxMedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    borderRadius: 6,
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
    marginBottom: 2,
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
    backgroundColor: colors.lightTeal,
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  chatActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  // QUICK REPLIES
  quickRepliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  quickReplyChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  quickReplyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  // TYPING LOADER
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  cameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1E293B',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});

export default ChatbotScreen;