import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/mysql'

export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id')

    // Log logout activity
    if (userId) {
      await executeQuery(
        'INSERT INTO system_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
        [userId, 'USER_LOGOUT', request.headers.get('x-forwarded-for') || 'unknown']
      )
    }

    // Create response and clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    response.cookies.delete('auth-token')
    response.cookies.delete('refresh-token')

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
