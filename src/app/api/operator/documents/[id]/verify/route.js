import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function PUT(request, { params }) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const { id } = await params

    if (!userId || userRole !== 'operator') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, remarks } = body

    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification status' },
        { status: 400 }
      )
    }

    // Get document details before update
    const documentResult = await executeQuery(
      `SELECT cd.*, la.application_number, la.status as app_status, c.first_name, c.last_name
       FROM customer_documents cd
       JOIN loan_applications la ON cd.loan_application_id = la.id
       JOIN customers c ON la.customer_id = c.id
       WHERE cd.id = ?`,
      [id]
    )

    if (documentResult.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      )
    }

    const document = documentResult[0]

    // Update document verification status
    await executeQuery(
      `UPDATE customer_documents 
       SET verification_status = ?, operator_remarks = ?, verified_at = NOW(), verified_by = ?
       WHERE id = ?`,
      [status, remarks || null, userId, id]
    )

    // Set application status to under_verification if it's still submitted
    if (document.app_status === 'submitted') {
      await executeQuery(
        `UPDATE loan_applications SET status = 'under_verification' WHERE id = ?`,
        [document.loan_application_id]
      )
    }

    // Trigger workflow if document is verified
    if (status === 'verified') {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/system/workflow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trigger: 'document_verified',
            entity_id: id,
            entity_type: 'document'
          })
        })
      } catch (workflowError) {
        console.error('⚠️ Workflow trigger failed:', workflowError)
        // Don't fail the main operation if workflow fails
      }
    }

    // Log activity
    await executeQuery(
      'INSERT INTO system_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        'DOCUMENT_VERIFIED',
        'document',
        id,
        JSON.stringify({ old_status: document.verification_status }),
        JSON.stringify({ new_status: status, remarks }),
        request.headers.get('x-forwarded-for') || 'unknown'
      ]
    )

    return NextResponse.json({
      success: true,
      message: `Document ${status} successfully`
    })

  } catch (error) {
    console.error('❌ Verify document error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update document: ' + error.message },
      { status: 500 }
    )
  }
}
