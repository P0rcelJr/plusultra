/**
 * Subscriptions are dated rows (decision 19). Values are DATE-column dates (00:00 UTC), see
 * `src/domain/time.ts`. A row covers a day when `startsOn <= day < endsOn`; a null `endsOn`
 * is open-ended. A gap between rows is a pause, so no row may cover the day.
 */
export type DatedSubscription = { startsOn: Date; endsOn: Date | null };

export function subscriptionCovers(subscription: DatedSubscription, day: Date): boolean {
  const t = day.getTime();
  if (subscription.startsOn.getTime() > t) return false;
  return subscription.endsOn === null || t < subscription.endsOn.getTime();
}

/** The subscription whose [startsOn, endsOn) contains `day`, or undefined when none does. */
export function subscriptionCovering<T extends DatedSubscription>(
  subscriptions: readonly T[],
  day: Date,
): T | undefined {
  return subscriptions.find((s) => subscriptionCovers(s, day));
}

/**
 * How existing rows change when a new plan starts on `newStart`: rows that would still be running
 * are closed on that day, rows that had not started yet are superseded (decision 19).
 */
export function planChangeEffects<T extends DatedSubscription & { id: string }>(
  subscriptions: readonly T[],
  newStart: Date,
): { close: T[]; remove: T[] } {
  const close: T[] = [];
  const remove: T[] = [];
  for (const s of subscriptions) {
    if (s.startsOn.getTime() >= newStart.getTime()) {
      remove.push(s);
    } else if (s.endsOn === null || s.endsOn.getTime() > newStart.getTime()) {
      close.push(s);
    }
  }
  return { close, remove };
}
