import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET(request) {
  try {
    const {searchParams} = new URL(request.url)
    const status = searchParams.get("status") || '1';

    const documents = await executeQuery(
      'SELECT id, name, description, is_required FROM document_types where is_active = ? ORDER BY name ASC',
      [status]
    )

    return NextResponse.json({
      success: true,
      data: documents
    })

  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
      const body = await request.json()

      const {
        name,
        description,
        is_required
      } = body
      await executeQuery(
          'Insert Into document_types (name,description,is_required) VALUES (?,?,?)',
          [name, description, is_required]
      )

      return NextResponse.json({
          success: true,
          message: 'Document inserted successfully'
      })
  }
  catch (error) {
      console.error('Update document error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update bank' },
        { status: 500 }
      )
  }
}