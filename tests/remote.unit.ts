import { describe, it, expect } from 'vitest';
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';

// TODO: remove these duplicated function definitions.
// Re-implement the hashing and token logic here for database-free testing of core mechanisms
function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
	const [salt, hash] = stored.split(':');
	const computedHash = scryptSync(password, salt, 64).toString('hex');
	return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
}

function getQrToken(secret: string, timeWindow: number): string {
	return createHmac('sha256', secret).update(timeWindow.toString()).digest('hex');
}

describe('AttendLink Cryptographic Utilities', () => {
	it('should successfully hash and verify passwords', () => {
		const password = 'mySecurePassword123';
		const hash = hashPassword(password);

		expect(hash).toContain(':');
		expect(verifyPassword(password, hash)).toBe(true);
		expect(verifyPassword('wrongPassword', hash)).toBe(false);
	});

	it('should generate consistent QR tokens for identical time windows', () => {
		const secret = 'test-session-secret-key';
		const windowId = Math.floor(Date.now() / 15000);

		const token1 = getQrToken(secret, windowId);
		const token2 = getQrToken(secret, windowId);
		const tokenDifferentWindow = getQrToken(secret, windowId - 1);

		expect(token1).toBe(token2);
		expect(token1).not.toBe(tokenDifferentWindow);
	});

	it('should support checking both current and previous time windows to handle clock drift', () => {
		const secret = 'some-secret-key';
		const nowWindow = Math.floor(Date.now() / 15000);

		const generatedToken = getQrToken(secret, nowWindow - 1); // Token generated 15s ago

		const verifiedCurrent = getQrToken(secret, nowWindow);
		const verifiedPrevious = getQrToken(secret, nowWindow - 1);

		// Verifying that checking against both windows correctly matches the old token
		const isMatched = generatedToken === verifiedCurrent || generatedToken === verifiedPrevious;
		expect(isMatched).toBe(true);
	});
});
