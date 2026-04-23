import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let transporter: Transporter | null = null;

function getEmailConfig() {
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';

  return { user, pass };
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const { user, pass } = getEmailConfig();

  if (!user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export function isEmailConfigured() {
  const { user, pass } = getEmailConfig();
  return Boolean(user && pass);
}

export async function sendEmail(input: SendEmailInput) {
  const mailer = getTransporter();

  if (!mailer) {
    throw new Error('Email service is not configured');
  }

  const fromUser = process.env.EMAIL_USER as string;
  const fromName = process.env.EMAIL_FROM_NAME || 'Kitchen Soft Platform';

  return mailer.sendMail({
    from: `${fromName} <${fromUser}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
