import { query, command } from '$app/server';
import { sql } from '$lib/server/db';
import { getFaculty } from '$lib/auth.remote';
import { PLAN_PRICES, getFacultyPlan } from '$lib/server/plans';
import { upgradePlanSchema, type Subscription } from '$lib/types';
import { error } from '@sveltejs/kit';

export const getMySubscription = query(async () => {
	const user = await getFaculty();
	const plan = await getFacultyPlan(user.id);

	const [row] = await sql<Subscription[]>`
		SELECT id, user_id, plan, status, starts_at, ends_at
		FROM subscriptions
		WHERE user_id = ${user.id}
	`;

	if (!row) {
		error(500, 'Subscription missing after ensure');
	}

	// Keep plan field aligned with ensure logic
	return { ...row, plan };
});

export const upgradePlan = command(upgradePlanSchema, async ({ plan }) => {
	const user = await getFaculty();
	const current = await getFacultyPlan(user.id);

	if (plan === current) {
		error(400, `You are already on the ${plan} plan.`);
	}

	const amount = PLAN_PRICES[plan];

	await sql`CALL record_subscription_payment(${user.id}, ${plan}::subscription_plan, ${amount}, ${`${plan[0]!.toUpperCase()}${plan.slice(1)} plan subscription`})`;

	void getMySubscription().refresh();
});
