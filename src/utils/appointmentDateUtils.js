/**
 * appointmentDateUtils.js
 * Comprehensive Real-Time Date, Time, and Status Engine for Appointments
 * MediUnify Healthcare Platform
 */

/**
 * Returns user / application timezone consistently
 */
export const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch (e) {
    return 'Asia/Kolkata';
  }
};

/**
 * Safely parses a date string (YYYY-MM-DD or ISO) into local date parts
 * to prevent UTC midnight date shifting across timezones.
 */
export const parseLocalDate = (dateVal) => {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return new Date(dateVal.getTime());

  if (typeof dateVal === 'string') {
    // If it's a date string like '2026-10-01' or '2026-10-01T...'
    const cleanStr = dateVal.trim();
    const dateMatch = cleanStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1;
      const day = parseInt(dateMatch[3], 10);
      return new Date(year, month, day);
    }

    const parsed = Date.parse(cleanStr);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
  }

  return new Date();
};

/**
 * Returns formatted YYYY-MM-DD string in local timezone
 */
export const getLocalDateString = (d = new Date()) => {
  const dateObj = d instanceof Date ? d : parseLocalDate(d);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Adds (or subtracts) days relative to a base date in local time
 */
export const addDaysToDate = (baseDate = new Date(), days = 0) => {
  const d = new Date(baseDate.getTime());
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Extracts exact hours and minutes from time string (e.g. '09:30 AM', '14:30', '10:00 AM - 10:30 AM')
 */
export const parseTimeString = (timeStr = '') => {
  if (!timeStr) return { hours: 9, minutes: 0, formatted: '09:00 AM' };

  const str = String(timeStr).trim();
  const match = str.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);

  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridian = match[3] ? match[3].toUpperCase() : null;

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    const displayHours = hours % 12 || 12;
    const displayMeridian = hours >= 12 ? 'PM' : 'AM';
    const formatted = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${displayMeridian}`;

    return { hours, minutes, formatted };
  }

  return { hours: 9, minutes: 0, formatted: '09:00 AM' };
};

/**
 * Safely constructs a full Date object representing the appointment slot in local timezone
 */
export const getAppointmentDateTime = (dateVal, timeVal) => {
  const d = parseLocalDate(dateVal);
  const { hours, minutes } = parseTimeString(timeVal);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

/**
 * Computes calendar day difference (0 = today, 1 = tomorrow, -1 = yesterday)
 */
export const getDayDifference = (targetDate, referenceDate = new Date()) => {
  const target = parseLocalDate(targetDate);
  const ref = parseLocalDate(referenceDate);

  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const refMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();

  const diffMs = targetMidnight - refMidnight;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Formats appointment date string:
 * - "Today"
 * - "Tomorrow"
 * - "Yesterday"
 * - "5 Oct 2026"
 */
export const formatAppointmentDateLabel = (dateVal, referenceDate = new Date()) => {
  if (!dateVal) return 'Upcoming';

  const diffDays = getDayDifference(dateVal, referenceDate);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  const d = parseLocalDate(dateVal);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats appointment combined dynamic date and time label:
 * - If today: "Today, 09:30 AM"
 * - If tomorrow: "Tomorrow, 09:30 AM"
 * - Otherwise: "5 Oct 2026, 09:30 AM"
 */
export const formatAppointmentDateTimeLabel = (dateVal, timeVal, referenceDate = new Date()) => {
  const { formatted: cleanTime } = parseTimeString(timeVal);
  const dateLabel = formatAppointmentDateLabel(dateVal, referenceDate);
  return `${dateLabel}, ${cleanTime}`;
};

/**
 * Formats the actual booking date (Booked on date)
 * Ensures the date is formatted nicely e.g. "27 Sep 2026" without ever replacing it with current date.
 */
export const formatBookingDateLabel = (bookingDateVal) => {
  if (!bookingDateVal) return 'Recently';

  try {
    const d = parseLocalDate(bookingDateVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch (e) {}

  return String(bookingDateVal);
};

/**
 * Determines dynamic appointment status in real-time based on the current date/time:
 * - Cancelled: appointment was cancelled
 * - Rescheduled: appointment was moved to another date/time (and has not passed yet)
 * - Completed: appointment date/time has already passed
 * - Today: appointment is scheduled for the current date and time is upcoming/ongoing
 * - Upcoming: appointment date/time is in the future
 */
export const getAppointmentDynamicStatus = (appointment, referenceDate = new Date()) => {
  if (!appointment) return 'Upcoming';

  const rawStatus = String(appointment.status || appointment.bookingStatus || '').toLowerCase();

  // 1. Cancelled takes precedence
  if (rawStatus.includes('cancel') || appointment.isCancelled === true) {
    return 'Cancelled';
  }

  const apptDateTime = getAppointmentDateTime(
    appointment.date || appointment.formattedDate,
    appointment.time || appointment.timeSlot
  );
  const now = referenceDate instanceof Date ? referenceDate : new Date();

  // 2. Has the appointment date & time passed?
  if (apptDateTime.getTime() < now.getTime()) {
    return 'Completed';
  }

  // 3. Rescheduled (future slot)
  if (rawStatus.includes('reschedul') || appointment.isRescheduled === true) {
    return 'Rescheduled';
  }

  // 4. Scheduled for Today (current calendar date, future slot time)
  const diffDays = getDayDifference(appointment.date, now);
  if (diffDays === 0) {
    return 'Today';
  }

  // 5. Future date
  return 'Upcoming';
};

/**
 * Returns dynamic UI styling tokens for a given status
 */
export const getStatusBadgeConfig = (status) => {
  const s = String(status || '').toLowerCase();

  if (s.includes('cancel')) {
    return {
      bg: '#FEE2E2',
      text: '#EF4444',
      border: '#FECACA',
      icon: 'close-circle',
      label: 'Cancelled',
    };
  }

  if (s.includes('complete')) {
    return {
      bg: '#EFF6FF',
      text: '#2563EB',
      border: '#BFDBFE',
      icon: 'checkmark-done-circle',
      label: 'Completed',
    };
  }

  if (s.includes('reschedul')) {
    return {
      bg: '#FEF3C7',
      text: '#D97706',
      border: '#FDE68A',
      icon: 'time',
      label: 'Rescheduled',
    };
  }

  if (s === 'today') {
    return {
      bg: '#FEF9C3',
      text: '#854D0E',
      border: '#FDE047',
      icon: 'today-outline',
      label: 'Today',
    };
  }

  // Upcoming / Confirmed
  return {
    bg: '#E6F8F4',
    text: '#00B894',
    border: '#A7F3D0',
    icon: 'checkmark-circle',
    label: 'Upcoming',
  };
};

/**
 * Generates initial real-time sample appointments relative to the current system date.
 * Replaces hardcoded static dates with dynamic offsets, ensuring ready database schema.
 */
export const generateRealtimeSeedAppointments = () => {
  const now = new Date();
  const tz = getUserTimezone();

  // Helper to get formatted string for offset days
  const dateAtOffset = (offset) => getLocalDateString(addDaysToDate(now, offset));

  return [
    {
      id: 'APT-PHY-8821',
      bookingDate: dateAtOffset(-3),
      date: dateAtOffset(1), // Tomorrow
      time: '10:30 AM',
      timeSlot: 'Morning Slot (10:30 AM - 11:00 AM)',
      timezone: tz,
      isUpcoming: true,
      status: 'Upcoming',
      paymentStatus: 'Paid Online via UPI',
      amount: 650,
      serviceType: 'In-Clinic Specialist Consultation',
      facilityName: 'Aster CMI Hospital OPD',
      department: 'Cardiology & Vascular Medicine',
      doctor: {
        id: 'doc-cardio-1',
        name: 'Dr. Anita Sharma',
        specialty: 'Senior Cardiologist & Interventionalist',
        qualification: 'MBBS, MD, DM (Cardiology)',
        image: 'https://images.unsplash.com/photo-1594824813576-92f70b79873a?auto=format&fit=crop&q=80&w=300',
      },
      location: 'Hebbal, Outer Ring Road, Bengaluru',
      address: '#43/2, New Airport Road, NH 44, Sahakar Nagar, Hebbal, Bengaluru, Karnataka 560092',
      phone: '+91 80 4342 0100',
      directionsUrl: 'https://maps.google.com/?q=Aster+CMI+Hospital+Bengaluru',
      patient: {
        id: 'self',
        name: 'Hemanth Gowda',
        relation: 'Self',
        age: 28,
        gender: 'Male',
        reason: 'Routine ECG Review & Cardiac Wellness Assessment',
      },
      instructions: 'Please bring your previous cardiac reports and reach 15 minutes before the appointment time.',
    },
    {
      id: 'APT-PHY-7940',
      bookingDate: dateAtOffset(-2),
      date: dateAtOffset(4), // 4 days later
      time: '02:15 PM',
      timeSlot: 'Afternoon Slot (02:15 PM - 02:45 PM)',
      timezone: tz,
      isUpcoming: true,
      status: 'Upcoming',
      paymentStatus: 'Pay at Clinic',
      amount: 500,
      serviceType: 'Diagnostic Ultrasound Scan',
      facilityName: 'Neuberg Anand Reference Diagnostic Centre',
      department: 'Radiology & Sonography',
      doctor: {
        id: 'doc-rad-1',
        name: 'Dr. Suresh Varma',
        specialty: 'Consultant Radiologist',
        qualification: 'MBBS, DMRD, DNB',
        image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      },
      location: 'Shivajinagar, Bengaluru',
      address: 'No. 54, Bowring Hospital Road, Tasker Town, Shivajinagar, Bengaluru 560051',
      phone: '+91 80 2286 1100',
      directionsUrl: 'https://maps.google.com/?q=Neuberg+Anand+Diagnostic+Shivajinagar',
      patient: {
        id: 'fam-father',
        name: 'Ramesh Gowda',
        relation: 'Father',
        age: 59,
        gender: 'Male',
        reason: 'Abdominal & Liver Ultrasound Screening',
      },
      instructions: 'Fasting of 4-6 hours required prior to abdominal scan. Drink 1 litre of water 1 hour before.',
    },
    {
      id: 'APT-PHY-7119',
      bookingDate: dateAtOffset(-1),
      date: dateAtOffset(0), // Today
      time: '04:30 PM',
      timeSlot: 'Evening Slot (04:30 PM - 05:00 PM)',
      timezone: tz,
      isUpcoming: true,
      status: 'Today',
      paymentStatus: 'Paid Online via UPI',
      amount: 600,
      serviceType: 'In-Clinic Consultation',
      facilityName: 'Apollo Cradle & Specialty Clinic',
      department: 'General Internal Medicine',
      doctor: {
        id: 'doc-med-1',
        name: 'Dr. Meera Nambiar',
        specialty: 'Consultant Physician',
        qualification: 'MBBS, MD (Medicine)',
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      },
      location: 'Kuvempunagar, Mysuru',
      address: 'No. 24, 5th Cross, Kuvempunagar, Mysuru 570023',
      phone: '+91 821 245 9901',
      directionsUrl: 'https://maps.google.com/?q=Kuvempunagar+Mysuru',
      patient: {
        id: 'self',
        name: 'Hemanth Gowda',
        relation: 'Self',
        age: 28,
        gender: 'Male',
        reason: 'Seasonal Viral Fever & General Health Checkup',
      },
      instructions: 'Report to Reception Desk 2 for vitals checkup 10 minutes prior.',
    },
    {
      id: 'APT-PHY-6102',
      bookingDate: dateAtOffset(-8),
      date: dateAtOffset(-4), // 4 days ago
      time: '11:00 AM',
      timeSlot: 'Morning Slot (11:00 AM - 11:30 AM)',
      timezone: tz,
      isUpcoming: false,
      status: 'Completed',
      paymentStatus: 'Paid Online via UPI',
      amount: 800,
      serviceType: 'In-Clinic Consultation',
      facilityName: 'Manipal Hospital Consultation Suites',
      department: 'Orthopaedics & Joint Replacement',
      doctor: {
        id: 'doc-ortho-1',
        name: 'Dr. Rajesh Iyer',
        specialty: 'Senior Orthopaedic Surgeon',
        qualification: 'MS (Ortho), MCh, FRCS',
        image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
      },
      location: 'HAL Old Airport Road, Bengaluru',
      address: '98, HAL Old Airport Rd, Kodihalli, Bengaluru 560017',
      phone: '+91 80 2502 4444',
      directionsUrl: 'https://maps.google.com/?q=Manipal+Hospital+HAL+Airport+Road',
      patient: {
        id: 'fam-mother',
        name: 'Meena Gowda',
        relation: 'Mother',
        age: 56,
        gender: 'Female',
        reason: 'Right Knee Joint & Arthritis Follow-up',
      },
      instructions: 'Completed consultation. Prescribed physiotherapy sessions and knee strengthening exercises.',
    },
    {
      id: 'APT-PHY-5011',
      bookingDate: dateAtOffset(-16),
      date: dateAtOffset(-12), // 12 days ago
      time: '09:00 AM',
      timeSlot: 'Morning Slot (09:00 AM - 09:30 AM)',
      timezone: tz,
      isUpcoming: false,
      status: 'Completed',
      paymentStatus: 'Paid via MediUnify Wallet',
      amount: 400,
      serviceType: 'Laboratory Sample Collection',
      facilityName: 'MediUnify Central Diagnostic Lab',
      department: 'Clinical Pathology',
      doctor: {
        id: 'doc-path-1',
        name: 'Dr. Sneha Patil',
        specialty: 'Chief Pathologist',
        qualification: 'MBBS, MD Pathology',
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      },
      location: 'Indiranagar 100ft Road, Bengaluru',
      address: '#714, 100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
      phone: '+91 80 2521 8899',
      directionsUrl: 'https://maps.google.com/?q=Indiranagar+100ft+Road+Bengaluru',
      patient: {
        id: 'fam-brother',
        name: 'Suresh Gowda',
        relation: 'Brother',
        age: 24,
        gender: 'Male',
        reason: 'Sports Fitness & Lipid Profile Screening',
      },
      instructions: 'Sample collected successfully. Reports generated within 12 hours.',
    },
    {
      id: 'APT-PHY-4180',
      bookingDate: dateAtOffset(-12),
      date: dateAtOffset(-8), // 8 days ago
      time: '04:00 PM',
      timeSlot: 'Evening Slot (04:00 PM - 04:30 PM)',
      timezone: tz,
      isUpcoming: false,
      status: 'Cancelled',
      paymentStatus: 'Refunded to Source (₹550)',
      amount: 550,
      serviceType: 'In-Clinic Consultation',
      facilityName: 'Apollo Cradle & Children Hospital',
      department: 'Pediatrics & Neonatology',
      doctor: {
        id: 'doc-peds-1',
        name: 'Dr. Vivek Menon',
        specialty: 'Senior Pediatrician',
        qualification: 'MBBS, DCH, DNB',
        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
      },
      location: 'Jayanagar, Bengaluru',
      address: '5th Block, 46th Cross, 8th Main, Jayanagar, Bengaluru 560041',
      phone: '+91 80 4668 8888',
      directionsUrl: 'https://maps.google.com/?q=Apollo+Cradle+Jayanagar',
      patient: {
        id: 'self',
        name: 'Hemanth Gowda',
        relation: 'Self',
        age: 28,
        gender: 'Male',
        reason: 'General Consultation',
      },
      instructions: 'Cancelled by patient due to travel schedule. Full refund processed.',
    },
  ];
};
