import { query } from '$app/server';
import { sql } from '$lib/server/db';
import type { PaymentRow, RevenueSource, SubscriptionPlan } from '$lib/types';
import { PLAN_PRICES } from '$lib/server/plans';

export interface RevenueBySource {
	revenue_source: RevenueSource;
	transaction_count: number;
	total_revenue: string | number;
	currency: string;
}

export interface RevenueMonthly {
	month: string;
	revenue_source: RevenueSource;
	transaction_count: number;
	total_revenue: string | number;
	currency: string;
}

export interface PaymentWithUser extends PaymentRow {
	email: string | null;
	first_name: string | null;
	last_name: string | null;
}

export interface PlanCount {
	plan: SubscriptionPlan;
	subscriber_count: number;
}

export const getRevenueOverview = query(async () => {
	const bySource = await sql<RevenueBySource[]>`
		SELECT revenue_source, transaction_count::integer, total_revenue, currency
		FROM developer_revenue_summary
		ORDER BY total_revenue DESC
	`;

	const monthly = await sql<RevenueMonthly[]>`
		SELECT month::text, revenue_source, transaction_count::integer, total_revenue, currency
		FROM developer_revenue_monthly
		ORDER BY month ASC, revenue_source
	`;

	const recentPayments = await sql<PaymentWithUser[]>`
		SELECT p.id, p.user_id, p.amount, p.currency, p.source, p.description, p.created_at,
			u.email, u.first_name, u.last_name
		FROM payments p
		LEFT JOIN users u ON u.id = p.user_id
		ORDER BY p.created_at DESC
		LIMIT 50
	`;

	const planCounts = await sql<PlanCount[]>`
		SELECT plan, COUNT(*)::integer AS subscriber_count
		FROM subscriptions
		WHERE status = 'active'
		GROUP BY plan
		ORDER BY plan
	`;

	const totalRevenue = bySource.reduce((sum, row) => sum + Number(row.total_revenue), 0);
	const transactionCount = bySource.reduce((sum, row) => sum + Number(row.transaction_count), 0);

	const mrr = planCounts.reduce((sum, row) => {
		if (row.plan === 'free') return sum;
		return sum + PLAN_PRICES[row.plan] * Number(row.subscriber_count);
	}, 0);

	return {
		bySource,
		monthly,
		recentPayments,
		planCounts,
		totalRevenue,
		transactionCount,
		mrr
	};
});

export const exportRevenueCsv = query(async () => {
	const rows = await sql<PaymentWithUser[]>`
		SELECT p.id, p.user_id, p.amount, p.currency, p.source, p.description, p.created_at,
			u.email, u.first_name, u.last_name
		FROM payments p
		LEFT JOIN users u ON u.id = p.user_id
		ORDER BY p.created_at DESC
	`;

	const escape = (v: unknown) => {
		if (v === null || v === undefined) return '""';
		const str = v instanceof Date ? v.toISOString() : String(v);
		return `"${str.replace(/"/g, '""')}"`;
	};

	const header =
		'ID,Created At,Source,Amount,Currency,Description,User Email,First Name,Last Name';
	const lines = rows.map((r) =>
		[
			r.id,
			r.created_at,
			r.source,
			r.amount,
			r.currency,
			r.description,
			r.email,
			r.first_name,
			r.last_name
		]
			.map(escape)
			.join(',')
	);

	return [header, ...lines].join('\n');
});
