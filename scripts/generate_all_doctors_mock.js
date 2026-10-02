const fs = require('fs');
const path = require('path');

const SPECIALIZATION_CATEGORIES = [
  {
    id: 'general-primary',
    name: 'General & Primary Care',
    icon: 'medkit-outline',
    specialties: [
      { id: 'general', key: 'general', name: 'General Physician', icon: 'person-outline' },
      { id: 'family-medicine', key: 'family-medicine', name: 'Family Medicine', icon: 'home-outline' },
      { id: 'internal-medicine', key: 'internal-medicine', name: 'Internal Medicine', icon: 'fitness-outline' },
      { id: 'preventive-medicine', key: 'preventive-medicine', name: 'Preventive Medicine', icon: 'shield-outline' },
      { id: 'geriatric-medicine', key: 'geriatric-medicine', name: 'Geriatric Medicine', icon: 'people-outline' },
    ],
  },
  {
    id: 'ivf-fertility-group',
    name: 'IVF & Fertility',
    icon: 'heart-circle-outline',
    specialties: [
      { id: 'ivf-specialist', key: 'ivf-specialist', name: 'IVF & Fertility Specialist', icon: 'sparkles-outline' },
      { id: 'reproductive-medicine-ivf', key: 'reproductive-medicine-ivf', name: 'Reproductive Medicine', icon: 'heart-outline' },
      { id: 'infertility-care', key: 'infertility-care', name: 'Infertility & IUI Specialist', icon: 'leaf-outline' },
      { id: 'clinical-embryologist', key: 'clinical-embryologist', name: 'Clinical Embryologist', icon: 'flask-outline' },
      { id: 'male-infertility-andrology', key: 'male-infertility-andrology', name: 'Male Infertility & Andrology', icon: 'fitness-outline' },
    ],
  },
  {
    id: 'cardiology-group',
    name: 'Cardiology & Related',
    icon: 'heart-outline',
    specialties: [
      { id: 'cardio', key: 'cardio', name: 'Cardiology', icon: 'heart-outline' },
      { id: 'cardiothoracic-surgery', key: 'cardiothoracic-surgery', name: 'Cardiothoracic Surgery', icon: 'heart-half-outline' },
      { id: 'vascular-surgery', key: 'vascular-surgery', name: 'Vascular Surgery', icon: 'pulse-outline' },
      { id: 'interventional-cardiology', key: 'interventional-cardiology', name: 'Interventional Cardiology', icon: 'git-network-outline' },
    ],
  },
  {
    id: 'neurology-mental',
    name: 'Neurology & Mental Health',
    icon: 'pulse-outline',
    specialties: [
      { id: 'neuro', key: 'neuro', name: 'Neurology', icon: 'pulse-outline' },
      { id: 'neurosurgery', key: 'neurosurgery', name: 'Neurosurgery', icon: 'cut-outline' },
      { id: 'psychiatry', key: 'psychiatry', name: 'Psychiatry', icon: 'happy-outline' },
      { id: 'clinical-psychology', key: 'clinical-psychology', name: 'Clinical Psychology', icon: 'chatbubbles-outline' },
      { id: 'neuropsychiatry', key: 'neuropsychiatry', name: 'Neuropsychiatry', icon: 'hardware-chip-outline' },
    ],
  },
  {
    id: 'orthopedics-group',
    name: 'Orthopedics',
    icon: 'body-outline',
    specialties: [
      { id: 'ortho', key: 'ortho', name: 'Orthopedics', icon: 'body-outline' },
      { id: 'joint-replacement', key: 'joint-replacement', name: 'Joint Replacement', icon: 'fitness-outline' },
      { id: 'sports-medicine', key: 'sports-medicine', name: 'Sports Medicine', icon: 'walk-outline' },
      { id: 'spine-surgery', key: 'spine-surgery', name: 'Spine Surgery', icon: 'git-commit-outline' },
      { id: 'pediatric-orthopedics', key: 'pediatric-orthopedics', name: 'Pediatric Orthopedics', icon: 'accessibility-outline' },
      { id: 'rheumatology', key: 'rheumatology', name: 'Rheumatology', icon: 'bandage-outline' },
    ],
  },
  {
    id: 'pediatrics-group',
    name: 'Pediatrics',
    icon: 'happy-outline',
    specialties: [
      { id: 'pedia', key: 'pedia', name: 'Pediatrics', icon: 'happy-outline' },
      { id: 'neonatology', key: 'neonatology', name: 'Neonatology', icon: 'gift-outline' },
      { id: 'pediatric-cardiology', key: 'pediatric-cardiology', name: 'Pediatric Cardiology', icon: 'heart-circle-outline' },
      { id: 'pediatric-neurology', key: 'pediatric-neurology', name: 'Pediatric Neurology', icon: 'bulb-outline' },
      { id: 'pediatric-surgery', key: 'pediatric-surgery', name: 'Pediatric Surgery', icon: 'cut-outline' },
    ],
  },
  {
    id: 'womens-health-group',
    name: "Women's Health",
    icon: 'female-outline',
    specialties: [
      { id: 'obstetrics-gynecology', key: 'obstetrics-gynecology', name: 'Obstetrics & Gynecology', icon: 'female-outline' },
      { id: 'gynae', key: 'gynae', name: 'Gynecology', icon: 'flower-outline' },
      { id: 'ivf-fertility', key: 'ivf-fertility', name: 'IVF & Infertility', icon: 'heart-circle-outline' },
      { id: 'maternal-fetal-medicine', key: 'maternal-fetal-medicine', name: 'Maternal-Fetal Medicine', icon: 'shield-outline' },
      { id: 'gynecologic-oncology', key: 'gynecologic-oncology', name: 'Gynecologic Oncology', icon: 'medkit-outline' },
    ],
  },
  {
    id: 'skin-aesthetics-group',
    name: 'Skin & Aesthetics',
    icon: 'sparkles-outline',
    specialties: [
      { id: 'derma', key: 'derma', name: 'Dermatology', icon: 'sparkles-outline' },
      { id: 'cosmetology', key: 'cosmetology', name: 'Cosmetology', icon: 'color-palette-outline' },
      { id: 'aesthetic-medicine', key: 'aesthetic-medicine', name: 'Aesthetic Medicine', icon: 'star-outline' },
      { id: 'trichology', key: 'trichology', name: 'Trichology', icon: 'brush-outline' },
    ],
  },
  {
    id: 'eye-care-group',
    name: 'Eye Care',
    icon: 'eye-outline',
    specialties: [
      { id: 'ophthalmology', key: 'ophthalmology', name: 'Ophthalmology', icon: 'eye-outline' },
      { id: 'pediatric-ophthalmology', key: 'pediatric-ophthalmology', name: 'Pediatric Ophthalmology', icon: 'glasses-outline' },
      { id: 'vitreo-retina', key: 'vitreo-retina', name: 'Vitreo-Retina', icon: 'scan-outline' },
      { id: 'cornea-refractive-surgery', key: 'cornea-refractive-surgery', name: 'Cornea & Refractive Surgery', icon: 'disc-outline' },
      { id: 'glaucoma', key: 'glaucoma', name: 'Glaucoma', icon: 'radio-button-on-outline' },
    ],
  },
  {
    id: 'ent-group',
    name: 'ENT',
    icon: 'ear-outline',
    specialties: [
      { id: 'ent', key: 'ent', name: 'ENT (Otorhinolaryngology)', icon: 'ear-outline' },
      { id: 'otology', key: 'otology', name: 'Otology', icon: 'headset-outline' },
      { id: 'rhinology', key: 'rhinology', name: 'Rhinology', icon: 'trail-sign-outline' },
      { id: 'laryngology', key: 'laryngology', name: 'Laryngology', icon: 'mic-outline' },
    ],
  },
  {
    id: 'dental-group',
    name: 'Dental',
    icon: 'nutrition-outline',
    specialties: [
      { id: 'dental', key: 'dental', name: 'General Dentistry', icon: 'nutrition-outline' },
      { id: 'orthodontics', key: 'orthodontics', name: 'Orthodontics', icon: 'construct-outline' },
      { id: 'periodontics', key: 'periodontics', name: 'Periodontics', icon: 'shield-checkmark-outline' },
      { id: 'prosthodontics', key: 'prosthodontics', name: 'Prosthodontics', icon: 'hammer-outline' },
      { id: 'endodontics', key: 'endodontics', name: 'Endodontics', icon: 'flash-outline' },
      { id: 'oral-maxillofacial-surgery', key: 'oral-maxillofacial-surgery', name: 'Oral & Maxillofacial Surgery', icon: 'cut-outline' },
      { id: 'pediatric-dentistry', key: 'pediatric-dentistry', name: 'Pediatric Dentistry', icon: 'happy-outline' },
    ],
  },
  {
    id: 'respiratory-group',
    name: 'Respiratory',
    icon: 'fitness-outline',
    specialties: [
      { id: 'pulmonology', key: 'pulmonology', name: 'Pulmonology', icon: 'fitness-outline' },
      { id: 'respiratory-medicine', key: 'respiratory-medicine', name: 'Respiratory Medicine', icon: 'thermometer-outline' },
      { id: 'critical-care-respiratory', key: 'critical-care-respiratory', name: 'Critical Care Medicine', icon: 'pulse-outline' },
    ],
  },
  {
    id: 'blood-cancer-group',
    name: 'Blood & Cancer',
    icon: 'water-outline',
    specialties: [
      { id: 'hematology', key: 'hematology', name: 'Hematology', icon: 'water-outline' },
      { id: 'medical-oncology', key: 'medical-oncology', name: 'Medical Oncology', icon: 'medkit-outline' },
      { id: 'surgical-oncology', key: 'surgical-oncology', name: 'Surgical Oncology', icon: 'cut-outline' },
      { id: 'radiation-oncology', key: 'radiation-oncology', name: 'Radiation Oncology', icon: 'nuclear-outline' },
      { id: 'hemato-oncology', key: 'hemato-oncology', name: 'Hemato-Oncology', icon: 'flask-outline' },
    ],
  },
  {
    id: 'kidney-urinary-group',
    name: 'Kidney & Urinary',
    icon: 'shield-outline',
    specialties: [
      { id: 'nephrology', key: 'nephrology', name: 'Nephrology', icon: 'filter-outline' },
      { id: 'urology', key: 'urology', name: 'Urology', icon: 'shield-outline' },
      { id: 'andrology', key: 'andrology', name: 'Andrology', icon: 'male-outline' },
      { id: 'urologic-oncology', key: 'urologic-oncology', name: 'Urologic Oncology', icon: 'medkit-outline' },
    ],
  },
  {
    id: 'gastro-liver-group',
    name: 'Gastro & Liver',
    icon: 'flask-outline',
    specialties: [
      { id: 'gastroenterology', key: 'gastroenterology', name: 'Gastroenterology', icon: 'flask-outline' },
      { id: 'hepatology', key: 'hepatology', name: 'Hepatology', icon: 'bandage-outline' },
      { id: 'gastrointestinal-surgery', key: 'gastrointestinal-surgery', name: 'Gastrointestinal Surgery', icon: 'cut-outline' },
      { id: 'proctology', key: 'proctology', name: 'Proctology', icon: 'medkit-outline' },
    ],
  },
  {
    id: 'endocrine-metabolic-group',
    name: 'Endocrine & Metabolic',
    icon: 'git-network-outline',
    specialties: [
      { id: 'endocrinology', key: 'endocrinology', name: 'Endocrinology', icon: 'git-network-outline' },
      { id: 'diabetology', key: 'diabetology', name: 'Diabetology', icon: 'analytics-outline' },
      { id: 'metabolic-medicine', key: 'metabolic-medicine', name: 'Metabolic Medicine', icon: 'speedometer-outline' },
    ],
  },
  {
    id: 'infectious-immunology-group',
    name: 'Infectious & Immunology',
    icon: 'shield-checkmark-outline',
    specialties: [
      { id: 'infectious-disease', key: 'infectious-disease', name: 'Infectious Disease', icon: 'shield-checkmark-outline' },
      { id: 'clinical-immunology', key: 'clinical-immunology', name: 'Clinical Immunology', icon: 'medkit-outline' },
      { id: 'allergy-immunology', key: 'allergy-immunology', name: 'Allergy & Immunology', icon: 'leaf-outline' },
    ],
  },
  {
    id: 'surgery-group',
    name: 'Surgery',
    icon: 'cut-outline',
    specialties: [
      { id: 'general-surgery', key: 'general-surgery', name: 'General Surgery', icon: 'cut-outline' },
      { id: 'laparoscopic-surgery', key: 'laparoscopic-surgery', name: 'Laparoscopic Surgery', icon: 'videocam-outline' },
      { id: 'bariatric-surgery', key: 'bariatric-surgery', name: 'Bariatric Surgery', icon: 'body-outline' },
      { id: 'plastic-surgery', key: 'plastic-surgery', name: 'Plastic Surgery', icon: 'sparkles-outline' },
      { id: 'pediatric-surgery-gen', key: 'pediatric-surgery-gen', name: 'Pediatric Surgery', icon: 'happy-outline' },
      { id: 'colorectal-surgery', key: 'colorectal-surgery', name: 'Colorectal Surgery', icon: 'git-merge-outline' },
      { id: 'hepatobiliary-surgery', key: 'hepatobiliary-surgery', name: 'Hepatobiliary Surgery', icon: 'medical-outline' },
    ],
  },
  {
    id: 'emergency-critical-group',
    name: 'Emergency & Critical Care',
    icon: 'car-outline',
    specialties: [
      { id: 'emergency-medicine', key: 'emergency-medicine', name: 'Emergency Medicine', icon: 'car-outline' },
      { id: 'critical-care-medicine', key: 'critical-care-medicine', name: 'Critical Care Medicine', icon: 'pulse-outline' },
      { id: 'intensive-care-medicine', key: 'intensive-care-medicine', name: 'Intensive Care Medicine', icon: 'bed-outline' },
      { id: 'trauma-surgery', key: 'trauma-surgery', name: 'Trauma Surgery', icon: 'flash-outline' },
    ],
  },
];

console.log('Total specialization categories:', SPECIALIZATION_CATEGORIES.length);
