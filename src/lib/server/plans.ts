import { error } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import type { SubscriptionPlan } from '$lib/types';
import { PLAN_PRICES as CLIENT_PLAN_PRICES } from '$lib/plans';

export const PLAN_PRICES: Record<SubscriptionPlan, number> = { ...CLIENT_PLAN_PRICES };

export const PLAN_ORDER: Record<SubscriptionPlan, number> = {
	free: 0,
	premium: 1,
	enterprise: 2
};

export const PLAN_FEATURES = {
	free: {
		maxClasses: 1,
		canExport: false,
		canManageNetworkRestrictions: false
	},
	premium: {
		maxClasses: Infinity,
		canExport: true,
		canManageNetworkRestrictions: false
	},
	enterprise: {
		maxClasses: Infinity,
		canExport: true,
		canManageNetworkRestrictions: true
	}
} as const;

export function planAtLeast(plan: SubscriptionPlan, minimum: SubscriptionPlan): boolean {
	return PLAN_ORDER[plan] >= PLAN_ORDER[minimum];
}

export async function getFacultyPlan(userId: string): Promise<SubscriptionPlan> {
	const [row] = await sql<{ plan: SubscriptionPlan }[]>`
		SELECT plan FROM subscriptions WHERE user_id = ${userId} AND status = 'active'
	`;

	if (!row) {
		await sql`
			INSERT INTO subscriptions (user_id, plan, status)
			VALUES (${userId}, 'free', 'active')
			ON CONFLICT (user_id) DO NOTHING
		`;
		return 'free';
	}

	return row.plan;
}

export async function requirePlan(userId: string, minimum: SubscriptionPlan): Promise<SubscriptionPlan> {
	const plan = await getFacultyPlan(userId);
	if (!planAtLeast(plan, minimum)) {
		error(
			403,
			`This feature requires the ${minimum} plan or higher. Your current plan is ${plan}.`
		);
	}
	return plan;
}

/** Demo ASN resolver for school-project IP restrictions (no external GeoIP). */
export function resolveAsnFromIp(ip: string): number {
	const cleaned = ip.split(',')[0]?.trim() || '127.0.0.1';

	if (cleaned === '::1' || cleaned.startsWith('127.') || cleaned === 'localhost') {
		return 64512;
	}
	if (cleaned.startsWith('192.168.') || cleaned.startsWith('10.')) {
		return 64512;
	}
	if (cleaned.startsWith('172.')) {
		const second = Number(cleaned.split('.')[1]);
		if (second >= 16 && second <= 31) return 64513;
	}

	const parts = cleaned.replace(/^::ffff:/, '').split('.').map(Number);
	if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
		return ((parts[0] & 0xff) << 8) | (parts[1] & 0xff) || 1;
	}

	return 64512;
}
