import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

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

    // Get banker info
    const bankerResult = await executeQuery(
      'SELECT max_approval_limit, employee_id, designation, department FROM bankers WHERE user_id = ?',
      [userId]
    )

    if (bankerResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Banker not found' },
        { status: 404 }
      )
    }

    const banker = bankerResult[0]

    // Get application statistics within banker's approval limit
    const applicationStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as pending_review,
        COUNT(CASE WHEN status = 'approved' AND approved_by = ? THEN 1 END) as my_approvals,
        COUNT(CASE WHEN status = 'rejected' AND approved_by = ? THEN 1 END) as my_rejections,
        COUNT(CASE WHEN status = 'disbursed' AND approved_by = ? THEN 1 END) as disbursed_loans,
        SUM(CASE WHEN status = 'approved' AND approved_by = ? THEN approved_amount ELSE 0 END) as total_approved_amount,
        AVG(CASE WHEN status = 'approved' AND approved_by = ? THEN approved_amount ELSE NULL END) as avg_approved_amount
      FROM loan_applications
      WHERE requested_amount <= ?
    `, [userId, userId, userId, userId, userId, banker.max_approval_limit])

    // Get recent applications for review (within approval limit)
    const recentApplications = await executeQuery(`
      SELECT 
        la.id, la.application_number, la.requested_amount, la.status, la.created_at,
        c.first_name, c.last_name, c.phone,
        lc.name as loan_category_name,
        (SELECT COUNT(*) FROM customer_documents cd WHERE cd.loan_application_id = la.id AND cd.verification_status = 'verified') as verified_documents
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      WHERE la.status = 'verified' AND la.requested_amount <= ?
      ORDER BY la.created_at ASC
      LIMIT 10
    `, [banker.max_approval_limit])

    // Get my recent approvals/rejections
    const recentDecisions = await executeQuery(`
      SELECT 
        la.id, la.application_number, la.requested_amount, la.approved_amount,
        la.status, la.approved_at, la.banker_remarks,
        c.first_name, c.last_name,
        lc.name as loan_category_name
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      JOIN loan_categories lc ON la.loan_category_id = lc.id
      WHERE la.approved_by = ? AND la.status IN ('approved', 'rejected')
      ORDER BY la.approved_at DESC
      LIMIT 10
    `, [userId])

    // Get daily approval statistics (last 30 days)
    const dailyStats = await executeQuery(`
      SELECT 
        DATE(approved_at) as date,
        COUNT(*) as total_decisions,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approvals,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejections,
        SUM(CASE WHEN status = 'approved' THEN approved_amount ELSE 0 END) as approved_amount
      FROM loan_applications
      WHERE approved_by = ? 
        AND approved_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      GROUP BY DATE(approved_at)
      ORDER BY date DESC
    `, [userId])

    return NextResponse.json({
      success: true,
      data: {
        banker,
        applicationStats: applicationStats[0],
        recentApplications,
        recentDecisions,
        dailyStats
      }
    })

  } catch (error) {
    console.error('Banker dashboard error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data: ' + error.message },
      { status: 500 }
    )
  }
}
