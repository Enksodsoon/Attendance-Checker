import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { readValidatedJson } from '@/lib/utils/api';

describe('readValidatedJson', () => {
  it('returns a 400 response for malformed JSON bodies', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json'
    });

    const result = await readValidatedJson(request, z.object({ profileId: z.string() }));
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toMatchObject({
      error: 'Invalid JSON request body'
    });
  });

  it('returns a 400 response for schema validation failures', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: '' })
    });

    const result = await readValidatedJson(request, z.object({ profileId: z.string().min(1) }));
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toMatchObject({
      error: 'Invalid request body'
    });
  });
});
