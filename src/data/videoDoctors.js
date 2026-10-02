// ==================================================
// VIDEO CONSULTATION DOCTORS DATA
// ==================================================

import { SPECIALIZATION_CATEGORIES, doctorSpecialties } from './doctors.js';

export { SPECIALIZATION_CATEGORIES };
export const videoSpecialties = [
  { id: 'all', key: 'all', name: 'All Specialties', icon: 'videocam-outline', categoryId: 'all' },
  ...SPECIALIZATION_CATEGORIES.flatMap((cat) =>
    cat.specialties.map((spec) => ({
      ...spec,
      categoryName: cat.name,
      categoryId: cat.id,
    }))
  ),
];

export const videoDoctors = [
  {
    "id": "v-1",
    "name": "Dr. Ananya Rao",
    "specialty": "General Physician",
    "specialtyKey": "general",
    "categoryId": "general-primary",
    "qualification": "MBBS, MD (General Medicine)",
    "experienceYears": 12,
    "experience": "12 Years Experience",
    "rating": 4.9,
    "reviewCount": 520,
    "videoConsultCount": 1450,
    "fee": 450,
    "mrpFee": 650,
    "discount": "30% OFF",
    "languages": [
      "English",
      "Kannada",
      "Hindi"
    ],
    "hospital": "Unnathi TeleHealth Network",
    "availableToday": true,
    "nextSlot": "Today, in 20 mins (04:15 PM)",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "about": "Over 1,400+ online consultations for fever, cold/cough, diabetes monitoring, high blood pressure, and medication renewals.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-2",
    "name": "Dr. Girish K. Murthy",
    "specialty": "Family Medicine Specialist",
    "specialtyKey": "family-medicine",
    "categoryId": "general-primary",
    "qualification": "MBBS, DNB (Family Medicine)",
    "experienceYears": 15,
    "experience": "15 Years Experience",
    "rating": 4.8,
    "reviewCount": 380,
    "videoConsultCount": 890,
    "fee": 400,
    "mrpFee": 600,
    "discount": "33% OFF",
    "languages": [
      "English",
      "Kannada"
    ],
    "hospital": "FamilyCare Online",
    "availableToday": true,
    "nextSlot": "Today, in 30 mins (04:30 PM)",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "about": "Holistic family wellness consultations, routine blood report interpretation, and lifestyle counseling via video call.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-3",
    "name": "Dr. Nandini S. Murthy",
    "specialty": "IVF & Fertility Specialist",
    "specialtyKey": "ivf-specialist",
    "categoryId": "ivf-fertility-group",
    "qualification": "MBBS, MS (OBG), Fellowship in Reproductive Medicine",
    "experienceYears": 16,
    "experience": "16 Years Experience",
    "rating": 4.9,
    "reviewCount": 420,
    "videoConsultCount": 980,
    "fee": 750,
    "mrpFee": 1100,
    "discount": "32% OFF",
    "languages": [
      "English",
      "Kannada",
      "Hindi"
    ],
    "hospital": "Mysore Fertility Virtual Institute",
    "availableToday": true,
    "nextSlot": "Today, in 25 mins (04:30 PM)",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1594824813629-455b9e078ef3?auto=format&fit=crop&q=80&w=400",
    "about": "Online second opinions on IVF failure, AMH report reviews, semen analysis interpretation, and customized cycle planning.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-4",
    "name": "Dr. Vikramaditya Hegde",
    "specialty": "Reproductive Medicine Consultant",
    "specialtyKey": "reproductive-medicine-ivf",
    "categoryId": "ivf-fertility-group",
    "qualification": "MBBS, DNB (OBG), M.Sc Clinical Embryology",
    "experienceYears": 14,
    "experience": "14 Years Experience",
    "rating": 4.9,
    "reviewCount": 360,
    "videoConsultCount": 750,
    "fee": 700,
    "mrpFee": 1000,
    "discount": "30% OFF",
    "languages": [
      "English",
      "Kannada",
      "Telugu"
    ],
    "hospital": "Unnathi Fertility Tele-Clinic",
    "availableToday": true,
    "nextSlot": "Today, 05:00 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "about": "Remote counseling on PCOS infertility, ovulation tracking, egg freezing options, and male factor fertility guidance.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-5",
    "name": "Dr. Rashmi Kulkarni",
    "specialty": "Infertility & IUI Specialist",
    "specialtyKey": "infertility-care",
    "categoryId": "ivf-fertility-group",
    "qualification": "MBBS, DGO, Fellowship in ART",
    "experienceYears": 11,
    "experience": "11 Years Experience",
    "rating": 4.8,
    "reviewCount": 290,
    "videoConsultCount": 620,
    "fee": 600,
    "mrpFee": 850,
    "discount": "29% OFF",
    "languages": [
      "English",
      "Hindi",
      "Kannada"
    ],
    "hospital": "Genesis Fertility Online",
    "availableToday": true,
    "nextSlot": "Today, 05:45 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400",
    "about": "Compassionate online fertility counseling, hormone test evaluation, and early conception planning for couples.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-6",
    "name": "Dr. Rahul Sharma",
    "specialty": "Cardiologist",
    "specialtyKey": "cardio",
    "categoryId": "cardiology-group",
    "qualification": "MBBS, MD, DM (Cardiology)",
    "experienceYears": 16,
    "experience": "16 Years Experience",
    "rating": 4.9,
    "reviewCount": 410,
    "videoConsultCount": 980,
    "fee": 700,
    "mrpFee": 1000,
    "discount": "30% OFF",
    "languages": [
      "English",
      "Hindi",
      "Kannada"
    ],
    "hospital": "MediCare Heart Virtual Clinic",
    "availableToday": true,
    "nextSlot": "Today, 05:30 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "about": "Remote cardiac second opinions, ECG & lipid profile interpretation, blood pressure management, and post-angioplasty care.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-7",
    "name": "Dr. Shalini Swaminathan",
    "specialty": "Consultant Psychiatrist",
    "specialtyKey": "psychiatry",
    "categoryId": "neurology-mental",
    "qualification": "MBBS, MD (Psychiatry)",
    "experienceYears": 14,
    "experience": "14 Years Experience",
    "rating": 4.9,
    "reviewCount": 490,
    "videoConsultCount": 1320,
    "fee": 650,
    "mrpFee": 950,
    "discount": "31% OFF",
    "languages": [
      "English",
      "Kannada",
      "Tamil",
      "Hindi"
    ],
    "hospital": "MindWellness Tele-Clinic",
    "availableToday": true,
    "nextSlot": "Today, in 30 mins (04:30 PM)",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400",
    "about": "Confidential video counseling for anxiety, workplace stress, panic attacks, depression, and adult ADHD support.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-8",
    "name": "Dr. Vikram Patel",
    "specialty": "Neurologist",
    "specialtyKey": "neuro",
    "categoryId": "neurology-mental",
    "qualification": "MBBS, MD, DM (Neurology)",
    "experienceYears": 18,
    "experience": "18 Years Experience",
    "rating": 4.8,
    "reviewCount": 350,
    "videoConsultCount": 710,
    "fee": 750,
    "mrpFee": 1100,
    "discount": "32% OFF",
    "languages": [
      "English",
      "Kannada"
    ],
    "hospital": "NeuroCare Virtual Health",
    "availableToday": true,
    "nextSlot": "Tomorrow, 10:00 AM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "about": "Migraine history assessment, MRI/CT scan report reviews, and tremor management guidance via video.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-9",
    "name": "Dr. Suresh Reddy",
    "specialty": "Orthopedic Surgeon",
    "specialtyKey": "ortho",
    "categoryId": "orthopedics-group",
    "qualification": "MBBS, MS (Orthopedics)",
    "experienceYears": 15,
    "experience": "15 Years Experience",
    "rating": 4.8,
    "reviewCount": 310,
    "videoConsultCount": 650,
    "fee": 550,
    "mrpFee": 800,
    "discount": "31% OFF",
    "languages": [
      "English",
      "Kannada",
      "Telugu"
    ],
    "hospital": "OrthoCare Virtual Center",
    "availableToday": true,
    "nextSlot": "Today, 06:15 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "about": "Second opinion on joint replacement, X-ray & MRI review for knee/shoulder pain, and home exercise guidance.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-10",
    "name": "Dr. Sneha Reddy",
    "specialty": "Pediatrician",
    "specialtyKey": "pedia",
    "categoryId": "pediatrics-group",
    "qualification": "MBBS, DCH, DNB (Pediatrics)",
    "experienceYears": 11,
    "experience": "11 Years Experience",
    "rating": 4.9,
    "reviewCount": 440,
    "videoConsultCount": 1100,
    "fee": 500,
    "mrpFee": 700,
    "discount": "28% OFF",
    "languages": [
      "English",
      "Kannada",
      "Telugu"
    ],
    "hospital": "KidsHealth Online Clinic",
    "availableToday": true,
    "nextSlot": "Today, in 20 mins (04:15 PM)",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400",
    "about": "Infant fever advice, rash checking, vaccination schedule questions, pediatric cough, and infant feeding guidance.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-11",
    "name": "Dr. Meera Nambiar",
    "specialty": "Gynecologist",
    "specialtyKey": "gynae",
    "categoryId": "womens-health-group",
    "qualification": "MBBS, MS (OBG)",
    "experienceYears": 14,
    "experience": "14 Years Experience",
    "rating": 4.8,
    "reviewCount": 390,
    "videoConsultCount": 940,
    "fee": 600,
    "mrpFee": 900,
    "discount": "33% OFF",
    "languages": [
      "English",
      "Kannada",
      "Malayalam",
      "Hindi"
    ],
    "hospital": "WomenCare TeleHealth",
    "availableToday": true,
    "nextSlot": "Today, 05:00 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400",
    "about": "Irregular periods, PCOS hormonal evaluation, birth control advice, pelvic health queries, and early pregnancy guidance.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-12",
    "name": "Dr. Priya Nair",
    "specialty": "Dermatologist & Cosmetologist",
    "specialtyKey": "derma",
    "categoryId": "skin-aesthetics-group",
    "qualification": "MBBS, MD (Dermatology)",
    "experienceYears": 10,
    "experience": "10 Years Experience",
    "rating": 4.8,
    "reviewCount": 380,
    "videoConsultCount": 1200,
    "fee": 550,
    "mrpFee": 800,
    "discount": "31% OFF",
    "languages": [
      "English",
      "Kannada",
      "Malayalam",
      "Hindi"
    ],
    "hospital": "SkinCraft Online Care",
    "availableToday": true,
    "nextSlot": "Today, in 35 mins (04:30 PM)",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1594824813629-455b9e078ef3?auto=format&fit=crop&q=80&w=400",
    "about": "High-definition video evaluations of acne, hair fall, scalp dandruff, skin allergies, and personalized skincare routines.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-13",
    "name": "Dr. Rajeshwar Prasad",
    "specialty": "Ophthalmologist",
    "specialtyKey": "ophthalmology",
    "categoryId": "eye-care-group",
    "qualification": "MBBS, MS (Ophthal)",
    "experienceYears": 17,
    "experience": "17 Years Experience",
    "rating": 4.8,
    "reviewCount": 260,
    "videoConsultCount": 540,
    "fee": 450,
    "mrpFee": 650,
    "discount": "30% OFF",
    "languages": [
      "English",
      "Hindi",
      "Kannada"
    ],
    "hospital": "TeleEye Care",
    "availableToday": true,
    "nextSlot": "Today, 06:00 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "about": "Eye strain evaluation from screen time, redness/dryness assessment, conjunctivitis advice, and eyewear power review.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-14",
    "name": "Dr. B. R. Sudarshan",
    "specialty": "ENT Specialist",
    "specialtyKey": "ent",
    "categoryId": "ent-group",
    "qualification": "MBBS, MS (ENT)",
    "experienceYears": 16,
    "experience": "16 Years Experience",
    "rating": 4.8,
    "reviewCount": 280,
    "videoConsultCount": 610,
    "fee": 500,
    "mrpFee": 700,
    "discount": "28% OFF",
    "languages": [
      "English",
      "Kannada"
    ],
    "hospital": "ENT Online Clinic",
    "availableToday": true,
    "nextSlot": "Tomorrow, 10:30 AM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400",
    "about": "Throat pain, ear ache, chronic sinus congestion, tinnitus advice, and seasonal allergy medication management.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-15",
    "name": "Dr. Kavita Joshi",
    "specialty": "Dental Surgeon",
    "specialtyKey": "dental",
    "categoryId": "dental-group",
    "qualification": "BDS, MDS (Orthodontics)",
    "experienceYears": 12,
    "experience": "12 Years Experience",
    "rating": 4.9,
    "reviewCount": 350,
    "videoConsultCount": 780,
    "fee": 400,
    "mrpFee": 600,
    "discount": "33% OFF",
    "languages": [
      "English",
      "Hindi",
      "Kannada"
    ],
    "hospital": "TeleDental Network",
    "availableToday": true,
    "nextSlot": "Today, 04:45 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "about": "Toothache triage, gum bleeding queries, clear aligner consultations, and dental prescription support.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-16",
    "name": "Dr. Raghavendra Gowda",
    "specialty": "Pulmonologist",
    "specialtyKey": "pulmonology",
    "categoryId": "respiratory-group",
    "qualification": "MBBS, MD (Pulmonary Medicine)",
    "experienceYears": 13,
    "experience": "13 Years Experience",
    "rating": 4.8,
    "reviewCount": 270,
    "videoConsultCount": 590,
    "fee": 550,
    "mrpFee": 800,
    "discount": "31% OFF",
    "languages": [
      "English",
      "Kannada"
    ],
    "hospital": "RespiCare TeleClinic",
    "availableToday": true,
    "nextSlot": "Today, 05:15 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "about": "Asthma inhaler technique review, chronic cough investigation, chest X-ray interpretation, and post-viral recovery.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-17",
    "name": "Dr. Jayanthi Ramanathan",
    "specialty": "Medical Oncologist",
    "specialtyKey": "medical-oncology",
    "categoryId": "blood-cancer-group",
    "qualification": "MBBS, MD, DM (Medical Oncology)",
    "experienceYears": 18,
    "experience": "18 Years Experience",
    "rating": 4.9,
    "reviewCount": 330,
    "videoConsultCount": 620,
    "fee": 850,
    "mrpFee": 1200,
    "discount": "29% OFF",
    "languages": [
      "English",
      "Tamil",
      "Kannada"
    ],
    "hospital": "OncoConnect Virtual Care",
    "availableToday": true,
    "nextSlot": "Tomorrow, 11:00 AM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400",
    "about": "Cancer second opinions, biopsy & PET CT scan reviews, chemotherapy symptom management, and precision oncology guidance.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-18",
    "name": "Dr. Chetan Mahadev",
    "specialty": "Urologist",
    "specialtyKey": "urology",
    "categoryId": "kidney-urinary-group",
    "qualification": "MBBS, MS, MCh (Urology)",
    "experienceYears": 15,
    "experience": "15 Years Experience",
    "rating": 4.9,
    "reviewCount": 310,
    "videoConsultCount": 530,
    "fee": 650,
    "mrpFee": 950,
    "discount": "31% OFF",
    "languages": [
      "English",
      "Kannada"
    ],
    "hospital": "UroHealth Online",
    "availableToday": true,
    "nextSlot": "Today, 06:30 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "about": "Kidney stone ultrasound reviews, recurrent UTI treatment, prostate health counseling, and male urinary symptom relief.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-19",
    "name": "Dr. Pradeep Shenoy",
    "specialty": "Gastroenterologist",
    "specialtyKey": "gastroenterology",
    "categoryId": "gastro-liver-group",
    "qualification": "MBBS, MD, DM (Gastroenterology)",
    "experienceYears": 16,
    "experience": "16 Years Experience",
    "rating": 4.9,
    "reviewCount": 390,
    "videoConsultCount": 810,
    "fee": 650,
    "mrpFee": 950,
    "discount": "31% OFF",
    "languages": [
      "English",
      "Kannada",
      "Hindi"
    ],
    "hospital": "GastroCare Online",
    "availableToday": true,
    "nextSlot": "Today, in 40 mins (04:40 PM)",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "about": "Chronic acid reflux management, ultrasound liver reports interpretation, IBS diet counseling, and ulcer care.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-20",
    "name": "Dr. Rohini K. S.",
    "specialty": "Endocrinologist & Diabetologist",
    "specialtyKey": "endocrinology",
    "categoryId": "endocrine-metabolic-group",
    "qualification": "MBBS, MD, DM (Endocrinology)",
    "experienceYears": 14,
    "experience": "14 Years Experience",
    "rating": 4.9,
    "reviewCount": 370,
    "videoConsultCount": 860,
    "fee": 650,
    "mrpFee": 900,
    "discount": "28% OFF",
    "languages": [
      "English",
      "Kannada",
      "Hindi"
    ],
    "hospital": "ThyroDiab TeleClinic",
    "availableToday": true,
    "nextSlot": "Today, 05:30 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1594824813629-455b9e078ef3?auto=format&fit=crop&q=80&w=400",
    "about": "HbA1c diabetes dose adjustment, thyroid TSH balancing, hormonal weight resistance, and lipid profile control.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-21",
    "name": "Dr. Hariprasad Rao",
    "specialty": "Infectious Disease Specialist",
    "specialtyKey": "infectious-disease",
    "categoryId": "infectious-immunology-group",
    "qualification": "MBBS, MD (Medicine), FID",
    "experienceYears": 15,
    "experience": "15 Years Experience",
    "rating": 4.8,
    "reviewCount": 240,
    "videoConsultCount": 490,
    "fee": 550,
    "mrpFee": 800,
    "discount": "31% OFF",
    "languages": [
      "English",
      "Kannada"
    ],
    "hospital": "InfectoCare Virtual Clinic",
    "availableToday": true,
    "nextSlot": "Today, 06:00 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400",
    "about": "Prolonged fever evaluation, travel medical advice, antibiotic guidance, and seasonal viral infection care.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-22",
    "name": "Dr. Harish Prasad",
    "specialty": "General & Laparoscopic Surgeon",
    "specialtyKey": "general-surgery",
    "categoryId": "surgery-group",
    "qualification": "MBBS, MS (General Surgery), FMAS",
    "experienceYears": 16,
    "experience": "16 Years Experience",
    "rating": 4.8,
    "reviewCount": 310,
    "videoConsultCount": 580,
    "fee": 600,
    "mrpFee": 850,
    "discount": "29% OFF",
    "languages": [
      "English",
      "Kannada",
      "Hindi"
    ],
    "hospital": "SurgiConsult Online",
    "availableToday": true,
    "nextSlot": "Today, 05:00 PM",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "about": "Surgical second opinions on hernia, gallbladder stones, piles laser options, and post-operative wound healing checks.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  },
  {
    "id": "v-23",
    "name": "Dr. Sunil Nataraj",
    "specialty": "Emergency Medicine Specialist",
    "specialtyKey": "emergency-medicine",
    "categoryId": "emergency-critical-group",
    "qualification": "MBBS, MD (Emergency Medicine)",
    "experienceYears": 12,
    "experience": "12 Years Experience",
    "rating": 4.8,
    "reviewCount": 280,
    "videoConsultCount": 670,
    "fee": 550,
    "mrpFee": 800,
    "discount": "31% OFF",
    "languages": [
      "English",
      "Kannada"
    ],
    "hospital": "TeleTriage Emergency Support",
    "availableToday": true,
    "nextSlot": "Today, in 15 mins (04:10 PM)",
    "slots": [
      "04:15 PM",
      "05:00 PM",
      "06:15 PM",
      "07:30 PM",
      "08:45 PM"
    ],
    "image": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
    "about": "Instant video triage for acute symptoms, burn/wound assessment, whether to visit an emergency room, and urgent medical advice.",
    "services": [
      "Instant Video Consultation",
      "Digital Verified e-Prescription",
      "Lab Test Follow-up Review",
      "Lifestyle & Dietary Advice"
    ],
    "badges": [
      "Verified Specialist",
      "Instant Connect"
    ]
  }
];

export default videoDoctors;
