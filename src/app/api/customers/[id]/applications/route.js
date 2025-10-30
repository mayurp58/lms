import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request, { params }) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const { id } = await params // Customer ID

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
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

      // Verify customer belongs to this connector
      const customerCheck = await executeQuery(
        'SELECT id FROM customers WHERE id = ? AND connector_id = ?',
        [id, connectorResult[0].id]
      )

      if (customerCheck.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Customer not found or access denied' },
          { status: 403 }
        )
      }
    }

    // Get loan applications for this customer
    const applications = await executeQuery(
      `SELECT 
        la.id, la.application_number, la.requested_amount, la.status, la.created_at,
        lc.name as loan_category_name
       FROM loan_applications la
       JOIN loan_categories lc ON la.loan_category_id = lc.id
       WHERE la.customer_id = ?
       ORDER BY la.created_at DESC`,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: applications
    })

  } catch (error) {
    console.error('Get customer applications error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch applications: ' + error.message },
      { status: 500 }
    )
  }
}
