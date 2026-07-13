<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<div class="min-h-[50vh] flex flex-col items-center justify-center text-center gap-base p-lg">
	<p class="font-caption-uppercase text-muted text-[12px] uppercase tracking-wide">
		Error {page.status}
	</p>
	<h1 class="font-display-md text-[24px] text-ink">
		{page.error?.message ?? 'An unexpected error occurred.'}
	</h1>

	<div class="flex gap-sm mt-sm">
		{#if page.status === 401 || page.status === 403}
			<a
				href={resolve('/auth')}
				class="inline-flex items-center justify-center font-button font-medium rounded-full transition-all duration-200 bg-ink text-surface-container-lowest hover:opacity-90 px-xl py-sm text-button h-10"
			>
				Sign In
			</a>
		{/if}
		<a
			href={resolve('/')}
			class="inline-flex items-center justify-center font-button font-medium rounded-full transition-all duration-200 bg-transparent border border-hairline text-ink hover:bg-surface-container px-xl py-sm text-button h-10"
		>
			Go Home
		</a>
	</div>
</div>
