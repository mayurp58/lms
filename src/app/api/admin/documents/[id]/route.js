import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

// ✅ GET - Fetch a single document type by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const result = await executeQuery(
      'SELECT id, name, description, is_required FROM document_types WHERE id = ?',
      [id]
    )

    if (!result.length) {
      return NextResponse.json(
        { success: false, message: 'Document type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    })
  } catch (error) {
    console.error('Get document type error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch document type' },
      { status: 500 }
    )
  }
}

// ✅ PUT - Update document type
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, is_required } = body

    await executeQuery(
      'UPDATE document_types SET name = ?, description = ?, is_required = ? WHERE id = ?',
      [name, description, is_required ? 1 : 0, id]
    )

    return NextResponse.json({
      success: true,
      message: 'Document type updated successfully',
    })
  } catch (error) {
    console.error('Update document type error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update document type' },
      { status: 500 }
    )
  }
}

// ✅ POST - (Optional) Reactivate document type
export async function POST(request, { params }) {
  try {
    const { id } = await params

    await executeQuery(
      'UPDATE document_types SET is_active = ? WHERE id = ?',
      ['1', id]
    )

    return NextResponse.json({
      success: true,
      message: 'Document type reactivated successfully',
    })
  } catch (error) {
    console.error('Reactivate document type error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update document type' },
      { status: 500 }
    )
  }
}

// ✅ DELETE - Soft delete document type
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    await executeQuery(
      'UPDATE document_types SET is_active = ? WHERE id = ?',
      ['0', id]
    )

    // Log deletion
    await executeQuery(
      'INSERT INTO system_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [
        request.headers.get('x-user-id'),
        'DOCUMENT_TYPE_DELETED',
        'document_type',
        id,
        request.headers.get('x-forwarded-for') || 'unknown',
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Document type deleted successfully',
    })
  } catch (error) {
    console.error('Delete document type error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete document type' },
      { status: 500 }
    )
  }
}
