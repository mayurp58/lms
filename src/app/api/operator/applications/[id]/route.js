import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'operator') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get application details with all related information
    const applicationQuery = `
      SELECT 
        la.id, la.application_number, la.requested_amount, la.approved_amount, 
        la.disbursed_amount, la.status, la.marketplace_status, 
        la.created_at, la.updated_at, la.approved_interest_rate, 
        la.approved_tenure_months, la.special_instructions, la.selected_offer_id,
        la.banker_remarks,
        -- Customer details
        c.id as customer_id,
        c.first_name as customer_first_name, 
        c.last_name as customer_last_name, 
        c.phone as customer_phone, 
        c.email as customer_email,
        c.address as customer_address, 
        c.city as customer_city, 
        c.state as customer_state, 
        c.pincode as customer_pincode, 
        c.aadhar_number as customer_aadhar_number, 
        c.pan_number as customer_pan_number,
        
        -- Loan category
        lc.name as loan_category_name,
        
        -- Connector details
        conn.agent_code, conn.commission_percentage,
        cup.first_name as connector_first_name, 
        cup.last_name as connector_last_name
        
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      LEFT JOIN connectors conn ON la.connector_id = conn.id
      LEFT JOIN users cu ON conn.user_id = cu.id
      LEFT JOIN user_profiles cup ON cu.id = cup.user_id
      WHERE la.id = ?
    `

    const applicationResult = await executeQuery(applicationQuery, [id])

    if (applicationResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    const application = applicationResult[0]

    // Get customer documents for this application
    const documentsQuery = `
      SELECT 
        cd.id, 
        dt.name as document_name, 
        cd.file_path, 
        cd.verification_status,
        cd.verified_at, 
        cd.rejection_reason,
        cd.uploaded_at,
        up.first_name as verified_by_name, 
        up.last_name as verified_by_last_name
      FROM customer_documents cd
      LEFT JOIN document_types dt ON dt.id=cd.document_type_id
      LEFT JOIN users u ON cd.verified_by = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE cd.loan_application_id = ?
      ORDER BY cd.uploaded_at DESC
    `

    const documents = await executeQuery(documentsQuery, [id])

    // Get loan offers for this application
    const offersQuery = `
      SELECT 
        lo.id,
        lo.offered_amount,
        lo.interest_rate,
        lo.tenure_months,
        lo.processing_fee,
        lo.monthly_emi,
        lo.status,
        lo.valid_until,
        lo.terms_conditions,
        lo.remarks,
        lo.created_at,
        b.name as bank_name,
        b.code as bank_code,
        up.first_name as banker_first_name,
        up.last_name as banker_last_name
      FROM loan_offers lo
      JOIN banks b ON lo.bank_id = b.id
      JOIN users u ON lo.banker_user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      WHERE lo.loan_application_id = ? 
      AND lo.status IN ('active', 'selected')
      ORDER BY lo.created_at DESC
    `

    const offers = await executeQuery(offersQuery, [id])

    // Get system logs for this application
    const logsQuery = `
      SELECT 
        sl.action, 
        sl.created_at, 
        sl.new_values,
        up.first_name, 
        up.last_name,
        u.role
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE sl.entity_type = 'loan_application' 
      AND sl.entity_id = ?
      ORDER BY sl.created_at DESC
      LIMIT 20
    `

    const logs = await executeQuery(logsQuery, [id])

    // Add this query after getting the application details
    const distributionsQuery = `
    SELECT 
      ad.id,
      ad.status,
      ad.sent_at,
      ad.viewed_at,
      ad.response_due_date,
      ad.notes,
      b.id as bank_id,
      b.name as bank_name,
      b.code as bank_code,
      up.user_id as banker_user_id,
      up.first_name as banker_name,
      up.last_name as banker_last_name,
      bk.designation as banker_designation,
      bk.department as banker_department,
      bk.branch as branch_name,
      bk.city as branch_city,
      bk.employee_id as banker_employee_id,
      -- Optional: Include loan offer info if exists
      lo.id as offer_id,
      lo.offered_amount,
      lo.interest_rate,
      lo.status as offer_status
    FROM application_distributions ad
    JOIN banks b ON ad.bank_id = b.id
    -- Direct join to bankers table using banker_user_id
    JOIN bankers bk ON ad.banker_user_id = bk.user_id 
    -- Join to users table for user info
    JOIN users u ON bk.user_id = u.id
    -- Join to user_profiles for name info
    JOIN user_profiles up ON u.id = up.user_id
    -- Optional: Left join to loan_offers to show offers if they exist
    LEFT JOIN loan_offers lo ON ad.loan_application_id = lo.loan_application_id 
      AND ad.bank_id = lo.bank_id 
      AND lo.banker_user_id = ad.banker_user_id
      AND lo.status = 'active'
    WHERE ad.loan_application_id = ?
    ORDER BY ad.sent_at DESC
  `
  

const distributions = await executeQuery(distributionsQuery, [id])

// Update the return statement to include distributions
return NextResponse.json({
success: true,
data: {
  application,
  documents,
  offers,
  distributions, // Add this line
  logs
}
})


  } catch (error) {
    console.error('Get operator application error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch application: ' + error.message },
      { status: 500 }
    )
  }
}
