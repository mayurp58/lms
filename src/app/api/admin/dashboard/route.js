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

    // Get overall system statistics
    const systemStats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'connector') as total_connectors,
        (SELECT COUNT(*) FROM users WHERE role = 'operator') as total_operators,
        (SELECT COUNT(*) FROM users WHERE role = 'banker') as total_bankers,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM loan_applications) as total_applications,
        (SELECT COUNT(*) FROM loan_applications WHERE status = 'submitted') as submitted_applications,
        (SELECT COUNT(*) FROM loan_applications WHERE status = 'under_verification') as under_verification,
        (SELECT COUNT(*) FROM loan_applications WHERE status = 'verified') as verified_applications,
        (SELECT COUNT(*) FROM loan_applications WHERE status = 'approved') as approved_applications,
        (SELECT COUNT(*) FROM loan_applications WHERE status = 'rejected') as rejected_applications,
        (SELECT COUNT(*) FROM loan_applications WHERE status = 'disbursed') as disbursed_applications
    `)

    // Get financial statistics
    const financialStats = await executeQuery(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'approved' THEN approved_amount ELSE 0 END), 0) as total_approved_amount,
        COALESCE(SUM(CASE WHEN status = 'disbursed' THEN disbursed_amount ELSE 0 END), 0) as total_disbursed_amount,
        COALESCE(AVG(CASE WHEN status IN ('approved', 'disbursed') THEN approved_amount ELSE NULL END), 0) as average_loan_amount,
        COALESCE(SUM(requested_amount), 0) as total_requested_amount
      FROM loan_applications
    `)

    // Get commission statistics
    const commissionStats = await executeQuery(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'earned' THEN commission_amount ELSE 0 END), 0) as pending_commission,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END), 0) as paid_commission,
        COUNT(CASE WHEN status = 'earned' THEN 1 END) as pending_commission_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_commission_count
      FROM commission_records
    `)

    // Get document verification statistics
    const documentStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_documents,
        COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_documents,
        COUNT(CASE WHEN verification_status = 'rejected' THEN 1 END) as rejected_documents
      FROM customer_documents
    `)

    // Get recent activities
    const recentActivities = await executeQuery(`
      SELECT 
        sl.action, sl.entity_type, sl.entity_id, sl.created_at,
        up.first_name, up.last_name,
        u.role
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY sl.created_at DESC
      LIMIT 15
    `)

    // Get daily statistics for the last 30 days
    const dailyStats = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as applications_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approvals_count,
        COUNT(CASE WHEN status = 'disbursed' THEN 1 END) as disbursals_count,
        COALESCE(SUM(CASE WHEN status = 'disbursed' THEN disbursed_amount ELSE 0 END), 0) as disbursed_amount
      FROM loan_applications
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)

    // Get monthly performance statistics
    const monthlyStats = await executeQuery(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as applications_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approvals_count,
        COUNT(CASE WHEN status = 'disbursed' THEN 1 END) as disbursals_count,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN approved_amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN status = 'disbursed' THEN disbursed_amount ELSE 0 END), 0) as disbursed_amount
      FROM loan_applications
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `)

    // Get top performing connectors
    const topConnectors = await executeQuery(`
      SELECT 
        conn.agent_code,
        up.first_name, up.last_name,
        COUNT(la.id) as total_applications,
        COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as disbursed_count,
        COALESCE(SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END), 0) as total_disbursed,
        COALESCE(SUM(cr.commission_amount), 0) as total_commission
      FROM connectors conn
      JOIN users u ON conn.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN loan_applications la ON conn.id = la.connector_id
      LEFT JOIN commission_records cr ON conn.id = cr.connector_id AND cr.status = 'paid'
      GROUP BY conn.id, conn.agent_code, up.first_name, up.last_name
      HAVING total_applications > 0
      ORDER BY total_disbursed DESC, approved_count DESC
      LIMIT 10
    `)

    // Get loan category performance
    const categoryStats = await executeQuery(`
      SELECT 
        lc.name as category_name,
        COUNT(la.id) as applications_count,
        COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN la.status = 'disbursed' THEN 1 END) as disbursed_count,
        COALESCE(SUM(CASE WHEN la.status = 'disbursed' THEN la.disbursed_amount ELSE 0 END), 0) as total_disbursed,
        COALESCE(AVG(CASE WHEN la.status IN ('approved', 'disbursed') THEN la.approved_amount END), 0) as avg_loan_amount,
        ROUND((COUNT(CASE WHEN la.status = 'approved' THEN 1 END) * 100.0 / NULLIF(COUNT(la.id), 0)), 2) as approval_rate
      FROM loan_categories lc
      LEFT JOIN loan_applications la ON lc.id = la.loan_category_id
      GROUP BY lc.id, lc.name
      ORDER BY applications_count DESC
    `)

    // Get banker performance
    const bankerStats = await executeQuery(`
      SELECT 
        up.first_name, up.last_name,
        b.employee_id, b.designation,
        COUNT(la.id) as total_reviews,
        COUNT(CASE WHEN la.status = 'approved' THEN 1 END) as approvals,
        COUNT(CASE WHEN la.status = 'rejected' THEN 1 END) as rejections,
        COALESCE(SUM(CASE WHEN la.status = 'approved' THEN la.approved_amount ELSE 0 END), 0) as total_approved_amount,
        ROUND((COUNT(CASE WHEN la.status = 'approved' THEN 1 END) * 100.0 / NULLIF(COUNT(la.id), 0)), 2) as approval_rate
      FROM bankers b
      JOIN users u ON b.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN loan_applications la ON u.id = la.approved_by
      GROUP BY b.id, up.first_name, up.last_name, b.employee_id, b.designation
      HAVING total_reviews > 0
      ORDER BY total_approved_amount DESC
      LIMIT 10
    `)

    return NextResponse.json({
      success: true,
      data: {
        systemStats: systemStats[0],
        financialStats: financialStats[0],
        commissionStats: commissionStats[0],
        documentStats: documentStats[0],
        recentActivities,
        dailyStats,
        monthlyStats,
        topConnectors,
        categoryStats,
        bankerStats
      }
    })

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data: ' + error.message },
      { status: 500 }
    )
  }
}
