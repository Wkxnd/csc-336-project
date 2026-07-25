import { createHmac } from 'crypto';

export const QR_TOKEN_WINDOW_MS = 15_000;

export type AttendanceWindowStatus = 'not-started' | 'active' | 'closed';

export function getQrToken(secret: string, offset: number = 0, now = Date.now()): string {
	const timeWindow = Math.floor(now / QR_TOKEN_WINDOW_MS) + offset;
	return createHmac('sha256', secret).update(timeWindow.toString()).digest('hex');
}

export function isQrTokenValid(secret: string, token: string, now = Date.now()): boolean {
	return token === getQrToken(secret, 0, now) || token === getQrToken(secret, -1, now);
}

export function getAttendanceWindowStatus(
	expiresAt: string | null,
	now = Date.now()
): AttendanceWindowStatus {
	if (!expiresAt) {
		return 'not-started';
	}

	return new Date(expiresAt).getTime() > now ? 'active' : 'closed';
}

export function getNextQrWindowDelay(now = Date.now()): number {
	const nextWindow = (Math.floor(now / QR_TOKEN_WINDOW_MS) + 1) * QR_TOKEN_WINDOW_MS;
	return nextWindow - now;
}
