import { z } from 'zod';

const requiredEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_LIFF_ID: z.string().min(1),
  LINE_CHANNEL_ID: z.string().min(1),
  LINE_CHANNEL_SECRET: z.string().min(1)
});

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('Attendance Checker'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_LIFF_ID: z.string().min(1),
  LINE_CHANNEL_ID: z.string().min(1),
  LINE_CHANNEL_SECRET: z.string().min(1),
  LINE_LIFF_BASE_URL: z.string().url().default('http://localhost:3000/liff'),
  DEFAULT_ORGANIZATION_CODE: z.string().min(1).default('DEFAULT'),
  DEFAULT_ORGANIZATION_NAME_TH: z.string().min(1).default('Default Organization'),
  DEFAULT_ORGANIZATION_NAME_EN: z.string().min(1).default('Default Organization'),
  GPS_MAX_ACCURACY_M: z.coerce.number().default(300),
  DEFAULT_GEOFENCE_RADIUS_M: z.coerce.number().default(100),
  MANUAL_APPROVAL_POLICY: z.enum(['pending_if_accuracy_poor', 'reject_if_accuracy_poor']).default('pending_if_accuracy_poor')
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const rawEnv = {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_LIFF_ID: process.env.NEXT_PUBLIC_LIFF_ID,
    LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID,
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    LINE_LIFF_BASE_URL: process.env.LINE_LIFF_BASE_URL,
    DEFAULT_ORGANIZATION_CODE: process.env.DEFAULT_ORGANIZATION_CODE,
    DEFAULT_ORGANIZATION_NAME_TH: process.env.DEFAULT_ORGANIZATION_NAME_TH,
    DEFAULT_ORGANIZATION_NAME_EN: process.env.DEFAULT_ORGANIZATION_NAME_EN,
    GPS_MAX_ACCURACY_M: process.env.GPS_MAX_ACCURACY_M,
    DEFAULT_GEOFENCE_RADIUS_M: process.env.DEFAULT_GEOFENCE_RADIUS_M,
    MANUAL_APPROVAL_POLICY: process.env.MANUAL_APPROVAL_POLICY
  };

  const required = requiredEnvSchema.safeParse(rawEnv);
  if (!required.success) {
    const missingOrInvalid = required.error.issues
      .map((issue) => issue.path.join('.'))
      .filter((value) => value.length > 0)
      .join(', ');
    throw new Error(`Missing or invalid required environment variables: ${missingOrInvalid}`);
  }

  cachedEnv = envSchema.parse(rawEnv);

  return cachedEnv;
}
