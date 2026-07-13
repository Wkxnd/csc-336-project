import type { Pathname } from '$app/types';

export interface Crumb {
	label: string;
	href?: Pathname;
}

class BreadcrumbsManager {
	crumbs = $state<Crumb[]>([]);
	extra = $state<string>('');

	set(crumbs: Crumb[], extra = '') {
		this.crumbs = crumbs;
		this.extra = extra;
	}

	clear() {
		this.crumbs = [];
		this.extra = '';
	}
}

export const breadcrumbs = new BreadcrumbsManager();
