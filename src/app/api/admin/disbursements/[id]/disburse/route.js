import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function PUT(request, { params }) {
  try {
    const { id } = await params // This 'id' is loan_application_id
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
      disbursement_remarks,
      comission_amount: custom_disbursement_commission, // Renamed to avoid confusion with overall comission_amount
      status // 'disbursed' or 'partially_disbursed'
    } = disbursementData

    // Validate required fields
    if (!disbursement_amount || !bank_name || !account_number || !ifsc_code || !transaction_reference || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get application details and sum of previously disbursed amounts
    const applicationQuery = `
      SELECT
        la.id, la.application_number, la.status, la.approved_amount,
        la.customer_id, la.connector_id, la.selected_offer_id,
        conn.commission_percentage,
        COALESCE(SUM(ld.disbursed_amount), 0) AS total_disbursed_so_far,
        la.comission_amount AS existing_total_comission_amount_on_application
      FROM loan_applications la
      JOIN connectors conn ON la.connector_id = conn.id
      LEFT JOIN loan_disbursements ld ON la.id = ld.loan_application_id
      WHERE la.id = ? AND la.status IN ('approved', 'partially_disbursed')
      GROUP BY la.id, la.application_number, la.status, la.approved_amount, la.customer_id, la.connector_id, conn.commission_percentage, la.selected_offer_id, la.comission_amount
    `

    const applicationResult = await executeQuery(applicationQuery, [id])

    if (applicationResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Application not found or not in a state ready for disbursement (must be approved or partially_disbursed)' },
        { status: 404 }
      )
    }

    const application = applicationResult[0]
    const currentDisbursementAmount = parseFloat(disbursement_amount);
    const totalApprovedAmount = parseFloat(application.approved_amount);
    const totalDisbursedSoFar = parseFloat(application.total_disbursed_so_far);

    // Validate disbursement amount
    if (currentDisbursementAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Disbursement amount must be greater than zero' },
        { status: 400 }
      )
    }
    if (totalDisbursedSoFar + currentDisbursementAmount > totalApprovedAmount) {
      return NextResponse.json(
        { success: false, message: `Total disbursed amount (${totalDisbursedSoFar + currentDisbursementAmount}) cannot exceed approved amount (${totalApprovedAmount})` },
        { status: 400 }
      )
    }

    // Determine the final status for the loan_applications table
    let newApplicationStatus = status; // This comes from the frontend initially
    const totalAmountAfterThisDisbursement = totalDisbursedSoFar + currentDisbursementAmount;

    if (newApplicationStatus === 'disbursed' && totalAmountAfterThisDisbursement < totalApprovedAmount) {
        // If user says 'disbursed' but it's not the full amount, override to partially_disbursed
        newApplicationStatus = 'partially_disbursed';
        console.warn(`User selected 'disbursed' but total amount (${totalAmountAfterThisDisbursement}) is less than approved (${totalApprovedAmount}). Setting application status to 'partially_disbursed'.`);
    } else if (newApplicationStatus === 'partially_disbursed' && totalAmountAfterThisDisbursement >= totalApprovedAmount) {
        // If user says 'partially_disbursed' but it completes or exceeds the full amount, override to disbursed
        newApplicationStatus = 'disbursed';
        console.warn(`User selected 'partially_disbursed' but total amount (${totalAmountAfterThisDisbursement}) is equal to or greater than approved (${totalApprovedAmount}). Setting application status to 'disbursed'.`);
    }

    // Calculate commission for *this specific disbursement*
    const commissionForThisDisbursement = custom_disbursement_commission
      ? parseFloat(custom_disbursement_commission)
      : (currentDisbursementAmount * parseFloat(application.commission_percentage)) / 100;

    // --- Start Transaction (highly recommended for production) ---
    // In a real application, wrap these in a database transaction
    // (e.g., using `connection.beginTransaction()`, `connection.commit()`, `connection.rollback()`)
    // to ensure atomicity. For this example, queries are sequential.

    // Step 1: Insert into loan_disbursements for this transaction
    const insertDisbursementQuery = `
      INSERT INTO loan_disbursements (
        loan_application_id,
        loan_offer_id,
        disbursed_amount,
        disbursement_date,
        reference_number,
        bank_reference,
        disbursement_method,
        connector_commission,
        commission_status,
        disbursed_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `

    await executeQuery(insertDisbursementQuery, [
      id,
      application.selected_offer_id, // Using selected_offer_id from loan_applications
      currentDisbursementAmount,
      disbursement_date,
      transaction_reference,
      bank_name, // Using bank_name for bank_reference, adjust if you have a specific field
      'bank_transfer', // Default method, adjust if UI allows selection
      commissionForThisDisbursement,
      'pending', // Commission is 'pending' for this individual disbursement until the overall application is finalized/paid
      userId
    ])


    // Step 2: Update loan_applications table
    // - Update status
    // - Update total `disbursed_amount` (accumulate)
    // - Update total `comission_amount` (accumulate) for the application
    // - If it becomes 'disbursed', set `disbursed_at` (only if it wasn't set before, or if it's the final disbursement)
    const updateApplicationQuery = `
      UPDATE loan_applications
      SET
        status = ?,
        disbursed_amount = COALESCE(disbursed_amount, 0) + ?,
        comission_amount = COALESCE(comission_amount, 0) + ?,
        disbursed_at = CASE WHEN ? = 'disbursed' THEN COALESCE(disbursed_at, NOW()) ELSE disbursed_at END
      WHERE id = ?
    `
    // Note: disbursed_at is updated only if the new status is 'disbursed' and it was previously NULL.
    // If it's `partially_disbursed`, `disbursed_at` remains NULL or its existing value.
    await executeQuery(updateApplicationQuery, [
      newApplicationStatus,
      currentDisbursementAmount,
      commissionForThisDisbursement, // Add this disbursement's commission to the total application commission
      newApplicationStatus, // For the CASE statement
      id
    ])

    // Step 3: Update or Create commission record in `commission_records` for the *overall* loan application
    // This table seems to track the final commission for the connector.
    // We update it by adding the current disbursement's commission.
    const overallCommissionStatus = (newApplicationStatus === 'disbursed' || newApplicationStatus === 'partially_disbursed') ? 'earned' : 'pending';

    const createCommissionQuery = `
      INSERT INTO commission_records (
        loan_application_id,
        connector_id,
        commission_amount,
        commission_percentage,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        commission_amount = COALESCE(commission_amount, 0) + VALUES(commission_amount), -- Accumulate commission
        status = VALUES(status)
    `

    await executeQuery(createCommissionQuery, [
      id,
      application.connector_id,
      commissionForThisDisbursement, // Add current disbursement's commission to the overall record
      application.commission_percentage,
      overallCommissionStatus
    ])


    // Step 4: Log the disbursement activity
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
      disbursed_amount: currentDisbursementAmount,
      bank_name,
      account_number: account_number.slice(-4), // Only last 4 digits for security
      transaction_reference,
      status: newApplicationStatus // Log the final status of the application
    })

    await executeQuery(logActivity, [
      userId,
      newApplicationStatus === 'disbursed' ? 'LOAN_DISBURSED_FULLY' : 'LOAN_DISBURSED_PARTIALLY',
      'loan_application',
      id,
      logData,
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    // Step 5: Update connector's total approved cases (only if moving to fully disbursed status for the first time)
    if (newApplicationStatus === 'disbursed' && application.status !== 'disbursed') {
      const updateConnectorQuery = `
        UPDATE connectors
        SET total_approved_cases = total_approved_cases + 1
        WHERE id = ?
      `
      await executeQuery(updateConnectorQuery, [application.connector_id])
    }

    return NextResponse.json({
      success: true,
      message: 'Loan disbursement processed successfully',
      data: {
        application_id: id,
        application_number: application.application_number,
        disbursed_amount: currentDisbursementAmount,
        commission_for_this_disbursement: commissionForThisDisbursement,
        transaction_reference,
        loan_application_status: newApplicationStatus
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