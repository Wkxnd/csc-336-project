/**
 * `session_date` is a plain calendar date (Postgres `DATE`), with no time-of-day meaning.
 * postgres.js parses it into a `Date` anchored at UTC midnight, so it must always be
 * formatted in the `UTC` timezone — otherwise browsers behind UTC (e.g. EDT) render the
 * previous calendar day.
 */
export function formatCalendarDate(
	date: string | Date,
	options: Intl.DateTimeFormatOptions
): string {
	return new Date(date).toLocaleDateString(undefined, { ...options, timeZone: 'UTC' });
}

/** Today's date as `YYYY-MM-DD` in the user's local timezone, for date-input defaults. */
export function todayLocalDateString(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
