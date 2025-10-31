import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'operator') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const { status, remarks } = await request.json()

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status transitions for operators
    const validStatuses = ['under_verification', 'verified', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status for operator' },
        { status: 400 }
      )
    }

    // Get current application status first
    const currentAppQuery = 'SELECT status FROM loan_applications WHERE id = ?'
    const currentAppResult = await executeQuery(currentAppQuery, [id])
    
    if (currentAppResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    const oldStatus = currentAppResult[0].status

    // Update application status
    const updateQuery = `
      UPDATE loan_applications 
      SET status = ?, updated_at = NOW() 
      WHERE id = ?
    `

    const result = await executeQuery(updateQuery, [status, id])

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to update application status' },
        { status: 500 }
      )
    }

    // Log the activity
    const logQuery = `
      INSERT INTO system_logs (
        user_id, action, entity_type, entity_id, 
        new_values, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `

    const logData = JSON.stringify({
      old_status: oldStatus,
      new_status: status,
      remarks: remarks || null,
      updated_by_role: userRole
    })

    await executeQuery(logQuery, [
      userId,
      'STATUS_UPDATE',
      'loan_application',
      id,
      logData,
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    return NextResponse.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        old_status: oldStatus,
        new_status: status,
        application_id: id
      }
    })

  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update status: ' + error.message },
      { status: 500 }
    )
  }
}

// Optional: Add GET method to fetch current status
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userId || userRole !== 'operator') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get current application status
    const statusQuery = `
      SELECT 
        la.id,
        la.application_number,
        la.status,
        la.updated_at,
        c.first_name,
        c.last_name
      FROM loan_applications la
      JOIN customers c ON la.customer_id = c.id
      WHERE la.id = ?
    `

    const result = await executeQuery(statusQuery, [id])
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result[0]
    })

  } catch (error) {
    console.error('Get status error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to get status: ' + error.message },
      { status: 500 }
    )
  }
}
