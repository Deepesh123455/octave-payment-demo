import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  secure: false, // TLS
});

/**
 * Base generic email sender
 */
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string,
) => {
  const msg = {
    from: `"Octave Security" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(msg);
};

/**
 * Sends a beautifully formatted, brand-aligned OTP email for Octave Apparels.
 */
export const sendOtpEmail = async (to: string, otp: string) => {
  const subject = `${otp} is your Octave Secure Portal verification code`;

  // Plain text fallback for strict email clients or Apple Watches
  const text = `Your Octave Apparels OTP is ${otp}. It is valid for 5 minutes. Please do not share this with anyone.`;

  // Enterprise-grade, inline-styled HTML template
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Octave Apparels Verification</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #1a1a1a;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <tr>
              <td align="center" style="background-color: #000000; padding: 30px 20px;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase;">OCTAVE</h1>
                <p style="margin: 5px 0 0 0; color: #a1a1aa; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Secure Financial Portal</p>
              </td>
            </tr>

            <tr>
              <td style="padding: 40px 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">Authentication Required</h2>
                <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #52525b;">
                  You recently requested to log in to the Octave Apparels admin portal. Use the verification code below to complete your authentication.
                </p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 30px;">
                  <span style="font-family: monospace; font-size: 36px; font-weight: 700; color: #000000; letter-spacing: 8px;">${otp}</span>
                </div>

                <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 21px; color: #71717a; padding-left: 12px; border-left: 3px solid #ef4444;">
                  <strong>Security Notice:</strong> This code is valid for <strong>10 minutes</strong>. Octave Apparels employees will never ask for this code. If you did not request this, please escalate to the system administrator immediately.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="background-color: #fafafa; border-top: 1px solid #eaeaea; padding: 20px;">
                <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                  &copy; ${new Date().getFullYear()} Octave Apparels. All rights reserved.
                </p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #a1a1aa;">
                  This is an automated security message. Please do not reply.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  await sendEmail(to, subject, text, html);
};
