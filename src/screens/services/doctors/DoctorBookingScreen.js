import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { showAlert } from '../../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { pushAppointment } from '../../../services/dataSyncService';
import WebFooter from '../../../components/web/WebFooter';

const DoctorBookingScreen = ({ route, navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;
  const doctor = route?.params?.doctor;

  const [selectedTime, setSelectedTime] = useState('Tomorrow, 10:30 AM');

  // Patient Info (prefilled matching screenshot)
  const [patientName, setPatientName] = useState('Ramesh (Self)');
  const [patientPhone, setPatientPhone] = useState('+91 98450 12345');
  const [healthConcern, setHealthConcern] = useState('Stress, Joint Pain & Wellness');

  // Uploaded Medical Document / PDF / Image
  const [uploadedDocument, setUploadedDocument] = useState(null);

  // Payment method
  const [paymentOption, setPaymentOption] = useState('PAY_AT_CLINIC'); // 'PAY_AT_CLINIC' | 'WALLET' | 'PAY_ONLINE'
  const [walletBalance, setWalletBalance] = useState(1250);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    loadUserData();
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const stored = await AsyncStorage.getItem('@unnathi_wallet_balance');
      if (stored !== null) {
        setWalletBalance(parseInt(stored, 10) || 0);
      } else {
        await AsyncStorage.setItem('@unnathi_wallet_balance', '1250');
        setWalletBalance(1250);
      }
    } catch (e) {
      console.log('Error loading wallet in doctor booking:', e);
    }
  };

  const loadUserData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName && storedName.trim()) {
        setPatientName(`${storedName.trim()} (Self)`);
      }
      const storedPhone = await AsyncStorage.getItem('userPhone');
      if (storedPhone && storedPhone.trim()) {
        setPatientPhone(storedPhone.trim().startsWith('+91') ? storedPhone.trim() : `+91 ${storedPhone.trim()}`);
      }
    } catch (e) {
      console.log('Error loading user data:', e);
    }
  };

  // Upload PDF or Image handler
  const handlePickDocument = async (typeChoice = 'any') => {
    try {
      if (typeChoice === 'camera') {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            showAlert('Permission Required', 'Camera permission is required to capture documents.');
            return;
          }
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
        });
        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          setUploadedDocument({
            name: asset.fileName || `Prescription_Camera_${Date.now()}.jpg`,
            uri: asset.uri,
            type: 'image',
            size: asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
          });
        }
        return;
      }

      if (typeChoice === 'image') {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            showAlert('Permission Required', 'Gallery access is required.');
            return;
          }
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });
        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          setUploadedDocument({
            name: asset.fileName || `Medical_Image_${Date.now()}.jpg`,
            uri: asset.uri,
            type: 'image',
            size: asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB',
          });
        }
        return;
      }

      // PDF / Document Picker
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = typeChoice === 'pdf' ? '.pdf,application/pdf' : '.pdf,image/*,application/pdf';
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = URL.createObjectURL(file);
            const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
            setUploadedDocument({
              name: file.name,
              uri: url,
              type: isPdf ? 'pdf' : 'image',
              size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            });
          }
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: typeChoice === 'pdf' ? 'application/pdf' : ['application/pdf', 'image/*'],
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets?.[0]) {
          const file = result.assets[0];
          const isPdf = file.mimeType?.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf');
          setUploadedDocument({
            name: file.name,
            uri: file.uri,
            type: isPdf ? 'pdf' : 'image',
            size: file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF Document',
          });
        }
      }
    } catch (err) {
      console.log('Error picking document:', err);
      showAlert('Upload Error', 'Could not open file picker. Please try again.');
    }
  };

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scrollContent}>
          <View style={styles.modalCard}>
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={50} color="#D32F2F" />
              <Text style={styles.errorTitle}>Doctor Information Unavailable</Text>
              <Text style={styles.errorText}>Please go back and select a doctor again.</Text>
              <TouchableOpacity
                style={styles.confirmBookingBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.confirmBookingBtnText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const feeAmount = doctor.fee || 400;

  const handleBooking = async () => {
    if (!patientName.trim()) {
      showAlert('Patient Name Required', 'Please enter patient full name.');
      return;
    }
    if (!patientPhone.trim() || patientPhone.length < 10) {
      showAlert('Mobile Number Required', 'Please enter a valid mobile number.');
      return;
    }
    if (!selectedTime) {
      showAlert('Select Slot', 'Please choose an appointment slot.');
      return;
    }

    setIsBooking(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const bookingId = `DOC-${Math.floor(100000 + Math.random() * 900000)}`;
      const tokenNumber = `TK-${Math.floor(10 + Math.random() * 90)}`;

      // Wallet payment deduction
      if (paymentOption === 'WALLET') {
        if (walletBalance < feeAmount) {
          setIsBooking(false);
          showAlert(
            'Insufficient MediUnify Wallet Balance',
            `Your current wallet balance is ₹${walletBalance}, but consultation fee is ₹${feeAmount}.\n\nPlease top up your wallet or pay at clinic.`,
            [
              { text: 'Top Up Wallet', onPress: () => navigation.navigate('Wallet') },
              { text: 'Pay at Clinic', onPress: () => setPaymentOption('PAY_AT_CLINIC') },
            ]
          );
          return;
        }

        const newBal = walletBalance - feeAmount;
        await AsyncStorage.setItem('@unnathi_wallet_balance', String(newBal));
        setWalletBalance(newBal);

        try {
          const existingTxJson = await AsyncStorage.getItem('@unnathi_wallet_transactions');
          const existingTx = existingTxJson ? JSON.parse(existingTxJson) : [];
          const newTx = {
            id: `tx-doc-${Date.now()}`,
            title: `Doctor Consultation: ${doctor.name}`,
            subtitle: `In-Clinic Visit (Booking: ${bookingId})`,
            amount: `-₹${feeAmount}`,
            type: 'debit',
            date: 'Just now',
            icon: 'person-outline',
          };
          await AsyncStorage.setItem('@unnathi_wallet_transactions', JSON.stringify([newTx, ...existingTx]));
        } catch (errTx) {
          console.log('Error recording doctor wallet transaction:', errTx);
        }
      }

      const newAppointment = {
        id: bookingId,
        tokenNumber,
        type: 'In-Person',
        doctor: {
          name: doctor.name,
          specialty: doctor.specialty,
          clinicName: doctor.clinicName || 'Unnathi Multispeciality Clinic',
          clinicAddress: doctor.clinicAddress || 'No. 24, 5th Cross, Kuvempunagar, Mysore',
          clinicArea: doctor.clinicArea || 'Kuvempunagar, Mysore',
          phone: doctor.phone || '+91 821 245 9901',
          distance: doctor.distance || '0.8 km away',
        },
        day: selectedTime.includes('Tomorrow') ? 'Tomorrow' : 'Day After',
        date: selectedTime,
        time: selectedTime.split(', ')[1] || selectedTime,
        status: 'Confirmed',
        paidAmount: feeAmount,
        paymentStatus:
          paymentOption === 'WALLET'
            ? 'Paid via MediUnify Wallet'
            : paymentOption === 'PAY_AT_CLINIC'
            ? 'Pay at Clinic Reception'
            : 'Paid Online (UPI)',
        paymentMethod:
          paymentOption === 'WALLET'
            ? 'MediUnify Health Wallet'
            : paymentOption === 'PAY_AT_CLINIC'
            ? 'Pay at Clinic'
            : 'UPI / Online Card',
        patient: {
          name: patientName,
          phone: patientPhone,
          reason: healthConcern,
          reportUri: uploadedDocument?.uri || null,
          reportName: uploadedDocument?.name || null,
          reportType: uploadedDocument?.type || null,
        },
      };

      // Save to AsyncStorage
      const existingJson = await AsyncStorage.getItem('@unnathi_appointments');
      const existing = existingJson ? JSON.parse(existingJson) : [];
      await AsyncStorage.setItem(
        '@unnathi_appointments',
        JSON.stringify([newAppointment, ...existing])
      );

      // Server push
      try {
        await pushAppointment(newAppointment);
      } catch (pushErr) {
        console.warn('Could not push doctor appointment to server:', pushErr);
      }

      setIsBooking(false);

      showAlert(
        'Appointment Confirmed! 🎉',
        `Your clinic consultation with ${doctor.name} has been confirmed for ${selectedTime}.${uploadedDocument ? '\n\nAttached Record: ' + uploadedDocument.name : ''}\n\nToken: ${tokenNumber}`,
        [
          {
            text: 'View Appointments',
            onPress: () => {
              navigation.navigate('Bookings', {
                newAppointment,
                initialTab: 'Doctor Visits',
                timestamp: Date.now(),
              });
            },
          },
          {
            text: 'Done',
            onPress: () => {
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (e) {
      console.log('Error saving doctor booking:', e);
      setIsBooking(false);
      showAlert('Booking Error', 'Could not save appointment. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            isDesktopWeb && styles.scrollContentDesktop,
          ]}
        >
          {/* DESKTOP BREADCRUMBS ROW (LIGHT BACKGROUND) */}
          {isDesktopWeb && (
            <View style={styles.breadcrumbsRow}>
              <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Text style={styles.breadcrumbLink}>Home</Text>
              </TouchableOpacity>
              <Text style={styles.breadcrumbSlash}>/</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DoctorList')}>
                <Text style={styles.breadcrumbLink}>In-Clinic Doctors</Text>
              </TouchableOpacity>
              <Text style={styles.breadcrumbSlash}>/</Text>
              <Text style={styles.breadcrumbCurrent}>Book Consultation</Text>
            </View>
          )}

          {/* CARD CONTAINER (MATCHING EXACT SCREENSHOT GEOMETRY & STYLES) */}
          <View style={[styles.modalCard, isDesktopWeb && { maxWidth: 500 }]}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.confidentialBadgePill}>
                  <Ionicons name="location" size={11} color="#1E3A8A" />
                  <Text style={styles.confidentialBadgePillText}>100% VERIFIED CLINIC CARE</Text>
                </View>
                <Text style={styles.modalTitle}>Book In-Clinic Consultation</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {doctor.name} • {doctor.specialty}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* FORM BODY */}
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* PATIENT FULL NAME */}
              <Text style={styles.inputLabel}>Patient Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Enter patient name"
                placeholderTextColor="#94A3B8"
              />

              {/* MOBILE NUMBER */}
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput
                style={styles.textInput}
                value={patientPhone}
                onChangeText={setPatientPhone}
                keyboardType="phone-pad"
                placeholder="+91 98450 12345"
                placeholderTextColor="#94A3B8"
              />

              {/* PRIMARY HEALTH CONCERN */}
              <Text style={styles.inputLabel}>Primary Health Concern</Text>
              <TextInput
                style={styles.textInput}
                value={healthConcern}
                onChangeText={setHealthConcern}
                placeholder="Stress, Joint Pain & Wellness"
                placeholderTextColor="#94A3B8"
              />

              {/* UPLOAD PDF OR IMAGE OPTION */}
              <Text style={styles.inputLabel}>Medical Records / Prescription (PDF or Image)</Text>
              {!uploadedDocument ? (
                <View style={styles.uploadContainer}>
                  <View style={styles.uploadButtonsRow}>
                    {/* UPLOAD PDF BUTTON */}
                    <TouchableOpacity
                      style={styles.uploadActionBtn}
                      onPress={() => handlePickDocument('pdf')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="document-text" size={18} color="#DC2626" />
                      <Text style={styles.uploadActionBtnText}>Upload PDF</Text>
                    </TouchableOpacity>

                    {/* UPLOAD IMAGE BUTTON */}
                    <TouchableOpacity
                      style={styles.uploadActionBtn}
                      onPress={() => handlePickDocument('image')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="image" size={18} color="#059669" />
                      <Text style={styles.uploadActionBtnText}>Upload Image</Text>
                    </TouchableOpacity>

                    {/* CAMERA OPTION */}
                    <TouchableOpacity
                      style={styles.uploadActionBtn}
                      onPress={() => handlePickDocument('camera')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera" size={18} color="#2563EB" />
                      <Text style={styles.uploadActionBtnText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.uploadHintText}>
                    Attach past prescriptions, lab tests, or scan reports (PDF, JPG, PNG up to 15MB).
                  </Text>
                </View>
              ) : (
                <View style={styles.uploadedFileCard}>
                  <View style={styles.uploadedFileIconWrap}>
                    {uploadedDocument.type === 'pdf' ? (
                      <Ionicons name="document-text" size={26} color="#DC2626" />
                    ) : (
                      <Image source={{ uri: uploadedDocument.uri }} style={styles.uploadedFileThumb} />
                    )}
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={styles.uploadedFileName} numberOfLines={1}>
                      {uploadedDocument.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Text style={styles.uploadedFileSize}>{uploadedDocument.size}</Text>
                      <Text style={styles.uploadedFileDot}>•</Text>
                      <Ionicons name="checkmark-circle" size={12} color="#059669" />
                      <Text style={styles.uploadedFileReady}>Attached for Doctor</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setUploadedDocument(null)}
                    style={styles.removeFileBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

              {/* PREFERRED APPOINTMENT SLOT (EXACT STACKED PILLS MATCHING SCREENSHOT) */}
              <Text style={styles.inputLabel}>Preferred Appointment Slot</Text>
              <View style={styles.slotPickerRow}>
                {['Tomorrow, 10:30 AM', 'Tomorrow, 04:30 PM', 'Day After, 11:00 AM'].map((slot, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.slotChip, selectedTime === slot && styles.slotChipSelected]}
                    onPress={() => setSelectedTime(slot)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.slotChipText, selectedTime === slot && styles.slotChipTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* PAYMENT OPTION PILLS */}
              <Text style={styles.inputLabel}>Payment Option</Text>
              <View style={styles.payOptionsRow}>
                <TouchableOpacity
                  style={[styles.payMethodChip, paymentOption === 'PAY_AT_CLINIC' && styles.payMethodChipActive]}
                  onPress={() => setPaymentOption('PAY_AT_CLINIC')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.payMethodText, paymentOption === 'PAY_AT_CLINIC' && styles.payMethodTextActive]}>
                    Pay at Clinic
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.payMethodChip, paymentOption === 'WALLET' && styles.payMethodChipActive]}
                  onPress={() => setPaymentOption('WALLET')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.payMethodText, paymentOption === 'WALLET' && styles.payMethodTextActive]}>
                    Wallet (₹{walletBalance})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.payMethodChip, paymentOption === 'PAY_ONLINE' && styles.payMethodChipActive]}
                  onPress={() => setPaymentOption('PAY_ONLINE')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.payMethodText, paymentOption === 'PAY_ONLINE' && styles.payMethodTextActive]}>
                    UPI / Online
                  </Text>
                </TouchableOpacity>
              </View>

              {/* PRICING SUMMARY BOX (EXACT SCREENSHOT REPLICA) */}
              <View style={styles.pricingSummaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {paymentOption === 'PAY_AT_CLINIC' ? 'Total Payable at Clinic' : 'Total Payable'}
                  </Text>
                  <Text style={styles.summaryValue}>₹{feeAmount}</Text>
                </View>
                <Text style={styles.summaryNote}>
                  ✓ Zero cancellation fee • Digital prescription included • Instant confirmation
                </Text>
              </View>

              {/* PRIVACY & VERIFIED ASSURANCE BOX */}
              <View style={styles.privacyAssuranceBox}>
                <Ionicons name="shield-checkmark" size={16} color="#1E3A8A" />
                <Text style={styles.privacyAssuranceText}>
                  Certified specialist doctors with authenticated clinic queue token, sanitized OPD rooms, instant digital prescription, and verified clinical care.
                </Text>
              </View>
            </ScrollView>

            {/* MODAL FOOTER & CONFIRM BUTTON */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmBookingBtn, isBooking && styles.confirmBookingBtnDisabled]}
                onPress={handleBooking}
                activeOpacity={0.88}
                disabled={isBooking}
              >
                {isBooking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBookingBtnText}>Confirm Appointment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {isDesktopWeb && (
            <View style={{ width: '100%', marginTop: 40 }}>
              <WebFooter />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? 'rgba(15, 23, 42, 0.65)' : '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollContentDesktop: {
    paddingVertical: 32,
  },
  breadcrumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    marginBottom: 16,
    gap: 6,
  },
  breadcrumbLink: {
    fontSize: 12,
    color: Platform.OS === 'web' ? '#34D399' : '#059669',
    fontWeight: '600',
  },
  breadcrumbSlash: {
    fontSize: 12,
    color: '#94A3B8',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    color: Platform.OS === 'web' ? '#CBD5E1' : '#64748B',
    fontWeight: '500',
  },

  // MODAL CARD
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 8,
  },

  // MODAL HEADER
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  confidentialBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  confidentialBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.3,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '600',
    maxWidth: 320,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    marginLeft: 8,
  },

  // FORM BODY
  modalForm: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },

  // UPLOAD CONTAINER
  uploadContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  uploadActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  uploadHintText: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  // UPLOADED FILE CARD
  uploadedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 10,
  },
  uploadedFileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  uploadedFileThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  uploadedFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  uploadedFileSize: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  uploadedFileDot: {
    fontSize: 10,
    color: '#94A3B8',
  },
  uploadedFileReady: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  removeFileBtn: {
    padding: 6,
  },

  // PREFERRED APPOINTMENT SLOTS
  slotPickerRow: {
    gap: 6,
    marginTop: 4,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  slotChipText: {
    fontSize: 11.5,
    color: '#475569',
  },
  slotChipTextSelected: {
    fontWeight: '800',
    color: '#1E3A8A',
  },

  // PAYMENT OPTIONS
  payOptionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  payMethodChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payMethodChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  payMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  payMethodTextActive: {
    color: '#1E3A8A',
    fontWeight: '800',
  },

  // PRICING SUMMARY BOX
  pricingSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  summaryNote: {
    fontSize: 10,
    color: '#059669',
    marginTop: 6,
  },

  // PRIVACY ASSURANCE BOX
  privacyAssuranceBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  privacyAssuranceText: {
    fontSize: 11,
    color: '#1E3A8A',
    flex: 1,
    lineHeight: 16,
  },

  // MODAL FOOTER & CONFIRM BUTTON
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  confirmBookingBtn: {
    backgroundColor: '#00B894',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBookingBtnDisabled: {
    opacity: 0.65,
  },
  confirmBookingBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ERROR CONTAINER
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
});

export default DoctorBookingScreen;