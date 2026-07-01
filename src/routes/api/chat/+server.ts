import {
	streamText,
	convertToModelMessages,
	createUIMessageStreamResponse,
	toUIMessageStream,
	isStepCount,
	type UIMessage
} from 'ai';
import { error } from '@sveltejs/kit';
import { chatModel } from '$lib/server/ai/provider';
import { createFacultyTools } from '$lib/server/ai/tools';
import { resolveSessionUser } from '$lib/server/session';
import type { RequestHandler } from './$types';
// TODO: why is this an api endpoint and not remote function
const SYSTEM_PROMPT = `You are an attendance analytics assistant for a university professor.
You help answer questions about their classes, students, sessions, and attendance.

Rules:
- Always use the provided tools to look up real data. Never invent or guess numbers, names, or ids.
- Class ids are UUIDs. When a professor refers to a class by name or code, call listCourses first to resolve the id.
- If a tool returns an error, explain it plainly to the professor instead of making something up.
- Keep answers concise and reference concrete numbers from the data.`;

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await resolveSessionUser(cookies);
	if (!user) error(401, 'Not authenticated');
	if (user.role !== 'faculty') error(403, 'Only faculty can use the assistant');

	const { messages }: { messages: UIMessage[] } = await request.json();

	const result = streamText({
		model: chatModel,
		system: SYSTEM_PROMPT,
		messages: await convertToModelMessages(messages),
		tools: createFacultyTools(user.id),
		stopWhen: isStepCount(5)
	});

	return createUIMessageStreamResponse({
		stream: toUIMessageStream({ stream: result.stream })
	});
};
