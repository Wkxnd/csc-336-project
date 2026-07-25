import { createGoogleVertex } from '@ai-sdk/google-vertex';
import { env } from '$env/dynamic/private';

export function getVertex() {
	return createGoogleVertex({
		project: env.GOOGLE_VERTEX_PROJECT,
		location: env.GOOGLE_VERTEX_LOCATION,
		googleAuthOptions: { keyFilename: env.GOOGLE_APPLICATION_CREDENTIALS }
	});
}

export function getChatModel() {
	const model = env.VERTEX_MODEL;
	if (!model) {
		throw new Error('VERTEX_MODEL is required');
	}

	return getVertex()(model);
}
