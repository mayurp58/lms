import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

// GET - Fetch applications for disbursement (approved) or disbursed applications
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status') || 'approved'

    const offset = (page - 1) * limit

    let whereCondition = 'WHERE la.status = ?'
    let queryParams = [status]

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM loan_applications la
      ${whereCondition}
    `
    
    const countResult = await executeQuery(countQuery, queryParams)
    const total = countResult[0].total

    // FIXED: Get applications with all necessary fields including disbursement data
    const applicationsQuery = `
      SELECT 
        la.id, 
        la.application_number, 
        la.requested_amount, 
        la.approved_amount,
        la.disbursed_amount,
        la.approved_interest_rate, 
        la.approved_tenure_months, 
        la.approved_at,
        la.disbursed_at,
        la.disbursement_details,
        la.banker_remarks, 
        la.special_conditions, 
        la.status,
        la.created_at,
        
        -- Customer details
        c.id as customer_id, 
        c.first_name, 
        c.last_name, 
        c.phone, 
        c.email,
        c.address, 
        c.city, 
        c.state, 
        c.pincode, 
        c.aadhar_number, 
        c.pan_number,
        
        -- Loan category
        lc.name as loan_category_name,
        
        -- Connector details
        conn.agent_code, 
        conn.commission_percentage,
        up.first_name as connector_first_name, 
        up.last_name as connector_last_name,
        
        -- Banker details
        bp.first_name as banker_first_name, 
        bp.last_name as banker_last_name
        
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users cu ON conn.user_id = cu.id
      JOIN user_profiles up ON cu.id = up.user_id
      LEFT JOIN users bu ON la.approved_by = bu.id
      LEFT JOIN user_profiles bp ON bu.id = bp.user_id
      ${whereCondition}
      ORDER BY ${status === 'approved' ? 'la.approved_at ASC' : 'la.disbursed_at DESC'}
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `

    //console.log('Disbursements Query:', applicationsQuery)
    //console.log('Query Params:', queryParams)

    const applications = await executeQuery(applicationsQuery, queryParams)

    //console.log('Applications result:', applications.length, 'records')
    if (applications.length > 0) {
      /*console.log('First application sample:', {
        id: applications[0].id, 
        approved_amount: applications[0].approved_amount,
        disbursed_amount: applications[0].disbursed_amount,
        disbursed_at: applications[0].disbursed_at,
        commission_percentage: applications[0].commission_percentage
      })*/
    }

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Get disbursement applications error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch applications: ' + error.message },
      { status: 500 }
    )
  }
}
