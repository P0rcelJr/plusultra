/** Inclusive bounds accepted for a class type's defaults at /admin/classes (A20). */
export const CLASS_TYPE_LIMITS = {
  durationMinutes: { min: 15, max: 240 },
  capacity: { min: 1, max: 100 },
} as const;
