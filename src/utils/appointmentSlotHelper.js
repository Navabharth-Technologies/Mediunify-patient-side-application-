import { getSlotStatus } from '../services/slotBookingService';

// ==================================================
// APPOINTMENT SLOT HELPER FOR IN-CLINIC & VIDEO CALL
// ==================================================

/**
 * Returns 4 upcoming date options starting from today
 */
export const getAvailableDates = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  return [0, 1, 2, 3].map((offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);

    const dayName = days[d.getDay()];
    const dateNum = d.getDate();
    const monthName = months[d.getMonth()];
    const formatted = `${dayName}, ${dateNum} ${monthName}`;

    let label = formatted;
    let id = `day-${offset}`;

    if (offset === 0) {
      label = 'Today';
      id = 'today';
    } else if (offset === 1) {
      label = 'Tomorrow';
      id = 'tomorrow';
    }

    return {
      id,
      offset,
      label,
      fullDateStr: formatted,
      displayTitle: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : formatted,
      displaySub: offset <= 1 ? formatted : dayName,
    };
  });
};

/**
 * Generates rich categorized time slots for a given date and consultation type
 * Real-time validated against actual current date/time and booked slot registry.
 */
export const getSlotsForDate = (dateItem, isVideo = false, doctor = null) => {
  const isToday = dateItem?.id === 'today';
  const prefix = dateItem?.label || 'Tomorrow';
  const serviceType = isVideo ? 'video' : 'doctor';
  const providerId = doctor?.id || doctor?.name || 'doctor';

  const morningTimes = isVideo
    ? ['09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM', '11:45 AM']
    : ['09:00 AM', '09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM', '12:15 PM'];

  const afternoonTimes = isVideo
    ? ['02:00 PM', '02:45 PM', '03:30 PM', '04:15 PM', '05:00 PM']
    : ['02:00 PM', '02:30 PM', '03:15 PM', '04:00 PM', '04:45 PM'];

  const eveningTimes = isVideo
    ? ['05:30 PM', '06:15 PM', '07:00 PM', '07:45 PM', '08:30 PM']
    : ['05:15 PM', '05:45 PM', '06:30 PM', '07:15 PM', '08:00 PM'];

  const instantStatus = isVideo && isToday
    ? getSlotStatus({ date: dateItem, time: 'Within 10-15 Mins', serviceType, providerId })
    : null;

  const instantSlot = isVideo && isToday && instantStatus?.available ? {
    id: `${dateItem.id}-instant`,
    time: 'Within 10-15 Mins',
    fullLabel: `${prefix}, Within 15 Mins (Instant)`,
    isInstant: true,
    badge: 'Fastest Connect',
    available: true,
    status: 'AVAILABLE',
  } : null;

  const mapSlots = (times, period) =>
    times.map((t, idx) => {
      const statusObj = getSlotStatus({
        date: dateItem,
        time: t,
        serviceType,
        providerId,
      });

      return {
        id: `${dateItem.id}-${period}-${idx}`,
        time: t,
        fullLabel: `${prefix}, ${t}`,
        period,
        available: statusObj.available,
        status: statusObj.status, // 'AVAILABLE' | 'PASSED' | 'BOOKED'
        isPassed: statusObj.status === 'PASSED',
        isBooked: statusObj.status === 'BOOKED',
        statusReason: statusObj.reason,
      };
    });

  const morning = mapSlots(morningTimes, 'morning');
  const afternoon = mapSlots(afternoonTimes, 'afternoon');
  const evening = mapSlots(eveningTimes, 'evening');

  const availableCount =
    (instantSlot ? 1 : 0) +
    morning.filter((s) => s.available).length +
    afternoon.filter((s) => s.available).length +
    evening.filter((s) => s.available).length;

  return {
    instant: instantSlot,
    morning,
    afternoon,
    evening,
    totalCount: (instantSlot ? 1 : 0) + morningTimes.length + afternoonTimes.length + eveningTimes.length,
    availableCount,
  };
};
