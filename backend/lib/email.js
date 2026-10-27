import { Resend } from 'resend';

const isDev = process.env.NODE_ENV !== 'production';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function logDevEmailMirror({ subject, to, lines }) {
  if (!isDev) return;
  const body = lines.filter(Boolean).join('\n');
  console.log(`\n[email:dev] ${subject}\nTo: ${to}\n\n${body}\n`);
}

function magicEmailShell({ title, intro, code, actionUrl, actionLabel, codeLabel = 'One-time code' }) {
  const safeCode = escapeHtml(code);
  const safeUrl = escapeHtml(actionUrl);
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#1c1917;background:#f5f5f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
    <tr>
      <td style="padding:28px 24px;background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;">
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1c1917;">${escapeHtml(title)}</p>
        <p style="margin:0 0 20px;color:#57534e;font-size:14px;">${escapeHtml(intro)}</p>
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#78716c;">${escapeHtml(codeLabel)}</p>
        <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:0.35em;font-family:ui-monospace,monospace;color:#1c1917;">${safeCode}</p>
        <p style="margin:0 0 12px;font-size:14px;color:#57534e;">Or use the button below (expires in 15 minutes).</p>
        <a href="${safeUrl}" style="display:inline-block;padding:12px 20px;background:#3f6212;color:#ffffff;text-decoration:none;font-weight:600;border-radius:10px;font-size:14px;">${escapeHtml(actionLabel)}</a>
        <p style="margin:20px 0 0;font-size:12px;color:#a8a29e;word-break:break-all;">${safeUrl}</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

async function sendWithResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!isDev) {
      console.error('[email] RESEND_API_KEY is not set; cannot send email');
    }
    return { sent: false, devLogged: isDev };
  }

  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    console.error('[email] RESEND_FROM_EMAIL is not set');
    return { sent: false, devLogged: isDev };
  }

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error(`[email] Resend error to ${to}:`, error);
      return { sent: false, error, devLogged: isDev };
    }
    console.log(`[email] Sent to ${to}, id:`, data?.id);
    return { sent: true, data, devLogged: isDev };
  } catch (err) {
    console.error(`[email] Resend error to ${to}:`, err);
    return { sent: false, error: err, devLogged: isDev };
  }
}

export async function sendMagicLinkEmail({ to, magicUrl, code }) {
  const subject = 'Your Journal sign-in link';
  const html = magicEmailShell({
    title: 'Sign in to Journal',
    intro: 'Use this one-time code or the link below to sign in.',
    code,
    actionUrl: magicUrl,
    actionLabel: 'Sign in',
    codeLabel: 'Sign-in code',
  });

  logDevEmailMirror({
    subject,
    to,
    lines: [`Your sign-in code: ${code}`, '', 'Or open this link (expires in 15 minutes):', magicUrl],
  });

  return sendWithResend({ to, subject, html });
}

export async function sendMagicRegisterEmail({ to, registerUrl, code }) {
  const subject = 'Finish creating your Journal account';
  const html = magicEmailShell({
    title: 'Create your Journal account',
    intro: 'Use this one-time code or the link below to finish sign-up.',
    code,
    actionUrl: registerUrl,
    actionLabel: 'Create account',
    codeLabel: 'Sign-up code',
  });

  logDevEmailMirror({
    subject,
    to,
    lines: [`Your sign-up code: ${code}`, '', 'Or open this link (expires in 15 minutes):', registerUrl],
  });

  return sendWithResend({ to, subject, html });
}
