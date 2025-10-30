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

    // Get commission summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_commissions,
        SUM(CASE WHEN status = 'earned' THEN commission_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_amount,
        COUNT(CASE WHEN status = 'earned' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        AVG(commission_percentage) as avg_commission_rate
      FROM commission_records
    `

    const summary = await executeQuery(summaryQuery)

    // Get recent commission activities - FIXED: using up.phone instead of u.phone
    const recentQuery = `
      SELECT 
        cr.id,
        cr.commission_amount,
        cr.status,
        cr.created_at,
        cr.paid_at,
        la.application_number,
        up.first_name as connector_first_name,
        up.last_name as connector_last_name,
        conn.agent_code
      FROM commission_records cr
      JOIN connectors conn ON cr.connector_id = conn.id
      JOIN users u ON conn.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      JOIN loan_applications la ON cr.loan_application_id = la.id
      ORDER BY cr.created_at DESC
      LIMIT 20
    `

    const recent = await executeQuery(recentQuery)

    // Get monthly commission trends
    const trendsQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as commission_count,
        SUM(commission_amount) as total_amount,
        SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'earned' THEN commission_amount ELSE 0 END) as pending_amount
      FROM commission_records
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `

    const trends = await executeQuery(trendsQuery)

    return NextResponse.json({
      success: true,
      data: {
        summary: summary[0] || {},
        recent,
        trends
      }
    })

  } catch (error) {
    console.error('Commission overview error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch commission data: ' + error.message },
      { status: 500 }
    )
  }
}
