import { describe, it, expect } from 'vitest';
import {
	getAttendanceWindowStatus,
	getQrToken,
	isQrTokenValid,
	QR_TOKEN_WINDOW_MS
} from '$lib/server/attendance';
import { hashPassword, verifyPassword } from '$lib/server/password';

describe('AttendLink Cryptographic Utilities', () => {
	it('should successfully hash and verify passwords', () => {
		const password = 'mySecurePassword123';
		const hash = hashPassword(password);

		expect(hash).toContain(':');
		expect(verifyPassword(password, hash)).toBe(true);
		expect(verifyPassword('wrongPassword', hash)).toBe(false);
	});

	it('should reject malformed stored password hashes without throwing', () => {
		expect(verifyPassword('password', 'malformed')).toBe(false);
		expect(verifyPassword('password', 'salt:not-hex')).toBe(false);
	});

	it('should generate consistent QR tokens for identical time windows', () => {
		const secret = 'test-session-secret-key';
		const now = Date.now();

		const token1 = getQrToken(secret, 0, now);
		const token2 = getQrToken(secret, 0, now);
		const tokenDifferentWindow = getQrToken(secret, -1, now);

		expect(token1).toBe(token2);
		expect(token1).not.toBe(tokenDifferentWindow);
	});

	it('should support checking both current and previous time windows to handle clock drift', () => {
		const secret = 'some-secret-key';
		const now = Date.now();
		const previousToken = getQrToken(secret, -1, now);
		const expiredToken = getQrToken(secret, -2, now);

		expect(isQrTokenValid(secret, previousToken, now)).toBe(true);
		expect(isQrTokenValid(secret, expiredToken, now)).toBe(false);
	});

	it('should distinguish attendance sessions that are not started, active, or closed', () => {
		const now = Date.now();

		expect(getAttendanceWindowStatus(null, now)).toBe('not-started');
		expect(getAttendanceWindowStatus(new Date(now + QR_TOKEN_WINDOW_MS).toISOString(), now)).toBe(
			'active'
		);
		expect(getAttendanceWindowStatus(new Date(now).toISOString(), now)).toBe('closed');
	});
});
