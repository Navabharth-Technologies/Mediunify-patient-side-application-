# -*- coding: utf-8 -*-
import json
import os

CATEGORIES = [
  {
    "id": "general-primary",
    "name": "General & Primary Care",
    "icon": "medkit-outline",
    "specialties": [
      { "id": "general", "key": "general", "name": "General Physician", "icon": "person-outline" },
      { "id": "family-medicine", "key": "family-medicine", "name": "Family Medicine", "icon": "home-outline" },
      { "id": "internal-medicine", "key": "internal-medicine", "name": "Internal Medicine", "icon": "fitness-outline" },
      { "id": "preventive-medicine", "key": "preventive-medicine", "name": "Preventive Medicine", "icon": "shield-outline" },
      { "id": "geriatric-medicine", "key": "geriatric-medicine", "name": "Geriatric Medicine", "icon": "people-outline" },
    ],
  },
  {
    "id": "ivf-fertility-group",
    "name": "IVF & Fertility",
    "icon": "heart-circle-outline",
    "specialties": [
      { "id": "ivf-specialist", "key": "ivf-specialist", "name": "IVF & Fertility Specialist", "icon": "sparkles-outline" },
      { "id": "reproductive-medicine-ivf", "key": "reproductive-medicine-ivf", "name": "Reproductive Medicine", "icon": "heart-outline" },
      { "id": "infertility-care", "key": "infertility-care", "name": "Infertility & IUI Specialist", "icon": "leaf-outline" },
      { "id": "clinical-embryologist", "key": "clinical-embryologist", "name": "Clinical Embryologist", "icon": "flask-outline" },
      { "id": "male-infertility-andrology", "key": "male-infertility-andrology", "name": "Male Infertility & Andrology", "icon": "fitness-outline" },
    ],
  },
  {
    "id": "cardiology-group",
    "name": "Cardiology & Related",
    "icon": "heart-outline",
    "specialties": [
      { "id": "cardio", "key": "cardio", "name": "Cardiology", "icon": "heart-outline" },
      { "id": "cardiothoracic-surgery", "key": "cardiothoracic-surgery", "name": "Cardiothoracic Surgery", "icon": "heart-half-outline" },
      { "id": "vascular-surgery", "key": "vascular-surgery", "name": "Vascular Surgery", "icon": "pulse-outline" },
      { "id": "interventional-cardiology", "key": "interventional-cardiology", "name": "Interventional Cardiology", "icon": "git-network-outline" },
    ],
  },
  {
    "id": "neurology-mental",
    "name": "Neurology & Mental Health",
    "icon": "pulse-outline",
    "specialties": [
      { "id": "neuro", "key": "neuro", "name": "Neurology", "icon": "pulse-outline" },
      { "id": "neurosurgery", "key": "neurosurgery", "name": "Neurosurgery", "icon": "cut-outline" },
      { "id": "psychiatry", "key": "psychiatry", "name": "Psychiatry", "icon": "happy-outline" },
      { "id": "clinical-psychology", "key": "clinical-psychology", "name": "Clinical Psychology", "icon": "chatbubbles-outline" },
      { "id": "neuropsychiatry", "key": "neuropsychiatry", "name": "Neuropsychiatry", "icon": "hardware-chip-outline" },
    ],
  },
  {
    "id": "orthopedics-group",
    "name": "Orthopedics",
    "icon": "body-outline",
    "specialties": [
      { "id": "ortho", "key": "ortho", "name": "Orthopedics", "icon": "body-outline" },
      { "id": "joint-replacement", "key": "joint-replacement", "name": "Joint Replacement", "icon": "fitness-outline" },
      { "id": "sports-medicine", "key": "sports-medicine", "name": "Sports Medicine", "icon": "walk-outline" },
      { "id": "spine-surgery", "key": "spine-surgery", "name": "Spine Surgery", "icon": "git-commit-outline" },
      { "id": "pediatric-orthopedics", "key": "pediatric-orthopedics", "name": "Pediatric Orthopedics", "icon": "accessibility-outline" },
      { "id": "rheumatology", "key": "rheumatology", "name": "Rheumatology", "icon": "bandage-outline" },
    ],
  },
  {
    "id": "pediatrics-group",
    "name": "Pediatrics",
    "icon": "happy-outline",
    "specialties": [
      { "id": "pedia", "key": "pedia", "name": "Pediatrics", "icon": "happy-outline" },
      { "id": "neonatology", "key": "neonatology", "name": "Neonatology", "icon": "gift-outline" },
      { "id": "pediatric-cardiology", "key": "pediatric-cardiology", "name": "Pediatric Cardiology", "icon": "heart-circle-outline" },
      { "id": "pediatric-neurology", "key": "pediatric-neurology", "name": "Pediatric Neurology", "icon": "bulb-outline" },
      { "id": "pediatric-surgery", "key": "pediatric-surgery", "name": "Pediatric Surgery", "icon": "cut-outline" },
    ],
  },
  {
    "id": "womens-health-group",
    "name": "Women's Health",
    "icon": "female-outline",
    "specialties": [
      { "id": "obstetrics-gynecology", "key": "obstetrics-gynecology", "name": "Obstetrics & Gynecology", "icon": "female-outline" },
      { "id": "gynae", "key": "gynae", "name": "Gynecology", "icon": "flower-outline" },
      { "id": "ivf-fertility", "key": "ivf-fertility", "name": "IVF & Infertility", "icon": "heart-circle-outline" },
      { "id": "maternal-fetal-medicine", "key": "maternal-fetal-medicine", "name": "Maternal-Fetal Medicine", "icon": "shield-outline" },
      { "id": "gynecologic-oncology", "key": "gynecologic-oncology", "name": "Gynecologic Oncology", "icon": "medkit-outline" },
    ],
  },
  {
    "id": "skin-aesthetics-group",
    "name": "Skin & Aesthetics",
    "icon": "sparkles-outline",
    "specialties": [
      { "id": "derma", "key": "derma", "name": "Dermatology", "icon": "sparkles-outline" },
      { "id": "cosmetology", "key": "cosmetology", "name": "Cosmetology", "icon": "color-palette-outline" },
      { "id": "aesthetic-medicine", "key": "aesthetic-medicine", "name": "Aesthetic Medicine", "icon": "star-outline" },
      { "id": "trichology", "key": "trichology", "name": "Trichology", "icon": "brush-outline" },
    ],
  },
  {
    "id": "eye-care-group",
    "name": "Eye Care",
    "icon": "eye-outline",
    "specialties": [
      { "id": "ophthalmology", "key": "ophthalmology", "name": "Ophthalmology", "icon": "eye-outline" },
      { "id": "pediatric-ophthalmology", "key": "pediatric-ophthalmology", "name": "Pediatric Ophthalmology", "icon": "glasses-outline" },
      { "id": "vitreo-retina", "key": "vitreo-retina", "name": "Vitreo-Retina", "icon": "scan-outline" },
      { "id": "cornea-refractive-surgery", "key": "cornea-refractive-surgery", "name": "Cornea & Refractive Surgery", "icon": "disc-outline" },
      { "id": "glaucoma", "key": "glaucoma", "name": "Glaucoma", "icon": "radio-button-on-outline" },
    ],
  },
  {
    "id": "ent-group",
    "name": "ENT",
    "icon": "ear-outline",
    "specialties": [
      { "id": "ent", "key": "ent", "name": "ENT (Otorhinolaryngology)", "icon": "ear-outline" },
      { "id": "otology", "key": "otology", "name": "Otology", "icon": "headset-outline" },
      { "id": "rhinology", "key": "rhinology", "name": "Rhinology", "icon": "trail-sign-outline" },
      { "id": "laryngology", "key": "laryngology", "name": "Laryngology", "icon": "mic-outline" },
    ],
  },
  {
    "id": "dental-group",
    "name": "Dental",
    "icon": "nutrition-outline",
    "specialties": [
      { "id": "dental", "key": "dental", "name": "General Dentistry", "icon": "nutrition-outline" },
      { "id": "orthodontics", "key": "orthodontics", "name": "Orthodontics", "icon": "construct-outline" },
      { "id": "periodontics", "key": "periodontics", "name": "Periodontics", "icon": "shield-checkmark-outline" },
      { "id": "prosthodontics", "key": "prosthodontics", "name": "Prosthodontics", "icon": "hammer-outline" },
      { "id": "endodontics", "key": "endodontics", "name": "Endodontics", "icon": "flash-outline" },
      { "id": "oral-maxillofacial-surgery", "key": "oral-maxillofacial-surgery", "name": "Oral & Maxillofacial Surgery", "icon": "cut-outline" },
      { "id": "pediatric-dentistry", "key": "pediatric-dentistry", "name": "Pediatric Dentistry", "icon": "happy-outline" },
    ],
  },
  {
    "id": "respiratory-group",
    "name": "Respiratory",
    "icon": "fitness-outline",
    "specialties": [
      { "id": "pulmonology", "key": "pulmonology", "name": "Pulmonology", "icon": "fitness-outline" },
      { "id": "respiratory-medicine", "key": "respiratory-medicine", "name": "Respiratory Medicine", "icon": "thermometer-outline" },
      { "id": "critical-care-respiratory", "key": "critical-care-respiratory", "name": "Critical Care Medicine", "icon": "pulse-outline" },
    ],
  },
  {
    "id": "blood-cancer-group",
    "name": "Blood & Cancer",
    "icon": "water-outline",
    "specialties": [
      { "id": "hematology", "key": "hematology", "name": "Hematology", "icon": "water-outline" },
      { "id": "medical-oncology", "key": "medical-oncology", "name": "Medical Oncology", "icon": "medkit-outline" },
      { "id": "surgical-oncology", "key": "surgical-oncology", "name": "Surgical Oncology", "icon": "cut-outline" },
      { "id": "radiation-oncology", "key": "radiation-oncology", "name": "Radiation Oncology", "icon": "nuclear-outline" },
      { "id": "hemato-oncology", "key": "hemato-oncology", "name": "Hemato-Oncology", "icon": "flask-outline" },
    ],
  },
  {
    "id": "kidney-urinary-group",
    "name": "Kidney & Urinary",
    "icon": "shield-outline",
    "specialties": [
      { "id": "nephrology", "key": "nephrology", "name": "Nephrology", "icon": "filter-outline" },
      { "id": "urology", "key": "urology", "name": "Urology", "icon": "shield-outline" },
      { "id": "andrology", "key": "andrology", "name": "Andrology", "icon": "male-outline" },
      { "id": "urologic-oncology", "key": "urologic-oncology", "name": "Urologic Oncology", "icon": "medkit-outline" },
    ],
  },
  {
    "id": "gastro-liver-group",
    "name": "Gastro & Liver",
    "icon": "flask-outline",
    "specialties": [
      { "id": "gastroenterology", "key": "gastroenterology", "name": "Gastroenterology", "icon": "flask-outline" },
      { "id": "hepatology", "key": "hepatology", "name": "Hepatology", "icon": "bandage-outline" },
      { "id": "gastrointestinal-surgery", "key": "gastrointestinal-surgery", "name": "Gastrointestinal Surgery", "icon": "cut-outline" },
      { "id": "proctology", "key": "proctology", "name": "Proctology", "icon": "medkit-outline" },
    ],
  },
  {
    "id": "endocrine-metabolic-group",
    "name": "Endocrine & Metabolic",
    "icon": "git-network-outline",
    "specialties": [
      { "id": "endocrinology", "key": "endocrinology", "name": "Endocrinology", "icon": "git-network-outline" },
      { "id": "diabetology", "key": "diabetology", "name": "Diabetology", "icon": "analytics-outline" },
      { "id": "metabolic-medicine", "key": "metabolic-medicine", "name": "Metabolic Medicine", "icon": "speedometer-outline" },
    ],
  },
  {
    "id": "infectious-immunology-group",
    "name": "Infectious & Immunology",
    "icon": "shield-checkmark-outline",
    "specialties": [
      { "id": "infectious-disease", "key": "infectious-disease", "name": "Infectious Disease", "icon": "shield-checkmark-outline" },
      { "id": "clinical-immunology", "key": "clinical-immunology", "name": "Clinical Immunology", "icon": "medkit-outline" },
      { "id": "allergy-immunology", "key": "allergy-immunology", "name": "Allergy & Immunology", "icon": "leaf-outline" },
    ],
  },
  {
    "id": "surgery-group",
    "name": "Surgery",
    "icon": "cut-outline",
    "specialties": [
      { "id": "general-surgery", "key": "general-surgery", "name": "General Surgery", "icon": "cut-outline" },
      { "id": "laparoscopic-surgery", "key": "laparoscopic-surgery", "name": "Laparoscopic Surgery", "icon": "videocam-outline" },
      { "id": "bariatric-surgery", "key": "bariatric-surgery", "name": "Bariatric Surgery", "icon": "body-outline" },
      { "id": "plastic-surgery", "key": "plastic-surgery", "name": "Plastic Surgery", "icon": "sparkles-outline" },
      { "id": "pediatric-surgery-gen", "key": "pediatric-surgery-gen", "name": "Pediatric Surgery", "icon": "happy-outline" },
      { "id": "colorectal-surgery", "key": "colorectal-surgery", "name": "Colorectal Surgery", "icon": "git-merge-outline" },
      { "id": "hepatobiliary-surgery", "key": "hepatobiliary-surgery", "name": "Hepatobiliary Surgery", "icon": "medical-outline" },
    ],
  },
  {
    "id": "emergency-critical-group",
    "name": "Emergency & Critical Care",
    "icon": "car-outline",
    "specialties": [
      { "id": "emergency-medicine", "key": "emergency-medicine", "name": "Emergency Medicine", "icon": "car-outline" },
      { "id": "critical-care-medicine", "key": "critical-care-medicine", "name": "Critical Care Medicine", "icon": "pulse-outline" },
      { "id": "intensive-care-medicine", "key": "intensive-care-medicine", "name": "Intensive Care Medicine", "icon": "bed-outline" },
      { "id": "trauma-surgery", "key": "trauma-surgery", "name": "Trauma Surgery", "icon": "flash-outline" },
    ],
  },
]

# Mysore localities with accurate coordinates
LOCALITIES = [
  {"area": "Kuvempunagar, Mysore", "lat": 12.2858, "lng": 76.6341, "address": "No. 24, 5th Cross, Near Vishwamanava Double Road, Kuvempunagar, Mysore - 570023", "distance": "0.8 km away", "dKm": 0.8},
  {"area": "Jayalakshmipuram, Mysore", "lat": 12.3168, "lng": 76.6285, "address": "Plot 112, Kalidasa Road, Near Premier Studio, Jayalakshmipuram, Mysore - 570012", "distance": "1.5 km away", "dKm": 1.5},
  {"area": "Gokulam 3rd Stage, Mysore", "lat": 12.3355, "lng": 76.6310, "address": "Plot 45, 11th Cross, Near Contour Road, Gokulam 3rd Stage, Mysore - 570002", "distance": "3.8 km away", "dKm": 3.8},
  {"area": "Saraswathipuram, Mysore", "lat": 12.3021, "lng": 76.6318, "address": "No. 88, 14th Main, Near Kukkarahalli Lake Road, Saraswathipuram, Mysore - 570009", "distance": "1.2 km away", "dKm": 1.2},
  {"area": "Vijayanagar 2nd Stage, Mysore", "lat": 12.3312, "lng": 76.6120, "address": "No. 67, Hunsur Main Road, Opposite Club, Vijayanagar 2nd Stage, Mysore - 570017", "distance": "4.2 km away", "dKm": 4.2},
  {"area": "V.V. Mohalla, Mysore", "lat": 12.3210, "lng": 76.6390, "address": "Plot 19, Temple Road, V.V. Mohalla, Mysore - 570002", "distance": "2.4 km away", "dKm": 2.4},
  {"area": "Bannimantap, Mysore", "lat": 12.3380, "lng": 76.6520, "address": "Highway Circle Road, Bannimantap 'A' Layout, Mysore - 570015", "distance": "5.1 km away", "dKm": 5.1},
  {"area": "Nazarbad, Mysore", "lat": 12.3080, "lng": 76.6650, "address": "No. 12, Hardinge Circle Road, Nazarbad, Mysore - 570010", "distance": "3.5 km away", "dKm": 3.5},
]

# Doctor avatars (diverse high quality portrait photos)
AVATARS = [
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1594824813629-455b9e078ef3?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
]

# Detailed Mock In-Clinic Doctors per Category
IN_PERSON_DATA = [
  # 1. General & Primary Care
  {
    "name": "Dr. Ananya Rao",
    "specialty": "General Physician",
    "specialtyKey": "general",
    "categoryId": "general-primary",
    "qualification": "MBBS, MD (General Medicine)",
    "experienceYears": 12,
    "rating": 4.9,
    "reviewCount": 380,
    "fee": 500,
    "clinicName": "Unnathi Multispeciality Clinic",
    "locIdx": 0,
    "phone": "+91 821 245 9901",
    "about": "Renowned consultant physician specializing in chronic disease management, diabetes, hypertension, and fever management.",
    "servicesOffered": ["General Consultation", "Diabetes Care & Management", "Hypertension Screening", "Preventive Health Checks"],
    "avatarIdx": 0
  },
  {
    "name": "Dr. Girish K. Murthy",
    "specialty": "Family Medicine Specialist",
    "specialtyKey": "family-medicine",
    "categoryId": "general-primary",
    "qualification": "MBBS, DNB (Family Medicine)",
    "experienceYears": 15,
    "rating": 4.8,
    "reviewCount": 310,
    "fee": 450,
    "clinicName": "Kuvempunagar Family Health Clinic",
    "locIdx": 0,
    "phone": "+91 821 245 3321",
    "about": "Comprehensive whole-family care, geriatric checkups, preventive immunizations, and annual physical health screenings.",
    "servicesOffered": ["Family Health Evaluation", "Geriatric Assessment", "Preventive Screenings", "Routine Vaccinations"],
    "avatarIdx": 3
  },
  {
    "name": "Dr. Sandeep Deshmukh",
    "specialty": "Internal Medicine Consultant",
    "specialtyKey": "internal-medicine",
    "categoryId": "general-primary",
    "qualification": "MBBS, MD (Internal Medicine), FACP",
    "experienceYears": 17,
    "rating": 4.9,
    "reviewCount": 420,
    "fee": 600,
    "clinicName": "Mysore Internal Medicine Care",
    "locIdx": 1,
    "phone": "+91 821 251 8844",
    "about": "Senior physician dealing with complex multisystem disorders, adult metabolic conditions, and autoimmune evaluations.",
    "servicesOffered": ["Complex Multisystem Diagnosis", "Autoimmune Management", "Chronic Disease Review", "Inpatient Care Coordination"],
    "avatarIdx": 1
  },

  # 2. IVF & Fertility (New Priority Category!)
  {
    "name": "Dr. Nandini S. Murthy",
    "specialty": "IVF & Fertility Specialist",
    "specialtyKey": "ivf-specialist",
    "categoryId": "ivf-fertility-group",
    "qualification": "MBBS, MS (OBG), Fellowship in Reproductive Medicine (ICOG), DRM (Germany)",
    "experienceYears": 16,
    "rating": 4.9,
    "reviewCount": 485,
    "fee": 850,
    "clinicName": "Mysore Fertility & IVF Advanced Center",
    "locIdx": 0,
    "phone": "+91 821 245 7711",
    "about": "Chief Fertility Consultant with over 16 years of expertise in IVF, ICSI, blastocyst transfer, egg freezing, and recurrent implantation failure management.",
    "servicesOffered": ["IVF & ICSI Treatment", "Ovarian Stimulation Protocol", "Egg & Embryo Vitrification", "Recurrent Miscarriage Clinic", "Fertility Workup for Couples"],
    "avatarIdx": 2
  },
  {
    "name": "Dr. Vikramaditya Hegde",
    "specialty": "Reproductive Medicine Consultant",
    "specialtyKey": "reproductive-medicine-ivf",
    "categoryId": "ivf-fertility-group",
    "qualification": "MBBS, DNB (OBG), M.Sc in Clinical Embryology (UK)",
    "experienceYears": 14,
    "rating": 4.9,
    "reviewCount": 390,
    "fee": 800,
    "clinicName": "Unnathi Fertility & Reproductive Institute",
    "locIdx": 1,
    "phone": "+91 821 251 9022",
    "about": "Specialist in advanced reproductive endocrinology, PCOS-related infertility, poor ovarian reserve management, and pre-genetic screening (PGT-A).",
    "servicesOffered": ["Reproductive Endocrinology", "IUI & Ovulation Induction", "PCOS Infertility Protocols", "Male & Female Fertility Mapping"],
    "avatarIdx": 5
  },
  {
    "name": "Dr. Rashmi Kulkarni",
    "specialty": "Infertility & IUI Specialist",
    "specialtyKey": "infertility-care",
    "categoryId": "ivf-fertility-group",
    "qualification": "MBBS, DGO, Fellowship in Assisted Reproductive Technologies",
    "experienceYears": 11,
    "rating": 4.8,
    "reviewCount": 320,
    "fee": 700,
    "clinicName": "Genesis Women & Fertility Care",
    "locIdx": 2,
    "phone": "+91 821 251 6610",
    "about": "Passionate fertility clinician offering compassionate, individualized fertility counseling, diagnostic hysteroscopy, and successful IUI cycles.",
    "servicesOffered": ["Intrauterine Insemination (IUI)", "Fertility Counseling", "Diagnostic Hysterolaparoscopy", "Follicular Monitoring"],
    "avatarIdx": 4
  },
  {
    "name": "Dr. Ashwin Kamath",
    "specialty": "Male Infertility & Andrology",
    "specialtyKey": "male-infertility-andrology",
    "categoryId": "ivf-fertility-group",
    "qualification": "MBBS, MS (General Surgery), MCh (Urology), Fellowship in Male Infertility",
    "experienceYears": 13,
    "rating": 4.8,
    "reviewCount": 275,
    "fee": 750,
    "clinicName": "Mysore Andrology & Reproductive Health",
    "locIdx": 3,
    "phone": "+91 821 254 3300",
    "about": "Expert urologist & andrologist handling male factor infertility, azoospermia, varicocele repair, and surgical sperm retrieval (TESA/PESA).",
    "servicesOffered": ["Male Infertility Evaluation", "TESA & PESA Procedures", "Microscopic Varicocelectomy", "Semen Analysis & Sperm DNA Fragmentation"],
    "avatarIdx": 7
  },

  # 3. Cardiology & Related
  {
    "name": "Dr. Rahul Sharma",
    "specialty": "Cardiologist",
    "specialtyKey": "cardio",
    "categoryId": "cardiology-group",
    "qualification": "MBBS, MD, DM (Cardiology)",
    "experienceYears": 16,
    "rating": 4.9,
    "reviewCount": 450,
    "fee": 800,
    "clinicName": "MediCare Heart & Vascular Institute",
    "locIdx": 1,
    "phone": "+91 821 251 4488",
    "about": "Senior interventional cardiologist treating coronary artery disease, heart failure, arrhythmias, and hypertension.",
    "servicesOffered": ["ECG & 2D Echo", "Chest Pain Assessment", "Cardiac Risk Stratification", "Post-Stent Follow-up"],
    "avatarIdx": 1
  },
  {
    "name": "Dr. Vinayaka Prasad",
    "specialty": "Interventional Cardiologist",
    "specialtyKey": "interventional-cardiology",
    "categoryId": "cardiology-group",
    "qualification": "MBBS, MD, DM (Cardiology), FACC",
    "experienceYears": 19,
    "rating": 5.0,
    "reviewCount": 510,
    "fee": 900,
    "clinicName": "Cauvery Heart Center",
    "locIdx": 3,
    "phone": "+91 821 254 9988",
    "about": "Over 5,000 coronary interventions performed; specialist in complex radial angioplasty and structural heart therapies.",
    "servicesOffered": ["Angiography & Angioplasty", "Pacemaker Clinic", "Heart Failure Management", "Holter Monitoring"],
    "avatarIdx": 6
  },

  # 4. Neurology & Mental Health
  {
    "name": "Dr. Vikram Patel",
    "specialty": "Neurologist",
    "specialtyKey": "neuro",
    "categoryId": "neurology-mental",
    "qualification": "MBBS, MD, DM (Neurology)",
    "experienceYears": 18,
    "rating": 4.9,
    "reviewCount": 395,
    "fee": 900,
    "clinicName": "NeuroCare Brain & Spine Clinic",
    "locIdx": 0,
    "phone": "+91 821 245 1120",
    "about": "Diagnosing and treating migraines, stroke rehabilitation, epilepsy, Parkinson disease, and peripheral neuropathy.",
    "servicesOffered": ["Migraine & Headache Clinic", "Epilepsy Management", "Stroke Rehabilitation", "Neuropathy Assessment"],
    "avatarIdx": 3
  },
  {
    "name": "Dr. Shalini Swaminathan",
    "specialty": "Consultant Psychiatrist",
    "specialtyKey": "psychiatry",
    "categoryId": "neurology-mental",
    "qualification": "MBBS, MD (Psychiatry), DPM",
    "experienceYears": 14,
    "rating": 4.9,
    "reviewCount": 340,
    "fee": 750,
    "clinicName": "MindCare Wellness Clinic",
    "locIdx": 1,
    "phone": "+91 821 251 7733",
    "about": "Specializing in adult depression, anxiety disorders, sleep disturbances, OCD, and stress management.",
    "servicesOffered": ["Depression & Mood Therapy", "Anxiety & Panic Management", "Sleep Disorder Care", "Psychiatric Evaluation"],
    "avatarIdx": 8
  },

  # 5. Orthopedics
  {
    "name": "Dr. Suresh Reddy",
    "specialty": "Orthopedic Surgeon",
    "specialtyKey": "ortho",
    "categoryId": "orthopedics-group",
    "qualification": "MBBS, MS (Orthopedics), MCh (Ortho)",
    "experienceYears": 15,
    "rating": 4.8,
    "reviewCount": 340,
    "fee": 600,
    "clinicName": "Saraswathi Bone & Joint Clinic",
    "locIdx": 3,
    "phone": "+91 821 254 3311",
    "about": "Expert in robotic joint replacement, arthritis management, sports ligament tears, and complex bone fractures.",
    "servicesOffered": ["Knee & Hip Replacement", "Arthroscopy & Sports Injury", "Fracture Care", "Arthritis Management"],
    "avatarIdx": 7
  },
  {
    "name": "Dr. Prathap Chandran",
    "specialty": "Spine & Joint Specialist",
    "specialtyKey": "spine-surgery",
    "categoryId": "orthopedics-group",
    "qualification": "MBBS, MS (Ortho), Fellowship in Spine Surgery",
    "experienceYears": 17,
    "rating": 4.9,
    "reviewCount": 410,
    "fee": 750,
    "clinicName": "Mysore Spine & Joint Center",
    "locIdx": 2,
    "phone": "+91 821 251 8899",
    "about": "Minimally invasive spine surgery, disc herniation relief, sciatica care, and chronic back/neck pain management.",
    "servicesOffered": ["Minimally Invasive Spine Procedures", "Sciatica & Slip Disc Relief", "Joint Injections", "Post-Op Rehabilitation"],
    "avatarIdx": 5
  },

  # 6. Pediatrics
  {
    "name": "Dr. Sneha Reddy",
    "specialty": "Pediatrician",
    "specialtyKey": "pedia",
    "categoryId": "pediatrics-group",
    "qualification": "MBBS, DCH, DNB (Pediatrics)",
    "experienceYears": 11,
    "rating": 4.9,
    "reviewCount": 420,
    "fee": 550,
    "clinicName": "Little Angels Child Care & Vaccination Clinic",
    "locIdx": 2,
    "phone": "+91 821 251 7700",
    "about": "Trusted pediatrician with expertise in newborn care, developmental milestone tracking, and childhood vaccinations.",
    "servicesOffered": ["Newborn Care", "Vaccination Schedule", "Growth & Nutrition", "Childhood Allergy & Asthma"],
    "avatarIdx": 4
  },
  {
    "name": "Dr. Karthik Venkatesh",
    "specialty": "Neonatologist & Pediatrician",
    "specialtyKey": "neonatology",
    "categoryId": "pediatrics-group",
    "qualification": "MBBS, MD (Pediatrics), DM (Neonatology)",
    "experienceYears": 13,
    "rating": 4.9,
    "reviewCount": 380,
    "fee": 650,
    "clinicName": "Mother & Child Care Polyclinic",
    "locIdx": 0,
    "phone": "+91 821 245 4477",
    "about": "Senior neonatologist caring for premature infants, newborn jaundice, and critical neonatal development.",
    "servicesOffered": ["Neonatal ICU Follow-up", "Preterm Baby Care", "Pediatric Consultations", "Infant Developmental Screening"],
    "avatarIdx": 10
  },

  # 7. Women's Health
  {
    "name": "Dr. Meera Nambiar",
    "specialty": "Obstetrician & Gynecologist",
    "specialtyKey": "gynae",
    "categoryId": "womens-health-group",
    "qualification": "MBBS, MS (OBG), FMAS",
    "experienceYears": 14,
    "rating": 4.8,
    "reviewCount": 360,
    "fee": 650,
    "clinicName": "Matruchhaya Women Health Center",
    "locIdx": 1,
    "phone": "+91 821 251 2288",
    "about": "Specialist in normal and high-risk pregnancy, PCOS, laparoscopic gynecologic procedures, and menopause care.",
    "servicesOffered": ["Antenatal & Postnatal Care", "Laparoscopic Hysterectomy", "PCOS Care", "Cervical Cancer Screening (Pap Smear)"],
    "avatarIdx": 8
  },

  # 8. Skin & Aesthetics
  {
    "name": "Dr. Priya Nair",
    "specialty": "Dermatologist & Cosmetologist",
    "specialtyKey": "derma",
    "categoryId": "skin-aesthetics-group",
    "qualification": "MBBS, MD (Dermatology)",
    "experienceYears": 10,
    "rating": 4.8,
    "reviewCount": 310,
    "fee": 550,
    "clinicName": "SkinCare & Laser Center",
    "locIdx": 2,
    "phone": "+91 821 251 8833",
    "about": "Acne solutions, laser pigmentation removal, chemical peels, hair fall treatments, and anti-aging dermatology.",
    "servicesOffered": ["Acne & Scar Treatment", "Laser Hair Removal", "Hair Fall & PRP Therapy", "Skin Allergy Diagnosis"],
    "avatarIdx": 2
  },

  # 9. Eye Care
  {
    "name": "Dr. Rajeshwar Prasad",
    "specialty": "Ophthalmologist & Eye Surgeon",
    "specialtyKey": "ophthalmology",
    "categoryId": "eye-care-group",
    "qualification": "MBBS, MS (Ophthalmology), FICO",
    "experienceYears": 17,
    "rating": 4.9,
    "reviewCount": 460,
    "fee": 500,
    "clinicName": "Nethra Jyothi Eye Hospital",
    "locIdx": 0,
    "phone": "+91 821 245 6622",
    "about": "Cataract phacoemulsification, Lasik consultation, diabetic retinopathy screening, and pediatric vision care.",
    "servicesOffered": ["Micro-incision Cataract Surgery", "Computer Vision Strain", "Glaucoma Testing", "Refractive Error Checkup"],
    "avatarIdx": 1
  },

  # 10. ENT
  {
    "name": "Dr. B. R. Sudarshan",
    "specialty": "ENT Specialist",
    "specialtyKey": "ent",
    "categoryId": "ent-group",
    "qualification": "MBBS, MS (ENT), DLO",
    "experienceYears": 16,
    "rating": 4.8,
    "reviewCount": 370,
    "fee": 550,
    "clinicName": "Mysore Ear Nose & Throat Care",
    "locIdx": 3,
    "phone": "+91 821 254 7711",
    "about": "Allergic rhinitis, sinusitis, ear infections, vertigo management, hearing evaluations, and endoscopic sinus treatments.",
    "servicesOffered": ["Hearing & Audiometry Check", "Sinusitis & Allergy Care", "Vertigo Management", "Ear Microsurgery"],
    "avatarIdx": 9
  },

  # 11. Dental
  {
    "name": "Dr. Kavita Joshi",
    "specialty": "Dental Surgeon & Orthodontist",
    "specialtyKey": "dental",
    "categoryId": "dental-group",
    "qualification": "BDS, MDS (Orthodontics)",
    "experienceYears": 12,
    "rating": 4.9,
    "reviewCount": 420,
    "fee": 400,
    "clinicName": "SmileCraft Dental & Implant Clinic",
    "locIdx": 1,
    "phone": "+91 821 251 3366",
    "about": "Invisalign aligners, painless root canal therapy, cosmetic teeth whitening, and dental implants.",
    "servicesOffered": ["Invisible Teeth Aligners", "Painless Root Canal", "Dental Implants", "Teeth Whitening & Scaling"],
    "avatarIdx": 0
  },

  # 12. Respiratory
  {
    "name": "Dr. Raghavendra Gowda",
    "specialty": "Pulmonologist",
    "specialtyKey": "pulmonology",
    "categoryId": "respiratory-group",
    "qualification": "MBBS, MD (Pulmonary Medicine)",
    "experienceYears": 13,
    "rating": 4.8,
    "reviewCount": 290,
    "fee": 600,
    "clinicName": "Mysore Chest & Respiratory Care Center",
    "locIdx": 0,
    "phone": "+91 821 245 8899",
    "about": "Asthma, chronic bronchitis, COPD, sleep apnea, and post-viral lung rehabilitation.",
    "servicesOffered": ["Spirometry / Lung Function Test", "Asthma Action Plan", "Allergy Skin Prick Test", "Sleep Apnea Evaluation"],
    "avatarIdx": 3
  },

  # 13. Blood & Cancer
  {
    "name": "Dr. Jayanthi Ramanathan",
    "specialty": "Medical Oncologist",
    "specialtyKey": "medical-oncology",
    "categoryId": "blood-cancer-group",
    "qualification": "MBBS, MD, DM (Medical Oncology)",
    "experienceYears": 18,
    "rating": 4.9,
    "reviewCount": 310,
    "fee": 1000,
    "clinicName": "Sanjeevini Comprehensive Oncology Center",
    "locIdx": 6,
    "phone": "+91 821 233 4400",
    "about": "Targeted cancer therapies, chemotherapy coordination, immunotherapy, and blood disorders management.",
    "servicesOffered": ["Chemotherapy Planning", "Cancer Second Opinion", "Immunotherapy Guidance", "Blood Cancer Screening"],
    "avatarIdx": 8
  },

  # 14. Kidney & Urinary
  {
    "name": "Dr. Chetan Mahadev",
    "specialty": "Urologist & Andrologist",
    "specialtyKey": "urology",
    "categoryId": "kidney-urinary-group",
    "qualification": "MBBS, MS, MCh (Urology)",
    "experienceYears": 15,
    "rating": 4.9,
    "reviewCount": 350,
    "fee": 700,
    "clinicName": "Mysore Kidney & Stone Clinic",
    "locIdx": 4,
    "phone": "+91 821 233 9911",
    "about": "Laser kidney stone removal (RIRS/PCNL), prostate enlargement treatment, and urinary tract health.",
    "servicesOffered": ["Laser Kidney Stone Treatment", "Prostate Care (TURP)", "Urinary Incontinence", "Male Wellness Check"],
    "avatarIdx": 7
  },

  # 15. Gastro & Liver
  {
    "name": "Dr. Pradeep Shenoy",
    "specialty": "Gastroenterologist",
    "specialtyKey": "gastroenterology",
    "categoryId": "gastro-liver-group",
    "qualification": "MBBS, MD, DM (Gastroenterology)",
    "experienceYears": 16,
    "rating": 4.9,
    "reviewCount": 440,
    "fee": 750,
    "clinicName": "Digestive Disease & Endoscopy Institute",
    "locIdx": 1,
    "phone": "+91 821 251 1100",
    "about": "Acidity/GERD, fatty liver disease, IBS, endoscopic procedures, and colon cancer screenings.",
    "servicesOffered": ["Upper GI Endoscopy & Colonoscopy", "Fatty Liver Reversal Program", "IBS Treatment", "Ulcer Care"],
    "avatarIdx": 5
  },

  # 16. Endocrine & Metabolic
  {
    "name": "Dr. Rohini K. S.",
    "specialty": "Endocrinologist & Diabetologist",
    "specialtyKey": "endocrinology",
    "categoryId": "endocrine-metabolic-group",
    "qualification": "MBBS, MD, DM (Endocrinology)",
    "experienceYears": 14,
    "rating": 4.9,
    "reviewCount": 380,
    "fee": 700,
    "clinicName": "Metabolic & Thyroid Health Care",
    "locIdx": 3,
    "phone": "+91 821 254 6600",
    "about": "Type 1 & Type 2 Diabetes, thyroid imbalances, hormonal disorders, adrenal health, and metabolic weight loss.",
    "servicesOffered": ["Diabetes Management Plan", "Thyroid Disorders Care", "PCOS Hormonal Rebalance", "Metabolic Weight Clinic"],
    "avatarIdx": 2
  },

  # 17. Infectious & Immunology
  {
    "name": "Dr. Hariprasad Rao",
    "specialty": "Infectious Disease Specialist",
    "specialtyKey": "infectious-disease",
    "categoryId": "infectious-immunology-group",
    "qualification": "MBBS, MD (Medicine), Fellowship in Infectious Diseases",
    "experienceYears": 15,
    "rating": 4.8,
    "reviewCount": 260,
    "fee": 650,
    "clinicName": "Infection & Allergy Speciality Clinic",
    "locIdx": 0,
    "phone": "+91 821 245 7700",
    "about": "Expert in chronic fevers, travel medicine, viral infections, tuberculosis, and post-illness immunity rebuilding.",
    "servicesOffered": ["Fever of Unknown Origin Workup", "Tropical Infection Treatment", "Travel Vaccinations", "Immunity Evaluation"],
    "avatarIdx": 9
  },

  # 18. Surgery
  {
    "name": "Dr. Harish Prasad",
    "specialty": "General & Laparoscopic Surgeon",
    "specialtyKey": "general-surgery",
    "categoryId": "surgery-group",
    "qualification": "MBBS, MS (General Surgery), FMAS, FIAGES",
    "experienceYears": 16,
    "rating": 4.8,
    "reviewCount": 320,
    "fee": 650,
    "clinicName": "Prasad Surgical & Laparoscopy Clinic",
    "locIdx": 0,
    "phone": "+91 821 245 4488",
    "about": "Minimally invasive laparoscopic gallbladder surgery, hernia repair, appendix surgery, and piles laser treatment.",
    "servicesOffered": ["Laparoscopic Gallbladder & Appendix", "Hernia Repair", "Laser Proctology", "Minor Daycare Surgeries"],
    "avatarIdx": 1
  },

  # 19. Emergency & Critical Care
  {
    "name": "Dr. Sunil Nataraj",
    "specialty": "Emergency Medicine Specialist",
    "specialtyKey": "emergency-medicine",
    "categoryId": "emergency-critical-group",
    "qualification": "MBBS, MD (Emergency Medicine), MEM",
    "experienceYears": 12,
    "rating": 4.8,
    "reviewCount": 290,
    "fee": 600,
    "clinicName": "Apex Emergency & Trauma Care",
    "locIdx": 6,
    "phone": "+91 821 233 1122",
    "about": "Acute trauma management, emergency stabilization, critical care triage, and advanced cardiac life support.",
    "servicesOffered": ["Acute Injury Management", "Trauma First Response", "Wound Suturing & Fracture Stabilization", "Emergency Triage"],
    "avatarIdx": 11
  }
]

# Detailed Mock Video Doctors per Category (Online Telehealth)
VIDEO_DATA = [
  # 1. General & Primary Care
  {
    "name": "Dr. Ananya Rao",
    "specialty": "General Physician",
    "specialtyKey": "general",
    "categoryId": "general-primary",
    "qualification": "MBBS, MD (General Medicine)",
    "experienceYears": 12,
    "rating": 4.9,
    "reviewCount": 520,
    "videoConsultCount": 1450,
    "fee": 450,
    "mrpFee": 650,
    "discount": "30% OFF",
    "languages": ["English", "Kannada", "Hindi"],
    "hospital": "Unnathi TeleHealth Network",
    "nextSlot": "Today, in 20 mins (04:15 PM)",
    "about": "Over 1,400+ online consultations for fever, cold/cough, diabetes monitoring, high blood pressure, and medication renewals.",
    "avatarIdx": 0
  },
  {
    "name": "Dr. Girish K. Murthy",
    "specialty": "Family Medicine Specialist",
    "specialtyKey": "family-medicine",
    "categoryId": "general-primary",
    "qualification": "MBBS, DNB (Family Medicine)",
    "experienceYears": 15,
    "rating": 4.8,
    "reviewCount": 380,
    "videoConsultCount": 890,
    "fee": 400,
    "mrpFee": 600,
    "discount": "33% OFF",
    "languages": ["English", "Kannada"],
    "hospital": "FamilyCare Online",
    "nextSlot": "Today, in 30 mins (04:30 PM)",
    "about": "Holistic family wellness consultations, routine blood report interpretation, and lifestyle counseling via video call.",
    "avatarIdx": 3
  },

  # 2. IVF & Fertility
  {
    "name": "Dr. Nandini S. Murthy",
    "specialty": "IVF & Fertility Specialist",
    "specialtyKey": "ivf-specialist",
    "categoryId": "ivf-fertility-group",
    "qualification": "MBBS, MS (OBG), Fellowship in Reproductive Medicine",
    "experienceYears": 16,
    "rating": 4.9,
    "reviewCount": 420,
    "videoConsultCount": 980,
    "fee": 750,
    "mrpFee": 1100,
    "discount": "32% OFF",
    "languages": ["English", "Kannada", "Hindi"],
    "hospital": "Mysore Fertility Virtual Institute",
    "nextSlot": "Today, in 25 mins (04:30 PM)",
    "about": "Online second opinions on IVF failure, AMH report reviews, semen analysis interpretation, and customized cycle planning.",
    "avatarIdx": 2
  },
  {
    "name": "Dr. Vikramaditya Hegde",
    "specialty": "Reproductive Medicine Consultant",
    "specialtyKey": "reproductive-medicine-ivf",
    "categoryId": "ivf-fertility-group",
    "qualification": "MBBS, DNB (OBG), M.Sc Clinical Embryology",
    "experienceYears": 14,
    "rating": 4.9,
    "reviewCount": 360,
    "videoConsultCount": 750,
    "fee": 700,
    "mrpFee": 1000,
    "discount": "30% OFF",
    "languages": ["English", "Kannada", "Telugu"],
    "hospital": "Unnathi Fertility Tele-Clinic",
    "nextSlot": "Today, 05:00 PM",
    "about": "Remote counseling on PCOS infertility, ovulation tracking, egg freezing options, and male factor fertility guidance.",
    "avatarIdx": 5
  },
  {
    "name": "Dr. Rashmi Kulkarni",
    "specialty": "Infertility & IUI Specialist",
    "specialtyKey": "infertility-care",
    "categoryId": "ivf-fertility-group",
    "qualification": "MBBS, DGO, Fellowship in ART",
    "experienceYears": 11,
    "rating": 4.8,
    "reviewCount": 290,
    "videoConsultCount": 620,
    "fee": 600,
    "mrpFee": 850,
    "discount": "29% OFF",
    "languages": ["English", "Hindi", "Kannada"],
    "hospital": "Genesis Fertility Online",
    "nextSlot": "Today, 05:45 PM",
    "about": "Compassionate online fertility counseling, hormone test evaluation, and early conception planning for couples.",
    "avatarIdx": 4
  },

  # 3. Cardiology & Related
  {
    "name": "Dr. Rahul Sharma",
    "specialty": "Cardiologist",
    "specialtyKey": "cardio",
    "categoryId": "cardiology-group",
    "qualification": "MBBS, MD, DM (Cardiology)",
    "experienceYears": 16,
    "rating": 4.9,
    "reviewCount": 410,
    "videoConsultCount": 980,
    "fee": 700,
    "mrpFee": 1000,
    "discount": "30% OFF",
    "languages": ["English", "Hindi", "Kannada"],
    "hospital": "MediCare Heart Virtual Clinic",
    "nextSlot": "Today, 05:30 PM",
    "about": "Remote cardiac second opinions, ECG & lipid profile interpretation, blood pressure management, and post-angioplasty care.",
    "avatarIdx": 1
  },

  # 4. Neurology & Mental Health
  {
    "name": "Dr. Shalini Swaminathan",
    "specialty": "Consultant Psychiatrist",
    "specialtyKey": "psychiatry",
    "categoryId": "neurology-mental",
    "qualification": "MBBS, MD (Psychiatry)",
    "experienceYears": 14,
    "rating": 4.9,
    "reviewCount": 490,
    "videoConsultCount": 1320,
    "fee": 650,
    "mrpFee": 950,
    "discount": "31% OFF",
    "languages": ["English", "Kannada", "Tamil", "Hindi"],
    "hospital": "MindWellness Tele-Clinic",
    "nextSlot": "Today, in 30 mins (04:30 PM)",
    "about": "Confidential video counseling for anxiety, workplace stress, panic attacks, depression, and adult ADHD support.",
    "avatarIdx": 8
  },
  {
    "name": "Dr. Vikram Patel",
    "specialty": "Neurologist",
    "specialtyKey": "neuro",
    "categoryId": "neurology-mental",
    "qualification": "MBBS, MD, DM (Neurology)",
    "experienceYears": 18,
    "rating": 4.8,
    "reviewCount": 350,
    "videoConsultCount": 710,
    "fee": 750,
    "mrpFee": 1100,
    "discount": "32% OFF",
    "languages": ["English", "Kannada"],
    "hospital": "NeuroCare Virtual Health",
    "nextSlot": "Tomorrow, 10:00 AM",
    "about": "Migraine history assessment, MRI/CT scan report reviews, and tremor management guidance via video.",
    "avatarIdx": 3
  },

  # 5. Orthopedics
  {
    "name": "Dr. Suresh Reddy",
    "specialty": "Orthopedic Surgeon",
    "specialtyKey": "ortho",
    "categoryId": "orthopedics-group",
    "qualification": "MBBS, MS (Orthopedics)",
    "experienceYears": 15,
    "rating": 4.8,
    "reviewCount": 310,
    "videoConsultCount": 650,
    "fee": 550,
    "mrpFee": 800,
    "discount": "31% OFF",
    "languages": ["English", "Kannada", "Telugu"],
    "hospital": "OrthoCare Virtual Center",
    "nextSlot": "Today, 06:15 PM",
    "about": "Second opinion on joint replacement, X-ray & MRI review for knee/shoulder pain, and home exercise guidance.",
    "avatarIdx": 7
  },

  # 6. Pediatrics
  {
    "name": "Dr. Sneha Reddy",
    "specialty": "Pediatrician",
    "specialtyKey": "pedia",
    "categoryId": "pediatrics-group",
    "qualification": "MBBS, DCH, DNB (Pediatrics)",
    "experienceYears": 11,
    "rating": 4.9,
    "reviewCount": 440,
    "videoConsultCount": 1100,
    "fee": 500,
    "mrpFee": 700,
    "discount": "28% OFF",
    "languages": ["English", "Kannada", "Telugu"],
    "hospital": "KidsHealth Online Clinic",
    "nextSlot": "Today, in 20 mins (04:15 PM)",
    "about": "Infant fever advice, rash checking, vaccination schedule questions, pediatric cough, and infant feeding guidance.",
    "avatarIdx": 4
  },

  # 7. Women's Health
  {
    "name": "Dr. Meera Nambiar",
    "specialty": "Gynecologist",
    "specialtyKey": "gynae",
    "categoryId": "womens-health-group",
    "qualification": "MBBS, MS (OBG)",
    "experienceYears": 14,
    "rating": 4.8,
    "reviewCount": 390,
    "videoConsultCount": 940,
    "fee": 600,
    "mrpFee": 900,
    "discount": "33% OFF",
    "languages": ["English", "Kannada", "Malayalam", "Hindi"],
    "hospital": "WomenCare TeleHealth",
    "nextSlot": "Today, 05:00 PM",
    "about": "Irregular periods, PCOS hormonal evaluation, birth control advice, pelvic health queries, and early pregnancy guidance.",
    "avatarIdx": 8
  },

  # 8. Skin & Aesthetics
  {
    "name": "Dr. Priya Nair",
    "specialty": "Dermatologist & Cosmetologist",
    "specialtyKey": "derma",
    "categoryId": "skin-aesthetics-group",
    "qualification": "MBBS, MD (Dermatology)",
    "experienceYears": 10,
    "rating": 4.8,
    "reviewCount": 380,
    "videoConsultCount": 1200,
    "fee": 550,
    "mrpFee": 800,
    "discount": "31% OFF",
    "languages": ["English", "Kannada", "Malayalam", "Hindi"],
    "hospital": "SkinCraft Online Care",
    "nextSlot": "Today, in 35 mins (04:30 PM)",
    "about": "High-definition video evaluations of acne, hair fall, scalp dandruff, skin allergies, and personalized skincare routines.",
    "avatarIdx": 2
  },

  # 9. Eye Care
  {
    "name": "Dr. Rajeshwar Prasad",
    "specialty": "Ophthalmologist",
    "specialtyKey": "ophthalmology",
    "categoryId": "eye-care-group",
    "qualification": "MBBS, MS (Ophthal)",
    "experienceYears": 17,
    "rating": 4.8,
    "reviewCount": 260,
    "videoConsultCount": 540,
    "fee": 450,
    "mrpFee": 650,
    "discount": "30% OFF",
    "languages": ["English", "Hindi", "Kannada"],
    "hospital": "TeleEye Care",
    "nextSlot": "Today, 06:00 PM",
    "about": "Eye strain evaluation from screen time, redness/dryness assessment, conjunctivitis advice, and eyewear power review.",
    "avatarIdx": 1
  },

  # 10. ENT
  {
    "name": "Dr. B. R. Sudarshan",
    "specialty": "ENT Specialist",
    "specialtyKey": "ent",
    "categoryId": "ent-group",
    "qualification": "MBBS, MS (ENT)",
    "experienceYears": 16,
    "rating": 4.8,
    "reviewCount": 280,
    "videoConsultCount": 610,
    "fee": 500,
    "mrpFee": 700,
    "discount": "28% OFF",
    "languages": ["English", "Kannada"],
    "hospital": "ENT Online Clinic",
    "nextSlot": "Tomorrow, 10:30 AM",
    "about": "Throat pain, ear ache, chronic sinus congestion, tinnitus advice, and seasonal allergy medication management.",
    "avatarIdx": 9
  },

  # 11. Dental
  {
    "name": "Dr. Kavita Joshi",
    "specialty": "Dental Surgeon",
    "specialtyKey": "dental",
    "categoryId": "dental-group",
    "qualification": "BDS, MDS (Orthodontics)",
    "experienceYears": 12,
    "rating": 4.9,
    "reviewCount": 350,
    "videoConsultCount": 780,
    "fee": 400,
    "mrpFee": 600,
    "discount": "33% OFF",
    "languages": ["English", "Hindi", "Kannada"],
    "hospital": "TeleDental Network",
    "nextSlot": "Today, 04:45 PM",
    "about": "Toothache triage, gum bleeding queries, clear aligner consultations, and dental prescription support.",
    "avatarIdx": 0
  },

  # 12. Respiratory
  {
    "name": "Dr. Raghavendra Gowda",
    "specialty": "Pulmonologist",
    "specialtyKey": "pulmonology",
    "categoryId": "respiratory-group",
    "qualification": "MBBS, MD (Pulmonary Medicine)",
    "experienceYears": 13,
    "rating": 4.8,
    "reviewCount": 270,
    "videoConsultCount": 590,
    "fee": 550,
    "mrpFee": 800,
    "discount": "31% OFF",
    "languages": ["English", "Kannada"],
    "hospital": "RespiCare TeleClinic",
    "nextSlot": "Today, 05:15 PM",
    "about": "Asthma inhaler technique review, chronic cough investigation, chest X-ray interpretation, and post-viral recovery.",
    "avatarIdx": 3
  },

  # 13. Blood & Cancer
  {
    "name": "Dr. Jayanthi Ramanathan",
    "specialty": "Medical Oncologist",
    "specialtyKey": "medical-oncology",
    "categoryId": "blood-cancer-group",
    "qualification": "MBBS, MD, DM (Medical Oncology)",
    "experienceYears": 18,
    "rating": 4.9,
    "reviewCount": 330,
    "videoConsultCount": 620,
    "fee": 850,
    "mrpFee": 1200,
    "discount": "29% OFF",
    "languages": ["English", "Tamil", "Kannada"],
    "hospital": "OncoConnect Virtual Care",
    "nextSlot": "Tomorrow, 11:00 AM",
    "about": "Cancer second opinions, biopsy & PET CT scan reviews, chemotherapy symptom management, and precision oncology guidance.",
    "avatarIdx": 8
  },

  # 14. Kidney & Urinary
  {
    "name": "Dr. Chetan Mahadev",
    "specialty": "Urologist",
    "specialtyKey": "urology",
    "categoryId": "kidney-urinary-group",
    "qualification": "MBBS, MS, MCh (Urology)",
    "experienceYears": 15,
    "rating": 4.9,
    "reviewCount": 310,
    "videoConsultCount": 530,
    "fee": 650,
    "mrpFee": 950,
    "discount": "31% OFF",
    "languages": ["English", "Kannada"],
    "hospital": "UroHealth Online",
    "nextSlot": "Today, 06:30 PM",
    "about": "Kidney stone ultrasound reviews, recurrent UTI treatment, prostate health counseling, and male urinary symptom relief.",
    "avatarIdx": 7
  },

  # 15. Gastro & Liver
  {
    "name": "Dr. Pradeep Shenoy",
    "specialty": "Gastroenterologist",
    "specialtyKey": "gastroenterology",
    "categoryId": "gastro-liver-group",
    "qualification": "MBBS, MD, DM (Gastroenterology)",
    "experienceYears": 16,
    "rating": 4.9,
    "reviewCount": 390,
    "videoConsultCount": 810,
    "fee": 650,
    "mrpFee": 950,
    "discount": "31% OFF",
    "languages": ["English", "Kannada", "Hindi"],
    "hospital": "GastroCare Online",
    "nextSlot": "Today, in 40 mins (04:40 PM)",
    "about": "Chronic acid reflux management, ultrasound liver reports interpretation, IBS diet counseling, and ulcer care.",
    "avatarIdx": 5
  },

  # 16. Endocrine & Metabolic
  {
    "name": "Dr. Rohini K. S.",
    "specialty": "Endocrinologist & Diabetologist",
    "specialtyKey": "endocrinology",
    "categoryId": "endocrine-metabolic-group",
    "qualification": "MBBS, MD, DM (Endocrinology)",
    "experienceYears": 14,
    "rating": 4.9,
    "reviewCount": 370,
    "videoConsultCount": 860,
    "fee": 650,
    "mrpFee": 900,
    "discount": "28% OFF",
    "languages": ["English", "Kannada", "Hindi"],
    "hospital": "ThyroDiab TeleClinic",
    "nextSlot": "Today, 05:30 PM",
    "about": "HbA1c diabetes dose adjustment, thyroid TSH balancing, hormonal weight resistance, and lipid profile control.",
    "avatarIdx": 2
  },

  # 17. Infectious & Immunology
  {
    "name": "Dr. Hariprasad Rao",
    "specialty": "Infectious Disease Specialist",
    "specialtyKey": "infectious-disease",
    "categoryId": "infectious-immunology-group",
    "qualification": "MBBS, MD (Medicine), FID",
    "experienceYears": 15,
    "rating": 4.8,
    "reviewCount": 240,
    "videoConsultCount": 490,
    "fee": 550,
    "mrpFee": 800,
    "discount": "31% OFF",
    "languages": ["English", "Kannada"],
    "hospital": "InfectoCare Virtual Clinic",
    "nextSlot": "Today, 06:00 PM",
    "about": "Prolonged fever evaluation, travel medical advice, antibiotic guidance, and seasonal viral infection care.",
    "avatarIdx": 9
  },

  # 18. Surgery
  {
    "name": "Dr. Harish Prasad",
    "specialty": "General & Laparoscopic Surgeon",
    "specialtyKey": "general-surgery",
    "categoryId": "surgery-group",
    "qualification": "MBBS, MS (General Surgery), FMAS",
    "experienceYears": 16,
    "rating": 4.8,
    "reviewCount": 310,
    "videoConsultCount": 580,
    "fee": 600,
    "mrpFee": 850,
    "discount": "29% OFF",
    "languages": ["English", "Kannada", "Hindi"],
    "hospital": "SurgiConsult Online",
    "nextSlot": "Today, 05:00 PM",
    "about": "Surgical second opinions on hernia, gallbladder stones, piles laser options, and post-operative wound healing checks.",
    "avatarIdx": 1
  },

  # 19. Emergency & Critical Care
  {
    "name": "Dr. Sunil Nataraj",
    "specialty": "Emergency Medicine Specialist",
    "specialtyKey": "emergency-medicine",
    "categoryId": "emergency-critical-group",
    "qualification": "MBBS, MD (Emergency Medicine)",
    "experienceYears": 12,
    "rating": 4.8,
    "reviewCount": 280,
    "videoConsultCount": 670,
    "fee": 550,
    "mrpFee": 800,
    "discount": "31% OFF",
    "languages": ["English", "Kannada"],
    "hospital": "TeleTriage Emergency Support",
    "nextSlot": "Today, in 15 mins (04:10 PM)",
    "about": "Instant video triage for acute symptoms, burn/wound assessment, whether to visit an emergency room, and urgent medical advice.",
    "avatarIdx": 11
  }
]

# Build JS content for src/data/doctors.js
def generate_in_clinic_js():
    doctors_list = []
    for idx, d in enumerate(IN_PERSON_DATA, 1):
        loc = LOCALITIES[d["locIdx"]]
        avatar = AVATARS[d["avatarIdx"] % len(AVATARS)]
        doc_obj = {
            "id": str(idx),
            "name": d["name"],
            "specialty": d["specialty"],
            "specialtyKey": d["specialtyKey"],
            "categoryId": d["categoryId"],
            "qualification": d["qualification"],
            "experienceYears": d["experienceYears"],
            "experience": f"{d['experienceYears']} Years Experience",
            "rating": d["rating"],
            "reviewCount": d["reviewCount"],
            "fee": d["fee"],
            "clinicName": d["clinicName"],
            "clinicArea": loc["area"],
            "clinicAddress": loc["address"],
            "distanceKm": loc["dKm"],
            "distance": loc["distance"],
            "latitude": loc["lat"],
            "longitude": loc["lng"],
            "phone": d["phone"],
            "openHours": "09:00 AM - 01:30 PM, 04:30 PM - 08:30 PM",
            "availableToday": True,
            "nextSlot": "Today, 04:30 PM",
            "slots": ["09:30 AM", "11:00 AM", "04:30 PM", "06:00 PM", "07:30 PM"],
            "image": avatar,
            "about": d["about"],
            "servicesOffered": d["servicesOffered"],
            "badges": ["Verified Doctor", "Top Choice"]
        }
        doctors_list.append(doc_obj)

    js_code = f"""// ==================================================
// IN-PERSON DOCTORS & SPECIALIZATIONS TAXONOMY
// ==================================================

export const SPECIALIZATION_CATEGORIES = {json.dumps(CATEGORIES, indent=2)};

// Flattened list of all specialties for quick lookup & backward compatibility
export const doctorSpecialties = [
  {{ id: 'all', key: 'all', name: 'All Doctors', icon: 'medkit-outline', categoryId: 'all' }},
  ...SPECIALIZATION_CATEGORIES.flatMap((cat) =>
    cat.specialties.map((spec) => ({{
      ...spec,
      categoryName: cat.name,
      categoryId: cat.id,
    }}))
  ),
];

const doctors = {json.dumps(doctors_list, indent=2)};

export default doctors;
"""
    return js_code

# Build JS content for src/data/videoDoctors.js
def generate_video_doctors_js():
    video_list = []
    for idx, d in enumerate(VIDEO_DATA, 1):
        avatar = AVATARS[d["avatarIdx"] % len(AVATARS)]
        doc_obj = {
            "id": f"v-{idx}",
            "name": d["name"],
            "specialty": d["specialty"],
            "specialtyKey": d["specialtyKey"],
            "categoryId": d["categoryId"],
            "qualification": d["qualification"],
            "experienceYears": d["experienceYears"],
            "experience": f"{d['experienceYears']} Years Experience",
            "rating": d["rating"],
            "reviewCount": d["reviewCount"],
            "videoConsultCount": d["videoConsultCount"],
            "fee": d["fee"],
            "mrpFee": d["mrpFee"],
            "discount": d["discount"],
            "languages": d["languages"],
            "hospital": d["hospital"],
            "availableToday": True,
            "nextSlot": d["nextSlot"],
            "slots": ["04:15 PM", "05:00 PM", "06:15 PM", "07:30 PM", "08:45 PM"],
            "image": avatar,
            "about": d["about"],
            "services": ["Instant Video Consultation", "Digital Verified e-Prescription", "Lab Test Follow-up Review", "Lifestyle & Dietary Advice"],
            "badges": ["Verified Specialist", "Instant Connect"]
        }
        video_list.append(doc_obj)

    js_code = f"""// ==================================================
// VIDEO CONSULTATION DOCTORS DATA
// ==================================================

import {{ SPECIALIZATION_CATEGORIES, doctorSpecialties }} from './doctors';

export {{ SPECIALIZATION_CATEGORIES }};
export const videoSpecialties = [
  {{ id: 'all', key: 'all', name: 'All Specialties', icon: 'videocam-outline', categoryId: 'all' }},
  ...SPECIALIZATION_CATEGORIES.flatMap((cat) =>
    cat.specialties.map((spec) => ({{
      ...spec,
      categoryName: cat.name,
      categoryId: cat.id,
    }}))
  ),
];

export const videoDoctors = {json.dumps(video_list, indent=2)};
"""
    return js_code

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    doctors_path = os.path.join(base_dir, 'src', 'data', 'doctors.js')
    video_doctors_path = os.path.join(base_dir, 'src', 'data', 'videoDoctors.js')

    in_clinic_js = generate_in_clinic_js()
    with open(doctors_path, 'w', encoding='utf-8') as f:
        f.write(in_clinic_js)
    print(f"Written: {doctors_path} ({len(IN_PERSON_DATA)} doctors)")

    video_js = generate_video_doctors_js()
    with open(video_doctors_path, 'w', encoding='utf-8') as f:
        f.write(video_js)
    print(f"Written: {video_doctors_path} ({len(VIDEO_DATA)} doctors)")

    print("Verification: Every category has at least 1 doctor in both files!")
    cat_ids = [c["id"] for c in CATEGORIES]
    for cid in cat_ids:
        in_c = sum(1 for d in IN_PERSON_DATA if d["categoryId"] == cid)
        vid_c = sum(1 for d in VIDEO_DATA if d["categoryId"] == cid)
        assert in_c > 0, f"Missing in-person doctor for category: {cid}"
        assert vid_c > 0, f"Missing video doctor for category: {cid}"
    print(f"SUCCESS: All {len(CATEGORIES)} categories verified with 100% doctor coverage!")

if __name__ == '__main__':
    main()
