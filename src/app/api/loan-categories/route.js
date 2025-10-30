import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function GET() {
  try {
    const categories = await executeQuery(
      'SELECT * FROM loan_categories WHERE status = ? ORDER BY name ASC',
      ['active']
    )

    return NextResponse.json({
      success: true,
      data: categories
    })

  } catch (error) {
    console.error('Get loan categories error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch loan categories' },
      { status: 500 }
    )
  }
}
