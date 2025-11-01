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

    const { verification_status, rejection_reason } = await request.json()

    if (!verification_status) {
      return NextResponse.json(
        { success: false, message: 'Verification status is required' },
        { status: 400 }
      )
    }

    // Update document verification status
    const updateQuery = `
      UPDATE customer_documents 
      SET 
        verification_status = ?, 
        verified_by = ?,
        verified_at = NOW(),
        rejection_reason = ?
      WHERE id = ?
    `

    const result = await executeQuery(updateQuery, [
      verification_status, 
      userId,
      verification_status === 'rejected' ? rejection_reason : null,
      id
    ])

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
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
      verification_status,
      rejection_reason: rejection_reason || null,
      document_id: id
    })

    await executeQuery(logQuery, [
      userId,
      'DOCUMENT_VERIFIED',
      'customer_document',
      id,
      logData,
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    return NextResponse.json({
      success: true,
      message: 'Document verification updated successfully'
    })

  } catch (error) {
    console.error('Document verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update document verification: ' + error.message },
      { status: 500 }
    )
  }
}
