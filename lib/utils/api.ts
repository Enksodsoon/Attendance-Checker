import { NextResponse } from 'next/server';
import type { z } from 'zod';

export async function readValidatedJson<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
): Promise<
  | { success: true; data: z.infer<TSchema> }
  | { success: false; response: NextResponse }
> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid request body',
          details: result.error.flatten()
        },
        { status: 400 }
      )
    };
  }

  return { success: true, data: result.data };
}
