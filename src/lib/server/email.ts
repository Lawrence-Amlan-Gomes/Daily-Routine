// src/lib/server/email.ts
import nodemailer from "nodemailer";
// sendVerificationEmail removed — OTP flow replaces it

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("EMAIL_USER and EMAIL_PASS must be set in environment");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(email: string, name: string, code: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "My Daily Routine: Your Verification Code",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .code-box {
              display: inline-block;
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #166534;
              background: #f0fdf4;
              border: 2px solid #166534;
              border-radius: 8px;
              padding: 16px 32px;
              margin: 20px 0;
            }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Hello, ${name}!</h2>
            <p>Your verification code for My Daily Routine is:</p>
            <div class="code-box">${code}</div>
            <p>This code expires in <strong>1 minute</strong>.</p>
            <div class="footer">
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
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
    from: process.env.EMAIL_USER,
    to: email,
    subject: "My Daily Routine: Welcome! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for registering with My Daily Routine. Your account is now active and ready to use.</p>
            <p>Start building your perfect daily routine today!</p>
            <div class="footer">
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
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

// ← NEW: Send success email after verification
export async function sendVerificationSuccessEmail(
  email: string,
  name: string,
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "My Daily Routine: Email Verified Successfully! 🎉",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f9ff; }
            .content { background: white; padding: 30px; border-radius: 10px; }
            .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #166534; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
              text-align: center;
            }
            .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
            h2 { color: #16a34a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <div class="success-icon">✅</div>
              <h2>Email Verified Successfully!</h2>
              <p>Hi ${name},</p>
              <p>Congratulations! Your email has been successfully verified. You now have full access to all My Daily Routine features.</p>
              <p>You can now log in to your account and start using our services.</p>
              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/login" class="button">Go to Login</a>
              </div>
              <div class="footer">
                <p>Thank you for choosing My Daily Routine!</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Success email send error:", error);
    return { success: false, error };
  }
}
