import { z } from 'zod';

export const attendanceCheckInSchema = z.object({
  sessionId: z.string().min(1),
  qrToken: z.string().optional().default(''),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  gpsAccuracyM: z.number().optional(),
  deviceUserAgent: z.string().optional(),
  manualReason: z.string().max(500).optional()
});
