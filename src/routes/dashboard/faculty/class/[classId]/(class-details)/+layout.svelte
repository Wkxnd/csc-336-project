<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getClass } from '../data.remote';
	import { breadcrumbs } from '$lib/breadcrumbs.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		params: { classId: string };
		children: Snippet;
	}

	let { params, children }: Props = $props();
	const classId = $derived(params.classId);

	// Determine active tab based on pathname
	const activeTab = $derived(page.url.pathname.endsWith('/analytics') ? 'analytics' : 'sessions');

	const classData = $derived(await getClass(classId));

	$effect(() => {
		breadcrumbs.set(
			[{ label: 'Classes', href: '/dashboard/faculty' }, { label: classData.code }],
			classData.name
		);
		return () => breadcrumbs.clear();
	});
</script>

<div class="flex flex-col gap-lg h-full">
	<!-- Tab Bar -->
	<div class="flex gap-sm border-b border-hairline shrink-0">
		<a
			href={resolve(`/dashboard/faculty/class/${classId}`)}
			class="flex items-center gap-xs pb-sm px-xs text-[14px] font-body-strong border-b-2 transition-colors cursor-pointer {activeTab ===
			'sessions'
				? 'border-ink text-ink'
				: 'border-transparent text-muted hover:text-ink'}"
		>
			Sessions
		</a>
		<a
			href={resolve(`/dashboard/faculty/class/${classId}/analytics`)}
			class="flex items-center gap-xs pb-sm px-xs text-[14px] font-body-strong border-b-2 transition-colors cursor-pointer {activeTab ===
			'analytics'
				? 'border-ink text-ink'
				: 'border-transparent text-muted hover:text-ink'}"
		>
			Analytics
		</a>
	</div>

	<div class="flex-1 flex flex-col min-h-0">
		{@render children()}
	</div>
</div>
