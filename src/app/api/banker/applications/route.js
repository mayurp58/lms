import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

// GET - Fetch applications for banker review
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'banker') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status') || 'verified'
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // Get banker info to check approval limits
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

    const maxApprovalLimit = bankerResult[0].max_approval_limit

    let whereConditions = ['la.status = ?']
    let queryParams = [status]

    // Only show applications within banker's approval limit
    if (maxApprovalLimit > 0) {
      whereConditions.push('la.requested_amount <= ?')
      queryParams.push(maxApprovalLimit)
    }

    if (search && search.trim() !== '') {
      whereConditions.push('(la.application_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)')
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ')

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      ${whereClause}
    `
    
    const countResult = await executeQuery(countQuery, queryParams)
    const total = countResult[0].total

    // Get applications with pagination
    const applicationsQuery = `
      SELECT 
        la.id, la.application_number, la.requested_amount, la.purpose,
        la.monthly_income, la.employment_type, la.company_name, la.work_experience_years,
        la.existing_loans_amount, la.status, la.cibil_score, la.created_at,
        c.id as customer_id, c.first_name, c.last_name, c.phone, c.email,
        c.date_of_birth, c.gender, c.marital_status, c.address, c.city, c.state, c.pincode,
        lc.name as loan_category_name, lc.interest_rate_min, lc.interest_rate_max, lc.max_tenure_months,
        conn.agent_code,
        up.first_name as connector_first_name, up.last_name as connector_last_name,
        -- Count verified documents
        (SELECT COUNT(*) FROM customer_documents cd WHERE cd.loan_application_id = la.id AND cd.verification_status = 'verified') as verified_documents,
        (SELECT COUNT(*) FROM customer_documents cd JOIN document_types dt ON cd.document_type_id = dt.id WHERE cd.loan_application_id = la.id AND dt.is_required = 1) as required_documents
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users u ON conn.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      ${whereClause}
      ORDER BY la.created_at ASC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `

    const applications = await executeQuery(applicationsQuery, queryParams)

    return NextResponse.json({
      success: true,
      data: {
        applications,
        bankerInfo: {
          maxApprovalLimit
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Get applications for banker error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch applications: ' + error.message },
      { status: 500 }
    )
  }
}
