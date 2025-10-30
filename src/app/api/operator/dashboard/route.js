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

    // Get document verification statistics
    const documentStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_documents,
        COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_documents,
        COUNT(CASE WHEN verification_status = 'rejected' THEN 1 END) as rejected_documents,
        COUNT(CASE WHEN verified_by = ? THEN 1 END) as my_verifications
      FROM customer_documents
    `, [userId])

    // Get application statistics
    const applicationStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_applications,
        COUNT(CASE WHEN status = 'under_verification' THEN 1 END) as under_verification,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_applications,
        COUNT(CASE WHEN status = 'sent_to_bankers' THEN 1 END) as sent_to_bankers
      FROM loan_applications
    `)

    // Get recent documents for verification
    const recentDocuments = await executeQuery(`
      SELECT 
        cd.id, cd.file_name, cd.uploaded_at, cd.verification_status,
        dt.name as document_type_name,
        la.application_number,
        c.first_name, c.last_name
      FROM customer_documents cd
      JOIN document_types dt ON cd.document_type_id = dt.id
      JOIN loan_applications la ON cd.loan_application_id = la.id
      JOIN customers c ON la.customer_id = c.id
      WHERE cd.verification_status = 'pending'
      ORDER BY cd.uploaded_at ASC
      LIMIT 10
    `)

    // Get verification activity (last 30 days)
    const dailyActivity = await executeQuery(`
      SELECT 
        DATE(verified_at) as date,
        COUNT(*) as verifications_count,
        COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN verification_status = 'rejected' THEN 1 END) as rejected_count
      FROM customer_documents
      WHERE verified_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
        AND verified_by = ?
      GROUP BY DATE(verified_at)
      ORDER BY date DESC
    `, [userId])

    return NextResponse.json({
      success: true,
      data: {
        documentStats: documentStats[0],
        applicationStats: applicationStats[0],
        recentDocuments,
        dailyActivity
      }
    })

  } catch (error) {
    console.error('Operator dashboard error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data: ' + error.message },
      { status: 500 }
    )
  }
}
