import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from '../src/server';

// Mock the global fetch function to avoid making real API calls during tests
global.fetch = vi.fn();

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Health Check Endpoint', () => {
	it('should respond with a 200 status and a success message on the root path', async () => {
		const request = new IncomingRequest('http://example.com/');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({
			msg: 'Hello from Cloudflare Worker',
			status: 'ok',
		});
	});

	it('should respond with a 200 status on the /health path', async () => {
		const request = new IncomingRequest('http://example.com/health');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
	});
});

describe('Contact Form Endpoint (/api/contact)', () => {
	const validData = {
		name: 'Patoski',
		email: 'test@example.com',
		subject: 'This is a valid subject line',
		message: 'This is a sufficiently long and valid message.',
	};

	it('should respond with 400 if the name is invalid', async () => {
		const invalidData = { ...validData, name: '' }; 
		const request = new IncomingRequest('http://example.com/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(invalidData),
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body).toEqual({
			success: false,
			message: 'Invalid name.',
		});
	});

	it('should respond with 400 if the email is invalid', async () => {
		const invalidData = { ...validData, email: 'not-an-email' };
		const request = new IncomingRequest('http://example.com/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(invalidData),
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body).toEqual({
			success: false,
			message: 'Invalid email format.',
		});
	});

	it('should respond with 200 for a valid request', async () => {
		// Mock a successful response from the Resend API
		vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 'test-id' }), { status: 200 }));

		const request = new IncomingRequest('http://example.com/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(validData),
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({ success: true });

		// Optional: Check if fetch was called correctly
		expect(fetch).toHaveBeenCalledWith(
			'https://api.resend.com/emails',
			expect.objectContaining({
				method: 'POST',
			})
		);
	});

	it('should respond with a forwarded status code if the email service fails', async () => {
		// Mock a failed response from the Resend API
		vi.mocked(fetch).mockResolvedValue(
			new Response(JSON.stringify({ message: 'Invalid API Key' }), { status: 401 })
		);

		const request = new IncomingRequest('http://example.com/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(validData),
		});

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(401); // Check that the status code is forwarded
		const body = await response.json() as { success: boolean; message: string };
		expect(body.success).toBe(false);
		expect(body.message).toBe('Failed to send email');
	});
});
