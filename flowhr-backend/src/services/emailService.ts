import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../lib/logger';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }): Promise<void> {
  if (!resend) {
    throw new Error('Resend is not configured (missing RESEND_API_KEY)');
  }

  const result = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    text: body,
    html: body
      .split('\n')
      .map((line) => `<p>${line || '&nbsp;'}</p>`)
      .join(''),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  logger.info({ to, subject }, 'Email sent via Resend');
}
