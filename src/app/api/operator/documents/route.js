import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

// GET - Fetch documents for verification
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'operator') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status') || 'pending'
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    let whereConditions = ['cd.verification_status = ?']
    let queryParams = [status]

    if (search && search.trim() !== '') {
      whereConditions.push('(la.application_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)')
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ')

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM customer_documents cd
      JOIN loan_applications la ON cd.loan_application_id = la.id
      JOIN customers c ON la.customer_id = c.id
      ${whereClause}
    `
    
    const countResult = await executeQuery(countQuery, queryParams)
    const total = countResult[0].total

    // Get documents with pagination
    const documentsQuery = `
      SELECT 
        cd.id, cd.file_name, cd.file_path, cd.file_size_kb,
        cd.verification_status, cd.operator_remarks, cd.uploaded_at,
        dt.name as document_type_name, dt.description as document_type_description,
        dt.is_required,
        la.id as loan_application_id, la.application_number, la.requested_amount,
        lc.name as loan_category_name,
        c.id as customer_id, c.first_name, c.last_name, c.phone,
        conn.agent_code,
        up.first_name as connector_first_name, up.last_name as connector_last_name
      FROM customer_documents cd
      JOIN document_types dt ON cd.document_type_id = dt.id
      JOIN loan_applications la ON cd.loan_application_id = la.id
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users u ON conn.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      ${whereClause}
      ORDER BY cd.uploaded_at ASC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `

    const documents = await executeQuery(documentsQuery, queryParams)

    return NextResponse.json({
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Get documents for verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch documents: ' + error.message },
      { status: 500 }
    )
  }
}
