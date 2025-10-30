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
    const status = searchParams.get('status') || 'all' // all, earned, paid
    const connectorId = searchParams.get('connector_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Build WHERE conditions
    let whereConditions = []
    let queryParams = []

    if (status !== 'all') {
      whereConditions.push('cr.status = ?')
      queryParams.push(status)
    }

    if (connectorId) {
      whereConditions.push('conn.id = ?')
      queryParams.push(connectorId)
    }

    if (startDate && endDate) {
      whereConditions.push('DATE(cr.created_at) BETWEEN ? AND ?')
      queryParams.push(startDate, endDate)
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

    // FIXED: Get connector commission records with proper table aliases
    const commissionsQuery = `
      SELECT 
        cr.id,
        cr.loan_application_id,
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
        la.disbursed_at,
        
        -- Connector details - FIXED: using up.phone instead of u.phone
        conn.agent_code,
        up.first_name as connector_first_name,
        up.last_name as connector_last_name,
        up.phone as connector_phone,
        u.email as connector_email,
        
        -- Customer details
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone as customer_phone
        
      FROM commission_records cr
      JOIN connectors conn ON cr.connector_id = conn.id
      JOIN users u ON conn.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      JOIN loan_applications la ON cr.loan_application_id = la.id
      JOIN customers c ON la.customer_id = c.id
      ${whereClause}
      ORDER BY cr.created_at DESC
      LIMIT 1000
    `

    const commissions = await executeQuery(commissionsQuery, queryParams)

    // Get summary statistics - FIXED: using up.phone instead of u.phone
    const summaryQuery = `
      SELECT 
        conn.agent_code,
        up.first_name,
        up.last_name,
        up.phone,
        u.email,
        COUNT(cr.id) as total_commissions,
        SUM(CASE WHEN cr.status = 'earned' THEN cr.commission_amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN cr.status = 'paid' THEN cr.commission_amount ELSE 0 END) as total_paid,
        SUM(cr.commission_amount) as total_commission_amount,
        COUNT(CASE WHEN cr.status = 'earned' THEN 1 END) as pending_count,
        COUNT(CASE WHEN cr.status = 'paid' THEN 1 END) as paid_count
      FROM connectors conn
      JOIN users u ON conn.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN commission_records cr ON conn.id = cr.connector_id
      ${whereClause.replace('cr.', 'cr.')}
      GROUP BY conn.id, conn.agent_code, up.first_name, up.last_name, up.phone, u.email
      HAVING total_commissions > 0
      ORDER BY total_commission_amount DESC
    `

    const summary = await executeQuery(summaryQuery, queryParams)

    // Get overall totals
    const totalsQuery = `
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN cr.status = 'earned' THEN cr.commission_amount ELSE 0 END) as total_pending_amount,
        SUM(CASE WHEN cr.status = 'paid' THEN cr.commission_amount ELSE 0 END) as total_paid_amount,
        SUM(cr.commission_amount) as grand_total,
        COUNT(CASE WHEN cr.status = 'earned' THEN 1 END) as total_pending_count,
        COUNT(CASE WHEN cr.status = 'paid' THEN 1 END) as total_paid_count
      FROM commission_records cr
      ${whereClause}
    `

    const totalsResult = await executeQuery(totalsQuery, queryParams)
    const totals = totalsResult[0] || {}

    return NextResponse.json({
      success: true,
      data: {
        commissions,
        summary,
        totals: {
          total_records: totals.total_records || 0,
          total_pending_amount: totals.total_pending_amount || 0,
          total_paid_amount: totals.total_paid_amount || 0,
          grand_total: totals.grand_total || 0,
          total_pending_count: totals.total_pending_count || 0,
          total_paid_count: totals.total_paid_count || 0
        }
      }
    })

  } catch (error) {
    console.error('Connector commissions error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch connector commissions: ' + error.message },
      { status: 500 }
    )
  }
}
