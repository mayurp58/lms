import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET() {
  try {
    const documentTypes = await executeQuery(
      'SELECT * FROM document_types ORDER BY is_required DESC, name ASC'
    )

    return NextResponse.json({
      success: true,
      data: documentTypes
    })

  } catch (error) {
    console.error('Get document types error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch document types' },
      { status: 500 }
    )
  }
}
