import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

// GET - Fetch documents for a customer or loan application
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const loanApplicationId = searchParams.get('loanApplicationId')

    if (!customerId && !loanApplicationId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID or Loan Application ID is required' },
        { status: 400 }
      )
    }

    let query = `
      SELECT 
        cd.id, cd.file_name, cd.file_path, cd.file_size_kb,
        cd.verification_status, cd.operator_remarks, cd.uploaded_at, cd.verified_at,
        dt.name as document_type_name, dt.description as document_type_description,
        dt.is_required, la.application_number, c.first_name, c.last_name
      FROM customer_documents cd
      JOIN document_types dt ON cd.document_type_id = dt.id
      JOIN loan_applications la ON cd.loan_application_id = la.id
      JOIN customers c ON la.customer_id = c.id
    `

    let queryParams = []

    if (customerId) {
      query += ' WHERE c.id = ?'
      queryParams.push(customerId)
    } else if (loanApplicationId) {
      query += ' WHERE la.id = ?'
      queryParams.push(loanApplicationId)
    }

    // Role-based access control
    if (userRole === 'connector') {
      const connectorResult = await executeQuery(
        'SELECT id FROM connectors WHERE user_id = ?',
        [userId]
      )
      
      if (connectorResult.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Connector not found' },
          { status: 404 }
        )
      }

      query += ' AND c.connector_id = ?'
      queryParams.push(connectorResult[0].id)
    }

    query += ' ORDER BY cd.uploaded_at DESC'

    const documents = await executeQuery(query, queryParams)

    return NextResponse.json({
      success: true,
      data: documents
    })

  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch documents: ' + error.message },
      { status: 500 }
    )
  }
}
