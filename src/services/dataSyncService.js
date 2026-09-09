import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const DEFAULT_PORT = 5000;
const CURRENT_LAN_IP = '192.168.29.61';

let cachedWorkingUrl = null;

/**
 * Generates priority candidate URLs based on runtime platform and network context
 */
export const getCandidateUrls = () => {
  const candidates = [];

  if (cachedWorkingUrl) {
    candidates.push(cachedWorkingUrl);
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      candidates.push(`http://${window.location.hostname}:${DEFAULT_PORT}`);
    }
    candidates.push(`http://localhost:${DEFAULT_PORT}`);
    candidates.push(`http://127.0.0.1:${DEFAULT_PORT}`);
    candidates.push(`http://${CURRENT_LAN_IP}:${DEFAULT_PORT}`);
  } else {
    // On Mobile (Expo Go / physical device), extract Metro bundler host IP
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest?.debuggerHost ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip) {
        candidates.push(`http://${ip}:${DEFAULT_PORT}`);
      }
    }
    candidates.push(`http://${CURRENT_LAN_IP}:${DEFAULT_PORT}`);
    candidates.push(`http://10.0.2.2:${DEFAULT_PORT}`); // Android emulator loopback
    candidates.push(`http://localhost:${DEFAULT_PORT}`);
  }

  return Array.from(new Set(candidates));
};

export const getBackendUrl = () => {
  return getCandidateUrls()[0] || `http://localhost:${DEFAULT_PORT}`;
};

/**
 * Low-level HTTP helper with automatic multi-host candidate failover
 */
const apiRequest = async (endpoint, options = {}, timeoutMs = 2500) => {
  const candidates = getCandidateUrls();
  let lastError = null;

  for (const baseUrl of candidates) {
    const url = `${baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      cachedWorkingUrl = baseUrl;
      const data = await response.json().catch(() => ({}));
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err.message;
      // Continue to next candidate
    }
  }

  console.warn(`[DataSync] All candidate endpoints failed for ${endpoint}:`, lastError);
  return { ok: false, error: lastError || 'Connection failed' };
};

/**
 * Synchronize full user object to local AsyncStorage
 */
export const saveUserToLocalStorage = async (user) => {
  if (!user) return;

  try {
    const primaryData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      age: user.age,
      bloodGroup: user.bloodGroup,
      dob: user.dob,
      emergencyContact: user.emergencyContact,
      address: user.address,
    };

    // 1. Primary profile keys
    await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(primaryData));
    await AsyncStorage.setItem('user', JSON.stringify(primaryData));
    if (user.name) await AsyncStorage.setItem('userName', user.name);
    if (user.email) await AsyncStorage.setItem('userEmail', user.email);
    if (user.phone) await AsyncStorage.setItem('userPhone', user.phone);
    if (user.id) await AsyncStorage.setItem('userId', user.id);

    // 2. Wallet
    if (user.walletBalance !== undefined) {
      await AsyncStorage.setItem('@unnathi_wallet_balance', String(user.walletBalance));
    }
    if (user.walletTransactions) {
      await AsyncStorage.setItem('@unnathi_wallet_transactions', JSON.stringify(user.walletTransactions));
    }

    // 3. Appointments & Bookings
    if (user.appointments && Array.isArray(user.appointments)) {
      // Merge with existing local appointments so any locally created bookings are preserved
      let localAppts = [];
      try {
        const localApptStr = await AsyncStorage.getItem('@unnathi_appointments');
        if (localApptStr) localAppts = JSON.parse(localApptStr);
      } catch (e) {}

      const apptMap = new Map();
      // Server appointments first
      user.appointments.forEach((a) => {
        if (a && a.id) apptMap.set(a.id, a);
      });
      // Keep any local bookings not yet synced to server
      localAppts.forEach((a) => {
        if (a && a.id && !apptMap.has(a.id)) {
          apptMap.set(a.id, a);
        }
      });
      const consolidatedAppts = Array.from(apptMap.values());
      await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(consolidatedAppts));

      // 3a. Video Consultations
      const vidAppts = consolidatedAppts.filter((a) =>
        a.serviceType === 'video' ||
        a.type === 'Video Consultation' ||
        a.type === 'Video' ||
        a.type === 'TeleConsultation' ||
        (typeof a.type === 'string' && a.type.toLowerCase().includes('video'))
      );
      if (vidAppts.length > 0) {
        await AsyncStorage.setItem('@videoBookings', JSON.stringify(vidAppts));
      }

      // 3b. Diagnostic Lab Tests
      const labAppts = consolidatedAppts.filter((a) =>
        a.serviceType === 'lab' ||
        a.type === 'Lab Test' ||
        a.type === 'Diagnostic Lab Test' ||
        a.type === 'Lab' ||
        (Array.isArray(a.tests) && a.tests.length > 0 && a.type !== 'Radiology')
      );
      if (labAppts.length > 0) {
        await AsyncStorage.setItem('@labBookings', JSON.stringify(labAppts));
      }

      // 3c. Radiology Scans
      const radAppts = consolidatedAppts.filter((a) =>
        a.serviceType === 'radiology' ||
        a.type === 'Radiology' ||
        a.type === 'Radiology Scan' ||
        a.bookingType === 'Radiology'
      );
      if (radAppts.length > 0) {
        await AsyncStorage.setItem('@radiologyBookings', JSON.stringify(radAppts));
      }

      // 3d. Home Nurse Care
      const nurseAppts = consolidatedAppts.filter((a) =>
        a.serviceType === 'nurse' ||
        a.type === 'Home Nurse Care' ||
        a.type === 'Nurse' ||
        a.assignedNurse !== undefined ||
        (typeof a.serviceName === 'string' && a.serviceName.includes('Staff'))
      );
      if (nurseAppts.length > 0) {
        await AsyncStorage.setItem('@unnathi_nurse_bookings', JSON.stringify(nurseAppts));
      }
    }

    // 4. Family Members
    if (user.familyMembers && Array.isArray(user.familyMembers)) {
      await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(user.familyMembers));
      const effectiveName = user.name || 'User';
      const userKey = (user.email || user.phone || effectiveName).toLowerCase().replace(/[^a-z0-9]/g, '_');
      await AsyncStorage.setItem(`@unnathi_family_members_${userKey}`, JSON.stringify(user.familyMembers));
    }

    // 5. Orders & Prescriptions
    if (user.orders && Array.isArray(user.orders)) {
      await AsyncStorage.setItem('@orders', JSON.stringify(user.orders));
      await AsyncStorage.setItem('@unnathi_pharmacy_orders', JSON.stringify(user.orders));
    }
    if (user.prescriptions && Array.isArray(user.prescriptions)) {
      await AsyncStorage.setItem('@unnathi_prescriptions', JSON.stringify(user.prescriptions));
    }

    // 6. Cache credential locally for offline fallback
    if (user.phone || user.email) {
      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      try {
        if (regCredsStr) registeredCreds = JSON.parse(regCredsStr);
      } catch (e) {}

      const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const emailKey = (user.email || '').toLowerCase().trim();

      const credObj = {
        password: user.password || 'password123',
        userData: primaryData,
      };

      if (cleanPhone.length === 10) registeredCreds[cleanPhone] = credObj;
      if (emailKey) registeredCreds[emailKey] = credObj;

      await AsyncStorage.setItem('@unnathi_registered_credentials', JSON.stringify(registeredCreds));
    }

    console.log('[DataSync] Successfully saved synced user data to AsyncStorage');
  } catch (err) {
    console.error('[DataSync] Error saving user to AsyncStorage:', err);
  }
};

/**
 * Login via Central Data Server
 */
export const syncLogin = async (identifier, password) => {
  const res = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });

  if (res.ok && res.data && res.data.success && res.data.user) {
    await saveUserToLocalStorage(res.data.user);
    return { success: true, user: res.data.user, source: 'server' };
  }

  return {
    success: false,
    message: res.data?.message || res.error || 'Server login failed',
    status: res.status,
  };
};

/**
 * Register via Central Data Server
 */
export const syncRegister = async (userData, password) => {
  const res = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...userData, password }),
  });

  if (res.ok && res.data && res.data.success && res.data.user) {
    await saveUserToLocalStorage(res.data.user);
    return { success: true, user: res.data.user, source: 'server' };
  }

  return {
    success: false,
    message: res.data?.message || res.error || 'Server registration failed',
  };
};

/**
 * Pull latest user data from Central Data Server
 */
export const pullUserData = async (userId) => {
  if (!userId) return null;

  const res = await apiRequest(`/api/user/${encodeURIComponent(userId)}`, {
    method: 'GET',
  });

  if (res.ok && res.data && res.data.success && res.data.user) {
    await saveUserToLocalStorage(res.data.user);
    return res.data.user;
  }
  return null;
};

/**
 * Bidirectional sync: sends local updates and receives the consolidated server state
 */
export const syncActiveUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('@unnathi_primary_user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    const userId = user.phone || user.email || user.id;
    if (!userId) return null;

    // Gather local state to sync
    const appointmentsStr = await AsyncStorage.getItem('@unnathi_appointments');
    const appointments = appointmentsStr ? JSON.parse(appointmentsStr) : [];

    const walletBalStr = await AsyncStorage.getItem('@unnathi_wallet_balance');
    const walletBalance = walletBalStr ? Number(walletBalStr) : undefined;

    const walletTxStr = await AsyncStorage.getItem('@unnathi_wallet_transactions');
    const walletTransactions = walletTxStr ? JSON.parse(walletTxStr) : [];

    const familyStr = await AsyncStorage.getItem('@unnathi_family_members');
    const familyMembers = familyStr ? JSON.parse(familyStr) : [];

    // Read pharmacy orders from both keys
    const pharmOrdersStr = await AsyncStorage.getItem('@unnathi_pharmacy_orders');
    const genOrdersStr = await AsyncStorage.getItem('@orders');
    const localPharmOrders = pharmOrdersStr ? JSON.parse(pharmOrdersStr) : [];
    const localGenOrders = genOrdersStr ? JSON.parse(genOrdersStr) : [];
    
    // Combine uniquely
    const ordersMap = new Map();
    [...localPharmOrders, ...localGenOrders].forEach((o) => {
      if (o && o.id) ordersMap.set(o.id, o);
    });
    const orders = Array.from(ordersMap.values());

    // Also include lab, video, radiology, and nurse bookings from local storage
    const labBookingsStr = await AsyncStorage.getItem('@labBookings');
    const localLabBookings = labBookingsStr ? JSON.parse(labBookingsStr) : [];

    const vidBookingsStr = await AsyncStorage.getItem('@videoBookings');
    const localVidBookings = vidBookingsStr ? JSON.parse(vidBookingsStr) : [];

    const radBookingsStr = await AsyncStorage.getItem('@radiologyBookings');
    const localRadBookings = radBookingsStr ? JSON.parse(radBookingsStr) : [];

    const nurseBookingsStr = await AsyncStorage.getItem('@unnathi_nurse_bookings');
    const localNurseBookings = nurseBookingsStr ? JSON.parse(nurseBookingsStr) : [];

    const apptMap = new Map();
    [
      ...appointments,
      ...localVidBookings,
      ...localLabBookings,
      ...localRadBookings,
      ...localNurseBookings,
    ].forEach((a) => {
      if (a && a.id) apptMap.set(a.id, a);
    });
    const allAppointments = Array.from(apptMap.values());

    const res = await apiRequest(`/api/user/${encodeURIComponent(userId)}/sync`, {
      method: 'POST',
      body: JSON.stringify({
        ...user,
        appointments: allAppointments,
        walletBalance,
        walletTransactions,
        familyMembers,
        orders,
      }),
    });

    if (res.ok && res.data && res.data.success && res.data.user) {
      await saveUserToLocalStorage(res.data.user);
      return res.data.user;
    }
  } catch (err) {
    console.warn('[DataSync] syncActiveUser failed:', err.message);
  }
  return null;
};

/**
 * Add a new appointment to central server and local storage
 */
export const pushAppointment = async (appointmentData) => {
  if (!appointmentData || !appointmentData.id) return { success: false, error: 'Invalid appointment' };

  try {
    const userStr = await AsyncStorage.getItem('@unnathi_primary_user');
    let userId = '';
    if (userStr) {
      const user = JSON.parse(userStr);
      userId = user.phone || user.email || user.id;
    }
    if (!userId) {
      userId =
        (await AsyncStorage.getItem('userPhone')) ||
        (await AsyncStorage.getItem('userEmail')) ||
        (await AsyncStorage.getItem('userId'));
    }
    if (!userId) {
      const rawUser = await AsyncStorage.getItem('user');
      if (rawUser) {
        try {
          const u = JSON.parse(rawUser);
          userId = u.phone || u.email || u.id;
        } catch (e) {}
      }
    }

    if (userId) {
      const res = await apiRequest(`/api/user/${encodeURIComponent(userId)}/appointment`, {
        method: 'POST',
        body: JSON.stringify(appointmentData),
      });

      if (res.ok && res.data && res.data.user) {
        await saveUserToLocalStorage(res.data.user);
        return { success: true, user: res.data.user };
      }
    }
  } catch (err) {
    console.warn('[DataSync] pushAppointment failed:', err.message);
  }

  // Fallback: save to local storage
  try {
    const existingStr = await AsyncStorage.getItem('@unnathi_appointments');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    const filtered = existing.filter((a) => a.id !== appointmentData.id);
    const updated = [appointmentData, ...filtered];
    await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updated));

    // Also update the specialized key based on appointment type
    const isVid =
      appointmentData.type === 'Video Consultation' ||
      appointmentData.type === 'Video' ||
      appointmentData.serviceType === 'video';
    if (isVid) {
      const vStr = await AsyncStorage.getItem('@videoBookings');
      const vList = vStr ? JSON.parse(vStr).filter((a) => a.id !== appointmentData.id) : [];
      await AsyncStorage.setItem('@videoBookings', JSON.stringify([appointmentData, ...vList]));
    }

    const isLab =
      appointmentData.type === 'Diagnostic Lab Test' ||
      appointmentData.type === 'Lab Test' ||
      appointmentData.serviceType === 'lab' ||
      (Array.isArray(appointmentData.tests) && appointmentData.tests.length > 0 && appointmentData.type !== 'Radiology');
    if (isLab) {
      const lStr = await AsyncStorage.getItem('@labBookings');
      const lList = lStr ? JSON.parse(lStr).filter((a) => a.id !== appointmentData.id) : [];
      await AsyncStorage.setItem('@labBookings', JSON.stringify([appointmentData, ...lList]));
    }

    const isRad =
      appointmentData.type === 'Radiology' ||
      appointmentData.type === 'Radiology Scan' ||
      appointmentData.serviceType === 'radiology';
    if (isRad) {
      const rStr = await AsyncStorage.getItem('@radiologyBookings');
      const rList = rStr ? JSON.parse(rStr).filter((a) => a.id !== appointmentData.id) : [];
      await AsyncStorage.setItem('@radiologyBookings', JSON.stringify([appointmentData, ...rList]));
    }

    const isNurse =
      appointmentData.type === 'Home Nurse Care' ||
      appointmentData.serviceType === 'nurse' ||
      appointmentData.assignedNurse !== undefined;
    if (isNurse) {
      const nStr = await AsyncStorage.getItem('@unnathi_nurse_bookings');
      const nList = nStr ? JSON.parse(nStr).filter((a) => a.id !== appointmentData.id) : [];
      await AsyncStorage.setItem('@unnathi_nurse_bookings', JSON.stringify([appointmentData, ...nList]));
    }

    return { success: true, localOnly: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

/**
 * Automatically sync any existing local accounts from device to central database
 */
export const autoMigrateLocalAccountsToServer = async () => {
  try {
    const credsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
    const usersStr = await AsyncStorage.getItem('@unnathi_registered_users');
    const primaryStr = await AsyncStorage.getItem('@unnathi_primary_user');

    const credentials = credsStr ? JSON.parse(credsStr) : {};
    const users = usersStr ? JSON.parse(usersStr) : {};
    const primaryUser = primaryStr ? JSON.parse(primaryStr) : null;

    if (Object.keys(credentials).length > 0 || Object.keys(users).length > 0 || primaryUser) {
      await apiRequest('/api/sync/batch-users', {
        method: 'POST',
        body: JSON.stringify({ credentials, users, primaryUser }),
      });
    }
  } catch (e) {
    // Silent background migration
  }
};

/**
 * Synchronize Family Members list across Web & Mobile
 */
export const syncSaveFamilyMembers = async (updatedMembers) => {
  try {
    if (!Array.isArray(updatedMembers)) return false;

    // 1. Save locally to standard key
    await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(updatedMembers));

    // 2. Save locally to account-specific key
    const userStr = await AsyncStorage.getItem('@unnathi_primary_user');
    let userId = '';
    let userKey = 'default';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        userId = u.phone || u.email || u.id;
        const effectiveName = u.name || 'User';
        userKey = (u.email || u.phone || effectiveName).toLowerCase().replace(/[^a-z0-9]/g, '_');
      } catch (e) {}
    }
    await AsyncStorage.setItem(`@unnathi_family_members_${userKey}`, JSON.stringify(updatedMembers));

    // 3. Push to central server
    if (userId) {
      const res = await apiRequest(`/api/user/${encodeURIComponent(userId)}/family`, {
        method: 'PUT',
        body: JSON.stringify({ familyMembers: updatedMembers }),
      });
      if (res.ok && res.data && res.data.success) {
        console.log(`[DataSync] Successfully synced ${updatedMembers.length} family members to server.`);
        return true;
      }
    }
    return true;
  } catch (err) {
    console.warn('[DataSync] syncSaveFamilyMembers failed:', err.message);
    return false;
  }
};

/**
 * Fetch latest Family Members from Central Server
 */
export const syncFetchFamilyMembers = async () => {
  try {
    const userStr = await AsyncStorage.getItem('@unnathi_primary_user');
    let userId = '';
    let userKey = 'default';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        userId = u.phone || u.email || u.id;
        const effectiveName = u.name || 'User';
        userKey = (u.email || u.phone || effectiveName).toLowerCase().replace(/[^a-z0-9]/g, '_');
      } catch (e) {}
    }

    if (userId) {
      const res = await apiRequest(`/api/user/${encodeURIComponent(userId)}/family`, {
        method: 'GET',
      });
      if (res.ok && res.data && res.data.success && Array.isArray(res.data.familyMembers)) {
        await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(res.data.familyMembers));
        await AsyncStorage.setItem(`@unnathi_family_members_${userKey}`, JSON.stringify(res.data.familyMembers));
        return res.data.familyMembers;
      }
    }
  } catch (err) {
    console.warn('[DataSync] syncFetchFamilyMembers failed:', err.message);
  }
  return null;
};

/**
 * Delete a family member from Central Server and Local Storage
 */
export const syncDeleteFamilyMember = async (memberId) => {
  try {
    const userStr = await AsyncStorage.getItem('@unnathi_primary_user');
    let userId = '';
    let userKey = 'default';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        userId = u.phone || u.email || u.id;
        const effectiveName = u.name || 'User';
        userKey = (u.email || u.phone || effectiveName).toLowerCase().replace(/[^a-z0-9]/g, '_');
      } catch (e) {}
    }

    if (userId && memberId) {
      const res = await apiRequest(`/api/user/${encodeURIComponent(userId)}/family/${encodeURIComponent(memberId)}`, {
        method: 'DELETE',
      });
      if (res.ok && res.data && res.data.success && Array.isArray(res.data.familyMembers)) {
        await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(res.data.familyMembers));
        await AsyncStorage.setItem(`@unnathi_family_members_${userKey}`, JSON.stringify(res.data.familyMembers));
        return res.data.familyMembers;
      }
    }
  } catch (err) {
    console.warn('[DataSync] syncDeleteFamilyMember failed:', err.message);
  }
  return null;
};

export default {
  getBackendUrl,
  syncLogin,
  syncRegister,
  pullUserData,
  syncActiveUser,
  pushAppointment,
  saveUserToLocalStorage,
  autoMigrateLocalAccountsToServer,
  syncSaveFamilyMembers,
  syncFetchFamilyMembers,
  syncDeleteFamilyMember,
};
