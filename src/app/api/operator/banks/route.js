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

    // Get all active banks
    const banksQuery = `
      SELECT id, name, code, contact_email, is_active
      FROM banks 
      WHERE is_active = TRUE
      ORDER BY name ASC
    `

    const banks = await executeQuery(banksQuery)

    return NextResponse.json({
      success: true,
      data: banks
    })

  } catch (error) {
    console.error('Get banks error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch banks: ' + error.message },
      { status: 500 }
    )
  }
}
