import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/notifications/email'
import { sendSMS } from '@/lib/notifications/sms'
import { executeQuery } from '@/lib/db/mysql'

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      type, // 'email', 'sms', 'both'
      template,
      recipients, // Array of {email, phone, ...data}
      data // Common data for all recipients
    } = body

    if (!template || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Template and recipients are required' },
        { status: 400 }
      )
    }

    const results = {
      email: [],
      sms: [],
      total: recipients.length
    }

    for (const recipient of recipients) {
      const notificationData = { ...data, ...recipient }

      // Send email
      if (type === 'email' || type === 'both') {
        if (recipient.email) {
          const emailResult = await sendEmail(template, recipient.email, notificationData)
          results.email.push({ 
            email: recipient.email, 
            success: emailResult.success,
            error: emailResult.error 
          })
        }
      }

      // Send SMS
      if (type === 'sms' || type === 'both') {
        if (recipient.phone) {
          const smsResult = await sendSMS(template, recipient.phone, notificationData)
          results.sms.push({ 
            phone: recipient.phone, 
            success: smsResult.success,
            error: smsResult.error 
          })
        }
      }
    }

    // Log notification activity
    await executeQuery(
      'INSERT INTO system_logs (user_id, action, entity_type, entity_id, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [
        null, // System action
        'NOTIFICATION_SENT',
        'notification',
        null,
        JSON.stringify({
          template,
          type,
          recipientCount: recipients.length,
          emailsSent: results.email.filter(r => r.success).length,
          smsSent: results.sms.filter(r => r.success).length
        }),
        request.headers.get('x-forwarded-for') || 'system'
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Notifications processed',
      results
    })

  } catch (error) {
    console.error('Notification API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send notifications: ' + error.message },
      { status: 500 }
    )
  }
}
