import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('Attendance Checker'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://demo.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('demo-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('demo-service-role-key'),
  NEXT_PUBLIC_LIFF_ID: z.string().min(1).default('demo-liff-id'),
  LINE_CHANNEL_ID: z.string().min(1).default('demo-line-channel-id'),
  LINE_CHANNEL_SECRET: z.string().min(1).default('demo-line-channel-secret'),
  LINE_LIFF_BASE_URL: z.string().url().default('http://localhost:3000/liff'),
  GPS_MAX_ACCURACY_M: z.coerce.number().default(150),
  DEFAULT_GEOFENCE_RADIUS_M: z.coerce.number().default(100),
  MANUAL_APPROVAL_POLICY: z.enum(['pending_if_accuracy_poor', 'reject_if_accuracy_poor']).default('pending_if_accuracy_poor')
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_LIFF_ID: process.env.NEXT_PUBLIC_LIFF_ID,
    LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID,
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    LINE_LIFF_BASE_URL: process.env.LINE_LIFF_BASE_URL,
    GPS_MAX_ACCURACY_M: process.env.GPS_MAX_ACCURACY_M,
    DEFAULT_GEOFENCE_RADIUS_M: process.env.DEFAULT_GEOFENCE_RADIUS_M,
    MANUAL_APPROVAL_POLICY: process.env.MANUAL_APPROVAL_POLICY
  });

  return cachedEnv;
}
