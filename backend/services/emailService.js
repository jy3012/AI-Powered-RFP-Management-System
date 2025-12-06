const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendRfpEmail(vendor, rfp) {
  const html = `
    <p>Hi ${vendor.name},</p>
    <p>Please find the RFP below:</p>
    <pre>${JSON.stringify(rfp.requirements, null, 2)}</pre>
    <p>Please reply with your proposal (costs, delivery days, warranty, itemized breakdown).</p>
    <p><strong>RFP ID: ${rfp._id}</strong></p>
    <p>Regards.</p>
  `;
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: vendor.email,
    subject: `RFP: ${rfp.title} [ID: ${rfp._id}]`,
    html
  });
  return info;
}

module.exports = { sendRfpEmail };
