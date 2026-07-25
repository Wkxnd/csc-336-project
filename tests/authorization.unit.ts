import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Class, ClassSessionRow } from '$lib/types';

const sqlMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	sql: sqlMock
}));

import {
	requireOwnedClass,
	requireOwnedSession,
	requireStudentEnrollment
} from '$lib/server/authorization';

const ownedClass: Class = {
	id: '00000000-0000-4000-8000-000000000001',
	faculty_id: '00000000-0000-4000-8000-000000000002',
	name: 'Database Systems',
	code: 'CSC-336',
	description: null,
	created_at: '2026-07-25T12:00:00.000Z'
};

const ownedSession: ClassSessionRow = {
	id: '00000000-0000-4000-8000-000000000003',
	class_id: ownedClass.id,
	session_date: '2026-07-25T12:00:00.000Z',
	qr_secret: 'test-secret',
	attendance_expires_at: null,
	created_at: '2026-07-25T12:00:00.000Z'
};

describe('authorization guards', () => {
	beforeEach(() => {
		sqlMock.mockReset();
	});

	it('returns a class owned by the authenticated faculty member', async () => {
		sqlMock.mockResolvedValueOnce([ownedClass]);

		await expect(requireOwnedClass(ownedClass.faculty_id, ownedClass.id)).resolves.toEqual(
			ownedClass
		);
	});

	it('hides classes that are not owned by the authenticated faculty member', async () => {
		sqlMock.mockResolvedValueOnce([]);

		await expect(requireOwnedClass(ownedClass.faculty_id, ownedClass.id)).rejects.toMatchObject({
			status: 404,
			body: { message: 'Class not found' }
		});
	});

	it('returns a session through its owning class', async () => {
		sqlMock.mockResolvedValueOnce([ownedSession]);

		await expect(requireOwnedSession(ownedClass.faculty_id, ownedSession.id)).resolves.toEqual(
			ownedSession
		);
	});

	it('rejects sessions outside the authenticated faculty member’s classes', async () => {
		sqlMock.mockResolvedValueOnce([]);

		await expect(requireOwnedSession(ownedClass.faculty_id, ownedSession.id)).rejects.toMatchObject(
			{
				status: 404,
				body: { message: 'Session not found' }
			}
		);
	});

	it('allows enrolled students and rejects unenrolled students', async () => {
		sqlMock.mockResolvedValueOnce([{ enrolled: true }]);
		await expect(
			requireStudentEnrollment('00000000-0000-4000-8000-000000000004', ownedClass.id)
		).resolves.toBeUndefined();

		sqlMock.mockResolvedValueOnce([]);
		await expect(
			requireStudentEnrollment('00000000-0000-4000-8000-000000000005', ownedClass.id)
		).rejects.toMatchObject({
			status: 403,
			body: { message: 'You are not enrolled in this class' }
		});
	});
});
