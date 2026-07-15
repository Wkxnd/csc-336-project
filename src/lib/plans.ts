/** Client-safe plan pricing constants (mirrors server PLAN_PRICES). */
export const PLAN_PRICES = {
	free: 0,
	premium: 29.99,
	enterprise: 99
} as const;

export const PLAN_LABELS = {
	free: 'Free',
	premium: 'Premium',
	enterprise: 'Enterprise'
} as const;

// export const PLAN_LIMIT_COPY =
// 	'Limits: Free max 1 class · Premium+ export · Enterprise ASN restrictions.';
