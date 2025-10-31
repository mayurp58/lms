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
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const sort = searchParams.get('sort') || 'created_desc'

    // Build WHERE conditions
    let whereConditions = []
    let queryParams = []

    if (search) {
      whereConditions.push(`(
        c.first_name LIKE ? OR 
        c.last_name LIKE ? OR 
        c.phone LIKE ? OR 
        c.email LIKE ? OR
        CONCAT(c.first_name, ' ', c.last_name) LIKE ?
      )`)
      const searchPattern = `%${search}%`
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

    // Build ORDER BY clause
    let orderBy = 'ORDER BY c.created_at DESC'
    switch (sort) {
      case 'created_asc':
        orderBy = 'ORDER BY c.created_at ASC'
        break
      case 'name_asc':
        orderBy = 'ORDER BY c.first_name ASC, c.last_name ASC'
        break
      case 'name_desc':
        orderBy = 'ORDER BY c.first_name DESC, c.last_name DESC'
        break
      case 'applications_desc':
        orderBy = 'ORDER BY total_applications DESC'
        break
    }

    // Get customers with application statistics
    const offset = (page - 1) * limit
    const customersQuery = `
      SELECT 
        c.id,
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
        c.created_at,
        c.updated_at,
        
        -- Application statistics
        COUNT(la.id) as total_applications,
        COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approved_applications,
        COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as disbursed_applications,
        SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END) as total_loan_amount,
        
        -- Active application check
        COUNT(CASE WHEN la.status IN ('submitted', 'under_verification', 'verified', 'approved') THEN 1 END) > 0 as has_active_application,
        
        -- Latest application details
        MAX(la.id) as latest_application_id,
        (SELECT application_number FROM loan_applications WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as latest_application_number,
        (SELECT status FROM loan_applications WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as latest_application_status,
        (SELECT requested_amount FROM loan_applications WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as latest_application_amount,
        (SELECT created_at FROM loan_applications WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as latest_application_date
        
      FROM customers c
      LEFT JOIN loan_applications la ON c.id = la.customer_id
      ${whereClause}
      GROUP BY c.id
      ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `

    const customers = await executeQuery(customersQuery, queryParams)

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM customers c
      LEFT JOIN loan_applications la ON c.id = la.customer_id
      ${whereClause}
    `

    const countResult = await executeQuery(countQuery, queryParams)
    const total = countResult[0]?.total || 0

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT CASE WHEN la.status IN ('submitted', 'under_verification', 'verified', 'approved') THEN c.id END) as active_applications,
        COUNT(DISTINCT CASE WHEN DATE(c.created_at) >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH) THEN c.id END) as new_this_month,
        COUNT(DISTINCT CASE WHEN la.status IN ('verified', 'approved', 'disbursed') THEN c.id END) as verified_customers
      FROM customers c
      LEFT JOIN loan_applications la ON c.id = la.customer_id
    `

    const statsResult = await executeQuery(statsQuery, [])
    const stats = statsResult[0] || {}

    // Convert boolean fields and format data
    const formattedCustomers = customers.map(customer => ({
      ...customer,
      has_active_application: Boolean(customer.has_active_application),
      is_verified: customer.total_applications > 0 && customer.approved_applications > 0,
      total_loan_amount: parseFloat(customer.total_loan_amount) || 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        customers: formattedCustomers,
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
    console.error('Operator customers error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customers: ' + error.message },
      { status: 500 }
    )
  }
}
