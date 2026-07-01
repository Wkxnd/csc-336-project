import { redirect, type Handle } from '@sveltejs/kit';
import { getCurrentUser } from '$lib/auth.remote';

export const handle: Handle = async ({ event, resolve }) => {
	// redirect logged-in users to their dashboard if they try to access the root path
	if (event.url.pathname === '/') {
		const user = await getCurrentUser();
		return redirect(303, `/dashboard/${user.role}`);
	}

	return await resolve(event);
};
