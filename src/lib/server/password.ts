import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const HASH_BYTE_LENGTH = 64;
const SALT_BYTE_LENGTH = 16;

export function hashPassword(password: string): string {
	const salt = randomBytes(SALT_BYTE_LENGTH).toString('hex');
	const hash = scryptSync(password, salt, HASH_BYTE_LENGTH).toString('hex');
	return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
	const [salt, hash, extra] = stored.split(':');

	if (
		!salt ||
		!hash ||
		extra !== undefined ||
		!/^[0-9a-f]+$/i.test(salt) ||
		!/^[0-9a-f]+$/i.test(hash)
	) {
		return false;
	}

	const storedHash = Buffer.from(hash, 'hex');
	if (storedHash.length !== HASH_BYTE_LENGTH) {
		return false;
	}

	const computedHash = scryptSync(password, salt, HASH_BYTE_LENGTH);
	return timingSafeEqual(storedHash, computedHash);
}
