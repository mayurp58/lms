import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request, { params }) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const { id } = await params

    if (!userId || userRole !== 'banker') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get banker approval limit
    const bankerResult = await executeQuery(
      'SELECT max_approval_limit FROM bankers WHERE user_id = ?',
      [userId]
    )

    if (bankerResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Banker not found' },
        { status: 404 }
      )
    }

    // Get application details
    const applicationQuery = `
      SELECT 
        la.*,
        c.first_name, c.last_name, c.phone, c.email, c.address,
        c.city, c.state, c.pincode, c.aadhar_number, c.pan_number,
        c.date_of_birth, c.gender, c.marital_status,
        lc.name as loan_category_name, lc.min_amount, lc.max_amount,
        lc.interest_rate_min, lc.interest_rate_max, lc.max_tenure_months,
        conn.agent_code, conn.commission_percentage,
        up.first_name as connector_first_name,
        up.last_name as connector_last_name
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users u ON conn.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      WHERE la.id = ? AND la.requested_amount <= ?
    `

    const applications = await executeQuery(applicationQuery, [id, bankerResult[0].max_approval_limit])

    if (applications.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Application not found or exceeds approval limit' },
        { status: 404 }
      )
    }

    // Get documents for this application
    const documentsQuery = `
      SELECT 
        cd.id, cd.file_name, cd.file_path, cd.verification_status, cd.operator_remarks,
        dt.name as document_type_name, dt.is_required
      FROM customer_documents cd
      JOIN document_types dt ON cd.document_type_id = dt.id
      WHERE cd.loan_application_id = ?
      ORDER BY dt.is_required DESC, dt.name ASC
    `

    const documents = await executeQuery(documentsQuery, [id])

    return NextResponse.json({
      success: true,
      data: {
        application: applications[0],
        documents,
        bankerInfo: {
          maxApprovalLimit: bankerResult[0].max_approval_limit
        }
      }
    })

  } catch (error) {
    console.error('Get application for banker error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch application: ' + error.message },
      { status: 500 }
    )
  }
}
