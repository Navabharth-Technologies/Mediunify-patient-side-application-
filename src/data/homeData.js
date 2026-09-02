import colors from '../theme/colors';

// ==================================================
// CONSULTATION SERVICES
// ==================================================

export const consultationServices = [
  {
    id: '1',
    title: 'In-Person Visit',
    subtitle: 'Consult verified doctors near you',
    icon: 'person-outline',
    background: colors.lightTeal,
    iconColor: colors.primary,
    borderColor: '#A7F3D0',
    route: 'DoctorList',
  },

  {
    id: '2',
    title: 'Video Consult',
    subtitle: 'Connect with doctors from home',
    icon: 'videocam-outline',
    background: colors.lightAqua,
    iconColor: colors.accent,
    borderColor: '#A5F3FC',
    route: 'VideoConsultation',
  },
];

// ==================================================
// LAB PACKAGES
// ==================================================

export const labPackages = [
  {
    id: '1',
    title: 'Executive Full Body',
    highlight: 'Health Checkup',
    subtitle: '68 Vital Parameters Included',
    tests: '68+ Tests',
    price: 999,
    priceStr: '₹999',
    oldPrice: '₹1,999',
    discount: '50% OFF',
    background: colors.lightTeal,
    icon: 'fitness-outline',
  },

  {
    id: '2',
    title: 'Diabetes Comprehensive',
    highlight: 'Care Package',
    subtitle: 'HbA1c, Fasting Sugar & Lipid',
    tests: '28+ Tests',
    price: 499,
    priceStr: '₹499',
    oldPrice: '₹899',
    discount: '44% OFF',
    background: colors.lightAqua,
    icon: 'water-outline',
  },

  {
    id: '3',
    title: 'Advanced Heart Care',
    highlight: 'Cardiac Screen',
    subtitle: 'Lipid, ECG, Electrolytes & CRP',
    tests: '35+ Tests',
    price: 799,
    priceStr: '₹799',
    oldPrice: '₹1,499',
    discount: '46% OFF',
    background: colors.lightGreen,
    icon: 'heart-outline',
  },

  {
    id: '4',
    title: 'Essential Vitamin & D3',
    highlight: 'Screening',
    subtitle: 'Vitamin D3, B12 & Calcium',
    tests: '18+ Tests',
    price: 599,
    priceStr: '₹599',
    oldPrice: '₹999',
    discount: '40% OFF',
    background: colors.lightCoral,
    icon: 'flask-outline',
  },
];

// ==================================================
// QUICK SERVICES (4 KEY HUBS)
// ==================================================

export const quickServices = [
  {
    id: '1',
    title: 'Lab Tests',
    subtitle: 'Blood & Diagnostics',
    icon: 'flask-outline',
    background: colors.lightAqua,
    iconColor: colors.accent,
    route: 'LabTests',
  },

  {
    id: '2',
    title: 'Radiology Labs',
    subtitle: '3T MRI & CT Scans',
    icon: 'radio-outline',
    background: colors.lightTeal,
    iconColor: colors.primary,
    route: 'RadiologyLabs',
  },

  {
    id: '3',
    title: 'Order Medicines',
    subtitle: 'Express Delivery',
    icon: 'medical-outline',
    background: colors.lightCoral,
    iconColor: colors.coral,
    route: 'Pharmacy',
  },

  {
    id: '4',
    title: 'Surgeries',
    subtitle: 'Expert Surgeons',
    icon: 'medkit-outline',
    background: colors.lightBlue,
    iconColor: colors.secondary,
    route: 'HospitalCare',
  },
];

// ==================================================
// MORE SERVICES
// ==================================================

export const moreServices = [
  {
    id: '1',
    title: 'Nearby Hospitals',
    subtitle: 'Find NABH accredited hospitals near you',
    icon: 'business-outline',
    route: 'HospitalList',
    color: colors.lightTeal,
    iconColor: colors.primary,
  },

  {
    id: '2',
    title: 'Radiology Labs & 3T MRI',
    subtitle: 'Book 3T MRI, 128-Slice CT & Ultrasounds',
    icon: 'radio-outline',
    route: 'RadiologyLabs',
    color: colors.lightAqua,
    iconColor: colors.accent,
  },

  {
    id: '3',
    title: 'Surgeries & Hospital Care',
    subtitle: 'Expert surgical specialists & cashless hospitalization',
    icon: 'medkit-outline',
    route: 'HospitalCare',
    color: colors.lightBlue,
    iconColor: colors.secondary,
  },

  {
    id: '4',
    title: 'Health Insurance & Mediclaim',
    subtitle: '₹25 Lakh cover • 100% cashless at top hospitals',
    icon: 'shield-checkmark-outline',
    route: 'HealthInsurance',
    color: colors.lightTeal,
    iconColor: colors.primary,
  },

  {
    id: '5',
    title: 'Book Home Nurse & Caregiver',
    subtitle: 'Certified Nurses for 1 Hr, 12 Hrs, 1-30 Days Care',
    icon: 'heart-circle-outline',
    route: 'NurseBooking',
    color: colors.lightAqua,
    iconColor: colors.accent,
  },
];