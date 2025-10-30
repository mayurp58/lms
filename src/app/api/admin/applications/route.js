import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

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
    const limit = parseInt(searchParams.get('limit')) || 20
    const status = searchParams.get('status')
    const loanCategory = searchParams.get('loan_category')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const search = searchParams.get('search')

    // Build WHERE conditions step by step
    let whereConditions = []
    let queryParams = []

    if (status && status !== 'all') {
      whereConditions.push('la.status = ?')
      queryParams.push(status)
    }

    if (loanCategory && loanCategory !== 'all') {
      whereConditions.push('la.loan_category_id = ?')
      queryParams.push(loanCategory)
    }

    if (startDate && endDate) {
      whereConditions.push('DATE(la.created_at) BETWEEN ? AND ?')
      queryParams.push(startDate, endDate)
    }

    if (search && search.trim()) {
      // Simplified search query
      whereConditions.push('(la.application_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ?)')
      const searchPattern = `%${search.trim()}%`
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern)
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

    // Get applications with pagination - FIXED query
    const offset = (page - 1) * limit
    
    const applicationsQuery = `
      SELECT 
        la.id, 
        la.application_number, 
        la.requested_amount, 
        la.approved_amount,
        la.disbursed_amount, 
        la.status, 
        la.created_at, 
        la.approved_at, 
        la.disbursed_at,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone as customer_phone,
        c.email as customer_email,
        lc.name as loan_category_name,
        conn.agent_code,
        cup.first_name as connector_first_name,
        cup.last_name as connector_last_name
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      JOIN connectors conn ON la.connector_id = conn.id
      JOIN users cu ON conn.user_id = cu.id
      JOIN user_profiles cup ON cu.id = cup.user_id
      ${whereClause}
      ORDER BY la.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    console.log('Applications Query:', applicationsQuery)
    console.log('Query Params:', queryParams)

    const applications = await executeQuery(applicationsQuery, queryParams)

    // Get total count for pagination - SIMPLIFIED
    const countQuery = `
      SELECT COUNT(*) as total
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      ${whereClause}
    `

    console.log('Count Query:', countQuery)
    console.log('Count Params:', queryParams)

    const countResult = await executeQuery(countQuery, queryParams)
    const total = countResult[0]?.total || 0

    // Get status statistics - SIMPLIFIED without complex joins
    let stats = {
      total: 0,
      submitted: 0,
      under_verification: 0,
      verified: 0,
      approved: 0,
      rejected: 0,
      disbursed: 0
    }

    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
          SUM(CASE WHEN status = 'under_verification' THEN 1 ELSE 0 END) as under_verification,
          SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status = 'disbursed' THEN 1 ELSE 0 END) as disbursed
        FROM loan_applications
      `

      const statsResult = await executeQuery(statsQuery, [])
      stats = statsResult[0] || stats
    } catch (statsError) {
      console.error('Stats query error:', statsError)
      // Continue with default stats
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
        },
        stats
      }
    })

  } catch (error) {
    console.error('Admin applications error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch applications: ' + error.message },
      { status: 500 }
    )
  }
}
