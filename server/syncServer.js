const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'database.json');

// In-memory cache loaded from database.json
let db = { users: {} };

const loadDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      console.log(`[DB] Successfully loaded database with ${Object.keys(db.users || {}).length} users.`);
    } else {
      saveDB();
    }
  } catch (err) {
    console.error('[DB] Error loading database:', err.message);
  }
};

const saveDB = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error saving database:', err.message);
  }
};

// Normalize search key (email or 10-digit phone)
const normalizeKey = (key) => {
  if (!key) return '';
  const trimmed = String(key).trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const digits = trimmed.replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

// Find user by phone, email, or ID
const findUser = (identifier) => {
  if (!identifier) return null;
  const target = normalizeKey(identifier);
  if (!target) return null;

  for (const [k, u] of Object.entries(db.users || {})) {
    const userKey = normalizeKey(k);
    const userEmail = normalizeKey(u.email);
    const userPhone = normalizeKey(u.phone);
    const userId = normalizeKey(u.id);

    if (userKey === target || userEmail === target || userPhone === target || userId === target) {
      return { key: k, user: u };
    }
  }
  return null;
};

// Send JSON response with CORS
const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  });
  res.end(JSON.stringify(data));
};

// Request Body Parser
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
};

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    });
    res.end();
    return;
  }

  const urlParts = req.url.split('?');
  const pathname = urlParts[0];

  try {
    // -----------------------------------------------------------------
    // 1. Health & Server Info
    // -----------------------------------------------------------------
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJSON(res, 200, {
        status: 'online',
        service: 'Unnathi Patient Data Sync Service',
        timestamp: new Date().toISOString(),
        usersCount: Object.keys(db.users || {}).length,
      });
    }

    // -----------------------------------------------------------------
    // 2. Authentication: Register
    // -----------------------------------------------------------------
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await parseBody(req);
      const { name, email, phone, password, bloodGroup, age, gender, dob, emergencyContact, address } = body;

      const normPhone = normalizeKey(phone);
      const normEmail = normalizeKey(email);

      if (!normPhone && !normEmail) {
        return sendJSON(res, 400, { success: false, message: 'Phone number or email is required.' });
      }

      // Primary key: phone digits (10 digits) if present, otherwise email
      const primaryKey = normPhone && normPhone.length === 10 ? normPhone : normEmail;

      const existing = findUser(primaryKey) || (normEmail ? findUser(normEmail) : null);
      if (existing) {
        // Update credentials/profile if already registered
        existing.user.name = name || existing.user.name;
        if (password) existing.user.password = password;
        if (phone) existing.user.phone = phone;
        if (email) existing.user.email = email;
        if (bloodGroup) existing.user.bloodGroup = bloodGroup;
        if (age) existing.user.age = age;
        if (gender) existing.user.gender = gender;
        if (dob) existing.user.dob = dob;
        if (emergencyContact) existing.user.emergencyContact = emergencyContact;
        if (address) existing.user.address = address;
        saveDB();
        return sendJSON(res, 200, {
          success: true,
          message: 'Account updated successfully.',
          user: existing.user,
        });
      }

      const newUserId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
      const newUser = {
        id: newUserId,
        name: name || (normEmail ? normEmail.split('@')[0] : `Patient ${primaryKey.slice(-4)}`),
        email: email || '',
        phone: phone || (normPhone ? `+91 ${normPhone}` : ''),
        password: password || 'password123',
        bloodGroup: bloodGroup || 'O+ Positive',
        age: age || '28 Yrs',
        gender: gender || 'Male',
        dob: dob || '15/08/1996',
        emergencyContact: emergencyContact || (phone ? `${phone} (Family)` : ''),
        address: address || 'Mysore, Karnataka',
        walletBalance: 500, // Welcome bonus
        walletTransactions: [
          {
            id: `TXN-${Date.now().toString().slice(-4)}`,
            title: 'Welcome Health Credit',
            type: 'credit',
            amount: 500,
            date: new Date().toISOString().split('T')[0],
            status: 'Success',
          },
        ],
        familyMembers: [],
        appointments: [],
        orders: [],
        prescriptions: [],
      };

      db.users[primaryKey] = newUser;
      saveDB();

      console.log(`[AUTH] Registered new patient: ${newUser.name} (${primaryKey})`);
      return sendJSON(res, 201, {
        success: true,
        message: 'Account registered successfully.',
        user: newUser,
      });
    }

    // -----------------------------------------------------------------
    // 2.5 Batch Sync Local Accounts to Server
    // -----------------------------------------------------------------
    if (pathname === '/api/sync/batch-users' && req.method === 'POST') {
      const body = await parseBody(req);
      const { users, credentials, primaryUser } = body;
      let added = 0;

      if (credentials && typeof credentials === 'object') {
        for (const [key, cred] of Object.entries(credentials)) {
          const normKey = normalizeKey(key);
          if (!normKey) continue;
          const uData = cred.userData || {};
          const existing = findUser(normKey);
          if (!existing) {
            const newPat = {
              id: uData.id || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
              name: uData.name || 'User Profile',
              email: uData.email || (normKey.includes('@') ? normKey : ''),
              phone: uData.phone || (!normKey.includes('@') ? `+91 ${normKey}` : ''),
              password: cred.password || 'password123',
              bloodGroup: uData.bloodGroup || 'O+ Positive',
              age: uData.age || '28 Yrs',
              gender: uData.gender || 'Male',
              dob: uData.dob || '15/08/1996',
              emergencyContact: uData.emergencyContact || '',
              address: uData.address || 'Mysore',
              walletBalance: 1250,
              walletTransactions: [],
              familyMembers: [],
              appointments: [],
              orders: [],
              prescriptions: [],
            };
            db.users[normKey] = newPat;
            added++;
          }
        }
      }

      if (primaryUser && typeof primaryUser === 'object' && (primaryUser.phone || primaryUser.email)) {
        const normKey = normalizeKey(primaryUser.phone || primaryUser.email);
        if (normKey && !findUser(normKey)) {
          db.users[normKey] = {
            id: primaryUser.id || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
            name: primaryUser.name || 'User Profile',
            email: primaryUser.email || (normKey.includes('@') ? normKey : ''),
            phone: primaryUser.phone || (!normKey.includes('@') ? `+91 ${normKey}` : ''),
            password: 'password123',
            bloodGroup: primaryUser.bloodGroup || 'O+ Positive',
            age: primaryUser.age || '28 Yrs',
            gender: primaryUser.gender || 'Male',
            dob: primaryUser.dob || '15/08/1996',
            emergencyContact: primaryUser.emergencyContact || '',
            address: primaryUser.address || 'Mysore',
            walletBalance: 1250,
            walletTransactions: [],
            familyMembers: [],
            appointments: [],
            orders: [],
            prescriptions: [],
          };
          added++;
        }
      }

      if (added > 0) {
        saveDB();
        console.log(`[SYNC] Batch imported ${added} accounts from device to central database.`);
      }

      return sendJSON(res, 200, {
        success: true,
        imported: added,
        totalUsers: Object.keys(db.users || {}).length,
      });
    }

    // -----------------------------------------------------------------
    // 3. Authentication: Login
    // -----------------------------------------------------------------
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const { identifier, password } = body;

      if (!identifier) {
        return sendJSON(res, 400, { success: false, message: 'Please provide phone number or email.' });
      }

      const match = findUser(identifier);
      if (!match) {
        return sendJSON(res, 404, {
          success: false,
          message: 'User account not found. Please register first or verify the ID.',
        });
      }

      // Password verification (if password was set and provided)
      if (match.user.password && password && match.user.password !== password) {
        return sendJSON(res, 401, {
          success: false,
          message: 'Incorrect password. Please verify your credentials.',
        });
      }

      console.log(`[AUTH] Logged in: ${match.user.name} (${identifier})`);
      return sendJSON(res, 200, {
        success: true,
        message: 'Login successful.',
        user: match.user,
      });
    }

    // -----------------------------------------------------------------
    // 4. Get User Profile & Data by ID
    // -----------------------------------------------------------------
    if (pathname.startsWith('/api/user/') && req.method === 'GET') {
      const parts = pathname.split('/');
      if (!parts[4]) {
        const userId = decodeURIComponent(parts[3] || '');
        const match = findUser(userId);

        if (!match) {
          return sendJSON(res, 404, { success: false, message: 'User not found.' });
        }

        return sendJSON(res, 200, { success: true, user: match.user });
      }
    }

    // -----------------------------------------------------------------
    // 5. Update Profile
    // -----------------------------------------------------------------
    if (pathname.startsWith('/api/user/') && pathname.endsWith('/profile') && req.method === 'PUT') {
      const parts = pathname.split('/');
      const userId = decodeURIComponent(parts[3] || '');
      const match = findUser(userId);

      if (!match) {
        return sendJSON(res, 404, { success: false, message: 'User not found.' });
      }

      const body = await parseBody(req);
      const allowedFields = ['name', 'phone', 'email', 'bloodGroup', 'age', 'gender', 'dob', 'emergencyContact', 'address'];
      allowedFields.forEach((field) => {
        if (body[field] !== undefined) {
          match.user[field] = body[field];
        }
      });

      saveDB();
      console.log(`[PROFILE] Updated profile for ${match.user.name}`);
      return sendJSON(res, 200, { success: true, user: match.user });
    }

    // -----------------------------------------------------------------
    // 6. Full Bidirectional Sync
    // -----------------------------------------------------------------
    if (pathname.startsWith('/api/user/') && pathname.endsWith('/sync') && req.method === 'POST') {
      const parts = pathname.split('/');
      const userId = decodeURIComponent(parts[3] || '');
      let match = findUser(userId);

      const body = await parseBody(req);

      // If user doesn't exist on server yet, auto-create from sync payload
      if (!match) {
        const primaryKey = normalizeKey(userId) || `PAT-${Date.now().toString().slice(-4)}`;
        match = {
          key: primaryKey,
          user: {
            id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
            name: body.name || 'User Profile',
            phone: body.phone || '',
            email: body.email || '',
            walletBalance: body.walletBalance !== undefined ? body.walletBalance : 500,
            walletTransactions: body.walletTransactions || [],
            appointments: body.appointments || [],
            orders: body.orders || [],
            familyMembers: body.familyMembers || [],
            prescriptions: body.prescriptions || [],
            bloodGroup: body.bloodGroup || 'O+ Positive',
            age: body.age || '28 Yrs',
            gender: body.gender || 'Male',
            dob: body.dob || '15/08/1996',
            emergencyContact: body.emergencyContact || '',
            address: body.address || 'Mysore',
          },
        };
        db.users[primaryKey] = match.user;
      } else {
        // Merge updates from client:
        if (body.appointments && Array.isArray(body.appointments)) {
          // Merge appointments uniquely by id
          const existingIds = new Set((match.user.appointments || []).map((a) => a.id));
          body.appointments.forEach((apt) => {
            if (!existingIds.has(apt.id)) {
              match.user.appointments = [apt, ...(match.user.appointments || [])];
              existingIds.add(apt.id);
            }
          });
        }

        if (body.walletBalance !== undefined) {
          match.user.walletBalance = body.walletBalance;
        }

        if (body.walletTransactions && Array.isArray(body.walletTransactions)) {
          const existingTxIds = new Set((match.user.walletTransactions || []).map((t) => t.id));
          body.walletTransactions.forEach((tx) => {
            if (!existingTxIds.has(tx.id)) {
              match.user.walletTransactions = [tx, ...(match.user.walletTransactions || [])];
              existingTxIds.add(tx.id);
            }
          });
        }

        if (body.familyMembers && Array.isArray(body.familyMembers)) {
          match.user.familyMembers = body.familyMembers;
        }

        if (body.orders && Array.isArray(body.orders)) {
          const existingOrderIds = new Set((match.user.orders || []).map((o) => o.id));
          body.orders.forEach((ord) => {
            if (!existingOrderIds.has(ord.id)) {
              match.user.orders = [ord, ...(match.user.orders || [])];
              existingOrderIds.add(ord.id);
            }
          });
        }

        if (body.name && !body.name.includes('@')) match.user.name = body.name;
        if (body.bloodGroup) match.user.bloodGroup = body.bloodGroup;
        if (body.age) match.user.age = body.age;
        if (body.gender) match.user.gender = body.gender;
        if (body.emergencyContact) match.user.emergencyContact = body.emergencyContact;
        if (body.dob) match.user.dob = body.dob;
        if (body.address) match.user.address = body.address;
      }

      saveDB();
      console.log(`[SYNC] Completed synchronization for ${match.user.name}`);
      return sendJSON(res, 200, { success: true, user: match.user });
    }

    // -----------------------------------------------------------------
    // 6.5 Family Members Management (GET, PUT, POST, DELETE)
    // -----------------------------------------------------------------
    if (pathname.startsWith('/api/user/') && pathname.includes('/family')) {
      const parts = pathname.split('/');
      const userId = decodeURIComponent(parts[3] || '');
      const match = findUser(userId);

      if (!match) {
        return sendJSON(res, 404, { success: false, message: 'User not found.' });
      }

      if (!match.user.familyMembers) {
        match.user.familyMembers = [];
      }

      // DELETE /api/user/:userId/family/:memberId
      if (req.method === 'DELETE' && parts[4] === 'family' && parts[5]) {
        const memberId = decodeURIComponent(parts[5]);
        match.user.familyMembers = match.user.familyMembers.filter((m) => m.id !== memberId);
        saveDB();
        console.log(`[FAMILY] Deleted member ${memberId} for ${match.user.name}`);
        return sendJSON(res, 200, {
          success: true,
          familyMembers: match.user.familyMembers,
        });
      }

      // GET /api/user/:userId/family
      if (req.method === 'GET' && parts[4] === 'family' && !parts[5]) {
        return sendJSON(res, 200, {
          success: true,
          familyMembers: match.user.familyMembers,
        });
      }

      // PUT or POST /api/user/:userId/family
      if ((req.method === 'PUT' || req.method === 'POST') && parts[4] === 'family' && !parts[5]) {
        const body = await parseBody(req);
        if (Array.isArray(body.familyMembers)) {
          match.user.familyMembers = body.familyMembers;
        } else if (body.member) {
          const idx = match.user.familyMembers.findIndex((m) => m.id === body.member.id);
          if (idx >= 0) {
            match.user.familyMembers[idx] = body.member;
          } else {
            match.user.familyMembers.push(body.member);
          }
        }
        saveDB();
        console.log(`[FAMILY] Updated family members for ${match.user.name} (Total: ${match.user.familyMembers.length})`);
        return sendJSON(res, 200, {
          success: true,
          familyMembers: match.user.familyMembers,
        });
      }
    }

    // -----------------------------------------------------------------
    // 7. Add Appointment
    // -----------------------------------------------------------------
    if (pathname.startsWith('/api/user/') && pathname.endsWith('/appointment') && req.method === 'POST') {
      const parts = pathname.split('/');
      const userId = decodeURIComponent(parts[3] || '');
      let match = findUser(userId);

      const body = await parseBody(req);
      const appointment = {
        id: body.id || `APT-${Date.now().toString().slice(-4)}`,
        date: body.date || new Date().toISOString().split('T')[0],
        status: body.status || 'Confirmed',
        ...body,
      };

      if (!match) {
        const primaryKey = normalizeKey(userId) || `PAT-${Date.now().toString().slice(-4)}`;
        match = {
          key: primaryKey,
          user: {
            id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
            name: body.patient?.name || body.name || 'User Profile',
            phone: body.patient?.phone || (!primaryKey.includes('@') ? `+91 ${primaryKey}` : ''),
            email: primaryKey.includes('@') ? primaryKey : '',
            walletBalance: 1250,
            walletTransactions: [],
            appointments: [],
            orders: [],
            familyMembers: [],
            prescriptions: [],
            bloodGroup: 'O+ Positive',
            age: '28 Yrs',
            gender: 'Male',
            address: 'Mysore',
          },
        };
        db.users[primaryKey] = match.user;
      }

      if (!Array.isArray(match.user.appointments)) {
        match.user.appointments = [];
      }

      // Prepend appointment, avoiding duplicate ID
      const filtered = match.user.appointments.filter((a) => a.id !== appointment.id);
      match.user.appointments = [appointment, ...filtered];
      saveDB();
      console.log(`[BOOKING] Added appointment ${appointment.id} for ${match.user.name}`);
      return sendJSON(res, 201, { success: true, appointment, user: match.user });
    }

    // -----------------------------------------------------------------
    // 8. 404 Fallback
    // -----------------------------------------------------------------
    return sendJSON(res, 404, { success: false, message: 'Route not found.' });
  } catch (err) {
    console.error('[SERVER ERROR]', err);
    return sendJSON(res, 500, { success: false, message: 'Internal Server Error', error: err.message });
  }
});

// Load DB and start server
loadDB();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` [UNNATHI DATA SYNC SERVER] Running on port ${PORT}`);
  console.log(` - Local:    http://localhost:${PORT}`);
  console.log(` - Network:  http://172.20.10.12:${PORT}`);
  console.log(` - Database: ${DB_FILE}`);
  console.log(`=======================================================`);
});
