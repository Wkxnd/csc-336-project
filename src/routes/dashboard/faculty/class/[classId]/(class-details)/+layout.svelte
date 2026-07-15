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

	const activeTab = $derived(
		page.url.pathname.endsWith('/analytics')
			? 'analytics'
			: page.url.pathname.endsWith('/settings')
				? 'settings'
				: 'sessions'
	);

	const classData = $derived(await getClass(classId));

	$effect(() => {
		breadcrumbs.set(
			[{ label: 'Classes', href: '/dashboard/faculty' }, { label: classData.code }],
			classData.name
		);
		return () => breadcrumbs.clear();
	});
</script>

<div class="flex flex-col gap-6 h-full">
	<div class="flex gap-3 border-b border-hairline shrink-0">
		<a
			href={resolve(`/dashboard/faculty/class/${classId}`)}
			class="flex items-center gap-2 pb-3 px-2 text-[14px] font-body-strong border-b-2 transition-colors cursor-pointer {activeTab ===
			'sessions'
				? 'border-ink text-ink'
				: 'border-transparent text-muted hover:text-ink'}"
		>
			Sessions
		</a>
		<a
			href={resolve(`/dashboard/faculty/class/${classId}/analytics`)}
			class="flex items-center gap-2 pb-3 px-2 text-[14px] font-body-strong border-b-2 transition-colors cursor-pointer {activeTab ===
			'analytics'
				? 'border-ink text-ink'
				: 'border-transparent text-muted hover:text-ink'}"
		>
			Analytics
		</a>
		<a
			href={resolve(`/dashboard/faculty/class/${classId}/settings`)}
			class="flex items-center gap-2 pb-3 px-2 text-[14px] font-body-strong border-b-2 transition-colors cursor-pointer {activeTab ===
			'settings'
				? 'border-ink text-ink'
				: 'border-transparent text-muted hover:text-ink'}"
		>
			Settings
		</a>
	</div>

	<div class="flex-1 flex flex-col min-h-0">
		{@render children()}
	</div>
</div>
