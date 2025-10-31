import nodemailer from 'nodemailer'

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Email templates
const templates = {
  applicationSubmitted: (data) => ({
    subject: `Loan Application Submitted - ${data.applicationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Loan Application Submitted Successfully</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your loan application has been submitted successfully.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Application Details:</h3>
          <p><strong>Application Number:</strong> ${data.applicationNumber}</p>
          <p><strong>Loan Amount:</strong> ₹${data.amount.toLocaleString()}</p>
          <p><strong>Loan Type:</strong> ${data.loanCategory}</p>
          <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>Our team will review your application and get back to you within 2-3 business days.</p>
        <p>You can track your application status anytime.</p>
        
        <p>Best regards,<br>Loan Management Team</p>
      </div>
    `
  }),

  documentVerified: (data) => ({
    subject: `Documents Verified - ${data.applicationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Documents Verified Successfully</h2>
        <p>Dear ${data.customerName},</p>
        <p>Great news! All your documents have been verified and your application is now under banker review.</p>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Application Number:</strong> ${data.applicationNumber}</p>
          <p><strong>Status:</strong> Under Banker Review</p>
          <p><strong>Next Step:</strong> Final approval decision</p>
        </div>
        
        <p>You will receive another update once the banker makes a decision on your application.</p>
        
        <p>Best regards,<br>Loan Management Team</p>
      </div>
    `
  }),

  loanApproved: (data) => ({
    subject: `🎉 Loan Approved - ${data.applicationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Congratulations! Your Loan is Approved</h2>
        <p>Dear ${data.customerName},</p>
        <p>We're excited to inform you that your loan application has been approved!</p>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Approved Loan Details:</h3>
          <p><strong>Application Number:</strong> ${data.applicationNumber}</p>
          <p><strong>Approved Amount:</strong> ₹${data.approvedAmount.toLocaleString()}</p>
          <p><strong>Interest Rate:</strong> ${data.interestRate}% per annum</p>
          <p><strong>Tenure:</strong> ${data.tenure} months</p>
          <p><strong>Monthly EMI:</strong> ₹${data.monthlyEMI.toLocaleString()}</p>
        </div>
        
        ${data.conditions ? `<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4>Special Conditions:</h4>
          <p>${data.conditions}</p>
        </div>` : ''}
        
        <p>Your loan will be disbursed within 2-3 business days. You will receive the disbursement confirmation shortly.</p>
        
        <p>Best regards,<br>Loan Management Team</p>
      </div>
    `
  }),

  loanRejected: (data) => ({
    subject: `Loan Application Update - ${data.applicationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Loan Application Status Update</h2>
        <p>Dear ${data.customerName},</p>
        <p>Thank you for your interest in our loan services. After careful review, we regret to inform you that we cannot approve your loan application at this time.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Application Number:</strong> ${data.applicationNumber}</p>
          <p><strong>Reason:</strong> ${data.reason}</p>
        </div>
        
        <p>This decision is based on our current lending criteria. You may reapply after addressing the concerns mentioned above.</p>
        <p>If you have any questions, please feel free to contact our customer service team.</p>
        
        <p>Best regards,<br>Loan Management Team</p>
      </div>
    `
  }),

  loanDisbursed: (data) => ({
    subject: `💰 Loan Disbursed - ${data.applicationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Loan Disbursed Successfully!</h2>
        <p>Dear ${data.customerName},</p>
        <p>Great news! Your loan amount has been successfully disbursed to your account.</p>
        
        <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Disbursement Details:</h3>
          <p><strong>Application Number:</strong> ${data.applicationNumber}</p>
          <p><strong>Disbursed Amount:</strong> ₹${data.disbursedAmount.toLocaleString()}</p>
          <p><strong>Account Number:</strong> ${data.accountNumber}</p>
          <p><strong>Transaction Reference:</strong> ${data.transactionRef}</p>
          <p><strong>Disbursement Date:</strong> ${new Date(data.disbursementDate).toLocaleDateString()}</p>
        </div>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4>Important Reminders:</h4>
          <p>• First EMI Date: ${new Date(data.firstEMIDate).toLocaleDateString()}</p>
          <p>• Monthly EMI Amount: ₹${data.monthlyEMI.toLocaleString()}</p>
          <p>• Please ensure sufficient balance for EMI auto-debit</p>
        </div>
        
        <p>Thank you for choosing our services. We wish you all the best!</p>
        
        <p>Best regards,<br>Loan Management Team</p>
      </div>
    `
  }),

  commissionPaid: (data) => ({
    subject: `Commission Paid - ${data.paymentReference}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Commission Payment Processed</h2>
        <p>Dear ${data.connectorName},</p>
        <p>Your commission payment has been processed successfully.</p>
        
        <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Payment Details:</h3>
          <p><strong>Payment Reference:</strong> ${data.paymentReference}</p>
          <p><strong>Commission Amount:</strong> ₹${data.commissionAmount.toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p><strong>Payment Date:</strong> ${new Date(data.paymentDate).toLocaleDateString()}</p>
          <p><strong>Applications Covered:</strong> ${data.applicationCount}</p>
        </div>
        
        <p>Thank you for your continued partnership with us.</p>
        
        <p>Best regards,<br>Loan Management Team</p>
      </div>
    `
  })
}

// Send email function
export async function sendEmail(templateName, recipientEmail, data) {
  try {
    if (!templates[templateName]) {
      throw new Error(`Email template '${templateName}' not found`)
    }

    const template = templates[templateName](data)
    
    const mailOptions = {
      from: `"Loan Management System" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
    }

    const info = await transporter.sendMail(mailOptions)
    //console.log('✅ Email sent:', { to: recipientEmail, template: templateName, messageId: info.messageId })
    
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return { success: false, error: error.message }
  }
}

// Batch email sending
export async function sendBulkEmails(templateName, recipients, data) {
  const results = []
  
  for (const recipient of recipients) {
    const result = await sendEmail(templateName, recipient.email, {
      ...data,
      ...recipient
    })
    results.push({ email: recipient.email, ...result })
  }
  
  return results
}
