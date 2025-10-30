import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request, { params }) {
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

    // Get application details with all related information
    const applicationQuery = `
      SELECT 
        la.id, la.application_number, la.requested_amount, la.approved_amount, 
        la.disbursed_amount, la.status, la.created_at, la.approved_at, 
        la.disbursed_at, la.approved_interest_rate, la.approved_tenure_months,
        la.banker_remarks, la.special_conditions, la.disbursement_details,
        
        -- Customer details
        c.first_name, c.last_name, c.phone, c.email, c.address, c.city, 
        c.state, c.pincode, c.aadhar_number, c.pan_number,
        
        -- Loan category
        lc.name as loan_category_name,
        
        -- Connector details
        conn.agent_code, conn.commission_percentage,
        cup.first_name as connector_first_name, cup.last_name as connector_last_name,
        
        -- Banker details (who approved)
        bup.first_name as banker_first_name, bup.last_name as banker_last_name,
        b.employee_id as banker_employee_id, b.designation as banker_designation
        
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users cu ON conn.user_id = cu.id
      JOIN user_profiles cup ON cu.id = cup.user_id
      LEFT JOIN users bu ON la.approved_by = bu.id
      LEFT JOIN user_profiles bup ON bu.id = bup.user_id
      LEFT JOIN bankers b ON bu.id = b.user_id
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

    // Get customer documents
    const documentsQuery = `
      SELECT 
        cd.id, cd.document_type_id, cd.file_path, cd.verification_status,
        cd.verified_at, cd.operator_remarks,
        up.first_name as verified_by_name, up.last_name as verified_by_last_name
      FROM customer_documents cd
      LEFT JOIN users u ON cd.verified_by = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE cd.loan_application_id = ?
      ORDER BY cd.uploaded_at DESC
    `

    const documents = await executeQuery(documentsQuery, [id])

    // Get commission record if exists
    const commissionQuery = `
      SELECT cr.*, cr.status as commission_status
      FROM commission_records cr
      WHERE cr.loan_application_id = ?
    `

    const commissionResult = await executeQuery(commissionQuery, [id])
    const commission = commissionResult.length > 0 ? commissionResult[0] : null

    return NextResponse.json({
      success: true,
      data: {
        application,
        documents,
        commission
      }
    })

  } catch (error) {
    console.error('Get application error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
