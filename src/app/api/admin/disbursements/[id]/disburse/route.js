import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const disbursementData = await request.json()
    const {
      disbursement_amount,
      disbursement_date,
      bank_name,
      account_number,
      ifsc_code,
      transaction_reference,
      disbursement_remarks
    } = disbursementData

    // Validate required fields
    if (!disbursement_amount || !bank_name || !account_number || !ifsc_code || !transaction_reference) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get application details first
    const applicationQuery = `
      SELECT 
        la.id, la.application_number, la.status, la.approved_amount,
        la.customer_id, la.connector_id,
        conn.commission_percentage
      FROM loan_applications la
      JOIN connectors conn ON la.connector_id = conn.id
      WHERE la.id = ? AND la.status = 'approved'
    `

    const applicationResult = await executeQuery(applicationQuery, [id])

    if (applicationResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Application not found or not approved for disbursement' },
        { status: 404 }
      )
    }

    const application = applicationResult[0]

    // Validate disbursement amount
    if (parseFloat(disbursement_amount) > parseFloat(application.approved_amount)) {
      return NextResponse.json(
        { success: false, message: 'Disbursement amount cannot exceed approved amount' },
        { status: 400 }
      )
    }

    // Prepare disbursement details JSON
    const disbursementDetails = JSON.stringify({
      bank_name,
      account_number,
      ifsc_code,
      transaction_reference,
      disbursement_date,
      remarks: disbursement_remarks || null,
      disbursed_by: userId,
      disbursed_at: new Date().toISOString()
    })

    // Step 1: Update loan application to disbursed status
    const updateApplicationQuery = `
      UPDATE loan_applications 
      SET 
        status = 'disbursed',
        disbursed_amount = ?,
        disbursed_at = NOW(),
        disbursement_details = ?
      WHERE id = ?
    `

    await executeQuery(updateApplicationQuery, [
      disbursement_amount,
      disbursementDetails,
      id
    ])

    // Step 2: Calculate and create commission record
    const commissionAmount = (parseFloat(disbursement_amount) * parseFloat(application.commission_percentage)) / 100

    const createCommissionQuery = `
      INSERT INTO commission_records (
        loan_application_id,
        connector_id,
        commission_amount,
        commission_percentage,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, 'earned', NOW())
      ON DUPLICATE KEY UPDATE
        commission_amount = VALUES(commission_amount),
        status = 'earned'
    `

    await executeQuery(createCommissionQuery, [
      id,
      application.connector_id,
      commissionAmount.toFixed(2),
      application.commission_percentage
    ])

    // Step 3: Log the disbursement activity
    const logActivity = `
      INSERT INTO system_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values,
        ip_address,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `

    const logData = JSON.stringify({
      application_number: application.application_number,
      disbursed_amount: disbursement_amount,
      bank_name,
      account_number: account_number.slice(-4), // Only last 4 digits for security
      transaction_reference
    })

    await executeQuery(logActivity, [
      userId,
      'LOAN_DISBURSED',
      'loan_application',
      id,
      logData,
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    // Step 4: Update connector's total approved cases
    const updateConnectorQuery = `
      UPDATE connectors 
      SET total_approved_cases = total_approved_cases + 1
      WHERE id = ?
    `

    await executeQuery(updateConnectorQuery, [application.connector_id])

    return NextResponse.json({
      success: true,
      message: 'Loan disbursed successfully',
      data: {
        application_id: id,
        application_number: application.application_number,
        disbursed_amount: disbursement_amount,
        commission_amount: commissionAmount.toFixed(2),
        transaction_reference
      }
    })

  } catch (error) {
    console.error('Disbursement error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to disburse loan: ' + error.message },
      { status: 500 }
    )
  }
}
