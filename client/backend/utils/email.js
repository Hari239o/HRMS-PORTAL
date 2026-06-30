const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html, attachments = [], options = {}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your_email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your_app_password'
      }
    });

    const mailOptions = {
      from: options.from || `"Geonixa EMS" <${process.env.EMAIL_USER || 'your_email@gmail.com'}>`,
      replyTo: options.replyTo,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Email delivery failed to ${to}:`, error.message);
    return false;
  }
};

module.exports = { sendEmail };
