// SMS service using Twilio or any SMS provider
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// SMS templates
const smsTemplates = {
  applicationSubmitted: (data) => 
    `Hello ${data.customerName}, your loan application ${data.applicationNumber} for ₹${data.amount.toLocaleString()} has been submitted successfully. You will receive updates on your registered email.`,
    
  documentVerified: (data) => 
    `Great news! Your documents for application ${data.applicationNumber} have been verified. Your application is now under banker review.`,
    
  loanApproved: (data) => 
    `🎉 Congratulations! Your loan application ${data.applicationNumber} has been approved for ₹${data.approvedAmount.toLocaleString()}. Disbursement will happen within 2-3 business days.`,
    
  loanRejected: (data) => 
    `Your loan application ${data.applicationNumber} could not be approved at this time. Please check your email for details. You may reapply after addressing the concerns.`,
    
  loanDisbursed: (data) => 
    `Your loan amount ₹${data.disbursedAmount.toLocaleString()} has been disbursed to your account. Transaction Ref: ${data.transactionRef}. First EMI: ${new Date(data.firstEMIDate).toLocaleDateString()}`,
    
  commissionPaid: (data) => 
    `Hello ${data.connectorName}, your commission payment of ₹${data.commissionAmount.toLocaleString()} has been processed. Payment Ref: ${data.paymentReference}`
}

export async function sendSMS(templateName, phoneNumber, data) {
  try {
    if (!smsTemplates[templateName]) {
      throw new Error(`SMS template '${templateName}' not found`)
    }

    // Skip if no Twilio credentials
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('📱 SMS skipped - No Twilio credentials configured')
      return { success: true, skipped: true }
    }

    const message = smsTemplates[templateName](data)
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    })

    console.log('✅ SMS sent:', { to: phoneNumber, template: templateName, sid: result.sid })
    
    return { success: true, sid: result.sid }
  } catch (error) {
    console.error('❌ SMS sending failed:', error)
    return { success: false, error: error.message }
  }
}

export async function sendBulkSMS(templateName, recipients, data) {
  const results = []
  
  for (const recipient of recipients) {
    const result = await sendSMS(templateName, recipient.phone, {
      ...data,
      ...recipient
    })
    results.push({ phone: recipient.phone, ...result })
  }
  
  return results
}
