/**
 * Client-side calculation functions matching backend scoring logic.
 * Used for instant feedback while the user fills in assessment items.
 */

/**
 * Calculate Student-Staff Ratio (SSR).
 * Formula: total_students / total_academic_staff
 */
export function calculateSSR(
  totalStudents: number,
  totalAcademicStaff: number
): number | null {
  if (!totalAcademicStaff || totalAcademicStaff === 0) return null;
  if (totalStudents < 0 || totalAcademicStaff < 0) return null;
  return Math.round((totalStudents / totalAcademicStaff) * 100) / 100;
}

/**
 * Calculate PhD percentage of academic staff.
 * Formula: (staff_with_phd / total_academic_staff) * 100
 */
export function calculatePhDPercentage(
  staffWithPhD: number,
  totalAcademicStaff: number
): number | null {
  if (!totalAcademicStaff || totalAcademicStaff === 0) return null;
  if (staffWithPhD < 0 || totalAcademicStaff < 0) return null;
  if (staffWithPhD > totalAcademicStaff) return null;
  return Math.round((staffWithPhD / totalAcademicStaff) * 10000) / 100;
}

/**
 * Calculate flying faculty percentage.
 * Formula: (flying_faculty_count / total_teaching_staff) * 100
 */
export function calculateFlyingFacultyPercentage(
  flyingFacultyCount: number,
  totalTeachingStaff: number
): number | null {
  if (!totalTeachingStaff || totalTeachingStaff === 0) return null;
  if (flyingFacultyCount < 0 || totalTeachingStaff < 0) return null;
  if (flyingFacultyCount > totalTeachingStaff) return null;
  return Math.round((flyingFacultyCount / totalTeachingStaff) * 10000) / 100;
}

/**
 * Calculate gender percentage (e.g., female percentage).
 * Formula: (count_of_gender / total_count) * 100
 */
export function calculateGenderPercentage(
  genderCount: number,
  totalCount: number
): number | null {
  if (!totalCount || totalCount === 0) return null;
  if (genderCount < 0 || totalCount < 0) return null;
  if (genderCount > totalCount) return null;
  return Math.round((genderCount / totalCount) * 10000) / 100;
}

/**
 * Generic percentage calculation.
 */
export function calculatePercentage(
  part: number,
  whole: number
): number | null {
  if (!whole || whole === 0) return null;
  if (part < 0 || whole < 0) return null;
  return Math.round((part / whole) * 10000) / 100;
}

/**
 * Calculate row/column totals for multi-year-gender grids.
 */
export function calculateGridTotals(
  grid: Record<string, Record<string, number>>
): {
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  grandTotal: number;
} {
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  let grandTotal = 0;

  for (const [rowKey, row] of Object.entries(grid)) {
    rowTotals[rowKey] = 0;
    for (const [colKey, value] of Object.entries(row)) {
      const numValue = Number(value) || 0;
      rowTotals[rowKey] += numValue;
      colTotals[colKey] = (colTotals[colKey] || 0) + numValue;
      grandTotal += numValue;
    }
  }

  return { rowTotals, colTotals, grandTotal };
}
