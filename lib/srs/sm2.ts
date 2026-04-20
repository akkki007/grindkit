export type SRSState = {
  easinessFactor: number;
  interval: number;
  reviewCount: number;
  nextReviewAt: string;
};

export const DEFAULT_EF = 2.5;
export const MIN_EF = 1.3;
export const MAX_EF = 3.0;

export function initialSRS(now = new Date()): SRSState {
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  return {
    easinessFactor: DEFAULT_EF,
    interval: 1,
    reviewCount: 0,
    nextReviewAt: next.toISOString(),
  };
}

export function applyReview(
  prev: Partial<SRSState> | null,
  confidence: 1 | 2 | 3 | 4 | 5,
  now = new Date()
): SRSState {
  const base: SRSState = {
    easinessFactor: prev?.easinessFactor ?? DEFAULT_EF,
    interval: prev?.interval ?? 1,
    reviewCount: prev?.reviewCount ?? 0,
    nextReviewAt: prev?.nextReviewAt ?? now.toISOString(),
  };

  let { easinessFactor, interval } = base;

  if (confidence <= 2) {
    interval = 1;
    easinessFactor = clamp(easinessFactor - 0.2, MIN_EF, MAX_EF);
  } else if (confidence === 3) {
    interval = Math.max(1, Math.round(interval * 1.2));
  } else {
    interval = Math.max(1, Math.round(interval * easinessFactor));
    easinessFactor = clamp(easinessFactor + 0.1, MIN_EF, MAX_EF);
  }

  const next = new Date(now);
  next.setDate(next.getDate() + interval);

  return {
    easinessFactor,
    interval,
    reviewCount: base.reviewCount + 1,
    nextReviewAt: next.toISOString(),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
