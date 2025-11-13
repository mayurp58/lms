import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    // ✅ Access control
    if (!userId || userRole !== 'banker') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    const { documents } = await request.json()

    // ✅ Validate input
    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({ success: false, message: 'No documents specified' }, { status: 400 })
    }

    const documentList = documents.join(', ')

    // ✅ Update loan application table
    const updateQuery = `
      UPDATE loan_applications
      SET 
        banker_remarks = ?,
        status = 'document_requested',
        updated_at = NOW()
      WHERE id = ?
    `
    const result = await executeQuery(updateQuery, [documentList, id])

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 })
    }

    // ✅ Optionally, you could log this request or notify customer here

    return NextResponse.json({
      success: true,
      message: 'Documents requested successfully',
      requested_documents: documentList
    })
  } catch (error) {
    console.error('Error requesting documents:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to request documents: ' + error.message },
      { status: 500 }
    )
  }
}
