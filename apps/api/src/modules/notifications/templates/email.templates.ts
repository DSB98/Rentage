// Lightweight HTML email templates. Avoids extra deps; uses simple substitution.
// For richer templates, swap to MJML or react-email later.

const BASE = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f6fa;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fa;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#f97316);padding:24px;color:#fff;">
          <h1 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.01em;">Rentage</h1>
        </td></tr>
        <tr><td style="padding:32px 28px;line-height:1.6;font-size:15px;">
          ${content}
        </td></tr>
        <tr><td style="background:#f9fafb;padding:18px 28px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
          You are receiving this email because you have an account at Rentage.
          If you did not request this, you can safely ignore this message.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const BUTTON = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">${label}</a>`;

export const Templates = {
  emailVerification(params: { name: string; url: string }) {
    return {
      subject: 'Verify your Rentage email',
      html: BASE(
        'Verify your email',
        `<p>Hi ${params.name || 'there'},</p>
         <p>Welcome to Rentage! Please confirm your email to activate your account.</p>
         <p style="margin:28px 0;">${BUTTON(params.url, 'Verify email')}</p>
         <p style="font-size:13px;color:#6b7280;">Or paste this URL into your browser:<br/>
         <span style="word-break:break-all;">${params.url}</span></p>`,
      ),
      text: `Verify your Rentage email: ${params.url}`,
    };
  },

  passwordReset(params: { name: string; url: string }) {
    return {
      subject: 'Reset your Rentage password',
      html: BASE(
        'Reset your password',
        `<p>Hi ${params.name || 'there'},</p>
         <p>We received a request to reset your password. Click below to set a new one. The link expires in 1 hour.</p>
         <p style="margin:28px 0;">${BUTTON(params.url, 'Reset password')}</p>
         <p style="font-size:13px;color:#6b7280;">If you didn't request this, you can ignore this email.</p>`,
      ),
      text: `Reset your Rentage password: ${params.url}`,
    };
  },

  inquiryReceived(params: { ownerName: string; renterName: string; listingTitle: string; url: string }) {
    return {
      subject: `New inquiry on "${params.listingTitle}"`,
      html: BASE(
        'New inquiry',
        `<p>Hi ${params.ownerName || 'there'},</p>
         <p><strong>${params.renterName}</strong> has sent an inquiry on your listing <strong>${params.listingTitle}</strong>.</p>
         <p style="margin:28px 0;">${BUTTON(params.url, 'View inquiry')}</p>`,
      ),
      text: `New inquiry from ${params.renterName} on ${params.listingTitle}: ${params.url}`,
    };
  },

  bookingConfirmed(params: { name: string; code: string; listingTitle: string; url: string }) {
    return {
      subject: `Booking ${params.code} confirmed`,
      html: BASE(
        'Booking confirmed',
        `<p>Hi ${params.name || 'there'},</p>
         <p>Your booking <strong>${params.code}</strong> for <strong>${params.listingTitle}</strong> has been confirmed.</p>
         <p style="margin:28px 0;">${BUTTON(params.url, 'View booking')}</p>`,
      ),
      text: `Booking ${params.code} confirmed for ${params.listingTitle}: ${params.url}`,
    };
  },

  generic(params: { title: string; body: string; url?: string; ctaLabel?: string }) {
    const cta = params.url ? `<p style="margin:28px 0;">${BUTTON(params.url, params.ctaLabel || 'Open Rentage')}</p>` : '';
    return {
      subject: params.title,
      html: BASE(params.title, `<p>${params.body}</p>${cta}`),
      text: `${params.title}\n\n${params.body}${params.url ? `\n\n${params.url}` : ''}`,
    };
  },
};

export type TemplateName = keyof typeof Templates;
