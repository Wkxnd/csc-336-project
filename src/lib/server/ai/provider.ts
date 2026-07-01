import { createGoogleVertex } from '@ai-sdk/google-vertex';
import { env } from '$env/dynamic/private';

export const vertex = createGoogleVertex({
	project: env.GOOGLE_VERTEX_PROJECT,
	location: env.GOOGLE_VERTEX_LOCATION,
	googleAuthOptions: { keyFilename: env.GOOGLE_APPLICATION_CREDENTIALS }
});

export const chatModel = vertex(env.VERTEX_MODEL);
