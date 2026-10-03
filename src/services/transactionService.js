/**
 * transactionService.js
 *
 * Centralised payment-transaction store for MediUnify.
 *
 * HOW IT WORKS
 * ─────────────
 * Every payment flow in the app calls  saveTransaction(txn)  after a
 * successful payment.  The entry is appended (newest-first) to the
 * AsyncStorage key  @mediunify_transactions .
 *
 * TransactionHistoryScreen reads from this key PLUS the legacy booking
 * keys so that older bookings continue to appear.
 *
 * STANDARD TRANSACTION SHAPE
 * ──────────────────────────
 * {
 *   id          : 'TXN-xxxxxxxx'        — unique, auto-generated if absent
 *   refId       : 'LAB-001'             — booking / order reference
 *   service     : 'Lab Test'            — human-readable service name
 *   serviceType : 'lab'                 — 'lab' | 'radiology' | 'consultation'
 *                                         'pharmacy' | 'nursing' | 'surgery'
 *                                         'equipment'
 *   title       : 'CBC + ESR'           — short description shown on card
 *   facility    : 'MediUnify Pathology' — provider name
 *   date        : 'Today, 10:30 AM'     — display string
 *   rawDate     : '2026-10-03T10:30:00' — ISO date for sorting/grouping
 *   amount      : 850                   — ₹ amount paid (number)
 *   mrp         : 1200                  — MRP before discount (number)
 *   status      : 'Paid'               — 'Paid' | 'Pending' | 'Failed' | 'Refunded'
 *   paymentMode : 'Google Pay (UPI)'   — payment method string
 *   gstin       : '29AABCU9603R1ZX'    — GST number (optional)
 *   items       : [{ name, qty, price }] — itemised billing (optional)
 * }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const TRANSACTIONS_KEY = '@mediunify_transactions';

/**
 * Save a new payment transaction to persistent storage.
 * Call this immediately after a successful payment in any flow.
 *
 * @param {Object} txn  — transaction object (see shape above)
 * @returns {Promise<{ success: boolean, txn: Object }>}
 */
export const saveTransaction = async (txn) => {
  try {
    if (!txn) throw new Error('txn is required');

    // Auto-generate ID if missing
    const now = new Date();
    const id = txn.id || `TXN-${Date.now().toString(36).toUpperCase()}`;
    const rawDate = txn.rawDate || now.toISOString();

    // Build a clean, standardised entry
    const entry = {
      id,
      refId:       txn.refId       || id,
      service:     txn.service     || 'Healthcare Service',
      serviceType: txn.serviceType || 'other',
      title:       txn.title       || txn.service || 'Service',
      facility:    txn.facility    || 'MediUnify',
      date:        txn.date        || _formatDate(now),
      rawDate,
      amount:      Number(txn.amount)  || 0,
      mrp:         Number(txn.mrp)     || Number(txn.amount) || 0,
      status:      txn.status      || 'Paid',
      paymentMode: txn.paymentMode || 'Online',
      gstin:       txn.gstin       || '',
      items:       Array.isArray(txn.items) ? txn.items : [],
      _savedAt:    now.toISOString(),
    };

    // Read current list → prepend new entry → write back
    const stored = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    const current = stored ? JSON.parse(stored) : [];

    // Deduplicate by id (avoid double-saves on re-renders)
    const deduplicated = [entry, ...current.filter((t) => t.id !== entry.id)];

    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(deduplicated));

    console.log('[TransactionService] Saved transaction:', entry.id, entry.service, '₹' + entry.amount);
    return { success: true, txn: entry };
  } catch (e) {
    console.warn('[TransactionService] saveTransaction error:', e.message);
    return { success: false, error: e.message };
  }
};

/**
 * Read all saved transactions from the primary store.
 * @returns {Promise<Object[]>}
 */
export const getTransactions = async () => {
  try {
    const stored = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Clear all saved transactions (use only for testing / logout).
 */
export const clearTransactions = async () => {
  try {
    await AsyncStorage.removeItem(TRANSACTIONS_KEY);
  } catch {}
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Returns a human-friendly date string like "Today, 10:30 AM" or "03 Oct 2026".
 */
function _formatDate(date) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yday  = new Date(today.getTime() - 86400000);
  const d     = new Date(date);
  const day   = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (day.getTime() === today.getTime()) return `Today, ${timeStr}`;
  if (day.getTime() === yday.getTime())  return `Yesterday, ${timeStr}`;

  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
