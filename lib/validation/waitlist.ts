import { z } from 'zod';
import { BadRequestError } from '@/lib/http/errors';

const emailSchema = z.string().trim().min(1).max(254).email();
const localeSchema = z.string().trim().min(2).max(10);
const tokenSchema = z.string().trim().min(1).max(2000);

const utmSchema = z
  .object({
    source: z.string().trim().max(100).optional(),
    medium: z.string().trim().max(100).optional(),
    campaign: z.string().trim().max(100).optional(),
    term: z.string().trim().max(100).optional(),
    content: z.string().trim().max(100).optional(),
  })
  .strict()
  .partial();

const signupSchema = z
  .object({
    email: emailSchema,
    consent: z.boolean(),
    hcaptchaToken: tokenSchema,
    locale: localeSchema.optional(),
    utm: utmSchema.optional(),
    ref: z.string().trim().max(200).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.consent !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'consent_required',
        path: ['consent'],
      });
    }
  });

const resendSchema = z.object({
  email: emailSchema,
  hcaptchaToken: tokenSchema,
});

const childSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    birthday: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/u, 'invalid_birthday'),
    weight: z
      .number({ invalid_type_error: 'invalid_weight' })
      .min(0.1, 'invalid_weight')
      .max(100, 'invalid_weight')
      .optional(),
    shoeSize: z.string().trim().max(32).optional(),
  })
  .strict();

const preOnboardingSchema = z
  .object({
    parentFirstName: z.string().trim().min(1).max(120).optional(),
    children: z.array(childSchema).min(1).max(5),
  })
  .strict();

export type SignupDTO = z.infer<typeof signupSchema>;
export type ResendDTO = z.infer<typeof resendSchema>;
export type PreOnboardingDTO = z.infer<typeof preOnboardingSchema>;

function sanitizeIssues(issues: z.ZodIssue[]): string[] {
  const fields = new Set<string>();
  for (const issue of issues) {
    const path = issue.path.join('.') || 'unknown';
    fields.add(path);
  }
  return Array.from(fields);
}

function parseWithSchema<T>(schema: z.ZodSchema<T>, payload: unknown, errorMessage: string, errorCode = 'invalid_request'): T {
  const result = schema.safeParse(payload);
  if (result.success) {
    return result.data;
  }
  const details = sanitizeIssues(result.error.issues);
  throw new BadRequestError(errorCode, errorMessage, { details });
}

export function parseSignupDTO(payload: unknown): SignupDTO {
  return parseWithSchema(signupSchema, payload, 'Invalid waitlist signup request', 'invalid_payload');
}

export function parseResendDTO(payload: unknown): ResendDTO {
  return parseWithSchema(resendSchema, payload, 'Invalid resend request');
}

export function parsePreOnboardingDTO(payload: unknown): PreOnboardingDTO {
  return parseWithSchema(preOnboardingSchema, payload, 'Invalid pre-onboarding payload');
}
