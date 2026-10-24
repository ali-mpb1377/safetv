/**
 * Vibration feedback is disabled app-wide. This module keeps the same API as
 * expo-haptics so call sites stay unchanged, but every call is a no-op.
 */
export const ImpactFeedbackStyle = {
  Light: "light",
  Medium: "medium",
  Heavy: "heavy",
  Rigid: "rigid",
  Soft: "soft",
} as const;

export const NotificationFeedbackType = {
  Success: "success",
  Warning: "warning",
  Error: "error",
} as const;

export async function impactAsync(_style?: string): Promise<void> {}
export async function notificationAsync(_type?: string): Promise<void> {}
export async function selectionAsync(): Promise<void> {}
