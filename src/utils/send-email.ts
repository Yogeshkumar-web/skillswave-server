import { Resend } from 'resend';
import envVariables from '../config';

const resend = new Resend(envVariables.resend.apiKey);

interface SendEmailOptions {
  email: string;
  fullName: string;
  verificationUrl: string;
}

const sendEmail = async ({
  email,
  fullName,
  verificationUrl,
}: SendEmailOptions): Promise<{
  success: boolean;
  data?: any;
  error?: any;
}> => {
  try {
    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: email,
      subject: 'Verify Your Email',
      html: `
      <p>Hello ${fullName},</p>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verificationUrl}" style="color: #007bff; text-decoration: none;">Verify Email</a></p>
      <p>If you didn’t request this, you can safely ignore this email.</p>
    `,
    });

    return { success: true, data }; // On success, return data
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error }; // On error, return error details
  }
};

export { sendEmail };
