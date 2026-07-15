<script lang="ts">
	import { BadgeCheck, QrCode, ShieldCheck, ChartColumn } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import { PLAN_PRICES } from '$lib/plans';

	const tiers = [
		{
			id: 'free' as const,
			name: 'Free',
			price: PLAN_PRICES.free,
			blurb: 'Try AttendLink with a single class.',
			features: ['1 class', 'Rotating QR check-in', 'Live attendance view', 'No CSV export']
		},
		{
			id: 'premium' as const,
			name: 'Premium',
			price: PLAN_PRICES.premium,
			blurb: 'Unlimited classes and one-click exports.',
			features: [
				'Unlimited classes',
				'Rotating QR check-in',
				'Live attendance + analytics',
				'CSV attendance export'
			],
			featured: true
		},
		{
			id: 'enterprise' as const,
			name: 'Enterprise',
			price: PLAN_PRICES.enterprise,
			blurb: 'Campus-grade controls for fraud-resistant check-ins.',
			features: [
				'Everything in Premium',
				'ASN / campus network allowlists',
				'Check-in IP enforcement',
				'Priority classroom security'
			]
		}
	];
</script>

<div class="min-h-screen bg-surface text-body font-body-md antialiased overflow-x-hidden">
	<!-- Ambient plane -->
	<div
		class="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_0%,color-mix(in_oklab,var(--color-gradient-sky)_35%,transparent),transparent_55%),radial-gradient(ellipse_at_90%_10%,color-mix(in_oklab,var(--color-gradient-peach)_28%,transparent),transparent_50%),radial-gradient(ellipse_at_50%_100%,color-mix(in_oklab,var(--color-gradient-mint)_22%,transparent),transparent_45%)]"
	></div>

	<header class="flex items-center justify-between px-6 md:px-12 py-5 max-w-6xl mx-auto w-full">
		<a href={resolve('/')} class="flex items-center gap-3">
			<BadgeCheck class="w-7 h-7 text-ink" strokeWidth={1.5} />
			<span class="font-display-md text-[22px] text-ink tracking-tight">AttendLink</span>
		</a>
		<nav class="flex items-center gap-3">
			<a
				href={resolve('/#pricing')}
				class="hidden sm:inline text-[14px] text-muted hover:text-ink transition-colors px-3"
			>
				Pricing
			</a>
			<a href={resolve('/auth')}>
				<Button variant="outline" size="sm">Sign in</Button>
			</a>
		</nav>
	</header>

	<section class="max-w-6xl mx-auto px-6 md:px-12 pt-8 pb-12 md:pt-12 md:pb-[6rem]">
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-12">
			<div class="max-w-2xl fade-in-up">
				<p
					class="font-display-mega text-[clamp(2.75rem,8vw,4.5rem)] leading-[1.05] text-ink tracking-tight mb-5"
				>
					AttendLink
				</p>
				<h1 class="font-title-md text-[clamp(1.25rem,3vw,1.75rem)] text-ink font-semibold mb-4">
					Attendance that students can't spoof from the hallway.
				</h1>
				<!-- <p class="text-muted text-[16px] md:text-[17px] leading-relaxed max-w-xl mb-6">
					Faculty start a session, project a rotating QR, and watch the roster fill in live — with
					optional campus-network checks on Enterprise.
				</p> -->
				<div class="flex flex-wrap items-center gap-3">
					<a href={resolve('/auth')}>
						<Button size="lg">Get started free</Button>
					</a>
					<a href={resolve('/#pricing')}>
						<Button variant="outline" size="lg">See plans</Button>
					</a>
				</div>
			</div>

			<div class="shrink-0 hero-float opacity-90" aria-hidden="true">
				<div
					class="w-48 h-48 md:w-64 md:h-64 rounded-2xl border border-hairline bg-surface-container-lowest/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
				>
					<QrCode class="w-28 h-28 md:w-40 md:h-40 text-ink/80" strokeWidth={1} />
				</div>
			</div>
		</div>
	</section>

	<section class="max-w-6xl mx-auto px-6 md:px-12 pb-12">
		<div class="grid md:grid-cols-3 gap-6 border-t border-hairline pt-12">
			{#each [{ icon: QrCode, title: 'Rotating QR', body: 'Codes refresh every ~15 seconds so a shared screenshot goes stale fast.' }, { icon: ChartColumn, title: 'Live roster', body: 'Watch check-ins arrive in real time, then export when class ends.' }, { icon: ShieldCheck, title: 'Network checks', body: 'Enterprise plans can allowlist campus ASNs so off-network proxies fail.' }] as item (item.title)}
				<div class="feature-rise">
					<item.icon class="w-6 h-6 text-ink mb-3" strokeWidth={1.5} />
					<h2 class="font-title-md text-[17px] text-ink font-semibold mb-2">{item.title}</h2>
					<p class="text-muted text-[14px] leading-relaxed">{item.body}</p>
				</div>
			{/each}
		</div>
	</section>

	<section id="pricing" class="max-w-6xl mx-auto px-6 md:px-12 pb-24">
		<div class="mb-8 max-w-xl">
			<h2 class="font-display-lg text-[clamp(1.75rem,4vw,2.5rem)] text-ink tracking-tight mb-3">
				Simple plans for every classroom
			</h2>
			<!-- <p class="text-muted text-[15px] leading-relaxed">
				Upgrade anytime with one click after you sign in — no card forms for this demo.
			</p> -->
		</div>

		<div class="grid md:grid-cols-3 gap-4 items-stretch">
			{#each tiers as tier (tier.id)}
				<div
					class="flex flex-col border rounded-xl p-6 bg-surface-container-lowest/90 {tier.featured
						? 'border-ink shadow-md'
						: 'border-hairline'}"
				>
					{#if tier.featured}
						<span
							class="font-caption-uppercase text-[10px] tracking-wider text-muted uppercase mb-3"
						>
							Most popular
						</span>
					{/if}
					<h3 class="font-title-md text-[20px] text-ink font-semibold">{tier.name}</h3>
					<p class="mt-3 mb-4">
						<span class="font-display-md text-[36px] text-ink">
							{tier.price === 0 ? '$0' : `$${tier.price.toFixed(2)}`}
						</span>
						{#if tier.price > 0}
							<span class="text-muted text-[14px]">/mo</span>
						{/if}
					</p>
					<p class="text-muted text-[14px] mb-6 leading-relaxed">{tier.blurb}</p>
					<ul class="flex flex-col gap-2 mb-6 flex-1">
						{#each tier.features as feature (feature)}
							<li class="text-[13px] text-on-surface-variant flex gap-2">
								<span class="text-ink">✓</span>
								{feature}
							</li>
						{/each}
					</ul>
					<a href={resolve('/auth')} class="mt-auto">
						<Button variant={tier.featured ? 'primary' : 'outline'} class="w-full">
							{tier.price === 0 ? 'Start free' : `Choose ${tier.name}`}
						</Button>
					</a>
				</div>
			{/each}
		</div>
	</section>

	<footer
		class="border-t border-hairline px-6 md:px-12 py-6 max-w-6xl mx-auto w-full flex flex-col sm:flex-row justify-between gap-3 text-[13px] text-muted"
	>
		<span>&copy; {new Date().getFullYear()} AttendLink</span>
		<a href={resolve('/admin')} class="hover:text-ink transition-colors">Developer revenue</a>
	</footer>
</div>

<style>
	.hero-float {
		animation: heroFloat 6s ease-in-out infinite;
	}

	.feature-rise {
		animation: fadeInUp 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}

	.feature-rise:nth-child(2) {
		animation-delay: 0.12s;
	}

	.feature-rise:nth-child(3) {
		animation-delay: 0.24s;
	}

	@keyframes heroFloat {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}
</style>
