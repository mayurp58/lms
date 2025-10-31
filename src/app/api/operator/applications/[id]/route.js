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
        la.disbursed_amount, la.status, la.created_at, la.updated_at,
        la.approved_interest_rate, la.approved_tenure_months,
        
        
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
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users cu ON conn.user_id = cu.id
      JOIN user_profiles cup ON cu.id = cup.user_id
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
        cd.document_type_id, 
        cd.file_path, 
        cd.verification_status,
        cd.verified_at,
        up.first_name as verified_by_name, 
        up.last_name as verified_by_last_name
      FROM customer_documents cd
      LEFT JOIN users u ON cd.verified_by = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE cd.loan_application_id = ?
    `

    const documents = await executeQuery(documentsQuery, [id])

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

    return NextResponse.json({
      success: true,
      data: {
        application,
        documents,
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
