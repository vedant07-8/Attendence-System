/**
 * Attendance Calculation Utility
 * Handles percentage computation, defaulter status, and predictive target calculations.
 */

/**
 * Calculate attendance percentage rounded to two decimal places
 * @param {number} present 
 * @param {number} total 
 * @returns {number}
 */
const calculatePercentage = (present, total) => {
  if (!total || total <= 0) return 0;
  const percentage = (present / total) * 100;
  return Math.round(percentage * 100) / 100;
};

/**
 * Determine if attendance falls below the minimum required threshold (default 75%)
 * @param {number} present 
 * @param {number} total 
 * @param {number} threshold 
 * @returns {boolean}
 */
const isDefaulter = (present, total, threshold = 75) => {
  if (!total || total <= 0) return true;
  return calculatePercentage(present, total) < threshold;
};

/**
 * Calculate how many consecutive classes a student must attend to reach the target percentage (75%)
 * Formula:
 * (present + n) / (total + n) >= target / 100
 * (present + n) >= 0.75 * (total + n)
 * n - 0.75n >= 0.75 * total - present
 * 0.25n >= 0.75 * total - present
 * n >= (0.75 * total - present) / 0.25
 * n >= 3 * total - 4 * present
 * 
 * @param {number} present 
 * @param {number} total 
 * @param {number} targetPercentage default 75
 * @returns {number} consecutive classes needed (0 if already meeting target)
 */
const calculateClassesNeeded = (present, total, targetPercentage = 75) => {
  const currentTotal = Number(total) || 0;
  const currentPresent = Number(present) || 0;
  const target = Math.min(100, Math.max(1, Number(targetPercentage) || 75));

  if (currentTotal === 0) return 0;

  const currentPercent = (currentPresent / currentTotal) * 100;
  if (currentPercent >= target) {
    return 0;
  }

  if (target >= 100) {
    return currentPresent === currentTotal ? 0 : -1;
  }

  // Exact integer formula:
  // (present + n) / (total + n) >= target / 100
  // 100 * (present + n) >= target * (total + n)
  // n * (100 - target) >= target * total - 100 * present
  // n = ceil((target * total - 100 * present) / (100 - target))
  const numerator = (target * currentTotal) - (100 * currentPresent);
  const denominator = 100 - target;
  const classesNeeded = Math.ceil(numerator / denominator);

  return Math.max(0, classesNeeded);
};

/**
 * Calculate how many future classes a student can afford to miss before falling below threshold (75%)
 * Formula:
 * present / (total + m) >= target / 100
 * 100 * present >= target * (total + m)
 * target * m <= 100 * present - target * total
 * m = floor((100 * present - target * total) / target)
 * 
 * @param {number} present 
 * @param {number} total 
 * @param {number} threshold 
 * @returns {number} classes student can miss safely
 */
const calculateSafeAbsences = (present, total, threshold = 75) => {
  const currentTotal = Number(total) || 0;
  const currentPresent = Number(present) || 0;
  const target = Math.min(100, Math.max(1, Number(threshold) || 75));

  if (currentTotal === 0) return 0;

  const currentPercent = (currentPresent / currentTotal) * 100;
  if (currentPercent < target) return 0;

  // Exact integer formula
  const numerator = (100 * currentPresent) - (target * currentTotal);
  const denominator = target;
  const maxMisses = Math.floor(numerator / denominator);

  return Math.max(0, maxMisses);
};

module.exports = {
  calculatePercentage,
  isDefaulter,
  calculateClassesNeeded,
  calculateSafeAbsences
};
