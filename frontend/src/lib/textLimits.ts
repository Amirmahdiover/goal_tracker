export const TEXT_LIMITS = {
  concern: 150,
  goalTitle: 80,
  stepTitle: 60,
  customUnit: 20,
  trackingNote: 200,
} as const;

export const TEXT_LIMIT_MESSAGE =
  "کمی کوتاه‌ترش کن تا راحت‌تر بتوانی دنبالش کنی.";

export function isOverTextLimit(value: string, limit: number) {
  return value.length > limit;
}
