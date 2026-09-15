/**
 * ─ When ─
 *
 * A moment as a person would say it beside a comment: how long ago
 * while it is recent, the day once it is not. Pure, so the wording is
 * tested; the clock is handed in.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** `then` as said at `now`, both in milliseconds since the epoch. */
export function whenWas(then: number, now: number): string {
  const ago = Math.max(0, now - then);
  if (ago < 45 * SECOND) {
    return "just now";
  }
  if (ago < 90 * SECOND) {
    return "a minute ago";
  }
  if (ago < 45 * MINUTE) {
    return `${Math.round(ago / MINUTE)} minutes ago`;
  }
  if (ago < 90 * MINUTE) {
    return "an hour ago";
  }
  if (ago < 22 * HOUR) {
    return `${Math.round(ago / HOUR)} hours ago`;
  }
  if (ago < 36 * HOUR) {
    return "yesterday";
  }
  if (ago < 7 * DAY) {
    return `${Math.round(ago / DAY)} days ago`;
  }
  return dayFormat.format(new Date(then));
}
