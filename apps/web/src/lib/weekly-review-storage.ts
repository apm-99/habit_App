import type { WeeklyReview } from '@repo/db';

const STORAGE_KEY = 'habit-weekly-review';
const SHOWN_KEY = 'habit-weekly-review-shown';

export function getLatestWeeklyReview(): WeeklyReview | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WeeklyReview;
  } catch {
    return null;
  }
}

export function saveWeeklyReview(review: WeeklyReview): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(review));
  } catch {
    // Storage full or unavailable
  }
}

export function clearWeeklyReview(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasWeeklyReviewBeenShownToday(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(SHOWN_KEY);
    if (!raw) return false;
    const shownDate = JSON.parse(raw) as string;
    const today = new Date().toISOString().split('T')[0];
    return shownDate === today;
  } catch {
    return false;
  }
}

export function markWeeklyReviewShown(): void {
  if (typeof window === 'undefined') return;
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(SHOWN_KEY, JSON.stringify(today));
  } catch {
    // Storage full or unavailable
  }
}
