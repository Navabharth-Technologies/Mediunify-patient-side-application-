import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_LAB_BOOKINGS } from './labTestData';
import { INITIAL_RADIOLOGY_BOOKINGS } from './radiologyCatalogData';
import {
  generateRealtimeSeedAppointments,
  getUserTimezone,
} from '../utils/appointmentDateUtils';

/**
 * MediUnify Central Patient Dashboard Data Architecture
 * Structured for logged-in patient and their family members.
 * Easy drop-in replacement for MediUnify REST/GraphQL APIs.
 */

// Default mock patient profile
export const DEFAULT_PATIENT = {
  id: 'patient-primary-001',
  name: 'Hemanth Gowda',
  email: 'hemanth.gowda@example.com',
  phone: '+91 97414 22544',
  uhid: 'MU-84920',
  dob: '1998-05-12',
  age: 28,
  gender: 'Male',
  bloodGroup: 'O+ Positive',
  address: {
    street: 'House #42, 3rd Main, A-Block, Kuvempunagar',
    city: 'Mysuru',
    state: 'Karnataka',
    pincode: '570023',
  },
  emergencyContact: {
    name: 'Priya Gowda',
    relation: 'Spouse',
    phone: '+91 98450 11223',
  },
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
};

// Family Members for Logged-In Patient Account
export const FAMILY_MEMBERS = [
  { id: 'self', name: 'Hemanth Gowda', relation: 'Self', age: 28, gender: 'Male', bloodGroup: 'O+' },
  { id: 'fam-father', name: 'Ramesh Gowda', relation: 'Father', age: 59, gender: 'Male', bloodGroup: 'O+' },
  { id: 'fam-mother', name: 'Meena Gowda', relation: 'Mother', age: 56, gender: 'Female', bloodGroup: 'A+' },
  { id: 'fam-brother', name: 'Suresh Gowda', relation: 'Brother', age: 24, gender: 'Male', bloodGroup: 'O+' },
  { id: 'fam-spouse', name: 'Priya Gowda', relation: 'Spouse', age: 27, gender: 'Female', bloodGroup: 'B+' },
  { id: 'fam-son', name: 'Aarav Gowda', relation: 'Son', age: 6, gender: 'Male', bloodGroup: 'O+' },
];

// Physical Appointments (Clinics, Hospitals, Diagnostic Centers - STRICTLY PHYSICAL)
// Dynamically initialized using real-time system date calculations and local timezone
export const INITIAL_PHYSICAL_APPOINTMENTS = generateRealtimeSeedAppointments();

// Currently Booked Tests (Active / Scheduled / In-Progress Tests - Laboratory & Radiology)
export const INITIAL_BOOKED_TESTS = [
  {
    id: 'BOOKED-TEST-101',
    bookingRef: 'BK-RAD-98124',
    bookingType: 'Radiology',
    testName: '3T MRI Brain with Contrast & Neuro-Vascular Screening',
    modality: 'Radiology & Scans',
    modalityType: 'MRI Scan',
    testCategory: 'Radiology & Scans',
    categoryLabel: 'MRI Scan',
    testType: 'Centre Visit',
    centerName: 'Unnathi Advanced Diagnostics & 3T MRI Centre',
    department: 'Department of Radiology & Neuro-Imaging',
    location: 'Kuvempunagar, Mysuru',
    address: 'Kuvempunagar Diagnostic Hub, Mysuru 570023',
    appointmentDate: 'Tomorrow, Oct 01, 2026',
    timeSlot: '10:30 AM - 11:30 AM',
    patientId: 'self',
    patientName: 'Hemanth Gowda (Self)',
    familyMemberName: null,
    age: 28,
    gender: 'Male',
    uhid: 'MU-84920',
    status: 'Scan Scheduled',
    statusStep: 2,
    badgeColor: '#1E3A8A',
    price: 7500,
    amountPaid: 7500,
    paymentStatus: 'Paid Online via UPI',
    bookingDate: '2026-09-29',
    instructions: 'Fast for 4 hours prior to contrast administration. Remove all metallic jewelry, watches, keys, and belt before entering the 3T MRI suite.',
    doctorPrescription: 'Referred by Dr. Rajesh Iyer (Neuro-Ortho)',
    contactPhone: '+91 821 245 9901',
    canReschedule: true,
    canCancel: true,
  },
  {
    id: 'BOOKED-TEST-102',
    bookingRef: 'BK-LAB-77401',
    bookingType: 'Lab Package',
    testName: 'Comprehensive Full Body Platinum Health Checkup (85+ Tests)',
    modality: 'Pathology & Blood',
    modalityType: 'Health Package',
    testCategory: 'Pathology & Blood',
    categoryLabel: 'Health Package',
    testType: 'Home Sample Collection',
    centerName: 'Unnathi Central Pathology & Diagnostic Center',
    department: 'Automated Clinical Pathology',
    location: 'Kuvempunagar, Mysuru',
    address: 'Sample Collection at: House #42, 3rd Main, A-Block, Kuvempunagar, Mysuru 570023',
    appointmentDate: 'Tomorrow, Oct 01, 2026',
    timeSlot: '07:30 AM - 08:30 AM',
    patientId: 'self',
    patientName: 'Hemanth Gowda (Self)',
    familyMemberName: null,
    age: 28,
    gender: 'Male',
    uhid: 'MU-84920',
    status: 'Sample Collection Scheduled',
    statusStep: 2,
    badgeColor: '#00B894',
    price: 1899,
    amountPaid: 1899,
    paymentStatus: 'Paid Online via UPI',
    bookingDate: '2026-09-30',
    instructions: 'Strict 10-12 hours fasting required. Plain water permitted. Phlebotomist will arrive with barcoded sterile vacutainers.',
    phlebotomist: {
      name: 'Muralidhar Rao (Senior Phlebotomist)',
      phone: '+91 98452 33110',
      vehicle: 'Two-Wheeler (KA-09-ER-5521)',
      eta: '12 mins',
      vaccinationStatus: 'Fully Vaccinated',
    },
    doctorPrescription: 'Annual Preventative Health Assessment',
    contactPhone: '+91 821 245 9901',
    canReschedule: true,
    canCancel: false,
  },
  {
    id: 'BOOKED-TEST-103',
    bookingRef: 'BK-RAD-64512',
    bookingType: 'Radiology',
    testName: 'High-Resolution Computed Tomography (HRCT) Chest',
    modality: 'Radiology & Scans',
    modalityType: 'CT Scan',
    testCategory: 'Radiology & Scans',
    categoryLabel: 'CT Scan',
    testType: 'Centre Visit',
    centerName: 'Unnathi Imaging & Multi-Slice CT Centre',
    department: 'Department of Diagnostic Imaging & CT',
    location: 'Kuvempunagar, Mysuru',
    address: 'Kuvempunagar Diagnostic Hub, Mysuru 570023',
    appointmentDate: 'Friday, Oct 02, 2026',
    timeSlot: '02:00 PM - 02:45 PM',
    patientId: 'fam-mother',
    patientName: 'Meena Gowda (Mother)',
    familyMemberName: 'Meena Gowda',
    age: 58,
    gender: 'Female',
    uhid: 'MU-84923',
    status: 'Scan Scheduled',
    statusStep: 2,
    badgeColor: '#00C2CB',
    price: 3200,
    amountPaid: 3200,
    paymentStatus: 'Paid Online via UPI',
    bookingDate: '2026-09-29',
    instructions: 'Wear comfortable loose cotton clothing with no metal zippers or buttons. Bring past chest X-rays and referral slips.',
    doctorPrescription: 'Referred by Dr. Anita Sharma (Senior Cardiologist)',
    contactPhone: '+91 821 245 9901',
    canReschedule: true,
    canCancel: true,
  },
  {
    id: 'BOOKED-TEST-104',
    bookingRef: 'BK-RAD-52190',
    bookingType: 'Radiology',
    testName: 'Ultrasound Whole Abdomen & Pelvis (USG)',
    modality: 'Radiology & Scans',
    modalityType: 'Ultrasound',
    testCategory: 'Radiology & Scans',
    categoryLabel: 'Ultrasound (USG)',
    testType: 'Centre Visit',
    centerName: 'Unnathi Diagnostic & Sonography Hub',
    department: 'Sonography & Non-Invasive Diagnostics',
    location: 'Kuvempunagar, Mysuru',
    address: 'Kuvempunagar Diagnostic Hub, Mysuru 570023',
    appointmentDate: 'Saturday, Oct 03, 2026',
    timeSlot: '11:15 AM - 11:45 AM',
    patientId: 'fam-spouse',
    patientName: 'Priya Gowda (Spouse)',
    familyMemberName: 'Priya Gowda',
    age: 27,
    gender: 'Female',
    uhid: 'MU-84921',
    status: 'Scan Scheduled',
    statusStep: 2,
    badgeColor: '#00C2CB',
    price: 1450,
    amountPaid: 1450,
    paymentStatus: 'Paid Online via UPI',
    bookingDate: '2026-09-29',
    instructions: 'Full bladder required for pelvic evaluation. Please drink 1 litre of water 1 hour prior to scan without voiding.',
    doctorPrescription: 'Routine Abdominal Pelvic Ultrasound Review',
    contactPhone: '+91 821 245 9901',
    canReschedule: true,
    canCancel: true,
  },
  {
    id: 'BOOKED-TEST-105',
    bookingRef: 'BK-LAB-83210',
    bookingType: 'Lab Test',
    testName: 'HbA1c Glycated Hemoglobin & Complete Lipid Profile',
    modality: 'Pathology & Blood',
    modalityType: 'Blood Test',
    testCategory: 'Pathology & Blood',
    categoryLabel: 'Pathology',
    testType: 'Home Sample Collection',
    centerName: 'Unnathi Central Diagnostic Laboratory',
    department: 'Automated Biochemistry & Pathology',
    location: 'Kuvempunagar, Mysuru',
    address: 'Sample Collection at: House #42, 3rd Main, A-Block, Kuvempunagar, Mysuru 570023',
    appointmentDate: 'Monday, Oct 05, 2026',
    timeSlot: '08:00 AM - 09:00 AM',
    patientId: 'self',
    patientName: 'Hemanth Gowda (Self)',
    familyMemberName: null,
    age: 28,
    gender: 'Male',
    uhid: 'MU-84925',
    status: 'Sample Collection Scheduled',
    statusStep: 2,
    badgeColor: '#00B894',
    price: 950,
    amountPaid: 950,
    paymentStatus: 'Paid Online via UPI',
    bookingDate: '2026-09-30',
    instructions: '10-12 hours fasting required. Water intake allowed.',
    doctorPrescription: 'Routine Preventive Metabolic Panel',
    contactPhone: '+91 97414 22544',
    canReschedule: true,
    canCancel: true,
  },
  {
    id: 'BOOKED-TEST-106',
    bookingRef: 'BK-RAD-71044',
    bookingType: 'Radiology',
    testName: 'Digital X-Ray Chest PA View & Spine Screening',
    modality: 'Radiology & Scans',
    modalityType: 'Digital X-Ray',
    testCategory: 'Radiology & Scans',
    categoryLabel: 'Digital X-Ray',
    testType: 'Centre Visit',
    centerName: 'Unnathi Central Radiology Diagnostic Centre',
    department: 'Department of Diagnostic Radiography',
    location: 'Kuvempunagar, Mysuru',
    address: 'Kuvempunagar Diagnostic Hub, Mysuru 570023',
    appointmentDate: 'Wednesday, Oct 07, 2026',
    timeSlot: '11:00 AM - 11:30 AM',
    patientId: 'self',
    patientName: 'Hemanth Gowda (Self)',
    familyMemberName: null,
    age: 28,
    gender: 'Male',
    uhid: 'MU-84926',
    status: 'Scan Scheduled',
    statusStep: 2,
    badgeColor: '#1E3A8A',
    price: 850,
    amountPaid: 850,
    paymentStatus: 'Paid Online via UPI',
    bookingDate: '2026-09-29',
    instructions: 'Remove all metallic objects, necklaces and buttons around the chest area.',
    doctorPrescription: 'Orthopedic & Thoracic Radiography Referral',
    contactPhone: '+91 821 245 9901',
    canReschedule: true,
    canCancel: true,
  },
  {
    id: 'BOOKED-TEST-107',
    bookingRef: 'BK-LAB-91044',
    bookingType: 'Lab Test',
    testName: 'Thyroid Profile Comprehensive (Total T3, Total T4, Ultrasensitive TSH)',
    modality: 'Pathology & Blood',
    modalityType: 'Blood Test',
    testCategory: 'Pathology & Blood',
    categoryLabel: 'Pathology',
    testType: 'Home Sample Collection',
    centerName: 'Unnathi Central Pathology & Diagnostic Center',
    department: 'Department of Automated Endocrinology',
    location: 'Kuvempunagar, Mysuru',
    address: 'Sample Collection at: House #42, 3rd Main, A-Block, Kuvempunagar, Mysuru 570023',
    appointmentDate: 'Thursday, Oct 08, 2026',
    timeSlot: '08:00 AM - 09:00 AM',
    patientId: 'self',
    patientName: 'Hemanth Gowda (Self)',
    familyMemberName: null,
    age: 28,
    gender: 'Male',
    uhid: 'MU-84927',
    status: 'Sample Collection Scheduled',
    statusStep: 2,
    badgeColor: '#00B894',
    price: 650,
    amountPaid: 650,
    paymentStatus: 'Paid Online via UPI',
    bookingDate: '2026-09-30',
    instructions: 'Fasting of 10-12 hours required prior to sample collection. Water is permitted.',
    doctorPrescription: 'Thyroid Function Screening Referral',
    contactPhone: '+91 821 245 9901',
    canReschedule: true,
    canCancel: true,
    phlebotomist: {
      name: 'Raghuveer M. (Certified Phlebotomist)',
      phone: '+91 98451 77210',
      vehicle: 'Two-Wheeler (KA-09-ER-5521)',
      eta: 'Scheduled',
    },
  },
  {
    id: 'BOOKED-TEST-108',
    bookingRef: 'BK-LAB-92088',
    bookingType: 'Lab Test',
    testName: 'Complete Vitamin Deficiency Screening (Vitamin D 25-OH + Vitamin B12)',
    modality: 'Pathology & Blood',
    modalityType: 'Blood Test',
    testCategory: 'Pathology & Blood',
    categoryLabel: 'Pathology',
    testType: 'Home Sample Collection',
    centerName: 'Unnathi Certified Diagnostics',
    department: 'Biochemistry & Clinical Pathology',
    location: 'Kuvempunagar, Mysuru',
    address: 'Sample Collection at: House #42, 3rd Main, A-Block, Kuvempunagar, Mysuru 570023',
    appointmentDate: 'Friday, Oct 09, 2026',
    timeSlot: '07:30 AM - 08:30 AM',
    patientId: 'self',
    patientName: 'Hemanth Gowda (Self)',
    familyMemberName: null,
    age: 28,
    gender: 'Male',
    uhid: 'MU-84928',
    status: 'Sample Collection Scheduled',
    statusStep: 2,
    badgeColor: '#00B894',
    price: 1250,
    amountPaid: 1250,
    paymentStatus: 'Paid Online via UPI',
    bookingDate: '2026-09-30',
    instructions: 'No fasting strictly necessary. Drink adequate water before blood collection.',
    doctorPrescription: 'Preventive Micronutrient Assessment Referral',
    contactPhone: '+91 821 245 9901',
    canReschedule: true,
    canCancel: true,
    phlebotomist: {
      name: 'Muralidhar Rao (Senior Phlebotomist)',
      phone: '+91 98452 33110',
      vehicle: 'Two-Wheeler (KA-09-ER-5521)',
      eta: 'Scheduled',
    },
  },
];

// Laboratory & Diagnostic Test Reports (Pathology + Radiology & Imaging)
export const INITIAL_TEST_REPORTS = [
  {
    id: 'TEST-RPT-901',
    testName: 'Complete Blood Count (CBC) with ESR',
    category: 'Pathology & Blood',
    modality: 'Pathology & Blood',
    modalityType: 'Hematology',
    labName: 'Neuberg Anand Reference Laboratories',
    testDate: '2026-09-24',
    reportDate: '2026-09-24',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    status: 'Completed',
    reportAvailable: true,
    tat: 'Ready',
    sampleType: 'Whole Blood (EDTA)',
    normalStatus: 'Normal',
    doctorNotes: 'All hematological parameters within healthy biological reference intervals.',
    parameters: [
      { name: 'Hemoglobin (Hb)', value: '14.8', unit: 'g/dL', normalRange: '13.0 - 17.0', status: 'Normal' },
      { name: 'Total WBC Count', value: '7,400', unit: 'cells/cu.mm', normalRange: '4,000 - 11,000', status: 'Normal' },
      { name: 'Platelet Count', value: '2.4', unit: 'lakh/cu.mm', normalRange: '1.5 - 4.5', status: 'Normal' },
      { name: 'RBC Count', value: '4.9', unit: 'million/cu.mm', normalRange: '4.5 - 5.5', status: 'Normal' },
      { name: 'ESR (Westergren)', value: '12', unit: 'mm/1st hr', normalRange: '0 - 15', status: 'Normal' },
    ],
    fileSize: '1.4 MB (Certified PDF)',
  },
  {
    id: 'TEST-RPT-902',
    testName: 'Lipid Profile - Comprehensive (Cholesterol + Triglycerides)',
    category: 'Pathology & Blood',
    modality: 'Pathology & Blood',
    modalityType: 'Biochemistry',
    labName: 'MediUnify Central Diagnostic Lab',
    testDate: '2026-09-24',
    reportDate: '2026-09-25',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    status: 'Completed',
    reportAvailable: true,
    tat: 'Ready',
    sampleType: 'Serum (Fasting 12 hrs)',
    normalStatus: 'Borderline',
    doctorNotes: 'Mild elevation in total cholesterol. Recommended dietary modifications and 30 mins brisk walking daily.',
    parameters: [
      { name: 'Total Cholesterol', value: '205', unit: 'mg/dL', normalRange: '< 200', status: 'High' },
      { name: 'HDL (Good Cholesterol)', value: '48', unit: 'mg/dL', normalRange: '> 40', status: 'Normal' },
      { name: 'LDL (Bad Cholesterol)', value: '128', unit: 'mg/dL', normalRange: '< 100', status: 'Borderline' },
      { name: 'Triglycerides', value: '162', unit: 'mg/dL', normalRange: '< 150', status: 'Borderline' },
    ],
    fileSize: '1.8 MB (Certified PDF)',
  },
  {
    id: 'TEST-RPT-907',
    testName: 'Digital Chest X-Ray PA View (High Definition)',
    category: 'Radiology & Scans',
    modality: 'Radiology & Scans',
    modalityType: 'Digital X-Ray',
    labName: 'Neuberg Anand Reference Imaging Centre',
    testDate: '2026-09-22',
    reportDate: '2026-09-22',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    status: 'Completed',
    reportAvailable: true,
    tat: 'Ready',
    sampleType: 'Digital Radiography (PA View)',
    normalStatus: 'Normal',
    doctorNotes: 'Reporting Radiologist: Dr. Suresh Varma, MD (Radiology). Normal thoracic anatomy.',
    findings: 'Both lung fields are clear and well-aerated. No evidence of active consolidation, infiltrate, or pleural effusion. Cardiothoracic ratio is normal (0.46). Both costophrenic angles are acute. Visualized bony cage and soft tissue structures are unremarkable.',
    impression: 'NORMAL CHEST RADIOGRAPH (PA VIEW). No active cardiopulmonary pathology detected.',
    parameters: [
      { name: 'Lung Aeration', value: 'Clear Bilaterally', unit: '', normalRange: 'Clear', status: 'Normal' },
      { name: 'Cardiothoracic Ratio', value: '0.46', unit: '', normalRange: '< 0.50', status: 'Normal' },
      { name: 'Costophrenic Angles', value: 'Sharp & Intact', unit: '', normalRange: 'Sharp', status: 'Normal' },
      { name: 'Hilar Shadows', value: 'Normal Prominence', unit: '', normalRange: 'Normal', status: 'Normal' },
      { name: 'Bony Thorax', value: 'Normal Morphology', unit: '', normalRange: 'Intact', status: 'Normal' },
    ],
    filmAvailable: true,
    fileSize: '4.2 MB (DICOM / High-Res PDF)',
  },
  {
    id: 'TEST-RPT-908',
    testName: '3T MRI Lumbar Spine (Magnetic Resonance Imaging)',
    category: 'Radiology & Scans',
    modality: 'Radiology & Scans',
    modalityType: '3T MRI Scan',
    labName: 'Manipal Hospital Advanced Imaging Suites',
    testDate: '2026-09-18',
    reportDate: '2026-09-19',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    status: 'Completed',
    reportAvailable: true,
    tat: 'Ready',
    sampleType: '3 Tesla High-Field MRI Scan',
    normalStatus: 'Borderline',
    doctorNotes: 'Reporting Radiologist: Dr. Kavita Nair, DMRD, DNB. Correlate with clinical lower back symptoms.',
    findings: 'Lumbar lordosis is maintained. Vertebral body heights and alignment are normal. Mild broad-based posterior disc bulge noted at L4-L5 level causing minimal indentation on the anterior thecal sac without significant neural foraminal narrowing. Spinal cord terminates normally at L1 level (Conus Medullaris).',
    impression: 'MILD POSTERIOR DISC BULGE AT L4-L5 WITHOUT SIGNIFICANT NERVE ROOT COMPRESSION. Conservative management advised.',
    parameters: [
      { name: 'L4-L5 Disc Bulge', value: 'Mild Posterior (2.2 mm)', unit: 'mm', normalRange: 'Nil', status: 'Borderline' },
      { name: 'Spinal Canal Diameter', value: '14.2 mm (Adequate)', unit: 'mm', normalRange: '> 12 mm', status: 'Normal' },
      { name: 'Thecal Sac Indentation', value: 'Minimal Anterior', unit: '', normalRange: 'Nil', status: 'Normal' },
      { name: 'Conus Medullaris', value: 'Normal Signal at L1', unit: '', normalRange: 'L1 level', status: 'Normal' },
    ],
    filmAvailable: true,
    fileSize: '8.6 MB (PACS / Certified PDF)',
  },
  {
    id: 'TEST-RPT-909',
    testName: 'Digital Ultrasound (USG) Whole Abdomen & Pelvis',
    category: 'Radiology & Scans',
    modality: 'Radiology & Scans',
    modalityType: 'Ultrasound (USG)',
    labName: 'Aster CMI Hospital - Department of Ultrasonography',
    testDate: '2026-09-14',
    reportDate: '2026-09-14',
    patientId: 'fam-spouse',
    patientName: 'Priya Kumar (Spouse)',
    status: 'Completed',
    reportAvailable: true,
    tat: 'Ready',
    sampleType: 'Real-Time High-Resolution Ultrasound',
    normalStatus: 'Normal',
    doctorNotes: 'Reporting Radiologist: Dr. Suresh Varma, MD. Normal whole abdomen sonogram.',
    findings: 'Liver is normal in size (13.2 cm) with homogeneous echotexture. Gall bladder is well distended, lumen is clear without calculi. Spleen and pancreas are normal. Both kidneys are normal in size, shape, and cortical echogenicity without hydronephrosis. Urinary bladder has smooth regular walls. Uterus and adnexal regions are unremarkable.',
    impression: 'NORMAL ULTRASOUND EXAMINATION OF WHOLE ABDOMEN AND PELVIC CAVITY.',
    parameters: [
      { name: 'Liver Span', value: '13.2', unit: 'cm', normalRange: '11.0 - 15.0', status: 'Normal' },
      { name: 'Gall Bladder Wall', value: '2.1', unit: 'mm', normalRange: '< 3.0', status: 'Normal' },
      { name: 'Right Kidney Length', value: '10.4', unit: 'cm', normalRange: '9.0 - 12.0', status: 'Normal' },
      { name: 'Left Kidney Length', value: '10.8', unit: 'cm', normalRange: '9.0 - 12.0', status: 'Normal' },
      { name: 'Spleen Length', value: '9.6', unit: 'cm', normalRange: '< 12.0', status: 'Normal' },
    ],
    filmAvailable: true,
    fileSize: '5.1 MB (Ultrasound Print / PDF)',
  },
  {
    id: 'TEST-RPT-910',
    testName: '12-Lead Electrocardiogram (ECG / EKG) Analysis',
    category: 'Radiology & Scans',
    modality: 'Radiology & Scans',
    modalityType: 'ECG / Cardiology',
    labName: 'Aster CMI Hospital Cardiology OPD',
    testDate: '2026-09-24',
    reportDate: '2026-09-24',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    status: 'Completed',
    reportAvailable: true,
    tat: 'Ready',
    sampleType: 'Digital 12-Lead Vector ECG Trace',
    normalStatus: 'Normal',
    doctorNotes: 'Reporting Cardiologist: Dr. Anita Sharma, MD, DM. Normal sinus rhythm.',
    findings: 'Normal sinus rhythm at 72 bpm. Normal PR interval (150 ms) and QRS duration (88 ms). Normal QT / QTc (390/420 ms). Normal frontal plane axis (+55 deg). No pathological Q waves or ST-T wave changes.',
    impression: 'NORMAL 12-LEAD RESTING ELECTROCARDIOGRAM. Within normal physiological limits.',
    parameters: [
      { name: 'Heart Rate', value: '72', unit: 'bpm', normalRange: '60 - 100', status: 'Normal' },
      { name: 'PR Interval', value: '150', unit: 'ms', normalRange: '120 - 200', status: 'Normal' },
      { name: 'QRS Duration', value: '88', unit: 'ms', normalRange: '80 - 110', status: 'Normal' },
      { name: 'QTc Interval', value: '420', unit: 'ms', normalRange: '< 450', status: 'Normal' },
    ],
    filmAvailable: true,
    fileSize: '2.2 MB (Certified ECG Trace)',
  },
  {
    id: 'TEST-RPT-903',
    testName: 'Thyroid Function Test (Total T3, Total T4, Ultrasensitive TSH)',
    category: 'Pathology & Blood',
    modality: 'Pathology & Blood',
    modalityType: 'Endocrinology',
    labName: 'Apollo Diagnostics Centre',
    testDate: '2026-09-18',
    reportDate: '2026-09-19',
    patientId: 'fam-spouse',
    patientName: 'Priya Kumar (Spouse)',
    status: 'Completed',
    reportAvailable: true,
    tat: 'Ready',
    sampleType: 'Serum',
    normalStatus: 'Normal',
    doctorNotes: 'Thyroid hormone levels euthyroid and well maintained.',
    parameters: [
      { name: 'TSH (Ultrasensitive)', value: '2.35', unit: 'µIU/mL', normalRange: '0.35 - 4.94', status: 'Normal' },
      { name: 'Total T3', value: '1.18', unit: 'ng/mL', normalRange: '0.80 - 2.00', status: 'Normal' },
      { name: 'Total T4', value: '8.4', unit: 'µg/dL', normalRange: '5.1 - 14.1', status: 'Normal' },
    ],
    fileSize: '1.2 MB (Certified PDF)',
  },
  {
    id: 'TEST-RPT-904',
    testName: 'HbA1c & Average Estimated Blood Glucose',
    category: 'Pathology & Blood',
    modality: 'Pathology & Blood',
    modalityType: 'Diabetes Care',
    labName: 'Neuberg Anand Reference Laboratories',
    testDate: '2026-09-15',
    reportDate: '2026-09-15',
    patientId: 'fam-mother',
    patientName: 'Meena Kumar (Mother)',
    status: 'Completed',
    reportAvailable: true,
    tat: 'Ready',
    sampleType: 'Whole Blood (EDTA)',
    normalStatus: 'Controlled',
    doctorNotes: 'Good glycemic control maintained. Continue current medication and dietary routine.',
    parameters: [
      { name: 'HbA1c (Glycated Hb)', value: '6.4', unit: '%', normalRange: '< 5.7 (Normal), 5.7 - 6.4 (Prediabetes)', status: 'Prediabetes' },
      { name: 'Estimated Average Glucose', value: '137', unit: 'mg/dL', normalRange: '< 126', status: 'Borderline' },
    ],
    fileSize: '1.1 MB (Certified PDF)',
  },
  {
    id: 'TEST-RPT-905',
    testName: 'Pediatric Iron Profile & Serum Ferritin',
    category: 'Pathology & Blood',
    modality: 'Pathology & Blood',
    modalityType: 'Pediatric Lab',
    labName: 'MediUnify Central Diagnostic Lab',
    testDate: '2026-09-10',
    reportDate: '2026-09-11',
    patientId: 'fam-son',
    patientName: 'Aarav Kumar (Son)',
    status: 'Completed',
    reportAvailable: true,
    tat: 'Ready',
    sampleType: 'Serum',
    normalStatus: 'Normal',
    doctorNotes: 'Normal pediatric iron stores. No signs of anemia.',
    parameters: [
      { name: 'Serum Ferritin', value: '54', unit: 'ng/mL', normalRange: '20 - 200', status: 'Normal' },
      { name: 'Serum Iron', value: '78', unit: 'µg/dL', normalRange: '50 - 120', status: 'Normal' },
    ],
    fileSize: '950 KB (Certified PDF)',
  },
  {
    id: 'TEST-RPT-906',
    testName: 'Vitamin D (25-OH) & Vitamin B12 Duo Assessment',
    category: 'Pathology & Blood',
    modality: 'Pathology & Blood',
    modalityType: 'Nutritional Immunoassay',
    labName: 'Metropolis Health Services',
    testDate: '2026-09-28',
    reportDate: 'Expected Today by 07:00 PM',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    status: 'In Progress',
    reportAvailable: false,
    tat: 'Processing at Central Lab',
    sampleType: 'Serum Sample (Collected 08:30 AM)',
    normalStatus: 'Pending',
    parameters: [],
    doctorNotes: 'Sample received and undergoing automated chemiluminescent microparticle immunoassay.',
    fileSize: 'Processing',
  },
];

// Medicine Orders
export const INITIAL_MEDICINE_ORDERS = [
  {
    id: 'MED-94021',
    orderDate: '2026-09-25',
    expectedDelivery: '2026-09-27 (Delivered)',
    deliveredDate: '2026-09-27',
    pharmacyName: 'Apollo Pharmacy - Indiranagar Hub',
    pharmacyPhone: '+91 80 4123 9988',
    status: 'Delivered', // 'Order Placed' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Return Requested' | 'Returned'
    isReturnEligible: true, // Eligible within 7 days of delivery
    returnRequested: false,
    returnStatus: null,
    totalAmount: 920,
    paymentStatus: 'Paid Online via UPI',
    deliveryAddress: '#42, 3rd Cross, Indiranagar, Bengaluru, 560038',
    trackingStep: 4, // 0: Placed, 1: Confirmed, 2: Preparing, 3: Out for Delivery, 4: Delivered
    trackingHistory: [
      { title: 'Order Placed', time: 'Sep 25, 10:15 AM', done: true },
      { title: 'Prescription Verified & Confirmed', time: 'Sep 25, 11:00 AM', done: true },
      { title: 'Packed & Dispatched from Pharmacy', time: 'Sep 26, 09:30 AM', done: true },
      { title: 'Out for Delivery', time: 'Sep 27, 02:00 PM', done: true },
      { title: 'Delivered to Doorstep', time: 'Sep 27, 04:45 PM', done: true },
    ],
    items: [
      { id: 'itm-1', name: 'Augmentin 625 Duo Tablet', strength: '625 mg', quantity: 2, price: 210, total: 420, rxRequired: true },
      { id: 'itm-2', name: 'Pantocid 40 DSR Capsule', strength: '40 mg', quantity: 2, price: 160, total: 320, rxRequired: false },
      { id: 'itm-3', name: 'Dolo 650 Paracetamol', strength: '650 mg', quantity: 3, price: 35, total: 105, rxRequired: false },
    ],
    prescriptionAttached: 'Prescription_DrAnitaSharma_Sep24.pdf',
    invoiceNumber: 'INV-APL-2026-94021',
  },
  {
    id: 'MED-93118',
    orderDate: '2026-09-28',
    expectedDelivery: 'Today by 06:30 PM',
    deliveredDate: null,
    pharmacyName: 'MediUnify Express Pharmacy Delivery',
    pharmacyPhone: '+91 80 8899 4433',
    status: 'Out for Delivery',
    isReturnEligible: false,
    returnRequested: false,
    returnStatus: null,
    totalAmount: 640,
    paymentStatus: 'Paid Online via GPay',
    deliveryAddress: '#42, 3rd Cross, Indiranagar, Bengaluru, 560038',
    trackingStep: 3,
    trackingHistory: [
      { title: 'Order Placed', time: 'Sep 28, 08:30 AM', done: true },
      { title: 'Confirmed by Registered Pharmacist', time: 'Sep 28, 09:15 AM', done: true },
      { title: 'Prepared & Sealed in MediUnify Pack', time: 'Sep 28, 11:00 AM', done: true },
      { title: 'Out for Delivery with Courier Rider (Manjunath)', time: 'Sep 28, 02:40 PM', done: true },
      { title: 'Delivered', time: 'Expected by 06:30 PM', done: false },
    ],
    items: [
      { id: 'itm-4', name: 'Shelcal 500 Calcium & Vitamin D3', strength: '500 mg', quantity: 1, price: 145, total: 145, rxRequired: false },
      { id: 'itm-5', name: 'Neurobion Forte Tablet', strength: 'Standard', quantity: 2, price: 48, total: 96, rxRequired: false },
      { id: 'itm-6', name: 'Telma 40 Anti-hypertensive', strength: '40 mg', quantity: 2, price: 185, total: 370, rxRequired: true },
    ],
    prescriptionAttached: 'Prescription_ManipalHospital_Sep20.pdf',
    invoiceNumber: 'INV-MED-2026-93118',
  },
  {
    id: 'MED-91204',
    orderDate: '2026-09-10',
    expectedDelivery: '2026-09-12 (Delivered)',
    deliveredDate: '2026-09-12',
    pharmacyName: 'MedPlus Pharmacy - Tasker Town',
    pharmacyPhone: '+91 80 2345 6789',
    status: 'Return Requested',
    isReturnEligible: false,
    returnRequested: true,
    returnReason: 'Damaged packaging on arrival',
    returnRemarks: 'Outer foil of one blister strip was torn in transit.',
    returnStatus: 'Return Under Review (Pickup scheduled within 24h)',
    totalAmount: 480,
    paymentStatus: 'Paid Online via Cards',
    deliveryAddress: '#42, 3rd Cross, Indiranagar, Bengaluru, 560038',
    trackingStep: 4,
    items: [
      { id: 'itm-7', name: 'Voveran SR 100mg Pain Relief', strength: '100 mg', quantity: 3, price: 160, total: 480, rxRequired: true },
    ],
    invoiceNumber: 'INV-MED-2026-91204',
  },
  {
    id: 'MED-89100',
    orderDate: '2026-08-15',
    expectedDelivery: '2026-08-17 (Delivered)',
    deliveredDate: '2026-08-17',
    pharmacyName: 'Apollo Pharmacy - Indiranagar',
    pharmacyPhone: '+91 80 4123 9988',
    status: 'Delivered',
    isReturnEligible: false, // Window expired (> 7 days)
    returnRequested: false,
    totalAmount: 1150,
    paymentStatus: 'Paid via NetBanking',
    deliveryAddress: '#42, 3rd Cross, Indiranagar, Bengaluru, 560038',
    trackingStep: 4,
    items: [
      { id: 'itm-8', name: 'Glycomet GP 1 Forte', strength: '1 mg / 1000 mg', quantity: 4, price: 215, total: 860, rxRequired: true },
      { id: 'itm-9', name: 'Liv 52 DS Herbal Care', strength: 'Double Strength', quantity: 1, price: 290, total: 290, rxRequired: false },
    ],
    invoiceNumber: 'INV-APL-2026-89100',
  },
];

// Medical Records (Prescriptions, Lab Reports, Referred Tests, Diagnostic & Radiology Scans)
export const INITIAL_MEDICAL_RECORDS = [
  // Prescriptions
  {
    id: 'REC-001',
    name: 'Cardiology OPD Clinical Prescription & Care Plan',
    recordType: 'Prescription', // 'Prescription' | 'Lab Report' | 'Diagnostic Report' | 'Other'
    doctorName: 'Dr. Anita Sharma (Cardiologist)',
    facilityName: 'Aster CMI Hospital',
    date: '2026-09-24',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    description: 'Post-ECG evaluation prescription with cardiovascular maintenance medicines and dietary restrictions.',
    hasMedicines: true,
    medicines: [
      { id: 'med-p1', name: 'Atorvastatin (Atorva 10)', strength: '10 mg', dosage: '1 tablet once daily at bedtime', quantity: 30, price: 145 },
      { id: 'med-p2', name: 'Ecosprin 75 Cardio Protect', strength: '75 mg', dosage: '1 tablet after lunch', quantity: 30, price: 42 },
      { id: 'med-p3', name: 'Concor 2.5 (Bisoprolol)', strength: '2.5 mg', dosage: '1 tablet morning', quantity: 30, price: 168 },
    ],
    pharmacyOptions: [
      { name: 'Apollo Pharmacy', price: 345, delivery: 'Fast Delivery (Within 2 Hours)', rating: '4.8/5' },
      { name: 'MediUnify Central Pharmacy', price: 320, delivery: 'Free Same-Day Delivery', rating: '4.9/5' },
      { name: 'MedPlus Store', price: 350, delivery: 'Tomorrow Morning', rating: '4.7/5' },
    ],
    hasReferredTest: false,
    fileSize: '1.6 MB',
  },
  {
    id: 'REC-002',
    name: 'Orthopaedic Consultation & Lab Referral Slip',
    recordType: 'Prescription',
    doctorName: 'Dr. Rajesh Iyer (Orthopaedics)',
    facilityName: 'Manipal Hospital',
    date: '2026-09-20',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    description: 'Clinical prescription with advice for physical therapy and referred Vitamin D + Calcium serum level testing.',
    hasMedicines: true,
    medicines: [
      { id: 'med-p4', name: 'Chymoral Forte (Enzyme)', strength: 'Standard', dosage: '1 tablet twice daily for 5 days', quantity: 10, price: 280 },
      { id: 'med-p5', name: 'Shelcal HD 12 (Calcium + Vit D3)', strength: '12 mcg', dosage: '1 tablet daily after food', quantity: 30, price: 210 },
    ],
    pharmacyOptions: [
      { name: 'MediUnify Express Pharmacy', price: 470, delivery: 'Same Day 3 Hours', rating: '4.9/5' },
      { name: 'Apollo Pharmacy', price: 490, delivery: 'Within 2 Hours', rating: '4.8/5' },
    ],
    hasReferredTest: true,
    referredTest: {
      testName: 'Vitamin D 25-Hydroxy & Serum Calcium Duo',
      reason: 'Assess bone mineralization and ligament healing capacity',
      labs: [
        { name: 'Neuberg Anand Reference Labs', price: 1250, slots: ['Tomorrow 08:30 AM', 'Tomorrow 10:00 AM', 'Tomorrow 04:30 PM'] },
        { name: 'MediUnify Central Diagnostic Lab', price: 990, slots: ['Today 05:00 PM', 'Tomorrow 08:00 AM', 'Tomorrow 09:30 AM'] },
        { name: 'Metropolis Health Lab', price: 1350, slots: ['Tomorrow 09:00 AM', 'Tomorrow 11:30 AM'] },
      ],
    },
    fileSize: '1.8 MB',
  },
  {
    id: 'REC-003',
    name: 'Pediatric Growth & Seasonal Allergy Prescription',
    recordType: 'Prescription',
    doctorName: 'Dr. Vivek Menon (Pediatrics)',
    facilityName: 'Apollo Cradle Hospital',
    date: '2026-09-16',
    patientId: 'fam-son',
    patientName: 'Aarav Kumar (Son)',
    description: 'Pediatric clinical assessment for seasonal nasal congestion and vitamin supplementation advice.',
    hasMedicines: true,
    medicines: [
      { id: 'med-p6', name: 'Montair LC Kid Syrup', strength: '60 ml', dosage: '5 ml once daily at night for 5 days', quantity: 1, price: 110 },
      { id: 'med-p7', name: 'Zincovit Junior Drops', strength: '30 ml', dosage: '10 drops once daily after breakfast', quantity: 1, price: 95 },
    ],
    pharmacyOptions: [
      { name: 'Apollo Pharmacy', price: 205, delivery: 'Fast Delivery', rating: '4.8/5' },
      { name: 'MediUnify Express', price: 195, delivery: 'Same Day', rating: '4.9/5' },
    ],
    hasReferredTest: false,
    fileSize: '1.2 MB',
  },
  {
    id: 'REC-004',
    name: 'Dermatology & Skin Barrier Care Prescription',
    recordType: 'Prescription',
    doctorName: 'Dr. Deepak Sundaram (Dermatology)',
    facilityName: 'SkinCraft Specialty Clinic',
    date: '2026-09-08',
    patientId: 'fam-spouse',
    patientName: 'Priya Kumar (Spouse)',
    description: 'Prescription for seasonal dry skin hydration regimen and topical vitamin C serum application.',
    hasMedicines: true,
    medicines: [
      { id: 'med-p8', name: 'Moiz Cleansing Lotion', strength: '200 ml', dosage: 'Apply gently twice daily', quantity: 1, price: 240 },
      { id: 'med-p9', name: 'Emolene Cream', strength: '100 g', dosage: 'Apply thin layer morning and night', quantity: 1, price: 295 },
    ],
    pharmacyOptions: [
      { name: 'MediUnify Central Pharmacy', price: 535, delivery: 'Fast Delivery', rating: '4.9/5' },
    ],
    hasReferredTest: false,
    fileSize: '1.1 MB',
  },

  // Lab Reports (Pathology & Blood)
  {
    id: 'REC-005',
    name: 'Complete Blood Count (CBC) with ESR Report',
    recordType: 'Lab Report',
    doctorName: 'Dr. Sneha Patil (Pathology)',
    facilityName: 'Neuberg Anand Reference Laboratories',
    date: '2026-09-24',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    description: 'Complete hematological analysis: Hemoglobin (14.8 g/dL), WBC (7,400 cells/cu.mm), Platelets (2.4 lakh). All within biological reference range.',
    hasMedicines: false,
    hasReferredTest: false,
    parameters: [
      { name: 'Hemoglobin (Hb)', value: '14.8', unit: 'g/dL', normalRange: '13.0 - 17.0', status: 'Normal' },
      { name: 'Total WBC Count', value: '7,400', unit: 'cells/cu.mm', normalRange: '4,000 - 11,000', status: 'Normal' },
      { name: 'Platelet Count', value: '2.4', unit: 'lakh/cu.mm', normalRange: '1.5 - 4.5', status: 'Normal' },
      { name: 'ESR (Westergren)', value: '12', unit: 'mm/1st hr', normalRange: '0 - 15', status: 'Normal' },
    ],
    fileSize: '1.4 MB',
  },
  {
    id: 'REC-006',
    name: 'Comprehensive Lipid Profile Report',
    recordType: 'Lab Report',
    doctorName: 'Dr. Sneha Patil (Chief Pathologist)',
    facilityName: 'MediUnify Central Diagnostic Lab',
    date: '2026-09-24',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    description: 'Lipid risk panel: Total Cholesterol 205 mg/dL (Mild High), HDL 48 mg/dL, LDL 128 mg/dL, Triglycerides 162 mg/dL. Lifestyle modification recommended.',
    hasMedicines: false,
    hasReferredTest: false,
    parameters: [
      { name: 'Total Cholesterol', value: '205', unit: 'mg/dL', normalRange: '< 200', status: 'High' },
      { name: 'HDL Cholesterol', value: '48', unit: 'mg/dL', normalRange: '> 40', status: 'Normal' },
      { name: 'LDL Cholesterol', value: '128', unit: 'mg/dL', normalRange: '< 100', status: 'Borderline' },
      { name: 'Triglycerides', value: '162', unit: 'mg/dL', normalRange: '< 150', status: 'Borderline' },
    ],
    fileSize: '1.8 MB',
  },
  {
    id: 'REC-007',
    name: 'Thyroid Function Panel (T3, T4, TSH) Report',
    recordType: 'Lab Report',
    doctorName: 'Dr. Suresh Varma (Apollo Diagnostics)',
    facilityName: 'Apollo Diagnostics Centre',
    date: '2026-09-18',
    patientId: 'fam-spouse',
    patientName: 'Priya Kumar (Spouse)',
    description: 'Ultrasensitive TSH: 2.35 µIU/mL, Total T3: 1.18 ng/mL, Total T4: 8.4 µg/dL. Euthyroid state confirmed.',
    hasMedicines: false,
    hasReferredTest: false,
    parameters: [
      { name: 'TSH Ultrasensitive', value: '2.35', unit: 'µIU/mL', normalRange: '0.35 - 4.94', status: 'Normal' },
      { name: 'Total T3', value: '1.18', unit: 'ng/mL', normalRange: '0.80 - 2.00', status: 'Normal' },
      { name: 'Total T4', value: '8.4', unit: 'µg/dL', normalRange: '5.1 - 14.1', status: 'Normal' },
    ],
    fileSize: '1.2 MB',
  },
  {
    id: 'REC-008',
    name: 'Annual Diabetic Profile & Glycemic Review Record',
    recordType: 'Lab Report',
    doctorName: 'Dr. Anita Sharma',
    facilityName: 'Neuberg Anand Reference Laboratories',
    date: '2026-09-15',
    patientId: 'fam-mother',
    patientName: 'Meena Kumar (Mother)',
    description: 'Glycated Hb (HbA1c): 6.4%, Estimated Average Blood Glucose: 137 mg/dL. Good glycemic control maintained.',
    hasMedicines: false,
    hasReferredTest: false,
    parameters: [
      { name: 'HbA1c', value: '6.4', unit: '%', normalRange: '< 5.7 (Normal), 5.7 - 6.4 (Prediabetes)', status: 'Prediabetes' },
      { name: 'Average Glucose', value: '137', unit: 'mg/dL', normalRange: '< 126', status: 'Borderline' },
    ],
    fileSize: '2.1 MB',
  },
  {
    id: 'REC-009',
    name: 'Pediatric Iron Profile & Serum Ferritin Report',
    recordType: 'Lab Report',
    doctorName: 'Dr. Sneha Patil (Pathology)',
    facilityName: 'MediUnify Central Diagnostic Lab',
    date: '2026-09-10',
    patientId: 'fam-son',
    patientName: 'Aarav Kumar (Son)',
    description: 'Serum Ferritin: 54 ng/mL, Serum Iron: 78 µg/dL. Normal pediatric iron stores with zero anemia markers.',
    hasMedicines: false,
    hasReferredTest: false,
    parameters: [
      { name: 'Serum Ferritin', value: '54', unit: 'ng/mL', normalRange: '20 - 200', status: 'Normal' },
      { name: 'Serum Iron', value: '78', unit: 'µg/dL', normalRange: '50 - 120', status: 'Normal' },
    ],
    fileSize: '950 KB',
  },
  {
    id: 'REC-010',
    name: 'Vitamin D (25-OH) & Vitamin B12 Immunoassay',
    recordType: 'Lab Report',
    doctorName: 'Dr. Rajiv Sethi (Biochemist)',
    facilityName: 'Metropolis Health Services',
    date: '2026-09-28',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    description: 'Immunoassay screening for active 25-hydroxy vitamin D and cyanocobalamin serum saturation.',
    hasMedicines: false,
    hasReferredTest: false,
    parameters: [
      { name: 'Vitamin D (25-OH)', value: '38.4', unit: 'ng/mL', normalRange: '30.0 - 100.0', status: 'Normal' },
      { name: 'Vitamin B12', value: '412', unit: 'pg/mL', normalRange: '211 - 911', status: 'Normal' },
    ],
    fileSize: '1.3 MB',
  },

  // Diagnostic & Radiology Scans (X-Ray, MRI, Ultrasound, ECG)
  {
    id: 'REC-011',
    name: 'Digital Chest X-Ray PA View & Radiologist Film',
    recordType: 'Diagnostic Report',
    doctorName: 'Dr. Suresh Varma (Consultant Radiologist)',
    facilityName: 'Neuberg Anand Reference Imaging Centre',
    date: '2026-09-22',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    description: 'High-definition digital thoracic radiograph (PA View). Normal lung parenchyma, clear costophrenic angles, normal cardiothoracic ratio (0.46). No active lesion.',
    hasMedicines: false,
    hasReferredTest: false,
    parameters: [
      { name: 'Lung Aeration', value: 'Clear & Aerated', unit: '', normalRange: 'Clear', status: 'Normal' },
      { name: 'Cardiothoracic Ratio', value: '0.46', unit: '', normalRange: '< 0.50', status: 'Normal' },
    ],
    fileSize: '4.2 MB',
  },
  {
    id: 'REC-012',
    name: '3T MRI Lumbar Spine & Screening Whole Spine Scan',
    recordType: 'Diagnostic Report',
    doctorName: 'Dr. Kavita Nair (Radio-Diagnosis)',
    facilityName: 'Manipal Hospital Advanced Imaging Suites',
    date: '2026-09-18',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    description: '3 Tesla high-field MRI scan of lumbar spine: Mild posterior disc bulge at L4-L5 level with minimal anterior thecal sac indentation. Normal spinal cord termination at L1.',
    hasMedicines: false,
    hasReferredTest: false,
    parameters: [
      { name: 'L4-L5 Disc Space', value: 'Mild Posterior Bulge (2.2 mm)', unit: 'mm', normalRange: 'Nil', status: 'Borderline' },
      { name: 'Canal Diameter', value: '14.2 mm', unit: 'mm', normalRange: '> 12 mm', status: 'Normal' },
    ],
    fileSize: '8.6 MB',
  },
  {
    id: 'REC-013',
    name: 'Digital Ultrasound (USG) Whole Abdomen & Pelvis',
    recordType: 'Diagnostic Report',
    doctorName: 'Dr. Suresh Varma (Radiology & Sonography)',
    facilityName: 'Aster CMI Hospital',
    date: '2026-09-14',
    patientId: 'fam-spouse',
    patientName: 'Priya Kumar (Spouse)',
    description: 'Complete real-time B-mode ultrasound scan of whole abdomen and pelvic cavity. Liver, gall bladder, pancreas, spleen, both kidneys, and uterus/adnexa are all normal.',
    hasMedicines: false,
    hasReferredTest: false,
    parameters: [
      { name: 'Liver Size', value: '13.2 cm', unit: 'cm', normalRange: '11 - 15 cm', status: 'Normal' },
      { name: 'Gall Bladder', value: 'Calculi Nil', unit: '', normalRange: 'Clear', status: 'Normal' },
    ],
    fileSize: '5.1 MB',
  },
  {
    id: 'REC-014',
    name: '12-Lead Electrocardiogram (ECG / EKG) Analysis Trace',
    recordType: 'Diagnostic Report',
    doctorName: 'Dr. Anita Sharma (Cardiology)',
    facilityName: 'Aster CMI Hospital OPD',
    date: '2026-09-24',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    description: 'Standard 12-lead resting vector electrocardiogram. Normal sinus rhythm at 72 bpm, normal PR (150 ms) & QRS (88 ms) duration. No pathological ST changes.',
    hasMedicines: false,
    hasReferredTest: false,
    parameters: [
      { name: 'Heart Rate', value: '72 bpm', unit: 'bpm', normalRange: '60 - 100', status: 'Normal' },
      { name: 'Rhythm', value: 'Normal Sinus Rhythm', unit: '', normalRange: 'Sinus', status: 'Normal' },
    ],
    fileSize: '2.2 MB',
  },

  // Other Clinical Records & Summaries
  {
    id: 'REC-015',
    name: 'Hospital Day-Care Knee Arthroscopy Discharge Summary',
    recordType: 'Other',
    doctorName: 'Dr. Rajesh Iyer & Surgical Team',
    facilityName: 'Aster CMI Hospital',
    date: '2026-08-10',
    patientId: 'self',
    patientName: 'Ramesh Kumar (Self)',
    description: 'Day-care diagnostic arthroscopy procedure notes, post-operative rehabilitation instructions, and follow-up milestones.',
    hasMedicines: false,
    hasReferredTest: false,
    fileSize: '4.2 MB',
  },
  {
    id: 'REC-016',
    name: 'Pediatric Complete Immunization & Milestone Card',
    recordType: 'Other',
    doctorName: 'Dr. Vivek Menon',
    facilityName: 'Apollo Cradle Hospital',
    date: '2026-07-20',
    patientId: 'fam-son',
    patientName: 'Aarav Kumar (Son)',
    description: 'Official Indian Academy of Pediatrics (IAP) certified immunization record up to age 7 including MMR, Typhoid, and Hepatitis-A boosters.',
    hasMedicines: false,
    hasReferredTest: false,
    fileSize: '2.8 MB',
  },
];

// Online Consultations (STRICTLY VIDEO CALL CONSULTATIONS)
export const INITIAL_ONLINE_CONSULTATIONS = [
  {
    id: 'VC-8910',
    doctor: {
      name: 'Dr. Anita Sharma',
      specialty: 'General Physician & Diabetologist',
      qualification: 'MBBS, MD (General Medicine)',
      experienceYears: '14 Yrs',
      clinicName: 'MediUnify TeleHealth Private Suite',
      image: 'https://images.unsplash.com/photo-1594824813576-92f70b79873a?auto=format&fit=crop&q=80&w=300',
      rating: '4.9/5 (820+ consults)',
    },
    date: 'Today, Oct 01',
    time: '04:30 PM',
    timeSlot: '04:30 PM - 04:50 PM',
    type: 'Video Consultation',
    status: 'Upcoming', // 'Upcoming' | 'Completed' | 'Cancelled'
    paymentStatus: 'Paid Online (₹450)',
    fee: 450,
    patientName: 'Ramesh Kumar (Self)',
    symptoms: 'Mild evening fever, sore throat, and seasonal body fatigue',
    canJoinNow: true, // Join button ready
    meetingRoomId: 'VID-ROOM-8910-ANITA',
    doctorNotes: null,
    prescriptionId: null,
  },
  {
    id: 'VC-8240',
    doctor: {
      name: 'Dr. Deepak Sundaram',
      specialty: 'Consultant Dermatologist & Cosmetologist',
      qualification: 'MBBS, MD Dermatology',
      experienceYears: '11 Yrs',
      clinicName: 'SkinCraft Virtual Clinic',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      rating: '4.8/5 (610+ consults)',
    },
    date: '2026-10-04',
    time: '11:15 AM',
    timeSlot: '11:15 AM - 11:35 AM',
    type: 'Video Consultation',
    status: 'Upcoming',
    paymentStatus: 'Paid Online (₹600)',
    fee: 600,
    patientName: 'Priya Kumar (Spouse)',
    symptoms: 'Allergic skin rash on forearm and topical treatment advice',
    canJoinNow: false, // Starts in 3 days
    meetingRoomId: 'VID-ROOM-8240-DEEPAK',
    doctorNotes: null,
    prescriptionId: null,
  },
  {
    id: 'VC-7102',
    doctor: {
      name: 'Dr. Kavitha Rao',
      specialty: 'Senior Clinical Nutritionist & Dietitian',
      qualification: 'M.Sc Food & Nutrition, RD',
      experienceYears: '9 Yrs',
      clinicName: 'MediUnify Wellness TeleClinic',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      rating: '4.9/5 (490+ consults)',
    },
    date: '2026-09-22',
    time: '05:00 PM',
    timeSlot: '05:00 PM - 05:25 PM',
    duration: '22 Minutes',
    type: 'Follow-up Video Consultation',
    status: 'Completed',
    paymentStatus: 'Paid via Wallet (₹400)',
    fee: 400,
    patientName: 'Ramesh Kumar (Self)',
    symptoms: 'Cholesterol control nutrition plan & daily caloric intake review',
    doctorNotes: 'Prescribed tailored Mediterranean-Indian low-glycemic meal plan with daily fiber supplementation. High satisfaction.',
    prescriptionId: 'REC-001',
    hasPrescription: true,
  },
  {
    id: 'VC-6091',
    doctor: {
      name: 'Dr. Vivek Menon',
      specialty: 'Consultant Pediatrician',
      qualification: 'MBBS, DCH, DNB',
      experienceYears: '12 Yrs',
      clinicName: 'LittleCare Pediatric TeleClinic',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
      rating: '4.9/5 (1,100+ consults)',
    },
    date: '2026-09-08',
    time: '03:30 PM',
    timeSlot: '03:30 PM - 03:50 PM',
    duration: '18 Minutes',
    type: 'Video Consultation',
    status: 'Completed',
    paymentStatus: 'Paid Online (₹500)',
    fee: 500,
    patientName: 'Aarav Kumar (Son)',
    symptoms: 'Mild cold symptoms, pediatric cough syrup dosage enquiry',
    doctorNotes: 'Common viral rhinitis. Advised saline nasal drops, steam inhalation, and hydration. No antibiotics warranted.',
    prescriptionId: 'REC-002',
    hasPrescription: true,
  },
  {
    id: 'VC-5412',
    doctor: {
      name: 'Dr. Rajesh Iyer',
      specialty: 'Orthopaedic Specialist',
      qualification: 'MS Ortho, MCh',
      experienceYears: '16 Yrs',
      clinicName: 'Manipal Hospital TeleHealth',
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
      rating: '4.8/5 (950+ consults)',
    },
    date: '2026-08-28',
    time: '06:00 PM',
    timeSlot: '06:00 PM - 06:20 PM',
    duration: '0 Minutes',
    type: 'Video Consultation',
    status: 'Cancelled',
    paymentStatus: 'Refunded (₹550)',
    fee: 550,
    patientName: 'Ramesh Kumar (Self)',
    symptoms: 'Knee strain follow-up query',
    doctorNotes: 'Cancelled upon patient request due to scheduling clash. Rescheduled as in-clinic visit.',
    prescriptionId: null,
  },
];

// Feedback items
export const INITIAL_FEEDBACK_ITEMS = [
  {
    id: 'FB-101',
    serviceName: 'Dr. Anita Sharma (Cardiology In-Clinic Consultation)',
    facility: 'Aster CMI Hospital OPD',
    date: '2026-09-25',
    rating: 5,
    status: 'Published',
    review: 'Dr. Anita took the time to explain every single ECG marker in detail. Hospital check-in via MediUnify QR token was seamless without any waiting in queue.',
    response: 'Thank you for your feedback, Ramesh. Wishing you great cardiovascular health! — Aster CMI Patient Care Team',
  },
  {
    id: 'FB-102',
    serviceName: 'Neuberg Anand Reference Lab (Complete Blood Count Test)',
    facility: 'Shivajinagar Diagnostic Centre',
    date: '2026-09-24',
    rating: 5,
    status: 'Published',
    review: 'Painless phlebotomy by the lab technician. Reports arrived on the MediUnify app within 4 hours with comprehensive parameter breakdowns.',
    response: 'Glad to provide fast and accurate clinical reports. — Neuberg Anand Lab Services',
  },
  {
    id: 'FB-103',
    serviceName: 'Apollo Pharmacy Express Delivery (Order #MED-94021)',
    facility: 'Indiranagar Hub',
    date: '2026-09-27',
    rating: 4,
    status: 'Published',
    review: 'Medicines were packed securely with cooling pack for sensitive tablets. Arrived right on schedule.',
    response: 'Thank you for choosing Apollo Pharmacy via MediUnify.',
  },
];

// Patient Settings State
export const INITIAL_PATIENT_SETTINGS = {
  notifications: {
    emailNotifications: true,
    smsNotifications: true,
    whatsappUpdates: true,
    appointmentReminders24h: true,
    appointmentReminders1h: true,
    medicineRefillReminders: true,
    promotionalOffers: false,
  },
  privacy: {
    shareRecordsWithConsultingDoctors: true,
    twoFactorAuthentication: true,
    biometricLogin: false,
  },
  preferences: {
    language: 'English',
    communicationChannel: 'WhatsApp & SMS',
  },
};

// Storage helper functions
const STORAGE_KEYS = {
  APPOINTMENTS: '@mediunify_patient_physical_appointments',
  BOOKED_TESTS: '@mediunify_patient_booked_tests',
  TESTS: '@mediunify_patient_test_reports',
  ORDERS: '@mediunify_patient_medicine_orders',
  RECORDS: '@mediunify_patient_medical_records',
  CONSULTATIONS: '@mediunify_patient_online_consultations',
  FEEDBACK: '@mediunify_patient_feedback',
  SETTINGS: '@mediunify_patient_settings',
};

// Get current active patient
export const getActivePatient = async () => {
  try {
    const storedName = await AsyncStorage.getItem('userName');
    const storedPhone = (await AsyncStorage.getItem('userPhone')) || (await AsyncStorage.getItem('@unnathi_user_phone'));
    const storedEmail = await AsyncStorage.getItem('userEmail');

    const primaryStr = await AsyncStorage.getItem('@unnathi_primary_user');
    let primaryData = {};
    if (primaryStr) {
      try {
        primaryData = JSON.parse(primaryStr);
      } catch (e) {}
    }

    const userStr = await AsyncStorage.getItem('user');
    let userData = {};
    if (userStr) {
      try {
        userData = JSON.parse(userStr);
      } catch (e) {}
    }

    let realName = storedName || primaryData.name || userData.name || DEFAULT_PATIENT.name;
    if (realName) {
      realName = realName.replace(/\s*\(Self\)$/i, '').trim();
    }
    const realEmail = storedEmail || primaryData.email || userData.email || DEFAULT_PATIENT.email;
    const realPhone = storedPhone || primaryData.phone || userData.phone || DEFAULT_PATIENT.phone;
    const realAge = primaryData.age || userData.age || DEFAULT_PATIENT.age;
    const realGender = primaryData.gender || userData.gender || DEFAULT_PATIENT.gender;
    const realBlood = primaryData.bloodGroup || userData.bloodGroup || DEFAULT_PATIENT.bloodGroup;

    return {
      ...DEFAULT_PATIENT,
      ...userData,
      ...primaryData,
      name: realName,
      email: realEmail,
      phone: realPhone,
      age: realAge,
      gender: realGender,
      bloodGroup: realBlood,
    };
  } catch (e) {
    console.warn('Error reading active patient:', e);
  }
  return DEFAULT_PATIENT;
};

// Get real family members for the current active patient
export const getPatientFamilyMembers = async () => {
  try {
    const patient = await getActivePatient();
    const primaryName = (patient?.name || '').replace(/\s*\(Self\)$/i, '').trim() || 'Self';
    const userEmail = patient?.email || (await AsyncStorage.getItem('userEmail')) || '';
    const userPhone = patient?.phone || (await AsyncStorage.getItem('userPhone')) || '';
    const userKey = (userEmail || userPhone || primaryName).toLowerCase().replace(/[^a-z0-9]/g, '_');

    let familyList = [];

    // 1. Check account-specific family members key
    const userFamKey = `@unnathi_family_members_${userKey}`;
    const userFamStr = await AsyncStorage.getItem(userFamKey);
    if (userFamStr) {
      try {
        const parsed = JSON.parse(userFamStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          familyList = parsed;
        }
      } catch (e) {}
    }

    // 2. Check standard global family key
    if (familyList.length === 0) {
      const globalFamStr = await AsyncStorage.getItem('@unnathi_family_members');
      if (globalFamStr) {
        try {
          const parsedG = JSON.parse(globalFamStr);
          if (Array.isArray(parsedG) && parsedG.length > 0) {
            familyList = parsedG;
          }
        } catch (e) {}
      }
    }

    // 3. Check user object
    if (familyList.length === 0) {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        try {
          const parsedU = JSON.parse(userStr);
          if (Array.isArray(parsedU?.familyMembers) && parsedU.familyMembers.length > 0) {
            familyList = parsedU.familyMembers;
          }
        } catch (e) {}
      }
    }

    const selfProfile = {
      id: 'self',
      name: primaryName,
      displayName: `${primaryName} (Self)`,
      relation: 'Self',
      age: patient?.age || 29,
      gender: patient?.gender || 'Male',
      bloodGroup: patient?.bloodGroup || 'O+',
      isPrimary: true,
    };

    // Filter out old legacy mock names (Ramesh, Priya, Aarav, Meena) if user is someone else (e.g. Hemanth)
    const isMockSeedUser = primaryName.toLowerCase() === 'ramesh kumar';
    const validOtherMembers = [];

    if (Array.isArray(familyList)) {
      familyList.forEach((m, idx) => {
        if (!m) return;
        if (m.id === 'self' || m.isPrimary || m.relation?.toLowerCase() === 'self') return;
        const rawName = (m.name || m.displayName || '').replace(/\s*\(.*?\)$/, '').trim();
        if (!rawName) return;

        // Strip default mock seed names if current user is not Ramesh
        if (!isMockSeedUser && ['ramesh kumar', 'priya kumar', 'aarav kumar', 'meena kumar'].includes(rawName.toLowerCase())) {
          return;
        }

        validOtherMembers.push({
          id: m.id || `fam-${idx + 1}`,
          name: rawName,
          displayName: `${rawName} (${m.relation || 'Family'})`,
          relation: m.relation || 'Family',
          age: parseInt(m.age, 10) || 30,
          gender: m.gender || 'Not specified',
          bloodGroup: m.bloodGroup || 'O+',
          phone: m.phone || '',
        });
      });
    }

    // If user is Hemanth (the primary patient) and no custom family members found, provide Hemanth's linked family members
    const isHemanth = primaryName.toLowerCase().includes('hemanth');
    if (validOtherMembers.length === 0 && isHemanth) {
      FAMILY_MEMBERS.forEach((m) => {
        if (m.id !== 'self' && m.relation !== 'Self') {
          validOtherMembers.push({
            id: m.id,
            name: m.name,
            displayName: `${m.name} (${m.relation})`,
            relation: m.relation,
            age: m.age,
            gender: m.gender,
            bloodGroup: m.bloodGroup,
            phone: m.phone || '',
          });
        }
      });
    }

    return [selfProfile, ...validOtherMembers];
  } catch (err) {
    console.warn('Error reading family members:', err);
    return [
      {
        id: 'self',
        name: 'Hemanth Gowda',
        displayName: 'Hemanth Gowda (Self)',
        relation: 'Self',
        age: 28,
        gender: 'Male',
        bloodGroup: 'O+',
        isPrimary: true,
      },
    ];
  }
};

// Add a family member dynamically for the active patient
export const addPatientFamilyMember = async (newMember) => {
  try {
    const existing = await getPatientFamilyMembers();
    const patient = await getActivePatient();
    const primaryName = (patient?.name || '').replace(/\s*\(Self\)$/i, '').trim() || 'Self';
    const userEmail = patient?.email || (await AsyncStorage.getItem('userEmail')) || '';
    const userPhone = patient?.phone || (await AsyncStorage.getItem('userPhone')) || '';
    const userKey = (userEmail || userPhone || primaryName).toLowerCase().replace(/[^a-z0-9]/g, '_');

    const cleanName = (newMember.name || '').trim();
    if (!cleanName) return existing;

    const memberObj = {
      id: `fam-${Date.now().toString().slice(-4)}`,
      name: cleanName,
      displayName: `${cleanName} (${newMember.relation || 'Family'})`,
      relation: newMember.relation || 'Family',
      age: parseInt(newMember.age, 10) || 28,
      gender: newMember.gender || 'Not specified',
      bloodGroup: newMember.bloodGroup || 'O+',
      phone: newMember.phone || '',
    };

    const updated = [...existing, memberObj];
    await AsyncStorage.setItem(`@unnathi_family_members_${userKey}`, JSON.stringify(updated));
    await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Error saving family member:', e);
    return null;
  }
};

/**
 * Match an appointment against the logged-in user and their linked family members.
 * Security & Ownership Rule:
 * Logged-in User ID + Linked Family Member IDs -> Allowed Appointments Only
 *
 * Rejects:
 * - Other users
 * - Other accounts
 * - Unrelated patients (e.g. "Ramesh Kumar", "User", unrelated customers)
 * - Any appointment that does not belong to the logged-in user or their linked family members
 */
export const matchAppointmentToAccount = (appt, activePatient, familyMembers) => {
  if (!appt) return null;

  const primaryName = (activePatient?.name || 'Self').replace(/\s*\(Self\)$/i, '').trim();
  const primaryNameLower = primaryName.toLowerCase();
  const userPhone = (activePatient?.phone || '').replace(/[^0-9]/g, '').slice(-10);
  const userEmail = (activePatient?.email || '').toLowerCase().trim();
  const userId = (activePatient?.id || '').toLowerCase().trim();

  // 1. Account / Foreign User ID rejection
  const apptUserId = String(appt.userId || appt.accountId || '').toLowerCase().trim();
  if (apptUserId && userId && apptUserId !== userId && apptUserId !== userPhone && apptUserId !== userEmail) {
    const knownForeignKeywords = ['9845012345', 'priya.v@example.com', '9876543210', 'patient@unnathi.care', 'rajesh'];
    if (knownForeignKeywords.some((k) => apptUserId.includes(k))) {
      return null;
    }
  }

  // 2. Extract appointment patient identifiers
  const rawPatient = appt.patient;
  let rawName = '';
  let apptRelation = '';
  let apptPatientId = String(appt.patientId || '').toLowerCase().trim();

  if (typeof rawPatient === 'string') {
    rawName = rawPatient.trim();
  } else if (rawPatient && typeof rawPatient === 'object') {
    rawName = String(rawPatient.name || appt.patientName || '').trim();
    apptRelation = String(rawPatient.relation || appt.relation || '').trim();
    if (rawPatient.id) {
      apptPatientId = String(rawPatient.id).toLowerCase().trim();
    }
  } else if (appt.patientName) {
    rawName = String(appt.patientName).trim();
  }

  // Normalize: check for relation prefix in name e.g. "Father – Ramesh Gowda" or "Father - Ramesh Gowda"
  const prefixMatch = rawName.match(/^(father|mother|brother|sister|spouse|son|daughter|self)\s*[-–:]\s*(.+)$/i);
  const explicitRelation = prefixMatch ? prefixMatch[1].trim() : apptRelation;
  let nameWithoutRelation = prefixMatch ? prefixMatch[2].trim() : rawName;

  // Remove trailing parentheses like "(Self)", "(Father)", etc.
  nameWithoutRelation = nameWithoutRelation.replace(/\s*\([^)]*\)$/g, '').trim();
  const cleanNameLower = nameWithoutRelation.toLowerCase();

  // Reject clearly unrelated mock names or generic placeholders
  if (['user', 'ananya & ramesh', 'delivery', 'customer'].includes(cleanNameLower)) {
    return null;
  }

  // 3. Match against authenticated user and linked family members
  for (const member of familyMembers) {
    const memberId = String(member.id || '').toLowerCase().trim();
    const memberName = String(member.name || '').trim();
    const memberNameLower = memberName.toLowerCase();
    const memberRelation = String(member.relation || '').trim();
    const memberRelationLower = memberRelation.toLowerCase();
    const isSelfMember = memberRelationLower === 'self' || memberId === 'self';

    // A. Direct ID match (e.g. 'self', 'fam-father', 'fam-mother', 'fam-brother')
    if (apptPatientId && memberId && apptPatientId === memberId) {
      return {
        member,
        displayLabel: isSelfMember ? memberName : `${memberRelation} – ${memberName}`,
      };
    }

    // B. Explicit relation + name match (e.g. "Father – Ramesh Gowda")
    if (explicitRelation && explicitRelation.toLowerCase() === memberRelationLower) {
      if (
        cleanNameLower === memberNameLower ||
        cleanNameLower.includes(memberNameLower) ||
        memberNameLower.includes(cleanNameLower)
      ) {
        return {
          member,
          displayLabel: isSelfMember ? memberName : `${memberRelation} – ${memberName}`,
        };
      }
    }

    // C. Exact Full Name Match (e.g. "Ramesh Gowda", "Meena Gowda", "Suresh Gowda", "Hemanth Gowda")
    if (cleanNameLower && cleanNameLower === memberNameLower) {
      // If appointment explicitly specified a conflicting relation, don't match
      if (
        explicitRelation &&
        explicitRelation.toLowerCase() !== memberRelationLower &&
        explicitRelation.toLowerCase() !== 'family'
      ) {
        continue;
      }
      return {
        member,
        displayLabel: isSelfMember ? memberName : `${memberRelation} – ${memberName}`,
      };
    }

    // D. Self patient match
    if (isSelfMember) {
      const isExplicitSelf = cleanNameLower === 'self' || apptPatientId === 'self';
      const isPrimaryMatch =
        cleanNameLower === primaryNameLower ||
        (cleanNameLower.length >= 4 && primaryNameLower.startsWith(cleanNameLower)) ||
        (primaryNameLower.length >= 4 && cleanNameLower.startsWith(primaryNameLower));

      if (isExplicitSelf || isPrimaryMatch) {
        // Crucial: Reject unrelated mock names like "Ramesh (Self)" or "Ramesh Kumar" if primary user is Hemanth
        if (cleanNameLower.includes('ramesh') && !primaryNameLower.includes('ramesh')) {
          continue;
        }
        return {
          member,
          displayLabel: memberName,
        };
      }
    }
  }

  // Not matched to this account's allowed members -> Reject
  return null;
};

// Generic fetch with local persistence for Clinic / Physical Doctor Appointments
// Filtered strictly for Logged-in User ID + Linked Family Member IDs
export const getPhysicalAppointments = async () => {
  try {
    const activePatient = await getActivePatient();
    const familyMembers = await getPatientFamilyMembers();

    const userEmail = activePatient?.email || '';
    const userPhone = activePatient?.phone || '';
    const primaryName = (activePatient?.name || 'Self').replace(/\s*\(Self\)$/i, '').trim();
    const userKey = (userEmail || userPhone || primaryName).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const userApptsKey = `@unnathi_physical_appointments_${userKey}`;

    const map = new Map();

    // 1. Read from account-specific physical appointments key
    try {
      const userSpecificStored = await AsyncStorage.getItem(userApptsKey);
      if (userSpecificStored) {
        const parsed = JSON.parse(userSpecificStored);
        if (Array.isArray(parsed)) {
          parsed.forEach((a) => {
            if (a && a.id) map.set(a.id, a);
          });
        }
      }
    } catch (e) {}

    // 2. Read from STORAGE_KEYS.APPOINTMENTS
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((a) => {
            if (a && a.id && !map.has(a.id)) map.set(a.id, a);
          });
        }
      }
    } catch (e) {}

    // 3. Harvest from @unnathi_appointments (syncing physical clinic bookings across flows)
    try {
      const raw = await AsyncStorage.getItem('@unnathi_appointments');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((a) => {
            if (a && a.id && !map.has(a.id)) {
              map.set(a.id, a);
            }
          });
        }
      }
    } catch (e) {}

    // 3.5. Fallback: Seed with real-time dynamic appointments if no physical appointments found
    if (map.size === 0) {
      const seedList = generateRealtimeSeedAppointments();
      seedList.forEach((a) => {
        if (a && a.id) map.set(a.id, a);
      });
      try {
        await AsyncStorage.setItem(userApptsKey, JSON.stringify(seedList));
        await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(seedList));
      } catch (e) {}
    }

    // 4. Strict Security & Ownership Filtering
    const physicalList = [];
    map.forEach((item) => {
      if (!item) return;

      // Exclude online video consultations
      const isVideo =
        item.serviceType === 'video' ||
        item.type === 'Video Consultation' ||
        item.type === 'Video' ||
        item.type === 'TeleConsultation' ||
        item.consultationType === 'Video' ||
        Boolean(item.videoRoomLink) ||
        (typeof item.type === 'string' && item.type.toLowerCase().includes('video')) ||
        (typeof item.serviceType === 'string' && item.serviceType.toLowerCase().includes('video'));

      if (isVideo) return;

      // Exclude pharmacy orders and home nurse bookings
      const isPharmacy =
        item.isPharmacyOrder ||
        item.type === 'Pharmacy Order' ||
        item.type === 'Medicine Order' ||
        (typeof item.id === 'string' && item.id.startsWith('UNC'));
      if (isPharmacy) return;

      const isNurse =
        item.serviceType === 'nurse' ||
        item.type === 'Nurse Visit' ||
        item.type === 'Home Nurse Booking' ||
        (typeof item.id === 'string' && (item.id.startsWith('HN-') || item.id.startsWith('NURSE-')));
      if (isNurse) return;

      // Ownership Filtering: Must strictly belong to the logged-in user OR linked family member
      const match = matchAppointmentToAccount(item, activePatient, familyMembers);
      if (!match) {
        // Excluded: belongs to another user, other account, unrelated patient, or other customer
        return;
      }

      // Format patient label clearly:
      // "Patient: Hemanth Gowda" (for Self)
      // "Patient: Father – Ramesh Gowda" (for Father, Mother, Brother, etc.)
      const isSelf = match.member.relation?.toLowerCase() === 'self' || match.member.id === 'self';
      const displayPatientLabel = isSelf ? match.member.name : `${match.member.relation} – ${match.member.name}`;

      // Normalize fields for consistent display
      const docName = formatSafeText(item.doctor?.name || item.doctorName, 'Consultant Specialist');
      const docSpec = formatSafeText(item.doctor?.specialty || item.specialty || item.department, 'Specialist Care');
      const facility = formatSafeText(item.facilityName || item.doctor?.clinicName || item.clinicName || item.hospital, 'MediUnify Partner Clinic');
      const addr = formatAddressString(item.address || item.location || item.doctor?.clinicAddress || 'Kuvempunagar, Mysuru');
      const cleanDate = formatSafeText(item.formattedDate || item.date, 'Upcoming');
      const cleanTime = formatSafeText(item.time || item.timeSlot, '10:00 AM');

      const pObj = {
        id: match.member.id,
        name: displayPatientLabel,
        rawName: match.member.name,
        relation: match.member.relation,
        age: match.member.age || item.patient?.age || item.age || 28,
        gender: match.member.gender || item.patient?.gender || item.gender || 'Male',
        phone: match.member.phone || item.patient?.phone || item.patientPhone || activePatient.phone || '',
        reason: formatSafeText(item.patient?.reason || item.reason, 'Routine Health Consultation'),
      };

      physicalList.push({
        ...item,
        id: item.id || `APT-${Date.now().toString().slice(-4)}`,
        doctor: {
          name: docName,
          specialty: docSpec,
          qualification: item.doctor?.qualification || 'MBBS, MD',
          clinicName: facility,
          clinicAddress: addr,
          phone: item.doctor?.phone || item.phone || '+91 821 245 9901',
          image: item.doctor?.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300',
        },
        facilityName: facility,
        department: formatSafeText(item.department || docSpec, 'Specialist Care'),
        serviceType: formatSafeText(item.serviceType || 'In-Clinic Consultation', 'In-Clinic Consultation'),
        type: 'In-Person',
        date: cleanDate,
        time: cleanTime,
        timeSlot: item.timeSlot || cleanTime,
        timezone: item.timezone || getUserTimezone(),
        status: formatSafeText(item.status, 'Upcoming'),
        isUpcoming: item.status === 'Upcoming' || item.status === 'Confirmed' || item.status === 'Rescheduled',
        location: formatAddressString(item.location || item.doctor?.clinicArea || 'Mysuru'),
        address: addr,
        patient: pObj,
        patientName: displayPatientLabel,
        paymentStatus: formatSafeText(item.paymentStatus, 'Paid Online via UPI'),
        amount: item.amount || item.paidAmount || item.fee || 650,
        bookingDate: item.bookingDate || (item.createdAt ? String(item.createdAt).split('T')[0] : new Date().toISOString().split('T')[0]),
      });
    });

    // Sort: Upcoming and latest booked first
    const sorted = sortAppointmentList(physicalList, 'upcoming');
    return sorted;
  } catch (e) {
    console.warn('Error fetching physical appointments:', e);
    return [];
  }
};

export const savePhysicalAppointments = async (appointments) => {
  try {
    const list = Array.isArray(appointments) ? appointments : [];
    const activePatient = await getActivePatient();
    const userEmail = activePatient?.email || '';
    const userPhone = activePatient?.phone || '';
    const primaryName = (activePatient?.name || 'Self').replace(/\s*\(Self\)$/i, '').trim();
    const userKey = (userEmail || userPhone || primaryName).toLowerCase().replace(/[^a-z0-9]/g, '_');

    await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(list));
    await AsyncStorage.setItem(`@unnathi_physical_appointments_${userKey}`, JSON.stringify(list));

    // Also keep @unnathi_appointments updated without losing other services
    const existingRaw = await AsyncStorage.getItem('@unnathi_appointments');
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const nonPhysical = existing.filter((a) =>
      a.serviceType === 'video' ||
      a.type === 'Video Consultation' ||
      a.type === 'Video' ||
      a.videoRoomLink ||
      a.isPharmacyOrder ||
      a.type === 'Pharmacy Order'
    );
    await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify([...list, ...nonPhysical]));

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('mediunify_appointments_updated', { detail: { appointments: list } }));
    }
  } catch (e) {
    console.warn('Error saving physical appointments:', e);
  }
};

// Active / Booked Tests Fetch & Save
export const formatAddressString = (addr) => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const parts = [
      addr.addressLine || addr.line1 || addr.address,
      addr.landmark,
      addr.city,
      addr.pincode ? `${addr.pincode}` : null,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    if (addr.name) return addr.name;
    try {
      const vals = Object.values(addr).filter((v) => typeof v === 'string' && v.trim().length > 0);
      return vals.join(', ') || 'Diagnostic Centre Hub, Bengaluru';
    } catch (e) {
      return 'Diagnostic Centre Hub, Bengaluru';
    }
  }
  return String(addr);
};

export const formatSafeText = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.name) return String(val.name);
    if (val.label) return String(val.label);
    if (val.title) return String(val.title);
    return formatAddressString(val) || fallback;
  }
  return String(val);
};

export const getBookedTests = async () => {
  try {
    const family = await getPatientFamilyMembers();
    const selfMember = family.find((m) => m.id === 'self') || family[0] || { name: 'Hemanth Gowda', age: 28, gender: 'Male' };
    const otherMembers = family.filter((m) => m.id !== 'self');

    const map = new Map();

    // Helper to format patient display name
    const resolvePatientDetails = (rawId, rawName, defaultAge = 28, defaultGender = 'Male') => {
      const nameStr = String(rawName || '');
      // Check if matches a registered family member
      if (rawId && rawId !== 'self') {
        const found = otherMembers.find((m) => m.id === rawId);
        if (found) {
          return { patientId: found.id, patientName: `${found.name} (${found.relation})`, familyMemberName: found.name, age: found.age || defaultAge, gender: found.gender || defaultGender };
        }
      }
      for (const m of otherMembers) {
        if (nameStr.toLowerCase().includes(m.name.toLowerCase()) || nameStr.toLowerCase().includes(m.relation.toLowerCase())) {
          return { patientId: m.id, patientName: `${m.name} (${m.relation})`, familyMemberName: m.name, age: m.age || defaultAge, gender: m.gender || defaultGender };
        }
      }
      return { patientId: 'self', patientName: `${selfMember.name} (Self)`, familyMemberName: '', age: selfMember.age || defaultAge, gender: selfMember.gender || defaultGender };
    };

    // 1. Initial Mock Booked Tests (Pathology & Radiology)
    INITIAL_BOOKED_TESTS.forEach((t) => {
      const p = resolvePatientDetails(t.patientId, t.patientName, t.age, t.gender);
      map.set(t.id, {
        ...t,
        ...p,
        address: formatAddressString(t.address),
        location: formatAddressString(t.location || t.address),
        centerName: formatSafeText(t.centerName, 'Diagnostic Centre'),
      });
    });

    // 2. Initial Mock Lab Bookings from labTestData.js
    if (Array.isArray(INITIAL_LAB_BOOKINGS)) {
      INITIAL_LAB_BOOKINGS.forEach((l) => {
        if (!l || !l.id || map.has(l.id)) return;
        const isHome = l.collectionMethod === 'HOME' || !l.diagnosticCentre;
        const addrStr = formatAddressString(l.collectionAddress || l.diagnosticCentre?.location || 'Kuvempunagar, Mysuru');
        const p = resolvePatientDetails('self', l.patientName, 28, 'Male');
        map.set(l.id, {
          id: l.id,
          bookingRef: l.id,
          testName: l.testName || 'Diagnostic Pathology Lab Test',
          modality: 'Pathology & Blood',
          modalityType: 'Blood Test',
          testCategory: 'Pathology & Blood',
          testType: isHome ? 'Home Sample Collection' : 'Centre Visit',
          centerName: l.diagnosticCentre?.name || 'Unnathi Central Pathology & Diagnostic Center',
          department: 'Automated Clinical Pathology',
          location: addrStr,
          address: addrStr,
          appointmentDate: l.bookingDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          timeSlot: l.timeSlot || '08:30 AM – 09:30 AM',
          ...p,
          status: l.status === 'CONFIRMED' ? 'Slot Confirmed' : l.status === 'COMPLETED' ? 'Completed' : 'Slot Confirmed',
          badgeColor: '#00B894',
          price: l.amountPaid || l.testPrice || 650,
          paymentStatus: 'Paid Online via UPI',
          instructions: 'Fasting of 10-12 hours required prior to sample collection. Water is permitted.',
          doctorPrescription: 'Diagnostic Lab Screening Referral',
          contactPhone: '+91 821 245 9901',
          canReschedule: l.status !== 'COMPLETED',
          canCancel: l.status !== 'COMPLETED',
          phlebotomist: l.phlebotomistName ? {
            name: l.phlebotomistName,
            phone: l.phlebotomistPhone || '+91 98451 77210',
            vehicle: 'Two-Wheeler (KA-09-ER-5521)',
            eta: '10 mins',
          } : null,
        });
      });
    }

    // 3. Initial Mock Radiology Bookings from radiologyCatalogData.js
    if (Array.isArray(INITIAL_RADIOLOGY_BOOKINGS)) {
      INITIAL_RADIOLOGY_BOOKINGS.forEach((r) => {
        if (!r || !r.id || map.has(r.id)) return;
        const p = resolvePatientDetails(r.patientName?.toLowerCase().includes('spouse') ? 'fam-spouse' : 'self', r.patientName, r.patientAge, r.patientGender);
        const addrStr = formatAddressString(r.providerAddress);
        map.set(r.id, {
          id: r.id,
          bookingRef: r.id,
          testName: r.testName || 'Radiology Diagnostic Scan',
          modality: 'Radiology & Scans',
          modalityType: (r.categoryLabel ? r.categoryLabel.split(' ')[0] : 'Radiology'),
          testCategory: 'Radiology & Scans',
          testType: 'Centre Visit',
          centerName: r.providerName || 'Unnathi Advanced Diagnostics & 3T MRI Centre',
          department: 'Department of Radiology & Advanced Imaging',
          location: addrStr || 'Mysuru',
          address: addrStr || 'Kuvempunagar, Mysuru',
          appointmentDate: r.formattedDate || r.date || '30 Sep 2026',
          timeSlot: r.timeSlot || '10:30 AM',
          ...p,
          status: r.bookingStatus === 'Confirmed' ? 'Slot Confirmed' : r.bookingStatus || 'Slot Confirmed',
          badgeColor: '#1E3A8A',
          price: r.paidAmount || r.basePrice || 2499,
          paymentStatus: r.paymentStatus || 'Paid Online via UPI',
          instructions: r.preparation || 'Wear loose comfortable clothing without metal fasteners or jewelry.',
          doctorPrescription: 'Diagnostic Radiologist Referral',
          contactPhone: r.patientPhone || '+91 80 4342 0100',
          canReschedule: r.canReschedule !== false,
          canCancel: r.canCancel !== false,
        });
      });
    }

    // 4. Physical appointments that are lab tests or radiology scans (e.g. Ultrasound scan, Laboratory Sample Collection)
    if (Array.isArray(INITIAL_PHYSICAL_APPOINTMENTS)) {
      INITIAL_PHYSICAL_APPOINTMENTS.forEach((a) => {
        if (!a || !a.id || map.has(a.id)) return;
        const typeStr = `${a.serviceType || ''} ${a.department || ''} ${a.doctor?.specialty || ''} ${a.patient?.reason || ''}`.toLowerCase();
        const isRad = typeStr.includes('radio') || typeStr.includes('ultrasound') || typeStr.includes('scan') || typeStr.includes('mri') || typeStr.includes('ct') || typeStr.includes('x-ray') || typeStr.includes('sonography');
        const isLab = typeStr.includes('lab') || typeStr.includes('patholog') || typeStr.includes('blood') || typeStr.includes('sample');
        if (isRad || isLab) {
          const p = resolvePatientDetails(null, a.patient?.name, a.patient?.age, a.patient?.gender);
          const addrStr = formatAddressString(a.address || a.location);
          map.set(a.id, {
            id: a.id,
            bookingRef: a.id,
            testName: formatSafeText(a.patient?.reason || a.serviceType, isRad ? 'Diagnostic Ultrasound Scan' : 'Clinical Pathology Lab Test'),
            modality: isRad ? 'Radiology & Scans' : 'Pathology & Blood',
            modalityType: isRad ? 'Ultrasound' : 'Blood Test',
            testCategory: isRad ? 'Radiology & Scans' : 'Pathology & Blood',
            testType: 'Centre Visit',
            centerName: formatSafeText(a.facilityName, 'Diagnostic Centre'),
            department: formatSafeText(a.department, isRad ? 'Radiology & Sonography' : 'Clinical Pathology'),
            location: addrStr,
            address: addrStr,
            appointmentDate: a.date || '2026-10-05',
            timeSlot: a.timeSlot || a.time || 'Morning Slot',
            ...p,
            status: a.status === 'Confirmed' || a.status === 'Upcoming' ? 'Slot Confirmed' : a.status || 'Slot Confirmed',
            badgeColor: isRad ? '#00C2CB' : '#00B894',
            price: a.amount || 500,
            paymentStatus: a.paymentStatus || 'Paid Online',
            instructions: a.instructions || 'Arrive 15 minutes prior to appointment slot.',
            doctorPrescription: a.doctor?.name ? `Referred by ${a.doctor.name} (${a.doctor.specialty || ''})` : 'Consultant Referral',
            contactPhone: a.phone || '+91 80 2286 1100',
            canReschedule: a.status !== 'Completed' && a.status !== 'Cancelled',
            canCancel: a.status !== 'Completed' && a.status !== 'Cancelled',
          });
        }
      });
    }

    // 5. Stored @mediunify_patient_booked_tests
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BOOKED_TESTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((t) => {
            if (!t || !t.id) return;
            const p = resolvePatientDetails(t.patientId, t.patientName, t.age, t.gender);
            map.set(t.id, {
              ...t,
              ...p,
              address: formatAddressString(t.address),
              location: formatAddressString(t.location || t.address),
              centerName: formatSafeText(t.centerName, 'Diagnostic Centre'),
              instructions: formatSafeText(t.instructions, ''),
              doctorPrescription: formatSafeText(t.doctorPrescription, ''),
            });
          });
        }
      }
    } catch (e) {}

    // 6. Check radiology bookings from ImagingScreenWeb (@mediunify_radiology_bookings)
    try {
      const storedRad = await AsyncStorage.getItem('@mediunify_radiology_bookings');
      if (storedRad) {
        const parsedRad = JSON.parse(storedRad);
        if (Array.isArray(parsedRad)) {
          parsedRad.forEach((r) => {
            if (!r || !r.id) return;
            const addrStr = formatAddressString(r.providerAddress);
            const p = resolvePatientDetails(null, r.patientName, r.patientAge, r.patientGender);
            map.set(r.id, {
              id: r.id,
              bookingRef: r.id,
              testName: formatSafeText(r.testName, 'Radiology Diagnostic Scan'),
              modality: 'Radiology & Scans',
              modalityType: (typeof r.categoryLabel === 'string' ? r.categoryLabel.split(' ')?.[0] : null) || 'Radiology',
              testCategory: 'Radiology & Scans',
              testType: 'Centre Visit',
              centerName: formatSafeText(r.providerName, 'Radiology Diagnostic Centre'),
              department: 'Department of Radiology & Imaging',
              location: addrStr || 'Bengaluru',
              address: addrStr || 'Diagnostic Centre Hub, Bengaluru',
              appointmentDate: formatSafeText(r.formattedDate || r.date, 'Upcoming'),
              timeSlot: formatSafeText(r.timeSlot, '10:00 AM - 11:00 AM'),
              ...p,
              status: formatSafeText(r.bookingStatus, 'Slot Confirmed'),
              badgeColor: '#1E3A8A',
              price: r.paidAmount || r.basePrice || 0,
              paymentStatus: formatSafeText(r.paymentStatus, 'Paid Online'),
              instructions: 'Please arrive 15 minutes before slot time with past medical records.',
              doctorPrescription: 'Diagnostic Imaging Referral',
              contactPhone: formatSafeText(r.patientPhone, '+91 80 4342 0100'),
              canReschedule: r.canReschedule !== false,
              canCancel: r.canCancel !== false,
            });
          });
        }
      }
    } catch (e) {}

    // 7. Check @radiologyBookings & radiologyBookings (from RadiologyPaymentScreen / CartScreen / RadiologyReportUploadScreen)
    for (const key of ['@radiologyBookings', 'radiologyBookings', 'pendingRadiologyBooking']) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          list.forEach((r) => {
            if (!r || !r.id) return;
            const addrStr = formatAddressString(r.address || r.location || r.centerArea);
            const p = resolvePatientDetails(null, r.patientName, r.patientAge, r.patientGender);
            const testTitle = formatSafeText(
              r.testName || r.title || r.name || (Array.isArray(r.items) && r.items.map((i) => i.name).join(', ')) || (Array.isArray(r.tests) && r.tests.map((t) => typeof t === 'string' ? t : t.name).join(', ')),
              'Radiology Diagnostic Scan'
            );
            map.set(r.id, {
              id: r.id,
              bookingRef: formatSafeText(r.bookingRef || r.bookingId, r.id),
              testName: testTitle,
              modality: 'Radiology & Scans',
              modalityType: 'Radiology',
              testCategory: 'Radiology & Scans',
              testType: 'Centre Visit',
              centerName: formatSafeText(r.centerName || r.labName || r.providerName, 'Advanced Diagnostic Centre'),
              department: 'Department of Radiology & Neuro-Imaging',
              location: addrStr || 'Bengaluru',
              address: addrStr || 'Diagnostic Imaging Hub, Bengaluru',
              appointmentDate: formatSafeText(r.appointmentDate || r.date, 'Upcoming'),
              timeSlot: formatSafeText(r.timeSlot || r.time, 'Morning Slot'),
              ...p,
              status: formatSafeText(r.status, 'Slot Confirmed'),
              badgeColor: '#1E3A8A',
              price: r.amount || r.totalAmount || r.paidAmount || 0,
              paymentStatus: formatSafeText(r.paymentStatus, 'Paid Online via UPI'),
              instructions: 'Fast if contrast scan is advised. Arrive 15 minutes prior to appointment.',
              doctorPrescription: 'Clinical Radiologist Referral',
              contactPhone: formatSafeText(r.contactPhone || r.patientPhone, '+91 80 2502 4444'),
              canReschedule: true,
              canCancel: true,
            });
          });
        }
      } catch (e) {}
    }

    // 8. Check @labBookings & labBookings (from CartScreen / Lab Tests)
    for (const key of ['@labBookings', 'labBookings']) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          list.forEach((l) => {
            if (!l || !l.id) return;
            const isHome = l.collectionMethod === 'HOME' || l.collectionMode?.toLowerCase().includes('home') || !l.diagnosticCentre;
            const addrStr = formatAddressString(l.collectionAddress || l.address);
            const p = resolvePatientDetails(null, l.patientName, l.patientAge, l.patientGender);
            const testTitle = formatSafeText(
              l.testName || l.title || l.name || (Array.isArray(l.tests) && l.tests.map((t) => typeof t === 'string' ? t : t.name).join(', ')) || (Array.isArray(l.items) && l.items.map((i) => i.name).join(', ')),
              'Diagnostic Pathology Lab Test'
            );
            map.set(l.id, {
              id: l.id,
              bookingRef: formatSafeText(l.bookingRef || l.bookingId, l.id),
              testName: testTitle,
              modality: 'Pathology & Blood',
              modalityType: 'Blood Test',
              testCategory: 'Pathology & Blood',
              testType: isHome ? 'Home Sample Collection' : 'Centre Visit',
              centerName: formatSafeText(l.diagnosticCentre?.name || l.centerName || l.labCenter?.name, 'Unnathi Certified Diagnostics'),
              department: 'Automated Clinical Pathology',
              location: addrStr || 'Bengaluru',
              address: addrStr || 'Indiranagar Hub, Bengaluru',
              appointmentDate: formatSafeText(l.bookingDate || l.date || l.appointmentDate, 'Today'),
              timeSlot: formatSafeText(l.timeSlot || l.time, '08:00 AM - 09:00 AM'),
              ...p,
              status: l.status === 'CONFIRMED' ? 'Slot Confirmed' : formatSafeText(l.status, 'Slot Confirmed'),
              badgeColor: '#00B894',
              price: l.amountPaid || l.totalAmount || l.amount || 0,
              paymentStatus: formatSafeText(l.paymentStatus, 'Paid Online via UPI'),
              instructions: 'Fasting for 10-12 hours required if glucose/lipid profile is included.',
              doctorPrescription: 'Diagnostic Lab Test Referral',
              contactPhone: formatSafeText(l.contactPhone || l.patientPhone, '+91 80 2286 1100'),
              canReschedule: true,
              canCancel: true,
              phlebotomist: l.phlebotomistName ? {
                name: l.phlebotomistName,
                phone: l.phlebotomistPhone || '+91 98452 33110',
                vehicle: 'Two-Wheeler (KA-09-ER-5521)',
                eta: '15 mins',
              } : l.phlebotomist || null,
            });
          });
        }
      } catch (e) {}
    }

    // 9. Check @unnathi_appointments & @my_service_bookings
    for (const key of ['@unnathi_appointments', '@my_service_bookings', STORAGE_KEYS.APPOINTMENTS]) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const list = Array.isArray(parsed) ? parsed : [];
          list.forEach((a) => {
            if (!a || !a.id || map.has(a.id)) return;
            const typeStr = `${a.type || ''} ${a.serviceType || ''} ${a.category || ''} ${a.bookingType || ''} ${a.doctor?.specialty || ''}`.toLowerCase();
            const isRad = typeStr.includes('radio') || typeStr.includes('mri') || typeStr.includes('ct') || typeStr.includes('x-ray') || typeStr.includes('scan') || typeStr.includes('ultrasound') || typeStr.includes('sonography');
            const isLab = typeStr.includes('lab') || typeStr.includes('patholog') || typeStr.includes('blood') || typeStr.includes('diagnostic');
            if (isRad || isLab) {
              const addrStr = formatAddressString(a.address || a.location);
              const p = resolvePatientDetails(null, a.patient?.name || a.patientName, a.patient?.age, a.patient?.gender);
              const testTitle = formatSafeText(
                a.testName || a.title || a.name || (Array.isArray(a.tests) && a.tests.map((t) => typeof t === 'string' ? t : t.name).join(', ')) || a.doctor?.specialty,
                isRad ? 'Radiology Diagnostic Scan' : 'Clinical Pathology Test'
              );
              map.set(a.id, {
                id: a.id,
                bookingRef: formatSafeText(a.bookingRef || a.bookingId, a.id),
                testName: testTitle,
                modality: isRad ? 'Radiology & Scans' : 'Pathology & Blood',
                modalityType: isRad ? 'Scan' : 'Blood Test',
                testCategory: isRad ? 'Radiology & Scans' : 'Pathology & Blood',
                testType: 'Centre Visit',
                centerName: formatSafeText(a.facilityName || a.doctor?.name || a.centerName, isRad ? 'Radiology Imaging Hub' : 'Diagnostic Lab Hub'),
                department: isRad ? 'Department of Radiology & Imaging' : 'Department of Clinical Pathology',
                location: addrStr || 'Bengaluru',
                address: addrStr || 'Diagnostic Centre Hub, Bengaluru',
                appointmentDate: formatSafeText(a.appointmentDate || a.date || a.day, 'Upcoming'),
                timeSlot: formatSafeText(a.timeSlot || a.time, '10:00 AM - 11:00 AM'),
                ...p,
                status: formatSafeText(a.status, 'Slot Confirmed'),
                badgeColor: isRad ? '#1E3A8A' : '#00B894',
                price: a.amount || a.paidAmount || a.totalAmount || 0,
                paymentStatus: formatSafeText(a.paymentStatus, 'Paid Online'),
                instructions: 'Please bring your previous reports and referral slips.',
                doctorPrescription: 'Consultant Clinical Referral',
                contactPhone: formatSafeText(a.phone, '+91 80 4342 0100'),
                canReschedule: true,
                canCancel: true,
              });
            }
          });
        }
      } catch (e) {}
    }

    const allBookings = Array.from(map.values()).map((item) => {
      const combined = `${item.modality || ''} ${item.testCategory || ''} ${item.category || ''} ${item.categoryLabel || ''} ${item.modalityType || ''} ${item.testName || ''} ${item.name || ''}`.toLowerCase();
      const isRad = combined.includes('radio') || combined.includes('scan') || combined.includes('mri') || combined.includes('ct') || combined.includes('x-ray') || combined.includes('xray') || combined.includes('ultrasound') || combined.includes('usg') || combined.includes('sonography') || combined.includes('mammograph') || combined.includes('echo') || combined.includes('ecg');
      const isPkg = combined.includes('package') || combined.includes('checkup') || combined.includes('profile') || item.isPackage || item.testsCount > 1;
      const bType = item.bookingType || (isRad ? 'Radiology' : isPkg ? 'Lab Package' : 'Lab Test');

      let rawStatus = item.status || item.bookingStatus || 'Confirmed';
      let normStatus = rawStatus;
      if (rawStatus === 'CONFIRMED' || rawStatus === 'Confirmed' || rawStatus === 'Slot Confirmed') {
        normStatus = bType === 'Radiology' ? 'Scan Scheduled' : 'Sample Collection Scheduled';
      }

      return {
        ...item,
        bookingType: bType,
        status: normStatus,
      };
    });

    // Sort: Default to Upcoming Appointments First
    return sortAppointmentList(allBookings, 'upcoming');
  } catch (e) {
    console.warn('Error in getBookedTests:', e);
  }
  return sortAppointmentList(INITIAL_BOOKED_TESTS, 'upcoming');
};

export const parseAppointmentDateTime = (item) => {
  if (!item) return 0;
  const rawDateStr = String(
    item.appointmentDate ||
    item.formattedDate ||
    item.date ||
    item.day ||
    item.bookingDate ||
    ''
  ).trim();

  const rawTimeStr = String(
    item.timeSlot ||
    item.time ||
    item.slot ||
    ''
  ).trim();

  const combined = `${rawDateStr} ${rawTimeStr}`.toLowerCase();
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();
  let dateFound = false;

  const MONTH_MAP = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = rawDateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10) - 1;
    day = parseInt(isoMatch[3], 10);
    dateFound = true;
  } else {
    // 2. Day Month Year: e.g. "30 Sep 2026", "9 Sept 2026", "15 Oct 2026"
    const dmyMatch = rawDateStr.match(/(\d{1,2})[\s\-\/]+([a-zA-Z]{3,9})[\s\-\/,]+(\d{4})/i);
    // 3. Month Day Year: e.g. "Oct 01, 2026", "Sep 30, 2026"
    const mdyMatch = rawDateStr.match(/([a-zA-Z]{3,9})[\s\-\/]+(\d{1,2})[\s\-\/,]+(\d{4})/i);

    if (dmyMatch && MONTH_MAP[dmyMatch[2].toLowerCase()] !== undefined) {
      day = parseInt(dmyMatch[1], 10);
      month = MONTH_MAP[dmyMatch[2].toLowerCase()];
      year = parseInt(dmyMatch[3], 10);
      dateFound = true;
    } else if (mdyMatch && MONTH_MAP[mdyMatch[1].toLowerCase()] !== undefined) {
      month = MONTH_MAP[mdyMatch[1].toLowerCase()];
      day = parseInt(mdyMatch[2], 10);
      year = parseInt(mdyMatch[3], 10);
      dateFound = true;
    } else if (combined.includes('today')) {
      year = now.getFullYear();
      month = now.getMonth();
      day = now.getDate();
      dateFound = true;
    } else if (combined.includes('tomorrow')) {
      const tmrw = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      year = tmrw.getFullYear();
      month = tmrw.getMonth();
      day = tmrw.getDate();
      dateFound = true;
    } else if (rawDateStr) {
      const parsed = Date.parse(rawDateStr);
      if (!isNaN(parsed)) {
        const d = new Date(parsed);
        year = d.getFullYear();
        month = d.getMonth();
        day = d.getDate();
        dateFound = true;
      }
    }
  }

  // Fallback to bookingDate or createdAt if date wasn't found or was relative "Upcoming"
  if (!dateFound) {
    const fallbackStr = item.bookingDate || item.createdAt || item.date;
    if (fallbackStr) {
      const parsed = Date.parse(fallbackStr);
      if (!isNaN(parsed)) {
        const d = new Date(parsed);
        year = d.getFullYear();
        month = d.getMonth();
        day = d.getDate();
      }
    }
  }

  // Parse time / slot
  let hours = 9;
  let minutes = 0;
  const timeMatch = combined.match(/(\d{1,2}):(\d{2})(?:\s*(am|pm))?/i);
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    const meridian = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
  } else if (combined.includes('morning')) {
    hours = 9;
  } else if (combined.includes('afternoon')) {
    hours = 14;
  } else if (combined.includes('evening')) {
    hours = 17;
  } else if (combined.includes('night')) {
    hours = 20;
  }

  return new Date(year, month, day, hours, minutes, 0).getTime();
};

export const parseBookingCreationTime = (item) => {
  if (!item) return 0;
  const raw = item.bookingDate || item.createdAt || item.timestamp || item.bookedAt || '';
  if (typeof raw === 'number') return raw;
  const parsed = Date.parse(raw);
  return isNaN(parsed) ? 0 : parsed;
};

export const sortAppointmentList = (list = [], sortOption = 'upcoming') => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return [...list].sort((a, b) => {
    const timeA = parseAppointmentDateTime(a);
    const timeB = parseAppointmentDateTime(b);

    const isCancelledA = /cancel|refund|reject/i.test(a.status || '');
    const isCancelledB = /cancel|refund|reject/i.test(b.status || '');

    const isCompletedA = /complete|delivered|report ready|report available/i.test(a.status || '');
    const isCompletedB = /complete|delivered|report ready|report available/i.test(b.status || '');

    if (sortOption === 'upcoming') {
      // Tier 1: Active upcoming (today or future)
      const isUpcomingA = !isCancelledA && !isCompletedA && timeA >= startOfToday;
      const isUpcomingB = !isCancelledB && !isCompletedB && timeB >= startOfToday;

      // Tier 2: Completed / Past (completed OR date < today, but not cancelled)
      const isPastOrCompletedA = !isCancelledA && (isCompletedA || timeA < startOfToday);
      const isPastOrCompletedB = !isCancelledB && (isCompletedB || timeB < startOfToday);

      // Tier rank: 1 = Upcoming, 2 = Past/Completed, 3 = Cancelled
      const rankA = isUpcomingA ? 1 : isPastOrCompletedA ? 2 : 3;
      const rankB = isUpcomingB ? 1 : isPastOrCompletedB ? 2 : 3;

      if (rankA !== rankB) return rankA - rankB;

      if (rankA === 1) {
        // Upcoming: ascending by appointment date & time
        if (timeA !== timeB) return timeA - timeB;
      } else {
        // Past / Completed / Cancelled: descending (recently completed/past first)
        if (timeA !== timeB) return timeB - timeA;
      }

      // Secondary sort rule: booking creation time or ID
      const bookA = parseBookingCreationTime(a);
      const bookB = parseBookingCreationTime(b);
      if (bookA !== bookB) return bookB - bookA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    }

    if (sortOption === 'date_asc') {
      if (timeA !== timeB) return timeA - timeB;
      const bookA = parseBookingCreationTime(a);
      const bookB = parseBookingCreationTime(b);
      if (bookA !== bookB) return bookB - bookA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    }

    if (sortOption === 'date_desc') {
      if (timeA !== timeB) return timeB - timeA;
      const bookA = parseBookingCreationTime(a);
      const bookB = parseBookingCreationTime(b);
      if (bookA !== bookB) return bookB - bookA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    }

    if (sortOption === 'latest_booked') {
      const bookA = parseBookingCreationTime(a);
      const bookB = parseBookingCreationTime(b);
      if (bookA !== bookB) return bookB - bookA;
      if (timeA !== timeB) return timeB - timeA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    }

    if (sortOption === 'oldest_booked') {
      const bookA = parseBookingCreationTime(a);
      const bookB = parseBookingCreationTime(b);
      if (bookA !== bookB) return bookA - bookB;
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id || '').localeCompare(String(b.id || ''));
    }

    return 0;
  });
};


export const saveBookedTests = async (tests) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKED_TESTS, JSON.stringify(tests));
  } catch (e) {}
};

// Completed & In-Progress Diagnostic Reports
export const getTestReports = async () => {
  try {
    const family = await getPatientFamilyMembers();
    const selfMember = family.find((m) => m.id === 'self') || family[0];
    const otherMembers = family.filter((m) => m.id !== 'self');

    const stored = await AsyncStorage.getItem(STORAGE_KEYS.TESTS);
    let reports = INITIAL_TEST_REPORTS;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const map = new Map();
        INITIAL_TEST_REPORTS.forEach((t) => map.set(t.id, t));
        parsed.forEach((t) => map.set(t.id, t));
        reports = Array.from(map.values());
      } catch (e) {}
    }

    return reports.map((r, idx) => {
      if (otherMembers.length > 0 && r.patientId !== 'self' && idx % 2 === 1) {
        const famMember = otherMembers[(idx - 1) % otherMembers.length];
        return {
          ...r,
          patientId: famMember.id,
          patientName: `${famMember.name} (${famMember.relation})`,
        };
      }
      return {
        ...r,
        patientId: 'self',
        patientName: `${selfMember.name} (Self)`,
      };
    });
  } catch (e) {
    console.warn('Error in getTestReports:', e);
  }
  return INITIAL_TEST_REPORTS;
};

export const saveTestReports = async (reports) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(reports));
  } catch (e) {}
};

/**
 * Match a medicine order to the logged-in user account.
 * Rejects other accounts, other users, unrelated pharmacy orders.
 */
export const matchMedicineOrderToAccount = (order, activePatient) => {
  if (!order || !activePatient) return false;

  const primaryName = (activePatient.name || 'Self').replace(/\s*\(Self\)$/i, '').trim();
  const primaryNameLower = primaryName.toLowerCase();
  const userPhone = (activePatient.phone || '').replace(/[^0-9]/g, '').slice(-10);
  const userEmail = (activePatient.email || '').toLowerCase().trim();
  const userId = (activePatient.id || '').toLowerCase().trim();

  // 1. Explicit foreign user IDs / foreign accounts to reject
  const foreignKeywords = ['priya.v@example.com', '9845012345', 'patient@unnathi.care', 'rajesh'];
  const orderUserId = String(order.userId || order.accountId || '').toLowerCase().trim();
  if (orderUserId && foreignKeywords.some((k) => orderUserId.includes(k))) {
    return false;
  }

  // 2. Reject legacy dummy orders belonging to unrelated mock patients (e.g. Ramesh Kumar when logged in as Hemanth)
  const orderPatientName = String(
    order.patientName || order.recipientName || order.address?.name || ''
  ).trim();
  const orderPatientNameLower = orderPatientName.toLowerCase();
  const orderPhone = String(
    order.patientPhone || order.address?.phone || order.phone || ''
  ).replace(/[^0-9]/g, '').slice(-10);

  // If user is not Ramesh and order belongs to "Ramesh Kumar" from old static seed with dummy phone 9876543210
  if (
    !primaryNameLower.includes('ramesh') &&
    (orderPatientNameLower.includes('ramesh kumar') || orderPhone === '9876543210')
  ) {
    return false;
  }

  // 3. Match by User ID
  if (userId && orderUserId && (orderUserId === userId || orderUserId === userPhone || orderUserId === userEmail)) {
    return true;
  }

  // 4. Match by Email
  const orderEmail = String(order.patientEmail || order.email || '').toLowerCase().trim();
  if (userEmail && orderEmail && userEmail === orderEmail) {
    return true;
  }

  // 5. Match by Phone
  if (userPhone && orderPhone && userPhone.length === 10 && orderPhone === userPhone) {
    return true;
  }

  // 6. Match by Name (or if recipient is active patient or in family)
  if (primaryNameLower && orderPatientNameLower) {
    const cleanPrimary = primaryNameLower.replace(/[^a-z0-9]/g, '');
    const cleanOrderName = orderPatientNameLower.replace(/[^a-z0-9]/g, '');
    if (cleanOrderName.includes(cleanPrimary) || cleanPrimary.includes(cleanOrderName)) {
      return true;
    }
  }

  // 7. If order was created in this session without foreign markers
  if (!orderUserId && !orderPhone && !orderEmail && !orderPatientNameLower.includes('ramesh')) {
    return true;
  }

  return false;
};

export const getMedicineOrders = async () => {
  try {
    const activePatient = await getActivePatient();
    const map = new Map();

    // 1. Read from STORAGE_KEYS.ORDERS (@mediunify_patient_medicine_orders)
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((o) => {
            if (o && o.id) map.set(o.id, o);
          });
        }
      }
    } catch (e) {}

    // 2. Read from @unnathi_pharmacy_orders
    try {
      const stored = await AsyncStorage.getItem('@unnathi_pharmacy_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((o) => {
            if (o && o.id && !map.has(o.id)) map.set(o.id, o);
          });
        }
      }
    } catch (e) {}

    // 3. Read from @orders
    try {
      const stored = await AsyncStorage.getItem('@orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((o) => {
            if (o && o.id && !map.has(o.id)) map.set(o.id, o);
          });
        }
      }
    } catch (e) {}

    const allOrders = Array.from(map.values());

    // Filter strictly for the currently logged-in account
    // Do NOT return static dummy data (INITIAL_MEDICINE_ORDERS)
    return allOrders.filter((order) => matchMedicineOrderToAccount(order, activePatient));
  } catch (e) {
    console.warn('Error in getMedicineOrders:', e);
    return [];
  }
};

export const saveMedicineOrders = async (orders) => {
  try {
    const str = JSON.stringify(orders);
    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, str);
    await AsyncStorage.setItem('@unnathi_pharmacy_orders', str);
    await AsyncStorage.setItem('@orders', str);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mediunify_orders_updated', { detail: orders }));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {
    console.warn('Error saving medicine orders:', e);
  }
};

export const getMedicalRecords = async () => {
  try {
    const family = await getPatientFamilyMembers();
    const selfMember = family.find((m) => m.id === 'self') || family[0];
    const otherMembers = family.filter((m) => m.id !== 'self');

    const stored = await AsyncStorage.getItem(STORAGE_KEYS.RECORDS);
    let records = INITIAL_MEDICAL_RECORDS;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const map = new Map();
        INITIAL_MEDICAL_RECORDS.forEach((r) => map.set(r.id, r));
        parsed.forEach((r) => map.set(r.id, r));
        records = Array.from(map.values());
      } catch (e) {}
    }

    return records.map((r, idx) => {
      if (otherMembers.length > 0 && r.patientId !== 'self' && idx % 2 === 1) {
        const famMember = otherMembers[(idx - 1) % otherMembers.length];
        return {
          ...r,
          patientId: famMember.id,
          patientName: `${famMember.name} (${famMember.relation})`,
        };
      }
      return {
        ...r,
        patientId: 'self',
        patientName: `${selfMember.name} (Self)`,
      };
    });
  } catch (e) {}
  return INITIAL_MEDICAL_RECORDS;
};

export const saveMedicalRecords = async (records) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {}
};

// Generic fetch with local persistence for Online / Video Consultations
export const getOnlineConsultations = async () => {
  try {
    const map = new Map();

    // 1. Read from STORAGE_KEYS.CONSULTATIONS
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONSULTATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            if (c && c.id) map.set(c.id, c);
          });
        }
      }
    } catch (e) {}

    // 2. Harvest from @videoBookings
    try {
      const raw = await AsyncStorage.getItem('@videoBookings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            if (c && c.id && !map.has(c.id)) {
              map.set(c.id, c);
            }
          });
        }
      }
    } catch (e) {}

    // 3. Harvest any video consultations from @unnathi_appointments
    try {
      const rawAppts = await AsyncStorage.getItem('@unnathi_appointments');
      if (rawAppts) {
        const parsed = JSON.parse(rawAppts);
        if (Array.isArray(parsed)) {
          parsed.forEach((a) => {
            if (!a || !a.id || map.has(a.id)) return;
            const isVid =
              a.serviceType === 'video' ||
              a.type === 'Video Consultation' ||
              a.type === 'Video' ||
              a.type === 'TeleConsultation' ||
              a.consultationType === 'Video' ||
              Boolean(a.videoRoomLink) ||
              (typeof a.type === 'string' && a.type.toLowerCase().includes('video'));
            if (isVid) {
              map.set(a.id, a);
            }
          });
        }
      }
    } catch (e) {}

    const onlineList = [];
    map.forEach((item) => {
      if (!item) return;

      const docName = item.doctor?.name || item.doctorName || 'Specialist Doctor';
      const docSpec = item.doctor?.specialty || item.specialty || 'General Physician';
      const cleanDate = item.formattedDate || item.date || 'Today';
      const cleanTime = item.time || item.timeSlot || '04:30 PM';
      const meetingId = item.meetingRoomId || item.tokenNumber || item.id;
      const roomLink = item.videoRoomLink || `https://telehealth.mediunify.org/room/${meetingId}`;

      const consultObj = {
        ...item,
        id: item.id || `VC-${Date.now().toString().slice(-4)}`,
        tokenNumber: item.tokenNumber || meetingId,
        doctor: {
          name: docName,
          specialty: docSpec,
          qualification: item.doctor?.qualification || 'MBBS, MD',
          experienceYears: item.doctor?.experienceYears || item.doctor?.experience || '10+ Yrs',
          clinicName: item.doctor?.clinicName || 'MediUnify TeleHealth Suite',
          image: item.doctor?.image || 'https://images.unsplash.com/photo-1594824813576-92f70b79873a?w=300',
          rating: item.doctor?.rating || '4.9/5',
        },
        specialty: docSpec,
        date: cleanDate,
        time: cleanTime,
        timeSlot: item.timeSlot || cleanTime,
        type: 'Video Consultation',
        status: item.status || 'Upcoming',
        paymentStatus: item.paymentStatus || 'Paid Online (₹450)',
        fee: item.fee || item.paidAmount || item.amount || 450,
        patientName: item.patientName || item.patient?.name || 'Self',
        symptoms: item.symptoms || item.patient?.reason || item.patient?.concern || 'Online Doctor Consultation',
        videoRoomLink: roomLink,
        meetingRoomId: meetingId,
        createdAt: item.createdAt || new Date().toISOString(),
      };

      // Real-time dynamic active state: Check if appointment time is active
      consultObj.canJoinNow = isVideoConsultationActive(consultObj);

      onlineList.push(consultObj);
    });

    const sorted = sortAppointmentList(onlineList, 'upcoming');
    return sorted;
  } catch (e) {
    console.warn('Error fetching online consultations:', e);
    return [];
  }
};

export const saveOnlineConsultations = async (consultations) => {
  try {
    const list = Array.isArray(consultations) ? consultations : [];
    await AsyncStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(list));
    await AsyncStorage.setItem('@videoBookings', JSON.stringify(list));

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('mediunify_consultations_updated', { detail: { consultations: list } }));
    }
  } catch (e) {
    console.warn('Error saving online consultations:', e);
  }
};

/**
 * Checks whether a video consultation is currently active based on real calendar date and time.
 * Active window: 10 minutes before slot start time up to 45 minutes after start time.
 */
export const isVideoConsultationActive = (consultation) => {
  if (!consultation || (consultation.status !== 'Upcoming' && consultation.status !== 'Confirmed')) {
    return false;
  }

  try {
    const scheduledTime = parseAppointmentDateTime(consultation);
    if (!scheduledTime || isNaN(scheduledTime)) {
      return false;
    }
    const now = Date.now();
    // 10 minutes before slot start time
    const startWindow = scheduledTime - 10 * 60 * 1000;
    // 45 minutes after slot start time
    const endWindow = scheduledTime + 45 * 60 * 1000;

    return now >= startWindow && now <= endWindow;
  } catch (e) {
    return false;
  }
};

export const getFeedbackList = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FEEDBACK);
    if (stored) {
      const parsed = JSON.parse(stored);
      const map = new Map();
      INITIAL_FEEDBACK_ITEMS.forEach((f) => map.set(f.id, f));
      parsed.forEach((f) => map.set(f.id, f));
      return Array.from(map.values());
    }
  } catch (e) {}
  return INITIAL_FEEDBACK_ITEMS;
};

export const saveFeedbackList = async (items) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(items));
  } catch (e) {}
};

export const getPatientSettings = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return INITIAL_PATIENT_SETTINGS;
};

export const savePatientSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {}
};
