/**
 * Get YYYY-MM-DD string from Date
 */
export const toDateStr = (date = new Date()) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

/**
 * Parse "HH:MM" to minutes from midnight
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
};

/**
 * Calculate worked hours between two dates
 */
export const calcWorkedHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
};

/**
 * Simple Haversine distance in meters
 */
export const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Tax slabs (illustrative from brief)
 * Gross annual → tax
 */
export const calcTax = (monthlyGross) => {
  const annual = monthlyGross * 12;
  if (annual <= 600000) return 0;
  if (annual <= 1200000) return Math.round(((annual - 600000) * 0.05) / 12);
  if (annual <= 2400000) return Math.round((30000 + (annual - 1200000) * 0.15) / 12);
  if (annual <= 3600000) return Math.round((210000 + (annual - 2400000) * 0.25) / 12);
  if (annual <= 6000000) return Math.round((510000 + (annual - 3600000) * 0.35) / 12);
  return Math.round((1350000 + (annual - 6000000) * 0.35) / 12);
};

/**
 * Count working days between two dates (exclude weekends + holidays)
 */
export const countWorkingDays = (start, end, weekendDays = [0, 6], holidayDates = []) => {
  let count = 0;
  const cur = new Date(start);
  cur.setUTCHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setUTCHours(0, 0, 0, 0);

  const holidaySet = new Set(holidayDates.map((d) => toDateStr(d)));

  while (cur <= last) {
    const day = cur.getUTCDay();
    const ds = toDateStr(cur);
    if (!weekendDays.includes(day) && !holidaySet.has(ds)) {
      count++;
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
};

export const getEmployeeWorkingDays = (employee, company) => {
  if (Array.isArray(employee?.workDays) && employee.workDays.length > 0) {
    return employee.workDays;
  }

  const weekends = company?.weekendDays || [0, 6];
  return [0, 1, 2, 3, 4, 5, 6].filter((day) => !weekends.includes(day));
};
