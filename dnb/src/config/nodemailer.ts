import dotenv from 'dotenv';
import nodemailer, { Transporter } from 'nodemailer';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!SMTP_HOST || !SMTP_PORT || !EMAIL_USER || !EMAIL_PASS) {
  throw new Error('Missing required SMTP environment variables');
}

const transporter: Transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // useful for dev/self-signed certs
  },
});

export default transporter;
