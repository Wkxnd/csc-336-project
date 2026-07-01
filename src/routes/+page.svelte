<script lang="ts">
	import { getCurrentUser } from '$lib/auth.remote';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const currentUser = await getCurrentUser();

	goto(resolve(`/dashboard/${currentUser.role}`));
</script>
