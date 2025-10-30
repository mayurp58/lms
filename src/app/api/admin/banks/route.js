import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET() {
  try {
    const banks = await executeQuery(
      'SELECT id, name, code FROM banks WHERE status = ? ORDER BY name ASC',
      ['active']
    )

    return NextResponse.json({
      success: true,
      data: banks
    })

  } catch (error) {
    console.error('Get banks error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch banks' },
      { status: 500 }
    )
  }
}
