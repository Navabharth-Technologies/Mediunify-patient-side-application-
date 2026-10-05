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
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showAlert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import colors from '../../theme/colors';
import doctors from '../../data/doctors';
import { radiologyLabs } from '../../data/radiologyLabsData';
import { useCart } from '../../context/CartContext';

// Horizontally scrollable quick prompt chips
const QUICK_SUGGESTIONS = [
  { icon: 'fitness-outline', text: 'I have fever & body pain' },
  { icon: 'person-outline', text: 'Find a doctor' },
  { icon: 'flask-outline', text: 'Book a blood test' },
  { icon: 'medkit-outline', text: 'Order medicines' },
  { icon: 'home-outline', text: 'Home care' },
  { icon: 'heart-outline', text: 'Best Cardiologist' },
  { icon: 'body-outline', text: 'Knee & joint pain' },
  { icon: 'document-text-outline', text: 'Scan prescription' },
];

// Compact "Try asking" suggestions for initial welcome card
const COMPACT_TRY_ASKING = [
  { id: '1', icon: 'heart-outline', color: '#EF4444', bg: '#FEE2E2', title: 'Fever & body pain', query: 'I have fever and body pain' },
  { id: '2', icon: 'person-outline', color: '#007D69', bg: '#E6F4F1', title: 'Find a doctor', query: 'Find best doctor for consultation' },
  { id: '3', icon: 'flask-outline', color: '#0284C7', bg: '#E0F2FE', title: 'Book a blood test', query: 'Book a blood test at home' },
  { id: '4', icon: 'medkit-outline', color: '#10B981', bg: '#D1FAE5', title: 'Order medicines', query: 'Order my medicines from pharmacy' },
  { id: '5', icon: 'home-outline', color: '#F97316', bg: '#FFEDD5', title: 'Post-surgery home care', query: 'Post-surgery home care and equipment' },
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
        use: 'Reduces fever and relieves body ache / headache.',
        timing: '1 tablet every 6-8 hours as needed (after food)',
        caution: 'Do not exceed 3000mg per day to protect liver.',
      },
      {
        name: 'Pantoprazole 40mg',
        type: 'Antacid / PPI',
        use: 'Prevents stomach acidity and gastritis.',
        timing: '1 tablet daily before breakfast on empty stomach',
        caution: 'Swallow whole with a glass of water.',
      },
    ],
    doctorSpecialty: 'General Physician',
    doctorSuggestionId: '1',
  },
];

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'bot',
    isWelcome: true,
    text: "Hi! I'm MediUnify AI 👋\nHow can I help you today?",
    subText: 'Ask me about symptoms, doctors, tests, medicines, or care.',
    quickPrompts: COMPACT_TRY_ASKING,
  },
];

const ChatbotScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const { addToCart } = useCart();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scanningPrescription, setScanningPrescription] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const flatListRef = useRef(null);

  // Keyboard listener to dynamically handle bottom navigation clearance
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, isTyping]);

  // Handle User Input Submission
  const handleSend = (customText = null) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend) return;

    if (textToSend.toLowerCase().includes('scan prescription')) {
      handleScanPrescription();
      return;
    }

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
    }, 600);
  };

  // ==========================================
  // PRESCRIPTION SCANNER (CAMERA / GALLERY)
  // ==========================================
  const handleScanPrescription = async () => {
    try {
      showAlert(
        'Scan Prescription',
        'Choose how you would like to provide your prescription photo:',
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
            text: '📄 Use Sample Rx',
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
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const userImgMsg = {
          id: `user-img-${Date.now()}`,
          sender: 'user',
          text: '📄 Uploaded Prescription for AI OCR Analysis',
          image: asset.uri,
        };
        setMessages((prev) => [...prev, userImgMsg]);
        analyzePrescriptionData(PRESCRIPTION_SAMPLES[0]);
      }
    } catch (err) {
      showAlert('Scan Error', 'Could not open camera or gallery.');
    }
  };

  const analyzePrescriptionData = (sampleRx) => {
    setIsTyping(true);
    setScanningPrescription(true);

    setTimeout(() => {
      setIsTyping(false);
      setScanningPrescription(false);

      const matchedDoctor = doctors.find((d) => d.id === sampleRx.doctorSuggestionId) || doctors[0];

      const analysisMsg = {
        id: `bot-rx-${Date.now()}`,
        sender: 'bot',
        text: `✅ **Prescription Scanned & Verified**\n\nIdentified **${sampleRx.medicines.length} prescribed medications** for ${sampleRx.name}:`,
        prescriptionAnalysis: sampleRx,
        suggestedDoctor: matchedDoctor,
        actionButtons: [
          {
            title: '💊 Add Prescribed Medicines to Cart',
            icon: 'cart-outline',
            action: () => {
              sampleRx.medicines.forEach((med, i) => {
                addToCart({
                  id: `rx-med-${Date.now()}-${i}`,
                  name: med.name,
                  price: 85 + i * 40,
                  category: 'Prescription Medicine',
                  image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
                  storeName: 'Apollo Pharmacy (Mysuru)',
                });
              });
              showAlert('Medicines Added', 'All prescribed medications added to your Cart.');
              navigation.navigate('Cart');
            },
          },
          {
            title: `👨‍⚕️ Book Follow-up with ${matchedDoctor.name}`,
            icon: 'calendar-outline',
            action: () => navigation.navigate('DoctorDetails', { doctor: matchedDoctor }),
          },
        ],
      };

      setMessages((prev) => [...prev, analysisMsg]);
    }, 1200);
  };

  // ==========================================
  // NATURAL HEALTH QUERY NLP PROCESSOR
  // ==========================================
  const processHealthQuery = (query) => {
    const q = query.toLowerCase();

    // 1. FEVER / COLD / COUGH / PAIN
    if (q.includes('fever') || q.includes('cold') || q.includes('cough') || q.includes('body pain') || q.includes('headache') || q.includes('flu')) {
      const physician = doctors.find((d) => d.specialtyKey === 'general') || doctors[0];
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: "🌡️ **Fever & Body Ache Guidance**\n\nFever and body ache are common signs that your immune system is responding to a viral or bacterial condition.\n\n• Stay well hydrated with warm water and electrolytes.\n• Get adequate rest.\n• Avoid strenuous physical activities.\n\nFor clinical assessment and safe prescription, we recommend consulting our verified General Physician:",
        suggestedDoctor: physician,
        actionButtons: [
          {
            title: `Book ${physician.name} (${physician.fee})`,
            icon: 'calendar-outline',
            action: () => navigation.navigate('DoctorDetails', { doctor: physician }),
          },
          {
            title: '🧪 Complete Blood Count (CBC) at Home',
            icon: 'flask-outline',
            action: () => navigation.navigate('LabTests'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 2. CHILD / PEDIATRIC
    if (q.includes('child') || q.includes('baby') || q.includes('kid') || q.includes('pediatric')) {
      const pediatrician = doctors.find((d) => d.specialtyKey === 'pediatric') || doctors[0];
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '👶 **Child Health & Pediatric Care**\n\nFor infant or child care, accurate weight-adjusted dosing and specialist pediatric examination is essential for gentle recovery.',
        suggestedDoctor: pediatrician,
        actionButtons: [
          {
            title: `Consult ${pediatrician.name}`,
            icon: 'person-outline',
            action: () => navigation.navigate('DoctorDetails', { doctor: pediatrician }),
          },
          {
            title: 'Find More Pediatricians',
            icon: 'search-outline',
            action: () => navigation.navigate('DoctorList', { specialty: 'pediatric' }),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 3. CARDIOLOGY / CHEST PAIN / HEART
    if (q.includes('chest pain') || q.includes('heart') || q.includes('cardio') || q.includes('palpitation') || q.includes('breathless')) {
      const cardiologist = doctors.find((d) => d.specialtyKey === 'cardio') || doctors[1];
      const nearbyLab = radiologyLabs[0];

      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '❤️ **Cardiac & Chest Health Advisory**\n\n*If you are experiencing severe crushing chest pain or left arm numbness, please visit the emergency room immediately.*\n\nFor clinical evaluation, ECG, and 2D Echo, consult our senior Cardiologist:',
        suggestedDoctor: cardiologist,
        actionButtons: [
          {
            title: `Book ${cardiologist.name} (${cardiologist.fee})`,
            icon: 'heart-outline',
            action: () => navigation.navigate('DoctorDetails', { doctor: cardiologist }),
          },
          {
            title: `ECG / 2D Echo at ${nearbyLab.name}`,
            icon: 'flask-outline',
            action: () => navigation.navigate('RadiologyLabDetails', { labId: nearbyLab.id }),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 4. LAB TESTS / BLOOD TEST
    if (q.includes('lab') || q.includes('test') || q.includes('blood') || q.includes('scan') || q.includes('mri') || q.includes('x-ray')) {
      const topLab = radiologyLabs[0];
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🧪 **Diagnostic Labs & Health Checkups**\n\nWe provide verified diagnostic testing across accredited laboratories in Mysuru with **Free Home Sample Collection** and fast digital reports.',
        suggestedLab: topLab,
        actionButtons: [
          {
            title: 'Book Blood Tests at Home',
            icon: 'flask-outline',
            action: () => navigation.navigate('LabTests'),
          },
          {
            title: 'View Diagnostic Centers & Scans',
            icon: 'business-outline',
            action: () => navigation.navigate('RadiologyLabs'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 5. MEDICINES / PHARMACY
    if (q.includes('medicine') || q.includes('tablet') || q.includes('pharmacy') || q.includes('order') || q.includes('paracetamol')) {
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '💊 **Online Pharmacy & Doorstep Delivery**\n\nOrder genuine medicines and healthcare essentials from verified local pharmacies with swift doorstep delivery.',
        actionButtons: [
          {
            title: 'Open MediUnify Pharmacy',
            icon: 'medkit-outline',
            action: () => navigation.navigate('Pharmacy'),
          },
          {
            title: '📷 Scan Prescription for Auto-Order',
            icon: 'document-text-outline',
            action: () => handleScanPrescription(),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 6. HOME CARE / NURSE / EQUIPMENT RENTAL
    if (q.includes('home care') || q.includes('nurse') || q.includes('equipment') || q.includes('bed') || q.includes('wheelchair') || q.includes('oxygen')) {
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🏠 **Home Healthcare & Equipment Rental**\n\nAccess professional nursing care, elderly assistance, and hospital-grade medical equipment for recovery at home.',
        actionButtons: [
          {
            title: 'Rent Hospital Bed & Oxygen',
            icon: 'bed-outline',
            action: () => navigation.navigate('EquipmentRental'),
          },
          {
            title: 'Book Home Care Nursing',
            icon: 'bandage-outline',
            action: () => navigation.navigate('NurseBooking'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // 7. FIND DOCTORS
    if (q.includes('doctor') || q.includes('consult') || q.includes('appointment')) {
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '👨‍⚕️ **Find Trusted Doctors**\n\nConsult highly qualified doctors across 20+ specialties for clinic visits or instant video consultations.',
        actionButtons: [
          {
            title: 'Search Doctors by Specialty',
            icon: 'search-outline',
            action: () => navigation.navigate('FindDoctors'),
          },
          {
            title: 'Instant Video Consultation',
            icon: 'videocam-outline',
            action: () => navigation.navigate('VideoConsultation'),
          },
        ],
      };
      setMessages((prev) => [...prev, botResponse]);
      return;
    }

    // DEFAULT FALLBACK
    const defaultDoctor = doctors[0];
    const fallbackResponse = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `I understand you are asking about "${query}".\n\nMediUnify connects you with certified healthcare professionals, diagnostic tests, medicines, and home care. How would you like to proceed?`,
      actionButtons: [
        {
          title: `Consult ${defaultDoctor.name}`,
          icon: 'calendar-outline',
          action: () => navigation.navigate('DoctorDetails', { doctor: defaultDoctor }),
        },
        {
          title: 'Explore All Healthcare Services',
          icon: 'grid-outline',
          action: () => navigation.navigate('AllServices'),
        },
      ],
    };
    setMessages((prev) => [...prev, fallbackResponse]);
  };

  // Render Doctor Suggestion Card
  const renderDoctorCard = (doc) => {
    if (!doc) return null;
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <Image source={{ uri: doc.image }} style={styles.cardAvatar} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardDoctorName}>{doc.name}</Text>
            <Text style={styles.cardDoctorSpec}>{doc.specialty} • {doc.experience || '12+ yrs exp'}</Text>
            <View style={styles.cardRatingRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.cardRatingText}>{doc.rating || '4.8'} ({doc.reviews || '120+'})</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooterRow}>
          <View>
            <Text style={styles.cardFeeLabel}>Consultation</Text>
            <Text style={styles.cardFeeVal}>{doc.fee || '₹500'}</Text>
          </View>

          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => navigation.navigate('DoctorDetails', { doctor: doc })}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={13} color="#FFFFFF" />
            <Text style={styles.cardActionBtnText}>Book Visit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Lab Suggestion Card
  const renderLabCard = (lab) => {
    if (!lab) return null;
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.labIconCircle}>
            <Ionicons name="flask" size={20} color="#007D69" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardDoctorName}>{lab.name}</Text>
            <Text style={styles.cardDoctorSpec}>{lab.area || 'Mysuru'} • NABL Accredited</Text>
            <View style={styles.cardRatingRow}>
              <Ionicons name="shield-checkmark" size={12} color="#00B894" />
              <Text style={[styles.cardRatingText, { color: '#059669' }]}>Free Home Sample Collection</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooterRow}>
          <Text style={styles.labTimingText}>Reports in 6-12 hrs</Text>
          <TouchableOpacity
            style={[styles.cardActionBtn, { backgroundColor: '#0284C7' }]}
            onPress={() => navigation.navigate('RadiologyLabDetails', { labId: lab.id })}
            activeOpacity={0.85}
          >
            <Ionicons name="flask-outline" size={13} color="#FFFFFF" />
            <Text style={styles.cardActionBtnText}>View Tests</Text>
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
          <Ionicons name="document-text" size={16} color="#0284C7" />
          <Text style={styles.rxAnalysisHeaderTitle}>Detected Tablets & Usage</Text>
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
            <Image
              source={require('../../../assets/ai-bot-avatar.png')}
              style={styles.messageBotImg}
              resizeMode="contain"
            />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.bubbleUser : styles.bubbleBot,
          ]}
        >
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.userUploadedImage} resizeMode="cover" />
          )}

          <Text
            style={[
              styles.messageText,
              isUser ? styles.textUser : styles.textBot,
            ]}
          >
            {item.text}
          </Text>

          {item.subText && (
            <Text style={styles.messageSubText}>{item.subText}</Text>
          )}

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
                  <Ionicons name={btn.icon || 'arrow-forward'} size={15} color="#007D69" />
                  <Text style={styles.chatActionBtnText}>{btn.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* COMPACT "TRY ASKING" CARDS */}
          {item.quickPrompts && (
            <View style={styles.tryAskingContainer}>
              <Text style={styles.tryAskingHeading}>Try asking</Text>
              {item.quickPrompts.map((prompt) => (
                <TouchableOpacity
                  key={prompt.id}
                  style={styles.tryAskingCard}
                  onPress={() => handleSend(prompt.query)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tryAskingIconCircle, { backgroundColor: prompt.bg }]}>
                    <Ionicons name={prompt.icon} size={15} color={prompt.color} />
                  </View>
                  <Text style={styles.tryAskingCardTitle}>{prompt.title}</Text>
                  <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : (Platform.OS === 'android' ? 'height' : undefined)}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.mainLayout}>
          {/* 1. FIXED HEADER (FULL WIDTH) */}
          <View style={[styles.header, isTablet && styles.tabletHeader]}>
            <View style={[styles.headerInner, isTablet && styles.tabletInnerConstraint]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (navigation?.canGoBack()) navigation.goBack();
                  else navigation?.navigate('Home');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={22} color="#0F172A" />
              </TouchableOpacity>

              <View style={styles.headerAvatarWrap}>
                <Image
                  source={require('../../../assets/ai-bot-avatar.png')}
                  style={styles.headerBotImg}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.headerTitleCol}>
                <Text style={styles.headerTitle}>MediUnify AI</Text>
                <Text style={styles.headerSubtitle}>Your personal health assistant</Text>
              </View>

              <TouchableOpacity
                style={styles.headerMenuBtn}
                onPress={handleScanPrescription}
                activeOpacity={0.85}
              >
                <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. HORIZONTAL QUICK SUGGESTIONS BAR (FULL WIDTH) */}
          <View style={[styles.suggestionsContainer, isTablet && styles.tabletSuggestions]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.suggestionsContent, isTablet && styles.tabletSuggestionsContent]}
            >
              {QUICK_SUGGESTIONS.map((sug, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => handleSend(sug.text)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={sug.icon} size={13} color="#007D69" style={{ marginRight: 4 }} />
                  <Text style={styles.suggestionChipText}>{sug.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 3. SCROLLABLE CHAT MESSAGES LIST (flex: 1) */}
          <View style={styles.chatListWrapper}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              style={styles.flatList}
              contentContainerStyle={[styles.messageList, isTablet && styles.tabletMessageList]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListFooterComponent={
                isTyping ? (
                  <View style={styles.typingContainer}>
                    <View style={styles.botAvatar}>
                      <Image
                        source={require('../../../assets/ai-bot-avatar.png')}
                        style={styles.messageBotImg}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.typingBubble}>
                      {scanningPrescription ? (
                        <View style={styles.scanningRow}>
                          <ActivityIndicator size="small" color="#007D69" />
                          <Text style={styles.typingText}>Scanning Prescription OCR...</Text>
                        </View>
                      ) : (
                        <View style={styles.scanningRow}>
                          <ActivityIndicator size="small" color="#007D69" />
                          <Text style={styles.typingText}>MediUnify AI is typing...</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : null
              }
            />
          </View>

          {/* 4. CHAT INPUT & MEDICAL DISCLAIMER (ALWAYS VISIBLE & FULL WIDTH RESPONSIVE) */}
          <View
            style={[
              styles.bottomDockContainer,
              !isKeyboardVisible && styles.bottomDockWithNavSpacer,
              isTablet && styles.tabletBottomDock,
            ]}
          >
            <View style={[styles.bottomDockInner, isTablet && styles.tabletInnerConstraint]}>
              {/* Input Bar */}
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={handleScanPrescription}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#007D69" />
                </TouchableOpacity>

                <TextInput
                  style={styles.textInput}
                  placeholder="Ask MediUnify AI..."
                  placeholderTextColor="#94A3B8"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSend()}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  textAlignVertical="center"
                  includeFontPadding={false}
                  underlineColorAndroid="transparent"
                />

                {inputText.trim().length > 0 ? (
                  <TouchableOpacity
                    style={styles.sendBtnActive}
                    onPress={() => handleSend()}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.micBtn}
                    onPress={() => showAlert('Voice Search', 'Speak your symptom or question clearly.')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mic-outline" size={20} color="#007D69" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Compact Medical Disclaimer */}
              <View style={styles.disclaimerRow}>
                <Ionicons name="information-circle-outline" size={12} color="#64748B" />
                <Text style={styles.disclaimerText}>
                  AI guidance is not a substitute for professional medical advice.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLESHEET (Clean, Simple, Responsive Healthcare Aesthetic)
// ============================================================================
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  mainLayout: {
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F8FAFC',
  },

  // 1. Header
  header: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabletHeader: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabletInnerConstraint: {
    maxWidth: 920,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F6F6',
    borderWidth: 1.2,
    borderColor: '#C0ECE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginRight: 10,
  },
  headerBotImg: {
    width: 26,
    height: 26,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  headerMenuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2. Suggestions Bar
  suggestionsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabletSuggestions: {
    paddingVertical: 10,
  },
  suggestionsContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  tabletSuggestionsContent: {
    paddingHorizontal: 24,
    gap: 10,
    maxWidth: 920,
    alignSelf: 'center',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },

  // 3. Message List Area
  chatListWrapper: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  messageList: {
    padding: 14,
    paddingBottom: 16,
  },
  tabletMessageList: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: 920,
    width: '100%',
    alignSelf: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F6F6',
    borderWidth: 1.2,
    borderColor: '#C0ECE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageBotImg: {
    width: 20,
    height: 20,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#007D69',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  messageSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  textBot: {
    color: '#0F172A',
  },
  textUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  userUploadedImage: {
    width: 170,
    height: 110,
    borderRadius: 8,
    marginBottom: 6,
  },

  // 4. "Try asking" Compact Cards
  tryAskingContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tryAskingHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  tryAskingCard: {
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
  },
  tryAskingIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAskingCardTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Doctor & Lab Cards
  cardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatar: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  labIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDoctorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardDoctorSpec: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  cardRatingText: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cardFeeLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  cardFeeVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#007D69',
  },
  labTimingText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007D69',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 3,
  },
  cardActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Prescription Block
  rxAnalysisBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  rxAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  rxAnalysisHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
  },
  rxMedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  rxMedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  rxMedName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  rxMedType: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '700',
  },
  rxMedUse: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 3,
  },
  rxMedTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rxMedTimingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },

  // Action Buttons
  actionButtonsCol: {
    gap: 6,
    marginTop: 8,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    borderWidth: 1,
    borderColor: '#B2E2D8',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  chatActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#007D69',
  },

  // Typing Loader
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typingText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },

  // 4. Bottom Input & Disclaimer Dock
  bottomDockContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    zIndex: 20,
    elevation: 5,
  },
  tabletBottomDock: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  bottomDockInner: {
    width: '100%',
  },
  bottomDockWithNavSpacer: {
    paddingBottom: Platform.OS === 'ios' ? 95 : 88,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    color: '#0F172A',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007D69',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 2,
    paddingBottom: 2,
  },
  disclaimerText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default ChatbotScreen;