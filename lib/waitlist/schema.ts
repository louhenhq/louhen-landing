import { z } from 'zod';

export const waitlistPayloadSchema = z.object({
  email: z.string().trim().min(1).email(),
  locale: z.string().trim().min(2).max(10),
  captchaToken: z.string().trim().min(1),
  gdprConsent: z.literal(true),
});

export type WaitlistPayload = z.infer<typeof waitlistPayloadSchema>;
