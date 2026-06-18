// src/lib/server/email.ts
import nodemailer from "nodemailer";
// sendVerificationEmail removed — OTP flow replaces it

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM) {
  throw new Error("[email.ts] Missing required SMTP env vars: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM");
}

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
if (!baseUrl) throw new Error("[email.ts] Neither NEXTAUTH_URL nor NEXT_PUBLIC_APP_URL is set");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("[email] SMTP transporter verify failed:", error);
  }
});

export async function sendOtpEmail(email: string, name: string, code: string) {
  const digits = code.split("");
  const digitBoxes = digits
    .map(
      (d) =>
        `<span style="display:inline-block;width:44px;height:52px;line-height:52px;text-align:center;font-size:26px;font-weight:700;color:#1d4ed8;background:#eff6ff;border:2px solid #bfdbfe;border-radius:10px;margin:0 4px;">${d}</span>`,
    )
    .join("");

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "My Daily Routine — Your Verification Code",
    text: `Hi ${name},

Your verification code for My Daily Routine is: ${code}

This code expires in 5 minutes.

Enter this code in the verification screen to activate your account. If you didn't request this, you can safely ignore this email.

— My Daily Routine`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Verify your email</title></head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);padding:40px 48px 36px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px;">🔐</div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.3px;">Verify Your Email</h1>
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:15px;">My Daily Routine</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 48px 32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1e293b;">Hi ${name},</p>
            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
              Use the verification code below to confirm your email address and complete your registration.
            </p>

            <!-- Code box -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:28px 24px;">
                  <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#3b82f6;letter-spacing:1.5px;text-transform:uppercase;">Your one-time code</p>
                  <div style="letter-spacing:0;">${digitBoxes}</div>
                </td>
              </tr>
            </table>

            <!-- Expiry -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
              <tr>
                <td align="center">
                  <span style="display:inline-flex;align-items:center;gap:6px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:8px 16px;font-size:13px;color:#92400e;font-weight:500;">
                    ⏱ This code expires in <strong>5 minutes</strong>
                  </span>
                </td>
              </tr>
            </table>

            <p style="margin:28px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
              Enter this code in the verification screen to activate your account. If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 48px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 48px 36px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">You're receiving this because you signed up for</p>
            <p style="margin:0;font-size:13px;font-weight:600;color:#3b82f6;">My Daily Routine</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("OTP email send error:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Welcome to My Daily Routine!",
    text: `Hi ${name},

Welcome to My Daily Routine! Your account is now active and ready to go.

We're thrilled to have you join the community of people building better daily habits.

What you can do:
- Plan: Build structured daily routines
- Track: Monitor your daily progress
- Grow: Build lasting habits over time

Get started: ${baseUrl}/login

— My Daily Routine`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome!</title></head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);padding:48px 48px 40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;margin-bottom:18px;">🎉</div>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.3px;">Welcome aboard!</h1>
            <p style="margin:10px 0 0;color:#bfdbfe;font-size:15px;">My Daily Routine</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 48px 8px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1e293b;">Hi ${name},</p>
            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
              Your account is now active and ready to go. We're thrilled to have you join the community of people building better daily habits.
            </p>
          </td>
        </tr>

        <!-- Feature cards -->
        <tr>
          <td style="padding:0 48px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px 20px;vertical-align:top;width:30%;">
                  <div style="font-size:24px;margin-bottom:8px;">📋</div>
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1d4ed8;">Plan</p>
                  <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">Build structured daily routines</p>
                </td>
                <td style="width:12px;"></td>
                <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px 20px;vertical-align:top;width:30%;">
                  <div style="font-size:24px;margin-bottom:8px;">✅</div>
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1d4ed8;">Track</p>
                  <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">Monitor your daily progress</p>
                </td>
                <td style="width:12px;"></td>
                <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px 20px;vertical-align:top;width:30%;">
                  <div style="font-size:24px;margin-bottom:8px;">📈</div>
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1d4ed8;">Grow</p>
                  <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">Build lasting habits over time</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 48px 40px;text-align:center;">
            <a href="${baseUrl}/login"
               style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:10px;letter-spacing:0.2px;box-shadow:0 4px 12px rgba(37,99,235,0.30);">
              Get Started →
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 48px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 48px 36px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">You're receiving this because you created an account at</p>
            <p style="margin:0;font-size:13px;font-weight:600;color:#3b82f6;">My Daily Routine</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Welcome email send error:", error);
    return { success: false, error };
  }
}

export async function sendContactMessageEmail(
  fromEmail: string,
  fromName: string,
  subject: string,
  body: string,
) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: "mydailyroutinecontact@gmail.com",
    replyTo: fromEmail,
    subject: `[Contact] ${subject}`,
    text: `From: ${fromName} <${fromEmail}>\n\n${body}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Contact message</title></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,0.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);padding:32px 48px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">New Contact Message</h1>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">My Daily Routine</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
              <tr style="background:#f8fafc;">
                <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e2e8f0;">From</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:14px;color:#1e293b;">${fromName} &lt;${fromEmail}&gt;</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">Subject</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:14px;color:#1e293b;">${subject}</td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Message</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;font-size:14px;color:#334155;line-height:1.7;white-space:pre-wrap;">${body}</div>
            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">Reply directly to this email to respond to ${fromName}.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Contact message email send error:", error);
    return { success: false, error };
  }
}

export async function sendTrialExpiringEmail(email: string, name: string, daysLeft: number) {
  const dayLabel = daysLeft === 1 ? "1 day" : `${daysLeft} days`;
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Your free trial ends in ${dayLabel}`,
    text: `Hi ${name},

Your free trial of My Daily Routine ends in ${dayLabel}.

After your trial expires you will lose access to:
- AI Routine Builder (powered by Gemini)
- Advanced stats and progress charts
- Priority goal management features

Upgrade now to keep access: ${baseUrl}/pricing

— My Daily Routine`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your trial is ending</title></head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#b45309 0%,#f59e0b 100%);padding:40px 48px 36px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px;">⏳</div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.3px;">Trial ending in ${dayLabel}</h1>
            <p style="margin:8px 0 0;color:#fef3c7;font-size:15px;">My Daily Routine</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 48px 32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1e293b;">Hi ${name},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
              Your free trial expires in <strong>${dayLabel}</strong>. After that, you'll lose access to these premium features:
            </p>

            <!-- Loss list -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="font-size:16px;">🤖</span>
                        <span style="font-size:14px;color:#1e293b;font-weight:600;margin-left:10px;">AI Routine Builder</span>
                        <span style="font-size:13px;color:#64748b;margin-left:6px;">— Gemini-powered routine generation</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="font-size:16px;">📊</span>
                        <span style="font-size:14px;color:#1e293b;font-weight:600;margin-left:10px;">Advanced Stats</span>
                        <span style="font-size:13px;color:#64748b;margin-left:6px;">— Progress charts and completion trends</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="font-size:16px;">🎯</span>
                        <span style="font-size:14px;color:#1e293b;font-weight:600;margin-left:10px;">Priority Goal Management</span>
                        <span style="font-size:13px;color:#64748b;margin-left:6px;">— Critical priority, subtasks, and tags</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
              Upgrade now to keep everything you've built and continue growing your habits without interruption.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 48px 40px;text-align:center;">
            <a href="${baseUrl}/pricing"
               style="display:inline-block;background:linear-gradient(135deg,#b45309,#f59e0b);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:10px;letter-spacing:0.2px;box-shadow:0 4px 12px rgba(180,83,9,0.30);">
              Upgrade Now →
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 48px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 48px 36px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">You're receiving this because you have an active free trial at</p>
            <p style="margin:0;font-size:13px;font-weight:600;color:#3b82f6;">My Daily Routine</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Trial expiry email send error:", error);
    return { success: false, error };
  }
}
