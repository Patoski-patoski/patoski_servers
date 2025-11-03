import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { UnofficialStatusCode } from 'hono/utils/http-status';

export interface Env {
	RESEND_API_KEY: string;
	RECIPIENT_EMAIL: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
	'/api/*',
	cors({
		origin: 'https://patrick-patoski.vercel.app',
		allowMethods: ['POST', 'GET', 'OPTIONS'],
		credentials: true,
	})
);

const validateRequest = (data: { name: string; email: string; subject: string; message: string }) => {
	const { name, email, subject, message } = data;

	if (typeof name !== 'string' || name.length === 0 || name.length > 150) {
		return { success: false, message: 'Invalid name.' };
	}
	if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return { success: false, message: 'Invalid email format.' };
	}
	if (typeof subject !== 'string' || subject.length <= 10) {
		return { success: false, message: 'Subject must be longer than 10 characters.' };
	}
	if (typeof message !== 'string' || message.length <= 10) {
		return { success: false, message: 'Message must be longer than 10 characters.' };
	}

	return { success: true };
};

app.post('/api/contact', async c => {
	try {
		const body = await c.req.json();
		const validation = validateRequest(body);

		if (!validation.success) {
			return c.json(
				{
					success: false,
					message: validation.message,
				},
				400
			);
		}

		const { name, email, subject, message } = body;

		const resendRequest = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
			},
			body: JSON.stringify({
				from: 'Portfolio Contact Form <onboarding@resend.dev>',
				to: c.env.RECIPIENT_EMAIL,
				reply_to: email,
				subject: `Portfolio Contact: ${subject}`,
				html: `
          <h3>New contact from your portfolio</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <h4>Message:</h4>
          <p>${message}</p>
        `,
			}),
		});

		if (!resendRequest.ok) {
			const error = await resendRequest.json();
			console.error('Error sending mail', error);
			// Forward the status code from Resend to the client
			return c.json(
				{
					success: false,
					message: 'Failed to send email',
					error,
				},
                resendRequest.status as UnofficialStatusCode
			);
		}

		return c.json({ success: true });
	} catch (error) {
		console.error('Error sending mail', error);
		const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
		return c.json(
			{
				success: false,
				message: errorMessage,
			},
			500
		);
	}
});

// Health check endpoint
app.get('/', c => {
	console.log('Health check working!!');
	return c.json({
		msg: 'Hello from Cloudflare Worker',
		status: 'ok',
	});
});

app.get('/health', c => {
	console.log('Health check working!!');
	return c.json({
		msg: 'Hello from Cloudflare Worker',
		status: 'ok',
	});
});

export default app;