import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'connector') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get connector ID from user
    const connectorQuery = 'SELECT id FROM connectors WHERE user_id = ?'
    const connectorResult = await executeQuery(connectorQuery, [userId])
    
    if (connectorResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Connector not found' },
        { status: 404 }
      )
    }

    const connectorId = connectorResult[0].id

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const status = searchParams.get('status')
    const period = searchParams.get('period') || '30days'

    // Build WHERE conditions
    let whereConditions = ['cr.connector_id = ?']
    let queryParams = [connectorId]

    if (status && status !== 'all') {
      whereConditions.push('cr.status = ?')
      queryParams.push(status)
    }

    // Add date filter
    if (period && period !== 'all') {
      const days = period === '7days' ? 7 : period === '30days' ? 30 : period === '90days' ? 90 : 365
      whereConditions.push('cr.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)')
      queryParams.push(days)
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ')

    // Get commissions with pagination
    const offset = (page - 1) * limit
    const commissionsQuery = `
      SELECT 
        cr.id,
        cr.commission_amount,
        cr.commission_percentage,
        cr.status,
        cr.created_at,
        cr.paid_at,
        cr.payment_reference,
        
        -- Application details
        la.application_number,
        la.approved_amount,
        la.disbursed_amount,
        
        -- Customer details
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone as customer_phone,
        
        -- Loan category
        lc.name as loan_category
        
      FROM commission_records cr
      JOIN loan_applications la ON cr.loan_application_id = la.id
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      ${whereClause}
      ORDER BY cr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const commissions = await executeQuery(commissionsQuery, queryParams)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM commission_records cr
      ${whereClause}
    `

    const countResult = await executeQuery(countQuery, queryParams)
    const total = countResult[0].total

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(la.id) as total_applications,
        COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as disbursed_count,
        COALESCE(SUM(CASE WHEN cr.status = 'earned' THEN cr.commission_amount ELSE 0 END), 0) as pending_commission,
        COALESCE(SUM(CASE WHEN cr.status = 'paid' THEN cr.commission_amount ELSE 0 END), 0) as paid_commission
      FROM loan_applications la
      LEFT JOIN commission_records cr ON la.id = cr.loan_application_id
      WHERE la.connector_id = ?
    `

    const statsResult = await executeQuery(statsQuery, [connectorId])
    const stats = statsResult[0]

    return NextResponse.json({
      success: true,
      data: {
        commissions,
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
    console.error('Connector commissions error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch commissions: ' + error.message },
      { status: 500 }
    )
  }
}
