import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { pushAppointment } from '../../services/dataSyncService';

const DoctorBookingModal = ({
  visible,
  onClose,
  doctor,
  consultationType = 'In-Person', // 'In-Person' | 'Video'
  navigation,
}) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;
  const isVideo = consultationType === 'Video';

  const defaultSlots = isVideo
    ? ['Today, Within 15 Mins (Instant)', 'Today, 04:30 PM', 'Tomorrow, 10:30 AM']
    : ['Tomorrow, 10:30 AM', 'Tomorrow, 04:30 PM', 'Day After, 11:00 AM'];

  const [selectedTime, setSelectedTime] = useState(defaultSlots[0]);
  const [patientName, setPatientName] = useState('Ramesh (Self)');
  const [patientPhone, setPatientPhone] = useState('+91 98450 12345');
  const [healthConcern, setHealthConcern] = useState('Stress, Joint Pain & Wellness');
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [paymentOption, setPaymentOption] = useState(isVideo ? 'WALLET' : 'PAY_AT_CLINIC');
  const [walletBalance, setWalletBalance] = useState(1250);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (visible) {
      loadUserData();
      loadWallet();
      setSelectedTime(defaultSlots[0]);
    }
  }, [visible, doctor, consultationType]);

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
      console.log('Error loading wallet in modal:', e);
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
      console.log('Error loading user data in modal:', e);
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
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
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

      // PDF / File Picker
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

  const feeAmount = doctor?.fee || (isVideo ? 299 : 400);

  const handleConfirm = async () => {
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
      await new Promise((resolve) => setTimeout(resolve, 600));

      const bookingId = isVideo
        ? `VID-${Math.floor(100000 + Math.random() * 900000)}`
        : `DOC-${Math.floor(100000 + Math.random() * 900000)}`;
      const tokenNumber = isVideo
        ? `VID-${Math.floor(100 + Math.random() * 900)}`
        : `TK-${Math.floor(10 + Math.random() * 90)}`;

      // Deduct wallet if used
      if (paymentOption === 'WALLET') {
        if (walletBalance < feeAmount) {
          showAlert('Insufficient Balance', 'Your MediUnify Health Wallet does not have enough balance.');
          setIsBooking(false);
          return;
        }
        const updatedBalance = walletBalance - feeAmount;
        await AsyncStorage.setItem('@unnathi_wallet_balance', updatedBalance.toString());
        setWalletBalance(updatedBalance);
      }

      const newBooking = {
        id: bookingId,
        tokenNumber,
        type: isVideo ? 'Video Consultation' : 'In-Person',
        doctor: {
          id: doctor?.id,
          name: doctor?.name || 'Specialist Doctor',
          specialty: doctor?.specialty || 'General Physician',
          qualification: doctor?.qualification || 'MBBS, MD',
          clinicName: doctor?.clinicName || (isVideo ? 'MediUnify Virtual TeleHealth Room' : 'Clinic OPD'),
          clinicAddress: doctor?.clinicAddress || (isVideo ? 'Live HD Encrypted TeleHealth' : 'Mysore Central'),
          clinicArea: doctor?.clinicArea || 'Mysore',
          phone: doctor?.phone || '+91 821 245 9901',
          fee: feeAmount,
          image: doctor?.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300',
        },
        day: selectedTime.includes('Today') ? 'Today' : 'Tomorrow',
        date: selectedTime,
        time: selectedTime.split(',')[1]?.trim() || selectedTime,
        status: 'Confirmed',
        paidAmount: feeAmount,
        paymentStatus:
          paymentOption === 'PAY_AT_CLINIC'
            ? 'Pay at Clinic Reception'
            : paymentOption === 'WALLET'
            ? 'Paid from Health Wallet'
            : 'Paid Online via UPI',
        videoRoomLink: isVideo ? `https://telehealth.mediunify.org/room/${tokenNumber}` : null,
        patient: {
          name: patientName.trim(),
          phone: patientPhone.trim(),
          concern: healthConcern.trim(),
          reportName: uploadedDocument?.name || null,
          reportUri: uploadedDocument?.uri || null,
        },
        createdAt: new Date().toISOString(),
      };

      // 1. Save into @unnathi_appointments
      const existingJson = await AsyncStorage.getItem('@unnathi_appointments');
      const apptList = existingJson ? JSON.parse(existingJson) : [];
      apptList.unshift(newBooking);
      await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(apptList));

      // 2. If video, save into @videoBookings as well
      if (isVideo) {
        const vidJson = await AsyncStorage.getItem('@videoBookings');
        const vidList = vidJson ? JSON.parse(vidJson) : [];
        vidList.unshift(newBooking);
        await AsyncStorage.setItem('@videoBookings', JSON.stringify(vidList));
      }

      // 3. Sync to background data store
      pushAppointment(newBooking);

      setIsBooking(false);
      onClose();

      showAlert(
        'Booking Confirmed! 🎉',
        `Your ${isVideo ? 'video consultation' : 'in-clinic appointment'} with ${doctor?.name || 'Doctor'} is confirmed for ${selectedTime}. Token: ${tokenNumber}.`,
        [
          {
            text: 'View Bookings',
            onPress: () => navigation?.navigate('Bookings'),
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (e) {
      console.log('Error saving appointment in modal:', e);
      setIsBooking(false);
      showAlert('Booking Error', 'Could not complete appointment. Please try again.');
    }
  };

  if (!doctor) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, isDesktopWeb && { maxWidth: 500 }]}>
          {/* MODAL HEADER */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.confidentialBadgePill}>
                <Ionicons name={isVideo ? 'videocam' : 'shield-checkmark'} size={11} color="#059669" />
                <Text style={styles.confidentialBadgePillText}>
                  {isVideo ? '100% PRIVATE & ENCRYPTED HD VIDEO' : '100% VERIFIED CLINIC CARE'}
                </Text>
              </View>
              <Text style={styles.modalTitle}>
                {isVideo ? 'Book Instant Video Consult' : 'Book In-Clinic Consultation'}
              </Text>
              <Text style={styles.modalSub} numberOfLines={1}>
                {doctor.name} • {doctor.specialty}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} activeOpacity={0.7}>
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
              placeholder="e.g. Fever, Stress, Joint Pain & Wellness"
              placeholderTextColor="#94A3B8"
            />

            {/* UPLOAD PDF OR IMAGE OPTION */}
            <Text style={styles.inputLabel}>Medical Records / Prescription (Optional)</Text>
            {!uploadedDocument ? (
              <View style={styles.uploadContainer}>
                <View style={styles.uploadButtonsRow}>
                  <TouchableOpacity
                    style={styles.uploadActionBtn}
                    onPress={() => handlePickDocument('pdf')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="document-text" size={17} color="#DC2626" />
                    <Text style={styles.uploadActionBtnText}>Upload PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.uploadActionBtn}
                    onPress={() => handlePickDocument('image')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="image" size={17} color="#059669" />
                    <Text style={styles.uploadActionBtnText}>Upload Image</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.uploadActionBtn}
                    onPress={() => handlePickDocument('camera')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={17} color="#2563EB" />
                    <Text style={styles.uploadActionBtnText}>Camera</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.uploadHintText}>
                  Attach past prescriptions, lab tests, or scan reports for doctor review.
                </Text>
              </View>
            ) : (
              <View style={styles.uploadedFileCard}>
                <View style={styles.uploadedFileIconWrap}>
                  {uploadedDocument.type === 'pdf' ? (
                    <Ionicons name="document-text" size={24} color="#DC2626" />
                  ) : (
                    <Image source={{ uri: uploadedDocument.uri }} style={styles.uploadedFileThumb} />
                  )}
                </View>
                <View style={{ flex: 1, marginHorizontal: 8 }}>
                  <Text style={styles.uploadedFileName} numberOfLines={1}>
                    {uploadedDocument.name}
                  </Text>
                  <Text style={styles.uploadedFileSize}>{uploadedDocument.size} • Attached</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setUploadedDocument(null)}
                  style={styles.removeFileBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={17} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}

            {/* PREFERRED APPOINTMENT SLOT */}
            <Text style={styles.inputLabel}>Preferred Appointment Slot</Text>
            <View style={styles.slotPickerRow}>
              {defaultSlots.map((slot, i) => (
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

            {/* PAYMENT OPTION */}
            <Text style={styles.inputLabel}>Payment Option</Text>
            <View style={styles.payOptionsRow}>
              {!isVideo && (
                <TouchableOpacity
                  style={[styles.payMethodChip, paymentOption === 'PAY_AT_CLINIC' && styles.payMethodChipActive]}
                  onPress={() => setPaymentOption('PAY_AT_CLINIC')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.payMethodText, paymentOption === 'PAY_AT_CLINIC' && styles.payMethodTextActive]}>
                    Pay at Clinic
                  </Text>
                </TouchableOpacity>
              )}

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

            {/* PRICING SUMMARY BOX */}
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

            {/* PRIVACY ASSURANCE BOX */}
            <View style={styles.privacyAssuranceBox}>
              <Ionicons name="shield-checkmark" size={16} color="#059669" />
              <Text style={styles.privacyAssuranceText}>
                {isVideo
                  ? '100% private encrypted HD video consultation with verified doctor. Includes free 3-day digital prescription follow-up.'
                  : 'Verified specialist doctors with authentic clinical care, sanitized OPD rooms, and verified digital prescription.'}
              </Text>
            </View>
          </ScrollView>

          {/* MODAL FOOTER */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.confirmBookingBtn, isBooking && styles.confirmBookingBtnDisabled]}
              onPress={handleConfirm}
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  confidentialBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  confidentialBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 6,
  },
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
  uploadContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 10,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  uploadActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  uploadHintText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  uploadedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 8,
  },
  uploadedFileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedFileThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  uploadedFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  uploadedFileSize: {
    fontSize: 10,
    color: '#059669',
    marginTop: 1,
  },
  removeFileBtn: {
    padding: 4,
  },
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
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  slotChipText: {
    fontSize: 11.5,
    color: '#475569',
  },
  slotChipTextSelected: {
    fontWeight: '800',
    color: '#065F46',
  },
  payOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  payMethodChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payMethodChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  payMethodText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  payMethodTextActive: {
    color: '#065F46',
    fontWeight: '800',
  },
  pricingSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
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
  privacyAssuranceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  privacyAssuranceText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
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
});

export default DoctorBookingModal;
