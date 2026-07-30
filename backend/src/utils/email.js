import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.resendApiKey);

export const sendOtpEmail = async (toEmail, otp) => {
  await resend.emails.send({
    from: 'Amrutam <onboarding@resend.dev>', // sandbox sender — domain verify karne tak yehi use hoga
    to: toEmail,
    subject: 'Your Amrutam password reset code',
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
        <h2 style="color: #0284c7;">Password Reset</h2>
        <p>Your one-time code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p style="color: #64748b; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `
  });
};