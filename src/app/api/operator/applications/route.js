import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

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
    const limit = parseInt(searchParams.get('limit')) || 20
    const status = searchParams.get('status') || 'all'
    const priority = searchParams.get('priority')

    // Build WHERE conditions
    let whereConditions = []
    let queryParams = []

    if (status && status !== 'all') {
      whereConditions.push('la.status = ?')
      queryParams.push(status)
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

    // Get applications with document counts - FIXED query
    const offset = (page - 1) * limit
    const applicationsQuery = `
      SELECT 
        la.id,
        la.application_number,
        la.requested_amount,
        la.status,
        la.created_at,
        
        -- Customer details
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone as customer_phone,
        c.email as customer_email,
        
        -- Loan category
        lc.name as loan_category_name,
        
        -- Connector details
        conn.agent_code,
        cup.first_name as connector_first_name,
        cup.last_name as connector_last_name,
        
        -- Document counts (simplified)
        0 as document_count,
        0 as verified_documents,
        0 as pending_documents
        
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users cu ON conn.user_id = cu.id
      JOIN user_profiles cup ON cu.id = cup.user_id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN la.status = 'submitted' THEN 1
          WHEN la.status = 'under_verification' THEN 2
          ELSE 3
        END,
        la.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    console.log('Operator Applications Query:', applicationsQuery)
    //console.log('Query Params:', queryParams)

    const applications = await executeQuery(applicationsQuery, queryParams)

    // Get total count - SIMPLIFIED
    const countQuery = `
      SELECT COUNT(*) as total
      FROM loan_applications la
      ${whereClause}
    `

    const countResult = await executeQuery(countQuery, queryParams)
    const total = countResult[0]?.total || 0

    // Get statistics - SIMPLIFIED
    const statsQuery = `
      SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'under_verification' THEN 1 ELSE 0 END) as under_verification,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN DATE(updated_at) = CURRENT_DATE AND status = 'verified' THEN 1 ELSE 0 END) as verified_today,
        SUM(CASE WHEN status IN ('verified', 'approved', 'disbursed') THEN 1 ELSE 0 END) as total_processed
      FROM loan_applications
    `

    const statsResult = await executeQuery(statsQuery, [])
    const stats = statsResult[0] || {
      total_applications: 0,
      submitted: 0,
      under_verification: 0,
      verified: 0,
      rejected: 0,
      verified_today: 0,
      total_processed: 0
    }

    return NextResponse.json({
      success: true,
      data: {
        applications,
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Operator applications error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch applications: ' + error.message },
      { status: 500 }
    )
  }
}
