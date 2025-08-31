import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';

// dotenv.config();

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address(es)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email content in HTML format
 * @param {string} [options.from] - Sender email address (defaults to env variable)
 * @returns {Promise} - Nodemailer response
 */
export const sendEmail = async ({ to, subject, html, from = process.env.EMAIL_FROM }) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Send email
    const info = await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html
    });

    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
