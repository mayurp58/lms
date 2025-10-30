import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request, { params }) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const { id } = await params

    if (!userId || userRole !== 'operator') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get single document with full details
    const documentQuery = `
      SELECT 
        cd.id, cd.file_name, cd.file_path, cd.file_size_kb,
        cd.verification_status, cd.operator_remarks, cd.uploaded_at, cd.verified_at,
        dt.name as document_type_name, dt.description as document_type_description,
        dt.is_required,
        la.id as loan_application_id, la.application_number, la.requested_amount, la.status as application_status,
        lc.name as loan_category_name,
        c.id as customer_id, c.first_name, c.last_name, c.phone, c.email,
        conn.agent_code,
        up.first_name as connector_first_name, up.last_name as connector_last_name,
        verified_user.first_name as verified_by_first_name, verified_user.last_name as verified_by_last_name
      FROM customer_documents cd
      JOIN document_types dt ON cd.document_type_id = dt.id
      JOIN loan_applications la ON cd.loan_application_id = la.id
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users u ON conn.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN users verified_user_table ON cd.verified_by = verified_user_table.id
      LEFT JOIN user_profiles verified_user ON verified_user_table.id = verified_user.user_id
      WHERE cd.id = ?
    `

    const documents = await executeQuery(documentQuery, [id])

    if (documents.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: documents[0]
    })

  } catch (error) {
    console.error('Get single document error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch document: ' + error.message },
      { status: 500 }
    )
  }
}
