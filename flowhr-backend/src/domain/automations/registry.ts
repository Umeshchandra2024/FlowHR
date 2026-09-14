import type { AutomationAction, AutomationExecutor, AutomationExecutorContext } from '../types';

// The action catalog. Adding a 5th action means adding one entry here plus (optionally) a
// dedicated executor below — everything else (route, validation, docs) reads from this list.
export const AUTOMATION_CATALOG: AutomationAction[] = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject', 'message'] },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
  { id: 'create_ticket', label: 'Create IT Ticket', params: ['system', 'priority'] },
  { id: 'slack_notify', label: 'Notify on Slack', params: ['channel', 'message'] },
];

function formatParams(params: Record<string, string>): string {
  const entries = Object.entries(params ?? {});
  if (entries.length === 0) return '';
  return ' with ' + entries.map(([k, v]) => `${k}="${v || '—'}"`).join(', ');
}

// Actions with no real-world side effect available in this v1 are logged as executed, not faked
// as something they aren't — the message always says "(simulated)" so a run's audit log is honest
// about what actually happened.
function simulatedExecutor(): AutomationExecutor {
  return async (ctx: AutomationExecutorContext) => ({
    status: 'success',
    message: `Executed '${ctx.actionLabel}' (simulated)${formatParams(ctx.params)}`,
  });
}

export type SendEmailFn = (args: { to: string; subject: string; body: string }) => Promise<void>;

export function createSendEmailExecutor(sendEmail: SendEmailFn, emailSendingEnabled: boolean): AutomationExecutor {
  return async (ctx) => {
    const to = ctx.params.to;
    if (!to) {
      return { status: 'error', message: `Send Email step '${ctx.nodeTitle}' is missing a "to" address` };
    }
    if (!emailSendingEnabled) {
      return {
        status: 'success',
        message: `Executed '${ctx.actionLabel}' (simulated — email sending disabled)${formatParams(ctx.params)}`,
      };
    }
    const subject = ctx.params.subject || `Notification: ${ctx.nodeTitle}`;
    const body = ctx.params.message || `Automated notification from workflow step "${ctx.nodeTitle}".`;
    try {
      await sendEmail({ to, subject, body });
      return { status: 'success', message: `Executed '${ctx.actionLabel}' — email sent to ${to} via Resend` };
    } catch (err) {
      return { status: 'error', message: `Failed to send email to ${to}: ${(err as Error).message}` };
    }
  };
}

export function createAutomationExecutors(deps: {
  sendEmail: SendEmailFn;
  emailSendingEnabled: boolean;
}): Record<string, AutomationExecutor> {
  return {
    send_email: createSendEmailExecutor(deps.sendEmail, deps.emailSendingEnabled),
    generate_doc: simulatedExecutor(),
    create_ticket: simulatedExecutor(),
    slack_notify: simulatedExecutor(),
  };
}
