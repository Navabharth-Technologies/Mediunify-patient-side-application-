import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  Linking,
  Platform,
  Image,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { showAlert } from '../../../utils/alert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import labTests from '../../../data/labTests';
import { syncActiveUser } from '../../../services/dataSyncService';
import WebFooter from '../../../components/web/WebFooter';

const DEFAULT_SAMPLE_APPOINTMENTS = [
  {
    id: 'appt-demo-video-1',
    tokenNumber: 'VID-104',
    type: 'Video Consultation',
    doctor: {
      name: 'Dr. Anita Sharma',
      specialty: 'General Physician & Diabetologist',
      qualification: 'MBBS, MD - General Medicine',
      experienceYears: '14',
      clinicName: 'MediUnify Virtual TeleHealth Room',
      clinicAddress: 'Online Video Consultation (Live HD Encrypted)',
      clinicArea: 'Virtual Care Hub',
      phone: '+91 821 245 9903',
      fee: 450,
      image: 'https://images.unsplash.com/photo-1594824813576-92f70b79873a?auto=format&fit=crop&q=80&w=300',
    },
    day: 'Today',
    date: 'Today, Live Slot',
    time: '04:30 PM (Live Room Ready)',
    status: 'Confirmed',
    paidAmount: 450,
    paymentStatus: 'Paid Online via UPI',
    videoRoomLink: 'https://telehealth.unnathi.org/room/VID-104',
    patient: {
      name: 'Ramesh (Self)',
      age: '28',
      gender: 'Male',
      reason: 'Regular Health Follow-up & Medication Advice',
    },
  },
  {
    id: 'appt-demo-1',
    tokenNumber: 'TK-24',
    type: 'In-Person',
    doctor: {
      name: 'Dr. Ananya Rao',
      specialty: 'General Physician',
      qualification: 'MBBS, MD - General Medicine',
      experienceYears: '12',
      clinicName: 'Unnathi Multispeciality Clinic',
      clinicAddress: 'No. 24, 5th Cross, Near Vishwamanava Double Road, Kuvempunagar, Mysore - 570023',
      clinicArea: 'Kuvempunagar, Mysore',
      phone: '+91 821 245 9901',
      latitude: 12.2858,
      longitude: 76.6341,
      distance: '0.8 km away',
      fee: 500,
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    },
    day: 'Today',
    date: 'Today, 04:30 PM',
    time: '04:30 PM',
    status: 'Confirmed',
    paidAmount: 500,
    paymentStatus: 'Pay at Clinic Reception',
    patient: {
      name: 'Ramesh (Self)',
      age: '28',
      gender: 'Male',
      reason: 'Regular Health Checkup & Fever Consultation',
    },
  },
  {
    id: 'appt-demo-3',
    tokenNumber: 'LAB-48',
    type: 'Lab Test',
    collectionMode: 'Home Sample Collection',
    tests: [
      { name: 'Complete Blood Count (CBC)' },
      { name: 'HbA1c Glycated Hemoglobin' },
      { name: 'Lipid Profile Comprehensive' },
    ],
    doctor: {
      name: 'Unnathi Pathology & Diagnostics Hub',
      specialty: 'Pathology • CBC, HbA1c & Lipid Screen',
      qualification: 'NABL & ICMR Certified Diagnostics',
      clinicName: 'Unnathi Pathology Lab',
      clinicAddress: 'Doorstep Sample Collection (Kuvempunagar, Mysore)',
      clinicArea: 'Kuvempunagar, Mysore',
      phone: '+91 821 245 9902',
      latitude: 12.2858,
      longitude: 76.6341,
      fee: 699,
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=300',
    },
    day: 'Tomorrow',
    date: 'Tomorrow, 07:30 AM',
    time: '07:30 AM - 08:30 AM',
    status: 'Confirmed',
    paidAmount: 699,
    paymentStatus: 'Paid Online via UPI',
    patient: {
      name: 'Ramesh (Self)',
      age: '28',
      gender: 'Male',
      reason: 'Fasting Blood Sample Collection for Preventive Health',
    },
  },
  {
    id: 'appt-demo-2',
    tokenNumber: 'RAD-109',
    type: 'Radiology',
    bookingType: 'Radiology',
    tests: [
      {
        name: '3T Brain MRI with Contrast',
        categoryLabel: 'MRI Scan',
        duration: '25-30 Mins',
        price: 3499,
        instructions: 'Wear comfortable clothing, remove metallic items & jewelry before scan.',
      },
    ],
    doctor: {
      name: 'Unnathi Diagnostic & Imaging Center',
      specialty: 'Radiology • 3T Brain MRI with Contrast',
      qualification: 'NABL & NABH Accredited Center',
      clinicName: 'Unnathi Diagnostic Center',
      clinicAddress: 'No. 112, Kalidasa Road, Jayalakshmipuram, Mysore - 570012',
      clinicArea: 'Jayalakshmipuram, Mysore',
      phone: '+91 821 251 4400',
      latitude: 12.3168,
      longitude: 76.6321,
      distance: '1.4 km away',
      fee: 3499,
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=300',
    },
    day: 'Tomorrow',
    date: 'Tomorrow, 10:00 AM',
    time: '10:00 AM',
    status: 'Confirmed',
    paidAmount: 3499,
    paymentStatus: 'Paid Online via UPI',
    patient: {
      name: 'Ramesh (Self)',
      age: '28',
      gender: 'Male',
      reason: 'Doctor Prescribed Brain Imaging Scan',
    },
  },
  {
    id: 'appt-demo-equipment-1',
    tokenNumber: 'EQ-804',
    type: 'Medical Equipment Rental',
    serviceType: 'equipment',
    doctor: {
      name: 'Philips EverFlo 5L Oxygen Concentrator',
      specialty: '1 Month Home Rental • Technician Installed',
      qualification: 'Medical Grade ISO/CE Certified',
      clinicName: 'MediUnify BioMedical Equipment Hub',
      clinicAddress: 'Doorstep Delivery & BioMedical Demo, Kuvempunagar, Mysore',
      clinicArea: 'Kuvempunagar, Mysore',
      phone: '+91 821 245 9908',
      fee: 4999,
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=300',
    },
    equipment: {
      name: 'Philips EverFlo 5L Oxygen Concentrator',
      category: 'Respiratory Care',
      rentalDuration: '1 Month',
      rentAmount: 4999,
      securityDeposit: 3000,
    },
    day: 'Today',
    date: 'Today, Express Slot',
    time: 'Technician Delivery & Setup in 4 Hrs',
    status: 'Confirmed',
    paidAmount: 7999,
    paymentStatus: 'Paid Online via UPI',
    patient: {
      name: 'Ramesh (Self)',
      age: '28',
      gender: 'Male',
      reason: 'Home Respiratory Oxygen Support',
    },
  },
  {
    id: 'appt-demo-ayurveda-1',
    tokenNumber: 'AYU-312',
    type: 'Ayurvedic Consultation',
    serviceType: 'ayurveda',
    doctor: {
      name: 'Dr. Vaidya Madhavan Nambiar',
      specialty: 'BAMS, MD (Ayurveda) • Chronic Disorders & Nadi Pariksha',
      qualification: 'Senior Ayurvedic Physician (22 yrs exp)',
      clinicName: 'Sanjeevani Ayurvedic Wellness Centre',
      clinicAddress: 'No. 45, 3rd Main, Saraswathipuram, Mysore - 570009',
      clinicArea: 'Saraswathipuram, Mysore',
      phone: '+91 821 254 1102',
      fee: 400,
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    },
    day: 'Tomorrow',
    date: 'Tomorrow, 10:30 AM',
    time: '10:30 AM (In-Clinic)',
    status: 'Confirmed',
    paidAmount: 400,
    paymentStatus: 'Paid Online via UPI',
    patient: {
      name: 'Ramesh (Self)',
      age: '28',
      gender: 'Male',
      reason: 'Ayurvedic Wellness & Stress Management',
    },
  },
  {
    id: 'appt-demo-fertility-1',
    tokenNumber: 'FERT-520',
    type: 'Fertility Specialist Consult',
    serviceType: 'fertility',
    doctor: {
      name: 'Dr. Priya V. Shenoy',
      specialty: 'MS, DNB, Fellowship in Reproductive Medicine',
      qualification: 'Senior Fertility & IVF Specialist (16 yrs exp)',
      clinicName: 'Nova IVF & Fertility Care Centre',
      clinicAddress: 'No. 88, 5th Main, Gokulam 3rd Stage, Mysore - 570002',
      clinicArea: 'Gokulam, Mysore',
      phone: '+91 821 241 8890',
      fee: 600,
      image: 'https://images.unsplash.com/photo-1594824813576-92f70b79873a?auto=format&fit=crop&q=80&w=300',
    },
    day: 'Thursday',
    date: 'Thursday, 11:00 AM',
    time: '11:00 AM (Confidential Slot)',
    status: 'Confirmed',
    paidAmount: 600,
    paymentStatus: 'Paid Online via UPI',
    patient: {
      name: 'Ramesh & Partner',
      age: '28',
      gender: 'Couple',
      reason: 'Confidential Pre-Conception & Fertility Guidance',
      confidential: true,
    },
  },
];

const BookingsScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  const [appointments, setAppointments] = useState(DEFAULT_SAMPLE_APPOINTMENTS);
  const [selectedTab, setSelectedTab] = useState('All');
  const [activeBookingForAddTest, setActiveBookingForAddTest] = useState(null);
  const [testSearchQuery, setTestSearchQuery] = useState('');

  // Document Upload State
  const [activeAppointmentForUpload, setActiveAppointmentForUpload] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState(null);

  // Live Order Tracking States (Pharmacy Delivery & Lab Sample Collection)
  const [selectedTrackingSample, setSelectedTrackingSample] = useState(null);
  const [selectedTrackingPharmacy, setSelectedTrackingPharmacy] = useState(null);

  // Normalize an appointment item so lab tests, radiology, video calls, doctor visits, and pharmacy orders are all correctly structured
  const normalizeAppointment = (item) => {
    if (!item) return null;

    const isPharmacy =
      item.type === 'Pharmacy Order' ||
      item.isPharmacyOrder ||
      (Array.isArray(item.items) && item.items.length > 0) ||
      (typeof item.id === 'string' && item.id.startsWith('UNC'));

    if (isPharmacy) {
      const itemCount = Array.isArray(item.items) ? item.items.length : 1;
      const itemsList = Array.isArray(item.items) ? item.items : [];
      const itemsSummary = itemsList.length > 0
        ? itemsList.map((i) => `${i.name} (x${i.quantity || 1})`).join(', ')
        : 'Prescription Medicines & Health Supplies';

      const addressText =
        typeof item.address === 'object' && item.address !== null
          ? `${item.address.addressLine || ''}, ${item.address.city || 'Mysore'}${item.address.pincode ? ` - ${item.address.pincode}` : ''}`
          : (typeof item.address === 'string' && item.address ? item.address : 'Doorstep Delivery, Kuvempunagar, Mysore');

      return {
        ...item,
        id: item.id || `UNC-${Date.now()}`,
        tokenNumber: item.id || `ORD-${Date.now().toString().slice(-4)}`,
        type: 'Pharmacy Order',
        isPharmacyOrder: true,
        tests: itemsList.map((i) => ({ name: `${i.name} (x${i.quantity || 1})` })),
        doctor: {
          name: 'Unnathi Certified Pharmacy Store',
          specialty: `Medicine Delivery • ${itemCount} Item${itemCount > 1 ? 's' : ''}`,
          qualification: '100% Genuine Certified Medicines',
          clinicName: 'Unnathi Express Pharmacy Hub',
          clinicAddress: addressText,
          clinicArea: 'Kuvempunagar, Mysore',
          phone: '+91 821 245 9905',
          fee: item.total || item.subtotal || 350,
          image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=300',
        },
        day: item.date?.split(',')[0] || 'Today',
        date: item.date || 'Today, Express Slot',
        time: item.deliverySlot || 'Express Delivery (30-45 mins)',
        status: item.status || 'Confirmed',
        paidAmount: item.total || item.subtotal || 350,
        paymentStatus: item.paymentStatus || (item.paymentMethod?.includes('COD') ? 'Pay on Delivery (Cash/UPI)' : 'Paid Online via UPI'),
        patient: {
          name: (item.address && typeof item.address === 'object' && item.address.name) ? item.address.name : 'Patient (Self)',
          age: '28',
          gender: 'Delivery',
          phone: (item.address && typeof item.address === 'object' && item.address.phone) || '',
        },
        itemsSummary,
        deliverySlot: item.deliverySlot || 'Express Delivery (30-45 mins)',
        rider: {
          name: 'Santosh M.',
          phone: '+91 98765 43210',
          temperature: '98.4°F (Verified Safe)',
          badge: 'Vaccinated • Mask & Sanitizer Verified',
        },
        details: item,
      };
    }

    const isRad =
      item.type === 'Radiology' ||
      item.bookingType === 'Radiology' ||
      item.type === 'Radiology Scan' ||
      item.serviceType === 'radiology' ||
      item.details?.bookingType === 'Radiology' ||
      item.details?.type === 'Radiology';

    const isVideo =
      !isRad &&
      (item.type === 'Video Consultation' ||
      item.type === 'Video' ||
      item.type === 'TeleConsultation' ||
      item.serviceType === 'video' ||
      (typeof item.type === 'string' && item.type.toLowerCase().includes('video')));

    const isLab =
      !isRad &&
      !isVideo &&
      (item.type === 'Lab Test' ||
      item.type === 'Diagnostic Lab Test' ||
      item.type === 'Lab' ||
      item.serviceType === 'lab' ||
      (Array.isArray(item.tests) && item.tests.length > 0));

    const isNurse =
      !isRad &&
      !isVideo &&
      !isLab &&
      (item.type === 'Home Nurse Care' ||
      item.type === 'Nurse' ||
      item.serviceType === 'nurse' ||
      item.assignedNurse !== undefined ||
      (typeof item.serviceName === 'string' && item.serviceName.includes('Staff')));

    if (isVideo) {
      const docName = item.doctor?.name || item.doctorName || 'Dr. Specialist';
      const docSpec = item.doctor?.specialty || item.specialty || 'General Physician & TeleHealth';
      return {
        ...item,
        type: 'Video Consultation',
        tokenNumber: item.tokenNumber || 'VID-102',
        doctor: {
          name: docName,
          specialty: docSpec,
          qualification: item.doctor?.qualification || 'MBBS, MD',
          clinicName: item.doctor?.clinicName || item.hospital || 'MediUnify Virtual TeleHealth Room',
          clinicAddress: item.doctor?.clinicAddress || 'Online Video Consultation Room (HD Encrypted)',
          clinicArea: item.doctor?.clinicArea || 'Virtual Care Hub',
          phone: item.doctor?.phone || '+91 821 245 9901',
          fee: item.paidAmount || item.fee || item.doctor?.fee || 450,
          image:
            item.doctor?.image ||
            'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
        },
        day: item.day || 'Today',
        date: item.date || 'Today, Scheduled',
        time: item.time || 'Live Video Slot',
        status: item.status || 'Confirmed',
        paidAmount: item.paidAmount || item.fee || item.doctor?.fee || 450,
        paymentStatus: item.paymentStatus || 'Paid Online via UPI',
        videoRoomLink: item.videoRoomLink || `https://telehealth.unnathi.org/room/${item.id}`,
        patient: item.patient || { name: item.patientName || 'Patient (Self)', age: '28', gender: 'Male' },
        details: item.details || item,
      };
    }

    if (isRad) {
      const testsList =
        Array.isArray(item.tests) && item.tests.length > 0
          ? item.tests
          : Array.isArray(item.details?.tests) && item.details.tests.length > 0
          ? item.details.tests
          : [];
      const testNames = testsList.map((t) => t.categoryLabel || t.name || t.testName).filter(Boolean);
      const centerName =
        item.lab?.name ||
        item.doctor?.name ||
        item.labName ||
        item.details?.lab?.name ||
        'Unnathi Diagnostic & Imaging Center';
      const clinicAddress =
        item.lab?.address ||
        item.doctor?.clinicAddress ||
        item.details?.lab?.address ||
        'No. 112, Kalidasa Road, Jayalakshmipuram, Mysore - 570012';
      const clinicArea =
        item.lab?.area ||
        item.doctor?.clinicArea ||
        item.details?.lab?.area ||
        'Jayalakshmipuram, Mysore';
      const clinicPhone =
        item.lab?.phone ||
        item.doctor?.phone ||
        item.details?.lab?.phone ||
        '+91 821 251 4400';

      return {
        ...item,
        type: 'Radiology',
        bookingType: 'Radiology',
        tokenNumber: item.tokenNumber || item.details?.tokenNumber || 'RAD-109',
        tests: testsList,
        doctor: {
          name: centerName,
          specialty:
            testNames.length > 0
              ? `Radiology • ${testNames.join(', ')}`
              : item.doctor?.specialty || item.specialty || '3T Scan & Imaging Center',
          qualification: 'NABL & NABH Accredited Center',
          clinicName: centerName,
          clinicAddress: clinicAddress,
          clinicArea: clinicArea,
          phone: clinicPhone,
          latitude: 12.2958,
          longitude: 76.6394,
          fee: item.payment?.paidAmount || item.paidAmount || item.fee || item.details?.payment?.paidAmount || item.doctor?.fee || 1999,
          image:
            item.doctor?.image ||
            'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=300',
        },
        day: item.day || item.appointmentDate?.split(',')[0] || item.details?.appointmentDate?.split(',')[0] || 'Tomorrow',
        date: item.date || item.appointmentDate || item.details?.appointmentDate || 'Tomorrow, 10:00 AM',
        time: item.time || item.appointmentSlot || item.details?.appointmentSlot || '10:00 AM',
        status: item.status || 'Confirmed',
        paidAmount: item.payment?.paidAmount || item.paidAmount || item.fee || item.details?.payment?.paidAmount || 1999,
        paymentStatus:
          item.paymentStatus ||
          item.payment?.paymentStatus ||
          (item.payment?.method ? `Paid via ${item.payment.method}` : 'Paid Online via UPI'),
        patient: item.patient || item.patientDetails || item.details?.patient || { name: item.patientName || 'Ramesh (Self)', age: '28', gender: 'Male' },
        details: item.details || item,
      };
    }

    if (isLab) {
      const testsList = Array.isArray(item.tests) ? item.tests : (Array.isArray(item.details?.tests) ? item.details.tests : []);
      const testNames = testsList.map((t) => (typeof t === 'string' ? t : t.name)).filter(Boolean);
      const centerName =
        item.labCenter?.name ||
        item.doctor?.name ||
        item.labName ||
        'MediUnify Pathology & Diagnostics Hub';
      const clinicAddress =
        item.address ||
        item.labCenter?.address ||
        item.doctor?.clinicAddress ||
        (item.collectionMode?.includes('Home') ? 'Doorstep Home Sample Collection, Mysore' : 'Kuvempunagar, Mysore');

      return {
        ...item,
        type: 'Diagnostic Lab Test',
        tokenNumber: item.tokenNumber || 'LAB-88',
        collectionMode:
          item.collectionMode ||
          (item.address ? 'Home Sample Collection' : 'Visit Diagnostic Center'),
        tests: testsList,
        doctor: {
          name: centerName,
          specialty:
            testNames.length > 0
              ? `Lab Tests • ${testNames.join(', ')}`
              : item.doctor?.specialty || item.specialty || 'Diagnostic Profile Screening',
          qualification: 'NABL & ICMR Certified Diagnostics',
          clinicName: item.labCenter?.name || item.labName || item.doctor?.clinicName || 'MediUnify Pathology Hub',
          clinicAddress: clinicAddress,
          clinicArea: item.labCenter?.area || item.doctor?.clinicArea || 'Mysore',
          phone: item.labCenter?.phone || item.doctor?.phone || '+91 821 245 9901',
          latitude: 12.2858,
          longitude: 76.6341,
          fee: item.totalAmount || item.paidAmount || item.fee || item.doctor?.fee || 499,
          image:
            item.doctor?.image ||
            'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=300',
        },
        day: item.day || 'Scheduled',
        date: item.date || 'Scheduled Date',
        time: item.slot || item.time || 'Morning Slot',
        status: item.status || 'Confirmed',
        paidAmount: item.totalAmount || item.paidAmount || item.fee || 499,
        paymentStatus: item.paymentStatus || 'Paid Online',
        patient: item.patient || { name: item.patientName || 'Patient (Self)', age: '28', gender: 'Male' },
        details: item.details || item,
      };
    }

    if (isNurse) {
      const nurseName = item.assignedNurse?.name || item.nurseName || 'Certified Staff Nurse';
      return {
        ...item,
        type: 'Home Nurse Care',
        tokenNumber: item.tokenNumber || item.id || 'NURSE-01',
        doctor: {
          name: nurseName,
          specialty: item.serviceName || item.plan || 'General Post-Op & Vitals Care',
          qualification: item.assignedNurse?.qualification || 'B.Sc Nursing, Certified',
          clinicName: 'Unnathi Home Care & Nursing',
          clinicAddress: item.patient?.address || item.address || 'Doorstep Home Care, Mysore',
          clinicArea: 'Kuvempunagar, Mysore',
          phone: item.doctor?.phone || '+91 821 245 9905',
          fee: item.payment?.amount || item.paidAmount || item.fee || 1200,
          image: 'https://images.unsplash.com/photo-1594824813576-92f70b79873a?auto=format&fit=crop&q=80&w=300',
        },
        day: item.day || item.schedule?.startDate || item.startDate || 'Scheduled',
        date: item.date || item.schedule?.startDate || item.startDate || 'Today',
        time: item.time || item.schedule?.time || item.timeSlot || 'Day Duty (09:00 AM - 05:00 PM)',
        status: item.status || 'Confirmed',
        paidAmount: item.payment?.amount || item.paidAmount || item.fee || 1200,
        paymentStatus: item.payment?.method || item.paymentStatus || 'Paid Online',
        patient: item.patient || { name: item.patientName || 'Patient (Self)', age: '28', gender: 'Home Care' },
        details: item.details || item,
      };
    }

    const isAyurveda =
      item.type?.includes('Ayurved') ||
      item.type?.includes('Panchakarma') ||
      item.serviceType === 'ayurveda';

    const isFertility =
      item.type?.includes('Fertility') ||
      item.type?.includes('IVF') ||
      item.serviceType === 'fertility';

    const isEquipment =
      item.type?.includes('Equipment') ||
      item.serviceType === 'equipment';

    if (isAyurveda || isFertility || isEquipment) {
      const defaultDocName = isAyurveda
        ? (item.doctor?.name || 'Dr. Vaidya Madhavan Nambiar')
        : isFertility
        ? (item.doctor?.name || 'Dr. Priya V. Shenoy')
        : (item.doctor?.name || item.equipment?.name || 'Medical Equipment Hub');

      const defaultSpec = isAyurveda
        ? (item.doctor?.specialty || item.type || 'Ayurvedic Physician & Wellness')
        : isFertility
        ? (item.doctor?.specialty || item.type || 'Reproductive Medicine & Fertility')
        : (item.doctor?.specialty || (item.equipment?.category ? `${item.equipment.category} Rental` : 'BioMedical Equipment Rental'));

      const defaultClinic = isAyurveda
        ? (item.doctor?.clinicName || 'Sanjeevani Ayurvedic Wellness Centre')
        : isFertility
        ? (item.doctor?.clinicName || 'Nova IVF & Fertility Care Centre')
        : (item.doctor?.clinicName || 'MediUnify BioMedical Equipment Hub');

      const defaultAddress = isAyurveda
        ? (item.doctor?.clinicAddress || 'No. 45, Saraswathipuram, Mysore')
        : isFertility
        ? (item.doctor?.clinicAddress || 'No. 88, Gokulam 3rd Stage, Mysore')
        : (item.patient?.address || item.doctor?.clinicAddress || 'Doorstep Delivery & Installation, Mysore');

      const defaultFee = item.paidAmount || item.fee || item.doctor?.fee || (isAyurveda ? 400 : isFertility ? 600 : 4999);

      return {
        ...item,
        type: item.type || (isAyurveda ? 'Ayurvedic Consultation' : isFertility ? 'Fertility Specialist Consult' : 'Medical Equipment Rental'),
        tokenNumber: item.tokenNumber || item.id,
        doctor: {
          name: defaultDocName,
          specialty: defaultSpec,
          clinicName: defaultClinic,
          clinicAddress: defaultAddress,
          clinicArea: isAyurveda ? 'Saraswathipuram, Mysore' : isFertility ? 'Gokulam, Mysore' : 'Mysore',
          phone: item.doctor?.phone || '+91 821 245 9901',
          fee: defaultFee,
          image:
            item.doctor?.image ||
            (isAyurveda
              ? 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400'
              : isFertility
              ? 'https://images.unsplash.com/photo-1594824813576-92f70b79873a?w=400'
              : 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400'),
        },
        day: item.day || 'Scheduled',
        date: item.date || 'Scheduled Date',
        time: item.time || (isEquipment ? 'Technician Delivery & Setup in 4 Hrs' : 'Confirmed Slot'),
        status: item.status || 'Confirmed',
        paidAmount: defaultFee,
        paymentStatus: item.paymentStatus || 'Paid Online via UPI',
        patient: item.patient || { name: item.patientName || 'Patient (Self)', age: '28', gender: 'Self' },
        details: item.details || item,
      };
    }

    // Default Doctor appointment
    return {
      ...item,
      type: item.type || 'Doctor Consultation',
      doctor: {
        name: item.doctor?.name || item.doctorName || 'Dr. Medical Specialist',
        specialty: item.doctor?.specialty || item.specialty || 'General Medicine',
        qualification: item.doctor?.qualification || 'MBBS, MD',
        clinicName: item.doctor?.clinicName || item.hospital || 'Unnathi Multispeciality Clinic',
        clinicAddress: item.doctor?.clinicAddress || item.hospital || 'Kuvempunagar, Mysore',
        clinicArea: item.doctor?.clinicArea || 'Mysore',
        phone: item.doctor?.phone || '+91 821 245 9901',
        fee: item.paidAmount || item.fee || item.doctor?.fee || 500,
        image:
          item.doctor?.image ||
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      },
      day: item.day || 'Today',
      date: item.date || 'Today, 04:30 PM',
      time: item.time || '04:30 PM',
      status: item.status || 'Confirmed',
      paidAmount: item.paidAmount || item.fee || 500,
      paymentStatus: item.paymentStatus || 'Pay at Clinic',
      patient: item.patient || { name: item.patientName || 'Self', age: '28', gender: 'Male' },
      details: item.details || item,
    };
  };

  const loadAppointments = async () => {
    try {
      // 0. Pull fresh sync from Central Server (live Web <-> Mobile shared data)
      try {
        await syncActiveUser();
      } catch (syncErr) {}

      // 1. Load doctor & direct bookings
      const apptJson = await AsyncStorage.getItem('@unnathi_appointments');
      const storedAppts = apptJson ? JSON.parse(apptJson) : [];

      // 2. Load video bookings
      const vidJson = await AsyncStorage.getItem('@videoBookings');
      const storedVideo = vidJson ? JSON.parse(vidJson) : [];

      // 3. Load lab bookings
      const labJson = await AsyncStorage.getItem('@labBookings');
      const storedLabs = labJson ? JSON.parse(labJson) : [];

      // 4. Load radiology bookings
      const radJson = await AsyncStorage.getItem('@radiologyBookings');
      const storedRad = radJson ? JSON.parse(radJson) : [];

      // 5. Load nurse bookings
      const nurseJson = await AsyncStorage.getItem('@unnathi_nurse_bookings');
      const storedNurse = nurseJson ? JSON.parse(nurseJson) : [];

      // 6. Load pharmacy orders (from both storage keys)
      const pharmJson = await AsyncStorage.getItem('@unnathi_pharmacy_orders');
      const genOrdersJson = await AsyncStorage.getItem('@orders');
      const storedPharm = pharmJson ? JSON.parse(pharmJson) : [];
      const storedGen = genOrdersJson ? JSON.parse(genOrdersJson) : [];
      const pharmOrders = [];
      const seenPharmIds = new Set();
      [...storedPharm, ...storedGen].forEach((ord) => {
        if (ord && ord.id && !seenPharmIds.has(ord.id)) {
          seenPharmIds.add(ord.id);
          const norm = normalizeAppointment(ord);
          if (norm) pharmOrders.push(norm);
        }
      });

      // 7. Load Ayurveda, Fertility, and Equipment bookings
      const ayuJson = await AsyncStorage.getItem('@unnathi_ayurveda_bookings');
      const storedAyu = ayuJson ? JSON.parse(ayuJson) : [];

      const fertJson = await AsyncStorage.getItem('@unnathi_fertility_bookings');
      const storedFert = fertJson ? JSON.parse(fertJson) : [];

      const equipJson = await AsyncStorage.getItem('@unnathi_equipment_orders');
      const storedEquip = equipJson ? JSON.parse(equipJson) : [];

      // Combine with newest first
      const rawAll = [];
      // If a new booking was passed in route params, ensure it is at the very front
      if (route?.params?.newAppointment) {
        rawAll.push(route.params.newAppointment);
      }
      rawAll.push(
        ...storedAppts,
        ...storedVideo,
        ...storedLabs,
        ...storedRad,
        ...storedNurse,
        ...storedAyu,
        ...storedFert,
        ...storedEquip,
        ...pharmOrders
      );

      if (rawAll.length === 0) {
        rawAll.push(...DEFAULT_SAMPLE_APPOINTMENTS);
      }

      const uniqueMap = new Map();
      rawAll.forEach((item) => {
        if (item && item.id && !uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, normalizeAppointment(item));
        }
      });

      setAppointments(Array.from(uniqueMap.values()).filter(Boolean));
    } catch (e) {
      console.log('Error loading appointments:', e);
    }
  };

  // Initial load
  useEffect(() => {
    loadAppointments();
  }, []);

  // Reload when route params change (e.g. newly booked appointment, tab switch, timestamp)
  useEffect(() => {
    loadAppointments();
    if (route?.params?.initialTab) {
      setSelectedTab(route.params.initialTab);
    }
  }, [route?.params]);

  // Reload when screen gains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAppointments();
    });
    return unsubscribe;
  }, [navigation]);

  // Tab Filtering
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      if (!item) return false;

      const isVideo =
        item.type === 'Video Consultation' ||
        item.type === 'Video' ||
        item.type === 'TeleConsultation' ||
        item.serviceType === 'video' ||
        (typeof item.type === 'string' && item.type.toLowerCase().includes('video'));
      const isLab =
        item.type === 'Lab Test' ||
        item.type === 'Diagnostic Lab Test' ||
        item.type === 'Lab' ||
        item.serviceType === 'lab';
      const isRad = item.type === 'Radiology' || item.serviceType === 'radiology';
      const isNurse =
        item.type === 'Home Nurse Care' ||
        item.type === 'Nurse' ||
        item.serviceType === 'nurse' ||
        item.assignedNurse !== undefined ||
        (typeof item.serviceName === 'string' && item.serviceName.includes('Staff'));
      const isPharmacy = item.type === 'Pharmacy Order' || item.isPharmacyOrder;
      const isEquipment =
        item.type?.includes('Equipment') ||
        item.serviceType === 'equipment';
      const isAyurveda =
        item.type?.includes('Ayurved') ||
        item.type?.includes('Panchakarma') ||
        item.serviceType === 'ayurveda';
      const isFertility =
        item.type?.includes('Fertility') ||
        item.type?.includes('IVF') ||
        item.serviceType === 'fertility';
      const isDoc = !isLab && !isRad && !isVideo && !isPharmacy && !isNurse && !isEquipment && !isAyurveda && !isFertility;
      const isSample = isLab && (item.collectionMode?.includes('Home') || item.visitType?.includes('Home'));

      if (selectedTab === 'Equipment Rental') {
        return isEquipment;
      }
      if (selectedTab === 'Ayurveda & Wellness') {
        return isAyurveda;
      }
      if (selectedTab === 'Fertility & IVF') {
        return isFertility;
      }
      if (selectedTab === 'Pharmacy Orders') {
        return isPharmacy;
      }
      if (selectedTab === 'Sample Tracking') {
        return isSample;
      }
      if (selectedTab === 'Video Consults') {
        return isVideo;
      }
      if (selectedTab === 'Doctor Visits') {
        return isDoc;
      }
      if (selectedTab === 'Lab Tests') {
        return isLab;
      }
      if (selectedTab === 'Radiology Scans') {
        return isRad;
      }
      if (selectedTab === 'Home Care') {
        return isNurse;
      }
      if (selectedTab === 'Confirmed') {
        return (
          item.status === 'Confirmed' ||
          item.status === 'Rescheduled' ||
          item.status === 'Out for Delivery' ||
          item.status === 'Scheduled'
        );
      }
      if (selectedTab === 'Cancelled') {
        return item.status === 'Cancelled';
      }
      return true; // 'All'
    });
  }, [appointments, selectedTab]);

  // Appointment Counters
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      videoCalls: appointments.filter(
        (a) =>
          a.type === 'Video Consultation' ||
          a.type === 'Video' ||
          a.type === 'TeleConsultation' ||
          a.serviceType === 'video' ||
          (typeof a.type === 'string' && a.type.toLowerCase().includes('video'))
      ).length,
      doctors: appointments.filter(
        (a) =>
          a.type !== 'Radiology' &&
          a.serviceType !== 'radiology' &&
          a.type !== 'Lab Test' &&
          a.type !== 'Diagnostic Lab Test' &&
          a.type !== 'Lab' &&
          a.serviceType !== 'lab' &&
          a.type !== 'Pharmacy Order' &&
          !a.isPharmacyOrder &&
          a.type !== 'Video Consultation' &&
          a.type !== 'Video' &&
          a.type !== 'TeleConsultation' &&
          a.serviceType !== 'video' &&
          a.type !== 'Home Nurse Care' &&
          a.type !== 'Nurse' &&
          a.serviceType !== 'nurse' &&
          a.assignedNurse === undefined &&
          !a.type?.includes('Equipment') &&
          a.serviceType !== 'equipment' &&
          !a.type?.includes('Ayurved') &&
          !a.type?.includes('Panchakarma') &&
          a.serviceType !== 'ayurveda' &&
          !a.type?.includes('Fertility') &&
          !a.type?.includes('IVF') &&
          a.serviceType !== 'fertility'
      ).length,
      equipment: appointments.filter(
        (a) =>
          a.type?.includes('Equipment') ||
          a.serviceType === 'equipment'
      ).length,
      ayurveda: appointments.filter(
        (a) =>
          a.type?.includes('Ayurved') ||
          a.type?.includes('Panchakarma') ||
          a.serviceType === 'ayurveda'
      ).length,
      fertility: appointments.filter(
        (a) =>
          a.type?.includes('Fertility') ||
          a.type?.includes('IVF') ||
          a.serviceType === 'fertility'
      ).length,
      labTests: appointments.filter(
        (a) =>
          a.type === 'Lab Test' ||
          a.type === 'Diagnostic Lab Test' ||
          a.type === 'Lab' ||
          a.serviceType === 'lab'
      ).length,
      sampleTracking: appointments.filter(
        (a) =>
          (a.type === 'Lab Test' || a.type === 'Diagnostic Lab Test' || a.type === 'Lab' || a.serviceType === 'lab') &&
          (a.collectionMode?.includes('Home') || a.visitType?.includes('Home'))
      ).length,
      pharmacy: appointments.filter((a) => a.type === 'Pharmacy Order' || a.isPharmacyOrder).length,
      radiology: appointments.filter((a) => a.type === 'Radiology' || a.serviceType === 'radiology').length,
      nurse: appointments.filter(
        (a) =>
          a.type === 'Home Nurse Care' ||
          a.type === 'Nurse' ||
          a.serviceType === 'nurse' ||
          a.assignedNurse !== undefined ||
          (typeof a.serviceName === 'string' && a.serviceName.includes('Staff'))
      ).length,
      confirmed: appointments.filter(
        (a) =>
          a.status === 'Confirmed' ||
          a.status === 'Rescheduled' ||
          a.status === 'Out for Delivery' ||
          a.status === 'Scheduled'
      ).length,
      cancelled: appointments.filter((a) => a.status === 'Cancelled').length,
    };
  }, [appointments]);

  // Handle GPS Directions
  const handleOpenDirections = (item) => {
    const address = item.doctor?.clinicAddress || item.doctor?.clinicName || 'Mysore';
    const lat = item.doctor?.latitude || 12.2858;
    const lng = item.doctor?.longitude || 76.6341;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${encodeURIComponent(address)}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(mapsUrl, '_blank');
    } else {
      Linking.openURL(mapsUrl);
    }
  };

  // Quick Cancel Appointment Handler
  const handleQuickCancel = (item) => {
    showAlert(
      'Cancel Appointment?',
      `Are you sure you want to cancel your appointment with ${item.doctor?.name}? Any paid fees will be refunded to your MediUnnathi Wallet.`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const updated = appointments.map((a) =>
              a.id === item.id ? { ...a, status: 'Cancelled' } : a
            );
            setAppointments(updated);
            await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updated));

            // Refund if paid
            if (item.paidAmount) {
              const curBalStr = await AsyncStorage.getItem('@unnathi_wallet_balance');
              const curBal = parseInt(curBalStr, 10) || 1250;
              const newBal = curBal + parseInt(item.paidAmount, 10);
              await AsyncStorage.setItem('@unnathi_wallet_balance', newBal.toString());
            }

            showAlert('Appointment Cancelled', 'Your booking has been cancelled and refunded.');
          },
        },
      ]
    );
  };

  // Remove a test from an appointment
  const handleRemoveTest = (appointment, testIndexToRemove) => {
    const testToRemove = appointment.tests[testIndexToRemove];
    const testName = typeof testToRemove === 'string' ? testToRemove : testToRemove.name;

    if (appointment.tests.length === 1) {
      showAlert(
        'Remove Single Test',
        `"${testName}" is the only test in this booking. Removing it will cancel this booking. Do you want to proceed?`,
        [
          { text: 'Keep Test', style: 'cancel' },
          {
            text: 'Cancel Booking',
            style: 'destructive',
            onPress: () => handleQuickCancel(appointment),
          },
        ]
      );
      return;
    }

    showAlert(
      'Remove Test from Booking',
      `Remove "${testName}" from booking #${appointment.tokenNumber || appointment.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedTests = appointment.tests.filter((_, idx) => idx !== testIndexToRemove);
            const removedPrice = typeof testToRemove === 'object' && testToRemove.price ? testToRemove.price : 0;
            const updatedAmount = Math.max(0, (appointment.paidAmount || appointment.totalAmount || 0) - removedPrice);

            const updatedAppointments = appointments.map((a) => {
              if (a.id === appointment.id) {
                return normalizeAppointment({
                  ...a,
                  tests: updatedTests,
                  paidAmount: updatedAmount,
                  totalAmount: updatedAmount,
                });
              }
              return a;
            });

            setAppointments(updatedAppointments);
            await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updatedAppointments));
            await AsyncStorage.setItem(
              '@labBookings',
              JSON.stringify(updatedAppointments.filter((a) => a.type === 'Diagnostic Lab Test'))
            );

            showAlert(
              'Test Removed',
              `"${testName}" has been removed. Updated booking amount: ₹${updatedAmount}`
            );
          },
        },
      ]
    );
  };

  // Add a test to an appointment
  const handleAddTestToBooking = async (appointment, testToAdd) => {
    const currentTests = appointment.tests || [];
    const isAlreadyAdded = currentTests.some(
      (t) => (typeof t === 'string' ? t : t.name) === testToAdd.name
    );

    if (isAlreadyAdded) {
      showAlert('Test Already Included', `"${testToAdd.name}" is already in this appointment.`);
      return;
    }

    const newTests = [
      ...currentTests,
      {
        name: testToAdd.name,
        price: testToAdd.price,
        sampleType: testToAdd.sampleType,
        fastingRequired: testToAdd.fastingRequired,
      },
    ];

    const addedPrice = testToAdd.price || 0;
    const updatedAmount = (appointment.paidAmount || appointment.totalAmount || 0) + addedPrice;

    const updatedAppointments = appointments.map((a) => {
      if (a.id === appointment.id) {
        return normalizeAppointment({
          ...a,
          tests: newTests,
          paidAmount: updatedAmount,
          totalAmount: updatedAmount,
        });
      }
      return a;
    });

    setAppointments(updatedAppointments);
    await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updatedAppointments));
    await AsyncStorage.setItem(
      '@labBookings',
      JSON.stringify(updatedAppointments.filter((a) => a.type === 'Diagnostic Lab Test'))
    );

    setActiveBookingForAddTest(null);
    setTestSearchQuery('');

    showAlert(
      'Test Added Successfully',
      `"${testToAdd.name}" (+₹${addedPrice}) was added to booking #${appointment.tokenNumber || appointment.id}.\nTotal Amount: ₹${updatedAmount}`
    );
  };

  // Document Upload Handlers
  const handleOpenUploadModal = (appointment) => {
    const docs = appointment.documents || (appointment.patient?.reportUri ? [{ id: 'doc-init', name: 'Prescription / Medical Scan', uri: appointment.patient.reportUri, date: 'Attached with booking', type: 'Medical Report' }] : []);
    setActiveAppointmentForUpload({ ...appointment, documents: docs });
    setIsUploadModalOpen(true);
  };

  const handlePickDocument = async (isCamera) => {
    if (!activeAppointmentForUpload) return;
    try {
      setIsUploadingDoc(true);
      let result;
      if (isCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setIsUploadingDoc(false);
          showAlert('Permission Needed', 'Please allow camera access to capture documents.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.85,
          allowsEditing: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setIsUploadingDoc(false);
          showAlert('Permission Needed', 'Please allow photo library access to upload documents.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: true,
        });
      }

      setIsUploadingDoc(false);

      if (!result.canceled && result.assets?.[0]) {
        const newDoc = {
          id: `doc-${Date.now()}`,
          name: `${isCamera ? 'Photo_Scan_' : 'Medical_Doc_'}${Date.now().toString().slice(-4)}.jpg`,
          uri: result.assets[0].uri,
          date: 'Just now',
          type: 'Patient Record',
        };

        const currentDocs = activeAppointmentForUpload.documents || [];
        const updatedDocs = [newDoc, ...currentDocs];

        const updatedAppointments = appointments.map((a) => {
          if (a.id === activeAppointmentForUpload.id) {
            return {
              ...a,
              documents: updatedDocs,
            };
          }
          return a;
        });

        setAppointments(updatedAppointments);
        setActiveAppointmentForUpload((prev) => ({ ...prev, documents: updatedDocs }));

        // Save to AsyncStorage
        await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updatedAppointments));
        if (activeAppointmentForUpload.type?.includes('Video')) {
          await AsyncStorage.setItem('@videoBookings', JSON.stringify(updatedAppointments.filter((a) => a.type?.includes('Video'))));
        }

        showAlert(
          'Document Uploaded! 📄',
          `"${newDoc.name}" has been attached to booking #${activeAppointmentForUpload.tokenNumber || activeAppointmentForUpload.id}.`
        );
      }
    } catch (err) {
      setIsUploadingDoc(false);
      console.log('Error picking document:', err);
      showAlert('Upload Error', 'Failed to attach document. Please try again.');
    }
  };

  const handleRemoveDocument = async (docId) => {
    if (!activeAppointmentForUpload) return;
    const currentDocs = activeAppointmentForUpload.documents || [];
    const updatedDocs = currentDocs.filter((d) => d.id !== docId);

    const updatedAppointments = appointments.map((a) => {
      if (a.id === activeAppointmentForUpload.id) {
        return {
          ...a,
          documents: updatedDocs,
        };
      }
      return a;
    });

    setAppointments(updatedAppointments);
    setActiveAppointmentForUpload((prev) => ({ ...prev, documents: updatedDocs }));

    await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updatedAppointments));
  };

  // Render Card (Matching HomeScreen.web.js visual standards)
  const renderAppointmentCard = ({ item }) => {
    const isPharmacy =
      item.type === 'Pharmacy Order' ||
      item.isPharmacyOrder;
    const isLabHomeSample =
      (item.type === 'Diagnostic Lab Test' || item.type === 'Lab Test' || item.type === 'Lab') &&
      (item.collectionMode?.includes('Home') || item.visitType?.includes('Home'));
    const isVideo =
      !isPharmacy &&
      (item.type === 'Video Consultation' ||
      item.type === 'Video' ||
      item.type === 'TeleConsultation');
    const isRadiology = item.type === 'Radiology';
    const isLabTest =
      !isPharmacy &&
      (item.type === 'Lab Test' ||
      item.type === 'Diagnostic Lab Test' ||
      item.type === 'Lab');
    const isEquipment =
      item.type?.includes('Equipment') ||
      item.serviceType === 'equipment';
    const isAyurveda =
      item.type?.includes('Ayurved') ||
      item.type?.includes('Panchakarma') ||
      item.serviceType === 'ayurveda';
    const isFertility =
      item.type?.includes('Fertility') ||
      item.type?.includes('IVF') ||
      item.serviceType === 'fertility';
    const isNurse =
      !isPharmacy &&
      !isRadiology &&
      !isVideo &&
      !isLabTest &&
      !isEquipment &&
      !isAyurveda &&
      !isFertility &&
      (item.type === 'Home Nurse Care' ||
      item.type === 'Nurse' ||
      item.serviceType === 'nurse' ||
      item.assignedNurse !== undefined ||
      (typeof item.serviceName === 'string' && item.serviceName.includes('Staff')));

    const isCancelled = item.status === 'Cancelled';
    const isRescheduled = item.status === 'Rescheduled';

    // Category visual accents (Curated from HomeScreen.web.js)
    const accentColor = isPharmacy
      ? '#D97706'
      : isLabHomeSample
      ? '#059669'
      : isVideo
      ? '#2563EB'
      : isRadiology
      ? '#7C3AED'
      : isLabTest
      ? '#0D9488'
      : isNurse
      ? '#EC4899'
      : isEquipment
      ? '#8B5CF6'
      : isAyurveda
      ? '#059669'
      : isFertility
      ? '#DB2777'
      : '#00B894';

    const accentBg = isPharmacy
      ? '#FFFBEB'
      : isLabHomeSample
      ? '#ECFDF5'
      : isVideo
      ? '#EFF6FF'
      : isRadiology
      ? '#FAF5FF'
      : isLabTest
      ? '#F0FDFA'
      : isNurse
      ? '#FDF2F8'
      : isEquipment
      ? '#F5F3FF'
      : isAyurveda
      ? '#F0FDF4'
      : isFertility
      ? '#FFF1F2'
      : '#F0FDF4';

    const accentBorder = isPharmacy
      ? '#FED7AA'
      : isLabHomeSample
      ? '#A7F3D0'
      : isVideo
      ? '#BFDBFE'
      : isRadiology
      ? '#DDD6FE'
      : isLabTest
      ? '#99F6E4'
      : isNurse
      ? '#FBCFE8'
      : isEquipment
      ? '#DDD6FE'
      : isAyurveda
      ? '#BBF7D0'
      : isFertility
      ? '#FECDD3'
      : '#CCFBF1';

    const serviceLabel = isPharmacy
      ? 'PHARMACY DELIVERY'
      : isLabHomeSample
      ? 'HOME SAMPLE COLLECTION'
      : isVideo
      ? 'VIDEO CONSULTATION'
      : isRadiology
      ? 'RADIOLOGY & SCAN'
      : isLabTest
      ? 'DIAGNOSTIC LAB'
      : isNurse
      ? 'HOME NURSE CARE'
      : isEquipment
      ? 'EQUIPMENT RENTAL'
      : isAyurveda
      ? 'AYURVEDA & WELLNESS'
      : isFertility
      ? 'FERTILITY & IVF'
      : 'IN-CLINIC VISIT';

    const serviceIcon = isPharmacy
      ? 'cart'
      : isLabHomeSample
      ? 'navigate'
      : isVideo
      ? 'videocam'
      : isRadiology
      ? 'radio'
      : isLabTest
      ? 'flask'
      : isNurse
      ? 'heart'
      : isEquipment
      ? 'construct'
      : isAyurveda
      ? 'leaf'
      : isFertility
      ? 'heart-circle'
      : 'business';

    // Status colors
    const isDelivered = item.status === 'Delivered';
    const statusBg = isCancelled
      ? '#FEF2F2'
      : isRescheduled
      ? '#F0F9FF'
      : isDelivered
      ? '#ECFDF5'
      : '#ECFDF5';

    const statusBorder = isCancelled
      ? '#FECACA'
      : isRescheduled
      ? '#BAE6FD'
      : isDelivered
      ? '#A7F3D0'
      : '#A7F3D0';

    const statusDotColor = isCancelled
      ? '#EF4444'
      : isRescheduled
      ? '#0284C7'
      : '#10B981';

    const statusTextColor = isCancelled
      ? '#DC2626'
      : isRescheduled
      ? '#0369A1'
      : '#059669';

    const statusText = item.status || 'Confirmed';

    // Provider details
    const providerName =
      item.doctor?.name ||
      (isPharmacy
        ? 'Unnathi Certified Pharmacy Store'
        : isEquipment
        ? 'MediUnify BioMedical Equipment Hub'
        : isAyurveda
        ? 'Sanjeevani Ayurvedic Wellness Centre'
        : isFertility
        ? 'Nova IVF & Fertility Care Centre'
        : isLabTest
        ? 'MediUnify Pathology Hub'
        : 'MediUnify Healthcare Clinic');

    const providerSpec =
      item.doctor?.specialty ||
      (isPharmacy
        ? `${item.itemsSummary || 'Medicine Delivery • 2 Items'}`
        : isEquipment
        ? 'BioMedical Equipment Rental • Technician Assisted'
        : isAyurveda
        ? 'Ayurvedic Physician • Natural Wellness & Detox'
        : isFertility
        ? 'Reproductive Medicine & IVF Specialist'
        : isLabTest
        ? `${item.tests ? item.tests.length : 2} Diagnostic Tests Included`
        : isVideo
        ? 'General Physician • Online Video Room'
        : 'General Physician • Kuvempunagar, Mysore');

    const providerLocation = isPharmacy
      ? item.doctor?.clinicAddress || 'No. 45, Vijayanagar 2nd Stage, Mysore'
      : isVideo
      ? '100% Private HD Telehealth Room'
      : isEquipment
      ? item.patient?.address || item.doctor?.clinicAddress || 'Doorstep Delivery & BioMedical Demo, Mysore'
      : isNurse
      ? item.patient?.address || item.doctor?.clinicAddress || 'Doorstep Nursing Care, Mysore'
      : isAyurveda
      ? item.doctor?.clinicAddress || 'Saraswathipuram, Mysore'
      : isFertility
      ? item.doctor?.clinicAddress || 'Gokulam 3rd Stage, Mysore'
      : item.doctor?.clinicArea || item.doctor?.clinicAddress || item.doctor?.clinicName || 'Kuvempunagar, Mysore';

    const locationIcon = isPharmacy
      ? 'location-outline'
      : isVideo
      ? 'videocam-outline'
      : (isLabHomeSample || isEquipment || isNurse)
      ? 'home-outline'
      : 'location-outline';

    const avatarUri =
      item.doctor?.image ||
      (isPharmacy
        ? 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=300'
        : isVideo
        ? 'https://images.unsplash.com/photo-1594824813576-92f70b79873a?auto=format&fit=crop&q=80&w=300'
        : isRadiology
        ? 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=300'
        : isEquipment
        ? 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=300'
        : isAyurveda
        ? 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300'
        : isFertility
        ? 'https://images.unsplash.com/photo-1594824813576-92f70b79873a?auto=format&fit=crop&q=80&w=300'
        : isLabTest
        ? 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=300'
        : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300');

    // Schedule values
    const scheduleDate = `${item.day ? `${item.day}, ` : ''}${item.date?.split(',')[0] || item.date || 'Today'}`;
    const scheduleTime = item.time?.replace(' (Fasting)', '')?.replace(' (Live Room Ready)', '') || '09:30 AM';
    const patientName = item.patient?.name || 'Self';
    const patientDetails = item.patient?.gender && !isPharmacy
      ? ` (${item.patient.gender}, ${item.patient.age || '32'}y)`
      : item.patient?.age
      ? ` (${item.patient.age}y)`
      : '';

    const feeAmount = item.paidAmount || item.doctor?.fee || item.total || 450;
    const paymentLabel = item.paymentStatus
      ? item.paymentStatus.replace('Paid Online via UPI', 'Paid Online').replace('Pay at Clinic Reception', 'Pay at Clinic')
      : 'Paid Online';

    return (
      <TouchableOpacity
        style={[
          styles.appointmentCard,
          isCancelled && styles.appointmentCardCancelled,
        ]}
        activeOpacity={0.95}
        onPress={() => {
          if (isPharmacy) {
            setSelectedTrackingPharmacy(item);
          } else if (isLabHomeSample) {
            setSelectedTrackingSample(item);
          } else {
            navigation.navigate('BookingDetails', { appointment: item });
          }
        }}
      >
        {/* 1. TOP HEADER: CATEGORY BADGE, TOKEN & STATUS */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.serviceBadge, { backgroundColor: accentBg, borderColor: accentBorder }]}>
              <Ionicons name={serviceIcon} size={12} color={accentColor} />
              <Text style={[styles.serviceBadgeText, { color: accentColor }]}>
                {serviceLabel}
              </Text>
            </View>

            {item.tokenNumber ? (
              <View style={styles.tokenPill}>
                <Text style={styles.tokenPillText}>#{item.tokenNumber}</Text>
              </View>
            ) : null}
          </View>

          {/* STATUS PILL */}
          <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusBorder }]}>
            <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
            <Text style={[styles.statusText, { color: statusTextColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* 2. DOCTOR / PROVIDER INFO ROW WITH PRICE */}
        <View style={styles.cardBodyRow}>
          <Image source={{ uri: avatarUri }} style={styles.avatarImg} />

          <View style={styles.infoCol}>
            <View style={styles.providerTitleRow}>
              <Text style={styles.providerName} numberOfLines={1}>
                {providerName}
              </Text>
              <Ionicons name="checkmark-circle" size={15} color={accentColor} />
            </View>

            <Text style={styles.providerSpec} numberOfLines={1}>
              {providerSpec}
            </Text>

            <View style={styles.providerLocationRow}>
              <Ionicons name={locationIcon} size={12} color="#64748B" />
              <Text style={styles.providerLocationText} numberOfLines={1}>
                {providerLocation}
              </Text>
            </View>

            {/* Subtle Inline Highlights */}
            {isVideo && (
              <View style={[styles.cardLivePill, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
                <Ionicons name="videocam" size={11} color="#2563EB" />
                <Text style={[styles.cardLivePillText, { color: '#1D4ED8' }]}>
                  Live Room Ready • Upload Docs In-Call
                </Text>
              </View>
            )}

            {isLabHomeSample && (
              <View style={[styles.cardLivePill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <Ionicons name="navigate-circle" size={11} color="#059669" />
                <Text style={[styles.cardLivePillText, { color: '#047857' }]}>
                  Doorstep Collection • Praveen M. Assigned
                </Text>
              </View>
            )}

            {isPharmacy && (
              <View style={[styles.cardLivePill, { backgroundColor: '#FFFBEB', borderColor: '#FED7AA' }]}>
                <Ionicons name="bicycle" size={11} color="#D97706" />
                <Text style={[styles.cardLivePillText, { color: '#B45309' }]}>
                  Express Delivery • Rider Santosh M. Assigned
                </Text>
              </View>
            )}

            {isEquipment && (
              <View style={[styles.cardLivePill, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
                <Ionicons name="construct" size={11} color="#8B5CF6" />
                <Text style={[styles.cardLivePillText, { color: '#6D28D9' }]}>
                  BioMedical Setup & Demonstration Included
                </Text>
              </View>
            )}

            {isAyurveda && (
              <View style={[styles.cardLivePill, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Ionicons name="leaf" size={11} color="#059669" />
                <Text style={[styles.cardLivePillText, { color: '#047857' }]}>
                  Authentic Vaidya Care • Nadi & Prakriti Assessment
                </Text>
              </View>
            )}

            {isFertility && (
              <View style={[styles.cardLivePill, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
                <Ionicons name="shield-checkmark" size={11} color="#DB2777" />
                <Text style={[styles.cardLivePillText, { color: '#BE185D' }]}>
                  100% Confidential • Dedicated Fertility Counselor
                </Text>
              </View>
            )}
          </View>

          {/* Right Price Box */}
          <View style={styles.priceCol}>
            <Text style={styles.priceLabel}>FEE</Text>
            <Text
              style={[
                styles.priceValue,
                isCancelled && styles.priceValueCancelled,
              ]}
            >
              ₹{feeAmount}
            </Text>
            <Text style={styles.pricePaymentTag} numberOfLines={1}>
              {paymentLabel}
            </Text>
          </View>
        </View>

        {/* 3. SLEEK SCHEDULE & PATIENT BAR */}
        <View style={styles.scheduleStrip}>
          <View style={styles.scheduleStripItem}>
            <Ionicons name="calendar-outline" size={14} color="#00B894" />
            <Text style={styles.scheduleStripVal}>{scheduleDate}</Text>
          </View>

          <View style={styles.scheduleStripDivider} />

          <View style={styles.scheduleStripItem}>
            <Ionicons name="time-outline" size={14} color="#2563EB" />
            <Text style={styles.scheduleStripVal}>{scheduleTime}</Text>
          </View>

          <View style={styles.scheduleStripDivider} />

          <View style={[styles.scheduleStripItem, { flex: 1.2 }]}>
            <Ionicons name="person-outline" size={14} color="#64748B" />
            <Text style={styles.scheduleStripText} numberOfLines={1}>
              {isPharmacy ? 'Deliver to: ' : 'Patient: '}
              <Text style={styles.scheduleStripVal}>{patientName}</Text>
              {patientDetails}
            </Text>
          </View>

          {((item.documents && item.documents.length > 0) || item.patient?.reportUri) && (
            <TouchableOpacity
              style={styles.docAttachBadge}
              onPress={() => handleOpenUploadModal(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="attach" size={12} color="#0D9488" />
              <Text style={styles.docAttachBadgeText}>
                {item.documents?.length || 1} Doc
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 4. UNIFIED SINGLE ACTION BAR */}
        <View style={styles.cardActionsBar}>
          {!isCancelled ? (
            <>
              <View style={styles.cardActionsLeft}>
                {/* PRIMARY ACTION CTA */}
                {isEquipment ? (
                  <TouchableOpacity
                    style={[styles.btnPrimaryAction, { backgroundColor: '#8B5CF6' }]}
                    onPress={() => {
                      const telNum = item.doctor?.phone || '+918212459908';
                      Linking.openURL(`tel:${telNum}`);
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="call" size={14} color="#FFFFFF" />
                    <Text style={styles.btnPrimaryActionText}>Call BioTech</Text>
                  </TouchableOpacity>
                ) : isAyurveda ? (
                  <TouchableOpacity
                    style={[styles.btnPrimaryAction, { backgroundColor: '#059669' }]}
                    onPress={() => handleOpenDirections(item)}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.btnPrimaryActionText}>Directions</Text>
                  </TouchableOpacity>
                ) : isFertility ? (
                  <TouchableOpacity
                    style={[styles.btnPrimaryAction, { backgroundColor: '#DB2777' }]}
                    onPress={() => handleOpenDirections(item)}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.btnPrimaryActionText}>Directions</Text>
                  </TouchableOpacity>
                ) : isVideo ? (
                  <TouchableOpacity
                    style={[styles.btnPrimaryAction, { backgroundColor: '#2563EB' }]}
                    onPress={() =>
                      navigation.navigate('VideoMeeting', {
                        appointment: item,
                        doctor: item.doctor,
                      })
                    }
                    activeOpacity={0.88}
                  >
                    <View style={styles.livePulseDot} />
                    <Ionicons name="videocam" size={14} color="#FFFFFF" />
                    <Text style={styles.btnPrimaryActionText}>Join Video Call</Text>
                    <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : isPharmacy ? (
                  <TouchableOpacity
                    style={[styles.btnPrimaryAction, { backgroundColor: '#D97706' }]}
                    onPress={() => setSelectedTrackingPharmacy(item)}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="bicycle" size={14} color="#FFFFFF" />
                    <Text style={styles.btnPrimaryActionText}>Track Delivery</Text>
                    <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : isLabHomeSample ? (
                  <TouchableOpacity
                    style={[styles.btnPrimaryAction, { backgroundColor: '#059669' }]}
                    onPress={() => setSelectedTrackingSample(item)}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="navigate" size={14} color="#FFFFFF" />
                    <Text style={styles.btnPrimaryActionText}>Track Sample</Text>
                    <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.btnPrimaryAction, { backgroundColor: '#00B894' }]}
                    onPress={() => handleOpenDirections(item)}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.btnPrimaryActionText}>Directions</Text>
                  </TouchableOpacity>
                )}

                {/* SECONDARY ACTION */}
                {isVideo && (
                  <TouchableOpacity
                    style={styles.btnSecondaryAction}
                    onPress={() => handleOpenUploadModal(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="cloud-upload-outline" size={13} color="#2563EB" />
                    <Text style={[styles.btnSecondaryActionText, { color: '#2563EB' }]}>Upload Doc</Text>
                  </TouchableOpacity>
                )}

                {isPharmacy && (
                  <TouchableOpacity
                    style={styles.btnSecondaryAction}
                    onPress={() => {
                      const telNum = item.rider?.phone || '+919876543210';
                      Linking.openURL(`tel:${telNum}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call-outline" size={13} color="#D97706" />
                    <Text style={[styles.btnSecondaryActionText, { color: '#D97706' }]}>Call Rider</Text>
                  </TouchableOpacity>
                )}

                {isLabHomeSample && (
                  <TouchableOpacity
                    style={styles.btnSecondaryAction}
                    onPress={() => Linking.openURL('tel:+919876543210')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call-outline" size={13} color="#059669" />
                    <Text style={[styles.btnSecondaryActionText, { color: '#059669' }]}>Call Tech</Text>
                  </TouchableOpacity>
                )}

                {!isPharmacy && !isLabHomeSample && (
                  <TouchableOpacity
                    style={styles.btnSecondaryAction}
                    onPress={() => navigation.navigate('BookingDetails', { appointment: item })}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar-outline" size={13} color="#2563EB" />
                    <Text style={[styles.btnSecondaryActionText, { color: '#2563EB' }]}>Reschedule</Text>
                  </TouchableOpacity>
                )}

                {/* DETAILS & RECEIPT ACTION */}
                <TouchableOpacity
                  style={styles.btnSecondaryAction}
                  onPress={() => navigation.navigate('BookingDetails', { appointment: item })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="receipt-outline" size={13} color="#334155" />
                  <Text style={styles.btnSecondaryActionText}>Details & Receipt</Text>
                  <Ionicons name="chevron-forward" size={11} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* CANCEL ACTION */}
              <TouchableOpacity
                style={styles.btnCancelAction}
                onPress={() => handleQuickCancel(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={13} color="#EF4444" />
                <Text style={styles.btnCancelActionText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* CANCELLED ACTIONS ROW */
            <View style={styles.cardActionsLeft}>
              <TouchableOpacity
                style={[styles.btnPrimaryAction, { backgroundColor: '#00B894' }]}
                onPress={() =>
                  navigation.navigate(
                    isVideo ? 'VideoConsultation' : isRadiology ? 'RadiologyLabs' : isLabTest ? 'LabTests' : 'DoctorList'
                  )
                }
                activeOpacity={0.88}
              >
                <Ionicons name="refresh" size={14} color="#FFFFFF" />
                <Text style={styles.btnPrimaryActionText}>Rebook Visit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSecondaryAction}
                onPress={() => navigation.navigate('BookingDetails', { appointment: item })}
                activeOpacity={0.8}
              >
                <Ionicons name="receipt-outline" size={13} color="#475569" />
                <Text style={styles.btnSecondaryActionText}>View Summary</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {isDesktopWeb ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.desktopPageScroll}
        >
          {/* DESKTOP BREADCRUMBS */}
          <View style={styles.webBreadcrumbsRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.7}>
              <Text style={styles.webBreadcrumbLink}>Home</Text>
            </TouchableOpacity>
            <Text style={styles.webBreadcrumbSlash}>/</Text>
            <Text style={styles.webBreadcrumbCurrent}>My Appointments & Bookings</Text>
          </View>

          {/* HERO PROMOTIONAL BANNER */}
          <View style={styles.heroBannerDesktop}>
            <View style={styles.heroContent}>
              <View style={styles.heroTag}>
                <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                <Text style={styles.heroTagText}>MEDIUNIFY HEALTH DASHBOARD</Text>
              </View>
              <View style={styles.heroTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>My Appointments & Health Care</Text>
                  <Text style={styles.heroSubtitle}>
                    Track in-clinic physical visits, live HD video calls, home lab collections, radiology scans, and pharmacy deliveries in real time.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.heroSyncBtn}
                  onPress={() => loadAppointments()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sync-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.heroSyncBtnText}>Sync Live</Text>
                </TouchableOpacity>
              </View>

              {/* QUICK STATS ROW */}
              <View style={styles.heroStatsRow}>
                <TouchableOpacity
                  style={[styles.heroStatItem, selectedTab === 'All' && styles.heroStatItemActive]}
                  onPress={() => setSelectedTab('All')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.heroStatNum}>{counts.all}</Text>
                  <Text style={styles.heroStatLabel}>Total Bookings</Text>
                </TouchableOpacity>
                <View style={styles.heroStatDivider} />
                <TouchableOpacity
                  style={[styles.heroStatItem, selectedTab === 'Confirmed' && styles.heroStatItemActive]}
                  onPress={() => setSelectedTab('Confirmed')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.heroStatNum, { color: '#34D399' }]}>{counts.confirmed}</Text>
                  <Text style={styles.heroStatLabel}>Active / Upcoming</Text>
                </TouchableOpacity>
                <View style={styles.heroStatDivider} />
                <TouchableOpacity
                  style={[styles.heroStatItem, selectedTab === 'Doctor Visits' && styles.heroStatItemActive]}
                  onPress={() => setSelectedTab('Doctor Visits')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.heroStatNum}>{counts.doctors}</Text>
                  <Text style={styles.heroStatLabel}>In-Clinic Visits</Text>
                </TouchableOpacity>
                <View style={styles.heroStatDivider} />
                <TouchableOpacity
                  style={[styles.heroStatItem, selectedTab === 'Video Consults' && styles.heroStatItemActive]}
                  onPress={() => setSelectedTab('Video Consults')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.heroStatNum}>{counts.videoCalls}</Text>
                  <Text style={styles.heroStatLabel}>Video Calls</Text>
                </TouchableOpacity>
                <View style={styles.heroStatDivider} />
                <TouchableOpacity
                  style={[styles.heroStatItem, selectedTab === 'Lab Tests' && styles.heroStatItemActive]}
                  onPress={() => setSelectedTab('Lab Tests')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.heroStatNum}>{counts.labTests}</Text>
                  <Text style={styles.heroStatLabel}>Lab Tests</Text>
                </TouchableOpacity>
                <View style={styles.heroStatDivider} />
                <TouchableOpacity
                  style={[styles.heroStatItem, selectedTab === 'Equipment Rental' && styles.heroStatItemActive]}
                  onPress={() => setSelectedTab('Equipment Rental')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.heroStatNum, { color: '#8B5CF6' }]}>{counts.equipment}</Text>
                  <Text style={styles.heroStatLabel}>Equipment</Text>
                </TouchableOpacity>
                <View style={styles.heroStatDivider} />
                <TouchableOpacity
                  style={[styles.heroStatItem, selectedTab === 'Ayurveda & Wellness' && styles.heroStatItemActive]}
                  onPress={() => setSelectedTab('Ayurveda & Wellness')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.heroStatNum, { color: '#059669' }]}>{counts.ayurveda}</Text>
                  <Text style={styles.heroStatLabel}>Ayurveda</Text>
                </TouchableOpacity>
                <View style={styles.heroStatDivider} />
                <TouchableOpacity
                  style={[styles.heroStatItem, selectedTab === 'Fertility & IVF' && styles.heroStatItemActive]}
                  onPress={() => setSelectedTab('Fertility & IVF')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.heroStatNum, { color: '#DB2777' }]}>{counts.fertility}</Text>
                  <Text style={styles.heroStatLabel}>Fertility</Text>
                </TouchableOpacity>
                <View style={styles.heroStatDivider} />
                <TouchableOpacity
                  style={[styles.heroStatItem, selectedTab === 'Pharmacy Orders' && styles.heroStatItemActive]}
                  onPress={() => setSelectedTab('Pharmacy Orders')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.heroStatNum}>{counts.pharmacy}</Text>
                  <Text style={styles.heroStatLabel}>Pharmacy Orders</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* MAIN 2-COLUMN LAYOUT */}
          <View style={styles.mainLayoutWrapDesktop}>
            {/* LEFT COLUMN: DEDICATED STICKY FILTER SIDEBAR */}
            <View style={styles.desktopFilterSidebarCol}>
              <View style={styles.filterSidebarCard}>
                {/* FILTER HEADER */}
                <View style={styles.filterSidebarHeader}>
                  <View style={styles.filterSidebarHeaderLeft}>
                    <View style={styles.filterIconCircle}>
                      <Ionicons name="funnel" size={14} color="#0D9488" />
                    </View>
                    <Text style={styles.filterSidebarTitle}>Filter Bookings</Text>
                  </View>
                  {selectedTab !== 'All' && (
                    <TouchableOpacity
                      style={styles.filterResetBtn}
                      onPress={() => setSelectedTab('All')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.filterResetBtnText}>Reset</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* FILTER SECTION 1: CARE SERVICES */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionLabel}>CARE SERVICES</Text>
                  <View style={styles.filterItemsList}>
                    {[
                      { key: 'All', label: 'All Bookings', count: counts.all, icon: 'apps', color: '#0D9488' },
                      { key: 'Doctor Visits', label: 'In-Clinic Visits', count: counts.doctors, icon: 'business', color: '#00B894' },
                      { key: 'Video Consults', label: 'Video Calls', count: counts.videoCalls, icon: 'videocam', color: '#2563EB' },
                      { key: 'Lab Tests', label: 'Lab Tests', count: counts.labTests, icon: 'flask', color: '#0D9488' },
                      { key: 'Equipment Rental', label: 'Equipment Rental', count: counts.equipment, icon: 'construct', color: '#8B5CF6' },
                      { key: 'Ayurveda & Wellness', label: 'Ayurveda & Wellness', count: counts.ayurveda, icon: 'leaf', color: '#059669' },
                      { key: 'Fertility & IVF', label: 'Fertility & IVF', count: counts.fertility, icon: 'heart-circle', color: '#DB2777' },
                      { key: 'Sample Tracking', label: 'Sample Tracking', count: counts.sampleTracking, icon: 'navigate', color: '#059669' },
                      { key: 'Pharmacy Orders', label: 'Pharmacy Orders', count: counts.pharmacy, icon: 'cart', color: '#D97706' },
                      { key: 'Radiology Scans', label: 'Radiology Scans', count: counts.radiology, icon: 'radio', color: '#7C3AED' },
                      { key: 'Home Care', label: 'Nurse Care', count: counts.nurse, icon: 'heart', color: '#EC4899' },
                    ].map((item) => {
                      const isSelected = selectedTab === item.key;
                      return (
                        <TouchableOpacity
                          key={item.key}
                          style={[
                            styles.filterItemBtn,
                            isSelected && styles.filterItemBtnActive,
                          ]}
                          onPress={() => setSelectedTab(item.key)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.filterItemLeft}>
                            <View
                              style={[
                                styles.filterItemIconBox,
                                isSelected ? { backgroundColor: item.color } : { backgroundColor: '#F1F5F9' },
                              ]}
                            >
                              <Ionicons
                                name={item.icon}
                                size={14}
                                color={isSelected ? '#FFFFFF' : item.color}
                              />
                            </View>
                            <Text
                              style={[
                                styles.filterItemText,
                                isSelected && styles.filterItemTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {item.label}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.filterCountBadge,
                              isSelected && [styles.filterCountBadgeActive, { backgroundColor: item.color }],
                            ]}
                          >
                            <Text
                              style={[
                                styles.filterCountBadgeText,
                                isSelected && styles.filterCountBadgeTextActive,
                              ]}
                            >
                              {item.count}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* FILTER SECTION 2: BY STATUS */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionLabel}>BY STATUS</Text>
                  <View style={styles.filterItemsList}>
                    {[
                      { key: 'Confirmed', label: 'Upcoming / Active', count: counts.confirmed, icon: 'checkmark-circle', color: '#059669' },
                      { key: 'Cancelled', label: 'Cancelled Bookings', count: counts.cancelled, icon: 'close-circle', color: '#DC2626' },
                    ].map((item) => {
                      const isSelected = selectedTab === item.key;
                      return (
                        <TouchableOpacity
                          key={item.key}
                          style={[
                            styles.filterItemBtn,
                            isSelected && styles.filterItemBtnActive,
                          ]}
                          onPress={() => setSelectedTab(item.key)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.filterItemLeft}>
                            <View
                              style={[
                                styles.filterItemIconBox,
                                isSelected ? { backgroundColor: item.color } : { backgroundColor: '#F1F5F9' },
                              ]}
                            >
                              <Ionicons
                                name={item.icon}
                                size={14}
                                color={isSelected ? '#FFFFFF' : item.color}
                              />
                            </View>
                            <Text
                              style={[
                                styles.filterItemText,
                                isSelected && styles.filterItemTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {item.label}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.filterCountBadge,
                              isSelected && [styles.filterCountBadgeActive, { backgroundColor: item.color }],
                            ]}
                          >
                            <Text
                              style={[
                                styles.filterCountBadgeText,
                                isSelected && styles.filterCountBadgeTextActive,
                              ]}
                            >
                              {item.count}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.filterSidebarDivider} />

                {/* QUICK SERVICES SHORTCUTS */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionLabel}>BOOK NEW CARE</Text>
                  <View style={styles.quickCareRow}>
                    <TouchableOpacity
                      style={styles.quickCareBtn}
                      onPress={() => navigation.navigate('DoctorList')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="business" size={13} color="#2563EB" />
                      <Text style={styles.quickCareBtnText}>Doctor</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickCareBtn}
                      onPress={() => navigation.navigate('VideoDoctorList')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="videocam" size={13} color="#7C3AED" />
                      <Text style={styles.quickCareBtnText}>Video</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickCareBtn}
                      onPress={() => navigation.navigate('LabTests')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="flask" size={13} color="#059669" />
                      <Text style={styles.quickCareBtnText}>Lab</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickCareBtn}
                      onPress={() => navigation.navigate('PharmacyHome')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="cart" size={13} color="#D97706" />
                      <Text style={styles.quickCareBtnText}>Meds</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.filterSidebarDivider} />

                {/* 24/7 HELPLINE */}
                <View style={styles.supportBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="headset" size={15} color="#0D9488" />
                    <Text style={styles.supportBoxTitle}>Patient Concierge</Text>
                  </View>
                  <Text style={styles.supportBoxSub}>
                    Need assistance with rescheduling or reports?
                  </Text>
                  <TouchableOpacity
                    style={styles.supportCallBtn}
                    onPress={() => Linking.openURL('tel:+918212459900')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="call" size={13} color="#FFFFFF" />
                    <Text style={styles.supportCallBtnText}>Call 24/7 Help Desk</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.secureBadgeRow}>
                  <Ionicons name="shield-checkmark" size={13} color="#059669" />
                  <Text style={styles.secureBadgeText}>
                    100% Confidential & NABL Certified
                  </Text>
                </View>
              </View>
            </View>

            {/* RIGHT COLUMN: MAIN APPOINTMENT CARDS LIST */}
            <View style={styles.desktopMainCol}>
              {/* ACTIVE TAB INFO & BREADCRUMB BAR */}
              <View style={styles.tabSummaryHeader}>
                <View style={styles.tabSummaryLeft}>
                  <Text style={styles.tabSummaryTitle}>
                    Showing {selectedTab === 'All' ? 'All Bookings' : selectedTab}
                  </Text>
                  {selectedTab !== 'All' && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterChipText}>{selectedTab}</Text>
                      <TouchableOpacity
                        onPress={() => setSelectedTab('All')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={13} color="#0F766E" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <Text style={styles.tabSummaryCount}>
                  {filteredAppointments.length} record{filteredAppointments.length === 1 ? '' : 's'}
                </Text>
              </View>

              {/* APPOINTMENT CARDS / EMPTY STATE */}
              {filteredAppointments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="calendar-outline" size={50} color="#0D9488" />
                  </View>
                  <Text style={styles.emptyTitle}>No Bookings Found</Text>
                  <Text style={styles.emptySubtitle}>
                    You have no appointments or orders scheduled under "{selectedTab}".
                  </Text>
                  <View style={styles.emptyActionRow}>
                    <TouchableOpacity
                      style={styles.emptyPrimaryBtn}
                      onPress={() => navigation.navigate('DoctorList')}
                      activeOpacity={0.88}
                    >
                      <Ionicons name="business" size={16} color="#FFFFFF" />
                      <Text style={styles.emptyPrimaryBtnText}>Book In-Clinic Doctor</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.emptySecondaryBtn}
                      onPress={() => navigation.navigate('VideoDoctorList')}
                      activeOpacity={0.88}
                    >
                      <Ionicons name="videocam" size={16} color="#0D9488" />
                      <Text style={styles.emptySecondaryBtnText}>Consult Doctor Online</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.cardsListWrap}>
                  {filteredAppointments.map((item) => (
                    <View key={item.id}>
                      {renderAppointmentCard({ item })}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* DESKTOP WEB FOOTER */}
          <WebFooter navigation={navigation} />
        </ScrollView>
      ) : (
        <>
          {/* TOP HEADER (CLEAN & CENTERED WITHOUT +BOOK BUTTON) */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#1E293B" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>My Appointments</Text>
              <Text style={styles.headerSubtitle}>
                {counts.all} Total • {counts.confirmed} Active
              </Text>
            </View>

            {/* LIVE SYNC / REFRESH BUTTON */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                gap: 5,
              }}
              onPress={() => loadAppointments()}
              activeOpacity={0.75}
            >
              <Ionicons name="sync-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* FILTER TABS (WITH VIDEO, LAB, SCANS, DOCTOR, NURSE) */}
          <View style={styles.tabsContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[
                { key: 'All', label: `All (${counts.all})`, icon: 'apps' },
                { key: 'Doctor Visits', label: `In-Clinic (${counts.doctors})`, icon: 'business' },
                { key: 'Video Consults', label: `Video Calls (${counts.videoCalls})`, icon: 'videocam' },
                { key: 'Lab Tests', label: `Lab Tests (${counts.labTests})`, icon: 'flask' },
                { key: 'Equipment Rental', label: `Equipment (${counts.equipment})`, icon: 'construct' },
                { key: 'Ayurveda & Wellness', label: `Ayurveda (${counts.ayurveda})`, icon: 'leaf' },
                { key: 'Fertility & IVF', label: `Fertility (${counts.fertility})`, icon: 'heart-circle' },
                { key: 'Sample Tracking', label: `Sample Tracking (${counts.sampleTracking})`, icon: 'navigate' },
                { key: 'Pharmacy Orders', label: `Pharmacy (${counts.pharmacy})`, icon: 'cart' },
                { key: 'Radiology Scans', label: `Scans (${counts.radiology})`, icon: 'radio' },
                { key: 'Home Care', label: `Nurse (${counts.nurse})`, icon: 'heart' },
                { key: 'Confirmed', label: `Upcoming (${counts.confirmed})`, icon: 'checkmark-circle' },
                { key: 'Cancelled', label: `Cancelled (${counts.cancelled})`, icon: 'close-circle' },
              ]}
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              renderItem={({ item }) => {
                const isSelected = selectedTab === item.key;
                return (
                  <TouchableOpacity
                    style={[styles.filterTab, isSelected && styles.filterTabActive]}
                    onPress={() => setSelectedTab(item.key)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={item.icon}
                      size={14}
                      color={isSelected ? '#FFFFFF' : '#64748B'}
                    />
                    <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* APPOINTMENTS LIST OR EMPTY STATE */}
          {filteredAppointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="flask-outline" size={54} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Bookings Found</Text>
              <Text style={styles.emptySubtitle}>
                You have no appointments or tests scheduled under "{selectedTab}".
              </Text>

              <View style={styles.emptyActionRow}>
                {selectedTab === 'Equipment Rental' ? (
                  <TouchableOpacity
                    style={[styles.emptyPrimaryBtn, { backgroundColor: '#8B5CF6' }]}
                    onPress={() => navigation.navigate('EquipmentRental')}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="construct" size={16} color="#FFFFFF" />
                    <Text style={styles.emptyPrimaryBtnText}>Rent Medical Equipment</Text>
                  </TouchableOpacity>
                ) : selectedTab === 'Ayurveda & Wellness' ? (
                  <TouchableOpacity
                    style={[styles.emptyPrimaryBtn, { backgroundColor: '#059669' }]}
                    onPress={() => navigation.navigate('AyurvedaWellness')}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="leaf" size={16} color="#FFFFFF" />
                    <Text style={styles.emptyPrimaryBtnText}>Book Ayurveda & Wellness</Text>
                  </TouchableOpacity>
                ) : selectedTab === 'Fertility & IVF' ? (
                  <TouchableOpacity
                    style={[styles.emptyPrimaryBtn, { backgroundColor: '#DB2777' }]}
                    onPress={() => navigation.navigate('FertilityIvf')}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="heart-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.emptyPrimaryBtnText}>Consult Fertility Specialist</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.emptyPrimaryBtn}
                      onPress={() => navigation.navigate('DoctorList')}
                      activeOpacity={0.88}
                    >
                      <Ionicons name="business" size={16} color="#FFFFFF" />
                      <Text style={styles.emptyPrimaryBtnText}>Consult a Doctor</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.emptySecondaryBtn}
                      onPress={() => navigation.navigate('LabTests')}
                      activeOpacity={0.88}
                    >
                      <Ionicons name="flask" size={16} color={colors.primary} />
                      <Text style={styles.emptySecondaryBtnText}>Book Blood & Lab Tests</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ) : (
            <FlatList
              data={filteredAppointments}
              keyExtractor={(item) => item.id}
              renderItem={renderAppointmentCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {/* ====================================================
          ADD TEST MODAL (OFFERS ALL CATALOG TESTS)
      ==================================================== */}
      <Modal
        visible={!!activeBookingForAddTest}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveBookingForAddTest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Add Test to Booking</Text>
                <Text style={styles.modalSubtitle}>
                  Booking #{activeBookingForAddTest?.tokenNumber || activeBookingForAddTest?.id}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveBookingForAddTest(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* SEARCH INPUT */}
            <View style={styles.modalSearchWrap}>
              <Ionicons name="search" size={16} color="#94A3B8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search blood, organ or package tests..."
                placeholderTextColor="#94A3B8"
                value={testSearchQuery}
                onChangeText={setTestSearchQuery}
              />
              {testSearchQuery ? (
                <TouchableOpacity onPress={() => setTestSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* TESTS LIST */}
            <FlatList
              data={labTests.filter((test) =>
                test.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
                (test.description && test.description.toLowerCase().includes(testSearchQuery.toLowerCase()))
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item: testItem }) => {
                const isAlreadyIn = activeBookingForAddTest?.tests?.some(
                  (t) => (typeof t === 'string' ? t : t.name) === testItem.name
                );

                return (
                  <View style={styles.modalTestItem}>
                    <View style={styles.modalTestInfo}>
                      <Text style={styles.modalTestName}>{testItem.name}</Text>
                      <View style={styles.modalTestMeta}>
                        <Text style={styles.modalTestPrice}>₹{testItem.price}</Text>
                        {testItem.mrp ? (
                          <Text style={styles.modalTestMrp}>₹{testItem.mrp}</Text>
                        ) : null}
                        {testItem.parametersCount ? (
                          <Text style={styles.modalTestParams}>
                            • {testItem.parametersCount} Parameters
                          </Text>
                        ) : null}
                      </View>
                      {testItem.fastingRequired && (
                        <Text style={styles.modalFastingNotice}>• Fasting Required</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.modalAddBtn,
                        isAlreadyIn && styles.modalAddBtnDisabled,
                      ]}
                      onPress={() => {
                        if (!isAlreadyIn) {
                          handleAddTestToBooking(activeBookingForAddTest, testItem);
                        }
                      }}
                      disabled={isAlreadyIn}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isAlreadyIn ? 'checkmark' : 'add'}
                        size={14}
                        color={isAlreadyIn ? '#059669' : '#FFFFFF'}
                      />
                      <Text
                        style={[
                          styles.modalAddBtnText,
                          isAlreadyIn && styles.modalAddBtnTextDisabled,
                        ]}
                      >
                        {isAlreadyIn ? 'Added' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ====================================================
          DOCUMENT UPLOAD & MANAGEMENT MODAL
      ==================================================== */}
      <Modal
        visible={isUploadModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsUploadModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Medical Documents</Text>
                <Text style={styles.modalSubtitle}>
                  Booking #{activeAppointmentForUpload?.tokenNumber || activeAppointmentForUpload?.id}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsUploadModalOpen(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* QUICK UPLOAD ACTION BUTTONS */}
            <View style={styles.uploadActionButtonsRow}>
              <TouchableOpacity
                style={[styles.uploadPickBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                onPress={() => handlePickDocument(true)}
                disabled={isUploadingDoc}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color="#059669" />
                <Text style={[styles.uploadPickBtnText, { color: '#059669' }]}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadPickBtn, { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }]}
                onPress={() => handlePickDocument(false)}
                disabled={isUploadingDoc}
                activeOpacity={0.8}
              >
                <Ionicons name="images" size={20} color={colors.primary} />
                <Text style={[styles.uploadPickBtnText, { color: colors.primary }]}>Gallery / Files</Text>
              </TouchableOpacity>
            </View>

            {/* ATTACHED DOCUMENTS LIST */}
            <Text style={styles.attachedDocsSectionHeader}>
              Attached Files ({activeAppointmentForUpload?.documents?.length || 0})
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {(!activeAppointmentForUpload?.documents || activeAppointmentForUpload.documents.length === 0) ? (
                <View style={styles.emptyDocsBox}>
                  <Ionicons name="cloud-upload-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyDocsTitle}>No Documents Attached</Text>
                  <Text style={styles.emptyDocsSub}>
                    Take a photo or upload previous prescriptions, symptom photos, or diagnostic reports.
                  </Text>
                </View>
              ) : (
                activeAppointmentForUpload.documents.map((doc, dIdx) => (
                  <View key={doc.id || dIdx} style={styles.docItemCard}>
                    {doc.uri ? (
                      <Image source={{ uri: doc.uri }} style={styles.docThumbImg} />
                    ) : (
                      <View style={styles.docThumbPlaceholder}>
                        <Ionicons name="document-text" size={20} color={colors.primary} />
                      </View>
                    )}

                    <View style={styles.docItemInfo}>
                      <Text style={styles.docItemName} numberOfLines={1}>
                        {doc.name || `Document_${dIdx + 1}.jpg`}
                      </Text>
                      <Text style={styles.docItemDate}>{doc.date || 'Attached'}</Text>
                    </View>

                    <View style={styles.docItemActions}>
                      {doc.uri ? (
                        <TouchableOpacity
                          style={styles.docViewBtn}
                          onPress={() => setPreviewImageUri(doc.uri)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="eye-outline" size={16} color={colors.primary} />
                        </TouchableOpacity>
                      ) : null}

                      <TouchableOpacity
                        style={styles.docDeleteBtn}
                        onPress={() => handleRemoveDocument(doc.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneModalBtn}
              onPress={() => setIsUploadModalOpen(false)}
              activeOpacity={0.88}
            >
              <Text style={styles.doneModalBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ====================================================
          LAB SAMPLE COLLECTION LIVE TRACKING MODAL
      ==================================================== */}
      <Modal
        visible={!!selectedTrackingSample}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTrackingSample(null)}
      >
        <View style={styles.trackingModalOverlay}>
          <View style={styles.trackingModalCard}>
            {/* MODAL HEADER */}
            <View style={styles.trackingHeader}>
              <View style={styles.trackingHeaderLeft}>
                <View style={[styles.trackingHeaderIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="navigate" size={20} color="#059669" />
                </View>
                <View>
                  <Text style={styles.trackingModalTitle}>Sample Collection Tracking</Text>
                  <Text style={styles.trackingModalSubtitle}>
                    Booking #{selectedTrackingSample?.tokenNumber || selectedTrackingSample?.id || 'LAB-88'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.trackingModalCloseBtn}
                onPress={() => setSelectedTrackingSample(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.trackingScrollContent}>
              {/* LIVE STATUS BANNER */}
              <View style={styles.liveStatusBanner}>
                <View style={styles.livePulseCircle} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.liveStatusTitle}>Phlebotomist is En Route</Text>
                  <Text style={styles.liveStatusEta}>Estimated Arrival in 20 - 25 mins • Slot: {selectedTrackingSample?.time || 'Morning Slot'}</Text>
                </View>
                <View style={styles.doorstepOtpBadge}>
                  <Text style={styles.doorstepOtpLabel}>DOORSTEP OTP</Text>
                  <Text style={styles.doorstepOtpValue}>4829</Text>
                </View>
              </View>

              {/* PHLEBOTOMIST INFO CARD */}
              <View style={styles.trackingPersonCard}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300' }}
                  style={styles.trackingPersonAvatar}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.trackingPersonName}>Praveen M.</Text>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                  </View>
                  <Text style={styles.trackingPersonRole}>ICMR & NABL Certified Phlebotomist</Text>
                  <View style={styles.trackingBadgeRow}>
                    <View style={styles.trackingMiniPill}>
                      <Ionicons name="star" size={11} color="#D97706" />
                      <Text style={styles.trackingMiniPillText}>4.9 (840+ Collections)</Text>
                    </View>
                    <View style={[styles.trackingMiniPill, { backgroundColor: '#ECFDF5' }]}>
                      <Ionicons name="shield-checkmark" size={11} color="#059669" />
                      <Text style={[styles.trackingMiniPillText, { color: '#047857' }]}>Sterile Kit Verified</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.trackingCallBtn}
                  onPress={() => Linking.openURL('tel:+919876543210')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.trackingCallBtnText}>Call</Text>
                </TouchableOpacity>
              </View>

              {/* LIVE STEP TIMELINE */}
              <View style={styles.timelineCard}>
                <Text style={styles.timelineSectionTitle}>Live Collection Progress</Text>

                {/* STEP 1 */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineDotDone}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                  <View style={styles.timelineLineDone} />
                  <View style={styles.timelineStepContent}>
                    <Text style={styles.timelineStepTitle}>Booking Confirmed & Order Logged</Text>
                    <Text style={styles.timelineStepDesc}>Assigned to MediUnify Central Diagnostics Lab</Text>
                    <Text style={styles.timelineStepTime}>Today, 08:30 AM</Text>
                  </View>
                </View>

                {/* STEP 2 */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineDotDone}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                  <View style={styles.timelineLineDone} />
                  <View style={styles.timelineStepContent}>
                    <Text style={styles.timelineStepTitle}>Phlebotomist Assigned & Kit Prepared</Text>
                    <Text style={styles.timelineStepDesc}>Praveen M. collected sterile vacuum vials & cold bag</Text>
                    <Text style={styles.timelineStepTime}>Today, 09:10 AM</Text>
                  </View>
                </View>

                {/* STEP 3 - ACTIVE */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineDotActive}>
                    <View style={styles.timelineDotInnerPulse} />
                  </View>
                  <View style={styles.timelineLinePending} />
                  <View style={styles.timelineStepContent}>
                    <Text style={[styles.timelineStepTitle, { color: '#059669', fontWeight: '800' }]}>
                      Phlebotomist En Route to Your Address
                    </Text>
                    <Text style={styles.timelineStepDesc}>Travelling on bike • Expected at your door in ~20 mins</Text>
                    <Text style={[styles.timelineStepTime, { color: '#059669', fontWeight: '700' }]}>In Progress Now</Text>
                  </View>
                </View>

                {/* STEP 4 */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineDotPending} />
                  <View style={styles.timelineLinePending} />
                  <View style={styles.timelineStepContent}>
                    <Text style={styles.timelineStepTitleUpcoming}>Doorstep Sample Collection & Barcode Tagging</Text>
                    <Text style={styles.timelineStepDescUpcoming}>Painless vein puncture & immediate temperature-safe tube sealing</Text>
                  </View>
                </View>

                {/* STEP 5 */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineDotPending} />
                  <View style={styles.timelineLinePending} />
                  <View style={styles.timelineStepContent}>
                    <Text style={styles.timelineStepTitleUpcoming}>Cold-Chain Dispatch to Central NABL Lab</Text>
                    <Text style={styles.timelineStepDescUpcoming}>Preserved at 2°C - 8°C throughout transit</Text>
                  </View>
                </View>

                {/* STEP 6 */}
                <View style={[styles.timelineStepRow, { paddingBottom: 0 }]}>
                  <View style={styles.timelineDotPending} />
                  <View style={styles.timelineStepContent}>
                    <Text style={styles.timelineStepTitleUpcoming}>Sample Analyzed & Digital Report Uploaded</Text>
                    <Text style={styles.timelineStepDescUpcoming}>Verified by MD Pathologist • Available in app within 6 hours</Text>
                  </View>
                </View>
              </View>

              {/* TESTS INCLUDED & ADDRESS */}
              <View style={styles.trackingDetailsCard}>
                <Text style={styles.trackingCardHeading}>Sample Details & Tests</Text>
                <View style={styles.trackingDetailsRow}>
                  <Ionicons name="flask-outline" size={15} color={colors.primary} />
                  <Text style={styles.trackingDetailsLabel}>Tests:</Text>
                  <Text style={styles.trackingDetailsVal} numberOfLines={2}>
                    {selectedTrackingSample?.doctor?.specialty?.replace('Lab Tests • ', '') ||
                      (selectedTrackingSample?.tests && selectedTrackingSample.tests.map((t) => t.name || t).join(', ')) ||
                      'Comprehensive Complete Blood & Metabolic Profile'}
                  </Text>
                </View>

                <View style={styles.trackingDetailsRow}>
                  <Ionicons name="location-outline" size={15} color={colors.primary} />
                  <Text style={styles.trackingDetailsLabel}>Address:</Text>
                  <Text style={styles.trackingDetailsVal} numberOfLines={2}>
                    {selectedTrackingSample?.doctor?.clinicAddress || 'Doorstep Home Collection, Kuvempunagar, Mysore'}
                  </Text>
                </View>

                <View style={styles.trackingDetailsRow}>
                  <Ionicons name="person-outline" size={15} color={colors.primary} />
                  <Text style={styles.trackingDetailsLabel}>Patient:</Text>
                  <Text style={styles.trackingDetailsVal}>
                    {selectedTrackingSample?.patient?.name || 'Self'}
                  </Text>
                </View>

                <View style={styles.trackingDetailsRow}>
                  <Ionicons name="cash-outline" size={15} color="#059669" />
                  <Text style={styles.trackingDetailsLabel}>Amount:</Text>
                  <Text style={[styles.trackingDetailsVal, { color: '#059669', fontWeight: '800' }]}>
                    ₹{selectedTrackingSample?.paidAmount || 499} ({selectedTrackingSample?.paymentStatus || 'Paid'})
                  </Text>
                </View>
              </View>

              {/* ACTION FOOTER */}
              <View style={styles.trackingFooterActions}>
                <TouchableOpacity
                  style={styles.trackingHelpBtn}
                  onPress={() => Linking.openURL('tel:18001089999')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="headset-outline" size={16} color={colors.primary} />
                  <Text style={styles.trackingHelpBtnText}>Lab Support</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.trackingCloseBtnFilled}
                  onPress={() => setSelectedTrackingSample(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.trackingCloseBtnFilledText}>Back to Bookings</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ====================================================
          PHARMACY MEDICINE ORDER LIVE DELIVERY TRACKING MODAL
      ==================================================== */}
      <Modal
        visible={!!selectedTrackingPharmacy}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTrackingPharmacy(null)}
      >
        <View style={styles.trackingModalOverlay}>
          <View style={styles.trackingModalCard}>
            {/* MODAL HEADER */}
            <View style={styles.trackingHeader}>
              <View style={styles.trackingHeaderLeft}>
                <View style={[styles.trackingHeaderIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="bicycle" size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.trackingModalTitle}>Medicine Delivery Tracking</Text>
                  <Text style={styles.trackingModalSubtitle}>
                    Order #{selectedTrackingPharmacy?.id || 'UNC-7712'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.trackingModalCloseBtn}
                onPress={() => setSelectedTrackingPharmacy(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.trackingScrollContent}>
              {/* LIVE STATUS BANNER */}
              <View style={[styles.liveStatusBanner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <View style={[styles.livePulseCircle, { backgroundColor: '#D97706' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.liveStatusTitle, { color: '#92400E' }]}>Out for Express Delivery</Text>
                  <Text style={[styles.liveStatusEta, { color: '#B45309' }]}>
                    Rider Santosh M. is on the way • ETA: 25 - 35 mins
                  </Text>
                </View>
                <View style={[styles.doorstepOtpBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.doorstepOtpLabel, { color: '#92400E' }]}>DELIVERY PIN</Text>
                  <Text style={[styles.doorstepOtpValue, { color: '#B45309' }]}>9241</Text>
                </View>
              </View>

              {/* RIDER INFO CARD */}
              <View style={styles.trackingPersonCard}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' }}
                  style={styles.trackingPersonAvatar}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.trackingPersonName}>Santosh M.</Text>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                  </View>
                  <Text style={styles.trackingPersonRole}>Unnathi Express Pharmacy Rider • KA-09-EG-4412</Text>
                  <View style={styles.trackingBadgeRow}>
                    <View style={styles.trackingMiniPill}>
                      <Ionicons name="star" size={11} color="#D97706" />
                      <Text style={styles.trackingMiniPillText}>4.95 Rating</Text>
                    </View>
                    <View style={[styles.trackingMiniPill, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="shield-checkmark" size={11} color="#D97706" />
                      <Text style={[styles.trackingMiniPillText, { color: '#92400E' }]}>Contactless & Sanitized</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.trackingCallBtn, { backgroundColor: '#D97706' }]}
                  onPress={() => Linking.openURL('tel:+919876543210')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.trackingCallBtnText}>Call</Text>
                </TouchableOpacity>
              </View>

              {/* LIVE STEP TIMELINE */}
              <View style={styles.timelineCard}>
                <Text style={styles.timelineSectionTitle}>Live Order Progress</Text>

                {/* STEP 1 */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineDotDone}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                  <View style={styles.timelineLineDone} />
                  <View style={styles.timelineStepContent}>
                    <Text style={styles.timelineStepTitle}>Order Placed & Prescription Verified</Text>
                    <Text style={styles.timelineStepDesc}>Verified by Unnathi Pharmacist</Text>
                    <Text style={styles.timelineStepTime}>Today, 10:15 AM</Text>
                  </View>
                </View>

                {/* STEP 2 */}
                <View style={styles.timelineStepRow}>
                  <View style={styles.timelineDotDone}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                  <View style={styles.timelineLineDone} />
                  <View style={styles.timelineStepContent}>
                    <Text style={styles.timelineStepTitle}>Medicines Packed & Tamper-Proof Sealed</Text>
                    <Text style={styles.timelineStepDesc}>From Unnathi Express Pharmacy Hub, Kuvempunagar</Text>
                    <Text style={styles.timelineStepTime}>Today, 10:45 AM</Text>
                  </View>
                </View>

                {/* STEP 3 - ACTIVE */}
                <View style={styles.timelineStepRow}>
                  <View style={[styles.timelineDotActive, { backgroundColor: '#FEF3C7', borderColor: '#D97706' }]}>
                    <View style={[styles.timelineDotInnerPulse, { backgroundColor: '#D97706' }]} />
                  </View>
                  <View style={styles.timelineLinePending} />
                  <View style={styles.timelineStepContent}>
                    <Text style={[styles.timelineStepTitle, { color: '#D97706', fontWeight: '800' }]}>
                      Out for Express Doorstep Delivery
                    </Text>
                    <Text style={styles.timelineStepDesc}>Rider is on bike heading to your location</Text>
                    <Text style={[styles.timelineStepTime, { color: '#D97706', fontWeight: '700' }]}>Live Now • ~25 Mins</Text>
                  </View>
                </View>

                {/* STEP 4 */}
                <View style={[styles.timelineStepRow, { paddingBottom: 0 }]}>
                  <View style={styles.timelineDotPending} />
                  <View style={styles.timelineStepContent}>
                    <Text style={styles.timelineStepTitleUpcoming}>Delivered to Doorstep</Text>
                    <Text style={styles.timelineStepDescUpcoming}>Share PIN 9241 with rider upon arrival</Text>
                  </View>
                </View>
              </View>

              {/* ITEMS IN ORDER & ADDRESS */}
              <View style={styles.trackingDetailsCard}>
                <Text style={styles.trackingCardHeading}>Order Details & Medicines</Text>
                <View style={styles.trackingDetailsRow}>
                  <Ionicons name="medical-outline" size={15} color="#D97706" />
                  <Text style={styles.trackingDetailsLabel}>Items:</Text>
                  <Text style={styles.trackingDetailsVal} numberOfLines={3}>
                    {selectedTrackingPharmacy?.itemsSummary ||
                      (Array.isArray(selectedTrackingPharmacy?.items)
                        ? selectedTrackingPharmacy.items.map((i) => `${i.name} (x${i.quantity || 1})`).join(', ')
                        : 'Prescription Medicines & Wellness Essentials')}
                  </Text>
                </View>

                <View style={styles.trackingDetailsRow}>
                  <Ionicons name="location-outline" size={15} color="#D97706" />
                  <Text style={styles.trackingDetailsLabel}>Delivery Address:</Text>
                  <Text style={styles.trackingDetailsVal} numberOfLines={2}>
                    {selectedTrackingPharmacy?.doctor?.clinicAddress || 'Doorstep Delivery, Kuvempunagar, Mysore'}
                  </Text>
                </View>

                <View style={styles.trackingDetailsRow}>
                  <Ionicons name="cash-outline" size={15} color="#059669" />
                  <Text style={styles.trackingDetailsLabel}>Total Paid:</Text>
                  <Text style={[styles.trackingDetailsVal, { color: '#059669', fontWeight: '800' }]}>
                    ₹{selectedTrackingPharmacy?.paidAmount || selectedTrackingPharmacy?.total || 350} ({selectedTrackingPharmacy?.paymentStatus || 'Paid Online'})
                  </Text>
                </View>
              </View>

              {/* ACTION FOOTER */}
              <View style={styles.trackingFooterActions}>
                <TouchableOpacity
                  style={styles.trackingHelpBtn}
                  onPress={() => Linking.openURL('tel:+918212459905')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="headset-outline" size={16} color={colors.primary} />
                  <Text style={styles.trackingHelpBtnText}>Pharmacy Help</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.trackingCloseBtnFilled, { backgroundColor: '#D97706' }]}
                  onPress={() => setSelectedTrackingPharmacy(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.trackingCloseBtnFilledText}>Back to Bookings</Text>
                </TouchableOpacity>
              </View>
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

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navyBlue,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  newBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  newBookingBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // TABS
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // LIST CONTENT
  listContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },

  // MODERN APPOINTMENT CARD (Matching HomeScreen.web.js standard)
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  appointmentCardCancelled: {
    backgroundColor: '#FAF5F5',
    borderColor: '#FEE2E2',
    opacity: 0.9,
  },

  // CARD HEADER
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  serviceBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tokenPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  tokenPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // CARD BODY (PROVIDER & PRICE ROW)
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatarImg: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  providerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  providerName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  providerSpec: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0D9488',
    marginTop: 1.5,
  },
  providerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  providerLocationText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  cardLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
    marginTop: 5,
  },
  cardLivePillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // PRICE COLUMN
  priceCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 85,
  },
  priceLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  priceValueCancelled: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  pricePaymentTag: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },

  // SCHEDULE & PATIENT STRIP
  scheduleStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    marginBottom: 12,
    gap: 12,
  },
  scheduleStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  scheduleStripDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#CBD5E1',
  },
  scheduleStripText: {
    fontSize: 11.5,
    color: '#475569',
  },
  scheduleStripVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  docAttachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    gap: 3,
    marginLeft: 'auto',
  },
  docAttachBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F766E',
  },

  // CARD ACTIONS BAR
  cardActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  btnPrimaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  btnPrimaryActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
  },
  btnSecondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 5,
  },
  btnSecondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  btnCancelAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 4,
  },
  btnCancelActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },

  // CLEAN LAB BADGE
  cleanLabBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  cleanLabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    flex: 1,
  },
  testsListHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  testsListTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.teal,
  },
  addTestSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  addTestSmallBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.teal,
  },
  testsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  testBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 4,
    maxWidth: '100%',
  },
  testBadgePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  removeTestChipBtn: {
    marginLeft: 2,
    padding: 1,
  },
  emptyAddTestPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.teal,
    gap: 4,
  },
  emptyAddTestPromptText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.teal,
  },

  // MODAL STYLES FOR ADD TEST
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 400,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navyBlue,
  },
  modalSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    paddingVertical: 0,
  },
  modalListContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 20,
    gap: 8,
  },
  modalTestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  modalTestInfo: {
    flex: 1,
  },
  modalTestName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  modalTestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTestPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.teal,
  },
  modalTestMrp: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  modalTestParams: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  modalFastingNotice: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 2,
  },
  modalAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.teal,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  modalAddBtnDisabled: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  modalAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalAddBtnTextDisabled: {
    color: '#059669',
  },

  // EMPTY CONTAINER
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
    lineHeight: 18,
  },
  emptyActionRow: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  emptyPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  emptyPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  emptySecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightTeal,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  emptySecondaryBtnText: {
    color: colors.primary,
    fontSize: 13.5,
    fontWeight: '800',
  },
  // VIDEO CONSULTATION CARD STYLES
  cardVideo: {
    borderColor: '#DDD6FE',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  joinVideoPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    height: 40,
    gap: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  joinVideoPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },

  // ATTACHED DOCUMENTS BAR
  attachedDocsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    gap: 6,
  },
  attachedDocsBarText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
  },

  // UPLOAD & DOC MANAGEMENT MODAL STYLES
  uploadActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  uploadPickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  uploadPickBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  attachedDocsSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 10,
  },
  emptyDocsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  emptyDocsTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptyDocsSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    gap: 10,
  },
  docThumbImg: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  docThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docItemInfo: {
    flex: 1,
  },
  docItemName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  docItemDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  docItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docViewBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F0FDFA',
  },
  docDeleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  doneModalBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  doneModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // PREVIEW MODAL
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  previewFullImg: {
    width: '100%',
    height: '80%',
  },

  // LIVE TRACKING MODALS (SAMPLE COLLECTION & PHARMACY DELIVERY)
  trackingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  trackingModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  trackingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  trackingHeaderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  trackingModalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  trackingModalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },

  // LIVE STATUS BANNER
  liveStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  livePulseCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  liveStatusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  liveStatusEta: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
    fontWeight: '600',
  },
  doorstepOtpBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  doorstepOtpLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  doorstepOtpValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#047857',
    marginTop: 1,
  },

  // PERSON CARD
  trackingPersonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  trackingPersonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  trackingPersonName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  trackingPersonRole: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  trackingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  trackingMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  trackingMiniPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  trackingCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  trackingCallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // TIMELINE CARD
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  timelineStepRow: {
    flexDirection: 'row',
    paddingBottom: 16,
    position: 'relative',
  },
  timelineDotDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    zIndex: 2,
  },
  timelineLineDone: {
    position: 'absolute',
    left: 10,
    top: 22,
    bottom: 0,
    width: 2,
    backgroundColor: '#059669',
  },
  timelineDotActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    zIndex: 2,
  },
  timelineDotInnerPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  timelineLinePending: {
    position: 'absolute',
    left: 10,
    top: 22,
    bottom: 0,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  timelineDotPending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 12,
    zIndex: 2,
  },
  timelineStepContent: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  timelineStepDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  timelineStepTime: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 3,
  },
  timelineStepTitleUpcoming: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  timelineStepDescUpcoming: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },

  // DETAILS CARD
  trackingDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  trackingCardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  trackingDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  trackingDetailsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    width: 70,
  },
  trackingDetailsVal: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },

  // FOOTER ACTIONS
  trackingFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  trackingHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#F0F9FF',
    gap: 6,
  },
  trackingHelpBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  trackingCloseBtnFilled: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingCloseBtnFilledText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  // DESKTOP PAGE SCROLL & BREADCRUMBS
  desktopPageScroll: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 60,
  },
  webBreadcrumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
    marginBottom: 6,
  },
  webBreadcrumbLink: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  webBreadcrumbSlash: {
    fontSize: 12,
    color: '#94A3B8',
  },
  webBreadcrumbCurrent: {
    fontSize: 13,
    color: '#0D9488',
    fontWeight: '700',
  },

  // HERO BANNER (DESKTOP)
  heroBannerDesktop: {
    backgroundColor: '#1E3A8A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  heroContent: {},
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 10,
  },
  heroTagText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 720,
  },
  heroSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  heroSyncBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // HERO STATS ROW
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginTop: 18,
    gap: 8,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroStatItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  heroStatNum: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },

  // MAIN LAYOUT (DESKTOP)
  mainLayoutWrapDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    width: '100%',
  },

  // LEFT COLUMN: FILTER SIDEBAR (DESKTOP)
  desktopFilterSidebarCol: {
    width: 290,
    flexShrink: 0,
  },
  filterSidebarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 20,
      },
    }),
  },
  filterSidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  filterSidebarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSidebarTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  filterResetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  filterResetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterSection: {
    marginBottom: 14,
  },
  filterSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  filterItemsList: {
    gap: 4,
  },
  filterItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterItemBtnActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  filterItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  filterItemIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  filterItemTextActive: {
    fontWeight: '800',
    color: '#0F766E',
  },
  filterCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  filterCountBadgeActive: {
    backgroundColor: '#0D9488',
  },
  filterCountBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  filterCountBadgeTextActive: {
    color: '#FFFFFF',
  },
  filterSidebarDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  quickCareRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickCareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
  },
  quickCareBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  supportBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 10,
  },
  supportBoxTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F766E',
  },
  supportBoxSub: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
    marginBottom: 8,
  },
  supportCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  supportCallBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
    paddingTop: 4,
  },
  secureBadgeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },

  // RIGHT COLUMN: MAIN APPOINTMENTS CONTENT (DESKTOP)
  desktopMainCol: {
    flex: 1,
    minWidth: 0,
  },
  tabSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  tabSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tabSummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    gap: 5,
  },
  activeFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  tabSummaryCount: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  cardsListWrap: {
    gap: 14,
  },
});

export default BookingsScreen;