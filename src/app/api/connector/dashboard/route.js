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

    // Get connector ID
    const connectorResult = await executeQuery(
      'SELECT id, agent_code, total_cases_submitted, total_approved_cases, total_commission_earned, commission_percentage FROM connectors WHERE user_id = ?',
      [userId]
    )

    if (connectorResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Connector not found' },
        { status: 404 }
      )
    }

    const connector = connectorResult[0]
    const connectorId = connector.id

    // Get customer statistics
    const customerStats = await executeQuery(
      'SELECT COUNT(*) as total_customers FROM customers WHERE connector_id = ?',
      [connectorId]
    )

    // Get application statistics
    const applicationStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'under_verification' THEN 1 END) as under_verification,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
        COUNT(CASE WHEN status = 'sent_to_bankers' THEN 1 END) as sent_to_bankers,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'disbursed' THEN 1 END) as disbursed,
        SUM(requested_amount) as total_amount_requested,
        AVG(requested_amount) as average_amount_requested
      FROM loan_applications 
      WHERE connector_id = ?
    `, [connectorId])

    // Get recent applications
    const recentApplications = await executeQuery(`
      SELECT 
        la.id, la.application_number, la.requested_amount, la.status, la.created_at,
        c.first_name, c.last_name, c.phone,
        lc.name as loan_category_name
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      WHERE la.connector_id = ?
      ORDER BY la.created_at DESC
      LIMIT 5
    `, [connectorId])

    // Get recent customers
    const recentCustomers = await executeQuery(`
      SELECT 
        id, first_name, last_name, phone, city, state, created_at
      FROM customers 
      WHERE connector_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [connectorId])

    // Get document upload statistics
    const documentStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN cd.verification_status = 'pending' THEN 1 END) as pending_verification,
        COUNT(CASE WHEN cd.verification_status = 'verified' THEN 1 END) as verified_documents,
        COUNT(CASE WHEN cd.verification_status = 'rejected' THEN 1 END) as rejected_documents
      FROM customer_documents cd
      JOIN loan_applications la ON cd.loan_application_id = la.id
      WHERE la.connector_id = ?
    `, [connectorId])

    // Get monthly performance (last 6 months)
    const monthlyStats = await executeQuery(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as applications_count,
        SUM(requested_amount) as total_amount
      FROM loan_applications 
      WHERE connector_id = ? 
        AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `, [connectorId])

    return NextResponse.json({
      success: true,
      data: {
        connector: {
          ...connector,
          total_customers: customerStats[0].total_customers
        },
        statistics: {
          customers: customerStats[0],
          applications: applicationStats[0],
          documents: documentStats[0]
        },
        recentApplications,
        recentCustomers,
        monthlyStats
      }
    })

  } catch (error) {
    console.error('Dashboard data error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data: ' + error.message },
      { status: 500 }
    )
  }
}
