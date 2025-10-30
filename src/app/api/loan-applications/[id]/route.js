import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

// GET - Get single loan application
export async function GET(request, { params }) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const { id } = await params

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    let applicationQuery = `
      SELECT 
        la.*,
        c.first_name, c.last_name, c.phone, c.email, c.address,
        c.city, c.state, c.pincode, c.aadhar_number, c.pan_number,
        c.date_of_birth, c.gender, c.marital_status,
        lc.name as loan_category_name, lc.min_amount, lc.max_amount,
        lc.interest_rate_min, lc.interest_rate_max, lc.max_tenure_months,
        conn.agent_code,
        up.first_name as connector_first_name,
        up.last_name as connector_last_name
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users u ON conn.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      WHERE la.id = ?
    `

    let queryParams = [id]

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

      applicationQuery += ' AND la.connector_id = ?'
      queryParams.push(connectorResult[0].id)
    }

    const applications = await executeQuery(applicationQuery, queryParams)

    if (applications.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Loan application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: applications[0]
    })

  } catch (error) {
    console.error('Get loan application error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch loan application: ' + error.message },
      { status: 500 }
    )
  }
}
